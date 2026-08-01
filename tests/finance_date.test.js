import { describe, test, expect, beforeEach } from 'vitest';
import { roundMoney, formatMoney, calculateCashFlowSummary, calculateCertificatePreviousPayments, calculateRunningBalances } from '../js/utils/financeUtils.js';
import { getLocalDateString } from '../js/utils/dateUtils.js';
import '../js/views/turbo/cashflow.js';
import '../js/views/turbo/purchases.js';
import '../js/views/turbo/daily.js';

describe('WP-04 Financial & Date Correctness Tests', () => {
  beforeEach(() => {
    window.NEXORA = window.NEXORA || {};
    window.NEXORA.App = { curProjId: 'proj-100' };
    window.NEXORA.Helpers = {
      gf: () => 'id-' + Math.random(),
      msg: () => {},
      esc: s => s,
      fmt: n => n
    };
    window.NEXORA.DB = {
      projects: [{ id: 'proj-100', name: 'مشروع البرج' }],
      costs: [],
      cash_flow: [],
      daily_wages: [],
      employees: [{ id: 'e1', full_name: 'علي أحمد', active: true }]
    };
  });

  test('Inflow 1000 and Outflow 250 produce net balance 750', () => {
    const flows = [
      { type: 'inflow', amount: 1000 },
      { type: 'outflow', amount: 250 }
    ];
    const summary = calculateCashFlowSummary(flows);
    expect(summary.inflow).toBe(1000);
    expect(summary.outflow).toBe(250);
    expect(summary.netBalance).toBe(750);
  });

  test('Certificate previous payments count ONLY approved certificates', () => {
    const certs = [
      { id: 'c1', certificate_number: 1, status: 'draft', payable_amount: 50000 },
      { id: 'c2', certificate_number: 2, status: 'rejected', payable_amount: 20000 },
      { id: 'c3', certificate_number: 3, status: 'approved', payable_amount: 45000 },
      { id: 'c4', certificate_number: 4, status: 'paid', payable_amount: 30000 }
    ];
    const prevPaid = calculateCertificatePreviousPayments(certs);
    expect(prevPaid).toBe(75000); // 45000 + 30000 (draft & rejected excluded)
  });

  test('Deterministic running balance calculation', () => {
    const txs = [
      { id: 'b', transaction_date: '2026-08-01', type: 'outflow', amount: 200 },
      { id: 'a', transaction_date: '2026-08-01', type: 'inflow', amount: 1000 }
    ];
    const result = calculateRunningBalances(txs);
    expect(result[0].id).toBe('a');
    expect(result[0].running_balance).toBe(1000);
    expect(result[1].id).toBe('b');
    expect(result[1].running_balance).toBe(800);
  });

  test('getLocalDateString returns local YYYY-MM-DD correctly', () => {
    const testDate = new Date(2026, 7, 1, 0, 30); // Aug 1, 2026 at 00:30 local time
    expect(getLocalDateString(testDate)).toBe('2026-08-01');
  });

  test('Turbo Cashflow, Purchases, and Daily execution does NOT throw ReferenceError', () => {
    document.body.innerHTML = `
      <div id="turboCashflowContent"></div>
      <div id="turboPurchasesContent"></div>
      <div id="turboDailyContent"></div>
    `;

    expect(() => window.NEXORA.Views.TurboCashflow.render()).not.toThrow();
    expect(() => window.NEXORA.Views.TurboPurchases.render()).not.toThrow();
    expect(() => window.NEXORA.Views.TurboDaily.render()).not.toThrow();
  });
});
