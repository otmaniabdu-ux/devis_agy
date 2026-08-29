import { NextRequest, NextResponse } from 'next/server'
import { CompagnieUseCases } from '@/application/catalogues/CatalogueUseCases'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  const compagnies = await CompagnieUseCases.list()
  return NextResponse.json(compagnies)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const c = await CompagnieUseCases.create(body)
  return NextResponse.json(c, { status: 201 })
}
