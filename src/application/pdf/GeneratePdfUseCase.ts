import { db } from '@/lib/db'
import { type DevisForPdf } from '@/lib/pdfDocument'
import { RecalculerDevisUseCase } from '@/application/RecalculerDevisUseCase'
import { generateOptimizedPdf } from '@/lib/pdfRenderer'
import { AuditUseCases } from '@/application/audit/AuditUseCases'

export class GeneratePdfUseCase {
  static async execute(id: string, variante: 'client' | 'interne' | 'programme') {
    const devis = await db.devis.findUnique({
      where: { id },
      select: { id: true, numero: true },
    })
    if (!devis) throw new Error('Devis introuvable')

    // Recalcule et persiste les totaux
    const resultat = await RecalculerDevisUseCase.execute(id)

    // Re-fetch le devis avec les totaux à jour et les paramètres
    const [devisUpdated, parametres] = await Promise.all([
      db.devis.findUnique({
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
      }),
      db.parametresAgence.findUnique({ where: { id: 'default' } }),
    ])

    if (!devisUpdated) throw new Error('Devis introuvable')

    const devisForPdf: DevisForPdf = {
      ...devisUpdated,
      dateDepart: devisUpdated.dateDepart.toISOString(),
      dateRetour: devisUpdated.dateRetour.toISOString(),
      parametres: parametres ?? undefined,
      _resultatCalcul: resultat,
    } as DevisForPdf

    // Clé de cache composite unique
    const devisTs = devisUpdated.updatedAt?.getTime() ?? Date.now()
    const paramTs = parametres?.updatedAt?.getTime() ?? 0
    const cacheKey = `${id}:${variante}:${devisTs}:${paramTs}`

    const pdfBuffer = await generateOptimizedPdf(devisForPdf, variante, cacheKey)
    const filename = `${devis.numero}_${variante}.pdf`

    // Log the event
    await AuditUseCases.log('GENERATE_PDF', 'Devis', id, { variante })

    return { pdfBuffer, filename }
  }
}
