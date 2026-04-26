import { useCallback, useEffect, useState } from 'react';
import { ApiError, getExpenses } from '../api/expenses';
import type { Expense, ExpenseFilters } from '../types';

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Something went wrong while loading expenses.';
}

export function useExpenses(filters: ExpenseFilters) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState<number>(0);

  const reload = useCallback(() => {
    setReloadToken((current) => current + 1);
  }, []);

  useEffect(() => {
    let isActive = true;

    async function loadExpenses() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await getExpenses(filters);
        if (!isActive) {
          return;
        }
        setExpenses(response);
      } catch (loadError) {
        if (!isActive) {
          return;
        }
        setError(getErrorMessage(loadError));
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadExpenses();

    return () => {
      isActive = false;
    };
  }, [filters, reloadToken]);

  return {
    expenses,
    isLoading,
    error,
    reload,
  };
}
