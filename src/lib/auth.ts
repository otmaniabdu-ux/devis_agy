import bcrypt from 'bcryptjs'
import { createHash, randomBytes } from 'node:crypto'
import { db } from '@/lib/db'

export const SESSION_COOKIE = 'agt_session'

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 jours

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export async function hashPassword(motDePasse: string): Promise<string> {
  return bcrypt.hash(motDePasse, 12)
}

export async function verifyPassword(motDePasse: string, hash: string): Promise<boolean> {
  return bcrypt.compare(motDePasse, hash)
}

/**
 * Crée une session en base et renvoie le token brut (à poser en cookie httpOnly).
 * Seul le SHA-256 du token est persisté.
 */
export async function createSession(utilisateurId: string) {
  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS)
  await db.session.create({
    data: { tokenHash: hashToken(token), utilisateurId, expiresAt },
  })
  return { token, expiresAt }
}

/** Valide le token de session et renvoie l'utilisateur, ou null si invalide/expiré. */
export async function validateSession(token: string | undefined | null) {
  if (!token) return null
  const session = await db.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { utilisateur: true },
  })
  if (!session) return null
  if (session.expiresAt.getTime() < Date.now()) {
    await db.session.delete({ where: { id: session.id } }).catch(() => {})
    return null
  }
  return session.utilisateur
}

export async function destroySession(token: string | undefined | null): Promise<void> {
  if (!token) return
  await db.session.deleteMany({ where: { tokenHash: hashToken(token) } }).catch(() => {})
}
