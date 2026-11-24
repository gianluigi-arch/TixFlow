import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { env } from '../config/env';
import { login, logout, me, register } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validate';
import { loginSchema, registerSchema } from '../schemas/auth.schema';

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.NODE_ENV === 'test',
  message: {
    status: 'error',
    message: 'Too many authentication attempts, please try again later',
  },
});

const router = Router();

router.post('/register', authRateLimiter, validateRequest(registerSchema), register);
router.post('/login', authRateLimiter, validateRequest(loginSchema), login);
router.post('/logout', logout);
router.get('/me', authenticate, me);

export default router;
