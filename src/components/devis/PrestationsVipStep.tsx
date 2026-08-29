'use client'

import { Plus, Trash2, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { TYPES_PRESTATION_VIP } from '@/lib/business'
import { useDevisStore } from '@/store/useDevisStore'

export function PrestationsVipStep() {
  const { devis, updateDevis } = useDevisStore()

  if (!devis) return null

  const add = () => {
    updateDevis((d) => {
      d.prestationsVip.push({
        type: 'ziyarate',
        descriptionFr: '',
        descriptionAr: '',
        prix: '0',
        devise: 'SAR',
      })
    })
  }

  const update = (idx: number, field: string, value: any) => {
    updateDevis((d) => {
      d.prestationsVip[idx][field] = value
    })
  }
  
  const remove = (idx: number) => {
    updateDevis((d) => {
      d.prestationsVip.splice(idx, 1)
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Star className="w-4 h-4" /> Prestations exclusives VIP ({devis.prestationsVip.length})
          </h3>
          <p className="text-xs text-muted-foreground mt-1">Ziyarates privées, lounge, fast-track, bagagerie, eau Zamzam, etc.</p>
        </div>
        <Button size="sm" onClick={add} className="gap-1">
          <Plus className="w-3.5 h-3.5" /> Ajouter
        </Button>
      </div>

      {devis.prestationsVip.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
          <Star className="w-10 h-10 mx-auto text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">Aucune prestation VIP.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {devis.prestationsVip.map((p: any, i: number) => (
            <div key={i} className="border border-border rounded-lg p-4 bg-muted/20">
              <div className="grid sm:grid-cols-12 gap-3 items-end">
                <div className="sm:col-span-2 space-y-1.5">
                  <Label className="text-xs">Type</Label>
                  <Select value={p.type} onValueChange={(v) => update(i, 'type', v)}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(TYPES_PRESTATION_VIP).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-5 space-y-1.5">
                  <Label className="text-xs">Description (FR)</Label>
                  <Textarea value={p.descriptionFr} onChange={(e) => update(i, 'descriptionFr', e.target.value)} className="min-h-[38px] text-sm" placeholder="Ziyarate privée avec Moutawif dédié" />
                </div>
                <div className="sm:col-span-3 space-y-1.5">
                  <Label className="text-xs">Description (AR) — optionnel</Label>
                  <Input value={p.descriptionAr ?? ''} onChange={(e) => update(i, 'descriptionAr', e.target.value)} className="h-9" dir="rtl" />
                </div>
                <div className="sm:col-span-1 space-y-1.5">
                  <Label className="text-xs">Prix</Label>
                  <Input type="number" step="0.01" value={p.prix} onChange={(e) => update(i, 'prix', e.target.value)} className="h-9" />
                </div>
                <div className="sm:col-span-1 space-y-1.5">
                  <Label className="text-xs">Devise</Label>
                  <Select value={p.devise} onValueChange={(v) => update(i, 'devise', v)}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SAR">SAR</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="DZD">DZD</SelectItem>
                    </SelectContent>
                  </Select>
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
    </div>
  )
}
