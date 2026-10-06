# Proposal

## Why

PR 196 (`date-range-books-and-ocr`) review found three issues too large to fold into that change. Closing the upload dialog during OCR does not stop it, so the review reopens by itself and object URLs leak. Table columns are keyed by their first row's id, so editing a date remounts the input and drops focus. Money and date formatting is copied across `DataTable.tsx`, `reviewEntries.ts` and `useItemCardModel.ts`, and the table and CSV export import formatters from a hook module that pulls in tesseract.js.

## What Changes

- OCR can be cancelled: closing the dialog while loading stops the run, drops its result, and revokes any object URL it created, also when OCR fails partway.
- Table columns get a stable key (their date, `"sin-fecha"` for the empty one), and the date input of a column is a local draft that commits on a valid date, so typing a date does not lose focus or snap back.
- One shared module under `src/lib/` holds `parseMoneyToNumber`, `formatCurrency` and `formatDateDisplay`; `DataTable.tsx`, `exportCsv.ts`, `reviewEntries.ts` and `useItemCardModel.ts` import from it, and nothing outside the upload hook imports that hook module.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `receipt-ocr`: closing the dialog during OCR cancels it (delta spec to be written with the artifacts).
- `books`: `BOOK-11` gains the rule that editing a column's date keeps focus and the typed value until the date is valid (delta spec to be written with the artifacts).

The shared formatter module is a refactor with no behavior change and needs no spec.

## Impact

- `src/features/dashboard/model/useItemCardModel.ts`, `reviewEntries.ts`, `exportCsv.ts`
- `src/features/dashboard/components/dataTable/DataTable.tsx`
- a new module under `src/lib/` for the formatters, with tests
- no API, schema or dependency changes
- depends on `date-range-books-and-ocr` being merged first, since both touch the same files
