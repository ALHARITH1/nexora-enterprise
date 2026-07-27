window.NEXORA = window.NEXORA || {};

NEXORA.Header = {
  init: function() {
    var themeBtn = document.getElementById('themeToggle');
    if (themeBtn && !themeBtn._bound) {
      themeBtn._bound = true;
      themeBtn.addEventListener('click', function() { NEXORA.App.toggleTheme(); });
    }

    var search = document.getElementById('globalSearch');
    if (search && !search._bound) {
      search._bound = true;
      search.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') { search.value = ''; search.blur(); }
      });
    }

    var notifBtn = document.getElementById('notifToggle');
    if (notifBtn && !notifBtn._bound) {
      notifBtn._bound = true;
      notifBtn.addEventListener('click', function() {
        if (typeof toggleNotifications === 'function') toggleNotifications();
      });
    }
  },

  setTitle: function(title) {
    var el = document.getElementById('headerTitle');
    if (el) el.textContent = title;
  }
};
