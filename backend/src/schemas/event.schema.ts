import { z } from 'zod';

export const eventIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid event ID format'),
  }),
});

export const createEventSchema = z.object({
  body: z.object({
    title: z
      .string()
      .trim()
      .min(3, 'Title must be at least 3 characters')
      .max(200, 'Title must be at most 200 characters'),
    description: z
      .string()
      .trim()
      .min(10, 'Description must be at least 10 characters')
      .max(5000, 'Description must be at most 5000 characters'),
    eventDate: z
      .string()
      .datetime({ offset: true, message: 'eventDate must be a valid ISO-8601 datetime' })
      .or(z.string().datetime({ message: 'eventDate must be a valid ISO-8601 datetime' }))
      .transform((value) => new Date(value)),
    location: z
      .string()
      .trim()
      .min(2, 'Location must be at least 2 characters')
      .max(255, 'Location must be at most 255 characters'),
  }),
});

export const createTierSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid event ID format'),
  }),
  body: z.object({
    name: z
      .string()
      .trim()
      .min(2, 'Tier name must be at least 2 characters')
      .max(100, 'Tier name must be at most 100 characters'),
    price: z
      .number()
      .int('Price must be an integer')
      .min(0, 'Price cannot be negative'),
    totalQuota: z
      .number()
      .int('Total quota must be an integer')
      .min(1, 'Total quota must be at least 1'),
  }),
});
