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
    changes: { section: 'view-changes', title: 'طلبات التغيير', render: 'renderChangeRequests' },
    turbo: { section: 'view-turbo', title: 'وضع Turbo', render: 'renderTurbo' },
    turboDaily: { section: 'view-turboDaily', title: 'يوميات سريعة', render: 'renderTurboDaily' },
    turboPurchases: { section: 'view-turboPurchases', title: 'مشتريات سريعة', render: 'renderTurboPurchases' },
    turboCashflow: { section: 'view-turboCashflow', title: 'السيولة', render: 'renderTurboCashflow' },
    entPlanning: { section: 'view-entPlanning', title: 'التخطيط الفائق', render: 'renderEntPlanning' },
    entExecution: { section: 'view-entExecution', title: 'التنفيذ والسرعة', render: 'renderEntExecution' },
    entControl: { section: 'view-entControl', title: 'التحكم الذكي', render: 'renderEntControl' },
    alerts: { section: 'view-alerts', title: 'مركز التنبيهات', render: 'renderAlertsCenter' }
  },

  _navigating: false,

  navigate: function(view) {
    if (this._navigating) return;
    this._navigating = true;
    try {
      this._doNavigate(view);
    } finally {
      this._navigating = false;
    }
  },

  _doNavigate: function(view) {
    try {
      if (view === 'landing') {
        if (NEXORA.App && typeof NEXORA.App._showLanding === 'function') {
          NEXORA.App._showLanding();
        } else {
          document.body.classList.remove('authed');
          var app = document.getElementById('appShell');
          if (app) app.classList.add('hidden');
          var auth = document.getElementById('authPage');
          if (auth) auth.classList.add('hidden');
          var landing = document.getElementById('landingPage');
          if (landing) landing.classList.remove('hidden');
        }
        window.location.hash = '';
        return;
      }

      if (view === 'login') {
        var lp = document.getElementById('landingPage');
        if (lp) lp.classList.add('hidden');
        var ap = document.getElementById('authPage');
        if (ap) ap.classList.remove('hidden');
        var as = document.getElementById('appShell');
        if (as) as.classList.add('hidden');
        window.location.hash = 'login';
        return;
      }

      if (!NEXORA.Auth.isAuthenticated()) {
        this._doNavigate('login');
        return;
      }

      var landingEl = document.getElementById('landingPage');
      if (landingEl) landingEl.classList.add('hidden');
      var authEl = document.getElementById('authPage');
      if (authEl) authEl.classList.add('hidden');
      var shellEl = document.getElementById('appShell');
      if (shellEl) shellEl.classList.remove('hidden');
      document.body.classList.add('authed');

      var route = this._map[view];
      if (!route) { view = 'dashboard'; route = this._map.dashboard; }

      document.querySelectorAll('.view-section').forEach(function(s) { s.classList.remove('active'); });
      var el = document.getElementById(route.section);
      if (el) el.classList.add('active');

      var titleEl = document.getElementById('headerTitle');
      if (titleEl) titleEl.textContent = route.title;

      if (typeof NEXORA.Sidebar !== 'undefined' && NEXORA.Sidebar.setActive) NEXORA.Sidebar.setActive(view);

      if (typeof window[route.render] === 'function') {
        try {
          if (route.render === 'openProcessDetail' && NEXORA.App.curProcessId) {
            window[route.render](NEXORA.App.curProcessId);
          } else {
            window[route.render]();
          }
        } catch (renderErr) {
          console.error('[Router] Render error for "' + route.render + '":', renderErr);
          var contentEl = el ? el.querySelector('[id$="Content"]') : null;
          if (contentEl) {
            contentEl.innerHTML = '<div class="empty-state" style="padding:48px;text-align:center;"><i class="ti ti-alert-triangle" style="font-size:36px;color:var(--G);"></i><h3 style="margin-top:12px;">خطأ في تحميل الشاشة</h3><p style="color:var(--TX2);font-size:13px;">' + renderErr.message + '</p></div>';
          }
        }
      } else {
        var fallbackEl = el ? el.querySelector('[id$="Content"]') : null;
        if (fallbackEl && !fallbackEl.innerHTML.trim()) {
          fallbackEl.innerHTML = '<div class="empty-state" style="padding:48px;text-align:center;"><i class="ti ti-loader" style="font-size:36px;color:var(--TX2);"></i><h3 style="margin-top:12px;color:var(--TX2);">' + route.title + '</h3><p style="color:var(--TX2);font-size:13px;">قريباً</p></div>';
        }
      }

      var newHash = '#' + view;
      if (window.location.hash !== newHash) {
        window.location.hash = view;
      }
    } catch (err) {
      console.error('[Router] Navigation error for "' + view + '":', err);
    }
  },

  getCurrent: function() {
    var h = window.location.hash.replace('#', '').split('/')[0];
    return h || '';
  },

  init: function() {
    var self = this;
    window.addEventListener('hashchange', function() {
      if (self._navigating) return;
      var v = self.getCurrent();
      if (!v) {
        var m = (NEXORA.App && NEXORA.App.mode) || 'turbo';
        if (NEXORA.Auth.isAuthenticated()) {
          self.navigate(m === 'turbo' ? 'turbo' : 'dashboard');
        } else {
          self.navigate('landing');
        }
        return;
      }
      if (v === 'login') {
        self.navigate('login');
        return;
      }
      if (NEXORA.Auth.isAuthenticated()) {
        self.navigate(v);
      }
    });

    var initial = self.getCurrent();
    var mode = (NEXORA.App && NEXORA.App.mode) || 'turbo';
    if (initial && initial !== 'login') {
      if (NEXORA.Auth.isAuthenticated()) {
        self.navigate(initial);
      } else {
        self.navigate('landing');
      }
    } else if (initial === 'login') {
      self.navigate('login');
    } else {
      self.navigate(mode === 'turbo' ? 'turbo' : 'dashboard');
    }
  }
};
