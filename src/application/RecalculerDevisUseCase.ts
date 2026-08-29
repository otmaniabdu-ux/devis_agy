import { db } from '@/lib/db'
import { PricingEngine, ResultatCalculDevis } from '@/domain/PricingEngine'

export class RecalculerDevisUseCase {
  /**
   * Recalcule un devis et sauvegarde les totaux en base.
   * Peut s'exécuter dans une transaction existante (fournie par Prisma).
   */
  static async execute(devisId: string, txContext: any = db): Promise<ResultatCalculDevis> {
    const devis = await txContext.devis.findUnique({
      where: { id: devisId },
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
    
    if (!devis) throw new Error('Devis introuvable')

    // 1. Appel du moteur pur
    const resultat = PricingEngine.calculer(devis)

    // 2. Persistance des totaux
    await txContext.devis.update({
      where: { id: devisId },
      data: {
        coutNetDzd: resultat.coutNetDzd,
        margeMontantDzd: resultat.margeMontantDzd,
        prixVenteDzd: resultat.prixVenteDzd,
      },
    })

    return resultat
  }
}
