import type { Expense } from '../types';
import { paiseToCurrency } from '../utils/money';

interface CategorySummaryProps {
  expenses: Expense[];
}

export function CategorySummary({ expenses }: CategorySummaryProps) {
  if (expenses.length === 0) {
    return null;
  }

  const totals = new Map<string, number>();
  expenses.forEach((expense) => {
    const current = totals.get(expense.category) ?? 0;
    totals.set(expense.category, current + expense.amount);
  });

  const orderedTotals = [...totals.entries()].sort(([a], [b]) =>
    a.localeCompare(b)
  );

  return (
    <section className="card" aria-labelledby="category-summary-title">
      <h2 id="category-summary-title">Category Totals</h2>
      <ul className="category-list">
        {orderedTotals.map(([category, amount]) => (
          <li key={category}>
            <span>{category}</span>
            <strong>{paiseToCurrency(amount)}</strong>
          </li>
        ))}
      </ul>
    </section>
  );
}
