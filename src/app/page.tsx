'use client'

import { useState, useEffect } from 'react'
import { LayoutDashboard, FileText, Users, Hotel, Settings, Plus, Menu, Receipt, LogOut } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { DashboardView } from '@/components/views/DashboardView'
import { ListeDevisView } from '@/components/views/ListeDevisView'
import { NouveauDevisView } from '@/components/views/NouveauDevisView'
import { FacturationView } from '@/components/views/FacturationView'
import { ClientsView } from '@/components/views/ClientsView'
import { CataloguesView } from '@/components/views/CataloguesView'
import { ParametresView } from '@/components/views/ParametresView'
import { LoginForm } from '@/components/auth/LoginForm'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type View = 'dashboard' | 'liste-devis' | 'nouveau-devis' | 'facturation' | 'clients' | 'catalogues' | 'parametres'

const NAV: { id: View; label: string; icon: LucideIcon }[] = [
  { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { id: 'liste-devis', label: 'Devis', icon: FileText },
  { id: 'nouveau-devis', label: 'Nouveau devis', icon: Plus },
  { id: 'facturation', label: 'Facturation & Règlements', icon: Receipt },
  { id: 'clients', label: 'Clients', icon: Users },
  { id: 'catalogues', label: 'Catalogues', icon: Hotel },
  { id: 'parametres', label: 'Paramètres', icon: Settings },
]

export default function Home() {
  const [view, setView] = useState<View>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [editDevisId, setEditDevisId] = useState<string | null>(null)
  const [authState, setAuthState] = useState<'checking' | 'anon' | 'auth'>('checking')
  const [nomAgent, setNomAgent] = useState<string | null>(null)

  // Vérifie la session au chargement — affiche le portail de connexion sinon
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => {
        if (res.ok) return res.json()
        throw new Error('anon')
      })
      .then((u: { nomUtilisateur: string }) => {
        setNomAgent(u.nomUtilisateur)
        setAuthState('auth')
      })
      .catch(() => setAuthState('anon'))
  }, [])

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
    setNomAgent(null)
    setAuthState('anon')
  }

  const navigate = (v: View, devisId?: string) => {
    setEditDevisId(devisId ?? null)
    setView(v)
    setSidebarOpen(false)
  }

  if (authState === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-block w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm text-muted-foreground">Initialisation de l'application…</p>
        </div>
      </div>
    )
  }

  if (authState === 'anon') {
    return <LoginForm onLoginSuccess={() => setAuthState('auth')} />
  }

  return (
    <div className="min-h-screen flex bg-background relative overflow-x-hidden">
      {/* Watermark logo en fond de l'application */}
      <div
        className="fixed inset-0 pointer-events-none flex items-center justify-center z-0 overflow-hidden"
        aria-hidden
      >
        <img
          src="/Logo_S.png"
          alt=""
          className="w-[550px] md:w-[700px] max-w-[85vw] opacity-[0.05] dark:opacity-[0.07] select-none filter drop-shadow-2xl transition-all duration-700 hover:scale-105"
        />
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:sticky top-0 left-0 z-40 h-screen w-64 bg-sidebar text-sidebar-foreground transition-transform duration-300 flex flex-col border-r border-sidebar-border/50 shadow-xl',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        {/* Brand */}
        <div className="px-5 py-4 border-b border-sidebar-border bg-sidebar-accent/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/90 p-1 flex items-center justify-center shadow-md border border-accent/30 shrink-0">
              <img src="/Logo_S.png" alt="Logo El Mouhssinoune" className="w-full h-full object-contain" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-sm font-extrabold text-sidebar-foreground truncate tracking-wide font-serif">
                El Mouhssinoune
              </h1>
              <p className="text-[11px] font-medium text-accent truncate" dir="rtl">المحسنون للسياحة</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
          {NAV.map((item) => {
            const Icon = item.icon
            const active = view === item.id
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all',
                  active
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground font-semibold shadow-sm'
                    : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)] animate-pulse" />
            <span className="text-[11px] font-semibold text-sidebar-foreground/90">Base SQLite Locale</span>
          </div>
          <p className="text-[10px] text-sidebar-foreground/60 leading-relaxed">
            Mode 100% hors-ligne &amp; sécurisé<br />
            Fichier : <code className="font-mono text-[9px] text-brand-or font-semibold">db/custom.db</code>
          </p>
          {nomAgent && (
            <div className="mt-3 flex items-center justify-between gap-2 rounded-lg bg-sidebar-accent/40 px-3 py-2">
              <div className="min-w-0">
                <p className="text-[10px] text-sidebar-foreground/60">Connecté en tant que</p>
                <p className="text-xs font-semibold text-sidebar-foreground truncate">{nomAgent}</p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-sidebar-foreground/70 hover:text-sidebar-foreground"
                onClick={logout}
                aria-label="Se déconnecter"
                title="Se déconnecter"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </aside>

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <main className="flex-1 min-w-0 flex flex-col relative z-10">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-sm border-b border-border">
          <div className="flex items-center justify-between px-4 lg:px-8 py-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-md hover:bg-muted"
                aria-label="Menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-lg font-bold text-foreground font-serif">
                  {NAV.find((n) => n.id === view)?.label ?? 'Tableau de bord'}
                </h2>
                <p className="text-[11px] text-muted-foreground">
                  {view === 'dashboard' && "Vue d'ensemble de l'activité Omra VIP"}
                  {view === 'liste-devis' && 'Tous les devis créés'}
                  {view === 'nouveau-devis' && (editDevisId ? 'Modifier un devis' : 'Créer un nouveau devis VIP')}
                  {view === 'facturation' && 'Factures, versements clients et quittances de paiement'}
                  {view === 'clients' && 'Gestion des clients'}
                  {view === 'catalogues' && 'Hôtels et compagnies aériennes'}
                  {view === 'parametres' && "Paramètres de l'agence et taux de change"}
                </p>
              </div>
            </div>
            {view !== 'nouveau-devis' && (
              <Button
                onClick={() => navigate('nouveau-devis')}
                className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Nouveau devis</span>
              </Button>
            )}
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 p-4 lg:p-8 animate-fade-in">
          {view === 'dashboard' && <DashboardView onNavigate={navigate} />}
          {view === 'liste-devis' && <ListeDevisView onNavigate={navigate} />}
          {view === 'nouveau-devis' && (
            <NouveauDevisView editDevisId={editDevisId} onDone={() => navigate('liste-devis')} />
          )}
          {view === 'facturation' && <FacturationView onNavigate={navigate} />}
          {view === 'clients' && <ClientsView />}
          {view === 'catalogues' && <CataloguesView />}
          {view === 'parametres' && <ParametresView />}
        </div>
      </main>
    </div>
  )
}
