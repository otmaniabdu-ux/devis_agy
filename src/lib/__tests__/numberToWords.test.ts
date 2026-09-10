import { describe, it, expect } from 'vitest'
import { numberToWords, montantEnLettresDzd } from '@/lib/numberToWords'

describe('Conversion des montants en lettres (numberToWords.ts)', () => {
  it('convertit les petits nombres correctement', () => {
    expect(numberToWords(0)).toBe('zéro')
    expect(numberToWords(1)).toBe('un')
    expect(numberToWords(10)).toBe('dix')
    expect(numberToWords(16)).toBe('seize')
    expect(numberToWords(21)).toBe('vingt et un')
    expect(numberToWords(71)).toBe('soixante et onze')
    expect(numberToWords(80)).toBe('quatre-vingts')
    expect(numberToWords(81)).toBe('quatre-vingt-un')
    expect(numberToWords(91)).toBe('quatre-vingt-onze')
  })

  it('convertit les centaines et les milliers', () => {
    expect(numberToWords(100)).toBe('cent')
    expect(numberToWords(200)).toBe('deux cents')
    expect(numberToWords(205)).toBe('deux cent cinq')
    expect(numberToWords(1000)).toBe('mille')
    expect(numberToWords(2000)).toBe('deux mille')
    expect(numberToWords(150000)).toBe('cent cinquante mille')
  })

  it('convertit les millions et milliards', () => {
    expect(numberToWords(1000000)).toBe('un million')
    expect(numberToWords(2000000)).toBe('deux millions')
    expect(numberToWords(1250000)).toBe('un million deux cent cinquante mille')
  })

  it('formate correctement le montant en Dinars Algériens (montantEnLettresDzd)', () => {
    expect(montantEnLettresDzd(0)).toBe('Zéro dinar algérien')
    expect(montantEnLettresDzd(1)).toBe('Un dinar algérien')
    expect(montantEnLettresDzd(150000)).toBe('Cent cinquante mille dinars algériens')
    expect(montantEnLettresDzd(450000)).toBe('Quatre cent cinquante mille dinars algériens')
    expect(montantEnLettresDzd('1250000')).toBe('Un million deux cent cinquante mille dinars algériens')
    expect(montantEnLettresDzd('1500.50')).toBe('Mille cinq cents dinars algériens et cinquante centimes')
  })
})
