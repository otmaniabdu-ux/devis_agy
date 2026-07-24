import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { recalculerDevis, persisterTotaux } from '@/lib/calculDevis'
import { verifierAlertePasseport } from '@/lib/business'
import { buildDevisCreateData } from '@/lib/devisPayload'

// GET /api/devis — liste tous les devis avec alerte passeport
export async function GET() {
  const devis = await db.devis.findMany({
    include: { client: true, passagers: true },
    orderBy: { createdAt: 'desc' },
  })
  const result = devis.map((d) => ({
    ...d,
    hasAlertePasseport: d.passagers.some((p) =>
      p.passeportExpiration && verifierAlertePasseport(p.passeportExpiration, d.dateRetour).alerte,
    ),
  }))
  return NextResponse.json(result)
}

// POST /api/devis — crée un nouveau devis
export async function POST(req: NextRequest) {
  const body = await req.json()
  const data = await buildDevisCreateData(body)
  const devis = await db.devis.create({ data })

  // Recalcule et persiste les totaux
  const resultat = await recalculerDevis(devis.id)
  await persisterTotaux(devis.id, resultat)

  const fullDevis = await db.devis.findUnique({
    where: { id: devis.id },
    include: {
      client: true, passagers: true, segmentsVol: true,
      hebergements: true, transferts: true, trainsHaramain: true, prestationsVip: true,
    },
  })
  return NextResponse.json(fullDevis, { status: 201 })
}
