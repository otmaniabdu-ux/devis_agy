import { NextRequest, NextResponse } from 'next/server'
import { requireAgent } from '@/lib/api-auth'
import { CreateClientSchema } from '@/lib/validation/clientSchemas'
import { ClientUseCases } from '@/application/clients/ClientUseCases'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: NextRequest) {
  const agent = await requireAgent(req)
  if (agent instanceof NextResponse) return agent

  const clients = await ClientUseCases.list()
  return NextResponse.json(clients)
}

export async function POST(req: NextRequest) {
  const agent = await requireAgent(req)
  if (agent instanceof NextResponse) return agent

  try {
    const body = await req.json()
    const result = CreateClientSchema.safeParse(body)
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: result.error.format() },
        { status: 400 }
      )
    }

    const client = await ClientUseCases.create(result.data)
    return NextResponse.json(client, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
