# NEXORA Enterprise — Target Multi-Tenant PostgreSQL Schema

> Supabase PostgreSQL + Row-Level Security (RLS) Multi-Tenant Data Architecture.
> Migration Baseline: `001_initial_schema.sql`

---

## Architecture Overview

All tenant records carry a non-null `company_id` UUID foreign key referencing `companies(id) ON DELETE CASCADE`. Access is restricted at the database level via PostgreSQL RLS policies that check `public.user_has_company_access(company_id)`.

```
companies (1) ──→ (N) company_memberships ←── (1) auth.users
companies (1) ──→ (N) employees
companies (1) ──→ (N) projects
projects  (1) ──→ (N) items
projects  (1) ──→ (N) tasks
projects  (1) ──→ (N) dailylogs
projects  (1) ──→ (N) approvals
projects  (1) ──→ (N) costs
projects  (1) ──→ (N) processes
projects  (1) ──→ (N) boq_items
projects  (1) ──→ (N) payment_certificates
projects  (1) ──→ (N) cash_flow
projects  (1) ──→ (N) daily_wages
projects  (1) ──→ (N) stakeholders
projects  (1) ──→ (N) contracts
projects  (1) ──→ (N) change_requests
companies (1) ──→ (N) audit_logs
```

---

## Core Tenant & Identity Tables

### 1. `companies`
- `id` (UUID, PK)
- `name` (TEXT, NOT NULL)
- `email` (TEXT, UNIQUE, NOT NULL)
- `phone` (TEXT)
- `plan` (TEXT, DEFAULT 'enterprise')
- `status` (TEXT, CHECK ('active', 'suspended', 'trial', 'cancelled'))

### 2. `platform_admins`
- `user_id` (UUID, PK)
- `granted_at` (TIMESTAMPTZ)
- `granted_by` (UUID)

### 3. `company_memberships`
- `id` (UUID, PK)
- `user_id` (UUID, NOT NULL)
- `company_id` (UUID, FK -> companies.id)
- `employee_id` (UUID, FK -> employees.id, NULLABLE)
- `role_code` (TEXT, CHECK IN ('company_admin', 'project_manager', 'site_engineer', 'accountant', 'supervisor', 'warehouse_keeper', 'worker'))
- `is_active` (BOOLEAN, DEFAULT true)

### 4. `employees`
- `id` (UUID, PK)
- `company_id` (UUID, FK -> companies.id)
- `legacy_id` (TEXT)
- `name` (TEXT, NOT NULL)
- `email` (TEXT)
- `phone` (TEXT)
- `role_code` (TEXT, DEFAULT 'worker')
- `daily_rate` (NUMERIC(15,2), DEFAULT 0.00)
- `status` (TEXT, CHECK IN ('active', 'inactive', 'terminated'))

---

## Project & Operational Collections (18 Runtime Collections)

1. `companies` — Tenant accounts
2. `employees` — Workforce directory
3. `projects` — Construction projects
4. `items` — WBS & BOQ items
5. `tasks` — Subtasks & assignments
6. `assignments` — Employee task assignments
7. `dailylogs` — Site daily progress logs
8. `approvals` — Approval workflows
9. `costs` — Material & overhead cost entries
10. `processes` — PMBOK process instances
11. `process_logs` — Audit log of process state changes
12. `boq_items` — Detailed Bill of Quantities
13. `payment_certificates` — IPC payment certificates
14. `cash_flow` — Cash inflow & outflow ledger
15. `daily_wages` — Daily worker attendance & wage calculations
16. `stakeholders` — Project stakeholders & influence matrix
17. `contracts` — Contracts & sub-contracts
18. `change_requests` — Scope & budget change requests

---

## Row-Level Security (RLS) Policy Specification

For every tenant table `T`:
```sql
CREATE POLICY T_tenant_policy ON public.T
FOR ALL
USING (public.user_has_company_access(company_id))
WITH CHECK (public.user_has_company_access(company_id));
```
