// Helpers client-side pour formater et appeler les API
import { formatMontant, formatMoney, D } from '@/lib/money'

export function fmt(amount: string | number | null | undefined, devise?: string): string {
  if (amount === null || amount === undefined || amount === '') return '—'
  const s = String(amount)
  if (devise) return formatMoney(s, devise)
  return formatMontant(s)
}

export function fmtDate(d: string | Date | null | undefined): string {
  if (!d) return '—'
  const date = typeof d === 'string' ? new Date(d) : d
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function fmtDateInput(d: string | Date | null | undefined): string {
  if (!d) return ''
  const date = typeof d === 'string' ? new Date(d) : d
  return date.toISOString().slice(0, 10)
}

export async function api<T = any>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const r = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  if (!r.ok) {
    const err = await r.json().catch(() => ({ error: r.statusText }))
    throw new Error(err.error ?? 'Erreur API')
  }
  return r.json()
}

export async function downloadPdf(devisId: string, variante: 'client' | 'interne' | 'programme', devisNumero?: string): Promise<void> {
  const url = `/api/pdf/${devisId}?variante=${variante}`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Erreur lors du téléchargement du PDF')
  }
  const blob = await response.blob()
  const blobUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = blobUrl
  const filename = devisNumero
    ? `Devis_${devisNumero}_${variante}.pdf`
    : `devis-${devisId}-${variante}.pdf`
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(blobUrl)
}

export { D }

