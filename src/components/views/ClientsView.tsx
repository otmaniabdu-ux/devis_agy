'use client'

import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Users, Building2, User as UserIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { fmtDate, api } from '@/lib/client-utils'
import { toast } from 'sonner'
import { getErrorMessage } from '@/lib/errors'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface Client {
  id: string
  type: string
  nom: string
  prenom?: string | null
  raisonSociale?: string | null
  telephone?: string | null
  email?: string | null
  adresse?: string | null
  notes?: string | null
  createdAt: string
  _count?: { devis: number }
}

const EMPTY = {
  type: 'particulier',
  nom: '', prenom: '', raisonSociale: '',
  telephone: '', email: '', adresse: '', notes: '',
}

export function ClientsView() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<any>(EMPTY)
  const [toDelete, setToDelete] = useState<Client | null>(null)

  const load = () => {
    setLoading(true)
    api('/api/clients').then((c) => { setClients(c); setLoading(false) })
  }
  useEffect(() => { load() }, [])

  const filtered = clients.filter((c) => {
    if (!search) return true
    const q = search.toLowerCase()
    return `${c.prenom ?? ''} ${c.nom}`.toLowerCase().includes(q) ||
      (c.raisonSociale ?? '').toLowerCase().includes(q) ||
      (c.email ?? '').toLowerCase().includes(q) ||
      (c.telephone ?? '').toLowerCase().includes(q)
  })

  const openNew = () => {
    setForm(EMPTY)
    setEditId(null)
    setDialogOpen(true)
  }

  const openEdit = (c: Client) => {
    setForm({
      type: c.type, nom: c.nom, prenom: c.prenom ?? '', raisonSociale: c.raisonSociale ?? '',
      telephone: c.telephone ?? '', email: c.email ?? '', adresse: c.adresse ?? '', notes: c.notes ?? '',
    })
    setEditId(c.id)
    setDialogOpen(true)
  }

  const submit = async () => {
    try {
      if (editId) {
        await api(`/api/clients/${editId}`, { method: 'PUT', body: JSON.stringify(form) })
        toast.success('Client mis à jour')
      } else {
        await api('/api/clients', { method: 'POST', body: JSON.stringify(form) })
        toast.success('Client créé')
      }
      setDialogOpen(false)
      load()
    } catch (e: unknown) { toast.error(getErrorMessage(e)) }
  }

  const remove = async () => {
    if (!toDelete) return
    try {
      await api(`/api/clients/${toDelete.id}`, { method: 'DELETE' })
      toast.success('Client supprimé')
      setToDelete(null)
      load()
    } catch (e: unknown) { toast.error(getErrorMessage(e)) }
  }

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <Input
            placeholder="Rechercher un client…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1"
          />
          <Button onClick={openNew} className="gap-2 bg-brand-rouge hover:bg-brand-rouge/90">
            <Plus className="w-4 h-4" /> Nouveau client
          </Button>
        </div>
      </Card>

      <Card className="p-4">
        {loading ? (
          <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-muted animate-pulse rounded-md" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">Aucun client.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((c) => (
              <div key={c.id} className="border border-border rounded-lg p-4 hover:border-brand-or hover:shadow-sm transition-all">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-bleu-nuit/10 flex items-center justify-center shrink-0">
                    {c.type === 'societe'
                      ? <Building2 className="w-5 h-5 text-brand-bleu-nuit" />
                      : <UserIcon className="w-5 h-5 text-brand-bleu-nuit" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">
                      {c.type === 'societe' ? c.raisonSociale : `${c.prenom ?? ''} ${c.nom}`}
                    </p>
                    <p className="text-xs text-muted-foreground">{c.telephone ?? '—'}</p>
                    <p className="text-xs text-muted-foreground truncate">{c.email ?? '—'}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                  <Badge variant="outline" className="text-[10px]">
                    {c._count?.devis ?? 0} devis
                  </Badge>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(c)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600 hover:bg-red-50" onClick={() => setToDelete(c)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? 'Modifier le client' : 'Nouveau client'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="particulier">Particulier</SelectItem>
                  <SelectItem value="societe">Société</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.type === 'societe' ? (
              <div className="space-y-2">
                <Label>Raison sociale</Label>
                <Input value={form.raisonSociale} onChange={(e) => setForm({ ...form, raisonSociale: e.target.value })} />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Prénom</Label>
                  <Input value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Nom</Label>
                  <Input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Téléphone</Label>
                <Input value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Adresse</Label>
              <Input value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
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
            <AlertDialogTitle>Supprimer ce client ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le client "{toDelete?.type === 'societe' ? toDelete?.raisonSociale : `${toDelete?.prenom} ${toDelete?.nom}`}" sera supprimé.
              Les devis associés seront conservés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={remove} className="bg-red-600 hover:bg-red-700">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
