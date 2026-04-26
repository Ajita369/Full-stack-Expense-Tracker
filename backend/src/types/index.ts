export type ExpenseSort = 'date_desc';

export interface Expense {
	id: string;
	amount: number;
	category: string;
	description: string;
	date: string;
	created_at: string;
}

export interface CreateExpenseDTO {
	amount: number;
	category: string;
	description: string;
	date: string;
}

export interface UpdateExpenseDTO {
	amount: number;
	category: string;
	description: string;
	date: string;
}

export interface ExpenseFilters {
	category?: string;
	sort?: ExpenseSort;
}

export interface StoredIdempotencyResponse {
	expense: Expense;
}
