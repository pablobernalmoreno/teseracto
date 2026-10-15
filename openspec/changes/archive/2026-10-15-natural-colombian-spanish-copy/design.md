# Design

## Context

The copy is hard-coded Spanish across about 27 files under `src/`, with no i18n layer (no message catalog). Strings appear in components, page metadata, `src/lib/pricing.ts`, server actions (`src/app/actions/dashboard.ts:356` writes the default title), and in tests that assert exact text. Some strings are also spec-quoted (`books` BOOK-5 and BOOK-11, `dashboard` DASH-5). See proposal.md for the motivation and scope.

## Goals / Non-Goals

**Goals:**

- One consistent glossary applied to every user-visible string.
- Correct gender and number agreement after "libro" → "planilla".
- Tests and specs keep matching the strings, with no behavior change beyond text.

**Non-Goals:**

- Introducing an i18n framework or moving strings into catalogs.
- Renaming identifiers, routes, DB objects or the `books` capability.
- Migrating stored titles.

## Decisions

**Glossary (single source of wording for the implementation):**

| Before                      | After                                        |
| --------------------------- | -------------------------------------------- |
| libro(s)                    | planilla(s), feminine agreement              |
| Libro sin título            | Planilla sin título                          |
| `libro.csv` fallback        | `planilla.csv`                               |
| Ganancias                   | Ingresos                                     |
| tarjetas / Elementos        | planillas                                    |
| Filas                       | movimientos                                  |
| tablero / dashboard / panel | panel                                        |
| Email                       | correo                                       |
| biblioteca financiera       | finanzas / planillas, by context             |
| patrones                    | tendencias, or wording about how money moves |

Marketing and summary-stat sentences ("tablero con pulso editorial", "Recorrido paginado de la colección", "enfocada en productividad", "sin fricción", "Incorpora otro libro al archivo...") are rewritten by hand in plain Colombian Spanish with tuteo, not mechanically substituted.

**Decision 1: Hand edit per file, not global search-and-replace.** Gender agreement ("un nuevo libro" → "una nueva planilla", "todos los" → "todas las") and the sentences above need judgment, and a blind replace would also hit identifiers, routes and OCR text. Alternative considered: a scripted replace with an allowlist. It is rejected because the exceptions outnumber the safe cases.

**Decision 2: Keep English identifiers.** `book`, `/api/dashboard/books`, `buildBookCsv`, `totalGanancias` and similar names stay; renaming them adds risk and touches external config for no user benefit. The local variable `totalGanancias` in `DataTable.tsx` is renamed to `totalIngresos` because it is a UI label in disguise, and it is not exported.

**Decision 3: No data migration.** Existing titles "Libro sin título" stay as stored. Rewriting user rows to change a default would also overwrite titles a user may have chosen deliberately. BOOK-5 records this.

**Decision 4: Tests change with the strings.** Assertions on UI text are updated to the new text; nothing else in the tests changes. OCR fixtures such as "Valor del pago" are receipt text and are untouched.

**Decision 5: An editable title field reusing the existing title state.** `useMainDashboardState` already holds `detailCardTitle`, `handleDetailTitleChange`, unsaved-change detection and the save of the title (`useMainDashboardState.ts:144`, `:210-212`, `:239`), and a user-typed title is kept when dates change (`:200-207`). Only the view is missing: `DashboardDetailPanel` renders the title as a heading and `MainPageContent.tsx:111-124` passes no change handler. The design is one `TextField` (maxLength 180, in the title's place under the eyebrow) plus an `onTitleChange` prop wired to `handleDetailTitleChange`. No new state. Alternative considered: a separate rename dialog. It is rejected because it adds a second edit path for something the screen already edits inline.

**Decision 6: The CSV filename is the title as shown.** `DashboardDetailPanel` already passes the live title to `exportBookToCsv` (`DashboardDetailPanel.tsx:59`), and the export already uses unsaved rows, so using the unsaved title keeps the file consistent with what is on screen. The existing sanitizing (`exportCsv.ts:79`) is kept; "semana 3" gives `semana 3.csv` with no change to that logic. Only the fallback changes to `planilla`.

**Decision 7: No PDF removal is needed.** The code, dependencies and tests contain no PDF export. The only trace is the stale Purpose line of the `dashboard` spec ("...and exports PDFs"), corrected as a documentation edit. A Purpose line is not a requirement, so it is edited directly in `openspec/specs/dashboard/spec.md` and not through a delta.

## Risks / Trade-offs

- [A missed "libro" leaves mixed terminology] → After the edits, search `src`, `cypress` and the docs for `libro`, `Ganancias`, `tarjeta`, and the other glossary words, and review every remaining hit.
- [Mixed old and new default titles in lists] → Accepted; the old title still reads correctly.
- [Wrong gender, such as "nuevo planilla"] → Review the strings listed in tasks.md and the changed tests.
- ["Planilla" also means payroll in Colombia] → Accepted; the context (dated receipts, amounts) disambiguates, and it was the user's choice.
- [Accessibility names change, so assistive-tech or Cypress selectors by label could break] → Search `cypress/` and tests for the old labels and update them in the same change.

**Decision 8 (found while implementing): an empty title is not saved.** The update action already ignores a blank title (`src/app/actions/dashboard.ts:335`, only `if (normalizedTitle)` is written), so saving with an empty field would silently keep the old stored title while the field stayed empty. The detail state therefore saves `detailCardTitle.trim() || initialDetailTitle` and puts that title back in the field. The earlier draft of BOOK-12 said an empty title becomes "Planilla sin título"; that is true only when creating a book, not when updating.
