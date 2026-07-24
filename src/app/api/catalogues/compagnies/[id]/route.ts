import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const c = await db.catalogueCompagnie.update({
    where: { id },
    data: {
      nom: body.nom,
      codeIata: body.codeIata ?? null,
      actif: body.actif ?? true,
    },
  })
  return NextResponse.json(c)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await db.catalogueCompagnie.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
