window.NEXORA = window.NEXORA || {};
NEXORA.Views = NEXORA.Views || {};

NEXORA.Views.TurboDaily = {
  render: function() {
    var App = NEXORA.App;
    var DB = NEXORA.DB;
    var H = NEXORA.Helpers;
    var el = document.getElementById('turboDailyContent');
    if (!el) return;

    var today = new Date().toISOString().split('T')[0];
    var emps = DB.employees.filter(function(e) { return e.active; });
    var todayLogs = (DB.dailylogs || []).filter(function(l) { return l.date === today; });
    var todayWages = (DB.daily_wages || []).filter(function(w) { return w.date === today; });
    var totalWage = todayWages.reduce(function(s, w) { return s + (w.amount || w.daily_wage || 0); }, 0);

    var h = '<div class="turbo-section-header">' +
      '<h2><i class="ti ti-user-plus"></i> يوميات اليوم</h2>' +
      '<span class="badge">' + today + '</span>' +
    '</div>';

    h += '<div class="turbo-quick-form card">' +
      '<div class="card-title"><i class="ti ti-plus"></i> تسجيل حضور سريع</div>' +
      '<div id="turboDailyMsg" class="message-box"></div>' +
      '<div class="turbo-form-row">' +
        '<select id="turboEmpSelect" class="turbo-input"><option value="">— اختر عامل —</option>' +
        emps.map(function(e) { return '<option value="' + e.id + '">' + H.esc(e.full_name) + ' (' + H.esc(e.role) + ')</option>'; }).join('') +
        '</select>' +
        '<input type="number" id="turboEmpRate" class="turbo-input" placeholder="الأجر/يوم" value="150">' +
        '<input type="number" id="turboEmpDays" class="turbo-input" placeholder="أيام" value="1" min="0.5" step="0.5">' +
        '<button class="btn btn-primary" onclick="NEXORA.Views.TurboDaily.addLog()"><i class="ti ti-check"></i> تسجيل</button>' +
      '</div>' +
    '</div>';

    h += '<div class="card"><div class="card-title"><i class="ti ti-list"></i> سجل اليوم (' + todayWages.length + ')</div>';
    if (!todayWages.length) {
      h += '<div class="empty-state"><i class="ti ti-users"></i>لا يوجد تسجيل بعد</div>';
    } else {
      h += todayWages.map(function(w) {
        var emp = H.emp(w.employee_id);
        return '<div class="list-item"><div class="info"><strong>' + (emp ? H.esc(emp.full_name) : '?') + '</strong><small>' + (w.days || 1) + ' أيام × ' + H.fmt(w.daily_wage) + '</small></div>' +
          '<span style="font-weight:700;">' + H.fmt(w.amount || (w.days || 1) * (w.daily_wage || 0)) + ' ر.س</span></div>';
      }).join('');
      h += '<div style="border-top:2px solid var(--BD);padding-top:8px;margin-top:8px;display:flex;justify-content:space-between;"><strong>الإجمالي</strong><strong style="color:var(--P);">' + H.fmt(totalWage) + ' ر.س</strong></div>';
    }
    h += '</div>';

    h += '<div class="turbo-actions-bar">' +
      '<button class="btn btn-o" onclick="NEXORA.Router.navigate(\'turbo\')"><i class="ti ti-arrow-right"></i> رجوع</button>' +
      '<button class="btn btn-primary" onclick="NEXORA.Router.navigate(\'reports\')"><i class="ti ti-file-export"></i> تصدير</button>' +
    '</div>';

    el.innerHTML = h;
  },

  addLog: function() {
    var DB = NEXORA.DB;
    var H = NEXORA.Helpers;
    var eid = parseInt(document.getElementById('turboEmpSelect').value);
    var rate = parseFloat(document.getElementById('turboEmpRate').value) || 150;
    var days = parseFloat(document.getElementById('turboEmpDays').value) || 1;
    if (!eid) return H.msg('turboDailyMsg', 'اختر عامل', 'error');

    var emp = H.emp(eid);
    if (!emp) return;

    DB.daily_wages.push({
      id: H.gf(DB.daily_wages),
      employee_id: eid,
      project_id: App.curProjId || 0,
      date: new Date().toISOString().split('T')[0],
      daily_wage: rate,
      days: days,
      amount: rate * days,
      paid: false
    });
    DB.save();
    H.msg('turboDailyMsg', 'تم تسجيل ' + emp.full_name, 'success');
    NEXORA.Views.TurboDaily.render();
  }
};

window.renderTurboDaily = function() { NEXORA.Views.TurboDaily.render(); };
