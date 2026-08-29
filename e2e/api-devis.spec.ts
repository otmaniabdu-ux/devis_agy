import { test, expect } from '@playwright/test'

test.describe('API Devis & Sécurité (Phase 5 & 6)', () => {
  // Test 401 sur requêtes API n'est pas applicable en mode desktop-only,
  // mais on teste la robustesse (400 Bad Request) sur données invalides.

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
