import Decimal from 'decimal.js'
import {
  D, convertirEnDzd, round2, type Money,
} from '@/lib/money'
import {
  calculerNbNuitees, TYPES_CHAMBRE, FORMULES_REPAS, VUES_HOTEL,
} from '@/lib/business'

export interface LigneCout {
  poste: string
  description: string
  montantDzd: Money
  prixVenteDzd: Money
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
 * Moteur de calcul pur (Domain Driven Design).
 * Prend un état de devis complet en entrée (indépendant de l'ORM)
 * et retourne le détail du calcul financier.
 */
export class PricingEngine {
  static calculer(devis: any): ResultatCalculDevis {
    const taux = {
      SAR: devis.tauxSarDzd,
      USD: devis.tauxUsdDzd,
      EUR: devis.tauxEurDzd,
    }

    const lignes: LigneCout[] = []
    const passagersCounts = compterPassagers(devis.passagers)

    // 1. Segments de vol
    for (const seg of devis.segmentsVol) {
      const nbAdultes = passagersCounts.adulte
      const nbEnfants = passagersCounts.enfant_avec_lit + passagersCounts.enfant_sans_lit
      const nbBebes = passagersCounts.bebe
      const montantSource = D(seg.prixAdulte).mul(nbAdultes)
        .plus(D(seg.prixEnfant).mul(nbEnfants))
        .plus(D(seg.prixBebe).mul(nbBebes))
      const montantDzd = convertirEnDzd(montantSource.toString(), seg.devise, taux)

      const labClasse = (c: string) => {
        if (c === 'affaires') return 'Affaires'
        if (c === 'premiere') return 'Première'
        return 'Économique'
      }

      let desc = `${seg.origine} → ${seg.destination} (${labClasse(seg.classe)})`
      if (seg.origineRetour && seg.destinationRetour) {
        desc += ` / ${seg.origineRetour} → ${seg.destinationRetour} (${labClasse(seg.classeRetour || seg.classe)})`
      }

      lignes.push({
        poste: 'Billet',
        description: desc,
        montantSource: round2(montantSource),
        deviseSource: seg.devise,
        montantDzd: round2(montantDzd),
        prixVenteDzd: round2(montantDzd),
      })
    }

    // 2. Hébergements
    for (const heb of devis.hebergements) {
      const nbNuit = heb.nbNuitees || calculerNbNuitees(heb.dateCheckin, heb.dateCheckout)
      const montantSource = D(heb.prixNuitChambre).mul(nbNuit).mul(heb.nbChambres)
      const montantDzd = convertirEnDzd(montantSource.toString(), heb.devise, taux)
      
      const poste = heb.ville === 'Medine' || heb.ville === 'Médine' ? 'Hébergement Médine' : 'Hébergement Makkah'
      const typeChambreLabel = TYPES_CHAMBRE[heb.typeChambre as keyof typeof TYPES_CHAMBRE]?.label ?? heb.typeChambre
      const formuleLabel = FORMULES_REPAS[heb.formuleRepas as keyof typeof FORMULES_REPAS]?.label ?? heb.formuleRepas
      const vueLabel = VUES_HOTEL[heb.vue as keyof typeof VUES_HOTEL]?.label ?? heb.vue

      lignes.push({
        poste,
        description: `${heb.hotelNom} — ${typeChambreLabel} — ${formuleLabel} — ${vueLabel}`,
        montantSource: round2(montantSource),
        deviseSource: heb.devise,
        montantDzd: round2(montantDzd),
        prixVenteDzd: round2(montantDzd),
      })
    }

    // 3. Transferts
    for (const tr of devis.transferts) {
      const montantDzd = convertirEnDzd(tr.prix, tr.devise, taux)
      lignes.push({
        poste: 'Transfert',
        description: `${tr.trajet} (${tr.typeVehicule})`,
        montantSource: tr.prix,
        deviseSource: tr.devise,
        montantDzd: round2(montantDzd),
        prixVenteDzd: round2(montantDzd),
      })
    }

    // 4. Trains Haramain
    for (const tr of devis.trainsHaramain) {
      const nbAdultes = passagersCounts.adulte
      const nbEnfants = passagersCounts.enfant_avec_lit + passagersCounts.enfant_sans_lit
      const montantSource = D(tr.prixAdulte).mul(nbAdultes).plus(D(tr.prixEnfant).mul(nbEnfants))
      const montantDzd = convertirEnDzd(montantSource.toString(), tr.devise, taux)
      lignes.push({
        poste: 'Train Haramain',
        description: `${tr.trajet} (${tr.classe})`,
        montantSource: round2(montantSource),
        deviseSource: tr.devise,
        montantDzd: round2(montantDzd),
        prixVenteDzd: round2(montantDzd),
      })
    }

    // 5. Prestations VIP
    for (const p of devis.prestationsVip) {
      const montantDzd = convertirEnDzd(p.prix, p.devise, taux)
      lignes.push({
        poste: 'Prestation VIP',
        description: p.descriptionFr,
        montantSource: p.prix,
        deviseSource: p.devise,
        montantDzd: round2(montantDzd),
        prixVenteDzd: round2(montantDzd),
      })
    }

    // Hadj VIP: Camps Mashair
    for (const camp of devis.campsMashair) {
      const nbAdultes = passagersCounts.adulte
      const nbEnfants = passagersCounts.enfant_avec_lit + passagersCounts.enfant_sans_lit
      const montantSource = D(camp.prixAdulte).mul(nbAdultes).plus(D(camp.prixEnfant).mul(nbEnfants))
      const montantDzd = convertirEnDzd(montantSource.toString(), camp.devise, taux)
      lignes.push({
        poste: 'Camp Hadj',
        description: `${camp.nomCamp} — ${camp.typeTente} — ${camp.restauration}`,
        montantSource: round2(montantSource),
        deviseSource: camp.devise,
        montantDzd: round2(montantDzd),
        prixVenteDzd: round2(montantDzd),
      })
    }

    // Hadj VIP: Transport Mashair
    for (const t of devis.transportsMashair) {
      let montantSource = D(t.prix)
      if (t.typePrix === 'par_passager') {
        const totalPassagers = devis.passagers.length
        montantSource = montantSource.mul(totalPassagers)
      }
      const montantDzd = convertirEnDzd(montantSource.toString(), t.devise, taux)
      lignes.push({
        poste: 'Transport Mashair',
        description: `${t.trajet} (${t.typeVehicule})`,
        montantSource: round2(montantSource),
        deviseSource: t.devise,
        montantDzd: round2(montantDzd),
        prixVenteDzd: round2(montantDzd),
      })
    }

    // 6. Visa
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
        prixVenteDzd: round2(montantDzd),
      })
    }

    // 7. Frais ONPO
    const fraisOnpoPrixUnit = devis.fraisOnpoPrixUnit ?? devis.assurancePrixUnit ?? '5000'
    const fraisOnpoDevise = devis.fraisOnpoDevise ?? devis.assuranceDevise ?? 'DZD'
    if (totalPassagers > 0) {
      const montantSource = D(fraisOnpoPrixUnit).mul(totalPassagers)
      const montantDzd = convertirEnDzd(montantSource.toString(), fraisOnpoDevise, taux)
      lignes.push({
        poste: 'Frais ONPO',
        description: `Frais ONPO × ${totalPassagers} passager(s)`,
        montantSource: round2(montantSource),
        deviseSource: fraisOnpoDevise,
        montantDzd: round2(montantDzd),
        prixVenteDzd: round2(montantDzd),
      })
    }

    // Coût net total = somme de toutes les lignes en DZD
    const coutNet = lignes.reduce<Decimal>((acc, l) => acc.plus(D(l.montantDzd)), new Decimal(0))
    const coutNetStr = round2(coutNet)

    const margeType = devis.margeType as 'pourcentage' | 'montant_fixe'
    const margeVal = D(devis.margeValeur)

    // Somme des coûts nets des lignes commissionables (toutes sauf 'Frais ONPO')
    const coutNetCommissionable = lignes
      .filter((l) => l.poste !== 'Frais ONPO')
      .reduce<Decimal>((acc, l) => acc.plus(D(l.montantDzd)), new Decimal(0))

    let margeMontant: Decimal
    if (margeType === 'pourcentage') {
      margeMontant = coutNetCommissionable.mul(margeVal.div(100))
    } else {
      margeMontant = margeVal
    }

    const prixVente = coutNet.plus(margeMontant)

    // Calcule le prix de vente par ligne
    for (const l of lignes) {
      let pvLigne: Decimal
      if (l.poste === 'Frais ONPO') {
        // Frais ONPO est NON commissionable : prix de vente = coût net
        pvLigne = D(l.montantDzd)
      } else {
        if (margeType === 'pourcentage') {
          pvLigne = D(l.montantDzd).mul(new Decimal(1).plus(margeVal.div(100)))
        } else {
          if (coutNetCommissionable.gt(0)) {
            pvLigne = D(l.montantDzd).plus(margeMontant.mul(D(l.montantDzd)).div(coutNetCommissionable))
          } else {
            pvLigne = D(l.montantDzd)
          }
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
}
