import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const DEMO_EVENT_ID = '00000000-0000-4000-8000-000000000001';
const DEMO_EARLY_BIRD_TIER_ID = '00000000-0000-4000-8000-000000000101';
const DEMO_VIP_TIER_ID = '00000000-0000-4000-8000-000000000102';

async function main(): Promise<void> {
  const panitiaHash = await bcrypt.hash('Panitia123!', 10);
  const participantHash = await bcrypt.hash('Peserta123!', 10);

  const panitia = await prisma.user.upsert({
    where: { email: 'panitia@tixflow.test' },
    update: {},
    create: {
      name: 'Panitia Kampus TixFlow',
      email: 'panitia@tixflow.test',
      passwordHash: panitiaHash,
      role: Role.PANITIA,
    },
  });

  await prisma.user.upsert({
    where: { email: 'peserta@tixflow.test' },
    update: {},
    create: {
      name: 'Budi Mahasiswa',
      email: 'peserta@tixflow.test',
      passwordHash: participantHash,
      role: Role.PARTICIPANT,
    },
  });

  await prisma.event.upsert({
    where: { id: DEMO_EVENT_ID },
    update: {},
    create: {
      id: DEMO_EVENT_ID,
      title: 'TechFest Kampus 2026',
      description:
        'Seminar nasional rekayasa perangkat lunak, arsitektur backend konkuren, dan workshop praktik Docker + PostgreSQL.',
      eventDate: new Date('2026-12-15T09:00:00.000Z'),
      location: 'Auditorium Utama Gedung A',
      createdBy: panitia.id,
    },
  });

  await prisma.ticketTier.upsert({
    where: { id: DEMO_EARLY_BIRD_TIER_ID },
    update: {},
    create: {
      id: DEMO_EARLY_BIRD_TIER_ID,
      eventId: DEMO_EVENT_ID,
      name: 'Early Bird',
      price: 50000,
      totalQuota: 50,
      remainingQuota: 50,
    },
  });

  await prisma.ticketTier.upsert({
    where: { id: DEMO_VIP_TIER_ID },
    update: {},
    create: {
      id: DEMO_VIP_TIER_ID,
      eventId: DEMO_EVENT_ID,
      name: 'VIP Pass',
      price: 150000,
      totalQuota: 5,
      remainingQuota: 5,
    },
  });

  console.log('Seed completed cleanly (panitia@tixflow.test, peserta@tixflow.test, TechFest Kampus 2026).');
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
