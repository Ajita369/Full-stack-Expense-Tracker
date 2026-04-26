import { z } from 'zod';

const MAX_PAISE_AMOUNT = 10_000_000_000;

function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    return false;
  }

  return parsed.toISOString().slice(0, 10) === value;
}

function isReasonableDate(value: string): boolean {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  const now = new Date();

  // Allow up to 1 day in the future to avoid timezone-edge client submissions.
  const oneDayAhead = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  return parsed <= oneDayAhead;
}

export const createExpenseSchema = z.object({
  amount: z
    .number({ error: 'amount must be a number in paise' })
    .int('amount must be an integer in paise')
    .positive('amount must be greater than zero')
    .max(MAX_PAISE_AMOUNT, `amount cannot exceed ${MAX_PAISE_AMOUNT} paise`),
  category: z
    .string({ error: 'category is required' })
    .trim()
    .min(1, 'category is required')
    .max(80, 'category must be at most 80 characters')
    .transform((value) => value.toLowerCase()),
  description: z
    .string({ error: 'description is required' })
    .trim()
    .min(1, 'description is required')
    .max(300, 'description must be at most 300 characters'),
  date: z
    .string({ error: 'date is required' })
    .trim()
    .refine((value) => isValidIsoDate(value), 'date must be in YYYY-MM-DD format')
    .refine((value) => isReasonableDate(value), 'date cannot be unreasonably in the future'),
});

export const updateExpenseSchema = createExpenseSchema;

export const expenseIdParamSchema = z.object({
  id: z.uuid({ error: 'expense id must be a valid UUID' }),
});

export const getExpensesQuerySchema = z.object({
  category: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .transform((value) => value.toLowerCase())
    .optional(),
  sort: z.enum(['date_desc']).optional().default('date_desc'),
});
