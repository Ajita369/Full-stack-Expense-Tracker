import { Fragment, useState } from 'react';
import type { FormEvent } from 'react';
import type { Expense } from '../types';
import type { UpdateExpenseInput } from '../types';
import { currencyToPaise, paiseToCurrency } from '../utils/money';

interface ExpenseListProps {
  expenses: Expense[];
  isLoading: boolean;
  error: string | null;
  actionError: string | null;
  pendingActions: Record<string, 'updating' | 'deleting' | undefined>;
  onUpdateExpense: (id: string, input: UpdateExpenseInput) => Promise<void>;
  onDeleteExpense: (id: string) => Promise<void>;
  onRetry: () => void;
}

interface EditFormState {
  amount: string;
  category: string;
  description: string;
  date: string;
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
  actionError,
  pendingActions,
  onUpdateExpense,
  onDeleteExpense,
  onRetry,
}: ExpenseListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditFormState>({
    amount: '',
    category: '',
    description: '',
    date: '',
  });
  const [editError, setEditError] = useState<string | null>(null);

  function startEditing(expense: Expense) {
    setEditingId(expense.id);
    setEditError(null);
    setEditForm({
      amount: (expense.amount / 100).toFixed(2),
      category: expense.category,
      description: expense.description,
      date: expense.date,
    });
  }

  async function submitEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingId) {
      return;
    }

    const category = editForm.category.trim();
    const description = editForm.description.trim();

    if (!editForm.amount.trim()) {
      setEditError('Amount is required.');
      return;
    }
    if (!category) {
      setEditError('Category is required.');
      return;
    }
    if (!description) {
      setEditError('Description is required.');
      return;
    }
    if (!editForm.date) {
      setEditError('Date is required.');
      return;
    }

    let amount = 0;
    try {
      amount = currencyToPaise(editForm.amount);
    } catch (parseError) {
      if (parseError instanceof Error) {
        setEditError(parseError.message);
      } else {
        setEditError('Enter a valid amount.');
      }
      return;
    }

    if (amount <= 0) {
      setEditError('Amount must be greater than 0.');
      return;
    }

    setEditError(null);
    await onUpdateExpense(editingId, {
      amount,
      category,
      description,
      date: editForm.date,
    });

    setEditingId(null);
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm('Delete this expense?');
    if (!confirmed) {
      return;
    }

    await onDeleteExpense(id);

    if (editingId === id) {
      setEditingId(null);
    }
  }

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
      {actionError ? <p className="form-error">{actionError}</p> : null}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Category</th>
              <th>Description</th>
              <th className="amount-col">Amount</th>
              <th className="actions-col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((expense) => {
              const isRowEditing = editingId === expense.id;
              const pendingAction = pendingActions[expense.id];
              const isUpdating = pendingAction === 'updating';
              const isDeleting = pendingAction === 'deleting';
              const isBusy = isUpdating || isDeleting;

              return (
                <Fragment key={expense.id}>
                  <tr>
                    <td>{formatDate(expense.date)}</td>
                    <td className="category-cell">{expense.category}</td>
                    <td>{expense.description}</td>
                    <td className="amount-col">{paiseToCurrency(expense.amount)}</td>
                    <td className="actions-col">
                      <button
                        type="button"
                        className="secondary compact"
                        onClick={() => startEditing(expense)}
                        disabled={isBusy}
                      >
                        {isUpdating ? 'Saving...' : 'Edit'}
                      </button>
                      <button
                        type="button"
                        className="danger compact"
                        onClick={() => {
                          void handleDelete(expense.id);
                        }}
                        disabled={isBusy}
                      >
                        {isDeleting ? 'Deleting...' : 'Delete'}
                      </button>
                    </td>
                  </tr>

                  {isRowEditing ? (
                    <tr className="edit-row">
                      <td colSpan={5}>
                        <form className="inline-edit-form" onSubmit={(event) => void submitEdit(event)}>
                          <input
                            placeholder="Amount"
                            value={editForm.amount}
                            onChange={(event) =>
                              setEditForm((current) => ({
                                ...current,
                                amount: event.target.value,
                              }))
                            }
                            disabled={isBusy}
                          />
                          <input
                            placeholder="Category"
                            value={editForm.category}
                            onChange={(event) =>
                              setEditForm((current) => ({
                                ...current,
                                category: event.target.value,
                              }))
                            }
                            disabled={isBusy}
                          />
                          <input
                            placeholder="Description"
                            value={editForm.description}
                            onChange={(event) =>
                              setEditForm((current) => ({
                                ...current,
                                description: event.target.value,
                              }))
                            }
                            disabled={isBusy}
                          />
                          <input
                            type="date"
                            value={editForm.date}
                            onChange={(event) =>
                              setEditForm((current) => ({
                                ...current,
                                date: event.target.value,
                              }))
                            }
                            disabled={isBusy}
                          />
                          <div className="inline-edit-actions">
                            <button type="submit" disabled={isBusy}>
                              Save
                            </button>
                            <button
                              type="button"
                              className="secondary"
                              onClick={() => {
                                setEditingId(null);
                                setEditError(null);
                              }}
                              disabled={isBusy}
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                        {editError ? <p className="form-error">{editError}</p> : null}
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
