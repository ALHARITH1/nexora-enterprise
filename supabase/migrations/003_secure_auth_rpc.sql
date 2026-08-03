-- Migration 003: Secure Auth RPCs and Foreign Keys

-- 1. Add Foreign Keys to auth.users (Standard Supabase integration)
ALTER TABLE public.company_memberships
  ADD CONSTRAINT fk_company_memberships_user 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.platform_admins
  ADD CONSTRAINT fk_platform_admins_user 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Secure Function for Company Registration
-- This function runs securely as Postgres superuser, bypassing RLS to insert the initial company and admin membership.
CREATE OR REPLACE FUNCTION public.register_company_with_admin(
    p_company_name TEXT,
    p_company_email TEXT,
    p_company_phone TEXT,
    p_admin_name TEXT
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_company_id UUID;
    v_employee_id UUID;
    v_uid UUID := auth.uid();
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Insert Company
    INSERT INTO public.companies (name, email, phone, plan, status)
    VALUES (p_company_name, p_company_email, p_company_phone, 'enterprise', 'active')
    RETURNING id INTO v_company_id;

    -- Insert initial employee record for the owner
    INSERT INTO public.employees (company_id, name, email, phone, role_code, status)
    VALUES (v_company_id, p_admin_name, p_company_email, p_company_phone, 'company_admin', 'active')
    RETURNING id INTO v_employee_id;

    -- Insert Company Membership mapping the Auth user to the Company as admin
    INSERT INTO public.company_memberships (user_id, company_id, employee_id, role_code, is_active)
    VALUES (v_uid, v_company_id, v_employee_id, 'company_admin', true);

    RETURN v_company_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.register_company_with_admin(TEXT, TEXT, TEXT, TEXT) FROM public;
GRANT EXECUTE ON FUNCTION public.register_company_with_admin(TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- 3. Secure Functions for Membership Management
-- Function to change role securely
CREATE OR REPLACE FUNCTION public.change_member_role(
    p_company_id UUID,
    p_target_user_id UUID,
    p_new_role TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    -- Check if caller is company_admin
    IF NOT public.user_has_role(p_company_id, ARRAY['company_admin']) THEN
        RAISE EXCEPTION 'Unauthorized: Requires company_admin role';
    END IF;

    -- Prevent changing own role
    IF p_target_user_id = auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized: Cannot change your own role';
    END IF;

    UPDATE public.company_memberships
    SET role_code = p_new_role, updated_at = NOW()
    WHERE company_id = p_company_id AND user_id = p_target_user_id;

    RETURN TRUE;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.change_member_role(UUID, UUID, TEXT) FROM public;
GRANT EXECUTE ON FUNCTION public.change_member_role(UUID, UUID, TEXT) TO authenticated;

-- Function to toggle member active state securely
CREATE OR REPLACE FUNCTION public.toggle_member_active_state(
    p_company_id UUID,
    p_target_user_id UUID,
    p_is_active BOOLEAN
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    -- Check if caller is company_admin
    IF NOT public.user_has_role(p_company_id, ARRAY['company_admin']) THEN
        RAISE EXCEPTION 'Unauthorized: Requires company_admin role';
    END IF;

    -- Prevent deactivating oneself
    IF p_target_user_id = auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized: Cannot modify your own active state';
    END IF;

    UPDATE public.company_memberships
    SET is_active = p_is_active, updated_at = NOW()
    WHERE company_id = p_company_id AND user_id = p_target_user_id;

    RETURN TRUE;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.toggle_member_active_state(UUID, UUID, BOOLEAN) FROM public;
GRANT EXECUTE ON FUNCTION public.toggle_member_active_state(UUID, UUID, BOOLEAN) TO authenticated;
