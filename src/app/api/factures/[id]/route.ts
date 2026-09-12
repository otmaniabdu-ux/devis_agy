import { NextRequest, NextResponse } from 'next/server'
import { requireAgent } from '@/lib/api-auth'
import { FactureUseCases } from '@/application/facturation/FactureUseCases'
import { getErrorMessage } from '@/lib/errors'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const agent = await requireAgent(_req)
  if (agent instanceof NextResponse) return agent

  try {
    const { id } = await params
    const facture = await FactureUseCases.getById(id)
    return NextResponse.json(facture)
  } catch (error: unknown) {
    const msg = getErrorMessage(error)
    if (msg === 'Facture introuvable') {
      return NextResponse.json({ error: msg }, { status: 404 })
    }
    console.error('API Error GET /api/factures/[id]:', error)
    return NextResponse.json({ error: 'Erreur lors du chargement de la facture' }, { status: 500 })
  }
}
