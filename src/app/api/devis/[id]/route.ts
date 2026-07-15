import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { recalculerDevis, persisterTotaux } from '@/lib/calculDevis'
import { verifierAlertePasseport } from '@/lib/business'

// GET /api/devis/[id] — détail complet d'un devis avec toutes ses lignes
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
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

  // Recalcule les totaux à la volée (synchronise aussi la DB)
  const resultat = await recalculerDevis(devis.id)
  await persisterTotaux(devis.id, resultat)

  const fullDevis = await db.devis.findUnique({
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

  // Ajoute les alertes passeport par passager
  const passagersAvecAlerte = fullDevis!.passagers.map((p) => ({
    ...p,
    alertePasseport: p.passeportExpiration
      ? verifierAlertePasseport(p.passeportExpiration, fullDevis!.dateRetour)
      : { alerte: false },
  }))

  return NextResponse.json({ ...fullDevis, passagers: passagersAvecAlerte, _resultatCalcul: resultat })
}

// PUT /api/devis/[id] — met à jour un devis (statut, marges, lignes)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()

  // Update des champs scalaires du devis
  const updateData: any = {}
  const allowedFields = [
    'statut', 'notesInternes', 'notesClient', 'margeType', 'margeValeur',
    'visaType', 'visaPrixUnit', 'visaDevise',
    'assurancePrixUnit', 'assuranceDevise',
    'dateDepart', 'dateRetour',
  ]
  for (const f of allowedFields) {
    if (body[f] !== undefined) {
      if (f === 'dateDepart' || f === 'dateRetour') {
        updateData[f] = new Date(body[f])
      } else if (['visaPrixUnit', 'assurancePrixUnit', 'margeValeur'].includes(f)) {
        updateData[f] = String(body[f])
      } else {
        updateData[f] = body[f]
      }
    }
  }

  await db.devis.update({ where: { id }, data: updateData })

  // Update des lignes enfants si fournies
  if (body.passagers !== undefined) {
    await db.passager.deleteMany({ where: { devisId: id } })
    if (body.passagers.length > 0) {
      await db.passager.createMany({
        data: body.passagers.map((p: any) => ({
          ...p,
          devisId: id,
          dateNaissance: p.dateNaissance ? new Date(p.dateNaissance) : null,
          passeportExpiration: p.passeportExpiration ? new Date(p.passeportExpiration) : null,
        })),
      })
    }
  }

  if (body.segmentsVol !== undefined) {
    await db.segmentVol.deleteMany({ where: { devisId: id } })
    if (body.segmentsVol.length > 0) {
      await db.segmentVol.createMany({
        data: body.segmentsVol.map((s: any, i: number) => ({
          ...s,
          devisId: id,
          ordre: i,
          dateVol: new Date(s.dateVol),
          prixAdulte: String(s.prixAdulte ?? '0'),
          prixEnfant: String(s.prixEnfant ?? '0'),
          prixBebe: String(s.prixBebe ?? '0'),
        })),
      })
    }
  }

  if (body.hebergements !== undefined) {
    await db.hebergement.deleteMany({ where: { devisId: id } })
    if (body.hebergements.length > 0) {
      for (const h of body.hebergements) {
        const ci = new Date(h.dateCheckin)
        const co = new Date(h.dateCheckout)
        const nbNuit = Math.max(0, Math.round((co.getTime() - ci.getTime()) / 86400000))
        await db.hebergement.create({
          data: {
            ...h,
            devisId: id,
            dateCheckin: ci,
            dateCheckout: co,
            nbNuitees: nbNuit,
            prixNuitChambre: String(h.prixNuitChambre ?? '0'),
          },
        })
      }
    }
  }

  if (body.transferts !== undefined) {
    await db.transfert.deleteMany({ where: { devisId: id } })
    if (body.transferts.length > 0) {
      await db.transfert.createMany({
        data: body.transferts.map((t: any, i: number) => ({
          ...t,
          devisId: id,
          ordre: i,
          prix: String(t.prix ?? '0'),
        })),
      })
    }
  }

  if (body.trainsHaramain !== undefined) {
    await db.trainHaramain.deleteMany({ where: { devisId: id } })
    if (body.trainsHaramain.length > 0) {
      for (const t of body.trainsHaramain) {
        await db.trainHaramain.create({
          data: {
            ...t,
            devisId: id,
            dateTrain: new Date(t.dateTrain),
            prixAdulte: String(t.prixAdulte ?? '0'),
            prixEnfant: String(t.prixEnfant ?? '0'),
          },
        })
      }
    }
  }

  if (body.prestationsVip !== undefined) {
    await db.prestationVIP.deleteMany({ where: { devisId: id } })
    if (body.prestationsVip.length > 0) {
      await db.prestationVIP.createMany({
        data: body.prestationsVip.map((p: any) => ({
          ...p,
          devisId: id,
          prix: String(p.prix ?? '0'),
        })),
      })
    }
  }

  // Recalcule et persiste les totaux
  const resultat = await recalculerDevis(id)
  await persisterTotaux(id, resultat)

  return NextResponse.json({ ok: true, resultat })
}

// DELETE /api/devis/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await db.devis.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
