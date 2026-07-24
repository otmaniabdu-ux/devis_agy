import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  const clients = await db.client.findMany({
    include: { _count: { select: { devis: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(clients)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const client = await db.client.create({
    data: {
      type: body.type ?? 'particulier',
      nom: body.nom,
      prenom: body.prenom ?? null,
      raisonSociale: body.raisonSociale ?? null,
      telephone: body.telephone ?? null,
      email: body.email ?? null,
      adresse: body.adresse ?? null,
      notes: body.notes ?? null,
    },
  })
  return NextResponse.json(client, { status: 201 })
}
