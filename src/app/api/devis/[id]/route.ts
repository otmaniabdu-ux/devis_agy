import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { recalculerDevis, persisterTotaux } from '@/lib/calculDevis'
import { verifierAlertePasseport } from '@/lib/business'
import { buildDevisUpdateData, buildChildLines } from '@/lib/devisPayload'
import { invalidatePdfCache } from '@/lib/pdfRenderer'
import { UpdateDevisSchema } from '@/lib/validation/devisSchemas'

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
  try {
    const { id } = await params
    const body = await req.json()

    // Validation Zod
    const result = UpdateDevisSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: result.error.format() },
        { status: 400 }
      )
    }

    // 1. Optimistic locking : vérifier si le updatedAt fourni correspond
    const existingDevis = await db.devis.findUnique({ where: { id }, select: { updatedAt: true } })
    if (!existingDevis) {
      return NextResponse.json({ error: 'Devis introuvable' }, { status: 404 })
    }
    
    // Si le client envoie un updatedAt, on le compare avec la base pour éviter d'écraser des modifs concurrentes
    if (body.updatedAt && new Date(body.updatedAt).getTime() !== existingDevis.updatedAt.getTime()) {
      return NextResponse.json({ error: 'Le devis a été modifié par un autre utilisateur. Veuillez recharger la page.' }, { status: 409 })
    }

    const updateData = buildDevisUpdateData(body)
    const children = buildChildLines(body, id)

    // 2. Transaction atomique (Tâche 2.1)
    await db.$transaction(async (tx) => {
      // 2a. Update des champs scalaires
      if (Object.keys(updateData).length > 0) {
        await tx.devis.update({ where: { id }, data: updateData })
      }

      // 2b. Remplacement atomique des collections enfants
      if (children.passagers !== null) {
        await tx.passager.deleteMany({ where: { devisId: id } })
        if (children.passagers.length > 0) await tx.passager.createMany({ data: children.passagers })
      }
      if (children.segmentsVol !== null) {
        await tx.segmentVol.deleteMany({ where: { devisId: id } })
        if (children.segmentsVol.length > 0) await tx.segmentVol.createMany({ data: children.segmentsVol })
      }
      if (children.hebergements !== null) {
        await tx.hebergement.deleteMany({ where: { devisId: id } })
        for (const h of children.hebergements) await tx.hebergement.create({ data: h })
      }
      if (children.transferts !== null) {
        await tx.transfert.deleteMany({ where: { devisId: id } })
        if (children.transferts.length > 0) await tx.transfert.createMany({ data: children.transferts })
      }
      if (children.trainsHaramain !== null) {
        await tx.trainHaramain.deleteMany({ where: { devisId: id } })
        for (const t of children.trainsHaramain) await tx.trainHaramain.create({ data: t })
      }
      if (children.prestationsVip !== null) {
        await tx.prestationVIP.deleteMany({ where: { devisId: id } })
        if (children.prestationsVip.length > 0) await tx.prestationVIP.createMany({ data: children.prestationsVip })
      }
      if (children.campsMashair !== null) {
        await tx.campMashair.deleteMany({ where: { devisId: id } })
        if (children.campsMashair.length > 0) await tx.campMashair.createMany({ data: children.campsMashair })
      }
      if (children.transportsMashair !== null) {
        await tx.transportMashair.deleteMany({ where: { devisId: id } })
        if (children.transportsMashair.length > 0) await tx.transportMashair.createMany({ data: children.transportsMashair })
      }
    })

    // 3. Recalcule et persiste les totaux (hors transaction car calculDevis utilise l'instance db globale)
    // Note : dans la Phase 3 (Use Cases), le calculateur prendra la transaction en paramètre
    const resultat = await recalculerDevis(id)
    await persisterTotaux(id, resultat)

    // Invalide le cache PDF associé
    invalidatePdfCache(id)

    return NextResponse.json({ ok: true, resultat })
  } catch (error) {
    console.error('Erreur lors du PUT devis:', error)
    return NextResponse.json({ error: 'Erreur lors de la mise à jour du devis' }, { status: 500 })
  }
}

// DELETE /api/devis/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await db.devis.delete({ where: { id } })
  invalidatePdfCache(id)
  return NextResponse.json({ ok: true })
}
