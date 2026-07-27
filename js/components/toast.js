window.NEXORA = window.NEXORA || {};

NEXORA.Components = NEXORA.Components || {};

NEXORA.Components.Toast = {
  container: null,

  _getContainer: function() {
    if (this.container && document.body.contains(this.container)) return this.container;
    this.container = document.getElementById('toastContainer');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toastContainer';
      this.container.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:200;display:flex;flex-direction:column;gap:8px;pointer-events:none;';
      document.body.appendChild(this.container);
    }
    return this.container;
  },

  show: function(msg, type, duration) {
    if (type === undefined) type = 'info';
    if (duration === undefined) duration = 3000;
    var container = this._getContainer();
    if (!container) return;
    var colors = { info: 'var(--P)', success: 'var(--GR)', error: 'var(--RE)', warning: 'var(--G)' };
    var icons = { info: 'ti ti-info-circle', success: 'ti ti-circle-check', error: 'ti ti-alert-circle', warning: 'ti ti-alert-triangle' };
    var el = document.createElement('div');
    el.style.cssText = 'background:' + (colors[type] || colors.info) + ';color:#fff;padding:12px 18px;border-radius:999px;font-size:var(--fs-sm);font-weight:600;box-shadow:0 8px 24px rgba(0,0,0,.15);display:flex;align-items:center;gap:8px;pointer-events:auto;animation:toastIn .25s ease;font-family:\'IBM Plex Sans Arabic\',sans-serif;direction:rtl;';
    el.innerHTML = '<i class="' + (icons[type] || icons.info) + '" style="font-size:16px;"></i> ' + msg;
    container.appendChild(el);
    setTimeout(function() {
      el.style.transition = 'opacity .25s, transform .25s';
      el.style.opacity = '0';
      el.style.transform = 'translateY(8px)';
      setTimeout(function() { el.remove(); }, 300);
    }, duration);
  }
};

window.showToast = function(msg, type, duration) {
  NEXORA.Components.Toast.show(msg, type, duration);
};

var _origMsg = window.msg;
window.msg = function(id, t, tp) {
  if (id === 'loginMsg' || id === 'regMsg') {
    showToast(t, tp === 'error' ? 'error' : tp === 'success' ? 'success' : 'info');
    var e = document.getElementById(id);
    if (e) { e.textContent = t; e.className = 'message-box ' + tp; }
  } else if (_origMsg) {
    _origMsg(id, t, tp);
  }
};
