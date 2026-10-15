## 1. Navigation, metadata and landing copy

- [x] 1.1 `src/components/navbar.tsx`: "Ver libros" / aria-label "Libros" → planillas; check "Historial y análisis"
- [x] 1.2 `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/main/page.tsx`, `src/app/pricing/page.tsx`, `src/app/(auth)/login/layout.tsx`, `register/layout.tsx`: replace "libros financieros", "biblioteca financiera", "enfocada en productividad", "sin friccion", "gestion", "patrones"; use "panel"
- [x] 1.3 `src/app/(auth)/account_confirmation/page.tsx`: "Email" → "correo"
- [x] 1.4 `src/app/page.tsx:61-69`: headline "Lecciones e insights / de tus finanzas en minutos" → "Tus cuentas claras / en pocos minutos"; subtext → "Crea planillas, registra movimientos y mira cómo se mueve tu plata. Una herramienta ligera y clara para tu equipo."
- [x] 1.5 `src/app/page.tsx` below the hero: rewrite "simple y potente", "Estandariza el seguimiento por regiones y comparte métricas clave", "Visualiza desempeño y detecta cambios en el momento correcto" and the other segment copy in plain Colombian Spanish

## 2. Pricing

- [x] 2.1 `src/lib/pricing.ts`: "Hasta 10 libros", "Libros ilimitados", "Movimientos por libro" and the per-book limits → planillas; review the other feature lines for calques
- [x] 2.2 `src/features/dashboard/view/DashboardPricingView.tsx`: accents ("conexion", "este bloqueado"), "Volver al tablero" → panel

## 3. Dashboard views and components

- [x] 3.1 `DashboardHistoryView.tsx`: "todos los libros", "Historial general de libros", "Volver a las tablas", "ultimo/ultima" (accents)
- [x] 3.2 `DashboardSummaryStats.tsx`: rewrite the four tone lines ("Tus libros listos...", "Filas cargadas en edición", "Elementos listos para acción masiva", "Recorrido paginado de la colección")
- [x] 3.3 `DashboardDetailPanel.tsx` and `ItemCard/ViewItemCard.tsx`: "Fecha del libro", "No se pudo exportar el libro", "ganancias" → ingresos; eyebrow "Cuaderno de edición" → "Editar planilla"; "Volver al catálogo" → "Volver a mis planillas"
- [x] 3.3a `DashboardDetailPanel.tsx`: replace the title heading with a `TextField` (accessible name for the planilla's name, `maxLength` 180, value `title`), add an `onTitleChange` prop; `MainPageContent.tsx:111-124`: pass `actions.handleDetailTitleChange`. Keep the heading fallback `Detalle de la planilla` when the title is empty (BOOK-12)
- [x] 3.3b Confirm `handleExportCsv` still passes the live `title` to `exportBookToCsv` (`DashboardDetailPanel.tsx:59`) so the file is named after the edited title, saved or not (DASH-5)
- [x] 3.4 `MainPageContent.tsx`: "Detalle del libro", the hero sentence ("tablero con pulso editorial"), loading text
- [x] 3.5 `ItemCard/NewItemCard.tsx`: aria-label and the "Incorpora otro libro..." sentence, with feminine agreement
- [x] 3.6 `InvalidEntryCarousel.tsx`: "El libro se guardará como" / "El libro aún no tiene fecha" → la planilla
- [x] 3.7 `SearchNavbar.tsx`: translate "Select cards to delete" / "Delete selected cards"; "tarjetas" in the aria-label
- [x] 3.8 `dataTable/DataTable.tsx`: header "Ganancias" → "Ingresos", aria-label "Ganancias del ...", rename `totalGanancias`, and update the comments

## 4. Model and server text

- [x] 4.1 `src/app/actions/dashboard.ts:356`: default title "Planilla sin título" (both occurrences)
- [x] 4.2 `model/exportCsv.ts`: header "Ingresos", filename fallback "planilla", error text "contenido del libro", comments
- [x] 4.3 `model/useItemCardModel.ts:106`: `SAVE_FAILED_MESSAGE` ("guardar la planilla")
- [x] 4.4 `model/state/useMainDashboardState.ts`: toast "Elementos eliminados correctamente" → planillas; check "Dia sin fecha" accent

## 5. Tests and specs

- [x] 5.1 Update text assertions: `exportCsv.test.ts`, `DataTable.test.tsx`, `InputDialog.test.tsx`, `DashboardDetailPanel.test.tsx`, `dashboard.test.ts`, `dashboardService.test.ts`, `route.test.ts` (books), `DashboardHistoryView.test.tsx`, `useItemCardModel.test.tsx`, `cypress/component/smoke.cy.tsx`, `uploadFlow.cy.tsx`
- [x] 5.1a Add tests: renaming in `DashboardDetailPanel` calls `onTitleChange` and shows the unsaved marker; exporting after a rename downloads `semana 3.csv`; characters removed; empty title downloads `planilla.csv` (`DashboardDetailPanel.test.tsx`, `exportCsv.test.ts`)
- [x] 5.2 Check `README.md` and `spec/SPEC.md` for quoted old strings and update them
- [x] 5.2a Docs commit: correct the Purpose line of `openspec/specs/dashboard/spec.md:5` ("...and exports PDFs") to say CSV; no PDF code exists to remove (verified: no match in `src/`, `package.json`, `cypress/`)
- [x] 5.3 Sweep: search `src`, `cypress`, docs for `libro`, `Ganancias`, `tarjeta`, `Elementos`, `Email`, `tablero`, and unaccented words; review every remaining hit

## 6. Verify

- [x] 6.1 Run the gate: `pnpm lint`, `pnpm exec next typegen`, `pnpm exec tsc --noEmit`, `pnpm test`; all green before any commit
- [ ] 6.2 Check the UI by eye on landing, login, panel, planilla detail, history and pricing; confirm gender agreement everywhere
- [x] 6.3 Commit docs/specs and code separately, docs first (per AGENTS.md)
