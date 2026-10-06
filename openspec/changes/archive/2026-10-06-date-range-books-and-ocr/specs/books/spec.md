# Spec Delta

## MODIFIED Requirements

### Requirement: BOOK-5 Create a book

A user SHALL be able to create a book. The title SHALL be trimmed and at most 180 characters, defaulting to "Libro sin título"; `creationTime` SHALL be an optional `YYYY-MM-DD` date defaulting to today. A book created from an upload of receipts SHALL be titled with the range from the lowest to the highest entry date, as `dd/MM/yyyy - dd/MM/yyyy`, or as a single `dd/MM/yyyy` when all entries share a date, and its `creationTime` SHALL be the lowest entry date. The range SHALL be computed when the book is saved, after the user's edits. Each upload SHALL create its own book, even when its dates overlap an existing book. (`src/features/dashboard/model/reviewEntries.ts:159-171`, `src/features/dashboard/model/useItemCardModel.ts:276-301`, `src/app/api/dashboard/books/route.ts:237-253`)

#### Scenario: No title given

- **WHEN** a book is created with an empty title
- **THEN** its title is "Libro sin título" and its date is today

#### Scenario: Upload spanning three days

- **WHEN** an upload of receipts dated 23/09/2026, 24/09/2026 and 25/09/2026 is saved
- **THEN** the book is titled "23/09/2026 - 25/09/2026" and its date is 2026-09-23

#### Scenario: Typed date widens the range

- **WHEN** the user types 22/09/2026 for an image the reader could not date, in an upload otherwise spanning 23/09/2026 to 25/09/2026
- **THEN** the book is titled "22/09/2026 - 25/09/2026" and its date is 2026-09-22

#### Scenario: Single day

- **WHEN** every entry in an upload is dated 23/09/2026
- **THEN** the book is titled "23/09/2026"

#### Scenario: Overlapping upload

- **WHEN** a second upload is saved with dates already covered by an earlier book
- **THEN** a new book is created and the earlier book is unchanged

#### Scenario: Date in a timezone west of UTC

- **WHEN** a book saved with date 2026-03-01 is opened by a user whose timezone is UTC-5
- **THEN** its date is still 2026-03-01, not 2026-02-28

## ADDED Requirements

### Requirement: BOOK-9 Entries ordered by date

Entries of a book created from an upload SHALL be stored in ascending date order. Entries with the same date SHALL keep the order in which their images were uploaded. (`src/lib/receipts/dates.ts:139-149`)

#### Scenario: Out-of-order upload

- **WHEN** images are uploaded in the order 25/09/2026, 23/09/2026, 24/09/2026
- **THEN** the book's entries are ordered 23/09/2026, 24/09/2026, 25/09/2026

### Requirement: BOOK-10 Detail view keeps each entry's date

Opening and saving a book SHALL keep every entry's own date; the detail view SHALL NOT overwrite entry dates with the book date. Each entry's date SHALL be shown and editable in the table. On save, the book's `creationTime` SHALL be the lowest entry date, and only entries without a date SHALL take the book date. Changing the book date SHALL move every dated entry by the same number of days, and SHALL update the title only when it is the automatic one (`Dia dd/mm/yyyy` or the entry range). (`src/lib/receipts/bookDates.ts`, `src/features/dashboard/model/state/useMainDashboardState.ts`, `src/features/dashboard/components/dataTable/DataTable.tsx`)

#### Scenario: Save a week book unchanged

- **WHEN** a book with entries dated 23/09/2026, 24/09/2026 and 25/09/2026 is opened and saved
- **THEN** the entries keep those dates and the book's date is 2026-09-23

#### Scenario: Move a week

- **WHEN** the book date of that book is changed to 2026-09-30
- **THEN** the entries are dated 30/09/2026, 01/10/2026 and 02/10/2026 and the title is "30/09/2026 - 02/10/2026"

#### Scenario: Custom title

- **WHEN** the user wrote their own title and then changes the book date
- **THEN** the title is unchanged

### Requirement: BOOK-11 Book table with one column per date

The table of a book SHALL show one column per distinct entry date, in ascending date order, each holding that date's amounts, followed by a Ganancias column with the total. Entries without a date SHALL appear under the book date, or in a "Sin fecha" column when there is none. In edit mode the user SHALL be able to change a column's date (moving its entries, and merging with an existing column when the date is already one), add or delete an amount in a column, and add a new date column. A half-typed date SHALL NOT move any entry. The stored data SHALL remain one entry per receipt. (`src/features/dashboard/components/dataTable/DataTable.tsx`, `src/lib/receipts/bookDates.ts`)

#### Scenario: A week

- **WHEN** a book with entries dated 23/09/2026 (two), 24/09/2026 and 25/09/2026 is opened
- **THEN** the table has columns 23/09/2026, 24/09/2026, 25/09/2026 and Ganancias, with the two amounts of the 23rd stacked in its column

#### Scenario: Merge two days

- **WHEN** the user sets the date of the 24/09/2026 column to 25/09/2026
- **THEN** the two columns become one column of 25/09/2026

### Requirement: OCR-11 Zoom shows the whole image

The enlarged view of a receipt SHALL let the user reach every part of the image at every zoom level, by scrolling or by dragging, up to 400%. The label of the amount field in the review SHALL be "Valor". (`src/features/dashboard/components/InvalidEntryCarousel/InvalidEntryCarousel.tsx`, `src/features/dashboard/components/InvalidEntryCarousel/InvalidEntryCarousel.module.css`)

#### Scenario: Zoomed receipt

- **WHEN** the user zooms a receipt to 300%
- **THEN** its top, bottom, left and right edges can all be scrolled into view
