import { describe, test, expect, beforeEach } from 'vitest';
import '../js/auth.js';
import '../js/rbac.js';

describe('WP-02 Authentication & Authorization Security Baseline', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    window.NEXORA = window.NEXORA || {};
    window.NEXORA.DB = {
      companies: [{ id: 'comp-1', name: 'شركة الخبر' }],
      employees: [
        { id: 'emp-1', company_id: 'comp-1', email: 'valid@company.com', status: 'active', role_code: 'company_admin' },
        { id: 'emp-2', company_id: 'comp-1', email: 'deactivated@company.com', status: 'inactive', role_code: 'worker' }
      ]
    };
  });

  test('Unregistered email login attempt is rejected', async () => {
    await expect(window.NEXORA.Auth.login('unknown@domain.com', 'wrongpass')).rejects.toThrow('البريد الإلكتروني غير مسجل');
  });

  test('Deactivated employee account is denied access', async () => {
    await expect(window.NEXORA.Auth.login('deactivated@company.com', 'pass123')).rejects.toThrow('الحساب معطّل');
  });

  test('Public owner backdoor email with hardcoded password is NO longer trusted without record', async () => {
    await expect(window.NEXORA.Auth.login('owner@nexora.sa', '123456')).rejects.toThrow('البريد الإلكتروني غير مسجل');
  });

  test('Worker role CANNOT access company admin views in RBAC', () => {
    window.NEXORA.Auth.getUser = () => ({ id: 'u-worker', role_code: 'worker' });
    expect(window.NEXORA.RBAC.can('admin')).toBe(false);
    expect(window.NEXORA.RBAC.can('owner')).toBe(false);
    expect(window.NEXORA.RBAC.canEdit()).toBe(false);
  });

  test('Company Admin can access admin & owner views in RBAC', () => {
    window.NEXORA.Auth.getUser = () => ({ id: 'u-admin', role_code: 'company_admin' });
    expect(window.NEXORA.RBAC.can('admin')).toBe(true);
    expect(window.NEXORA.RBAC.can('owner')).toBe(true);
    expect(window.NEXORA.RBAC.canEdit()).toBe(true);
  });
});
