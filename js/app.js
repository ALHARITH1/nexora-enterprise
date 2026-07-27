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

  _showLanding: function() {
    document.getElementById('landingPage').classList.remove('hidden');
    document.getElementById('authPage').classList.add('hidden');
    document.getElementById('appShell').classList.add('hidden');
    document.body.classList.remove('authed');
  },

  _showApp: function() {
    var self = NEXORA.App;
    document.getElementById('landingPage').classList.add('hidden');
    document.getElementById('authPage').classList.add('hidden');
    document.getElementById('appShell').classList.remove('hidden');
    document.body.classList.add('authed');

    NEXORA.Sidebar.init();
    NEXORA.Sidebar.updateUser(self.cu);
    NEXORA.Header.init();
    NEXORA.Router.init();
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
  }
};

window.showView = function(view) {
  if (NEXORA.Router && NEXORA.Router.navigate) {
    NEXORA.Router.navigate(view);
  }
};
window.showLanding = function() { NEXORA.App._showLanding(); };
window.toggleTheme = function() { NEXORA.App.toggleTheme(); };

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
