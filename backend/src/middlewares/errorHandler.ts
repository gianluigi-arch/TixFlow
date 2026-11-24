import { Prisma } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env';
import { AppError } from '../utils/appError';

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
  });
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
      ...(err.errors ? { errors: err.errors } : {}),
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: err.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    });
    return;
  }

  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({
      status: 'error',
      message: 'Invalid JSON payload',
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      res.status(409).json({
        status: 'error',
        message: 'Resource already exists',
      });
      return;
    }

    if (err.code === 'P2025') {
      res.status(404).json({
        status: 'error',
        message: 'Resource not found',
      });
      return;
    }
  }

  const message =
    env.NODE_ENV === 'production' || !(err instanceof Error)
      ? 'Internal server error'
      : err.message || 'Internal server error';

  res.status(500).json({
    status: 'error',
    message,
  });
}
