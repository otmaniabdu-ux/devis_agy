// Module unifié pour parser et valider les payloads devis côté serveur.
// Utilisé par POST /api/devis et PUT /api/devis/[id] pour éviter la duplication.

import { db } from '@/lib/db'
import { attribuerNumeroDevis } from '@/lib/calculDevis'
import { differenceInCalendarDays } from 'date-fns'

// ============ Helpers dates ============

/** Parse une date de façon robuste. Retourne null si invalide. */
export function safeDate(v: any): Date | null {
  if (!v) return null
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v
  const s = String(v).trim()
  if (!s) return null
  // YYYY-MM-DD → ISO DateTime
  let dateStr = s
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    dateStr = `${s}T00:00:00.000Z`
  }
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? null : d
}

// ============ Filtres lignes vides ============

const isEmpty = {
  passager: (p: any) => !p.categorie && !p.nom && !p.prenom,
  segmentVol: (s: any) => !s.origine && !s.destination && !s.dateVol,
  hebergement: (h: any) => !h.hotelNom && !h.dateCheckin && !h.dateCheckout,
  transfert: (t: any) => !t.trajet,
  train: (t: any) => !t.trajet && !t.dateTrain,
  prestation: (p: any) => !p.descriptionFr && !p.type,
}

// ============ Mappers (payload frontend → data Prisma) ============

export function mapPassager(p: any, devisId?: string) {
  return {
    ...(devisId ? { devisId } : {}),
    categorie: p.categorie || 'adulte',
    nom: p.nom || '',
    prenom: p.prenom ?? '',
    dateNaissance: safeDate(p.dateNaissance),
    passeportNumero: p.passeportNumero || null,
    passeportExpiration: safeDate(p.passeportExpiration),
  }
}

export function mapSegmentVol(s: any, devisId?: string, ordre = 0) {
  return {
    ...(devisId ? { devisId } : {}),
    ordre,
    origine: s.origine || '',
    destination: s.destination || '',
    dateVol: safeDate(s.dateVol) ?? new Date(),
    classe: s.classe ?? 'economique',
    compagnieId: s.compagnieId || null,
    prixAdulte: String(s.prixAdulte ?? '0'),
    prixEnfant: String(s.prixEnfant ?? '0'),
    prixBebe: String(s.prixBebe ?? '0'),
    devise: s.devise ?? 'SAR',
  }
}

export function mapHebergement(h: any, devisId?: string) {
  const ci = safeDate(h.dateCheckin) ?? new Date()
  const co = safeDate(h.dateCheckout) ?? new Date()
  const nbNuit = Math.max(0, differenceInCalendarDays(co, ci))
  return {
    ...(devisId ? { devisId } : {}),
    ville: h.ville || 'Makkah',
    hotelId: h.hotelId || null,
    hotelNom: h.hotelNom || '',
    typeChambre: h.typeChambre ?? 'double',
    formuleRepas: h.formuleRepas ?? 'demi_pension',
    vue: h.vue ?? 'city',
    dateCheckin: ci,
    dateCheckout: co,
    nbNuitees: nbNuit,
    nbChambres: h.nbChambres ?? 1,
    prixNuitChambre: String(h.prixNuitChambre ?? '0'),
    devise: h.devise ?? 'SAR',
  }
}

export function mapTransfert(t: any, devisId?: string, ordre = 0) {
  return {
    ...(devisId ? { devisId } : {}),
    ordre,
    trajet: t.trajet,
    typeVehicule: t.typeVehicule ?? 'GMC_Yukon',
    prix: String(t.prix ?? '0'),
    devise: t.devise ?? 'SAR',
    obligatoire: t.obligatoire ?? true,
  }
}

export function mapTrain(t: any, devisId?: string) {
  return {
    ...(devisId ? { devisId } : {}),
    trajet: t.trajet,
    classe: t.classe ?? 'economique',
    dateTrain: safeDate(t.dateTrain) ?? new Date(),
    prixAdulte: String(t.prixAdulte ?? '0'),
    prixEnfant: String(t.prixEnfant ?? '0'),
    devise: t.devise ?? 'SAR',
  }
}

export function mapPrestation(p: any, devisId?: string) {
  return {
    ...(devisId ? { devisId } : {}),
    type: p.type ?? 'autre',
    descriptionFr: p.descriptionFr || '',
    descriptionAr: p.descriptionAr || null,
    prix: String(p.prix ?? '0'),
    devise: p.devise ?? 'SAR',
  }
}

// ============ Validation helpers ============

/** Récupère les taux verrouillés : utilise ceux du body, sinon fallback sur la base. */
export async function resolveTaux(body: any): Promise<{ sar: string; usd: string; eur: string }> {
  const taux = await db.tauxChange.findMany()
  const map: Record<string, string> = {}
  for (const t of taux) map[t.code] = t.tauxDzd
  return {
    sar: body.tauxSarDzd !== undefined ? String(body.tauxSarDzd) : (map.SAR ?? '35.50'),
    usd: body.tauxUsdDzd !== undefined ? String(body.tauxUsdDzd) : (map.USD ?? '240.00'),
    eur: body.tauxEurDzd !== undefined ? String(body.tauxEurDzd) : (map.EUR ?? '260.00'),
  }
}

/** Construit l'objet data pour Prisma create (devis complet). */
export async function buildDevisCreateData(body: any) {
  const taux = await resolveTaux(body)
  const numero = await attribuerNumeroDevis(body.dateDepart ? safeDate(body.dateDepart) ?? new Date() : new Date())

  // Filtre les lignes vides
  const passagers = (body.passagers ?? []).filter((p: any) => !isEmpty.passager(p)).map((p: any) => mapPassager(p))
  const segmentsVol = (body.segmentsVol ?? []).filter((s: any) => !isEmpty.segmentVol(s)).map((s: any, i: number) => mapSegmentVol(s, undefined, i))
  const hebergements = (body.hebergements ?? []).filter((h: any) => !isEmpty.hebergement(h)).map((h: any) => mapHebergement(h))
  const transferts = (body.transferts ?? []).filter((t: any) => !isEmpty.transfert(t)).map((t: any, i: number) => mapTransfert(t, undefined, i))
  const trainsHaramain = (body.trainsHaramain ?? []).filter((t: any) => !isEmpty.train(t)).map((t: any) => mapTrain(t))
  const prestationsVip = (body.prestationsVip ?? []).filter((p: any) => !isEmpty.prestation(p)).map((p: any) => mapPrestation(p))

  return {
    numero,
    clientId: body.clientId,
    dateDepart: safeDate(body.dateDepart) ?? new Date(),
    dateRetour: safeDate(body.dateRetour) ?? new Date(),
    tauxSarDzd: taux.sar,
    tauxUsdDzd: taux.usd,
    tauxEurDzd: taux.eur,
    visaType: body.visaType ?? 'omra_standard',
    visaPrixUnit: String(body.visaPrixUnit ?? '0'),
    visaDevise: body.visaDevise ?? 'SAR',
    assurancePrixUnit: String(body.assurancePrixUnit ?? '0'),
    assuranceDevise: body.assuranceDevise ?? 'SAR',
    margeType: body.margeType ?? 'pourcentage',
    margeValeur: String(body.margeValeur ?? '15'),
    statut: body.statut ?? 'brouillon',
    notesInternes: body.notesInternes ?? null,
    notesClient: body.notesClient ?? null,
    passagers: { create: passagers },
    segmentsVol: { create: segmentsVol },
    hebergements: { create: hebergements },
    transferts: { create: transferts },
    trainsHaramain: { create: trainsHaramain },
    prestationsVip: { create: prestationsVip },
  }
}

/** Extrait les champs scalaires modifiables d'un body PUT. */
export function buildDevisUpdateData(body: any): any {
  const data: any = {}
  const setIf = (field: string, transform: (v: any) => any = (v) => v) => {
    if (body[field] !== undefined) data[field] = transform(body[field])
  }

  setIf('statut')
  setIf('notesInternes')
  setIf('notesClient')
  setIf('margeType')
  setIf('visaType')
  setIf('visaDevise')
  setIf('assuranceDevise')
  setIf('dateDepart', (v) => safeDate(v) ?? undefined)
  setIf('dateRetour', (v) => safeDate(v) ?? undefined)
  setIf('margeValeur', (v) => String(v))
  setIf('visaPrixUnit', (v) => String(v))
  setIf('assurancePrixUnit', (v) => String(v))
  setIf('tauxSarDzd', (v) => String(v))
  setIf('tauxUsdDzd', (v) => String(v))
  setIf('tauxEurDzd', (v) => String(v))

  // Supprime les undefined pour éviter d'écraser avec null
  Object.keys(data).forEach((k) => data[k] === undefined && delete data[k])
  return data
}

/** Reconstruit les lignes enfants filtrées pour un update PUT. */
export function buildChildLines(body: any, devisId: string) {
  return {
    passagers: body.passagers !== undefined
      ? (body.passagers as any[]).filter((p) => !isEmpty.passager(p)).map((p) => mapPassager(p, devisId))
      : null,
    segmentsVol: body.segmentsVol !== undefined
      ? (body.segmentsVol as any[]).filter((s) => !isEmpty.segmentVol(s)).map((s, i) => mapSegmentVol(s, devisId, i))
      : null,
    hebergements: body.hebergements !== undefined
      ? (body.hebergements as any[]).filter((h) => !isEmpty.hebergement(h)).map((h) => mapHebergement(h, devisId))
      : null,
    transferts: body.transferts !== undefined
      ? (body.transferts as any[]).filter((t) => !isEmpty.transfert(t)).map((t, i) => mapTransfert(t, devisId, i))
      : null,
    trainsHaramain: body.trainsHaramain !== undefined
      ? (body.trainsHaramain as any[]).filter((t) => !isEmpty.train(t)).map((t) => mapTrain(t, devisId))
      : null,
    prestationsVip: body.prestationsVip !== undefined
      ? (body.prestationsVip as any[]).filter((p) => !isEmpty.prestation(p)).map((p) => mapPrestation(p, devisId))
      : null,
  }
}
