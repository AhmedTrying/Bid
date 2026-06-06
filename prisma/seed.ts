// Seeds the database from src/lib/data.ts (22 opportunities, 10 clients,
// 7 team members, 13 statuses). Run with `npm run db:seed` after the schema
// has been pushed to Postgres (`npx prisma db push`).

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { TEAM, CLIENTS, STATUS, STAGES, SEED_OPPS } from '../src/lib/data'
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
  console.log('Done.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
