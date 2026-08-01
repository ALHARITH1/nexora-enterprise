# Plan 02 — Authentication, RBAC, and Tenant RLS

## Plan contract

- **Status:** Approved direction; implementation not started
- **Baseline:** refresh after Plan 01; original audit baseline c6bab00792b6a0f3abbe30b33925c22ee3f8e9c7
- **Owns:** verified authentication, membership resolution, route/action authorization, tenant isolation, secure platform administration, role-aware RLS, company lifecycle protection, and audit-log integrity
- **Related findings:** F-01 and F-02; security portion of F-03
- **Depends on:** Plan 01
- **Blocks:** Plans 03 through 06

This plan establishes the real security boundary. Browser checks improve user experience, but PostgreSQL constraints, RLS, and protected server functions are the final authority.

## Required outcome

An authenticated Supabase identity may act only through an active company membership and its approved role. Forged browser state, direct route navigation, caller-supplied company IDs, and direct Supabase requests must not expand authority.

The application must fail closed when authentication, membership lookup, or authorization cannot be verified. There is no production local-authentication fallback.

## Baseline failures the executor must reproduce

- An active local employee can log in with an incorrect password.
- A forged browser-storage object is accepted as an authenticated owner.
- Registration creates a local company administrator without creating or validating a Supabase identity.
- The public owner credential remains in the page.
- The router checks only whether a browser object exists and does not call the RBAC matrix.
- The current membership policy allows a user to modify their own role, company, and active status.
- One broad FOR ALL policy gives every active member every operation on tenant tables.
- Any active member can update or delete the company.
- Audit rows can be changed or deleted by tenant members.
- The platform-administrator table is omitted from RLS enablement.
- Existing RLS tests execute an invented JavaScript helper rather than the SQL migration.

Record fresh negative-control results before modifying these paths.

## Security model to freeze before implementation

### Identity and membership

- Supabase Auth owns passwords, email verification, password recovery, session refresh, and logout.
- **company_memberships** connects auth user ID, company ID, optional employee ID, stable role code, and active state.
- Workforce employees and authenticated identities remain separate concepts.
- Browser storage may contain SDK-managed signed session material, but browser-stored role, company, owner, or permission objects are never authority.
- Application startup resolves the current identity and active membership from Supabase before opening protected routes.

### Stable roles

Use stable codes and map them to Arabic labels in the UI:

- platform_admin
- company_admin
- project_manager
- site_engineer
- accountant
- supervisor
- warehouse_keeper
- worker

Before writing policies, create a checked-in permission matrix that lists every route and sensitive operation. Use the existing RBAC map only as a starting proposal; do not assume it is sufficient for approvals, finance, imports, membership changes, or destructive actions.

### Sensitive operations

The following operations require protected SQL or server-side functions with explicit authorization:

- company registration;
- membership invitation, activation, deactivation, and role change;
- platform-administrator grant or revocation;
- subscription or tenant-status changes;
- approval/rejection actions where business authority matters;
- imports and bulk mutations;
- company deletion or destructive reset;
- security-relevant audit creation.

The browser must never receive or use a service-role key.

## Implementation sequence

### 1. Correct identity and membership schema

1. Add foreign keys from membership identities to the appropriate Supabase auth identity where supported by the deployment model.
2. Make role and active-state changes possible only through protected functions.
3. Place platform administration in a protected schema or enable strict RLS and revoke direct mutation privileges.
4. Add uniqueness rules that prevent conflicting active memberships where the business rules prohibit them.
5. Add explicit tenant-status and membership-status handling.
6. Set a fixed search path on every SECURITY DEFINER function and revoke public execution unless deliberately granted.

### 2. Replace blanket RLS with operation- and role-specific policies

1. Write separate SELECT, INSERT, UPDATE, and DELETE policies where permissions differ.
2. Require active membership in the row company for every tenant operation.
3. Apply role checks for finance, approvals, administration, imports, and destructive operations.
4. Prevent callers from changing company ownership by submitting another company ID.
5. Protect company records from direct deletion. Use a reviewed lifecycle function or status transition.
6. Make audit history append-only for normal clients. Users must not update or delete audit records.
7. Avoid recursive membership policies. Test the actual query plan and error behavior.
8. Ensure inactive, suspended, or deleted memberships lose access promptly.

### 3. Implement real authentication flows

1. Initialize Supabase only from validated environment configuration.
2. Implement sign-up, email verification state, sign-in, sign-out, session refresh, recovery, and expired-session handling.
3. Remove the owner email/password text and every owner-by-email rule.
4. Remove local employee lookup from the authentication path.
5. Create a company and first membership atomically after a verified identity exists.
6. Convert employee account creation to an invitation or linking flow.
7. Clear company and user state on logout, membership deactivation, or refresh failure.
8. Add recent re-authentication and MFA requirements for platform administration or destructive operations if supported by the chosen Supabase plan.

### 4. Enforce authorization in browser consumers

1. Attach required permissions to every router entry.
2. Check permissions before route rendering and before invoking its renderer.
3. Return an accessible denial state and safe redirect for forbidden hashes.
4. Keep sidebar hiding as presentation only.
5. Guard every create, update, approve, reject, import, membership, subscription, and delete action.
6. Resolve the selected company/project from authorized data; never trust URL or form IDs without server enforcement.

## Required security fixture

Create two companies with representative records and these identities:

1. unauthenticated user;
2. Company A company administrator;
3. Company A project manager;
4. Company A accountant;
5. Company A worker;
6. Company A inactive member;
7. Company B company administrator;
8. protected platform administrator.

Fixtures must use real Supabase Auth identities and the migrated SQL. Mocks may support unit tests but cannot satisfy the blocking security gate.

## Blocking negative controls

| Attack or failure | Expected result |
|---|---|
| Existing email with wrong password | Authentication denied; no local fallback |
| Forged localStorage/sessionStorage role or company | No authenticated authority is created |
| Expired or invalid SDK token | Protected routes and data calls are denied |
| Inactive membership with otherwise valid token | All tenant access denied |
| Worker opens admin hash directly | Accessible denial and no admin renderer/action |
| Company A requests Company B record by ID | No row returned or changed |
| Company A submits Company B company_id during create | Database rejects or overwrites from verified context; never creates cross-tenant row |
| User updates their own membership role or active state directly | Denied |
| Company admin grants platform_admin | Denied |
| Normal member updates/deletes company | Denied |
| Normal member updates/deletes audit log | Denied |
| Caller invokes protected function without required role | Denied and no partial writes |
| Security-definer function resolves an attacker-controlled object through search_path | Impossible under fixed search path |

Run at least one allowed and one denied assertion for every policy and every protected function. Derive the table/policy inventory from the applied database rather than a duplicated hard-coded list.

## Required checks

| Gate | Environment | Expected result | Non-vacuity method |
|---|---|---|---|
| Database startup | Local Supabase and running container engine | Database, Auth, migrations, and seed are ready | Unavailable infrastructure is BLOCKED, never PASS |
| Migration application | Empty database and upgrade database | Ordered migrations apply successfully | Break one policy migration in a disposable database; reset must fail |
| Auth integration | Real local Auth identities | Valid active identity succeeds; invalid cases fail | Wrong-password and forged-storage controls must fail before the fix |
| RLS matrix | Two-company fixture and every tenant table | Every expected allow/deny result matches the matrix | Removing a company predicate in a disposable migration must make the suite fail |
| Role matrix | All representative roles | Only documented routes/actions/functions succeed | Change one expected role to worker; a sensitive operation must remain denied |
| Audit integrity | Admin and ordinary identities | Approved events append; direct alteration is denied | Attempt UPDATE and DELETE through the ordinary client |
| Browser authorization | Built production preview | Direct hashes and UI actions match database authority | Bypass sidebar and call route/action directly |
| Secret inspection | Built chunks and repository scan | No service-role key, password, or privileged email | Seed a canary secret in a disposable environment and prove scanner catches it |

## Command contract to create

Provide stable commands equivalent to:

    npm run db:start
    npm run db:reset
    npm run test:auth
    npm run test:rls
    npm run test:e2e -- --grep @auth
    npm run test:e2e -- --grep @authorization

If the Supabase CLI, container engine, browser, or required local Auth behavior is unavailable, mark the affected gate BLOCKED and stop. Do not replace it with a JavaScript policy simulation.

## Prohibited shortcuts

- Catching Supabase failures and logging in from local employees.
- Trusting browser-stored company, role, owner, or administrator flags.
- One FOR ALL tenant policy for roles with different permissions.
- Testing policies through a copied JavaScript function.
- Using the service-role client in browser or tests that are supposed to represent a normal user.
- Treating a hidden menu item as authorization.
- Giving ordinary users direct write access to memberships, platform admins, companies, or audit history.

## Completion and handoff

Plan 02 is complete only when the real local database and Auth negative controls pass. Provide:

- applied migration list and hashes;
- the frozen permission matrix;
- per-table and per-function allow/deny counts;
- auth and browser test counts;
- identities/roles used by the synthetic fixture;
- proof that browser-forged state has no authority;
- remaining limitations, including production MFA or email-provider checks;
- database and application rollback steps.

Do not begin Plan 03 while any critical auth, tenant, membership, platform-admin, or audit-integrity gate is failed or blocked.
