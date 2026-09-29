# Tasks

## 1. Publish the capability specs

- [x] 1.1 Run `openspec validate baseline-specs --strict` and verify it passes with six delta specs
- [x] 1.2 Sync the deltas to `openspec/specs/` (`/opsx:sync`) and verify `openspec list --specs` lists auth, books, receipt-ocr, dashboard, billing and security
- [x] 1.3 Check every requirement ID in the old `spec/SPEC.md` §4 and §8 (AUTH-1..8, BOOK-1..8, OCR-1..6, DASH-1..6, BILL-1..7, SEC-1..5, PERF-1..2, L10N-1, A11Y-1, SEO-1) appears in exactly one `openspec/specs/*/spec.md`, using grep, and verify the counts match

## 2. Trim `spec/SPEC.md` to an index

- [x] 2.1 Replace §4 and §8 in `spec/SPEC.md` with a table of capability, requirement-ID range and link to `openspec/specs/<capability>/spec.md`, and verify no requirement text remains in the file
- [x] 2.2 Update the intro of `spec/SPEC.md` so it says requirements live in `openspec/specs/` and the citation rule applies there, and verify §1-3, §5-7, §9-11 are unchanged
- [x] 2.3 Verify every link in `spec/SPEC.md` resolves to an existing file, and that `README.md`'s link to `spec/SPEC.md` still works

## 3. Project context in `openspec/config.yaml`

- [x] 3.1 Add a short `context` (stack, layer boundaries, spec locations, pointer to `AGENTS.md`) without copying its rules, and verify `openspec list --json` still reads the config
- [x] 3.2 Add `rules` only if a rule is needed at artifact time (for example, "cite `file:line` for as-built claims"), and verify `openspec validate baseline-specs` still passes

## 4. Correct the `AGENTS.md` tree

- [x] 4.1 Add `src/app/main/`, `src/app/pricing/`, `src/features/login/`, `src/types/dashboard.ts` and `openspec/` to the tree, and verify each path exists with `ls`
- [x] 4.2 Fix the Redux Toolkit mention in the intro so it says it is installed but unused (cite `SPEC.md` GAP-13), and verify with `grep -rl reduxjs src` returning nothing
- [x] 4.3 Add `openspec/specs/` next to `spec/` in the tree with a one-line note on where requirements live, and verify the note matches task 2

## 5. Gate and commits

- [x] 5.1 Run `pnpm lint`, `pnpm exec next typegen`, `pnpm exec tsc --noEmit` and `pnpm test`, and verify all are green (no source changed, so failures mean unrelated breakage)
- [ ] 5.2 Commit docs only, in separate commits doc side first (specs and `SPEC.md`, then `config.yaml` and `AGENTS.md`), with the Co-Authored-By trailer, and verify `git status` shows no unrelated files staged
