import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE, validateSession } from '@/lib/auth'
import type { Utilisateur } from '@prisma/client'

/**
 * Garde d'authentification pour les route handlers API.
 * Renvoie l'utilisateur si la session (cookie httpOnly) est valide en base,
 * sinon une NextResponse 401 que le handler doit retourner immédiatement :
 *
 *   const agent = await requireAgent(req)
 *   if (agent instanceof NextResponse) return agent
 *
 * Le proxy (src/proxy.ts) fait un premier filtre sur la présence du cookie ;
 * cette validation en base est la garantie réelle (token vérifié contre la table Session).
 */
export async function requireAgent(req: NextRequest): Promise<Utilisateur | NextResponse> {
  const utilisateur = await validateSession(req.cookies.get(SESSION_COOKIE)?.value)
  if (!utilisateur) {
    return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 })
  }
  return utilisateur
}
