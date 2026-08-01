window.NEXORA = window.NEXORA || {};

NEXORA.RBAC = {
  _roleMap: {
    'company_admin': ['dashboard','projects','project','item','approvals','costs','reports','employees','processes','processDetail','processWizard','processDashboard','admin','owner','boq','dailyLabor','cashflow','stakeholders','contracts','changes','turbo','turboDaily','turboPurchases','turboCashflow','entPlanning','entExecution','entControl','alerts'],
    'project_manager': ['dashboard','projects','project','item','approvals','costs','reports','processes','processDetail','employees','boq','dailyLabor','cashflow','stakeholders','contracts','changes','turbo','turboDaily','turboPurchases','turboCashflow','alerts'],
    'site_engineer': ['dashboard','projects','project','item','dailyLabor','turboDaily','alerts'],
    'accountant': ['dashboard','costs','reports','boq','cashflow','turboCashflow','turboPurchases','alerts'],
    'supervisor': ['dashboard','projects','project','item','dailyLabor','alerts'],
    'warehouse_keeper': ['dashboard','projects','project','item','turboPurchases','alerts'],
    'worker': ['dashboard'],
    // Arabic legacy label fallbacks
    'المدير العام': ['dashboard','projects','project','item','approvals','costs','reports','employees','processes','processDetail','processWizard','processDashboard','admin','owner','boq','dailyLabor','cashflow','stakeholders','contracts','changes','turbo','turboDaily','turboPurchases','turboCashflow','entPlanning','entExecution','entControl','alerts'],
    'مدير مشروع': ['dashboard','projects','project','item','approvals','costs','reports','processes','processDetail','employees','boq','dailyLabor','cashflow','stakeholders','contracts','changes','turbo','turboDaily','turboPurchases','turboCashflow','alerts'],
    'مهندس موقع': ['dashboard','projects','project','item','dailyLabor','turboDaily','alerts'],
    'محاسب': ['dashboard','costs','reports','boq','cashflow','turboCashflow','turboPurchases','alerts'],
    'مشرف': ['dashboard','projects','project','item','dailyLabor','alerts'],
    'أمين مستودع': ['dashboard','projects','project','item','turboPurchases','alerts'],
    'عامل': ['dashboard']
  },

  can: function(view) {
    var u = NEXORA.Auth.getUser();
    if (!u) return false;
    var roleKey = u.role_code || u.role;
    var allowed = this._roleMap[roleKey];
    if (!allowed) return false;
    return allowed.indexOf(view) !== -1;
  },

  canEdit: function() {
    var u = NEXORA.Auth.getUser();
    if (!u) return false;
    var r = u.role_code || u.role;
    return r === 'company_admin' || r === 'project_manager' || r === 'accountant' || r === 'المدير العام' || r === 'مدير مشروع' || r === 'محاسب';
  },

  getRole: function() {
    var u = NEXORA.Auth.getUser();
    return u ? (u.role_code || u.role || '') : '';
  }
};
