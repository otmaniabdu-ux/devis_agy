import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const hotel = await db.catalogueHotel.update({
    where: { id },
    data: {
      ville: body.ville,
      nom: body.nom,
      nomAr: body.nomAr ?? null,
      etoiles: body.etoiles ?? 4,
      distanceHaram: body.distanceHaram ?? null,
      prixSingleSar: String(body.prixSingleSar ?? '0'),
      prixDoubleSar: String(body.prixDoubleSar ?? '0'),
      prixTripleSar: String(body.prixTripleSar ?? '0'),
      prixQuadrupleSar: String(body.prixQuadrupleSar ?? '0'),
      actif: body.actif ?? true,
    },
  })
  return NextResponse.json(hotel)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await db.catalogueHotel.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
