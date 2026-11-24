import { z } from 'zod';

export const bookTicketSchema = z.object({
  body: z.object({
    tierId: z.string().uuid('Invalid ticket tier ID format'),
  }),
});

export const checkinTicketSchema = z.object({
  body: z.object({
    ticketCode: z.string().uuid('Invalid ticket code format'),
  }),
});
