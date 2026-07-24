import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const ville = searchParams.get('ville')
  const hotels = await db.catalogueHotel.findMany({
    where: ville ? { ville } : undefined,
    orderBy: [{ ville: 'asc' }, { nom: 'asc' }],
  })
  return NextResponse.json(hotels)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const hotel = await db.catalogueHotel.create({
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
      devise: body.devise ?? 'SAR',
      actif: body.actif ?? true,
    },
  })
  return NextResponse.json(hotel, { status: 201 })
}
