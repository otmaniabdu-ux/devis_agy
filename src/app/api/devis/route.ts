import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { attribuerNumeroDevis, recalculerDevis, persisterTotaux } from '@/lib/calculDevis'
import { verifierAlertePasseport } from '@/lib/business'

// Helper : parse une date de façon robuste. Retourne null si invalide.
function safeDate(v: any): Date | null {
  if (!v) return null
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v
  const s = String(v).trim()
  if (!s) return null
  let dateStr = s
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    dateStr = `${s}T00:00:00.000Z`
  }
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? null : d
}

// Helper : vérifie si une ligne enfant est "vide" (à ignorer)
function isSegmentVolEmpty(s: any): boolean {
  return !s.origine && !s.destination && !s.dateVol
}
function isHebergementEmpty(h: any): boolean {
  return !h.hotelNom && !h.dateCheckin && !h.dateCheckout
}
function isTransfertEmpty(t: any): boolean {
  return !t.trajet
}
function isTrainEmpty(t: any): boolean {
  return !t.trajet && !t.dateTrain
}
function isPrestationEmpty(p: any): boolean {
  return !p.descriptionFr && !p.type
}

// GET /api/devis — liste tous les devis
export async function GET() {
  const devis = await db.devis.findMany({
    include: {
      client: true,
      passagers: true,
    },
    orderBy: { createdAt: 'desc' },
  })
  // ajoute le flag alertePasseport calculé
  const result = devis.map((d) => {
    const hasAlerte = d.passagers.some((p) =>
      p.passeportExpiration && verifierAlertePasseport(p.passeportExpiration, d.dateRetour).alerte,
    )
    return { ...d, hasAlertePasseport: hasAlerte }
  })
  return NextResponse.json(result)
}

// POST /api/devis — crée un nouveau devis avec taux verrouillés + numérotation auto
export async function POST(req: NextRequest) {
  const body = await req.json()

  // 1. Récupère les taux : utilise ceux fournis dans le body, sinon ceux de la base
  const taux = await db.tauxChange.findMany()
  const tauxMap: Record<string, string> = {}
  for (const t of taux) tauxMap[t.code] = t.tauxDzd

  const tauxSarDzd = body.tauxSarDzd !== undefined ? String(body.tauxSarDzd) : (tauxMap.SAR ?? '35.50')
  const tauxUsdDzd = body.tauxUsdDzd !== undefined ? String(body.tauxUsdDzd) : (tauxMap.USD ?? '240.00')
  const tauxEurDzd = body.tauxEurDzd !== undefined ? String(body.tauxEurDzd) : (tauxMap.EUR ?? '260.00')

  const numero = await attribuerNumeroDevis(body.dateDepart ? new Date(body.dateDepart) : new Date())

  // Date de départ/retour robuste
  const dateDepart = safeDate(body.dateDepart) ?? new Date()
  const dateRetour = safeDate(body.dateRetour) ?? new Date()

  // 2. Filtre les lignes vides
  const validPassagers = (body.passagers ?? []).filter((p: any) => p.nom || p.prenom)
  const validSegments = (body.segmentsVol ?? []).filter((s: any) => !isSegmentVolEmpty(s))
  const validHebergements = (body.hebergements ?? []).filter((h: any) => !isHebergementEmpty(h))
  const validTransferts = (body.transferts ?? []).filter((t: any) => !isTransfertEmpty(t))
  const validTrains = (body.trainsHaramain ?? []).filter((t: any) => !isTrainEmpty(t))
  const validPrestations = (body.prestationsVip ?? []).filter((p: any) => !isPrestationEmpty(p))

  const data: any = {
    numero,
    clientId: body.clientId,
    dateDepart,
    dateRetour,
    tauxSarDzd,
    tauxUsdDzd,
    tauxEurDzd,
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
    passagers: { create: validPassagers.map((p: any) => ({
      categorie: p.categorie || 'adulte',
      nom: p.nom || '',
      prenom: p.prenom ?? '',
      dateNaissance: safeDate(p.dateNaissance),
      passeportNumero: p.passeportNumero || null,
      passeportExpiration: safeDate(p.passeportExpiration),
    })) },
    segmentsVol: { create: validSegments.map((s: any, i: number) => ({
      origine: s.origine || '',
      destination: s.destination || '',
      dateVol: safeDate(s.dateVol) ?? new Date(),
      classe: s.classe ?? 'economique',
      compagnieId: s.compagnieId || null,
      prixAdulte: String(s.prixAdulte ?? '0'),
      prixEnfant: String(s.prixEnfant ?? '0'),
      prixBebe: String(s.prixBebe ?? '0'),
      devise: s.devise ?? 'SAR',
      ordre: i,
    })) },
    hebergements: { create: validHebergements.map((h: any) => {
      const ci = safeDate(h.dateCheckin) ?? new Date()
      const co = safeDate(h.dateCheckout) ?? new Date()
      const nbNuit = Math.max(0, Math.round((co.getTime() - ci.getTime()) / 86400000))
      return {
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
    }) },
    transferts: { create: validTransferts.map((t: any, i: number) => ({
      trajet: t.trajet,
      typeVehicule: t.typeVehicule ?? 'GMC_Yukon',
      prix: String(t.prix ?? '0'),
      devise: t.devise ?? 'SAR',
      obligatoire: t.obligatoire ?? true,
      ordre: i,
    })) },
    trainsHaramain: { create: validTrains.map((t: any) => ({
      trajet: t.trajet,
      classe: t.classe ?? 'economique',
      dateTrain: safeDate(t.dateTrain) ?? new Date(),
      prixAdulte: String(t.prixAdulte ?? '0'),
      prixEnfant: String(t.prixEnfant ?? '0'),
      devise: t.devise ?? 'SAR',
    })) },
    prestationsVip: { create: validPrestations.map((p: any) => ({
      type: p.type ?? 'autre',
      descriptionFr: p.descriptionFr || '',
      descriptionAr: p.descriptionAr || null,
      prix: String(p.prix ?? '0'),
      devise: p.devise ?? 'SAR',
    })) },
  }

  const devis = await db.devis.create({ data })

  // 3. Recalcule les totaux et persiste
  const resultat = await recalculerDevis(devis.id)
  await persisterTotaux(devis.id, resultat)

  const fullDevis = await db.devis.findUnique({
    where: { id: devis.id },
    include: {
      client: true,
      passagers: true,
      segmentsVol: true,
      hebergements: true,
      transferts: true,
      trainsHaramain: true,
      prestationsVip: true,
    },
  })
  return NextResponse.json(fullDevis, { status: 201 })
}
