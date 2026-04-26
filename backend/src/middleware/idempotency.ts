import { NextFunction, Request, Response } from 'express';
import { expenseRepository } from '../repositories/expenseRepo.js';

const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type IdempotencyRequest = Request & {
  idempotencyKey?: string;
};

type HttpError = Error & {
  statusCode?: number;
};

export function idempotencyMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const idempotencyKey = req.header('Idempotency-Key')?.trim();

  if (!idempotencyKey) {
    next();
    return;
  }

  if (!UUID_V4_REGEX.test(idempotencyKey)) {
    const error: HttpError = new Error(
      'Idempotency-Key must be a valid UUID v4 string'
    );
    error.statusCode = 400;
    next(error);
    return;
  }

  const existing = expenseRepository.findIdempotencyKey(idempotencyKey);
  if (existing) {
    res.status(201).json(existing.expense);
    return;
  }

  (req as IdempotencyRequest).idempotencyKey = idempotencyKey;
  next();
}
