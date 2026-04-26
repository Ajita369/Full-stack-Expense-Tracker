import { NextFunction, Request, Response } from 'express';

export function idempotencyMiddleware(
  _req: Request,
  _res: Response,
  next: NextFunction
): void {
  next();
}
