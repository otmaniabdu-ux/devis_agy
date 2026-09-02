/**
 * Utilitaires de gestion d'erreurs standardisés.
 * Remplace les catch (e: any) par catch (e: unknown) + getErrorMessage().
 */

/** Extrait un message d'erreur de façon sûre depuis un unknown. */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'Erreur inconnue'
}

/** Erreur métier avec code HTTP associé. */
export class AppError extends Error {
  constructor(message: string, public readonly statusCode: number = 500) {
    super(message)
    this.name = 'AppError'
  }

  static notFound(msg = 'Introuvable') { return new AppError(msg, 404) }
  static conflict(msg: string) { return new AppError(msg, 409) }
  static badRequest(msg: string) { return new AppError(msg, 400) }
}
