'use client'

import { useEffect, useState } from 'react'
import { FileText, Users, TrendingUp, AlertTriangle, ArrowRight, Plus, Sparkles, Building2, Plane } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { fmt, fmtDate, api } from '@/lib/client-utils'
import { STATUTS_DEVIS } from '@/lib/business'
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
    <div className="space-y-6 max-w-7xl mx-auto relative">
      {/* Logo en filigrane centré et redimensionné sur le dashboard */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center opacity-10 z-[-1]">
        <img src="/Logo_S.png" alt="" className="w-1/3 h-1/3 object-contain grayscale" />
      </div>

      {/* Banner d'accueil VIP avec Logo & Calligraphie */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-bleu-nuit via-brand-bleu-royal/90 to-brand-bleu-nuit p-6 lg:p-8 text-white shadow-xl border border-brand-or/30 backdrop-blur-md">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <h1 className="text-xl lg:text-2xl font-extrabold tracking-tight font-serif text-amber-100">
              El Mouhssinoune Tours
            </h1>
            <div className="flex items-center gap-2">
              <Badge className="bg-brand-or text-slate-950 hover:bg-brand-or/90 font-semibold px-3 py-1 text-xs">
                <Sparkles className="w-3.5 h-3.5 mr-1 inline" /> Agence de Voyages & Tourisme
              </Badge>
            </div>
            <p className="text-xs lg:text-sm text-slate-300 leading-relaxed">
              Plateforme sur mesure de chiffrage et d'édition de devis VIP pour les pèlerins algériens.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigate('nouveau-devis')}
              className="transition-transform duration-300 hover:scale-110 active:scale-95"
              title="Créer un devis VIP"
            >
              <img src="/Logo_S.png" alt="Créer devis" className="w-24 h-24 lg:w-32 lg:h-32 object-contain filter drop-shadow-2xl brightness-110 hover:brightness-125" />
            </button>
          </div>
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Devis actifs"
          value={String(devisActifs)}
          sub={`${totalDevis} devis au total`}
          icon={FileText}
          accentColor="from-red-500 to-brand-rouge"
          iconColor="text-brand-rouge"
          bg="bg-brand-rouge/10"
        />
        <KpiCard
          label="Chiffre d'Affaires cumulé"
          value={fmt(String(totalPrixVente)) + ' DZD'}
          sub={`${devis.length} devis enregistrés`}
          icon={TrendingUp}
          accentColor="from-amber-400 to-brand-or"
          iconColor="text-brand-or"
          bg="bg-brand-or/15"
        />
        <KpiCard
          label="Marge cumulée"
          value={fmt(String(totalMarge)) + ' DZD'}
          sub={totalPrixVente > 0 ? `${(Number(totalMarge) / Number(totalPrixVente) * 100).toFixed(1)}% du CA` : '—'}
          icon={TrendingUp}
          accentColor="from-blue-400 to-brand-bleu-royal"
          iconColor="text-brand-bleu-royal"
          bg="bg-brand-bleu-royal/10"
        />
        <KpiCard
          label="Alertes passeport (-6 mois)"
          value={String(alertesPasseport)}
          sub={alertesPasseport > 0 ? 'Action requise' : 'Tous valides'}
          icon={AlertTriangle}
          accentColor={alertesPasseport > 0 ? 'from-rose-500 to-red-600' : 'from-emerald-400 to-emerald-600'}
          iconColor={alertesPasseport > 0 ? 'text-red-600' : 'text-emerald-600'}
          bg={alertesPasseport > 0 ? 'bg-red-50 dark:bg-red-950/20' : 'bg-emerald-50 dark:bg-emerald-950/20'}
        />
      </div>

      {/* Main Section Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Derniers devis - 2 colonnes */}
        <Card className="lg:col-span-2 p-6 shadow-md border-border/80 bg-card/90 backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold font-serif text-foreground flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-or" /> Derniers devis créés
              </h3>
              <p className="text-xs text-muted-foreground">Accès rapide aux dossiers récents</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onNavigate('liste-devis')} className="gap-2 text-xs font-semibold hover:bg-brand-or/10 hover:text-brand-or">
              Voir tout <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted/60 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : recents.length === 0 ? (
            <div className="text-center py-12 border border-dashed rounded-xl border-border/60">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground mb-4">Aucun devis créé pour l'instant</p>
              <Button onClick={() => onNavigate('nouveau-devis')} className="gap-2 bg-brand-rouge hover:bg-brand-rouge/90 text-white">
                <Plus className="w-4 h-4" /> Créer le premier devis VIP
              </Button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {recents.map((d) => {
                const st = STATUTS_DEVIS[d.statut as keyof typeof STATUTS_DEVIS] ?? STATUTS_DEVIS.brouillon
                return (
                  <button
                    key={d.id}
                    onClick={() => onNavigate('nouveau-devis', d.id)}
                    className="w-full flex items-center justify-between p-3.5 rounded-xl bg-background/50 hover:bg-accent/50 transition-all border border-border/50 hover:border-brand-or/50 hover:shadow-sm text-left group"
                  >
                    <div className="flex-1 min-w-0 pr-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-bold text-brand-bleu-royal">{d.numero}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${st.color}`}>
                          {st.label}
                        </span>
                        {d.hasAlertePasseport && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 font-semibold flex items-center gap-1 border border-red-200 dark:border-red-900">
                            <AlertTriangle className="w-3 h-3 text-red-600" /> Passeport
                          </span>
                        )}
                      </div>
                      <div className="font-bold text-sm truncate text-foreground group-hover:text-brand-or transition-colors">
                        {d.client.type === 'societe' ? d.client.raisonSociale : `${d.client.prenom ?? ''} ${d.client.nom}`}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {fmtDate(d.dateDepart)} → {fmtDate(d.dateRetour)} • {d.passagers.length} passager(s)
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-extrabold text-sm text-foreground font-mono">{fmt(d.prixVenteDzd)} DZD</div>
                      <div className="text-[11px] text-emerald-600 font-medium">Marge: +{fmt(d.margeMontantDzd)} DZD</div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </Card>

        {/* Panel latéral / Actions rapides */}
        <div className="space-y-4">
          <Card className="p-5 shadow-md border-border/80 bg-card/90 backdrop-blur-sm">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Raccourcis rapides</h4>
            <div className="space-y-2.5">
              <QuickAction
                title="Nouveau devis VIP"
                desc="Chiffrer un voyage Omra/Hadj"
                icon={Plus}
                onClick={() => onNavigate('nouveau-devis')}
              />
              <QuickAction
                title="Base Clients"
                desc="Gérer les fiches pèlerins"
                icon={Users}
                onClick={() => onNavigate('clients')}
              />
              <QuickAction
                title="Catalogues"
                desc="Hôtels 4/5★ & Compagnies"
                icon={Building2}
                onClick={() => onNavigate('catalogues')}
              />
            </div>
          </Card>

          {/* Info agence & Logo card */}
          <Card className="p-5 border-amber-500/20 bg-gradient-to-br from-amber-500/5 via-card to-background relative overflow-hidden">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white p-1 shadow-md border border-brand-or/30 shrink-0">
                <img src="/Logo_S.png" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground font-serif">El Mouhssinoune Tours</p>
                <p className="text-[11px] text-muted-foreground">Registre & fiscalité intégrés</p>
                <p className="text-[10px] text-brand-or font-semibold mt-0.5">Devis prêts pour impression PDF</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

function KpiCard({
  label, value, sub, icon: Icon, accentColor, iconColor, bg,
}: { label: string; value: string; sub: string; icon: any; accentColor: string; iconColor: string; bg: string }) {
  return (
    <Card className="p-5 relative overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 border-border/80 group">
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${accentColor}`} />
      <div className="flex items-start justify-between gap-3 pt-1">
        <div className="min-w-0">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">{label}</p>
          <p className="text-lg lg:text-xl font-extrabold mt-1 truncate font-mono text-foreground">{value}</p>
          <p className="text-[11px] text-muted-foreground mt-1 font-medium">{sub}</p>
        </div>
        <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
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
      className="w-full text-left p-3 rounded-xl border border-border/60 bg-background/60 hover:bg-brand-or/5 hover:border-brand-or/40 transition-all group flex items-center gap-3"
    >
      <div className="w-8 h-8 rounded-lg bg-brand-or/10 flex items-center justify-center group-hover:bg-brand-or/20 transition-colors shrink-0">
        <Icon className="w-4 h-4 text-brand-or" />
      </div>
      <div className="flex-1 min-w-0">
        <h5 className="text-xs font-bold text-foreground group-hover:text-brand-or transition-colors">{title}</h5>
        <p className="text-[11px] text-muted-foreground truncate">{desc}</p>
      </div>
      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-brand-or group-hover:translate-x-0.5 transition-all shrink-0" />
    </button>
  )
}
