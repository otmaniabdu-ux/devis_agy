import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { recalculerDevis, persisterTotaux } from '@/lib/calculDevis'
import { verifierAlertePasseport } from '@/lib/business'
import { buildDevisUpdateData, buildChildLines } from '@/lib/devisPayload'
import { invalidatePdfCache } from '@/lib/pdfRenderer'

const FULL_INCLUDE = {
  client: true,
  passagers: true,
  segmentsVol: { include: { compagnie: true } },
  hebergements: { include: { hotel: true } },
  transferts: true,
  trainsHaramain: true,
  prestationsVip: true,
  campsMashair: true,
  transportsMashair: true,
}

// GET /api/devis/[id]
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const devis = await db.devis.findUnique({ where: { id }, include: FULL_INCLUDE })
  if (!devis) return NextResponse.json({ error: 'Devis introuvable' }, { status: 404 })

  // Recalcule + persiste les totaux à la volée
  const resultat = await recalculerDevis(devis.id)
  await persisterTotaux(devis.id, resultat)

  const fullDevis = await db.devis.findUnique({ where: { id }, include: FULL_INCLUDE })
  const passagersAvecAlerte = fullDevis!.passagers.map((p) => ({
    ...p,
    alertePasseport: p.passeportExpiration
      ? verifierAlertePasseport(p.passeportExpiration, fullDevis!.dateRetour)
      : { alerte: false },
  }))

  return NextResponse.json({ ...fullDevis, passagers: passagersAvecAlerte, _resultatCalcul: resultat })
}

// PUT /api/devis/[id]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()

  // 1. Update des champs scalaires
  const updateData = buildDevisUpdateData(body)
  if (Object.keys(updateData).length > 0) {
    await db.devis.update({ where: { id }, data: updateData })
  }

  // 2. Update des lignes enfants (supprime puis recrée si fournies)
  const children = buildChildLines(body, id)

  if (children.passagers !== null) {
    await db.passager.deleteMany({ where: { devisId: id } })
    if (children.passagers.length > 0) {
      await db.passager.createMany({ data: children.passagers })
    }
  }
  if (children.segmentsVol !== null) {
    await db.segmentVol.deleteMany({ where: { devisId: id } })
    if (children.segmentsVol.length > 0) {
      await db.segmentVol.createMany({ data: children.segmentsVol })
    }
  }
  if (children.hebergements !== null) {
    await db.hebergement.deleteMany({ where: { devisId: id } })
    for (const h of children.hebergements) {
      await db.hebergement.create({ data: h })
    }
  }
  if (children.transferts !== null) {
    await db.transfert.deleteMany({ where: { devisId: id } })
    if (children.transferts.length > 0) {
      await db.transfert.createMany({ data: children.transferts })
    }
  }
  if (children.trainsHaramain !== null) {
    await db.trainHaramain.deleteMany({ where: { devisId: id } })
    for (const t of children.trainsHaramain) {
      await db.trainHaramain.create({ data: t })
    }
  }
  if (children.prestationsVip !== null) {
    await db.prestationVIP.deleteMany({ where: { devisId: id } })
    if (children.prestationsVip.length > 0) {
      await db.prestationVIP.createMany({ data: children.prestationsVip })
    }
  }
  if (children.campsMashair !== null) {
    await db.campMashair.deleteMany({ where: { devisId: id } })
    if (children.campsMashair.length > 0) {
      await db.campMashair.createMany({ data: children.campsMashair })
    }
  }
  if (children.transportsMashair !== null) {
    await db.transportMashair.deleteMany({ where: { devisId: id } })
    if (children.transportsMashair.length > 0) {
      await db.transportMashair.createMany({ data: children.transportsMashair })
    }
  }

  // 3. Recalcule et persiste les totaux
  const resultat = await recalculerDevis(id)
  await persisterTotaux(id, resultat)

  // Invalide le cache PDF associé
  invalidatePdfCache(id)

  return NextResponse.json({ ok: true, resultat })
}

// DELETE /api/devis/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await db.devis.delete({ where: { id } })
  invalidatePdfCache(id)
  return NextResponse.json({ ok: true })
}
