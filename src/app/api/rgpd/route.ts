import { NextResponse } from 'next/server'
import { AnonymizeDevisUseCase } from '@/application/rgpd/AnonymizeDevisUseCase'

export async function POST() {
  try {
    const count = await AnonymizeDevisUseCase.execute(30) // Par défaut 30 jours
    return NextResponse.json({ ok: true, anonymizedCount: count })
  } catch (error) {
    console.error('Erreur RGPD:', error)
    return NextResponse.json({ error: 'Erreur lors de l\'anonymisation' }, { status: 500 })
  }
}
