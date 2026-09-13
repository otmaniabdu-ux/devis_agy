/**
 * Copie les assets statiques dans le build standalone Next.js.
 *
 * `output: 'standalone'` produit un serveur autonome (.next/standalone/server.js)
 * qui ne sert PAS automatiquement les fichiers de .next/static ni de public/.
 * Sans cette copie, les bundles JS/CSS et le logo renvoient 404 et l'app reste
 * bloquée sur « Initialisation de l'application… » (aucune hydratation React).
 *
 * `bun run build` exécute automatiquement ce script après `next build`.
 */
import { cpSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const root = join(import.meta.dir, '..')
const staticSrc = join(root, '.next/static')
const staticDest = join(root, '.next/standalone/.next/static')
const publicSrc = join(root, 'public')
const publicDest = join(root, '.next/standalone/public')

if (!existsSync(staticSrc)) {
  console.error('Erreur : .next/static introuvable — lance `bun run build` avant ce script.')
  process.exit(1)
}

mkdirSync(staticDest, { recursive: true })
cpSync(staticSrc, staticDest, { recursive: true })
mkdirSync(publicDest, { recursive: true })
cpSync(publicSrc, publicDest, { recursive: true })

// Paquets natifs sharp : le traçage Turbopack copie le binaire .node mais omet
// les DLL dépendantes (libvips-*.dll) → ERR_DLOPEN_FAILED au runtime standalone.
const imgSrc = join(root, 'node_modules/@img')
const imgDest = join(root, '.next/standalone/node_modules/@img')
if (existsSync(imgSrc)) {
  mkdirSync(imgDest, { recursive: true })
  cpSync(imgSrc, imgDest, { recursive: true, force: true })
}

console.log('Assets standalone copiés : .next/static, public/ et node_modules/@img (DLL sharp/libvips)')