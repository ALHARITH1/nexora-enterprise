# Plan 03 — Data Layer, Repositories, and Legacy Migration

## Plan contract

- **Status:** Approved direction; implementation not started
- **Baseline:** refresh after Plan 02; original audit baseline c6bab00792b6a0f3abbe30b33925c22ee3f8e9c7
- **Owns:** fail-closed repositories, removal of local business-data persistence, schema/data-contract consistency, relational integrity, concurrency behavior, and safe migration of legacy browser exports
- **Related findings:** F-03 and F-10; data-boundary portion of F-02
- **Depends on:** Plans 01 and 02
- **Blocks:** Plans 04 through 06

This plan moves real business data behind the security boundary established in Plan 02. It does not cover the end-user backup/import UI; that is handled in Plan 04.

## Required outcome

Every business-data read and write travels through one asynchronous, tenant-safe repository or domain service backed by Supabase. A repository error is visible and cannot silently fall back to insecure local arrays. Existing browser data can be assessed, migrated, reconciled, and rolled back without duplicate or partial records.

## Baseline failures the executor must reproduce

- No production file imports the new repository barrel, finance/date utilities, or import validator.
- Twenty-six view files still read or mutate **NEXORA.DB**.
- Business arrays are written wholesale to IndexedDB and localStorage.
- Repository creation accepts a caller-supplied company ID that overrides the verified company.
- Local repository update and delete operations are not tenant-scoped.
- Supabase failures fall back to local success.
- Repository keys do not consistently match current store keys.
- The migration declares many tables but populates only companies, employees, projects, and cash flow.
- Real **cash_flow** exports migrate zero cash-flow records because only camel-case aliases are read.
- Repeated migration creates different UUIDs, and multiple source companies collapse into one target company ID.
- The current utility does not insert into a database, wrap writes in a transaction, or prove rollback.

Record the failing negative controls before changing implementation.

## Data architecture constraints

- Repositories receive verified identity/company context from the session boundary; callers cannot choose tenant ownership.
- PostgreSQL RLS remains the final tenant boundary even when repository filters are wrong.
- Repository methods return typed results or throw typed errors. They never convert network, RLS, validation, or concurrency failure into success.
- Theme, language, mode, and temporary UI selections may remain local. Companies, memberships, employees, projects, operational records, finance, audit data, and trusted sessions may not use the legacy store in production.
- Use canonical database field names and explicit mapping at the boundary. Do not allow each view to invent camel-case/snake-case conversions.
- Multi-record business operations use database transactions or protected functions.
- Applied migrations are immutable. If the current initial migration has already reached any shared environment, correct it with forward migrations rather than rewriting history.

## Implementation sequence

### 1. Correct relational and operational schema

1. Compare every runtime collection in **js/config.js** with the applied migrations and repository contracts.
2. Add missing constraints, indexes, update-timestamp behavior, and deliberate delete rules.
3. Enforce that child company IDs match parent company IDs through composite foreign keys or protected functions.
4. Add uniqueness rules needed for idempotency, certificate numbering, source references, and migration legacy IDs.
5. Prefer status transitions or soft deletion for financial, contract, approval, and audit-sensitive records.
6. Confirm all common company, project, date, and status queries have appropriate indexes.
7. Update **SCHEMA.md** from the actual migrations after verification, not before.

### 2. Define a strict repository contract

Each repository must provide the operations it genuinely supports, such as:

- list with explicit filters, pagination, ordering, and abort support;
- get by ID under verified tenant context;
- create with server-derived company, creator, and timestamps;
- update using tenant scope and optimistic concurrency where relevant;
- delete or status transition according to table policy;
- domain-specific transactional commands when a generic CRUD call is unsafe.

For all methods:

1. Strip or reject caller-supplied ownership and audit fields.
2. Propagate RLS, validation, conflict, not-found, offline, and timeout errors distinctly.
3. Never query without a verified active membership.
4. Never fall back to local business records.
5. Avoid returning mutable shared arrays.
6. Support cancellation so stale route/project requests cannot overwrite newer screen state.

### 3. Migrate production consumers in reviewable slices

Use this order and close each slice before the next:

1. company, membership, employee, and project selectors;
2. projects, items, tasks, assignments, and daily logs;
3. costs, cash flow, daily wages, BOQ, and payment certificates;
4. processes, process logs, approvals, stakeholders, contracts, and change requests;
5. dashboards, reports, global search, alerts, Turbo views, and owner administration.

For each slice:

- replace direct business-array access and full-database save calls;
- add loading, empty, retry, conflict, offline, and permission-denied states;
- verify read-after-write and reload behavior;
- verify that switching project/route cannot display a late response from the previous selection;
- add production-path tests before deleting the old path.

After all slices pass, remove the legacy business store from production. Keep any migration reader isolated, read-only, and unavailable during normal startup.

### 4. Build a real legacy-export migration pipeline

1. Define a versioned export envelope with source application version, export time, source company identity, collection hashes, and total file hash.
2. Accept the actual legacy keys, including snake-case names, and normalize aliases deliberately.
3. Cover all 18 runtime collections, including assignments and every relationship.
4. Validate file size, JSON shape, collection schemas, IDs, roles, statuses, dates, monetary values, and relationships before writes.
5. Generate deterministic target IDs from stable source identity, collection, and legacy ID, or persist a mapping table. Reruns must produce the same IDs.
6. Preserve source legacy IDs and source-company identity for reconciliation.
7. Import in foreign-key order inside a transaction.
8. Support dry run, write run, and rollback/recovery procedures.
9. Reconcile source and target counts by collection plus monetary totals by company/project.
10. Emit a machine-readable migration report without credentials or sensitive record content.

### 5. Protect source data and cutover

1. Hash and retain the source export before migration.
2. Never delete browser data automatically.
3. Run migration against synthetic and staging copies before any real data.
4. Require owner approval before importing or deleting real data.
5. Keep the previous application artifact and database snapshot for the agreed rollback window.

## Required migration fixtures

The fixture set must include:

- two distinct companies;
- all 18 runtime collections;
- cross-collection relationships;
- legacy numeric and string IDs;
- **cash_flow**, **daily_wages**, **process_logs**, and other real snake-case keys;
- income/expense aliases requiring normalization;
- same legacy ID in different collection/company namespaces;
- invalid role and status;
- missing parent;
- cross-company parent reference;
- duplicate source row;
- malformed date and amount;
- an intentional failure halfway through the dependency order.

## Blocking negative controls

| Attack or failure | Expected result |
|---|---|
| Create supplies another company_id | Ownership field rejected or replaced from verified server context |
| Company A updates/deletes Company B ID | No mutation |
| Supabase read/write fails | Visible typed failure; no local success or local write |
| Response from old project arrives late | It is cancelled or ignored |
| Duplicate/concurrent update | Conflict is detected; newer data is not silently overwritten |
| Real cash_flow export | Every valid row migrates and reconciles |
| Same export run twice | No duplicates and stable target IDs |
| Two source companies | Remain distinct tenants |
| Missing/cross-company relationship | Dry run fails and write run produces zero writes |
| Failure after partial table sequence | Transaction rolls back all writes |
| Modified source after hash | Migration refuses the mismatched input |

## Required checks

| Gate | Environment and fixture | Expected result | Non-vacuity method |
|---|---|---|---|
| Schema reset/upgrade | Empty DB and immediately previous schema | Both paths reach the same expected schema | Drop a required constraint in a disposable migration; schema test fails |
| Repository unit contract | Test client plus representative records | Ownership fields stripped and typed errors preserved | Force Supabase error; fallback must not occur |
| Repository integration | Real local Supabase, two companies | All CRUD/commands remain tenant-safe | Cross-tenant create/update/delete attempts |
| Consumer inventory | Entire production source | No direct business-data mutation outside approved migration adapter | Static check must fail when a canary NEXORA.DB push is added |
| Read/write flows | Production preview | Create, reload, second tab, conflict, and retry behave correctly | Delay one response and verify stale suppression |
| Migration dry run | Full 18-collection fixture | Validation and reconciliation report without writes | Invalid relationship yields zero writes |
| Migration write/rerun | Local DB and same source twice | Counts/totals match and second run adds zero rows | Compare IDs and database counts across runs |
| Migration rollback | Injected mid-run failure | No partial target records | Assert every table remains at pre-run count |
| Documentation parity | Migrations, repository mappings, SCHEMA.md | Names, relationships, and constraints match | Generated/schema comparison fails on a deliberate mismatch |

## Command contract to create

Provide stable commands equivalent to:

    npm run db:reset
    npm run test:repositories
    npm run test:data-integration
    npm run migration:dry-run -- --input <fixture>
    npm run migration:test
    npm run check:no-legacy-business-store

Commands must be non-interactive in CI. Real-data execution must remain an explicit, separately authorized operation and must never be part of ordinary tests.

## Prohibited shortcuts

- Retaining insecure local business data as an automatic production fallback.
- Spreading caller records after assigning company ownership.
- Catching Supabase errors and returning success.
- Testing only repository getAll while leaving update/delete unscoped.
- Calling a transformer idempotent because legacy IDs are preserved when generated IDs change.
- Validating only four collections and claiming all 18 migrated.
- Deleting source data immediately after a successful command.
- Updating SCHEMA.md to describe an intended design that migrations do not implement.

## Completion and handoff

Plan 03 is complete only when all production consumers use the verified data boundary and the full migration fixture passes. Provide:

- schema and repository contract versions;
- changed consumer inventory and remaining approved local-preference keys;
- proof that direct business-store access is absent;
- per-table integration test counts;
- migration source/target hashes, counts, financial totals, and stable-ID comparison;
- rollback and source-backup locations without exposing sensitive contents;
- unresolved concurrency or cutover limitations.

Do not begin Plan 04 while tenant-safe repository integration or migration rollback is failed or blocked.
