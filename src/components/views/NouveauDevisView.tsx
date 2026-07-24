'use client'

import { useEffect, useState, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Save, AlertTriangle, Check, X, Plus, Trash2, FileDown, FileText } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { fmt, fmtDate, fmtDateInput, api, downloadPdf } from '@/lib/client-utils'
import {
  CATEGORIES_PASSAGER, TYPES_VISA, TYPES_VEHICULE, TYPES_CHAMBRE,
  FORMULES_REPAS, VUES_HOTEL, TYPES_PRESTATION_VIP, STATUTS_DEVIS,
  verifierAlertePasseport,
} from '@/lib/business'
import { D, formatMontant, formatMoney } from '@/lib/money'
import { toast } from 'sonner'
import { PassagersStep } from '@/components/devis/PassagersStep'
import { VolsStep } from '@/components/devis/VolsStep'
import { HebergementStep } from '@/components/devis/HebergementStep'
import { TransfertsStep } from '@/components/devis/TransfertsStep'
import { PrestationsVipStep } from '@/components/devis/PrestationsVipStep'
import { FinancierStep } from '@/components/devis/FinancierStep'
import { RecapitulatifStep } from '@/components/devis/RecapitulatifStep'

const STEPS = [
  { id: 'passagers', label: 'Passagers' },
  { id: 'vols', label: 'Vols' },
  { id: 'hebergement', label: 'Hébergement' },
  { id: 'transferts', label: 'Transferts' },
  { id: 'vip', label: 'Prestations VIP' },
  { id: 'financier', label: 'Financier' },
  { id: 'recap', label: 'Récapitulatif' },
] as const

type StepId = typeof STEPS[number]['id']

interface DevisData {
  id?: string
  numero?: string
  clientId: string
  dateDepart: string
  dateRetour: string
  visaType: string
  visaPrixUnit: string
  visaDevise: string
  assurancePrixUnit: string
  assuranceDevise: string
  margeType: 'pourcentage' | 'montant_fixe'
  margeValeur: string
  statut: string
  notesClient: string
  notesInternes: string
  tauxSarDzd: string
  tauxUsdDzd: string
  tauxEurDzd: string
  passagers: any[]
  segmentsVol: any[]
  hebergements: any[]
  transferts: any[]
  trainsHaramain: any[]
  prestationsVip: any[]
}

export function NouveauDevisView({
  editDevisId,
  onDone,
}: {
  editDevisId: string | null
  onDone: () => void
}) {
  const [step, setStep] = useState<StepId>('passagers')
  const [clients, setClients] = useState<any[]>([])
  const [devis, setDevis] = useState<DevisData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [resultatCalcul, setResultatCalcul] = useState<any>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const cls = await api('/api/clients')
      setClients(cls)
      // Récupère les taux de change par défaut depuis les paramètres
      const paramsRes = await api('/api/parametres')
      const defaultTaux: Record<string, string> = {}
      for (const t of paramsRes.taux ?? []) {
        defaultTaux[t.code] = t.tauxDzd
      }
      if (editDevisId) {
        const d = await api(`/api/devis/${editDevisId}`)
        setDevis({
          id: d.id,
          numero: d.numero,
          clientId: d.clientId,
          dateDepart: fmtDateInput(d.dateDepart),
          dateRetour: fmtDateInput(d.dateRetour),
          visaType: d.visaType,
          visaPrixUnit: d.visaPrixUnit,
          visaDevise: d.visaDevise,
          assurancePrixUnit: d.assurancePrixUnit,
          assuranceDevise: d.assuranceDevise,
          margeType: d.margeType,
          margeValeur: d.margeValeur,
          statut: d.statut,
          notesClient: d.notesClient ?? '',
          notesInternes: d.notesInternes ?? '',
          tauxSarDzd: d.tauxSarDzd,
          tauxUsdDzd: d.tauxUsdDzd,
          tauxEurDzd: d.tauxEurDzd,
          passagers: d.passagers.map((p: any) => ({
            ...p,
            dateNaissance: fmtDateInput(p.dateNaissance),
            passeportExpiration: fmtDateInput(p.passeportExpiration),
          })),
          segmentsVol: d.segmentsVol.map((s: any, idx: number) => ({
            ...s,
            typeVol: s.typeVol || (idx === 0 ? 'aller' : 'retour'),
            dateVol: fmtDateInput(s.dateVol) + 'T' + (s.dateVol ? new Date(s.dateVol).toTimeString().slice(0, 5) : '08:00'),
            origineRetour: s.origineRetour ?? '',
            destinationRetour: s.destinationRetour ?? '',
            dateVolRetour: s.dateVolRetour ? (fmtDateInput(s.dateVolRetour) + 'T' + new Date(s.dateVolRetour).toTimeString().slice(0, 5)) : '',
            classeRetour: s.classeRetour ?? s.classe ?? 'economique',
          })),
          hebergements: d.hebergements.map((h: any) => ({
            ...h,
            dateCheckin: fmtDateInput(h.dateCheckin),
            dateCheckout: fmtDateInput(h.dateCheckout),
          })),
          transferts: d.transferts,
          trainsHaramain: d.trainsHaramain.map((t: any) => ({
            ...t,
            dateTrain: fmtDateInput(t.dateTrain) + 'T' + new Date(t.dateTrain).toTimeString().slice(0, 5),
          })),
          prestationsVip: d.prestationsVip,
        })
        setResultatCalcul(d._resultatCalcul)
      } else {
        const today = new Date()
        const future = new Date()
        future.setDate(future.getDate() + 14)
        setDevis({
          clientId: cls[0]?.id ?? '',
          dateDepart: fmtDateInput(today),
          dateRetour: fmtDateInput(future),
          visaType: 'omra_standard',
          visaPrixUnit: '450',
          visaDevise: 'SAR',
          assurancePrixUnit: '5000',
          assuranceDevise: 'DZD',
          margeType: 'pourcentage',
          margeValeur: '15',
          statut: 'brouillon',
          notesClient: '',
          notesInternes: '',
          // Taux par défaut depuis les paramètres — l'utilisateur peut les modifier dans l'étape Financier
          tauxSarDzd: defaultTaux.SAR ?? '35.50',
          tauxUsdDzd: defaultTaux.USD ?? '240.00',
          tauxEurDzd: defaultTaux.EUR ?? '260.00',
          passagers: [],
          segmentsVol: [],
          hebergements: [],
          transferts: [],
          trainsHaramain: [],
          prestationsVip: [],
        })
      }
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }, [editDevisId])

  useEffect(() => { load() }, [load])

  // Recalcule le résultat en temps réel via l'API (après save initiale)
  const recalc = useCallback(async () => {
    if (!devis?.id) return
    try {
      const r = await api(`/api/devis/${devis.id}/calcul`, { method: 'POST' })
      setResultatCalcul(r)
    } catch (e) {
      // silent fail
    }
  }, [devis?.id])

  const save = async (silent = false): Promise<string | null> => {
    if (!devis) return null
    setSaving(true)
    try {
      const payload = {
        clientId: devis.clientId,
        dateDepart: devis.dateDepart,
        dateRetour: devis.dateRetour,
        visaType: devis.visaType,
        visaPrixUnit: devis.visaPrixUnit,
        visaDevise: devis.visaDevise,
        assurancePrixUnit: devis.assurancePrixUnit,
        assuranceDevise: devis.assuranceDevise,
        margeType: devis.margeType,
        margeValeur: devis.margeValeur,
        statut: devis.statut,
        notesClient: devis.notesClient || null,
        notesInternes: devis.notesInternes || null,
        tauxSarDzd: devis.tauxSarDzd,
        tauxUsdDzd: devis.tauxUsdDzd,
        tauxEurDzd: devis.tauxEurDzd,
        passagers: devis.passagers.map((p) => ({
          categorie: p.categorie,
          nom: p.nom,
          prenom: p.prenom,
          dateNaissance: p.dateNaissance || null,
          passeportNumero: p.passeportNumero || null,
          passeportExpiration: p.passeportExpiration || null,
        })),
        segmentsVol: devis.segmentsVol.map((s) => ({
          origine: s.origine,
          destination: s.destination,
          dateVol: s.dateVol,
          classe: s.classe,
          origineRetour: s.origineRetour || null,
          destinationRetour: s.destinationRetour || null,
          dateVolRetour: s.dateVolRetour || null,
          classeRetour: s.classeRetour || null,
          compagnieId: s.compagnieId || null,
          prixAdulte: s.prixAdulte,
          prixEnfant: s.prixEnfant,
          prixBebe: s.prixBebe,
          devise: s.devise,
        })),
        hebergements: devis.hebergements.map((h) => ({
          ville: h.ville,
          hotelId: h.hotelId || null,
          hotelNom: h.hotelNom,
          typeChambre: h.typeChambre,
          formuleRepas: h.formuleRepas,
          vue: h.vue,
          dateCheckin: h.dateCheckin,
          dateCheckout: h.dateCheckout,
          nbChambres: h.nbChambres,
          prixNuitChambre: h.prixNuitChambre,
          devise: h.devise,
        })),
        transferts: devis.transferts.map((t) => ({
          trajet: t.trajet,
          typeVehicule: t.typeVehicule,
          prix: t.prix,
          devise: t.devise,
          obligatoire: t.obligatoire,
        })),
        trainsHaramain: devis.trainsHaramain.map((t) => ({
          trajet: t.trajet,
          classe: t.classe,
          dateTrain: t.dateTrain,
          prixAdulte: t.prixAdulte,
          prixEnfant: t.prixEnfant,
          devise: t.devise,
        })),
        prestationsVip: devis.prestationsVip.map((p) => ({
          type: p.type,
          descriptionFr: p.descriptionFr,
          descriptionAr: p.descriptionAr,
          prix: p.prix,
          devise: p.devise,
        })),
      }

      let savedId: string
      if (devis.id) {
        await api(`/api/devis/${devis.id}`, { method: 'PUT', body: JSON.stringify(payload) })
        savedId = devis.id
        if (!silent) toast.success('Devis mis à jour')
      } else {
        const created = await api('/api/devis', { method: 'POST', body: JSON.stringify(payload) })
        savedId = created.id
        setDevis({ ...devis, id: created.id, numero: created.numero })
        if (!silent) toast.success(`Devis ${created.numero} créé`)
      }
      // Recalcule après save
      try {
        const r = await api(`/api/devis/${savedId}/calcul`, { method: 'POST' })
        setResultatCalcul(r)
      } catch {}
      return savedId
    } catch (e: any) {
      toast.error(e.message)
      return null
    } finally {
      setSaving(false)
    }
  }

  if (loading || !devis) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-2 border-brand-or border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const stepIndex = STEPS.findIndex((s) => s.id === step)
  const canPrev = stepIndex > 0
  const canNext = stepIndex < STEPS.length - 1

  const goto = (id: StepId) => setStep(id)
  const next = () => canNext && setStep(STEPS[stepIndex + 1].id)
  const prev = () => canPrev && setStep(STEPS[stepIndex - 1].id)

  // Vérifie les alertes passeport
  const alertesPasseport = devis.passagers.filter(
    (p) => p.passeportExpiration && verifierAlertePasseport(p.passeportExpiration, devis.dateRetour).alerte,
  )

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Stepper */}
      <Card className="p-4">
        <div className="flex items-center justify-between gap-1 overflow-x-auto scrollbar-thin">
          {STEPS.map((s, i) => {
            const active = s.id === step
            const done = i < stepIndex
            return (
              <button
                key={s.id}
                onClick={() => goto(s.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                  active ? 'bg-brand-rouge text-white' : done ? 'text-brand-bleu-nuit' : 'text-muted-foreground'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                  active ? 'bg-white text-brand-rouge' : done ? 'bg-brand-or text-white' : 'bg-muted'
                }`}>
                  {done ? <Check className="w-3 h-3" /> : i + 1}
                </span>
                {s.label}
              </button>
            )
          })}
        </div>
      </Card>

      {/* Alerte passeport banner */}
      {alertesPasseport.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">
            <p className="font-semibold text-red-700">
              {alertesPasseport.length} passeport(s) expirent moins de 6 mois après la date de retour
            </p>
            <p className="text-red-600 mt-0.5">
              {alertesPasseport.map((p) => `${p.prenom} ${p.nom}`).join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* Content */}
      <Card className="p-6 min-h-[400px]">
        {step === 'passagers' && (
          <PassagersStep
            devis={devis}
            setDevis={setDevis}
            clients={clients}
          />
        )}
        {step === 'vols' && (
          <VolsStep devis={devis} setDevis={setDevis} />
        )}
        {step === 'hebergement' && (
          <HebergementStep devis={devis} setDevis={setDevis} />
        )}
        {step === 'transferts' && (
          <TransfertsStep devis={devis} setDevis={setDevis} />
        )}
        {step === 'vip' && (
          <PrestationsVipStep devis={devis} setDevis={setDevis} />
        )}
        {step === 'financier' && (
          <FinancierStep
            devis={devis}
            setDevis={setDevis}
            resultatCalcul={resultatCalcul}
          />
        )}
        {step === 'recap' && (
          <RecapitulatifStep
            devis={devis}
            resultatCalcul={resultatCalcul}
            onSaved={save}
          />
        )}
      </Card>

      {/* Footer navigation */}
      <div className="flex items-center justify-between gap-3 sticky bottom-4">
        <Button
          variant="outline"
          onClick={prev}
          disabled={!canPrev}
          className="gap-2"
        >
          <ChevronLeft className="w-4 h-4" /> Précédent
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={() => save()}
            disabled={saving}
            className="gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Sauvegarde…' : 'Sauvegarder'}
          </Button>
          {devis.id && (
            <>
              <Button
                variant="outline"
                onClick={() => downloadPdf(devis.id!, 'client', devis.numero).catch((e) => toast.error(e.message))}
                className="gap-2"
              >
                <FileDown className="w-4 h-4 text-brand-bleu-royal" /> PDF client
              </Button>
              <Button
                variant="outline"
                onClick={() => downloadPdf(devis.id!, 'interne', devis.numero).catch((e) => toast.error(e.message))}
                className="gap-2"
              >
                <FileText className="w-4 h-4 text-brand-or" /> PDF interne
              </Button>
            </>
          )}
        </div>
        {canNext ? (
          <Button onClick={next} className="gap-2 bg-brand-rouge hover:bg-brand-rouge/90">
            Suivant <ChevronRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button onClick={onDone} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
            <Check className="w-4 h-4" /> Terminer
          </Button>
        )}
      </div>
    </div>
  )
}
