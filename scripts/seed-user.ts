/**
 * Crée (ou réinitialise) le compte unique "agent d'agence".
 *
 * Usage :
 *   bun scripts/seed-user.ts                          -> agent / Agence@2026 (défaut)
 *   NOM_UTILISATEUR=agent MOT_DE_PASSE=xxx bun scripts/seed-user.ts
 */
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// Charger .env manuellement si présent (DATABASE_URL)
try {
  const envFile = readFileSync(resolve(process.cwd(), '.env'), 'utf8')
  for (const line of envFile.split('\n')) {
    const m = line.match(/^\s*([\w.]+)\s*=\s*(.*)?\s*$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2]?.replace(/^["']|["']$/g, '')
  }
} catch {
  // pas de .env — on continue avec l'environnement courant
}

const NOM_UTILISATEUR = process.env.NOM_UTILISATEUR ?? 'agent'
const MOT_DE_PASSE = process.env.MOT_DE_PASSE ?? 'Agence@2026'

const db = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash(MOT_DE_PASSE, 12)
  const utilisateur = await db.utilisateur.upsert({
    where: { nomUtilisateur: NOM_UTILISATEUR },
    update: { passwordHash },
    create: { nomUtilisateur: NOM_UTILISATEUR, passwordHash },
  })
  // Purge des sessions existantes après (ré)initialisation du mot de passe
  await db.session.deleteMany({ where: { utilisateurId: utilisateur.id } })
  console.log(`Compte agent prêt : "${NOM_UTILISATEUR}" (mot de passe ${process.env.MOT_DE_PASSE ? 'issu de MOT_DE_PASSE' : 'par défaut : Agence@2026 — à changer rapidement'}).`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
