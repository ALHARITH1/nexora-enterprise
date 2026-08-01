# Plan 01 — Runtime Entrypoint and Production Build Recovery

## Plan contract

- **Status:** Approved direction; implementation not started
- **Baseline:** c6bab00792b6a0f3abbe30b33925c22ee3f8e9c7
- **Owns:** the broken startup sequence, missing login/register wiring, mixed classic-script/ES-module loading, unusable Vite artifact, missing production assets, and unsafe configuration fallback
- **Related findings:** F-06 directly; establishes the runtime required to resolve F-01, F-03, F-07, and F-08
- **Depends on:** nothing
- **Blocks:** Plans 02 through 06

This plan restores one trustworthy application runtime. It does not claim that authentication, authorization, data storage, or business workflows are secure; those are handled by later plans.

## Required outcome

There must be one production module graph and one startup path. The same built artifact that passes tests must be the artifact deployed to staging. On a fresh browser profile:

1. The landing and authentication screens load without console errors.
2. Application initialization runs exactly once.
3. Login and registration forms are handled by application code rather than native page reload.
4. Every required local script, stylesheet, manifest, icon, and service-worker asset is present.
5. Missing cloud configuration produces an explicit safe configuration screen and never activates a demo or local-authentication fallback.
6. A production preview behaves the same way as the selected deployment host with respect to asset paths.

## Baseline failures the executor must reproduce

Before editing, record the current commit and reproduce these failures:

- **js/main.js** exports an initialization function but does not invoke it.
- The inline controller removed from **index.html** contained application initialization plus login and registration listeners; its replacement did not preserve those behaviors.
- **js/supabaseClient.js** contains an ES import but is loaded by a classic script element.
- Vite warns that the classic application scripts cannot be bundled.
- The current build produces only four files and leaves 44 local application script URLs unavailable in the production preview.
- The GitHub Pages source deployment throws a module syntax error and does not register a service worker.

If any baseline fact has changed, update the execution record before continuing. Do not reuse the August 1 transcript as current evidence.

## Runtime design constraints

- Use **js/main.js** as the only application entrypoint.
- Convert production dependencies to explicit ES-module imports. Do not use script order or global objects as dependency injection.
- Keep temporary global compatibility exports only when a legacy inline action still consumes them. Record each shim and remove it before Plan 04 closes.
- Bootstrap in a deliberate order: validated configuration, external clients, repositories/services, view registrations, event handlers, then application initialization.
- Initialization must be idempotent. A second call may return the first startup promise, but it must not duplicate listeners, database opens, service workers, or route handlers.
- Use the Vite-built artifact for production verification. Passing the source development server is insufficient.
- Prefer provider-neutral relative asset paths unless a deployment decision records another base path. The GitHub Pages repository subpath must be covered if it remains a supported target.
- Business data must not fall back to IndexedDB or localStorage when cloud configuration or network access is unavailable.

## Implementation sequence

### 1. Establish the module graph

1. Inventory every script currently loaded from **index.html** and classify it as configuration, client, service, component, view, or startup code.
2. Import those modules through **js/main.js** or a small set of explicit barrel modules.
3. Convert legacy files incrementally where required so they can be imported without depending on parse order.
4. Remove classic local script elements only after their equivalent import is present and browser-tested.
5. Bundle Chart.js, Supabase, PDF, Gantt, and any supporting CSS through the module graph. Do not leave production libraries available only to tests.
6. Remove the production CDN script after its bundled replacement renders real charts.

### 2. Restore a complete startup controller

1. Move authentication-tab switching, form submission binding, and startup orchestration into testable modules.
2. Call the bootstrap function once after the required DOM and modules are ready.
3. Make startup failures visible in an accessible application-level error panel and in a sanitized console message.
4. Keep authentication operations behind an interface so Plan 01 can verify form wiring without implementing the security behavior owned by Plan 02.
5. Confirm that initialization restores public state, authenticated state, route state, theme, and mode in a deterministic order.

### 3. Make configuration fail closed

1. Validate required environment values during build or bootstrap.
2. Remove the demo Supabase URL and anonymous-key placeholder.
3. Permit an explicit test configuration only in the test environment.
4. Never catch a configuration failure and continue with local employee/password behavior.
5. Ensure secrets or service-role values cannot be bundled into client code.

### 4. Produce a complete deployable artifact

1. Configure Vite so JavaScript, CSS, manifest assets, icons, fonts, and the service-worker source are emitted or copied intentionally.
2. Add an artifact checker that parses built HTML and verifies every same-origin URL exists under the build directory.
3. Start the production preview on a fixed test port and exercise it from a fresh browser profile.
4. Verify direct loading at the root, repository subpath where applicable, and hash routes.
5. Record the build-directory inventory and SHA-256 hash for every emitted artifact.

### 5. Replace the vacuous route smoke test

1. Discover route names from the real router rather than duplicating a route-name array in the test.
2. Load the production application and visit every route under the appropriate test identity.
3. Assert that a route activates its intended section and renderer, not merely that its name exists.
4. Fail on uncaught exceptions, console errors, missing assets, blank application shells, or missing render functions.
5. Plan 01 may use a test-only session adapter solely to reach routes. Authorization decisions are not accepted until Plan 02 tests the real session and database.

## Required checks

| Gate | Environment and fixture | Expected result | Non-vacuity and negative control |
|---|---|---|---|
| Clean install | Fresh checkout, supported Node version | Locked install succeeds without changing the lockfile | Delete one locked package in a disposable copy; install/check must fail |
| Lint | Entire repository | Zero lint errors | Introduce one known undefined symbol in a disposable copy; lint must fail |
| Module graph | Built HTML and emitted chunks | No classic local application scripts; all expected modules are reachable | Remove one required entry import; runtime smoke must fail |
| Artifact integrity | Fresh build directory | Every same-origin HTML, manifest, icon, font, worker, CSS, and JS URL exists | Rename one emitted asset; checker must fail |
| Startup | Production preview, fresh browser profile | Bootstrap completes exactly once with no uncaught errors | Call bootstrap twice; listener and initialization counters remain one |
| Auth UI wiring | Production preview | Login and registration submissions are intercepted and call the configured auth port once | Remove a form listener; browser test must fail |
| Route rendering | Routes discovered from the real router | Each route renders or produces the expected authorization result | Replace one renderer with undefined; route test must fail |
| Configuration | Missing and valid test environment values | Missing values stop safely; valid values start | Remove the Supabase URL; no local fallback may appear |
| Base path | Root preview and selected hosted subpath | Assets and hash routes load from both supported locations | Use an incorrect base in a disposable build; hosted-path test must fail |

## Command contract to create

The executor must add stable, non-interactive scripts equivalent to:

    npm ci
    npm run lint
    npm run test:runtime
    npm run build
    npm run check:dist
    npm run test:e2e -- --grep @runtime

The execution report must state the exact commands, test count, route count, browser/version, build artifact count, build hashes, and any blocked environment. A successful build command without a successful artifact/browser check is a failure.

## Prohibited shortcuts

- Copying the whole source **js** directory into **dist** while keeping the mixed loading model.
- Calling the exported bootstrap manually from browser developer tools as acceptance evidence.
- Treating Vite warnings as harmless without proving the artifact.
- Leaving both the old inline startup and the new module startup active.
- Silently substituting demo Supabase values or local business storage.
- Using a synthetic HTML fixture instead of the built application.

## Completion and handoff

Plan 01 is complete only when all required checks pass and the production preview can be used as the test target for later plans. The executor must provide:

- changed files and one or more reviewable commits;
- module-entry and startup sequence description;
- removed compatibility shims and any remaining shims with owners;
- exact build inventory and hashes;
- browser console/network evidence;
- route and form test counts;
- rollback instructions;
- explicit remaining security limitations for Plans 02 through 06.

Do not begin Plan 02 if the production artifact or startup gate is failed or blocked.
