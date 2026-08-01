# Plan 04 — Workflow Correctness and Client-Side Security

## Plan contract

- **Status:** Approved direction; implementation not started
- **Baseline:** refresh after Plan 03; original audit baseline c6bab00792b6a0f3abbe30b33925c22ee3f8e9c7
- **Owns:** financial/date correctness, consistency between Turbo and Enterprise modes, purchase and certificate rules, secure DOM rendering, safe end-user backup import, and removal of dangerous inline action patterns
- **Related findings:** F-04 and F-05
- **Depends on:** Plans 01 through 03
- **Blocks:** Plans 05 and 06

This plan uses the verified runtime, authorization, repositories, and schema from earlier plans. It must not add a parallel calculation or security utility that production consumers do not use.

## Required outcome

For the same authorized records, Turbo, Enterprise, dashboards, and reports must show identical dates and financial totals. User-controlled content must remain inert text in every production sink. Backup import must validate and write transactionally through the server-side data boundary.

## Baseline failures the executor must reproduce

- Finance and date utilities exist but are not imported by production.
- Turbo cash-flow summary falls back to zero totals when the utility global is absent.
- Standard cash-flow and report paths retain older calculations and UTC date truncation.
- Purchase and related records can use inconsistent project/type/category fields.
- Certificate previous-payment logic is not centralized across consumers.
- Toast messages are inserted with raw innerHTML.
- Search, notification, route-error, and other templates contain additional raw HTML sinks.
- The end-user backup import directly appends parsed JSON to local arrays.
- The new validator and escaping helper are tested in isolation rather than through production sinks.
- Inline event handlers and broad global functions prevent a strict script CSP.

Record each reproduced failure against a concrete UI or service path.

## Business rules to freeze

Before implementation, write these rules as domain tests and confirm any business decision not already approved:

- Cash-flow types are **inflow** and **outflow** only.
- Money is stored as PostgreSQL numeric values, rounded at a defined boundary, and formatted only for display.
- Business dates are SQL dates derived from the intended local calendar; audit timestamps are timestamptz.
- Running balances sort by business date and then stable creation timestamp/ID.
- Define whether a purchase creates a cost, a cash outflow, or both. If both, use one unique source reference so totals never double-count it.
- A purchase must retain the authorized selected project.
- Only explicitly approved certificate statuses count as previous payments; drafts and rejected certificates do not.
- Duplicate certificate numbers and duplicate financial source references are rejected under concurrency.
- Plain business fields do not accept rich HTML.

The execution report must identify the final approved rule for purchases and certificate statuses.

## Implementation sequence

### 1. Establish shared domain services

1. Create one imported date service and one imported finance/domain service.
2. Keep calculations pure where possible and place transactional commands behind repositories/protected functions.
3. Remove fallback calculations from views after all consumers use the shared services.
4. Make Turbo and Enterprise screens consume the same selectors and commands.
5. Add explicit currency, rounding, empty-value, and invalid-value behavior.

### 2. Repair dates and financial workflows

1. Replace every business-date default based on UTC string truncation.
2. Normalize existing cash-flow aliases during migration and reject new non-canonical types.
3. Repair Turbo cash-flow create, list, and summary behavior using the real repository.
4. Repair Turbo purchases so selected project, category, creator, source reference, amount, and business date survive reload.
5. Ensure purchase effects are counted exactly once according to the frozen rule.
6. Make daily labor/wage calculations use authorized projects, canonical dates, validated rates, and database constraints.
7. Centralize payment-certificate previous-payment and payable calculations.
8. Use transactions for commands that create more than one financial record.
9. Add deterministic running balances and cross-view reconciliation.

### 3. Remove executable content from rendering

1. Inventory all innerHTML, insertAdjacentHTML, template-string, URL, style, and event-handler sinks.
2. Classify each input as trusted static markup, constrained identifier, or user-controlled text.
3. Render user-controlled names, descriptions, errors, search terms, notifications, imports, and toast messages with text nodes/textContent.
4. Constrain icon names, route names, CSS classes, statuses, and data-action values through allowlists.
5. Sanitize only a deliberately approved rich-text feature; do not add a sanitizer to justify HTML in ordinary fields.
6. Ensure caught server/database errors are mapped to safe user messages and do not reveal tokens, SQL, or private data.

### 4. Replace inline actions with a controlled event model

1. Move inline onclick behavior to module-owned listeners or delegated data-action handlers.
2. Define a small action registry with explicit allowed actions and validated parameters.
3. Remove broad window-level mutation functions when their consumers are migrated.
4. Preserve keyboard behavior and accessible names while changing event wiring.
5. Make the resulting application compatible with a script policy that does not require unsafe-inline.

### 5. Implement safe end-user backup import

This is separate from Plan 03's one-time legacy migration.

1. Define a versioned backup envelope and maximum file size.
2. Validate JSON structure, schema version, collection types, fields, relationships, IDs, dates, amounts, statuses, and tenant ownership.
3. Show a preview with counts, warnings, conflicts, and intended changes.
4. Require an authorized administrator and explicit confirmation.
5. Send validated data to a protected server-side transactional import.
6. Reject unknown collections and conflicting/duplicate records unless a documented resolution mode is selected.
7. Create an audit event containing safe metadata, not full sensitive payloads.
8. On any validation or write failure, commit zero records.

## Required correctness fixtures

| Scenario | Expected observation |
|---|---|
| Inflow 1,000 and outflow 250 | Balance 750 in Turbo, Enterprise, dashboard, and report |
| Turbo purchase 125 | Visible immediately and after reload under selected project; counted once |
| Riyadh 2026-08-01 00:30 | Stored business date remains 2026-08-01 |
| Same-date transactions | Stable running order and balance across reloads |
| Draft/rejected certificates | Do not reduce next payable amount |
| Approved/paid certificate according to frozen rule | Reduces next payable amount exactly once |
| Two concurrent same certificate numbers | One succeeds and one conflicts |
| Transaction writing cost plus outflow | Both commit with one source reference or both roll back |
| Zero/negative/NaN/overflow amount | Rejected at client boundary and database boundary |

## Required security payloads

Exercise payloads through actual production paths, including:

- image tags with event attributes;
- closing tags and script tags;
- quotes and markup in employee, project, purchase, and report fields;
- malicious search terms and notification text;
- server error strings containing markup;
- dangerous route/action identifiers;
- prototype-related JSON keys;
- oversized JSON;
- cross-company records;
- duplicate IDs and broken relationships;
- unknown schema version.

The assertion is not that an escape helper returns encoded text. The assertion is that the production DOM contains inert text, no attacker-created element/event attribute, and no unauthorized data write.

## Blocking negative controls

| Failure injection | Expected result |
|---|---|
| Finance utility import removed | Production reconciliation test fails |
| Cash-flow summary fallback forced | Test detects zero/incorrect total |
| UTC date helper restored | Riyadh boundary test fails |
| Caller changes purchase project_id | RLS/domain command rejects unauthorized project |
| Second record write fails | Entire financial transaction rolls back |
| Toast receives image/onerror payload | No image element or event attribute is created |
| Route error contains markup | Markup appears only as text |
| Import contains one invalid relationship among valid rows | Zero rows are written |
| Import is Company B data under Company A session | Denied with zero writes |
| Inline onclick is reintroduced | CSP/static check fails |

## Required checks

| Gate | Environment | Expected result | Non-vacuity method |
|---|---|---|---|
| Domain unit tests | Fixed clock, amounts, statuses | Frozen rules pass at boundaries and malformed inputs fail | Temporarily invert one expected total in a disposable copy |
| Database constraints | Local Supabase | Invalid types, amounts, ownership, and duplicates are rejected | Direct normal-client calls bypassing UI |
| Cross-view reconciliation | Seeded production preview | Turbo, Enterprise, dashboard, and reports agree | Remove one production utility import |
| Workflow browser tests | Real built application | Create/read/reload/conflict flows work without console error | Force second transactional write to fail |
| DOM sink tests | Real components and views | Payloads remain inert and visible as safe text | Use MutationObserver/query selectors for attacker elements |
| Import tests | Protected server import and representative files | Valid import reconciles; every invalid case writes zero | Mixed valid/invalid transaction fixture |
| CSP readiness | Built HTML and source inventory | No inline script/handler dependency | Add a canary inline handler and prove check fails |

## Command contract to create

Provide stable commands equivalent to:

    npm run test:domain
    npm run test:security
    npm run test:import
    npm run test:e2e -- --grep @finance
    npm run test:e2e -- --grep @security
    npm run check:csp-readiness

Record test counts by scenario family. A unit test of a helper without a production integration assertion cannot close a gate.

## Prohibited shortcuts

- Loading utilities only in tests or assigning globals manually in test setup.
- Keeping old view calculations as fallback.
- Applying escapeHTML in a test while leaving actual innerHTML sinks.
- Catching a failed financial transaction and showing success.
- Importing directly into browser arrays.
- Silently skipping invalid imported records and committing the rest.
- Adding a permissive CSP to accommodate inline actions and calling it strict.

## Completion and handoff

Plan 04 is complete only when domain, browser, database, DOM, and import negative controls pass. Provide:

- frozen business-rule document and related test names;
- cross-view reconciliation values;
- inventory of removed/remaining HTML sinks and globals;
- import schema version, limits, reconciliation output, and rollback evidence;
- CSP-readiness report;
- exact production routes and workflows exercised;
- remaining product/security limitations.

Do not begin Plan 05 while financial reconciliation, DOM safety, or transactional import is failed or blocked.
