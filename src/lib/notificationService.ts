// BidFlow Tracker — Notification service (Feature 3)
//
// Service abstraction for major-change emails. By default it SIMULATES sending
// and reports status "sent_demo". When RESEND_API_KEY is configured the server
// route (/api/notifications/send) sends a real email via Resend. The email body
// builder is shared and has no server-only imports, so it is safe on the client.

import type { MajorChangeEmail, EmailStatus } from './types'

export interface EmailContent { subject: string; text: string; html: string }

/** Build the email subject + body from a major-change payload (pure, shareable). */
export function buildMajorChangeEmail(p: MajorChangeEmail): EmailContent {
  const subject = `Important change · ${p.oppRef} — ${p.oppTitle}`
  const lines = p.changes.map(c => `• ${c.label}: ${c.oldValue} → ${c.newValue}`)
  const text = [
    `${p.userName} made an important change to ${p.oppRef} (${p.oppTitle}).`,
    '',
    ...lines,
    '',
    p.note ? `Note: ${p.note}` : '',
    '',
    'This change is saved in the dashboard and will be included in the next Excel export.',
  ].filter(Boolean).join('\n')
  const html = `
    <div style="font-family:system-ui,Segoe UI,sans-serif;font-size:14px;color:#1c1c1c">
      <p><strong>${escapeHtml(p.userName)}</strong> made an important change to
         <strong>${escapeHtml(p.oppRef)}</strong> — ${escapeHtml(p.oppTitle)}.</p>
      <ul>${p.changes.map(c => `<li>${escapeHtml(c.label)}: <s>${escapeHtml(c.oldValue)}</s> → <strong>${escapeHtml(c.newValue)}</strong></li>`).join('')}</ul>
      ${p.note ? `<p><em>Note:</em> ${escapeHtml(p.note)}</p>` : ''}
      <p style="color:#6b6b6b">This change is saved in the dashboard and will be included in the next Excel export.</p>
    </div>`
  return { subject, text, html }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, c => (
    c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '"' ? '&quot;' : '&#39;'
  ))
}

/** Preview the email (used by the modal / future preview UI). */
export function previewMajorChangeEmail(p: MajorChangeEmail): EmailContent {
  return buildMajorChangeEmail(p)
}

/** Send (or simulate) a major-change email. Returns the recorded email status.
 *  Client-callable: posts to the server route, which decides demo vs. real. */
export async function sendMajorChangeEmail(p: MajorChangeEmail): Promise<{ status: EmailStatus }> {
  if (typeof window === 'undefined') return { status: 'sent_demo' }
  try {
    const res = await fetch('/api/notifications/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(p),
    })
    if (!res.ok) return { status: 'failed' }
    const j = (await res.json()) as { status?: EmailStatus }
    return { status: j.status ?? 'sent_demo' }
  } catch {
    // Offline / no API in demo mode — treat as a simulated send.
    return { status: 'sent_demo' }
  }
}
