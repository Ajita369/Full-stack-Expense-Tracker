import { Router } from 'express';
import { idempotencyMiddleware } from '../middleware/idempotency.js';
import { validate } from '../middleware/validation.js';
import {
  createExpenseSchema,
  getExpensesQuerySchema,
} from '../schemas/expense.js';
import { expenseService } from '../services/expenseService.js';
import { CreateExpenseDTO, ExpenseFilters } from '../types/index.js';

type IdempotencyRequestShape = {
  idempotencyKey?: string;
};

const router = Router();

router.get('/', validate(getExpensesQuerySchema, 'query'), (req, res) => {
  const filters = req.query as ExpenseFilters;
  const expenses = expenseService.getExpenses(filters);
  res.status(200).json(expenses);
});

router.post(
  '/',
  idempotencyMiddleware,
  validate(createExpenseSchema, 'body'),
  (req, res) => {
    const body = req.body as CreateExpenseDTO;
    const idempotencyKey = (req as IdempotencyRequestShape).idempotencyKey;

    const created = expenseService.createExpense(body, idempotencyKey);
    res.status(201).json(created);
  }
);

export default router;
