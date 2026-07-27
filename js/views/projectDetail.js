window.NEXORA = window.NEXORA || {};

NEXORA.Views = NEXORA.Views || {};

NEXORA.Views.ProjectDetail = {
  render: function() {
    var App = NEXORA.App;
    var DB = NEXORA.DB;
    var H = NEXORA.Helpers;
    var cu = App.cu;
    var pid = App.curProjId;
    var p = H.proj(pid);
    if (!p) return;

    var el = document.getElementById('projectContent');
    if (!el) return;

    var pr = H.projProgress(pid);
    var pf = H.projProfit(pid);
    var its = DB.items.filter(function(x) { return x.project_id === pid; });

    var h = '<div class="back-link" onclick="showView(\'projects\')"><i class="ti ti-arrow-right"></i> رجوع</div>' +
      '<div class="card" style="border-right:5px solid var(--G);">' +
        '<div class="flex-between"><h2 style="color:var(--P);">' + H.esc(p.name) + '</h2></div>' +
        '<div style="color:var(--TX2);font-size:12px;">الميزانية: ' + H.fmt(p.budget) + ' ريال | التكلفة: ' + H.fmt(pf.cost) + ' ريال | ' + (p.start_date || '') + ' → ' + (p.end_date || '') + '</div>' +
      '</div>' +
      '<div class="stats">' +
        '<div class="stat-card purple"><div class="num">' + its.length + '</div><div class="lbl">البنود</div></div>' +
        '<div class="stat-card teal"><div class="num">' + pr + '%</div><div class="lbl">الإنجاز</div></div>' +
        '<div class="stat-card orange"><div class="num">' + H.fmt(pf.cost) + '</div><div class="lbl">التكلفة</div></div>' +
        '<div class="stat-card ' + (pf.status === 'profit' ? 'green' : 'red') + '"><div class="num">' + H.fmt(Math.abs(pf.profit)) + '</div><div class="lbl">' + (pf.status === 'profit' ? 'ربح' : 'خسارة') + '</div></div>' +
      '</div>' +
      '<div class="tab-bar">' +
        '<button class="tab-btn active" onclick="switchProjTab(\'items\',this)"><i class="ti ti-layers-union"></i> البنود</button>' +
        '<button class="tab-btn" onclick="switchProjTab(\'gantt\',this)"><i class="ti ti-chart-Infographic"></i> المخطط الزمني</button>' +
      '</div>' +
      '<div id="projItemsTab" class="tab-content active"><div class="card"><div class="card-title"><i class="ti ti-layers-union"></i> البنود (المراحل)</div>' +
      '<div id="projItemMsg" class="message-box"></div>' +
      '<div class="grid-3"><div><label>اسم البند</label><input type="text" id="fItemName" placeholder="مرحلة الأساسات"></div>' +
      '<div><label>الميزانية</label><input type="number" id="fItemBudget" placeholder="500000"></div>' +
      '<div><label>الوزن</label><input type="number" id="fItemWeight" placeholder="10" value="10"></div>' +
      '<div style="display:flex;align-items:end;"><button class="btn btn-primary" onclick="addItem()"><i class="ti ti-plus"></i> إضافة بند</button></div></div>' +
      '<div id="itemsList"></div></div></div>' +
      '<div id="projGanttTab" class="tab-content"><div class="card"><div class="card-title"><i class="ti ti-chart-Infographic"></i> المخطط الزمني للمشروع</div><div id="ganttChart" style="overflow-x:auto;direction:ltr;"></div></div></div>';

    el.innerHTML = h;
    NEXORA.Views.ProjectDetail.renderItems();
  },

  renderItems: function() {
    var App = NEXORA.App;
    var DB = NEXORA.DB;
    var H = NEXORA.Helpers;
    var pid = App.curProjId;
    var its = DB.items.filter(function(x) { return x.project_id === pid; });
    var c = document.getElementById('itemsList');
    if (!c) return;

    if (!its.length) {
      c.innerHTML = '<div class="empty-state"><i class="ti ti-layers-union"></i>أضف البند الأول</div>';
      return;
    }

    c.innerHTML = its.map(function(i) {
      var pr = H.itemProgress(i.id);
      var pf = H.itemProfit(i.id);
      var cls = pr >= 75 ? 'green' : pr >= 40 ? 'orange' : 'teal';
      return '<div class="list-item" style="cursor:pointer;border-right:4px solid var(--PS);padding-right:10px;margin-bottom:6px;background:var(--BG);border-radius:6px;padding:10px;" onclick="openItem(' + i.id + ')">' +
        '<div class="info"><strong>' + H.esc(i.name) + '</strong><small>ميزانية: ' + H.fmt(i.budget) + '</small><small>تكلفة: ' + H.fmt(pf.cost) + '</small>' +
          '<span class="badge ' + (pf.status === 'profit' ? 'badge-profit' : 'badge-loss') + '">' + (pf.status === 'profit' ? 'ربح +' + H.fmt(pf.profit) : pf.status === 'loss' ? 'خسارة -' + H.fmt(Math.abs(pf.profit)) : 'بلا ميزانية') + '</span>' +
        '</div>' +
        '<div style="text-align:left;min-width:100px;"><span style="font-weight:700;">' + pr + '%</span><div class="progress-bar"><div class="progress-fill ' + cls + '" style="width:' + pr + '%"></div></div></div>' +
      '</div>';
    }).join('');
  },

  addItem: function() {
    var App = NEXORA.App;
    var DB = NEXORA.DB;
    var H = NEXORA.Helpers;
    var cu = App.cu;

    var n = document.getElementById('fItemName') ? document.getElementById('fItemName').value.trim() : '';
    var b = parseFloat(document.getElementById('fItemBudget') ? document.getElementById('fItemBudget').value : 0) || 0;
    var w = parseFloat(document.getElementById('fItemWeight') ? document.getElementById('fItemWeight').value : 0) || 10;
    if (!n) return H.msg('projItemMsg', 'أدخل اسم البند', 'error');

    DB.items.push({
      id: H.gf(DB.items),
      project_id: App.curProjId,
      name: n,
      budget: b,
      weight: w,
      manager_id: cu.id,
      status: 'pending'
    });
    DB.save();
    H.msg('projItemMsg', '✅ تم', 'success');
    document.getElementById('fItemName').value = '';
    document.getElementById('fItemBudget').value = '';
    NEXORA.Views.ProjectDetail.renderItems();
    if (typeof renderDashboard === 'function') renderDashboard();
  },

  renderGantt: function() {
    var App = NEXORA.App;
    var DB = NEXORA.DB;
    var H = NEXORA.Helpers;
    var pid = App.curProjId;
    var el = document.getElementById('ganttChart');
    if (!el) return;

    var tasks = [];
    var p = H.proj(pid);
    if (!p) return;

    tasks.push({
      id: 'p_' + p.id, name: p.name,
      start: p.start_date || new Date(), end: p.end_date || new Date(Date.now() + 864e5 * 30),
      progress: H.projProgress(p.id) / 100, dependencies: '', custom_class: 'gantt-project'
    });

    var its = DB.items.filter(function(x) { return x.project_id === pid; });
    its.forEach(function(i) {
      var iTasks = DB.tasks.filter(function(t) { return t.item_id === i.id; });
      if (iTasks.length) {
        var dates = NEXORA.Views.ProjectDetail.getTaskDateRange(i.id);
        tasks.push({
          id: 'i_' + i.id, name: i.name, start: dates.start, end: dates.end,
          progress: H.itemProgress(i.id) / 100, dependencies: '', custom_class: 'gantt-item'
        });
        iTasks.forEach(function(t, idx) {
          var a = DB.assignments.find(function(x) { return x.task_id === t.id; });
          if (!a) return;
          tasks.push({
            id: 't_' + t.id, name: t.title,
            start: a.start_date || dates.start, end: a.due_date || dates.end,
            progress: H.taskProgress(t.id) / 100,
            dependencies: idx > 0 ? 't_' + iTasks[idx - 1].id : 'i_' + i.id,
            custom_class: t.status === 'done' ? 'gantt-done' : t.status === 'in_progress' ? 'gantt-progress' : 'gantt-todo'
          });
        });
      } else {
        tasks.push({
          id: 'i_' + i.id, name: i.name,
          start: p.start_date || new Date(), end: p.end_date || new Date(Date.now() + 864e5 * 30),
          progress: H.itemProgress(i.id) / 100, dependencies: '', custom_class: 'gantt-item'
        });
      }
    });

    if (!tasks.length || !window.Gantt) return;
    el.innerHTML = '';
    try {
      var g = new Gantt(el, tasks, {
        view_mode: 'Month',
        date_format: 'YYYY-MM-DD',
        on_click: function(t) { if (t.id.startsWith('t_')) { var tid = parseInt(t.id.replace('t_', '')); if (typeof openTaskModal === 'function') openTaskModal(tid); } },
        on_date_change: function(t, start, end) { NEXORA.Views.ProjectDetail.updateTaskDate(t.id, start, end); },
        on_progress_change: function(t, progress) { NEXORA.Views.ProjectDetail.updateTaskProgress(t.id, progress); },
        custom_popup_html: function(t) { return '<div style="padding:8px;font-family:IBM Plex Sans Arabic;direction:rtl;"><strong>' + t.name + '</strong><br>التقدم: ' + (t.progress * 100).toFixed(0) + '%</div>'; },
        language: 'ar'
      });
      g.change_view_mode('Month');
    } catch (e) {
      el.innerHTML = '<div class="empty-state"><i class="ti ti-chart-Infographic"></i>تعذر تحميل المخطط</div>';
    }
  },

  getTaskDateRange: function(iid) {
    var DB = NEXORA.DB;
    var iTasks = DB.tasks.filter(function(t) { return t.item_id === iid; });
    var start = null, end = null;
    iTasks.forEach(function(t) {
      var a = DB.assignments.find(function(x) { return x.task_id === t.id; });
      if (a) {
        if (a.start_date && (!start || a.start_date < start)) start = a.start_date;
        if (a.due_date && (!end || a.due_date > end)) end = a.due_date;
      }
    });
    if (!start) start = new Date(); else start = new Date(start);
    if (!end) end = new Date(Date.now() + 864e5 * 7); else end = new Date(end);
    return { start: start, end: end };
  },

  updateTaskDate: function(id, start, end) {
    var DB = NEXORA.DB;
    var H = NEXORA.Helpers;
    var tid = parseInt(id.replace('t_', ''));
    var a = DB.assignments.find(function(x) { return x.task_id === tid; });
    if (!a) {
      DB.assignments.push({
        id: H.gf(DB.assignments), task_id: tid, employee_id: 0,
        start_date: start.toISOString().split('T')[0],
        due_date: end.toISOString().split('T')[0],
        completed_hours: 0
      });
    } else {
      a.start_date = start.toISOString().split('T')[0];
      a.due_date = end.toISOString().split('T')[0];
    }
    DB.save();
  },

  updateTaskProgress: function(id, progress) {
    var DB = NEXORA.DB;
    var H = NEXORA.Helpers;
    var tid = parseInt(id.replace('t_', ''));
    var t = H.tsk(tid);
    if (!t) return;
    if (t.estimated_hours) {
      var a = DB.assignments.find(function(x) { return x.task_id === tid; });
      if (a) a.completed_hours = Math.round(t.estimated_hours * progress);
    }
    if (progress >= 1) { t.status = 'done'; t.approved = null; }
    else if (progress > 0) { t.status = 'in_progress'; }
    DB.save();
  }
};

window.renderProjectDetail = function() { NEXORA.Views.ProjectDetail.render(); };
window.renderItems = function() { NEXORA.Views.ProjectDetail.renderItems(); };
window.addItem = function() { NEXORA.Views.ProjectDetail.addItem(); };
window.renderGantt = function() { NEXORA.Views.ProjectDetail.renderGantt(); };
