import { NextRequest, NextResponse } from 'next/server'
import { requireAgent } from '@/lib/api-auth'
import { FactureUseCases } from '@/application/facturation/FactureUseCases'
import { CreateFactureSchema } from '@/lib/validation/factureSchemas'
import { getErrorMessage } from '@/lib/errors'

export async function GET(req: NextRequest) {
  const agent = await requireAgent(req)
  if (agent instanceof NextResponse) return agent

  try {
    const factures = await FactureUseCases.list()
    return NextResponse.json(factures)
  } catch (error: unknown) {
    console.error('API Error GET /api/factures:', error)
    return NextResponse.json({ error: 'Erreur lors du chargement des factures' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const agent = await requireAgent(req)
  if (agent instanceof NextResponse) return agent

  try {
    const body = await req.json()
    const parsed = CreateFactureSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données de facturation invalides', details: parsed.error.format() },
        { status: 400 }
      )
    }

    const facture = await FactureUseCases.createFromDevis(parsed.data)
    return NextResponse.json(facture, { status: 201 })
  } catch (error: unknown) {
    const msg = getErrorMessage(error)
    console.error('API Error POST /api/factures:', error)
    return NextResponse.json({ error: msg || 'Erreur lors de la création de la facture' }, { status: 500 })
  }
}
