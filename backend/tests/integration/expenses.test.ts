import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import app from '../../src/app.js';
import { closeDb, getDb } from '../../src/db/connection.js';
import { runMigrations } from '../../src/db/migrations.js';

describe('expenses integration', () => {
  beforeAll(() => {
    runMigrations();
  });

  beforeEach(() => {
    const db = getDb();
    db.exec('DELETE FROM idempotency_keys; DELETE FROM expenses;');
  });

  afterAll(() => {
    closeDb();
  });

  it('creates an expense', async () => {
    const response = await request(app).post('/api/expenses').send({
      amount: 15075,
      category: 'Food',
      description: 'Lunch',
      date: '2026-04-26',
    });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      amount: 15075,
      category: 'food',
      description: 'Lunch',
      date: '2026-04-26',
    });
    expect(typeof response.body.id).toBe('string');
  });

  it('returns same response on duplicate idempotency key', async () => {
    const key = '550e8400-e29b-41d4-a716-446655440000';
    const payload = {
      amount: 2999,
      category: 'Transport',
      description: 'Metro card',
      date: '2026-04-25',
    };

    const first = await request(app)
      .post('/api/expenses')
      .set('Idempotency-Key', key)
      .send(payload);
    const second = await request(app)
      .post('/api/expenses')
      .set('Idempotency-Key', key)
      .send({ ...payload, description: 'Changed body should not matter' });

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(second.body.id).toBe(first.body.id);
    expect(second.body.description).toBe(first.body.description);

    const db = getDb();
    const result = db
      .prepare('SELECT COUNT(*) as count FROM expenses')
      .get() as { count: number };
    expect(result.count).toBe(1);
  });

  it('filters expenses by category', async () => {
    await request(app).post('/api/expenses').send({
      amount: 5000,
      category: 'Food',
      description: 'Dinner',
      date: '2026-04-24',
    });
    await request(app).post('/api/expenses').send({
      amount: 2000,
      category: 'Travel',
      description: 'Bus',
      date: '2026-04-23',
    });

    const filtered = await request(app).get('/api/expenses?category=food');

    expect(filtered.status).toBe(200);
    expect(filtered.body).toHaveLength(1);
    expect(filtered.body[0].category).toBe('food');
  });

  it('returns 400 for invalid payloads', async () => {
    const response = await request(app).post('/api/expenses').send({
      amount: -100,
      category: '',
      description: '',
      date: 'not-a-date',
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Validation failed');
  });

  it('returns 400 for invalid idempotency key', async () => {
    const response = await request(app)
      .post('/api/expenses')
      .set('Idempotency-Key', 'invalid-key')
      .send({
        amount: 100,
        category: 'Food',
        description: 'Snack',
        date: '2026-04-20',
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('Idempotency-Key');
  });

  it('returns 400 for malformed json', async () => {
    const response = await request(app)
      .post('/api/expenses')
      .set('Content-Type', 'application/json')
      .send('{"amount":100,}');

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Malformed JSON request body');
  });
});
