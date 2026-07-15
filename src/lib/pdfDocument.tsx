// Génération PDF bilingue FR/AR via @react-pdf/renderer
// Conforme à PROMPT_AGENT_OmraVIP.md section 7.
// Deux variantes : client (prix de vente uniquement) et interne (avec marges).

import { Document, Page, Text, View, StyleSheet, Font, Link } from '@react-pdf/renderer'
import type { ResultatCalculDevis } from '@/lib/calculDevis'
import { formatMontant, formatMoney, D } from '@/lib/money'
import {
  CATEGORIES_PASSAGER, TYPES_VISA, TYPES_VEHICULE, TYPES_CHAMBRE,
  FORMULES_REPAS, VUES_HOTEL, TYPES_PRESTATION_VIP,
} from '@/lib/business'
import { differenceInCalendarDays } from 'date-fns'

// Polices — on utilise les polices intégrées de @react-pdf/renderer (Helvetica/Times)
// car on ne peut pas facilement embarquer Amiri/Playfair/Lato sans fichiers .ttf locaux.
// On utilise Times-Roman pour les titres (élégance éditoriale) et Helvetica pour le corps.
// Pour l'arabe, @react-pdf/renderer a un support limité — on utilise une approche mixte
// où les libellés arabes sont affichés en RTL via textAlign: 'right'.

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, fontFamily: 'Helvetica', color: '#0A1628' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, borderBottomWidth: 2, borderBottomColor: '#C4A152', paddingBottom: 12 },
  brand: { flexDirection: 'column' },
  brandName: { fontFamily: 'Times-Bold', fontSize: 18, color: '#CC1A1A' },
  brandNameAr: { fontFamily: 'Times-Bold', fontSize: 14, color: '#0A1628', marginTop: 2 },
  brandInfo: { fontSize: 8, color: '#555', marginTop: 4 },
  devisBox: { backgroundColor: '#0A1628', padding: 10, borderRadius: 4 },
  devisTitle: { color: '#C4A152', fontFamily: 'Times-Bold', fontSize: 11 },
  devisNumber: { color: '#FFFFFF', fontFamily: 'Helvetica-Bold', fontSize: 14, marginTop: 2 },
  devisDate: { color: '#F7F5F0', fontSize: 8, marginTop: 2 },
  sectionTitle: { fontFamily: 'Times-Bold', fontSize: 12, color: '#CC1A1A', marginTop: 16, marginBottom: 6, borderBottomWidth: 1, borderBottomColor: '#C4A152', paddingBottom: 4 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#0A1628', padding: 6, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  tableHeaderCell: { color: '#F7F5F0', fontFamily: 'Helvetica-Bold', fontSize: 9 },
  tableRow: { flexDirection: 'row', padding: 6, borderBottomWidth: 1, borderBottomColor: '#E5E5E5' },
  tableRowAlt: { flexDirection: 'row', padding: 6, backgroundColor: '#FAFAF8', borderBottomWidth: 1, borderBottomColor: '#E5E5E5' },
  tableCell: { fontSize: 9, color: '#0A1628' },
  totalRow: { flexDirection: 'row', padding: 8, backgroundColor: '#C4A152', marginTop: 2 },
  totalLabel: { fontFamily: 'Helvetica-Bold', color: '#0A1628', fontSize: 11 },
  totalValue: { fontFamily: 'Helvetica-Bold', color: '#0A1628', fontSize: 12 },
  internalBox: { marginTop: 12, padding: 10, backgroundColor: '#FFF8E0', borderWidth: 1, borderColor: '#C4A152', borderRadius: 4 },
  internalTitle: { fontFamily: 'Times-Bold', fontSize: 10, color: '#CC1A1A', marginBottom: 6 },
  arText: { fontFamily: 'Times-Roman', fontSize: 9, color: '#0A1628', textAlign: 'right' as const, direction: 'rtl' as const },
  footer: { position: 'absolute', bottom: 24, left: 36, right: 36, flexDirection: 'row', justifyContent: 'space-between', fontSize: 7, color: '#777', borderTopWidth: 1, borderTopColor: '#E5E5E5', paddingTop: 6 },
  bilingualRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  deuxColonnes: { flexDirection: 'row', gap: 12 },
  colonne: { flex: 1 },
  infoBox: { padding: 8, backgroundColor: '#F7F5F0', borderRadius: 4, marginBottom: 8 },
  infoLabel: { fontSize: 8, color: '#777', fontFamily: 'Helvetica' },
  infoValue: { fontSize: 10, color: '#0A1628', fontFamily: 'Helvetica-Bold' },
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

function formatDateAr(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d
  // Format ISO simple pour arabe (les mois en arabe ne sont pas fiables sans police dédiée)
  return date.toISOString().slice(0, 10)
}

function nbJours(d1: Date | string, d2: Date | string): number {
  const a = typeof d1 === 'string' ? new Date(d1) : d1
  const b = typeof d2 === 'string' ? new Date(d2) : d2
  return Math.max(0, differenceInCalendarDays(b, a))
}

// Libellés FR/AR pour les énumérations
function labFr(map: Record<string, { label: string; labelAr: string }>, key: string): string {
  return map[key]?.label ?? key
}
function labAr(map: Record<string, { label: string; labelAr: string }>, key: string): string {
  return map[key]?.labelAr ?? key
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

  // Regroupe les lignes de coût par poste
  const lignesParPoste: Record<string, typeof resultat.lignes> = {}
  if (resultat) {
    for (const l of resultat.lignes) {
      if (!lignesParPoste[l.poste]) lignesParPoste[l.poste] = []
      lignesParPoste[l.poste].push(l)
    }
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.brand}>
            <Text style={styles.brandName}>{p?.nomFr ?? 'El Mouhssinouen Tours'}</Text>
            <Text style={styles.brandNameAr}>{p?.nomAr ?? 'المحسنون للسياحة'}</Text>
            {p?.adresse && <Text style={styles.brandInfo}>{p.adresse}</Text>}
            {(p?.telephone || p?.email) && (
              <Text style={styles.brandInfo}>
                {p.telephone ?? ''} {p.email ? ` • ${p.email}` : ''}
              </Text>
            )}
            {(p?.rc || p?.if) && (
              <Text style={styles.brandInfo}>
                RC: {p.rc ?? '—'} • IF: {p.if ?? '—'} {p?.art ? `• ART: ${p.art}` : ''}
              </Text>
            )}
          </View>
          <View style={styles.devisBox}>
            <Text style={styles.devisTitle}>DEVIS / عرض سعر</Text>
            <Text style={styles.devisNumber}>{devis.numero}</Text>
            <Text style={styles.devisDate}>Émis le {formatDate(new Date())}</Text>
          </View>
        </View>

        {/* Infos voyage + client */}
        <View style={styles.deuxColonnes}>
          <View style={styles.colonne}>
            <Text style={styles.sectionTitle}>Client / العميل</Text>
            <View style={styles.infoBox}>
              {devis.client?.type === 'societe' ? (
                <>
                  <Text style={styles.infoLabel}>Société</Text>
                  <Text style={styles.infoValue}>{devis.client.raisonSociale ?? devis.client.nom}</Text>
                </>
              ) : (
                <>
                  <Text style={styles.infoLabel}>Nom</Text>
                  <Text style={styles.infoValue}>{devis.client?.nom} {devis.client?.prenom ?? ''}</Text>
                </>
              )}
              {devis.client?.telephone && <Text style={styles.infoLabel}>Tél: {devis.client.telephone}</Text>}
              {devis.client?.email && <Text style={styles.infoLabel}>{devis.client.email}</Text>}
            </View>
          </View>
          <View style={styles.colonne}>
            <Text style={styles.sectionTitle}>Voyage / الرحلة</Text>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Départ — Retour</Text>
              <Text style={styles.infoValue}>{formatDate(devis.dateDepart)} → {formatDate(devis.dateRetour)}</Text>
              <Text style={styles.infoLabel}>Durée: {dureeVoyage} jours / {dureeVoyage - 1} nuits</Text>
            </View>
          </View>
        </View>

        {/* Passagers */}
        <Text style={styles.sectionTitle}>Passagers / المسافرون ({devis.passagers.length})</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { flex: 3 }]}>Nom complet</Text>
          <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Catégorie</Text>
          <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Passeport</Text>
          <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Expiration</Text>
        </View>
        {devis.passagers.map((pa, i) => (
          <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
            <Text style={[styles.tableCell, { flex: 3 }]}>{pa.prenom} {pa.nom}</Text>
            <Text style={[styles.tableCell, { flex: 2 }]}>{labFr(CATEGORIES_PASSAGER, pa.categorie)}</Text>
            <Text style={[styles.tableCell, { flex: 2 }]}>{pa.passeportNumero ?? '—'}</Text>
            <Text style={[styles.tableCell, { flex: 2 }]}>{pa.passeportExpiration ? formatDate(pa.passeportExpiration) : '—'}</Text>
          </View>
        ))}

        {/* Détail du voyage */}
        {(devis.segmentsVol.length > 0 || devis.hebergements.length > 0 || devis.transferts.length > 0 || devis.trainsHaramain.length > 0 || devis.prestationsVip.length > 0) && (
          <>
            <Text style={styles.sectionTitle}>Détail du voyage / تفاصيل الرحلة</Text>

            {devis.segmentsVol.length > 0 && (
              <View style={{ marginBottom: 8 }}>
                <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 9, color: '#1B3A6B', marginBottom: 2 }}>✈ Vols</Text>
                {devis.segmentsVol.map((s, i) => (
                  <View key={i} style={{ flexDirection: 'row', padding: 4, borderBottomWidth: 1, borderBottomColor: '#EEE' }}>
                    <Text style={[styles.tableCell, { flex: 4 }]}>{s.origine} → {s.destination}</Text>
                    <Text style={[styles.tableCell, { flex: 2 }]}>{formatDate(s.dateVol)}</Text>
                    <Text style={[styles.tableCell, { flex: 2 }]}>{s.compagnie?.nom ?? '—'}</Text>
                    <Text style={[styles.tableCell, { flex: 2, textAlign: 'right' }]}>{s.classe}</Text>
                  </View>
                ))}
              </View>
            )}

            {devis.hebergements.length > 0 && (
              <View style={{ marginBottom: 8 }}>
                <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 9, color: '#1B3A6B', marginBottom: 2 }}>🏨 Hébergements</Text>
                {devis.hebergements.map((h, i) => (
                  <View key={i} style={{ flexDirection: 'row', padding: 4, borderBottomWidth: 1, borderBottomColor: '#EEE' }}>
                    <Text style={[styles.tableCell, { flex: 4 }]}>{h.hotelNom} ({h.ville})</Text>
                    <Text style={[styles.tableCell, { flex: 2 }]}>{labFr(TYPES_CHAMBRE, h.typeChambre)} • {labFr(FORMULES_REPAS, h.formuleRepas)}</Text>
                    <Text style={[styles.tableCell, { flex: 2 }]}>{formatDate(h.dateCheckin)} → {formatDate(h.dateCheckout)}</Text>
                    <Text style={[styles.tableCell, { flex: 2, textAlign: 'right' }]}>{h.nbNuitees} nuits × {h.nbChambres} ch.</Text>
                  </View>
                ))}
              </View>
            )}

            {devis.transferts.length > 0 && (
              <View style={{ marginBottom: 8 }}>
                <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 9, color: '#1B3A6B', marginBottom: 2 }}>🚗 Transferts VIP</Text>
                {devis.transferts.map((t, i) => (
                  <View key={i} style={{ flexDirection: 'row', padding: 4, borderBottomWidth: 1, borderBottomColor: '#EEE' }}>
                    <Text style={[styles.tableCell, { flex: 6 }]}>{t.trajet}</Text>
                    <Text style={[styles.tableCell, { flex: 4, textAlign: 'right' }]}>{labFr(TYPES_VEHICULE, t.typeVehicule)}</Text>
                  </View>
                ))}
              </View>
            )}

            {devis.trainsHaramain.length > 0 && (
              <View style={{ marginBottom: 8 }}>
                <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 9, color: '#1B3A6B', marginBottom: 2 }}>🚄 Train Haramain</Text>
                {devis.trainsHaramain.map((t, i) => (
                  <View key={i} style={{ flexDirection: 'row', padding: 4, borderBottomWidth: 1, borderBottomColor: '#EEE' }}>
                    <Text style={[styles.tableCell, { flex: 6 }]}>{t.trajet}</Text>
                    <Text style={[styles.tableCell, { flex: 2 }]}>{formatDate(t.dateTrain)}</Text>
                    <Text style={[styles.tableCell, { flex: 2, textAlign: 'right' }]}>{t.classe}</Text>
                  </View>
                ))}
              </View>
            )}

            {devis.prestationsVip.length > 0 && (
              <View style={{ marginBottom: 8 }}>
                <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 9, color: '#1B3A6B', marginBottom: 2 }}>⭐ Prestations VIP</Text>
                {devis.prestationsVip.map((p, i) => (
                  <View key={i} style={{ flexDirection: 'row', padding: 4, borderBottomWidth: 1, borderBottomColor: '#EEE' }}>
                    <Text style={[styles.tableCell, { flex: 3 }]}>{labFr(TYPES_PRESTATION_VIP, p.type)}</Text>
                    <Text style={[styles.tableCell, { flex: 7 }]}>{p.descriptionFr}</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {/* Récapitulatif financier */}
        <Text style={styles.sectionTitle}>Récapitulatif / الملخص المالي</Text>
        {resultat && (
          <>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { flex: 3 }]}>Poste</Text>
              <Text style={[styles.tableHeaderCell, { flex: 4 }]}>Description</Text>
              <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Devise source</Text>
              <Text style={[styles.tableHeaderCell, { flex: 3, textAlign: 'right' }]}>Montant DZD</Text>
            </View>
            {resultat.lignes.map((l, i) => (
              <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                <Text style={[styles.tableCell, { flex: 3 }]}>{l.poste}</Text>
                <Text style={[styles.tableCell, { flex: 4 }]}>{l.description}</Text>
                <Text style={[styles.tableCell, { flex: 2 }]}>{formatMontant(l.montantSource)} {l.deviseSource}</Text>
                <Text style={[styles.tableCell, { flex: 3, textAlign: 'right' }]}>{formatMontant(l.montantDzd)}</Text>
              </View>
            ))}

            {/* Total prix de vente (vue client) */}
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { flex: 9 }]}>PRIX DE VENTE TOTAL / إجمالي سعر البيع</Text>
              <Text style={[styles.totalValue, { flex: 3, textAlign: 'right' }]}>{formatMoney(devis.prixVenteDzd)}</Text>
            </View>

            {/* Bloc interne (vue interne uniquement) */}
            {!isClient && (
              <View style={styles.internalBox}>
                <Text style={styles.internalTitle}>⚠ USAGE INTERNE — NE PAS TRANSMETTRE AU CLIENT</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ fontSize: 9 }}>Coût net total:</Text>
                  <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 9 }}>{formatMoney(devis.coutNetDzd)}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ fontSize: 9 }}>Marge ({devis.margeType === 'pourcentage' ? `${devis.margeValeur}%` : 'montant fixe'}):</Text>
                  <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 9 }}>{formatMoney(devis.margeMontantDzd)}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 9 }}>Taux de marge net:</Text>
                  <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 9 }}>
                    {D(devis.coutNetDzd).gt(0)
                      ? D(devis.margeMontantDzd).div(D(devis.coutNetDzd)).mul(100).toDecimalPlaces(2).toString()
                      : '0'}%
                  </Text>
                </View>
                <View style={{ marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: '#C4A152' }}>
                  <Text style={{ fontSize: 8, color: '#555' }}>
                    Taux verrouillés: 1 SAR = {devis.tauxSarDzd} DZD • 1 USD = {devis.tauxUsdDzd} DZD • 1 EUR = {devis.tauxEurDzd} DZD
                  </Text>
                </View>
              </View>
            )}

            {/* Notes client */}
            {devis.notesClient && (
              <View style={{ marginTop: 12, padding: 8, backgroundColor: '#F7F5F0', borderRadius: 4 }}>
                <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 9, color: '#0A1628', marginBottom: 4 }}>Notes / ملاحظات</Text>
                <Text style={{ fontSize: 9, color: '#333' }}>{devis.notesClient}</Text>
              </View>
            )}

            {/* Taux de change affichés au client */}
            {isClient && (
              <View style={{ marginTop: 12, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#E5E5E5' }}>
                <Text style={{ fontSize: 8, color: '#777', textAlign: 'center' }}>
                  Devis établi en DZD (Dinar Algérien). Taux de change applicables: 1 SAR = {devis.tauxSarDzd} DZD • 1 USD = {devis.tauxUsdDzd} DZD • 1 EUR = {devis.tauxEurDzd} DZD.
                </Text>
                <Text style={{ fontSize: 8, color: '#777', textAlign: 'center', marginTop: 4 }}>
                  هذا العقد معد بالدينار الجزائري. الأسعار قابلة للتغيير دون إشعار. العرض صالح لمدة 30 يوماً.
                </Text>
                <Text style={{ fontSize: 8, color: '#777', textAlign: 'center', marginTop: 4, fontFamily: 'Times-Bold' }}>
                  Ce devis est valable 30 jours à compter de sa date d'émission.
                </Text>
              </View>
            )}
          </>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>{p?.nomFr ?? 'El Mouhssinouen Tours'} — {p?.nomAr ?? 'المحسنون للسياحة'}</Text>
          <Text>Devis {devis.numero} — {isClient ? 'Exemplaire client' : 'EXEMPLAIRE INTERNE'}</Text>
        </View>
      </Page>
    </Document>
  )
}

export { DevisDocument }
export type { DevisForPdf }
