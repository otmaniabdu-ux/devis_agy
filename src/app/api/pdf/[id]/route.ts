import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import { DevisDocument, type DevisForPdf } from '@/lib/pdfDocument'
import { recalculerDevis, persisterTotaux } from '@/lib/calculDevis'

// GET /api/pdf/[id]?variante=client|interne
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { searchParams } = new URL(req.url)
  const variante = (searchParams.get('variante') ?? 'client') as 'client' | 'interne'

  const devis = await db.devis.findUnique({
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
  })
  if (!devis) return NextResponse.json({ error: 'Devis introuvable' }, { status: 404 })

  // Recalcule et persiste les totaux avant génération
  const resultat = await recalculerDevis(id)
  await persisterTotaux(id, resultat)

  // Re-fetch le devis avec les totaux à jour
  const devisUpdated = await db.devis.findUnique({
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
  })
  if (!devisUpdated) return NextResponse.json({ error: 'Devis introuvable' }, { status: 404 })

  const parametres = await db.parametresAgence.findUnique({ where: { id: 'default' } })

  const devisForPdf: DevisForPdf = {
    ...devisUpdated,
    dateDepart: devisUpdated.dateDepart.toISOString(),
    dateRetour: devisUpdated.dateRetour.toISOString(),
    parametres: parametres ?? undefined,
    _resultatCalcul: resultat,
  } as DevisForPdf

  const element = createElement(DevisDocument, { devis: devisForPdf, variante })
  const pdfBuffer = await renderToBuffer(element as any)

  const filename = `${devis.numero}_${variante === 'client' ? 'client' : 'interne'}.pdf`
  return new NextResponse(pdfBuffer as any, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
    },
  })
}
