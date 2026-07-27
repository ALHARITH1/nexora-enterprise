window.NEXORA = window.NEXORA || {};

NEXORA.Components = NEXORA.Components || {};

NEXORA.Components.Interactive = {
  _deferredPrompt: null,
  _searchOverlay: null,
  _cursorDot: null,
  _cursorRing: null,
  _notifData: [],

  init: function() {
    var self = NEXORA.Components.Interactive;
    self._hidePreloader();
    self.initScrollReveal();
    self.initRippleEffect();
    self.initCustomCursor();
    self.initCardTilt();
  },

  _hidePreloader: function() {
    var p = document.getElementById('preloader');
    if (p && p.style.visibility !== 'hidden') {
      p.style.opacity = '0';
      p.style.visibility = 'hidden';
    }
  },

  initScrollProgress: function() {
    var sp = document.getElementById('scrollProgress');
    if (!sp) return;
    window.addEventListener('scroll', function() {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      sp.style.transform = 'scaleX(' + (h > 0 ? Math.min(window.scrollY / h, 1) : 0) + ')';
    }, { passive: true });
    var btt = document.getElementById('backTopBtn');
    if (btt) {
      window.addEventListener('scroll', function() {
        btt.style.display = window.scrollY > 300 ? 'flex' : 'none';
      }, { passive: true });
    }
  },

  initScrollReveal: function() {
    if (!('IntersectionObserver' in window)) return;
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(e) {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          observer.unobserve(e.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.reveal,.reveal-left,.reveal-right,.reveal-scale,.reveal-stagger').forEach(function(el) {
      observer.observe(el);
    });
  },

  initRippleEffect: function() {
    document.addEventListener('click', function(e) {
      var btn = e.target.closest('.btn');
      if (!btn) return;
      var rect = btn.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var y = e.clientY - rect.top;
      var ripple = document.createElement('span');
      ripple.className = 'ripple-effect';
      ripple.style.left = x + 'px';
      ripple.style.top = y + 'px';
      btn.appendChild(ripple);
      setTimeout(function() { ripple.remove(); }, 500);
    });
  },

  initCustomCursor: function() {
    if (window.innerWidth <= 1024) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var self = NEXORA.Components.Interactive;
    var dot = document.createElement('div');
    dot.className = 'cursor-dot';
    var ring = document.createElement('div');
    ring.className = 'cursor-ring active';
    document.body.appendChild(dot);
    document.body.appendChild(ring);
    self._cursorDot = dot;
    self._cursorRing = ring;
    setTimeout(function() { dot.classList.add('active'); }, 100);
    document.addEventListener('mousemove', function(e) {
      dot.style.left = e.clientX + 'px';
      dot.style.top = e.clientY + 'px';
      ring.style.left = e.clientX + 'px';
      ring.style.top = e.clientY + 'px';
    });
    document.querySelectorAll('a,button,.btn,.nav-btn,.list-item,[onclick]').forEach(function(el) {
      el.addEventListener('mouseenter', function() {
        dot.classList.add('hover');
        ring.classList.add('hover');
      });
      el.addEventListener('mouseleave', function() {
        dot.classList.remove('hover');
        ring.classList.remove('hover');
      });
    });
  },

  initCardTilt: function() {
    document.querySelectorAll('.l-feature,.l-role,.stat-card,.card').forEach(function(el) {
      el.addEventListener('mousemove', function(e) {
        if (window.innerWidth <= 1024) return;
        var rect = this.getBoundingClientRect();
        var x = (e.clientX - rect.left) / rect.width - 0.5;
        var y = (e.clientY - rect.top) / rect.height - 0.5;
        this.style.transform = 'perspective(800px) rotateY(' + (x * 6) + 'deg) rotateX(' + (-y * 6) + 'deg)';
      });
      el.addEventListener('mouseleave', function() {
        this.style.transform = '';
      });
    });
  },

  initCounters: function() {
    if (!('IntersectionObserver' in window)) return;
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
    document.querySelectorAll('.counter').forEach(function(el) {
      counterObserver.observe(el);
    });
  },

  showGlobalSearch: function() {
    var self = NEXORA.Components.Interactive;
    var overlay = self._searchOverlay;
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'globalSearchOverlay';
      overlay.style.cssText = 'display:none;position:fixed;inset:0;z-index:150;background:rgba(11,20,40,.5);backdrop-filter:blur(4px);justify-content:center;align-items:flex-start;padding-top:80px;';
      overlay.innerHTML = '<div style="width:560px;max-width:calc(100vw-40px);background:var(--WH);border:1px solid var(--BD);border-radius:16px;box-shadow:0 24px 80px rgba(0,0,0,.22);overflow:hidden;animation:modalIn .2s ease;">' +
        '<div style="padding:4px;border-bottom:1px solid var(--BD);">' +
          '<div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:var(--BG);border-radius:10px;">' +
            '<i class="ti ti-search" style="color:var(--TX2);font-size:18px;"></i>' +
            '<input id="globalSearchInput" placeholder="ابحث عن مشروع، بند، مهمة، موظف..." style="flex:1;border:0;background:transparent;font-size:var(--fs-md);outline:0;padding:8px 0;font-family:inherit;" autofocus>' +
            '<button onclick="document.getElementById(\'globalSearchOverlay\').style.display=\'none\'" style="background:none;border:0;color:var(--TX2);cursor:pointer;padding:4px;"><i class="ti ti-x"></i></button>' +
          '</div>' +
        '</div>' +
        '<div id="globalSearchResults" style="max-height:400px;overflow-y:auto;padding:8px;">' +
          '<div class="empty-state" style="padding:20px;"><i class="ti ti-search"></i><strong>ابدأ الكتابة للبحث</strong></div>' +
        '</div>' +
      '</div>';
      var input = overlay.querySelector('#globalSearchInput');
      input.addEventListener('input', function() {
        var q = this.value.trim().toLowerCase();
        var results = document.getElementById('globalSearchResults');
        if (!q) {
          results.innerHTML = '<div class="empty-state" style="padding:20px;"><i class="ti ti-search"></i><strong>ابدأ الكتابة للبحث</strong></div>';
          return;
        }
        var matches = [];
        var escQ = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        var re = new RegExp(escQ, 'gi');
        var DB = NEXORA.DB;
        if (DB && DB.projects) {
          DB.projects.forEach(function(p) {
            if (p.name.toLowerCase().includes(q)) matches.push({ type: 'مشروع', name: p.name, icon: 'ti ti-folder-open', id: p.id, action: 'openProject(' + p.id + ')' });
          });
        }
        if (DB && DB.items) {
          DB.items.forEach(function(i) {
            if (i.name.toLowerCase().includes(q)) {
              var prName = DB.projects ? (DB.projects.find(function(p) { return p.id === i.project_id; }) || {}).name || '' : '';
              matches.push({ type: 'بند', name: i.name + ' (مشروع: ' + prName + ')', icon: 'ti ti-layers-union', id: i.id, action: 'openProject(' + i.project_id + ');setTimeout(function(){openItem(' + i.id + ')},100)' });
            }
          });
        }
        if (DB && DB.tasks) {
          DB.tasks.forEach(function(t) {
            if (t.title.toLowerCase().includes(q)) matches.push({ type: 'مهمة', name: t.title, icon: 'ti ti-checklist', id: t.id, action: 'openTask(' + t.id + ')' });
          });
        }
        if (DB && DB.employees) {
          DB.employees.forEach(function(e) {
            if (e.full_name.toLowerCase().includes(q) || e.email.toLowerCase().includes(q)) matches.push({ type: 'موظف', name: e.full_name + ' (' + e.email + ')', icon: 'ti ti-users', id: e.id, action: 'showView(\'employees\')' });
          });
        }
        if (matches.length === 0) {
          results.innerHTML = '<div class="empty-state" style="padding:20px;"><i class="ti ti-file-off"></i><strong>لا نتائج</strong><p style="font-size:var(--fs-sm);color:var(--TX2);">لا يوجد نتائج لـ "' + q + '"</p></div>';
        } else {
          results.innerHTML = matches.slice(0, 20).map(function(m) {
            var highlighted = m.name.replace(re, '<span style="color:var(--P);background:var(--PL);padding:1px 4px;border-radius:4px;">$&</span>');
            return '<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;cursor:pointer;transition:background .12s;" onmouseover="this.style.background=\'var(--PLL)\'" onmouseout="this.style.background=\'\'" onclick="document.getElementById(\'globalSearchOverlay\').style.display=\'none\';' + (m.action || '') + ';">' +
              '<i class="' + m.icon + '" style="color:var(--P);font-size:18px;"></i>' +
              '<div><div style="font-weight:600;font-size:var(--fs-sm);color:var(--TX);">' + highlighted + '</div><div style="font-size:var(--fs-xs);color:var(--TX2);">' + m.type + '</div></div>' +
            '</div>';
          }).join('');
        }
      });
      input.addEventListener('keydown', function(ev) {
        if (ev.key === 'Escape') { overlay.style.display = 'none'; }
      });
      document.body.appendChild(overlay);
      self._searchOverlay = overlay;
    }
    overlay.style.display = 'flex';
    setTimeout(function() {
      var inp = document.getElementById('globalSearchInput');
      if (inp) inp.focus();
    }, 100);
  },

  generateNotifications: function() {
    var self = NEXORA.Components.Interactive;
    self._notifData = [];
    var DB = NEXORA.DB;
    if (!DB) return;
    var tasks = DB.tasks.filter(function(t) { return t.status === 'pending_approval'; });
    tasks.forEach(function(t) {
      var it = DB.items ? DB.items.find(function(i) { return i.id === t.item_id; }) : null;
      var pr = DB.projects && it ? DB.projects.find(function(p) { return p.id === it.project_id; }) : null;
      self._notifData.push({ icon: 'ti ti-checks', text: 'مهمة "' + t.title + '" بانتظار الاعتماد في ' + (pr ? pr.name : 'مشروع'), type: 'approval', time: Date.now() });
    });
    var lateTasks = DB.tasks.filter(function(t) {
      var a = DB.assignments ? DB.assignments.find(function(x) { return x.task_id === t.id; }) : null;
      return a && a.due_date && new Date(a.due_date) < new Date() && t.status !== 'done' && t.status !== 'pending_approval';
    });
    lateTasks.forEach(function(t) {
      self._notifData.push({ icon: 'ti ti-alert-triangle', text: 'مهمة "' + t.title + '" متأخرة!', type: 'late', time: Date.now() });
    });
    var highCost = (DB.items || []).filter(function(i) {
      var c = (DB.costs || []).filter(function(x) { return x.item_id === i.id; }).reduce(function(s, x) { return s + (x.cost || x.amount || 0); }, 0);
      return i.budget > 0 && c > i.budget;
    });
    highCost.forEach(function(i) {
      var pr = DB.projects ? DB.projects.find(function(p) { return p.id === i.project_id; }) : null;
      self._notifData.push({ icon: 'ti ti-coin', text: 'تجاوز ميزانية بند "' + i.name + '" في ' + (pr ? pr.name : 'مشروع'), type: 'budget', time: Date.now() });
    });
    DB.tasks.filter(function(t) { return t.status === 'done'; }).slice(-3).forEach(function(t) {
      self._notifData.push({ icon: 'ti ti-circle-check', text: 'مهمة "' + t.title + '" مكتملة ✓', type: 'done', time: Date.now() });
    });
    self._notifData.sort(function(a, b) { return b.time - a.time; });
    self._updateNotifBadge();
  },

  _updateNotifBadge: function() {
    var self = NEXORA.Components.Interactive;
    var el = document.getElementById('notifBadge');
    if (!el) return;
    if (self._notifData.length > 0) {
      el.style.display = 'flex';
      el.textContent = self._notifData.length > 9 ? '9+' : self._notifData.length;
    } else {
      el.style.display = 'none';
    }
  },

  toggleNotifications: function() {
    var self = NEXORA.Components.Interactive;
    var panel = document.getElementById('notifPanel');
    if (!panel) return;
    if (panel.classList.contains('open')) { self.closeNotifications(); return; }
    self.generateNotifications();
    var list = document.getElementById('notifPanelBody');
    if (!list) return;
    if (self._notifData.length === 0) {
      list.innerHTML = '<div class="empty-state" style="padding:24px;"><i class="ti ti-bell-off"></i><strong>لا توجد إشعارات</strong><p style="font-size:var(--fs-sm);color:var(--TX2);margin-top:4px;">كل شي تمام</p></div>';
    } else {
      list.innerHTML = self._notifData.map(function(n) {
        var color = n.type === 'late' ? 'var(--RE)' : n.type === 'budget' ? 'var(--G)' : n.type === 'approval' ? 'var(--AM)' : 'var(--GR)';
        return '<div style="display:flex;align-items:flex-start;gap:10px;padding:10px 12px;border-bottom:1px solid var(--BD);transition:background .12s;" onmouseover="this.style.background=\'var(--PLL)\'" onmouseout="this.style.background=\'\'">' +
          '<i class="' + n.icon + '" style="font-size:18px;color:' + color + ';flex-shrink:0;margin-top:2px;"></i>' +
          '<div><div style="font-size:var(--fs-sm);font-weight:600;color:var(--TX);">' + n.text + '</div><div style="font-size:var(--fs-xs);color:var(--TX3);margin-top:2px;">الآن</div></div>' +
        '</div>';
      }).join('');
    }
    panel.classList.add('open');
  },

  closeNotifications: function() {
    var panel = document.getElementById('notifPanel');
    if (panel) panel.classList.remove('open');
  },

  registerSW: function() {
    var self = NEXORA.Components.Interactive;
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').then(function(r) {
        r.addEventListener('updatefound', function() {
          var newSW = r.installing;
          newSW.addEventListener('statechange', function() {
            if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
              showToast('🔄 تحديث متوفر. أعد فتح الصفحة للتحديث.', 'info', 6000);
            }
          });
        });
        if ('Notification' in window && Notification.permission === 'default') {
          setTimeout(function() { Notification.requestPermission(); }, 10000);
        }
      }).catch(function() {});
    }
    window.addEventListener('beforeinstallprompt', function(e) {
      e.preventDefault();
      self._deferredPrompt = e;
      setTimeout(function() {
        if (self._deferredPrompt) self.showInstallPrompt();
      }, 30000);
    });
    window.addEventListener('appinstalled', function() {
      self._deferredPrompt = null;
      self.dismissInstall();
      showToast('✅ تم تثبيت التطبيق بنجاح', 'success');
    });
  },

  showInstallPrompt: function() {
    var ip = document.getElementById('installPrompt');
    if (ip) ip.style.display = 'flex';
  },

  installApp: function() {
    var self = NEXORA.Components.Interactive;
    if (!self._deferredPrompt) return;
    self._deferredPrompt.prompt();
    self._deferredPrompt.userChoice.then(function() { self._deferredPrompt = null; });
  },

  dismissInstall: function() {
    var ip = document.getElementById('installPrompt');
    if (ip) ip.style.display = 'none';
    NEXORA.Components.Interactive._deferredPrompt = null;
  },

  sendLocalNotification: function(title, body, icon, tag, onClickUrl) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    try {
      var n = new Notification(title, { body: body, icon: icon || '', tag: tag || 'tibrflow', requireInteraction: true });
      n.onclick = function() {
        window.focus();
        if (onClickUrl && typeof showView === 'function') showView(onClickUrl);
        this.close();
      };
    } catch (e) {}
  },

  submitContact: function() {
    var email = document.getElementById('contactEmail');
    var msgEl = document.getElementById('contactMsg');
    var box = document.getElementById('contactMsgBox');
    var emailVal = email ? email.value.trim() : '';
    var msgVal = msgEl ? msgEl.value.trim() : '';
    if (!emailVal || !msgVal) {
      if (box) box.innerHTML = '<span style="color:var(--RE);">⚠️ الرجاء تعبئة جميع الحقول</span>';
      return;
    }
    if (!emailVal.includes('@')) {
      if (box) box.innerHTML = '<span style="color:var(--RE);">⚠️ البريد الإلكتروني غير صحيح</span>';
      return;
    }
    if (box) box.innerHTML = '<span style="color:var(--G);">✅ تم إرسال رسالتك. سنتواصل معك قريباً.</span>';
    if (email) email.value = '';
    if (msgEl) msgEl.value = '';
  }
};

window.toggleNotifications = NEXORA.Components.Interactive.toggleNotifications;
window.closeNotifications = NEXORA.Components.Interactive.closeNotifications;
window.showGlobalSearch = NEXORA.Components.Interactive.showGlobalSearch;
window.submitContact = NEXORA.Components.Interactive.submitContact;
window.registerSW = NEXORA.Components.Interactive.registerSW;
window.installApp = NEXORA.Components.Interactive.installApp;
window.dismissInstall = NEXORA.Components.Interactive.dismissInstall;
