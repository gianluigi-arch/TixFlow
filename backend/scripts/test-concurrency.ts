import http from 'node:http';
import { AddressInfo } from 'node:net';
import { Role, TicketStatus } from '@prisma/client';
import bcrypt from 'bcrypt';
import app from '../src/app';
import { prisma } from '../src/config/prisma';
import { AUTH_COOKIE_NAME, signAuthToken } from '../src/utils/jwt';

interface HttpResult {
  index: number;
  status: number;
  body: Record<string, unknown>;
}

async function main(): Promise<void> {
  const runId = Date.now();
  const passwordHash = await bcrypt.hash('TestPass123!', 10);

  const server = http.createServer(app);
  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });
  const { port } = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${port}`;

  let panitiaId: string | null = null;
  let eventId: string | null = null;
  let tierId: string | null = null;
  const participantIds: string[] = [];

  try {
    const panitia = await prisma.user.create({
      data: {
        name: 'Concurrency Panitia',
        email: `panitia-concurrency-${runId}@tixflow.test`,
        passwordHash,
        role: Role.PANITIA,
      },
    });
    panitiaId = panitia.id;

    const event = await prisma.event.create({
      data: {
        title: `Concurrency Stress Event ${runId}`,
        description: 'Automated concurrency verification event with quota 1.',
        eventDate: new Date('2026-12-20T09:00:00.000Z'),
        location: 'Main Auditorium',
        createdBy: panitia.id,
      },
    });
    eventId = event.id;

    const tier = await prisma.ticketTier.create({
      data: {
        eventId: event.id,
        name: 'Limited VIP (1 Seat)',
        price: 100000,
        totalQuota: 1,
        remainingQuota: 1,
      },
    });
    tierId = tier.id;

    const participants = await Promise.all(
      Array.from({ length: 10 }, (_, idx) =>
        prisma.user.create({
          data: {
            name: `Participant ${idx + 1}`,
            email: `participant-${idx + 1}-${runId}@tixflow.test`,
            passwordHash,
            role: Role.PARTICIPANT,
          },
        }),
      ),
    );
    participantIds.push(...participants.map((u) => u.id));

    console.log('=== TixFlow Concurrency Test ===');
    console.log(`Server URL: ${baseUrl}`);
    console.log(`Event ID:   ${event.id}`);
    console.log(`Tier ID:    ${tier.id} (initial remaining_quota = ${tier.remainingQuota})`);
    console.log('Firing 10 parallel POST /api/tickets/book requests...\n');

    const bookingResults: HttpResult[] = await Promise.all(
      participants.map(async (user, index) => {
        const token = signAuthToken({
          userId: user.id,
          email: user.email,
          role: user.role,
        });

        const response = await fetch(`${baseUrl}/api/tickets/book`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Cookie: `${AUTH_COOKIE_NAME}=${token}`,
          },
          body: JSON.stringify({ tierId: tier.id }),
        });

        const body = (await response.json()) as Record<string, unknown>;
        return {
          index: index + 1,
          status: response.status,
          body,
        };
      }),
    );

    for (const result of bookingResults) {
      console.log(
        `Request #${String(result.index).padStart(2, '0')} -> HTTP ${result.status} (${String(
          result.body.status,
        )}${result.body.message ? `: ${String(result.body.message)}` : ''})`,
      );
    }

    const count201 = bookingResults.filter((r) => r.status === 201).length;
    const count409 = bookingResults.filter((r) => r.status === 409).length;
    const otherCount = bookingResults.length - count201 - count409;

    const updatedTier = await prisma.ticketTier.findUnique({
      where: { id: tier.id },
    });
    const createdTickets = await prisma.ticket.findMany({
      where: { tierId: tier.id },
    });

    console.log('\n--- Booking Summary ---');
    console.log(`201 Created:         ${count201}`);
    console.log(`409 Conflict:        ${count409}`);
    console.log(`Other statuses:      ${otherCount}`);
    console.log(`remaining_quota:     ${updatedTier?.remainingQuota}`);
    console.log(`Tickets in DB:       ${createdTickets.length}`);

    if (count201 !== 1 || count409 !== 9 || otherCount !== 0) {
      throw new Error(
        `Expected 1 x 201 and 9 x 409, got 201=${count201}, 409=${count409}, other=${otherCount}`,
      );
    }
    if (!updatedTier || updatedTier.remainingQuota !== 0) {
      throw new Error(
        `Expected remaining_quota === 0, got ${updatedTier?.remainingQuota}`,
      );
    }
    if (createdTickets.length !== 1) {
      throw new Error(`Expected 1 created ticket, got ${createdTickets.length}`);
    }

    // Also verify atomic double check-in under parallel requests
    const bookedTicket = createdTickets[0];
    const panitiaToken = signAuthToken({
      userId: panitia.id,
      email: panitia.email,
      role: panitia.role,
    });

    console.log('\nFiring 2 parallel POST /api/tickets/checkin requests...');
    const checkinResults: HttpResult[] = await Promise.all(
      [1, 2].map(async (index) => {
        const response = await fetch(`${baseUrl}/api/tickets/checkin`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Cookie: `${AUTH_COOKIE_NAME}=${panitiaToken}`,
          },
          body: JSON.stringify({ ticketCode: bookedTicket.ticketCode }),
        });

        const body = (await response.json()) as Record<string, unknown>;
        return { index, status: response.status, body };
      }),
    );

    const checkin200 = checkinResults.filter((r) => r.status === 200).length;
    const checkin409 = checkinResults.filter((r) => r.status === 409).length;
    const finalTicket = await prisma.ticket.findUnique({
      where: { id: bookedTicket.id },
    });

    console.log('--- Check-in Summary ---');
    console.log(`200 OK:              ${checkin200}`);
    console.log(`409 Conflict:        ${checkin409}`);
    console.log(`Final ticket status: ${finalTicket?.status}`);

    if (checkin200 !== 1 || checkin409 !== 1) {
      throw new Error(
        `Expected 1 x 200 and 1 x 409 on parallel check-in, got 200=${checkin200}, 409=${checkin409}`,
      );
    }
    if (!finalTicket || finalTicket.status !== TicketStatus.USED) {
      throw new Error(`Expected final ticket status USED, got ${finalTicket?.status}`);
    }

    console.log('\nPASS: Concurrency control (0 overselling, 0 double check-in) verified.');
  } finally {
    if (tierId) {
      await prisma.ticket.deleteMany({ where: { tierId } }).catch(() => undefined);
      await prisma.ticketTier.deleteMany({ where: { id: tierId } }).catch(() => undefined);
    }
    if (eventId) {
      await prisma.event.deleteMany({ where: { id: eventId } }).catch(() => undefined);
    }
    const allUserIds = [...participantIds, ...(panitiaId ? [panitiaId] : [])];
    if (allUserIds.length > 0) {
      await prisma.user
        .deleteMany({ where: { id: { in: allUserIds } } })
        .catch(() => undefined);
    }

    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('Concurrency test failed:', err);
  process.exit(1);
});
