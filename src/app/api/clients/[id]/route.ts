import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { UpdateClientSchema } from '@/lib/validation/clientSchemas'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const client = await db.client.findUnique({
    where: { id },
    include: { devis: { orderBy: { createdAt: 'desc' } } },
  })
  if (!client) return NextResponse.json({ error: 'Client introuvable' }, { status: 404 })
  return NextResponse.json(client)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    
    // Validation Zod
    const result = UpdateClientSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: result.error.format() },
        { status: 400 }
      )
    }

    const validData = result.data

    const client = await db.client.update({
      where: { id },
      data: {
        type: validData.type,
        nom: validData.nom,
        prenom: validData.prenom ?? null,
        raisonSociale: validData.raisonSociale ?? null,
        telephone: validData.telephone ?? null,
        email: validData.email ?? null,
        adresse: validData.adresse ?? null,
        notes: validData.notes ?? null,
      },
    })
    return NextResponse.json(client)
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.client.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 })
  }
}
