window.NEXORA = window.NEXORA || {};

NEXORA.Router = {
  _map: {
    dashboard: { section: 'view-dashboard', title: 'لوحة التحكم', render: 'renderDashboard' },
    projects: { section: 'view-projects', title: 'المشاريع', render: 'renderProjects' },
    project: { section: 'view-project', title: 'تفاصيل المشروع', render: 'renderProjectDetail' },
    item: { section: 'view-item', title: 'تفاصيل البند', render: 'renderItemDetail' },
    approvals: { section: 'view-approvals', title: 'الاعتمادات', render: 'renderApprovals' },
    costs: { section: 'view-costs', title: 'التكاليف', render: 'renderCosts' },
    reports: { section: 'view-reports', title: 'التقارير', render: 'renderReports' },
    employees: { section: 'view-employees', title: 'الموظفون', render: 'renderEmployeesView' },
    admin: { section: 'view-admin', title: 'إدارة الموظفين', render: 'renderAdmin' },
    owner: { section: 'view-owner', title: 'لوحة المالك', render: 'renderOwnerDashboard' },
    processes: { section: 'view-processes', title: 'العمليات PMBOK', render: 'renderProcesses' },
    processDetail: { section: 'view-processDetail', title: 'تفاصيل العملية', render: 'openProcessDetail' },
    processWizard: { section: 'view-processWizard', title: 'معالج العمليات', render: 'renderProcessWizard' },
    processDashboard: { section: 'view-processDashboard', title: 'لوحة العمليات', render: 'renderProcessDashboard' },
    boq: { section: 'view-boq', title: 'جدول الكميات', render: 'renderBOQ' },
    dailyLabor: { section: 'view-dailyLabor', title: 'العمالة واليوميات', render: 'renderDailyLabor' },
    cashflow: { section: 'view-cashflow', title: 'السيولة النقدية', render: 'renderCashflow' },
    stakeholders: { section: 'view-stakeholders', title: 'أصحاب المصلحة', render: 'renderStakeholders' },
    contracts: { section: 'view-contracts', title: 'العقود', render: 'renderContracts' },
    changes: { section: 'view-changes', title: 'طلبات التغيير', render: 'renderChangeRequests' }
  },

  navigate: function(view) {
    if (view === 'landing') {
      document.body.classList.remove('authed');
      var app = document.getElementById('appShell');
      if (app) app.classList.add('hidden');
      var auth = document.getElementById('authPage');
      if (auth) auth.classList.add('hidden');
      var landing = document.getElementById('landingPage');
      if (landing) landing.classList.remove('hidden');
      window.location.hash = '';
      return;
    }
    if (view === 'login') {
      document.getElementById('landingPage').classList.add('hidden');
      document.getElementById('authPage').classList.remove('hidden');
      window.location.hash = 'login';
      return;
    }
    if (!NEXORA.Auth.isAuthenticated()) {
      this.navigate('login');
      return;
    }

    document.getElementById('landingPage').classList.add('hidden');
    document.getElementById('authPage').classList.add('hidden');
    document.getElementById('appShell').classList.remove('hidden');
    document.body.classList.add('authed');

    var route = this._map[view];
    if (!route) { view = 'dashboard'; route = this._map.dashboard; }

    document.querySelectorAll('.view-section').forEach(function(s) { s.classList.remove('active'); });
    var el = document.getElementById(route.section);
    if (el) el.classList.add('active');

    var titleEl = document.getElementById('headerTitle');
    if (titleEl) titleEl.textContent = route.title;

    if (typeof NEXORA.Sidebar !== 'undefined') NEXORA.Sidebar.setActive(view);

    if (typeof window[route.render] === 'function') {
      if (route.render === 'openProcessDetail' && NEXORA.App.curProcessId) {
        window[route.render](NEXORA.App.curProcessId);
      } else {
        window[route.render]();
      }
    }

    window.location.hash = view;
  },

  getCurrent: function() {
    var h = window.location.hash.replace('#', '').split('/')[0];
    return h || 'dashboard';
  },

  init: function() {
    var self = this;
    window.addEventListener('hashchange', function() {
      var v = self.getCurrent();
      if (NEXORA.Auth.isAuthenticated()) {
        self.navigate(v);
      }
    });
    var initial = self.getCurrent();
    self.navigate(initial);
  }
};
