'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { fmt } from '@/lib/client-utils'
import { D } from '@/lib/money'

interface Props {
  devis: any
  setDevis: (updater: (d: any) => any) => void
  resultatCalcul: any
}

export function FinancierStep({ devis, setDevis, resultatCalcul }: Props) {
  const update = (field: string, value: any) => {
    setDevis((d) => ({ ...d, [field]: value }))
  }

  const nbPassagers = devis.passagers.length
  const visaTotal = (parseFloat(devis.visaPrixUnit || '0') * nbPassagers).toFixed(2)
  const assuranceTotal = (parseFloat(devis.assurancePrixUnit || '0') * nbPassagers).toFixed(2)

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Colonne gauche — Visa & Frais ONPO */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm border-b border-border pb-2">Visa & Frais ONPO</h3>

          <div className="space-y-2">
            <Label>Type de visa</Label>
            <Select value={devis.visaType} onValueChange={(v) => update('visaType', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="omra_standard">Omra Standard</SelectItem>
                <SelectItem value="touristique">Touristique</SelectItem>
                <SelectItem value="hadj">Hadj</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Prix unit. visa ({nbPassagers} pax)</Label>
              <Input type="number" step="0.01" value={devis.visaPrixUnit} onChange={(e) => update('visaPrixUnit', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Devise visa</Label>
              <Select value={devis.visaDevise} onValueChange={(v) => update('visaDevise', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="SAR">SAR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="DZD">DZD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Sous-total visa: <strong>{visaTotal} {devis.visaDevise}</strong></p>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/50">
            <div className="space-y-2">
              <Label>Prix unit. Frais ONPO ({nbPassagers} pax)</Label>
              <Input type="number" step="0.01" value={devis.assurancePrixUnit} onChange={(e) => update('assurancePrixUnit', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Devise Frais ONPO</Label>
              <Select value={devis.assuranceDevise} onValueChange={(v) => update('assuranceDevise', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="SAR">SAR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="DZD">DZD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Sous-total Frais ONPO: <strong>{assuranceTotal} {devis.assuranceDevise}</strong></p>
            <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-medium">Non commissionable</span>
          </div>
        </div>

        {/* Colonne droite — Marge */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm border-b border-border pb-2">Marge agence</h3>

          <div className="space-y-2">
            <Label>Type de marge</Label>
            <Select value={devis.margeType} onValueChange={(v) => update('margeType', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pourcentage">Pourcentage (%)</SelectItem>
                <SelectItem value="montant_fixe">Montant fixe (DZD)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{devis.margeType === 'pourcentage' ? 'Valeur (%)' : 'Montant (DZD)'}</Label>
            <Input
              type="number" step="0.01"
              value={devis.margeValeur}
              onChange={(e) => update('margeValeur', e.target.value)}
            />
          </div>

          {/* Taux de change éditables — verrouillés à la sauvegarde du devis */}
          <div className="p-3 bg-brand-or/5 border border-brand-or/20 rounded-md text-xs space-y-2">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-brand-bleu-nuit">Taux de change du devis</p>
              {devis.id && (
                <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-medium">
                  ⚠ Verrouillés — modifier avec précaution
                </span>
              )}
              {!devis.id && (
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-medium">
                  Éditables
                </span>
              )}
            </div>
            <p className="text-muted-foreground">
              {devis.id
                ? "Ce devis a déjà été créé. Modifier ces taux recalculera tous les montants."
                : "Ces taux seront verrouillés à la création du devis et ne changeront plus."}
            </p>
            <div className="grid grid-cols-3 gap-2 mt-2">
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">1 SAR =</Label>
                <Input
                  type="number" step="0.01"
                  value={devis.tauxSarDzd ?? ''}
                  onChange={(e) => update('tauxSarDzd', e.target.value)}
                  className="h-8 font-mono text-xs"
                />
                <p className="text-[9px] text-muted-foreground">DZD</p>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">1 USD =</Label>
                <Input
                  type="number" step="0.01"
                  value={devis.tauxUsdDzd ?? ''}
                  onChange={(e) => update('tauxUsdDzd', e.target.value)}
                  className="h-8 font-mono text-xs"
                />
                <p className="text-[9px] text-muted-foreground">DZD</p>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">1 EUR =</Label>
                <Input
                  type="number" step="0.01"
                  value={devis.tauxEurDzd ?? ''}
                  onChange={(e) => update('tauxEurDzd', e.target.value)}
                  className="h-8 font-mono text-xs"
                />
                <p className="text-[9px] text-muted-foreground">DZD</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Statut</Label>
            <Select value={devis.statut} onValueChange={(v) => update('statut', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="brouillon">Brouillon</SelectItem>
                <SelectItem value="envoye">Envoyé</SelectItem>
                <SelectItem value="accepte">Accepté</SelectItem>
                <SelectItem value="refuse">Refusé</SelectItem>
                <SelectItem value="archive">Archivé</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Récapitulatif financier en direct */}
      {resultatCalcul && (
        <div className="mt-6 p-5 bg-brand-bleu-nuit text-white rounded-lg">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <span className="w-1 h-4 bg-brand-or" /> Récapitulatif calculé (temps réel)
          </h3>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="border border-white/10 rounded-md p-3">
              <p className="text-[10px] uppercase tracking-wide text-white/60">Coût net total</p>
              <p className="text-xl font-bold mt-1">{fmt(resultatCalcul.coutNetDzd)} DZD</p>
            </div>
            <div className="border border-brand-or/30 rounded-md p-3 bg-brand-or/10">
              <p className="text-[10px] uppercase tracking-wide text-brand-or">Marge agence</p>
              <p className="text-xl font-bold mt-1 text-brand-or">
                {fmt(resultatCalcul.margeMontantDzd)} DZD
              </p>
              <p className="text-[10px] text-white/60 mt-0.5">
                {devis.margeType === 'pourcentage' ? `${devis.margeValeur}%` : 'montant fixe'}
                {Number(D(resultatCalcul.coutNetDzd)) > 0 && (
                  <> • {(Number(D(resultatCalcul.margeMontantDzd)) / Number(D(resultatCalcul.prixVenteDzd)) * 100).toFixed(1)}% du CA</>
                )}
              </p>
            </div>
            <div className="border border-brand-rouge/30 rounded-md p-3 bg-brand-rouge/10">
              <p className="text-[10px] uppercase tracking-wide text-brand-rouge">Prix de vente total</p>
              <p className="text-2xl font-bold mt-1">{fmt(resultatCalcul.prixVenteDzd)} DZD</p>
            </div>
          </div>
          <p className="text-[10px] text-white/50 mt-3 italic">
            💡 Pour voir le détail ligne par ligne, sauvegardez puis ouvrez le PDF interne.
          </p>
        </div>
      )}

      {/* Notes */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Notes client (affichées sur le PDF)</Label>
          <Textarea value={devis.notesClient} onChange={(e) => update('notesClient', e.target.value)} rows={3} />
        </div>
        <div className="space-y-2">
          <Label>Notes internes (jamais sur le PDF client)</Label>
          <Textarea value={devis.notesInternes} onChange={(e) => update('notesInternes', e.target.value)} rows={3} />
        </div>
      </div>
    </div>
  )
}
