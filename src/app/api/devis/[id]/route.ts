import { NextRequest, NextResponse } from 'next/server'
import { UpdateDevisSchema } from '@/lib/validation/devisSchemas'
import { DevisUseCases } from '@/application/devis/DevisUseCases'
import { invalidatePdfCache } from '@/lib/pdfRenderer'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const devis = await DevisUseCases.getById(id)
    return NextResponse.json(devis)
  } catch (error: any) {
    if (error.message === 'Devis introuvable') {
      return NextResponse.json({ error: 'Devis introuvable' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()

    const result = UpdateDevisSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: result.error.format() },
        { status: 400 }
      )
    }

    const { ok, resultat } = await DevisUseCases.update(id, body)
    
    // Invalide le cache PDF associé
    invalidatePdfCache(id)

    return NextResponse.json({ ok, resultat })
  } catch (error: any) {
    console.error('Erreur lors du PUT devis:', error)
    if (error.message.includes('modifié par un autre utilisateur')) {
      return NextResponse.json({ error: error.message }, { status: 409 })
    }
    if (error.message === 'Devis introuvable') {
      return NextResponse.json({ error: 'Devis introuvable' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Erreur lors de la mise à jour du devis' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await DevisUseCases.delete(id)
  invalidatePdfCache(id)
  return NextResponse.json({ ok: true })
}
