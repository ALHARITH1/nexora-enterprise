/**
 * Legacy JSON Export Data Migration & Reconciliation Utility for Nexora Enterprise
 */

function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function migrateLegacyExport(legacyJson, targetCompanyId = null) {
  if (!legacyJson || typeof legacyJson !== 'object') {
    throw new Error('Invalid legacy JSON export format');
  }

  const companyId = targetCompanyId || generateUUID();
  const idMap = new Map(); // Maps legacy_id -> UUID

  function getOrCreateUUID(legacyId) {
    if (!legacyId) return generateUUID();
    const strId = String(legacyId);
    if (!idMap.has(strId)) {
      idMap.set(strId, generateUUID());
    }
    return idMap.get(strId);
  }

  const result = {
    version: '2.0.0',
    company_id: companyId,
    reconciliation: {
      source_counts: {},
      migrated_counts: {},
      financial_totals: {
        inflow: 0,
        outflow: 0
      }
    },
    tables: {
      companies: [],
      employees: [],
      projects: [],
      items: [],
      tasks: [],
      dailylogs: [],
      approvals: [],
      costs: [],
      processes: [],
      process_logs: [],
      boq_items: [],
      payment_certificates: [],
      cash_flow: [],
      daily_wages: [],
      stakeholders: [],
      contracts: [],
      change_requests: []
    }
  };

  // 1. Companies
  const rawCompanies = Array.isArray(legacyJson.companies) ? legacyJson.companies : [{ id: 1, name: legacyJson.companyName || 'شركة تجريبية' }];
  result.reconciliation.source_counts['companies'] = rawCompanies.length;
  rawCompanies.forEach(c => {
    const cId = companyId;
    result.tables.companies.push({
      id: cId,
      name: c.name || 'شركة المقاولات',
      email: c.email || 'info@company.sa',
      phone: c.phone || '',
      plan: 'enterprise',
      status: 'active'
    });
  });
  result.reconciliation.migrated_counts['companies'] = result.tables.companies.length;

  // 2. Employees
  const rawEmployees = Array.isArray(legacyJson.employees) ? legacyJson.employees : [];
  result.reconciliation.source_counts['employees'] = rawEmployees.length;
  rawEmployees.forEach(e => {
    const newId = getOrCreateUUID(e.id);
    result.tables.employees.push({
      id: newId,
      company_id: companyId,
      legacy_id: String(e.id || ''),
      name: e.name || 'موظف',
      email: e.email || '',
      phone: e.phone || '',
      role_code: e.role || 'worker',
      department: e.dept || '',
      daily_rate: Number(e.dailyRate || 0),
      status: 'active'
    });
  });
  result.reconciliation.migrated_counts['employees'] = result.tables.employees.length;

  // 3. Projects
  const rawProjects = Array.isArray(legacyJson.projects) ? legacyJson.projects : [];
  result.reconciliation.source_counts['projects'] = rawProjects.length;
  rawProjects.forEach(p => {
    const pId = getOrCreateUUID(p.id);
    result.tables.projects.push({
      id: pId,
      company_id: companyId,
      legacy_id: String(p.id || ''),
      code: p.code || 'PRJ',
      name: p.name || 'مشروع',
      description: p.description || '',
      client_name: p.client || '',
      contract_value: Number(p.contractValue || p.budget || 0),
      budget: Number(p.budget || 0),
      status: p.status === 'مكتمل' ? 'completed' : 'active',
      start_date: p.startDate ? p.startDate.split('T')[0] : new Date().toISOString().split('T')[0]
    });
  });
  result.reconciliation.migrated_counts['projects'] = result.tables.projects.length;

  // 4. Cash Flow (Normalizing income -> inflow, expense -> outflow)
  const rawCashFlow = Array.isArray(legacyJson.cashFlow) || Array.isArray(legacyJson.cashflow) ? (legacyJson.cashFlow || legacyJson.cashflow) : [];
  result.reconciliation.source_counts['cash_flow'] = rawCashFlow.length;
  rawCashFlow.forEach(cf => {
    const normalizedType = (cf.type === 'income' || cf.type === 'inflow') ? 'inflow' : 'outflow';
    const amount = Math.abs(Number(cf.amount || 0));
    const cfId = getOrCreateUUID(cf.id);
    const projId = cf.projectId ? getOrCreateUUID(cf.projectId) : null;

    result.tables.cash_flow.push({
      id: cfId,
      company_id: companyId,
      project_id: projId,
      legacy_id: String(cf.id || ''),
      type: normalizedType,
      category: cf.category || 'عام',
      description: cf.description || '',
      amount: amount,
      transaction_date: cf.date ? cf.date.split('T')[0] : new Date().toISOString().split('T')[0]
    });

    if (normalizedType === 'inflow') {
      result.reconciliation.financial_totals.inflow += amount;
    } else {
      result.reconciliation.financial_totals.outflow += amount;
    }
  });
  result.reconciliation.migrated_counts['cash_flow'] = result.tables.cash_flow.length;

  return result;
}
