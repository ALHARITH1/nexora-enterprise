window.NEXORA = window.NEXORA || {};

NEXORA.Views = NEXORA.Views || {};

NEXORA.Views.Approvals = {
  render: function() {
    var App = NEXORA.App;
    var DB = NEXORA.DB;
    var H = NEXORA.Helpers;
    var cu = App.cu;
    var el = document.getElementById('approvalsContent');
    if (!el) return;

    var pend = DB.tasks.filter(function(x) { return x.status === 'done' && x.approved === null; });
    var h = '<div class="card"><div class="card-title"><i class="ti ti-check-double"></i> المهام بانتظار الاعتماد <span class="badge badge-pending">' + pend.length + '</span></div>';

    if (!pend.length) {
      h += '<div class="empty-state"><i class="ti ti-check-circle"></i>لا توجد مهام بانتظار الاعتماد</div>';
    } else {
      h += pend.map(function(t) {
        var i = H.itm(t.item_id);
        var u = H.emp(t.assigned_to);
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
    var recent = DB.approvals.slice(-10).reverse();
    if (!recent.length) {
      h += '<div class="empty-state"><i class="ti ti-history"></i>لا يوجد</div>';
    } else {
      h += recent.map(function(a) {
        var t = H.tsk(a.task_id);
        var who = H.emp(a.approved_by);
        return '<div class="list-item"><div class="info"><strong>' + (t ? H.esc(t.title) : '—') + '</strong><small>' + (who ? H.esc(who.full_name) : '') + '</small><small>' + new Date(a.approved_at).toLocaleDateString('ar-SA') + '</small></div><span class="badge ' + (a.status === 'approved' ? 'badge-approved' : 'badge-rejected') + '">' + (a.status === 'approved' ? 'معتمدة' : 'مرفوضة') + '</span></div>';
      }).join('');
    }
    h += '</div>';
    el.innerHTML = h;

    var countEl = document.getElementById('approvalsCount');
    if (countEl) countEl.textContent = pend.length;
  },

  quickApprove: function(tid, st) {
    var App = NEXORA.App;
    var DB = NEXORA.DB;
    var H = NEXORA.Helpers;
    var cu = App.cu;
    var t = H.tsk(tid);
    if (!t) return;

    t.approved = st;
    DB.approvals.push({
      id: H.gf(DB.approvals), task_id: tid,
      status: st ? 'approved' : 'rejected',
      approved_by: cu.id, approved_at: new Date().toISOString(), comment: ''
    });
    DB.save();
    NEXORA.Views.Approvals.render();
    if (typeof renderDashboard === 'function') renderDashboard();
  }
};

window.renderApprovals = function() { NEXORA.Views.Approvals.render(); };
window.quickApprove = function(t, s) { NEXORA.Views.Approvals.quickApprove(t, s); };
