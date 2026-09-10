import { describe, it, expect } from 'vitest'
import { D } from '@/lib/money'
import { CreateFactureSchema, CreateVersementSchema } from '@/lib/validation/factureSchemas'

describe('Facturation & Versements Engine', () => {
  describe('Calculs stricts de versements et soldes avec Decimal.js', () => {
    it('calcule correctement les soldes et statuts successifs', () => {
      const montantTotal = D('450000.00')

      // 1. Initial : aucun versement
      let totalPaye = D(0)
      let reste = montantTotal.minus(totalPaye)
      let statut = totalPaye.gte(montantTotal) ? 'payee' : totalPaye.gt(0) ? 'partiellement_payee' : 'non_payee'
      
      expect(totalPaye.toFixed(2)).toBe('0.00')
      expect(reste.toFixed(2)).toBe('450000.00')
      expect(statut).toBe('non_payee')

      // 2. Premier versement partiel (ex: acompte 150 000 DZD)
      const versement1 = D('150000.00')
      totalPaye = totalPaye.plus(versement1)
      reste = montantTotal.minus(totalPaye)
      statut = totalPaye.gte(montantTotal) ? 'payee' : totalPaye.gt(0) ? 'partiellement_payee' : 'non_payee'

      expect(totalPaye.toFixed(2)).toBe('150000.00')
      expect(reste.toFixed(2)).toBe('300000.00')
      expect(statut).toBe('partiellement_payee')

      // 3. Deuxième versement partiel (ex: 200 000 DZD)
      const versement2 = D('200000.00')
      totalPaye = totalPaye.plus(versement2)
      reste = montantTotal.minus(totalPaye)
      statut = totalPaye.gte(montantTotal) ? 'payee' : totalPaye.gt(0) ? 'partiellement_payee' : 'non_payee'

      expect(totalPaye.toFixed(2)).toBe('350000.00')
      expect(reste.toFixed(2)).toBe('100000.00')
      expect(statut).toBe('partiellement_payee')

      // 4. Troisième versement soldant la facture (ex: 100 000 DZD)
      const versement3 = D('100000.00')
      totalPaye = totalPaye.plus(versement3)
      reste = montantTotal.minus(totalPaye)
      const resteFinal = reste.isNegative() ? D(0) : reste
      statut = totalPaye.gte(montantTotal) ? 'payee' : totalPaye.gt(0) ? 'partiellement_payee' : 'non_payee'

      expect(totalPaye.toFixed(2)).toBe('450000.00')
      expect(resteFinal.toFixed(2)).toBe('0.00')
      expect(statut).toBe('payee')
    })

    it('gère correctement les montants à virgule sans dérive flottante', () => {
      const montantTotal = D('123456.78')
      const versement1 = D('12345.67')
      const versement2 = D('111111.11')

      const totalPaye = versement1.plus(versement2)
      const reste = montantTotal.minus(totalPaye)

      expect(totalPaye.toFixed(2)).toBe('123456.78')
      expect(reste.toFixed(2)).toBe('0.00')
      expect(reste.isZero()).toBe(true)
    })
  })

  describe('Validation des schémas Facturation Zod', () => {
    it('valide une création de facture correcte', () => {
      const valid = CreateFactureSchema.safeParse({
        devisId: 'clxxxxxxxxxxxxxxx',
        dateEcheance: '2026-10-15',
        notes: 'Facture acompte 30%',
      })
      expect(valid.success).toBe(true)
    })

    it('rejette une création de facture sans devisId', () => {
      const invalid = CreateFactureSchema.safeParse({
        devisId: '',
      })
      expect(invalid.success).toBe(false)
    })

    it('valide un versement valide', () => {
      const valid = CreateVersementSchema.safeParse({
        montantDzd: '50000.00',
        modePaiement: 'virement',
        reference: 'VIR-2026-0819',
        recuPar: 'Agent Ahmed',
      })
      expect(valid.success).toBe(true)
    })

    it('rejette un versement négatif ou nul', () => {
      const zero = CreateVersementSchema.safeParse({
        montantDzd: '0',
        modePaiement: 'especes',
      })
      expect(zero.success).toBe(false)

      const negatif = CreateVersementSchema.safeParse({
        montantDzd: '-500',
        modePaiement: 'especes',
      })
      expect(negatif.success).toBe(false)
    })
  })
})
