import { afterEach, describe, expect, it, vi } from 'vitest';
import { createExpense, deleteExpense, getExpenses, updateExpense } from './expenses';
import type { CreateExpenseInput } from '../types';

const sampleExpense: CreateExpenseInput = {
  amount: 15075,
  category: 'food',
  description: 'Lunch',
  date: '2026-04-26',
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('expenses api client', () => {
  it('sends idempotency key when creating expense', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 'exp-1',
        ...sampleExpense,
        created_at: '2026-04-26 10:00:00',
      }),
    });

    vi.stubGlobal('fetch', fetchMock);

    await createExpense(sampleExpense, '550e8400-e29b-41d4-a716-446655440000');

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/expenses',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Idempotency-Key': '550e8400-e29b-41d4-a716-446655440000',
        }),
      })
    );
  });

  it('throws ApiError with server message on unsuccessful response', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Validation failed', details: [] }),
    });

    vi.stubGlobal('fetch', fetchMock);

    await expect(getExpenses({ sort: 'date_desc' })).rejects.toMatchObject({
      name: 'ApiError',
      message: 'Validation failed',
      status: 400,
    });
  });

  it('throws network ApiError when fetch fails', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('network down'));

    vi.stubGlobal('fetch', fetchMock);

    await expect(getExpenses({ sort: 'date_desc' })).rejects.toEqual(
      expect.objectContaining({
        name: 'ApiError',
        message: expect.any(String),
        status: 0,
      })
    );
  });

  it('builds query string from filters', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    });

    vi.stubGlobal('fetch', fetchMock);

    await getExpenses({ sort: 'date_desc', category: 'food' });

    expect(fetchMock).toHaveBeenCalledWith('/api/expenses?category=food&sort=date_desc');
  });

  it('updates an expense by id', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 'exp-1',
        amount: 18000,
        category: 'travel',
        description: 'Cab',
        date: '2026-04-26',
        created_at: '2026-04-26 10:00:00',
      }),
    });

    vi.stubGlobal('fetch', fetchMock);

    await updateExpense('exp-1', {
      amount: 18000,
      category: 'travel',
      description: 'Cab',
      date: '2026-04-26',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/expenses/exp-1',
      expect.objectContaining({
        method: 'PUT',
      })
    );
  });

  it('deletes an expense by id', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
    });

    vi.stubGlobal('fetch', fetchMock);

    await deleteExpense('exp-1');

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/expenses/exp-1',
      expect.objectContaining({ method: 'DELETE' })
    );
  });
});
