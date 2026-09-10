import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import { db } from '@/lib/db'

interface ReservationOptions {
  devisId: string
  typePrestation: 'hotel' | 'vol' | 'transport' | 'global'
  targetId?: string // hotelId or segmentVolId if specific
}

function escapeXml(unsafe: string | null | undefined): string {
  if (!unsafe) return ''
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function fmtDateEn(d: Date | string | null | undefined): string {
  if (!d) return '—'
  const date = typeof d === 'string' ? new Date(d) : d
  if (isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function translateRoomType(type: string): string {
  const t = (type ?? '').toLowerCase()
  switch (t) {
    case 'single':
      return 'Single Room (1 Bed)'
    case 'double':
      return 'Double Room (2 Beds)'
    case 'triple':
      return 'Triple Room (3 Beds)'
    case 'quadruple':
      return 'Quadruple Room (4 Beds)'
    default:
      return type ? type.charAt(0).toUpperCase() + type.slice(1) + ' Room' : 'Standard Room'
  }
}

function translateMealPlan(plan: string): string {
  const p = (plan ?? '').toLowerCase()
  switch (p) {
    case 'petit_dejeuner':
      return 'Bed & Breakfast (BB)'
    case 'demi_pension':
      return 'Half Board (HB - Breakfast & Dinner)'
    case 'pension_complete':
      return 'Full Board (FB - Breakfast, Lunch & Dinner)'
    case 'logement_seul':
    case 'room_only':
      return 'Room Only (RO - No Meals)'
    default:
      return plan ? plan.replace(/_/g, ' ').toUpperCase() : 'Half Board (HB)'
  }
}

function translateView(view: string): string {
  const v = (view ?? '').toLowerCase()
  switch (v) {
    case 'kaaba':
      return 'Kaaba View'
    case 'haram':
      return 'Haram View'
    case 'city':
    case 'ville':
      return 'City View'
    default:
      return view ? view.toUpperCase() : 'Standard View'
  }
}

function translateCategory(cat: string): string {
  const c = (cat ?? '').toLowerCase()
  switch (c) {
    case 'adulte':
      return 'ADULT'
    case 'enfant_avec_lit':
      return 'CHILD (BED)'
    case 'enfant_sans_lit':
      return 'CHILD (NO BED)'
    case 'bebe':
      return 'INFANT'
    default:
      return (cat ?? 'GUEST').toUpperCase()
  }
}

export async function generateReservationJpeg(options: ReservationOptions): Promise<Buffer> {
  const devis = await db.devis.findUnique({
    where: { id: options.devisId },
    include: {
      client: true,
      passagers: true,
      hebergements: { include: { hotel: true } },
      segmentsVol: { include: { compagnie: true } },
      transferts: true,
      trainsHaramain: true,
      prestationsVip: true,
    },
  })

  if (!devis) throw new Error('Devis introuvable')

  const parametres = await db.parametresAgence.findUnique({
    where: { id: 'default' },
  })

  // Charger le logo en base64 s'il existe
  let logoBase64 = ''
  try {
    const logoPath = path.join(process.cwd(), 'public', 'Logo_S.png')
    if (fs.existsSync(logoPath)) {
      logoBase64 = fs.readFileSync(logoPath).toString('base64')
    }
  } catch {
    // Ignorer si le logo ne peut pas être lu
  }

  // Nom et prénom du client ou du 1er passager
  const clientNomComplet =
    devis.client.type === 'societe'
      ? (devis.client.raisonSociale || `${devis.client.nom} ${devis.client.prenom ?? ''}`.trim())
      : `${devis.client.nom} ${devis.client.prenom ?? ''}`.trim() ||
        (devis.passagers[0] ? `${devis.passagers[0].nom} ${devis.passagers[0].prenom}`.trim() : 'VIP Guest')

  // Déterminer les éléments selon la prestation
  let documentTitle = 'HOTEL RESERVATION REQUEST'
  let documentSubtitle = 'OFFICIAL BOOKING REQUEST &amp; ROOMING LIST'
  let detailsBlockSvg = ''

  if (options.typePrestation === 'hotel') {
    const targetHeberg = options.targetId
      ? devis.hebergements.find((h) => h.id === options.targetId)
      : devis.hebergements[0]

    documentTitle = 'HOTEL RESERVATION REQUEST'
    documentSubtitle = 'OFFICIAL BOOKING ORDER &amp; ROOMING LIST'

    if (targetHeberg) {
      const hotelName = targetHeberg.hotel?.nom || targetHeberg.hotelNom || 'VIP Hotel'
      const city = targetHeberg.ville ? targetHeberg.ville.toUpperCase() : 'SAUDI ARABIA'
      const checkinStr = fmtDateEn(targetHeberg.dateCheckin)
      const checkoutStr = fmtDateEn(targetHeberg.dateCheckout)
      const nightsCount = targetHeberg.nbNuitees ?? 1
      const roomsCount = targetHeberg.nbChambres ?? 1
      const roomTypeStr = translateRoomType(targetHeberg.typeChambre)
      const mealPlanStr = translateMealPlan(targetHeberg.formuleRepas)
      const roomViewStr = translateView(targetHeberg.vue)

      detailsBlockSvg = `
        <!-- Main Details Card -->
        <rect x="50" y="310" width="1100" height="260" rx="14" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2"/>

        <!-- Top Row: Hotel Name & Destination -->
        <rect x="50" y="310" width="1100" height="52" rx="14" fill="#0B1B3D"/>
        <rect x="50" y="340" width="1100" height="22" fill="#0B1B3D"/>
        <text x="75" y="344" font-size="20" font-weight="900" fill="#FDE68A" letter-spacing="0.5">
          HOTEL NAME : ${escapeXml(hotelName.toUpperCase())} (${escapeXml(city)})
        </text>
        <text x="1125" y="344" font-size="15" font-weight="bold" fill="#CBD5E1" text-anchor="end">
          REF : ${escapeXml(devis.numero)}
        </text>

        <!-- Row 1: Guest Name & Total Guests -->
        <text x="75" y="390" font-size="15" font-weight="bold" fill="#64748B">GUEST / CLIENT NAME :</text>
        <text x="260" y="390" font-size="16" font-weight="900" fill="#0F172A">
          ${escapeXml(clientNomComplet.toUpperCase())} ${devis.client.telephone ? `(Tel: ${escapeXml(devis.client.telephone)})` : ''}
        </text>

        <text x="750" y="390" font-size="15" font-weight="bold" fill="#64748B">NUMBER OF GUESTS :</text>
        <text x="930" y="390" font-size="16" font-weight="900" fill="#0B1B3D">${devis.passagers.length} Person(s)</text>

        <line x1="75" y1="405" x2="1125" y2="405" stroke="#F1F5F9" stroke-width="1.5"/>

        <!-- Row 2: Check-in, Check-out & Number of Nights -->
        <text x="75" y="435" font-size="15" font-weight="bold" fill="#64748B">CHECK-IN DATE :</text>
        <text x="260" y="435" font-size="16" font-weight="900" fill="#047857">${escapeXml(checkinStr)}</text>

        <text x="450" y="435" font-size="15" font-weight="bold" fill="#64748B">CHECK-OUT DATE :</text>
        <text x="610" y="435" font-size="16" font-weight="900" fill="#BE123C">${escapeXml(checkoutStr)}</text>

        <text x="830" y="435" font-size="15" font-weight="bold" fill="#64748B">NUMBER OF NIGHTS :</text>
        <text x="1000" y="435" font-size="16" font-weight="900" fill="#0F172A">${nightsCount} Night(s)</text>

        <line x1="75" y1="450" x2="1125" y2="450" stroke="#F1F5F9" stroke-width="1.5"/>

        <!-- Row 3: Number of Rooms & Room Type -->
        <text x="75" y="480" font-size="15" font-weight="bold" fill="#64748B">NUMBER OF ROOMS :</text>
        <text x="260" y="480" font-size="16" font-weight="900" fill="#0F172A">${roomsCount} Room(s)</text>

        <text x="450" y="480" font-size="15" font-weight="bold" fill="#64748B">ROOM TYPE :</text>
        <text x="565" y="480" font-size="16" font-weight="900" fill="#0B1B3D">${escapeXml(roomTypeStr)}</text>

        <text x="830" y="480" font-size="15" font-weight="bold" fill="#64748B">ROOM VIEW :</text>
        <text x="940" y="480" font-size="16" font-weight="900" fill="#0F172A">${escapeXml(roomViewStr)}</text>

        <line x1="75" y1="495" x2="1125" y2="495" stroke="#F1F5F9" stroke-width="1.5"/>

        <!-- Row 4: Meal Plan (Highlighted) -->
        <rect x="75" y="508" width="1050" height="42" rx="8" fill="#FFFBEB" stroke="#FDE68A" stroke-width="1.5"/>
        <text x="95" y="534" font-size="15" font-weight="bold" fill="#92400E">MEAL PLAN (BOARD BASIS) :</text>
        <text x="340" y="534" font-size="16" font-weight="900" fill="#B45309">${escapeXml(mealPlanStr)}</text>
      `
    }
  } else if (options.typePrestation === 'vol') {
    documentTitle = 'FLIGHT RESERVATION REQUEST'
    documentSubtitle = 'AIRLINE TICKETING ORDER &amp; PASSENGERS LIST'
    const vol = devis.segmentsVol[0]
    if (vol) {
      detailsBlockSvg = `
        <rect x="50" y="310" width="1100" height="260" rx="14" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2"/>
        <rect x="50" y="310" width="1100" height="52" rx="14" fill="#0B1B3D"/>
        <rect x="50" y="340" width="1100" height="22" fill="#0B1B3D"/>
        <text x="75" y="344" font-size="20" font-weight="900" fill="#FDE68A">
          AIRLINE : ${escapeXml(vol.compagnie?.nom?.toUpperCase() ?? 'PARTNER AIRLINE')}
        </text>
        <text x="1125" y="344" font-size="15" font-weight="bold" fill="#CBD5E1" text-anchor="end">
          REF : ${escapeXml(devis.numero)}
        </text>

        <text x="75" y="390" font-size="15" font-weight="bold" fill="#64748B">GUEST / CLIENT NAME :</text>
        <text x="260" y="390" font-size="16" font-weight="900" fill="#0F172A">
          ${escapeXml(clientNomComplet.toUpperCase())}
        </text>
        <text x="750" y="390" font-size="15" font-weight="bold" fill="#64748B">TOTAL PASSENGERS :</text>
        <text x="930" y="390" font-size="16" font-weight="900" fill="#0B1B3D">${devis.passagers.length} Person(s)</text>

        <line x1="75" y1="405" x2="1125" y2="405" stroke="#F1F5F9" stroke-width="1.5"/>

        <text x="75" y="440" font-size="15" font-weight="bold" fill="#64748B">OUTBOUND FLIGHT :</text>
        <text x="240" y="440" font-size="16" font-weight="900" fill="#0F172A">
          ${escapeXml(vol.origine)} → ${escapeXml(vol.destination)} on ${escapeXml(fmtDateEn(vol.dateVol))} (${escapeXml(vol.classe.toUpperCase())})
        </text>

        ${
          vol.origineRetour
            ? `<text x="75" y="480" font-size="15" font-weight="bold" fill="#64748B">INBOUND FLIGHT :</text>
               <text x="240" y="480" font-size="16" font-weight="900" fill="#0F172A">
                 ${escapeXml(vol.origineRetour)} → ${escapeXml(vol.destinationRetour ?? '')} on ${escapeXml(vol.dateVolRetour ? fmtDateEn(vol.dateVolRetour) : '—')} (${escapeXml((vol.classeRetour ?? 'economy').toUpperCase())})
               </text>`
            : ''
        }
      `
    }
  } else if (options.typePrestation === 'transport') {
    documentTitle = 'VIP TRANSPORTATION ORDER'
    documentSubtitle = 'GROUND TRANSFER &amp; LOGISTICS ORDER'
    const transfertsDesc = devis.transferts.map((t) => `${t.trajet} (${t.typeVehicule.replace(/_/g, ' ')})`).join(' • ')
    detailsBlockSvg = `
      <rect x="50" y="310" width="1100" height="260" rx="14" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2"/>
      <rect x="50" y="310" width="1100" height="52" rx="14" fill="#0B1B3D"/>
      <rect x="50" y="340" width="1100" height="22" fill="#0B1B3D"/>
      <text x="75" y="344" font-size="20" font-weight="900" fill="#FDE68A">
        SERVICE : VIP GROUND TRANSPORTATION &amp; AIRPORT TRANSFERS
      </text>
      <text x="1125" y="344" font-size="15" font-weight="bold" fill="#CBD5E1" text-anchor="end">
        REF : ${escapeXml(devis.numero)}
      </text>

      <text x="75" y="390" font-size="15" font-weight="bold" fill="#64748B">GUEST / CLIENT NAME :</text>
      <text x="260" y="390" font-size="16" font-weight="900" fill="#0F172A">${escapeXml(clientNomComplet.toUpperCase())}</text>

      <text x="75" y="435" font-size="15" font-weight="bold" fill="#64748B">ITINERARY / ROUTES :</text>
      <text x="260" y="435" font-size="16" font-weight="bold" fill="#0F172A">${escapeXml(transfertsDesc || 'Private Airport & Inter-city Transfers')}</text>

      <text x="75" y="475" font-size="15" font-weight="bold" fill="#64748B">TRAVEL PERIOD :</text>
      <text x="260" y="475" font-size="16" font-weight="bold" fill="#0F172A">${escapeXml(fmtDateEn(devis.dateDepart))} to ${escapeXml(fmtDateEn(devis.dateRetour))}</text>
    `
  } else {
    // Global
    documentTitle = 'GLOBAL VIP RESERVATION VOUCHER'
    documentSubtitle = 'UMRAH &amp; HAJJ COMPREHENSIVE SERVICE ORDER'
    const hotelsStr = devis.hebergements.map((h) => `${h.hotelNom} (${h.ville})`).join(' + ')
    detailsBlockSvg = `
      <rect x="50" y="310" width="1100" height="260" rx="14" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2"/>
      <rect x="50" y="310" width="1100" height="52" rx="14" fill="#0B1B3D"/>
      <rect x="50" y="340" width="1100" height="22" fill="#0B1B3D"/>
      <text x="75" y="344" font-size="20" font-weight="900" fill="#FDE68A">
        SERVICE : COMPLETE VIP PILGRIMAGE PACKAGE
      </text>
      <text x="1125" y="344" font-size="15" font-weight="bold" fill="#CBD5E1" text-anchor="end">
        REF : ${escapeXml(devis.numero)}
      </text>

      <text x="75" y="390" font-size="15" font-weight="bold" fill="#64748B">GUEST / CLIENT NAME :</text>
      <text x="260" y="390" font-size="16" font-weight="900" fill="#0F172A">${escapeXml(clientNomComplet.toUpperCase())}</text>

      <text x="75" y="435" font-size="15" font-weight="bold" fill="#64748B">HOTELS BOOKED :</text>
      <text x="260" y="435" font-size="16" font-weight="bold" fill="#0F172A">${escapeXml(hotelsStr || 'Makkah & Madinah VIP Hotels')}</text>

      <text x="75" y="475" font-size="15" font-weight="bold" fill="#64748B">TRAVEL PERIOD :</text>
      <text x="260" y="475" font-size="16" font-weight="bold" fill="#0F172A">${escapeXml(fmtDateEn(devis.dateDepart))} to ${escapeXml(fmtDateEn(devis.dateRetour))}</text>
    `
  }

  // Rooming list / Passengers table (English)
  let passagersRows = ''
  let currentY = 660
  devis.passagers.slice(0, 12).forEach((p, idx) => {
    const bgRow = idx % 2 === 0 ? '#F8FAFC' : '#FFFFFF'
    passagersRows += `
      <rect x="50" y="${currentY - 26}" width="1100" height="38" fill="${bgRow}" stroke="#E2E8F0" stroke-width="1"/>
      <text x="75" y="${currentY}" font-size="15" font-weight="bold" fill="#334155">${idx + 1}</text>
      <text x="130" y="${currentY}" font-size="15" font-weight="bold" fill="#0F172A">${escapeXml(p.nom.toUpperCase())} ${escapeXml(p.prenom)}</text>
      <text x="560" y="${currentY}" font-size="15" font-family="monospace" font-weight="bold" fill="#0B1B3D">${escapeXml(p.passeportNumero ?? '—')}</text>
      <text x="800" y="${currentY}" font-size="14" fill="#64748B">${p.dateNaissance ? escapeXml(fmtDateEn(p.dateNaissance)) : '—'}</text>
      <text x="1000" y="${currentY}" font-size="14" fill="#A16207" font-weight="bold">${escapeXml(translateCategory(p.categorie))}</text>
    `
    currentY += 40
  })

  // Date of request in English
  const dateJourEn = fmtDateEn(new Date())

  const svg = `
    <svg width="1200" height="1750" viewBox="0 0 1200 1750" xmlns="http://www.w3.org/2000/svg" font-family="'Segoe UI', Roboto, Helvetica, Arial, sans-serif">
      <!-- Background -->
      <rect x="0" y="0" width="1200" height="1750" fill="#F8FAFC"/>

      <!-- Luxury Outer Frame (Gold & Navy) -->
      <rect x="25" y="25" width="1150" height="1700" rx="16" fill="#FFFFFF" stroke="#C5A059" stroke-width="4"/>
      <rect x="35" y="35" width="1130" height="1680" rx="12" fill="none" stroke="#0B1B3D" stroke-width="1" stroke-opacity="0.2"/>

      <!-- Header Navy Banner -->
      <path d="M 25 37 Q 25 25 37 25 L 1163 25 Q 1175 25 1175 37 L 1175 190 L 25 190 Z" fill="#0B1B3D"/>
      <line x1="25" y1="190" x2="1175" y2="190" stroke="#C5A059" stroke-width="4"/>

      <!-- Agency Logo (if present) -->
      ${
        logoBase64
          ? `<image href="data:image/png;base64,${logoBase64}" x="55" y="42" width="120" height="120" preserveAspectRatio="xMidYMid meet"/>`
          : ''
      }

      <!-- Agency Header Info (in English & Arabic) -->
      <text x="${logoBase64 ? '195' : '60'}" y="75" font-size="28" font-weight="900" fill="#FDE68A" letter-spacing="1">
        ${escapeXml(parametres?.nomFr ?? 'EL MOUHSSINOUNE TOURS')}
      </text>
      <text x="${logoBase64 ? '195' : '60'}" y="108" font-size="22" font-weight="bold" fill="#FFFFFF">
        ${escapeXml(parametres?.nomAr ?? 'المحسنون للسياحة و الأسفار')}
      </text>
      <text x="${logoBase64 ? '195' : '60'}" y="138" font-size="13" font-weight="bold" fill="#93C5FD" letter-spacing="0.5">
        TRAVEL &amp; TOURISM AGENCY • LICENSED HAJJ &amp; UMRAH VIP OPERATOR
      </text>
      <text x="${logoBase64 ? '195' : '60'}" y="165" font-size="12" fill="#CBD5E1">
        ${escapeXml(parametres?.adresse ?? '31, Rue Larbi Ben Mhidi, Oued Rhiou, Algeria')} • Tel : ${escapeXml(parametres?.telephone ?? '+213 42 52 24 24')} • Email : ${escapeXml(parametres?.email ?? 'omra@elmouhssinoune.com')}
      </text>

      <!-- Date and Booking Reference on Top Right -->
      <rect x="910" y="55" width="230" height="105" rx="10" fill="#1E293B" stroke="#C5A059" stroke-width="1.5"/>
      <text x="1025" y="82" font-size="12" font-weight="bold" fill="#94A3B8" text-anchor="middle" letter-spacing="1">DATE OF ISSUE</text>
      <text x="1025" y="108" font-size="17" font-weight="900" fill="#FFFFFF" text-anchor="middle">${dateJourEn}</text>
      <line x1="930" y1="120" x2="1120" y2="120" stroke="#334155" stroke-width="1"/>
      <text x="1025" y="142" font-size="14" font-weight="900" fill="#FDE68A" text-anchor="middle">${escapeXml(devis.numero)}</text>

      <!-- Title Banner -->
      <rect x="50" y="215" width="1100" height="75" rx="10" fill="#FFFBEB" stroke="#FCD34D" stroke-width="2"/>
      <text x="600" y="252" font-size="24" font-weight="900" fill="#92400E" text-anchor="middle" letter-spacing="1.5">
        ${escapeXml(documentTitle)}
      </text>
      <text x="600" y="276" font-size="13" font-weight="bold" fill="#B45309" text-anchor="middle" letter-spacing="2">
        ${documentSubtitle}
      </text>

      <!-- Main Details Block (The core hotel/flight/transport specifications) -->
      ${detailsBlockSvg}

      <!-- Rooming & Passengers List Section -->
      <text x="50" y="615" font-size="19" font-weight="bold" fill="#0B1B3D">
        PASSENGERS &amp; ROOMING LIST (${devis.passagers.length} Guest(s))
      </text>

      <!-- Table Header -->
      <rect x="50" y="635" width="1100" height="40" fill="#0B1B3D" rx="6"/>
      <text x="75" y="661" font-size="14" font-weight="bold" fill="#FDE68A">NO.</text>
      <text x="130" y="661" font-size="14" font-weight="bold" fill="#FFFFFF">GUEST FULL NAME</text>
      <text x="560" y="661" font-size="14" font-weight="bold" fill="#FFFFFF">PASSPORT NO.</text>
      <text x="800" y="661" font-size="14" font-weight="bold" fill="#FFFFFF">DATE OF BIRTH</text>
      <text x="1000" y="661" font-size="14" font-weight="bold" fill="#FDE68A">CATEGORY</text>

      <!-- Table Rows -->
      ${passagersRows}

      <!-- Special Requests & Instructions Block -->
      <rect x="50" y="1170" width="1100" height="120" rx="10" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.5"/>
      <text x="75" y="1202" font-size="16" font-weight="bold" fill="#0B1B3D">SPECIAL REQUESTS &amp; INSTRUCTIONS :</text>
      <text x="75" y="1232" font-size="14" fill="#475569">• VIP priority check-in with personalized welcome and assistance for our guests.</text>
      <text x="75" y="1258" font-size="14" fill="#475569">• Please confirm this booking by returning your official Hotel Voucher / Confirmation Reference number.</text>
      ${devis.notesClient ? `<text x="75" y="1278" font-size="13" fill="#475569">Remarks: ${escapeXml(devis.notesClient)}</text>` : ''}

      <!-- Confirmation / Signatures Section -->
      <rect x="50" y="1310" width="520" height="230" rx="10" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2"/>
      <text x="80" y="1345" font-size="16" font-weight="bold" fill="#0B1B3D">HOTEL / SUPPLIER ACKNOWLEDGEMENT</text>
      <text x="80" y="1375" font-size="13" fill="#64748B">Hotel Confirmation / Voucher Ref : ______________________</text>
      <text x="80" y="1410" font-size="13" fill="#64748B">Confirmed by (Name &amp; Title) : ___________________________</text>
      <line x1="80" y1="1475" x2="520" y2="1475" stroke="#CBD5E1" stroke-dasharray="4"/>
      <text x="80" y="1505" font-size="12" fill="#94A3B8">Official Stamp &amp; Signature</text>

      <rect x="630" y="1310" width="520" height="230" rx="10" fill="#FFFFFF" stroke="#C5A059" stroke-width="2"/>
      <text x="660" y="1345" font-size="16" font-weight="bold" fill="#0B1B3D">ISSUING TRAVEL AGENCY</text>
      <text x="660" y="1375" font-size="13" fill="#64748B">Authorized Agency Signature &amp; Official Seal :</text>
      
      <!-- Visual Seal graphic -->
      <circle cx="890" cy="1440" r="48" fill="none" stroke="#C5A059" stroke-width="2" stroke-dasharray="6,4"/>
      <circle cx="890" cy="1440" r="42" fill="none" stroke="#0B1B3D" stroke-width="1"/>
      <text x="890" y="1435" font-size="11" font-weight="bold" fill="#A16207" text-anchor="middle">EL MOUHSSINOUNE</text>
      <text x="890" y="1450" font-size="10" font-weight="bold" fill="#0B1B3D" text-anchor="middle">VIP UMRAH SERVICES</text>

      <!-- Legal Footer -->
      <line x1="50" y1="1565" x2="1150" y2="1565" stroke="#E2E8F0" stroke-width="1.5"/>
      <text x="600" y="1598" font-size="14" font-weight="bold" fill="#0B1B3D" text-anchor="middle">
        ${escapeXml(parametres?.nomFr ?? 'EL MOUHSSINOUNE TOURS')} — ${escapeXml(parametres?.adresse ?? '31, Rue Larbi Ben Mhidi, Oued Rhiou, Algeria')}
      </text>
      <text x="600" y="1628" font-size="13" fill="#64748B" text-anchor="middle">
        Tel : ${escapeXml(parametres?.telephone ?? '+213 42 52 24 24')} • Email : ${escapeXml(parametres?.email ?? 'omra@elmouhssinoune.com')}
      </text>
      <text x="600" y="1655" font-size="12" fill="#94A3B8" text-anchor="middle">
        Official License RC : ${escapeXml(parametres?.rc ?? '16/00-1234567 B 23')} • Tax ID : ${escapeXml(parametres?.if ?? '000016312345678')} • Document electronically generated
      </text>
    </svg>
  `

  return sharp(Buffer.from(svg))
    .jpeg({
      quality: 95,
      chromaSubsampling: '4:4:4',
    })
    .toBuffer()
}
