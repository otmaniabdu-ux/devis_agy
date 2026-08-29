// Ce fichier agit désormais comme un proxy vers la Clean Architecture (Phase 3).
// Il sera supprimé une fois tous les imports mis à jour.

import { ResultatCalculDevis, PricingEngine } from '@/domain/PricingEngine'
import { RecalculerDevisUseCase } from '@/application/RecalculerDevisUseCase'
import { NumerotationService } from '@/domain/NumerotationService'
import { db } from '@/lib/db'

export type { ResultatCalculDevis } from '@/domain/PricingEngine'
export type { LigneCout } from '@/domain/PricingEngine'

/**
 * @deprecated Utiliser RecalculerDevisUseCase.execute(devisId)
 */
export async function recalculerDevis(devisId: string): Promise<ResultatCalculDevis> {
  return RecalculerDevisUseCase.execute(devisId, db)
}

/**
 * @deprecated Les totaux sont désormais persistés directement par le Use Case.
 */
export async function persisterTotaux(_devisId: string, _resultat: ResultatCalculDevis): Promise<void> {
  // Vide car RecalculerDevisUseCase s'en charge déjà.
}

/**
 * @deprecated Utiliser NumerotationService.attribuerNumero(date)
 */
export async function attribuerNumeroDevis(date: Date = new Date()): Promise<string> {
  return NumerotationService.attribuerNumero(date)
}

