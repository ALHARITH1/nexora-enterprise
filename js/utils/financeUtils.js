/**
 * Centralized Financial Utilities for Nexora Enterprise
 * Enforces canonical financial rules, rounding, inflow/outflow totals, running balances, and payment certificate calculations
 */

export function roundMoney(val) {
  const num = Number(val) || 0;
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

export function formatMoney(amount, currency = 'ر.س') {
  const val = roundMoney(amount);
  return val.toLocaleString('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ' + currency;
}

export function calculateCashFlowSummary(cashFlowItems = []) {
  let inflow = 0;
  let outflow = 0;

  cashFlowItems.forEach(item => {
    const amt = roundMoney(item.amount);
    const type = (item.type === 'income' || item.type === 'inflow') ? 'inflow' : 'outflow';
    if (type === 'inflow') {
      inflow += amt;
    } else {
      outflow += amt;
    }
  });

  inflow = roundMoney(inflow);
  outflow = roundMoney(outflow);
  const netBalance = roundMoney(inflow - outflow);

  return { inflow, outflow, netBalance };
}

export function calculateCertificatePreviousPayments(certificates = []) {
  // Count ONLY approved certificates
  let totalApprovedPrevious = 0;
  certificates.forEach(cert => {
    if (cert.status === 'approved' || cert.status === 'paid') {
      totalApprovedPrevious += roundMoney(cert.payable_amount || cert.net_amount || 0);
    }
  });
  return roundMoney(totalApprovedPrevious);
}

export function calculateRunningBalances(transactions = []) {
  // Sort deterministically by transaction_date, created_at, or id
  const sorted = [...transactions].sort((a, b) => {
    const dA = a.transaction_date || a.cost_date || a.created_at || '';
    const dB = b.transaction_date || b.cost_date || b.created_at || '';
    if (dA !== dB) return dA.localeCompare(dB);
    return String(a.id || '').localeCompare(String(b.id || ''));
  });

  let currentBalance = 0;
  return sorted.map(tx => {
    const amt = roundMoney(tx.amount);
    const type = (tx.type === 'income' || tx.type === 'inflow') ? 'inflow' : 'outflow';
    if (type === 'inflow') {
      currentBalance += amt;
    } else {
      currentBalance -= amt;
    }
    currentBalance = roundMoney(currentBalance);
    return {
      ...tx,
      type,
      amount: amt,
      running_balance: currentBalance
    };
  });
}

window.NEXORA = window.NEXORA || {};
window.NEXORA.FinanceUtils = {
  roundMoney,
  formatMoney,
  calculateCashFlowSummary,
  calculateCertificatePreviousPayments,
  calculateRunningBalances
};
