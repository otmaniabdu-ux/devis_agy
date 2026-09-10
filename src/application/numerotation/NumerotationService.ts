import { db } from '@/lib/db'

export class NumerotationService {
  /** 
   * Attribue le prochain numéro de devis au format DEVIS-YYYY-MM-NNN.
   * Utilise une table de compteur atomique.
   */
  static async attribuerNumero(date: Date = new Date()): Promise<string> {
    const cle = `DEVIS-${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
  
    for (let attempt = 0; attempt < 50; attempt++) {
      const compteur = await db.compteurNumerotation.upsert({
        where: { cle },
        update: { dernierNumero: { increment: 1 } },
        create: { cle, dernierNumero: 1 },
      })
      const numero = `${cle}-${String(compteur.dernierNumero).padStart(3, '0')}`
  
      const existing = await db.devis.findUnique({ where: { numero }, select: { id: true } })
      if (!existing) {
        return numero
      }
    }
  
    throw new Error(`Impossible d'attribuer un numéro de devis unique après 50 tentatives`)
  }

  /**
   * Attribue le prochain numéro de facture au format FACT-YYYY-MM-NNN.
   */
  static async attribuerNumeroFacture(date: Date = new Date()): Promise<string> {
    const cle = `FACT-${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

    for (let attempt = 0; attempt < 50; attempt++) {
      const compteur = await db.compteurNumerotation.upsert({
        where: { cle },
        update: { dernierNumero: { increment: 1 } },
        create: { cle, dernierNumero: 1 },
      })
      const numero = `${cle}-${String(compteur.dernierNumero).padStart(3, '0')}`

      const existing = await db.facture.findUnique({ where: { numero }, select: { id: true } })
      if (!existing) {
        return numero
      }
    }

    throw new Error(`Impossible d'attribuer un numéro de facture unique après 50 tentatives`)
  }

  /**
   * Attribue le prochain numéro de reçu de versement au format RECU-YYYY-MM-NNN.
   */
  static async attribuerNumeroRecu(date: Date = new Date()): Promise<string> {
    const cle = `RECU-${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

    for (let attempt = 0; attempt < 50; attempt++) {
      const compteur = await db.compteurNumerotation.upsert({
        where: { cle },
        update: { dernierNumero: { increment: 1 } },
        create: { cle, dernierNumero: 1 },
      })
      const numero = `${cle}-${String(compteur.dernierNumero).padStart(3, '0')}`

      const existing = await db.versement.findUnique({ where: { numeroRecu: numero }, select: { id: true } })
      if (!existing) {
        return numero
      }
    }

    throw new Error(`Impossible d'attribuer un numéro de reçu unique après 50 tentatives`)
  }
}
