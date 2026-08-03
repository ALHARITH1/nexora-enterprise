import Gantt from 'frappe-gantt';
import 'frappe-gantt/dist/frappe-gantt.css';

window.NEXORA = window.NEXORA || {};
NEXORA.Views = NEXORA.Views || {};

NEXORA.Views.ProjectDetail = {
  render: async function() {
    var App = NEXORA.App;
    var H = NEXORA.Helpers;
    var pid = App.curProjId;
    
    var el = document.getElementById('projectContent');
    if (!el) return;

    el.innerHTML = '<div class="card"><div class="empty-state"><i class="ti ti-loader"></i>جاري التحميل...</div></div>';

    try {
      var projects = await NEXORA.Repositories.projects.list();
      var p = projects.find(x => String(x.id) === String(pid));
      if (!p) return;

      var items = await NEXORA.Repositories.items.list();
      var costs = await NEXORA.Repositories.costs.list();

      var its = items.filter(function(x) { return String(x.project_id) === String(pid); });
      
      var pr = its.length ? Math.round(its.reduce((s, x) => s + (x.progress || 0), 0) / its.length) : 0;
      var pc = costs.filter(x => String(x.project_id) === String(pid)).reduce((s, x) => s + (x.cost || x.amount || 0), 0);
      var pp = (p.budget || 0) - pc;

      var h = '<div class="back-link" onclick="NEXORA.Router.navigate(\'projects\')"><i class="ti ti-arrow-right"></i> رجوع</div>' +
        '<div class="card" style="border-right:5px solid var(--G);">' +
          '<div class="flex-between"><h2 style="color:var(--P);">' + H.esc(p.name) + '</h2></div>' +
          '<div style="color:var(--TX2);font-size:12px;">الميزانية: ' + H.fmt(p.budget) + ' ريال | التكلفة: ' + H.fmt(pc) + ' ريال | ' + (p.start_date || '') + ' → ' + (p.end_date || '') + '</div>' +
        '</div>' +
        '<div class="stats">' +
          '<div class="stat-card purple"><div class="num">' + its.length + '</div><div class="lbl">البنود</div></div>' +
          '<div class="stat-card teal"><div class="num">' + pr + '%</div><div class="lbl">الإنجاز</div></div>' +
          '<div class="stat-card orange"><div class="num">' + H.fmt(pc) + '</div><div class="lbl">التكلفة</div></div>' +
          '<div class="stat-card ' + (pp >= 0 ? 'green' : 'red') + '"><div class="num">' + H.fmt(Math.abs(pp)) + '</div><div class="lbl">' + (pp >= 0 ? 'ربح' : 'خسارة') + '</div></div>' +
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
      await NEXORA.Views.ProjectDetail.renderItems();
    } catch(err) {
      el.innerHTML = '<div class="card"><div class="empty-state"><i class="ti ti-alert-triangle" style="color:var(--ER);"></i>حدث خطأ: ' + H.esc(err.message) + '</div></div>';
    }
  },

  renderItems: async function() {
    var App = NEXORA.App;
    var H = NEXORA.Helpers;
    var pid = App.curProjId;
    var c = document.getElementById('itemsList');
    if (!c) return;
    
    try {
      var items = await NEXORA.Repositories.items.list();
      var costs = await NEXORA.Repositories.costs.list();
      
      var its = items.filter(function(x) { return String(x.project_id) === String(pid); });

      if (!its.length) {
        c.innerHTML = '<div class="empty-state"><i class="ti ti-layers-union"></i>أضف البند الأول</div>';
        return;
      }

      c.innerHTML = its.map(function(i) {
        var pr = i.progress || 0;
        var ic = costs.filter(x => String(x.item_id) === String(i.id)).reduce((s, x) => s + (x.cost || x.amount || 0), 0);
        var pp = (i.budget || 0) - ic;
        var cls = pr >= 75 ? 'green' : pr >= 40 ? 'orange' : 'teal';
        return '<div class="list-item" style="cursor:pointer;border-right:4px solid var(--PS);padding-right:10px;margin-bottom:6px;background:var(--BG);border-radius:6px;padding:10px;" onclick="NEXORA.Router.navigate(\'item\'); NEXORA.App.curItemId=' + i.id + ';">' +
          '<div class="info"><strong>' + H.esc(i.name) + '</strong><small>ميزانية: ' + H.fmt(i.budget) + '</small><small>تكلفة: ' + H.fmt(ic) + '</small>' +
            '<span class="badge ' + (pp >= 0 ? 'badge-profit' : 'badge-loss') + '">' + (pp >= 0 ? 'ربح +' + H.fmt(pp) : 'خسارة -' + H.fmt(Math.abs(pp))) + '</span>' +
          '</div>' +
          '<div style="text-align:left;min-width:100px;"><span style="font-weight:700;">' + pr + '%</span><div class="progress-bar"><div class="progress-fill ' + cls + '" style="width:' + pr + '%"></div></div></div>' +
        '</div>';
      }).join('');
    } catch(err) {
      c.innerHTML = '<div class="empty-state"><i class="ti ti-alert-triangle" style="color:var(--ER);"></i>حدث خطأ: ' + H.esc(err.message) + '</div>';
    }
  },

  addItem: async function() {
    var App = NEXORA.App;
    var H = NEXORA.Helpers;
    var cu = App.cu;

    var n = document.getElementById('fItemName') ? document.getElementById('fItemName').value.trim() : '';
    var b = parseFloat(document.getElementById('fItemBudget') ? document.getElementById('fItemBudget').value : 0) || 0;
    var w = parseFloat(document.getElementById('fItemWeight') ? document.getElementById('fItemWeight').value : 0) || 10;
    if (!n) return H.msg('projItemMsg', 'أدخل اسم البند', 'error');

    try {
      await NEXORA.Repositories.items.create({
        project_id: App.curProjId,
        name: n,
        budget: b,
        weight: w,
        manager_id: cu ? cu.id : 0,
        status: 'pending',
        progress: 0
      });
      
      H.msg('projItemMsg', '✅ تم', 'success');
      document.getElementById('fItemName').value = '';
      document.getElementById('fItemBudget').value = '';
      await NEXORA.Views.ProjectDetail.renderItems();
      if (typeof renderDashboard === 'function') renderDashboard();
    } catch(err) {
      H.msg('projItemMsg', err.message, 'error');
    }
  },

  renderGantt: async function() {
    var App = NEXORA.App;
    var H = NEXORA.Helpers;
    var pid = App.curProjId;
    var el = document.getElementById('ganttChart');
    if (!el) return;
    
    el.innerHTML = '<div class="empty-state"><i class="ti ti-loader"></i>جاري التحميل...</div>';

    try {
      var tasks = [];
      var projects = await NEXORA.Repositories.projects.list();
      var items = await NEXORA.Repositories.items.list();
      var allTasks = await NEXORA.Repositories.tasks.list();
      var allAssignments = await NEXORA.Repositories.assignments.list();
      
      var p = projects.find(x => String(x.id) === String(pid));
      if (!p) return;
      
      var pItems = items.filter(x => String(x.project_id) === String(pid));
      var pProgress = pItems.length ? Math.round(pItems.reduce((s, x) => s + (x.progress || 0), 0) / pItems.length) : 0;

      tasks.push({
        id: 'p_' + p.id, name: p.name,
        start: p.start_date || new Date(), end: p.end_date || new Date(Date.now() + 864e5 * 30),
        progress: pProgress / 100, dependencies: '', custom_class: 'gantt-project'
      });

      pItems.forEach(function(i) {
        var iTasks = allTasks.filter(function(t) { return String(t.item_id) === String(i.id); });
        if (iTasks.length) {
          var start = null, end = null;
          iTasks.forEach(function(t) {
            var a = allAssignments.find(function(x) { return String(x.task_id) === String(t.id); });
            if (a) {
              if (a.start_date && (!start || a.start_date < start)) start = a.start_date;
              if (a.due_date && (!end || a.due_date > end)) end = a.due_date;
            }
          });
          if (!start) start = new Date(); else start = new Date(start);
          if (!end) end = new Date(Date.now() + 864e5 * 7); else end = new Date(end);
          
          tasks.push({
            id: 'i_' + i.id, name: i.name, start: start, end: end,
            progress: (i.progress || 0) / 100, dependencies: '', custom_class: 'gantt-item'
          });
          iTasks.forEach(function(t, idx) {
            var a = allAssignments.find(function(x) { return String(x.task_id) === String(t.id); });
            var tStart = (a && a.start_date) ? a.start_date : start;
            var tEnd = (a && a.due_date) ? a.due_date : end;
            var pr = t.status === 'done' ? 1 : (t.status === 'in_progress' ? 0.5 : 0);
            tasks.push({
              id: 't_' + t.id, name: t.title,
              start: tStart, end: tEnd,
              progress: pr,
              dependencies: idx > 0 ? 't_' + iTasks[idx - 1].id : 'i_' + i.id,
              custom_class: t.status === 'done' ? 'gantt-done' : t.status === 'in_progress' ? 'gantt-progress' : 'gantt-todo'
            });
          });
        } else {
          tasks.push({
            id: 'i_' + i.id, name: i.name,
            start: p.start_date || new Date(), end: p.end_date || new Date(Date.now() + 864e5 * 30),
            progress: (i.progress || 0) / 100, dependencies: '', custom_class: 'gantt-item'
          });
        }
      });

      if (!tasks.length || typeof Gantt === 'undefined') {
        el.innerHTML = '<div class="empty-state"><i class="ti ti-chart-Infographic"></i>لا توجد بيانات كافية أو لم يتم تحميل مكتبة Gantt</div>';
        return;
      }
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
    } catch(err) {
      el.innerHTML = '<div class="empty-state"><i class="ti ti-alert-triangle" style="color:var(--ER);"></i>حدث خطأ: ' + H.esc(err.message) + '</div>';
    }
  },

  updateTaskDate: async function(id, start, end) {
    var tid = parseInt(id.replace('t_', ''));
    try {
      var assignments = await NEXORA.Repositories.assignments.list();
      var a = assignments.find(function(x) { return String(x.task_id) === String(tid); });
      if (!a) {
        await NEXORA.Repositories.assignments.create({
          task_id: tid, employee_id: 0,
          start_date: start.toISOString().split('T')[0],
          due_date: end.toISOString().split('T')[0],
          completed_hours: 0
        });
      } else {
        await NEXORA.Repositories.assignments.update(a.id, {
          start_date: start.toISOString().split('T')[0],
          due_date: end.toISOString().split('T')[0]
        });
      }
    } catch(err) {
      console.error('Failed to update task date', err);
    }
  },

  updateTaskProgress: async function(id, progress) {
    var tid = parseInt(id.replace('t_', ''));
    try {
      var tasks = await NEXORA.Repositories.tasks.list();
      var t = tasks.find(x => String(x.id) === String(tid));
      if (!t) return;
      
      var updates = {};
      if (t.estimated_hours) {
        var assignments = await NEXORA.Repositories.assignments.list();
        var a = assignments.find(function(x) { return String(x.task_id) === String(tid); });
        if (a) {
          await NEXORA.Repositories.assignments.update(a.id, {
            completed_hours: Math.round(t.estimated_hours * progress)
          });
        }
      }
      if (progress >= 1) { updates.status = 'done'; updates.approved = null; }
      else if (progress > 0) { updates.status = 'in_progress'; }
      
      if (Object.keys(updates).length > 0) {
        await NEXORA.Repositories.tasks.update(t.id, updates);
      }
    } catch(err) {
      console.error('Failed to update task progress', err);
    }
  }
};

window.renderProjectDetail = function() { NEXORA.Views.ProjectDetail.render(); };
window.renderItems = function() { NEXORA.Views.ProjectDetail.renderItems(); };
window.addItem = function() { NEXORA.Views.ProjectDetail.addItem(); };
window.renderGantt = function() { NEXORA.Views.ProjectDetail.renderGantt(); };
