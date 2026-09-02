import { NextRequest, NextResponse } from 'next/server'
import { RecalculerDevisUseCase } from '@/application/RecalculerDevisUseCase'
import { getErrorMessage } from '@/lib/errors'

// POST /api/devis/[id]/calcul — recalcule et renvoie le détail du calcul
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const resultat = await RecalculerDevisUseCase.execute(id)
    return NextResponse.json(resultat)
  } catch (error: unknown) {
    const msg = getErrorMessage(error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
