// Captures user-manual screenshots of BidFlow from the running dev server
// (http://localhost:3000) using headless Chrome via the DevTools protocol.
// Run: node docs/manual/capture.mjs

import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const DIR = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(DIR, 'shots')
fs.mkdirSync(OUT, { recursive: true })

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const PORT = 9233
const APP = 'http://localhost:3000'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const chrome = spawn(CHROME, [
  '--headless=new',
  `--remote-debugging-port=${PORT}`,
  '--no-first-run',
  '--hide-scrollbars',
  '--window-size=1366,900',
  `--user-data-dir=${path.join(DIR, '.chrome-profile')}`,
], { stdio: 'ignore' })

process.on('exit', () => { try { chrome.kill() } catch {} })

// wait for the devtools endpoint
for (let i = 0; i < 60; i++) {
  try { const r = await fetch(`http://127.0.0.1:${PORT}/json/version`); if (r.ok) break } catch {}
  await sleep(300)
  if (i === 59) throw new Error('Chrome devtools never came up')
}

const tab = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json()
const ws = new WebSocket(tab.webSocketDebuggerUrl)
await new Promise((r, j) => { ws.onopen = r; ws.onerror = j })

let msgId = 0
const pending = new Map()
ws.onmessage = (e) => {
  const m = JSON.parse(e.data)
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id) }
}
const send = (method, params = {}) => new Promise((res) => {
  const i = ++msgId; pending.set(i, res)
  ws.send(JSON.stringify({ id: i, method, params }))
})

await send('Page.enable')
await send('Runtime.enable')
await send('Emulation.setDeviceMetricsOverride', { width: 1366, height: 900, deviceScaleFactor: 1.5, mobile: false })

async function evalJS(expression) {
  const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
  if (r.result && r.result.exceptionDetails) console.error('JS error:', r.result.exceptionDetails.text)
  return r.result && r.result.result ? r.result.result.value : undefined
}

async function waitFor(checkExpr, timeoutMs = 20000) {
  const t0 = Date.now()
  while (Date.now() - t0 < timeoutMs) {
    if (await evalJS(checkExpr)) return true
    await sleep(400)
  }
  console.warn('waitFor timeout:', checkExpr.slice(0, 80))
  return false
}

async function nav(url, checkExpr) {
  await send('Page.navigate', { url: APP + url })
  await sleep(1500)
  if (checkExpr) await waitFor(checkExpr)
  await sleep(900)
}

async function shot(name) {
  const r = await send('Page.captureScreenshot', { format: 'png' })
  fs.writeFileSync(path.join(OUT, `${name}.png`), Buffer.from(r.result.data, 'base64'))
  console.log('shot:', name)
}

// ── 1. Login page ─────────────────────────────────────────────────────────────
await nav('/login', `!!document.querySelector('input[type="email"]')`)
await shot('01-login')

// ── 2. Sign in as Layla ───────────────────────────────────────────────────────
await evalJS(`(function(){
  function setVal(sel, v){ var el = document.querySelector(sel);
    var s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    s.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })) }
  setVal('input[type="email"]', 'layla.haddad@satco.example')
  setVal('input[type="password"]', 'bidflow123')
  document.querySelector('button[type="submit"]').click()
  return 'submitted'
})()`)
await waitFor(`location.pathname === '/home' && document.body.innerText.indexOf('Good') >= 0`)
await sleep(1200)
await shot('02-home')

// ── 3. Command Center ─────────────────────────────────────────────────────────
await nav('/command', `document.body.innerText.indexOf('New Lead') >= 0`)
await shot('03-command')

// ── 4. Opportunities table ────────────────────────────────────────────────────
await nav('/opportunities', `document.querySelectorAll('tbody tr').length > 3`)
await shot('04-opportunities')

// ── 5. Opportunity detail ─────────────────────────────────────────────────────
await nav('/opportunities/o1', `document.body.innerText.indexOf('Health score') >= 0`)
await shot('05-detail')

// ── 6. Important-change modal (edit Bid due, then cancel) ─────────────────────
await evalJS(`(function(){
  var labels = [].slice.call(document.querySelectorAll('div.eyebrow')).filter(function(d){ return d.innerText.trim().toUpperCase() === 'BID DUE' })
  if (!labels.length) return 'no label'
  var c = labels[0].parentElement; var b = c.querySelector('button'); if (b) b.click()
  return 'clicked'
})()`)
await sleep(600)
await evalJS(`(function(){
  var labels = [].slice.call(document.querySelectorAll('div.eyebrow')).filter(function(d){ return d.innerText.trim().toUpperCase() === 'BID DUE' })
  var c = labels[0].parentElement; var input = c.querySelector('input[type="date"]')
  if (!input) return 'no input'
  input.focus()
  var s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
  s.call(input, '2026-06-20')
  input.dispatchEvent(new Event('input', { bubbles: true }))
  input.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
  return 'edited'
})()`)
await waitFor(`document.body.innerText.indexOf('Important Change') >= 0`, 6000)
await shot('06-notify-modal')
await evalJS(`(function(){ var b = [].slice.call(document.querySelectorAll('button')).find(function(x){ return x.innerText.indexOf('Cancel change') >= 0 }); if (b) b.click(); return 'cancelled' })()`)
await sleep(600)

// ── 7. Closed-reason modal (then cancel) ──────────────────────────────────────
await nav('/opportunities/o3', `document.body.innerText.indexOf('Health score') >= 0`)
await evalJS(`(function(){ var b = [].slice.call(document.querySelectorAll('button')).find(function(x){ return x.innerText.indexOf('Mark Closed / Lost') >= 0 }); if (b) b.click(); return 'clicked' })()`)
await waitFor(`document.body.innerText.indexOf('Reason required') >= 0`, 6000)
await shot('07-reason-modal')
await evalJS(`(function(){ var b = [].slice.call(document.querySelectorAll('button')).find(function(x){ return x.innerText.indexOf('Cancel change') >= 0 }); if (b) b.click(); return 'cancelled' })()`)
await sleep(600)

// ── 8. Closed / Lost page ─────────────────────────────────────────────────────
await nav('/closed', `document.body.innerText.indexOf('Reason') >= 0`)
await shot('08-closed')

// ── 9. Change History ─────────────────────────────────────────────────────────
await nav('/change-history', `document.body.innerText.indexOf('Change History') >= 0 && document.body.innerText.indexOf('Details') >= 0`)
await shot('09-history')

// ── 10. Excel Sync ────────────────────────────────────────────────────────────
await nav('/excel-sync', `document.body.innerText.indexOf('Export CSV') >= 0`)
await shot('10-excel')

// ── 11. Calendar ──────────────────────────────────────────────────────────────
await nav('/calendar', `document.body.innerText.indexOf('Calendar') >= 0`)
await shot('11-calendar')

// ── 12. Switch to admin for the user-management screens ───────────────────────
await evalJS(`fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'admin@satco.example', password: 'bidflow123' }) }).then(function(r){ return r.ok })`)
await sleep(800)
await nav('/settings/users', `document.body.innerText.indexOf('Add user') >= 0`)
await shot('12-users')

// open a permissions panel for the screenshot
await evalJS(`(function(){
  var rows = [].slice.call(document.querySelectorAll('tbody tr'))
  var omar = rows.find(function(tr){ return tr.innerText.indexOf('Omar Khalil') >= 0 })
  if (!omar) return 'no omar'
  var b = [].slice.call(omar.querySelectorAll('button')).find(function(x){ return x.innerText.indexOf('Permissions') >= 0 || x.innerText.indexOf('Custom') >= 0 })
  if (b) b.click(); return 'opened'
})()`)
await sleep(900)
await shot('13-permissions')

// ── 14. Notification rules ────────────────────────────────────────────────────
await nav('/settings/notification-rules', `document.body.innerText.indexOf('Ask to notify') >= 0`)
await shot('14-rules')

console.log('All screenshots captured to', OUT)
ws.close()
chrome.kill()
process.exit(0)
