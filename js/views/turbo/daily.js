window.NEXORA = window.NEXORA || {};
NEXORA.Views = NEXORA.Views || {};

NEXORA.Views.TurboDaily = {
  render: function() {
    var DB = NEXORA.DB;
    var H = NEXORA.Helpers;
    var el = document.getElementById('turboDailyContent');
    if (!el) return;

    var todayStr = window.NEXORA.DateUtils ? window.NEXORA.DateUtils.getLocalDateString() : new Date().toISOString().split('T')[0];
    var emps = (DB.employees || []).filter(function(e) { return e.active !== false && e.status !== 'inactive'; });
    var todayWages = (DB.daily_wages || []).filter(function(w) { return (w.work_date || w.date) === todayStr; });
    var totalWage = todayWages.reduce(function(s, w) { return s + (w.total_wage || w.amount || w.daily_wage || 0); }, 0);

    var h = '<div class="turbo-section-header">' +
      '<h2><i class="ti ti-user-plus"></i> يوميات اليوم</h2>' +
      '<span class="badge">' + todayStr + '</span>' +
    '</div>';

    h += '<div class="turbo-quick-form card">' +
      '<div class="card-title"><i class="ti ti-plus"></i> تسجيل حضور سريع</div>' +
      '<div id="turboDailyMsg" class="message-box"></div>' +
      '<div class="turbo-form-row">' +
        '<select id="turboEmpSelect" class="turbo-input"><option value="">— اختر عامل —</option>' +
        emps.map(function(e) { return '<option value="' + e.id + '">' + H.esc(e.full_name || e.name) + ' (' + H.esc(e.role || e.role_code || 'عامل') + ')</option>'; }).join('') +
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
        var emp = H.emp ? H.emp(w.employee_id) : (DB.employees || []).find(e => String(e.id) === String(w.employee_id));
        var empName = emp ? (emp.full_name || emp.name) : (w.worker_name || '?');
        return '<div class="list-item"><div class="info"><strong>' + H.esc(empName) + '</strong><small>' + (w.days || 1) + ' أيام × ' + H.fmt(w.daily_rate || w.daily_wage || 0) + '</small></div>' +
          '<span style="font-weight:700;">' + H.fmt(w.total_wage || w.amount || (w.days || 1) * (w.daily_wage || 0)) + ' ر.س</span></div>';
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

  addLog: async function() {
    var DB = NEXORA.DB;
    var H = NEXORA.Helpers;
    var eid = document.getElementById('turboEmpSelect').value;
    var rate = parseFloat(document.getElementById('turboEmpRate').value) || 150;
    var days = parseFloat(document.getElementById('turboEmpDays').value) || 1;
    if (!eid) return H.msg('turboDailyMsg', 'اختر عامل', 'error');

    var emp = (DB.employees || []).find(e => String(e.id) === String(eid));
    var workerName = emp ? (emp.full_name || emp.name) : 'عامل';
    var pid = (NEXORA.App && NEXORA.App.curProjId) ? NEXORA.App.curProjId : null;
    var todayStr = window.NEXORA.DateUtils ? window.NEXORA.DateUtils.getLocalDateString() : new Date().toISOString().split('T')[0];

    const wageRecord = {
      employee_id: eid,
      worker_name: workerName,
      project_id: pid,
      work_date: todayStr,
      date: todayStr,
      daily_rate: rate,
      daily_wage: rate,
      days: days,
      total_wage: rate * days,
      amount: rate * days,
      status: 'pending'
    };

    if (NEXORA.Repositories && NEXORA.Repositories.dailyWages) {
      await NEXORA.Repositories.dailyWages.create(wageRecord);
    } else {
      if (!DB.daily_wages) DB.daily_wages = [];
      wageRecord.id = H.gf(DB.daily_wages);
      DB.daily_wages.push(wageRecord);
      if (DB.save) DB.save();
    }

    H.msg('turboDailyMsg', 'تم تسجيل ' + workerName, 'success');
    NEXORA.Views.TurboDaily.render();
  }
};

window.renderTurboDaily = function() { NEXORA.Views.TurboDaily.render(); };
