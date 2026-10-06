# Spec Delta

## RENAMED Requirements

- FROM: `### Requirement: DASH-5 PDF export`
- TO: `### Requirement: DASH-5 CSV export`

## MODIFIED Requirements

### Requirement: DASH-3 Detail panel

A detail panel SHALL show and edit a book's entries and SHALL be able to export the book to CSV. (`src/features/dashboard/view/DashboardDetailPanel.tsx:48`)

#### Scenario: Open a book

- **WHEN** a user opens a book
- **THEN** its entries are shown for editing

### Requirement: DASH-5 CSV export

A CSV export SHALL have the layout of the book table: one column per distinct entry date in ascending order (entries without a date under the book date, or under a "Sin fecha" column when the book has no date), each holding that date's amounts as plain numbers with a decimal comma, then a Ganancias column, and a last row with each date's total and the grand total under Ganancias. The file SHALL use `;` as separator, CRLF line breaks and a UTF-8 byte order mark, and be named after the book. If the rows are not already loaded, they SHALL be fetched first, and if they cannot be fetched nothing SHALL be downloaded and the user SHALL see an error message. (`src/features/dashboard/model/exportCsv.ts:38-58`, `:61-86`)

#### Scenario: Export a week

- **WHEN** a user exports a book with entries on 23/09/2026 (two), 24/09/2026 and 25/09/2026
- **THEN** the file has the columns 23/09/2026, 24/09/2026, 25/09/2026 and Ganancias, the two amounts of the 23rd stacked in its column, and a last row with each day's total and the grand total

#### Scenario: Export unopened book

- **WHEN** a user exports a book whose rows are not loaded
- **THEN** the rows are fetched and the CSV includes them and the totals

#### Scenario: Rows cannot be fetched

- **WHEN** the rows of an unopened book cannot be fetched
- **THEN** the export fails, no file is downloaded and an error message is shown

#### Scenario: Undated entries in a dated book

- **WHEN** a book dated 23/09/2026 has entries without a date and is exported
- **THEN** those amounts are in the 23/09/2026 column, as in the table
