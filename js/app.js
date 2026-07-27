window.NEXORA = window.NEXORA || {};

NEXORA.App = {
  cu: null,
  curProjId: null,
  curItemId: null,
  curTaskId: null,
  curProcessId: null,
  theme: 'light',

  init: function() {
    var self = NEXORA.App;
    self.showLanding();

    try {
      var s = localStorage.getItem('tbr_user');
      if (s) { try { self.cu = JSON.parse(s); } catch(e) { self.cu = null; } }
    } catch(e) { self.cu = null; }

    if (self.cu) {
      var check = setInterval(function() {
        if (NEXORA.DB._ready) {
          clearInterval(check);
          var co = NEXORA.DB.companies.find(function(c) { return c.id === self.cu.company_id; });
          if (self.cu.is_owner) { self.showApp(); return; }
          if (co && co.subscription === 'expired') { self.showExpired(co); return; }
          self.showApp();
        }
      }, 50);
      setTimeout(function() {
        clearInterval(check);
        if (self.cu.is_owner) { self.showApp(); return; }
        self.showApp();
      }, 1500);
    }

    NEXORA.Store.init();

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').then(function(r) {
        r.addEventListener('updatefound', function() {
          var newSW = r.installing;
          newSW.addEventListener('statechange', function() {
            if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
              if (typeof showToast === 'function') showToast('🔄 تحديث متوفر. أعد فتح الصفحة للتحديث.', 'info', 6000);
            }
          });
        });
        if ('Notification' in window && Notification.permission === 'default') {
          setTimeout(function() { Notification.requestPermission(); }, 10000);
        }
      }).catch(function() {});
    }

    self.restoreTheme();
    self._bindKeyboard();
    try { self.initInteractive(); } catch(e) {}
  },

  showLanding: function() {
    document.body.className = 'show-landing';
  },

  showAuth: function(mode) {
    document.body.classList.remove('show-landing', 'authed');
    document.body.classList.add('show-auth');
    var l = document.getElementById('loginForm');
    var r = document.getElementById('registerForm');
    var lt = document.getElementById('loginTab');
    var rt = document.getElementById('registerTab');
    if (l) l.classList.toggle('active', mode === 'login');
    if (r) r.classList.toggle('active', mode === 'register');
    if (lt) lt.classList.toggle('active', mode === 'login');
    if (rt) rt.classList.toggle('active', mode === 'register');
  },

  switchAuth: function(mode) {
    NEXORA.App.showAuth(mode);
  },

  doLogin: function() {
    var self = NEXORA.App;
    var H = NEXORA.Helpers;
    var e = document.getElementById('loginEmail').value.trim();
    if (!e) return H.msg('loginMsg', 'أدخل البريد', 'error');
    if (e === NEXORA.Config.OWNER_EMAIL) {
      self.cu = { id: 0, full_name: 'مالك التطبيق', email: NEXORA.Config.OWNER_EMAIL, role: 'Owner', is_owner: 1 };
      localStorage.setItem('tbr_user', JSON.stringify(self.cu));
      self.showApp();
      return;
    }
    var u = NEXORA.DB.employees.find(function(x) { return x.email === e; });
    if (!u) return H.msg('loginMsg', '❌ هذا البريد غير مسجل. تأكد من أن شركتك مسجلة أو تواصل مع مسؤول الشركة.', 'error');
    self.cu = u;
    localStorage.setItem('tbr_user', JSON.stringify(u));
    var co = NEXORA.DB.companies.find(function(c) { return c.id === u.company_id; });
    if (co && co.subscription === 'expired') { self.showExpired(co); return; }
    self.showApp();
  },

  doLogout: function() {
    var self = NEXORA.App;
    localStorage.removeItem('tbr_user');
    self.cu = null;
    document.getElementById('mainApp').style.display = 'none';
    document.getElementById('expiredPage').style.display = 'none';
    document.getElementById('ownerNavBtn').style.display = 'none';
    self.showLanding();
  },

  registerCompany: function() {
    var self = NEXORA.App;
    var H = NEXORA.Helpers;
    var DB = NEXORA.DB;
    var coName = document.getElementById('regCompany').value.trim();
    var coEmail = document.getElementById('regCompanyEmail').value.trim();
    var adName = document.getElementById('regName').value.trim();
    var adEmail = document.getElementById('regEmail').value.trim();
    if (!coName || !coEmail || !adName || !adEmail)
      return H.msg('regMsg', 'الرجاء إدخال جميع الحقول', 'error');
    if (DB.companies.find(function(c) { return c.email === coEmail; }))
      return H.msg('regMsg', '❌ البريد الإلكتروني للشركة موجود مسبقاً', 'error');
    if (DB.employees.find(function(e) { return e.email === adEmail; }))
      return H.msg('regMsg', '❌ بريد المسؤول موجود مسبقاً', 'error');
    var now = new Date();
    var trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + NEXORA.Config.TRIAL_DAYS);
    var cid = DB.nextId(DB.companies);
    DB.companies.push({
      id: cid, name: coName, email: coEmail, address: '',
      subscription: 'trial', trial_start: now.toISOString(), trial_end: trialEnd.toISOString(),
      subscribed_at: null, created_at: now.toISOString()
    });
    var uid = DB.nextId(DB.employees);
    DB.employees.push({
      id: uid, company_id: cid, full_name: adName, email: adEmail,
      role: 'مدير مشروع', is_admin: 1, hour_rate: 100
    });
    DB.save();
    self.cu = DB.employees.find(function(e) { return e.id === uid; });
    localStorage.setItem('tbr_user', JSON.stringify(self.cu));
    H.msg('regMsg', '✅ تم تسجيل الشركة بنجاح! فترة تجريبية ' + NEXORA.Config.TRIAL_DAYS + ' يوم.', 'success');
    setTimeout(function() { self.showApp(); }, 600);
  },

  showApp: function() {
    var self = NEXORA.App;
    document.body.className = 'authed';
    document.getElementById('expiredPage').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';
    document.getElementById('hdrName').textContent = self.cu.full_name;
    document.getElementById('hdrRole').textContent = self.cu.role || '';
    document.getElementById('adminNavBtn').style.display = (self.cu.is_admin && !self.cu.is_owner) ? 'inline-flex' : 'none';
    document.getElementById('ownerNavBtn').style.display = self.cu.is_owner ? 'inline-flex' : 'none';
    if (!self.cu.is_owner && self.cu.company_id) {
      var co = NEXORA.DB.companies.find(function(c) { return c.id === self.cu.company_id; });
      if (co) {
        var daysLeft = Math.ceil((new Date(co.trial_end) - new Date()) / (1000 * 60 * 60 * 24));
        var infoEl = document.getElementById('trialInfo');
        if (infoEl) {
          if (co.subscription === 'trial' && daysLeft > 0) {
            infoEl.innerHTML = '<span class="user-badge" style="background:var(--G);color:var(--TX);">تجربة: ' + daysLeft + ' يوم</span>';
            infoEl.style.display = 'inline';
          } else if (co.subscription === 'active') {
            infoEl.innerHTML = '<span class="user-badge" style="background:var(--GR);color:#fff;">✔ مفعل</span>';
            infoEl.style.display = 'inline';
          } else {
            infoEl.style.display = 'none';
          }
        }
      }
    }
    if (typeof renderDashboard === 'function') renderDashboard();
    if (self.cu.is_owner && typeof renderOwnerDashboard === 'function') renderOwnerDashboard();
    try { self.initInteractive(); } catch(e) {}
  },

  showExpired: function(co) {
    document.getElementById('mainApp').style.display = 'none';
    document.body.className = '';
    document.getElementById('expiredPage').style.display = 'block';
    document.getElementById('expiredCompanyName').textContent = co ? co.name : '—';
    document.getElementById('expiredDate').textContent = co ? new Date(co.trial_end).toLocaleDateString('ar-SA') : '—';
  },

  toggleTheme: function() {
    var self = NEXORA.App;
    self.theme = self.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', self.theme);
    localStorage.setItem('tibr_theme', self.theme);
  },

  restoreTheme: function() {
    var self = NEXORA.App;
    try { self.theme = localStorage.getItem('tibr_theme') || 'light'; } catch(e) {}
    document.documentElement.setAttribute('data-theme', self.theme);
  },

  showView: function(v) {
    document.querySelectorAll('.section').forEach(function(x) { x.classList.remove('active'); });
    document.querySelectorAll('.nav-btn').forEach(function(x) { x.classList.remove('active'); });
    var el = document.getElementById('view-' + v);
    if (el) el.classList.add('active');
    var map = {
      dashboard: 'لوحة', projects: 'المشاريع', approvals: 'الاعتماد',
      costs: 'التكاليف', reports: 'التقارير', employees: 'الموظفون',
      processes: 'العمليات', processDetail: 'العمليات', admin: 'إدارة', owner: 'المالك'
    };
    document.querySelectorAll('.nav-btn').forEach(function(b) {
      if (b.textContent.includes(map[v] || '')) b.classList.add('active');
    });
    if (v === 'dashboard' && typeof renderDashboard === 'function') renderDashboard();
    if (v === 'projects' && typeof renderProjects === 'function') renderProjects();
    if (v === 'approvals' && typeof renderApprovals === 'function') renderApprovals();
    if (v === 'costs' && typeof renderCosts === 'function') renderCosts();
    if (v === 'reports' && typeof renderReports === 'function') renderReports();
    if (v === 'employees' && typeof renderEmployeesView === 'function') renderEmployeesView();
    if (v === 'processes' && typeof renderProcesses === 'function') renderProcesses();
    if (v === 'processDetail' && typeof openProcessDetail === 'function' && NEXORA.App.curProcessId) openProcessDetail(NEXORA.App.curProcessId);
    if (v === 'admin' && typeof renderAdmin === 'function') renderAdmin();
    if (v === 'owner' && typeof renderOwnerDashboard === 'function') renderOwnerDashboard();
  },

  _bindKeyboard: function() {
    document.addEventListener('keydown', function(e) {
      if (!document.body.classList.contains('authed')) return;
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        if (typeof showGlobalSearch === 'function') showGlobalSearch();
      }
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        NEXORA.App.toggleTheme();
      }
      if (e.key === 'Escape') {
        if (typeof closeNotifications === 'function') closeNotifications();
        var mo = document.getElementById('taskModal');
        if (mo) mo.classList.remove('active');
        var em = document.getElementById('empModal');
        if (em) em.classList.remove('active');
        var gs = document.getElementById('globalSearchOverlay');
        if (gs) gs.style.display = 'none';
      }
    });
  },

  initInteractive: function() {
    var preloader = document.getElementById('preloader');
    if (preloader && preloader.style.visibility !== 'hidden') {
      preloader.style.opacity = '0';
      preloader.style.visibility = 'hidden';
    }
    var sp = document.getElementById('scrollProgress');
    if (sp) {
      window.addEventListener('scroll', function() {
        var h = document.documentElement.scrollHeight - window.innerHeight;
        sp.style.transform = 'scaleX(' + (h > 0 ? Math.min(window.scrollY / h, 1) : 0) + ')';
      }, { passive: true });
    }
    var btt = document.getElementById('backTopBtn');
    if (btt) {
      window.addEventListener('scroll', function() {
        btt.style.display = window.scrollY > 300 ? 'flex' : 'none';
      }, { passive: true });
    }
    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(e) {
          if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); }
        });
      }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
      document.querySelectorAll('.reveal,.reveal-left,.reveal-right,.reveal-scale,.reveal-stagger').forEach(function(el) { observer.observe(el); });
    }
    document.addEventListener('click', function(e) {
      var btn = e.target.closest('.btn');
      if (!btn) return;
      var rect = btn.getBoundingClientRect();
      var x = e.clientX - rect.left, y = e.clientY - rect.top;
      var ripple = document.createElement('span');
      ripple.className = 'ripple-effect';
      ripple.style.left = x + 'px';
      ripple.style.top = y + 'px';
      btn.appendChild(ripple);
      setTimeout(function() { ripple.remove(); }, 500);
    });
    if ('IntersectionObserver' in window) {
      var counterObserver = new IntersectionObserver(function(entries) {
        entries.forEach(function(e) {
          if (e.isIntersecting) {
            var el = e.target;
            var target = parseInt(el.dataset.count) || 0;
            if (target <= 0) return;
            var current = 0;
            var step = Math.max(1, Math.ceil(target / 30));
            var interval = setInterval(function() {
              current += step;
              if (current >= target) { current = target; clearInterval(interval); }
              el.textContent = current.toLocaleString('en-US');
            }, 40);
            counterObserver.unobserve(el);
          }
        });
      }, { threshold: 0.5 });
      document.querySelectorAll('.counter').forEach(function(el) { counterObserver.observe(el); });
    }
  }
};

window.showLanding = NEXORA.App.showLanding;
window.showAuth = NEXORA.App.showAuth;
window.switchAuth = NEXORA.App.switchAuth;
window.doLogin = NEXORA.App.doLogin;
window.doLogout = NEXORA.App.doLogout;
window.registerCompany = NEXORA.App.registerCompany;
window.showApp = NEXORA.App.showApp;
window.showExpired = NEXORA.App.showExpired;
window.toggleTheme = NEXORA.App.toggleTheme;
window.restoreTheme = NEXORA.App.restoreTheme;
window.showView = NEXORA.App.showView;

Object.defineProperty(window, 'cu', {
  get: function() { return NEXORA.App.cu; },
  set: function(v) { NEXORA.App.cu = v; }
});
Object.defineProperty(window, 'curProjId', {
  get: function() { return NEXORA.App.curProjId; },
  set: function(v) { NEXORA.App.curProjId = v; }
});
Object.defineProperty(window, 'curItemId', {
  get: function() { return NEXORA.App.curItemId; },
  set: function(v) { NEXORA.App.curItemId = v; }
});
Object.defineProperty(window, 'curTaskId', {
  get: function() { return NEXORA.App.curTaskId; },
  set: function(v) { NEXORA.App.curTaskId = v; }
});
Object.defineProperty(window, 'curProcessId', {
  get: function() { return NEXORA.App.curProcessId; },
  set: function(v) { NEXORA.App.curProcessId = v; }
});
Object.defineProperty(window, 'theme', {
  get: function() { return NEXORA.App.theme; },
  set: function(v) { NEXORA.App.theme = v; }
});
