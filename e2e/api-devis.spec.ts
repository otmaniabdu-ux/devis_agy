import { test, expect } from '@playwright/test'

test.describe('API Devis & Sécurité (Phase 5 & 6)', () => {
  // Contexte non authentifié (sans storageState) pour vérifier la garde 401
  test.describe('sans session', () => {
    test.use({ storageState: { cookies: [], origins: [] } })

    test('GET /api/devis sans session renvoie 401 (même avec Host falsifié)', async ({ request }) => {
      const response = await request.get('/api/devis', {
        headers: { Host: 'localhost' },
      })
      expect(response.status()).toBe(401)
      const body = await response.json()
      expect(body.error).toBe('Authentification requise.')
    })

    test('POST /api/devis sans session renvoie 401', async ({ request }) => {
      const response = await request.post('/api/devis', { data: { invalid: true } })
      expect(response.status()).toBe(401)
    })
  })

  test('GET /api/health est public et répond sans session', async ({ request }) => {
    const response = await request.get('/api/health')
    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(body.status).toBe('ok')
  })

  // Les tests ci-dessous utilisent la session agent (storageState du projet "setup")
  test('POST /api/devis refuse un payload invalide (Zod validation)', async ({ request }) => {
    const response = await request.post('/api/devis', {
      data: {
        // payload volontairement invalide : manque des dates et champs obligatoires
        invalid: true
      }
    })

    expect(response.status()).toBe(400)
    const body = await response.json()
    expect(body.error).toBe('Données invalides')
    expect(body.details).toBeDefined()
  })

  test('GET /api/devis projette bien les données (masquage passeports)', async ({ request }) => {
    const response = await request.get('/api/devis')
    expect(response.status()).toBe(200)
    
    const devis = await response.json()
    expect(Array.isArray(devis)).toBeTruthy()
    
    if (devis.length > 0) {
      const premierDevis = devis[0]
      if (premierDevis.passagers && premierDevis.passagers.length > 0) {
        const p = premierDevis.passagers[0]
        // passeportNumero ne doit PAS exister dans la réponse
        expect(p.passeportNumero).toBeUndefined()
      }
    }
  })
})
