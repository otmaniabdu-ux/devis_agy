'use client'

import { Plus, Trash2, Tent, Bus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Props {
  devis: any
  setDevis: (updater: (d: any) => any) => void
}

export function HadjStep({ devis, setDevis }: Props) {
  const addCamp = () => {
    setDevis((d: any) => ({
      ...d,
      campsMashair: [...(d.campsMashair || []), {
        nomCamp: 'Camp VIP A',
        typeTente: 'VIP Climatisee',
        restauration: 'Buffet ouvert',
        prixAdulte: '0',
        prixEnfant: '0',
        devise: 'SAR',
      }],
    }))
  }

  const updateCamp = (idx: number, field: string, value: any) => {
    setDevis((d: any) => ({
      ...d,
      campsMashair: d.campsMashair.map((c: any, i: number) => i === idx ? { ...c, [field]: value } : c),
    }))
  }

  const removeCamp = (idx: number) => {
    setDevis((d: any) => ({ ...d, campsMashair: d.campsMashair.filter((_: any, i: number) => i !== idx) }))
  }

  const addTransport = () => {
    setDevis((d: any) => ({
      ...d,
      transportsMashair: [...(d.transportsMashair || []), {
        typeVehicule: 'Bus VIP',
        trajet: 'Mina - Arafat - Muzdalifah',
        prix: '0',
        typePrix: 'forfait',
        devise: 'SAR',
      }],
    }))
  }

  const updateTransport = (idx: number, field: string, value: any) => {
    setDevis((d: any) => ({
      ...d,
      transportsMashair: d.transportsMashair.map((t: any, i: number) => i === idx ? { ...t, [field]: value } : t),
    }))
  }

  const removeTransport = (idx: number) => {
    setDevis((d: any) => ({ ...d, transportsMashair: d.transportsMashair.filter((_: any, i: number) => i !== idx) }))
  }

  return (
    <div className="space-y-8">
      {/* Camps Mashair */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Tent className="w-4 h-4" /> Camps Mashair ({devis.campsMashair?.length || 0})
            </h3>
            <p className="text-xs text-muted-foreground mt-1">Hébergement à Mina et Arafat.</p>
          </div>
          <Button size="sm" onClick={addCamp} className="gap-1">
            <Plus className="w-3.5 h-3.5" /> Ajouter un camp
          </Button>
        </div>

        {!devis.campsMashair || devis.campsMashair.length === 0 ? (
          <div className="text-center py-6 border-2 border-dashed border-border rounded-lg">
            <p className="text-sm text-muted-foreground">Aucun camp sélectionné.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {devis.campsMashair.map((c: any, i: number) => (
              <div key={i} className="border border-border rounded-lg p-4 bg-muted/20">
                <div className="grid sm:grid-cols-12 gap-3 items-end">
                  <div className="sm:col-span-3 space-y-1.5">
                    <Label className="text-xs">Nom du Camp</Label>
                    <Input value={c.nomCamp} onChange={(e) => updateCamp(i, 'nomCamp', e.target.value)} className="h-9" placeholder="Ex: Camp A" />
                  </div>
                  <div className="sm:col-span-3 space-y-1.5">
                    <Label className="text-xs">Type de Tente</Label>
                    <Input value={c.typeTente} onChange={(e) => updateCamp(i, 'typeTente', e.target.value)} className="h-9" placeholder="VIP Climatisee" />
                  </div>
                  <div className="sm:col-span-3 space-y-1.5">
                    <Label className="text-xs">Restauration</Label>
                    <Input value={c.restauration} onChange={(e) => updateCamp(i, 'restauration', e.target.value)} className="h-9" placeholder="Buffet ouvert" />
                  </div>
                  <div className="sm:col-span-1 space-y-1.5">
                    <Label className="text-xs">Prix/Adulte</Label>
                    <Input type="number" step="0.01" value={c.prixAdulte} onChange={(e) => updateCamp(i, 'prixAdulte', e.target.value)} className="h-9" />
                  </div>
                  <div className="sm:col-span-1 space-y-1.5">
                    <Label className="text-xs">Prix/Enfant</Label>
                    <Input type="number" step="0.01" value={c.prixEnfant} onChange={(e) => updateCamp(i, 'prixEnfant', e.target.value)} className="h-9" />
                  </div>
                  <div className="sm:col-span-1 space-y-1.5">
                    <Label className="text-xs">Devise</Label>
                    <Select value={c.devise} onValueChange={(v) => updateCamp(i, 'devise', v)}>
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
                    <Button size="icon" variant="ghost" className="h-9 w-9 text-red-600 hover:bg-red-50" onClick={() => removeCamp(i)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transports Mashair */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Bus className="w-4 h-4" /> Transports Mashair ({devis.transportsMashair?.length || 0})
            </h3>
            <p className="text-xs text-muted-foreground mt-1">Déplacements pendant les rites du Hadj.</p>
          </div>
          <Button size="sm" onClick={addTransport} className="gap-1">
            <Plus className="w-3.5 h-3.5" /> Ajouter un transport
          </Button>
        </div>

        {!devis.transportsMashair || devis.transportsMashair.length === 0 ? (
          <div className="text-center py-6 border-2 border-dashed border-border rounded-lg">
            <p className="text-sm text-muted-foreground">Aucun transport sélectionné.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {devis.transportsMashair.map((t: any, i: number) => (
              <div key={i} className="border border-border rounded-lg p-4 bg-muted/20">
                <div className="grid sm:grid-cols-12 gap-3 items-end">
                  <div className="sm:col-span-4 space-y-1.5">
                    <Label className="text-xs">Trajet</Label>
                    <Input value={t.trajet} onChange={(e) => updateTransport(i, 'trajet', e.target.value)} className="h-9" placeholder="Mina - Arafat - Muzdalifah" />
                  </div>
                  <div className="sm:col-span-3 space-y-1.5">
                    <Label className="text-xs">Véhicule</Label>
                    <Input value={t.typeVehicule} onChange={(e) => updateTransport(i, 'typeVehicule', e.target.value)} className="h-9" placeholder="Bus VIP / GMC" />
                  </div>
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label className="text-xs">Type de Prix</Label>
                    <Select value={t.typePrix} onValueChange={(v) => updateTransport(i, 'typePrix', v)}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="forfait">Forfait Global</SelectItem>
                        <SelectItem value="par_passager">Par Passager</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label className="text-xs">Prix</Label>
                    <Input type="number" step="0.01" value={t.prix} onChange={(e) => updateTransport(i, 'prix', e.target.value)} className="h-9" />
                  </div>
                  <div className="sm:col-span-1 space-y-1.5">
                    <Label className="text-xs">Devise</Label>
                    <Select value={t.devise} onValueChange={(v) => updateTransport(i, 'devise', v)}>
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
                    <Button size="icon" variant="ghost" className="h-9 w-9 text-red-600 hover:bg-red-50" onClick={() => removeTransport(i)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
