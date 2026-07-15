'use client'

import { useEffect, useState } from 'react'
import { FileText, Users, TrendingUp, AlertTriangle, ArrowRight, Plus, FileDown } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { fmt, fmtDate, api } from '@/lib/client-utils'
import { STATUTS_DEVIS, verifierAlertePasseport } from '@/lib/business'
import { D } from '@/lib/money'

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
  client: { nom: string; prenom?: string | null; raisonSociale?: string | null; type: string }
  passagers: { passeportExpiration?: string | null }[]
  hasAlertePasseport?: boolean
}

export function DashboardView({ onNavigate }: { onNavigate: (v: View, devisId?: string) => void }) {
  const [devis, setDevis] = useState<DevisListItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api('/api/devis').then((d) => {
      setDevis(d)
      setLoading(false)
    })
  }, [])

  // KPIs
  const totalDevis = devis.length
  const totalPrixVente = devis.reduce((s, d) => s + Number(D(d.prixVenteDzd)), 0)
  const totalMarge = devis.reduce((s, d) => s + Number(D(d.margeMontantDzd)), 0)
  const alertesPasseport = devis.filter((d) => d.hasAlertePasseport).length
  const devisActifs = devis.filter((d) => d.statut !== 'archive' && d.statut !== 'refuse').length

  const recents = devis.slice(0, 5)

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Devis actifs"
          value={String(devisActifs)}
          sub={`${totalDevis} au total`}
          icon={FileText}
          color="text-brand-rouge"
          bg="bg-brand-rouge/5"
        />
        <KpiCard
          label="Prix de vente cumulé"
          value={fmt(String(totalPrixVente)) + ' DZD'}
          sub={`${devis.length} devis`}
          icon={TrendingUp}
          color="text-brand-or"
          bg="bg-brand-or/10"
        />
        <KpiCard
          label="Marge cumulée"
          value={fmt(String(totalMarge)) + ' DZD'}
          sub={totalPrixVente > 0 ? `${(Number(totalMarge) / Number(totalPrixVente) * 100).toFixed(1)}% du CA` : '—'}
          icon={TrendingUp}
          color="text-brand-bleu-royal"
          bg="bg-brand-bleu-royal/5"
        />
        <KpiCard
          label="Alertes passeport"
          value={String(alertesPasseport)}
          sub={alertesPasseport > 0 ? 'À traiter' : 'Aucune'}
          icon={AlertTriangle}
          color={alertesPasseport > 0 ? 'text-red-600' : 'text-emerald-600'}
          bg={alertesPasseport > 0 ? 'bg-red-50' : 'bg-emerald-50'}
        />
      </div>

      {/* Derniers devis */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold" style={{ fontFamily: 'Georgia, serif' }}>
            Derniers devis
          </h3>
          <Button variant="ghost" size="sm" onClick={() => onNavigate('liste-devis')} className="gap-2">
            Voir tout <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-muted animate-pulse rounded-md" />
            ))}
          </div>
        ) : recents.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground mb-4">Aucun devis créé pour l'instant</p>
            <Button onClick={() => onNavigate('nouveau-devis')} className="gap-2 bg-brand-rouge hover:bg-brand-rouge/90">
              <Plus className="w-4 h-4" /> Créer le premier devis
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {recents.map((d) => {
              const st = STATUTS_DEVIS[d.statut as keyof typeof STATUTS_DEVIS] ?? STATUTS_DEVIS.brouillon
              return (
                <button
                  key={d.id}
                  onClick={() => onNavigate('nouveau-devis', d.id)}
                  className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-muted/60 transition-colors text-left border border-transparent hover:border-border"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">{d.numero}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${st.color}`}>
                        {st.label}
                      </span>
                      {d.hasAlertePasseport && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Passeport
                        </span>
                      )}
                    </div>
                    <div className="font-semibold text-sm mt-0.5 truncate">
                      {d.client.type === 'societe' ? d.client.raisonSociale : `${d.client.prenom ?? ''} ${d.client.nom}`}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {fmtDate(d.dateDepart)} → {fmtDate(d.dateRetour)} • {d.passagers.length} passager(s)
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-brand-bleu-nuit">{fmt(d.prixVenteDzd)} DZD</div>
                    <div className="text-[11px] text-muted-foreground">Marge: {fmt(d.margeMontantDzd)} DZD</div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </Card>

      {/* Raccourcis */}
      <div className="grid sm:grid-cols-3 gap-4">
        <QuickAction
          title="Nouveau devis"
          desc="Créer un devis VIP personnalisé"
          icon={Plus}
          onClick={() => onNavigate('nouveau-devis')}
        />
        <QuickAction
          title="Gérer les clients"
          desc="Ajouter ou modifier un client"
          icon={Users}
          onClick={() => onNavigate('clients')}
        />
        <QuickAction
          title="Paramètres"
          desc="Taux de change et infos agence"
          icon={FileDown}
          onClick={() => onNavigate('parametres')}
        />
      </div>
    </div>
  )
}

function KpiCard({
  label, value, sub, icon: Icon, color, bg,
}: { label: string; value: string; sub: string; icon: any; color: string; bg: string }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
          <p className="text-xl lg:text-2xl font-bold mt-1 truncate" style={{ fontFamily: 'Georgia, serif' }}>{value}</p>
          <p className="text-[11px] text-muted-foreground mt-1">{sub}</p>
        </div>
        <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
      </div>
    </Card>
  )
}

function QuickAction({
  title, desc, icon: Icon, onClick,
}: { title: string; desc: string; icon: any; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-left p-5 rounded-lg border border-border bg-card hover:border-brand-or hover:shadow-sm transition-all group"
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-md bg-brand-or/10 flex items-center justify-center group-hover:bg-brand-or/20 transition-colors">
          <Icon className="w-4 h-4 text-brand-or" />
        </div>
        <h4 className="font-semibold" style={{ fontFamily: 'Georgia, serif' }}>{title}</h4>
      </div>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </button>
  )
}
