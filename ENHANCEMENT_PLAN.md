# Nexora Enterprise — Recommended Enhancement Plan

## Goal

Preserve the current product experience while replacing unsafe security and data foundations, correcting core workflows, and adding enough automated assurance for continued development.

## Recommended direction

Treat Nexora as a real multi-user cloud application: use server-backed authentication, company-scoped authorization, and durable storage. If the intended product is only an offline single-user tool, remove the cloud, synchronization, multi-user, and protected-database claims instead.

## Implementation order

### P0 — Security and data foundation

- Remove public credentials and browser-trusted identity.
- Implement real authentication and secure session handling.
- Enforce role and company boundaries for every read and write operation, not only in the interface.
- Define one authoritative data schema, validation layer, and safe migration path for existing browser data.
- Add negative tests proving that invalid passwords, forged sessions, and cross-company access are rejected.

### P1 — Core correctness

- Standardize transaction types, project references, money calculations, and local-date handling.
- Repair the Turbo cash-flow, daily-entry, and purchasing workflows.
- Validate imported data before saving it and make storage failures visible and recoverable.
- Add automated tests for financial totals, dates, permissions, and the main user journeys.

### P1 — Frontend and deployment security

- Replace unsafe HTML insertion with escaped or structured rendering.
- Pin external dependencies and configure appropriate browser security headers, including a Content Security Policy.
- Ensure deployment configuration matches the hosting platform.

### P2 — Product quality

- Correct the service-worker caching strategy and verify offline behavior.
- Complete PDF and Gantt support or remove the unavailable actions.
- Add accessible labels, keyboard behavior, focus states, and compliant color contrast.
- Improve loading, empty, error, and recovery states for important workflows.

### P2 — Engineering assurance and handoff

- Add a dependency manifest, lockfile, linting, automated tests, and CI checks.
- Update the schema, setup, security, deployment, backup, and recovery documentation.
- Verify the application in supported browsers and run security, authorization, financial-regression, accessibility, and offline checks before release.

## Completion criteria

The enhancement is complete only when:

- Critical and high-priority findings in `FINDINGS_REPORT.md` are resolved with passing tests.
- Authentication and company isolation are enforced outside the browser interface.
- Financial records survive reloads and produce consistent totals and dates.
- Product claims match verified behavior.
- CI passes from a clean checkout and the deployment has documented rollback and recovery steps.

## Instructions for the implementing coding agent

Read both documents and inspect the current repository before editing. Work in the priority order above, use small reviewable commits, preserve existing data through migrations, and provide test evidence for each completed phase. Do not mark a finding resolved solely because its interface is hidden or its failing path was removed.
