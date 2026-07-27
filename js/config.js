window.NEXORA = window.NEXORA || {};

NEXORA.Config = {
  DB_STORE: 'tibrflow',
  DB_VER: 4,
  DB_TABLES: ['companies','employees','projects','items','tasks','assignments','dailylogs','approvals','costs','processes','process_logs','boq_items','payment_certificates','cash_flow','daily_wages','stakeholders','contracts','change_requests'],
  OWNER_EMAIL: 'owner@nexora.app',
  LAUNCH_DATE: '2026-07-28T00:00:00',
  TRIAL_DAYS: 30,
  ROLES: {'المدير العام':'badge-admin','مدير مشروع':'badge-manager','مهندس موقع':'badge-engineer','مشرف':'badge-supervisor','محاسب':'badge-accountant','أمين مستودع':'badge-warehouse','عامل':'badge-worker'}
};
