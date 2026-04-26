import type { Expense } from '../types';
import { paiseToCurrency } from '../utils/money';

interface ExpenseListProps {
  expenses: Expense[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

function formatDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00.000Z`);
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

export function ExpenseList({
  expenses,
  isLoading,
  error,
  onRetry,
}: ExpenseListProps) {
  if (isLoading) {
    return (
      <section className="card" aria-live="polite">
        <h2>Expenses</h2>
        <p className="muted">Loading expenses...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="card" aria-live="assertive">
        <h2>Expenses</h2>
        <p className="form-error">{error}</p>
        <button type="button" className="secondary" onClick={onRetry}>
          Retry
        </button>
      </section>
    );
  }

  if (expenses.length === 0) {
    return (
      <section className="card" aria-live="polite">
        <h2>Expenses</h2>
        <p className="muted">No expenses found for the selected filters.</p>
      </section>
    );
  }

  return (
    <section className="card" aria-labelledby="expenses-title">
      <h2 id="expenses-title">Expenses</h2>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Category</th>
              <th>Description</th>
              <th className="amount-col">Amount</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((expense) => (
              <tr key={expense.id}>
                <td>{formatDate(expense.date)}</td>
                <td className="category-cell">{expense.category}</td>
                <td>{expense.description}</td>
                <td className="amount-col">{paiseToCurrency(expense.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
