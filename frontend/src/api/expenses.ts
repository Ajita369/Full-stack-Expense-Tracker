import type { CreateExpenseInput, Expense, ExpenseFilters } from '../types';

const API_BASE = '/api/expenses';

interface ErrorPayload {
  error?: string;
  details?: unknown;
}

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

async function buildApiError(response: Response): Promise<ApiError> {
  let message = `Request failed with status ${response.status}`;
  let details: unknown;

  try {
    const payload = (await response.json()) as ErrorPayload;
    if (typeof payload.error === 'string' && payload.error.trim().length > 0) {
      message = payload.error;
    }
    details = payload.details;
  } catch {
    // Keep fallback message when error body is missing or non-JSON.
  }

  return new ApiError(message, response.status, details);
}

export async function createExpense(
  data: CreateExpenseInput,
  idempotencyKey: string
): Promise<Expense> {
  let response: Response;

  try {
    response = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(data),
    });
  } catch {
    throw new ApiError('Network error. Please check your connection and try again.', 0);
  }

  if (!response.ok) {
    throw await buildApiError(response);
  }

  return (await response.json()) as Expense;
}

export async function getExpenses(filters: ExpenseFilters): Promise<Expense[]> {
  const params = new URLSearchParams();

  if (filters.category) {
    params.set('category', filters.category);
  }
  if (filters.sort) {
    params.set('sort', filters.sort);
  }

  const queryString = params.toString();
  const url = queryString.length > 0 ? `${API_BASE}?${queryString}` : API_BASE;

  let response: Response;

  try {
    response = await fetch(url);
  } catch {
    throw new ApiError('Network error. Please check your connection and try again.', 0);
  }

  if (!response.ok) {
    throw await buildApiError(response);
  }

  return (await response.json()) as Expense[];
}
