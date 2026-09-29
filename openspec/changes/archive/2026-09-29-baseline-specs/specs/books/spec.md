# Spec Delta

## Purpose

Defines how a user's ledger books and their entries are owned, listed, searched, created, updated and deleted, and the limits placed on that data.

## ADDED Requirements

### Requirement: BOOK-1 Per-user visibility

A user SHALL see only their own books, newest first by `creationTime` then `id`. Row-level security SHALL enforce the same rule by matching `owner_id` to the caller's `user_profile.book_id`. (`src/app/actions/dashboard.ts:140-145`, `migrations/20260721_rls_initplan_tuning.sql:37-94`)

#### Scenario: Only own books

- **WHEN** user A lists books while user B also has books
- **THEN** only user A's books are returned, newest first

### Requirement: BOOK-2 Pagination

The book list SHALL be paginated. Page size SHALL default to 5 and be clamped to 1-100; negative or non-numeric pages SHALL become 0. (`src/app/actions/dashboard.ts:55-63`)

#### Scenario: Oversized page size

- **WHEN** a page size of 500 is requested
- **THEN** it is clamped to 100

### Requirement: BOOK-3 Title search

The book list SHALL be searchable by title, case-insensitively and as a substring. `%` and `_` SHALL be escaped in the fallback query. A trigram index SHALL back the search. (`src/app/actions/dashboard.ts:146-149`, `migrations/20260405_dashboard_query_indexes.sql:9-10`)

#### Scenario: Case-insensitive substring

- **WHEN** a user searches "ENE" and a book is titled "Enero 2026"
- **THEN** that book is returned

### Requirement: BOOK-4 Preview in lists

List results SHALL carry only the first 3 entries of each book as a preview. Full content SHALL be loaded on demand. (`migrations/20260405_dashboard_books_preview_rpc.sql:33-37`, `src/app/actions/dashboard.ts:37-42`, `:164-184`, `:228-240`)

#### Scenario: Long book in list

- **WHEN** a book with 50 entries appears in the list
- **THEN** only 3 entries are included until its content is requested

### Requirement: BOOK-5 Create a book

A user SHALL be able to create a book. The title SHALL be trimmed and at most 180 characters, defaulting to "Libro sin título"; `creationTime` SHALL be an optional `YYYY-MM-DD` date defaulting to today. (`src/app/actions/dashboard.ts:287-377`)

#### Scenario: No title given

- **WHEN** a book is created with an empty title
- **THEN** its title is "Libro sin título" and its date is today

### Requirement: BOOK-6 Update a book

A user SHALL be able to update a book's content, and optionally its title and date, through the create action by passing `bookId`. (`src/app/actions/dashboard.ts:323-346`)

#### Scenario: Update existing book

- **WHEN** the create action is called with an existing `bookId` and new content
- **THEN** that book's content is replaced

### Requirement: BOOK-7 Bulk delete

A user SHALL be able to delete several books at once, up to 100 ids per request, with duplicates removed. (`src/app/actions/dashboard.ts:251-285`, `src/lib/security/validation.ts:42-49`)

#### Scenario: Duplicate ids

- **WHEN** a delete request lists the same id twice
- **THEN** the book is deleted once and the request succeeds

### Requirement: BOOK-8 Entry validation

Every entry SHALL be `{ id: integer, date: string, money: string }`, and a book SHALL hold at most 500 entries. Any other payload SHALL be rejected as a whole. (`src/lib/security/validation.ts:51-80`)

#### Scenario: One bad entry

- **WHEN** a payload has 10 valid entries and one with a non-integer `id`
- **THEN** the whole payload is rejected

#### Scenario: Too many entries

- **WHEN** a payload has 501 entries
- **THEN** it is rejected
