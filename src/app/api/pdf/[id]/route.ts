import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { type DevisForPdf } from '@/lib/pdfDocument'
import { recalculerDevis, persisterTotaux } from '@/lib/calculDevis'
import { generateOptimizedPdf } from '@/lib/pdfRenderer'

export const dynamic = 'force-dynamic'

// GET /api/pdf/[id]?variante=client|interne
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { searchParams } = new URL(req.url)
  const variante = (searchParams.get('variante') ?? 'client') as 'client' | 'interne'

  const devis = await db.devis.findUnique({
    where: { id },
    select: { id: true, numero: true },
  })
  if (!devis) return NextResponse.json({ error: 'Devis introuvable' }, { status: 404 })

  // Recalcule et persiste les totaux avant génération
  const resultat = await recalculerDevis(id)
  await persisterTotaux(id, resultat)

  // Re-fetch le devis avec les totaux à jour et les paramètres
  const [devisUpdated, parametres] = await Promise.all([
    db.devis.findUnique({
      where: { id },
      include: {
        client: true,
        passagers: true,
        segmentsVol: { include: { compagnie: true } },
        hebergements: { include: { hotel: true } },
        transferts: true,
        trainsHaramain: true,
        prestationsVip: true,
      },
    }),
    db.parametresAgence.findUnique({ where: { id: 'default' } }),
  ])

  if (!devisUpdated) return NextResponse.json({ error: 'Devis introuvable' }, { status: 404 })

  const devisForPdf: DevisForPdf = {
    ...devisUpdated,
    dateDepart: devisUpdated.dateDepart.toISOString(),
    dateRetour: devisUpdated.dateRetour.toISOString(),
    parametres: parametres ?? undefined,
    _resultatCalcul: resultat,
  } as DevisForPdf

  // Clé de cache composite unique (devisId + variante + timestamps)
  const devisTs = devisUpdated.updatedAt?.getTime() ?? Date.now()
  const paramTs = parametres?.updatedAt?.getTime() ?? 0
  const cacheKey = `${id}:${variante}:${devisTs}:${paramTs}`

  try {
    const pdfBuffer = await generateOptimizedPdf(devisForPdf, variante, cacheKey)
    const filename = `${devis.numero}_${variante === 'client' ? 'client' : 'interne'}.pdf`

    return new NextResponse(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': 'private, no-transform, max-age=60',
      },
    })
  } catch (err: any) {
    console.error('Erreur génération PDF:', err)
    return NextResponse.json({ error: 'Erreur lors de la génération du PDF' }, { status: 500 })
  }
}

