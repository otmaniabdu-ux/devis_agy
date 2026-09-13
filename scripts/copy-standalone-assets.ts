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

console.log('Assets standalone copiés : .next/static → .next/standalone/.next/static, public → .next/standalone/public')
