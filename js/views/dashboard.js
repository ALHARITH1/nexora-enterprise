window.NEXORA = window.NEXORA || {};

NEXORA.Views = NEXORA.Views || {};

NEXORA.Views.Dashboard = {
  render: function() {
    var App = NEXORA.App;
    var DB = NEXORA.DB;
    var H = NEXORA.Helpers;
    var cu = App.cu;
    var el = document.getElementById('dashContent');
    if (!el) return;

    if (typeof NEXORA.Components.Charts !== 'undefined') {
      NEXORA.Components.Charts.destroyAll();
    }

    var scopedProjects = cu.is_owner ? DB.projects : DB.projects;
    var allTasks = cu.is_owner ? DB.tasks : DB.tasks.filter(function(t) {
      var i = H.itm(t.item_id);
      return i && scopedProjects.find(function(p) { return p.id === i.project_id; });
    });

    var doneT = allTasks.filter(function(x) { return x.status === 'done' && x.approved; });
    var pendA = allTasks.filter(function(x) { return x.status === 'done' && x.approved === null; });
    var totalB = scopedProjects.reduce(function(s, p) { return s + (p.budget || 0); }, 0);
    var totalC = scopedProjects.reduce(function(s, p) { return s + H.projCost(p.id); }, 0);
    var netP = totalB - totalC;
    var activeP = scopedProjects.filter(function(p) { return p.status === 'active'; }).length;
    var lateP = scopedProjects.filter(function(p) {
      return p.status === 'active' && new Date(p.end_date) < new Date() && H.projProgress(p.id) < 100;
    }).length;
    var lateTasks = allTasks.filter(function(t) {
      var a = DB.assignments.find(function(x) { return x.task_id === t.id; });
      return a && a.due_date && new Date(a.due_date) < new Date() && t.status !== 'done' && t.status !== 'pending_approval';
    });
    var totalCosts = (DB.costs || []).reduce(function(s, x) { return s + (x.cost || x.amount || 0); }, 0);
    var losses = scopedProjects.filter(function(p) { var c = H.projCost(p.id); return p.budget > 0 && c > p.budget; });
    var totalLoss = losses.reduce(function(s, p) { var c = H.projCost(p.id); return s + (c - p.budget); }, 0);
    var profits = scopedProjects.filter(function(p) { var c = H.projCost(p.id); return p.budget > 0 && c <= p.budget; });
    var totalProfit = profits.reduce(function(s, p) { var c = H.projCost(p.id); return s + (p.budget - c); }, 0);

    var html = '<div class="stats">' +
      '<div class="stat-card blue"><div class="num">' + scopedProjects.length + '</div><div class="lbl">إجمالي المشاريع</div></div>' +
      '<div class="stat-card gold"><div class="num">' + activeP + '</div><div class="lbl">مشاريع نشطة</div></div>' +
      '<div class="stat-card red"><div class="num">' + lateP + '</div><div class="lbl">متأخرة</div></div>' +
      '<div class="stat-card green"><div class="num">' + H.fmt(totalProfit) + '</div><div class="lbl">الأرباح</div></div>' +
      '<div class="stat-card red"><div class="num">' + H.fmt(totalLoss) + '</div><div class="lbl">الخسائر</div></div>' +
      '<div class="stat-card gold"><div class="num">' + H.fmt(totalCosts) + '</div><div class="lbl">إجمالي المصروفات</div></div>' +
    '</div>';

    html += '<div class="grid-2" style="margin-bottom:16px;">' +
      '<div class="card"><div class="card-title"><i class="ti ti-chart-bar"></i> تقدم المشاريع</div>' +
        '<div style="position:relative;height:220px;"><canvas id="chartProgress"></canvas></div>' +
      '</div>' +
      '<div class="card"><div class="card-title"><i class="ti ti-chart-pie"></i> توزيع المهام</div>' +
        '<div style="position:relative;height:220px;"><canvas id="chartTasks"></canvas></div>' +
      '</div>' +
    '</div>';

    html += '<div class="grid-2" style="margin-bottom:16px;">' +
      '<div class="card"><div class="card-title"><i class="ti ti-trending-up"></i> الملخص المالي</div>' +
        '<div class="list-item"><div class="info"><strong>إجمالي الميزانية</strong></div><span>' + H.fmt(totalB) + '</span></div>' +
        '<div class="list-item"><div class="info"><strong>إجمالي التكاليف</strong></div><span style="color:var(--G);">' + H.fmt(totalC) + '</span></div>' +
        '<div class="list-item"><div class="info"><strong style="color:' + (netP >= 0 ? 'var(--GR)' : 'var(--RE)') + ';">' + (netP >= 0 ? 'الربح الصافي' : 'الخسارة الصافية') + '</strong></div><span style="font-weight:700;color:' + (netP >= 0 ? 'var(--GR)' : 'var(--RE)') + ';">' + H.fmt(Math.abs(netP)) + ' ريال</span></div>' +
      '</div>' +
      '<div class="card"><div class="card-title"><i class="ti ti-clock"></i> بانتظار الاعتماد</div>' +
        (!pendA.length ? '<div class="empty-state" style="padding:16px;"><i class="ti ti-check-circle"></i>لا توجد مهام بانتظار الاعتماد</div>'
        : pendA.slice(0, 5).map(function(t) {
          var u = H.emp(t.assigned_to);
          return '<div class="list-item"><div class="info"><strong>' + H.esc(t.title) + '</strong><small>' + (u ? H.esc(u.full_name) : '') + '</small></div><span class="badge badge-pending">بانتظار</span></div>';
        }).join('')) +
      '</div>' +
    '</div>';

    html += '<div class="card"><div class="card-title"><i class="ti ti-list"></i> المشاريع</div>';
    if (!DB.projects.length) {
      html += '<div class="empty-state"><i class="ti ti-folder-open"></i>لا توجد مشاريع</div>';
    } else {
      html += DB.projects.map(function(p) {
        var pr = H.projProgress(p.id), pc = pr >= 75 ? 'green' : pr >= 40 ? 'gold' : 'blue';
        return '<div class="list-item" style="cursor:pointer;" onclick="openProject(' + p.id + ')">' +
          '<div class="info"><strong>' + H.esc(p.name) + '</strong><small>' + H.fmt(p.budget) + ' ريال</small></div>' +
          '<div style="text-align:left;min-width:120px;"><span style="font-weight:700;color:' + (pr >= 75 ? 'var(--GR)' : pr >= 40 ? 'var(--G)' : 'var(--P)') + ';">' + pr + '%</span><div class="progress-bar"><div class="progress-fill ' + pc + '" style="width:' + pr + '%"></div></div></div>' +
        '</div>';
      }).join('');
    }
    html += '</div>';

    html += '<div class="card"><div class="card-title"><i class="ti ti-alert-triangle" style="color:var(--RE);"></i> المهام المتأخرة</div>';
    if (!lateTasks.length) {
      html += '<div class="empty-state" style="padding:16px;"><i class="ti ti-check-circle"></i>لا توجد مهام متأخرة</div>';
    } else {
      html += lateTasks.slice(0, 5).map(function(t) {
        var u = H.emp(t.assigned_to);
        var a = DB.assignments.find(function(x) { return x.task_id === t.id; });
        return '<div class="list-item"><div class="info"><strong>' + H.esc(t.title) + '</strong><small>' + (u ? H.esc(u.full_name) : '') + (a && a.due_date ? ' — ' + new Date(a.due_date).toLocaleDateString('ar-SA') : '') + '</small></div><span class="badge badge-rejected">متأخرة</span></div>';
      }).join('');
    }
    html += '</div>';

    if (!cu.is_owner && cu.company_id) {
      var co = DB.companies.find(function(c) { return c.id === cu.company_id; });
      if (co && co.subscription === 'trial') {
        var daysLeft = Math.ceil((new Date(co.trial_end) - new Date()) / (1000 * 60 * 60 * 24));
        if (daysLeft <= 7 && daysLeft > 0) {
          html = '<div class="message-box warning" style="display:block;">⏳ الفترة التجريبية متبقى عليها <strong>' + daysLeft + '</strong> يوم. ' + (daysLeft <= 3 ? 'اشترك الآن لضمان استمرارية الخدمة.' : '') + '</div>' + html;
        }
      }
    }

    el.innerHTML = html;

    var approvalsCountEl = document.getElementById('approvalsCount');
    if (approvalsCountEl) approvalsCountEl.textContent = pendA.length;

    setTimeout(function() {
      if (typeof Chart === 'undefined') return;
      try {
        if (typeof NEXORA.Components.Charts !== 'undefined' && scopedProjects.length > 0) {
          NEXORA.Components.Charts.createProgress('chartProgress', scopedProjects);
        }
        if (typeof NEXORA.Components.Charts !== 'undefined') {
          NEXORA.Components.Charts.createTasks('chartTasks', {
            todo: allTasks.filter(function(t) { return t.status === 'todo'; }).length,
            inProgress: allTasks.filter(function(t) { return t.status === 'in_progress'; }).length,
            done: doneT.length,
            pending: pendA.length
          });
        }
      } catch (e) {}
    }, 50);
  }
};

window.renderDashboard = function() { NEXORA.Views.Dashboard.render(); };
