import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE, destroySession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  await destroySession(req.cookies.get(SESSION_COOKIE)?.value)
  const response = NextResponse.json({ ok: true })
  response.cookies.set(SESSION_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 })
  return response
}
