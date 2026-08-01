/**
 * Schema & Data Integrity Validator for Nexora Enterprise JSON Backup Imports
 */

export function validateImportJson(jsonData) {
  if (!jsonData || typeof jsonData !== 'object') {
    return { valid: false, errors: ['الملف المرفق ليس بصيغة JSON صحيحة'] };
  }

  const errors = [];
  const warnings = [];

  const allowedCollections = [
    'companies', 'employees', 'projects', 'items', 'tasks', 'assignments',
    'dailylogs', 'dailyLogs', 'approvals', 'costs', 'processes', 'process_logs',
    'processLogs', 'boq_items', 'boqItems', 'payment_certificates', 'paymentCertificates',
    'cash_flow', 'cashFlow', 'daily_wages', 'dailyWages', 'stakeholders',
    'contracts', 'change_requests', 'changeRequests'
  ];

  // Check payload size / structure
  const rootKeys = Object.keys(jsonData);
  if (rootKeys.length === 0) {
    errors.push('ملف النسخة الاحتياطية فارغ');
  }

  // Validate presence of at least one recognized collection
  const hasRecognized = rootKeys.some(k => allowedCollections.includes(k) || k === 'companyName');
  if (!hasRecognized) {
    errors.push('الملف لا يحتوي على بيانات مقبولة لنظام NEXORA');
  }

  // Validate array fields
  rootKeys.forEach(key => {
    if (key !== 'version' && key !== 'companyName' && key !== 'exportDate') {
      if (!Array.isArray(jsonData[key])) {
        warnings.push(`الحقل ${key} ليس مصفوفة بيانات ملغاة`);
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

export function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

window.NEXORA = window.NEXORA || {};
window.NEXORA.SecurityUtils = {
  validateImportJson,
  escapeHTML
};
