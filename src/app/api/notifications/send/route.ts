import { NextResponse } from 'next/server'
import { prisma, dbEnabled } from '@/lib/db'
import { buildMajorChangeEmail } from '@/lib/notificationService'
import type { MajorChangeEmail } from '@/lib/types'

export const dynamic = 'force-dynamic'

// POST /api/notifications/send — send (or simulate) a major-change notification.
//
// Demo by default ("sent_demo"). To enable real email later:
//   1. `npm install resend`
//   2. set RESEND_API_KEY (+ optionally NOTIFY_FROM_EMAIL) in the environment
//   3. uncomment the Resend block below.
// The email subject/body are already built by buildMajorChangeEmail() so wiring a
// provider is a drop-in change — no other code needs to know.
export async function POST(req: Request) {
  const payload = (await req.json()) as MajorChangeEmail
  const content = buildMajorChangeEmail(payload)
  let status: 'sent' | 'sent_demo' | 'failed' = 'sent_demo'

  const key = process.env.RESEND_API_KEY
  if (key && payload.recipientEmails?.length) {
    // --- Real email (Resend) — enable once the package is installed -----------
    // try {
    //   const { Resend } = await import('resend')
    //   const resend = new Resend(key)
    //   await resend.emails.send({
    //     from: process.env.NOTIFY_FROM_EMAIL || 'BidFlow <onboarding@resend.dev>',
    //     to: payload.recipientEmails,
    //     subject: content.subject,
    //     html: content.html,
    //     text: content.text,
    //   })
    //   status = 'sent'
    // } catch { status = 'failed' }
    // -------------------------------------------------------------------------
  }

  // Log the notification event when a DB is configured (best-effort).
  if (dbEnabled && prisma) {
    try {
      await prisma.notificationEvent.create({
        data: {
          subject: content.subject,
          recipients: JSON.stringify(payload.recipientEmails ?? []),
          recipientsSummary: payload.recipientsSummary ?? '',
          status,
          note: payload.note ?? '',
        },
      })
    } catch { /* non-fatal */ }
  }

  return NextResponse.json({ status })
}
