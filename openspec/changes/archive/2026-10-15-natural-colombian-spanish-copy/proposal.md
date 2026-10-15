# Proposal

## Why

Much of the app's Spanish reads as a literal translation of English UI terms instead of natural Colombian accounting language. "Libro" promises a formal ledger (libro diario, libro mayor) when the object is really a titled batch of dated receipts. "Ganancias" means profit, while the rows are income entries. "Tarjetas", "Elementos", "Filas" and "Recorrido paginado de la colección" are calques of "cards", "items", "rows" and "paginated traversal of the collection". Some strings are still in English, and several lack accents. This makes the product feel foreign to its target users.

## What Changes

- Rename the user-facing container "libro(s)" to **"planilla(s)"**, with feminine agreement (la planilla, nueva, otra, todas las). The default title becomes "Planilla sin título" and the CSV filename fallback becomes `planilla.csv`.
- Rename the column and label "Ganancias" to **"Ingresos"** in the table, the CSV header, aria-labels and detail panel copy.
- Replace other translated copy:
  - "biblioteca financiera" and "tarjetas";
  - "Elementos", "Filas", "Recorrido paginado de la colección" and "acción masiva" in the summary stats;
  - "tablero con pulso editorial", "Incorpora otro libro al archivo y continúa catalogando", "enfocada en productividad", "sin fricción", and "patrones".
- Use one word, **"panel"**, for dashboard, tablero and panel. Replace "Email" with "correo".
- Translate the English SearchNavbar tooltips ("Select cards to delete", "Delete selected cards").
- Fix missing accents in user-visible text (gestión, fricción, conexión, último/última, debería, etc.).
- Keep tuteo (tú).
- Rewrite the landing page copy: the headline "Lecciones e insights de tus finanzas en minutos" (English "insights", calque "lecciones") and its subtext "Crea libros...", plus the segment sections below it ("simple y potente", "Estandariza el seguimiento...", "Visualiza desempeño...").
- **Let the user rename a planilla while editing it.** The detail view gets an editable title field in place of the heading, under the eyebrow (renamed from "Cuaderno de edición" to "Editar planilla"; "Volver al catálogo" becomes "Volver a mis planillas"). The title state and save already exist; only the field is missing.
- **Name the downloaded CSV after that title:** renaming to "semana 3" downloads `semana 3.csv`, saved or not. The export already follows the title shown, so this mostly needs the field and a test.
- No PDF export exists in the code, dependencies or tests, so there is nothing to remove. The `dashboard` spec's Purpose line still says "exports PDFs" and is corrected.
- Update the tests that assert on these strings.
- Existing stored rows titled "Libro sin título" are left as they are (no migration).
- Out of scope: identifiers, routes, DB tables and columns, English internal API error strings, and OCR fixtures or receipt text such as "Valor del pago".

No **BREAKING** changes. This is user-visible copy only, with no API or schema change. The one exception is the default title stored on new planillas.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `books`: the default title is quoted as "Libro sin título", and the table-columns scenario quotes the "Ganancias" column. Both become "Planilla sin título" and "Ingresos". A new requirement (BOOK-12) covers renaming a book in the detail view.
- `dashboard`: the CSV export quotes the "Ganancias" column, which becomes "Ingresos", and its filename rule now states that the file is named after the title shown, with scenarios for a rename, removed characters and an empty name.

## Impact

- **Code:** about 27 files under `src/` (navbar, root and page metadata, `lib/pricing.ts`, dashboard views, components and model, auth pages and layouts) plus matching `*.test.ts(x)` files and `cypress/component`.
- **Behavior:** the default title for new planillas and the CSV header text change, and the detail view gains a title field. Previously exported CSVs and saved titles are not rewritten. This goes beyond copy, but the change stays small because the title state and save already exist (`useMainDashboardState.ts:210`).
- **Also touched:** `DashboardDetailPanel.tsx` (title field, `onTitleChange` prop), `MainPageContent.tsx` (wiring), `src/app/page.tsx` (landing copy).
- **Docs:** `openspec/specs/books` and `openspec/specs/dashboard`. `spec/SPEC.md` and the README should be checked for quoted strings.
- **No** dependency, API contract, route, migration, or generated-type change.
