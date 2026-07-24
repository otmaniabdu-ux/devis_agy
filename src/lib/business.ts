// Logique métier non-financière : nuitées, alertes passeport, numérotation.
// Conforme à PROMPT_AGENT_OmraVIP.md section 6.

import { addMonths, differenceInCalendarDays, isBefore, parseISO } from 'date-fns'

/**
 * Calcule le nombre de nuitées entre check-in et check-out.
 * Différence entière en jours via date-fns (jamais de flottant).
 */
export function calculerNbNuitees(dateCheckin: Date | string, dateCheckout: Date | string): number {
  const ci = typeof dateCheckin === 'string' ? parseISO(dateCheckin) : dateCheckin
  const co = typeof dateCheckout === 'string' ? parseISO(dateCheckout) : dateCheckout
  if (isNaN(ci.getTime()) || isNaN(co.getTime())) return 0
  const n = differenceInCalendarDays(co, ci)
  return n > 0 ? n : 0
}

/**
 * Alerte passeport : déclenchée si expiration < date_retour + 6 mois.
 * Cas limites :
 *  - exactement 6 mois après retour → OK (pas d'alerte)
 *  - 6 mois - 1 jour → ALERTE
 *  - 6 mois + 1 jour → OK
 */
export function verifierAlertePasseport(
  passeportExpiration: Date | string | null | undefined,
  dateRetour: Date | string,
): { alerte: boolean; seuil: Date } {
  const retour = typeof dateRetour === 'string' ? parseISO(dateRetour) : dateRetour
  const seuil = addMonths(retour, 6)
  if (!passeportExpiration) return { alerte: false, seuil }
  const exp = typeof passeportExpiration === 'string' ? parseISO(passeportExpiration) : passeportExpiration
  if (isNaN(exp.getTime())) return { alerte: false, seuil }
  // alerte si exp < seuil strictement
  return { alerte: isBefore(exp, seuil), seuil }
}

/**
 * Génère le prochain numéro de devis au format DEVIS-YYYY-MM-NNN.
 * La séquence est réinitialisée à chaque changement de mois.
 */
export function cleMensuelle(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `DEVIS-${y}-${m}`
}

export function formatNumeroDevis(cle: string, numero: number): string {
  return `${cle}-${String(numero).padStart(3, '0')}`
}

/** Catégories de passagers avec leurs libellés et règles d'âge. */
export const CATEGORIES_PASSAGER = {
  adulte: { label: 'Adulte', labelAr: 'بالغ', ageMin: 12, ageMax: 120 },
  enfant_avec_lit: { label: 'Enfant (avec lit)', labelAr: 'طفل (مع سرير)', ageMin: 2, ageMax: 11 },
  enfant_sans_lit: { label: 'Enfant (sans lit)', labelAr: 'طفل (بدون سرير)', ageMin: 2, ageMax: 11 },
  bebe: { label: 'Bébé (< 2 ans)', labelAr: 'رضيع', ageMin: 0, ageMax: 1 },
} as const

export type CategoriePassager = keyof typeof CATEGORIES_PASSAGER

/** Helper pour récupérer le libellé français d'une option. */
export function labFr(map: Record<string, { label: string; labelAr?: string }>, key: string): string {
  return map[key]?.label ?? key
}

export const TYPES_VISA = {
  omra_standard: { label: 'Omra Standard', labelAr: 'عمرة قياسية' },
  touristique: { label: 'Touristique', labelAr: 'سياحي' },
  hadj: { label: 'Hadj', labelAr: 'حج' },
} as const

export const TYPES_VEHICULE = {
  GMC_Yukon: { label: 'GMC Yukon', labelAr: 'جي إم سي يوكون' },
  Mercedes_Classe_E: { label: 'Mercedes Classe E', labelAr: 'مرسيدس فئة E' },
  Bus_VIP_prive: { label: 'Bus VIP privé', labelAr: 'حافلة VIP خاصة' },
} as const

export const TYPES_CHAMBRE = {
  single: { label: 'Single', labelAr: 'مفردة' },
  double: { label: 'Double', labelAr: 'مزدوجة' },
  triple: { label: 'Triple', labelAr: 'ثلاثية' },
  quadruple: { label: 'Quadruple', labelAr: 'رباعية' },
} as const

export const FORMULES_REPAS = {
  petit_dejeuner: { label: 'Petit-déjeuner', labelAr: 'إفطار' },
  demi_pension: { label: 'Demi-pension', labelAr: 'نصف إقامة' },
  pension_complete: { label: 'Pension complète', labelAr: 'إقامة كاملة' },
} as const

export const VUES_HOTEL = {
  kaaba: { label: 'Vue Kaaba', labelAr: 'إطلالة على الكعبة' },
  haram: { label: 'Vue Haram', labelAr: 'إطلالة على الحرم' },
  city: { label: 'Vue ville', labelAr: 'إطلالة على المدينة' },
} as const

export const TYPES_PRESTATION_VIP = {
  ziyarate: { label: 'Ziyarate privée', labelAr: 'زيارات خاصة' },
  lounge: { label: 'Lounge VIP', labelAr: 'صالة كبار الزوار' },
  fast_track: { label: 'Fast-Track', labelAr: 'مسار سريع' },
  bagagerie: { label: 'Prise en charge bagages', labelAr: 'خدمة الأمتعة' },
  zamzam: { label: 'Eau Zamzam', labelAr: 'ماء زمزم' },
  autre: { label: 'Autre', labelAr: 'أخرى' },
} as const

export const STATUTS_DEVIS = {
  brouillon: { label: 'Brouillon', color: 'bg-slate-200 text-slate-700' },
  envoye: { label: 'Envoyé', color: 'bg-blue-100 text-blue-700' },
  accepte: { label: 'Accepté', color: 'bg-emerald-100 text-emerald-700' },
  refuse: { label: 'Refusé', color: 'bg-red-100 text-red-700' },
  archive: { label: 'Archivé', color: 'bg-slate-100 text-slate-500' },
} as const

export type StatutDevis = keyof typeof STATUTS_DEVIS
