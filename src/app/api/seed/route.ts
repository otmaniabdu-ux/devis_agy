import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/seed — remplit la base avec des données de démonstration
// Idempotent : supprime d'abord les anciennes données puis recrée
export async function POST(_req: NextRequest) {
  // 0. Nettoyage préalable (ordre inverse des dépendances)
  await db.prestationVIP.deleteMany()
  await db.trainHaramain.deleteMany()
  await db.transfert.deleteMany()
  await db.hebergement.deleteMany()
  await db.segmentVol.deleteMany()
  await db.passager.deleteMany()
  await db.devis.deleteMany()
  await db.client.deleteMany()
  await db.catalogueHotel.deleteMany()
  await db.catalogueCompagnie.deleteMany()
  await db.compteurNumerotation.deleteMany()
  // 1. Paramètres agence
  await db.parametresAgence.upsert({
    where: { id: 'default' },
    update: {
      nomFr: 'El Mouhssinouen Tours',
      nomAr: 'المحسنون للسياحة',
      sloganFr: 'Pèlerinage VIP — Hajj & Omra',
      sloganAr: 'حج وعمرة VIP',
      adresse: '31, Rue Larbi Ben Mhidi, Oued Rhiou, Algeria, 48300',
      telephone: '042.52.24.24 / 042.52.24.31 — WhatsApp: +213.555.90.53.28 — Abderrahmen Otmani: +213770803414',
      email: 'omra@elmouhssinoune.com / manager@elmouhssinoune.com',
      rc: '16/00-1234567 B 23',
      if: '000016312345678',
      art: '16001234567',
      capital: '1 000 000 DZD',
    },
    create: {
      id: 'default',
      nomFr: 'El Mouhssinouen Tours',
      nomAr: 'المحسنون للسياحة',
      sloganFr: 'Pèlerinage VIP — Hajj & Omra',
      sloganAr: 'حج وعمرة VIP',
      adresse: '31, Rue Larbi Ben Mhidi, Oued Rhiou, Algeria, 48300',
      telephone: '042.52.24.24 / 042.52.24.31 — WhatsApp: +213.555.90.53.28 — Abderrahmen Otmani: +213770803414',
      email: 'omra@elmouhssinoune.com / manager@elmouhssinoune.com',
      rc: '16/00-1234567 B 23',
      if: '000016312345678',
      art: '16001234567',
      capital: '1 000 000 DZD',
    },
  })

  // 2. Taux de change
  const tauxSeed = [
    { code: 'SAR', libelleFr: 'Riyal Saoudien', libelleAr: 'ريال سعودي', tauxDzd: '35.50' },
    { code: 'USD', libelleFr: 'Dollar Américain', libelleAr: 'دولار أمريكي', tauxDzd: '240.00' },
    { code: 'EUR', libelleFr: 'Euro', libelleAr: 'يورو', tauxDzd: '260.00' },
  ]
  for (const t of tauxSeed) {
    await db.tauxChange.upsert({
      where: { code: t.code },
      update: { tauxDzd: t.tauxDzd },
      create: t,
    })
  }

  // 3. Compagnies aériennes
  const compagnies = [
    { nom: 'Saudi Arabian Airlines', codeIata: 'SV' },
    { nom: 'Air Algérie', codeIata: 'AH' },
    { nom: 'Turkish Airlines', codeIata: 'TK' },
    { nom: 'Qatar Airways', codeIata: 'QR' },
    { nom: 'Emirates', codeIata: 'EK' },
  ]
  for (const c of compagnies) {
    await db.catalogueCompagnie.create({ data: c })
  }

  // 4. Hôtels
  const hotels = [
    // Makkah
    { ville: 'Makkah', nom: 'Swissôtel Al Maqam', nomAr: 'سويس أوتيل المقام', etoiles: 5, distanceHaram: 50, prixSingleSar: '1200', prixDoubleSar: '850', prixTripleSar: '750', prixQuadrupleSar: '700' },
    { ville: 'Makkah', nom: 'Fairmont Clock Tower', nomAr: 'فيرمونت برج الساعة', etoiles: 5, distanceHaram: 30, prixSingleSar: '2500', prixDoubleSar: '1800', prixTripleSar: '1500', prixQuadrupleSar: '1300' },
    { ville: 'Makkah', nom: 'Hilton Suites Makkah', nomAr: 'هيلتون سويتس مكة', etoiles: 5, distanceHaram: 100, prixSingleSar: '1400', prixDoubleSar: '950', prixTripleSar: '820', prixQuadrupleSar: '760' },
    { ville: 'Makkah', nom: 'Le Meridien Towers', nomAr: 'لو ميريديان تاورز', etoiles: 5, distanceHaram: 250, prixSingleSar: '900', prixDoubleSar: '650', prixTripleSar: '580', prixQuadrupleSar: '540' },
    // Medine
    { ville: 'Medine', nom: 'The Oberoi Madina', nomAr: 'أوبروي المدينة', etoiles: 5, distanceHaram: 80, prixSingleSar: '1800', prixDoubleSar: '1300', prixTripleSar: '1100', prixQuadrupleSar: '980' },
    { ville: 'Medine', nom: 'Anwar Al Madinah Mövenpick', nomAr: 'أنوار المدينة موفنبيك', etoiles: 5, distanceHaram: 50, prixSingleSar: '1100', prixDoubleSar: '780', prixTripleSar: '680', prixQuadrupleSar: '620' },
    { ville: 'Medine', nom: 'Dar Al Taqwa Hotel', nomAr: 'دار التقوى', etoiles: 5, distanceHaram: 30, prixSingleSar: '1500', prixDoubleSar: '1050', prixTripleSar: '900', prixQuadrupleSar: '820' },
  ]
  for (const h of hotels) {
    await db.catalogueHotel.create({ data: { ...h, devise: 'SAR' } })
  }

  // 5. Clients
  const clients = [
    { type: 'particulier', nom: 'Benali', prenom: 'Karim', telephone: '+213 661 23 45 67', email: 'k.benali@example.dz', adresse: 'Hydra, Alger' },
    { type: 'particulier', nom: 'Cherif', prenom: 'Amina', telephone: '+213 770 11 22 33', email: 'a.cherif@example.dz', adresse: 'Oran' },
    { type: 'societe', nom: '—', raisonSociale: 'SARL Voyage El Baraka', telephone: '+213 21 55 66 77', email: 'contact@elbaraka.dz', adresse: 'Constantine' },
    { type: 'particulier', nom: 'Haddad', prenom: 'Mohamed', telephone: '+213 555 99 88 77', email: 'm.haddad@example.dz', adresse: 'Sétif' },
  ]
  const createdClients = []
  for (const c of clients) {
    createdClients.push(await db.client.create({ data: c as any }))
  }

  // 6. Devis d'exemple (2 devis complets)
  const dateDepart1 = new Date('2026-09-15')
  const dateRetour1 = new Date('2026-09-29')

  await db.devis.create({
    data: {
      numero: 'DEVIS-2026-09-001',
      clientId: createdClients[0].id,
      dateDepart: dateDepart1,
      dateRetour: dateRetour1,
      tauxSarDzd: '35.50',
      tauxUsdDzd: '240.00',
      tauxEurDzd: '260.00',
      visaType: 'omra_standard',
      visaPrixUnit: '450',
      visaDevise: 'SAR',
      assurancePrixUnit: '80',
      assuranceDevise: 'SAR',
      margeType: 'pourcentage',
      margeValeur: '15',
      statut: 'brouillon',
      notesClient: 'Pèlerinage Omra VIP — famille de 4 personnes. Vol direct Alger→Médine, retour Djeddah→Alger.',
      passagers: {
        create: [
          { categorie: 'adulte', nom: 'Benali', prenom: 'Karim', dateNaissance: new Date('1978-03-12'), passeportNumero: 'ALG1234567', passeportExpiration: new Date('2028-05-15') },
          { categorie: 'adulte', nom: 'Benali', prenom: 'Yasmina', dateNaissance: new Date('1982-07-25'), passeportNumero: 'ALG1234568', passeportExpiration: new Date('2027-11-10') },
          { categorie: 'enfant_avec_lit', nom: 'Benali', prenom: 'Ahmed', dateNaissance: new Date('2015-02-18'), passeportNumero: 'ALG1234569', passeportExpiration: new Date('2027-02-18') },
          { categorie: 'bebe', nom: 'Benali', prenom: 'Sara', dateNaissance: new Date('2024-08-01'), passeportNumero: 'ALG1234570', passeportExpiration: new Date('2029-08-01') },
        ],
      },
      segmentsVol: {
        create: [
          { origine: 'Alger (ALG)', destination: 'Médine (MED)', dateVol: new Date('2026-09-15T08:00:00'), classe: 'economique', compagnieId: (await db.catalogueCompagnie.findFirst({ where: { codeIata: 'SV' } }))!.id, prixAdulte: '850', prixEnfant: '650', prixBebe: '100', devise: 'USD', ordre: 0 },
          { origine: 'Djeddah (JED)', destination: 'Alger (ALG)', dateVol: new Date('2026-09-29T16:00:00'), classe: 'economique', compagnieId: (await db.catalogueCompagnie.findFirst({ where: { codeIata: 'SV' } }))!.id, prixAdulte: '780', prixEnfant: '600', prixBebe: '90', devise: 'USD', ordre: 1 },
        ],
      },
      hebergements: {
        create: [
          { ville: 'Medine', hotelId: (await db.catalogueHotel.findFirst({ where: { nom: 'Anwar Al Madinah Mövenpick' } }))!.id, hotelNom: 'Anwar Al Madinah Mövenpick', typeChambre: 'quadruple', formuleRepas: 'demi_pension', vue: 'haram', dateCheckin: new Date('2026-09-15'), dateCheckout: new Date('2026-09-20'), nbNuitees: 5, nbChambres: 1, prixNuitChambre: '780', devise: 'SAR' },
          { ville: 'Makkah', hotelId: (await db.catalogueHotel.findFirst({ where: { nom: 'Swissôtel Al Maqam' } }))!.id, hotelNom: 'Swissôtel Al Maqam', typeChambre: 'quadruple', formuleRepas: 'demi_pension', vue: 'haram', dateCheckin: new Date('2026-09-20'), dateCheckout: new Date('2026-09-29'), nbNuitees: 9, nbChambres: 1, prixNuitChambre: '850', devise: 'SAR' },
        ],
      },
      transferts: {
        create: [
          { trajet: 'Aéroport Médine → Hôtel Anwar Al Madinah', typeVehicule: 'GMC_Yukon', prix: '350', devise: 'SAR', obligatoire: true, ordre: 0 },
          { trajet: 'Hôtel Medine → Gare Haramain (Médine)', typeVehicule: 'Mercedes_Classe_E', prix: '150', devise: 'SAR', obligatoire: true, ordre: 1 },
          { trajet: 'Gare Haramain (Makkah) → Hôtel Swissôtel Al Maqam', typeVehicule: 'Mercedes_Classe_E', prix: '150', devise: 'SAR', obligatoire: true, ordre: 2 },
          { trajet: 'Hôtel Swissôtel → Aéroport Djeddah', typeVehicule: 'GMC_Yukon', prix: '400', devise: 'SAR', obligatoire: true, ordre: 3 },
        ],
      },
      trainsHaramain: {
        create: [
          { trajet: 'Médine → Makkah', classe: 'business', dateTrain: new Date('2026-09-20T10:00:00'), prixAdulte: '120', prixEnfant: '60', devise: 'SAR' },
        ],
      },
      prestationsVip: {
        create: [
          { type: 'ziyarate', descriptionFr: 'Ziyarate privée Médine (Moutawif + véhicule privé, 3h)', descriptionAr: 'زيارات خاصة بالمدينة', prix: '500', devise: 'SAR' },
          { type: 'ziyarate', descriptionFr: 'Ziyarate privée Makkah (Moutawif + véhicule privé, 4h)', descriptionAr: 'زيارات خاصة بمكة', prix: '600', devise: 'SAR' },
          { type: 'lounge', descriptionFr: 'Lounge VIP aéroport Djeddah (entrée × 4)', descriptionAr: 'صالة كبار الزوار', prix: '320', devise: 'SAR' },
          { type: 'fast_track', descriptionFr: 'Fast-Track départ Alger + arrivée Médine', descriptionAr: 'مسار سريع', prix: '200', devise: 'SAR' },
          { type: 'zamzam', descriptionFr: 'Eau Zamzam (10L × 4 bidons)', descriptionAr: 'ماء زمزم', prix: '150', devise: 'SAR' },
        ],
      },
    },
  })

  // Devis 2 — Client Cherif (couple, voyage premium)
  await db.devis.create({
    data: {
      numero: 'DEVIS-2026-09-002',
      clientId: createdClients[1].id,
      dateDepart: new Date('2026-10-10'),
      dateRetour: new Date('2026-10-22'),
      tauxSarDzd: '35.50',
      tauxUsdDzd: '240.00',
      tauxEurDzd: '260.00',
      visaType: 'omra_standard',
      visaPrixUnit: '450',
      visaDevise: 'SAR',
      assurancePrixUnit: '80',
      assuranceDevise: 'SAR',
      margeType: 'pourcentage',
      margeValeur: '18',
      statut: 'envoye',
      notesClient: 'Couple — pack premium avec vue Kaaba.',
      passagers: {
        create: [
          { categorie: 'adulte', nom: 'Cherif', prenom: 'Amina', dateNaissance: new Date('1985-09-12'), passeportNumero: 'ALG9876543', passeportExpiration: new Date('2026-12-15') },
          { categorie: 'adulte', nom: 'Cherif', prenom: 'Omar', dateNaissance: new Date('1980-04-03'), passeportNumero: 'ALG9876544', passeportExpiration: new Date('2028-06-20') },
        ],
      },
      segmentsVol: {
        create: [
          { origine: 'Alger (ALG)', destination: 'Makkah (JED)', dateVol: new Date('2026-10-10T09:00:00'), classe: 'affaires', compagnieId: (await db.catalogueCompagnie.findFirst({ where: { codeIata: 'QR' } }))!.id, prixAdulte: '1450', prixEnfant: '0', prixBebe: '0', devise: 'USD', ordre: 0 },
          { origine: 'Djeddah (JED)', destination: 'Alger (ALG)', dateVol: new Date('2026-10-22T17:00:00'), classe: 'affaires', compagnieId: (await db.catalogueCompagnie.findFirst({ where: { codeIata: 'QR' } }))!.id, prixAdulte: '1350', prixEnfant: '0', prixBebe: '0', devise: 'USD', ordre: 1 },
        ],
      },
      hebergements: {
        create: [
          { ville: 'Makkah', hotelId: (await db.catalogueHotel.findFirst({ where: { nom: 'Fairmont Clock Tower' } }))!.id, hotelNom: 'Fairmont Clock Tower', typeChambre: 'double', formuleRepas: 'pension_complete', vue: 'kaaba', dateCheckin: new Date('2026-10-10'), dateCheckout: new Date('2026-10-22'), nbNuitees: 12, nbChambres: 1, prixNuitChambre: '1800', devise: 'SAR' },
        ],
      },
      transferts: {
        create: [
          { trajet: 'Aéroport Djeddah → Hôtel Fairmont (aller)', typeVehicule: 'Mercedes_Classe_E', prix: '450', devise: 'SAR', obligatoire: true, ordre: 0 },
          { trajet: 'Hôtel Fairmont → Aéroport Djeddah (retour)', typeVehicule: 'Mercedes_Classe_E', prix: '450', devise: 'SAR', obligatoire: true, ordre: 1 },
        ],
      },
      prestationsVip: {
        create: [
          { type: 'ziyarate', descriptionFr: 'Ziyarate privée complète Makkah (journée entière)', descriptionAr: 'زيارات خاصة بمكة', prix: '900', devise: 'SAR' },
          { type: 'lounge', descriptionFr: 'Lounge VIP aéroport Djeddah (× 2)', descriptionAr: 'صالة كبار الزوار', prix: '160', devise: 'SAR' },
          { type: 'bagagerie', descriptionFr: 'Prise en charge bagages (aller + retour)', descriptionAr: 'خدمة الأمتعة', prix: '120', devise: 'SAR' },
        ],
      },
    },
  })

  // 7. Synchronise les compteurs de numérotation avec les devis créés
  const allDevis = await db.devis.findMany({ select: { numero: true } })
  const parCle: Record<string, number> = {}
  for (const d of allDevis) {
    const match = d.numero.match(/^DEVIS-(\d{4})-(\d{2})-(\d+)$/)
    if (match) {
      const cle = `DEVIS-${match[1]}-${match[2]}`
      const num = parseInt(match[3], 10)
      if (!parCle[cle] || parCle[cle] < num) {
        parCle[cle] = num
      }
    }
  }
  for (const [cle, maxNum] of Object.entries(parCle)) {
    await db.compteurNumerotation.upsert({
      where: { cle },
      update: { dernierNumero: maxNum },
      create: { cle, dernierNumero: maxNum },
    })
  }

  return NextResponse.json({ ok: true, message: 'Base seedée avec succès' })
}
