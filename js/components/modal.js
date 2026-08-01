window.NEXORA = window.NEXORA || {};
NEXORA.Components = NEXORA.Components || {};

NEXORA.Components.Modal = {
  _previousActiveElement: null,

  open: function(overlayId) {
    var el = document.getElementById(overlayId);
    if (!el) return;
    this._previousActiveElement = document.activeElement;
    el.classList.add('active');
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');

    var focusable = el.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusable.length > 0) {
      focusable[0].focus();
    }
  },

  close: function(overlayId) {
    var el = document.getElementById(overlayId);
    if (el) {
      el.classList.remove('active');
      el.removeAttribute('aria-modal');
    }
    if (this._previousActiveElement && typeof this._previousActiveElement.focus === 'function') {
      this._previousActiveElement.focus();
    }
  },

  closeAll: function() {
    document.querySelectorAll('.modal-overlay.active, .modal.active').forEach(function(el) {
      el.classList.remove('active');
    });
  }
};

if (typeof window !== 'undefined') {
  window.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      NEXORA.Components.Modal.closeAll();
    }
  });
}

window.openTaskModal = function(tid) {
  if (typeof window.openTask === 'function') {
    window.openTask(tid);
  } else {
    NEXORA.Components.Modal.open('taskModal');
  }
};

window.closeTaskModal = function() {
  NEXORA.Components.Modal.close('taskModal');
};

window.closeEmpModal = function() {
  NEXORA.Components.Modal.close('empModal');
};
