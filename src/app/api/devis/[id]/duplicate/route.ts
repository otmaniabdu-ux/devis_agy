import { NextRequest, NextResponse } from 'next/server'
import { requireAgent } from '@/lib/api-auth'
import { DevisUseCases } from '@/application/devis/DevisUseCases'
import { getErrorMessage } from '@/lib/errors'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const agent = await requireAgent(_req)
  if (agent instanceof NextResponse) return agent

  try {
    const { id } = await params
    const nouveauDevis = await DevisUseCases.duplicate(id)
    return NextResponse.json({ ok: true, devis: nouveauDevis }, { status: 201 })
  } catch (error: unknown) {
    const msg = getErrorMessage(error)
    if (msg === 'Devis introuvable') {
      return NextResponse.json({ error: msg }, { status: 404 })
    }
    console.error('API Error /duplicate:', error)
    return NextResponse.json({ error: msg || 'Erreur lors de la duplication' }, { status: 500 })
  }
}
