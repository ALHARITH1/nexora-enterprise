# Nexora Enterprise — Implementation-Ready Enhancement Plan

## 1. Purpose and authority

This document is the implementation plan for resolving the findings in `FINDINGS_REPORT.md`. It is written for a coding agent and should be followed in priority order.

- Preserve the current Arabic/RTL experience, branding, content, and useful features.
- Resolve security and data correctness before visual expansion, SEO work, or additional animations.
- Treat `PROMPT.md` as aspirational product guidance. This plan controls remediation order and completion criteria.
- Do not use real company or financial data until WP-01 and WP-02 and their negative tests pass.
- Do not mark work complete because a button or route was hidden; the underlying operation must be protected.

## 2. Recommended target architecture

This plan assumes Nexora will become a real multi-user cloud application. The recommended path is:

- **Frontend:** keep the existing vanilla JavaScript views and migrate them incrementally to ES modules built with Vite. A React rewrite is not required.
- **Backend:** Supabase Auth and PostgreSQL, using database constraints and Row Level Security (RLS) as the final authorization boundary.
- **Deployment:** Cloudflare Pages for the frontend so `_headers` and the existing deployment direction can be used. Keep GitHub Pages demo-only until cutover.
- **Local storage:** retain non-sensitive preferences only. If the Supabase SPA client persists signed session material, the server must still validate it and derive company/role authorization through RLS; never trust a browser-stored user, role, or company object as authority.
- **Offline behavior:** use an online-first release initially. Cache the application shell, show a clear offline state, and remove offline-sync claims until secure record synchronization is actually implemented and tested.

```text
Browser views
    |
    v
Auth/session adapter ---> Supabase Auth
    |
    v
Domain services ---> repositories ---> PostgreSQL
                                      + constraints
                                      + tenant RLS
                                      + audit records

Service worker: versioned static assets only
localStorage: preferences and, if selected, signed auth-session material only
```

If the owner decides that Nexora must remain an offline-only single-user product, stop before P0 implementation and rewrite this plan for that target. A browser-only application cannot provide trustworthy multi-user authentication or tenant isolation.

## 3. Inputs the project owner must provide

The coding agent can build and test against a local Supabase instance without production credentials. Production cutover requires the owner to provide:

- Access to the intended Supabase and Cloudflare projects.
- The approved first platform-administrator account. Do not identify this account through a hardcoded email.
- A decision on whether existing browser data must be migrated or can be discarded as demo data.
- A retention period for migration backups and audit records.
- A decision on whether the platform-wide delete operation should be removed or replaced by a controlled administrative process.

Never commit service-role keys, access tokens, passwords, or production secrets. The public Supabase URL and anonymous key may be injected through build-time environment variables; the service-role key must remain server-side only.

## 4. Target data and authorization model

### 4.1 Identity and roles

Keep workforce records separate from application identities:

- `employees` remains the company workforce directory.
- Add `company_memberships` to connect an authenticated Supabase user to a company, optional employee record, stable role code, and active status.
- Add a server-managed `platform_admins` relationship or equivalent protected claim for platform administration. Users must not be able to grant this status to themselves.
- Store stable role codes such as `company_admin`, `project_manager`, `site_engineer`, `accountant`, `supervisor`, `warehouse_keeper`, and `worker`. Map them to Arabic labels in the UI.

Create one permission matrix used by route guards, action visibility, and database policies. The browser matrix improves UX; RLS and protected database functions provide security.

### 4.2 Tenant-owned records

Create migrations for all runtime collections currently listed in `js/config.js`:

`companies`, `employees`, `projects`, `items`, `tasks`, `assignments`, `dailylogs`, `approvals`, `costs`, `processes`, `process_logs`, `boq_items`, `payment_certificates`, `cash_flow`, `daily_wages`, `stakeholders`, `contracts`, and `change_requests`.

For every tenant-owned table:

- Use UUID primary keys and explicit foreign keys.
- Carry a non-null `company_id` on every tenant-owned table except the tenant root `companies`, including on project children, to make tenant policies and indexes auditable.
- Enforce that a child row's `company_id` matches its parent through composite foreign keys or protected database functions.
- Add `created_at`, `updated_at`, and `created_by` where relevant.
- Add check constraints for roles, statuses, positive monetary values, percentages, and allowed transaction types.
- Index `company_id`, common `project_id` relationships, dates, and status fields used by dashboards and reports.
- Prefer soft deletion or status transitions for financial, contract, approval, and audit-sensitive records.
- Define deliberate delete behavior. Do not cascade-delete financial history accidentally.

The PMBOK process catalog in `js/processes/processCatalog.js` can remain version-controlled reference data; per-company and per-project process state belongs in the database.

### 4.3 Financial and date rules

Freeze these rules before changing financial screens:

- Use `inflow` and `outflow` as the only cash-flow type values. Migrate `income` to `inflow` and `expense` to `outflow`.
- Define whether a purchase is a project cost, a cash payment, or both. If it creates both records, link them with a unique source reference so reports cannot double-count it.
- Store money in PostgreSQL `numeric` columns and centralize rounding and formatting in one domain utility.
- Store business dates as SQL `date` values and audit timestamps as `timestamptz`.
- Generate input dates from the user's local calendar date, not from UTC `toISOString()` truncation.
- Count only the certificate statuses approved by the business rule when calculating previous payments; drafts and rejected certificates must not reduce a new certificate.
- Sort running balances deterministically by business date and then creation time or ID.

## 5. Work packages

### WP-00 — Reproducible toolchain and safety baseline

- **Findings:** F-06
- **Primary files:** `index.html`, `js/app.js`, new `package.json`, lockfile, Vite configuration, ESLint configuration, tests, and `.github/workflows/ci.yml`.

Implementation:

1. Add a pinned Node toolchain with Vite, ESLint, Vitest, Playwright, and axe-core.
2. Define scripts for `dev`, `build`, `preview`, `lint`, `test`, `test:e2e`, `test:a11y`, and `test:pwa`.
3. Move the inline startup script from `index.html` into a testable entry module. Introduce Vite without redesigning the screens.
4. Pin browser dependencies through the package lock instead of unversioned CDN imports.
5. Add a CI workflow that installs with `npm ci`, lints, runs unit tests, builds, starts the production preview, and runs browser smoke tests.
6. Add a route smoke test covering every route currently declared in `js/router.js`; a route is successful only if it renders without an uncaught error.
7. Add `.env.example` containing variable names only. Make production builds fail clearly when required cloud configuration is missing.

Exit criteria:

- A clean checkout passes `npm ci`, `npm run lint`, `npm test -- --run`, and `npm run build`.
- Tests fail when a known assertion is inverted; zero selected tests are treated as failure.
- All current routes render in a production preview without a white screen or uncaught exception.
- No application behavior is intentionally changed in this package.

### WP-01 — Database schema, RLS, and migration tooling

- **Findings:** F-02, F-03, F-10
- **Depends on:** WP-00
- **Primary files:** `SCHEMA.md`, `js/config.js`, new `supabase/config.toml`, `supabase/migrations/`, `supabase/seed.sql`, RLS tests, and a local-export migration script.

Implementation:

1. Convert the 18 runtime collections into ordered SQL migrations using the target model in section 4.
2. Create company-membership and platform-administrator records separately from employee records.
3. Add RLS to every tenant-owned table. A normal user may only read or mutate rows permitted by active membership, role, and company.
4. Implement sensitive multi-record operations—company registration, invitations, role changes, subscription changes, and any platform-wide deletion—as protected database functions or server-side functions with explicit checks.
5. Add audit records for sign-in-relevant administration, role changes, subscription changes, approvals, imports, and destructive operations.
6. Update `SCHEMA.md` from the migrations so it documents the deployed schema rather than the old IndexedDB version.
7. Create a versioned migration utility for existing JSON exports. It must validate structure, map numeric legacy IDs to UUIDs, normalize cash-flow types and dates, and preserve a `legacy_id` mapping for reconciliation.
8. Import in dependency order: companies, identities/memberships/employees, projects, project children, operational records, then financial and reporting records.
9. Make migration idempotent: rerunning the same source export must not duplicate rows.

Migration safety:

- Export and hash the original browser data before conversion.
- Run validation and a dry-run report before writing to the cloud database.
- Reconcile record counts per collection and financial totals per company and project.
- Do not erase browser data automatically. Remove it only after staging verification, owner approval, and a retained backup.
- Maintain a rollback path to the previous deployment and database snapshot until cutover is accepted.

Exit criteria:

- Migrations succeed from an empty database and from the immediately previous schema version.
- Every RLS policy has at least one allowed and one denied test using two separate companies.
- The migration fixture covers all 18 collections, duplicate import, invalid input, missing relationships, and rollback.
- Reconciled counts and money totals match the source fixture exactly.

### WP-02 — Real authentication and authorization

- **Findings:** F-01, F-02
- **Depends on:** WP-01
- **Primary files:** `js/auth.js`, `js/supabaseClient.js`, `js/app.js`, `js/router.js`, `js/rbac.js`, `js/components/sidebar.js`, `js/views/admin.js`, `js/views/owner.js`, and `index.html`.

Implementation:

1. Replace the stub Supabase client with one initialized from environment configuration. Never expose the service-role key.
2. Replace local password logic with Supabase sign-up, sign-in, sign-out, password recovery, and session refresh.
3. Remove the public owner credential and all owner-by-email checks.
4. Require verified email for active application access, configure abuse limits for registration/sign-in/recovery, and require MFA or recent re-authentication for platform administration and destructive operations.
5. Create company registration atomically: authenticated user, company, membership, and initial administrator role must either all succeed or all roll back.
6. Replace locally created employee logins with an invitation or account-linking flow. Adding a workforce record must not silently create an authenticated user.
7. Resolve the current user from the verified auth session and active membership. Clear all user/company state on logout or membership deactivation.
8. Add allowed roles or permissions to each route in `js/router.js`. Reject direct hash navigation to forbidden screens with an accessible error and safe redirect.
9. Keep sidebar hiding as presentation only. Every create, update, approve, reject, import, delete, and subscription operation must be protected by RLS or a checked server function.
10. Remove or protect `ownerClearAllData`. If retained, require platform-admin authorization, recent re-authentication, typed confirmation, an audit record, and a recoverable backup.
11. Apply tenant filtering to dashboards, projects, reports, search, notifications, Turbo screens, processes, contracts, stakeholders, change requests, and all project selectors.

Blocking negative tests:

- A wrong password is rejected.
- Editing or forging `localStorage` does not create a session or owner privileges.
- A deactivated membership loses access after session refresh.
- A worker cannot open or call administrator operations.
- Company A cannot read or mutate Company B by changing a route, record ID, request body, or direct Supabase call.
- A company administrator cannot grant platform-administrator status.

Exit criteria:

- All negative tests above pass against a local Supabase instance.
- No password, privileged email, unsigned identity/role/company authority, or business record is stored as trusted browser state.
- Direct database calls remain tenant-safe even when the browser route and UI checks are bypassed.

### WP-03 — Replace global in-memory persistence with repositories

- **Findings:** F-02, F-03
- **Depends on:** WP-02
- **Primary files:** `js/store.js`, `js/utils/helpers.js`, all files under `js/views/`, `js/processes/processEngine.js`, `js/alerts.js`, and `js/components/interactive.js`.

Implementation:

1. Replace `NEXORA.DB` array mutation and whole-database `save()` calls with asynchronous, table-specific repository methods.
2. Keep UI state separate from server data. Theme, mode, and temporary selections may remain local; companies, employees, projects, finance, and sessions may not.
3. Centralize validation and error mapping so views receive typed success/error results rather than silently swallowing storage failures.
4. Add loading, empty, retry, and permission-denied states to every data-driven view.
5. Convert features in this order:
   1. company, membership, employee, and project selectors;
   2. projects, items, tasks, assignments, and daily logs;
   3. costs, cash flow, wages, BOQ, and certificates;
   4. processes, stakeholders, contracts, approvals, and change requests;
   5. dashboards, reports, global search, alerts, and owner administration.
6. Use one repository method for each operation and one domain selector for shared totals. Turbo and Enterprise views must consume the same underlying rules.
7. Prevent stale responses from replacing newer screen state when users switch projects or routes quickly.
8. Remove the IndexedDB/localStorage dual-write code after migration and cloud cutover. Do not keep an insecure production fallback.

Exit criteria:

- No feature directly pushes into a global business-data array or calls a global full-database save.
- Network and validation failures are visible and do not report false success.
- Reloading, opening a second tab, and concurrent edits do not silently overwrite newer records.
- All list and detail queries remain company-scoped under the two-company fixture.

### WP-04 — Financial, purchasing, certificate, and date correctness

- **Findings:** F-04
- **Depends on:** the relevant repositories from WP-03
- **Primary files:** `js/views/cashflow.js`, `js/views/turbo/cashflow.js`, `js/views/turbo/daily.js`, `js/views/turbo/purchases.js`, `js/views/dailyLabor.js`, `js/views/projectDetail.js`, `js/views/itemDetail.js`, `js/views/reports.js`, and new shared finance/date utilities.

Implementation:

1. Create shared date helpers for local `YYYY-MM-DD` values and explicit timestamp formatting. Replace every UTC-truncated date default.
2. Create shared finance selectors for inflow, outflow, balance, project cost, purchase totals, certificate totals, and running balances.
3. Migrate all Turbo cash-flow records to the canonical `inflow`/`outflow` values and make both modes use the same repository and selectors.
4. Fix Turbo cash-flow and daily entry functions so they reference `NEXORA.App` explicitly and require an authorized, company-owned project where the record requires one.
5. Make Turbo purchases persist the selected `project_id`, canonical category/type, creator, date, and amount. Ensure the same query that writes a purchase can read it back.
6. Prevent double-counting between project costs and cash payments according to the rule selected in section 4.3.
7. Calculate certificate previous payments only from allowed prior statuses and prevent duplicate certificate numbers under concurrency.
8. Use database transactions for operations that write more than one financial record.
9. Validate positive amounts, permitted dates, project ownership, and status transitions on both client and database boundaries.

Required fixtures and expected results:

- Inflow 1,000 and outflow 250 produce a 750 balance in both Turbo and Enterprise views.
- A Turbo purchase of 125 appears immediately, remains after reload, belongs to the selected project, and is counted exactly once.
- Creating Turbo cash-flow and daily-wage records produces no `ReferenceError`.
- At `2026-08-01 00:30` in `Asia/Riyadh`, the stored business date remains `2026-08-01`.
- Draft and rejected certificates do not reduce the next payable amount; an approved certificate does.
- Two entries on the same date produce a deterministic running balance.

Exit criteria:

- Unit tests cover all fixtures above plus zero, negative, malformed, and unauthorized values.
- Standard, Turbo, dashboard, and report totals agree for the same seeded records.
- Database constraints reject invalid financial records even when client validation is bypassed.

### WP-05 — DOM, import, dependency, and deployment security

- **Findings:** F-05
- **Depends on:** WP-00 and WP-02
- **Primary files:** `js/components/toast.js`, `js/components/interactive.js`, `js/router.js`, `js/utils/helpers.js`, `js/views/reports.js`, all view templates, `index.html`, and `_headers`.

Implementation:

1. Render user-controlled text with `textContent` or escaped DOM nodes. Do not place messages, names, descriptions, search terms, notification text, or caught error messages directly into HTML.
2. Use a strict whitelist for icon names, CSS classes, route names, statuses, and action identifiers.
3. Replace inline `onclick` strings and the large global action surface with event listeners or delegated `data-action` handlers. Move all inline scripts out of `index.html`.
4. Keep HTML sanitization only for features that intentionally accept rich HTML; plain business fields must remain plain text.
5. Replace raw JSON import with a versioned backup envelope, file-size limit, schema validation, relationship validation, preview, explicit administrator confirmation, and transactional server-side import.
6. Reject unknown schema versions, invalid IDs, cross-company rows, malformed values, and duplicates. Do not silently merge conflicting records.
7. Bundle and pin Chart.js, Supabase, PDF, and Gantt dependencies. Remove unpinned production CDN execution.
8. Add a Content Security Policy after inline handlers are removed. Limit scripts to self, connections to approved Supabase endpoints, and frames/objects to the minimum required.
9. Move inline style attributes into CSS progressively. If `style-src 'unsafe-inline'` remains temporarily necessary, document it as residual risk rather than describing the CSP as fully hardened.
10. Deploy through a host that applies `_headers`. Verify CSP, frame protection, MIME sniffing protection, referrer policy, and permissions policy on the actual staging URL.
11. Do not rely on the obsolete `X-XSS-Protection` header as an XSS control.

Blocking security tests:

- Payloads such as `<img src=x onerror=alert(1)>` remain visible as harmless text in toast, search, notification, project, report, and imported-data paths.
- A malformed or oversized backup is rejected before any write.
- A valid backup that fails midway leaves the database unchanged.
- A normal user cannot invoke import or destructive administration through a direct function call.
- The staging response contains the configured headers and the application runs without CSP violations.

Exit criteria:

- No user-controlled value reaches an unsafe HTML sink without an explicit reviewed sanitizer.
- No production script dependency is floating or loaded without the build's integrity controls.
- Header checks pass against the deployed staging environment, not only against the `_headers` file.

### WP-06 — PWA reliability and incomplete features

- **Findings:** F-07, F-08
- **Depends on:** WP-00 and stable production asset paths
- **Primary files:** `sw.js`, `manifest.json`, `index.html`, `js/app.js`, `js/components/interactive.js`, `js/views/reports.js`, and `js/views/projectDetail.js`.

Implementation:

1. Generate the precache list from built, hashed assets instead of maintaining a second hand-written list that differs from page URLs.
2. Fail service-worker installation when required application-shell assets are missing; optional assets may degrade with an explicit diagnostic.
3. Use a network-first strategy for navigation with a verified app-shell fallback, and an appropriate immutable strategy for hashed static assets.
4. Never cache Supabase authentication or tenant API responses in the general static cache.
5. Add an offline indicator. In the initial online-first release, disable writes while offline and explain that synchronization is unavailable.
6. Handle updates predictably: notify the user, activate the new version, remove old caches, and reload once without creating a loop.
7. Add PDF and Gantt libraries through pinned package imports. Lazy-load them when their feature is opened.
8. Provide visible loading and failure states. PDF export must preserve readable Arabic text and paginate large reports; Gantt must render, edit authorized task dates, and show a useful empty state.
9. If either feature cannot meet its acceptance checks, disable its action with an honest explanation rather than presenting a non-working control.

Exit criteria:

- After one successful online visit in a fresh browser profile, an offline reload renders the application shell without failed core assets.
- Returning online restores reads and writes without duplicate submissions.
- A deployed version change activates once and old caches are removed.
- PDF and Gantt tests exercise the real libraries and produce non-empty artifacts or rendered tasks.
- Landing-page offline claims match the behavior actually delivered.

### WP-07 — Accessibility and interaction quality

- **Findings:** F-09
- **Depends on:** stable markup from WP-05
- **Primary files:** `index.html`, `js/components/modal.js`, `js/components/interactive.js`, `js/components/header.js`, `js/components/sidebar.js`, all form-producing views, and CSS tokens under `css/`.

Implementation:

1. Associate every visible label with its control using `for` and `id`, or use an equivalent accessible name.
2. Add Arabic accessible names to menu, notification, theme, close, edit, delete, approve, and other icon-only buttons.
3. Give dialogs correct semantics, initial focus, focus trapping, Escape behavior, and focus restoration.
4. Make sidebar, tabs, search results, notification panels, tables, and generated controls fully keyboard operable.
5. Correct the color tokens that fail contrast. Meet WCAG 2.2 AA: 4.5:1 for normal text and 3:1 for large text and relevant interface graphics.
6. Preserve visible `:focus-visible` styles, reduced-motion support, RTL layout, 200% text zoom, and responsive behavior.
7. Announce form errors and toast notifications through appropriate live regions without stealing focus.

Exit criteria:

- Automated axe checks report no serious or critical violations on landing, authentication, dashboard, project, financial, report, and administration screens.
- A keyboard-only walkthrough can sign in, navigate, create a permitted record, handle a validation error, use a dialog, and sign out.
- Contrast is measured for both light and dark themes; visual inspection alone is insufficient.
- Automated checks are supplemented by a short human keyboard and screen-reader smoke test.

### WP-08 — Operations, documentation, and controlled release

- **Findings:** F-03, F-06, F-10 and all release-facing risks
- **Depends on:** WP-00 through WP-07
- **Primary files:** new `README.md`, `.env.example`, deployment documentation, migration runbook, backup/restore runbook, security documentation, `SCHEMA.md`, `robots.txt`, `sitemap.xml`, and Cloudflare configuration.

Implementation:

1. Document local setup, environment variables, database migration, seed accounts, tests, production build, and Cloudflare deployment.
2. Document role permissions, data classification, backup, restore, migration rollback, incident response, and account recovery.
3. Add safe global error and unhandled-rejection reporting that excludes credentials, tokens, and sensitive record content.
4. Align landing-page claims with verified authentication, cloud storage, encryption, offline, export, and availability behavior.
5. Run a staging migration with synthetic data, then execute the complete acceptance matrix in section 7.
6. Obtain human approval before importing real data or switching the production domain.
7. Keep the previous deployment and database backup available for the agreed rollback window.
8. Have the owner choose and add the appropriate software license; the coding agent must not invent ownership terms.

Exit criteria:

- A new developer can build and test from a clean checkout using the README.
- A staging operator can deploy, migrate, back up, restore, and roll back using the documented commands.
- Production configuration contains no demo credentials or development fallback.
- Product claims match observed staging behavior.

## 6. Required implementation sequence

```text
WP-00 Tooling
    |
    v
WP-01 Schema and RLS
    |
    v
WP-02 Authentication and authorization
    |
    v
WP-03 Repository migration
    |
    +----> WP-04 Financial/date correctness
    +----> WP-05 Frontend/deployment security
                 |
                 +----> WP-06 PWA and missing features
                 +----> WP-07 Accessibility
                              |
                              v
                        WP-08 Release handoff
```

Do not begin cosmetic expansion from `PROMPT.md` before WP-04 and WP-05 pass. WP-04 and WP-05 may proceed in separate branches only after their shared data and authentication contracts are stable.

## 7. Acceptance matrix

The implementing agent must create these scripts in WP-00 and keep them executable in CI.

| Check | Risk covered | Method and fixture | Expected result | Gate |
|---|---|---|---|---|
| Install/build | Reproducibility and missing assets | Clean checkout; `npm ci` then `npm run build` | Locked install and production build succeed with no missing asset | Blocking |
| Lint/unit | Syntax, domain regressions, false-green tests | `npm run lint`; `npm test -- --run`; fixed date and finance fixtures | All selected tests pass and the runner reports a non-zero test count | Blocking |
| Route smoke | White screens and missing renderers | `npm run test:e2e`; exercise every route declared in the router | Every permitted route renders; forbidden routes deny cleanly; no uncaught console errors | Blocking |
| Authentication | F-01 | Local Supabase; valid, invalid, expired, deactivated, and forged-session fixtures | Only valid active sessions succeed | Blocking |
| Tenant/RLS | F-02 | `npm run test:rls`; two companies and every tenant table | At least one allow and one deny assertion per policy; all cross-company operations fail | Blocking |
| Migration | F-03/F-10 and data loss | All 18 collections, malformed export, duplicate run, broken FK, rollback | Valid import reconciles; invalid/partial import writes nothing; rerun adds no duplicates | Blocking |
| Finance/date | F-04 | `Asia/Riyadh` fixed clock and section 5 fixtures | Turbo, Enterprise, dashboards, and reports agree exactly | Blocking |
| XSS/import | F-05 | Payloads through toast, search, notifications, fields, errors, and import | Payloads remain inert text and invalid imports produce zero writes | Blocking |
| PWA | F-07 | `npm run test:pwa`; fresh browser profile, online install, offline reload, version update | Shell works after install, update occurs once, no auth/API response is cached | Blocking for PWA claims |
| PDF/Gantt | F-08 | Real production build with Arabic report and seeded project tasks | Non-empty readable PDF and interactive Gantt, or feature is explicitly disabled | Blocking for feature claims |
| Accessibility | F-09 | `npm run test:a11y`, keyboard flow, light/dark contrast measurements | No serious/critical axe violations; manual smoke passes | Blocking |
| Deployment | Headers and production configuration | Cloudflare staging URL; response-header and browser CSP inspection | Required headers present, no CSP violations, no demo secret or local data fallback | Blocking |
| Performance | Regression awareness | Lighthouse on representative staging routes and data | Record baseline and investigate material regression; no unsupported score promise | Advisory until a budget is approved |

Limitations must be reported honestly: unit tests do not prove RLS, a local header file does not prove deployed headers, automated accessibility does not replace keyboard/screen-reader review, and a successful migration command does not prove reconciliation unless counts and totals are compared.

## 8. Finding-to-work traceability

| Finding | Required work packages | Resolution evidence |
|---|---|---|
| F-01 Authentication bypass | WP-01, WP-02 | Auth negative tests and absence of trusted browser identity |
| F-02 Authorization/tenant isolation | WP-01, WP-02, WP-03 | Per-policy allow/deny tests and cross-company denial |
| F-03 False cloud/sync/protection claims | WP-01, WP-03, WP-06, WP-08 | Durable cloud records, honest offline behavior, updated claims |
| F-04 Workflow and financial defects | WP-03, WP-04 | Shared-domain fixture results across all consuming views |
| F-05 XSS and unsafe import | WP-05 | Inert-payload tests and transactional import tests |
| F-06 Missing engineering baseline | WP-00, WP-08 | Locked toolchain and passing CI from a clean checkout |
| F-07 PWA cache mismatch | WP-06 | Production-build offline and upgrade tests |
| F-08 Missing PDF/Gantt dependencies | WP-00, WP-06 | Real artifact/render tests or honest feature disablement |
| F-09 Accessibility gaps | WP-07 | Automated and human accessibility evidence |
| F-10 Schema documentation drift | WP-01, WP-08 | Migrations and `SCHEMA.md` describe the same schema |

## 9. Definition of done

The enhancement is complete only when all of the following are true:

- Every critical and high finding has implementation evidence linked to a passing blocking check.
- Authentication and authorization remain secure when all browser-side guards are bypassed.
- Two-company tests prove tenant isolation across every tenant-owned table and sensitive function.
- Existing data is either reconciled through the migration process or explicitly declared disposable by the owner.
- Financial and date fixtures agree across Turbo, Enterprise, dashboard, and reports.
- No business data or unsigned user/role/company authority is persisted in `localStorage`.
- Production dependencies are pinned, CI is green from a clean checkout, and no test command passes with zero tests.
- Staging headers, CSP, PWA behavior, accessibility, PDF, and Gantt are checked against the real production build.
- Setup, backup, restore, migration, deployment, rollback, and account recovery are documented.
- The owner approves production data migration and domain cutover. A coding agent cannot grant that approval.

## 10. Instructions to the implementing coding agent

1. Read `FINDINGS_REPORT.md`, this plan, and the affected source before editing.
2. Implement one work package at a time using small reviewable commits.
3. Start each package by adding or updating its tests; include the negative controls named above.
4. Do not rewrite the UI framework, change the brand, or add unrelated marketing features during remediation.
5. If cloud credentials are unavailable, use local Supabase and complete everything that does not require production access. Report production verification as blocked rather than simulating success.
6. Never overwrite or delete source data without a validated backup, reconciliation report, and explicit owner approval.
7. After each package, record changed files, migrations, commands run, observed test counts, remaining risks, and rollback instructions.
8. Do not declare the application production-ready until every blocking item in the acceptance matrix passes in its stated environment.
