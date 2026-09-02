'use client'

import { useEffect, useState } from 'react'
import { Save, Building2, DollarSign } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { api } from '@/lib/client-utils'
import { toast } from 'sonner'
import { getErrorMessage } from '@/lib/errors'

export function ParametresView() {
  const [parametres, setParametres] = useState<any>({
    nomFr: 'El Mouhssinoune Tours',
    nomAr: 'المحسنون للسياحة',
    sloganFr: '', sloganAr: '',
    adresse: '', telephone: '', email: '',
    rc: '', if: '', art: '', capital: '',
  })
  const [taux, setTaux] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    api('/api/parametres').then((r) => {
      if (r.parametres) setParametres(r.parametres)
      if (r.taux) setTaux(r.taux)
      setLoading(false)
    })
  }
  useEffect(() => { load() }, [])

  const save = async () => {
    setSaving(true)
    try {
      await api('/api/parametres', {
        method: 'PUT',
        body: JSON.stringify({ parametres, taux }),
      })
      toast.success('Paramètres enregistrés')
    } catch (e: unknown) { toast.error(getErrorMessage(e)) }
    finally { setSaving(false) }
  }

  const updateTaux = (id: string, field: string, value: string) => {
    setTaux((arr) => arr.map((t) => t.id === id ? { ...t, [field]: value } : t))
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-10 h-10 border-2 border-brand-or border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Tabs defaultValue="agence">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="agence" className="gap-2"><Building2 className="w-4 h-4" /> Agence</TabsTrigger>
          <TabsTrigger value="devises" className="gap-2"><DollarSign className="w-4 h-4" /> Taux de change</TabsTrigger>
        </TabsList>

        <TabsContent value="agence" className="mt-4">
          <Card className="p-6 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nom (FR)</Label>
                <Input value={parametres.nomFr} onChange={(e) => setParametres({ ...parametres, nomFr: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Nom (AR)</Label>
                <Input value={parametres.nomAr} onChange={(e) => setParametres({ ...parametres, nomAr: e.target.value })} dir="rtl" />
              </div>
              <div className="space-y-2">
                <Label>Slogan (FR)</Label>
                <Input value={parametres.sloganFr ?? ''} onChange={(e) => setParametres({ ...parametres, sloganFr: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Slogan (AR)</Label>
                <Input value={parametres.sloganAr ?? ''} onChange={(e) => setParametres({ ...parametres, sloganAr: e.target.value })} dir="rtl" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Adresse</Label>
              <Input value={parametres.adresse ?? ''} onChange={(e) => setParametres({ ...parametres, adresse: e.target.value })} />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Téléphone</Label>
                <Input value={parametres.telephone ?? ''} onChange={(e) => setParametres({ ...parametres, telephone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={parametres.email ?? ''} onChange={(e) => setParametres({ ...parametres, email: e.target.value })} />
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <h4 className="text-sm font-semibold mb-3 text-brand-bleu-nuit">Informations légales</h4>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Registre de commerce (RC)</Label>
                  <Input value={parametres.rc ?? ''} onChange={(e) => setParametres({ ...parametres, rc: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Identifiant fiscal (IF)</Label>
                  <Input value={parametres.if ?? ''} onChange={(e) => setParametres({ ...parametres, if: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Article (ART)</Label>
                  <Input value={parametres.art ?? ''} onChange={(e) => setParametres({ ...parametres, art: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Capital social</Label>
                  <Input value={parametres.capital ?? ''} onChange={(e) => setParametres({ ...parametres, capital: e.target.value })} />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={save} disabled={saving} className="gap-2 bg-brand-rouge hover:bg-brand-rouge/90">
                <Save className="w-4 h-4" /> {saving ? 'Sauvegarde…' : 'Enregistrer'}
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="devises" className="mt-4">
          <Card className="p-6 space-y-4">
            <div className="p-3 bg-brand-or/5 border border-brand-or/20 rounded-md text-xs text-muted-foreground">
              💡 <strong className="text-brand-bleu-nuit">Règle de verrouillage</strong> : Ces taux sont
              copiés dans chaque devis au moment de sa création. Modifier un taux ici n'affectera pas les
              devis existants — seulement les nouveaux.
            </div>

            <div className="space-y-3">
              {taux.map((t) => (
                <div key={t.id} className="border border-border rounded-lg p-4 grid sm:grid-cols-12 gap-3 items-end">
                  <div className="sm:col-span-2">
                    <Label className="text-xs">Code</Label>
                    <div className="font-mono font-bold text-lg text-brand-bleu-nuit">{t.code}</div>
                  </div>
                  <div className="sm:col-span-4 space-y-1.5">
                    <Label className="text-xs">Libellé (FR)</Label>
                    <Input value={t.libelleFr} onChange={(e) => updateTaux(t.id, 'libelleFr', e.target.value)} className="h-9" />
                  </div>
                  <div className="sm:col-span-3 space-y-1.5">
                    <Label className="text-xs">Libellé (AR)</Label>
                    <Input value={t.libelleAr} onChange={(e) => updateTaux(t.id, 'libelleAr', e.target.value)} className="h-9" dir="rtl" />
                  </div>
                  <div className="sm:col-span-3 space-y-1.5">
                    <Label className="text-xs">Taux pour 1 unité = ? DZD</Label>
                    <Input
                      type="number" step="0.01"
                      value={t.tauxDzd}
                      onChange={(e) => updateTaux(t.id, 'tauxDzd', e.target.value)}
                      className="h-9 font-mono"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={save} disabled={saving} className="gap-2 bg-brand-rouge hover:bg-brand-rouge/90">
                <Save className="w-4 h-4" /> {saving ? 'Sauvegarde…' : 'Enregistrer les taux'}
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
