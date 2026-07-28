window.NEXORA = window.NEXORA || {};

NEXORA.App = {
  cu: null,
  curProjId: null,
  curItemId: null,
  curTaskId: null,
  curProcessId: null,
  theme: 'light',
  mode: 'turbo',

  init: function() {
    var self = NEXORA.App;

    self.restoreTheme();
    self._bindKeyboard();
    self._bindInteractive();
    self._bindSidebarToggle();
    self._registerSW();

    NEXORA.Store.init().then(function() {
      var stored = NEXORA.Auth.getUser();
      if (stored) {
        self.cu = stored;
        self._showApp();
      } else {
        self._showLanding();
      }
    }).catch(function() {
      var stored = NEXORA.Auth.getUser();
      if (stored) {
        self.cu = stored;
        self._showApp();
      } else {
        self._showLanding();
      }
    });
  },

  _showApp: function() {
    var self = NEXORA.App;
    self._augmentSession();
    self.restoreMode();

    NEXORA.Sidebar.init();
    NEXORA.Sidebar.updateUser(self.cu);
    NEXORA.Header.init();
    NEXORA.Router.init();
    try { NEXORA.Components.Interactive.init(); } catch(e) {}
  },

  _augmentSession: function() {
    var self = NEXORA.App;
    if (!self.cu) return;
    if (typeof self.cu.is_owner === 'undefined') {
      self.cu.is_owner = self.cu.email === NEXORA.Config.OWNER_EMAIL;
    }
    if (typeof self.cu.is_admin === 'undefined') {
      self.cu.is_admin = self.cu.is_owner || self.cu.role === 'المدير العام' || self.cu.role === 'مدير مشروع';
    }
  },

  toggleTheme: function() {
    var self = NEXORA.App;
    self.theme = self.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', self.theme);
    localStorage.setItem('tibr_theme', self.theme);
    var icon = document.querySelector('#themeToggle i');
    if (icon) icon.className = self.theme === 'dark' ? 'ti ti-sun' : 'ti ti-moon';
  },

  restoreTheme: function() {
    var self = NEXORA.App;
    try { self.theme = localStorage.getItem('tibr_theme') || 'light'; } catch(e) {}
    document.documentElement.setAttribute('data-theme', self.theme);
    var icon = document.querySelector('#themeToggle i');
    if (icon) icon.className = self.theme === 'dark' ? 'ti ti-sun' : 'ti ti-moon';
  },

  _bindKeyboard: function() {
    document.addEventListener('keydown', function(e) {
      if (!document.body.classList.contains('authed')) return;
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        var search = document.getElementById('globalSearch');
        if (search) search.focus();
      }
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        NEXORA.App.toggleTheme();
      }
      if (e.key === 'Escape') {
        var np = document.getElementById('notifPanel');
        if (np) np.classList.remove('open');
        var sb = document.getElementById('sidebar');
        if (sb) sb.classList.remove('open');
        var ol = document.getElementById('overlay');
        if (ol) ol.classList.remove('active');
      }
    });
  },

  _bindInteractive: function() {
    var sp = document.getElementById('scrollProgress');
    if (sp) {
      window.addEventListener('scroll', function() {
        var h = document.documentElement.scrollHeight - window.innerHeight;
        sp.style.transform = 'scaleX(' + (h > 0 ? Math.min(window.scrollY / h, 1) : 0) + ')';
      }, { passive: true });
    }

    document.addEventListener('click', function(e) {
      var btn = e.target.closest('.btn');
      if (!btn) return;
      var rect = btn.getBoundingClientRect();
      var ripple = document.createElement('span');
      ripple.className = 'ripple-effect';
      ripple.style.left = (e.clientX - rect.left) + 'px';
      ripple.style.top = (e.clientY - rect.top) + 'px';
      btn.appendChild(ripple);
      setTimeout(function() { ripple.remove(); }, 500);
    });
  },

  _bindSidebarToggle: function() {
    var toggle = document.getElementById('menuToggle');
    if (toggle) {
      toggle.addEventListener('click', function() {
        NEXORA.Sidebar.toggle();
      });
    }
    var overlay = document.getElementById('overlay');
    if (overlay) {
      overlay.addEventListener('click', function() {
        var sb = document.getElementById('sidebar');
        if (sb) sb.classList.remove('open');
        overlay.classList.remove('active');
      });
    }
  },

  _registerSW: function() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(function() {});
    }
  },

  switchMode: function(mode) {
    var self = NEXORA.App;
    self.mode = mode;
    try { localStorage.setItem('nexora_mode', mode); } catch(e) {}
    if (mode === 'turbo') {
      self._showLandingTurbo();
    } else {
      self._showLandingEnterprise();
    }
  },

  _showLandingTurbo: function() {
    document.querySelectorAll('.view-section').forEach(function(s) { s.classList.remove('active'); });
    var el = document.getElementById('view-turbo');
    if (el) el.classList.add('active');
    document.getElementById('headerTitle').textContent = 'وضع Turbo';
    NEXORA.Sidebar.setActive('turbo');
    if (typeof renderTurbo === 'function') renderTurbo();
  },

  _showLandingEnterprise: function() {
    document.querySelectorAll('.view-section').forEach(function(s) { s.classList.remove('active'); });
    var el = document.getElementById('view-dashboard');
    if (el) el.classList.add('active');
    document.getElementById('headerTitle').textContent = 'لوحة التحكم';
    NEXORA.Sidebar.setActive('dashboard');
    if (typeof renderDashboard === 'function') renderDashboard();
  },

  restoreMode: function() {
    try { this.mode = localStorage.getItem('nexora_mode') || 'turbo'; } catch(e) {}
  },

  _showLanding: function() {
    var self = NEXORA.App;
    document.getElementById('landingPage').classList.remove('hidden');
    document.getElementById('authPage').classList.add('hidden');
    document.getElementById('appShell').classList.add('hidden');
    document.body.classList.remove('authed');
  },
};

window.showView = function(view) {
  if (NEXORA.Router && NEXORA.Router.navigate) {
    NEXORA.Router.navigate(view);
  }
};
window.showLanding = function() { NEXORA.Router.navigate('landing'); };
window.toggleTheme = function() { NEXORA.App.toggleTheme(); };
window.showToast = function(msg, type, dur) {
  if (typeof NEXORA.Toast !== 'undefined' && NEXORA.Toast.show) {
    NEXORA.Toast.show(msg, type, dur);
  }
};

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
