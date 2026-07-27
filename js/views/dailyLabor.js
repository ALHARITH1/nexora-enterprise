window.NEXORA = window.NEXORA || {};
NEXORA.Views = NEXORA.Views || {};

NEXORA.Views.DailyLabor = {
  _filterStart: '',
  _filterEnd: '',
  _monthlyMonth: '',

  render: function() {
    var App = NEXORA.App;
    var DB = NEXORA.DB;
    var H = NEXORA.Helpers;
    var pid = App.curProjId;
    var p = H.proj(pid);
    var el = document.getElementById('dailyLaborContent');
    if (!el) return;

    var today = new Date().toISOString().split('T')[0];
    if (!NEXORA.Views.DailyLabor._filterStart) NEXORA.Views.DailyLabor._filterStart = today;
    var filterStart = NEXORA.Views.DailyLabor._filterStart;
    var filterEnd = NEXORA.Views.DailyLabor._filterEnd || today;
    var monthlyMonth = NEXORA.Views.DailyLabor._monthlyMonth || today.substring(0, 7);

    var projOpts = '<option value="">-- اختر مشروع --</option>';
    DB.projects.forEach(function(pr) {
      var sel = pr.id === pid ? ' selected' : '';
      projOpts += '<option value="' + pr.id + '"' + sel + '>' + H.esc(pr.name) + '</option>';
    });

    var empOpts = '<option value="">-- اختر العامل --</option>';
    DB.employees.forEach(function(e) {
      empOpts += '<option value="' + e.id + '">' + H.esc(e.full_name) + '</option>';
    });

    var h = '<div class="card" style="padding:12px 16px;">' +
      '<div class="flex-between">' +
        '<div style="display:flex;align-items:center;gap:10px;">' +
          '<label style="margin:0;white-space:nowrap;">المشروع:</label>' +
          '<select id="dlProjSelect" onchange="DLSwitchProject(this.value)" style="min-width:200px;">' + projOpts + '</select>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:10px;">' +
          '<label style="margin:0;white-space:nowrap;">من:</label>' +
          '<input type="date" id="dlFilterStart" value="' + filterStart + '" onchange="DLSetFilter()" style="width:auto;">' +
          '<label style="margin:0;white-space:nowrap;">إلى:</label>' +
          '<input type="date" id="dlFilterEnd" value="' + filterEnd + '" onchange="DLSetFilter()" style="width:auto;">' +
        '</div>' +
      '</div>' +
    '</div>';

    if (!pid || !p) {
      h += '<div class="card"><div class="empty-state"><i class="ti ti-users"></i>اختر مشروع لإدارة العمالة واليوميات</div></div>';
      el.innerHTML = h;
      return;
    }

    var wages = DB.daily_wages.filter(function(w) {
      return w.project_id === pid && w.date >= filterStart && w.date <= filterEnd;
    });
    var totalWorkers = wages.length;
    var totalWages = wages.reduce(function(s, w) { return s + (w.gross_amount || 0); }, 0);
    var totalPaid = wages.filter(function(w) { return w.paid; }).reduce(function(s, w) { return s + (w.net_amount || 0); }, 0);
    var totalPending = wages.filter(function(w) { return !w.paid; }).reduce(function(s, w) { return s + (w.net_amount || 0); }, 0);
    var totalDeductions = wages.reduce(function(s, w) { return s + (w.deductions || 0); }, 0);

    h += '<div class="stats">' +
      '<div class="stat-card blue"><div class="num">' + totalWorkers + '</div><div class="lbl">إجمالي السجلات</div></div>' +
      '<div class="stat-card gold"><div class="num">' + H.fmt(totalWages) + '</div><div class="lbl">إجمالي الأجر</div></div>' +
      '<div class="stat-card green"><div class="num">' + H.fmt(totalPaid) + '</div><div class="lbl">المدفوع</div></div>' +
      '<div class="stat-card red"><div class="num">' + H.fmt(totalPending) + '</div><div class="lbl">المعلق</div></div>' +
    '</div>';

    h += '<div class="card"><div class="card-title"><i class="ti ti-user-plus"></i> إضافة يومية جديدة</div>' +
      '<div id="dlMsg" class="message-box"></div>' +
      '<div class="grid-4">' +
        '<div><label>التاريخ</label><input type="date" id="fDlDate" value="' + today + '"></div>' +
        '<div><label>العامل</label><select id="fDlEmpId" onchange="DLAutoRate()">' + empOpts + '</select></div>' +
        '<div><label>عدد الأيام</label><input type="number" id="fDlDays" value="1" step="any" min="0.25"></div>' +
        '<div><label>أجر اليوم</label><input type="number" id="fDlRate" placeholder="200" step="any"></div>' +
      '</div>' +
      '<div class="grid-2" style="max-width:420px;">' +
        '<div><label>الخصومات</label><input type="number" id="fDlDeductions" value="0" step="any"></div>' +
        '<div><label>ملاحظات</label><input type="text" id="fDlNotes" placeholder="اختياري"></div>' +
      '</div>' +
      '<button class="btn btn-primary" onclick="addDailyWage()"><i class="ti ti-device-floppy"></i> إضافة</button>' +
    '</div>';

    h += '<div class="card"><div class="card-title"><i class="ti ti-list"></i> سجل اليوميات (' + wages.length + ' سجل)</div>' +
      '<div style="overflow-x:auto;"><table>' +
        '<tr><th>التاريخ</th><th>العامل</th><th>الأيام</th><th>الأجر اليومي</th><th>الإجمالي</th><th>الخصومات</th><th>صافي الدفع</th><th>مدفوع؟</th><th>إجراءات</th></tr>';

    if (!wages.length) {
      h += '<tr><td colspan="9" style="text-align:center;color:var(--TX2);padding:30px;">لا توجد سجلات في الفترة المحددة</td></tr>';
    } else {
      wages.sort(function(a, b) { return (b.date || '').localeCompare(a.date || ''); }).forEach(function(w) {
        var emp = H.emp(w.employee_id);
        var empName = emp ? emp.full_name : 'غير معروف';
        var paidBadge = w.paid ? '<span class="badge badge-done">مدفوع</span>' : '<span class="badge badge-pending">غير مدفوع</span>';
        h += '<tr>' +
          '<td>' + H.esc(w.date) + '</td>' +
          '<td style="font-weight:600;">' + H.esc(empName) + '</td>' +
          '<td>' + (w.days_worked || 0) + '</td>' +
          '<td>' + H.fmt(w.daily_rate) + '</td>' +
          '<td style="font-weight:700;">' + H.fmt(w.gross_amount) + '</td>' +
          '<td style="color:var(--RE);">' + H.fmt(w.deductions) + '</td>' +
          '<td style="font-weight:700;color:var(--GR);">' + H.fmt(w.net_amount) + '</td>' +
          '<td>' + paidBadge + '</td>' +
          '<td>' +
            '<button class="btn btn-sm ' + (w.paid ? 'btn-o' : 'btn-success') + '" onclick="togglePaid(' + w.id + ')" title="تغيير الحالة"><i class="ti ti-' + (w.paid ? 'x' : 'check') + '"></i></button> ' +
            '<button class="btn btn-sm btn-danger" onclick="deleteDailyWage(' + w.id + ')" title="حذف"><i class="ti ti-trash"></i></button>' +
          '</td>' +
        '</tr>';
      });

      h += '<tr style="background:var(--BG);font-weight:700;">' +
        '<td colspan="4">الإجمالي</td>' +
        '<td>' + H.fmt(totalWages) + '</td>' +
        '<td style="color:var(--RE);">' + H.fmt(totalDeductions) + '</td>' +
        '<td style="color:var(--GR);">' + H.fmt(totalPaid + totalPending) + '</td>' +
        '<td colspan="2"></td>' +
      '</tr>';
    }

    h += '</table></div></div>';

    h += '<div class="card"><div class="card-title"><i class="ti ti-calendar-stats"></i> ملخص شهري - ' + H.esc(monthlyMonth) + '</div>' +
      '<div style="margin-bottom:10px;"><label>الشهر:</label><input type="month" id="fDlMonth" value="' + monthlyMonth + '" onchange="DLSetMonth(this.value)" style="width:auto;"></div>' +
      '<div id="dlMonthlySummary"></div></div>';

    el.innerHTML = h;
    NEXORA.Views.DailyLabor._renderMonthlySummary(pid, monthlyMonth);
  },

  _renderMonthlySummary: function(pid, month) {
    var DB = NEXORA.DB;
    var H = NEXORA.Helpers;
    var c = document.getElementById('dlMonthlySummary');
    if (!c) return;

    var monthWages = DB.daily_wages.filter(function(w) {
      return w.project_id === pid && w.date && w.date.substring(0, 7) === month;
    });

    if (!monthWages.length) {
      c.innerHTML = '<div class="empty-state" style="padding:15px;"><i class="ti ti-calendar"></i>لا توجد بيانات لهذا الشهر</div>';
      return;
    }

    var empMap = {};
    monthWages.forEach(function(w) {
      if (!empMap[w.employee_id]) {
        empMap[w.employee_id] = { totalDays: 0, totalGross: 0, totalDeductions: 0, totalNet: 0, paid: 0, count: 0 };
      }
      var e = empMap[w.employee_id];
      e.totalDays += (w.days_worked || 0);
      e.totalGross += (w.gross_amount || 0);
      e.totalDeductions += (w.deductions || 0);
      e.totalNet += (w.net_amount || 0);
      e.count++;
      if (w.paid) e.paid += (w.net_amount || 0);
    });

    var h = '<table><tr><th>العامل</th><th>عدد السجلات</th><th>إجمالي الأيام</th><th>إجمالي الأجر</th><th>الخصومات</th><th>الصافي</th><th>المدفوع</th></tr>';
    var grandDays = 0, grandGross = 0, grandDed = 0, grandNet = 0, grandPaid = 0;
    Object.keys(empMap).forEach(function(eid) {
      var e = empMap[eid];
      var emp = H.emp(parseInt(eid));
      var name = emp ? emp.full_name : 'غير معروف';
      grandDays += e.totalDays;
      grandGross += e.totalGross;
      grandDed += e.totalDeductions;
      grandNet += e.totalNet;
      grandPaid += e.paid;
      h += '<tr><td style="font-weight:600;">' + H.esc(name) + '</td><td>' + e.count + '</td><td>' + e.totalDays + '</td><td>' + H.fmt(e.totalGross) + '</td><td style="color:var(--RE);">' + H.fmt(e.totalDeductions) + '</td><td style="font-weight:700;">' + H.fmt(e.totalNet) + '</td><td style="color:var(--GR);">' + H.fmt(e.paid) + '</td></tr>';
    });
    h += '<tr style="background:var(--BG);font-weight:700;"><td>الإجمالي</td><td></td><td>' + grandDays + '</td><td>' + H.fmt(grandGross) + '</td><td style="color:var(--RE);">' + H.fmt(grandDed) + '</td><td>' + H.fmt(grandNet) + '</td><td style="color:var(--GR);">' + H.fmt(grandPaid) + '</td></tr>';
    h += '</table>';
    c.innerHTML = h;
  }
};

window.renderDailyLabor = function() { NEXORA.Views.DailyLabor.render(); };

window.DLSwitchProject = function(pid) {
  NEXORA.App.curProjId = pid ? parseInt(pid) : null;
  NEXORA.Views.DailyLabor._filterStart = '';
  NEXORA.Views.DailyLabor._filterEnd = '';
  NEXORA.Views.DailyLabor.render();
};

window.DLSetFilter = function() {
  NEXORA.Views.DailyLabor._filterStart = document.getElementById('dlFilterStart').value;
  NEXORA.Views.DailyLabor._filterEnd = document.getElementById('dlFilterEnd').value;
  NEXORA.Views.DailyLabor.render();
};

window.DLSetMonth = function(val) {
  NEXORA.Views.DailyLabor._monthlyMonth = val;
  var pid = NEXORA.App.curProjId;
  NEXORA.Views.DailyLabor._renderMonthlySummary(pid, val);
};

window.DLAutoRate = function() {
  var DB = NEXORA.DB;
  var H = NEXORA.Helpers;
  var eid = parseInt(document.getElementById('fDlEmpId').value);
  if (!eid) return;
  var emp = H.emp(eid);
  if (emp && emp.hour_rate) {
    var daily = emp.hour_rate * 8;
    document.getElementById('fDlRate').value = daily;
  }
};

window.addDailyWage = function() {
  var App = NEXORA.App;
  var DB = NEXORA.DB;
  var H = NEXORA.Helpers;
  var pid = App.curProjId;
  if (!pid) return H.msg('dlMsg', 'اختر مشروع أولاً', 'error');

  var date = document.getElementById('fDlDate').value;
  var empId = parseInt(document.getElementById('fDlEmpId').value) || 0;
  var days = parseFloat(document.getElementById('fDlDays').value) || 1;
  var rate = parseFloat(document.getElementById('fDlRate').value) || 0;
  var deductions = parseFloat(document.getElementById('fDlDeductions').value) || 0;
  var notes = document.getElementById('fDlNotes').value.trim();

  if (!empId) return H.msg('dlMsg', 'اختر العامل', 'error');
  if (!date) return H.msg('dlMsg', 'اختر التاريخ', 'error');
  if (rate <= 0) return H.msg('dlMsg', 'أدخل أجر اليوم', 'error');

  var gross = days * rate;
  var net = gross - deductions;

  DB.daily_wages.push({
    id: H.gf(DB.daily_wages),
    project_id: pid,
    employee_id: empId,
    date: date,
    days_worked: days,
    daily_rate: rate,
    gross_amount: gross,
    deductions: deductions,
    net_amount: net,
    paid: false,
    notes: notes,
    created_by: App.cu ? App.cu.id : 0,
    created_at: new Date().toISOString()
  });
  DB.save();
  H.msg('dlMsg', 'تمت إضافة اليومية بنجاح', 'success');
  if (typeof showToast === 'function') showToast('تمت إضافة يومية العامل', 'success');

  NEXORA.Views.DailyLabor._filterStart = date;
  NEXORA.Views.DailyLabor._filterEnd = date;
  NEXORA.Views.DailyLabor.render();
};

window.togglePaid = function(id) {
  var DB = NEXORA.DB;
  var w = DB.daily_wages.find(function(x) { return x.id === id; });
  if (!w) return;
  w.paid = !w.paid;
  DB.save();
  if (typeof showToast === 'function') showToast(w.paid ? 'تم التحديد كمدفوع' : 'تم التحديد كغير مدفوع', 'info');
  NEXORA.Views.DailyLabor.render();
};

window.deleteDailyWage = function(id) {
  if (!confirm('هل أنت متأكد من حذف هذا السجل؟')) return;
  var DB = NEXORA.DB;
  DB.daily_wages = DB.daily_wages.filter(function(x) { return x.id !== id; });
  DB.save();
  if (typeof showToast === 'function') showToast('تم حذف السجل', 'success');
  NEXORA.Views.DailyLabor.render();
};
