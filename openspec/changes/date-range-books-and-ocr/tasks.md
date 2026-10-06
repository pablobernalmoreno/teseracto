# Tasks

## 1. Test tooling and layout

- [x] 1.1 Add dev dependencies `jest-environment-jsdom`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `@napi-rs/canvas` and `cypress` (15.7.0 or newer) with pnpm; verify `pnpm install` succeeds under the `minimumReleaseAge`/`trustPolicy`/`blockExoticSubdeps` policy. If `@napi-rs/canvas` is blocked, record it in design.md Risks and drop the Node accuracy suite in group 8 in favour of Cypress only.
- [x] 1.2 Create `test-support/receipts/` with the filename oracle (`^(\d{2})-(\d{2})-(\d{4})-([\d.]+)(?:-\d+)?\.\w+$` → `{ date: "dd/MM/yyyy", money }`) and its unit test; verify the test covers `24-09-2026-51.600.jpeg`, the `-2` suffix on `23-09-2026-27.700-2.jpeg`, and a name that does not match.
- [x] 1.3 Add an ESLint `no-restricted-imports` rule that bans `test-support` imports from non-test files under `src/`; verify `pnpm lint` fails on a temporary offending import and passes once it is removed.
- [x] 1.4 Add the ignored path for the real sample receipts to `.gitignore` and add `cypress/` and `test-support/` to the folder tree in `AGENTS.md`; verify `git status` ignores a file dropped in that path and the tree shows both folders. This is a docs-only commit that goes before the code commits.
- [x] 1.5 Add `test:cy` and `test:ocr` scripts to `package.json`; verify both run and report "no tests found" or skipped, not a crash.

## 2. Date extraction (`OCR-2`)

- [x] 2.1 Create `src/lib/receipts/dates.ts` with the month table (first three letters after accent removal, `set` mapped to September), the `(?<!\d)` day guard, real-day validation for both written and slash dates, and "first valid match" over all matches; verify new tests for "5 de marzo de 2026" → `05/03/2026`, "23 sept 2026 - 3:35 p.m." → `23/09/2026`, "23 SEP 2026", "23 de septiembre de 2026 a las 06:31 p. m.", "45 sept 2026" → none, "245sept 2026" → none, "31/02/2026" → none all pass.
- [x] 2.2 Make `parseDates` in `src/lib/data.ts` delegate to the new module and keep its signature; verify the 3 existing tests and the new ones pass with `pnpm test`.
- [x] 2.3 Add a replay test that feeds saved OCR text lines for the Bre-B, Nequi and bank-style date formats from the sample receipts (text only, no names or account numbers) through `parseDates`; verify it returns the expected date for each.

## 3. Amount extraction (`OCR-3`)

- [x] 3.1 Create `src/lib/receipts/amounts.ts` with the labelled-value rule ("Valor del pago" / "Valor de la transferencia" then `$`), falling back to the largest 4-9 digit candidate, formatted `es-CO`; verify tests for "12.500" with "300" → 12.500, the labelled 21.500 beating a business code `009288065`, a 10-digit code ignored, `$ 0,00` ignored, and no candidate → empty string.
- [x] 3.2 Make `extractCurrencyValues` in `src/lib/data.ts` delegate to it and keep its signature; verify `pnpm test` is green.

## 4. Range, ordering and outlier rules (`OCR-7`, `OCR-8`, `BOOK-5`, `BOOK-9`)

- [x] 4.1 Create `src/lib/receipts/dateOutliers.ts` implementing the median rule for 3 or more dated entries (mean of the two middle days when even), nearest-neighbour for 1 or 2, no flag for a lone entry, flag when strictly more than 7 days away; verify tests for the 2062 misread, a typed 10/09 against a 24/09 median, two entries 10 days apart (both flagged), exactly 7 days (not flagged), and entries without dates ignored.
- [x] 4.2 Add the range title, `creationTime` and ordering helpers to `src/lib/receipts/dates.ts`; verify tests for "23/09/2026 - 25/09/2026", the single-day title "23/09/2026", a range crossing a year boundary, `creationTime` equal to the lowest date as `yyyy-MM-dd`, and ascending order with ties kept in upload order.

## 5. Save path (`BOOK-5`)

- [x] 5.1 Let `POST /api/dashboard/books` accept an optional `creationTime`, validated with `^\d{4}-\d{2}-\d{2}$`, rejecting anything else with 400 and keeping the current ISO timestamp when absent; verify a route test covers valid, malformed and absent values.
- [x] 5.2 Add an optional `creationTime` argument to `dashboardService.insertBookData` and send it in the request body; verify a test asserts the body when given and omits it when not.
- [x] 5.3 Update `spec/SPEC.md` (data model note for upload-created books and the GAP-11 route/action difference) citing the code with `file:line`; verify each cited line against the code before committing. Docs-only commit, before the code commits.

## 6. OCR retry pipeline (`OCR-9`)

- [x] 6.1 Create the image-treatment functions against a small canvas adapter (`createCanvas`, `loadImage`): grayscale + contrast at 2x width, and the inverted variant; verify unit tests with `@napi-rs/canvas` check output size, that inversion flips a known pixel, and that treatments do not mutate the input.
- [x] 6.2 Create the per-image read function over ordered passes (each pass produces text): the first always runs, later ones only while the date or amount is missing, each filling only the missing fields, a pass that throws is skipped, and a first-pass failure is rethrown; and the pass plan (the raw image in block, auto and sparse reading modes, then each treated image in block and auto mode, treated versions built lazily and once). The reading-mode passes were added after measurement showed the default mode drops large bold amounts; verify tests cover found-on-pass-1 (no other pass runs), date from pass 2 and amount from pass 3, no overwrite, a throwing pass, a first-pass failure, and the pass order and laziness.
- [x] 6.3 Wire the passes into `getImageText` in `useItemCardModel.ts`, creating the worker with `spa` (not `eng`), setting the page mode before every pass, keeping on-demand loading and `worker.terminate()` in `finally`; verify a hook test with a mocked worker asserts `createWorker` is called with `"spa"`, the mode sequence set on the worker, that no image is sent anywhere, and that the worker is terminated, including when recognition throws.

## 7. Review state and UI (`OCR-5`, `OCR-6`, `OCR-7`, `OCR-8`)

- [x] 7.1 Replace `selectedDate`, `excludedEntryIds`, `dateMismatchEntryIds` and the "Dia ..." title in `useItemCardModel.ts` with the per-entry list, `onDateChange(entryId, value)`, `onConfirmDate(entryId)`, derived flags and derived `canSave` (confirmation stored as `id -> date confirmed`, stale when the date changes); verify jsdom hook tests for: mixed dates all kept, a missing date flagged only on that image, an outlier blocks save until confirmed, editing a confirmed date re-flags it, and typing 22/09 gives the title "22/09/2026 - 25/09/2026".
- [x] 7.2 Make `handleSave` sort the entries, build the title and `creationTime` with the group 4 helpers and pass them through `insertBookData`; verify a hook test asserts the title, ascending order and `creationTime` sent for a three-day upload and for a single-day one.
- [x] 7.3 Update `InvalidEntryCarousel.tsx`, `InputDialog.tsx` and `ItemCardPresenter.tsx` for per-entry date editing, the outlier message with an accessible "Confirmar fecha" button, removal of the "fecha elegida"/mismatch copy, and the carousel listing parse-time-flagged plus currently flagged entries without losing the one being edited; verify component tests find the date field by its label, that the confirm button has an accessible name, and that Save is disabled until every entry has date and amount and every outlier is confirmed.
- [x] 7.4 Check the history view, PDF export and data table with a book whose entries span several dates; verify by a test or a manual run that the chart groups by each entry date and the PDF prints each row's date, and note the result in the PR description.

## 8. Fixtures and accuracy suite

- [x] 8.1 Add a script that generates synthetic Bre-B-like receipts (large text, fake names and numbers, dates 23-25 Sep 2026, one blank image) into `cypress/fixtures/`; verify the files are produced deterministically and contain no real personal data.
- [x] 8.2 Add the accuracy suite under `test-support/` run by `pnpm test:ocr`: it reads the real samples from the env-var path, runs the production read pipeline, compares with the filename oracle, prints per-image misses, and skips when the path is not set; verify it skips cleanly with the variable unset and reports date and amount counts when set.
- [x] 8.3 Run the suite on the real samples, set the thresholds from the measured result (not 24/24), and record the baseline of 6 dates and 18 amounts before this change next to the new numbers in `design.md`; verify the numbers in the doc match the suite output.
- [x] 8.4 Run the suite with `eng` and with `spa` and verify `spa` is not worse on dates or on amounts (if worse on amounts, switch the worker to `spa+eng` and re-run); mark GAP-4 as closed in `spec/SPEC.md` with the measured numbers and a `file:line` citation, verified against the code. Docs-only commit, before the code commits. Outcome: amounts were equal (22 of 24 with both) and `spa` read 18 dates against 19 with `eng`, one image where a "25" was read as "28"; `spa` was kept as decided, and the `spa+eng` fallback was not needed because it applies to amounts only.

## 9. Cypress component tests

- [x] 9.1 Add `cypress.config.ts` (component testing, `framework: "next"`, `bundler: "webpack"`), the component support file with the providers the dialog needs, and placeholder `NEXT_PUBLIC_SUPABASE_URL` and key values; verify a smoke spec mounts `ItemCardPresenter` with `cardId="new-item"`, opens the dialog and shows "Subir Archivos" under `pnpm test:cy`. If the mount fails on Next 16.3, stop and record it in design.md Risks before writing scenarios.
- [x] 9.2 Add a shared helper that stubs `GET /api/dashboard/profile/current` (a profile with a `book_id`) and `POST /api/dashboard/books` (echoing the book) and exposes the captured request body; verify a spec asserts the body is captured and that no request in the flow carries image data (`OCR-1`).
- [x] 9.3 Scenario: select the synthetic receipts dated 23, 24 and 25 Sep (selected out of order) and save; verify the captured body has the title "23/09/2026 - 25/09/2026", `creationTime` "2026-09-23", and three entries in ascending date order.
- [x] 9.4 Scenario: add the blank synthetic image, type 22/09/2026 in its date field and save; verify the title is "22/09/2026 - 25/09/2026" and `creationTime` is "2026-09-22".
- [x] 9.5 Scenario: type a date 10 days from the others; verify the entry shows the outlier message, Save stays disabled until "Confirmar fecha" is pressed, and editing the confirmed date again re-flags it.
- [x] 9.6 Scenario: select a receipt renamed with `selectFile({ fileName })` to a misleading name; verify its date and amount equal those of the same image under its normal name (`OCR-10`).

## 10. Integration checks

- [x] 10.1 Run the gate in order (`pnpm lint`, `pnpm exec next typegen`, `pnpm exec tsc --noEmit`, `pnpm test`) and verify every step is green before any commit.
- [x] 10.2 Run `openspec validate "date-range-books-and-ocr" --strict` and verify it passes; verify every requirement in the two spec deltas has at least one test from groups 2-9.
- [ ] 10.3 Do one manual run in the browser with the real samples and confirm no image request leaves the browser in the network panel; verify the book appears at the top of the list with the range title; this manual run is the only check for login, the `/main` render and the list, which the component tests do not cover. Commit docs separately and first, then code.

## 11. Detail view of multi-day books (`BOOK-10`)

- [x] 11.1 Found in manual testing of the real samples: the detail view showed the book date for every row and saving rewrote every entry to it, collapsing a week into one day (task 7.4 missed it). Add `src/lib/receipts/bookDates.ts`, stop overwriting row dates in `useMainDashboardState.ts`, show and edit each row's date in `DataTable.tsx`; verify `bookDates.test.ts` and `useMainDashboardState.test.tsx`.

## 12. Review zoom, date columns and "Valor" (`OCR-11`, `BOOK-11`)

- [x] 12.1 Found in manual testing: the zoomed receipt was cut off because the scroll container centred it with flex alignment. Centre the image with `margin: auto`, allow dragging to pan and zoom to 400%; verify the CSS rule guard, the 400% limit and the drag-to-scroll tests in `InputDialog.test.tsx`.
- [x] 12.2 Rename the amount label in the review from "Dinero" to "Valor"; verify the label tests in `InputDialog.test.tsx`.
- [x] 12.3 Lay the book table out with one column per date and a Ganancias column (`groupRowsByDate`, `moveColumnDate`, `nextFreeDate` in `bookDates.ts`, `DataTable.tsx`); verify `bookDates.test.ts` and `DataTable.test.tsx`.

## 13. Export to CSV (`DASH-3`, `DASH-5`)

- [x] 13.1 Replace the PDF export with a CSV export laid out like the book table (`exportCsv.ts`, `DashboardDetailPanel.tsx`), remove `jspdf`, `jspdf-autotable` and the now unused `dompurify` overrides, rename the Pro feature copy in `src/lib/pricing.ts`, and update `spec/SPEC.md` (GAP-2, GAP-12 citations); verify `exportCsv.test.ts` and `pnpm build`.

## 14. Review follow-ups (PR 196)

Docs side first: update the spec deltas named below in a docs-only commit, then the code commits. Write each failing test first; if production code would have to change to make a test pass, stop and report.

- [ ] 14.1 Book date is the stored day in every timezone (`BOOK-5`): `creationTime` is `timestamptz` (verified against the live column) and is read back as `2026-03-01 00:00:00+00`, so `normalizeCardDate` in `useMainDashboardState.ts` turns it into the previous day for users west of UTC. Read side only, writes stay date-only: parse a date-only value or a zero-time UTC timestamp by its UTC date, and any other timestamp as before. Add a scenario to the `BOOK-5` delta; verify a test under `TZ=America/Bogota` that `2026-03-01 00:00:00+00` gives `2026-03-01`.
- [ ] 14.2 CSV groups like the table (`DASH-5`): pass the book date from `DashboardDetailPanel.tsx` through `ExportCsvOptions` to `buildBookCsv`, so undated entries sit under the book date as on screen. Fix the `DASH-5` delta, which says undated entries go under "Sin fecha" (it is only the case when the book has no date); verify a test that the CSV columns equal the `groupRowsByDate(rows, bookDate)` columns for a book with undated rows.
- [ ] 14.3 A failed save keeps the review (`OCR-6`): in `handleSave` in `useItemCardModel.ts`, close the dialog only after a successful save; on failure keep entries, sources and confirmations, show the error, and let the user retry. Comment that it fails closed (nothing is lost, nothing is written); verify a test that a rejected `insertBookData` leaves `entries` and `dialogState` unchanged.
- [ ] 14.4 Same date validation at both entry points (`BOOK-5`): use `parseIsoDate` in `createBook` in `src/app/actions/dashboard.ts` instead of the regex; verify `2026-02-31` is rejected there as it is by `route.ts`.
- [ ] 14.5 Export errors reach the user (`DASH-5`): in `DashboardDetailPanel.tsx` show a Snackbar when `exportBookToCsv` throws, with a comment that it fails closed (no file is downloaded, which `DASH-5` already requires); verify a test that a failed fetch shows the message.
- [ ] 14.6 Linear grouping: push onto the existing array in `groupRowsByDate` in `bookDates.ts`; verify `bookDates.test.ts` still passes unchanged.
- [ ] 14.7 Fix the stale `columnCount` comment in `DataTable.tsx` (the delete column is gone).
- [ ] 14.8 Run the gate in order (`pnpm lint`, `pnpm exec next typegen`, `pnpm exec tsc --noEmit`, `pnpm test`), then `openspec validate "date-range-books-and-ocr" --strict`; deferred to the follow-up change `ocr-cancel-table-keys-shared-formatters`: OCR cancel and URL leaks, stable table column keys and draft date input, shared money and date formatter module.
