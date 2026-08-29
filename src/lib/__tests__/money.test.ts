import { describe, it, expect } from 'vitest'
import {
  D,
  DZD,
  SAR,
  USD,
  EUR,
  convertirEnDzd,
  round2,
  formatMoney,
  formatMontant,
  somme,
  calculerPrixVente,
} from '@/lib/money'
import Decimal from 'decimal.js'

describe('Utilitaires Financiers (money.ts)', () => {
  describe('D() - Conversion en Decimal', () => {
    it('gère les valeurs nulles ou non définies', () => {
      expect(D(null).toString()).toBe('0')
      expect(D(undefined).toString()).toBe('0')
      expect(D('').toString()).toBe('0')
    })

    it('gère les nombres, strings et objets Decimal', () => {
      expect(D(42).toString()).toBe('42')
      expect(D('123.45').toString()).toBe('123.45')
      expect(D(new Decimal('123.45')).toString()).toBe('123.45')
    })
  })

  describe('convertirEnDzd()', () => {
    const tauxMock = { SAR: '35.5', USD: '240.0', EUR: '260.0' }

    it('ne convertit pas si la devise est déjà en DZD', () => {
      expect(convertirEnDzd('1000', DZD, tauxMock).toString()).toBe('1000')
    })

    it('convertit correctement depuis le SAR', () => {
      // 100 SAR * 35.5 = 3550 DZD
      expect(convertirEnDzd('100', SAR, tauxMock).toString()).toBe('3550')
    })

    it('convertit correctement depuis l\'USD et l\'EUR', () => {
      expect(convertirEnDzd('10', USD, tauxMock).toString()).toBe('2400')
      expect(convertirEnDzd('10', EUR, tauxMock).toString()).toBe('2600')
    })

    it('lève une erreur si le taux est manquant', () => {
      expect(() => convertirEnDzd('100', SAR, { USD: '240' })).toThrowError(/Taux de change manquant/i)
    })
  })

  describe('Arrondis et formatages', () => {
    it('round2() arrondit correctement avec HALF_UP', () => {
      expect(round2('10.444')).toBe('10.44')
      expect(round2('10.445')).toBe('10.45') // Half up
      expect(round2('10.446')).toBe('10.45')
    })

    it('formatMontant() formatte avec les séparateurs de milliers (espace)', () => {
      expect(formatMontant('1234567.89')).toBe('1\u202F234\u202F567,89')
      expect(formatMontant('0')).toBe('0,00')
    })

    it('formatMoney() inclut la devise spécifiée', () => {
      expect(formatMoney('1234.5', SAR)).toBe('1\u202F234,50 SAR')
      expect(formatMoney('1234.5')).toBe('1\u202F234,50 DZD') // Default is DZD
    })
  })

  describe('somme()', () => {
    it('calcule la somme exacte de plusieurs montants strings', () => {
      const result = somme(['100.5', '200.75', '300.25'])
      expect(result.toString()).toBe('601.5')
    })

    it('retourne 0 pour un tableau vide', () => {
      expect(somme([]).toString()).toBe('0')
    })
  })

  describe('calculerPrixVente()', () => {
    it('calcule avec marge en montant fixe', () => {
      const res = calculerPrixVente('1000', 'montant_fixe', '200')
      expect(res.prixVente.toString()).toBe('1200')
      expect(res.margeMontant.toString()).toBe('200')
    })

    it('calcule avec marge en pourcentage', () => {
      // 1000 + 15% = 1150 (marge = 150)
      const res = calculerPrixVente('1000', 'pourcentage', '15')
      expect(res.prixVente.toString()).toBe('1150')
      expect(res.margeMontant.toString()).toBe('150')
    })
    
    it('gère les décimales complexes dans la marge', () => {
      // 1000.50 + 10% = 1100.55
      const res = calculerPrixVente('1000.50', 'pourcentage', '10')
      expect(round2(res.prixVente)).toBe('1100.55')
    })
  })
})
