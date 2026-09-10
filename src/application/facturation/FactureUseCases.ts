import { db } from '@/lib/db'
import { D } from '@/lib/money'
import { NumerotationService } from '@/application/numerotation/NumerotationService'
import { AuditUseCases } from '@/application/audit/AuditUseCases'
import { CreateFactureInput, CreateVersementInput } from '@/lib/validation/factureSchemas'

export class FactureUseCases {
  static async list() {
    return db.facture.findMany({
      include: {
        client: true,
        devis: {
          select: {
            id: true,
            numero: true,
            dateDepart: true,
            dateRetour: true,
            statut: true,
            prixVenteDzd: true,
          },
        },
        versements: {
          orderBy: { dateVersement: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  static async getById(id: string) {
    const facture = await db.facture.findUnique({
      where: { id },
      include: {
        client: true,
        devis: {
          include: {
            passagers: true,
            hebergements: { include: { hotel: true } },
            segmentsVol: { include: { compagnie: true } },
            transferts: true,
            trainsHaramain: true,
            prestationsVip: true,
          },
        },
        versements: {
          orderBy: { dateVersement: 'desc' },
        },
      },
    })
    if (!facture) throw new Error('Facture introuvable')
    return facture
  }

  static async createFromDevis(input: CreateFactureInput) {
    const devis = await db.devis.findUnique({
      where: { id: input.devisId },
      include: { client: true, facture: true },
    })
    if (!devis) throw new Error('Devis introuvable')

    // Si une facture existe déjà pour ce devis, on la retourne
    if (devis.facture) {
      return this.getById(devis.facture.id)
    }

    const numeroFacture = await NumerotationService.attribuerNumeroFacture()

    const facture = await db.$transaction(async (tx) => {
      // 1. Si le devis n'était pas encore accepté, on le passe en accepté
      if (devis.statut !== 'accepte') {
        await tx.devis.update({
          where: { id: devis.id },
          data: { statut: 'accepte' },
        })
      }

      // 2. Création de la facture avec montants stricts
      const created = await tx.facture.create({
        data: {
          numero: numeroFacture,
          devisId: devis.id,
          clientId: devis.clientId,
          dateEmission: new Date(),
          dateEcheance: input.dateEcheance ? new Date(input.dateEcheance) : null,
          montantTotalDzd: devis.prixVenteDzd,
          montantPayeDzd: '0',
          resteAPayerDzd: devis.prixVenteDzd,
          statut: 'non_payee',
          notes: input.notes || null,
        },
      })

      return created
    })

    await AuditUseCases.log('CREATE_FACTURE', 'Facture', facture.id)
    return this.getById(facture.id)
  }

  static async addVersement(factureId: string, input: CreateVersementInput) {
    const numeroRecu = await NumerotationService.attribuerNumeroRecu()

    const updatedFacture = await db.$transaction(async (tx) => {
      const facture = await tx.facture.findUnique({
        where: { id: factureId },
        include: { versements: true },
      })
      if (!facture) throw new Error('Facture introuvable')

      const montantVersement = D(input.montantDzd)
      if (montantVersement.lte(0)) {
        throw new Error('Le montant du versement doit être supérieur à 0')
      }

      // 1. Enregistrer le versement
      await tx.versement.create({
        data: {
          factureId,
          numeroRecu,
          dateVersement: input.dateVersement ? new Date(input.dateVersement) : new Date(),
          montantDzd: montantVersement.toFixed(2),
          modePaiement: input.modePaiement,
          reference: input.reference || null,
          recuPar: input.recuPar || null,
          notes: input.notes || null,
        },
      })

      // 2. Calculer le nouveau total payé avec decimal.js strict
      const tousVersements = await tx.versement.findMany({ where: { factureId } })
      const totalPaye = tousVersements.reduce(
        (acc, v) => acc.plus(D(v.montantDzd)),
        D(0)
      )

      const montantTotal = D(facture.montantTotalDzd)
      const reste = montantTotal.minus(totalPaye)
      const resteFinal = reste.isNegative() ? D(0) : reste

      let nouveauStatut = 'non_payee'
      if (totalPaye.gte(montantTotal)) {
        nouveauStatut = 'payee'
      } else if (totalPaye.gt(0)) {
        nouveauStatut = 'partiellement_payee'
      }

      // 3. Mettre à jour la facture
      const updated = await tx.facture.update({
        where: { id: factureId },
        data: {
          montantPayeDzd: totalPaye.toFixed(2),
          resteAPayerDzd: resteFinal.toFixed(2),
          statut: nouveauStatut,
        },
      })

      return updated
    })

    await AuditUseCases.log('ADD_VERSEMENT', 'Facture', factureId)
    return this.getById(updatedFacture.id)
  }

  static async deleteVersement(versementId: string) {
    const versement = await db.versement.findUnique({ where: { id: versementId } })
    if (!versement) throw new Error('Versement introuvable')

    const factureId = versement.factureId

    await db.$transaction(async (tx) => {
      await tx.versement.delete({ where: { id: versementId } })

      const facture = await tx.facture.findUnique({ where: { id: factureId } })
      if (!facture) return

      const restants = await tx.versement.findMany({ where: { factureId } })
      const totalPaye = restants.reduce(
        (acc, v) => acc.plus(D(v.montantDzd)),
        D(0)
      )

      const montantTotal = D(facture.montantTotalDzd)
      const reste = montantTotal.minus(totalPaye)
      const resteFinal = reste.isNegative() ? D(0) : reste

      let nouveauStatut = 'non_payee'
      if (totalPaye.gte(montantTotal)) {
        nouveauStatut = 'payee'
      } else if (totalPaye.gt(0)) {
        nouveauStatut = 'partiellement_payee'
      }

      await tx.facture.update({
        where: { id: factureId },
        data: {
          montantPayeDzd: totalPaye.toFixed(2),
          resteAPayerDzd: resteFinal.toFixed(2),
          statut: nouveauStatut,
        },
      })
    })

    await AuditUseCases.log('DELETE_VERSEMENT', 'Facture', factureId)
    return this.getById(factureId)
  }
}
