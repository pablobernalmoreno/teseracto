# Proposal

## Why

Receipt reading assumes one upload is one day: the first date found becomes the reference and every other date is excluded (`OCR-4`), and the book is titled "Dia dd/mm/yyyy". The client keeps their books by week, so a single upload routinely spans several days. Measured on 24 real Bre-B and Nequi receipts, the current parsers also read only 6 dates and 18 amounts correctly, mostly because "sept" is not a month the parser knows, so the manual-entry fallback fires far more often than it should.

## What Changes

- A book is one upload. Its title is the range from the lowest to the highest entry date, computed at save time after any manual edits (for example "22/09/2026 - 25/09/2026"). There is no calendar week and no merging into an earlier book.
- Each entry carries its own date. Receipts with different dates in one upload are normal and no longer excluded. Entries are sorted by date inside the book.
- A missing date or amount is flagged per image and typed in by the user. Typing an earlier date widens the range.
- A date more than 7 days from the median date of the upload is flagged for the user to confirm or correct, whether OCR read it or the user typed it. Small uploads compare against the nearest neighbour. Flagged entries are never excluded automatically.
- Date reading accepts abbreviated months such as "sept", validates the day, and tolerates missing spaces. Amount reading prefers the value that follows "Valor del pago" or "Valor de la transferencia" and keeps largest-number only as a fallback. Images that give nothing on the first pass are retried with preprocessing variants.
- Filenames are never read by the app. A date-and-amount filename convention (`dd-mm-yyyy-amount`, optional `-N` suffix) is used only by tests, as the expected values for the sample receipts.
- Tests are added: unit (parsers, range, outlier flag), integration (OCR pipeline over the sample receipts, kept apart from the fast gate), and Cypress component tests of the upload flow in a real browser. A full end-to-end run through login and `/main` is out of scope because no non-production Supabase project exists.
- **BREAKING**: the "Dia dd/mm/yyyy" title and the single-day rule go away. Existing daily books are left as they are.

## Capabilities

### New Capabilities

None. Test tooling is not spec-level behaviour and is covered in the design and tasks.

### Modified Capabilities

- `receipt-ocr`: `OCR-2` and `OCR-3` change how dates and amounts are read. `OCR-4` is replaced by per-entry dates and the outlier flag. `OCR-5` and `OCR-6` become per-image.
- `books`: `BOOK-5` changes the default title and `creationTime` for a book created from an upload, and entries inside a book are ordered by date.

## Impact

- Code: `src/lib/data.ts`, `src/features/dashboard/model/useItemCardModel.ts`, the invalid-entry carousel and dialog components, `src/app/actions/dashboard.ts`, `src/lib/security/validation.ts`, and wherever the history view and PDF export assume one day per book.
- Data: `MainData` is unchanged (`date` already exists per entry). No migration is planned for existing books.
- Dependencies: `jest-environment-jsdom`, Testing Library and Cypress as dev dependencies; `sharp` is not used in the browser, so preprocessing needs a browser-side approach (design question).
- Privacy: the sample receipts contain real names, account numbers and a business code. They must not be committed as they are; redacted or synthetic fixtures are needed.
- Not in scope: plan limits, the `eng`/`spa` model choice (GAP-4) beyond what the accuracy suite shows, and any time-of-day field.
