import type { Expense } from '../types';
import { paiseToCurrency } from '../utils/money';

interface ExpenseSummaryProps {
  expenses: Expense[];
}

export function ExpenseSummary({ expenses }: ExpenseSummaryProps) {
  const totalPaise = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <section className="card summary-card" aria-live="polite">
      <p className="summary-label">Visible Total</p>
      <p className="summary-value">{paiseToCurrency(totalPaise)}</p>
    </section>
  );
}
