// Génération PDF du devis — version française, 1 page compacte.
// Polices : DejaVu Sans (corps) + DejaVu Serif (titres).
// Marge incluse dans chaque ligne (somme des lignes = prix de vente total).

import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer'
import type { ResultatCalculDevis } from '@/lib/calculDevis'
import { D } from '@/lib/money'
import {
  CATEGORIES_PASSAGER, TYPES_VEHICULE, TYPES_CHAMBRE, FORMULES_REPAS,
  TYPES_PRESTATION_VIP, VUES_HOTEL,
} from '@/lib/business'
import { differenceInCalendarDays } from 'date-fns'
import path from 'path'

const FONTS_DIR = path.join(process.cwd(), 'public', 'fonts')
const LOGO_PATH = path.join(process.cwd(), 'public', 'Logo_S.png')

Font.register({
  family: 'DejaVuSans',
  fonts: [
    { src: path.join(FONTS_DIR, 'DejaVuSans.ttf'), fontWeight: 'normal', fontStyle: 'normal' },
    { src: path.join(FONTS_DIR, 'DejaVuSans-Bold.ttf'), fontWeight: 'bold', fontStyle: 'normal' },
  ],
})
Font.register({
  family: 'DejaVuSerif',
  fonts: [
    { src: path.join(FONTS_DIR, 'DejaVuSerif.ttf'), fontWeight: 'normal', fontStyle: 'normal' },
    { src: path.join(FONTS_DIR, 'DejaVuSerif-Bold.ttf'), fontWeight: 'bold', fontStyle: 'normal' },
  ],
})
Font.registerHyphenationCallback((word) => [word])

const styles = StyleSheet.create({
  page: { padding: 28, fontSize: 8, fontFamily: 'DejaVuSans', color: '#0A1628', position: 'relative' },
  // Watermark logo en fond de page (transparence filigrane)
  watermarkLogo: { position: 'absolute', top: '28%', left: '18%', width: 350, opacity: 0.06 },
  // Header
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, borderBottomWidth: 2, borderBottomColor: '#C4A152', paddingBottom: 6 },
  brandCol: { flexDirection: 'column' },
  brandNameFr: { fontFamily: 'DejaVuSerif', fontWeight: 'bold', fontSize: 15, color: '#CC1A1A' },
  brandSlogan: { fontFamily: 'DejaVuSerif', fontSize: 7, color: '#C4A152', marginTop: 1 },
  brandInfo: { fontSize: 6, color: '#555', marginTop: 2 },
  devisBox: { backgroundColor: '#0A1628', padding: 8, borderRadius: 4 },
  devisTitleFr: { color: '#C4A152', fontFamily: 'DejaVuSerif', fontWeight: 'bold', fontSize: 10 },
  devisNumber: { color: '#FFFFFF', fontFamily: 'DejaVuSans', fontWeight: 'bold', fontSize: 12, marginTop: 2 },
  devisDate: { color: '#F7F5F0', fontSize: 7, marginTop: 2 },
  // Sections
  sectionTitle: { fontFamily: 'DejaVuSerif', fontWeight: 'bold', fontSize: 9, color: '#CC1A1A', marginTop: 8, marginBottom: 3, borderBottomWidth: 1, borderBottomColor: '#C4A152', paddingBottom: 2 },
  // 2 colonnes
  twoCols: { flexDirection: 'row' },
  col: { flex: 1 },
  // Tableaux
  tableHeader: { flexDirection: 'row', backgroundColor: '#0A1628', padding: 3 },
  tableHeaderCell: { color: '#F7F5F0', fontFamily: 'DejaVuSans', fontWeight: 'bold', fontSize: 7 },
  tableRow: { flexDirection: 'row', padding: 3, borderBottomWidth: 1, borderBottomColor: '#E5E5E5' },
  tableRowAlt: { flexDirection: 'row', padding: 3, backgroundColor: '#FAFAF8', borderBottomWidth: 1, borderBottomColor: '#E5E5E5' },
  tableCell: { fontSize: 7, color: '#0A1628' },
  // Total
  totalRow: { flexDirection: 'row', padding: 6, backgroundColor: '#C4A152', marginTop: 2 },
  totalLabel: { fontFamily: 'DejaVuSans', fontWeight: 'bold', color: '#0A1628', fontSize: 10 },
  totalValue: { fontFamily: 'DejaVuSans', fontWeight: 'bold', color: '#0A1628', fontSize: 12 },
  // Bloc interne
  internalBox: { marginTop: 6, padding: 6, backgroundColor: '#FFF8E0', borderWidth: 1, borderColor: '#C4A152', borderRadius: 3 },
  internalTitle: { fontFamily: 'DejaVuSerif', fontWeight: 'bold', fontSize: 8, color: '#CC1A1A', marginBottom: 3 },
  internalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  // Footer
  footer: { position: 'absolute', bottom: 14, left: 28, right: 28, flexDirection: 'row', justifyContent: 'space-between', fontSize: 6, color: '#777', borderTopWidth: 1, borderTopColor: '#E5E5E5', paddingTop: 4 },
  // Divers
  infoBox: { padding: 5, backgroundColor: '#F7F5F0', borderRadius: 3 },
  infoLabel: { fontSize: 6, color: '#777' },
  infoValue: { fontSize: 8, color: '#0A1628', fontFamily: 'DejaVuSans', fontWeight: 'bold' },
  detailRow: { flexDirection: 'row', padding: 2, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  detailLabel: { fontFamily: 'DejaVuSans', fontWeight: 'bold', fontSize: 7, color: '#1B3A6B' },
  tauxBox: { marginTop: 6, paddingTop: 4, borderTopWidth: 1, borderTopColor: '#E5E5E5' },
  tauxText: { fontSize: 6, color: '#777', textAlign: 'center' },
})

interface DevisForPdf {
  id: string
  numero: string
  dateDepart: Date | string
  dateRetour: Date | string
  tauxSarDzd: string
  tauxUsdDzd: string
  tauxEurDzd: string
  visaType: string
  visaPrixUnit: string
  visaDevise: string
  assurancePrixUnit: string
  assuranceDevise: string
  margeType: string
  margeValeur: string
  coutNetDzd: string
  prixVenteDzd: string
  margeMontantDzd: string
  notesClient?: string | null
  client?: any
  passagers: any[]
  segmentsVol: any[]
  hebergements: any[]
  transferts: any[]
  trainsHaramain: any[]
  prestationsVip: any[]
  _resultatCalcul?: ResultatCalculDevis
  parametres?: any
}

function formatDate(d: Date | string): string {
  if (!d) return '—'
  const date = typeof d === 'string' ? new Date(d) : d
  if (isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatDateTime(d: Date | string): string {
  if (!d) return '—'
  const date = typeof d === 'string' ? new Date(d) : d
  if (isNaN(date.getTime())) return '—'
  const dateStr = date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${dateStr} à ${hours}:${minutes}`
}

function nbJours(d1: Date | string, d2: Date | string): number {
  const a = typeof d1 === 'string' ? new Date(d1) : d1
  const b = typeof d2 === 'string' ? new Date(d2) : d2
  return Math.max(0, differenceInCalendarDays(b, a))
}

function labFr(map: Record<string, { label: string; labelAr: string }>, key: string): string {
  return map[key]?.label ?? key
}

function fmtPdfMontant(value: string): string {
  const d = D(value)
  const fixed = d.toDecimalPlaces(2).toFixed(2)
  const [intPart, decPart] = fixed.split('.')
  const intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0')
  return `${intFormatted},${decPart}`
}

function fmtPdfMoney(value: string, devise = 'DZD'): string {
  return `${fmtPdfMontant(value)} ${devise}`
}

interface DevisDocumentProps {
  devis: DevisForPdf
  variante: 'client' | 'interne' | 'programme'
}

function DevisDocument({ devis, variante }: DevisDocumentProps) {
  const p = devis.parametres
  const resultat = devis._resultatCalcul
  const isClient = variante === 'client'
  const isProgramme = variante === 'programme'
  const dureeVoyage = nbJours(devis.dateDepart, devis.dateRetour)

  // Sépare les contacts pour affichage compact
  const tel = p?.telephone ?? ''
  const email = p?.email ?? ''

  // Construction des éléments du header
  const headerBrandChildren = [
    <Text key="bn" style={styles.brandNameFr}>{p?.nomFr ?? 'El Mouhssinoune Tours'}</Text>,
  ]
  if (p?.sloganFr) {
    headerBrandChildren.push(<Text key="sg" style={styles.brandSlogan}>{p.sloganFr}</Text>)
  }
  if (p?.adresse) {
    headerBrandChildren.push(<Text key="ad" style={styles.brandInfo}>{p.adresse}</Text>)
  }
  if (tel) {
    headerBrandChildren.push(<Text key="ct" style={styles.brandInfo}>Tél: {tel}</Text>)
  }
  if (email) {
    headerBrandChildren.push(<Text key="em" style={styles.brandInfo}>Email: {email}</Text>)
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Watermark logo en fond de page (transparence filigrane) */}
        <Image src={LOGO_PATH} style={styles.watermarkLogo} fixed />

        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.brandCol}>
            {headerBrandChildren}
          </View>
          <View style={styles.devisBox}>
            <Text style={styles.devisTitleFr}>{isProgramme ? 'PROGRAMME' : 'DEVIS'}</Text>
            <Text style={styles.devisNumber}>{devis.numero}</Text>
            <Text style={styles.devisDate}>Émis le {formatDate(new Date())}</Text>
          </View>
        </View>

        {/* Client + Voyage sur 2 colonnes */}
        <View style={styles.twoCols}>
          <View style={[styles.col, { marginRight: 8 }]}>
            <Text style={styles.sectionTitle}>Client</Text>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Nom</Text>
              <Text style={styles.infoValue}>
                {devis.client?.type === 'societe'
                  ? (devis.client.raisonSociale ?? devis.client.nom)
                  : `${devis.client?.nom ?? ''} ${devis.client?.prenom ?? ''}`.trim() || '—'}
              </Text>
              {devis.client?.telephone ? <Text style={styles.infoLabel}>Tél: {devis.client.telephone}</Text> : null}
              {devis.client?.email ? <Text style={styles.infoLabel}>{devis.client.email}</Text> : null}
            </View>
          </View>
          <View style={[styles.col, { marginLeft: 8 }]}>
            <Text style={styles.sectionTitle}>Voyage</Text>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Départ — Retour</Text>
              <Text style={styles.infoValue}>{formatDate(devis.dateDepart)} — {formatDate(devis.dateRetour)}</Text>
              <Text style={styles.infoLabel}>Durée: {dureeVoyage} jours / {dureeVoyage - 1} nuits</Text>
            </View>
          </View>
        </View>

        {/* Passagers — compact */}
        <Text style={styles.sectionTitle}>Passagers ({devis.passagers.length})</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { flex: 3 }]}>Nom complet</Text>
          <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Catégorie</Text>
          <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Passeport</Text>
          <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Expiration</Text>
        </View>
        {devis.passagers.map((pa, i) => (
          <View key={`p${i}`} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt} wrap={false}>
            <Text style={[styles.tableCell, { flex: 3 }]}>
              {pa.prenom || pa.nom ? `${pa.prenom} ${pa.nom}`.trim() : `Passager ${i + 1}`}
            </Text>
            <Text style={[styles.tableCell, { flex: 2 }]}>{labFr(CATEGORIES_PASSAGER, pa.categorie)}</Text>
            <Text style={[styles.tableCell, { flex: 2 }]}>{pa.passeportNumero ?? '—'}</Text>
            <Text style={[styles.tableCell, { flex: 2 }]}>{pa.passeportExpiration ? formatDate(pa.passeportExpiration) : '—'}</Text>
          </View>
        ))}

        {/* Détail du voyage — compact */}
        <Text style={styles.sectionTitle}>Détail du voyage</Text>

        {devis.segmentsVol.length > 0 ? (
          <View style={{ marginBottom: 4 }}>
            <Text style={styles.detailLabel}>Vols</Text>
            {devis.segmentsVol.map((s, i) => (
              <View key={`s${i}`} style={{ marginBottom: 2 }}>
                <View style={styles.detailRow}>
                  <Text style={[styles.tableCell, { flex: 4.5 }]}>Aller : {s.origine} → {s.destination}</Text>
                  <Text style={[styles.tableCell, { flex: 2.5 }]}>{formatDate(s.dateVol)}</Text>
                  <Text style={[styles.tableCell, { flex: 2.5 }]}>{s.compagnie?.nom ?? '—'}</Text>
                  <Text style={[styles.tableCell, { flex: 2.5 }]}>{s.classe ? (s.classe.charAt(0).toUpperCase() + s.classe.slice(1)) : 'Économique'}</Text>
                </View>
                {(s.origineRetour || s.destinationRetour) && (
                  <View style={styles.detailRow}>
                    <Text style={[styles.tableCell, { flex: 4.5 }]}>Retour : {s.origineRetour} → {s.destinationRetour}</Text>
                    <Text style={[styles.tableCell, { flex: 2.5 }]}>{s.dateVolRetour ? formatDate(s.dateVolRetour) : '—'}</Text>
                    <Text style={[styles.tableCell, { flex: 2.5 }]}>{s.compagnie?.nom ?? '—'}</Text>
                    <Text style={[styles.tableCell, { flex: 2.5 }]}>{s.classeRetour ? (s.classeRetour.charAt(0).toUpperCase() + s.classeRetour.slice(1)) : (s.classe ? (s.classe.charAt(0).toUpperCase() + s.classe.slice(1)) : 'Économique')}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        ) : null}

        {devis.hebergements.length > 0 ? (
          <View style={{ marginBottom: 4 }}>
            <Text style={styles.detailLabel}>Hébergements</Text>
            {devis.hebergements.map((h, i) => (
              <View key={`h${i}`} style={styles.detailRow}>
                <Text style={[styles.tableCell, { flex: 4 }]}>{h.hotelNom} ({h.ville})</Text>
                <Text style={[styles.tableCell, { flex: 5 }]}>{labFr(TYPES_CHAMBRE, h.typeChambre)} • {labFr(FORMULES_REPAS, h.formuleRepas)} • {labFr(VUES_HOTEL, h.vue)}</Text>
                <Text style={[styles.tableCell, { flex: 3, textAlign: 'right' }]}>{h.nbNuitees} nuits × {h.nbChambres} ch.</Text>
              </View>
            ))}
          </View>
        ) : null}

        {devis.transferts.length > 0 ? (
          <View style={{ marginBottom: 4 }}>
            <Text style={styles.detailLabel}>Transferts VIP</Text>
            {devis.transferts.map((t, i) => (
              <View key={`t${i}`} style={styles.detailRow}>
                <Text style={[styles.tableCell, { flex: 7 }]}>{t.trajet}</Text>
                <Text style={[styles.tableCell, { flex: 3, textAlign: 'right' }]}>{labFr(TYPES_VEHICULE, t.typeVehicule)}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {devis.trainsHaramain.length > 0 ? (
          <View style={{ marginBottom: 4 }}>
            <Text style={styles.detailLabel}>Train Haramain</Text>
            {devis.trainsHaramain.map((t, i) => (
              <View key={`tr${i}`} style={styles.detailRow}>
                <Text style={[styles.tableCell, { flex: 5 }]}>{t.trajet}</Text>
                <Text style={[styles.tableCell, { flex: 4 }]}>{formatDateTime(t.dateTrain)}</Text>
                <Text style={[styles.tableCell, { flex: 3, textAlign: 'right' }]}>{t.classe}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {devis.prestationsVip.length > 0 ? (
          <View style={{ marginBottom: 4 }}>
            <Text style={styles.detailLabel}>Prestations VIP</Text>
            {devis.prestationsVip.map((pr, i) => (
              <View key={`pr${i}`} style={styles.detailRow}>
                <Text style={[styles.tableCell, { flex: 3 }]}>{labFr(TYPES_PRESTATION_VIP, pr.type)}</Text>
                <Text style={[styles.tableCell, { flex: 7 }]}>{pr.descriptionFr}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Récapitulatif financier et Total — masqués pour programme */}
        {!isProgramme ? (
          <>
            <Text style={styles.sectionTitle}>Récapitulatif des Prix</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { flex: 3 }]}>Prestation</Text>
              <Text style={[styles.tableHeaderCell, { flex: 6 }]}>Description</Text>
              {(!isClient) && <Text style={[styles.tableHeaderCell, { flex: 2.5 }]}>Devise source</Text>}
              <Text style={[styles.tableHeaderCell, { flex: 3, textAlign: 'right' }]}>Prix vente DZD</Text>
            </View>
            {resultat ? resultat.lignes.map((l, i) => {
              const posteDisplay = l.poste === 'Vol' ? 'Billet' : (l.poste === 'Assurance médicale' ? 'Frais ONPO' : l.poste)
              return (
                <View key={`l${i}`} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt} wrap={false}>
                  <Text style={[styles.tableCell, { flex: 3 }]}>{posteDisplay}</Text>
                  <Text style={[styles.tableCell, { flex: 6 }]}>{l.description}</Text>
                  {(!isClient) && <Text style={[styles.tableCell, { flex: 2.5 }]}>{fmtPdfMontant(l.montantSource)} {l.deviseSource}</Text>}
                  <Text style={[styles.tableCell, { flex: 3, textAlign: 'right' }]}>{fmtPdfMontant(l.prixVenteDzd)}</Text>
                </View>
              )
            }) : null}

            {/* Total */}
            <View style={styles.totalRow}>
              <View style={{ flex: 9 }}>
                <Text style={styles.totalLabel}>PRIX DE VENTE TOTAL</Text>
              </View>
              <Text style={[styles.totalValue, { flex: 3, textAlign: 'right' }]}>{fmtPdfMoney(devis.prixVenteDzd)}</Text>
            </View>
          </>
        ) : null}

        {/* Bloc interne (vue interne uniquement) */}
        {variante === 'interne' ? (
          <View style={styles.internalBox}>
            <Text style={styles.internalTitle}>USAGE INTERNE — NE PAS TRANSMETTRE AU CLIENT</Text>
            <View style={styles.internalRow}>
              <Text style={{ fontSize: 7 }}>Coût net total:</Text>
              <Text style={{ fontFamily: 'DejaVuSans', fontWeight: 'bold', fontSize: 7 }}>{fmtPdfMoney(devis.coutNetDzd)}</Text>
            </View>
            <View style={styles.internalRow}>
              <Text style={{ fontSize: 7 }}>Marge ({devis.margeType === 'pourcentage' ? `${devis.margeValeur}%` : 'montant fixe'}):</Text>
              <Text style={{ fontFamily: 'DejaVuSans', fontWeight: 'bold', fontSize: 7 }}>{fmtPdfMoney(devis.margeMontantDzd)}</Text>
            </View>
            <View style={styles.internalRow}>
              <Text style={{ fontSize: 7 }}>Taux de marge net:</Text>
              <Text style={{ fontFamily: 'DejaVuSans', fontWeight: 'bold', fontSize: 7 }}>
                {D(devis.coutNetDzd).gt(0)
                  ? D(devis.margeMontantDzd).div(D(devis.coutNetDzd)).mul(100).toDecimalPlaces(2).toString()
                  : '0'}%
              </Text>
            </View>
          </View>
        ) : null}

        {/* Notes + taux */}
        {devis.notesClient ? (
          <View style={{ marginTop: 4, padding: 4, backgroundColor: '#F7F5F0', borderRadius: 3 }}>
            <Text style={{ fontFamily: 'DejaVuSans', fontWeight: 'bold', fontSize: 7 }}>Notes: {devis.notesClient}</Text>
          </View>
        ) : null}

        {!isProgramme ? (
          <View style={styles.tauxBox}>
            <Text style={styles.tauxText}>
              Devis en DZD. Taux: 1 SAR = {devis.tauxSarDzd} • 1 USD = {devis.tauxUsdDzd} • 1 EUR = {devis.tauxEurDzd} DZD. Valable 30 jours.
            </Text>
          </View>
        ) : null}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>{p?.nomFr ?? 'El Mouhssinoune Tours'}</Text>
          <Text>{devis.numero} — {isProgramme ? 'Programme' : (isClient ? 'Client' : 'INTERNE')}</Text>
        </View>
      </Page>
    </Document>
  )
}

export { DevisDocument }
export type { DevisForPdf }
