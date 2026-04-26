import { useMemo, useState } from 'react';
import './App.css';
import { CategorySummary } from './components/CategorySummary';
import { ExpenseFilters } from './components/ExpenseFilters';
import { ExpenseForm } from './components/ExpenseForm';
import { ExpenseList } from './components/ExpenseList';
import { ExpenseSummary } from './components/ExpenseSummary';
import { useExpenses } from './hooks/useExpenses';
import type { Expense, ExpenseFilters as ExpenseFiltersType } from './types';

function App() {
  const [filters, setFilters] = useState<ExpenseFiltersType>({
    sort: 'date_desc',
  });

  const { expenses, isLoading, error, reload } = useExpenses(filters);

  const categories = useMemo(() => {
    return [...new Set(expenses.map((expense) => expense.category))].sort((a, b) =>
      a.localeCompare(b)
    );
  }, [expenses]);

  function handleCreated(_expense: Expense) {
    reload();
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <p className="eyebrow">Personal Finance</p>
        <h1>Expense Tracker</h1>
        <p className="subtitle">
          Track daily spending with precise money handling and resilient submissions.
        </p>
      </header>

      <main className="layout-grid">
        <section className="left-column">
          <ExpenseForm categories={categories} onCreated={handleCreated} />
          <ExpenseFilters
            categories={categories}
            filters={filters}
            onChange={setFilters}
          />
        </section>

        <section className="right-column">
          <ExpenseSummary expenses={expenses} />
          <ExpenseList
            expenses={expenses}
            isLoading={isLoading}
            error={error}
            onRetry={reload}
          />
          <CategorySummary expenses={expenses} />
        </section>
      </main>
    </div>
  );
}

export default App;
