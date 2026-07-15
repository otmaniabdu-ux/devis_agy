'use client'

import { Plus, Trash2, AlertTriangle, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CATEGORIES_PASSAGER, verifierAlertePasseport } from '@/lib/business'

interface Props {
  devis: any
  setDevis: (updater: (d: any) => any) => void
  clients: any[]
}

export function PassagersStep({ devis, setDevis, clients }: Props) {
  const update = (field: string, value: any) => {
    setDevis((d) => ({ ...d, [field]: value }))
  }

  const addPassager = () => {
    setDevis((d) => ({
      ...d,
      passagers: [...d.passagers, {
        categorie: 'adulte',
        nom: '', prenom: '',
        dateNaissance: '',
        passeportNumero: '',
        passeportExpiration: '',
      }],
    }))
  }

  const updatePassager = (idx: number, field: string, value: any) => {
    setDevis((d) => ({
      ...d,
      passagers: d.passagers.map((p: any, i: number) => i === idx ? { ...p, [field]: value } : p),
    }))
  }

  const removePassager = (idx: number) => {
    setDevis((d) => ({ ...d, passagers: d.passagers.filter((_: any, i: number) => i !== idx) }))
  }

  const counts = devis.passagers.reduce((acc: any, p: any) => {
    acc[p.categorie] = (acc[p.categorie] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-6">
      {/* Infos voyage */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Client</Label>
          <Select value={devis.clientId} onValueChange={(v) => update('clientId', v)}>
            <SelectTrigger><SelectValue placeholder="Sélectionner un client" /></SelectTrigger>
            <SelectContent>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.type === 'societe' ? c.raisonSociale : `${c.prenom ?? ''} ${c.nom}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Date départ</Label>
            <Input type="date" value={devis.dateDepart} onChange={(e) => update('dateDepart', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Date retour</Label>
            <Input type="date" value={devis.dateRetour} onChange={(e) => update('dateRetour', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Répartition passagers */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(CATEGORIES_PASSAGER).map(([k, v]) => (
          <div key={k} className="px-3 py-1.5 bg-muted/60 rounded-full text-xs">
            <span className="text-muted-foreground">{v.label}: </span>
            <span className="font-bold">{counts[k] ?? 0}</span>
          </div>
        ))}
      </div>

      {/* Liste passagers */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Users className="w-4 h-4" /> Liste des passagers ({devis.passagers.length})
          </h3>
          <Button size="sm" onClick={addPassager} className="gap-1">
            <Plus className="w-3.5 h-3.5" /> Ajouter
          </Button>
        </div>

        {devis.passagers.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
            <Users className="w-10 h-10 mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">Aucun passager. Cliquez sur « Ajouter ».</p>
          </div>
        ) : (
          <div className="space-y-3">
            {devis.passagers.map((p: any, i: number) => {
              const alerte = p.passeportExpiration && verifierAlertePasseport(p.passeportExpiration, devis.dateRetour).alerte
              return (
                <div key={i} className="border border-border rounded-lg p-4 bg-muted/20">
                  <div className="grid sm:grid-cols-12 gap-3 items-end">
                    <div className="sm:col-span-2 space-y-1.5">
                      <Label className="text-xs">Catégorie</Label>
                      <Select value={p.categorie} onValueChange={(v) => updatePassager(i, 'categorie', v)}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(CATEGORIES_PASSAGER).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="sm:col-span-3 space-y-1.5">
                      <Label className="text-xs">Prénom</Label>
                      <Input value={p.prenom} onChange={(e) => updatePassager(i, 'prenom', e.target.value)} className="h-9" />
                    </div>
                    <div className="sm:col-span-3 space-y-1.5">
                      <Label className="text-xs">Nom</Label>
                      <Input value={p.nom} onChange={(e) => updatePassager(i, 'nom', e.target.value)} className="h-9" />
                    </div>
                    <div className="sm:col-span-2 space-y-1.5">
                      <Label className="text-xs">Naissance</Label>
                      <Input type="date" value={p.dateNaissance} onChange={(e) => updatePassager(i, 'dateNaissance', e.target.value)} className="h-9" />
                    </div>
                    <div className="sm:col-span-2 space-y-1.5">
                      <Label className="text-xs">N° passeport</Label>
                      <Input value={p.passeportNumero} onChange={(e) => updatePassager(i, 'passeportNumero', e.target.value)} className="h-9" />
                    </div>
                    <div className="sm:col-span-2 space-y-1.5">
                      <Label className="text-xs flex items-center gap-1">
                        Exp. passeport
                        {alerte && <AlertTriangle className="w-3 h-3 text-red-600" />}
                      </Label>
                      <Input
                        type="date"
                        value={p.passeportExpiration}
                        onChange={(e) => updatePassager(i, 'passeportExpiration', e.target.value)}
                        className={`h-9 ${alerte ? 'border-red-500 bg-red-50' : ''}`}
                      />
                    </div>
                    <div className="sm:col-span-1 flex justify-end">
                      <Button
                        size="icon" variant="ghost" className="h-9 w-9 text-red-600 hover:bg-red-50"
                        onClick={() => removePassager(i)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  {alerte && (
                    <p className="text-[11px] text-red-600 mt-2 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Passeport expire moins de 6 mois après le retour — alerte à signaler au client.
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
