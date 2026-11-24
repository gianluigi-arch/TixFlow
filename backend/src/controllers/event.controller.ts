import { NextFunction, Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/appError';

const eventInclude = {
  ticketTiers: {
    orderBy: { price: 'asc' },
  },
  creator: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
} as const;

export async function listEvents(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const events = await prisma.event.findMany({
      orderBy: { eventDate: 'asc' },
      include: eventInclude,
    });

    res.status(200).json({
      status: 'success',
      data: { events },
    });
  } catch (err) {
    next(err);
  }
}

export async function getEventById(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = req.params as { id: string };

    const event = await prisma.event.findUnique({
      where: { id },
      include: eventInclude,
    });

    if (!event) {
      throw new AppError(404, 'Event not found');
    }

    res.status(200).json({
      status: 'success',
      data: { event },
    });
  } catch (err) {
    next(err);
  }
}

export async function createEvent(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, 'Authentication required');
    }

    const { title, description, eventDate, location } = req.body as {
      title: string;
      description: string;
      eventDate: Date;
      location: string;
    };

    const event = await prisma.event.create({
      data: {
        title,
        description,
        eventDate,
        location,
        createdBy: req.user.userId,
      },
      include: eventInclude,
    });

    res.status(201).json({
      status: 'success',
      data: { event },
    });
  } catch (err) {
    next(err);
  }
}

export async function createTier(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = req.params as { id: string };
    const { name, price, totalQuota } = req.body as {
      name: string;
      price: number;
      totalQuota: number;
    };

    const event = await prisma.event.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!event) {
      throw new AppError(404, 'Event not found');
    }

    const tier = await prisma.ticketTier.create({
      data: {
        eventId: id,
        name,
        price,
        totalQuota,
        remainingQuota: totalQuota,
      },
    });

    res.status(201).json({
      status: 'success',
      data: { tier },
    });
  } catch (err) {
    next(err);
  }
}
