'use client'

import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Save, AlertTriangle, Check, FileDown, FileText } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { verifierAlertePasseport } from '@/lib/business'
import { downloadPdf } from '@/lib/client-utils'
import { toast } from 'sonner'
import { useDevisStore } from '@/store/useDevisStore'
import { PassagersStep } from '@/components/devis/PassagersStep'
import { VolsStep } from '@/components/devis/VolsStep'
import { HebergementStep } from '@/components/devis/HebergementStep'
import { TransfertsStep } from '@/components/devis/TransfertsStep'
import { PrestationsVipStep } from '@/components/devis/PrestationsVipStep'
import { FinancierStep } from '@/components/devis/FinancierStep'
import { RecapitulatifStep } from '@/components/devis/RecapitulatifStep'
import { HadjStep } from '@/components/devis/HadjStep'

const STEPS = [
  { id: 'passagers', label: 'Passagers' },
  { id: 'vols', label: 'Vols' },
  { id: 'hebergement', label: 'Hébergement' },
  { id: 'transferts', label: 'Transferts' },
  { id: 'hadj', label: 'Hadj VIP' },
  { id: 'vip', label: 'Prestations VIP' },
  { id: 'financier', label: 'Financier' },
  { id: 'recap', label: 'Récapitulatif' },
] as const

type StepId = typeof STEPS[number]['id']

export function NouveauDevisView({
  editDevisId,
  onDone,
}: {
  editDevisId: string | null
  onDone: () => void
}) {
  const [step, setStep] = useState<StepId>('passagers')
  
  const { devis, loading, saving, load, save, reset } = useDevisStore()

  useEffect(() => {
    load(editDevisId)
    return () => reset()
  }, [editDevisId, load, reset])

  if (loading || !devis) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin" />
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
      <Card className="p-4 glass-card border-0">
        <div className="flex items-center justify-between gap-1 overflow-x-auto scrollbar-thin">
          {STEPS.map((s, i) => {
            const active = s.id === step
            const done = i < stepIndex
            return (
              <button
                key={s.id}
                onClick={() => goto(s.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                  active ? 'bg-primary text-primary-foreground' : done ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                  active ? 'bg-primary text-primary-foreground' : done ? 'bg-accent text-accent-foreground' : 'bg-muted'
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
      <Card className="p-6 min-h-[400px] glass-card border-0">
        {step === 'passagers' && <PassagersStep />}
        {step === 'vols' && <VolsStep />}
        {step === 'hebergement' && <HebergementStep />}
        {step === 'transferts' && <TransfertsStep />}
        {step === 'hadj' && <HadjStep />}
        {step === 'vip' && <PrestationsVipStep />}
        {step === 'financier' && <FinancierStep />}
        {step === 'recap' && <RecapitulatifStep onSaved={save} />}
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
                <FileDown className="w-4 h-4 text-primary" /> PDF client
              </Button>
              <Button
                variant="outline"
                onClick={() => downloadPdf(devis.id!, 'interne', devis.numero).catch((e) => toast.error(e.message))}
                className="gap-2"
              >
                <FileText className="w-4 h-4 text-accent" /> PDF interne
              </Button>
              <Button
                variant="outline"
                onClick={() => downloadPdf(devis.id!, 'programme', devis.numero).catch((e) => toast.error(e.message))}
                className="gap-2"
              >
                <FileText className="w-4 h-4 text-emerald-600" /> PDF programme
              </Button>
            </>
          )}
        </div>
        {canNext ? (
          <Button onClick={next} className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground">
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
