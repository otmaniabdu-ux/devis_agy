import { NextRequest, NextResponse } from 'next/server'
import { CreateDevisSchema } from '@/lib/validation/devisSchemas'
import { DevisUseCases } from '@/application/devis/DevisUseCases'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  const result = await DevisUseCases.list()
  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Validation Zod
    const result = CreateDevisSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: result.error.format() },
        { status: 400 }
      )
    }

    const fullDevis = await DevisUseCases.create(result.data)
    return NextResponse.json(fullDevis, { status: 201 })
  } catch (error) {
    console.error('Erreur POST /devis:', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
