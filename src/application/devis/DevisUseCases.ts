import { db } from '@/lib/db'
import { z } from 'zod'
import { CreateDevisSchema, UpdateDevisSchema } from '@/lib/validation/devisSchemas'
import { buildDevisCreateData, buildDevisUpdateData, buildChildLines } from '@/lib/devisPayload'
import { RecalculerDevisUseCase } from '@/application/RecalculerDevisUseCase'
import { verifierAlertePasseport } from '@/lib/business'
import { AuditUseCases } from '@/application/audit/AuditUseCases'

export class DevisUseCases {
  static async list() {
    const devis = await db.devis.findMany({
      include: { client: true, passagers: true },
      orderBy: { createdAt: 'desc' },
    })
    
    // Projection: remove passports and compute alerte
    return devis.map((d) => {
      const hasAlerte = d.passagers.some((p) =>
        p.passeportExpiration && verifierAlertePasseport(p.passeportExpiration, d.dateRetour).alerte
      )
      
      const safePassagers = d.passagers.map(p => {
        const { passeportNumero, ...safe } = p
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

  static async create(body: any) {
    const data = await buildDevisCreateData(body)
    const devis = await db.devis.create({ data })
    await RecalculerDevisUseCase.execute(devis.id)
    await AuditUseCases.log('CREATE_DEVIS', 'Devis', devis.id)
    return this.getById(devis.id)
  }

  static async update(id: string, body: any) {
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
}
