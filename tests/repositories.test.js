import { describe, test, expect, beforeEach, vi } from 'vitest';
import '../js/config.js';
import '../js/repositories/index.js';

const projectRepository = window.NEXORA.Repositories.projects;
const cashFlowRepository = window.NEXORA.Repositories.cash_flow;

function createQuery(result) {
  const query = {};
  query.select = vi.fn(() => query);
  query.eq = vi.fn(() => query);
  query.in = vi.fn(() => query);
  query.order = vi.fn(() => query);
  query.limit = vi.fn(() => query);
  query.insert = vi.fn(() => query);
  query.update = vi.fn(() => query);
  query.delete = vi.fn(() => query);
  query.single = vi.fn(async () => result);
  query.maybeSingle = vi.fn(async () => result);
  query.then = (onFulfilled, onRejected) => Promise.resolve(result).then(onFulfilled, onRejected);
  return query;
}

describe('WP-03 Fail-Closed Supabase Repository Pattern', () => {
  let client;
  let query;

  function installClient(result) {
    query = createQuery(result);
    client = { from: vi.fn(() => query) };
    window.NEXORA.Supabase = { client };
  }

  beforeEach(() => {
    window.NEXORA.Auth = {
      getUser: () => ({ id: 'usr-1', company_id: 'comp-100' })
    };
    installClient({ data: [], error: null });
  });

  test('list delegates to Supabase and applies the requested filters and ordering', async () => {
    const projects = [{ id: 'p1', company_id: 'comp-100', name: 'مشروع أ' }];
    installClient({ data: projects, error: null });

    await expect(projectRepository.list(
      { status: 'active' },
      { orderBy: 'created_at', ascending: false, limit: 10 }
    )).resolves.toEqual(projects);

    expect(client.from).toHaveBeenCalledWith('projects');
    expect(query.select).toHaveBeenCalledWith('*');
    expect(query.eq).toHaveBeenCalledWith('status', 'active');
    expect(query.order).toHaveBeenCalledWith('created_at', { ascending: false });
    expect(query.limit).toHaveBeenCalledWith(10);
  });

  test('create overrides caller-supplied tenant ownership with the authenticated company', async () => {
    const created = { id: 'cf1', company_id: 'comp-100', amount: 10000 };
    installClient({ data: created, error: null });

    await expect(cashFlowRepository.create({
      company_id: 'comp-attacker',
      type: 'inflow',
      amount: 10000
    })).resolves.toEqual(created);

    expect(client.from).toHaveBeenCalledWith('cash_flow');
    expect(query.insert).toHaveBeenCalledWith({
      company_id: 'comp-100',
      type: 'inflow',
      amount: 10000
    });
  });

  test('update strips immutable identity and tenant fields before sending the payload', async () => {
    const updated = { id: 'p1', company_id: 'comp-100', name: 'مشروع أ المُعدل' };
    installClient({ data: updated, error: null });

    await expect(projectRepository.update('p1', {
      id: 'replacement-id',
      company_id: 'comp-attacker',
      name: 'مشروع أ المُعدل'
    })).resolves.toEqual(updated);

    expect(query.update).toHaveBeenCalledWith({ name: 'مشروع أ المُعدل' });
    expect(query.eq).toHaveBeenCalledWith('id', 'p1');
  });

  test('operations fail closed when the Supabase client is unavailable', async () => {
    window.NEXORA.Supabase = null;
    await expect(projectRepository.list()).rejects.toThrow('Supabase client is not initialized or offline.');
  });
});
