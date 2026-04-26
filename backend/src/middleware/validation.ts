import { NextFunction, Request, Response } from 'express';
import { ZodType } from 'zod';

export function validate(
  schema: ZodType,
  source: 'body' | 'query' = 'body'
) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const parseResult = schema.safeParse(req[source]);

    if (!parseResult.success) {
      next(parseResult.error);
      return;
    }

    if (source === 'body') {
      req.body = parseResult.data;
    } else {
      Object.assign(req.query, parseResult.data as Request['query']);
    }

    next();
  };
}
