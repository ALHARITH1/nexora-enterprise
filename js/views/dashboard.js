window.NEXORA = window.NEXORA || {};
NEXORA.Views = NEXORA.Views || {};

NEXORA.Views.Dashboard = {
  render: async function() {
    var App = NEXORA.App;
    var H = NEXORA.Helpers;
    var cu = App.cu;
    var el = document.getElementById('dashContent');
    if (!el) return;

    if (typeof NEXORA.Components.Charts !== 'undefined') {
      NEXORA.Components.Charts.destroyAll();
    }

    el.innerHTML = '<div class="card"><div class="empty-state"><i class="ti ti-loader"></i>جاري التحميل...</div></div>';

    try {
      var allProjects = await NEXORA.Repositories.projects.list();
      var allTasks = await NEXORA.Repositories.tasks.list();
      var allItems = await NEXORA.Repositories.items.list();
      var allCosts = await NEXORA.Repositories.costs.list();
      var allAssignments = await NEXORA.Repositories.assignments.list();

      var scopedProjects = cu && cu.is_owner ? allProjects : allProjects;
      
      var scopedTasks = cu && cu.is_owner ? allTasks : allTasks.filter(function(t) {
        var i = allItems.find(it => String(it.id) === String(t.item_id));
        return i && scopedProjects.find(function(p) { return String(p.id) === String(i.project_id); });
      });

      var projCost = function(pid) {
        return allCosts.filter(x => String(x.project_id) === String(pid)).reduce((s, x) => s + (x.cost || x.amount || 0), 0);
      };
      
      var projProgress = function(pid) {
        var its = allItems.filter(x => String(x.project_id) === String(pid));
        if (!its.length) return 0;
        var done = its.reduce((s, x) => s + (x.progress || 0), 0);
        return Math.round(done / its.length);
      };

      var doneT = scopedTasks.filter(function(x) { return x.status === 'done' && x.approved; });
      var pendA = scopedTasks.filter(function(x) { return x.status === 'done' && x.approved === null; });
      var totalB = scopedProjects.reduce(function(s, p) { return s + (p.budget || 0); }, 0);
      var totalC = scopedProjects.reduce(function(s, p) { return s + projCost(p.id); }, 0);
      var netP = totalB - totalC;
      var activeP = scopedProjects.filter(function(p) { return p.status === 'active'; }).length;
      var lateP = scopedProjects.filter(function(p) {
        return p.status === 'active' && new Date(p.end_date) < new Date() && projProgress(p.id) < 100;
      }).length;
      
      var lateTasks = scopedTasks.filter(function(t) {
        var a = allAssignments.find(function(x) { return String(x.task_id) === String(t.id); });
        return a && a.due_date && new Date(a.due_date) < new Date() && t.status !== 'done' && t.status !== 'pending_approval';
      });
      
      var totalCosts = allCosts.reduce(function(s, x) { return s + (x.cost || x.amount || 0); }, 0);
      var losses = scopedProjects.filter(function(p) { var c = projCost(p.id); return p.budget > 0 && c > p.budget; });
      var totalLoss = losses.reduce(function(s, p) { var c = projCost(p.id); return s + (c - p.budget); }, 0);
      var profits = scopedProjects.filter(function(p) { var c = projCost(p.id); return p.budget > 0 && c <= p.budget; });
      var totalProfit = profits.reduce(function(s, p) { var c = projCost(p.id); return s + (p.budget - c); }, 0);

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
            // Need a fast lookup for employee; H.emp uses synchronous DB.employees but we can just use the global or fetch it
            return '<div class="list-item"><div class="info"><strong>' + H.esc(t.title) + '</strong></div><span class="badge badge-pending">بانتظار</span></div>';
          }).join('')) +
        '</div>' +
      '</div>';

      html += '<div class="card"><div class="card-title"><i class="ti ti-list"></i> المشاريع</div>';
      if (!scopedProjects.length) {
        html += '<div class="empty-state"><i class="ti ti-folder-open"></i>لا توجد مشاريع</div>';
      } else {
        html += scopedProjects.map(function(p) {
          var pr = projProgress(p.id), pc = pr >= 75 ? 'green' : pr >= 40 ? 'gold' : 'blue';
          return '<div class="list-item" style="cursor:pointer;" onclick="NEXORA.Router.navigate(\'project\'); NEXORA.App.curProjId=' + p.id + ';">' +
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
          var a = allAssignments.find(function(x) { return String(x.task_id) === String(t.id); });
          return '<div class="list-item"><div class="info"><strong>' + H.esc(t.title) + '</strong><small>' + (a && a.due_date ? ' — ' + new Date(a.due_date).toLocaleDateString('ar-SA') : '') + '</small></div><span class="badge badge-rejected">متأخرة</span></div>';
        }).join('');
      }
      html += '</div>';

      // Skip trial check for now unless companies is fetched
      el.innerHTML = html;

      var approvalsCountEl = document.getElementById('approvalsCount');
      if (approvalsCountEl) approvalsCountEl.textContent = pendA.length;

      setTimeout(function() {
        if (typeof Chart === 'undefined') return;
        try {
          if (typeof NEXORA.Components.Charts !== 'undefined' && scopedProjects.length > 0) {
            // Need to pass projects mapped with progress to Charts
            var chartProjs = scopedProjects.map(p => ({
               name: p.name,
               progress: projProgress(p.id)
            }));
            NEXORA.Components.Charts.createProgress('chartProgress', chartProjs);
          }
          if (typeof NEXORA.Components.Charts !== 'undefined') {
            NEXORA.Components.Charts.createTasks('chartTasks', {
              todo: scopedTasks.filter(function(t) { return t.status === 'todo'; }).length,
              inProgress: scopedTasks.filter(function(t) { return t.status === 'in_progress'; }).length,
              done: doneT.length,
              pending: pendA.length
            });
          }
        } catch (e) {}
      }, 50);

    } catch(err) {
      el.innerHTML = '<div class="card"><div class="empty-state"><i class="ti ti-alert-triangle" style="color:var(--ER);"></i>حدث خطأ: ' + H.esc(err.message) + '</div></div>';
    }
  }
};

window.renderDashboard = function() { NEXORA.Views.Dashboard.render(); };
