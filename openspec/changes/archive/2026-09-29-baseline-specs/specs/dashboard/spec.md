# Spec Delta

## Purpose

Defines the authenticated dashboard where a user reviews books, edits entries, sees a history chart and exports PDFs.

## ADDED Requirements

### Requirement: DASH-1 Server-rendered first page

`/main` SHALL render the first page of books on the server, then hand off to the client. Without a signed-in user it SHALL redirect to `/login`. (`src/app/main/page.tsx:35-48`, `:36-43`)

#### Scenario: Anonymous visit

- **WHEN** a visitor without a session opens `/main`
- **THEN** they are redirected to `/login`

### Requirement: DASH-2 Summary tiles

Summary tiles SHALL show the number of books, the rows in view (edited rows while a book is open, otherwise filtered results), the number selected for deletion, and the page count. (`src/features/dashboard/view/DashboardSummaryStats.tsx:28-54`)

#### Scenario: Selection count

- **WHEN** a user selects two books for deletion
- **THEN** the selected tile shows 2

### Requirement: DASH-3 Detail panel

A detail panel SHALL show and edit a book's entries and SHALL be able to export the book to PDF. (`src/features/dashboard/view/DashboardDetailPanel.tsx:48`)

#### Scenario: Open a book

- **WHEN** a user opens a book
- **THEN** its entries are shown for editing

### Requirement: DASH-4 History chart

The history view SHALL sum amounts per day across all of the user's books and plot them, filterable to all time, the last 30 days or the last 7 days. Dates SHALL be accepted as ISO, `dd/MM/yyyy`, `d/M/yyyy`, `yyyy/MM/dd`, `dd-MM-yyyy` or `d-M-yyyy`; entries with unparseable dates SHALL be skipped. (`src/features/dashboard/view/DashboardHistoryView.tsx:112-138`, `:34-58`, `:84-91`)

#### Scenario: Two books, same day

- **WHEN** two books each have an entry on the same day
- **THEN** the chart shows one point summing both

#### Scenario: Bad date

- **WHEN** an entry's date cannot be parsed
- **THEN** it is skipped and the rest are plotted

### Requirement: DASH-5 PDF export

A PDF export SHALL be an A4 portrait table of a book's entries with a total. If the rows are not already loaded, they SHALL be fetched first. (`src/features/dashboard/model/exportPdf.ts:39-60`)

#### Scenario: Export unopened book

- **WHEN** a user exports a book whose rows are not loaded
- **THEN** the rows are fetched and the PDF includes them and a total

### Requirement: DASH-6 Unsaved-changes guard

Unsaved edits SHALL be guarded by a confirmation dialog. (`src/features/dashboard/components/Dialog/UnsavedChangesDialog.tsx`)

#### Scenario: Leave with edits

- **WHEN** a user tries to leave a book with unsaved edits
- **THEN** a confirmation dialog appears
