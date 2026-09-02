import { describe, it, expect } from 'vitest'
import { PricingEngine, compterPassagers } from '@/domain/PricingEngine'

describe('PricingEngine', () => {
  const makeDevis = (overrides = {}) => ({
    tauxSarDzd: '35.5',
    tauxUsdDzd: '240',
    tauxEurDzd: '260',
    passagers: [],
    segmentsVol: [],
    hebergements: [],
    transferts: [],
    trainsHaramain: [],
    prestationsVip: [],
    campsMashair: [],
    transportsMashair: [],
    visaType: 'omra_standard',
    visaPrixUnit: '0',
    visaDevise: 'SAR',
    fraisOnpoPrixUnit: '5000',
    fraisOnpoDevise: 'DZD',
    margeType: 'pourcentage',
    margeValeur: '15',
    ...overrides,
  })

  describe('compterPassagers()', () => {
    it('compte correctement les catégories', () => {
      const passagers = [
        { categorie: 'adulte' },
        { categorie: 'adulte' },
        { categorie: 'enfant_avec_lit' },
        { categorie: 'enfant_sans_lit' },
        { categorie: 'bebe' },
      ]
      const counts = compterPassagers(passagers)
      expect(counts.adulte).toBe(2)
      expect(counts.enfant_avec_lit).toBe(1)
      expect(counts.enfant_sans_lit).toBe(1)
      expect(counts.bebe).toBe(1)
    })
  })

  describe('calculer()', () => {
    it('retourne 0 pour un devis vide', () => {
      const result = PricingEngine.calculer(makeDevis())
      expect(result.lignes.length).toBe(0)
      expect(result.coutNetDzd).toBe('0')
      expect(result.prixVenteDzd).toBe('0')
      expect(result.margeMontantDzd).toBe('0')
    })

    it('calcule correctement pour 1 segment de vol SAR', () => {
      const devis = makeDevis({
        passagers: [{ categorie: 'adulte' }, { categorie: 'adulte' }],
        segmentsVol: [
          {
            origine: 'JED',
            destination: 'ALG',
            prixAdulte: '500',
            prixEnfant: '300',
            prixBebe: '100',
            devise: 'SAR',
            classe: 'economique',
          },
        ],
      })
      const result = PricingEngine.calculer(devis)
      
      expect(result.lignes.length).toBe(2) // 1 segment + 1 ONPO (default for passagers)
      
      const ligneBillet = result.lignes.find(l => l.poste === 'Billet')!
      expect(ligneBillet).toBeDefined()
      // 2 adultes * 500 SAR = 1000 SAR. 1000 * 35.5 = 35500 DZD
      expect(ligneBillet.montantSource).toBe('1000')
      expect(ligneBillet.montantDzd).toBe('35500')
    })

    it('calcule correctement pour 1 hébergement', () => {
      const devis = makeDevis({
        hebergements: [
          {
            ville: 'Makkah',
            hotelNom: 'Hilton',
            typeChambre: 'double',
            formuleRepas: 'petit_dejeuner',
            vue: 'haram',
            nbNuitees: 3,
            nbChambres: 2,
            prixNuitChambre: '200',
            devise: 'SAR',
          },
        ],
      })
      const result = PricingEngine.calculer(devis)
      const ligneHeb = result.lignes.find(l => l.poste === 'Hébergement Makkah')!
      // 3 nuits * 2 chambres * 200 = 1200 SAR. 1200 * 35.5 = 42600 DZD
      expect(ligneHeb.montantSource).toBe('1200')
      expect(ligneHeb.montantDzd).toBe('42600')
    })

    it('calcule correctement pour 1 transfert', () => {
      const devis = makeDevis({
        transferts: [
          {
            trajet: 'JED-MAK',
            typeVehicule: 'Bus_VIP_prive',
            prix: '150',
            devise: 'SAR',
          },
        ],
      })
      const result = PricingEngine.calculer(devis)
      const ligne = result.lignes.find(l => l.poste === 'Transfert')!
      expect(ligne.montantSource).toBe('150')
      expect(ligne.montantDzd).toBe('5325') // 150 * 35.5
    })

    it('calcule correctement pour 1 train Haramain', () => {
      const devis = makeDevis({
        passagers: [
          { categorie: 'adulte' },
          { categorie: 'adulte' },
          { categorie: 'enfant_sans_lit' }
        ],
        trainsHaramain: [
          {
            trajet: 'MAK-MED',
            classe: 'economique',
            prixAdulte: '50',
            prixEnfant: '25',
            devise: 'SAR',
          },
        ],
      })
      const result = PricingEngine.calculer(devis)
      const ligne = result.lignes.find(l => l.poste === 'Train Haramain')!
      // 2 adultes * 50 + 1 enfant * 25 = 125 SAR
      expect(ligne.montantSource).toBe('125')
      expect(ligne.montantDzd).toBe('4437.5') // 125 * 35.5
    })

    it('calcule correctement pour Visa', () => {
      const devis = makeDevis({
        passagers: [{ categorie: 'adulte' }, { categorie: 'bebe' }, { categorie: 'enfant_avec_lit' }],
        visaPrixUnit: '100',
        visaDevise: 'SAR',
      })
      const result = PricingEngine.calculer(devis)
      const ligne = result.lignes.find(l => l.poste === 'Visa')!
      // 3 passagers * 100 SAR = 300 SAR
      expect(ligne.montantSource).toBe('300')
      expect(ligne.montantDzd).toBe('10650') // 300 * 35.5
    })

    it('calcule les Frais ONPO comme NON commissionables', () => {
      const devis = makeDevis({
        passagers: [{ categorie: 'adulte' }, { categorie: 'adulte' }, { categorie: 'adulte' }],
        fraisOnpoPrixUnit: '5000',
        fraisOnpoDevise: 'DZD',
        margeType: 'pourcentage',
        margeValeur: '15',
      })
      const result = PricingEngine.calculer(devis)
      const ligne = result.lignes.find(l => l.poste === 'Frais ONPO')!
      // 3 passagers * 5000 DZD = 15000 DZD
      expect(ligne.montantDzd).toBe('15000')
      expect(ligne.prixVenteDzd).toBe('15000') // Non commissionable
      expect(result.coutNetDzd).toBe('15000')
      expect(result.prixVenteDzd).toBe('15000') // Pas de marge du tout car que des frais ONPO
    })

    it('applique correctement une marge en pourcentage de 15%', () => {
      const devis = makeDevis({
        hebergements: [
          {
            ville: 'Makkah',
            nbNuitees: 1,
            nbChambres: 1,
            prixNuitChambre: '100',
            devise: 'SAR',
          },
        ],
        fraisOnpoPrixUnit: '0', // No ONPO to simplify
        margeType: 'pourcentage',
        margeValeur: '15',
      })
      const result = PricingEngine.calculer(devis)
      // Cout: 100 SAR * 35.5 = 3550 DZD
      expect(result.coutNetDzd).toBe('3550')
      // Marge 15%: 3550 * 0.15 = 532.5
      expect(result.margeMontantDzd).toBe('532.5')
      // Vente: 3550 + 532.5 = 4082.5
      expect(result.prixVenteDzd).toBe('4082.5')
    })

    it('répartit proportionnellement une marge de montant fixe (50000)', () => {
      const devis = makeDevis({
        segmentsVol: [
          { prixAdulte: '1000', devise: 'SAR', classe: 'economique' }
        ],
        hebergements: [
          { nbNuitees: 1, nbChambres: 1, prixNuitChambre: '1000', devise: 'SAR' }
        ],
        passagers: [{ categorie: 'adulte' }],
        fraisOnpoPrixUnit: '0', // Exclude ONPO
        margeType: 'montant_fixe',
        margeValeur: '50000',
      })
      const result = PricingEngine.calculer(devis)
      
      const vol = result.lignes.find(l => l.poste === 'Billet')!
      const heb = result.lignes.find(l => l.poste === 'Hébergement Makkah')!
      
      // Les deux ont le même montant, donc la marge de 50000 devrait être répartie équitablement
      // 25000 de marge chacun
      expect(Number(vol.prixVenteDzd)).toBe(Number(vol.montantDzd) + 25000)
      expect(Number(heb.prixVenteDzd)).toBe(Number(heb.montantDzd) + 25000)
      expect(result.margeMontantDzd).toBe('50000')
    })

    it('cas complet multi-postes', () => {
      const devis = makeDevis({
        passagers: [{ categorie: 'adulte' }, { categorie: 'enfant_sans_lit' }],
        segmentsVol: [
          { origine: 'A', destination: 'B', prixAdulte: '1000', prixEnfant: '500', devise: 'SAR' }
        ],
        hebergements: [
          { nbNuitees: 2, nbChambres: 1, prixNuitChambre: '500', devise: 'SAR' }
        ],
        transferts: [
          { prix: '200', devise: 'SAR' }
        ],
        fraisOnpoPrixUnit: '5000', // 2 pax = 10000 DZD
        margeType: 'pourcentage',
        margeValeur: '10',
      })
      
      const result = PricingEngine.calculer(devis)
      
      // Coûts source:
      // Vol: 1000*1 + 500*1 = 1500 SAR
      // Heb: 500*2*1 = 1000 SAR
      // Trans: 200 SAR
      // Total SAR commissionable = 2700 SAR.
      // DZD commissionable = 2700 * 35.5 = 95850 DZD.
      
      // Marge 10% sur commissionable = 9585
      // Vente commissionable = 105435
      
      // ONPO (non comm) = 10000 DZD
      
      // CoutNet = 95850 + 10000 = 105850
      // Vente = 105435 + 10000 = 115435
      
      expect(result.coutNetDzd).toBe('105850')
      expect(result.margeMontantDzd).toBe('9585')
      expect(result.prixVenteDzd).toBe('115435')
      
      const onpo = result.lignes.find(l => l.poste === 'Frais ONPO')!
      expect(onpo.prixVenteDzd).toBe('10000') // Pas de marge sur ONPO
    })
  })
})
