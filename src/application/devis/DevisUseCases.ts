import { db } from '@/lib/db'
import { CreateDevisInput, UpdateDevisInput } from '@/lib/validation/devisSchemas'
import { buildDevisCreateData, buildDevisUpdateData, buildChildLines } from '@/lib/devisPayload'
import { RecalculerDevisUseCase } from '@/application/RecalculerDevisUseCase'
import { verifierAlertePasseport } from '@/lib/business'
import { AuditUseCases } from '@/application/audit/AuditUseCases'
import { NumerotationService } from '@/application/numerotation/NumerotationService'

export class DevisUseCases {
  static async list() {
    const devis = await db.devis.findMany({
      include: {
        client: true,
        passagers: true,
        hebergements: { select: { id: true, hotelNom: true, ville: true } },
        facture: { select: { id: true, numero: true, statut: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    
    // Projection: remove passports and compute alerte
    return devis.map((d) => {
      const hasAlerte = d.passagers.some((p) =>
        p.passeportExpiration && verifierAlertePasseport(p.passeportExpiration, d.dateRetour).alerte
      )
      
      const safePassagers = d.passagers.map(p => {
        const { passeportNumero: _passeportNumero, ...safe } = p
        return safe
      })
      
      return { ...d, passagers: safePassagers, hasAlertePasseport: hasAlerte }
    })
  }

  static async getById(id: string) {
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
        campsMashair: true,
        transportsMashair: true,
      },
    })
    if (!devis) throw new Error('Devis introuvable')

    const resultat = await RecalculerDevisUseCase.execute(devis.id)
    
    // Add passager alertes
    const passagersAvecAlerte = devis.passagers.map((p) => ({
      ...p,
      alertePasseport: p.passeportExpiration
        ? verifierAlertePasseport(p.passeportExpiration, devis.dateRetour)
        : { alerte: false },
    }))

    return { ...devis, passagers: passagersAvecAlerte, _resultatCalcul: resultat }
  }

  static async create(body: CreateDevisInput) {
    const data = await buildDevisCreateData(body)

    // Création + recalcul des totaux dans une seule transaction :
    // en cas d'échec du recalcul, le devis orphelin est rollbacké.
    const devisId = await db.$transaction(async (tx) => {
      const devis = await tx.devis.create({ data })
      await RecalculerDevisUseCase.execute(devis.id, tx)
      return devis.id
    })

    await AuditUseCases.log('CREATE_DEVIS', 'Devis', devisId)
    return this.getById(devisId)
  }

  static async update(id: string, body: UpdateDevisInput) {
    // 1. Optimistic locking
    const existingDevis = await db.devis.findUnique({ where: { id }, select: { updatedAt: true } })
    if (!existingDevis) throw new Error('Devis introuvable')
    if (body.updatedAt && new Date(body.updatedAt).getTime() !== existingDevis.updatedAt.getTime()) {
      throw new Error('Le devis a été modifié par un autre utilisateur. Veuillez recharger la page.')
    }

    let resultat
    await db.$transaction(async (tx) => {
      const data = buildDevisUpdateData(body)
      if (Object.keys(data).length > 0) {
        await tx.devis.update({ where: { id }, data })
      }

      const childs = buildChildLines(body, id)
      
      if (childs.passagers !== null) {
        await tx.passager.deleteMany({ where: { devisId: id } })
        if (childs.passagers.length > 0) await tx.passager.createMany({ data: childs.passagers })
      }
      
      if (childs.segmentsVol !== null) {
        await tx.segmentVol.deleteMany({ where: { devisId: id } })
        if (childs.segmentsVol.length > 0) await tx.segmentVol.createMany({ data: childs.segmentsVol })
      }
      
      if (childs.hebergements !== null) {
        await tx.hebergement.deleteMany({ where: { devisId: id } })
        if (childs.hebergements.length > 0) {
          for (const h of childs.hebergements) await tx.hebergement.create({ data: h })
        }
      }
      
      if (childs.transferts !== null) {
        await tx.transfert.deleteMany({ where: { devisId: id } })
        if (childs.transferts.length > 0) await tx.transfert.createMany({ data: childs.transferts })
      }

      if (childs.trainsHaramain !== null) {
        await tx.trainHaramain.deleteMany({ where: { devisId: id } })
        if (childs.trainsHaramain.length > 0) {
          for (const t of childs.trainsHaramain) await tx.trainHaramain.create({ data: t })
        }
      }

      if (childs.prestationsVip !== null) {
        await tx.prestationVIP.deleteMany({ where: { devisId: id } })
        if (childs.prestationsVip.length > 0) await tx.prestationVIP.createMany({ data: childs.prestationsVip })
      }

      if (childs.campsMashair !== null) {
        await tx.campMashair.deleteMany({ where: { devisId: id } })
        if (childs.campsMashair.length > 0) await tx.campMashair.createMany({ data: childs.campsMashair })
      }

      if (childs.transportsMashair !== null) {
        await tx.transportMashair.deleteMany({ where: { devisId: id } })
        if (childs.transportsMashair.length > 0) await tx.transportMashair.createMany({ data: childs.transportsMashair })
      }

      resultat = await RecalculerDevisUseCase.execute(id, tx)
    })
    
    await AuditUseCases.log('UPDATE_DEVIS', 'Devis', id)

    return { ok: true, resultat }
  }

  static async delete(id: string) {
    await db.devis.delete({ where: { id } })
    await AuditUseCases.log('DELETE_DEVIS', 'Devis', id)
    return true
  }

  static async duplicate(id: string) {
    const existing = await db.devis.findUnique({
      where: { id },
      include: {
        passagers: true,
        segmentsVol: true,
        hebergements: true,
        transferts: true,
        trainsHaramain: true,
        prestationsVip: true,
        campsMashair: true,
        transportsMashair: true,
      },
    })
    if (!existing) throw new Error('Devis introuvable')

    const nouveauNumero = await NumerotationService.attribuerNumero()

    const newDevis = await db.$transaction(async (tx) => {
      const created = await tx.devis.create({
        data: {
          numero: nouveauNumero,
          clientId: existing.clientId,
          dateDepart: existing.dateDepart,
          dateRetour: existing.dateRetour,
          tauxSarDzd: existing.tauxSarDzd,
          tauxUsdDzd: existing.tauxUsdDzd,
          tauxEurDzd: existing.tauxEurDzd,
          visaType: existing.visaType,
          visaPrixUnit: existing.visaPrixUnit,
          visaDevise: existing.visaDevise,
          assurancePrixUnit: existing.assurancePrixUnit,
          assuranceDevise: existing.assuranceDevise,
          fraisOnpoPrixUnit: existing.fraisOnpoPrixUnit,
          fraisOnpoDevise: existing.fraisOnpoDevise,
          margeType: existing.margeType,
          margeValeur: existing.margeValeur,
          coutNetDzd: existing.coutNetDzd,
          prixVenteDzd: existing.prixVenteDzd,
          margeMontantDzd: existing.margeMontantDzd,
          statut: 'brouillon',
          notesInternes: existing.notesInternes ? `[Copie de ${existing.numero}] ${existing.notesInternes}` : `[Copie de ${existing.numero}]`,
          notesClient: existing.notesClient,
        },
      })

      if (existing.passagers.length > 0) {
        await tx.passager.createMany({
          data: existing.passagers.map((p) => ({
            devisId: created.id,
            categorie: p.categorie,
            nom: p.nom,
            prenom: p.prenom,
            dateNaissance: p.dateNaissance,
            passeportNumero: p.passeportNumero,
            passeportExpiration: p.passeportExpiration,
          })),
        })
      }

      if (existing.segmentsVol.length > 0) {
        await tx.segmentVol.createMany({
          data: existing.segmentsVol.map((s) => ({
            devisId: created.id,
            ordre: s.ordre,
            compagnieId: s.compagnieId,
            origine: s.origine,
            destination: s.destination,
            dateVol: s.dateVol,
            classe: s.classe,
            origineRetour: s.origineRetour,
            destinationRetour: s.destinationRetour,
            dateVolRetour: s.dateVolRetour,
            classeRetour: s.classeRetour,
            prixAdulte: s.prixAdulte,
            prixEnfant: s.prixEnfant,
            prixBebe: s.prixBebe,
            devise: s.devise,
          })),
        })
      }

      if (existing.hebergements.length > 0) {
        await tx.hebergement.createMany({
          data: existing.hebergements.map((h) => ({
            devisId: created.id,
            ville: h.ville,
            hotelId: h.hotelId,
            hotelNom: h.hotelNom,
            typeChambre: h.typeChambre,
            formuleRepas: h.formuleRepas,
            vue: h.vue,
            dateCheckin: h.dateCheckin,
            dateCheckout: h.dateCheckout,
            nbNuitees: h.nbNuitees,
            prixNuitChambre: h.prixNuitChambre,
            nbChambres: h.nbChambres,
            devise: h.devise,
          })),
        })
      }

      if (existing.transferts.length > 0) {
        await tx.transfert.createMany({
          data: existing.transferts.map((t) => ({
            devisId: created.id,
            ordre: t.ordre,
            trajet: t.trajet,
            typeVehicule: t.typeVehicule,
            prix: t.prix,
            devise: t.devise,
            obligatoire: t.obligatoire,
          })),
        })
      }

      if (existing.trainsHaramain.length > 0) {
        await tx.trainHaramain.createMany({
          data: existing.trainsHaramain.map((t) => ({
            devisId: created.id,
            trajet: t.trajet,
            classe: t.classe,
            dateTrain: t.dateTrain,
            prixAdulte: t.prixAdulte,
            prixEnfant: t.prixEnfant,
            devise: t.devise,
          })),
        })
      }

      if (existing.prestationsVip.length > 0) {
        await tx.prestationVIP.createMany({
          data: existing.prestationsVip.map((p) => ({
            devisId: created.id,
            type: p.type,
            descriptionFr: p.descriptionFr,
            descriptionAr: p.descriptionAr,
            prix: p.prix,
            devise: p.devise,
          })),
        })
      }

      if (existing.campsMashair.length > 0) {
        await tx.campMashair.createMany({
          data: existing.campsMashair.map((c) => ({
            devisId: created.id,
            nomCamp: c.nomCamp,
            typeTente: c.typeTente,
            restauration: c.restauration,
            prixAdulte: c.prixAdulte,
            prixEnfant: c.prixEnfant,
            devise: c.devise,
          })),
        })
      }

      if (existing.transportsMashair.length > 0) {
        await tx.transportMashair.createMany({
          data: existing.transportsMashair.map((t) => ({
            devisId: created.id,
            typeVehicule: t.typeVehicule,
            trajet: t.trajet,
            prix: t.prix,
            typePrix: t.typePrix,
            devise: t.devise,
          })),
        })
      }

      await RecalculerDevisUseCase.execute(created.id, tx)
      return created
    })

    await AuditUseCases.log('DUPLICATE_DEVIS', 'Devis', newDevis.id)
    return this.getById(newDevis.id)
  }
}

