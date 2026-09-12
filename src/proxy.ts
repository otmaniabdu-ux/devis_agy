import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Proxy de sécurité — Next.js 16
 *
 * Contexte : application web locale & desktop (accessible sur localhost et réseau local LAN).
 *
 * Comportement :
 * - Toute requête /api/** (sauf /api/auth/login) SANS cookie de session est rejetée en 401,
 *   indépendamment des en-têtes Host/Origin/Referer falsifiables. La validité
 *   cryptographique de la session (table Session en base) est vérifiée dans chaque
 *   route via `requireAgent()` (src/lib/api-auth.ts) — le proxy reste volontairement
 *   léger (aucun accès DB) pour ne pas interférer avec la compilation Turbopack.
 * - Autorise les requêtes provenant de localhost, 127.0.0.1, ::1, tauri:// et des adresses
 *   IP locales privées (LAN : 192.168.x.x, 10.x.x.x, 172.16-31.x.x, *.local)
 * - Bloque tout accès externe public non autorisé avec un 403
 * - Ajoute des headers de sécurité à toutes les réponses
 */

// Doit correspondre à SESSION_COOKIE dans src/lib/auth.ts
// (dupliqué pour garder le graphe de module du proxy sans dépendances).
export const PROXY_SESSION_COOKIE = 'agt_session'

// Routes API publiques (pas de session requise) :
// - /api/auth/login : portail de connexion
// - /api/health : health-check public (aucune donnée métier exposée)
const PUBLIC_API_ROUTES = ['/api/auth/login', '/api/health']

function isLocalOrLan(value: string): boolean {
  if (!value) return true // Pas d'origin = requête same-origin
  // Supprimer protocole si présent
  const cleaned = value.replace(/^https?:\/\//, '').split('/')[0]
  const hostname = cleaned.split(':')[0]

  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname === '[::1]' ||
    hostname.endsWith('.local') ||
    hostname.startsWith('tauri.') ||
    value.startsWith('tauri://') ||
    value.startsWith('http://tauri.')
  ) {
    return true
  }

  // Vérification IP privée RFC 1918
  const parts = hostname.split('.').map(Number)
  if (parts.length === 4 && parts.every(p => !isNaN(p) && p >= 0 && p <= 255)) {
    if (parts[0] === 10) return true
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true
    if (parts[0] === 192 && parts[1] === 168) return true
    if (parts[0] === 169 && parts[1] === 254) return true
    if (parts[0] === 127) return true
  }

  // Nom d'hôte machine locale sans point (ex: "DESKTOP-ABC")
  if (!hostname.includes('.')) {
    return true
  }

  return false
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Headers de sécurité ajoutés à toutes les réponses
  const securityHeaders = new Headers()
  securityHeaders.set('X-Frame-Options', 'DENY')
  securityHeaders.set('X-Content-Type-Options', 'nosniff')
  securityHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  securityHeaders.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  securityHeaders.set('X-DNS-Prefetch-Control', 'off')

  const withSecurityHeaders = (response: NextResponse) => {
    securityHeaders.forEach((value, key) => {
      response.headers.set(key, value)
    })
    return response
  }

  // Protection des routes API
  if (pathname.startsWith('/api')) {
    // Vérifier l'origine de la requête
    const origin = request.headers.get('origin') ?? ''
    const host = request.headers.get('host') ?? ''
    const referer = request.headers.get('referer') ?? ''

    const hostIsAllowed = isLocalOrLan(host)

    if (!hostIsAllowed && !isLocalOrLan(origin) && !isLocalOrLan(referer)) {
      return withSecurityHeaders(
        new NextResponse(
          JSON.stringify({ error: 'Accès refusé — réseau local ou desktop uniquement.' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        )
      )
    }

    // Premier filtre d'authentification : rejet immédiat (401) de toute requête API
    // sans cookie de session. La validation complète en base est faite dans les routes.
    if (!PUBLIC_API_ROUTES.includes(pathname) && !request.cookies.get(PROXY_SESSION_COOKIE)) {
      return withSecurityHeaders(
        new NextResponse(JSON.stringify({ error: 'Authentification requise.' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    }
  }

  // Laisser passer la requête avec les headers de sécurité
  return withSecurityHeaders(NextResponse.next())
}

export const config = {
  matcher: [
    // Appliquer le middleware à toutes les routes sauf les assets statiques
    '/((?!_next/static|_next/image|favicon.ico|Logo_S.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)).*)',
  ],
}
