import { NextRequest, NextResponse } from 'next/server'
import { requireAgent } from '@/lib/api-auth'
import { FactureUseCases } from '@/application/facturation/FactureUseCases'
import { getErrorMessage } from '@/lib/errors'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; versementId: string }> }
) {
  const agent = await requireAgent(_req)
  if (agent instanceof NextResponse) return agent

  try {
    const { versementId } = await params
    const facture = await FactureUseCases.deleteVersement(versementId)
    return NextResponse.json(facture)
  } catch (error: unknown) {
    const msg = getErrorMessage(error)
    console.error('API Error DELETE versement:', error)
    return NextResponse.json({ error: msg || 'Erreur lors de la suppression du versement' }, { status: 500 })
  }
}
