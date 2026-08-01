# Plan 06 — CI, Deployment, Documentation, and Release Evidence

## Plan contract

- **Status:** Approved direction; implementation not started
- **Baseline:** refresh after Plan 05; original audit baseline c6bab00792b6a0f3abbe30b33925c22ee3f8e9c7
- **Owns:** trustworthy automated assurance, dependency health, production deployment, response headers, environment/runbooks, truthful documentation, rollback readiness, and the final evidence report
- **Related findings:** F-06 and F-10 plus release-facing evidence for F-01 through F-09
- **Depends on:** Plans 01 through 05
- **Blocks:** production-readiness proposal

This plan proves and documents the earlier work. It cannot turn a blocked or failed prerequisite into a pass, and it does not authorize deployment of real data or production cutover.

## Required outcome

A clean checkout must build and pass non-vacuous unit, database, browser, security, PWA, feature, and accessibility checks. The exact built artifact must be deployed to staging through one documented provider, and its behavior and headers must be verified at the real URL. Documentation must describe observed behavior rather than intended architecture.

## Baseline failures the executor must reproduce

- Local lint reports six errors and many warnings.
- GitHub Actions for the current commit fails at lint.
- The 54 passing tests include route-name tautologies, simulated RLS, hard-coded PWA strings, isolated escaping, and synthetic accessibility markup.
- The CI workflow stops at install/lint/unit/build and has no production preview, browser, database, PWA, or accessibility gate.
- npm audit reports a critical direct vulnerability in jsPDF 3.0.4.
- README claims Playwright although it is not installed.
- README claims Cloudflare Pages and strict CSP while the repository deploys from master:/ through legacy GitHub Pages.
- The live deployment has no Content-Security-Policy response header.
- README and SCHEMA.md describe cloud/RLS/audit behavior that the application does not currently execute.

Use fresh outputs after Plans 01 through 05; do not copy these baseline numbers into a completion report.

## Suite order and finding traceability

The six plans are executed in this order:

    01 Runtime and production build
      -> 02 Authentication, RBAC, and RLS
      -> 03 Data layer and legacy migration
      -> 04 Workflow correctness and client security
      -> 05 PWA, features, and accessibility
      -> 06 CI, deployment, documentation, and release evidence

| Finding/risk | Owning plan | Required final evidence |
|---|---|---|
| Startup and built-artifact regressions | 01 | Real production-preview boot, asset inventory, route/form smoke |
| F-01 authentication bypass | 02 | Real Auth negative controls and forged-state denial |
| F-02 authorization/tenant isolation | 02 and 03 | Per-policy/function matrix plus tenant-safe repositories |
| F-03 false cloud/protection claims | 02, 03, and 06 | Durable cloud data, no local fallback, truthful claims |
| F-04 finance/date/workflow defects | 04 | Cross-view fixture reconciliation |
| F-05 XSS/unsafe import | 04 | Production-sink payload tests and zero-write invalid import |
| F-06 assurance baseline | 01 and 06 | Clean CI including preview/browser/database checks |
| F-07 PWA | 05 | Built-worker online/offline/update/API-cache evidence |
| F-08 PDF/Gantt | 05 | Real artifact/render tests or explicit feature disablement |
| F-09 accessibility | 05 | Real-route automation plus human smoke |
| F-10 schema/documentation drift | 03 and 06 | Migrations, contracts, and docs agree |

No item may be marked fixed using evidence from another environment or a synthetic substitute.

## Implementation sequence

### 1. Replace false-green tests

1. Make route tests load the actual router, production entrypoint, views, and built browser application.
2. Make Auth tests use real local Supabase identities for blocking scenarios.
3. Make RLS tests apply and query the actual SQL migrations.
4. Make repository tests cover create/update/delete, caller ownership override, network/RLS failure, and production consumers.
5. Make security tests exercise every real DOM sink and end-user import path.
6. Make PWA tests inspect and run the emitted worker.
7. Make PDF and Gantt tests operate their real UI controls.
8. Make Axe tests visit actual routes and states.
9. Keep focused unit tests, but label their scope honestly.
10. Add minimum observed-unit counts derived from actual inventories so zero or missing cases fail.

### 2. Establish the complete CI pipeline

Use a supported, pinned Node runtime and locked dependencies. CI must run, in a deliberate order:

1. checkout and clean-install verification;
2. lint;
3. unit/domain tests;
4. local Supabase startup, migration reset/upgrade, Auth and RLS tests;
5. production build and artifact integrity check;
6. production-preview startup and health probe;
7. real browser route, auth, tenant, workflow, security, PDF, and Gantt tests;
8. PWA fresh-profile tests;
9. real-route accessibility tests;
10. dependency/security audit;
11. artifact manifest and evidence publication.

Do not use continue-on-error for blocking checks. A missing service, browser, test selection, or credential-free fixture is a failed/blocked job, not a successful skip.

### 3. Control dependency and supply-chain risk

1. Upgrade or replace the vulnerable jsPDF version without blindly forcing a major update.
2. Run feature regression tests against the selected safe version.
3. Pin direct dependencies and actions appropriately.
4. Remove unused dependencies and CDN execution.
5. Add an agreed high/critical audit threshold. Any exception requires a written owner-approved risk waiver with scope and expiry.
6. Record the lockfile hash and installed production dependency inventory.
7. Configure automated dependency update proposals without automatic production merge.

### 4. Choose and configure one production deployment path

The recommended default is a host that deploys the Vite artifact and supports response headers, such as Cloudflare Pages. If GitHub Pages remains the public demo, deploy **dist** through an Actions artifact workflow and document its header limitations.

1. Record the selected staging and production provider.
2. Deploy only the CI-produced artifact; do not rebuild differently inside the hosting provider unless reproducibility is proven.
3. Configure base paths, SPA/hash routing, cache headers, service-worker headers, and rollback behavior for that provider.
4. Apply CSP, frame protection, MIME-sniffing protection, referrer policy, and permissions policy through the provider's real mechanism.
5. Use a CSP that does not require unsafe-inline for scripts. Document any temporary style exception as residual risk.
6. Verify headers and CSP behavior on the actual staging URL.
7. Link deployed artifact hash, source commit, workflow run, and deployment ID.
8. Keep GitHub Pages demo-only or remove it if it can be mistaken for production.

### 5. Make documentation truthful and operational

Update documentation only after verified behavior exists:

- clean local setup and required tool versions;
- environment variable names, ownership, and safe defaults;
- local Supabase startup/reset/seed;
- complete test command map and what each test can prove;
- build, preview, deployment, and rollback;
- schema/migration order and SCHEMA.md parity;
- role/permission matrix;
- legacy-data dry run, backup, reconciliation, import, and rollback;
- backup/restore and retention;
- account recovery and administrator access;
- incident response and safe logging;
- offline scope, PWA update behavior, PDF/Gantt limitations;
- known limitations and demo-only states.

Remove or qualify claims about cloud sync, encryption, security, offline access, availability, Playwright, strict CSP, and audit history until the corresponding staging evidence passes.

### 6. Produce an honest execution and release-evidence report

Preserve the old **EXECUTION_REPORT.md** as historical evidence unless the owner explicitly requests replacement. Create a new report tied to the remediation commit and include:

- source commit and dirty/clean state;
- plan/file version executed;
- environment and fixture identity;
- exact commands and exit codes;
- observed test, route, table, policy, payload, accessibility-state, and artifact counts;
- negative-control results;
- artifact and lockfile hashes;
- CI run and staging deployment links;
- pass, fail, blocked, or not-run for every gate;
- skipped checks and limitations;
- rollback instructions;
- remaining risks and human decisions.

The report may propose readiness. Only the owner can accept real-data migration or production release.

## Required checks and final blocking acceptance matrix

| Gate | Expected final result |
|---|---|
| Clean checkout | Install does not modify lockfile; lint has zero errors |
| Unit/domain | Non-zero discovered tests and all frozen rules pass |
| Auth | Wrong password, forged state, expired token, and inactive membership denied |
| Tenant/RLS | Per-table and per-function allow/deny matrix passes in real local Supabase |
| Data/repositories | No insecure local fallback or direct business-array mutation |
| Migration | Full 18-collection fixture reconciles; rerun stable; failure rolls back |
| Runtime/build | Complete artifact starts with no missing assets or uncaught errors |
| Routes/workflows | Real browser covers discovered routes and critical create/read/reload flows |
| Finance/date | Cross-view values match frozen fixtures |
| Client security/import | Payloads inert; invalid imports write zero rows |
| PWA | Built worker passes online install, offline reload, update, and API exclusion |
| PDF/Gantt | Real feature checks pass or controls are honestly disabled |
| Accessibility | No serious/critical real-route Axe issues; manual smoke completed |
| Dependencies | No unwaived high/critical production vulnerability |
| Deployment | Staging serves exact artifact and required headers |
| Documentation/runbooks | Clean-checkout developer and staging operator can follow them |
| Rollback | Previous artifact/database restore procedure is exercised on staging |

## Global negative-control rules

- Each security, filtering, migration, route, asset, PWA, and accessibility gate must include an executable negative control.
- Negative controls run in disposable files, databases, builds, or branches and must be restored afterward.
- A control that unexpectedly passes reopens the plan; it is not recorded as a successful test.
- A hard-coded expected string, expect(true), route-name existence assertion, or copied policy helper cannot serve as closure evidence.
- A blocked database/browser/staging environment remains BLOCKED.

## Command contract to create and final sequence

The final scripts may differ in naming, but the report must provide an equivalent non-interactive sequence:

    npm ci
    npm run lint
    npm run test
    npm run db:start
    npm run db:reset
    npm run test:auth
    npm run test:rls
    npm run test:repositories
    npm run test:migration
    npm run test:security
    npm run build
    npm run check:dist
    npm run test:e2e
    npm run test:pwa
    npm run test:a11y
    npm audit --omit=dev

CI must stop at the first failed blocking stage while still retaining enough logs/artifacts for diagnosis.

## Prohibited shortcuts

- Reusing the old 54-test count as proof.
- Marking a gate pass because a dependency/file/config exists.
- Publishing a report before remote CI completes.
- Deploying source from master while testing a different dist artifact.
- Claiming response headers from a local _headers file.
- Hiding skipped checks in prose or labelling them advisory without an approved reason.
- Auto-fixing dependency majors without regression verification.
- Declaring production readiness or migrating real data without human approval.

## Completion and human handoff

Plan 06 is complete only when every applicable blocking gate is PASS and every unavailable external check is explicitly BLOCKED. Provide:

- green CI run tied to the exact source commit;
- immutable artifact, lockfile, and evidence hashes;
- staging deployment ID/URL and verified response headers;
- final traceability matrix for all findings and new regressions;
- exercised rollback evidence;
- truthful setup, security, migration, operations, and limitations documentation;
- owner decisions still required.

Completion of this plan supports a production-readiness review. It does not itself authorize release.
