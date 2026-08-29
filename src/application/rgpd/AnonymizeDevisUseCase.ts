import { db } from '@/lib/db'
import { AuditUseCases } from '@/application/audit/AuditUseCases'

export class AnonymizeDevisUseCase {
  /**
   * Anonymise les passagers de tous les devis dont la date de retour est passée
   * depuis plus de `joursDelai` (par défaut 30).
   * Retourne le nombre de devis anonymisés.
   */
  static async execute(joursDelai = 30) {
    const dateLimite = new Date()
    dateLimite.setDate(dateLimite.getDate() - joursDelai)

    // Trouver les devis éligibles (statut validé/terminé ou date de retour passée)
    const devisEligibles = await db.devis.findMany({
      where: {
        dateRetour: { lt: dateLimite },
        // On ne veut pas écraser les devis déjà anonymisés si on peut l'éviter
        // mais pour simplifier on va juste purger les champs passeports existants
        passagers: {
          some: {
            passeportNumero: { not: null }
          }
        }
      },
      select: { id: true }
    })

    let count = 0

    for (const d of devisEligibles) {
      await db.$transaction(async (tx) => {
        // Obfuscation des passeports
        await tx.passager.updateMany({
          where: { devisId: d.id, passeportNumero: { not: null } },
          data: {
            passeportNumero: 'ANONYMISE',
            passeportExpiration: null,
            // Optionnellement, on pourrait anonymiser le nom/prénom pour les passagers,
            // mais souvent l'agence veut garder le nom du client principal pour ses stats.
          }
        })
        
        // Log d'audit
        await AuditUseCases.log('ANONYMIZE_RGPD', 'Devis', d.id, { joursDelai })
      })
      count++
    }

    return count
  }
}
