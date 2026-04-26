import { beforeEach, describe, expect, it, vi } from 'vitest';
import { expenseRepository } from '../../src/repositories/expenseRepo.js';
import { expenseService } from '../../src/services/expenseService.js';
import type { Expense } from '../../src/types/index.js';

describe('expenseService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns stored response for duplicate idempotency key', () => {
    const existing: Expense = {
      id: 'exp-existing',
      amount: 1999,
      category: 'food',
      description: 'Sandwich',
      date: '2026-04-26',
      created_at: '2026-04-26 10:00:00',
    };

    vi.spyOn(expenseRepository, 'findIdempotencyKey').mockReturnValue({
      expense: existing,
    });
    const createSpy = vi.spyOn(expenseRepository, 'create');

    const result = expenseService.createExpense(
      {
        amount: 1999,
        category: 'Food',
        description: 'Sandwich',
        date: '2026-04-26',
      },
      '550e8400-e29b-41d4-a716-446655440000'
    );

    expect(result).toEqual(existing);
    expect(createSpy).not.toHaveBeenCalled();
  });

  it('creates normalized expense and stores idempotency response', () => {
    vi.spyOn(expenseRepository, 'findIdempotencyKey').mockReturnValue(null);

    const createSpy = vi
      .spyOn(expenseRepository, 'create')
      .mockImplementation((expense): Expense => ({
        ...expense,
        created_at: '2026-04-25 09:00:00',
      }));
    const saveKeySpy = vi
      .spyOn(expenseRepository, 'saveIdempotencyKey')
      .mockImplementation(() => undefined);

    const result = expenseService.createExpense(
      {
        amount: 2500,
        category: '  TRAVEL  ',
        description: '  Metro  ',
        date: '2026-04-25',
      },
      '550e8400-e29b-41d4-a716-446655440000'
    );

    const createArg = createSpy.mock.calls[0][0];
    expect(createArg).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        amount: 2500,
        category: 'travel',
        description: 'Metro',
        date: '2026-04-25',
      })
    );
    expect(createArg.id.length).toBeGreaterThan(10);
    expect(saveKeySpy).toHaveBeenCalledWith(
      '550e8400-e29b-41d4-a716-446655440000',
      { expense: result }
    );
    expect(result).toEqual(
      expect.objectContaining({
        amount: 2500,
        category: 'travel',
        description: 'Metro',
      })
    );
  });

  it('delegates expense retrieval and cleanup to repository', () => {
    const listSpy = vi.spyOn(expenseRepository, 'findAll').mockReturnValue([]);
    const cleanupSpy = vi
      .spyOn(expenseRepository, 'cleanupExpiredKeys')
      .mockReturnValue(3);

    const expenses = expenseService.getExpenses({ sort: 'date_desc' });
    const cleaned = expenseService.cleanupExpiredIdempotencyKeys(12);

    expect(listSpy).toHaveBeenCalledWith({ sort: 'date_desc' });
    expect(expenses).toEqual([]);
    expect(cleanupSpy).toHaveBeenCalledWith(12);
    expect(cleaned).toBe(3);
  });
});
