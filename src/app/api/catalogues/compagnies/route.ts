import { NextRequest, NextResponse } from 'next/server'
import { requireAgent } from '@/lib/api-auth'
import { CreateCompagnieSchema } from '@/lib/validation/catalogueSchemas'
import { CompagnieUseCases } from '@/application/catalogues/CatalogueUseCases'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: NextRequest) {
  const agent = await requireAgent(req)
  if (agent instanceof NextResponse) return agent

  const compagnies = await CompagnieUseCases.list()
  return NextResponse.json(compagnies)
}

export async function POST(req: NextRequest) {
  const agent = await requireAgent(req)
  if (agent instanceof NextResponse) return agent

  try {
    const body = await req.json()
    const result = CreateCompagnieSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: result.error.format() },
        { status: 400 }
      )
    }
    const c = await CompagnieUseCases.create(result.data)
    return NextResponse.json(c, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
