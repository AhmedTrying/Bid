import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { dbEnabled } from '@/lib/db'
import { authenticate, createSession, toAuthUser, SESSION_COOKIE } from '@/lib/authService'
import { findMemberByEmail, memberToAuthUser, DEMO_USER } from '@/lib/userService'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// POST /api/auth/login — { email, password }
export async function POST(req: Request) {
  const { email, password } = (await req.json()) as { email: string; password: string }

  if (dbEnabled) {
    const user = await authenticate(email ?? '', password ?? '')
    if (!user) return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    const sid = await createSession(user.id)
    if (sid) {
      ;(await cookies()).set(SESSION_COOKIE, sid, {
        httpOnly: true, sameSite: 'lax', path: '/', maxAge: 7 * 86400,
      })
    }
    return NextResponse.json({ user: toAuthUser(user) })
  }

  // Demo mode (no DB): accept a seeded email (any password) → that member.
  const member = email ? findMemberByEmail(email) : undefined
  return NextResponse.json({ user: member ? memberToAuthUser(member) : DEMO_USER() })
}
