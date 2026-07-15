'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, Plane } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { api } from '@/lib/client-utils'

interface Props {
  devis: any
  setDevis: (updater: (d: any) => any) => void
}

export function VolsStep({ devis, setDevis }: Props) {
  const [compagnies, setCompagnies] = useState<any[]>([])

  useEffect(() => {
    api('/api/catalogues/compagnies').then(setCompagnies)
  }, [])

  const add = () => {
    setDevis((d) => ({
      ...d,
      segmentsVol: [...d.segmentsVol, {
        origine: '', destination: '',
        dateVol: '',
        classe: 'economique',
        compagnieId: '',
        prixAdulte: '0', prixEnfant: '0', prixBebe: '0',
        devise: 'USD',
      }],
    }))
  }
  const update = (idx: number, field: string, value: any) => {
    setDevis((d) => ({
      ...d,
      segmentsVol: d.segmentsVol.map((s: any, i: number) => i === idx ? { ...s, [field]: value } : s),
    }))
  }
  const remove = (idx: number) => {
    setDevis((d) => ({ ...d, segmentsVol: d.segmentsVol.filter((_: any, i: number) => i !== idx) }))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Plane className="w-4 h-4" /> Segments de vol ({devis.segmentsVol.length})
          </h3>
          <p className="text-xs text-muted-foreground mt-1">Plan de vol multi-segments avec prix par tranche d'âge</p>
        </div>
        <Button size="sm" onClick={add} className="gap-1">
          <Plus className="w-3.5 h-3.5" /> Ajouter un vol
        </Button>
      </div>

      {devis.segmentsVol.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
          <Plane className="w-10 h-10 mx-auto text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">Aucun vol. Ajoutez les segments aller/retour.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {devis.segmentsVol.map((s: any, i: number) => (
            <div key={i} className="border border-border rounded-lg p-4 bg-muted/20">
              <div className="grid sm:grid-cols-12 gap-3 items-end">
                <div className="sm:col-span-3 space-y-1.5">
                  <Label className="text-xs">Origine</Label>
                  <Input value={s.origine} onChange={(e) => update(i, 'origine', e.target.value)} className="h-9" placeholder="Alger (ALG)" />
                </div>
                <div className="sm:col-span-3 space-y-1.5">
                  <Label className="text-xs">Destination</Label>
                  <Input value={s.destination} onChange={(e) => update(i, 'destination', e.target.value)} className="h-9" placeholder="Médine (MED)" />
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <Label className="text-xs">Date / heure</Label>
                  <Input type="datetime-local" value={s.dateVol} onChange={(e) => update(i, 'dateVol', e.target.value)} className="h-9" />
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <Label className="text-xs">Compagnie</Label>
                  <Select value={s.compagnieId ?? ''} onValueChange={(v) => update(i, 'compagnieId', v)}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>
                      {compagnies.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <Label className="text-xs">Classe</Label>
                  <Select value={s.classe} onValueChange={(v) => update(i, 'classe', v)}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="economique">Économique</SelectItem>
                      <SelectItem value="affaires">Affaires</SelectItem>
                      <SelectItem value="premiere">Première</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <Label className="text-xs">Prix adulte</Label>
                  <Input type="number" step="0.01" value={s.prixAdulte} onChange={(e) => update(i, 'prixAdulte', e.target.value)} className="h-9" />
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <Label className="text-xs">Prix enfant</Label>
                  <Input type="number" step="0.01" value={s.prixEnfant} onChange={(e) => update(i, 'prixEnfant', e.target.value)} className="h-9" />
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <Label className="text-xs">Prix bébé</Label>
                  <Input type="number" step="0.01" value={s.prixBebe} onChange={(e) => update(i, 'prixBebe', e.target.value)} className="h-9" />
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <Label className="text-xs">Devise</Label>
                  <Select value={s.devise} onValueChange={(v) => update(i, 'devise', v)}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SAR">SAR</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="DZD">DZD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-1 flex justify-end">
                  <Button size="icon" variant="ghost" className="h-9 w-9 text-red-600 hover:bg-red-50" onClick={() => remove(i)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Train Haramain */}
      <div className="mt-8 pt-6 border-t border-border">
        <h3 className="font-semibold text-sm mb-3">🚄 Train Haramain (optionnel)</h3>
        <div className="space-y-3">
          {devis.trainsHaramain.map((t: any, i: number) => (
            <div key={i} className="border border-border rounded-lg p-3 bg-muted/20 grid sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-3 space-y-1.5">
                <Label className="text-xs">Trajet</Label>
                <Input value={t.trajet} onChange={(e) => setDevis((d) => ({ ...d, trainsHaramain: d.trainsHaramain.map((x: any, j: number) => j === i ? { ...x, trajet: e.target.value } : x) }))} className="h-9" placeholder="Médine → Makkah" />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <Label className="text-xs">Classe</Label>
                <Select value={t.classe} onValueChange={(v) => setDevis((d) => ({ ...d, trainsHaramain: d.trainsHaramain.map((x: any, j: number) => j === i ? { ...x, classe: v } : x) }))}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="economique">Économique</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <Label className="text-xs">Date</Label>
                <Input type="datetime-local" value={t.dateTrain} onChange={(e) => setDevis((d) => ({ ...d, trainsHaramain: d.trainsHaramain.map((x: any, j: number) => j === i ? { ...x, dateTrain: e.target.value } : x) }))} className="h-9" />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <Label className="text-xs">Prix adulte (SAR)</Label>
                <Input type="number" step="0.01" value={t.prixAdulte} onChange={(e) => setDevis((d) => ({ ...d, trainsHaramain: d.trainsHaramain.map((x: any, j: number) => j === i ? { ...x, prixAdulte: e.target.value } : x) }))} className="h-9" />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <Label className="text-xs">Prix enfant (SAR)</Label>
                <Input type="number" step="0.01" value={t.prixEnfant} onChange={(e) => setDevis((d) => ({ ...d, trainsHaramain: d.trainsHaramain.map((x: any, j: number) => j === i ? { ...x, prixEnfant: e.target.value } : x) }))} className="h-9" />
              </div>
              <div className="sm:col-span-1 flex justify-end">
                <Button size="icon" variant="ghost" className="h-9 w-9 text-red-600 hover:bg-red-50" onClick={() => setDevis((d) => ({ ...d, trainsHaramain: d.trainsHaramain.filter((_: any, j: number) => j !== i) }))}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
          <Button size="sm" variant="outline" onClick={() => setDevis((d) => ({ ...d, trainsHaramain: [...d.trainsHaramain, { trajet: '', classe: 'business', dateTrain: '', prixAdulte: '0', prixEnfant: '0', devise: 'SAR' }] }))} className="gap-1">
            <Plus className="w-3.5 h-3.5" /> Ajouter un trajet train
          </Button>
        </div>
      </div>
    </div>
  )
}
