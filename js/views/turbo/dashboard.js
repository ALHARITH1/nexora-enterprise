window.NEXORA = window.NEXORA || {};
NEXORA.Views = NEXORA.Views || {};

NEXORA.Views.Turbo = {
  render: async function() {
    var App = NEXORA.App;
    var H = NEXORA.Helpers;
    var cu = App.cu;
    var el = document.getElementById('turboContent');
    if (!el) return;

    el.innerHTML = '<div class="card"><div class="empty-state"><i class="ti ti-loader"></i>جاري التحميل...</div></div>';

    try {
      var allProjects = await NEXORA.Repositories.projects.list();
      var allTasks = await NEXORA.Repositories.tasks.list();
      var allCosts = await NEXORA.Repositories.costs.list();
      var allCashFlow = await NEXORA.Repositories.cash_flow.list();
      var allLogs = await NEXORA.Repositories.daily_wages.list();
      var allEmps = await NEXORA.Repositories.employees.list();

      var today = new Date().toISOString().split('T')[0];
      var todayLogs = allLogs.filter(function(l) { return (l.date || l.work_date) === today; });
      var todayPurchases = allCosts.filter(function(c) { return c.date === today; });
      var totalSpent = todayPurchases.reduce(function(s, c) { return s + (c.cost || c.amount || 0); }, 0);
      var activeTasks = allTasks.filter(function(t) { return t.status === 'in_progress' || t.status === 'todo'; });
      var doneTasks = allTasks.filter(function(t) { return t.status === 'done'; });
      var totalTasks = allTasks.length;
      var pct = totalTasks ? Math.round(doneTasks.length / totalTasks * 100) : 0;
      var cashIn = allCashFlow.filter(function(c) { return c.type === 'income' || c.type === 'inflow'; }).reduce(function(s, c) { return s + (c.amount || 0); }, 0);
      var cashOut = allCashFlow.filter(function(c) { return c.type === 'expense' || c.type === 'outflow'; }).reduce(function(s, c) { return s + (c.amount || 0); }, 0);
      var balance = cashIn - cashOut;

      var h = '<div class="turbo-welcome">' +
        '<div style="flex:1;"><h2 style="margin:0;">مرحباً، ' + H.esc(cu.full_name) + '!</h2>' +
        '<p style="color:var(--TX2);margin:4px 0 0;">' + today + ' — ' + allProjects.length + ' مشاريع نشطة</p></div>' +
        '<div class="turbo-balance"><span style="color:var(--TX2);font-size:var(--fs-sm);">الرصيد</span>' +
        '<span style="font-size:var(--fs-xl);font-weight:700;color:' + (balance >= 0 ? 'var(--GR)' : 'var(--RE)') + ';">' + H.fmt(balance) + ' ر.س</span></div>' +
      '</div>';

      h += '<div class="turbo-stats">' +
        '<div class="turbo-stat" onclick="NEXORA.Router.navigate(\'dailyLabor\')"><div class="ts-icon" style="background:var(--PL);color:var(--P);"><i class="ti ti-users"></i></div><div class="ts-info"><div class="ts-num">' + todayLogs.length + '</div><div class="ts-lbl">يوميات اليوم</div></div></div>' +
        '<div class="turbo-stat" onclick="NEXORA.Router.navigate(\'cashflow\')"><div class="ts-icon" style="background:#dcfce7;color:var(--GR);"><i class="ti ti-shopping-cart"></i></div><div class="ts-info"><div class="ts-num">' + H.fmt(totalSpent) + '</div><div class="ts-lbl">مشتريات اليوم</div></div></div>' +
        '<div class="turbo-stat" onclick="NEXORA.Router.navigate(\'costs\')"><div class="ts-icon" style="background:#fef3c7;color:var(--AM);"><i class="ti ti-clock"></i></div><div class="ts-info"><div class="ts-num">' + activeTasks.length + '</div><div class="ts-lbl">مهام نشطة</div></div></div>' +
        '<div class="turbo-stat" onclick="NEXORA.Router.navigate(\'reports\')"><div class="ts-icon" style="background:#fee2e2;color:var(--RE);"><i class="ti ti-chart-bar"></i></div><div class="ts-info"><div class="ts-num">' + pct + '%</div><div class="ts-lbl">الإنجاز</div></div></div>' +
      '</div>';

      h += '<div class="turbo-progress">' +
        '<div style="display:flex;justify-content:space-between;margin-bottom:6px;"><strong>تقدم اليوم</strong><span>' + doneTasks.length + '/' + totalTasks + ' مهمة</span></div>' +
        '<div class="progress-bar"><div class="progress-fill ' + (pct >= 75 ? 'green' : pct >= 40 ? 'orange' : 'purple') + '" style="width:' + pct + '%"></div></div>' +
      '</div>';

      h += '<div class="turbo-actions">' +
        '<h3>إجراءات سريعة</h3>' +
        '<div class="turbo-action-grid">' +
          '<button class="turbo-action-btn" onclick="NEXORA.Router.navigate(\'dailyLabor\')"><i class="ti ti-user-plus"></i><span>تسجيل حضور</span></button>' +
          '<button class="turbo-action-btn" onclick="NEXORA.Router.navigate(\'cashflow\')"><i class="ti ti-receipt"></i><span>إضافة مصروف</span></button>' +
          '<button class="turbo-action-btn" onclick="NEXORA.Router.navigate(\'costs\')"><i class="ti ti-shopping-cart"></i><span>مشتريات</span></button>' +
          '<button class="turbo-action-btn" onclick="NEXORA.Router.navigate(\'boq\')"><i class="ti ti-file-invoice"></i><span>مستخلص</span></button>' +
          '<button class="turbo-action-btn" onclick="NEXORA.Router.navigate(\'reports\')"><i class="ti ti-chart-line"></i><span>التقارير</span></button>' +
          '<button class="turbo-action-btn" onclick="NEXORA.Router.navigate(\'dashboard\')"><i class="ti ti-dashboard"></i><span>وضع الشركة</span></button>' +
        '</div>' +
      '</div>';

      if (activeTasks.length) {
        h += '<div class="turbo-recent"><h3>المهام النشطة</h3>';
        activeTasks.slice(0, 5).forEach(function(t) {
          var emp = allEmps.find(function(e) { return String(e.id) === String(t.assigned_to); });
          h += '<div class="turbo-task" onclick="openTask(' + t.id + ')">' +
            '<div><strong>' + H.esc(t.title) + '</strong><small>' + (emp ? H.esc(emp.full_name) : 'غير مسند') + '</small></div>' +
            '<span class="badge badge-' + (t.status === 'in_progress' ? 'progress' : 'todo') + '">' + (t.status === 'in_progress' ? 'جارٍ' : 'معلق') + '</span>' +
          '</div>';
        });
        h += '</div>';
      }

      el.innerHTML = h;
    } catch(err) {
      el.innerHTML = '<div class="card"><div class="empty-state"><i class="ti ti-alert-triangle" style="color:var(--ER);"></i>حدث خطأ: ' + H.esc(err.message) + '</div></div>';
    }
  }
};

window.renderTurbo = function() { NEXORA.Views.Turbo.render(); };
