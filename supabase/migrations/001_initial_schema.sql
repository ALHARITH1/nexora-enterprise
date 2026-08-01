-- Nexora Enterprise Multi-Tenant PostgreSQL Schema with RLS and Audit Trail

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Companies (Tenants)
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    address TEXT,
    plan TEXT NOT NULL DEFAULT 'enterprise',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'trial', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Platform Administrators
CREATE TABLE IF NOT EXISTS public.platform_admins (
    user_id UUID PRIMARY KEY,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    granted_by UUID
);

-- 3. Employees (Workforce directory)
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    legacy_id TEXT,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    role_code TEXT NOT NULL DEFAULT 'worker',
    department TEXT,
    daily_rate NUMERIC(15, 2) DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Company Memberships (Maps authenticated Supabase user to company & role)
CREATE TABLE IF NOT EXISTS public.company_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    role_code TEXT NOT NULL DEFAULT 'worker' CHECK (role_code IN ('company_admin', 'project_manager', 'site_engineer', 'accountant', 'supervisor', 'warehouse_keeper', 'worker')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, company_id)
);

-- 5. Projects
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    legacy_id TEXT,
    code TEXT,
    name TEXT NOT NULL,
    description TEXT,
    client_name TEXT,
    location TEXT,
    contract_value NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (contract_value >= 0),
    budget NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (budget >= 0),
    status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'on_hold', 'completed', 'cancelled')),
    start_date DATE,
    end_date DATE,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Items (WBS / BOQ Items)
CREATE TABLE IF NOT EXISTS public.items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    legacy_id TEXT,
    code TEXT,
    name TEXT NOT NULL,
    unit TEXT,
    quantity NUMERIC(15, 3) NOT NULL DEFAULT 0.000 CHECK (quantity >= 0),
    unit_rate NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (unit_rate >= 0),
    total_price NUMERIC(15, 2) GENERATED ALWAYS AS (quantity * unit_rate) STORED,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'blocked')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Tasks
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    item_id UUID REFERENCES public.items(id) ON DELETE SET NULL,
    legacy_id TEXT,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'done')),
    start_date DATE,
    due_date DATE,
    completion_percentage INT DEFAULT 0 CHECK (completion_percentage BETWEEN 0 AND 100),
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Assignments
CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    role_in_task TEXT DEFAULT 'assigned',
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(task_id, employee_id)
);

-- 9. Daily Logs
CREATE TABLE IF NOT EXISTS public.dailylogs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    legacy_id TEXT,
    log_date DATE NOT NULL,
    weather TEXT,
    work_performed TEXT,
    issues_notes TEXT,
    manpower_count INT DEFAULT 0 CHECK (manpower_count >= 0),
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Approvals
CREATE TABLE IF NOT EXISTS public.approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    legacy_id TEXT,
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('budget', 'task', 'payment', 'change_request', 'contract')),
    target_id UUID,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    requested_by UUID,
    approved_by UUID,
    comments TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Costs
CREATE TABLE IF NOT EXISTS public.costs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    legacy_id TEXT,
    category TEXT NOT NULL CHECK (category IN ('materials', 'labor', 'equipment', 'subcontractor', 'overhead')),
    description TEXT,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount >= 0),
    cost_date DATE NOT NULL,
    source_reference TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Processes (PMBOK Process Instances)
CREATE TABLE IF NOT EXISTS public.processes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    legacy_id TEXT,
    process_code TEXT NOT NULL,
    process_group TEXT NOT NULL,
    knowledge_area TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'initiated' CHECK (status IN ('initiated', 'in_progress', 'completed', 'on_hold')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Process Logs
CREATE TABLE IF NOT EXISTS public.process_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    process_id UUID NOT NULL REFERENCES public.processes(id) ON DELETE CASCADE,
    legacy_id TEXT,
    action TEXT NOT NULL,
    notes TEXT,
    performed_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. BOQ Items
CREATE TABLE IF NOT EXISTS public.boq_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    legacy_id TEXT,
    item_number TEXT NOT NULL,
    description TEXT NOT NULL,
    unit TEXT NOT NULL,
    quantity NUMERIC(15, 3) NOT NULL DEFAULT 0.000 CHECK (quantity >= 0),
    unit_rate NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (unit_rate >= 0),
    total_amount NUMERIC(15, 2) GENERATED ALWAYS AS (quantity * unit_rate) STORED,
    executed_quantity NUMERIC(15, 3) DEFAULT 0.000 CHECK (executed_quantity >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. Payment Certificates
CREATE TABLE IF NOT EXISTS public.payment_certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    legacy_id TEXT,
    certificate_number INT NOT NULL CHECK (certificate_number > 0),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    gross_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (gross_amount >= 0),
    deductions NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (deductions >= 0),
    net_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (net_amount >= 0),
    previous_payments NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (previous_payments >= 0),
    payable_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (payable_amount >= 0),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected', 'paid')),
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(project_id, certificate_number)
);

-- 16. Cash Flow
CREATE TABLE IF NOT EXISTS public.cash_flow (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    legacy_id TEXT,
    type TEXT NOT NULL CHECK (type IN ('inflow', 'outflow')),
    category TEXT NOT NULL,
    description TEXT,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount >= 0),
    transaction_date DATE NOT NULL,
    source_reference TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. Daily Wages
CREATE TABLE IF NOT EXISTS public.daily_wages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    legacy_id TEXT,
    work_date DATE NOT NULL,
    worker_name TEXT NOT NULL,
    daily_rate NUMERIC(15, 2) NOT NULL CHECK (daily_rate >= 0),
    overtime_hours NUMERIC(5, 2) DEFAULT 0.00 CHECK (overtime_hours >= 0),
    total_wage NUMERIC(15, 2) NOT NULL CHECK (total_wage >= 0),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18. Stakeholders
CREATE TABLE IF NOT EXISTS public.stakeholders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    legacy_id TEXT,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    organization TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    influence TEXT DEFAULT 'medium' CHECK (influence IN ('low', 'medium', 'high')),
    interest TEXT DEFAULT 'medium' CHECK (interest IN ('low', 'medium', 'high')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 19. Contracts
CREATE TABLE IF NOT EXISTS public.contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    legacy_id TEXT,
    contract_number TEXT NOT NULL,
    title TEXT NOT NULL,
    contractor_supplier TEXT NOT NULL,
    contract_value NUMERIC(15, 2) NOT NULL CHECK (contract_value >= 0),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'terminated')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 20. Change Requests
CREATE TABLE IF NOT EXISTS public.change_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    legacy_id TEXT,
    cr_number INT NOT NULL CHECK (cr_number > 0),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    cost_impact NUMERIC(15, 2) DEFAULT 0.00,
    time_impact_days INT DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted', 'under_review', 'approved', 'rejected')),
    requested_by UUID,
    approved_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(project_id, cr_number)
);

-- 21. Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID,
    action TEXT NOT NULL,
    entity_name TEXT NOT NULL,
    entity_id UUID,
    details JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ENABLE RLS ON ALL TABLES
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dailylogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.process_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boq_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_flow ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_wages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stakeholders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to check company access
CREATE OR REPLACE FUNCTION public.user_has_company_access(cid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if user is platform admin
    IF EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid()) THEN
        RETURN TRUE;
    END IF;

    -- Check active membership
    RETURN EXISTS (
        SELECT 1 FROM public.company_memberships
        WHERE user_id = auth.uid()
          AND company_id = cid
          AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS POLICIES FOR TENANT TABLES
DO $$
DECLARE
    tbl TEXT;
    tenant_tables TEXT[] := ARRAY[
        'employees', 'projects', 'items', 'tasks', 'assignments', 'dailylogs',
        'approvals', 'costs', 'processes', 'process_logs', 'boq_items',
        'payment_certificates', 'cash_flow', 'daily_wages', 'stakeholders',
        'contracts', 'change_requests', 'audit_logs'
    ];
BEGIN
    FOREACH tbl IN ARRAY tenant_tables LOOP
        EXECUTE format('
            DROP POLICY IF EXISTS %I_tenant_policy ON public.%I;
            CREATE POLICY %I_tenant_policy ON public.%I
            FOR ALL
            USING (public.user_has_company_access(company_id))
            WITH CHECK (public.user_has_company_access(company_id));
        ', tbl, tbl, tbl, tbl);
    END LOOP;
END $$;

-- Company policy (Users can read their registered company)
DROP POLICY IF EXISTS company_access_policy ON public.companies;
CREATE POLICY company_access_policy ON public.companies
FOR ALL
USING (
    EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.company_memberships WHERE user_id = auth.uid() AND company_id = public.companies.id AND is_active = true)
);

-- Company Memberships policy
DROP POLICY IF EXISTS company_memberships_policy ON public.company_memberships;
CREATE POLICY company_memberships_policy ON public.company_memberships
FOR ALL
USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.company_memberships cm WHERE cm.user_id = auth.uid() AND cm.company_id = public.company_memberships.company_id AND cm.role_code = 'company_admin' AND cm.is_active = true)
);
