import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { recalculerDevis } from '@/lib/calculDevis'

// POST /api/devis/[id]/calcul — recalcule et renvoie le détail du calcul sans persister
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const resultat = await recalculerDevis(id)
    return NextResponse.json(resultat)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
