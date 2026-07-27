window.NEXORA = window.NEXORA || {};

NEXORA.Sidebar = {
  _items: [
    { view: 'dashboard', label: 'لوحة التحكم', icon: 'ti-layout-dashboard' },
    { view: 'projects', label: 'المشاريع', icon: 'ti-building' },
    { view: 'approvals', label: 'الاعتمادات', icon: 'ti-clipboard-check' },
    { view: 'costs', label: 'التكاليف', icon: 'ti-cash' },
    { view: 'reports', label: 'التقارير', icon: 'ti-chart-bar' },
    { view: 'employees', label: 'الموظفون', icon: 'ti-users' },
    { view: 'processes', label: 'العمليات PMBOK', icon: 'ti-engineering' },
    { view: 'boq', label: 'جدول الكميات', icon: 'ti-list-details', tier: 2 },
    { view: 'dailyLabor', label: 'العمالة واليوميات', icon: 'ti-calendar' },
    { view: 'cashflow', label: 'السيولة النقدية', icon: 'ti-wallet' },
    { view: 'stakeholders', label: 'أصحاب المصلحة', icon: 'ti-users-group', tier: 2 },
    { view: 'contracts', label: 'العقود', icon: 'ti-file-text', tier: 2 },
    { view: 'changes', label: 'طلبات التغيير', icon: 'ti-git-branch', tier: 2 }
  ],

  init: function() {
    var nav = document.getElementById('sidebarNav');
    if (!nav) return;
    var h = '';
    this._items.forEach(function(item) {
      if (!NEXORA.RBAC.can(item.view)) return;
      h += '<button class="nav-btn" data-view="' + item.view + '" onclick="NEXORA.Router.navigate(\'' + item.view + '\')">' +
        '<i class="ti ' + item.icon + '"></i><span>' + item.label + '</span></button>';
    });
    h += '<hr style="border-color:var(--BD);margin:8px 0;">';
    if (NEXORA.RBAC.can('admin')) {
      h += '<button class="nav-btn" data-view="admin" onclick="NEXORA.Router.navigate(\'admin\')"><i class="ti ti-settings"></i><span>إدارة الموظفين</span></button>';
    }
    if (NEXORA.Auth.isOwner()) {
      h += '<button class="nav-btn" data-view="owner" onclick="NEXORA.Router.navigate(\'owner\')"><i class="ti ti-crown"></i><span>لوحة المالك</span></button>';
    }
    nav.innerHTML = h;
  },

  updateUser: function(user) {
    var avatar = document.getElementById('sidebarUserAvatar');
    var name = document.getElementById('sidebarUserName');
    var role = document.getElementById('sidebarUserRole');
    if (user) {
      if (avatar) avatar.textContent = user.full_name ? user.full_name.charAt(0) : '?';
      if (name) name.textContent = user.full_name || '-';
      if (role) role.textContent = user.role || '-';
    }
  },

  setActive: function(view) {
    document.querySelectorAll('.nav-btn').forEach(function(b) {
      b.classList.toggle('active', b.getAttribute('data-view') === view);
    });
  },

  toggle: function() {
    var sb = document.getElementById('sidebar');
    if (sb) sb.classList.toggle('open');
  }
};
