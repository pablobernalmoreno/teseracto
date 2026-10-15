## MODIFIED Requirements

### Requirement: BOOK-5 Create a book

A user SHALL be able to create a book. The title SHALL be trimmed and at most 180 characters, defaulting to "Planilla sin título"; `creationTime` SHALL be an optional `YYYY-MM-DD` date defaulting to today. A book created from an upload of receipts SHALL be titled with the range from the lowest to the highest entry date, as `dd/MM/yyyy - dd/MM/yyyy`, or as a single `dd/MM/yyyy` when all entries share a date, and its `creationTime` SHALL be the lowest entry date. The range SHALL be computed when the book is saved, after the user's edits. Each upload SHALL create its own book, even when its dates overlap an existing book. Books already stored with the earlier default title "Libro sin título" SHALL keep it. (`src/features/dashboard/model/reviewEntries.ts:159-171`, `src/features/dashboard/model/useItemCardModel.ts:281-310`, `src/app/api/dashboard/books/route.ts:237-253`, `src/lib/receipts/bookDates.ts:35-49`)

#### Scenario: No title given

- **WHEN** a book is created with an empty title
- **THEN** its title is "Planilla sin título" and its date is today

#### Scenario: Previously stored default title

- **WHEN** a book stored with the title "Libro sin título" is listed or opened
- **THEN** it keeps that title and is not rewritten

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

### Requirement: BOOK-11 Book table with one column per date

The table of a book SHALL show one column per distinct entry date, in ascending date order, each holding that date's amounts, followed by an Ingresos column with the total. Entries without a date SHALL appear under the book date, or in a "Sin fecha" column when there is none. In edit mode the user SHALL be able to change a column's date (moving its entries, and merging with an existing column when the date is already one), add or delete an amount in a column, and add a new date column. A half-typed date SHALL NOT move any entry. The stored data SHALL remain one entry per receipt. (`src/features/dashboard/components/dataTable/DataTable.tsx`, `src/lib/receipts/bookDates.ts`)

#### Scenario: A week

- **WHEN** a book with entries dated 23/09/2026 (two), 24/09/2026 and 25/09/2026 is opened
- **THEN** the table has columns 23/09/2026, 24/09/2026, 25/09/2026 and Ingresos, with the two amounts of the 23rd stacked in its column

#### Scenario: Merge two days

- **WHEN** the user sets the date of the 24/09/2026 column to 25/09/2026
- **THEN** the two columns become one column of 25/09/2026

## ADDED Requirements

### Requirement: BOOK-12 Rename a book while editing

The detail view of a book SHALL show its title in an editable field, labeled for the planilla's name and limited to 180 characters. Changing the title SHALL mark the book as having unsaved changes, and saving SHALL store the new title through the update action of BOOK-6. A title the user typed SHALL NOT be replaced by one computed from the dates, as BOOK-10 already provides. An empty title SHALL NOT be saved: the book SHALL keep its previous title, as the update action already does for a blank title, and the field SHALL show that title again after saving. (`src/features/dashboard/view/DashboardDetailPanel.tsx:78-87`, `src/features/dashboard/model/state/useMainDashboardState.ts:144`, `:200-212`, `:236-242`, `:266-267`)

#### Scenario: Rename and save

- **WHEN** the user changes the title to "semana 3" in the detail view and saves
- **THEN** the book is stored with the title "semana 3" and appears with that title in the list

#### Scenario: Rename marks unsaved changes

- **WHEN** the user edits the title field
- **THEN** the save buttons show the unsaved-changes marker until the book is saved

#### Scenario: Title kept when dates change

- **WHEN** the user has typed "semana 3" and then changes the book date
- **THEN** the title stays "semana 3"

#### Scenario: Empty title is not saved

- **WHEN** the user clears the title field of a book titled "semana 3" and saves
- **THEN** the book keeps the title "semana 3" and the field shows it again

#### Scenario: Title too long

- **WHEN** the user types more than 180 characters in the title field
- **THEN** the field accepts only the first 180
