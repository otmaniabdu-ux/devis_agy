import { NextRequest, NextResponse } from 'next/server'
import { FactureUseCases } from '@/application/facturation/FactureUseCases'
import { getErrorMessage } from '@/lib/errors'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; versementId: string }> }
) {
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
