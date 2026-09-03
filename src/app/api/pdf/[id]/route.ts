import { NextRequest, NextResponse } from 'next/server'
import { GeneratePdfUseCase } from '@/application/pdf/GeneratePdfUseCase'
import { getErrorMessage } from '@/lib/errors'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { searchParams } = new URL(req.url)
    const variante = (searchParams.get('variante') ?? 'client') as 'client' | 'interne' | 'programme'

    const { pdfBuffer, filename } = await GeneratePdfUseCase.execute(id, variante)

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': 'private, no-transform, max-age=60',
      },
    })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Devis introuvable') {
      return NextResponse.json({ error: 'Devis introuvable' }, { status: 404 })
    }
    console.error('Erreur génération PDF:', getErrorMessage(error))
    return NextResponse.json({ error: 'Erreur lors de la génération du PDF' }, { status: 500 })
  }
}

