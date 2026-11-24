import { NextFunction, Request, Response } from 'express';
import { AnyZodObject } from 'zod';

export const validateRequest =
  (schema: AnyZodObject) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!result.success) {
      res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: result.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      });
      return;
    }

    if (result.data.body !== undefined) {
      req.body = result.data.body;
    }
    if (result.data.params !== undefined) {
      req.params = result.data.params;
    }
    if (result.data.query !== undefined) {
      req.query = result.data.query;
    }

    next();
  };
