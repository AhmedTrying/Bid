import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const SESSION_COOKIE = 'bf_session'

// Protect the app when a database is configured. In demo mode (no DATABASE_URL)
// the app stays open so it runs as a standalone demo. Session validity is checked
// server-side in /api/auth/me; here we only gate on the cookie's presence.
export function middleware(req: NextRequest) {
  const url = process.env.DATABASE_URL || ''
  if (!url.startsWith('postgres')) return NextResponse.next()

  const hasSession = req.cookies.get(SESSION_COOKIE)?.value
  if (!hasSession) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  return NextResponse.next()
}

export const config = {
  // everything except /login, the auth API, Next internals, and static files
  matcher: ['/((?!login|api/auth|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
