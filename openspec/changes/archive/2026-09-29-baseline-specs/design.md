# Design

## Context

`spec/SPEC.md` is a single as-built document whose requirements carry IDs (AUTH, BOOK, OCR, DASH, BILL, SEC, PERF, L10N, A11Y, SEO) and `file:line` citations. `openspec/specs/` is empty. See proposal.md for motivation. The delta specs in this change already hold the moved requirements.

## Goals / Non-Goals

**Goals:**

- Every requirement in `SPEC.md` lands in exactly one capability, with its ID and citation intact.
- `SPEC.md` keeps only what does not fit a single capability, and points at the capabilities for the rest.

**Non-Goals:**

- Rewriting requirement wording beyond adding SHALL and scenarios.
- Adding requirements for gaps.

## Decisions

**`SPEC.md` stays as a thin index (decided with the user).** Overview, glossary, routes, plans and entitlements, data model, API contracts, configuration, known gaps and open questions stay. `README.md` already links to it, and the data model and routes cut across capabilities. Alternative: retire it and move everything into OpenSpec; rejected because cross-cutting reference material has no single capability to live in.

**Capabilities follow the existing ID prefixes.** AUTH, BOOK, OCR, DASH and BILL map one-to-one. SEC, PERF, L10N, A11Y and SEO share `security` because they are cross-cutting guarantees. Alternative: separate `performance`, `i18n` and `seo` specs; rejected as too thin (one or two requirements each).

**Requirement IDs stay in the requirement names.** Existing citations elsewhere (README, gap list) keep resolving. Alternative: renumber; rejected as churn with no benefit.

**Citations stay inside requirement text.** They are the verification trail `AGENTS.md` requires ("cite `file:line`"). The proposal accepts that this makes specs slightly implementation-flavored.

**Gaps and open questions are not specs.** Specs describe behavior that holds today. Each gap becomes its own later change that adds or modifies requirements.

**`config.yaml` context is short.** It states the stack, the layer boundaries and where specs live, and points at `AGENTS.md` for the rest rather than copying it.

## Risks / Trade-offs

- [Two places drift: `SPEC.md` index and `openspec/specs/`] → the index links to capabilities and contains no requirement text, so there is one source per fact.
- [Citations go stale as code moves] → same risk as today; each future change updates its requirement and citation together.
- [`SPEC.md` routes and API tables overlap with capability behavior] → tables stay as reference; behavior is only normative in the capabilities.
