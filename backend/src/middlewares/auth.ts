import { Role } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/appError';
import { AUTH_COOKIE_NAME, AuthPayload, verifyAuthToken } from '../utils/jwt';

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const token = req.cookies?.[AUTH_COOKIE_NAME];

  if (typeof token !== 'string' || token.length === 0) {
    next(new AppError(401, 'Authentication required'));
    return;
  }

  try {
    req.user = verifyAuthToken(token);
    next();
  } catch {
    next(new AppError(401, 'Invalid or expired authentication token'));
  }
}

export function authorizeRole(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError(401, 'Authentication required'));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(new AppError(403, 'Forbidden: insufficient permissions'));
      return;
    }

    next();
  };
}
