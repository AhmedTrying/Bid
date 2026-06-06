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

The app currently runs as a **client-side demo**: all opportunities are seeded into a
Zustand store on load (only appearance preferences persist). The Prisma schema is in
place but the UI does not yet read/write a database — see *Roadmap*.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Screens

Home dashboard · Command Center board · Opportunities table · Opportunity detail ·
Live Bids · Live PQQ/RFQ · Submitted & Negotiation · Awarded · Closed/Lost ·
Calendar · Clients & Portals · Reports · Settings.

## Roadmap — wiring the real database

1. Provision **Postgres** (Neon via the Vercel marketplace) and set `DATABASE_URL`.
2. Switch `prisma/schema.prisma` datasource to `postgresql`, run `prisma migrate deploy`.
3. Seed from `src/lib/data.ts` (22 opportunities, 10 clients, 7 team members).
4. Add API routes / server actions and move the Zustand data layer behind TanStack Query
   with optimistic mutations.

## Deploy

Deploys to **Vercel** with zero config (`next build`). No database is required for the
current demo build.
