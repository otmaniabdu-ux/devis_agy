'use client'

import { useEffect, useState, useMemo } from 'react'
import { Search, FileText, AlertTriangle, Eye, Pencil, Trash2, FileDown, FilePlus } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { fmt, fmtDate, api } from '@/lib/client-utils'
import { STATUTS_DEVIS } from '@/lib/business'
import { D } from '@/lib/money'
import { toast } from 'sonner'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'

type View = 'dashboard' | 'liste-devis' | 'nouveau-devis' | 'clients' | 'catalogues' | 'parametres'

interface DevisListItem {
  id: string
  numero: string
  statut: string
  dateDepart: string
  dateRetour: string
  coutNetDzd: string
  prixVenteDzd: string
  margeMontantDzd: string
  margeType: string
  margeValeur: string
  client: { nom: string; prenom?: string | null; raisonSociale?: string | null; type: string }
  passagers: { passeportExpiration?: string | null }[]
  hasAlertePasseport?: boolean
}

export function ListeDevisView({ onNavigate }: { onNavigate: (v: View, devisId?: string) => void }) {
  const [devis, setDevis] = useState<DevisListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatut, setFilterStatut] = useState<string>('all')
  const [filterAlerte, setFilterAlerte] = useState(false)
  const [toDelete, setToDelete] = useState<DevisListItem | null>(null)

  const load = () => {
    setLoading(true)
    api('/api/devis').then((d) => {
      setDevis(d)
      setLoading(false)
    })
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    let r = devis
    if (search) {
      const q = search.toLowerCase()
      r = r.filter((d) =>
        d.numero.toLowerCase().includes(q) ||
        `${d.client.prenom ?? ''} ${d.client.nom}`.toLowerCase().includes(q) ||
        d.client.raisonSociale?.toLowerCase().includes(q),
      )
    }
    if (filterStatut !== 'all') r = r.filter((d) => d.statut === filterStatut)
    if (filterAlerte) r = r.filter((d) => d.hasAlertePasseport)
    return r
  }, [devis, search, filterStatut, filterAlerte])

  const handleDelete = async () => {
    if (!toDelete) return
    try {
      await api(`/api/devis/${toDelete.id}`, { method: 'DELETE' })
      toast.success(`Devis ${toDelete.numero} supprimé`)
      setToDelete(null)
      load()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const openPdf = (id: string, variante: 'client' | 'interne') => {
    window.open(`/api/pdf/${id}?variante=${variante}`, '_blank')
  }

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Filtres */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par numéro ou client…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterStatut} onValueChange={setFilterStatut}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous statuts</SelectItem>
              {Object.entries(STATUTS_DEVIS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant={filterAlerte ? 'default' : 'outline'}
            onClick={() => setFilterAlerte(!filterAlerte)}
            className="gap-2"
            style={filterAlerte ? { backgroundColor: '#CC1A1A', color: 'white' } : {}}
          >
            <AlertTriangle className="w-4 h-4" />
            Alertes passeport
          </Button>
          <Button onClick={() => onNavigate('nouveau-devis')} className="gap-2 bg-brand-rouge hover:bg-brand-rouge/90 ml-auto">
            <FilePlus className="w-4 h-4" /> Nouveau
          </Button>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-16 bg-muted animate-pulse rounded-md" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">Aucun devis trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Numéro</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Client</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Voyage</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Passagers</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Statut</th>
                  <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Prix vente</th>
                  <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Marge</th>
                  <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d, i) => {
                  const st = STATUTS_DEVIS[d.statut as keyof typeof STATUTS_DEVIS] ?? STATUTS_DEVIS.brouillon
                  const margePct = Number(D(d.coutNetDzd)) > 0
                    ? (Number(D(d.margeMontantDzd)) / Number(D(d.prixVenteDzd)) * 100).toFixed(1)
                    : '0'
                  return (
                    <tr
                      key={d.id}
                      className={`border-b border-border hover:bg-muted/40 transition-colors ${i % 2 === 0 ? '' : 'bg-muted/20'}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold">{d.numero}</span>
                          {d.hasAlertePasseport && (
                            <span title="Alerte passeport" className="inline-flex">
                              <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">
                          {d.client.type === 'societe' ? d.client.raisonSociale : `${d.client.prenom ?? ''} ${d.client.nom}`}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {fmtDate(d.dateDepart)} → {fmtDate(d.dateRetour)}
                      </td>
                      <td className="px-4 py-3 text-xs">{d.passagers.length} pax</td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${st.color}`}>{st.label}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold tabular-nums">{fmt(d.prixVenteDzd)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        <div className="text-xs">{fmt(d.margeMontantDzd)}</div>
                        <div className="text-[10px] text-muted-foreground">{margePct}%</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="icon" variant="ghost" className="h-8 w-8"
                            onClick={() => onNavigate('nouveau-devis', d.id)}
                            title="Modifier"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="icon" variant="ghost" className="h-8 w-8"
                            onClick={() => openPdf(d.id, 'client')}
                            title="PDF client"
                          >
                            <FileDown className="w-3.5 h-3.5 text-brand-bleu-royal" />
                          </Button>
                          <Button
                            size="icon" variant="ghost" className="h-8 w-8"
                            onClick={() => openPdf(d.id, 'interne')}
                            title="PDF interne"
                          >
                            <FileText className="w-3.5 h-3.5 text-brand-or" />
                          </Button>
                          <Button
                            size="icon" variant="ghost" className="h-8 w-8 hover:text-red-600"
                            onClick={() => setToDelete(d)}
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le devis {toDelete?.numero} ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le devis et toutes ses lignes (passagers, vols, hébergements, etc.) seront définitivement supprimés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
