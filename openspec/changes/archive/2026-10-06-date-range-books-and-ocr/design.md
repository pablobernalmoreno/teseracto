# Design

## Context

See `proposal.md` for motivation and `specs/` for requirements. Current state that shapes the approach:

- The upload flow lives in `src/features/dashboard/model/useItemCardModel.ts`. It keeps one `selectedDate` plus `excludedEntryIds`, `dateMismatchEntryIds` and `invalidEntries`, all derived from "first date found wins". The carousel (`InvalidEntryCarousel.tsx`) edits only money per entry and asks for a single date on the first image. `InputDialog.tsx` decides whether Save is enabled.
- `src/lib/data.ts` parses dates with date-fns `es` locale (which has no "sept") and picks the largest 4-9 digit number as the amount. The slash-date branch does not check the day is real.
- Saving goes through `dashboardService.insertBookData` to `POST /api/dashboard/books` (`src/app/api/dashboard/books/route.ts`). That handler ignores any date and stores `creationTime: new Date().toISOString()`; only the `createBook` server action accepts a `YYYY-MM-DD` `creationTime` (GAP-11).
- Already per-entry and needing no change: the history chart groups by entry date (`DashboardHistoryView.tsx:84-101`), the PDF prints each row's date (`exportPdf.ts`), the data table edits a date per row (`DataTable.tsx:112`, `:186`), and `normalizeCardDate` accepts both date-only and ISO `creationTime` (`useMainDashboardState.ts:68-72`).
- Jest runs in a `node` environment with 3 tests. There is no jsdom, Testing Library or Cypress. `pnpm-workspace.yaml` enforces `minimumReleaseAge`, `trustPolicy` and `blockExoticSubdeps` on new dependencies.
- Measured on 24 real receipts with today's parsers: 6 dates and 18 amounts correct. Replaying a regex-only fix on the saved OCR text raised dates to 17; preprocessing recovered some of the rest (details under Decisions).

## Goals / Non-Goals

**Goals:**

- Move the date and amount rules into pure functions that can be tested without a browser, and keep the hook as orchestration only.
- Keep the user's review flow (carousel, zoom, manual entry) and extend it from one shared date to one date per entry.
- Make the OCR improvements measurable against the sample receipts without committing those receipts.

**Non-Goals:**

- Merging `insertBookData` and `createBook` (GAP-11); only the route handler gains an optional date.
- Plan limits, OCR quotas, a time-of-day field, or consolidating money parsing (GAP-12).
- A full end-to-end run through login and `/main`: the proxy and `/main` call Supabase from the server (`src/lib/supabase/proxy.ts:48-50`, `src/app/main/page.tsx:36-47`), which Cypress cannot stub, and there is no non-production Supabase project to point at.
- Running Jest or Cypress in CI. The local gate in `AGENTS.md` stays the only place they run.
- Supporting languages other than Spanish; receipts and the UI are Spanish.

## Decisions

### 1. Pure receipt rules in `src/lib/receipts/`

New files, each pure and unit-tested: `dates.ts` (extract, validate, range, title, ordering), `amounts.ts`, `dateOutliers.ts`. `src/lib/data.ts` keeps its exports used elsewhere and delegates to these.

- **Months**: an explicit table keyed on the first three letters after accent removal, with `set` mapped to September, replaces `parse(..., "MMMM", {locale: es})`. This is what makes "sept", "sep." and "septiembre" the same month. Alternative: keep date-fns and add a locale override; rejected because it hides the rule inside a locale object.
- **Pattern**: `(?<!\d)(\d{1,2})\s*(?:de\s+)?([a-zñáéíóú]{3,11})\.?\s*(?:de\s+)?(20\d{2})`, iterating all matches and taking the first one whose month is known and whose day is a real day. The `(?<!\d)` guard means "245sept 2026" yields no date instead of the invalid "45"; the replay found that exact case. The slash form gets the same real-day check.
- **Amount**: look for "Valor del pago" / "Valor de la transferencia" followed by a `$` amount first; otherwise the largest 4-9 digit candidate, as today. Both are Colombian-format and re-formatted to `es-CO`.
- Fails **closed** on garbage: an unparseable date counts as "no date", which blocks Save until the user types one.

### 2. Review state becomes a list of entries

Replace `selectedDate`, `excludedEntryIds`, `dateMismatchEntryIds` with `entries: { id, date, money, source }[]` where `id` is the upload index (so `sources[id]` still works). The model exposes `onDateChange(entryId, value)`, `onMoneyChange`, `onConfirmDate(entryId)` and a derived `canSave`. What needs attention is derived, not stored:

- `missingDate`, `missingAmount`, and `dateOutlier` (decision 3).
- The carousel lists entries that were flagged at parse time or are flagged now, in id order. Keeping parse-time ids stable stops an entry vanishing from the carousel the moment the user types its date.
- Save is enabled when every entry has a date and an amount and every outlier is confirmed. This moves out of `InputDialog.tsx`, which becomes presentational.

The date field keeps the native `type="date"` input (ISO value) and converts to `dd/MM/yyyy` on change; an empty value clears the date.

### 3. Outlier rule

`dateOutliers(dates)` returns the ids to flag. With 3 or more dated entries the reference is the median in whole days (the mean of the two middle days when the count is even, so it may be a half day); an entry is flagged when `|day - median| > 7`. With 1 or 2 dated entries each is compared with its nearest other date, and a lone entry is never flagged. Exactly 7 days is not flagged.

- Recomputed on every edit, so typing a date can flag that entry or change what others are measured against.
- Confirmation is stored as `id -> date confirmed`. Editing that entry's date makes the stored value stale, which re-flags it if it is still far away. The complement of "confirmed" is "date changed since", which resets it.
- Flagged entries are never dropped. Alternative: exclude them like the old `OCR-4`; rejected because a wrong median (for example, mostly mistyped dates) would silently discard good receipts.

### 4. Save: range title, order, `creationTime`

At save, sort entries by calendar date ascending, ties by `id` (upload order), then build the title (`dd/MM/yyyy - dd/MM/yyyy`, or one date). `creationTime` is the lowest date as `yyyy-MM-dd`.

- `insertBookData` gains an optional `creationTime` argument and `POST /api/dashboard/books` accepts it, validated with the same `^\d{4}-\d{2}-\d{2}$` rule as `createBook`; when absent it keeps writing the current ISO timestamp, so other callers are unchanged.
- Alternative: switch the upload save to the `createBook` server action. Rejected as scope creep into GAP-11.
- Ids are not renumbered after sorting; they only need to be unique.

### 5. Retry: other reading modes first, then treated images

Tesseract's default page mode (block, the one tesseract.js sets) reads dates best but drops large bold text such as the amount; auto and sparse modes find that text. Measured on the 24 real receipts the modes complement each other, so a read is a list of passes, each producing text, that runs in order until both fields are found: the raw image in block, auto and sparse mode, then each treated image (grayscale + contrast at up to 2x width, then inverted for dark mode) in block and auto mode. Each pass fills only the fields still missing; a field already found is never overwritten. The mode is set on the worker before every pass, so no pass inherits the previous one's.

Measured with `pnpm test:ocr` on the 24 real receipts (`spa` model):

| Stage                                               | Dates       | Amounts     |
| --------------------------------------------------- | ----------- | ----------- |
| Before this change (old parsers, `eng`, block mode) | 6 / 24      | 18 / 24     |
| First pass only (new parsers, `spa`, block mode)    | 17 / 24     | 18 / 24     |
| Full pipeline (all passes)                          | **18 / 24** | **22 / 24** |

On the 6 synthetic receipts the first pass reads all dates but only 1 amount (the large bold amount is dropped in block mode); the full pipeline reads all 6. On average an image needs 2.7 passes, at most 7, and a clean image needs 1. What is left is two images nothing could read, plus misreads that look plausible: `17.800` read as `7.800`, and a `25` read as `28` (3 days from the others, so the 7-day rule does not catch it). These are the cases the review screen exists for.

The treatments are written against the standard canvas API behind a small codec (`decode`, `encode`). The browser codec uses `createImageBitmap` and a canvas; the Node accuracy suite uses `@napi-rs/canvas`, so both run the same production pixel code. Alternative: test the real pipeline only in Cypress; rejected as too slow for measuring 24 images. Alternative for the retry: treated images only; rejected, because the mode change fixes the largest class of misses at no image cost. A pass that throws is skipped and the next one runs, so a retry failure fails **open** to the result found so far (`OCR-6`).

### 5b. Spanish as the OCR language

The worker is created with `spa` instead of `eng` (closes GAP-4). The receipts are Spanish ("Valor del pago", "Comprobante No.", month names with accents), and the labelled-amount rule in decision 1 depends on reading those labels. The baseline of 6 dates and 18 amounts was measured with `eng`, so the accuracy suite is run once with each model as a regression check: `spa` must not be worse than `eng` on dates or amounts. If it is worse on amounts, `spa+eng` is the fallback. Alternative: keep `eng` and rely on the regex fixes only; rejected because the label rule and accented months are the cases `eng` handles worst.

### 6. Tests and fixtures

- **Unit (Jest, node)**: month table, date and amount extraction, real-day validation, outlier rule (including the 7-day boundary and the two-entry case), range and title, ordering, route validation of `creationTime`.
- **Integration**: hook and carousel tests in jsdom (`jest-environment-jsdom`, Testing Library, selected per file with the docblock so the default stays `node`), with the OCR worker mocked. A separate accuracy suite runs the real worker over the sample receipts and compares with the filename oracle.
- **Filename oracle**: `^(\d{2})-(\d{2})-(\d{4})-([\d.]+)(?:-\d+)?\.\w+$` lives in a new top-level `test-support/` folder, never in `src/`. An ESLint `no-restricted-imports` rule bans importing `test-support` from non-test `src` files, which enforces `OCR-10` structurally.
- **Fixtures**: the real receipts contain names and account numbers, so they stay out of git (ignored path, location from an env var; the suite skips when absent). Committed Cypress fixtures are synthetic receipts generated by a script with `@napi-rs/canvas`, using Bre-B-like text and fake data.
- **Cypress component tests**: the upload dialog (`ItemCardPresenter` in its "new item" variant) is mounted on its own in a real browser with the real OCR worker, using the Next framework with the webpack bundler (supported for Next 16 from Cypress 15.7.0; Turbopack is not). Only the two browser-side calls are stubbed with `cy.intercept`: `GET /api/dashboard/profile/current` and `POST /api/dashboard/books`, whose request body is captured and asserted. Scenarios: three days produce the title "23/09/2026 - 25/09/2026" and `creationTime` 2026-09-23; a blank image takes the manual path and a typed 22/09 widens the range; a date 10 days off is flagged and blocks Save until confirmed; a receipt renamed through `selectFile`'s `fileName` gives the same result (`OCR-10`); no request carries image data (`OCR-1`).
- **Not covered by automation**: login, the `/main` server render, and the saved book appearing in the list. The manual run in the last task group is the only check for those.
- `AGENTS.md`'s folder tree needs `cypress/` and `test-support/` added, as a docs commit before the code.

### 7. Existing books

No migration. Daily books titled "Dia dd/mm/yyyy" stay as they are.

## Risks / Trade-offs

- [A wide range hides one bad date] → the outlier flag (decision 3); it is weaker when most dates in an upload are wrong, which a confirmation step cannot fix.
- [Ordering by `creationTime` desc now means "lowest receipt date"] → a later upload of older receipts sorts below newer books; accepted, since BOOK-1 ordering is not changing.
- [Mixed `creationTime` shapes in one table (date-only vs ISO)] → both already work in `normalizeCardDate`; text ordering between them is stable enough, and consolidation belongs to GAP-11.
- [Retries add up to six extra recognitions per incomplete image (2.7 passes per image on average on the real samples, 7 at most)] → only incomplete images pay; the existing loading state covers it. Progress feedback is out of scope.
- [A misread can look plausible, such as `17.800` read as `7.800` or a `25` read as `28`] → nothing in the reader can tell; the 7-day rule only catches dates far from the rest. The review screen and the amount shown beside the image are the safeguard.
- [New dev dependencies hit `minimumReleaseAge`, `trustPolicy` and `blockExoticSubdeps`, and `@napi-rs/canvas` ships native binaries] → add them early in the tasks; if the install policy blocks it, fall back to running the accuracy suite through Cypress only and record that.
- [tesseract.js downloads language data from a CDN] → the component tests and the accuracy suite need network or a cached `cachePath`; CI is not wired in this change.
- [Cypress component testing on Next 16 needs Cypress 15.7.0 or newer and the webpack bundler, and this repo is on Next 16.3.5] → pin `cypress` at 15.7.0 or newer; the first task of group 9 is a smoke test that mounts the dialog, so an incompatibility shows up before any scenario is written. The browser Supabase client needs placeholder `NEXT_PUBLIC_SUPABASE_*` values, which the Cypress config supplies.
- [Cypress's Next integration does not work out of the box here, and needed two test-config workarounds] → Cypress's own `findPagesDir` returns the project root when there is no `pages/` folder, so Next's SWC loader treats all of `node_modules` as pages and rejects `export *` in MUI; `cypress/support/clearNextPagesDir.ts` clears `pagesDir` for the test build only. Next's style loader also needs a `#__next_css__DO_NOT_USE__` marker in the test HTML (`cypress/support/component-index.html`). The app's own build is untouched; both are likely to be needed again after a Cypress or Next upgrade if the bug is not fixed upstream.
- [Component tests skip the proxy, so the page-level auth path is untested] → accepted; see "Not covered by automation".
- [Accuracy thresholds could be set optimistically] → set from the first measured run on the real samples and ratchet up; do not hard-code 24/24.
- [More than 500 images in one upload] → still rejected as a whole by `BOOK-8`; unchanged.

## Migration Plan

App-only deploy, no database migration, no new tables or columns. Rollback is a revert: books created while the change was live keep their range titles, which are plain strings, and open normally in the old UI.

## Open Questions

- If a non-production Supabase project becomes available, add a login-based end-to-end spec on top of the component tests. Nothing in this change blocks it.
