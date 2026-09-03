// Module unifié pour parser et valider les payloads devis côté serveur.
// Utilisé par POST /api/devis et PUT /api/devis/[id] pour éviter la duplication.

import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'
import { NumerotationService } from '@/application/numerotation/NumerotationService'
import { differenceInCalendarDays } from 'date-fns'
import {
  CreateDevisInput, UpdateDevisInput,
  PassagerPayload, SegmentVolPayload, HebergementPayload, TransfertPayload,
  TrainHaramainPayload, PrestationVipPayload, CampMashairPayload, TransportMashairPayload,
} from '@/lib/validation/devisSchemas'

// ============ Helpers dates ============

/** Parse une date de façon robuste. Retourne null si invalide. */
export function safeDate(v: unknown): Date | null {
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
  passager: (p: PassagerPayload) => !p.categorie && !p.nom && !p.prenom,
  segmentVol: (s: SegmentVolPayload) => !s.origine && !s.destination && !s.dateVol,
  hebergement: (h: HebergementPayload) => !h.hotelNom && !h.dateCheckin && !h.dateCheckout,
  transfert: (t: TransfertPayload) => !t.trajet,
  train: (t: TrainHaramainPayload) => !t.trajet && !t.dateTrain,
  prestation: (p: PrestationVipPayload) => !p.descriptionFr && !p.type,
  campMashair: (c: CampMashairPayload) => !c.nomCamp && !c.typeTente,
  transportMashair: (t: TransportMashairPayload) => !t.trajet && !t.typeVehicule,
}

// ============ Mappers (payload frontend → data Prisma) ============

export function mapPassager(p: PassagerPayload, devisId?: string): Prisma.PassagerCreateManyInput {
  return {
    ...(devisId ? { devisId } : {}),
    categorie: p.categorie || 'adulte',
    nom: p.nom || '',
    prenom: p.prenom ?? '',
    dateNaissance: safeDate(p.dateNaissance),
    passeportNumero: p.passeportNumero || null,
    passeportExpiration: safeDate(p.passeportExpiration),
  } as Prisma.PassagerCreateManyInput
}

export function mapSegmentVol(s: SegmentVolPayload, devisId?: string, ordre = 0): Prisma.SegmentVolCreateManyInput {
  return {
    ...(devisId ? { devisId } : {}),
    ordre,
    origine: s.origine || '',
    destination: s.destination || '',
    dateVol: safeDate(s.dateVol) ?? new Date(),
    classe: s.classe ?? 'economique',
    origineRetour: s.origineRetour || null,
    destinationRetour: s.destinationRetour || null,
    dateVolRetour: safeDate(s.dateVolRetour),
    classeRetour: s.classeRetour ?? 'economique',
    compagnieId: s.compagnieId || null,
    prixAdulte: String(s.prixAdulte ?? '0'),
    prixEnfant: String(s.prixEnfant ?? '0'),
    prixBebe: String(s.prixBebe ?? '0'),
    devise: s.devise ?? 'SAR',
  } as Prisma.SegmentVolCreateManyInput
}

export function mapHebergement(h: HebergementPayload, devisId?: string): Prisma.HebergementCreateManyInput {
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
  } as Prisma.HebergementCreateManyInput
}

export function mapTransfert(t: TransfertPayload, devisId?: string, ordre = 0): Prisma.TransfertCreateManyInput {
  return {
    ...(devisId ? { devisId } : {}),
    ordre,
    trajet: t.trajet || '',
    typeVehicule: t.typeVehicule ?? 'GMC_Yukon',
    prix: String(t.prix ?? '0'),
    devise: t.devise ?? 'SAR',
    obligatoire: t.obligatoire ?? true,
  } as Prisma.TransfertCreateManyInput
}

export function mapTrain(t: TrainHaramainPayload, devisId?: string): Prisma.TrainHaramainCreateManyInput {
  return {
    ...(devisId ? { devisId } : {}),
    trajet: t.trajet || '',
    classe: t.classe ?? 'economique',
    dateTrain: safeDate(t.dateTrain) ?? new Date(),
    prixAdulte: String(t.prixAdulte ?? '0'),
    prixEnfant: String(t.prixEnfant ?? '0'),
    devise: t.devise ?? 'SAR',
  } as Prisma.TrainHaramainCreateManyInput
}

export function mapPrestation(p: PrestationVipPayload, devisId?: string): Prisma.PrestationVIPCreateManyInput {
  return {
    ...(devisId ? { devisId } : {}),
    type: p.type ?? 'autre',
    descriptionFr: p.descriptionFr || '',
    descriptionAr: p.descriptionAr || null,
    prix: String(p.prix ?? '0'),
    devise: p.devise ?? 'SAR',
  } as Prisma.PrestationVIPCreateManyInput
}

export function mapCampMashair(c: CampMashairPayload, devisId?: string): Prisma.CampMashairCreateManyInput {
  return {
    ...(devisId ? { devisId } : {}),
    nomCamp: c.nomCamp || '',
    typeTente: c.typeTente || '',
    restauration: c.restauration || '',
    prixAdulte: String(c.prixAdulte ?? '0'),
    prixEnfant: String(c.prixEnfant ?? '0'),
    devise: c.devise ?? 'SAR',
  } as Prisma.CampMashairCreateManyInput
}

export function mapTransportMashair(t: TransportMashairPayload, devisId?: string): Prisma.TransportMashairCreateManyInput {
  return {
    ...(devisId ? { devisId } : {}),
    typeVehicule: t.typeVehicule || '',
    trajet: t.trajet || '',
    prix: String(t.prix ?? '0'),
    typePrix: t.typePrix ?? 'forfait',
    devise: t.devise ?? 'SAR',
  } as Prisma.TransportMashairCreateManyInput
}

// ============ Validation helpers ============

/** Récupère les taux verrouillés : utilise ceux du body, sinon fallback sur la base. */
export async function resolveTaux(body: CreateDevisInput): Promise<{ sar: string; usd: string; eur: string }> {
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
export async function buildDevisCreateData(body: CreateDevisInput) {
  const taux = await resolveTaux(body)
  const numero = await NumerotationService.attribuerNumero(body.dateDepart ? safeDate(body.dateDepart) ?? new Date() : new Date())

  // Filtre les lignes vides
  const passagers = (body.passagers ?? []).filter((p) => !isEmpty.passager(p)).map((p) => mapPassager(p))
  const segmentsVol = (body.segmentsVol ?? []).filter((s) => !isEmpty.segmentVol(s)).map((s, i: number) => mapSegmentVol(s, undefined, i))
  const hebergements = (body.hebergements ?? []).filter((h) => !isEmpty.hebergement(h)).map((h) => mapHebergement(h))
  const transferts = (body.transferts ?? []).filter((t) => !isEmpty.transfert(t)).map((t, i: number) => mapTransfert(t, undefined, i))
  const trainsHaramain = (body.trainsHaramain ?? []).filter((t) => !isEmpty.train(t)).map((t) => mapTrain(t))
  const prestationsVip = (body.prestationsVip ?? []).filter((p) => !isEmpty.prestation(p)).map((p) => mapPrestation(p))
  const campsMashair = (body.campsMashair ?? []).filter((c) => !isEmpty.campMashair(c)).map((c) => mapCampMashair(c))
  const transportsMashair = (body.transportsMashair ?? []).filter((t) => !isEmpty.transportMashair(t)).map((t) => mapTransportMashair(t))

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
    fraisOnpoPrixUnit: String(body.fraisOnpoPrixUnit ?? '5000'),
    fraisOnpoDevise: body.fraisOnpoDevise ?? 'DZD',
    margeType: body.margeType ?? 'pourcentage',
    margeValeur: String(body.margeValeur ?? '15'),
    statut: body.statut ?? 'brouillon',
    notesInternes: body.notesInternes ?? null,
    notesClient: body.notesClient ?? null,
    passagers: { create: passagers as Prisma.PassagerCreateWithoutDevisInput[] },
    segmentsVol: { create: segmentsVol as Prisma.SegmentVolCreateWithoutDevisInput[] },
    hebergements: { create: hebergements as Prisma.HebergementCreateWithoutDevisInput[] },
    transferts: { create: transferts as Prisma.TransfertCreateWithoutDevisInput[] },
    trainsHaramain: { create: trainsHaramain as Prisma.TrainHaramainCreateWithoutDevisInput[] },
    prestationsVip: { create: prestationsVip as Prisma.PrestationVIPCreateWithoutDevisInput[] },
    campsMashair: { create: campsMashair as Prisma.CampMashairCreateWithoutDevisInput[] },
    transportsMashair: { create: transportsMashair as Prisma.TransportMashairCreateWithoutDevisInput[] },
  }
}

/** Extrait les champs scalaires modifiables d'un body PUT. */
export function buildDevisUpdateData(body: UpdateDevisInput): Prisma.DevisUpdateInput {
  const data: Record<string, unknown> = {}
  const setIf = (field: keyof UpdateDevisInput, transform?: (v: unknown) => unknown) => {
    const value = body[field]
    if (value !== undefined) data[field] = transform ? transform(value) : value
  }

  setIf('statut')
  setIf('notesInternes')
  setIf('notesClient')
  setIf('margeType')
  setIf('visaType')
  setIf('visaDevise')
  setIf('assuranceDevise')
  setIf('fraisOnpoDevise')
  setIf('dateDepart', (v) => safeDate(v) ?? undefined)
  setIf('dateRetour', (v) => safeDate(v) ?? undefined)
  setIf('margeValeur', (v) => String(v))
  setIf('visaPrixUnit', (v) => String(v))
  setIf('assurancePrixUnit', (v) => String(v))
  setIf('fraisOnpoPrixUnit', (v) => String(v))
  // Tâche 2.2 : Les taux de change (tauxSarDzd, tauxUsdDzd, tauxEurDzd) sont VERROUILLÉS 
  // à la création du devis. On ne les extrait pas du body pour un PUT.

  // Supprime les undefined pour éviter d'écraser avec null
  Object.keys(data).forEach((k) => data[k] === undefined && delete data[k])
  return data as Prisma.DevisUpdateInput
}

/** Reconstruit les lignes enfants filtrées pour un update PUT. */
export function buildChildLines(body: UpdateDevisInput, devisId: string) {
  return {
    passagers: body.passagers !== undefined
      ? body.passagers.filter((p) => !isEmpty.passager(p)).map((p) => mapPassager(p, devisId))
      : null,
    segmentsVol: body.segmentsVol !== undefined
      ? body.segmentsVol.filter((s) => !isEmpty.segmentVol(s)).map((s, i) => mapSegmentVol(s, devisId, i))
      : null,
    hebergements: body.hebergements !== undefined
      ? body.hebergements.filter((h) => !isEmpty.hebergement(h)).map((h) => mapHebergement(h, devisId))
      : null,
    transferts: body.transferts !== undefined
      ? body.transferts.filter((t) => !isEmpty.transfert(t)).map((t, i) => mapTransfert(t, devisId, i))
      : null,
    trainsHaramain: body.trainsHaramain !== undefined
      ? body.trainsHaramain.filter((t) => !isEmpty.train(t)).map((t) => mapTrain(t, devisId))
      : null,
    prestationsVip: body.prestationsVip !== undefined
      ? body.prestationsVip.filter((p) => !isEmpty.prestation(p)).map((p) => mapPrestation(p, devisId))
      : null,
    campsMashair: body.campsMashair !== undefined
      ? body.campsMashair.filter((c) => !isEmpty.campMashair(c)).map((c) => mapCampMashair(c, devisId))
      : null,
    transportsMashair: body.transportsMashair !== undefined
      ? body.transportsMashair.filter((t) => !isEmpty.transportMashair(t)).map((t) => mapTransportMashair(t, devisId))
      : null,
  }
}

