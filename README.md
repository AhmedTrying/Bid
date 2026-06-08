# BidFlow Tracker

A tender / proposal command center for a construction & infrastructure contractor's
Business Development team. It replaces a sprawling Excel tracker with a clean,
Notion / Airtable / Linear-style web app — organising opportunities, deadlines,
owners and document links across the bid pipeline.

> **New Lead → To Qualify → Live PQQ/RFQ → Live Bid → Submitted → Negotiation → Awarded / Closed-Lost / Postponed**

## Stack

- **Next.js 16** (App Router) + **TypeScript** (strict)
- **Tailwind CSS v4** with an oklch design-token system (light/dark, swappable accent, 3 densities)
- **dnd-kit** — Command Center pipeline board
- **TanStack Table v8** — Opportunities master table (inline edit, views, grouping, CSV export)
- **Recharts** — Reports
- **Zustand** — UI + data state
- **Prisma** schema (Postgres) — scaffolded for the future database layer

## Status

The app is **database-ready (Neon Postgres)** with a graceful demo fallback:

- **No `DATABASE_URL` set** → runs as a client-side demo, seeded from
  `src/lib/data.ts` into a Zustand store (only appearance preferences persist).
- **`DATABASE_URL` set** (Neon) → all reads/writes go through API routes to
  Postgres and persist across reloads and devices. The switch is automatic via
  the `dbEnabled` guard in `src/lib/db.ts`.

Excel-tracker parity is implemented: a full Add-Opportunity form, fully
inline-editable opportunity detail pages, editable dropdown lists (Settings →
Lists), client CRUD (Clients & Portals), real document-link CRUD, and a real
calendar with reminders linked to opportunities.

## Getting started

```bash
npm install            # also runs `prisma generate`
npm run dev            # demo mode if no DATABASE_URL
```

Open [http://localhost:3000](http://localhost:3000).

### Enable Neon persistence

1. Create `.env` (gitignored):

   ```
   DATABASE_URL=<neon pooled connection string>
   DIRECT_URL=<neon unpooled connection string>
   ```

2. Push the schema and seed:

   ```bash
   npx prisma db push     # creates tables in Neon (uses DIRECT_URL)
   npm run db:seed        # team, clients, option lists, 22 demo opps, sample docs/reminders
   npm run dev
   ```

3. On Vercel, add `DATABASE_URL` and `DIRECT_URL` as environment variables.

## Screens

Home dashboard · Command Center board · Opportunities table · Opportunity detail ·
Live Bids · Live PQQ/RFQ · Submitted & Negotiation · Awarded · Closed/Lost ·
Calendar · Clients & Portals · Reports · Settings.

## Roadmap

- ~~Wire the real database (Neon/Postgres)~~ ✅ done — API routes + Zustand
  write-through, auto-activated by `DATABASE_URL`.
- ~~Editable lists, full Add/Edit, real documents & calendar~~ ✅ done.
- Next: auth / real multi-user identity (currently hard-coded "Layla Haddad"),
  persisted activity log (still synthesized), `SavedView` wiring, file uploads,
  Excel import.

## Deploy

Deploys to **Vercel**. Without `DATABASE_URL` it builds and runs as a demo;
with `DATABASE_URL` + `DIRECT_URL` set it persists to Neon. `next build` runs
`prisma generate` first (see `vercel.json`).
