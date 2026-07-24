'use client'

import { Plus, Trash2, AlertTriangle, Users, Minus } from 'lucide-react'
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

  // Compte les passagers par catégorie
  const counts: Record<string, number> = { adulte: 0, enfant_avec_lit: 0, enfant_sans_lit: 0, bebe: 0 }
  for (const p of devis.passagers) {
    counts[p.categorie] = (counts[p.categorie] ?? 0) + 1
  }

  // Ajoute un passager d'une catégorie donnée (sans info détaillée)
  const addByCategory = (categorie: string) => {
    setDevis((d) => ({
      ...d,
      passagers: [...d.passagers, {
        categorie,
        nom: '',
        prenom: '',
        dateNaissance: '',
        passeportNumero: '',
        passeportExpiration: '',
      }],
    }))
  }

  // Retire le dernier passager d'une catégorie
  const removeByCategory = (categorie: string) => {
    setDevis((d) => {
      const idx = [...d.passagers].reverse().findIndex((p) => p.categorie === categorie)
      if (idx === -1) return d
      const realIdx = d.passagers.length - 1 - idx
      return { ...d, passagers: d.passagers.filter((_: any, i: number) => i !== realIdx) }
    })
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

      {/* Steppers par catégorie */}
      <div>
        <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
          <Users className="w-4 h-4" /> Nombre de passagers par catégorie
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Object.entries(CATEGORIES_PASSAGER).map(([key, cat]) => (
            <div
              key={key}
              className="border border-border rounded-lg p-4 bg-muted/20 hover:border-brand-or transition-colors"
            >
              <div className="text-center mb-3">
                <p className="font-semibold text-sm">{cat.label}</p>
                <p className="text-[10px] text-muted-foreground" dir="rtl">{cat.labelAr}</p>
              </div>
              <div className="flex items-center justify-center gap-3">
                <Button
                  size="icon"
                  variant="outline"
                  className="h-9 w-9 rounded-full"
                  onClick={() => removeByCategory(key)}
                  disabled={counts[key] === 0}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="text-2xl font-bold tabular-nums min-w-[2ch] text-center" style={{ fontFamily: 'Georgia, serif' }}>
                  {counts[key] ?? 0}
                </span>
                <Button
                  size="icon"
                  className="h-9 w-9 rounded-full bg-brand-rouge hover:bg-brand-rouge/90"
                  onClick={() => addByCategory(key)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Liste détaillée (infos optionnelles) */}
      {devis.passagers.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Users className="w-4 h-4" /> Détail des passagers ({devis.passagers.length})
            </h3>
            <p className="text-xs text-muted-foreground italic">
              Les champs ci-dessous sont optionnels — complétés uniquement si disponibles
            </p>
          </div>

          <div className="space-y-3">
            {devis.passagers.map((p: any, i: number) => {
              const alerte = p.passeportExpiration && verifierAlertePasseport(p.passeportExpiration, devis.dateRetour).alerte
              const catLabel = CATEGORIES_PASSAGER[p.categorie as keyof typeof CATEGORIES_PASSAGER]?.label ?? p.categorie
              return (
                <div key={i} className="border border-border rounded-lg p-4 bg-muted/20">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-bleu-nuit text-white font-medium">
                      {i + 1}
                    </span>
                    <span className="text-xs font-semibold text-muted-foreground">{catLabel}</span>
                  </div>
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
                      <Label className="text-xs">Prénom (optionnel)</Label>
                      <Input value={p.prenom ?? ''} onChange={(e) => updatePassager(i, 'prenom', e.target.value)} className="h-9" placeholder="—" />
                    </div>
                    <div className="sm:col-span-3 space-y-1.5">
                      <Label className="text-xs">Nom (optionnel)</Label>
                      <Input value={p.nom ?? ''} onChange={(e) => updatePassager(i, 'nom', e.target.value)} className="h-9" placeholder="—" />
                    </div>
                    <div className="sm:col-span-2 space-y-1.5">
                      <Label className="text-xs">Naissance (optionnel)</Label>
                      <Input type="date" value={p.dateNaissance ?? ''} onChange={(e) => updatePassager(i, 'dateNaissance', e.target.value)} className="h-9" />
                    </div>
                    <div className="sm:col-span-2 space-y-1.5">
                      <Label className="text-xs">N° passeport (optionnel)</Label>
                      <Input value={p.passeportNumero ?? ''} onChange={(e) => updatePassager(i, 'passeportNumero', e.target.value)} className="h-9" placeholder="—" />
                    </div>
                    <div className="sm:col-span-2 space-y-1.5">
                      <Label className="text-xs flex items-center gap-1">
                        Exp. passeport
                        {alerte && <AlertTriangle className="w-3 h-3 text-red-600" />}
                      </Label>
                      <Input
                        type="date"
                        value={p.passeportExpiration ?? ''}
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
                      Passeport expire moins de 6 mois après le retour.
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {devis.passagers.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
          <Users className="w-10 h-10 mx-auto text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">
            Utilisez les boutons + ci-dessus pour ajouter des passagers.
          </p>
        </div>
      )}
    </div>
  )
}
