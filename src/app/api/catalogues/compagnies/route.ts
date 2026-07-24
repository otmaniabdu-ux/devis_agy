import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  const compagnies = await db.catalogueCompagnie.findMany({
    orderBy: { nom: 'asc' },
  })
  return NextResponse.json(compagnies)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const c = await db.catalogueCompagnie.create({
    data: {
      nom: body.nom,
      codeIata: body.codeIata ?? null,
      actif: body.actif ?? true,
    },
  })
  return NextResponse.json(c, { status: 201 })
}
