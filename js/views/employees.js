window.NEXORA = window.NEXORA || {};

NEXORA.Views = NEXORA.Views || {};

NEXORA.Views.Employees = {
  render: async function() {
    var App = NEXORA.App;
    var H = NEXORA.Helpers;
    var cu = App.cu || NEXORA.Auth.getUser();
    var el = document.getElementById('employeesContent');
    if (!el) return;

    el.innerHTML = '<div class="card"><div class="card-title"><i class="ti ti-users"></i> الموظفون</div><div class="empty-state"><i class="ti ti-loader"></i>جاري التحميل...</div></div>';

    try {
      const emps = await NEXORA.Repositories.employees.list();
      const tasks = await NEXORA.Repositories.tasks.list();
      const assignments = await NEXORA.Repositories.assignments.list();

      var h = '<div class="card"><div class="card-title"><i class="ti ti-users"></i> الموظفون (' + emps.length + ')</div>';

      if (!emps.length) {
        h += '<div class="empty-state"><i class="ti ti-users"></i>لا يوجد موظفون</div>';
      } else {
        h += '<div style="overflow-x:auto;"><table><thead><tr><th>المعرف</th><th>الاسم</th><th>البريد</th><th>الدور</th><th>المعدل/ساعة</th><th>المهام</th><th>الساعات</th><th>التكلفة</th>' + (NEXORA.RBAC.canEdit() ? '<th>إجراءات</th>' : '') + '</tr></thead><tbody>';

        emps.forEach(function(e) {
          var eTasks = tasks.filter(function(t) { return String(t.assigned_to) === String(e.id); });
          var eAssigns = assignments.filter(function(a) { return String(a.employee_id) === String(e.id); });
          var hrs = eAssigns.reduce(function(s, a) { return s + (parseFloat(a.completed_hours) || 0); }, 0);
          var cost = hrs * (parseFloat(e.hour_rate) || 0);
          var roleCls = NEXORA.Config.ROLES[e.role] || 'badge-worker';
          var isAdmin = e.is_admin ? ' <span class="badge badge-admin">مسؤول</span>' : '';

          h += '<tr>' +
            '<td style="color:var(--TX3);font-size:var(--fs-sm);">#' + e.id + '</td>' +
            '<td><strong>' + H.esc(e.full_name || e.name) + isAdmin + '</strong></td>' +
            '<td>' + H.esc(e.email) + '</td>' +
            '<td><span class="badge ' + H.esc(roleCls) + '">' + H.esc(e.role || e.role_code) + '</span></td>' +
            '<td>' + H.fmt(e.hour_rate) + '</td>' +
            '<td>' + eTasks.length + '</td>' +
            '<td>' + H.fmt(hrs) + '</td>' +
            '<td>' + H.fmt(cost) + '</td>' +
            (NEXORA.RBAC.canEdit() ? '<td><button class="btn btn-sm" onclick="showEditEmployee(\'' + e.id + '\')"><i class="ti ti-pencil"></i></button></td>' : '') +
          '</tr>';
        });

        h += '</tbody></table></div>';
      }

      h += '</div>';
      el.innerHTML = h;
    } catch (err) {
      el.innerHTML = '<div class="card"><div class="empty-state"><i class="ti ti-alert-triangle" style="color:var(--ER);"></i>حدث خطأ أثناء جلب البيانات: ' + H.esc(err.message) + '</div></div>';
      console.error(err);
    }
  }
};

window.renderEmployeesView = function() { NEXORA.Views.Employees.render(); };
