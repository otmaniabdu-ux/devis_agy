import { NextResponse } from 'next/server'

/**
 * GET /api/health — Health-check public (sans authentification).
 *
 * Route volontairement hors garde d'authentification (liste PUBLIC_API_ROUTES
 * de src/proxy.ts) : elle permet à la fenêtre Tauri, au sidecar Bun et à un
 * monitoring local de vérifier que le serveur Next.js répond, sans exposer
 * la moindre donnée métier.
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'devis-agy',
    timestamp: new Date().toISOString(),
  })
}
