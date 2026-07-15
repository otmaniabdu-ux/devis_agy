// Utilitaires financiers — Decimal strict, JAMAIS de number JS pour un calcul qui compte.
// Conforme à PROMPT_AGENT_OmraVIP.md section 2 & 6.

import Decimal from 'decimal.js'

// Configuration : arrondi ROUND_HALF_UP (MidpointAwayFromZero)
Decimal.set({
  precision: 28,
  rounding: Decimal.ROUND_HALF_UP,
})

export type Money = string  // toujours string pour préserver la précision

export const DZD = 'DZD'
export const SAR = 'SAR'
export const USD = 'USD'
export const EUR = 'EUR'

export const SUPPORTED_DEVISES = [DZD, SAR, USD, EUR] as const
export type DeviseCode = typeof SUPPORTED_DEVISES[number]

/** Convertit en Decimal de façon sûre. */
export function D(value: Money | Decimal | number | null | undefined): Decimal {
  if (value === null || value === undefined || value === '') return new Decimal(0)
  if (value instanceof Decimal) return value
  // string ou number — mais on n'accepte number que pour les entiers petits (compteurs)
  return new Decimal(typeof value === 'string' ? value : String(value))
}

/** Convertit un montant depuis sa devise source vers DZD en utilisant un taux verrouillé. */
export function convertirEnDzd(montant: Money, deviseSource: string, taux: { SAR?: string; USD?: string; EUR?: string }): Decimal {
  const m = D(montant)
  if (deviseSource === DZD) return m
  const tauxMap: Record<string, string | undefined> = {
    [SAR]: taux.SAR,
    [USD]: taux.USD,
    [EUR]: taux.EUR,
  }
  const t = tauxMap[deviseSource]
  if (!t) throw new Error(`Taux de change manquant pour la devise ${deviseSource}`)
  return m.mul(D(t))
}

/** Arrondit à 2 décimales et renvoie une string (format canonical). */
export function round2(value: Decimal | Money): Money {
  return D(value).toDecimalPlaces(2).toString()
}

/** Format d'affichage : "1 254 350,00 DZD" */
export function formatMoney(value: Money, devise = DZD): string {
  const d = D(value)
  const fixed = d.toDecimalPlaces(2).toFixed(2)
  // séparateur de milliers : espace fin, virgule décimale
  const [intPart, decPart] = fixed.split('.')
  const intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '\u202F')
  return `${intFormatted},${decPart} ${devise}`
}

/** Format d'affichage compact : "1 254 350,00" sans devise. */
export function formatMontant(value: Money): string {
  const d = D(value)
  const fixed = d.toDecimalPlaces(2).toFixed(2)
  const [intPart, decPart] = fixed.split('.')
  const intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '\u202F')
  return `${intFormatted},${decPart}`
}

/** Additionne plusieurs montants (toutes strings). */
export function somme(values: Money[]): Decimal {
  return values.reduce<Decimal>((acc, v) => acc.plus(D(v)), new Decimal(0))
}

/** Calcule le prix de vente à partir du coût net et de la marge. */
export function calculerPrixVente(coutNet: Money, margeType: 'pourcentage' | 'montant_fixe', margeValeur: Money): {
  prixVente: Decimal
  margeMontant: Decimal
} {
  const cn = D(coutNet)
  const mv = D(margeValeur)
  if (margeType === 'pourcentage') {
    const pv = cn.mul(new Decimal(1).plus(mv.div(100)))
    return { prixVente: pv, margeMontant: pv.minus(cn) }
  }
  // montant_fixe
  const pv = cn.plus(mv)
  return { prixVente: pv, margeMontant: mv }
}
