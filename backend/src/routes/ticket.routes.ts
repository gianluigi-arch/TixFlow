import { Role } from '@prisma/client';
import { Router } from 'express';
import {
  bookTicket,
  checkinTicket,
  getMyTickets,
} from '../controllers/ticket.controller';
import { authenticate, authorizeRole } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validate';
import {
  bookTicketSchema,
  checkinTicketSchema,
} from '../schemas/ticket.schema';

const router = Router();

router.post(
  '/book',
  authenticate,
  authorizeRole(Role.PARTICIPANT),
  validateRequest(bookTicketSchema),
  bookTicket,
);

router.get(
  '/my',
  authenticate,
  authorizeRole(Role.PARTICIPANT),
  getMyTickets,
);

router.post(
  '/checkin',
  authenticate,
  authorizeRole(Role.PANITIA),
  validateRequest(checkinTicketSchema),
  checkinTicket,
);

export default router;
