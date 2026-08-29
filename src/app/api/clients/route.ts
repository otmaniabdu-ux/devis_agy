import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { CreateClientSchema } from '@/lib/validation/clientSchemas'

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
  try {
    const body = await req.json()
    
    // Validation Zod
    const result = CreateClientSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: result.error.format() },
        { status: 400 }
      )
    }

    const validData = result.data

    const client = await db.client.create({
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
    
    return NextResponse.json(client, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
