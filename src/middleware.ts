import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Middleware de sécurité — Phase 0 (fail-closed)
 * 
 * Contexte : application desktop Tauri (mono-utilisateur, localhost uniquement).
 * 
 * Comportement :
 * - Autorise les requêtes provenant de localhost / 127.0.0.1 / ::1 / tauri://
 * - Bloque tout accès externe aux routes /api/** avec un 403
 * - Ajoute des headers de sécurité à toutes les réponses
 * 
 * Ce middleware sera renforcé en Phase 5 avec une authentification complète.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Headers de sécurité ajoutés à toutes les réponses
  const securityHeaders = new Headers()
  securityHeaders.set('X-Frame-Options', 'DENY')
  securityHeaders.set('X-Content-Type-Options', 'nosniff')
  securityHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  securityHeaders.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  securityHeaders.set('X-DNS-Prefetch-Control', 'off')

  // Protection des routes API
  if (pathname.startsWith('/api')) {
    // Vérifier l'origine de la requête
    const origin = request.headers.get('origin') ?? ''
    const host = request.headers.get('host') ?? ''
    const referer = request.headers.get('referer') ?? ''

    const isLocalhost = (value: string): boolean => {
      if (!value) return true // Pas d'origin = requête same-origin (navigateur local)
      return /^https?:\/\/(localhost|127\.0\.0\.1|::1|\[::1\])(:\d+)?/.test(value)
        || value.startsWith('tauri://localhost')
        || value.startsWith('http://tauri.localhost')
    }

    const hostIsLocal = /^(localhost|127\.0\.0\.1|::1|\[::1\])(:\d+)?$/.test(host)

    if (!hostIsLocal && !isLocalhost(origin) && !isLocalhost(referer)) {
      return new NextResponse(
        JSON.stringify({ error: 'Accès refusé — application desktop uniquement.' }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
            ...Object.fromEntries(securityHeaders),
          },
        }
      )
    }
  }

  // Laisser passer la requête avec les headers de sécurité
  const response = NextResponse.next()
  securityHeaders.forEach((value, key) => {
    response.headers.set(key, value)
  })

  return response
}

export const config = {
  matcher: [
    // Appliquer le middleware à toutes les routes sauf les assets statiques
    '/((?!_next/static|_next/image|favicon.ico|Logo_S.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)).*)',
  ],
}
