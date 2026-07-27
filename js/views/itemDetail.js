window.NEXORA = window.NEXORA || {};

NEXORA.Views = NEXORA.Views || {};

NEXORA.Views.ItemDetail = {
  render: function(iid) {
    var App = NEXORA.App;
    var DB = NEXORA.DB;
    var H = NEXORA.Helpers;
    var cu = App.cu;

    if (iid !== undefined) App.curItemId = iid;
    var curIid = App.curItemId;
    var i = H.itm(curIid);
    if (!i) return;

    var pr = H.itemProgress(curIid);
    var pf = H.itemProfit(curIid);
    var p = H.proj(i.project_id);

    var h = '<div class="back-link" onclick="openProject(' + i.project_id + ')"><i class="ti ti-arrow-right"></i> رجوع للمشروع</div>' +
      '<div class="card" style="border-right:5px solid var(--PS);">' +
        '<h2 style="color:var(--P);">' + H.esc(i.name) + '</h2>' +
        '<div style="color:var(--TX2);font-size:12px;">المشروع: ' + (p ? H.esc(p.name) : '') + ' | الميزانية: ' + H.fmt(i.budget) + ' | الوزن: ' + (i.weight || 10) + '</div>' +
      '</div>' +
      '<div class="grid-2"><div class="card"><div class="card-title"><i class="ti ti-checklist"></i> إضافة مهمة</div>' +
      '<div id="taskFormMsg" class="message-box"></div>' +
      '<div class="grid-2"><div><label>المهمة</label><input type="text" id="fTaskTitle" placeholder="صبة الأساسات"></div>' +
      '<div><label>الساعات المقدرة</label><input type="number" id="fTaskEst" placeholder="40" value="8"></div></div>' +
      '<button class="btn btn-primary" onclick="addTask()"><i class="ti ti-plus"></i> إضافة</button></div>' +
      '<div class="card"><div class="card-title"><i class="ti ti-coin"></i> تحليل التكاليف</div>' +
      '<div class="list-item"><div class="info"><strong>الميزانية</strong></div><span>' + H.fmt(i.budget) + ' ريال</span></div>' +
      '<div class="list-item"><div class="info"><strong>التكلفة الفعلية</strong></div><span style="color:var(--G);">' + H.fmt(pf.cost) + ' ريال</span></div>' +
      '<div style="background:' + (pf.status === 'profit' ? 'var(--GR)' : 'var(--RE)') + ';color:#fff;border-radius:6px;padding:10px;margin-top:8px;display:flex;justify-content:space-between;">' +
        '<strong>' + (pf.status === 'profit' ? 'ربح' : 'خسارة') + '</strong>' +
        '<span>' + H.fmt(Math.abs(pf.profit)) + ' ريال (' + pf.margin + '%)</span>' +
      '</div></div></div>' +
      '<div class="card"><div class="card-title"><i class="ti ti-columns-3"></i> لوحة المهام (Kanban)</div>' +
      '<div class="kanban" id="kanbanBoard"></div></div>' +
      '<div class="card"><div class="card-title"><i class="ti ti-users"></i> الموظفون في البند</div><div id="itemEmps"></div></div>';

    var el = document.getElementById('itemContent');
    if (el) el.innerHTML = h;

    NEXORA.Views.ItemDetail.renderKanban();
    NEXORA.Views.ItemDetail.renderItemEmps();
  },

  addTask: function() {
    var App = NEXORA.App;
    var DB = NEXORA.DB;
    var H = NEXORA.Helpers;

    var t = document.getElementById('fTaskTitle') ? document.getElementById('fTaskTitle').value.trim() : '';
    var e = parseFloat(document.getElementById('fTaskEst') ? document.getElementById('fTaskEst').value : 0) || 8;
    if (!t) return H.msg('taskFormMsg', 'أدخل اسم المهمة', 'error');

    DB.tasks.push({
      id: H.gf(DB.tasks), item_id: App.curItemId, title: t, description: '',
      estimated_hours: e, actual_hours: 0, status: 'todo', approved: null, assigned_to: null
    });
    DB.save();
    H.msg('taskFormMsg', '✅ تم', 'success');
    document.getElementById('fTaskTitle').value = '';
    NEXORA.Views.ItemDetail.renderKanban();
    if (typeof renderDashboard === 'function') renderDashboard();
  },

  renderKanban: function() {
    var App = NEXORA.App;
    var DB = NEXORA.DB;
    var H = NEXORA.Helpers;
    var curIid = App.curItemId;
    var ts = DB.tasks.filter(function(x) { return x.item_id === curIid; });
    var cols = { todo: [], in_progress: [], done: [] };
    ts.forEach(function(t) { cols[t.status || 'todo'].push(t); });
    var labels = { todo: '📋 معلقة', in_progress: '🔧 قيد العمل', done: '✅ منجزة' };
    var h = '';
    Object.keys(labels).forEach(function(k) {
      h += '<div class="kanban-col"><h4>' + labels[k] + ' <span class="badge">' + cols[k].length + '</span></h4>';
      if (!cols[k].length) {
        h += '<div style="color:var(--TX2);font-size:11px;text-align:center;padding:10px;">—</div>';
      } else {
        cols[k].forEach(function(t) {
          var pr = H.taskProgress(t.id);
          var cls = pr >= 75 ? 'green' : pr >= 40 ? 'orange' : 'purple';
          h += '<div class="kanban-card" onclick="openTask(' + t.id + ')">' +
            '<div class="k-title">' + H.esc(t.title) + '</div>' +
            '<div class="k-meta">' + (t.estimated_hours || 0) + 'س | ' + pr + '%</div>' +
            '<div class="progress-bar"><div class="progress-fill ' + cls + '" style="width:' + pr + '%"></div></div>' +
            '<div class="k-meta">' + (t.approved === true ? '✓ معتمدة' : t.approved === false ? '✗ مرفوضة' : t.status === 'done' ? '🕐 بانتظار' : '—') + '</div>' +
          '</div>';
        });
      }
      h += '</div>';
    });
    var board = document.getElementById('kanbanBoard');
    if (board) board.innerHTML = h;
  },

  renderItemEmps: function() {
    var App = NEXORA.App;
    var DB = NEXORA.DB;
    var H = NEXORA.Helpers;
    var curIid = App.curItemId;
    var ts = DB.tasks.filter(function(x) { return x.item_id === curIid; });
    var as = DB.assignments.filter(function(x) {
      return ts.some(function(t) { return t.id === x.task_id; });
    });
    var map = {};
    as.forEach(function(a) {
      if (!map[a.employee_id]) map[a.employee_id] = { tasks: 0, done: 0, hours: 0 };
      map[a.employee_id].hours += a.completed_hours || 0;
    });
    ts.forEach(function(t) {
      if (t.assigned_to) {
        if (!map[t.assigned_to]) map[t.assigned_to] = { tasks: 0, done: 0, hours: 0 };
        map[t.assigned_to].tasks++;
        if (t.status === 'done' && t.approved) map[t.assigned_to].done++;
      }
    });
    var c = document.getElementById('itemEmps');
    if (!c) return;
    var keys = Object.keys(map);
    if (!keys.length) {
      c.innerHTML = '<div style="color:var(--TX2);font-size:12px;">لم يسند أحد بعد</div>';
      return;
    }
    c.innerHTML = keys.map(function(k) {
      var u = H.emp(parseInt(k));
      var d = map[k];
      var pct = d.tasks ? Math.round(d.done / d.tasks * 100) : 0;
      var cls = pct >= 75 ? 'green' : pct >= 40 ? 'orange' : 'teal';
      return '<div class="list-item"><div class="info"><strong>' + (u ? H.esc(u.full_name) : '?') + '</strong><small>' + d.done + '/' + d.tasks + ' مهام</small><small>' + d.hours + 'س</small></div>' +
        '<div style="text-align:left;min-width:80px;"><span>' + pct + '%</span><div class="progress-bar"><div class="progress-fill ' + cls + '" style="width:' + pct + '%"></div></div></div></div>';
    }).join('');
  },

  openTask: function(tid) {
    var App = NEXORA.App;
    var DB = NEXORA.DB;
    var H = NEXORA.Helpers;
    var cu = App.cu;

    App.curTaskId = tid;
    var t = H.tsk(tid);
    if (!t) return;

    var i = H.itm(t.item_id);
    var u = H.emp(t.assigned_to);
    var canApprove = cu.is_admin || cu.role === 'مدير مشروع' || NEXORA.Auth.isAdmin();
    var as = DB.assignments.filter(function(x) { return x.task_id === tid; });
    var app = DB.approvals.filter(function(x) { return x.task_id === tid; });
    var prog = H.taskProgress(tid);
    var progCls = prog >= 75 ? 'green' : prog >= 40 ? 'orange' : 'purple';

    var h = '<div class="modal-title"><i class="ti ti-checklist"></i> ' + H.esc(t.title) + '</div>' +
      '<div style="margin-bottom:8px;"><strong>الحالة:</strong> <span class="badge ' +
        (t.status === 'done' ? (t.approved ? 'badge-approved' : 'badge-pending') : t.status === 'in_progress' ? 'badge-progress' : 'badge-todo') + '">' +
        (t.status === 'done' ? (t.approved ? 'معتمدة' : 'بانتظار') : t.status === 'in_progress' ? 'قيد العمل' : 'معلقة') + '</span></div>' +
      '<div style="margin-bottom:6px;"><strong>الساعات المقدرة:</strong> ' + (t.estimated_hours || 0) + 'س</div>' +
      '<div style="margin-bottom:6px;"><strong>الساعات الفعلية:</strong> ' + (t.actual_hours || 0) + 'س</div>' +
      '<div style="margin-bottom:6px;"><strong>التقدم:</strong> ' + prog + '%</div>' +
      '<div class="progress-bar" style="margin-bottom:10px;"><div class="progress-fill ' + progCls + '" style="width:' + prog + '%"></div></div>' +
      '<div style="margin-bottom:10px;"><strong>المسند إلى:</strong> <select id="modalAssign" style="width:auto;min-width:180px;margin:0 8px 0 0;display:inline-block;">' +
        '<option value="">— اختر —</option>' +
        DB.employees.filter(function(x) { return !x.is_admin; }).map(function(e) {
          return '<option value="' + e.id + '" ' + (t.assigned_to === e.id ? 'selected' : '') + '>' + H.esc(e.full_name) + ' (' + H.esc(e.role) + ')</option>';
        }).join('') +
      '</select>' +
      '<button class="btn btn-primary btn-sm" onclick="assignTask()"><i class="ti ti-user-check"></i> إسناد</button></div>' +
      '<hr style="border:none;border-top:1px solid var(--BD);margin:10px 0;">' +
      '<div><strong>تسجيل ساعات العمل:</strong></div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin:6px 0 10px;">' +
        '<input type="number" id="modalHours" placeholder="ساعات" style="width:100px;margin:0;" value="1">' +
        '<input type="date" id="modalDate" style="width:140px;margin:0;" value="' + new Date().toISOString().split('T')[0] + '">' +
        '<input type="text" id="modalNote" placeholder="ملاحظة" style="width:160px;margin:0;">' +
        '<button class="btn btn-primary btn-sm" onclick="logHours()"><i class="ti ti-clock"></i> تسجيل</button>' +
      '</div>' +
      '<hr style="border:none;border-top:1px solid var(--BD);margin:10px 0;">' +
      '<div><strong>سجل العمل اليومي:</strong></div>' +
      '<div id="modalLogs"></div>' +
      '<hr style="border:none;border-top:1px solid var(--BD);margin:10px 0;">';

    if (app.length) {
      h += '<div><strong>سجل الاعتماد:</strong></div>';
      app.forEach(function(a) {
        var who = H.emp(a.approved_by);
        h += '<div style="font-size:12px;margin:4px 0;">' + (a.status === 'approved' ? '✅' : '❌') + ' ' + (who ? H.esc(who.full_name) : '') + ' — ' + new Date(a.approved_at).toLocaleDateString('ar-SA') + (a.comment ? ' (' + H.esc(a.comment) + ')' : '') + '</div>';
      });
    }

    h += '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;">';
    if (t.status === 'todo') h += '<button class="btn btn-warning btn-sm" onclick="changeTaskStatus(\'in_progress\')"><i class="ti ti-player-play"></i> بدء العمل</button>';
    if (t.status === 'in_progress') h += '<button class="btn btn-success btn-sm" onclick="changeTaskStatus(\'done\')"><i class="ti ti-check"></i> إتمام</button>';
    if (t.status === 'done' && t.approved === null && canApprove) {
      h += '<button class="btn btn-success btn-sm" onclick="approveTask(true)"><i class="ti ti-check-circle"></i> اعتماد</button>';
      h += '<button class="btn btn-danger btn-sm" onclick="approveTask(false)"><i class="ti ti-x-circle"></i> رفض</button>';
    }
    h += '<button class="btn btn-sm" onclick="closeTaskModal()">إغلاق</button></div>';

    var modalBody = document.getElementById('taskModalBody');
    var modalOverlay = document.getElementById('taskModal');
    if (modalBody) modalBody.innerHTML = h;
    if (modalOverlay) modalOverlay.classList.add('active');

    NEXORA.Views.ItemDetail.renderLogs();
  },

  closeTaskModal: function() {
    var el = document.getElementById('taskModal');
    if (el) el.classList.remove('active');
    NEXORA.App.curTaskId = null;
  },

  assignTask: function() {
    var App = NEXORA.App;
    var DB = NEXORA.DB;
    var H = NEXORA.Helpers;
    var tid = App.curTaskId;
    var t = H.tsk(tid);
    if (!t) return;

    var eid = parseInt(document.getElementById('modalAssign').value);
    if (!eid) return;

    t.assigned_to = eid;
    var existing = DB.assignments.find(function(x) { return x.task_id === tid && x.employee_id === eid; });
    if (!existing) {
      DB.assignments.push({
        id: H.gf(DB.assignments), task_id: tid, employee_id: eid,
        assigned_hours: t.estimated_hours || 0, completed_hours: 0, progress: 0
      });
    }
    DB.save();
    NEXORA.Views.ItemDetail.openTask(tid);
    NEXORA.Views.ItemDetail.renderKanban();
  },

  logHours: function() {
    var App = NEXORA.App;
    var DB = NEXORA.DB;
    var H = NEXORA.Helpers;
    var tid = App.curTaskId;
    var t = H.tsk(tid);
    if (!t) return;

    var hrs = parseFloat(document.getElementById('modalHours').value);
    var dt = document.getElementById('modalDate').value;
    var note = document.getElementById('modalNote').value;
    if (!hrs || hrs <= 0) return;

    DB.dailylogs.push({
      id: H.gf(DB.dailylogs), task_id: tid, employee_id: t.assigned_to,
      date: dt, hours: hrs, description: note
    });
    t.actual_hours = (t.actual_hours || 0) + hrs;

    DB.assignments.filter(function(x) { return x.task_id === tid; }).forEach(function(a) {
      a.completed_hours = (a.completed_hours || 0) + hrs;
      a.progress = t.estimated_hours ? Math.min(100, Math.round(a.completed_hours / t.estimated_hours * 100)) : 100;
    });

    var u = H.emp(t.assigned_to);
    if (u) {
      DB.costs.push({
        id: H.gf(DB.costs), item_id: t.item_id, employee_id: t.assigned_to,
        hours: hrs, hour_rate: u.hour_rate, cost: hrs * u.hour_rate
      });
    }
    DB.save();

    NEXORA.Views.ItemDetail.openTask(tid);
    var itemView = document.getElementById('view-item');
    if (itemView && itemView.classList.contains('active')) {
      NEXORA.Views.ItemDetail.render(App.curItemId);
    } else {
      NEXORA.Views.ItemDetail.renderKanban();
      NEXORA.Views.ItemDetail.renderItemEmps();
    }
  },

  renderLogs: function() {
    var App = NEXORA.App;
    var DB = NEXORA.DB;
    var c = document.getElementById('modalLogs');
    if (!c) return;

    var ts = DB.dailylogs.filter(function(x) { return x.task_id === App.curTaskId; })
      .sort(function(a, b) { return new Date(b.date) - new Date(a.date); });

    if (!ts.length) {
      c.innerHTML = '<div style="color:var(--TX2);font-size:12px;">لا يوجد تسجيل بعد</div>';
      return;
    }
    c.innerHTML = ts.map(function(l) {
      return '<div style="font-size:12px;display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--BD);"><span>' +
        l.date + ' — ' + l.hours + 'س ' + (l.description ? '(' + NEXORA.Helpers.esc(l.description) + ')' : '') +
      '</span></div>';
    }).join('');
  },

  changeTaskStatus: function(s) {
    var App = NEXORA.App;
    var DB = NEXORA.DB;
    var H = NEXORA.Helpers;
    var t = H.tsk(App.curTaskId);
    if (!t) return;
    t.status = s;
    if (s === 'done') t.approved = null;
    DB.save();
    NEXORA.Views.ItemDetail.openTask(App.curTaskId);
    NEXORA.Views.ItemDetail.renderKanban();
    if (typeof renderDashboard === 'function') renderDashboard();
  },

  approveTask: function(st) {
    var App = NEXORA.App;
    var DB = NEXORA.DB;
    var H = NEXORA.Helpers;
    var cu = App.cu;
    var t = H.tsk(App.curTaskId);
    if (!t) return;
    t.approved = st;
    DB.approvals.push({
      id: H.gf(DB.approvals), task_id: App.curTaskId,
      status: st ? 'approved' : 'rejected',
      approved_by: cu.id, approved_at: new Date().toISOString(), comment: ''
    });
    DB.save();
    NEXORA.Views.ItemDetail.openTask(App.curTaskId);
    NEXORA.Views.ItemDetail.renderKanban();
    if (typeof renderDashboard === 'function') renderDashboard();
    if (typeof renderApprovals === 'function') renderApprovals();
  }
};

window.openItem = function(iid) { NEXORA.Views.ItemDetail.render(iid); };
window.renderItemDetail = function() { NEXORA.Views.ItemDetail.render(); };
window.addTask = function() { NEXORA.Views.ItemDetail.addTask(); };
window.openTask = function(tid) { NEXORA.Views.ItemDetail.openTask(tid); };
window.closeTaskModal = function() { NEXORA.Views.ItemDetail.closeTaskModal(); };
window.assignTask = function() { NEXORA.Views.ItemDetail.assignTask(); };
window.logHours = function() { NEXORA.Views.ItemDetail.logHours(); };
window.changeTaskStatus = function(s) { NEXORA.Views.ItemDetail.changeTaskStatus(s); };
window.approveTask = function(s) { NEXORA.Views.ItemDetail.approveTask(s); };
