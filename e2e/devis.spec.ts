import { test, expect } from '@playwright/test'

test.describe('Devis E2E (Phase 6)', () => {
  // Session agent authentifiée via storageState (projet "setup" de playwright.config.ts)
  test('Navigation authentifiée : dashboard puis assistant de création de devis', async ({ page }) => {
    // La session est valide : /api/auth/me renvoie 200 et le dashboard s'affiche
    await page.goto('/')

    await expect(page.locator('h1').filter({ hasText: 'El Mouhssinoune Tours' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Tableau de bord' })).toBeVisible()

    // Ouvrir l'assistant de création de devis depuis la sidebar
    await page.click('nav >> text=Nouveau devis')

    // Le wizard s'affiche sur l'étape Passagers avec les 8 étapes annoncées
    await expect(page.getByRole('heading', { name: 'Nouveau devis' })).toBeVisible()
    for (const label of ['Passagers', 'Vols', 'Hébergement', 'Transferts', 'Hadj VIP', 'Prestations VIP', 'Financier', 'Récapitulatif']) {
      await expect(page.locator('text=' + label).first()).toBeVisible()
    }

    // Sélecteur de client requis à l'étape 1 (un client de démo est pré-sélectionné)
    await expect(page.getByRole('combobox').first()).toBeVisible()
  })
})
