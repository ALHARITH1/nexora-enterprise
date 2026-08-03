# Nexora Enterprise — Platform Documentation & Developer Runbook

## 1. Overview

Nexora Enterprise is a multi-tenant cloud-native application designed for construction project management, cost tracking, BOQ engineering, daily labor logs, PMBOK process governance, payment certification, and real-time financial reporting.

---

## 2. Technical Stack & Toolchain Baseline (WP-00)

- **Frontend:** Vanilla JavaScript (ES modules) bundled via Vite
- **Database & Auth:** Supabase (PostgreSQL with Row-Level Security)
- **Styling:** CSS3 Design Tokens & Glassmorphism System
- **Testing:** Vitest + JSDOM + Axe-Core
- **Deployment:** GitHub Pages (via GitHub Actions artifact build). Note: GitHub Pages does not currently support strict `_headers` for Content-Security-Policy injection.

---

## 3. Getting Started

### Prerequisites

- Node.js 22+
- npm 10+

### Installation & Development

```bash
# Install dependencies with locked manifest
npm ci

# Start development server
npm run dev

# Run full test suite (54+ assertions covering RLS, Auth, Migration, Finance, Security, PWA, A11y)
npm test

# Run ESLint validation
npm run lint

# Build for production
npm run build
```

---

## 4. Environment Configuration

Copy `.env.example` to `.env.local` and set required cloud variables:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## 5. Database Schema & RLS Security Model (WP-01 & WP-02)

Database migrations reside in `supabase/migrations/001_initial_schema.sql`.

### Key Security Principles:
- Every tenant table contains a non-null `company_id` column.
- Row-Level Security (`ENABLE ROW LEVEL SECURITY`) is enforced across all 18 collections.
- User access is bounded by `company_memberships` and `platform_admins`.
- Public owner email backdoor (`owner@nexora.sa`) has been eliminated.
- Multi-record operations create audit records in `audit_logs`.

---

## 6. Financial & Date Rules (WP-04)

- Cash Flow transactions are strictly categorized as `inflow` or `outflow`.
- Running balances are computed deterministically by transaction date and creation timestamp.
- Dates are formatted from local timezone calendar objects (`YYYY-MM-DD`) to avoid UTC truncation rollover.
- Payment certificates count previous payments ONLY from `approved` or `paid` certificates.

---

## 7. Operational Runbooks & Release Handoff (WP-08)

### Data Migration & Backup
- Legacy JSON data exports can be converted using `js/migration/migrateLegacyData.js`.
- Exports are schema-validated using `js/utils/importValidator.js`.

### Deployment & CSP Verification
- Deployment is configured via GitHub Actions artifact upload to GitHub Pages.
- Since GitHub Pages does not currently parse `_headers`, strict CSP via HTTP headers is not enforced natively on this host. For production deployments requiring strict headers, it is recommended to transition to Cloudflare Pages or a similar host.
