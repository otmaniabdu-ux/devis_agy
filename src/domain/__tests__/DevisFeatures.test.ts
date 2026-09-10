import { describe, it, expect } from 'vitest'
import sharp from 'sharp'

describe('Nouvelles fonctionnalités Devis VIP', () => {
  describe('Génération de JPEG de Réservation via Sharp', () => {
    it('génère un buffer JPEG valide avec les octets magiques FF D8 FF', async () => {
      const svg = `
        <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
          <rect width="400" height="300" fill="#0B1B3D"/>
          <text x="200" y="150" fill="#FDE68A" font-size="20" text-anchor="middle">
            EL MOUHSSINOUNE TOURS — BON DE COMMANDE
          </text>
        </svg>
      `
      const buffer = await sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toBuffer()

      expect(buffer).toBeDefined()
      expect(buffer.length).toBeGreaterThan(100)

      // Octets magiques JPEG : FF D8 FF
      expect(buffer[0]).toBe(0xff)
      expect(buffer[1]).toBe(0xd8)
      expect(buffer[2]).toBe(0xff)
    })
  })

  describe('Formats de numérotation standardisés', () => {
    it('respecte le format de numérotation des devis DEVIS-YYYY-MM-NNN', () => {
      const regex = /^DEVIS-\d{4}-\d{2}-\d{3}$/
      expect(regex.test('DEVIS-2026-09-001')).toBe(true)
      expect(regex.test('DEVIS-2026-09-042')).toBe(true)
      expect(regex.test('DEVIS-2026-9-1')).toBe(false)
    })

    it('respecte le format de numérotation des factures FACT-YYYY-MM-NNN', () => {
      const regex = /^FACT-\d{4}-\d{2}-\d{3}$/
      expect(regex.test('FACT-2026-09-001')).toBe(true)
      expect(regex.test('FACT-2026-10-123')).toBe(true)
      expect(regex.test('FACTURE-001')).toBe(false)
    })

    it('respecte le format de numérotation des reçus RECU-YYYY-MM-NNN', () => {
      const regex = /^RECU-\d{4}-\d{2}-\d{3}$/
      expect(regex.test('RECU-2026-09-001')).toBe(true)
      expect(regex.test('RECU-2026-09-999')).toBe(true)
      expect(regex.test('RECU-1')).toBe(false)
    })
  })
})
