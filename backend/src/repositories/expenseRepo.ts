import { getDb } from '../db/connection.js';
import {
  Expense,
  ExpenseFilters,
  StoredIdempotencyResponse,
  UpdateExpenseDTO,
} from '../types/index.js';

interface IdempotencyRow {
  key: string;
  response_body: string;
  created_at: string;
}

export class ExpenseRepository {
  create(expense: Expense): Expense {
    const db = getDb();

    const insert = db.prepare(
      `INSERT INTO expenses (id, amount, category, description, date)
       VALUES (?, ?, ?, ?, ?)`
    );

    insert.run(
      expense.id,
      expense.amount,
      expense.category,
      expense.description,
      expense.date
    );

    const created = this.findById(expense.id);
    if (!created) {
      throw new Error('Failed to load newly created expense');
    }

    return created;
  }

  findAll(filters: ExpenseFilters): Expense[] {
    const db = getDb();
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (filters.category) {
      conditions.push('category = ?');
      params.push(filters.category);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const orderByClause = 'ORDER BY date DESC, created_at DESC';

    const query = `SELECT id, amount, category, description, date, created_at FROM expenses ${whereClause} ${orderByClause}`;
    const statement = db.prepare(query);

    return statement.all(...params) as Expense[];
  }

  findById(id: string): Expense | null {
    const db = getDb();
    const statement = db.prepare(
      `SELECT id, amount, category, description, date, created_at
       FROM expenses
       WHERE id = ?`
    );
    const row = statement.get(id) as Expense | undefined;

    return row ?? null;
  }

  updateById(id: string, dto: UpdateExpenseDTO): Expense | null {
    const db = getDb();
    const statement = db.prepare(
      `UPDATE expenses
       SET amount = ?, category = ?, description = ?, date = ?
       WHERE id = ?`
    );

    const result = statement.run(
      dto.amount,
      dto.category,
      dto.description,
      dto.date,
      id
    );

    if (result.changes === 0) {
      return null;
    }

    return this.findById(id);
  }

  deleteById(id: string): boolean {
    const db = getDb();
    const statement = db.prepare('DELETE FROM expenses WHERE id = ?');
    const result = statement.run(id);

    return result.changes > 0;
  }

  findIdempotencyKey(key: string): StoredIdempotencyResponse | null {
    const db = getDb();
    const statement = db.prepare(
      `SELECT key, response_body, created_at
       FROM idempotency_keys
       WHERE key = ?`
    );

    const row = statement.get(key) as IdempotencyRow | undefined;
    if (!row) {
      return null;
    }

    return JSON.parse(row.response_body) as StoredIdempotencyResponse;
  }

  saveIdempotencyKey(key: string, response: StoredIdempotencyResponse): void {
    const db = getDb();
    const statement = db.prepare(
      `INSERT OR REPLACE INTO idempotency_keys (key, response_body)
       VALUES (?, ?)`
    );

    statement.run(key, JSON.stringify(response));
  }

  cleanupExpiredKeys(hoursToKeep = 24): number {
    const db = getDb();
    const statement = db.prepare(
      `DELETE FROM idempotency_keys
       WHERE datetime(created_at) < datetime('now', ?)`
    );

    const result = statement.run(`-${hoursToKeep} hours`);
    return result.changes;
  }
}

export const expenseRepository = new ExpenseRepository();
