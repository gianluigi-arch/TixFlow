import { Role } from '@prisma/client';
import { Router } from 'express';
import {
  createEvent,
  createTier,
  getEventById,
  listEvents,
} from '../controllers/event.controller';
import { authenticate, authorizeRole } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validate';
import {
  createEventSchema,
  createTierSchema,
  eventIdParamSchema,
} from '../schemas/event.schema';

const router = Router();

router.get('/', listEvents);
router.get('/:id', validateRequest(eventIdParamSchema), getEventById);
router.post(
  '/',
  authenticate,
  authorizeRole(Role.PANITIA),
  validateRequest(createEventSchema),
  createEvent,
);
router.post(
  '/:id/tiers',
  authenticate,
  authorizeRole(Role.PANITIA),
  validateRequest(createTierSchema),
  createTier,
);

export default router;
