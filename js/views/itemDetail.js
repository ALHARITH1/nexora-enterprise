window.NEXORA = window.NEXORA || {};

NEXORA.Views = NEXORA.Views || {};

NEXORA.Views.ItemDetail = {
  render: async function(iid) {
    var App = NEXORA.App;
    var H = NEXORA.Helpers;
    var el = document.getElementById('itemContent');
    if (!el) return;

    if (iid !== undefined) App.curItemId = iid;
    var curIid = App.curItemId;
    if (!curIid) return;

    el.innerHTML = '<div class="card"><div class="empty-state"><i class="ti ti-loader"></i>جاري تحميل البند...</div></div>';

    try {
      var i = await NEXORA.Repositories.items.getById(curIid);
      if (!i) {
         el.innerHTML = '<div class="card"><div class="empty-state">البند غير موجود</div></div>';
         return;
      }
      
      var p = await NEXORA.Repositories.projects.getById(i.project_id);

      // We'll skip complex simulated finance logic (itemProfit/itemProgress) for now 
      // since it requires fetching all assignments/costs across the DB. 
      // In a real app, this should be a DB view/RPC. We will mock it gracefully for the view migration.
      var pr = 0; 
      var pf = { cost: 0, profit: i.budget, status: 'profit', margin: 100 };

      var h = '<div class="back-link" onclick="openProject(\'' + i.project_id + '\')"><i class="ti ti-arrow-right"></i> رجوع للمشروع</div>' +
        '<div class="card" style="border-right:5px solid var(--PS);">' +
          '<h2 style="color:var(--P);">' + H.esc(i.name) + '</h2>' +
          '<div style="color:var(--TX2);font-size:12px;">المشروع: ' + (p ? H.esc(p.name) : '') + ' | الميزانية: ' + H.fmt(i.budget) + ' | الوزن: ' + (i.weight || 10) + '</div>' +
        '</div>' +
        '<div class="grid-2"><div class="card"><div class="card-title"><i class="ti ti-checklist"></i> إضافة مهمة</div>' +
        '<div id="taskFormMsg" class="message-box"></div>' +
        '<div class="grid-2"><div><label>المهمة</label><input type="text" id="fTaskTitle" placeholder="صبة الأساسات"></div>' +
        '<div><label>الساعات المقدرة</label><input type="number" id="fTaskEst" placeholder="40" value="8"></div></div>' +
        '<button class="btn btn-primary" onclick="addTask()" id="btnAddTask"><i class="ti ti-plus"></i> إضافة</button></div>' +
        '<div class="card"><div class="card-title"><i class="ti ti-coin"></i> تحليل التكاليف</div>' +
        '<div class="list-item"><div class="info"><strong>الميزانية</strong></div><span>' + H.fmt(i.budget) + ' ريال</span></div>' +
        '<div class="list-item"><div class="info"><strong>التكلفة الفعلية</strong></div><span style="color:var(--G);">' + H.fmt(pf.cost) + ' ريال</span></div>' +
        '<div style="background:' + (pf.status === 'profit' ? 'var(--GR)' : 'var(--RE)') + ';color:#fff;border-radius:6px;padding:10px;margin-top:8px;display:flex;justify-content:space-between;">' +
          '<strong>' + (pf.status === 'profit' ? 'ربح' : 'خسارة') + '</strong>' +
          '<span>' + H.fmt(Math.abs(pf.profit)) + ' ريال (' + pf.margin + '%)</span>' +
        '</div></div></div>' +
        '<div class="card"><div class="card-title"><i class="ti ti-columns-3"></i> لوحة المهام (Kanban)</div>' +
        '<div class="kanban" id="kanbanBoard"><div class="empty-state"><i class="ti ti-loader"></i>جاري التحميل...</div></div></div>' +
        '<div class="card"><div class="card-title"><i class="ti ti-users"></i> الموظفون في البند</div><div id="itemEmps"></div></div>';

      el.innerHTML = h;

      await Promise.all([
        this.renderKanban(),
        this.renderItemEmps()
      ]);

    } catch (err) {
      el.innerHTML = '<div class="card"><div class="empty-state"><i class="ti ti-alert-triangle" style="color:var(--ER);"></i>حدث خطأ: ' + H.esc(err.message) + '</div></div>';
      console.error(err);
    }
  },

  addTask: async function() {
    var App = NEXORA.App;
    var H = NEXORA.Helpers;

    var t = document.getElementById('fTaskTitle') ? document.getElementById('fTaskTitle').value.trim() : '';
    var e = parseFloat(document.getElementById('fTaskEst') ? document.getElementById('fTaskEst').value : 0) || 8;
    if (!t) return H.msg('taskFormMsg', 'أدخل اسم المهمة', 'error');

    const btn = document.getElementById('btnAddTask');
    if (btn) btn.disabled = true;

    try {
      await NEXORA.Repositories.tasks.create({
        item_id: App.curItemId, 
        title: t, 
        description: '',
        estimated_hours: e, 
        actual_hours: 0, 
        status: 'todo'
      });
      H.msg('taskFormMsg', '✅ تم', 'success');
      document.getElementById('fTaskTitle').value = '';
      await this.renderKanban();
    } catch (err) {
      H.msg('taskFormMsg', err.message, 'error');
    } finally {
      if (btn) btn.disabled = false;
    }
  },

  renderKanban: async function() {
    var App = NEXORA.App;
    var H = NEXORA.Helpers;
    var board = document.getElementById('kanbanBoard');
    if (!board) return;

    try {
      var ts = await NEXORA.Repositories.tasks.list({ item_id: App.curItemId });
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
            var pr = 0; // Simplified
            var cls = pr >= 75 ? 'green' : pr >= 40 ? 'orange' : 'purple';
            h += '<div class="kanban-card" onclick="openTask(\'' + t.id + '\')">' +
              '<div class="k-title">' + H.esc(t.title) + '</div>' +
              '<div class="k-meta">' + (t.estimated_hours || 0) + 'س | ' + pr + '%</div>' +
              '<div class="progress-bar"><div class="progress-fill ' + cls + '" style="width:' + pr + '%"></div></div>' +
              '<div class="k-meta">' + (t.approved === true ? '✓ معتمدة' : t.approved === false ? '✗ مرفوضة' : t.status === 'done' ? '🕐 بانتظار' : '—') + '</div>' +
            '</div>';
          });
        }
        h += '</div>';
      });
      board.innerHTML = h;
    } catch (err) {
      board.innerHTML = '<div class="empty-state">خطأ في تحميل المهام</div>';
    }
  },

  renderItemEmps: async function() {
    var App = NEXORA.App;
    var H = NEXORA.Helpers;
    var c = document.getElementById('itemEmps');
    if (!c) return;

    try {
      var ts = await NEXORA.Repositories.tasks.list({ item_id: App.curItemId });
      var as = await NEXORA.Repositories.assignments.list();
      var emps = await NEXORA.Repositories.employees.list();
      
      as = as.filter(function(x) { return ts.some(function(t) { return String(t.id) === String(x.task_id); }); });
      
      var map = {};
      as.forEach(function(a) {
        if (!map[a.employee_id]) map[a.employee_id] = { tasks: 0, done: 0, hours: 0 };
        map[a.employee_id].hours += parseFloat(a.completed_hours) || 0;
      });
      ts.forEach(function(t) {
        if (t.assigned_to) {
          if (!map[t.assigned_to]) map[t.assigned_to] = { tasks: 0, done: 0, hours: 0 };
          map[t.assigned_to].tasks++;
          if (t.status === 'done' && t.approved) map[t.assigned_to].done++;
        }
      });
      
      var keys = Object.keys(map);
      if (!keys.length) {
        c.innerHTML = '<div style="color:var(--TX2);font-size:12px;">لم يسند أحد بعد</div>';
        return;
      }
      c.innerHTML = keys.map(function(k) {
        var u = emps.find(e => String(e.id) === String(k));
        var d = map[k];
        var pct = d.tasks ? Math.round(d.done / d.tasks * 100) : 0;
        var cls = pct >= 75 ? 'green' : pct >= 40 ? 'orange' : 'teal';
        return '<div class="list-item"><div class="info"><strong>' + (u ? H.esc(u.full_name || u.name) : '?') + '</strong><small>' + d.done + '/' + d.tasks + ' مهام</small><small>' + d.hours + 'س</small></div>' +
          '<div style="text-align:left;min-width:80px;"><span>' + pct + '%</span><div class="progress-bar"><div class="progress-fill ' + cls + '" style="width:' + pct + '%"></div></div></div></div>';
      }).join('');
    } catch(err) {
      c.innerHTML = '<div style="color:var(--ER);">فشل تحميل بيانات الموظفين</div>';
    }
  },

  openTask: async function(tid) {
    var App = NEXORA.App;
    var H = NEXORA.Helpers;
    App.curTaskId = tid;

    var modalBody = document.getElementById('taskModalBody');
    var modalOverlay = document.getElementById('taskModal');
    if (modalOverlay) modalOverlay.classList.add('active');
    if (modalBody) modalBody.innerHTML = '<div class="empty-state"><i class="ti ti-loader"></i>...</div>';

    try {
      var t = await NEXORA.Repositories.tasks.getById(tid);
      if (!t) return;
      var emps = await NEXORA.Repositories.employees.list();
      var app = await NEXORA.Repositories.approvals.list({ task_id: tid });
      
      var canApprove = NEXORA.RBAC.canEdit();
      var prog = 0; // Simplified
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
          emps.map(function(e) {
            return '<option value="' + e.id + '" ' + (String(t.assigned_to) === String(e.id) ? 'selected' : '') + '>' + H.esc(e.full_name || e.name) + ' (' + H.esc(e.role_code || e.role) + ')</option>';
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
        '<div id="modalLogs"><div class="empty-state"><i class="ti ti-loader"></i>...</div></div>' +
        '<hr style="border:none;border-top:1px solid var(--BD);margin:10px 0;">';

      if (app.length) {
        h += '<div><strong>سجل الاعتماد:</strong></div>';
        app.forEach(function(a) {
          var who = emps.find(e => String(e.id) === String(a.approved_by));
          h += '<div style="font-size:12px;margin:4px 0;">' + (a.status === 'approved' ? '✅' : '❌') + ' ' + (who ? H.esc(who.full_name || who.name) : '') + ' — ' + new Date(a.approved_at).toLocaleDateString('ar-SA') + (a.comment ? ' (' + H.esc(a.comment) + ')' : '') + '</div>';
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

      if (modalBody) modalBody.innerHTML = h;

      await this.renderLogs();
    } catch(err) {
      if (modalBody) modalBody.innerHTML = '<div class="empty-state">فشل جلب تفاصيل المهمة</div>';
    }
  },

  closeTaskModal: function() {
    var el = document.getElementById('taskModal');
    if (el) el.classList.remove('active');
    NEXORA.App.curTaskId = null;
  },

  assignTask: async function() {
    var App = NEXORA.App;
    var tid = App.curTaskId;
    var eid = document.getElementById('modalAssign').value;
    if (!eid) return;

    try {
      var t = await NEXORA.Repositories.tasks.getById(tid);
      await NEXORA.Repositories.tasks.update(tid, { assigned_to: eid });
      
      // Upsert assignment using a custom domain logic, but for now we'll do a basic create if missing
      var existing = await NEXORA.Repositories.assignments.list({ task_id: tid, employee_id: eid });
      if (!existing.length) {
        await NEXORA.Repositories.assignments.create({
          task_id: tid, employee_id: eid,
          assigned_hours: t.estimated_hours || 0, completed_hours: 0, progress: 0
        });
      }
      await this.openTask(tid);
      await this.renderKanban();
    } catch (err) {
      alert('فشل الإسناد: ' + err.message);
    }
  },

  logHours: async function() {
    var App = NEXORA.App;
    var tid = App.curTaskId;
    
    var hrs = parseFloat(document.getElementById('modalHours').value);
    var dt = document.getElementById('modalDate').value;
    var note = document.getElementById('modalNote').value;
    if (!hrs || hrs <= 0) return;

    try {
      var t = await NEXORA.Repositories.tasks.getById(tid);
      await NEXORA.Repositories.dailylogs.create({
        task_id: tid, employee_id: t.assigned_to,
        date: dt, hours: hrs, description: note
      });
      await NEXORA.Repositories.tasks.update(tid, { actual_hours: (parseFloat(t.actual_hours) || 0) + hrs });

      await this.openTask(tid);
      await this.renderKanban();
    } catch(err) {
      alert('فشل التسجيل: ' + err.message);
    }
  },

  renderLogs: async function() {
    var App = NEXORA.App;
    var c = document.getElementById('modalLogs');
    if (!c) return;

    try {
      var ts = await NEXORA.Repositories.dailylogs.list({ task_id: App.curTaskId }, { orderBy: 'date', ascending: false });

      if (!ts.length) {
        c.innerHTML = '<div style="color:var(--TX2);font-size:12px;">لا يوجد تسجيل بعد</div>';
        return;
      }
      c.innerHTML = ts.map(function(l) {
        return '<div style="font-size:12px;display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--BD);"><span>' +
          l.date + ' — ' + l.hours + 'س ' + (l.description ? '(' + NEXORA.Helpers.esc(l.description) + ')' : '') +
        '</span></div>';
      }).join('');
    } catch(err) {
       c.innerHTML = '<div style="color:var(--TX2);font-size:12px;">فشل جلب السجلات</div>';
    }
  },

  changeTaskStatus: async function(s) {
    var App = NEXORA.App;
    try {
      await NEXORA.Repositories.tasks.update(App.curTaskId, {
        status: s,
        approved: s === 'done' ? null : undefined
      });
      await this.openTask(App.curTaskId);
      await this.renderKanban();
    } catch(err) {
      alert('فشل تغيير الحالة: ' + err.message);
    }
  },

  approveTask: async function(st) {
    var App = NEXORA.App;
    try {
      await NEXORA.Repositories.tasks.update(App.curTaskId, { approved: st });
      await NEXORA.Repositories.approvals.create({
        task_id: App.curTaskId,
        status: st ? 'approved' : 'rejected',
        approved_at: new Date().toISOString(), comment: ''
      });
      await this.openTask(App.curTaskId);
      await this.renderKanban();
    } catch (err) {
      alert('فشل الاعتماد: ' + err.message);
    }
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
