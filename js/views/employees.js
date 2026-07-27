window.NEXORA = window.NEXORA || {};

NEXORA.Views = NEXORA.Views || {};

NEXORA.Views.Employees = {
  render: function() {
    var App = NEXORA.App;
    var DB = NEXORA.DB;
    var H = NEXORA.Helpers;
    var cu = App.cu;
    var el = document.getElementById('employeesContent');
    if (!el) return;

    var emps = DB.employees.filter(function(e) { return e.company_id === cu.company_id; });

    var h = '<div class="card"><div class="card-title"><i class="ti ti-users"></i> الموظفون (' + emps.length + ')</div>';

    if (!emps.length) {
      h += '<div class="empty-state"><i class="ti ti-users"></i>لا يوجد موظفون</div>';
    } else {
      h += '<div style="overflow-x:auto;"><table><thead><tr><th>المعرف</th><th>الاسم</th><th>البريد</th><th>الدور</th><th>المعدل/ساعة</th><th>المهام</th><th>الساعات</th><th>التكلفة</th>' + (cu.is_admin ? '<th>إجراءات</th>' : '') + '</tr></thead><tbody>';

      emps.forEach(function(e) {
        var eTasks = DB.tasks.filter(function(t) { return t.assigned_to === e.id; });
        var eAssigns = DB.assignments.filter(function(a) { return a.employee_id === e.id; });
        var hrs = eAssigns.reduce(function(s, a) { return s + (a.completed_hours || 0); }, 0);
        var cost = hrs * (e.hour_rate || 0);
        var roleCls = NEXORA.Config.ROLES[e.role] || 'badge-worker';
        var isAdmin = e.is_admin ? ' <span class="badge badge-admin">مسؤول</span>' : '';

        h += '<tr>' +
          '<td style="color:var(--TX3);font-size:var(--fs-sm);">#' + e.id + '</td>' +
          '<td><strong>' + H.esc(e.full_name) + isAdmin + '</strong></td>' +
          '<td>' + H.esc(e.email) + '</td>' +
          '<td><span class="badge ' + H.esc(roleCls) + '">' + H.esc(e.role) + '</span></td>' +
          '<td>' + H.fmt(e.hour_rate) + '</td>' +
          '<td>' + eTasks.length + '</td>' +
          '<td>' + H.fmt(hrs) + '</td>' +
          '<td>' + H.fmt(cost) + '</td>' +
          (cu.is_admin ? '<td><button class="btn btn-sm" onclick="showEditEmployee(' + e.id + ')"><i class="ti ti-pencil"></i></button></td>' : '') +
        '</tr>';
      });

      h += '</tbody></table></div>';
    }

    h += '</div>';
    el.innerHTML = h;
  }
};

window.renderEmployeesView = function() { NEXORA.Views.Employees.render(); };
