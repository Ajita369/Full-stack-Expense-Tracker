import { randomUUID } from 'node:crypto';
import { expenseRepository } from '../repositories/expenseRepo.js';
import {
  CreateExpenseDTO,
  Expense,
  ExpenseFilters,
  UpdateExpenseDTO,
} from '../types/index.js';

type HttpError = Error & {
  statusCode?: number;
};

function makeNotFoundError(message: string): HttpError {
  const error: HttpError = new Error(message);
  error.statusCode = 404;
  return error;
}

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

  updateExpense(id: string, dto: UpdateExpenseDTO): Expense {
    const updated = expenseRepository.updateById(id, {
      ...dto,
      category: dto.category.trim().toLowerCase(),
      description: dto.description.trim(),
    });

    if (!updated) {
      throw makeNotFoundError('Expense not found');
    }

    return updated;
  }

  deleteExpense(id: string): void {
    const deleted = expenseRepository.deleteById(id);
    if (!deleted) {
      throw makeNotFoundError('Expense not found');
    }
  }

  cleanupExpiredIdempotencyKeys(hoursToKeep = 24): number {
    return expenseRepository.cleanupExpiredKeys(hoursToKeep);
  }
}

export const expenseService = new ExpenseService();
