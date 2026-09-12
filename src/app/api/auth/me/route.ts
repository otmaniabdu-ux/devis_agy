import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE, validateSession } from '@/lib/auth'

// GET /api/auth/me — renvoie l'utilisateur de la session courante (ou 401)
export async function GET(req: NextRequest) {
  const utilisateur = await validateSession(req.cookies.get(SESSION_COOKIE)?.value)
  if (!utilisateur) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }
  return NextResponse.json({ id: utilisateur.id, nomUtilisateur: utilisateur.nomUtilisateur })
}
