'use client'

import { useState } from 'react'
import { Lock, LogIn, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getErrorMessage } from '@/lib/errors'

interface LoginFormProps {
  onLoginSuccess: () => void
}

export function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [nomUtilisateur, setNomUtilisateur] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nomUtilisateur, motDePasse }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(data.error ?? 'Échec de la connexion')
      }
      onLoginSuccess()
    } catch (err: unknown) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Watermark logo */}
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center" aria-hidden>
        <img
          src="/Logo_S.png"
          alt=""
          className="w-[550px] max-w-[85vw] opacity-[0.05] select-none"
        />
      </div>

      <Card className="w-full max-w-sm relative z-10 shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-white/90 p-1.5 flex items-center justify-center shadow-md border border-accent/30 mb-2">
            <img src="/Logo_S.png" alt="Logo El Mouhssinoune" className="w-full h-full object-contain" />
          </div>
          <CardTitle className="font-serif text-lg">El Mouhssinoune Tours</CardTitle>
          <p className="text-[11px] text-muted-foreground" dir="rtl">المحسنون للسياحة — Omra &amp; Hadj VIP</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="nomUtilisateur">Nom d&apos;utilisateur</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="nomUtilisateur"
                  value={nomUtilisateur}
                  onChange={(e) => setNomUtilisateur(e.target.value)}
                  className="pl-9"
                  autoComplete="username"
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="motDePasse">Mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="motDePasse"
                  type="password"
                  value={motDePasse}
                  onChange={(e) => setMotDePasse(e.target.value)}
                  className="pl-9"
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>
            {error && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>
            )}
            <Button type="submit" className="w-full gap-2 bg-accent hover:bg-accent/90 text-accent-foreground" disabled={loading}>
              <LogIn className="w-4 h-4" />
              {loading ? 'Connexion…' : 'Se connecter'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
