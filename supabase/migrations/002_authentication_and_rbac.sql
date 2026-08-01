-- Migration 002: Real Authentication, RBAC, and RLS

-- 1. Tighten the user_has_company_access function with strict SECURITY DEFINER and fixed search_path.
CREATE OR REPLACE FUNCTION public.user_has_company_access(cid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Check if user is platform admin
    IF EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid()) THEN
        RETURN TRUE;
    END IF;

    -- Check active membership
    RETURN EXISTS (
        SELECT 1 FROM company_memberships
        WHERE user_id = auth.uid()
          AND company_id = cid
          AND is_active = true
    );
END;
$$;

-- Revoke public execution of sensitive functions
REVOKE EXECUTE ON FUNCTION public.user_has_company_access(UUID) FROM public;
GRANT EXECUTE ON FUNCTION public.user_has_company_access(UUID) TO authenticated;

-- Helper to check specific role
CREATE OR REPLACE FUNCTION public.user_has_role(cid UUID, req_roles TEXT[])
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid()) THEN
        RETURN TRUE;
    END IF;

    RETURN EXISTS (
        SELECT 1 FROM company_memberships
        WHERE user_id = auth.uid()
          AND company_id = cid
          AND is_active = true
          AND role_code = ANY(req_roles)
    );
END;
$$;
REVOKE EXECUTE ON FUNCTION public.user_has_role(UUID, TEXT[]) FROM public;
GRANT EXECUTE ON FUNCTION public.user_has_role(UUID, TEXT[]) TO authenticated;


-- 2. Drop the old blanket policies
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
        EXECUTE format('DROP POLICY IF EXISTS %I_tenant_policy ON public.%I;', tbl, tbl);
    END LOOP;
END $$;

-- Drop old specific policies
DROP POLICY IF EXISTS company_access_policy ON public.companies;
DROP POLICY IF EXISTS company_memberships_policy ON public.company_memberships;


-- 3. Replace with specific Policies

-- COMPANIES
CREATE POLICY companies_select ON public.companies FOR SELECT TO authenticated
USING (public.user_has_company_access(id));

CREATE POLICY companies_update ON public.companies FOR UPDATE TO authenticated
USING (public.user_has_role(id, ARRAY['company_admin']));
-- Normal users cannot INSERT or DELETE companies directly. (Handled via RPC or platform admin).

-- COMPANY MEMBERSHIPS
CREATE POLICY memberships_select ON public.company_memberships FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.user_has_company_access(company_id));

CREATE POLICY memberships_insert ON public.company_memberships FOR INSERT TO authenticated
WITH CHECK (public.user_has_role(company_id, ARRAY['company_admin']));

CREATE POLICY memberships_update ON public.company_memberships FOR UPDATE TO authenticated
USING (public.user_has_role(company_id, ARRAY['company_admin']))
WITH CHECK (public.user_has_role(company_id, ARRAY['company_admin']));

CREATE POLICY memberships_delete ON public.company_memberships FOR DELETE TO authenticated
USING (public.user_has_role(company_id, ARRAY['company_admin']));

-- AUDIT LOGS (Append only)
CREATE POLICY audit_select ON public.audit_logs FOR SELECT TO authenticated
USING (public.user_has_role(company_id, ARRAY['company_admin']));

CREATE POLICY audit_insert ON public.audit_logs FOR INSERT TO authenticated
WITH CHECK (public.user_has_company_access(company_id));
-- NO update or delete for audit logs

-- GENERAL TENANT TABLES
DO $$
DECLARE
    tbl TEXT;
    tenant_tables TEXT[] := ARRAY[
        'employees', 'projects', 'items', 'tasks', 'assignments', 'dailylogs',
        'processes', 'process_logs', 'boq_items', 'stakeholders'
    ];
BEGIN
    FOREACH tbl IN ARRAY tenant_tables LOOP
        EXECUTE format('
            CREATE POLICY %I_select ON public.%I FOR SELECT TO authenticated USING (public.user_has_company_access(company_id));
            CREATE POLICY %I_insert ON public.%I FOR INSERT TO authenticated WITH CHECK (public.user_has_company_access(company_id));
            CREATE POLICY %I_update ON public.%I FOR UPDATE TO authenticated USING (public.user_has_company_access(company_id)) WITH CHECK (public.user_has_company_access(company_id));
            CREATE POLICY %I_delete ON public.%I FOR DELETE TO authenticated USING (public.user_has_company_access(company_id));
        ', tbl, tbl, tbl, tbl, tbl, tbl, tbl, tbl);
    END LOOP;
END $$;

-- FINANCIAL & APPROVAL TABLES (Restricted roles)
DO $$
DECLARE
    tbl TEXT;
    restricted_tables TEXT[] := ARRAY[
        'approvals', 'costs', 'payment_certificates', 'cash_flow', 'daily_wages', 'contracts', 'change_requests'
    ];
BEGIN
    FOREACH tbl IN ARRAY restricted_tables LOOP
        EXECUTE format('
            CREATE POLICY %I_select ON public.%I FOR SELECT TO authenticated USING (public.user_has_company_access(company_id));
            CREATE POLICY %I_insert ON public.%I FOR INSERT TO authenticated WITH CHECK (public.user_has_role(company_id, ARRAY[''company_admin'', ''project_manager'', ''accountant'']));
            CREATE POLICY %I_update ON public.%I FOR UPDATE TO authenticated USING (public.user_has_role(company_id, ARRAY[''company_admin'', ''project_manager'', ''accountant''])) WITH CHECK (public.user_has_role(company_id, ARRAY[''company_admin'', ''project_manager'', ''accountant'']));
            CREATE POLICY %I_delete ON public.%I FOR DELETE TO authenticated USING (public.user_has_role(company_id, ARRAY[''company_admin'', ''project_manager'', ''accountant'']));
        ', tbl, tbl, tbl, tbl, tbl, tbl, tbl, tbl);
    END LOOP;
END $$;
