## MODIFIED Requirements

### Requirement: DASH-5 CSV export

A CSV export SHALL have the layout of the book table: one column per distinct entry date in ascending order (entries without a date under the book date, or under a "Sin fecha" column when the book has no date), each holding that date's amounts as plain numbers with a decimal comma, then an Ingresos column, and a last row with each date's total and the grand total under Ingresos. The file SHALL use `;` as separator, CRLF line breaks and a UTF-8 byte order mark, and be named after the title shown in the detail view when the export is pressed, including a rename not yet saved, as that title followed by `.csv`; characters other than letters, digits, accents, spaces, `_` and `-` SHALL be removed from the name, and an empty name SHALL fall back to "planilla". No other export format (such as PDF) SHALL be offered. If the rows are not already loaded, they SHALL be fetched first, and if they cannot be fetched nothing SHALL be downloaded and the user SHALL see an error message. (`src/features/dashboard/model/exportCsv.ts:40-61`, `:63-88`)

#### Scenario: Export a week

- **WHEN** a user exports a book with entries on 23/09/2026 (two), 24/09/2026 and 25/09/2026
- **THEN** the file has the columns 23/09/2026, 24/09/2026, 25/09/2026 and Ingresos, the two amounts of the 23rd stacked in its column, and a last row with each day's total and the grand total

#### Scenario: Export unopened book

- **WHEN** a user exports a book whose rows are not loaded
- **THEN** the rows are fetched and the CSV includes them and the totals

#### Scenario: Rows cannot be fetched

- **WHEN** the rows of an unopened book cannot be fetched
- **THEN** the export fails, no file is downloaded and an error message is shown

#### Scenario: Undated entries in a dated book

- **WHEN** a book dated 23/09/2026 has entries without a date and is exported
- **THEN** those amounts are in the 23/09/2026 column, as in the table

#### Scenario: File named after the renamed planilla

- **WHEN** a user renames a planilla to "semana 3" in the detail view and exports it, saved or not
- **THEN** the downloaded file is named "semana 3.csv"

#### Scenario: Characters not allowed in a file name

- **WHEN** a user exports a planilla titled "Gastos: 1/2 (marzo)"
- **THEN** the file is named "Gastos 12 marzo.csv", without the removed characters

#### Scenario: Empty name

- **WHEN** a user empties the title and exports
- **THEN** the file is named "planilla.csv"
