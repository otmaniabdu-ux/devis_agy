import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import { db } from '@/lib/db'
import { fmtDate } from '@/lib/client-utils'

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

  // Nom et prénom du client ou du 1er passager (demande utilisateur)
  const clientNomComplet =
    devis.client.type === 'societe'
      ? (devis.client.raisonSociale || `${devis.client.nom} ${devis.client.prenom ?? ''}`.trim())
      : `${devis.client.nom} ${devis.client.prenom ?? ''}`.trim() ||
        (devis.passagers[0] ? `${devis.passagers[0].nom} ${devis.passagers[0].prenom}`.trim() : 'Client VIP')

  // Déterminer le titre et les données selon la prestation
  let titreDocument = 'DEMANDE DE RÉSERVATION FOURNISSEUR'
  let sousTitre = 'BON DE COMMANDE PRESTATIONS VIP'
  let detailsHtml = ''

  if (options.typePrestation === 'hotel') {
    const targetHeberg = options.targetId
      ? devis.hebergements.find((h) => h.id === options.targetId)
      : devis.hebergements[0]

    titreDocument = 'DEMANDE DE RÉSERVATION HÔTELIÈRE'
    sousTitre = 'HOTEL BOOKING REQUEST &amp; ROOMING LIST'

    if (targetHeberg) {
      detailsHtml = `
        <rect x="50" y="315" width="1100" height="225" rx="12" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2"/>
        <text x="80" y="350" font-size="20" font-weight="bold" fill="#0B1B3D">CLIENT / RESPONSABLE : ${escapeXml(clientNomComplet)} ${devis.client.telephone ? `• Tél : ${escapeXml(devis.client.telephone)}` : ''}</text>
        <line x1="80" y1="365" x2="1120" y2="365" stroke="#F1F5F9" stroke-width="2"/>
        <text x="80" y="400" font-size="21" font-weight="bold" fill="#92400E">ÉTABLISSEMENT : ${escapeXml(targetHeberg.hotelNom)} (${escapeXml(targetHeberg.ville)})</text>
        <text x="80" y="435" font-size="17" fill="#475569">Période : Du ${escapeXml(fmtDate(targetHeberg.dateCheckin.toISOString()))} au ${escapeXml(fmtDate(targetHeberg.dateCheckout.toISOString()))} (${targetHeberg.nbNuitees} nuitées)</text>
        <text x="80" y="470" font-size="17" fill="#475569">Chambre : ${escapeXml(targetHeberg.typeChambre.toUpperCase())} • Vue : ${escapeXml(targetHeberg.vue.toUpperCase())} • Quantité : ${targetHeberg.nbChambres} chambre(s)</text>
        <text x="80" y="505" font-size="17" fill="#475569">Formule Repas : ${escapeXml(targetHeberg.formuleRepas.replace(/_/g, ' ').toUpperCase())}</text>
      `
    }
  } else if (options.typePrestation === 'vol') {
    titreDocument = 'DEMANDE D’ÉMISSION BILLETTERIE'
    sousTitre = 'FLIGHT RESERVATION VOUCHER'
    const vol = devis.segmentsVol[0]
    if (vol) {
      detailsHtml = `
        <rect x="50" y="315" width="1100" height="225" rx="12" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2"/>
        <text x="80" y="350" font-size="20" font-weight="bold" fill="#0B1B3D">CLIENT / RESPONSABLE : ${escapeXml(clientNomComplet)} ${devis.client.telephone ? `• Tél : ${escapeXml(devis.client.telephone)}` : ''}</text>
        <line x1="80" y1="365" x2="1120" y2="365" stroke="#F1F5F9" stroke-width="2"/>
        <text x="80" y="400" font-size="21" font-weight="bold" fill="#92400E">COMPAGNIE : ${escapeXml(vol.compagnie?.nom ?? 'Partenaire Billetterie')}</text>
        <text x="80" y="435" font-size="17" fill="#475569">Vol Aller : ${escapeXml(vol.origine)} → ${escapeXml(vol.destination)} le ${escapeXml(fmtDate(vol.dateVol.toISOString()))} (${escapeXml(vol.classe)})</text>
        ${
          vol.origineRetour
            ? `<text x="80" y="470" font-size="17" fill="#475569">Vol Retour : ${escapeXml(vol.origineRetour)} → ${escapeXml(vol.destinationRetour ?? '')} le ${escapeXml(vol.dateVolRetour ? fmtDate(vol.dateVolRetour.toISOString()) : '—')} (${escapeXml(vol.classeRetour ?? 'economique')})</text>`
            : ''
        }
        <text x="80" y="505" font-size="17" fill="#475569">Nombre de passagers : ${devis.passagers.length} passager(s)</text>
      `
    }
  } else if (options.typePrestation === 'transport') {
    titreDocument = 'ORDRE DE MISSION TRANSPORT VIP'
    sousTitre = 'VIP TRANSPORT &amp; LOGISTICS ORDER'
    const transfertsDesc = devis.transferts.map((t) => `${t.trajet} (${t.typeVehicule.replace(/_/g, ' ')})`).join(' • ')
    detailsHtml = `
      <rect x="50" y="315" width="1100" height="225" rx="12" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2"/>
      <text x="80" y="350" font-size="20" font-weight="bold" fill="#0B1B3D">CLIENT / RESPONSABLE : ${escapeXml(clientNomComplet)} ${devis.client.telephone ? `• Tél : ${escapeXml(devis.client.telephone)}` : ''}</text>
      <line x1="80" y1="365" x2="1120" y2="365" stroke="#F1F5F9" stroke-width="2"/>
      <text x="80" y="405" font-size="21" font-weight="bold" fill="#92400E">TRAJETS &amp; TRANSFERTS VIP</text>
      <text x="80" y="445" font-size="17" fill="#475569">${escapeXml(transfertsDesc || 'Transferts aéroport et inter-villes')}</text>
      <text x="80" y="485" font-size="17" fill="#475569">Pèlerins : ${devis.passagers.length} passagers • Période : ${escapeXml(fmtDate(devis.dateDepart.toISOString()))} au ${escapeXml(fmtDate(devis.dateRetour.toISOString()))}</text>
    `
  } else {
    // Global
    titreDocument = 'FICHE DE RÉSERVATION VIP GLOBALE'
    sousTitre = 'DOSSIER PÈLERINS &amp; PRESTATIONS OMRA/HADJ'
    const hotelsStr = devis.hebergements.map((h) => `${h.hotelNom} (${h.ville})`).join(' + ')
    detailsHtml = `
      <rect x="50" y="315" width="1100" height="225" rx="12" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2"/>
      <text x="80" y="350" font-size="20" font-weight="bold" fill="#0B1B3D">CLIENT / RESPONSABLE : ${escapeXml(clientNomComplet)} ${devis.client.telephone ? `• Tél : ${escapeXml(devis.client.telephone)}` : ''}</text>
      <line x1="80" y1="365" x2="1120" y2="365" stroke="#F1F5F9" stroke-width="2"/>
      <text x="80" y="405" font-size="21" font-weight="bold" fill="#92400E">RÉSUMÉ DU SÉJOUR : ${escapeXml(fmtDate(devis.dateDepart.toISOString()))} → ${escapeXml(fmtDate(devis.dateRetour.toISOString()))}</text>
      <text x="80" y="445" font-size="17" fill="#475569">Hébergements : ${escapeXml(hotelsStr || 'Non spécifiés')}</text>
      <text x="80" y="485" font-size="17" fill="#475569">Effectif du groupe : ${devis.passagers.length} pèlerin(s)</text>
    `
  }

  // Rooming list / Passagers (table rows)
  let passagersRows = ''
  let currentY = 620
  devis.passagers.slice(0, 12).forEach((p, idx) => {
    const bgRow = idx % 2 === 0 ? '#F8FAFC' : '#FFFFFF'
    passagersRows += `
      <rect x="50" y="${currentY - 26}" width="1100" height="38" fill="${bgRow}" stroke="#E2E8F0" stroke-width="1"/>
      <text x="75" y="${currentY}" font-size="16" font-weight="bold" fill="#334155">${idx + 1}</text>
      <text x="130" y="${currentY}" font-size="16" font-weight="bold" fill="#0F172A">${escapeXml(p.nom.toUpperCase())} ${escapeXml(p.prenom)}</text>
      <text x="560" y="${currentY}" font-size="16" font-family="monospace" fill="#0B1B3D">${escapeXml(p.passeportNumero ?? '—')}</text>
      <text x="800" y="${currentY}" font-size="15" fill="#64748B">${p.dateNaissance ? escapeXml(fmtDate(p.dateNaissance.toISOString())) : '—'}</text>
      <text x="1000" y="${currentY}" font-size="15" fill="#A16207" font-weight="bold">${escapeXml(p.categorie.toUpperCase())}</text>
    `
    currentY += 40
  })

  // Date actuelle
  const dateJour = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  const svg = `
    <svg width="1200" height="1750" viewBox="0 0 1200 1750" xmlns="http://www.w3.org/2000/svg" font-family="'Segoe UI', Roboto, Helvetica, Arial, sans-serif">
      <!-- Fond général luxueux -->
      <rect x="0" y="0" width="1200" height="1750" fill="#F8FAFC"/>

      <!-- Cadre externe élégant Or &amp; Bleu nuit -->
      <rect x="25" y="25" width="1150" height="1700" rx="16" fill="#FFFFFF" stroke="#C5A059" stroke-width="4"/>
      <rect x="35" y="35" width="1130" height="1680" rx="12" fill="none" stroke="#0B1B3D" stroke-width="1" stroke-opacity="0.2"/>

      <!-- Bandeau Header Bleu Nuit -->
      <path d="M 25 37 Q 25 25 37 25 L 1163 25 Q 1175 25 1175 37 L 1175 190 L 25 190 Z" fill="#0B1B3D"/>
      
      <!-- Bordure dorée sous le bandeau -->
      <line x1="25" y1="190" x2="1175" y2="190" stroke="#C5A059" stroke-width="4"/>

      <!-- Logo agence si disponible -->
      ${
        logoBase64
          ? `<image href="data:image/png;base64,${logoBase64}" x="60" y="45" width="120" height="120" preserveAspectRatio="xMidYMid meet"/>`
          : ''
      }

      <!-- En-tête Agence Texte -->
      <text x="${logoBase64 ? '200' : '60'}" y="80" font-size="28" font-weight="900" fill="#FDE68A" letter-spacing="1">
        ${escapeXml(parametres?.nomFr ?? 'EL MOUHSSINOUNE TOURS')}
      </text>
      <text x="${logoBase64 ? '200' : '60'}" y="115" font-size="22" font-weight="bold" fill="#FFFFFF">
        ${escapeXml(parametres?.nomAr ?? 'المحسنون للسياحة و الأسفار')}
      </text>
      <text x="${logoBase64 ? '200' : '60'}" y="150" font-size="14" fill="#93C5FD">
        AGENCE DE VOYAGES ET DE TOURISME • AGRÉMENT HADJ &amp; OMRA VIP
      </text>

      <!-- Date et Réf en haut à droite -->
      <text x="1130" y="75" font-size="14" fill="#CBD5E1" text-anchor="end">DATE DE DEMANDE</text>
      <text x="1130" y="100" font-size="18" font-weight="bold" fill="#FFFFFF" text-anchor="end">${dateJour}</text>
      <text x="1130" y="140" font-size="14" fill="#FDE68A" text-anchor="end">RÉF DOSSIER : ${escapeXml(devis.numero)}</text>

      <!-- Titre du document -->
      <rect x="50" y="215" width="1100" height="75" rx="10" fill="#FFFBEB" stroke="#FCD34D" stroke-width="2"/>
      <text x="600" y="252" font-size="24" font-weight="900" fill="#92400E" text-anchor="middle" letter-spacing="1.5">
        ${escapeXml(titreDocument)}
      </text>
      <text x="600" y="276" font-size="13" font-weight="bold" fill="#B45309" text-anchor="middle" letter-spacing="2">
        ${sousTitre}
      </text>

      <!-- Bloc détails de la prestation -->
      ${detailsHtml}

      <!-- Titre Rooming List -->
      <text x="50" y="580" font-size="20" font-weight="bold" fill="#0B1B3D">LISTE DES PÈLERINS / ROOMING &amp; PASSENGERS LIST</text>

      <!-- Table Header Passagers -->
      <rect x="50" y="595" width="1100" height="40" fill="#0B1B3D" rx="6"/>
      <text x="75" y="621" font-size="15" font-weight="bold" fill="#FDE68A">N°</text>
      <text x="130" y="621" font-size="15" font-weight="bold" fill="#FFFFFF">NOM &amp; PRÉNOM</text>
      <text x="560" y="621" font-size="15" font-weight="bold" fill="#FFFFFF">N° PASSEPORT</text>
      <text x="800" y="621" font-size="15" font-weight="bold" fill="#FFFFFF">DATE NAISSANCE</text>
      <text x="1000" y="621" font-size="15" font-weight="bold" fill="#FDE68A">CATÉGORIE</text>

      <!-- Table Rows Passagers -->
      ${passagersRows}

      <!-- Instructions & Demandes particulières -->
      <rect x="50" y="1140" width="1100" height="130" rx="10" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.5"/>
      <text x="75" y="1175" font-size="17" font-weight="bold" fill="#0B1B3D">INSTRUCTIONS &amp; DEMANDES PARTICULIÈRES :</text>
      <text x="75" y="1210" font-size="15" fill="#475569">• Traitement prioritaire VIP avec accueil et assistance personnalisée.</text>
      <text x="75" y="1240" font-size="15" fill="#475569">• Merci de nous retourner confirmation par WhatsApp ou courriel avec le numéro de voucher correspondant.</text>
      ${devis.notesClient ? `<text x="75" y="1260" font-size="14" fill="#475569">Note dossier : ${escapeXml(devis.notesClient)}</text>` : ''}

      <!-- Zone de Confirmation / Cachet & Signature -->
      <rect x="50" y="1295" width="520" height="240" rx="10" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2"/>
      <text x="80" y="1330" font-size="16" font-weight="bold" fill="#0B1B3D">POUR LE PRESTATAIRE / FOURNISSEUR</text>
      <text x="80" y="1360" font-size="14" fill="#64748B">Accusé de réception &amp; N° de Voucher :</text>
      <line x1="80" y1="1445" x2="520" y2="1445" stroke="#CBD5E1" stroke-dasharray="4"/>
      <text x="80" y="1485" font-size="13" fill="#94A3B8">Date &amp; Signature Fournisseur</text>

      <rect x="630" y="1295" width="520" height="240" rx="10" fill="#FFFFFF" stroke="#C5A059" stroke-width="2"/>
      <text x="660" y="1330" font-size="16" font-weight="bold" fill="#0B1B3D">POUR L'AGENCE ÉMETTRICE</text>
      <text x="660" y="1360" font-size="14" fill="#64748B">Cachet officiel &amp; Signature autorisée :</text>
      
      <!-- Sceau visuel agence -->
      <circle cx="890" cy="1425" r="50" fill="none" stroke="#C5A059" stroke-width="2" stroke-dasharray="6,4"/>
      <circle cx="890" cy="1425" r="44" fill="none" stroke="#0B1B3D" stroke-width="1"/>
      <text x="890" y="1420" font-size="11" font-weight="bold" fill="#A16207" text-anchor="middle">EL MOUHSSINOUNE</text>
      <text x="890" y="1435" font-size="10" font-weight="bold" fill="#0B1B3D" text-anchor="middle">SERVICE OMRA VIP</text>

      <!-- Footer légal & Coordonnées -->
      <line x1="50" y1="1560" x2="1150" y2="1560" stroke="#E2E8F0" stroke-width="1.5"/>
      <text x="600" y="1595" font-size="15" font-weight="bold" fill="#0B1B3D" text-anchor="middle">
        ${escapeXml(parametres?.nomFr ?? 'EL MOUHSSINOUNE TOURS')} — ${escapeXml(parametres?.adresse ?? '31, Rue Larbi Ben Mhidi, Oued Rhiou, Algérie')}
      </text>
      <text x="600" y="1625" font-size="13" fill="#64748B" text-anchor="middle">
        Tél : ${escapeXml(parametres?.telephone ?? '042.52.24.24')} • Email : ${escapeXml(parametres?.email ?? 'omra@elmouhssinoune.com')}
      </text>
      <text x="600" y="1655" font-size="12" fill="#94A3B8" text-anchor="middle">
        RC : ${escapeXml(parametres?.rc ?? '16/00-1234567 B 23')} • IF : ${escapeXml(parametres?.if ?? '000016312345678')} • Document émis électroniquement
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
