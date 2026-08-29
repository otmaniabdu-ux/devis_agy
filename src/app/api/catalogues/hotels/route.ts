import { NextRequest, NextResponse } from 'next/server'
import { HotelUseCases } from '@/application/catalogues/CatalogueUseCases'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const ville = searchParams.get('ville')
  const hotels = await HotelUseCases.list(ville)
  return NextResponse.json(hotels)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  // Minimal manual validation could go here if no Zod schema
  const hotel = await HotelUseCases.create(body)
  return NextResponse.json(hotel, { status: 201 })
}
