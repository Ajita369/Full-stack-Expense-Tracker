import { NextFunction, Request, Response } from 'express';

export function validate(
  _schema: unknown,
  _source: 'body' | 'query' = 'body'
) {
  return (_req: Request, _res: Response, next: NextFunction) => {
    next();
  };
}
