import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { ApiError, createExpense } from '../api/expenses';
import type { CreateExpenseInput, Expense } from '../types';
import { currencyToPaise } from '../utils/money';

interface ExpenseFormProps {
  categories: string[];
  onCreated: (expense: Expense) => void;
}

interface FormState {
  amount: string;
  category: string;
  description: string;
  date: string;
}

function getLocalDateString(): string {
  const now = new Date();
  const tzAdjusted = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return tzAdjusted.toISOString().slice(0, 10);
}

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Failed to create expense. Please try again.';
}

export function ExpenseForm({ categories, onCreated }: ExpenseFormProps) {
  const [form, setForm] = useState<FormState>({
    amount: '',
    category: '',
    description: '',
    date: getLocalDateString(),
  });
  const [idempotencyKey, setIdempotencyKey] = useState<string>(() =>
    crypto.randomUUID()
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const categorySuggestions = useMemo(
    () => categories.filter((value) => value.trim().length > 0),
    [categories]
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const category = form.category.trim();
    const description = form.description.trim();

    if (!form.amount.trim()) {
      setError('Amount is required.');
      return;
    }
    if (!category) {
      setError('Category is required.');
      return;
    }
    if (!description) {
      setError('Description is required.');
      return;
    }
    if (!form.date) {
      setError('Date is required.');
      return;
    }

    let amountPaise = 0;
    try {
      amountPaise = currencyToPaise(form.amount);
    } catch (parseError) {
      setError(getErrorMessage(parseError));
      return;
    }

    if (amountPaise <= 0) {
      setError('Amount must be greater than 0.');
      return;
    }

    const payload: CreateExpenseInput = {
      amount: amountPaise,
      category,
      description,
      date: form.date,
    };

    setIsSubmitting(true);
    setError(null);

    try {
      const created = await createExpense(payload, idempotencyKey);
      onCreated(created);

      setForm({
        amount: '',
        category: '',
        description: '',
        date: getLocalDateString(),
      });

      // Regenerate only on success so retries reuse the same key.
      setIdempotencyKey(crypto.randomUUID());
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="card" aria-labelledby="add-expense-title">
      <h2 id="add-expense-title">Add Expense</h2>

      <form className="expense-form" onSubmit={handleSubmit}>
        <label htmlFor="amount">Amount (INR)</label>
        <input
          id="amount"
          inputMode="decimal"
          placeholder="150.75"
          value={form.amount}
          onChange={(event) =>
            setForm((current) => ({ ...current, amount: event.target.value }))
          }
          disabled={isSubmitting}
          required
        />

        <label htmlFor="category">Category</label>
        <input
          id="category"
          list="category-suggestions"
          placeholder="Food"
          value={form.category}
          onChange={(event) =>
            setForm((current) => ({ ...current, category: event.target.value }))
          }
          disabled={isSubmitting}
          required
        />
        <datalist id="category-suggestions">
          {categorySuggestions.map((category) => (
            <option key={category} value={category} />
          ))}
        </datalist>

        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          placeholder="Lunch with team"
          value={form.description}
          onChange={(event) =>
            setForm((current) => ({ ...current, description: event.target.value }))
          }
          disabled={isSubmitting}
          required
          rows={3}
        />

        <label htmlFor="date">Date</label>
        <input
          id="date"
          type="date"
          value={form.date}
          onChange={(event) =>
            setForm((current) => ({ ...current, date: event.target.value }))
          }
          disabled={isSubmitting}
          required
        />

        {error ? <p className="form-error">{error}</p> : null}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Expense'}
        </button>
      </form>
    </section>
  );
}
