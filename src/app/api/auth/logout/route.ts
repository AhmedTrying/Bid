import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { destroySession, SESSION_COOKIE } from '@/lib/authService'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// POST /api/auth/logout
export async function POST() {
  const c = await cookies()
  await destroySession(c.get(SESSION_COOKIE)?.value)
  c.delete(SESSION_COOKIE)
  return NextResponse.json({ ok: true })
}
