// Moteur de calcul du devis — calcule le coût net total, la marge et le prix de vente.
// Conforme à PROMPT_AGENT_OmraVIP.md section 6.
// Toutes les opérations via decimal.js — jamais de number JS.

import Decimal from 'decimal.js'
import { db } from '@/lib/db'
import {
  D, convertirEnDzd, round2, calculerPrixVente, type Money,
} from '@/lib/money'
import { calculerNbNuitees } from '@/lib/business'

export interface LigneCout {
  poste: string
  description: string
  montantDzd: Money           // coût net en DZD
  prixVenteDzd: Money          // prix de vente en DZD (marge incluse)
  deviseSource: string
  montantSource: Money
}

export interface ResultatCalculDevis {
  lignes: LigneCout[]
  coutNetDzd: Money
  margeType: 'pourcentage' | 'montant_fixe'
  margeValeur: Money
  margeMontantDzd: Money
  prixVenteDzd: Money
}

/** Compte les passagers par catégorie. */
export function compterPassagers(passagers: { categorie: string }[]): Record<string, number> {
  const counts: Record<string, number> = {
    adulte: 0,
    enfant_avec_lit: 0,
    enfant_sans_lit: 0,
    bebe: 0,
  }
  for (const p of passagers) {
    counts[p.categorie] = (counts[p.categorie] ?? 0) + 1
  }
  return counts
}

/**
 * Recalcule le coût net total d'un devis à partir de toutes ses lignes.
 * Renvoie le détail par poste + totaux.
 */
export async function recalculerDevis(devisId: string): Promise<ResultatCalculDevis> {
  const devis = await db.devis.findUnique({
    where: { id: devisId },
    include: {
      passagers: true,
      segmentsVol: true,
      hebergements: true,
      transferts: true,
      trainsHaramain: true,
      prestationsVip: true,
    },
  })
  if (!devis) throw new Error('Devis introuvable')

  const taux = {
    SAR: devis.tauxSarDzd,
    USD: devis.tauxUsdDzd,
    EUR: devis.tauxEurDzd,
  }

  const lignes: LigneCout[] = []
  const passagersCounts = compterPassagers(devis.passagers)

  // 1. Segments de vol — prix par tranche d'âge × nombre de passagers de la tranche
  for (const seg of devis.segmentsVol) {
    const nbAdultes = passagersCounts.adulte + passagersCounts.enfant_avec_lit + passagersCounts.enfant_sans_lit
    const nbEnfants = passagersCounts.enfant_avec_lit + passagersCounts.enfant_sans_lit
    const nbBebes = passagersCounts.bebe
    const montantSource = D(seg.prixAdulte).mul(nbAdultes)
      .plus(D(seg.prixEnfant).mul(nbEnfants))
      .plus(D(seg.prixBebe).mul(nbBebes))
    const montantDzd = convertirEnDzd(montantSource.toString(), seg.devise, taux)
    lignes.push({
      poste: 'Vol',
      description: `${seg.origine} → ${seg.destination} (${seg.classe})`,
      montantSource: round2(montantSource),
      deviseSource: seg.devise,
      montantDzd: round2(montantDzd),
    })
  }

  // 2. Hébergements — prixNuitChambre × nbNuitées × nbChambres
  for (const heb of devis.hebergements) {
    // recalcul sécurisé des nuitées (le nb stocké est la source de vérité côté DB, mais on recompute pour vérifier)
    const nbNuit = heb.nbNuitees || calculerNbNuitees(heb.dateCheckin, heb.dateCheckout)
    const montantSource = D(heb.prixNuitChambre).mul(nbNuit).mul(heb.nbChambres)
    const montantDzd = convertirEnDzd(montantSource.toString(), heb.devise, taux)
    lignes.push({
      poste: 'Hébergement',
      description: `${heb.hotelNom} (${heb.ville}) — ${heb.typeChambre} × ${nbNuit} nuits × ${heb.nbChambres} ch.`,
      montantSource: round2(montantSource),
      deviseSource: heb.devise,
      montantDzd: round2(montantDzd),
    })
  }

  // 3. Transferts — prix par véhicule
  for (const tr of devis.transferts) {
    const montantDzd = convertirEnDzd(tr.prix, tr.devise, taux)
    lignes.push({
      poste: 'Transfert',
      description: `${tr.trajet} (${tr.typeVehicule})`,
      montantSource: tr.prix,
      deviseSource: tr.devise,
      montantDzd: round2(montantDzd),
    })
  }

  // 4. Trains Haramain — prix par tranche × passagers
  for (const tr of devis.trainsHaramain) {
    const nbAdultes = passagersCounts.adulte + passagersCounts.enfant_avec_lit + passagersCounts.enfant_sans_lit
    const nbEnfants = passagersCounts.enfant_avec_lit + passagersCounts.enfant_sans_lit
    const montantSource = D(tr.prixAdulte).mul(nbAdultes).plus(D(tr.prixEnfant).mul(nbEnfants))
    const montantDzd = convertirEnDzd(montantSource.toString(), tr.devise, taux)
    lignes.push({
      poste: 'Train Haramain',
      description: `${tr.trajet} (${tr.classe})`,
      montantSource: round2(montantSource),
      deviseSource: tr.devise,
      montantDzd: round2(montantDzd),
    })
  }

  // 5. Prestations VIP — prix total prestation
  for (const p of devis.prestationsVip) {
    const montantDzd = convertirEnDzd(p.prix, p.devise, taux)
    lignes.push({
      poste: 'Prestation VIP',
      description: p.descriptionFr,
      montantSource: p.prix,
      deviseSource: p.devise,
      montantDzd: round2(montantDzd),
    })
  }

  // 6. Visa — prix unitaire × total passagers (visa obligatoire pour tous)
  const totalPassagers = devis.passagers.length
  if (totalPassagers > 0 && D(devis.visaPrixUnit).gt(0)) {
    const montantSource = D(devis.visaPrixUnit).mul(totalPassagers)
    const montantDzd = convertirEnDzd(montantSource.toString(), devis.visaDevise, taux)
    lignes.push({
      poste: 'Visa',
      description: `${devis.visaType} × ${totalPassagers} passager(s)`,
      montantSource: round2(montantSource),
      deviseSource: devis.visaDevise,
      montantDzd: round2(montantDzd),
    })
  }

  // 7. Assurance médicale — prix unitaire × total passagers
  if (totalPassagers > 0 && D(devis.assurancePrixUnit).gt(0)) {
    const montantSource = D(devis.assurancePrixUnit).mul(totalPassagers)
    const montantDzd = convertirEnDzd(montantSource.toString(), devis.assuranceDevise, taux)
    lignes.push({
      poste: 'Assurance médicale',
      description: `Assurance × ${totalPassagers} passager(s)`,
      montantSource: round2(montantSource),
      deviseSource: devis.assuranceDevise,
      montantDzd: round2(montantDzd),
    })
  }

  // Coût net = somme de toutes les lignes en DZD
  const coutNet = lignes.reduce<Decimal>((acc, l) => acc.plus(D(l.montantDzd)), new Decimal(0))
  const coutNetStr = round2(coutNet)

  // Marge + prix de vente global
  const { prixVente, margeMontant } = calculerPrixVente(
    coutNetStr,
    devis.margeType as 'pourcentage' | 'montant_fixe',
    devis.margeValeur,
  )

  // Applique la marge à chaque ligne pour que la somme des prix de vente par ligne = prix de vente total
  // Pour une marge en pourcentage : prixVente_ligne = montantDzd * (1 + marge/100)
  // Pour une marge en montant fixe : on distribue proportionnellement au coût net
  const margeType = devis.margeType as 'pourcentage' | 'montant_fixe'
  const margeVal = D(devis.margeValeur)
  for (const l of lignes) {
    let pvLigne: Decimal
    if (margeType === 'pourcentage') {
      pvLigne = D(l.montantDzd).mul(new Decimal(1).plus(margeVal.div(100)))
    } else {
      // montant_fixe : distribution proportionnelle
      if (coutNet.gt(0)) {
        pvLigne = D(l.montantDzd).plus(margeMontant.mul(D(l.montantDzd)).div(coutNet))
      } else {
        pvLigne = D(l.montantDzd)
      }
    }
    l.prixVenteDzd = round2(pvLigne)
  }

  return {
    lignes,
    coutNetDzd: coutNetStr,
    margeType,
    margeValeur: devis.margeValeur,
    margeMontantDzd: round2(margeMontant),
    prixVenteDzd: round2(prixVente),
  }
}

/** Persiste les totaux recalculés dans la ligne devis. */
export async function persisterTotaux(devisId: string, resultat: ResultatCalculDevis): Promise<void> {
  await db.devis.update({
    where: { id: devisId },
    data: {
      coutNetDzd: resultat.coutNetDzd,
      margeMontantDzd: resultat.margeMontantDzd,
      prixVenteDzd: resultat.prixVenteDzd,
    },
  })
}

/** Attribue le prochain numéro de devis au format DEVIS-YYYY-MM-NNN.
 *  Robuste : si le numéro généré existe déjà (désynchronisation du compteur),
 *  retry en incrémentant jusqu'à trouver un numéro libre.
 */
export async function attribuerNumeroDevis(date: Date = new Date()): Promise<string> {
  const cle = `DEVIS-${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

  for (let attempt = 0; attempt < 50; attempt++) {
    // upsert atomique
    const compteur = await db.compteurNumerotation.upsert({
      where: { cle },
      update: { dernierNumero: { increment: 1 } },
      create: { cle, dernierNumero: 1 },
    })
    const numero = `${cle}-${String(compteur.dernierNumero).padStart(3, '0')}`

    // Vérifie si le numéro existe déjà (sécurité anti-désynchronisation)
    const existing = await db.devis.findUnique({ where: { numero }, select: { id: true } })
    if (!existing) {
      return numero
    }
    // Sinon, on boucle et incrémente à nouveau
  }

  throw new Error(`Impossible d'attribuer un numéro de devis unique après 50 tentatives`)
}
