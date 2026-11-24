import { TicketStatus } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/appError';

interface LockedTierRow {
  id: string;
  remaining_quota: number;
}

export async function bookTicket(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, 'Authentication required');
    }

    const { tierId } = req.body as { tierId: string };
    const userId = req.user.userId;

    const ticket = await prisma.$transaction(async (tx) => {
      // Row-level pessimistic lock prevents concurrent overselling on the same tier
      const lockedTiers = await tx.$queryRaw<LockedTierRow[]>`
        SELECT id, remaining_quota FROM ticket_tiers WHERE id = ${tierId}::uuid FOR UPDATE
      `;

      if (lockedTiers.length === 0) {
        throw new AppError(404, 'Ticket tier not found');
      }

      if (lockedTiers[0].remaining_quota <= 0) {
        throw new AppError(409, 'Ticket quota is sold out');
      }

      await tx.ticketTier.update({
        where: { id: tierId },
        data: { remainingQuota: { decrement: 1 } },
      });

      return tx.ticket.create({
        data: {
          userId,
          tierId,
          status: TicketStatus.VALID,
        },
        include: {
          tier: {
            include: {
              event: {
                select: {
                  id: true,
                  title: true,
                  eventDate: true,
                  location: true,
                },
              },
            },
          },
        },
      });
    });

    res.status(201).json({
      status: 'success',
      data: { ticket },
    });
  } catch (err) {
    next(err);
  }
}

export async function getMyTickets(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, 'Authentication required');
    }

    const tickets = await prisma.ticket.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        tier: {
          include: {
            event: {
              select: {
                id: true,
                title: true,
                description: true,
                eventDate: true,
                location: true,
              },
            },
          },
        },
      },
    });

    res.status(200).json({
      status: 'success',
      data: { tickets },
    });
  } catch (err) {
    next(err);
  }
}

export async function checkinTicket(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { ticketCode } = req.body as { ticketCode: string };
    const checkedInAt = new Date();

    // Atomic status transition guarantees only one concurrent scan succeeds
    const updateResult = await prisma.ticket.updateMany({
      where: {
        ticketCode,
        status: TicketStatus.VALID,
      },
      data: {
        status: TicketStatus.USED,
        checkedInAt,
      },
    });

    if (updateResult.count === 0) {
      const existing = await prisma.ticket.findUnique({
        where: { ticketCode },
        select: { status: true },
      });

      if (existing?.status === TicketStatus.USED) {
        throw new AppError(409, 'Ticket already used');
      }
      if (existing?.status === TicketStatus.CANCELLED) {
        throw new AppError(409, 'Ticket is cancelled');
      }

      throw new AppError(409, 'Ticket not found or not valid for check-in');
    }

    const ticket = await prisma.ticket.findUnique({
      where: { ticketCode },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tier: {
          include: {
            event: {
              select: {
                id: true,
                title: true,
                eventDate: true,
                location: true,
              },
            },
          },
        },
      },
    });

    res.status(200).json({
      status: 'success',
      message: 'Ticket checked in successfully',
      data: { ticket },
    });
  } catch (err) {
    next(err);
  }
}
