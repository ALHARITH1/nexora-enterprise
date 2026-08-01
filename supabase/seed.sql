-- Seed data for testing and initial development

INSERT INTO public.companies (id, name, email, phone, plan, status)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'شركة البناء التقني', 'info@techbuild.sa', '+966500000001', 'enterprise', 'active'),
  ('22222222-2222-2222-2222-222222222222', 'شركة الأفق للمقاولات', 'info@horizon.sa', '+966500000002', 'enterprise', 'active')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (id, company_id, code, name, description, contract_value, budget, status, start_date)
VALUES
  ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'PRJ-001', 'برج الرياض السكني', 'مشروع إنشاء برج سكني مكون من 20 طابق', 5000000.00, 4500000.00, 'active', '2026-01-01'),
  ('44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'PRJ-002', 'مجمع جدة التجاري', 'تطوير مجمع تجاري متكامل', 8000000.00, 7200000.00, 'active', '2026-02-01')
ON CONFLICT (id) DO NOTHING;
