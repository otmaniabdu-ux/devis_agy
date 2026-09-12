import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { SESSION_COOKIE, verifyPassword, createSession } from '@/lib/auth'

const LoginSchema = z.object({
  nomUtilisateur: z.string().min(1, "Le nom d'utilisateur est requis"),
  motDePasse: z.string().min(1, 'Le mot de passe est requis'),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = LoginSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error.format() },
        { status: 400 }
      )
    }

    const { nomUtilisateur, motDePasse } = parsed.data

    const utilisateur = await db.utilisateur.findUnique({ where: { nomUtilisateur } })

    // Message volontairement générique (pas d'énumération d'utilisateurs)
    const motDePasseValide = utilisateur
      ? await verifyPassword(motDePasse, utilisateur.passwordHash)
      : false

    if (!utilisateur || !motDePasseValide) {
      return NextResponse.json({ error: "Nom d'utilisateur ou mot de passe incorrect" }, { status: 401 })
    }

    const { token, expiresAt } = await createSession(utilisateur.id)

    const response = NextResponse.json({
      ok: true,
      utilisateur: { id: utilisateur.id, nomUtilisateur: utilisateur.nomUtilisateur },
    })
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      expires: expiresAt,
      // secure volontairement absent : l'app tourne en HTTP local/LAN (desktop Tauri)
    })
    return response
  } catch (error: unknown) {
    console.error('Erreur POST /api/auth/login:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
