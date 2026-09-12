import { test as setup, expect } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

/**
 * Setup d'authentification global — s'exécute avant la suite E2E (projet "setup").
 *
 * Se connecte à /api/auth/login avec le compte agent (créé par
 * `bun scripts/seed-user.ts`) et persiste le cookie de session httpOnly
 * dans un fichier storageState réutilisé par tous les tests.
 *
 * Identifiants personnalisables via les variables d'environnement :
 *   E2E_NOM_UTILISATEUR (défaut : agent)
 *   E2E_MOT_DE_PASSE    (défaut : Agence@2026 — le compte par défaut du seed)
 */
const AUTH_FILE = resolve(__dirname, '.auth', 'agent.json')
const NOM_UTILISATEUR = process.env.E2E_NOM_UTILISATEUR ?? 'agent'
const MOT_DE_PASSE = process.env.E2E_MOT_DE_PASSE ?? 'Agence@2026'

setup('authentifie l\u2019agent avant la suite E2E', async ({ request }) => {
  mkdirSync(dirname(AUTH_FILE), { recursive: true })

  const response = await request.post('/api/auth/login', {
    data: { nomUtilisateur: NOM_UTILISATEUR, motDePasse: MOT_DE_PASSE },
  })
  expect(response.status()).toBe(200)

  const body = await response.json()
  expect(body.ok).toBe(true)

  // La réponse de login pose le cookie httpOnly via Set-Cookie : on le persiste
  await request.storageState({ path: AUTH_FILE })
})
