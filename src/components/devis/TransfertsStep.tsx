'use client'

import { Plus, Trash2, Car } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { TYPES_VEHICULE } from '@/lib/business'

interface Props {
  devis: any
  setDevis: (updater: (d: any) => any) => void
}

export function TransfertsStep({ devis, setDevis }: Props) {
  const add = () => {
    setDevis((d) => ({
      ...d,
      transferts: [...d.transferts, {
        trajet: '',
        typeVehicule: 'GMC_Yukon',
        prix: '0',
        devise: 'SAR',
        obligatoire: true,
      }],
    }))
  }
  const update = (idx: number, field: string, value: any) => {
    setDevis((d) => ({
      ...d,
      transferts: d.transferts.map((t: any, i: number) => i === idx ? { ...t, [field]: value } : t),
    }))
  }
  const remove = (idx: number) => {
    setDevis((d) => ({ ...d, transferts: d.transferts.filter((_: any, i: number) => i !== idx) }))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Car className="w-4 h-4" /> Transferts terrestres VIP ({devis.transferts.length})
          </h3>
          <p className="text-xs text-muted-foreground mt-1">4 transferts obligatoires + jusqu'à 2 optionnels</p>
        </div>
        <Button size="sm" onClick={add} className="gap-1">
          <Plus className="w-3.5 h-3.5" /> Ajouter
        </Button>
      </div>

      {devis.transferts.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
          <Car className="w-10 h-10 mx-auto text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">Aucun transfert.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {devis.transferts.map((t: any, i: number) => (
            <div key={i} className="border border-border rounded-lg p-4 bg-muted/20">
              <div className="grid sm:grid-cols-12 gap-3 items-end">
                <div className="sm:col-span-4 space-y-1.5">
                  <Label className="text-xs">Trajet</Label>
                  <Input value={t.trajet} onChange={(e) => update(i, 'trajet', e.target.value)} className="h-9" placeholder="Aéroport Djeddah → Hôtel Makkah" />
                </div>
                <div className="sm:col-span-3 space-y-1.5">
                  <Label className="text-xs">Type véhicule</Label>
                  <Select value={t.typeVehicule} onValueChange={(v) => update(i, 'typeVehicule', v)}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(TYPES_VEHICULE).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <Label className="text-xs">Prix</Label>
                  <Input type="number" step="0.01" value={t.prix} onChange={(e) => update(i, 'prix', e.target.value)} className="h-9" />
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <Label className="text-xs">Devise</Label>
                  <Select value={t.devise} onValueChange={(v) => update(i, 'devise', v)}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SAR">SAR</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="DZD">DZD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-1 space-y-1.5 flex flex-col items-center justify-end pb-1">
                  <Label className="text-xs">Oblig.</Label>
                  <Switch checked={t.obligatoire} onCheckedChange={(v) => update(i, 'obligatoire', v)} />
                </div>
                <div className="sm:col-span-12 flex justify-end -mt-2">
                  <Button size="icon" variant="ghost" className="h-9 w-9 text-red-600 hover:bg-red-50" onClick={() => remove(i)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 p-3 bg-brand-or/5 border border-brand-or/20 rounded-md text-xs text-muted-foreground">
        💡 <strong className="text-brand-bleu-nuit">Rappel métier</strong> : Les 4 transferts standards sont
        Aéroport→Hôtel (arrivée), Hôtel→Gare/Haram (transit), Gare/Haram→Hôtel (transit), Hôtel→Aéroport (retour).
        Tout autre trajet peut être ajouté comme optionnel.
      </div>
    </div>
  )
}
