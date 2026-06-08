# BidFlow Tracker — Handover

_Prepared 2026-06-08. Originally a snapshot at commit `00e4dd8`; updated same day
after the Excel-parity + Neon work (see "2026-06-08 update" below)._

## 2026-06-08 update — Excel-parity + Neon persistence (uncommitted working tree)

The app was upgraded from a read-mostly demo to a usable Excel-replacement that
persists to Neon Postgres. **All of this is in the working tree, not yet committed,
and not yet built/run** (Node isn't installed on this machine — see prerequisite).

**What changed (by area):**
- **Persistence is now real.** Data flows through API routes to Postgres when
  `DATABASE_URL` is set, via the existing Zustand write-through pattern. With no
  `DATABASE_URL` the app still runs as a demo (the `dbEnabled` guard). New API
  route groups: `clients`, `options`, `documents`, `reminders`, plus
  `opportunities/[id]` GET + DELETE. The store (`src/lib/store.ts`) gained
  `clients`, `options`, `reminders` arrays and full CRUD actions; `hydrate()`
  now loads all four collections.
- **Schema** (`prisma/schema.prisma`): new Opportunity fields (`rfpNumber`,
  `partnerInvolved`, `partnerName`, `contractDuration`, `siteVisitMode`,
  `qDeadlineTime`, `bidDueTime`, `bondValidityDays`); `Document` gained `label`
  + `createdAt`; new models `ListOption` (generic editable dropdowns) and
  `Reminder` (calendar). The datasource stays `provider`-only — the URL is
  injected by `prisma.config.ts` (now `DIRECT_URL ?? DATABASE_URL` for
  migrations) and by the pg adapter at runtime.
- **Add form** (`quick-add-modal.tsx`): all Excel fields, dropdowns read live
  from store options/clients, conditional Partner Name, site-visit mode, date +
  time, bond fields, ref/RFP auto-or-manual.
- **Detail page** (`opportunities/[id]/page.tsx`): every field is now
  **inline-editable** via the new `EditableField` (`components/app/inline-field.tsx`),
  plus Delete. Real **document-link CRUD** (`components/app/documents-section.tsx`)
  and a real **Reminders** card (`components/app/opp-reminders.tsx`).
- **Settings → Lists tab** (`components/app/editable-list.tsx`): add / rename /
  delete / reorder Portals, Classifications, Procurement, Partners, Opp types,
  Site-visit, Bond-validity options.
- **Clients & Portals page**: client CRUD (add/edit/delete) via a modal.
- **Calendar page**: real reminders (CRUD via `components/app/reminder-modal.tsx`)
  rendered alongside opportunity-derived deadline markers; click a day to add,
  click a reminder to edit; reminders optionally linked to an opportunity and
  shown in both places.
- **`byClient` is now live**: it reads a registry the store keeps in sync
  (`setClientRegistry` in `data.ts`), so added/edited clients resolve everywhere
  without per-page changes. (Note: `reports/page.tsx` still imports the static
  `CLIENTS` for aggregates — minor, a candidate follow-up.)
- **Seed** (`prisma/seed.ts`): also seeds option lists, document links, and 3
  sample reminders.

**To run it (needs Node 20+ installed first):**
`npm install` → set `.env` (`DATABASE_URL` + `DIRECT_URL`, already created) →
`npx prisma db push` → `npm run db:seed` → `npm run dev`. Then `npm run build`
to typecheck. **None of these have been run yet — verify before relying on it.**

The architecture notes below predate this update but remain broadly accurate
(the data layer is now active rather than scaffolded).

---

## What this is

A tender / proposal **command center** for a construction & infrastructure
contractor's Business Development team (fictional company "SATCO"). It replaces a
sprawling Excel tracker with a Notion / Airtable / Linear-style web app —
organising bid opportunities, deadlines, owners, bonds and document links across
the pipeline:

> New Lead → To Qualify → Live PQQ/RFQ → Live Bid → Submitted → Negotiation →
> Awarded / Closed-Lost / Postponed

## Stack

- **Next.js 16** (App Router) + **TypeScript** (strict), **React 19**
- **Tailwind CSS v4** (`@tailwindcss/postcss`) with an oklch design-token system
  driven by CSS custom properties (`--bf-*`) — light/dark, 4 swappable accents,
  3 densities, 3 card styles
- **dnd-kit** — Command Center drag-and-drop pipeline board
- **TanStack Table v8** — Opportunities master table
- **Recharts** — Reports
- **Zustand** (+ `persist`) — UI + data state (the live source of truth)
- **Prisma 7.8** (Postgres, `@prisma/adapter-pg` driver adapter) — scaffolded DB
  layer, optional
- Also wired but lightly used: `@tanstack/react-query`, `react-hook-form`, `zod`,
  `sonner`, `@base-ui/react`, `lucide-react`, `date-fns`

## How the data layer actually works (important)

The app runs as a **client-side demo by default**. Read this before touching data.

- **Seed data** lives in `src/lib/data.ts`: 22 opportunities (`RAW_OPPS`), 10
  clients, 7 team members, 13 statuses. `TODAY = '2026-06-04'` is a hardcoded
  anchor so all the "due in Xd / overdue" math is stable. **Changing TODAY
  shifts every relative-date label in the UI.**
- **Zustand store** (`src/lib/store.ts`) seeds `opps` from `OPPS` on load and is
  the single source of truth the UI reads. Only **appearance preferences**
  (theme/accent/density/cardStyle/sidebarCollapsed) are persisted to
  localStorage (`partialize`), key `bidflow-state`. Opportunity data is **not**
  persisted — it re-seeds every reload.
- **Optimistic write-through**: `updateOpp`, `moveStage`, `addOpp` update the
  store immediately, then fire-and-forget `fetch` to the API
  (`persistPatch` / `persistCreate`). These are harmless no-ops when no DB is set.
- **Hydration**: on mount `AppShell` calls `store.hydrate()` → `GET
  /api/opportunities`. If a DB is configured the API returns real rows and the
  store replaces its seed; otherwise it returns the seed and nothing changes.

### Database mode (optional, off by default)

- `src/lib/db.ts`: `dbEnabled = process.env.DATABASE_URL.startsWith('postgres')`.
  When false, `prisma` is `null` and every API route falls back to seed data.
- API routes (`src/app/api/opportunities/route.ts` and `[id]/route.ts`) branch on
  `dbEnabled`: GET (list), POST (create), PATCH (partial update).
- `src/lib/db-map.ts`: converts between the app's `Opportunity` type
  (`YYYY-MM-DD` strings, client/owner ids, status label) and Prisma rows
  (`DateTime`, FKs, `StatusConfig`). `dbToOpp` rebuilds the presentation extras
  (followUps/documents/activity) via `synthExtras` so DB-backed and seed-backed
  detail pages look identical.
- `prisma/schema.prisma`: models User, Client, StatusConfig, Opportunity,
  Document, FollowUp, ActivityLog, SavedView. **StatusConfig.id = the status
  label** and **User.id / Client.id = the seed ids** (`'lh'`, `'rta'`…), so
  opportunities reference them directly without lookups.
- `prisma/seed.ts`: upserts TEAM→User, CLIENTS→Client, STATUS→StatusConfig,
  SEED_OPPS→Opportunity. Run with `npm run db:seed`.

To enable a real DB:
1. Provision Postgres (Neon via Vercel marketplace) and set `DATABASE_URL`.
2. `npx prisma db push` (or `prisma migrate deploy`).
3. `npm run db:seed`.
4. Reload — `hydrate()` now reads the DB; mutations persist via the API.

> Note: `synthExtras` (followUps / documents / activity) is **derived
> presentation content**, not stored editable data — even in DB mode those detail
> sections are synthesized, not persisted. The schema has the tables, but no API
> writes them yet.

## Project structure

```
src/
  app/
    layout.tsx              root: fonts (Hanken Grotesk + JetBrains Mono), metadata
    page.tsx                redirects / → /home
    globals.css             Tailwind v4 + the entire --bf-* design-token system
    (app)/
      layout.tsx            AppShell: sidebar+topbar grid, global shortcuts, hydrate()
      home/                 dashboard
      command/              Command Center — dnd-kit pipeline board (most complex)
      opportunities/        master table (TanStack) + [id]/ detail page
      live-bids/ pqq/ submitted/ awarded/ closed/   filtered pipeline views
      calendar/ clients/ reports/ settings/
    api/opportunities/      route.ts (GET/POST) + [id]/route.ts (PATCH)
  components/
    app/        sidebar, topbar, command-palette, quick-add-modal, toast, providers
    ui/         shadcn-style primitives (button, dialog, select, badge, avatar, icon…)
  lib/
    types.ts    all core TS types (Opportunity is the central one)
    data.ts     seed data + STATUS/STAGES/PRIORITY/TEAM/CLIENTS + synthExtras
    store.ts    Zustand store (UI prefs + opps + optimistic write-through)
    db.ts       Prisma singleton + dbEnabled guard
    db-map.ts   Opportunity <-> Prisma row mapping
    helpers.ts  date/money/tone helpers, computeHealth(), ACCENTS
    utils.ts    cn() classname helper
prisma/         schema.prisma, seed.ts
vercel.json     pins Next.js framework, buildCommand = "prisma generate && next build"
```

## Key conventions & gotchas

- **Styling is mostly inline `style={{}}` objects referencing `--bf-*` CSS vars**,
  not Tailwind utility classes. The design tokens are defined in `globals.css` and
  set dynamically by `src/components/app/providers.tsx` (accent/theme/density →
  `<html>` attributes + custom props). Match this style when adding UI.
- **Pipeline mapping**: a `StatusKey` (13 fine-grained statuses, e.g. "Bid in
  Progress") maps to a `Stage` (9 board columns) via `STATUS[key].stage`.
  Dragging a card uses `STAGE_STATUS` in `store.ts` to pick a default status for
  the target stage (keeping the current status if it already belongs to that
  stage). If you add a status, update `STATUS` in `data.ts` **and** `STAGE_STATUS`
  in `store.ts`.
- **ids are stable strings**: team `'lh'/'ok'/…`, clients `'rta'/'neom'/…`,
  statuses are their own labels. `byId()` / `byClient()` in `data.ts` resolve them.
- **Money is AED**; `money()` in `helpers.ts` formats (compact M/K option).
- **Global keyboard shortcuts** (in `(app)/layout.tsx`): ⌘/Ctrl-K command palette,
  `n` quick-add (when focus is on body), Esc closes overlays. Cross-component
  signalling uses custom DOM events: `bf:palette`, `bf:quickadd`.
- **`computeHealth()`** in `helpers.ts` scores an opportunity's completeness
  (owner, reviewer, bond validity, bid due, value, question deadline) — used for
  the health indicators.
- **Build runs `prisma generate` first** (`package.json` build script +
  `postinstall`). With no `DATABASE_URL` this still succeeds; the client is
  generated but never connected.

## Current state / status

- Branch `main`, working tree clean, up to date with origin.
- No `.env` present (none needed for the demo). `.env*` is gitignored.
- Fully functional as a client-side demo; DB layer is scaffolded but **inactive**
  (no API route persists the synthesized detail tables; `SavedView` model unused).
- Recent commit history shows the DB layer was the last major effort:
  `4d64a28 Make it real: database-backed data layer` →
  `b5af25a vercel.json` → `00e4dd8 Wire Prisma pg driver adapter`.

## Local setup

```bash
npm install        # also runs `prisma generate` via postinstall
npm run dev        # http://localhost:3000
npm run build      # prisma generate && next build
npm run lint
# DB (optional): set DATABASE_URL, then:
npm run db:push    # prisma db push
npm run db:seed    # tsx prisma/seed.ts
```

> ⚠️ **This machine (the one this handover was generated on) has no Node.js on
> PATH** — `npm`/`node` were not found, so the build was not verified locally
> here. Install Node 20+ before running. The code itself is intact and the repo
> builds on Vercel.

## Likely next steps (from README roadmap)

1. Provision Postgres + set `DATABASE_URL`, push schema, seed.
2. Move the Zustand data layer behind TanStack Query with proper optimistic
   mutations (react-query is installed but not yet driving data).
3. Persist the currently-synthesized detail content (documents, follow-ups,
   activity) so the Document/FollowUp/ActivityLog tables are actually written.
4. Wire `SavedView` (saved table views) — model exists, no UI/API yet.
