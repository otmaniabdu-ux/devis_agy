import { NextRequest, NextResponse } from 'next/server'
import { UpdateClientSchema } from '@/lib/validation/clientSchemas'
import { ClientUseCases } from '@/application/clients/ClientUseCases'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const client = await ClientUseCases.getById(id)
    return NextResponse.json(client)
  } catch (error) {
    return NextResponse.json({ error: 'Client introuvable' }, { status: 404 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const result = UpdateClientSchema.safeParse(body)
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: result.error.format() },
        { status: 400 }
      )
    }

    const client = await ClientUseCases.update(id, result.data)
    return NextResponse.json(client)
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await ClientUseCases.delete(id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 })
  }
}
