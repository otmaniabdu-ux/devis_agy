'use client'

import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Hotel, Plane } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { fmt, api } from '@/lib/client-utils'
import type { CompagnieForm, CompagnieItem, HotelCatalogueItem, HotelForm } from '@/types/devis-forms'
import { toast } from 'sonner'
import { getErrorMessage } from '@/lib/errors'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export function CataloguesView() {
  return (
    <div className="max-w-6xl mx-auto">
      <Tabs defaultValue="hotels">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="hotels" className="gap-2"><Hotel className="w-4 h-4" /> Hôtels</TabsTrigger>
          <TabsTrigger value="compagnies" className="gap-2"><Plane className="w-4 h-4" /> Compagnies</TabsTrigger>
        </TabsList>
        <TabsContent value="hotels" className="mt-4"><HotelsTab /></TabsContent>
        <TabsContent value="compagnies" className="mt-4"><CompagniesTab /></TabsContent>
      </Tabs>
    </div>
  )
}

function HotelsTab() {
  const [hotels, setHotels] = useState<HotelCatalogueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [toDelete, setToDelete] = useState<HotelCatalogueItem | null>(null)
  const [form, setForm] = useState<HotelForm>({
    ville: 'Makkah', nom: '', nomAr: '', etoiles: 4, distanceHaram: '',
    prixSingleSar: '0', prixDoubleSar: '0', prixTripleSar: '0', prixQuadrupleSar: '0',
  })

  const load = () => {
    setLoading(true)
    api('/api/catalogues/hotels').then((h) => { setHotels(h); setLoading(false) })
  }
  useEffect(() => { load() }, [])

  const openNew = () => {
    setForm({
      ville: 'Makkah', nom: '', nomAr: '', etoiles: 4, distanceHaram: '',
      prixSingleSar: '0', prixDoubleSar: '0', prixTripleSar: '0', prixQuadrupleSar: '0',
    })
    setEditId(null)
    setDialogOpen(true)
  }

  const openEdit = (h: HotelCatalogueItem) => {
    setForm({
      ville: h.ville, nom: h.nom, nomAr: h.nomAr ?? '', etoiles: h.etoiles,
      distanceHaram: h.distanceHaram != null ? String(h.distanceHaram) : '',
      prixSingleSar: h.prixSingleSar, prixDoubleSar: h.prixDoubleSar,
      prixTripleSar: h.prixTripleSar, prixQuadrupleSar: h.prixQuadrupleSar,
    })
    setEditId(h.id)
    setDialogOpen(true)
  }

  const submit = async () => {
    const payload = {
      ...form,
      etoiles: Number(form.etoiles),
      distanceHaram: form.distanceHaram ? parseInt(form.distanceHaram) : null,
    }
    try {
      if (editId) {
        await api(`/api/catalogues/hotels/${editId}`, { method: 'PUT', body: JSON.stringify(payload) })
        toast.success('Hôtel mis à jour')
      } else {
        await api('/api/catalogues/hotels', { method: 'POST', body: JSON.stringify(payload) })
        toast.success('Hôtel créé')
      }
      setDialogOpen(false)
      load()
    } catch (e: unknown) { toast.error(getErrorMessage(e)) }
  }

  const remove = async () => {
    if (!toDelete) return
    try {
      await api(`/api/catalogues/hotels/${toDelete.id}`, { method: 'DELETE' })
      toast.success('Hôtel supprimé')
      setToDelete(null)
      load()
    } catch (e: unknown) { toast.error(getErrorMessage(e)) }
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">{hotels.length} hôtel(s) au catalogue</p>
        <Button onClick={openNew} className="gap-2 bg-brand-rouge hover:bg-brand-rouge/90">
          <Plus className="w-4 h-4" /> Nouvel hôtel
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-20 bg-muted animate-pulse rounded-md" />)}</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {hotels.map((h) => (
            <div key={h.id} className="border border-border rounded-lg p-4 hover:border-brand-or transition-all">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge className="text-[10px]" variant={h.ville === 'Makkah' ? 'default' : 'secondary'}>
                    {h.ville === 'Makkah' ? 'Makkah' : 'Médine'}
                  </Badge>
                  <span className="text-xs text-brand-or">
                    {'★'.repeat(h.etoiles)}
                  </span>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(h)}>
                    <Pencil className="w-3 h-3" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-red-600 hover:bg-red-50" onClick={() => setToDelete(h)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              <p className="font-semibold">{h.nom}</p>
              {h.nomAr && <p className="text-xs text-muted-foreground" dir="rtl">{h.nomAr}</p>}
              {h.distanceHaram && (
                <p className="text-[11px] text-muted-foreground mt-1">À {h.distanceHaram}m du Haram</p>
              )}
              <div className="mt-3 pt-3 border-t border-border grid grid-cols-2 gap-1 text-[11px]">
                <div>Single: <span className="font-mono font-semibold">{fmt(h.prixSingleSar)} SAR</span></div>
                <div>Double: <span className="font-mono font-semibold">{fmt(h.prixDoubleSar)} SAR</span></div>
                <div>Triple: <span className="font-mono font-semibold">{fmt(h.prixTripleSar)} SAR</span></div>
                <div>Quad: <span className="font-mono font-semibold">{fmt(h.prixQuadrupleSar)} SAR</span></div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? 'Modifier hôtel' : 'Nouvel hôtel'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Ville</Label>
                <Select value={form.ville} onValueChange={(v) => setForm({ ...form, ville: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Makkah">Makkah</SelectItem>
                    <SelectItem value="Medine">Médine</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Étoiles</Label>
                <Select value={String(form.etoiles)} onValueChange={(v) => setForm({ ...form, etoiles: parseInt(v) })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[3, 4, 5].map((n) => <SelectItem key={n} value={String(n)}>{n} ★</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Nom (FR)</Label>
              <Input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Nom (AR)</Label>
              <Input value={form.nomAr} onChange={(e) => setForm({ ...form, nomAr: e.target.value })} dir="rtl" />
            </div>
            <div className="space-y-2">
              <Label>Distance Haram (m)</Label>
              <Input type="number" value={form.distanceHaram} onChange={(e) => setForm({ ...form, distanceHaram: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Prix Single (SAR/nuit)</Label>
                <Input type="number" step="0.01" value={form.prixSingleSar} onChange={(e) => setForm({ ...form, prixSingleSar: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Prix Double (SAR/nuit)</Label>
                <Input type="number" step="0.01" value={form.prixDoubleSar} onChange={(e) => setForm({ ...form, prixDoubleSar: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Prix Triple (SAR/nuit)</Label>
                <Input type="number" step="0.01" value={form.prixTripleSar} onChange={(e) => setForm({ ...form, prixTripleSar: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Prix Quadruple (SAR/nuit)</Label>
                <Input type="number" step="0.01" value={form.prixQuadrupleSar} onChange={(e) => setForm({ ...form, prixQuadrupleSar: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={submit} className="bg-brand-rouge hover:bg-brand-rouge/90">
              {editId ? 'Mettre à jour' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet hôtel ?</AlertDialogTitle>
            <AlertDialogDescription>
              "{toDelete?.nom}" sera retiré du catalogue. Les devis existants conservent leur snapshot.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={remove} className="bg-red-600 hover:bg-red-700">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}

function CompagniesTab() {
  const [compagnies, setCompagnies] = useState<CompagnieItem[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [toDelete, setToDelete] = useState<CompagnieItem | null>(null)
  const [form, setForm] = useState<CompagnieForm>({ nom: '', codeIata: '' })

  const load = () => {
    setLoading(true)
    api('/api/catalogues/compagnies').then((c) => { setCompagnies(c); setLoading(false) })
  }
  useEffect(() => { load() }, [])

  const submit = async () => {
    try {
      if (editId) {
        await api(`/api/catalogues/compagnies/${editId}`, { method: 'PUT', body: JSON.stringify(form) })
        toast.success('Compagnie mise à jour')
      } else {
        await api('/api/catalogues/compagnies', { method: 'POST', body: JSON.stringify(form) })
        toast.success('Compagnie créée')
      }
      setDialogOpen(false)
      load()
    } catch (e: unknown) { toast.error(getErrorMessage(e)) }
  }

  const remove = async () => {
    if (!toDelete) return
    try {
      await api(`/api/catalogues/compagnies/${toDelete.id}`, { method: 'DELETE' })
      toast.success('Compagnie supprimée')
      setToDelete(null)
      load()
    } catch (e: unknown) { toast.error(getErrorMessage(e)) }
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">{compagnies.length} compagnie(s)</p>
        <Button onClick={() => { setForm({ nom: '', codeIata: '' }); setEditId(null); setDialogOpen(true) }} className="gap-2 bg-brand-rouge hover:bg-brand-rouge/90">
          <Plus className="w-4 h-4" /> Nouvelle compagnie
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-12 bg-muted animate-pulse rounded-md" />)}</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {compagnies.map((c) => (
            <div key={c.id} className="border border-border rounded-lg p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-brand-bleu-royal/10 flex items-center justify-center text-brand-bleu-royal font-bold text-xs">
                {c.codeIata ?? c.nom.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{c.nom}</p>
                <p className="text-xs text-muted-foreground">{c.codeIata ?? '—'}</p>
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setForm({ nom: c.nom, codeIata: c.codeIata ?? '' }); setEditId(c.id); setDialogOpen(true) }}>
                  <Pencil className="w-3 h-3" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-red-600 hover:bg-red-50" onClick={() => setToDelete(c)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editId ? 'Modifier compagnie' : 'Nouvelle compagnie'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Nom</Label>
              <Input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Code IATA (2 lettres)</Label>
              <Input value={form.codeIata} onChange={(e) => setForm({ ...form, codeIata: e.target.value.toUpperCase().slice(0, 2) })} maxLength={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={submit} className="bg-brand-rouge hover:bg-brand-rouge/90">
              {editId ? 'Mettre à jour' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette compagnie ?</AlertDialogTitle>
            <AlertDialogDescription>"{toDelete?.nom}" sera retirée du catalogue.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={remove} className="bg-red-600 hover:bg-red-700">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
