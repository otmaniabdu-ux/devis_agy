import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { recalculerDevis, persisterTotaux } from '@/lib/calculDevis'
import { verifierAlertePasseport } from '@/lib/business'

// Helper : parse une date de façon robuste. Retourne null si invalide.
function safeDate(v: any): Date | null {
  if (!v) return null
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v
  const s = String(v).trim()
  if (!s) return null
  // Si c'est juste une date YYYY-MM-DD, on ajoute T00:00:00 pour avoir un ISO valide
  let dateStr = s
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    dateStr = `${s}T00:00:00.000Z`
  }
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? null : d
}

// Helper : vérifie si une ligne enfant est "vide" (à ignorer)
function isSegmentVolEmpty(s: any): boolean {
  return !s.origine && !s.destination && !s.dateVol
}
function isHebergementEmpty(h: any): boolean {
  return !h.hotelNom && !h.dateCheckin && !h.dateCheckout
}
function isTransfertEmpty(t: any): boolean {
  return !t.trajet
}
function isTrainEmpty(t: any): boolean {
  return !t.trajet && !t.dateTrain
}
function isPrestationEmpty(p: any): boolean {
  return !p.descriptionFr && !p.type
}

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

// PUT /api/devis/[id] — met à jour un devis (statut, marges, lignes, taux)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()

  // Update des champs scalaires du devis
  const updateData: any = {}

  // Champs scalaires simples
  const allowedFields = [
    'statut', 'notesInternes', 'notesClient', 'margeType', 'visaType', 'visaDevise',
    'assuranceDevise', 'dateDepart', 'dateRetour',
  ]
  for (const f of allowedFields) {
    if (body[f] !== undefined) {
      if (f === 'dateDepart' || f === 'dateRetour') {
        const d = safeDate(body[f])
        if (d) updateData[f] = d
      } else {
        updateData[f] = body[f]
      }
    }
  }

  // Champs monétaires (string)
  if (body.margeValeur !== undefined) updateData.margeValeur = String(body.margeValeur)
  if (body.visaPrixUnit !== undefined) updateData.visaPrixUnit = String(body.visaPrixUnit)
  if (body.assurancePrixUnit !== undefined) updateData.assurancePrixUnit = String(body.assurancePrixUnit)

  // Taux de change verrouillés (modifiables uniquement si fournis explicitement)
  if (body.tauxSarDzd !== undefined) updateData.tauxSarDzd = String(body.tauxSarDzd)
  if (body.tauxUsdDzd !== undefined) updateData.tauxUsdDzd = String(body.tauxUsdDzd)
  if (body.tauxEurDzd !== undefined) updateData.tauxEurDzd = String(body.tauxEurDzd)

  if (Object.keys(updateData).length > 0) {
    await db.devis.update({ where: { id }, data: updateData })
  }

  // Update des lignes enfants si fournies (en filtrant les lignes vides)
  if (body.passagers !== undefined) {
    await db.passager.deleteMany({ where: { devisId: id } })
    const validPassagers = (body.passagers as any[]).filter((p) => p.nom || p.prenom)
    if (validPassagers.length > 0) {
      await db.passager.createMany({
        data: validPassagers.map((p: any) => ({
          devisId: id,
          categorie: p.categorie || 'adulte',
          nom: p.nom || '',
          prenom: p.prenom ?? '',
          dateNaissance: safeDate(p.dateNaissance),
          passeportNumero: p.passeportNumero || null,
          passeportExpiration: safeDate(p.passeportExpiration),
        })),
      })
    }
  }

  if (body.segmentsVol !== undefined) {
    await db.segmentVol.deleteMany({ where: { devisId: id } })
    const validSegments = (body.segmentsVol as any[]).filter((s) => !isSegmentVolEmpty(s))
    if (validSegments.length > 0) {
      await db.segmentVol.createMany({
        data: validSegments.map((s: any, i: number) => {
          const dateVol = safeDate(s.dateVol) ?? new Date()
          return {
            devisId: id,
            ordre: i,
            origine: s.origine || '',
            destination: s.destination || '',
            dateVol,
            classe: s.classe ?? 'economique',
            compagnieId: s.compagnieId || null,
            prixAdulte: String(s.prixAdulte ?? '0'),
            prixEnfant: String(s.prixEnfant ?? '0'),
            prixBebe: String(s.prixBebe ?? '0'),
            devise: s.devise ?? 'SAR',
          }
        }),
      })
    }
  }

  if (body.hebergements !== undefined) {
    await db.hebergement.deleteMany({ where: { devisId: id } })
    const validHebergements = (body.hebergements as any[]).filter((h) => !isHebergementEmpty(h))
    if (validHebergements.length > 0) {
      for (const h of validHebergements) {
        const ci = safeDate(h.dateCheckin) ?? new Date()
        const co = safeDate(h.dateCheckout) ?? new Date()
        const nbNuit = Math.max(0, Math.round((co.getTime() - ci.getTime()) / 86400000))
        await db.hebergement.create({
          data: {
            devisId: id,
            ville: h.ville || 'Makkah',
            hotelId: h.hotelId || null,
            hotelNom: h.hotelNom || '',
            typeChambre: h.typeChambre ?? 'double',
            formuleRepas: h.formuleRepas ?? 'demi_pension',
            vue: h.vue ?? 'city',
            dateCheckin: ci,
            dateCheckout: co,
            nbNuitees: nbNuit,
            nbChambres: h.nbChambres ?? 1,
            prixNuitChambre: String(h.prixNuitChambre ?? '0'),
            devise: h.devise ?? 'SAR',
          },
        })
      }
    }
  }

  if (body.transferts !== undefined) {
    await db.transfert.deleteMany({ where: { devisId: id } })
    const validTransferts = (body.transferts as any[]).filter((t) => !isTransfertEmpty(t))
    if (validTransferts.length > 0) {
      await db.transfert.createMany({
        data: validTransferts.map((t: any, i: number) => ({
          devisId: id,
          ordre: i,
          trajet: t.trajet,
          typeVehicule: t.typeVehicule ?? 'GMC_Yukon',
          prix: String(t.prix ?? '0'),
          devise: t.devise ?? 'SAR',
          obligatoire: t.obligatoire ?? true,
        })),
      })
    }
  }

  if (body.trainsHaramain !== undefined) {
    await db.trainHaramain.deleteMany({ where: { devisId: id } })
    const validTrains = (body.trainsHaramain as any[]).filter((t) => !isTrainEmpty(t))
    if (validTrains.length > 0) {
      for (const t of validTrains) {
        const dateTrain = safeDate(t.dateTrain) ?? new Date()
        await db.trainHaramain.create({
          data: {
            devisId: id,
            trajet: t.trajet,
            classe: t.classe ?? 'economique',
            dateTrain,
            prixAdulte: String(t.prixAdulte ?? '0'),
            prixEnfant: String(t.prixEnfant ?? '0'),
            devise: t.devise ?? 'SAR',
          },
        })
      }
    }
  }

  if (body.prestationsVip !== undefined) {
    await db.prestationVIP.deleteMany({ where: { devisId: id } })
    const validPrestations = (body.prestationsVip as any[]).filter((p) => !isPrestationEmpty(p))
    if (validPrestations.length > 0) {
      await db.prestationVIP.createMany({
        data: validPrestations.map((p: any) => ({
          devisId: id,
          type: p.type ?? 'autre',
          descriptionFr: p.descriptionFr || '',
          descriptionAr: p.descriptionAr || null,
          prix: String(p.prix ?? '0'),
          devise: p.devise ?? 'SAR',
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
