# Full-stack Expense Tracker

A production-oriented full-stack expense tracker built with React + TypeScript on the frontend and Express + TypeScript + SQLite on the backend.

The project prioritizes correctness and resilience over feature breadth:
- Integer money handling (paise) to avoid floating-point errors
- Idempotent create requests to prevent duplicate expenses
- Optimistic edit/delete updates with rollback on failure
- Layered backend architecture for maintainability
- Automated tests for backend behavior and frontend utility/client logic

## Tech Stack

- Frontend: React, TypeScript, Vite
- Backend: Node.js, Express, TypeScript
- Database: SQLite via better-sqlite3
- Validation: Zod
- Testing: Vitest, Supertest

## Repository Structure

- backend: API server, validation, services, repositories, DB layer, tests
- frontend: React UI, hooks, API client, utility functions, tests
- package.json: root scripts to run both apps

## Getting Started

Prerequisites:
- Node.js 20+
- npm 10+

Install dependencies from repository root:
- npm install
- cd backend && npm install
- cd ../frontend && npm install

## Run Locally

From repository root:
- npm run dev

This starts:
- Backend API on http://localhost:3001
- Frontend app on http://localhost:5173

Backend uses environment values from backend/.env:
- PORT=3001
- DB_PATH=./expenses.db

## Build and Test

From repository root:
- npm run build
- npm run test

## API Overview

Base path:
- /api/expenses

Create expense:
- Method: POST
- Headers:
  - Content-Type: application/json
  - Idempotency-Key: optional UUID v4 string
- Body:
  - amount: integer paise, greater than 0
  - category: non-empty string
  - description: non-empty string
  - date: YYYY-MM-DD
- Behavior:
  - Returns 201 with created expense
  - Reusing the same Idempotency-Key returns the original 201 response without inserting a duplicate row

Update expense:
- Method: PUT
- Path: /api/expenses/:id
- Body:
  - amount: integer paise, greater than 0
  - category: non-empty string
  - description: non-empty string
  - date: YYYY-MM-DD
- Behavior:
  - Returns 200 with updated expense
  - Returns 404 if expense does not exist

Delete expense:
- Method: DELETE
- Path: /api/expenses/:id
- Behavior:
  - Returns 204 on success
  - Returns 404 if expense does not exist

List expenses:
- Method: GET
- Query params:
  - category: optional
  - sort: date_desc
- Behavior:
  - Returns 200 with filtered/sorted list

Errors:
- 400 for validation failures and malformed JSON
- 404 for unknown routes
- 500 for unhandled server errors

## Key Design Decisions

1. SQLite via better-sqlite3
- ACID guarantees and SQL querying with zero external DB setup.

2. Money as integer paise
- All arithmetic uses integers to ensure financial correctness.

3. Idempotent POST flow
- Client sends Idempotency-Key.
- Backend validates UUID v4 format.
- Duplicate keys replay original response instead of creating duplicates.
- Keys are cleaned at startup and periodically.

4. Layered backend architecture
- Routes -> Validation/Middleware -> Service -> Repository -> SQLite.

5. TypeScript across frontend and backend
- Shared correctness and better long-term maintainability.

## Verification Checklist

Automated:
- Run root build: npm run build
- Run root tests: npm run test

Manual:
1. Create an expense and verify it appears in the list.
2. Submit rapidly multiple times with same form attempt and verify only one expense is created.
3. Refresh page and verify expenses persist.
4. Filter by category and verify subset and visible total update correctly.
5. Verify newest-first sorting by date.
6. Edit an expense and verify optimistic UI updates immediately, then persists after response.
7. Delete an expense and verify optimistic removal, with rollback if request fails.
8. Submit invalid values (empty fields, negative amount, invalid date) and verify error handling.
9. Send malformed JSON to API and verify structured 400 response.
10. Simulate network interruption and verify frontend shows failure state and supports retry.

## Trade-offs and Timebox Choices

- No pagination: list is unpaginated for simplicity.
- No authentication/authorization: single-user scope.
- No external migration tool: schema initialized in code during startup.
- No deployment infrastructure in repo: local-first implementation.


## Future Enhancements

1. Add pagination and date-range filtering.
2. Add authentication and multi-user data isolation.
3. Add CI pipeline with lint/build/test gates.
4. Add production deployment and monitoring.
5. Add audit trail/history for expense changes.
