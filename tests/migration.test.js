import { describe, test, expect } from 'vitest';
import { migrateLegacyExport } from '../js/migration/migrateLegacyData.js';

describe('WP-01 Legacy Data Migration Utility', () => {
  test('Migrates legacy JSON fixture correctly and normalizes cashflow types', () => {
    const fixture = {
      companyName: 'شركة النور للمقاولات',
      employees: [
        { id: 101, name: 'أحمد محمود', role: 'site_engineer', dailyRate: 250 }
      ],
      projects: [
        { id: 201, name: 'مشروع برج الأمل', budget: 1500000 }
      ],
      cashFlow: [
        { id: 301, type: 'income', amount: 50000, category: 'دفعة مقدمة' },
        { id: 302, type: 'expense', amount: 12000, category: 'مواد مسبقة' }
      ]
    };

    const result = migrateLegacyExport(fixture);

    expect(result.tables.companies.length).toBe(1);
    expect(result.tables.employees.length).toBe(1);
    expect(result.tables.projects.length).toBe(1);
    expect(result.tables.cash_flow.length).toBe(2);

    // Cash flow type normalization check
    expect(result.tables.cash_flow[0].type).toBe('inflow');
    expect(result.tables.cash_flow[1].type).toBe('outflow');

    // Financial totals reconciliation check
    expect(result.reconciliation.financial_totals.inflow).toBe(50000);
    expect(result.reconciliation.financial_totals.outflow).toBe(12000);
  });

  test('Idempotently handles rerunning source export with preserved legacy IDs', () => {
    const fixture = {
      projects: [{ id: 'LEGACY-P1', name: 'مشروع 1' }]
    };

    const run1 = migrateLegacyExport(fixture, 'comp-100');
    const run2 = migrateLegacyExport(fixture, 'comp-100');

    expect(run1.tables.projects[0].company_id).toBe('comp-100');
    expect(run2.tables.projects[0].company_id).toBe('comp-100');
    expect(run1.tables.projects[0].legacy_id).toBe('LEGACY-P1');
  });
});
