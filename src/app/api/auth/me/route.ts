import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { dbEnabled } from '@/lib/db'
import { getUserBySession, toAuthUser, SESSION_COOKIE } from '@/lib/authService'
import { DEMO_USER } from '@/lib/userService'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/auth/me — current signed-in user (or null in DB mode when not logged in)
export async function GET() {
  if (dbEnabled) {
    const sid = (await cookies()).get(SESSION_COOKIE)?.value
    const user = await getUserBySession(sid)
    return NextResponse.json({ user: user ? toAuthUser(user) : null })
  }
  return NextResponse.json({ user: DEMO_USER() })
}
