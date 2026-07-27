window.NEXORA = window.NEXORA || {};

NEXORA.RBAC = {
  _roleViews: {
    'المدير العام': ['dashboard','projects','project','item','approvals','costs','reports','employees','processes','processDetail','processWizard','processDashboard','admin','owner','boq','dailyLabor','cashflow','stakeholders','contracts','changes'],
    'مدير مشروع': ['dashboard','projects','project','item','approvals','costs','reports','processes','processDetail','employees','boq','dailyLabor','cashflow','stakeholders','contracts','changes'],
    'مهندس موقع': ['dashboard','projects','project','item','dailyLabor'],
    'محاسب': ['dashboard','costs','reports','boq','cashflow'],
    'مشرف': ['dashboard','projects','project','item','dailyLabor'],
    'أمين مستودع': ['dashboard','projects','project','item'],
    'عامل': ['dashboard']
  },

  can: function(view) {
    var u = NEXORA.Auth.getUser();
    if (!u) return false;
    var allowed = this._roleViews[u.role];
    if (!allowed) return false;
    return allowed.indexOf(view) !== -1;
  },

  canEdit: function() {
    var u = NEXORA.Auth.getUser();
    if (!u) return false;
    return u.role === 'المدير العام' || u.role === 'مدير مشروع' || u.role === 'محاسب';
  },

  getRole: function() {
    var u = NEXORA.Auth.getUser();
    return u ? u.role : '';
  }
};
