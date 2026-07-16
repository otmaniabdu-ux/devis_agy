// Génération PDF du devis — version française uniquement.
// Polices embarquées : DejaVu Sans (corps) + DejaVu Serif (titres) — couverture Unicode complète.
// Deux variantes : client (prix de vente uniquement) et interne (avec marges).

import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'
import type { ResultatCalculDevis } from '@/lib/calculDevis'
import { D } from '@/lib/money'
import {
  CATEGORIES_PASSAGER, TYPES_VEHICULE, TYPES_CHAMBRE, FORMULES_REPAS,
  TYPES_PRESTATION_VIP,
} from '@/lib/business'
import { differenceInCalendarDays } from 'date-fns'
import path from 'path'

const FONTS_DIR = path.join(process.cwd(), 'public', 'fonts')

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
  page: { padding: 36, fontSize: 10, fontFamily: 'DejaVuSans', color: '#0A1628' },
  // Header
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, borderBottomWidth: 2, borderBottomColor: '#C4A152', paddingBottom: 12 },
  brandCol: { flexDirection: 'column' },
  brandNameFr: { fontFamily: 'DejaVuSerif', fontWeight: 'bold', fontSize: 18, color: '#CC1A1A' },
  brandSlogan: { fontFamily: 'DejaVuSerif', fontSize: 9, color: '#C4A152', marginTop: 2 },
  brandInfo: { fontSize: 8, color: '#555', marginTop: 3 },
  devisBox: { backgroundColor: '#0A1628', padding: 10, borderRadius: 4 },
  devisTitleFr: { color: '#C4A152', fontFamily: 'DejaVuSerif', fontWeight: 'bold', fontSize: 11 },
  devisNumber: { color: '#FFFFFF', fontFamily: 'DejaVuSans', fontWeight: 'bold', fontSize: 14, marginTop: 4 },
  devisDate: { color: '#F7F5F0', fontSize: 8, marginTop: 4 },
  // Section
  sectionTitleFr: { fontFamily: 'DejaVuSerif', fontWeight: 'bold', fontSize: 12, color: '#CC1A1A', marginTop: 14, marginBottom: 6, borderBottomWidth: 1, borderBottomColor: '#C4A152', paddingBottom: 4 },
  // Tableaux
  tableHeader: { flexDirection: 'row', backgroundColor: '#0A1628', padding: 6 },
  tableHeaderCell: { color: '#F7F5F0', fontFamily: 'DejaVuSans', fontWeight: 'bold', fontSize: 9 },
  tableRow: { flexDirection: 'row', padding: 6, borderBottomWidth: 1, borderBottomColor: '#E5E5E5' },
  tableRowAlt: { flexDirection: 'row', padding: 6, backgroundColor: '#FAFAF8', borderBottomWidth: 1, borderBottomColor: '#E5E5E5' },
  tableCell: { fontSize: 9, color: '#0A1628' },
  // Total
  totalRow: { flexDirection: 'row', padding: 10, backgroundColor: '#C4A152', marginTop: 4 },
  totalLabelFr: { fontFamily: 'DejaVuSans', fontWeight: 'bold', color: '#0A1628', fontSize: 12 },
  totalValue: { fontFamily: 'DejaVuSans', fontWeight: 'bold', color: '#0A1628', fontSize: 14 },
  // Bloc interne
  internalBox: { marginTop: 12, padding: 10, backgroundColor: '#FFF8E0', borderWidth: 1, borderColor: '#C4A152', borderRadius: 4 },
  internalTitle: { fontFamily: 'DejaVuSerif', fontWeight: 'bold', fontSize: 10, color: '#CC1A1A', marginBottom: 6 },
  internalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  internalLabel: { fontSize: 9 },
  internalValue: { fontFamily: 'DejaVuSans', fontWeight: 'bold', fontSize: 9 },
  // Footer
  footer: { position: 'absolute', bottom: 24, left: 36, right: 36, flexDirection: 'row', justifyContent: 'space-between', fontSize: 7, color: '#777', borderTopWidth: 1, borderTopColor: '#E5E5E5', paddingTop: 6 },
  // Divers
  infoBox: { padding: 8, backgroundColor: '#F7F5F0', borderRadius: 4, marginBottom: 8 },
  infoLabel: { fontSize: 8, color: '#777' },
  infoValue: { fontSize: 10, color: '#0A1628', fontFamily: 'DejaVuSans', fontWeight: 'bold' },
  sousBlocTitre: { fontFamily: 'DejaVuSans', fontWeight: 'bold', fontSize: 9, color: '#1B3A6B', marginTop: 6, marginBottom: 2 },
  ligneDetail: { flexDirection: 'row', padding: 4, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  notesBox: { marginTop: 12, padding: 8, backgroundColor: '#F7F5F0', borderRadius: 4 },
  notesLabel: { fontFamily: 'DejaVuSans', fontWeight: 'bold', fontSize: 9, color: '#0A1628' },
  notesText: { fontSize: 9, color: '#333', marginTop: 4 },
  tauxBox: { marginTop: 12, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#E5E5E5' },
  tauxTextFr: { fontSize: 8, color: '#777', textAlign: 'center' },
  tauxTextFrItalic: { fontFamily: 'DejaVuSerif', fontSize: 8, color: '#777', textAlign: 'center', marginTop: 4 },
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
  const date = typeof d === 'string' ? new Date(d) : d
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
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
  const parts = fixed.split('.')
  const intPart = parts[0]
  const decPart = parts[1]
  // Espace insécable \u00A0 comme séparateur de milliers
  const intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0')
  return `${intFormatted},${decPart}`
}

function fmtPdfMoney(value: string, devise = 'DZD'): string {
  return `${fmtPdfMontant(value)} ${devise}`
}

interface DevisDocumentProps {
  devis: DevisForPdf
  variante: 'client' | 'interne'
}

function DevisDocument({ devis, variante }: DevisDocumentProps) {
  const p = devis.parametres
  const resultat = devis._resultatCalcul
  const isClient = variante === 'client'
  const dureeVoyage = nbJours(devis.dateDepart, devis.dateRetour)

  // Construction des éléments du header (français uniquement)
  const headerBrandChildren = [
    <Text key="bn" style={styles.brandNameFr}>{p?.nomFr ?? 'El Mouhssinouen Tours'}</Text>,
  ]
  if (p?.sloganFr) {
    headerBrandChildren.push(<Text key="sg" style={styles.brandSlogan}>{p.sloganFr}</Text>)
  }
  if (p?.adresse) {
    headerBrandChildren.push(<Text key="ad" style={styles.brandInfo}>{p.adresse}</Text>)
  }
  if (p?.telephone || p?.email) {
    headerBrandChildren.push(<Text key="ct" style={styles.brandInfo}>{p.telephone ?? ''}{p.email ? ` • ${p.email}` : ''}</Text>)
  }
  if (p?.rc || p?.if) {
    headerBrandChildren.push(<Text key="legal" style={styles.brandInfo}>RC: {p.rc ?? '—'} • IF: {p.if ?? '—'}{p?.art ? ` • ART: ${p.art}` : ''}</Text>)
  }

  // Construction des lignes du récap financier
  const recapLignes = resultat ? resultat.lignes.map((l, i) => (
    <View key={`l${i}`} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt} wrap={false}>
      <Text style={[styles.tableCell, { flex: 3 }]}>{l.poste}</Text>
      <Text style={[styles.tableCell, { flex: 4 }]}>{l.description}</Text>
      <Text style={[styles.tableCell, { flex: 2 }]}>{fmtPdfMontant(l.montantSource)} {l.deviseSource}</Text>
      <Text style={[styles.tableCell, { flex: 3, textAlign: 'right' }]}>{fmtPdfMontant(l.montantDzd)}</Text>
    </View>
  )) : []

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.brandCol}>
            {headerBrandChildren}
          </View>
          <View style={styles.devisBox}>
            <Text style={styles.devisTitleFr}>DEVIS</Text>
            <Text style={styles.devisNumber}>{devis.numero}</Text>
            <Text style={styles.devisDate}>Émis le {formatDate(new Date())}</Text>
          </View>
        </View>

        {/* Client + Voyage sur 2 colonnes */}
        <View style={{ flexDirection: 'row', marginBottom: 8 }}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={styles.sectionTitleFr}>Client</Text>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Nom</Text>
              <Text style={styles.infoValue}>
                {devis.client?.type === 'societe'
                  ? (devis.client.raisonSociale ?? devis.client.nom)
                  : `${devis.client?.nom ?? ''} ${devis.client?.prenom ?? ''}`}
              </Text>
              {devis.client?.telephone ? <Text style={styles.infoLabel}>Tél: {devis.client.telephone}</Text> : null}
              {devis.client?.email ? <Text style={styles.infoLabel}>{devis.client.email}</Text> : null}
            </View>
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.sectionTitleFr}>Voyage</Text>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Départ — Retour</Text>
              <Text style={styles.infoValue}>{formatDate(devis.dateDepart)} — {formatDate(devis.dateRetour)}</Text>
              <Text style={styles.infoLabel}>Durée: {dureeVoyage} jours / {dureeVoyage - 1} nuits</Text>
            </View>
          </View>
        </View>

        {/* Passagers */}
        <Text style={styles.sectionTitleFr}>Passagers ({devis.passagers.length})</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { flex: 3 }]}>Nom complet</Text>
          <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Catégorie</Text>
          <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Passeport</Text>
          <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Expiration</Text>
        </View>
        {devis.passagers.map((pa, i) => (
          <View key={`p${i}`} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt} wrap={false}>
            <Text style={[styles.tableCell, { flex: 3 }]}>{pa.prenom} {pa.nom}</Text>
            <Text style={[styles.tableCell, { flex: 2 }]}>{labFr(CATEGORIES_PASSAGER, pa.categorie)}</Text>
            <Text style={[styles.tableCell, { flex: 2 }]}>{pa.passeportNumero ?? '—'}</Text>
            <Text style={[styles.tableCell, { flex: 2 }]}>{pa.passeportExpiration ? formatDate(pa.passeportExpiration) : '—'}</Text>
          </View>
        ))}

        {/* Détail du voyage */}
        <Text style={styles.sectionTitleFr}>Détail du voyage</Text>

        {devis.segmentsVol.length > 0 ? (
          <View>
            <Text style={styles.sousBlocTitre}>• Vols</Text>
            {devis.segmentsVol.map((s, i) => (
              <View key={`s${i}`} style={styles.ligneDetail}>
                <Text style={[styles.tableCell, { flex: 4 }]}>{s.origine} — {s.destination}</Text>
                <Text style={[styles.tableCell, { flex: 2 }]}>{formatDate(s.dateVol)}</Text>
                <Text style={[styles.tableCell, { flex: 2 }]}>{s.compagnie?.nom ?? '—'}</Text>
                <Text style={[styles.tableCell, { flex: 2, textAlign: 'right' }]}>{s.classe}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {devis.hebergements.length > 0 ? (
          <View>
            <Text style={styles.sousBlocTitre}>• Hébergements</Text>
            {devis.hebergements.map((h, i) => (
              <View key={`h${i}`} style={styles.ligneDetail}>
                <Text style={[styles.tableCell, { flex: 4 }]}>{h.hotelNom} ({h.ville})</Text>
                <Text style={[styles.tableCell, { flex: 3 }]}>{labFr(TYPES_CHAMBRE, h.typeChambre)} • {labFr(FORMULES_REPAS, h.formuleRepas)}</Text>
                <Text style={[styles.tableCell, { flex: 3, textAlign: 'right' }]}>{h.nbNuitees} nuits × {h.nbChambres} ch.</Text>
              </View>
            ))}
          </View>
        ) : null}

        {devis.transferts.length > 0 ? (
          <View>
            <Text style={styles.sousBlocTitre}>• Transferts VIP</Text>
            {devis.transferts.map((t, i) => (
              <View key={`t${i}`} style={styles.ligneDetail}>
                <Text style={[styles.tableCell, { flex: 7 }]}>{t.trajet}</Text>
                <Text style={[styles.tableCell, { flex: 3, textAlign: 'right' }]}>{labFr(TYPES_VEHICULE, t.typeVehicule)}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {devis.trainsHaramain.length > 0 ? (
          <View>
            <Text style={styles.sousBlocTitre}>• Train Haramain</Text>
            {devis.trainsHaramain.map((t, i) => (
              <View key={`tr${i}`} style={styles.ligneDetail}>
                <Text style={[styles.tableCell, { flex: 6 }]}>{t.trajet}</Text>
                <Text style={[styles.tableCell, { flex: 2 }]}>{formatDate(t.dateTrain)}</Text>
                <Text style={[styles.tableCell, { flex: 2, textAlign: 'right' }]}>{t.classe}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {devis.prestationsVip.length > 0 ? (
          <View>
            <Text style={styles.sousBlocTitre}>• Prestations VIP</Text>
            {devis.prestationsVip.map((pr, i) => (
              <View key={`pr${i}`} style={styles.ligneDetail}>
                <Text style={[styles.tableCell, { flex: 3 }]}>{labFr(TYPES_PRESTATION_VIP, pr.type)}</Text>
                <Text style={[styles.tableCell, { flex: 7 }]}>{pr.descriptionFr}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Récapitulatif financier */}
        <Text style={styles.sectionTitleFr}>Récapitulatif</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { flex: 3 }]}>Poste</Text>
          <Text style={[styles.tableHeaderCell, { flex: 4 }]}>Description</Text>
          <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Devise source</Text>
          <Text style={[styles.tableHeaderCell, { flex: 3, textAlign: 'right' }]}>Montant DZD</Text>
        </View>
        {recapLignes}

        {/* Total */}
        <View style={styles.totalRow}>
          <View style={{ flex: 9 }}>
            <Text style={styles.totalLabelFr}>PRIX DE VENTE TOTAL</Text>
          </View>
          <Text style={[styles.totalValue, { flex: 3, textAlign: 'right' }]}>{fmtPdfMoney(devis.prixVenteDzd)}</Text>
        </View>

        {/* Bloc interne (vue interne uniquement) */}
        {!isClient ? (
          <View style={styles.internalBox}>
            <Text style={styles.internalTitle}>USAGE INTERNE — NE PAS TRANSMETTRE AU CLIENT</Text>
            <View style={styles.internalRow}>
              <Text style={styles.internalLabel}>Coût net total:</Text>
              <Text style={styles.internalValue}>{fmtPdfMoney(devis.coutNetDzd)}</Text>
            </View>
            <View style={styles.internalRow}>
              <Text style={styles.internalLabel}>Marge ({devis.margeType === 'pourcentage' ? `${devis.margeValeur}%` : 'montant fixe'}):</Text>
              <Text style={styles.internalValue}>{fmtPdfMoney(devis.margeMontantDzd)}</Text>
            </View>
            <View style={styles.internalRow}>
              <Text style={styles.internalLabel}>Taux de marge net:</Text>
              <Text style={styles.internalValue}>
                {D(devis.coutNetDzd).gt(0)
                  ? D(devis.margeMontantDzd).div(D(devis.coutNetDzd)).mul(100).toDecimalPlaces(2).toString()
                  : '0'}%
              </Text>
            </View>
          </View>
        ) : null}

        {/* Notes client */}
        {devis.notesClient ? (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>Notes</Text>
            <Text style={styles.notesText}>{devis.notesClient}</Text>
          </View>
        ) : null}

        {/* Taux de change + validité */}
        <View style={styles.tauxBox}>
          <Text style={styles.tauxTextFr}>
            Devis établi en DZD (Dinar Algérien). Taux applicables: 1 SAR = {devis.tauxSarDzd} DZD • 1 USD = {devis.tauxUsdDzd} DZD • 1 EUR = {devis.tauxEurDzd} DZD.
          </Text>
          <Text style={styles.tauxTextFrItalic}>
            Ce devis est valable 30 jours à compter de sa date d'émission.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>{p?.nomFr ?? 'El Mouhssinouen Tours'}</Text>
          <Text>Devis {devis.numero} — {isClient ? 'Exemplaire client' : 'EXEMPLAIRE INTERNE'}</Text>
        </View>
      </Page>
    </Document>
  )
}

export { DevisDocument }
export type { DevisForPdf }
