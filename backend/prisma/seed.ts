import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const DEMO_EVENT_1_ID = '00000000-0000-4000-8000-000000000001';
const DEMO_EVENT_1_EARLY_BIRD_ID = '00000000-0000-4000-8000-000000000101';
const DEMO_EVENT_1_VIP_ID = '00000000-0000-4000-8000-000000000102';

const DEMO_EVENT_2_ID = '00000000-0000-4000-8000-000000000002';
const DEMO_EVENT_2_STUDENT_ID = '00000000-0000-4000-8000-000000000201';
const DEMO_EVENT_2_BUNDLE_ID = '00000000-0000-4000-8000-000000000202';

const DEMO_EVENT_3_ID = '00000000-0000-4000-8000-000000000003';
const DEMO_EVENT_3_REGULER_ID = '00000000-0000-4000-8000-000000000301';
const DEMO_EVENT_3_VIP_ID = '00000000-0000-4000-8000-000000000302';

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

  // Event 1: TechFest Kampus 2026
  await prisma.event.upsert({
    where: { id: DEMO_EVENT_1_ID },
    update: {},
    create: {
      id: DEMO_EVENT_1_ID,
      title: 'TechFest Kampus 2026',
      description:
        'Seminar nasional rekayasa perangkat lunak, arsitektur backend konkuren, dan workshop praktik Docker + PostgreSQL.',
      eventDate: new Date('2026-12-15T09:00:00.000Z'),
      location: 'Auditorium Utama Gedung A',
      createdBy: panitia.id,
    },
  });

  await prisma.ticketTier.upsert({
    where: { id: DEMO_EVENT_1_EARLY_BIRD_ID },
    update: {},
    create: {
      id: DEMO_EVENT_1_EARLY_BIRD_ID,
      eventId: DEMO_EVENT_1_ID,
      name: 'Early Bird',
      price: 50000,
      totalQuota: 50,
      remainingQuota: 50,
    },
  });

  await prisma.ticketTier.upsert({
    where: { id: DEMO_EVENT_1_VIP_ID },
    update: {},
    create: {
      id: DEMO_EVENT_1_VIP_ID,
      eventId: DEMO_EVENT_1_ID,
      name: 'VIP Pass',
      price: 150000,
      totalQuota: 5,
      remainingQuota: 5,
    },
  });

  // Event 2: CyberSec & CTF Workshop 2026
  await prisma.event.upsert({
    where: { id: DEMO_EVENT_2_ID },
    update: {},
    create: {
      id: DEMO_EVENT_2_ID,
      title: 'CyberSec & CTF Workshop 2026',
      description:
        'Workshop intensif keamanan siber dan latihan Capture The Flag (web exploitation, network defense, dan analisis forensik digital) langsung bersama tim riset keamanan kampus.',
      eventDate: new Date('2026-12-22T13:00:00+07:00'),
      location: 'Lab Keamanan Siber Gedung B',
      createdBy: panitia.id,
    },
  });

  await prisma.ticketTier.upsert({
    where: { id: DEMO_EVENT_2_STUDENT_ID },
    update: {},
    create: {
      id: DEMO_EVENT_2_STUDENT_ID,
      eventId: DEMO_EVENT_2_ID,
      name: 'Student Pass',
      price: 35000,
      totalQuota: 40,
      remainingQuota: 40,
    },
  });

  await prisma.ticketTier.upsert({
    where: { id: DEMO_EVENT_2_BUNDLE_ID },
    update: {},
    create: {
      id: DEMO_EVENT_2_BUNDLE_ID,
      eventId: DEMO_EVENT_2_ID,
      name: 'Pro Team Bundle',
      price: 100000,
      totalQuota: 15,
      remainingQuota: 15,
    },
  });

  // Event 3: Campus Music & Creative Fest
  await prisma.event.upsert({
    where: { id: DEMO_EVENT_3_ID },
    update: {},
    create: {
      id: DEMO_EVENT_3_ID,
      title: 'Campus Music & Creative Fest',
      description:
        'Malam puncak festival musik mahasiswa, panggung kolaborasi band kampus, pameran instalasi visual, dan bazaar industri kreatif mahasiswa.',
      eventDate: new Date('2027-01-10T18:30:00+07:00'),
      location: 'Lapangan Utama Kampus',
      createdBy: panitia.id,
    },
  });

  await prisma.ticketTier.upsert({
    where: { id: DEMO_EVENT_3_REGULER_ID },
    update: {},
    create: {
      id: DEMO_EVENT_3_REGULER_ID,
      eventId: DEMO_EVENT_3_ID,
      name: 'Festival Reguler',
      price: 65000,
      totalQuota: 100,
      remainingQuota: 100,
    },
  });

  await prisma.ticketTier.upsert({
    where: { id: DEMO_EVENT_3_VIP_ID },
    update: {},
    create: {
      id: DEMO_EVENT_3_VIP_ID,
      eventId: DEMO_EVENT_3_ID,
      name: 'Front Row VIP',
      price: 175000,
      totalQuota: 20,
      remainingQuota: 20,
    },
  });

  console.log(
    'Seed completed cleanly (panitia@tixflow.test, peserta@tixflow.test, 3 events: TechFest Kampus 2026, CyberSec & CTF Workshop 2026, Campus Music & Creative Fest).',
  );
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
