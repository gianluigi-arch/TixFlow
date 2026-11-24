import { Role, TicketStatus } from '@prisma/client';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockTx = vi.hoisted(() => ({
  $queryRaw: vi.fn(),
  ticketTier: {
    update: vi.fn(),
  },
  ticket: {
    create: vi.fn(),
  },
}));

const mockPrisma = vi.hoisted(() => ({
  $transaction: vi.fn(async (callback: (tx: typeof mockTx) => Promise<unknown>) =>
    callback(mockTx),
  ),
  ticket: {
    findMany: vi.fn(),
    updateMany: vi.fn(),
    findUnique: vi.fn(),
  },
  $disconnect: vi.fn(),
}));

vi.mock('../src/config/prisma', () => ({
  prisma: mockPrisma,
}));

import app from '../src/app';
import { AUTH_COOKIE_NAME, signAuthToken } from '../src/utils/jwt';

const PARTICIPANT_ID = '11111111-1111-4111-8111-111111111111';
const PANITIA_ID = '22222222-2222-4222-8222-222222222222';
const EVENT_ID = '33333333-3333-4333-8333-333333333333';
const TIER_ID = '44444444-4444-4444-8444-444444444444';
const TICKET_ID = '55555555-5555-4555-8555-555555555555';
const TICKET_CODE = '66666666-6666-4666-8666-666666666666';

function participantCookie(): string {
  const token = signAuthToken({
    userId: PARTICIPANT_ID,
    email: 'budi@kampus.ac.id',
    role: Role.PARTICIPANT,
  });
  return `${AUTH_COOKIE_NAME}=${token}`;
}

function panitiaCookie(): string {
  const token = signAuthToken({
    userId: PANITIA_ID,
    email: 'panitia@kampus.ac.id',
    role: Role.PANITIA,
  });
  return `${AUTH_COOKIE_NAME}=${token}`;
}

describe('TixFlow Phase 3 API (Tickets & Check-in)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.$transaction.mockImplementation(
      async (callback: (tx: typeof mockTx) => Promise<unknown>) => callback(mockTx),
    );
  });

  describe('POST /api/tickets/book', () => {
    it('returns 401 when unauthenticated', async () => {
      const res = await request(app).post('/api/tickets/book').send({ tierId: TIER_ID });

      expect(res.status).toBe(401);
    });

    it('returns 403 when authenticated as PANITIA (PARTICIPANT only)', async () => {
      const res = await request(app)
        .post('/api/tickets/book')
        .set('Cookie', panitiaCookie())
        .send({ tierId: TIER_ID });

      expect(res.status).toBe(403);
      expect(res.body.message).toBe('Forbidden: insufficient permissions');
    });

    it('returns 400 when tierId is not a valid UUID', async () => {
      const res = await request(app)
        .post('/api/tickets/book')
        .set('Cookie', participantCookie())
        .send({ tierId: 'invalid-uuid' });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Validation failed');
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('returns 404 when ticket tier does not exist', async () => {
      mockTx.$queryRaw.mockResolvedValue([]);

      const res = await request(app)
        .post('/api/tickets/book')
        .set('Cookie', participantCookie())
        .send({ tierId: TIER_ID });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Ticket tier not found');
      expect(mockTx.ticketTier.update).not.toHaveBeenCalled();
      expect(mockTx.ticket.create).not.toHaveBeenCalled();
    });

    it('returns 409 when remaining_quota is 0 and rolls back without decrement or ticket creation', async () => {
      mockTx.$queryRaw.mockResolvedValue([{ id: TIER_ID, remaining_quota: 0 }]);

      const res = await request(app)
        .post('/api/tickets/book')
        .set('Cookie', participantCookie())
        .send({ tierId: TIER_ID });

      expect(res.status).toBe(409);
      expect(res.body.status).toBe('error');
      expect(mockTx.ticketTier.update).not.toHaveBeenCalled();
      expect(mockTx.ticket.create).not.toHaveBeenCalled();
    });

    it('returns 201 on valid booking using $transaction + FOR UPDATE lock, decrements quota, and creates VALID ticket', async () => {
      const createdTicket = {
        id: TICKET_ID,
        ticketCode: TICKET_CODE,
        userId: PARTICIPANT_ID,
        tierId: TIER_ID,
        status: TicketStatus.VALID,
        checkedInAt: null,
        createdAt: new Date('2026-11-25T01:00:00.000Z'),
        tier: {
          id: TIER_ID,
          eventId: EVENT_ID,
          name: 'VIP Pass',
          price: 100000,
          totalQuota: 10,
          remainingQuota: 0,
          event: {
            id: EVENT_ID,
            title: 'TechFest 2026',
            eventDate: new Date('2026-12-10T09:00:00.000Z'),
            location: 'Auditorium A',
          },
        },
      };

      mockTx.$queryRaw.mockResolvedValue([{ id: TIER_ID, remaining_quota: 1 }]);
      mockTx.ticketTier.update.mockResolvedValue({ id: TIER_ID, remainingQuota: 0 });
      mockTx.ticket.create.mockResolvedValue(createdTicket);

      const res = await request(app)
        .post('/api/tickets/book')
        .set('Cookie', participantCookie())
        .send({ tierId: TIER_ID });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.ticket.id).toBe(TICKET_ID);
      expect(res.body.data.ticket.status).toBe(TicketStatus.VALID);

      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
      expect(mockTx.$queryRaw).toHaveBeenCalledTimes(1);
      const queryStrings = mockTx.$queryRaw.mock.calls[0][0] as readonly string[];
      expect(queryStrings.join(' ')).toContain('FOR UPDATE');

      expect(mockTx.ticketTier.update).toHaveBeenCalledWith({
        where: { id: TIER_ID },
        data: { remainingQuota: { decrement: 1 } },
      });
      expect(mockTx.ticket.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            userId: PARTICIPANT_ID,
            tierId: TIER_ID,
            status: TicketStatus.VALID,
          },
        }),
      );
    });
  });

  describe('GET /api/tickets/my', () => {
    it('returns 401 when unauthenticated', async () => {
      const res = await request(app).get('/api/tickets/my');

      expect(res.status).toBe(401);
    });

    it('returns 403 when authenticated as PANITIA (PARTICIPANT only)', async () => {
      const res = await request(app)
        .get('/api/tickets/my')
        .set('Cookie', panitiaCookie());

      expect(res.status).toBe(403);
    });

    it('returns 200 with tickets belonging to the authenticated participant', async () => {
      const tickets = [
        {
          id: TICKET_ID,
          ticketCode: TICKET_CODE,
          userId: PARTICIPANT_ID,
          tierId: TIER_ID,
          status: TicketStatus.VALID,
          checkedInAt: null,
          createdAt: '2026-11-25T01:00:00.000Z',
          tier: {
            id: TIER_ID,
            eventId: EVENT_ID,
            name: 'VIP Pass',
            price: 100000,
            totalQuota: 10,
            remainingQuota: 9,
            event: {
              id: EVENT_ID,
              title: 'TechFest 2026',
              description: 'Annual campus tech event.',
              eventDate: '2026-12-10T09:00:00.000Z',
              location: 'Auditorium A',
            },
          },
        },
      ];
      mockPrisma.ticket.findMany.mockResolvedValue(tickets);

      const res = await request(app)
        .get('/api/tickets/my')
        .set('Cookie', participantCookie());

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        status: 'success',
        data: { tickets },
      });
      expect(mockPrisma.ticket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: PARTICIPANT_ID },
        }),
      );
    });
  });

  describe('POST /api/tickets/checkin', () => {
    it('returns 401 when unauthenticated', async () => {
      const res = await request(app)
        .post('/api/tickets/checkin')
        .send({ ticketCode: TICKET_CODE });

      expect(res.status).toBe(401);
    });

    it('returns 403 when authenticated as PARTICIPANT (PANITIA only)', async () => {
      const res = await request(app)
        .post('/api/tickets/checkin')
        .set('Cookie', participantCookie())
        .send({ ticketCode: TICKET_CODE });

      expect(res.status).toBe(403);
      expect(res.body.message).toBe('Forbidden: insufficient permissions');
    });

    it('returns 400 when ticketCode is not a valid UUID', async () => {
      const res = await request(app)
        .post('/api/tickets/checkin')
        .set('Cookie', panitiaCookie())
        .send({ ticketCode: 'not-a-uuid' });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Validation failed');
      expect(mockPrisma.ticket.updateMany).not.toHaveBeenCalled();
    });

    it('returns 200 on first valid scan using atomic updateMany', async () => {
      const checkedInAt = new Date('2026-11-25T02:00:00.000Z');
      mockPrisma.ticket.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.ticket.findUnique.mockResolvedValue({
        id: TICKET_ID,
        ticketCode: TICKET_CODE,
        userId: PARTICIPANT_ID,
        tierId: TIER_ID,
        status: TicketStatus.USED,
        checkedInAt,
        createdAt: new Date('2026-11-25T01:00:00.000Z'),
        user: {
          id: PARTICIPANT_ID,
          name: 'Budi Santoso',
          email: 'budi@kampus.ac.id',
        },
        tier: {
          id: TIER_ID,
          name: 'VIP Pass',
          event: {
            id: EVENT_ID,
            title: 'TechFest 2026',
            eventDate: new Date('2026-12-10T09:00:00.000Z'),
            location: 'Auditorium A',
          },
        },
      });

      const res = await request(app)
        .post('/api/tickets/checkin')
        .set('Cookie', panitiaCookie())
        .send({ ticketCode: TICKET_CODE });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.ticket.status).toBe(TicketStatus.USED);
      expect(mockPrisma.ticket.updateMany).toHaveBeenCalledWith({
        where: {
          ticketCode: TICKET_CODE,
          status: TicketStatus.VALID,
        },
        data: {
          status: TicketStatus.USED,
          checkedInAt: expect.any(Date),
        },
      });
    });

    it('returns 409 Ticket already used when updateMany matches 0 rows and ticket is USED', async () => {
      mockPrisma.ticket.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.ticket.findUnique.mockResolvedValue({ status: TicketStatus.USED });

      const res = await request(app)
        .post('/api/tickets/checkin')
        .set('Cookie', panitiaCookie())
        .send({ ticketCode: TICKET_CODE });

      expect(res.status).toBe(409);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Ticket already used');
    });

    it('returns 409 when updateMany matches 0 rows and ticket does not exist or is CANCELLED', async () => {
      mockPrisma.ticket.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.ticket.findUnique.mockResolvedValue(null);

      const missingRes = await request(app)
        .post('/api/tickets/checkin')
        .set('Cookie', panitiaCookie())
        .send({ ticketCode: TICKET_CODE });

      expect(missingRes.status).toBe(409);
      expect(missingRes.body.status).toBe('error');

      mockPrisma.ticket.findUnique.mockResolvedValue({ status: TicketStatus.CANCELLED });

      const cancelledRes = await request(app)
        .post('/api/tickets/checkin')
        .set('Cookie', panitiaCookie())
        .send({ ticketCode: TICKET_CODE });

      expect(cancelledRes.status).toBe(409);
      expect(cancelledRes.body.message).toBe('Ticket is cancelled');
    });
  });

  describe('Swagger Docs Coverage for Phase 3', () => {
    it('GET /api/docs.json documents all Phase 3 ticket endpoints', async () => {
      const res = await request(app).get('/api/docs.json');

      expect(res.status).toBe(200);
      expect(Object.keys(res.body.paths)).toEqual(
        expect.arrayContaining([
          '/api/tickets/book',
          '/api/tickets/my',
          '/api/tickets/checkin',
        ]),
      );
    });
  });
});
