import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: 'Route not found' });
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof SyntaxError && 'status' in err) {
    const status = Number((err as { status: unknown }).status);
    if (status === 400) {
      res.status(400).json({ error: 'Malformed JSON request body' });
      return;
    }
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Validation failed',
      details: err.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });
    return;
  }

  if (err instanceof Error && 'statusCode' in err) {
    const statusCode = Number((err as { statusCode: unknown }).statusCode);
    if (Number.isInteger(statusCode) && statusCode >= 400 && statusCode < 600) {
      res.status(statusCode).json({ error: err.message });
      return;
    }
  }

  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
}
