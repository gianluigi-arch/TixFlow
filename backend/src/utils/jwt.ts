import { Role } from '@prisma/client';
import { CookieOptions } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export const AUTH_COOKIE_NAME = 'tixflow_token';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export interface AuthPayload {
  userId: string;
  email: string;
  role: Role;
}

export function signAuthToken(payload: AuthPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

export function verifyAuthToken(token: string): AuthPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET);

  if (
    typeof decoded !== 'object' ||
    decoded === null ||
    typeof decoded.userId !== 'string' ||
    typeof decoded.email !== 'string' ||
    (decoded.role !== Role.PARTICIPANT && decoded.role !== Role.PANITIA)
  ) {
    throw new Error('Invalid token payload');
  }

  return {
    userId: decoded.userId,
    email: decoded.email,
    role: decoded.role,
  };
}

function isCookieSecure(): boolean {
  if (env.COOKIE_SECURE !== undefined) {
    return env.COOKIE_SECURE === 'true';
  }
  return env.NODE_ENV === 'production';
}

export function getAuthCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: isCookieSecure(),
    sameSite: 'lax',
    path: '/',
    maxAge: SEVEN_DAYS_MS,
  };
}

export function getClearCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: isCookieSecure(),
    sameSite: 'lax',
    path: '/',
  };
}
