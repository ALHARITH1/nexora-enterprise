import { describe, test, expect } from 'vitest';
import { escapeHTML, validateImportJson } from '../js/utils/importValidator.js';

describe('WP-05 DOM, Import, & Security Baseline Tests', () => {
  test('escapeHTML neutralizes XSS payloads such as <img src=x onerror=alert(1)>', () => {
    const maliciousInput = '<img src=x onerror=alert("XSS")>';
    const escaped = escapeHTML(maliciousInput);
    expect(escaped).toBe('&lt;img src=x onerror=alert(&quot;XSS&quot;)&gt;');
    expect(escaped).not.toContain('<img');
    expect(escaped).not.toContain('>');
  });

  test('validateImportJson accepts valid NEXORA JSON backup files', () => {
    const validJson = {
      companyName: 'شركة الاختبار',
      projects: [{ id: 'p1', name: 'مشروع أ' }],
      cashFlow: [{ type: 'inflow', amount: 500 }]
    };
    const result = validateImportJson(validJson);
    expect(result.valid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  test('validateImportJson rejects malformed, empty, or un-recognized JSON backups', () => {
    const invalidJson = { randomData: 123 };
    const result = validateImportJson(invalidJson);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('الملف لا يحتوي على بيانات مقبولة لنظام NEXORA');
  });
});
