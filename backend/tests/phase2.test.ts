import { Role } from '@prisma/client';
import bcrypt from 'bcrypt';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockPrisma = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
  event: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
  },
  ticketTier: {
    create: vi.fn(),
  },
  $disconnect: vi.fn(),
}));

vi.mock('../src/config/prisma', () => ({
  prisma: mockPrisma,
}));

import app from '../src/app';
import { AUTH_COOKIE_NAME, signAuthToken } from '../src/utils/jwt';

const SAMPLE_USER_ID = '11111111-1111-4111-8111-111111111111';
const SAMPLE_PANITIA_ID = '22222222-2222-4222-8222-222222222222';
const SAMPLE_EVENT_ID = '33333333-3333-4333-8333-333333333333';
const SAMPLE_TIER_ID = '44444444-4444-4444-8444-444444444444';

function getSetCookies(res: request.Response): string[] {
  const header = res.headers['set-cookie'];
  if (!header) return [];
  return Array.isArray(header) ? header : [header];
}

describe('TixFlow Phase 2 API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Health & Swagger Docs', () => {
    it('GET /api/health returns 200 ok', async () => {
      const res = await request(app).get('/api/health');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        status: 'ok',
        service: 'tixflow-backend',
      });
    });

    it('GET /api/docs/ serves Swagger UI HTML', async () => {
      const res = await request(app).get('/api/docs/');

      expect(res.status).toBe(200);
      expect(res.text).toContain('Swagger UI');
    });

    it('GET /api/docs.json returns OpenAPI 3.0.3 spec with Phase 2 paths and cookieAuth', async () => {
      const res = await request(app).get('/api/docs.json');

      expect(res.status).toBe(200);
      expect(res.body.openapi).toBe('3.0.3');
      expect(res.body.components.securitySchemes.cookieAuth).toEqual({
        type: 'apiKey',
        in: 'cookie',
        name: AUTH_COOKIE_NAME,
        description: expect.any(String),
      });
      expect(Object.keys(res.body.paths)).toEqual(
        expect.arrayContaining([
          '/api/health',
          '/api/auth/register',
          '/api/auth/login',
          '/api/auth/logout',
          '/api/auth/me',
          '/api/events',
          '/api/events/{id}',
          '/api/events/{id}/tiers',
        ]),
      );
    });
  });

  describe('Auth Endpoints (/api/auth/*)', () => {
    it('POST /api/auth/register returns 400 on invalid input', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'A',
        email: 'not-an-email',
        password: 'short',
      });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Validation failed');
      expect(res.body.errors.length).toBeGreaterThanOrEqual(3);
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });

    it('POST /api/auth/register creates PARTICIPANT user, forces role, sets HttpOnly cookie, and omits passwordHash', async () => {
      const now = new Date('2026-11-25T00:00:00.000Z');
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: SAMPLE_USER_ID,
        name: 'Budi Santoso',
        email: 'budi@kampus.ac.id',
        role: Role.PARTICIPANT,
        createdAt: now,
      });

      const res = await request(app).post('/api/auth/register').send({
        name: 'Budi Santoso',
        email: 'Budi@Kampus.ac.id',
        password: 'password123',
        role: 'PANITIA',
      });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.user).toEqual({
        id: SAMPLE_USER_ID,
        name: 'Budi Santoso',
        email: 'budi@kampus.ac.id',
        role: Role.PARTICIPANT,
        createdAt: now.toISOString(),
      });
      expect(res.body.data.user.passwordHash).toBeUndefined();

      expect(mockPrisma.user.create).toHaveBeenCalledTimes(1);
      const createArg = mockPrisma.user.create.mock.calls[0][0];
      expect(createArg.data.role).toBe(Role.PARTICIPANT);
      expect(createArg.data.email).toBe('budi@kampus.ac.id');
      expect(await bcrypt.compare('password123', createArg.data.passwordHash)).toBe(true);

      const cookies = getSetCookies(res);
      expect(cookies.some((c) => c.startsWith(`${AUTH_COOKIE_NAME}=`) && c.includes('HttpOnly'))).toBe(true);
    });

    it('POST /api/auth/register returns 409 when email already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: SAMPLE_USER_ID });

      const res = await request(app).post('/api/auth/register').send({
        name: 'Budi Santoso',
        email: 'budi@kampus.ac.id',
        password: 'password123',
      });

      expect(res.status).toBe(409);
      expect(res.body).toEqual({
        status: 'error',
        message: 'Email is already registered',
      });
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });

    it('POST /api/auth/login returns 401 when password is wrong', async () => {
      const passwordHash = await bcrypt.hash('correct-password', 10);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: SAMPLE_USER_ID,
        name: 'Budi Santoso',
        email: 'budi@kampus.ac.id',
        role: Role.PARTICIPANT,
        createdAt: new Date(),
        passwordHash,
      });

      const res = await request(app).post('/api/auth/login').send({
        email: 'budi@kampus.ac.id',
        password: 'wrong-password',
      });

      expect(res.status).toBe(401);
      expect(res.body).toEqual({
        status: 'error',
        message: 'Invalid email or password',
      });
      expect(getSetCookies(res)).toHaveLength(0);
    });

    it('POST /api/auth/login returns 200 and sets HttpOnly JWT cookie on valid credentials', async () => {
      const now = new Date('2026-11-25T00:00:00.000Z');
      const passwordHash = await bcrypt.hash('password123', 10);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: SAMPLE_USER_ID,
        name: 'Budi Santoso',
        email: 'budi@kampus.ac.id',
        role: Role.PARTICIPANT,
        createdAt: now,
        passwordHash,
      });

      const res = await request(app).post('/api/auth/login').send({
        email: 'budi@kampus.ac.id',
        password: 'password123',
      });

      expect(res.status).toBe(200);
      expect(res.body.data.user).toEqual({
        id: SAMPLE_USER_ID,
        name: 'Budi Santoso',
        email: 'budi@kampus.ac.id',
        role: Role.PARTICIPANT,
        createdAt: now.toISOString(),
      });
      expect(res.body.data.user.passwordHash).toBeUndefined();

      const cookies = getSetCookies(res);
      expect(cookies.some((c) => c.startsWith(`${AUTH_COOKIE_NAME}=`) && c.includes('HttpOnly'))).toBe(true);
    });

    it('GET /api/auth/me returns 401 without cookie and with invalid token', async () => {
      const noCookieRes = await request(app).get('/api/auth/me');
      expect(noCookieRes.status).toBe(401);

      const badCookieRes = await request(app)
        .get('/api/auth/me')
        .set('Cookie', `${AUTH_COOKIE_NAME}=not.a.valid.jwt`);
      expect(badCookieRes.status).toBe(401);
    });

    it('GET /api/auth/me returns 200 with user profile when authenticated', async () => {
      const now = new Date('2026-11-25T00:00:00.000Z');
      const token = signAuthToken({
        userId: SAMPLE_USER_ID,
        email: 'budi@kampus.ac.id',
        role: Role.PARTICIPANT,
      });
      mockPrisma.user.findUnique.mockResolvedValue({
        id: SAMPLE_USER_ID,
        name: 'Budi Santoso',
        email: 'budi@kampus.ac.id',
        role: Role.PARTICIPANT,
        createdAt: now,
      });

      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', `${AUTH_COOKIE_NAME}=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe('budi@kampus.ac.id');
    });

    it('POST /api/auth/logout clears the session cookie', async () => {
      const res = await request(app).post('/api/auth/logout');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        status: 'success',
        message: 'Logged out successfully',
      });
      const cookies = getSetCookies(res);
      expect(cookies.some((c) => c.startsWith(`${AUTH_COOKIE_NAME}=;`) && c.includes('HttpOnly'))).toBe(true);
    });
  });

  describe('Event Endpoints (/api/events/*) & RBAC', () => {
    it('GET /api/events is publicly accessible', async () => {
      mockPrisma.event.findMany.mockResolvedValue([
        {
          id: SAMPLE_EVENT_ID,
          title: 'TechFest 2026',
          description: 'Annual campus engineering summit.',
          eventDate: '2026-12-10T09:00:00.000Z',
          location: 'Auditorium A',
          createdBy: SAMPLE_PANITIA_ID,
          creator: { id: SAMPLE_PANITIA_ID, name: 'Panitia BEM', email: 'panitia@kampus.ac.id' },
          ticketTiers: [],
        },
      ]);

      const res = await request(app).get('/api/events');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.events).toHaveLength(1);
    });

    it('GET /api/events/:id returns 400 for non-UUID id and 404 when missing', async () => {
      const invalidIdRes = await request(app).get('/api/events/not-a-uuid');
      expect(invalidIdRes.status).toBe(400);
      expect(invalidIdRes.body.message).toBe('Validation failed');

      mockPrisma.event.findUnique.mockResolvedValue(null);
      const missingRes = await request(app).get(`/api/events/${SAMPLE_EVENT_ID}`);
      expect(missingRes.status).toBe(404);
      expect(missingRes.body.message).toBe('Event not found');
    });

    it('GET /api/events/:id returns 200 when event exists', async () => {
      mockPrisma.event.findUnique.mockResolvedValue({
        id: SAMPLE_EVENT_ID,
        title: 'TechFest 2026',
        description: 'Annual campus engineering summit.',
        eventDate: '2026-12-10T09:00:00.000Z',
        location: 'Auditorium A',
        createdBy: SAMPLE_PANITIA_ID,
        creator: { id: SAMPLE_PANITIA_ID, name: 'Panitia BEM', email: 'panitia@kampus.ac.id' },
        ticketTiers: [],
      });

      const res = await request(app).get(`/api/events/${SAMPLE_EVENT_ID}`);

      expect(res.status).toBe(200);
      expect(res.body.data.event.id).toBe(SAMPLE_EVENT_ID);
    });

    it('POST /api/events enforces authentication (401) and PANITIA RBAC (403 for PARTICIPANT)', async () => {
      const unauthRes = await request(app).post('/api/events').send({});
      expect(unauthRes.status).toBe(401);

      const participantToken = signAuthToken({
        userId: SAMPLE_USER_ID,
        email: 'budi@kampus.ac.id',
        role: Role.PARTICIPANT,
      });

      const forbiddenRes = await request(app)
        .post('/api/events')
        .set('Cookie', `${AUTH_COOKIE_NAME}=${participantToken}`)
        .send({
          title: 'TechFest 2026',
          description: 'Annual campus engineering summit.',
          eventDate: '2026-12-10T09:00:00.000Z',
          location: 'Auditorium A',
        });

      expect(forbiddenRes.status).toBe(403);
      expect(forbiddenRes.body.message).toBe('Forbidden: insufficient permissions');
    });

    it('POST /api/events validates body (400) and creates event (201) for PANITIA', async () => {
      const panitiaToken = signAuthToken({
        userId: SAMPLE_PANITIA_ID,
        email: 'panitia@kampus.ac.id',
        role: Role.PANITIA,
      });

      const invalidRes = await request(app)
        .post('/api/events')
        .set('Cookie', `${AUTH_COOKIE_NAME}=${panitiaToken}`)
        .send({
          title: 'Hi',
          description: 'short',
          eventDate: 'invalid-date',
          location: 'A',
        });

      expect(invalidRes.status).toBe(400);

      mockPrisma.event.create.mockResolvedValue({
        id: SAMPLE_EVENT_ID,
        title: 'TechFest 2026',
        description: 'Annual campus engineering summit.',
        eventDate: new Date('2026-12-10T09:00:00.000Z'),
        location: 'Auditorium A',
        createdBy: SAMPLE_PANITIA_ID,
        creator: { id: SAMPLE_PANITIA_ID, name: 'Panitia BEM', email: 'panitia@kampus.ac.id' },
        ticketTiers: [],
      });

      const validRes = await request(app)
        .post('/api/events')
        .set('Cookie', `${AUTH_COOKIE_NAME}=${panitiaToken}`)
        .send({
          title: 'TechFest 2026',
          description: 'Annual campus engineering summit.',
          eventDate: '2026-12-10T09:00:00.000Z',
          location: 'Auditorium A',
        });

      expect(validRes.status).toBe(201);
      expect(validRes.body.data.event.id).toBe(SAMPLE_EVENT_ID);
      expect(mockPrisma.event.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            createdBy: SAMPLE_PANITIA_ID,
            eventDate: expect.any(Date),
          }),
        }),
      );
    });

    it('POST /api/events/:id/tiers enforces RBAC, UUID validation, 404 on missing event, and creates tier (201)', async () => {
      const participantToken = signAuthToken({
        userId: SAMPLE_USER_ID,
        email: 'budi@kampus.ac.id',
        role: Role.PARTICIPANT,
      });
      const panitiaToken = signAuthToken({
        userId: SAMPLE_PANITIA_ID,
        email: 'panitia@kampus.ac.id',
        role: Role.PANITIA,
      });

      const unauthRes = await request(app)
        .post(`/api/events/${SAMPLE_EVENT_ID}/tiers`)
        .send({ name: 'VIP', price: 100000, totalQuota: 20 });
      expect(unauthRes.status).toBe(401);

      const forbiddenRes = await request(app)
        .post(`/api/events/${SAMPLE_EVENT_ID}/tiers`)
        .set('Cookie', `${AUTH_COOKIE_NAME}=${participantToken}`)
        .send({ name: 'VIP', price: 100000, totalQuota: 20 });
      expect(forbiddenRes.status).toBe(403);

      const invalidUuidRes = await request(app)
        .post('/api/events/bad-id/tiers')
        .set('Cookie', `${AUTH_COOKIE_NAME}=${panitiaToken}`)
        .send({ name: 'VIP', price: 100000, totalQuota: 20 });
      expect(invalidUuidRes.status).toBe(400);

      mockPrisma.event.findUnique.mockResolvedValue(null);
      const missingEventRes = await request(app)
        .post(`/api/events/${SAMPLE_EVENT_ID}/tiers`)
        .set('Cookie', `${AUTH_COOKIE_NAME}=${panitiaToken}`)
        .send({ name: 'VIP', price: 100000, totalQuota: 20 });
      expect(missingEventRes.status).toBe(404);

      mockPrisma.event.findUnique.mockResolvedValue({ id: SAMPLE_EVENT_ID });
      mockPrisma.ticketTier.create.mockResolvedValue({
        id: SAMPLE_TIER_ID,
        eventId: SAMPLE_EVENT_ID,
        name: 'VIP Pass',
        price: 150000,
        totalQuota: 50,
        remainingQuota: 50,
      });

      const validRes = await request(app)
        .post(`/api/events/${SAMPLE_EVENT_ID}/tiers`)
        .set('Cookie', `${AUTH_COOKIE_NAME}=${panitiaToken}`)
        .send({ name: 'VIP Pass', price: 150000, totalQuota: 50 });

      expect(validRes.status).toBe(201);
      expect(validRes.body.data.tier).toEqual({
        id: SAMPLE_TIER_ID,
        eventId: SAMPLE_EVENT_ID,
        name: 'VIP Pass',
        price: 150000,
        totalQuota: 50,
        remainingQuota: 50,
      });
      expect(mockPrisma.ticketTier.create).toHaveBeenCalledWith({
        data: {
          eventId: SAMPLE_EVENT_ID,
          name: 'VIP Pass',
          price: 150000,
          totalQuota: 50,
          remainingQuota: 50,
        },
      });
    });
  });
});
