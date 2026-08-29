import { NextRequest, NextResponse } from 'next/server'
import { ParametresUseCases } from '@/application/parametres/ParametresUseCases'

export async function GET() {
  const result = await ParametresUseCases.get()
  return NextResponse.json(result)
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  await ParametresUseCases.update(body)
  return NextResponse.json({ ok: true })
}
