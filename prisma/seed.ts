// Seeds the database from src/lib/data.ts (22 opportunities, 10 clients,
// 7 team members, 13 statuses). Run with `npm run db:seed` after the schema
// has been pushed to Postgres (`npx prisma db push`).

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { TEAM, CLIENTS, STATUS, STAGES, SEED_OPPS, OPPS, buildOptionSeed } from '../src/lib/data'
import { oppToDbData } from '../src/lib/db-map'

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) })

async function main() {
  console.log('Seeding database…')

  // Team members → User
  for (const t of TEAM) {
    await prisma.user.upsert({
      where: { id: t.id },
      update: { name: t.name, roleTitle: t.role, avatarHue: t.hue, initials: t.init },
      create: {
        id: t.id, name: t.name, email: `${t.id}@satco.example`,
        roleTitle: t.role, avatarHue: t.hue, initials: t.init,
      },
    })
  }
  console.log(`  ✓ ${TEAM.length} users`)

  // Clients
  for (const c of CLIENTS) {
    await prisma.client.upsert({
      where: { id: c.id },
      update: { name: c.name, sector: c.sector, contact: c.contact, portal: c.portal, wins: c.wins, losses: c.losses },
      create: { id: c.id, name: c.name, sector: c.sector, contact: c.contact, portal: c.portal, wins: c.wins, losses: c.losses },
    })
  }
  console.log(`  ✓ ${CLIENTS.length} clients`)

  // Statuses → StatusConfig (id = label so opportunities reference it directly)
  const labels = Object.keys(STATUS)
  for (const label of labels) {
    const meta = STATUS[label as keyof typeof STATUS]
    await prisma.statusConfig.upsert({
      where: { id: label },
      update: { label, stage: meta.stage, hue: meta.hue, order: STAGES.indexOf(meta.stage) },
      create: { id: label, label, stage: meta.stage, hue: meta.hue, order: STAGES.indexOf(meta.stage) },
    })
  }
  console.log(`  ✓ ${labels.length} statuses`)

  // Editable dropdown lists → ListOption (idempotent on category+label)
  const options = buildOptionSeed()
  for (const opt of options) {
    await prisma.listOption.upsert({
      where: { category_label: { category: opt.category, label: opt.label } },
      update: { order: opt.order },
      create: { category: opt.category, label: opt.label, order: opt.order },
    })
  }
  console.log(`  ✓ ${options.length} list options`)

  // Opportunities
  for (const o of SEED_OPPS) {
    const data = oppToDbData(o)
    await prisma.opportunity.upsert({
      where: { id: o.id },
      update: data,
      create: { id: o.id, ...data } as never,
    })
  }
  console.log(`  ✓ ${SEED_OPPS.length} opportunities`)

  // Document links (from the synthesized demo docs on each opportunity)
  let docCount = 0
  for (const o of OPPS) {
    for (const d of o.documents) {
      await prisma.document.upsert({
        where: { id: d.id },
        update: { label: d.label, name: d.name, url: d.url, kind: d.type ?? 'file', meta: d.meta ?? '' },
        create: { id: d.id, oppId: o.id, label: d.label, name: d.name, url: d.url, kind: d.type ?? 'file', meta: d.meta ?? '' },
      })
      docCount++
    }
  }
  console.log(`  ✓ ${docCount} document links`)

  // A few sample calendar reminders (some linked to opportunities)
  const reminders = [
    { id: 'rem-seed-1', oppId: 'o1',  type: 'internal_review',   title: 'Technical review — Al Wasl Interchange', date: new Date('2026-06-05T00:00:00.000Z'), time: '10:00' },
    { id: 'rem-seed-2', oppId: 'o2',  type: 'commercial_review', title: 'Pricing review — NEOM Spine MEP',        date: new Date('2026-06-10T00:00:00.000Z'), time: '14:00' },
    { id: 'rem-seed-3', oppId: null,  type: 'custom',            title: 'BD team weekly sync',                    date: new Date('2026-06-08T00:00:00.000Z'), time: '09:00' },
  ]
  for (const r of reminders) {
    await prisma.reminder.upsert({
      where: { id: r.id },
      update: { oppId: r.oppId, type: r.type, title: r.title, date: r.date, time: r.time },
      create: { id: r.id, oppId: r.oppId, type: r.type, title: r.title, date: r.date, time: r.time },
    })
  }
  console.log(`  ✓ ${reminders.length} reminders`)
  console.log('Done.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
