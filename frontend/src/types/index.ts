export type ExpenseSort = 'date_desc';

export interface Expense {
	id: string;
	amount: number;
	category: string;
	description: string;
	date: string;
	created_at: string;
}

export interface CreateExpenseInput {
	amount: number;
	category: string;
	description: string;
	date: string;
}

export interface ExpenseFilters {
	category?: string;
	sort: ExpenseSort;
}
