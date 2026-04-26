import { useEffect, useMemo, useState } from 'react';
import './App.css';
import { ApiError, deleteExpense, updateExpense } from './api/expenses';
import { CategorySummary } from './components/CategorySummary';
import { ExpenseFilters } from './components/ExpenseFilters';
import { ExpenseForm } from './components/ExpenseForm';
import { ExpenseList } from './components/ExpenseList';
import { ExpenseSummary } from './components/ExpenseSummary';
import { useExpenses } from './hooks/useExpenses';
import type {
  Expense,
  ExpenseFilters as ExpenseFiltersType,
  UpdateExpenseInput,
} from './types';

function toErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Request failed. Please try again.';
}

function sortByDateDesc(expenses: Expense[]): Expense[] {
  return [...expenses].sort((a, b) => {
    if (a.date === b.date) {
      return b.created_at.localeCompare(a.created_at);
    }
    return b.date.localeCompare(a.date);
  });
}

function App() {
  const [filters, setFilters] = useState<ExpenseFiltersType>({
    sort: 'date_desc',
  });

  const { expenses, isLoading, error, reload } = useExpenses(filters);
  const [visibleExpenses, setVisibleExpenses] = useState<Expense[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingActions, setPendingActions] = useState<
    Record<string, 'updating' | 'deleting' | undefined>
  >({});

  useEffect(() => {
    setVisibleExpenses(expenses);
  }, [expenses]);

  const categories = useMemo(() => {
    return [...new Set(visibleExpenses.map((expense) => expense.category))].sort(
      (a, b) => a.localeCompare(b)
    );
  }, [visibleExpenses]);

  function handleCreated(_expense: Expense) {
    reload();
  }

  async function handleUpdateExpense(id: string, input: UpdateExpenseInput) {
    const previous = visibleExpenses;
    setActionError(null);
    setPendingActions((current) => ({ ...current, [id]: 'updating' }));

    setVisibleExpenses((current) => {
      const next = current
        .map((expense) =>
          expense.id === id
            ? {
                ...expense,
                amount: input.amount,
                category: input.category.trim().toLowerCase(),
                description: input.description.trim(),
                date: input.date,
              }
            : expense
        )
        .filter((expense) => {
          if (!filters.category) {
            return true;
          }
          return expense.category === filters.category;
        });

      return sortByDateDesc(next);
    });

    try {
      const updated = await updateExpense(id, input);

      setVisibleExpenses((current) => {
        const next = current
          .map((expense) => (expense.id === id ? updated : expense))
          .filter((expense) => {
            if (!filters.category) {
              return true;
            }
            return expense.category === filters.category;
          });

        return sortByDateDesc(next);
      });
    } catch (requestError) {
      setVisibleExpenses(previous);
      setActionError(toErrorMessage(requestError));
    } finally {
      setPendingActions((current) => ({ ...current, [id]: undefined }));
      reload();
    }
  }

  async function handleDeleteExpense(id: string) {
    const previous = visibleExpenses;
    setActionError(null);
    setPendingActions((current) => ({ ...current, [id]: 'deleting' }));

    setVisibleExpenses((current) => current.filter((expense) => expense.id !== id));

    try {
      await deleteExpense(id);
    } catch (requestError) {
      setVisibleExpenses(previous);
      setActionError(toErrorMessage(requestError));
    } finally {
      setPendingActions((current) => ({ ...current, [id]: undefined }));
      reload();
    }
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
          <ExpenseSummary expenses={visibleExpenses} />
          <ExpenseList
            expenses={visibleExpenses}
            isLoading={isLoading}
            error={error}
            actionError={actionError}
            pendingActions={pendingActions}
            onUpdateExpense={handleUpdateExpense}
            onDeleteExpense={handleDeleteExpense}
            onRetry={() => {
              setActionError(null);
              reload();
            }}
          />
          <CategorySummary expenses={visibleExpenses} />
        </section>
      </main>
    </div>
  );
}

export default App;
