import { Role } from '@prisma/client';
import bcrypt from 'bcrypt';
import { NextFunction, Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/appError';
import {
  AUTH_COOKIE_NAME,
  getAuthCookieOptions,
  getClearCookieOptions,
  signAuthToken,
} from '../utils/jwt';

const BCRYPT_SALT_ROUNDS = 10;

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
} as const;

export async function register(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { name, email, password } = req.body as {
      name: string;
      email: string;
      password: string;
    };

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      throw new AppError(409, 'Email is already registered');
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    // Always force PARTICIPANT role on public registration to prevent privilege escalation
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: Role.PARTICIPANT,
      },
      select: publicUserSelect,
    });

    const token = signAuthToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    res.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions());
    res.status(201).json({
      status: 'success',
      data: { user },
    });
  } catch (err) {
    next(err);
  }
}

export async function login(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { email, password } = req.body as {
      email: string;
      password: string;
    };

    const userRecord = await prisma.user.findUnique({
      where: { email },
      select: {
        ...publicUserSelect,
        passwordHash: true,
      },
    });

    if (!userRecord) {
      throw new AppError(401, 'Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, userRecord.passwordHash);
    if (!isPasswordValid) {
      throw new AppError(401, 'Invalid email or password');
    }

    const user = {
      id: userRecord.id,
      name: userRecord.name,
      email: userRecord.email,
      role: userRecord.role,
      createdAt: userRecord.createdAt,
    };

    const token = signAuthToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    res.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions());
    res.status(200).json({
      status: 'success',
      data: { user },
    });
  } catch (err) {
    next(err);
  }
}

export function logout(_req: Request, res: Response): void {
  res.clearCookie(AUTH_COOKIE_NAME, getClearCookieOptions());
  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully',
  });
}

export async function me(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, 'Authentication required');
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: publicUserSelect,
    });

    if (!user) {
      throw new AppError(401, 'Authenticated user no longer exists');
    }

    res.status(200).json({
      status: 'success',
      data: { user },
    });
  } catch (err) {
    next(err);
  }
}
