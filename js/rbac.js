window.NEXORA = window.NEXORA || {};

NEXORA.RBAC = {
  _roleMap: {
    'platform_admin': ['dashboard','projects','project','item','approvals','costs','reports','employees','processes','processDetail','processWizard','processDashboard','admin','owner','boq','dailyLabor','cashflow','stakeholders','contracts','changes','turbo','turboDaily','turboPurchases','turboCashflow','entPlanning','entExecution','entControl','alerts'],
    'company_admin': ['dashboard','projects','project','item','approvals','costs','reports','employees','processes','processDetail','processWizard','processDashboard','admin','owner','boq','dailyLabor','cashflow','stakeholders','contracts','changes','turbo','turboDaily','turboPurchases','turboCashflow','entPlanning','entExecution','entControl','alerts'],
    'project_manager': ['dashboard','projects','project','item','approvals','costs','reports','processes','processDetail','employees','boq','dailyLabor','cashflow','stakeholders','contracts','changes','turbo','turboDaily','turboPurchases','turboCashflow','alerts'],
    'site_engineer': ['dashboard','projects','project','item','dailyLabor','turboDaily','alerts'],
    'accountant': ['dashboard','costs','reports','boq','cashflow','turboCashflow','turboPurchases','alerts'],
    'supervisor': ['dashboard','projects','project','item','dailyLabor','alerts'],
    'warehouse_keeper': ['dashboard','projects','project','item','turboPurchases','alerts'],
    'worker': ['dashboard']
  },

  can: function(view) {
    var u = NEXORA.Auth.getUser();
    if (!u) return false;
    
    // Explicitly deny if user doesn't have a valid active session role code
    if (!u.role_code || !this._roleMap[u.role_code]) return false;
    
    var allowed = this._roleMap[u.role_code];
    return allowed.indexOf(view) !== -1;
  },

  canEdit: function() {
    var u = NEXORA.Auth.getUser();
    if (!u) return false;
    var r = u.role_code;
    return r === 'company_admin' || r === 'platform_admin' || r === 'project_manager' || r === 'accountant';
  },

  getRole: function() {
    var u = NEXORA.Auth.getUser();
    return u ? (u.role_code || '') : '';
  },

  hasRole: function(roleCodes) {
    var u = NEXORA.Auth.getUser();
    if (!u) return false;
    if (!Array.isArray(roleCodes)) roleCodes = [roleCodes];
    return roleCodes.indexOf(u.role_code) !== -1;
  }
};
