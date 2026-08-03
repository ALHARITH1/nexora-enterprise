window.NEXORA = window.NEXORA || {};

NEXORA.Views = NEXORA.Views || {};

NEXORA.Views.Approvals = {
  render: async function() {
    var App = NEXORA.App;
    var H = NEXORA.Helpers;
    var cu = App.cu;
    var el = document.getElementById('approvalsContent');
    if (!el) return;

    el.innerHTML = '<div class="card"><div class="empty-state"><i class="ti ti-loader"></i>جاري التحميل...</div></div>';

    try {
      var allTasks = await NEXORA.Repositories.tasks.list();
      var allItems = await NEXORA.Repositories.items.list();
      var allEmployees = await NEXORA.Repositories.employees.list();
      var allApprovals = await NEXORA.Repositories.approvals.list();

      var pend = allTasks.filter(function(x) { return x.status === 'done' && x.approved === null; });
      var h = '<div class="card"><div class="card-title"><i class="ti ti-check-double"></i> المهام بانتظار الاعتماد <span class="badge badge-pending">' + pend.length + '</span></div>';

      if (!pend.length) {
        h += '<div class="empty-state"><i class="ti ti-check-circle"></i>لا توجد مهام بانتظار الاعتماد</div>';
      } else {
        h += pend.map(function(t) {
          var i = allItems.find(it => String(it.id) === String(t.item_id));
          var u = allEmployees.find(e => String(e.id) === String(t.assigned_to));
          return '<div class="list-item"><div class="info"><strong>' + H.esc(t.title) + '</strong><small>' + (i ? H.esc(i.name) : '') + '</small><small>' + (u ? H.esc(u.full_name) : '') + '</small></div>' +
            '<div style="display:flex;gap:6px;">' +
              '<button class="btn btn-success btn-sm" onclick="quickApprove(' + t.id + ',true)"><i class="ti ti-check"></i></button>' +
              '<button class="btn btn-danger btn-sm" onclick="quickApprove(' + t.id + ',false)"><i class="ti ti-x"></i></button>' +
              '<button class="btn btn-sm" onclick="openTask(' + t.id + ')"><i class="ti ti-eye"></i></button>' +
            '</div></div>';
        }).join('');
      }
      h += '</div>';

      h += '<div class="card"><div class="card-title"><i class="ti ti-history"></i> آخر المعتمدات</div>';
      var recent = allApprovals.slice(-10).reverse();
      if (!recent.length) {
        h += '<div class="empty-state"><i class="ti ti-history"></i>لا يوجد</div>';
      } else {
        h += recent.map(function(a) {
          var t = allTasks.find(x => String(x.id) === String(a.task_id));
          var who = allEmployees.find(e => String(e.id) === String(a.approved_by));
          return '<div class="list-item"><div class="info"><strong>' + (t ? H.esc(t.title) : '—') + '</strong><small>' + (who ? H.esc(who.full_name) : '') + '</small><small>' + new Date(a.approved_at).toLocaleDateString('ar-SA') + '</small></div><span class="badge ' + (a.status === 'approved' ? 'badge-approved' : 'badge-rejected') + '">' + (a.status === 'approved' ? 'معتمدة' : 'مرفوضة') + '</span></div>';
        }).join('');
      }
      h += '</div>';
      el.innerHTML = h;

      var countEl = document.getElementById('approvalsCount');
      if (countEl) countEl.textContent = pend.length;
    } catch(err) {
      el.innerHTML = '<div class="card"><div class="empty-state"><i class="ti ti-alert-triangle" style="color:var(--ER);"></i>حدث خطأ: ' + H.esc(err.message) + '</div></div>';
    }
  },

  quickApprove: async function(tid, st) {
    var App = NEXORA.App;
    var H = NEXORA.Helpers;
    var cu = App.cu;

    try {
      var tasks = await NEXORA.Repositories.tasks.list();
      var t = tasks.find(x => String(x.id) === String(tid));
      if (!t) return;

      await NEXORA.Repositories.tasks.update(t.id, { approved: st });
      
      await NEXORA.Repositories.approvals.create({
        task_id: tid,
        status: st ? 'approved' : 'rejected',
        approved_by: cu ? cu.id : 0,
        approved_at: new Date().toISOString(),
        comment: ''
      });

      await NEXORA.Views.Approvals.render();
      if (typeof renderDashboard === 'function') renderDashboard();
    } catch(err) {
      alert('فشل الاعتماد: ' + err.message);
    }
  }
};

window.renderApprovals = function() { NEXORA.Views.Approvals.render(); };
window.quickApprove = function(t, s) { NEXORA.Views.Approvals.quickApprove(t, s); };
