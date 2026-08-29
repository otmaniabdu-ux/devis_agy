import { NextRequest, NextResponse } from 'next/server'
import { CreateClientSchema } from '@/lib/validation/clientSchemas'
import { ClientUseCases } from '@/application/clients/ClientUseCases'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  const clients = await ClientUseCases.list()
  return NextResponse.json(clients)
}

export async function POST(req: NextRequest) {
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
  } catch (error) {
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
