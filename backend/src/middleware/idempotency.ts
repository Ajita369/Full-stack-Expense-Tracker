import { NextFunction, Request, Response } from 'express';
import { expenseRepository } from '../repositories/expenseRepo.js';

type IdempotencyRequest = Request & {
  idempotencyKey?: string;
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

  const existing = expenseRepository.findIdempotencyKey(idempotencyKey);
  if (existing) {
    res.status(201).json(existing.expense);
    return;
  }

  (req as IdempotencyRequest).idempotencyKey = idempotencyKey;
  next();
}
