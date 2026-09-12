import { NextRequest, NextResponse } from 'next/server'
import { requireAgent } from '@/lib/api-auth'
import { UpdateParametresSchema } from '@/lib/validation/parametresSchemas'
import { ParametresUseCases } from '@/application/parametres/ParametresUseCases'

export async function GET(req: NextRequest) {
  const agent = await requireAgent(req)
  if (agent instanceof NextResponse) return agent

  const result = await ParametresUseCases.get()
  return NextResponse.json(result)
}

export async function PUT(req: NextRequest) {
  const agent = await requireAgent(req)
  if (agent instanceof NextResponse) return agent

  try {
    const body = await req.json()
    const result = UpdateParametresSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: result.error.format() },
        { status: 400 }
      )
    }
    await ParametresUseCases.update(result.data)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
