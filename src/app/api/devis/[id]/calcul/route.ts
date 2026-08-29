import { NextRequest, NextResponse } from 'next/server'
import { RecalculerDevisUseCase } from '@/application/RecalculerDevisUseCase'

// POST /api/devis/[id]/calcul — recalcule et renvoie le détail du calcul
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const resultat = await RecalculerDevisUseCase.execute(id)
    return NextResponse.json(resultat)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
