import { NextRequest, NextResponse } from 'next/server'
import { requireAgent } from '@/lib/api-auth'
import { UpdateCompagnieSchema } from '@/lib/validation/catalogueSchemas'
import { CompagnieUseCases } from '@/application/catalogues/CatalogueUseCases'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const agent = await requireAgent(_req)
  if (agent instanceof NextResponse) return agent

  try {
    const { id } = await params
    const compagnie = await CompagnieUseCases.getById(id)
    return NextResponse.json(compagnie)
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
    const result = UpdateCompagnieSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: result.error.format() },
        { status: 400 }
      )
    }
    const c = await CompagnieUseCases.update(id, result.data)
    return NextResponse.json(c)
  } catch {
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const agent = await requireAgent(_req)
  if (agent instanceof NextResponse) return agent

  const { id } = await params
  await CompagnieUseCases.delete(id)
  return NextResponse.json({ ok: true })
}
