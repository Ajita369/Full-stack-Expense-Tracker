import type { ExpenseFilters as ExpenseFiltersType } from '../types';

interface ExpenseFiltersProps {
  categories: string[];
  filters: ExpenseFiltersType;
  onChange: (nextFilters: ExpenseFiltersType) => void;
}

export function ExpenseFilters({
  categories,
  filters,
  onChange,
}: ExpenseFiltersProps) {
  return (
    <section className="card" aria-labelledby="filters-title">
      <h2 id="filters-title">Filters</h2>

      <div className="filters-grid">
        <label htmlFor="category-filter">Category</label>
        <select
          id="category-filter"
          value={filters.category ?? ''}
          onChange={(event) => {
            const value = event.target.value.trim();
            onChange({
              ...filters,
              category: value.length > 0 ? value : undefined,
            });
          }}
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>

        <label htmlFor="sort">Sort</label>
        <select
          id="sort"
          value={filters.sort}
          onChange={(event) =>
            onChange({ ...filters, sort: event.target.value as 'date_desc' })
          }
        >
          <option value="date_desc">Newest first</option>
        </select>
      </div>
    </section>
  );
}
