# Plan 05 — PWA Reliability, Missing Features, and Accessibility

## Plan contract

- **Status:** Approved direction; implementation not started
- **Baseline:** refresh after Plan 04; original audit baseline c6bab00792b6a0f3abbe30b33925c22ee3f8e9c7
- **Owns:** service-worker reliability, honest offline scope, PDF export, Gantt rendering, keyboard and focus behavior, semantic labeling, contrast, RTL/responsive behavior, and real-page accessibility evidence
- **Related findings:** F-07, F-08, and F-09
- **Depends on:** Plans 01 through 04
- **Blocks:** Plan 06

This plan completes or explicitly disables incomplete user-facing features. A dependency installed in package.json or instantiated in a unit test is not feature integration.

## Required outcome

The built application provides a reliable, limited PWA shell; real PDF and Gantt workflows either work from production modules or are honestly hidden; and representative application routes meet WCAG 2.2 AA checks plus keyboard and screen-reader smoke testing.

The approved offline scope is application-shell availability and a clear offline state. Secure offline synchronization of business records is outside this remediation unless separately designed and approved.

## Baseline failures the executor must reproduce

- Application startup does not register the service worker on the live page.
- The service worker is absent from the current Vite artifact.
- The precache list omits most application assets and suppresses installation failures.
- Navigation fallback can resolve without a valid response.
- The PWA test asserts a hard-coded source string instead of loading the worker or browser.
- PDF export expects html2canvas and jspdf globals that production does not load.
- Gantt rendering expects window.Gantt that production does not load.
- The accessibility test scans a synthetic ideal snippet instead of **index.html** or application routes.
- Actual-page Axe testing finds four icon-only buttons without accessible names.
- Modal handling adds basic semantics but does not trap Tab focus and does not restore focus through closeAll.

Record current behavior with a fresh profile before implementation.

## Implementation sequence

### 1. Define and implement the PWA shell

1. Emit **sw.js**, the web manifest, icons, and required static assets as part of the production artifact.
2. Register the worker from the verified application startup and report registration/update failures visibly in diagnostics.
3. Derive precache URLs from the production build or a generated manifest; do not hand-maintain hashed filenames.
4. Fail worker installation when a required shell asset is missing.
5. Use an online-first strategy for navigation with a guaranteed offline document/response.
6. Use cache-first or stale-while-revalidate only for deliberately selected immutable static assets.
7. Never cache Supabase Auth, REST/RPC, tenant data, sensitive exports, or mutation responses.
8. Version caches and delete only obsolete Nexora-owned caches.
9. Handle waiting worker, activation, one-time reload, and update notification without reload loops.
10. Remove offline synchronization and encrypted-offline-database claims until a separate secure design exists.

### 2. Integrate PDF export as a production feature

1. Import the chosen PDF/rendering dependencies through the production module graph.
2. Decide whether the output is generated from structured report data or a rendered DOM capture; document the tradeoff.
3. Support Arabic text, RTL order, selected fonts, tables, page breaks, long content, dates, money, and file naming.
4. Avoid external network dependencies at export time unless explicitly required and tested.
5. Handle missing data, large reports, rendering failure, and user cancellation without false success.
6. Verify the downloaded file is non-empty, parseable, and contains recognizable expected content.
7. If acceptable Arabic output cannot be delivered, remove/disable the control and document the limitation rather than leaving a non-working button.

### 3. Integrate Gantt as a production feature

1. Import Frappe Gantt and its required CSS through production modules.
2. Map authorized project tasks to validated start/end/progress/dependency values.
3. Handle empty, missing-date, invalid-range, and large-task states.
4. Provide accessible summary/table information that does not require interpreting the visual chart.
5. Confirm rendering after route changes, project changes, resize, theme changes, and reload.
6. If the feature cannot meet the gate, hide it behind an explicit disabled state and update product documentation.

### 4. Repair semantics and keyboard behavior

1. Associate every form label with its control and provide useful names/instructions.
2. Name icon-only menu, notification, theme, close, and action buttons in Arabic.
3. Ensure headings and landmarks form a logical hierarchy with unique labels where needed.
4. Give every dialog an accessible name/description, initial focus, Tab/Shift+Tab trap, Escape behavior, and focus restoration.
5. Make menus, panels, tabs, forms, validation, notifications, and route changes operable by keyboard.
6. Use appropriate live regions for errors, progress, and toast messages without unexpected focus movement.
7. Preserve visible focus and prevent hidden/inert regions from receiving focus.

### 5. Verify visual accessibility and RTL behavior

1. Measure normal text, large text, icons, boundaries, focus indicators, and state colors in light and dark themes.
2. Meet WCAG 2.2 AA contrast thresholds: 4.5:1 for normal text and 3:1 for large text and relevant interface graphics.
3. Test 200% browser zoom and text expansion without losing content or actions.
4. Test representative mobile, tablet, and desktop widths.
5. Preserve RTL reading/order while keeping numbers, dates, charts, and mixed-direction text understandable.
6. Honor reduced-motion preferences and avoid motion-dependent information.

## Required route and state coverage

Run automated real-page checks on at least:

- landing;
- login and registration;
- dashboard;
- project list and detail;
- cash-flow and another financial form;
- reports/PDF;
- Gantt/project schedule;
- administration or owner screen under an authorized identity;
- an authorization-denied screen;
- validation-error, loading, empty, offline, and dialog states;
- light and dark themes.

Discover routes from the actual router where feasible. Synthetic snippets may support component unit tests but cannot close the accessibility gate.

## Blocking negative controls

| Failure injection | Expected result |
|---|---|
| Required shell asset removed | Worker install/PWA test fails |
| Supabase API response requested | No matching cache entry is created |
| First visit is offline | Honest offline response; no claim that data is synchronized |
| Waiting worker activates | At most one controlled reload |
| PDF dependency/import removed | Production feature test fails or control is explicitly disabled |
| Arabic multi-page report | Readable expected text/data and non-empty pages |
| Task has invalid dates | Gantt shows validation/empty state rather than crashing |
| Accessible name removed from icon button | Real-page Axe test fails |
| Focus trap removed | Keyboard dialog test escapes the dialog and fails |
| Focus origin element closes dialog | Focus returns to the triggering control |
| Theme color regresses | Automated contrast measurement fails |

## Required checks

| Gate | Environment | Expected result | Non-vacuity method |
|---|---|---|---|
| Worker artifact | Fresh production build | Worker, manifest, icons, and referenced assets exist | Rename one required shell asset |
| Online install/offline reload | Fresh browser profile | Install succeeds online and shell opens offline afterward | Clear caches first and assert registration/cache names |
| API-cache exclusion | Auth and tenant request fixtures | Sensitive responses never enter Cache Storage | Inspect cache keys after requests |
| Update lifecycle | Old build then new build | New worker activates once without loop/stale shell | Track controller changes and reload count |
| PDF | Seeded Arabic report in built app | Downloaded parseable non-empty PDF contains expected report evidence | Remove production import |
| Gantt | Seeded project tasks | Interactive chart and accessible alternative render | Include empty and invalid tasks |
| Axe | Actual routes and states | Zero serious/critical violations | Remove one known button name in a disposable copy |
| Keyboard | Real browser | Complete representative flow without pointer | Test modal trap, errors, menus, sign-out |
| Contrast/zoom/responsive | Both themes and representative sizes | AA thresholds and usable layout | Deliberately substitute a failing token in a disposable copy |
| Human accessibility smoke | Staging build | Short keyboard and screen-reader walkthrough recorded | Automated checks alone cannot mark this PASS |

## Command contract to create

Provide stable commands equivalent to:

    npm run test:pwa
    npm run test:features
    npm run test:a11y
    npm run test:e2e -- --grep @pwa
    npm run test:e2e -- --grep @pdf
    npm run test:e2e -- --grep @gantt
    npm run test:e2e -- --grep @accessibility

Record browser versions, route/state count, Axe result count, contrast measurements, cache inventory, downloaded artifact hashes, and manual-smoke operator/date.

## Prohibited shortcuts

- Testing a hard-coded service-worker string.
- Passing because the worker source file exists but is absent from the build.
- Swallowing shell-precache failures.
- Caching Auth/REST responses for offline convenience.
- Instantiating jsPDF in Node without exercising the production export action.
- Checking only that window.Gantt is truthy.
- Scanning a synthetic accessible DOM instead of the application.
- Claiming full WCAG conformance from Axe alone.
- Leaving a broken control visible because the dependency is installed.

## Completion and handoff

Plan 05 is complete only when the real built application passes the applicable PWA, feature, automated accessibility, and human smoke gates. Provide:

- offline-scope statement and removed product claims;
- worker version, build-manifest linkage, cache inventory, and update evidence;
- PDF and Gantt fixture/output hashes or explicit disabled-feature decision;
- route/state accessibility inventory;
- Axe, contrast, keyboard, zoom, responsive, and screen-reader evidence;
- known accessibility limitations and follow-up owners.

Do not begin Plan 06 while a user-visible PWA/PDF/Gantt control is falsely advertised or while serious/critical accessibility violations remain.
