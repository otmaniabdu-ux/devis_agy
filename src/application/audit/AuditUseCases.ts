import { db } from '@/lib/db'

export class AuditUseCases {
  static async log(action: string, entite: string, entiteId?: string | null, details?: Record<string, unknown>) {
    try {
      await db.auditEvent.create({
        data: {
          action,
          entite,
          entiteId: entiteId ?? null,
          details: details ? JSON.stringify(details) : null,
        },
      })
    } catch (error) {
      console.error('Erreur journalisation audit:', error)
      // Ne pas bloquer l'application pour un échec de log d'audit
    }
  }

  static async list() {
    return db.auditEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100, // limiter aux 100 derniers événements pour UI
    })
  }
}
