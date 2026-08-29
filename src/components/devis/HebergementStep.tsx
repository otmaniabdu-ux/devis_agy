'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, Hotel } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TYPES_CHAMBRE, FORMULES_REPAS, VUES_HOTEL } from '@/lib/business'
import { api } from '@/lib/client-utils'
import { useDevisStore } from '@/store/useDevisStore'

export function HebergementStep() {
  const { devis, updateDevis } = useDevisStore()
  const [hotels, setHotels] = useState<any[]>([])

  useEffect(() => {
    api('/api/catalogues/hotels').then(setHotels)
  }, [])

  if (!devis) return null

  const add = () => {
    updateDevis((d) => {
      d.hebergements.push({
        ville: 'Makkah',
        hotelId: '',
        hotelNom: '',
        typeChambre: 'double',
        formuleRepas: 'demi_pension',
        vue: 'city',
        dateCheckin: d.dateDepart,
        dateCheckout: d.dateRetour,
        nbChambres: 1,
        prixNuitChambre: '0',
        devise: 'SAR',
      })
    })
  }

  const update = (idx: number, field: string, value: any) => {
    updateDevis((d) => {
      d.hebergements[idx][field] = value
    })
  }
  
  const remove = (idx: number) => {
    updateDevis((d) => {
      d.hebergements.splice(idx, 1)
    })
  }

  const selectHotel = (idx: number, hotelId: string) => {
    const hotel = hotels.find((h) => h.id === hotelId)
    if (!hotel) return
    updateDevis((d) => {
      const h = d.hebergements[idx]
      // pre-remplir le prix selon le type de chambre
      const prixMap: Record<string, string> = {
        single: hotel.prixSingleSar,
        double: hotel.prixDoubleSar,
        triple: hotel.prixTripleSar,
        quadruple: hotel.prixQuadrupleSar,
      }
      h.hotelId = hotel.id
      h.hotelNom = hotel.nom
      h.ville = hotel.ville
      h.prixNuitChambre = prixMap[h.typeChambre] ?? hotel.prixDoubleSar
      h.devise = hotel.devise
    })
  }

  // quand on change le type de chambre, on re-remplit le prix depuis le catalogue
  const onTypeChambreChange = (idx: number, type: string) => {
    const heb = devis.hebergements[idx]
    const hotel = hotels.find((h) => h.id === heb.hotelId)
    const prixMap: Record<string, string> = hotel ? {
      single: hotel.prixSingleSar,
      double: hotel.prixDoubleSar,
      triple: hotel.prixTripleSar,
      quadruple: hotel.prixQuadrupleSar,
    } : {}
    updateDevis((d) => {
      d.hebergements[idx].typeChambre = type
      d.hebergements[idx].prixNuitChambre = prixMap[type] ?? d.hebergements[idx].prixNuitChambre
    })
  }

  const calcNuitees = (h: any) => {
    if (!h.dateCheckin || !h.dateCheckout) return 0
    const ci = new Date(h.dateCheckin)
    const co = new Date(h.dateCheckout)
    return Math.max(0, Math.round((co.getTime() - ci.getTime()) / 86400000))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Hotel className="w-4 h-4" /> Hébergements ({devis.hebergements.length})
          </h3>
          <p className="text-xs text-muted-foreground mt-1">Sélectionnez un hôtel du catalogue ou saisissez manuellement</p>
        </div>
        <Button size="sm" onClick={add} className="gap-1">
          <Plus className="w-3.5 h-3.5" /> Ajouter
        </Button>
      </div>

      {devis.hebergements.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
          <Hotel className="w-10 h-10 mx-auto text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">Aucun hébergement.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {devis.hebergements.map((h: any, i: number) => {
            const nbNuits = calcNuitees(h)
            const total = (parseFloat(h.prixNuitChambre || '0') * nbNuits * h.nbChambres).toFixed(2)
            return (
              <div key={i} className="border border-border rounded-lg p-4 bg-muted/20">
                <div className="grid sm:grid-cols-12 gap-3 items-end">
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label className="text-xs">Ville</Label>
                    <Select value={h.ville} onValueChange={(v) => update(i, 'ville', v)}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Makkah">Makkah</SelectItem>
                        <SelectItem value="Medine">Médine</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="sm:col-span-4 space-y-1.5">
                    <Label className="text-xs">Hôtel (catalogue)</Label>
                    <Select value={h.hotelId ?? ''} onValueChange={(v) => selectHotel(i, v)}>
                      <SelectTrigger className="h-9"><SelectValue placeholder="Saisie manuelle" /></SelectTrigger>
                      <SelectContent>
                        {hotels.filter((ho) => ho.ville === h.ville).map((ho) => (
                          <SelectItem key={ho.id} value={ho.id}>
                            {ho.nom} {'★'.repeat(ho.etoiles)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="sm:col-span-3 space-y-1.5">
                    <Label className="text-xs">Ou nom manuel</Label>
                    <Input value={h.hotelNom} onChange={(e) => update(i, 'hotelNom', e.target.value)} className="h-9" />
                  </div>
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label className="text-xs">Type chambre</Label>
                    <Select value={h.typeChambre} onValueChange={(v) => onTypeChambreChange(i, v)}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(TYPES_CHAMBRE).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label className="text-xs">Formule</Label>
                    <Select value={h.formuleRepas} onValueChange={(v) => update(i, 'formuleRepas', v)}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(FORMULES_REPAS).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label className="text-xs">Vue</Label>
                    <Select value={h.vue} onValueChange={(v) => update(i, 'vue', v)}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(VUES_HOTEL).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label className="text-xs">Check-in</Label>
                    <Input type="date" value={h.dateCheckin} onChange={(e) => update(i, 'dateCheckin', e.target.value)} className="h-9" />
                  </div>
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label className="text-xs">Check-out</Label>
                    <Input type="date" value={h.dateCheckout} onChange={(e) => update(i, 'dateCheckout', e.target.value)} className="h-9" />
                  </div>
                  <div className="sm:col-span-1 space-y-1.5">
                    <Label className="text-xs">Nuits</Label>
                    <div className="h-9 flex items-center justify-center font-bold bg-brand-or/10 rounded-md text-brand-or">{nbNuits}</div>
                  </div>
                  <div className="sm:col-span-1 space-y-1.5">
                    <Label className="text-xs">Chambres</Label>
                    <Input type="number" min="1" value={h.nbChambres} onChange={(e) => update(i, 'nbChambres', parseInt(e.target.value) || 1)} className="h-9" />
                  </div>
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label className="text-xs">Prix/nuit/chambre</Label>
                    <Input type="number" step="0.01" value={h.prixNuitChambre} onChange={(e) => update(i, 'prixNuitChambre', e.target.value)} className="h-9" />
                  </div>
                  <div className="sm:col-span-1 space-y-1.5">
                    <Label className="text-xs">Devise</Label>
                    <Select value={h.devise} onValueChange={(v) => update(i, 'devise', v)}>
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
                <div className="mt-2 pt-2 border-t border-border/50 text-xs text-muted-foreground flex justify-between">
                  <span>Sous-total: {nbNuits} nuits × {h.nbChambres} ch. × {h.prixNuitChambre} {h.devise}</span>
                  <span className="font-bold text-brand-bleu-nuit">{total} {h.devise}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
