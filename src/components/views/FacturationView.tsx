'use client'

import { useEffect, useState, useMemo } from 'react'
import {
  Receipt,
  Search,
  PlusCircle,
  History,
  TrendingUp,
  CheckCircle2,
  Clock,
  Trash2,
  Printer,
  FileText,
  DollarSign,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { fmt, fmtDate, api, printDocument } from '@/lib/client-utils'
import { D } from '@/lib/money'
import { toast } from 'sonner'
import { getErrorMessage } from '@/lib/errors'
import { montantEnLettresDzd } from '@/lib/numberToWords'

type View = 'dashboard' | 'liste-devis' | 'nouveau-devis' | 'facturation' | 'clients' | 'catalogues' | 'parametres'

interface VersementItem {
  id: string
  numeroRecu: string
  dateVersement: string
  montantDzd: string
  modePaiement: string
  reference?: string | null
  recuPar?: string | null
  notes?: string | null
}

interface FactureItem {
  id: string
  numero: string
  devisId: string
  clientId: string
  dateEmission: string
  dateEcheance?: string | null
  montantTotalDzd: string
  montantPayeDzd: string
  resteAPayerDzd: string
  statut: 'non_payee' | 'partiellement_payee' | 'payee' | 'annulee'
  notes?: string | null
  client: {
    id: string
    nom: string
    prenom?: string | null
    raisonSociale?: string | null
    type: string
    telephone?: string | null
    adresse?: string | null
    email?: string | null
  }
  devis: {
    id: string
    numero: string
    dateDepart: string
    dateRetour: string
    statut: string
    prixVenteDzd: string
    passagers?: Array<{ id: string; nom: string; prenom: string; categorie: string }>
    hebergements?: Array<{
      id: string
      ville: string
      hotelNom?: string | null
      nbNuitees: number
      typeChambre: string
      formuleRepas: string
      vue: string
      hotel?: { nom: string; ville: string } | null
    }>
    segmentsVol?: Array<{
      id: string
      origine: string
      destination: string
      classe: string
      origineRetour?: string | null
      destinationRetour?: string | null
      classeRetour?: string | null
      compagnie?: { nom: string } | null
    }>
    transferts?: Array<{ id: string; trajet: string; typeVehicule: string }>
  }
  versements: VersementItem[]
}

const STATUTS_FACTURE = {
  payee: { label: 'Soldée / Payée', color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' },
  partiellement_payee: { label: 'Partiellement payée', color: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30' },
  non_payee: { label: 'Non payée', color: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30' },
  annulee: { label: 'Annulée', color: 'bg-muted text-muted-foreground border-border' },
}

const MODES_PAIEMENT: Record<string, string> = {
  especes: 'Espèces',
  virement: 'Virement bancaire',
  cheque: 'Chèque',
  versement_bancaire: 'Versement CCP / Banque',
}

export function FacturationView({ onNavigate }: { onNavigate: (v: View, devisId?: string) => void }) {
  const [factures, setFactures] = useState<FactureItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatut, setFilterStatut] = useState<string>('all')

  // Modales
  const [selectedFacture, setSelectedFacture] = useState<FactureItem | null>(null)
  const [isVersementOpen, setIsVersementOpen] = useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [selectedReceipt, setSelectedReceipt] = useState<{ facture: FactureItem; versement: VersementItem } | null>(null)
  const [selectedPrintFacture, setSelectedPrintFacture] = useState<FactureItem | null>(null)
  const [agence, setAgence] = useState<{
    nomFr?: string
    nomAr?: string
    sloganFr?: string
    sloganAr?: string
    adresse?: string
    telephone?: string
    email?: string
    rc?: string
    if?: string
    art?: string
    capital?: string
  } | null>(null)

  // Formulaire de versement
  const [montantVersement, setMontantVersement] = useState('')
  const [modePaiement, setModePaiement] = useState('especes')
  const [referencePaiement, setReferencePaiement] = useState('')
  const [recuPar, setRecuPar] = useState('Agence')
  const [notesVersement, setNotesVersement] = useState('')
  const [submittingVersement, setSubmittingVersement] = useState(false)

  const loadFactures = async () => {
    setLoading(true)
    try {
      const [data, paramsData] = await Promise.all([
        api('/api/factures'),
        api('/api/parametres').catch(() => null),
      ])
      setFactures(data)
      if (paramsData?.parametres) {
        setAgence(paramsData.parametres)
      }
    } catch (e: unknown) {
      toast.error(getErrorMessage(e) || 'Erreur chargement factures')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenPrintFacture = async (facture: FactureItem) => {
    setSelectedPrintFacture(facture)
    try {
      const full = await api(`/api/factures/${facture.id}`)
      if (full) {
        setSelectedPrintFacture(full)
      }
    } catch {
      // Conserver la facture courante en cas de souci réseau
    }
  }

  useEffect(() => {
    loadFactures()
  }, [])

  // Filtrage
  const filtered = useMemo(() => {
    return factures.filter((f) => {
      const matchSearch =
        f.numero.toLowerCase().includes(search.toLowerCase()) ||
        f.devis.numero.toLowerCase().includes(search.toLowerCase()) ||
        `${f.client.prenom ?? ''} ${f.client.nom}`.toLowerCase().includes(search.toLowerCase()) ||
        (f.client.raisonSociale && f.client.raisonSociale.toLowerCase().includes(search.toLowerCase()))

      const matchStatut = filterStatut === 'all' || f.statut === filterStatut
      return matchSearch && matchStatut
    })
  }, [factures, search, filterStatut])

  // KPIs Financiers stricts avec Decimal
  const { totalFacture, totalEncaisse, resteARecouvrer } = useMemo(() => {
    let totF = D(0)
    let totE = D(0)
    let reste = D(0)

    for (const f of factures) {
      if (f.statut !== 'annulee') {
        totF = totF.plus(D(f.montantTotalDzd))
        totE = totE.plus(D(f.montantPayeDzd))
        reste = reste.plus(D(f.resteAPayerDzd))
      }
    }

    return {
      totalFacture: totF.toFixed(2),
      totalEncaisse: totE.toFixed(2),
      resteARecouvrer: reste.toFixed(2),
    }
  }, [factures])

  const tauxEncaissement = useMemo(() => {
    if (Number(totalFacture) === 0) return '0.0'
    return ((Number(totalEncaisse) / Number(totalFacture)) * 100).toFixed(1)
  }, [totalFacture, totalEncaisse])

  // Ouvrir modal Versement
  const handleOpenVersement = (f: FactureItem) => {
    setSelectedFacture(f)
    setMontantVersement(f.resteAPayerDzd)
    setModePaiement('especes')
    setReferencePaiement('')
    setNotesVersement('')
    setIsVersementOpen(true)
  }

  // Enregistrer versement
  const handleSaveVersement = async () => {
    if (!selectedFacture) return
    const montant = parseFloat(montantVersement)
    if (isNaN(montant) || montant <= 0) {
      toast.error('Veuillez saisir un montant supérieur à 0')
      return
    }

    setSubmittingVersement(true)
    try {
      const updatedFacture = await api(`/api/factures/${selectedFacture.id}/versements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          montantDzd: montantVersement,
          modePaiement,
          reference: referencePaiement,
          recuPar,
          notes: notesVersement,
        }),
      })

      toast.success('Règlement enregistré avec succès !')
      setIsVersementOpen(false)
      loadFactures()

      // Proposer d'imprimer le reçu
      const latestVersement = updatedFacture.versements[0]
      if (latestVersement) {
        setSelectedReceipt({ facture: updatedFacture, versement: latestVersement })
      }
    } catch (e: unknown) {
      toast.error(getErrorMessage(e))
    } finally {
      setSubmittingVersement(false)
    }
  }

  // Supprimer un versement
  const handleDeleteVersement = async (versementId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce versement ?')) return
    try {
      await api(`/api/factures/${selectedFacture?.id}/versements/${versementId}`, {
        method: 'DELETE',
      })
      toast.success('Versement annulé')
      loadFactures()
      if (selectedFacture) {
        const refreshed = await api(`/api/factures/${selectedFacture.id}`)
        setSelectedFacture(refreshed)
      }
    } catch (e: unknown) {
      toast.error(getErrorMessage(e))
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold font-serif text-foreground flex items-center gap-2.5">
            <Receipt className="w-6 h-6 text-brand-or" /> Facturation &amp; Règlements Clients
          </h2>
          <p className="text-xs lg:text-sm text-muted-foreground mt-0.5">
            Suivi des factures générées à partir des devis confirmés, encaissements et quittances de versement.
          </p>
        </div>
      </div>

      {/* KPIs Financiers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-border/80 bg-card/90 backdrop-blur-sm relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Total Facturé</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-lg lg:text-xl font-extrabold font-mono text-foreground">{fmt(totalFacture)} DZD</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">{factures.length} dossier(s) facturé(s)</p>
          </div>
        </Card>

        <Card className="p-4 border-border/80 bg-card/90 backdrop-blur-sm relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Total Encaissé</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-lg lg:text-xl font-extrabold font-mono text-emerald-600">{fmt(totalEncaisse)} DZD</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Versements reçus et confirmés</p>
          </div>
        </Card>

        <Card className="p-4 border-border/80 bg-card/90 backdrop-blur-sm relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Reste à Recouvrer</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/15 text-rose-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-lg lg:text-xl font-extrabold font-mono text-rose-600">{fmt(resteARecouvrer)} DZD</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Solde dû par les clients</p>
          </div>
        </Card>

        <Card className="p-4 border-border/80 bg-card/90 backdrop-blur-sm relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Recouvrement</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-brand-or flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-lg lg:text-xl font-extrabold font-mono text-foreground">{tauxEncaissement}%</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Du montant global facturé</p>
          </div>
        </Card>
      </div>

      {/* Barre de Recherche et Filtres */}
      <Card className="p-4 glass-card border-0">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par N° facture, N° devis ou nom client…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={filterStatut} onValueChange={setFilterStatut}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tous statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous statuts</SelectItem>
              <SelectItem value="non_payee">Non payées</SelectItem>
              <SelectItem value="partiellement_payee">Partiellement payées</SelectItem>
              <SelectItem value="payee">Soldées / Payées</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Table des Factures */}
      <Card className="overflow-hidden glass-card border-0">
        {loading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-md" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Receipt className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">Aucune facture enregistrée pour le moment</p>
            <p className="text-xs text-muted-foreground mt-1">
              Pour créer une facture, ouvrez la liste des devis et cliquez sur "Facturer" sur un devis accepté.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate('liste-devis')}
              className="mt-4 gap-1.5"
            >
              Consulter les devis
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">
                    N° Facture
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">
                    Client
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">
                    Devis Lié
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">
                    Date
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">
                    Total Facturé
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">
                    Payé
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">
                    Reste à Payer
                  </th>
                  <th className="text-center px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">
                    Statut
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((f, i) => {
                  const st = STATUTS_FACTURE[f.statut] ?? STATUTS_FACTURE.non_payee
                  const clientNom =
                    f.client.type === 'societe'
                      ? f.client.raisonSociale
                      : `${f.client.prenom ?? ''} ${f.client.nom}`

                  return (
                    <tr
                      key={f.id}
                      className={`border-b border-border hover:bg-muted/40 transition-colors ${
                        i % 2 === 0 ? '' : 'bg-muted/20'
                      }`}
                    >
                      <td className="px-4 py-3 font-mono font-bold text-xs text-brand-bleu-royal">
                        {f.numero}
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">
                        {clientNom}
                        {f.client.telephone && (
                          <div className="text-[10px] text-muted-foreground font-mono">{f.client.telephone}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => onNavigate('nouveau-devis', f.devisId)}
                          className="font-mono text-xs text-brand-or hover:underline"
                          title="Voir le devis source"
                        >
                          {f.devis.numero}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {fmtDate(f.dateEmission)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold tabular-nums">
                        {fmt(f.montantTotalDzd)} DZD
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-emerald-600 tabular-nums">
                        {fmt(f.montantPayeDzd)} DZD
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-rose-600 tabular-nums">
                        {fmt(f.resteAPayerDzd)} DZD
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant="outline" className={`text-[10px] font-semibold ${st.color}`}>
                          {st.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {f.statut !== 'payee' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenVersement(f)}
                              className="h-8 gap-1.5 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-300"
                              title="Encaisser un versement"
                            >
                              <PlusCircle className="w-3.5 h-3.5" />
                              Encaisser
                            </Button>
                          )}

                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-brand-bleu-royal hover:text-brand-bleu-royal hover:bg-brand-bleu-royal/10"
                            onClick={() => handleOpenPrintFacture(f)}
                            title="Imprimer la Facture"
                          >
                            <Printer className="w-4 h-4" />
                          </Button>

                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => {
                              setSelectedFacture(f)
                              setIsHistoryOpen(true)
                            }}
                            title="Historique des règlements"
                          >
                            <History className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal d'Encaissement / Versement */}
      <Dialog open={isVersementOpen} onOpenChange={setIsVersementOpen}>
        <DialogContent className="max-w-md bg-card border-border shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-serif">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              Nouveau Versement Client
            </DialogTitle>
            <DialogDescription>
              Enregistrez un versement pour la facture{' '}
              <span className="font-mono font-bold text-foreground">{selectedFacture?.numero}</span> (
              {selectedFacture?.client.nom}).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Récap solde */}
            <div className="p-3 rounded-xl bg-muted/40 border border-border/70 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total facture :</span>
                <span className="font-mono font-bold">{fmt(selectedFacture?.montantTotalDzd ?? '0')} DZD</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Déjà versé :</span>
                <span className="font-mono font-bold text-emerald-600">{fmt(selectedFacture?.montantPayeDzd ?? '0')} DZD</span>
              </div>
              <div className="flex justify-between border-t pt-1 font-bold">
                <span className="text-rose-600">Reste à régler :</span>
                <span className="font-mono text-rose-600">{fmt(selectedFacture?.resteAPayerDzd ?? '0')} DZD</span>
              </div>
            </div>

            {/* Saisie montant */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Montant à encaisser (DZD)</Label>
              <Input
                type="text"
                value={montantVersement}
                onChange={(e) => setMontantVersement(e.target.value)}
                placeholder="Ex: 150000"
                className="font-mono text-base font-bold"
              />
            </div>

            {/* Mode de paiement */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Mode de règlement</Label>
              <Select value={modePaiement} onValueChange={setModePaiement}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(MODES_PAIEMENT).map(([k, label]) => (
                    <SelectItem key={k} value={k}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Référence */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Référence / N° Chèque / Virement</Label>
              <Input
                value={referencePaiement}
                onChange={(e) => setReferencePaiement(e.target.value)}
                placeholder="Optionnel (ex: Chèque N° 0041235)"
              />
            </div>

            {/* Agent */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Encaissé par (Agent)</Label>
              <Input
                value={recuPar}
                onChange={(e) => setRecuPar(e.target.value)}
                placeholder="Nom de l'agent"
              />
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Notes &amp; Observations</Label>
              <Input
                value={notesVersement}
                onChange={(e) => setNotesVersement(e.target.value)}
                placeholder="Optionnel"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsVersementOpen(false)} disabled={submittingVersement}>
              Annuler
            </Button>
            <Button
              onClick={handleSaveVersement}
              disabled={submittingVersement}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              Enregistrer &amp; Valider
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Historique des Règlements */}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="max-w-2xl bg-card border-border shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-serif">
              <History className="w-5 h-5 text-brand-or" />
              Historique des Règlements — {selectedFacture?.numero}
            </DialogTitle>
            <DialogDescription>
              Tous les versements enregistrés pour le client{' '}
              <span className="font-semibold text-foreground">{selectedFacture?.client.nom}</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Mini récapitulatif */}
            <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-muted/40 border border-border/70 text-center">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Facturé</p>
                <p className="font-mono font-bold text-sm mt-0.5">{fmt(selectedFacture?.montantTotalDzd ?? '0')} DZD</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Total Payé</p>
                <p className="font-mono font-bold text-sm text-emerald-600 mt-0.5">
                  {fmt(selectedFacture?.montantPayeDzd ?? '0')} DZD
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Solde Dû</p>
                <p className="font-mono font-bold text-sm text-rose-600 mt-0.5">
                  {fmt(selectedFacture?.resteAPayerDzd ?? '0')} DZD
                </p>
              </div>
            </div>

            {/* Liste des versements */}
            {selectedFacture?.versements.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Aucun versement enregistré sur cette facture.
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {selectedFacture?.versements.map((v) => (
                  <div
                    key={v.id}
                    className="p-3 rounded-xl border border-border/70 bg-background/50 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-brand-bleu-royal">{v.numeroRecu}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {MODES_PAIEMENT[v.modePaiement] ?? v.modePaiement}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground">
                        Date : {fmtDate(v.dateVersement)} {v.recuPar ? `• Encaissé par : ${v.recuPar}` : ''}
                      </p>
                      {v.reference && <p className="text-[11px] text-muted-foreground font-mono">Réf: {v.reference}</p>}
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono font-extrabold text-sm text-emerald-600">
                        +{fmt(v.montantDzd)} DZD
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={() => setSelectedReceipt({ facture: selectedFacture, versement: v })}
                        title="Imprimer quittance / reçu"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                        onClick={() => handleDeleteVersement(v.id)}
                        title="Supprimer ce versement"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsHistoryOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Reçu de Paiement Imprimable (Format A5) */}
      {selectedReceipt && (
        <Dialog open={!!selectedReceipt} onOpenChange={() => setSelectedReceipt(null)}>
          <DialogContent className="max-w-lg bg-card border-border shadow-2xl">
            <DialogHeader className="no-print">
              <DialogTitle className="flex items-center gap-2 font-serif text-base">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Reçu de Versement (Format A5)
              </DialogTitle>
            </DialogHeader>

            {/* Fiche imprimable Format A5 */}
            <div className="print-only-container print-recu-a5 p-4 border border-brand-or/40 rounded-xl bg-white text-slate-950 space-y-2 font-sans text-xs">
              <div className="no-break flex items-start justify-between border-b border-slate-200 pb-2">
                <div>
                  <h3 className="font-serif font-black text-sm text-slate-950 tracking-wide">
                    {agence?.nomFr || 'EL MOUHSSINOUNE TOURS'}
                  </h3>
                  <p className="text-[11px] text-amber-800 font-bold" dir="rtl">
                    {agence?.nomAr || 'المحسنون للسياحة و الأسفار'}
                  </p>
                  <p className="text-[9px] text-slate-600 font-medium mt-0.5">
                    Agence de Voyages &amp; Tourisme — Omra &amp; Hadj VIP
                  </p>
                  <p className="text-[8.5px] text-slate-500">
                    Tél : {agence?.telephone || '042.52.24.24'} • {agence?.adresse || 'Oued Rhiou, Algérie'}
                  </p>
                </div>
                <div className="text-right">
                  <div className="inline-block px-2.5 py-0.5 rounded bg-amber-100/90 border border-amber-300 font-bold text-[9.5px] text-amber-950 mb-0.5">
                    REÇU DE VERSEMENT
                  </div>
                  <div className="font-mono font-black text-xs text-brand-bleu-royal">
                    {selectedReceipt.versement.numeroRecu}
                  </div>
                  <div className="text-[9.5px] text-slate-600 font-medium mt-0.5">
                    Date : <span className="font-semibold">{fmtDate(selectedReceipt.versement.dateVersement)}</span>
                  </div>
                </div>
              </div>

              <div className="no-break space-y-1">
                <div className="flex justify-between py-0.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium text-[10px]">Client / Pèlerin :</span>
                  <span className="font-bold text-slate-950 text-[11px]">
                    {selectedReceipt.facture.client.type === 'societe'
                      ? selectedReceipt.facture.client.raisonSociale
                      : `${selectedReceipt.facture.client.prenom ?? ''} ${selectedReceipt.facture.client.nom}`}
                    {selectedReceipt.facture.client.telephone && (
                      <span className="text-slate-500 font-mono text-[9.5px] ml-1.5 font-normal">
                        ({selectedReceipt.facture.client.telephone})
                      </span>
                    )}
                  </span>
                </div>

                <div className="flex justify-between py-0.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium text-[10px]">Facture &amp; Devis :</span>
                  <span className="font-mono text-slate-900 font-semibold text-[10.5px]">
                    Facture {selectedReceipt.facture.numero} • Devis {selectedReceipt.facture.devis.numero}
                  </span>
                </div>

                <div className="flex justify-between py-0.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium text-[10px]">Mode de versement :</span>
                  <span className="font-semibold text-slate-950 text-[10.5px]">
                    {MODES_PAIEMENT[selectedReceipt.versement.modePaiement] ?? selectedReceipt.versement.modePaiement}
                    {selectedReceipt.versement.reference && (
                      <span className="text-slate-500 font-mono text-[9.5px] ml-1 font-normal">
                        (Réf: {selectedReceipt.versement.reference})
                      </span>
                    )}
                  </span>
                </div>

                <div className="no-break p-2 rounded-lg bg-amber-50/90 border border-amber-300 text-center my-1">
                  <span className="text-[9.5px] uppercase tracking-wider font-bold text-amber-950">
                    MONTANT ENCAISSÉ
                  </span>
                  <div className="text-xl font-black font-mono text-slate-950 mt-0.5 tracking-tight">
                    {fmt(selectedReceipt.versement.montantDzd)} DZD
                  </div>
                </div>

                {/* Montant en toutes lettres */}
                <div className="no-break p-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-[10px] leading-snug">
                  <span className="font-bold text-slate-950">Arrêté le présent reçu à la somme de : </span>
                  <span className="italic font-semibold text-slate-950">
                    {montantEnLettresDzd(selectedReceipt.versement.montantDzd)}.
                  </span>
                </div>

                {/* Synthèse Solde */}
                <div className="no-break grid grid-cols-3 gap-2 p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-center text-[9.5px]">
                  <div>
                    <span className="text-slate-500">Total Dossier</span>
                    <p className="font-mono font-bold text-slate-900 mt-0.5">
                      {fmt(selectedReceipt.facture.montantTotalDzd)} DZD
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">Total Versé</span>
                    <p className="font-mono font-bold text-emerald-700 mt-0.5">
                      {fmt(selectedReceipt.facture.montantPayeDzd)} DZD
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold text-rose-700">Solde Restant</span>
                    <p className="font-mono font-bold text-rose-700 mt-0.5">
                      {fmt(selectedReceipt.facture.resteAPayerDzd)} DZD
                    </p>
                  </div>
                </div>
              </div>

              {/* Cachet et signature */}
              <div className="no-break pt-2 border-t border-slate-200 flex justify-between items-end">
                <div className="text-[8px] text-slate-500 leading-tight">
                  Reçu officiel émis par {agence?.nomFr || 'El Mouhssinoune Tours'}<br />
                  RC: {agence?.rc || '16/00-1234567 B 23'} • NIF: {agence?.if || '000016312345678'}<br />
                  Tél : {agence?.telephone || '042.52.24.24'}
                </div>
                <div className="border border-dashed border-slate-400 rounded-lg p-1.5 text-center w-32 bg-slate-50/50">
                  <div className="text-[8.5px] text-slate-900 font-bold mb-3.5">Cachet &amp; Signature</div>
                  <div className="text-[7.5px] text-slate-500">Agent : {selectedReceipt.versement.recuPar ?? 'Agence'}</div>
                </div>
              </div>
            </div>

            <DialogFooter className="no-print">
              <Button variant="outline" onClick={() => setSelectedReceipt(null)}>
                Fermer
              </Button>
              <Button
                onClick={() => printDocument('A5', 'portrait')}
                className="gap-1.5 bg-brand-or text-slate-950 font-bold hover:bg-brand-or/90"
              >
                <Printer className="w-4 h-4" />
                Imprimer le Reçu (Format A5)
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal Facture Imprimable (Format A4) */}
      {selectedPrintFacture && (
        <Dialog open={!!selectedPrintFacture} onOpenChange={() => setSelectedPrintFacture(null)}>
          <DialogContent className="max-w-3xl bg-card border-border shadow-2xl p-0 overflow-hidden max-h-[92vh] flex flex-col">
            <DialogHeader className="p-4 border-b border-border no-print">
              <DialogTitle className="flex items-center gap-2 font-serif text-base">
                <FileText className="w-5 h-5 text-brand-bleu-royal" />
                Facture Officielle — {selectedPrintFacture.numero} (Format A4)
              </DialogTitle>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/60 dark:bg-slate-950/40">
              {/* Fiche imprimable Format A4 */}
              <div className="print-only-container print-facture-a4 p-5 sm:p-6 border border-slate-300 rounded-xl bg-white text-slate-950 shadow-md space-y-2.5 font-sans text-xs max-w-2xl mx-auto">
                {/* Header Agence */}
                <div className="no-break flex justify-between items-start border-b border-brand-or/60 pb-2">
                  <div>
                    <h2 className="font-serif font-black text-lg text-slate-950 tracking-wider">
                      {agence?.nomFr || 'EL MOUHSSINOUNE TOURS'}
                    </h2>
                    <p className="text-xs text-amber-800 font-bold font-serif" dir="rtl">
                      {agence?.nomAr || 'المحسنون للسياحة و الأسفار'}
                    </p>
                    <p className="text-[9.5px] text-slate-600 font-semibold mt-0.5">
                      Agence de Voyages &amp; Tourisme — Omra &amp; Hadj VIP
                    </p>
                    <p className="text-[9px] text-slate-500">
                      {agence?.adresse || '31, Rue Larbi Ben Mhidi, Oued Rhiou, Algérie'}
                    </p>
                    <p className="text-[9px] text-slate-500 font-mono">
                      Tél : {agence?.telephone || '042.52.24.24 / 042.52.24.31'}
                    </p>
                  </div>
                  <div className="text-right space-y-0.5">
                    <span className="inline-block px-3 py-0.5 rounded bg-amber-100/90 border border-amber-300 font-serif font-black text-xs text-amber-950 tracking-wider">
                      FACTURE
                    </span>
                    <div className="font-mono font-black text-sm text-brand-bleu-royal">
                      {selectedPrintFacture.numero}
                    </div>
                    <div className="text-[10px] text-slate-700">
                      Date d&apos;émission : <span className="font-bold">{fmtDate(selectedPrintFacture.dateEmission)}</span>
                    </div>
                    <div className="text-[10px] text-slate-700">
                      Échéance : <span className="font-bold">{selectedPrintFacture.dateEcheance ? fmtDate(selectedPrintFacture.dateEcheance) : 'À réception'}</span>
                    </div>
                  </div>
                </div>

                {/* Informations Client & Dossier */}
                <div className="no-break grid grid-cols-2 gap-3 p-2.5 rounded-lg bg-slate-50 border border-slate-300">
                  <div>
                    <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">
                      Facturé à :
                    </div>
                    <div className="font-bold text-xs text-slate-950">
                      {selectedPrintFacture.client.type === 'societe'
                        ? selectedPrintFacture.client.raisonSociale
                        : `${selectedPrintFacture.client.prenom ?? ''} ${selectedPrintFacture.client.nom}`}
                    </div>
                    {selectedPrintFacture.client.telephone && (
                      <div className="text-[10px] text-slate-700 font-mono mt-0.5">
                        Tél : <span className="font-semibold">{selectedPrintFacture.client.telephone}</span>
                      </div>
                    )}
                    {selectedPrintFacture.client.adresse && (
                      <div className="text-[10px] text-slate-600 mt-0.5">
                        {selectedPrintFacture.client.adresse}
                      </div>
                    )}
                    {selectedPrintFacture.client.email && (
                      <div className="text-[10px] text-slate-600 font-mono mt-0.5">
                        {selectedPrintFacture.client.email}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">
                      Dossier de voyage VIP :
                    </div>
                    <div className="text-[10px] text-slate-800">
                      <span className="text-slate-500">Devis de référence : </span>
                      <span className="font-mono font-bold text-brand-or">{selectedPrintFacture.devis.numero}</span>
                    </div>
                    {selectedPrintFacture.devis.dateDepart && (
                      <div className="text-[10px] text-slate-700 mt-0.5">
                        Période : du <span className="font-bold">{fmtDate(selectedPrintFacture.devis.dateDepart)}</span> au{' '}
                        <span className="font-bold">{fmtDate(selectedPrintFacture.devis.dateRetour)}</span>
                      </div>
                    )}
                    <div className="text-[10px] text-slate-700 mt-0.5">
                      Participants :{' '}
                      <span className="font-semibold">
                        {selectedPrintFacture.devis.passagers?.length ?? 1} pèlerin(s)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tableau des Prestations */}
                <div className="no-break border border-slate-300 rounded-lg overflow-hidden">
                  <table className="print-table w-full text-xs">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-800 text-[10.5px]">
                        <th className="text-left px-2.5 py-1.5 w-[56%]">Désignation des Prestations</th>
                        <th className="text-center px-2 py-1.5 w-[18%]">Nature</th>
                        <th className="text-right px-2.5 py-1.5 w-[26%]">Montant (DZD)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      <tr>
                        <td className="px-2.5 py-2">
                          <p className="font-bold text-slate-950 text-xs">
                            Package Pèlerinage Omra &amp; Hadj VIP — Forfait Complet Sur-Mesure
                          </p>
                          <ul className="text-[10px] text-slate-600 mt-0.5 space-y-0.5 list-disc list-inside">
                            {selectedPrintFacture.devis.hebergements && selectedPrintFacture.devis.hebergements.length > 0 ? (
                              selectedPrintFacture.devis.hebergements.map((h, idx) => (
                                <li key={idx}>
                                  Séjour {h.ville} : <span className="font-semibold">{h.hotel?.nom || h.hotelNom || 'Hôtel VIP'}</span> ({h.nbNuitees} nuitées, chambre {h.typeChambre}, formule {h.formuleRepas.replace('_', ' ')})
                                </li>
                              ))
                            ) : (
                              <li>Hébergements 5★ / VIP Makkah &amp; Médine</li>
                            )}
                            {selectedPrintFacture.devis.segmentsVol && selectedPrintFacture.devis.segmentsVol.length > 0 ? (
                              selectedPrintFacture.devis.segmentsVol.map((v, idx) => (
                                <li key={idx}>
                                  Billetterie aérienne : {v.origine} → {v.destination} {v.destinationRetour ? `/ ${v.origineRetour} → ${v.destinationRetour}` : ''} ({v.classe})
                                </li>
                              ))
                            ) : (
                              <li>Billetterie aérienne Aller / Retour en classe VIP/Éco</li>
                            )}
                            <li>Transferts privés VIP et assistance personnalisée</li>
                            <li>Formalités de visa &amp; taxes ONPO incluses</li>
                          </ul>
                        </td>
                        <td className="px-2 py-2 text-center text-slate-700 font-medium text-[10.5px]">Forfait VIP</td>
                        <td className="px-2.5 py-2 text-right font-mono font-bold text-slate-950 text-xs">
                          {fmt(selectedPrintFacture.montantTotalDzd)} DZD
                        </td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-100 font-black border-t border-slate-300 text-xs">
                        <td colSpan={2} className="px-2.5 py-1.5 text-right text-slate-900 uppercase font-bold">
                          TOTAL FACTURÉ TTC :
                        </td>
                        <td className="px-2.5 py-1.5 text-right font-mono font-black text-slate-950 text-sm">
                          {fmt(selectedPrintFacture.montantTotalDzd)} DZD
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Montant en toutes lettres */}
                <div className="no-break p-2 rounded-lg bg-amber-50/80 border border-amber-300/80 text-slate-950 text-[10.5px] leading-snug">
                  <span className="font-bold text-amber-950">Arrêtée la présente facture à la somme de : </span>
                  <span className="italic font-bold text-slate-950">
                    {montantEnLettresDzd(selectedPrintFacture.montantTotalDzd)}.
                  </span>
                </div>

                {/* Situation des Règlements */}
                <div className="no-break border border-slate-300 rounded-lg p-2.5 bg-slate-50/70 space-y-1">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-slate-600">
                    Situation des Règlements &amp; Solde Client
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-1 rounded bg-white border border-slate-200">
                      <span className="text-[9px] text-slate-500 font-medium">Total Facturé</span>
                      <div className="font-mono font-bold text-slate-950 mt-0.5 text-[11px]">
                        {fmt(selectedPrintFacture.montantTotalDzd)} DZD
                      </div>
                    </div>
                    <div className="p-1 rounded bg-white border border-slate-200">
                      <span className="text-[9px] text-slate-500 font-medium">Déjà Encaissé</span>
                      <div className="font-mono font-bold text-emerald-700 mt-0.5 text-[11px]">
                        {fmt(selectedPrintFacture.montantPayeDzd)} DZD
                      </div>
                    </div>
                    <div className="p-1 rounded bg-white border border-slate-200">
                      <span className="text-[9px] text-slate-500 font-medium">Solde Restant à Régler</span>
                      <div className="font-mono font-black text-rose-700 mt-0.5 text-[11px]">
                        {fmt(selectedPrintFacture.resteAPayerDzd)} DZD
                      </div>
                    </div>
                  </div>

                  {/* Liste concise des versements */}
                  {selectedPrintFacture.versements.length > 0 && (
                    <div className="mt-1 pt-1 border-t border-slate-200 space-y-0.5">
                      <div className="text-[9.5px] font-bold text-slate-700">Règlements reçus :</div>
                      {selectedPrintFacture.versements.slice(0, 3).map((v) => (
                        <div key={v.id} className="flex justify-between text-[9.5px] text-slate-700 font-mono">
                          <span>
                            {v.numeroRecu} ({fmtDate(v.dateVersement)}) — {MODES_PAIEMENT[v.modePaiement] ?? v.modePaiement}
                          </span>
                          <span className="font-bold text-emerald-700">+{fmt(v.montantDzd)} DZD</span>
                        </div>
                      ))}
                      {selectedPrintFacture.versements.length > 3 && (
                        <div className="text-[8.5px] text-slate-500 italic text-right">
                          + {selectedPrintFacture.versements.length - 3} autre(s) versement(s) archivé(s)
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Mentions légales & Signature */}
                <div className="no-break pt-2 border-t border-slate-200 flex justify-between items-end">
                  <div className="text-[8px] text-slate-600 space-y-0.5">
                    <div className="font-semibold text-slate-800">El Mouhssinoune Tours — Agence de Voyages &amp; Tourisme</div>
                    <div>RC : {agence?.rc || '16/00-1234567 B 23'} • NIF : {agence?.if || '000016312345678'}</div>
                    <div>Article : {agence?.art || '16001234567'} • Capital : {agence?.capital || '1 000 000 DZD'}</div>
                    <div>Règlement par chèque bancaire, virement CCP / Banque ou espèces avec reçu officiel.</div>
                  </div>

                  <div className="flex gap-2.5">
                    <div className="border border-dashed border-slate-400 rounded-lg p-2 text-center w-28 bg-slate-50/50">
                      <div className="text-[8.5px] text-slate-900 font-bold mb-3.5">Cachet &amp; Signature</div>
                      <div className="text-[7.5px] text-slate-500">Direction Agence</div>
                    </div>
                    <div className="border border-dashed border-slate-400 rounded-lg p-2 text-center w-28 bg-slate-50/50">
                      <div className="text-[8.5px] text-slate-900 font-bold mb-3.5">Accord Client</div>
                      <div className="text-[7.5px] text-slate-500">Lu et approuvé</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="p-4 border-t border-border no-print flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSelectedPrintFacture(null)}>
                Fermer
              </Button>
              <Button
                onClick={() => printDocument('A4', 'portrait')}
                className="gap-1.5 bg-brand-bleu-royal text-white font-bold hover:bg-brand-bleu-royal/90"
              >
                <Printer className="w-4 h-4" />
                Imprimer la Facture (Format A4)
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
