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
    var self = NEXORA.Components.Modal;
    document.querySelectorAll('.modal-overlay.active, .modal.active').forEach(function(el) {
      el.classList.remove('active');
      el.removeAttribute('aria-modal');
    });
    if (self._previousActiveElement && typeof self._previousActiveElement.focus === 'function') {
      self._previousActiveElement.focus();
      self._previousActiveElement = null;
    }
  },
  
  handleTab: function(e, activeModal) {
    var focusable = activeModal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (!focusable.length) return;
    
    var firstElement = focusable[0];
    var lastElement = focusable[focusable.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastElement) {
        firstElement.focus();
        e.preventDefault();
      }
    }
  }
};

if (typeof window !== 'undefined') {
  window.addEventListener('keydown', function(e) {
    var activeModal = document.querySelector('.modal-overlay.active, .modal.active');
    
    if (e.key === 'Escape' && activeModal) {
      NEXORA.Components.Modal.closeAll();
    } else if (e.key === 'Tab' && activeModal) {
      NEXORA.Components.Modal.handleTab(e, activeModal);
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
