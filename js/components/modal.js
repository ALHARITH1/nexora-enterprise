window.NEXORA = window.NEXORA || {};

NEXORA.Components = NEXORA.Components || {};

NEXORA.Components.Modal = {
  open: function(overlayId) {
    var el = document.getElementById(overlayId);
    if (el) el.classList.add('active');
  },

  close: function(overlayId) {
    var el = document.getElementById(overlayId);
    if (el) el.classList.remove('active');
  },

  closeAll: function() {
    document.querySelectorAll('.modal-overlay.active').forEach(function(el) {
      el.classList.remove('active');
    });
  }
};

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
