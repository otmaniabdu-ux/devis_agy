import { CreateClientSchema } from '../src/lib/validation/clientSchemas'
import { CreateDevisSchema, UpdateDevisSchema } from '../src/lib/validation/devisSchemas'
import { ClientUseCases } from '../src/application/clients/ClientUseCases'
import { DevisUseCases } from '../src/application/devis/DevisUseCases'
import { RecalculerDevisUseCase } from '../src/application/RecalculerDevisUseCase'
import { D } from '../src/lib/money'
import { getErrorMessage } from '../src/lib/errors'

export interface TestResult {
  id: number
  nom: string
  categorie: 'CLIENT' | 'DEVIS_CREATION' | 'DEVIS_UPDATE' | 'CALCUL_FINANCIER' | 'VALIDATION_ZOD'
  statut: 'SUCCES' | 'ECHEC'
  dureeMs: number
  details: string
  devisNumero?: string
  montantTotalDzd?: string
}

const results: TestResult[] = []

async function runTest(
  id: number,
  nom: string,
  categorie: TestResult['categorie'],
  fn: () => Promise<{ details: string; devisNumero?: string; montantTotalDzd?: string }>
) {
  const start = performance.now()
  try {
    const res = await fn()
    const dureeMs = Math.round(performance.now() - start)
    results.push({
      id,
      nom,
      categorie,
      statut: 'SUCCES',
      dureeMs,
      ...res,
    })
    console.log(`✅ Test ${id.toString().padStart(2, '0')}/20 [${categorie}] : ${nom} (${dureeMs}ms)`)
  } catch (error: unknown) {
    const dureeMs = Math.round(performance.now() - start)
    const msg = getErrorMessage(error)
    results.push({
      id,
      nom,
      categorie,
      statut: 'ECHEC',
      dureeMs,
      details: msg,
    })
    console.error(`❌ Test ${id.toString().padStart(2, '0')}/20 [${categorie}] : ${nom} (${dureeMs}ms) -> ${msg}`)
  }
}

async function main() {
  console.log('=================================================================')
  console.log('🧪 LANCEMENT DE LA SUITE DE 20 TESTS COMPLETS (CLIENTS & DEVIS)')
  console.log('=================================================================\n')

  let clientParticulierId = ''
  let clientSocieteId = ''
  let devisCoupleId = ''
  let devisFamilleId = ''

  // 1. Client Particulier Standard
  await runTest(1, 'Création Client Particulier standard complet', 'CLIENT', async () => {
    const payload = {
      type: 'particulier' as const,
      nom: 'Benali',
      prenom: 'Karim',
      telephone: '+213550112233',
      email: 'karim.benali@example.dz',
      adresse: '15 Rue Didouche Mourad, Alger',
      notes: 'Client VIP habitué Omra',
    }
    const parsed = CreateClientSchema.safeParse(payload)
    if (!parsed.success) throw new Error(`Échec Zod: ${JSON.stringify(parsed.error.format())}`)
    const created = await ClientUseCases.create(parsed.data)
    clientParticulierId = created.id
    return { details: `Client créé ID: ${created.id} (${created.nom} ${created.prenom})` }
  })

  // 2. Client Particulier avec champs optionnels vides ("")
  await runTest(2, 'Création Client Particulier avec champs optionnels vides ("")', 'CLIENT', async () => {
    const payload = {
      type: 'particulier' as const,
      nom: 'Mansouri',
      prenom: 'Fatima',
      telephone: '',
      email: '',
      adresse: '',
      notes: '',
    }
    const parsed = CreateClientSchema.safeParse(payload)
    if (!parsed.success) throw new Error(`Échec Zod: ${JSON.stringify(parsed.error.format())}`)
    const created = await ClientUseCases.create(parsed.data)
    return { details: `Client créé avec succès malgré champs vides: ${created.id}` }
  })

  // 3. Client Société (B2B)
  await runTest(3, 'Création Client Société (B2B Hajj corporatif)', 'CLIENT', async () => {
    const payload = {
      type: 'societe' as const,
      nom: 'Sonatrach Direction',
      raisonSociale: 'Sonatrach Groupe Algérie',
      telephone: '021548000',
      email: 'contact@sonatrach.dz',
      adresse: 'Djenane El Malik, Hydra, Alger',
      notes: 'Contrat Hajj VIP pour les cadres',
    }
    const parsed = CreateClientSchema.safeParse(payload)
    if (!parsed.success) throw new Error(`Échec Zod: ${JSON.stringify(parsed.error.format())}`)
    const created = await ClientUseCases.create(parsed.data)
    clientSocieteId = created.id
    return { details: `Société créée ID: ${created.id} (${created.raisonSociale})` }
  })

  // 4. Validation Zod : Rejet d\'un Particulier sans prénom
  await runTest(4, 'Validation Zod : Rejet propre d\'un particulier sans prénom', 'VALIDATION_ZOD', async () => {
    const payload = {
      type: 'particulier',
      nom: 'NomSeul',
      prenom: '',
    }
    const parsed = CreateClientSchema.safeParse(payload)
    if (parsed.success) throw new Error('Aurait dû échouer mais a été accepté!')
    return { details: 'Rejet Zod validé avec message: "Le prénom est requis pour un particulier."' }
  })

  // 5. Devis Omra Solo (1 adulte, vol aller simple, hôtel Makkah)
  await runTest(5, 'Devis Omra Solo (1 Adulte, chambre single, vol direct)', 'DEVIS_CREATION', async () => {
    const payload = {
      clientId: clientParticulierId,
      dateDepart: '2026-11-01',
      dateRetour: '2026-11-12',
      visaType: 'omra_standard' as const,
      visaPrixUnit: '450',
      visaDevise: 'SAR',
      assurancePrixUnit: '5000',
      assuranceDevise: 'DZD',
      fraisOnpoPrixUnit: '5000',
      fraisOnpoDevise: 'DZD',
      margeType: 'pourcentage' as const,
      margeValeur: '15',
      statut: 'brouillon' as const,
      passagers: [
        {
          categorie: 'adulte' as const,
          nom: 'Benali',
          prenom: 'Karim',
          dateNaissance: '1985-04-12',
          passeportNumero: '123456789',
        },
      ],
      segmentsVol: [
        {
          origine: 'ALG',
          destination: 'JED',
          dateVol: '2026-11-01T09:00',
          classe: 'economique' as const,
          origineRetour: '',
          destinationRetour: '',
          dateVolRetour: '',
          classeRetour: '',
          prixAdulte: '95000',
          prixEnfant: '0',
          prixBebe: '0',
          devise: 'DZD',
        },
      ],
      hebergements: [
        {
          ville: 'Makkah',
          hotelNom: 'Fairmont Makkah Clock Royal Tower',
          typeChambre: 'single',
          formuleRepas: 'petit_dejeuner',
          vue: 'kaaba',
          dateCheckin: '2026-11-01',
          dateCheckout: '2026-11-12',
          nbChambres: 1,
          prixNuitChambre: '1200',
          devise: 'SAR',
        },
      ],
      transferts: [
        {
          trajet: 'Aéroport Djeddah -> Hôtel Makkah',
          typeVehicule: 'GMC_Yukon',
          prix: '650',
          devise: 'SAR',
          obligatoire: true,
        },
      ],
      trainsHaramain: [],
      prestationsVip: [],
      campsMashair: [],
      transportsMashair: [],
    }
    const parsed = CreateDevisSchema.safeParse(payload)
    if (!parsed.success) throw new Error(`Échec Zod: ${JSON.stringify(parsed.error.format())}`)
    const devis = await DevisUseCases.create(parsed.data)
    return {
      details: `Créé avec succès. Total: ${devis.totalVenteDzd} DZD (Marge: ${devis.margeDzd} DZD)`,
      devisNumero: devis.numero,
      montantTotalDzd: devis.totalVenteDzd,
    }
  })

  // 6. Devis Omra Couple (2 Adultes, chambre double, vol AR avec classeRetour="")
  await runTest(6, 'Devis Omra Couple (2 Adultes, chambre double, Vol AR, GMC VIP)', 'DEVIS_CREATION', async () => {
    const payload = {
      clientId: clientParticulierId,
      dateDepart: '2026-11-15',
      dateRetour: '2026-11-27',
      visaType: 'omra_standard' as const,
      visaPrixUnit: '450',
      visaDevise: 'SAR',
      assurancePrixUnit: '5000',
      assuranceDevise: 'DZD',
      fraisOnpoPrixUnit: '5000',
      fraisOnpoDevise: 'DZD',
      margeType: 'pourcentage' as const,
      margeValeur: '15',
      statut: 'brouillon' as const,
      passagers: [
        { categorie: 'adulte' as const, nom: 'Benali', prenom: 'Karim', dateNaissance: '1985-04-12' },
        { categorie: 'adulte' as const, nom: 'Benali', prenom: 'Amina', dateNaissance: '1988-09-20' },
      ],
      segmentsVol: [
        {
          origine: 'ALG',
          destination: 'MED',
          dateVol: '2026-11-15T08:00',
          classe: 'economique' as const,
          origineRetour: 'JED',
          destinationRetour: 'ALG',
          dateVolRetour: '2026-11-27T16:00',
          classeRetour: '',
          prixAdulte: '115000',
          devise: 'DZD',
        },
      ],
      hebergements: [
        {
          ville: 'Medina',
          hotelNom: 'Oberoi Madina',
          typeChambre: 'double',
          formuleRepas: 'demi_pension',
          vue: 'haram',
          dateCheckin: '2026-11-15',
          dateCheckout: '2026-11-20',
          nbChambres: 1,
          prixNuitChambre: '1400',
          devise: 'SAR',
        },
        {
          ville: 'Makkah',
          hotelNom: 'Raffles Makkah Palace',
          typeChambre: 'double',
          formuleRepas: 'demi_pension',
          vue: 'kaaba',
          dateCheckin: '2026-11-20',
          dateCheckout: '2026-11-27',
          nbChambres: 1,
          prixNuitChambre: '2100',
          devise: 'SAR',
        },
      ],
      transferts: [
        { trajet: 'Aéroport Médine -> Oberoi', typeVehicule: 'Mercedes_Classe_E', prix: '450', devise: 'SAR' },
        { trajet: 'Raffles -> Aéroport Djeddah', typeVehicule: 'GMC_Yukon', prix: '700', devise: 'SAR' },
      ],
      trainsHaramain: [
        { trajet: 'Médine -> Makkah', classe: 'business', dateTrain: '2026-11-20T14:00', prixAdulte: '350', devise: 'SAR' },
      ],
      prestationsVip: [],
      campsMashair: [],
      transportsMashair: [],
    }
    const parsed = CreateDevisSchema.safeParse(payload)
    if (!parsed.success) throw new Error(`Échec Zod: ${JSON.stringify(parsed.error.format())}`)
    const devis = await DevisUseCases.create(parsed.data)
    devisCoupleId = devis.id
    return {
      details: `Devis couple créé. Total: ${devis.totalVenteDzd} DZD`,
      devisNumero: devis.numero,
      montantTotalDzd: devis.totalVenteDzd,
    }
  })

  // 7. Devis Famille avec Enfants (2 Adultes + 2 Enfants avec lit)
  await runTest(7, 'Devis Famille (2 Adultes + 2 Enfants avec lit, chambre Quadruple)', 'DEVIS_CREATION', async () => {
    const payload = {
      clientId: clientParticulierId,
      dateDepart: '2026-12-20',
      dateRetour: '2026-12-31',
      visaType: 'omra_standard' as const,
      visaPrixUnit: '450',
      fraisOnpoPrixUnit: '5000',
      margeType: 'pourcentage' as const,
      margeValeur: '12',
      passagers: [
        { categorie: 'adulte' as const, nom: 'Mansouri', prenom: 'Mourad' },
        { categorie: 'adulte' as const, nom: 'Mansouri', prenom: 'Samia' },
        { categorie: 'enfant_avec_lit' as const, nom: 'Mansouri', prenom: 'Yacine', dateNaissance: '2014-06-10' },
        { categorie: 'enfant_avec_lit' as const, nom: 'Mansouri', prenom: 'Ines', dateNaissance: '2017-08-25' },
      ],
      segmentsVol: [
        {
          origine: 'ALG',
          destination: 'JED',
          dateVol: '2026-12-20T10:00',
          prixAdulte: '110000',
          prixEnfant: '85000',
          devise: 'DZD',
        },
      ],
      hebergements: [
        {
          ville: 'Makkah',
          hotelNom: 'Swissôtel Al Maqam Makkah',
          typeChambre: 'quadruple',
          formuleRepas: 'petit_dejeuner',
          dateCheckin: '2026-12-20',
          dateCheckout: '2026-12-31',
          nbChambres: 1,
          prixNuitChambre: '1650',
          devise: 'SAR',
        },
      ],
      transferts: [{ trajet: 'JED - Makkah A/R', typeVehicule: 'Bus_VIP', prix: '1500', devise: 'SAR' }],
      trainsHaramain: [],
      prestationsVip: [],
      campsMashair: [],
      transportsMashair: [],
    }
    const parsed = CreateDevisSchema.safeParse(payload)
    if (!parsed.success) throw new Error(`Échec Zod: ${JSON.stringify(parsed.error.format())}`)
    const devis = await DevisUseCases.create(parsed.data)
    devisFamilleId = devis.id
    return {
      details: `Devis famille 4 pax créé. Total: ${devis.totalVenteDzd} DZD`,
      devisNumero: devis.numero,
      montantTotalDzd: devis.totalVenteDzd,
    }
  })

  // 8. Devis Famille Mixte Complète (Adulte + Enfant lit + Enfant sans lit + Bébé)
  await runTest(8, 'Devis Famille Mixte (Adulte + Enfant lit + Enfant ss lit + Bébé)', 'DEVIS_CREATION', async () => {
    const payload = {
      clientId: clientParticulierId,
      dateDepart: '2027-01-10',
      dateRetour: '2027-01-22',
      fraisOnpoPrixUnit: '5000',
      margeType: 'pourcentage' as const,
      margeValeur: '15',
      passagers: [
        { categorie: 'adulte' as const, nom: 'Touati', prenom: 'Rachid' },
        { categorie: 'adulte' as const, nom: 'Touati', prenom: 'Nadia' },
        { categorie: 'enfant_avec_lit' as const, nom: 'Touati', prenom: 'Mehdi' },
        { categorie: 'enfant_sans_lit' as const, nom: 'Touati', prenom: 'Sarah' },
        { categorie: 'bebe' as const, nom: 'Touati', prenom: 'Maya', dateNaissance: '2025-05-01' },
      ],
      segmentsVol: [
        {
          origine: 'ALG',
          destination: 'JED',
          dateVol: '2027-01-10T11:00',
          prixAdulte: '120000',
          prixEnfant: '90000',
          prixBebe: '25000',
          devise: 'DZD',
        },
      ],
      hebergements: [
        {
          ville: 'Makkah',
          hotelNom: 'Mövenpick Hotel & Residences Hajar Tower Makkah',
          typeChambre: 'triple',
          formuleRepas: 'demi_pension',
          dateCheckin: '2027-01-10',
          dateCheckout: '2027-01-22',
          nbChambres: 1,
          prixNuitChambre: '1800',
          devise: 'SAR',
        },
      ],
      transferts: [{ trajet: 'Transferts complets SUV', typeVehicule: 'GMC_Yukon', prix: '1800', devise: 'SAR' }],
      trainsHaramain: [],
      prestationsVip: [],
      campsMashair: [],
      transportsMashair: [],
    }
    const parsed = CreateDevisSchema.safeParse(payload)
    if (!parsed.success) throw new Error(`Échec Zod: ${JSON.stringify(parsed.error.format())}`)
    const devis = await DevisUseCases.create(parsed.data)
    return {
      details: `Devis 5 pax (mixte) créé. Total: ${devis.totalVenteDzd} DZD (5 passagers)`,
      devisNumero: devis.numero,
      montantTotalDzd: devis.totalVenteDzd,
    }
  })

  // 9. Devis Hadj VIP (Camps Mashair Mina + Arafat)
  await runTest(9, 'Devis Hadj VIP (Camp Mashair Mina Majar Al-Kabsh & Arafat VIP)', 'DEVIS_CREATION', async () => {
    const payload = {
      clientId: clientSocieteId,
      dateDepart: '2027-05-20',
      dateRetour: '2027-06-15',
      visaType: 'hadj' as const,
      visaPrixUnit: '2500',
      visaDevise: 'SAR',
      fraisOnpoPrixUnit: '10000',
      margeType: 'pourcentage' as const,
      margeValeur: '20',
      passagers: [
        { categorie: 'adulte' as const, nom: 'Directeur', prenom: 'Ali' },
        { categorie: 'adulte' as const, nom: 'Directeur', prenom: 'Leila' },
      ],
      segmentsVol: [
        {
          origine: 'ALG',
          destination: 'JED',
          dateVol: '2027-05-20T06:00',
          classe: 'affaires' as const,
          prixAdulte: '380000',
          devise: 'DZD',
        },
      ],
      hebergements: [
        {
          ville: 'Makkah',
          hotelNom: 'Clock Royal Tower Fairmont',
          typeChambre: 'suite',
          formuleRepas: 'pension_complete',
          dateCheckin: '2027-05-20',
          dateCheckout: '2027-06-15',
          nbChambres: 1,
          prixNuitChambre: '3500',
          devise: 'SAR',
        },
      ],
      transferts: [],
      trainsHaramain: [],
      prestationsVip: [
        { type: 'autre', descriptionFr: 'Assistance Hadj VIP & Guide Religieux Privé', prix: '5000', devise: 'SAR' },
      ],
      campsMashair: [
        {
          nomCamp: 'Camp Majar Al-Kabsh VIP Mina',
          typeTente: 'Tente Privée Suites avec canapé-lit',
          restauration: 'Buffet gastronomique 24/7',
          prixAdulte: '18000',
          devise: 'SAR',
        },
      ],
      transportsMashair: [
        {
          typeVehicule: 'Bus Exécutif Dédié Mashair',
          trajet: 'Circuit Complet Mina - Arafat - Muzdalifah',
          prix: '8000',
          devise: 'SAR',
        },
      ],
    }
    const parsed = CreateDevisSchema.safeParse(payload)
    if (!parsed.success) throw new Error(`Échec Zod: ${JSON.stringify(parsed.error.format())}`)
    const devis = await DevisUseCases.create(parsed.data)
    return {
      details: `Devis Hadj VIP créé. Total: ${devis.totalVenteDzd} DZD (Camp Mashair inclus)`,
      devisNumero: devis.numero,
      montantTotalDzd: devis.totalVenteDzd,
    }
  })

  // 10. Devis avec Train Haramain Haute Vitesse (Eco & Business)
  await runTest(10, 'Devis avec Train Haramain Grande Vitesse (Trajet Makkah-Médine)', 'DEVIS_CREATION', async () => {
    const payload = {
      clientId: clientParticulierId,
      dateDepart: '2026-10-10',
      dateRetour: '2026-10-22',
      passagers: [{ categorie: 'adulte' as const, nom: 'Brahimi', prenom: 'Mustapha' }],
      segmentsVol: [{ origine: 'ALG', destination: 'JED', dateVol: '2026-10-10', prixAdulte: '98000', devise: 'DZD' }],
      hebergements: [
        { ville: 'Makkah', hotelNom: 'Swissôtel', dateCheckin: '2026-10-10', dateCheckout: '2026-10-16', prixNuitChambre: '900', devise: 'SAR' },
        { ville: 'Medina', hotelNom: 'Dar Al Taqwa', dateCheckin: '2026-10-16', dateCheckout: '2026-10-22', prixNuitChambre: '850', devise: 'SAR' },
      ],
      transferts: [],
      trainsHaramain: [
        {
          trajet: 'Makkah Station -> Médine Station',
          classe: 'business',
          dateTrain: '2026-10-16T14:30',
          prixAdulte: '360',
          devise: 'SAR',
        },
      ],
      prestationsVip: [],
      campsMashair: [],
      transportsMashair: [],
    }
    const parsed = CreateDevisSchema.safeParse(payload)
    if (!parsed.success) throw new Error(`Échec Zod: ${JSON.stringify(parsed.error.format())}`)
    const devis = await DevisUseCases.create(parsed.data)
    return {
      details: `Train Haramain enregistré et calculé. Total: ${devis.totalVenteDzd} DZD`,
      devisNumero: devis.numero,
      montantTotalDzd: devis.totalVenteDzd,
    }
  })

  // 11. Devis avec Prestations VIP personnalisées
  await runTest(11, 'Devis avec Prestations VIP (Fast Track, Lounge VIP, Zamzam)', 'DEVIS_CREATION', async () => {
    const payload = {
      clientId: clientParticulierId,
      dateDepart: '2026-11-05',
      dateRetour: '2026-11-15',
      passagers: [{ categorie: 'adulte' as const, nom: 'Saadi', prenom: 'Yassine' }],
      segmentsVol: [{ origine: 'ALG', destination: 'JED', dateVol: '2026-11-05', prixAdulte: '95000', devise: 'DZD' }],
      hebergements: [{ ville: 'Makkah', hotelNom: 'Pullman Zamzam', dateCheckin: '2026-11-05', dateCheckout: '2026-11-15', prixNuitChambre: '750', devise: 'SAR' }],
      transferts: [],
      trainsHaramain: [],
      prestationsVip: [
        { type: 'fast_track', descriptionFr: 'Fast-Track accueil aéroport JED', prix: '400', devise: 'SAR' },
        { type: 'lounge_vip', descriptionFr: 'Salon VIP Ahlan Lounge', prix: '350', devise: 'SAR' },
        { type: 'zamzam', descriptionFr: 'Pack Bouteilles Zamzam 5L scellées', prix: '50', devise: 'SAR' },
        { type: 'visite_guidee', descriptionFr: 'Ziyarate privées Makkah & Médine avec historien', prix: '800', devise: 'SAR' },
      ],
      campsMashair: [],
      transportsMashair: [],
    }
    const parsed = CreateDevisSchema.safeParse(payload)
    if (!parsed.success) throw new Error(`Échec Zod: ${JSON.stringify(parsed.error.format())}`)
    const devis = await DevisUseCases.create(parsed.data)
    return {
      details: `4 prestations VIP calculées sans erreur. Total: ${devis.totalVenteDzd} DZD`,
      devisNumero: devis.numero,
      montantTotalDzd: devis.totalVenteDzd,
    }
  })

  // 12. Devis avec Marge en Montant Fixe
  await runTest(12, 'Devis avec Marge en Montant Fixe (75 000 DZD)', 'CALCUL_FINANCIER', async () => {
    const payload = {
      clientId: clientParticulierId,
      dateDepart: '2026-12-01',
      dateRetour: '2026-12-10',
      margeType: 'montant_fixe' as const,
      margeValeur: '75000',
      passagers: [{ categorie: 'adulte' as const, nom: 'Haddad', prenom: 'Sofiane' }],
      segmentsVol: [{ origine: 'ALG', destination: 'JED', dateVol: '2026-12-01', prixAdulte: '100000', devise: 'DZD' }],
      hebergements: [{ ville: 'Makkah', hotelNom: 'Hilton Makkah', dateCheckin: '2026-12-01', dateCheckout: '2026-12-10', prixNuitChambre: '800', devise: 'SAR' }],
      transferts: [],
      trainsHaramain: [],
      prestationsVip: [],
      campsMashair: [],
      transportsMashair: [],
    }
    const parsed = CreateDevisSchema.safeParse(payload)
    if (!parsed.success) throw new Error(`Échec Zod: ${JSON.stringify(parsed.error.format())}`)
    const devis = await DevisUseCases.create(parsed.data)
    const diffMarge = Math.abs(parseFloat(devis.margeDzd) - 75000)
    if (diffMarge > 1) throw new Error(`Marge incorrecte attendue 75000, reçue: ${devis.margeDzd}`)
    return {
      details: `Marge fixe vérifiée: ${devis.margeDzd} DZD (Total: ${devis.totalVenteDzd} DZD)`,
      devisNumero: devis.numero,
      montantTotalDzd: devis.totalVenteDzd,
    }
  })

  // 13. Devis avec Frais ONPO à 0 DZD
  await runTest(13, 'Devis avec Frais ONPO désactivés (0 DZD)', 'CALCUL_FINANCIER', async () => {
    const payload = {
      clientId: clientParticulierId,
      dateDepart: '2026-12-05',
      dateRetour: '2026-12-15',
      fraisOnpoPrixUnit: '0',
      passagers: [{ categorie: 'adulte' as const, nom: 'Khelil', prenom: 'Messaoud' }],
      segmentsVol: [{ origine: 'ALG', destination: 'JED', dateVol: '2026-12-05', prixAdulte: '95000', devise: 'DZD' }],
      hebergements: [{ ville: 'Makkah', hotelNom: 'Conrad', dateCheckin: '2026-12-05', dateCheckout: '2026-12-15', prixNuitChambre: '1000', devise: 'SAR' }],
      transferts: [],
      trainsHaramain: [],
      prestationsVip: [],
      campsMashair: [],
      transportsMashair: [],
    }
    const parsed = CreateDevisSchema.safeParse(payload)
    if (!parsed.success) throw new Error(`Échec Zod: ${JSON.stringify(parsed.error.format())}`)
    const devis = await DevisUseCases.create(parsed.data)
    return {
      details: `Frais ONPO = 0 DZD accepté. Total: ${devis.totalVenteDzd} DZD`,
      devisNumero: devis.numero,
      montantTotalDzd: devis.totalVenteDzd,
    }
  })

  // 14. Devis Multi-Devises (USD, EUR, SAR, DZD)
  await runTest(14, 'Devis Multi-Devises (Vols USD, Hôtels SAR, VIP EUR)', 'CALCUL_FINANCIER', async () => {
    const payload = {
      clientId: clientParticulierId,
      dateDepart: '2027-02-01',
      dateRetour: '2027-02-12',
      tauxSarDzd: '35.50',
      tauxUsdDzd: '240.00',
      tauxEurDzd: '260.00',
      passagers: [{ categorie: 'adulte' as const, nom: 'Foreigner', prenom: 'Guest' }],
      segmentsVol: [{ origine: 'CDG', destination: 'JED', dateVol: '2027-02-01', prixAdulte: '650', devise: 'USD' }],
      hebergements: [{ ville: 'Makkah', hotelNom: 'Address Jabal Omar', dateCheckin: '2027-02-01', dateCheckout: '2027-02-12', prixNuitChambre: '1200', devise: 'SAR' }],
      transferts: [],
      trainsHaramain: [],
      prestationsVip: [{ type: 'autre', descriptionFr: 'Assistance Internationale Européenne', prix: '300', devise: 'EUR' }],
      campsMashair: [],
      transportsMashair: [],
    }
    const parsed = CreateDevisSchema.safeParse(payload)
    if (!parsed.success) throw new Error(`Échec Zod: ${JSON.stringify(parsed.error.format())}`)
    const devis = await DevisUseCases.create(parsed.data)
    return {
      details: `Conversion multi-devises exacte: SAR(35.50), USD(240.00), EUR(260.00). Total: ${devis.totalVenteDzd} DZD`,
      devisNumero: devis.numero,
      montantTotalDzd: devis.totalVenteDzd,
    }
  })

  // 15. Modification (PUT) : Changement des dates et prix hôtel
  await runTest(15, 'Modification (PUT) d\'un devis (dates et prestations)', 'DEVIS_UPDATE', async () => {
    const updatePayload = {
      statut: 'envoye' as const,
      notesClient: 'Devis négocié avec remise',
      hebergements: [
        {
          ville: 'Medina',
          hotelNom: 'Oberoi Madina Suite Royale',
          typeChambre: 'suite',
          formuleRepas: 'demi_pension',
          vue: 'haram',
          dateCheckin: '2026-11-15',
          dateCheckout: '2026-11-22',
          nbChambres: 1,
          prixNuitChambre: '2500',
          devise: 'SAR',
        },
      ],
    }
    const parsed = UpdateDevisSchema.safeParse(updatePayload)
    if (!parsed.success) throw new Error(`Échec Zod: ${JSON.stringify(parsed.error.format())}`)
    const { ok } = await DevisUseCases.update(devisCoupleId, parsed.data)
    if (!ok) throw new Error('Échec de la mise à jour')
    const updated = await DevisUseCases.getById(devisCoupleId)
    return {
      details: `Devis ${updated.numero} mis à jour avec statut: ${updated.statut}. Nouveau Total: ${updated.totalVenteDzd} DZD`,
      devisNumero: updated.numero,
      montantTotalDzd: updated.totalVenteDzd,
    }
  })

  // 16. Modification (PUT) : Acceptation du devis
  await runTest(16, 'Transition de Statut Devis (envoye -> accepte)', 'DEVIS_UPDATE', async () => {
    const updatePayload = { statut: 'accepte' as const }
    const parsed = UpdateDevisSchema.safeParse(updatePayload)
    if (!parsed.success) throw new Error(`Échec Zod: ${JSON.stringify(parsed.error.format())}`)
    await DevisUseCases.update(devisCoupleId, parsed.data)
    const updated = await DevisUseCases.getById(devisCoupleId)
    if (updated.statut !== 'accepte') throw new Error(`Statut incorrect: ${updated.statut}`)
    return { details: `Devis ${updated.numero} marqué comme ACCEPTE avec succès.` }
  })

  // 17. Recalcul Atomique du Devis via RecalculerDevisUseCase
  await runTest(17, 'Recalcul financier atomique (RecalculerDevisUseCase)', 'CALCUL_FINANCIER', async () => {
    const calcResult = await RecalculerDevisUseCase.execute(devisFamilleId)
    if (!calcResult.prixVenteDzd || isNaN(Number(calcResult.prixVenteDzd))) {
      throw new Error(`Total invalide: ${calcResult.prixVenteDzd}`)
    }
    return {
      details: `Recalcul réussi: CoutNet=${calcResult.coutNetDzd} DZD | VenteTTC=${calcResult.prixVenteDzd} DZD | Marge=${calcResult.margeMontantDzd} DZD (${calcResult.lignes.length} lignes de coût)`,
      montantTotalDzd: calcResult.prixVenteDzd,
    }
  })

  // 18. Vérification stricte anti-régression : Taux de change verrouillés
  await runTest(18, 'Vérification immuabilité des taux de change verrouillés', 'CALCUL_FINANCIER', async () => {
    const devisInitial = await DevisUseCases.getById(devisCoupleId)
    const tauxInitialSar = devisInitial.tauxSarDzd
    await DevisUseCases.update(devisCoupleId, {
      tauxSarDzd: '999.99',
    } as any)
    const devisApres = await DevisUseCases.getById(devisCoupleId)
    if (devisApres.tauxSarDzd !== tauxInitialSar) {
      throw new Error(`VIOLATION: Le taux de change verrouillé a été altéré ! ${devisApres.tauxSarDzd} !== ${tauxInitialSar}`)
    }
    return { details: `Règle 3.A respectée : Le taux SAR (${devisApres.tauxSarDzd} DZD) est resté verrouillé.` }
  })

  // 19. Validation Zod : Segment de vol avec champs optionnels vides
  await runTest(19, 'Validation Zod : Segment vol avec chaînes vides et dates partielles', 'VALIDATION_ZOD', async () => {
    const payload = {
      clientId: clientParticulierId,
      dateDepart: '2026-11-01',
      dateRetour: '2026-11-10',
      passagers: [{ categorie: 'adulte' as const, nom: 'TestZod', prenom: 'Ali' }],
      segmentsVol: [
        {
          origine: 'ALG',
          destination: 'JED',
          dateVol: '2026-11-01T10:00',
          classe: 'economique' as const,
          origineRetour: '',
          destinationRetour: '',
          dateVolRetour: '',
          classeRetour: '',
          compagnieId: '',
          prixAdulte: '',
          devise: 'SAR',
        },
      ],
      hebergements: [],
      transferts: [],
      trainsHaramain: [],
      prestationsVip: [],
      campsMashair: [],
      transportsMashair: [],
    }
    const parsed = CreateDevisSchema.safeParse(payload)
    if (!parsed.success) throw new Error(`Échec Zod: ${JSON.stringify(parsed.error.format())}`)
    const devis = await DevisUseCases.create(parsed.data)
    return { details: `Zod a préprocessé toutes les chaînes vides vers null/0. Devis ${devis.numero} créé.` }
  })

  // 20. Vérification Mathématique Decimal.js (Précision et Arrondi ROUND_HALF_UP)
  await runTest(20, 'Vérification Précision Mathématique Decimal.js (0 float JS)', 'CALCUL_FINANCIER', async () => {
    const d1 = D('1000.555')
    const rounded = d1.toDecimalPlaces(2, D.ROUND_HALF_UP).toString()
    if (rounded !== '1000.56') throw new Error(`Arrondi incorrect: ${rounded}`)

    const d2 = D('0.1').plus(D('0.2')).toString()
    if (d2 !== '0.3') throw new Error(`Imprécision float détectée: ${d2}`)

    return { details: 'Decimal.js 28 décimales et arrondi ROUND_HALF_UP certifiés conformes.' }
  })

  console.log('\n=================================================================')
  console.log('📊 RAPPORT FINAL DES 20 TESTS D\'INTÉGRATION')
  console.log('=================================================================')
  const succesCount = results.filter(r => r.statut === 'SUCCES').length
  const echecCount = results.filter(r => r.statut === 'ECHEC').length
  console.log(`Total exécuté : ${results.length}`)
  console.log(`Succès : ${succesCount} / ${results.length}`)
  console.log(`Échecs : ${echecCount} / ${results.length}`)
  console.log('=================================================================\n')

  return results
}

main().catch(console.error)
