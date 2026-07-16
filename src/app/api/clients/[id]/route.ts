import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

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
  const { id } = await params
  const body = await req.json()
  const client = await db.client.update({
    where: { id },
    data: {
      type: body.type,
      nom: body.nom,
      prenom: body.prenom ?? null,
      raisonSociale: body.raisonSociale ?? null,
      telephone: body.telephone ?? null,
      email: body.email ?? null,
      adresse: body.adresse ?? null,
      notes: body.notes ?? null,
    },
  })
  return NextResponse.json(client)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await db.client.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
