import { NextRequest, NextResponse } from 'next/server'
import { requireAgent } from '@/lib/api-auth'
import { UpdateHotelSchema } from '@/lib/validation/catalogueSchemas'
import { HotelUseCases } from '@/application/catalogues/CatalogueUseCases'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const agent = await requireAgent(_req)
  if (agent instanceof NextResponse) return agent

  try {
    const { id } = await params
    const hotel = await HotelUseCases.getById(id)
    return NextResponse.json(hotel)
  } catch {
    return NextResponse.json({ error: 'Introuvable' }, { status: 404 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const agent = await requireAgent(req)
  if (agent instanceof NextResponse) return agent

  try {
    const { id } = await params
    const body = await req.json()
    const result = UpdateHotelSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: result.error.format() },
        { status: 400 }
      )
    }
    const hotel = await HotelUseCases.update(id, result.data)
    return NextResponse.json(hotel)
  } catch {
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const agent = await requireAgent(_req)
  if (agent instanceof NextResponse) return agent

  const { id } = await params
  await HotelUseCases.delete(id)
  return NextResponse.json({ ok: true })
}
