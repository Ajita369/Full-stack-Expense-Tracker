import { randomUUID } from 'node:crypto';
import { expenseRepository } from '../repositories/expenseRepo.js';
import { CreateExpenseDTO, Expense, ExpenseFilters } from '../types/index.js';

export class ExpenseService {
  createExpense(dto: CreateExpenseDTO, idempotencyKey?: string): Expense {
    if (idempotencyKey) {
      const existing = expenseRepository.findIdempotencyKey(idempotencyKey);
      if (existing) {
        return existing.expense;
      }
    }

    const expenseToCreate: Expense = {
      id: randomUUID(),
      amount: dto.amount,
      category: dto.category.trim().toLowerCase(),
      description: dto.description.trim(),
      date: dto.date,
      created_at: '',
    };

    const created = expenseRepository.create(expenseToCreate);

    if (idempotencyKey) {
      expenseRepository.saveIdempotencyKey(idempotencyKey, { expense: created });
    }

    return created;
  }

  getExpenses(filters: ExpenseFilters): Expense[] {
    return expenseRepository.findAll(filters);
  }

  cleanupExpiredIdempotencyKeys(hoursToKeep = 24): number {
    return expenseRepository.cleanupExpiredKeys(hoursToKeep);
  }
}

export const expenseService = new ExpenseService();
