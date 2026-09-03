// Moteur optimisé de rendu PDF avec protection contre la saturation des ressources.
// - Concurrency Semaphore : limite le nombre de rendus @react-pdf/renderer simultanés (max 2).
// - In-Flight Request Deduplication : mutualise les requêtes simultanées identiques.
// - LRU In-Memory Cache : met en cache les buffers générés avec TTL et invalidation par timestamp.

import { renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import { DevisDocument, type DevisForPdf } from '@/lib/pdfDocument'

interface CacheEntry {
  buffer: Buffer
  timestamp: number
}

// Capacité maximale du cache pour maîtriser l'empreinte mémoire
const MAX_CACHE_ENTRIES = 30
const CACHE_TTL_MS = 10 * 60 * 1000 // 10 minutes

const pdfCache = new Map<string, CacheEntry>()
const inFlightRequests = new Map<string, Promise<Buffer>>()

// Sémaphore de concurrence (maximum 2 compilations PDF simultanées pour protéger le CPU et la RAM)
const MAX_CONCURRENT_RENDERS = 2
let activeRenders = 0
const renderQueue: Array<() => void> = []

function acquireRenderSlot(): Promise<void> {
  if (activeRenders < MAX_CONCURRENT_RENDERS) {
    activeRenders++
    return Promise.resolve()
  }
  return new Promise<void>((resolve) => {
    renderQueue.push(() => {
      activeRenders++
      resolve()
    })
  })
}

function releaseRenderSlot(): void {
  activeRenders--
  if (renderQueue.length > 0) {
    const next = renderQueue.shift()
    if (next) next()
  }
}

/**
 * Nettoie les entrées expirées ou trop anciennes du cache
 */
function pruneCache(): void {
  const now = Date.now()
  for (const [k, v] of pdfCache.entries()) {
    if (now - v.timestamp > CACHE_TTL_MS) {
      pdfCache.delete(k)
    }
  }
  if (pdfCache.size >= MAX_CACHE_ENTRIES) {
    const firstKey = pdfCache.keys().next().value
    if (firstKey) pdfCache.delete(firstKey)
  }
}

/**
 * Invalide manuellement le cache d'un devis
 */
export function invalidatePdfCache(devisId: string): void {
  for (const key of pdfCache.keys()) {
    if (key.startsWith(`${devisId}:`)) {
      pdfCache.delete(key)
    }
  }
}

/**
 * Génère le buffer PDF de façon hautement optimisée et sécurisée contre le DoS CPU/RAM
 */
export async function generateOptimizedPdf(
  devisForPdf: DevisForPdf,
  variante: 'client' | 'interne' | 'programme',
  cacheKey: string
): Promise<Buffer> {
  // 1. Vérification du cache mémoire rapide (0ms / 0 CPU)
  const cached = pdfCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.buffer
  }

  // 2. Déduplication des requêtes en vol (in-flight coalescing)
  const existingPromise = inFlightRequests.get(cacheKey)
  if (existingPromise) {
    return existingPromise
  }

  // 3. File d'attente contrôlée par sémaphore
  const renderPromise = (async () => {
    await acquireRenderSlot()
    try {
      const element = createElement(DevisDocument, { devis: devisForPdf, variante })
      const buffer = await renderToBuffer(element as Parameters<typeof renderToBuffer>[0])
      const nodeBuffer = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer)

      pruneCache()
      pdfCache.set(cacheKey, {
        buffer: nodeBuffer,
        timestamp: Date.now(),
      })

      return nodeBuffer
    } finally {
      releaseRenderSlot()
      inFlightRequests.delete(cacheKey)
    }
  })()

  inFlightRequests.set(cacheKey, renderPromise)
  return renderPromise
}
