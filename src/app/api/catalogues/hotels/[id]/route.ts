import { NextRequest, NextResponse } from 'next/server'
import { HotelUseCases } from '@/application/catalogues/CatalogueUseCases'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const hotel = await HotelUseCases.getById(id)
    return NextResponse.json(hotel)
  } catch {
    return NextResponse.json({ error: 'Introuvable' }, { status: 404 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const hotel = await HotelUseCases.update(id, body)
  return NextResponse.json(hotel)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await HotelUseCases.delete(id)
  return NextResponse.json({ ok: true })
}
