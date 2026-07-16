import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { attribuerNumeroDevis, recalculerDevis, persisterTotaux } from '@/lib/calculDevis'
import { verifierAlertePasseport } from '@/lib/business'

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
  // 1. Récupère les taux actuels pour les verrouiller dans le devis
  const taux = await db.tauxChange.findMany()
  const tauxMap: Record<string, string> = {}
  for (const t of taux) tauxMap[t.code] = t.tauxDzd

  const numero = await attribuerNumeroDevis(body.dateDepart ? new Date(body.dateDepart) : new Date())

  const data: any = {
    numero,
    clientId: body.clientId,
    dateDepart: new Date(body.dateDepart),
    dateRetour: new Date(body.dateRetour),
    tauxSarDzd: tauxMap.SAR ?? '35.50',
    tauxUsdDzd: tauxMap.USD ?? '240.00',
    tauxEurDzd: tauxMap.EUR ?? '260.00',
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
    passagers: { create: body.passagers ?? [] },
    segmentsVol: { create: body.segmentsVol ?? [] },
    hebergements: { create: (body.hebergements ?? []).map((h: any) => ({
      ...h,
      dateCheckin: new Date(h.dateCheckin),
      dateCheckout: new Date(h.dateCheckout),
    })) },
    transferts: { create: body.transferts ?? [] },
    trainsHaramain: { create: (body.trainsHaramain ?? []).map((t: any) => ({
      ...t,
      dateTrain: new Date(t.dateTrain),
    })) },
    prestationsVip: { create: body.prestationsVip ?? [] },
  }

  const devis = await db.devis.create({ data })

  // 2. Calcule les nuitées des hébergements + persiste
  for (const heb of body.hebergements ?? []) {
    if (heb.id) {
      // déjà créé via create imbriquée — on update le nbNuitees
      // (en pratique, on fait un update séparé car create imbriquée ne permet pas easily de récup l'id)
    }
  }
  // Recalcule les nuitées directement via SQL (update post-create)
  const hebergements = await db.hebergement.findMany({ where: { devisId: devis.id } })
  for (const heb of hebergements) {
    const nbNuit = Math.max(0, Math.round((new Date(heb.dateCheckout).getTime() - new Date(heb.dateCheckin).getTime()) / 86400000))
    if (nbNuit !== heb.nbNuitees) {
      await db.hebergement.update({ where: { id: heb.id }, data: { nbNuitees: nbNuit } })
    }
  }

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
