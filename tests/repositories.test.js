import { describe, test, expect, beforeEach } from 'vitest';
import { projectRepository, cashFlowRepository } from '../js/repositories/index.js';

describe('WP-03 Asynchronous Repository Pattern & Tenant Filtering', () => {
  beforeEach(() => {
    window.NEXORA = window.NEXORA || {};
    window.NEXORA.Auth = {
      getUser: () => ({ id: 'usr-1', company_id: 'comp-100' })
    };
    window.NEXORA.DB = {
      projects: [
        { id: 'p1', company_id: 'comp-100', name: 'مشروع أ' },
        { id: 'p2', company_id: 'comp-200', name: 'مشروع ب (شركة ثانية)' }
      ],
      cashFlow: [
        { id: 'cf1', company_id: 'comp-100', type: 'inflow', amount: 5000 },
        { id: 'cf2', company_id: 'comp-200', type: 'inflow', amount: 9999 }
      ]
    };
  });

  test('Repository getAll returns ONLY records belonging to current company_id', async () => {
    const projects = await projectRepository.getAll();
    expect(projects.length).toBe(1);
    expect(projects[0].id).toBe('p1');
    expect(projects[0].name).toBe('مشروع أ');
  });

  test('Repository create automatically attaches current company_id', async () => {
    const newRecord = await cashFlowRepository.create({
      type: 'inflow',
      amount: 10000,
      category: 'تحصيل دفعة'
    });

    expect(newRecord.company_id).toBe('comp-100');
    expect(newRecord.amount).toBe(10000);
  });

  test('Repository update modifies record and updates updated_at timestamp', async () => {
    const updated = await projectRepository.update('p1', { name: 'مشروع أ المُعدل' });
    expect(updated.name).toBe('مشروع أ المُعدل');
    expect(updated.updated_at).toBeDefined();
  });
});
