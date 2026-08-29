import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { recalculerDevis, persisterTotaux } from '@/lib/calculDevis'
import { verifierAlertePasseport } from '@/lib/business'
import { buildDevisCreateData } from '@/lib/devisPayload'

import { CreateDevisSchema } from '@/lib/validation/devisSchemas'

export const dynamic = 'force-dynamic'
export const revalidate = 0

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
  try {
    const body = await req.json()

    // Validation Zod
    const result = CreateDevisSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: result.error.format() },
        { status: 400 }
      )
    }

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
  } catch (error) {
    console.error('Erreur POST /devis:', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
