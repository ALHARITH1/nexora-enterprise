window.NEXORA = window.NEXORA || {};

NEXORA.Header = {
  init: function() {
    var menuBtn = document.getElementById('menuToggle');
    if (menuBtn) {
      menuBtn.addEventListener('click', function() {
        NEXORA.Sidebar.toggle();
      });
    }

    var themeBtn = document.getElementById('themeToggle');
    if (themeBtn) {
      themeBtn.addEventListener('click', function() { NEXORA.Header.toggleTheme(); });
      var saved = localStorage.getItem('tbr_theme');
      if (saved === 'dark') document.body.classList.add('dark');
    }

    var search = document.getElementById('globalSearch');
    if (search) {
      search.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') { search.value = ''; search.blur(); }
      });
    }
  },

  toggleTheme: function() {
    document.body.classList.toggle('dark');
    var isDark = document.body.classList.contains('dark');
    try { localStorage.setItem('tbr_theme', isDark ? 'dark' : 'light'); } catch(e) {}
  },

  setTitle: function(title) {
    var el = document.getElementById('headerTitle');
    if (el) el.textContent = title;
  }
};
