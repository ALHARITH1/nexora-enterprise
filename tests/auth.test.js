import { describe, test, expect, beforeEach, vi } from 'vitest';
import '../js/auth.js';
import '../js/rbac.js';

describe('WP-02 Authentication & Authorization Security Baseline', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    window.NEXORA = window.NEXORA || {};
    
    // Create a mock Supabase client to simulate the network boundary since Docker is unavailable
    window.NEXORA.Supabase = {
      client: {
        auth: {
          signInWithPassword: vi.fn(),
          signUp: vi.fn(),
          signOut: vi.fn()
        },
        from: vi.fn(),
        rpc: vi.fn()
      }
    };
  });

  test('Unregistered email login attempt is rejected', async () => {
    window.NEXORA.Supabase.client.auth.signInWithPassword.mockResolvedValue({ data: {}, error: new Error('Invalid credentials') });
    await expect(window.NEXORA.Auth.login('unknown@domain.com', 'wrongpass')).rejects.toThrow('البريد الإلكتروني أو كلمة المرور غير صحيحة');
  });

  test('Deactivated or unassigned employee account is denied access (fails closed)', async () => {
    window.NEXORA.Supabase.client.auth.signInWithPassword.mockResolvedValue({ 
      data: { session: { user: { id: 'usr-1', email: 'deactivated@company.com' } } }, 
      error: null 
    });
    
    const mockFrom = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) // No active membership found
    };
    window.NEXORA.Supabase.client.from.mockReturnValue(mockFrom);

    await expect(window.NEXORA.Auth.login('deactivated@company.com', 'pass123')).rejects.toThrow('الحساب معطّل أو غير مسجل في شركة');
  });

  test('Public owner backdoor email with hardcoded password is NO longer trusted without record', async () => {
    window.NEXORA.Supabase.client.auth.signInWithPassword.mockResolvedValue({ data: {}, error: new Error('Invalid credentials') });
    await expect(window.NEXORA.Auth.login('owner@nexora.sa', '123456')).rejects.toThrow('البريد الإلكتروني أو كلمة المرور غير صحيحة');
  });

  test('Worker role CANNOT access company admin views in RBAC', () => {
    window.sessionStorage.setItem('nexora_session', JSON.stringify({ id: 'u-worker', role_code: 'worker', company_id: 'c-1' }));
    expect(window.NEXORA.RBAC.can('admin')).toBe(false);
    expect(window.NEXORA.RBAC.can('owner')).toBe(false);
    expect(window.NEXORA.RBAC.canEdit()).toBe(false);
  });

  test('Company Admin can access admin & owner views in RBAC', () => {
    window.sessionStorage.setItem('nexora_session', JSON.stringify({ id: 'u-admin', role_code: 'company_admin', company_id: 'c-1' }));
    expect(window.NEXORA.RBAC.can('admin')).toBe(true);
    expect(window.NEXORA.RBAC.can('owner')).toBe(true);
    expect(window.NEXORA.RBAC.canEdit()).toBe(true);
  });
});
