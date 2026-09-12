import { NextRequest, NextResponse } from 'next/server'
import { requireAgent } from '@/lib/api-auth'
import { FactureUseCases } from '@/application/facturation/FactureUseCases'
import { CreateVersementSchema } from '@/lib/validation/factureSchemas'
import { getErrorMessage } from '@/lib/errors'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const agent = await requireAgent(req)
  if (agent instanceof NextResponse) return agent

  try {
    const { id: factureId } = await params
    const body = await req.json()
    const parsed = CreateVersementSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données de versement invalides', details: parsed.error.format() },
        { status: 400 }
      )
    }

    const facture = await FactureUseCases.addVersement(factureId, parsed.data)
    return NextResponse.json(facture, { status: 201 })
  } catch (error: unknown) {
    const msg = getErrorMessage(error)
    console.error('API Error POST versement:', error)
    return NextResponse.json({ error: msg || 'Erreur lors de l enregistrement du versement' }, { status: 500 })
  }
}
