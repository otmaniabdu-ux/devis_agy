import { NextRequest, NextResponse } from 'next/server'
import { requireAgent } from '@/lib/api-auth'
import { CreateHotelSchema } from '@/lib/validation/catalogueSchemas'
import { HotelUseCases } from '@/application/catalogues/CatalogueUseCases'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: NextRequest) {
  const agent = await requireAgent(req)
  if (agent instanceof NextResponse) return agent

  const { searchParams } = new URL(req.url)
  const ville = searchParams.get('ville')
  const hotels = await HotelUseCases.list(ville)
  return NextResponse.json(hotels)
}

export async function POST(req: NextRequest) {
  const agent = await requireAgent(req)
  if (agent instanceof NextResponse) return agent

  try {
    const body = await req.json()
    const result = CreateHotelSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: result.error.format() },
        { status: 400 }
      )
    }
    const hotel = await HotelUseCases.create(result.data)
    return NextResponse.json(hotel, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
