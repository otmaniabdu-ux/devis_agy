import { NextRequest, NextResponse } from 'next/server'
import { CompagnieUseCases } from '@/application/catalogues/CatalogueUseCases'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const compagnie = await CompagnieUseCases.getById(id)
    return NextResponse.json(compagnie)
  } catch (error) {
    return NextResponse.json({ error: 'Introuvable' }, { status: 404 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const c = await CompagnieUseCases.update(id, body)
  return NextResponse.json(c)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await CompagnieUseCases.delete(id)
  return NextResponse.json({ ok: true })
}
