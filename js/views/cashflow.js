window.NEXORA = window.NEXORA || {};
NEXORA.Views = NEXORA.Views || {};

NEXORA.Views.Cashflow = {
  _activeTab: 'cashflow',

  render: function() {
    var App = NEXORA.App;
    var DB = NEXORA.DB;
    var H = NEXORA.Helpers;
    var pid = App.curProjId;
    var p = H.proj(pid);
    var el = document.getElementById('cashflowContent');
    if (!el) return;

    var activeTab = NEXORA.Views.Cashflow._activeTab;

    var projOpts = '<option value="">-- اختر مشروع --</option>';
    DB.projects.forEach(function(pr) {
      var sel = pr.id === pid ? ' selected' : '';
      projOpts += '<option value="' + pr.id + '"' + sel + '>' + H.esc(pr.name) + '</option>';
    });

    var h = '<div class="card" style="padding:12px 16px;">' +
      '<div class="flex-between">' +
        '<div style="display:flex;align-items:center;gap:10px;">' +
          '<label style="margin:0;white-space:nowrap;">المشروع:</label>' +
          '<select id="cfProjSelect" onchange="CFSwitchProject(this.value)" style="min-width:200px;">' + projOpts + '</select>' +
        '</div>' +
      '</div>' +
    '</div>';

    h += '<div class="card" style="padding:8px 16px;">' +
      '<div class="tab-bar" id="cfTabs">' +
        '<button class="tab-btn' + (activeTab === 'cashflow' ? ' active' : '') + '" onclick="CFSwitchTab(\'cashflow\',this)"><i class="ti ti-cash"></i> السيولة النقدية</button>' +
        '<button class="tab-btn' + (activeTab === 'certificates' ? ' active' : '') + '" onclick="CFSwitchTab(\'certificates\',this)"><i class="ti ti-file-invoice"></i> المستخلصات</button>' +
        '<button class="tab-btn' + (activeTab === 'purchases' ? ' active' : '') + '" onclick="CFSwitchTab(\'purchases\',this)"><i class="ti ti-shopping-cart"></i> المشتريات البسيطة</button>' +
      '</div>' +
    '</div>';

    h += '<div id="cfTabContent"></div>';
    el.innerHTML = h;

    if (activeTab === 'cashflow') NEXORA.Views.Cashflow._renderCashflow(pid);
    else if (activeTab === 'certificates') NEXORA.Views.Cashflow._renderCertificates(pid);
    else if (activeTab === 'purchases') NEXORA.Views.Cashflow._renderPurchases(pid);
  },

  _renderCashflow: function(pid) {
    var App = NEXORA.App;
    var DB = NEXORA.DB;
    var H = NEXORA.Helpers;
    var c = document.getElementById('cfTabContent');
    if (!c) return;

    var entries = DB.cash_flow.filter(function(e) { return e.project_id === pid; });
    var inflows = entries.filter(function(e) { return e.type === 'inflow'; });
    var outflows = entries.filter(function(e) { return e.type === 'outflow'; });
    var totalIn = inflows.reduce(function(s, e) { return s + (e.amount || 0); }, 0);
    var totalOut = outflows.reduce(function(s, e) { return s + (e.amount || 0); }, 0);
    var balance = totalIn - totalOut;
    var balColor = balance >= 0 ? 'var(--GR)' : 'var(--RE)';

    var inflowCats = {'payment': 'تحصيل', 'advance': 'دفعة مقدمة', 'other': 'أخرى'};
    var outflowCats = {'materials': 'مواد', 'labor': 'عمالة', 'equipment': 'معدات', 'subcontract': 'مقاول من الباطن', 'other': 'أخرى'};

    var h = '<div class="stats">' +
      '<div class="stat-card green"><div class="num">' + H.fmt(totalIn) + '</div><div class="lbl">إجمالي الدخل</div></div>' +
      '<div class="stat-card red"><div class="num">' + H.fmt(totalOut) + '</div><div class="lbl">إجمالي المصروف</div></div>' +
      '<div class="stat-card" style="border-right:4px solid ' + balColor + ';"><div class="num" style="color:' + balColor + ';">' + H.fmt(Math.abs(balance)) + '</div><div class="lbl">' + (balance >= 0 ? 'رصيد إيجابي' : 'رصيد سالب') + '</div></div>' +
    '</div>';

    h += '<div class="card"><div class="card-title"><i class="ti ti-plus-circle"></i> إضافة حركة</div>' +
      '<div id="cfMsg" class="message-box"></div>' +
      '<div class="grid-4">' +
        '<div><label>النوع</label><select id="fCfType" onchange="CFCatUpdate()"><option value="inflow">دخل (وارد)</option><option value="outflow">مصروف (صادر)</option></select></div>' +
        '<div><label>الفئة</label><select id="fCfCategory"><option value="payment">تحصيل</option><option value="advance">دفعة مقدمة</option><option value="other">أخرى</option></select></div>' +
        '<div><label>المبلغ</label><input type="number" id="fCfAmount" placeholder="50000" step="any"></div>' +
        '<div><label>التاريخ</label><input type="date" id="fCfDate" value="' + new Date().toISOString().split('T')[0] + '"></div>' +
      '</div>' +
      '<div class="grid-2" style="max-width:420px;">' +
        '<div><label>الوصف</label><input type="text" id="fCfDesc" placeholder="وصف الحركة"></div>' +
        '<div><label>المرجع</label><input type="text" id="fCfRef" placeholder="رقم الإيصال"></div>' +
      '</div>' +
      '<button class="btn btn-primary" onclick="addCashFlowEntry()"><i class="ti ti-device-floppy"></i> إضافة</button>' +
    '</div>';

    h += '<div class="card"><div class="card-title"><i class="ti ti-list"></i> حركات السيولة (' + entries.length + ')</div>' +
      '<div style="overflow-x:auto;"><table>' +
        '<tr><th>التاريخ</th><th>النوع</th><th>الفئة</th><th>الوصف</th><th>المبلغ</th><th>المرجع</th><th>الرصيد</th><th>إجراءات</th></tr>';

    if (!entries.length) {
      h += '<tr><td colspan="8" style="text-align:center;color:var(--TX2);padding:30px;">لا توجد حركات بعد</td></tr>';
    } else {
      var sorted = entries.slice().sort(function(a, b) { return (a.date || '').localeCompare(b.date || ''); });
      var runningBal = 0;
      sorted.forEach(function(e) {
        if (e.type === 'inflow') runningBal += (e.amount || 0);
        else runningBal -= (e.amount || 0);
        var typeBadge = e.type === 'inflow' ? '<span class="badge badge-done">وارد</span>' : '<span class="badge badge-rejected">صادر</span>';
        var catLabel = e.type === 'inflow' ? (inflowCats[e.category] || e.category) : (outflowCats[e.category] || e.category);
        var amtColor = e.type === 'inflow' ? 'var(--GR)' : 'var(--RE)';
        var amtSign = e.type === 'inflow' ? '+' : '-';
        h += '<tr>' +
          '<td>' + H.esc(e.date) + '</td>' +
          '<td>' + typeBadge + '</td>' +
          '<td>' + H.esc(catLabel) + '</td>' +
          '<td>' + H.esc(e.description) + '</td>' +
          '<td style="font-weight:700;color:' + amtColor + ';">' + amtSign + H.fmt(e.amount) + '</td>' +
          '<td>' + H.esc(e.reference || '') + '</td>' +
          '<td style="font-weight:600;color:' + (runningBal >= 0 ? 'var(--GR)' : 'var(--RE)') + ';">' + H.fmt(runningBal) + '</td>' +
          '<td><button class="btn btn-sm btn-danger" onclick="deleteCashFlow(' + e.id + ')" title="حذف"><i class="ti ti-trash"></i></button></td>' +
        '</tr>';
      });
    }

    h += '</table></div></div>';

    h += '<div class="card"><div class="card-title"><i class="ti ti-chart-bar"></i> مقارنة شهرية</div>' +
      '<div id="cfBarChart" style="display:flex;align-items:flex-end;gap:8px;height:180px;padding:10px 0;"></div>' +
      '<div style="display:flex;gap:16px;justify-content:center;margin-top:8px;font-size:12px;">' +
        '<span><span style="display:inline-block;width:12px;height:12px;background:var(--GR);border-radius:3px;vertical-align:middle;margin-left:4px;"></span>دخل</span>' +
        '<span><span style="display:inline-block;width:12px;height:12px;background:var(--RE);border-radius:3px;vertical-align:middle;margin-left:4px;"></span>مصروف</span>' +
      '</div>' +
    '</div>';

    c.innerHTML = h;
    NEXORA.Views.Cashflow._renderBarChart(entries);
  },

  _renderBarChart: function(entries) {
    var el = document.getElementById('cfBarChart');
    if (!el) return;

    var monthData = {};
    entries.forEach(function(e) {
      if (!e.date) return;
      var m = e.date.substring(0, 7);
      if (!monthData[m]) monthData[m] = { inflow: 0, outflow: 0 };
      if (e.type === 'inflow') monthData[m].inflow += (e.amount || 0);
      else monthData[m].outflow += (e.amount || 0);
    });

    var months = Object.keys(monthData).sort();
    if (!months.length) {
      el.innerHTML = '<div style="text-align:center;width:100%;color:var(--TX2);padding:20px;">لا توجد بيانات كافية للرسم</div>';
      return;
    }

    var maxVal = 1;
    months.forEach(function(m) {
      if (monthData[m].inflow > maxVal) maxVal = monthData[m].inflow;
      if (monthData[m].outflow > maxVal) maxVal = monthData[m].outflow;
    });

    var html = '';
    months.forEach(function(m) {
      var inH = Math.round(monthData[m].inflow / maxVal * 150);
      var outH = Math.round(monthData[m].outflow / maxVal * 150);
      html += '<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;">' +
        '<div style="display:flex;gap:4px;align-items:flex-end;height:160px;">' +
          '<div style="width:18px;height:' + inH + 'px;background:var(--GR);border-radius:4px 4px 0 0;" title="دخل: ' + (monthData[m].inflow).toLocaleString('en-US') + '"></div>' +
          '<div style="width:18px;height:' + outH + 'px;background:var(--RE);border-radius:4px 4px 0 0;" title="مصروف: ' + (monthData[m].outflow).toLocaleString('en-US') + '"></div>' +
        '</div>' +
        '<div style="font-size:11px;color:var(--TX2);font-weight:600;">' + m.substring(5) + '/' + m.substring(2, 4) + '</div>' +
      '</div>';
    });
    el.innerHTML = html;
  },

  _renderCertificates: function(pid) {
    var DB = NEXORA.DB;
    var H = NEXORA.Helpers;
    var c = document.getElementById('cfTabContent');
    if (!c) return;

    var certs = DB.payment_certificates.filter(function(x) { return x.project_id === pid; });
    var boq = DB.boq_items.filter(function(x) { return x.project_id === pid; });
    var totalExecuted = boq.reduce(function(s, b) { return s + (b.executed_amount || 0); }, 0);
    var totalPrevPaid = certs.reduce(function(s, x) { return s + (x.executed_amount || 0); }, 0);
    var thisPeriod = totalExecuted - totalPrevPaid;
    if (thisPeriod < 0) thisPeriod = 0;

    var h = '<div class="card"><div class="card-title"><i class="ti ti-file-plus"></i> إنشاء مستخلص جديد</div>' +
      '<div id="certMsg" class="message-box"></div>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end;">' +
        '<div><label>الفترة</label><input type="text" id="fCertPeriod" placeholder="يناير 2026" value="' + (new Date().toLocaleDateString('ar-SA', {month: 'long', year: 'numeric'})) + '"></div>' +
        '<div style="flex:1;min-width:200px;">' +
          '<div style="padding:10px;background:var(--BG);border-radius:8px;">' +
            '<span style="font-size:12px;color:var(--TX2);">المبلغ المستحق هذه الفترة (من جدول الكميات):</span> ' +
            '<strong style="color:var(--P);font-size:16px;">' + H.fmt(thisPeriod) + ' ريال</strong>' +
          '</div>' +
        '</div>' +
        '<button class="btn btn-primary" onclick="createCertificate()"><i class="ti ti-device-floppy"></i> إنشاء المستخلص</button>' +
      '</div>' +
    '</div>';

    h += '<div class="card"><div class="card-title"><i class="ti ti-file-invoice"></i> المستخلصات (' + certs.length + ')</div>' +
      '<div style="overflow-x:auto;"><table>' +
        '<tr><th>رقم الدورة</th><th>الفترة</th><th>المبلغ الإجمالي</th><th>الاحتفاظ</th><th>استرداد المقدمة</th><th>الدفعات السابقة</th><th>صافي المستحق</th><th>الحالة</th><th>إجراءات</th></tr>';

    if (!certs.length) {
      h += '<tr><td colspan="9" style="text-align:center;color:var(--TX2);padding:30px;">لا توجد مستخلصات بعد</td></tr>';
    } else {
      certs.forEach(function(cr) {
        var stMap = {'draft': 'مسودة', 'submitted': 'مُرسل', 'approved': 'معتمد', 'rejected': 'مرفوض'};
        var stCls = {'draft': 'badge-pending', 'submitted': 'badge-progress', 'approved': 'badge-done', 'rejected': 'badge-rejected'};
        h += '<tr>' +
          '<td style="font-weight:700;">' + H.esc(cr.cert_no || '') + '</td>' +
          '<td>' + H.esc(cr.period) + '</td>' +
          '<td>' + H.fmt(cr.total_amount) + '</td>' +
          '<td style="color:var(--G);">' + H.fmt(cr.retention_amount) + '</td>' +
          '<td>' + H.fmt(cr.advance_recovery) + '</td>' +
          '<td>' + H.fmt(cr.previous_payments) + '</td>' +
          '<td style="font-weight:700;color:var(--P);">' + H.fmt(cr.net_due) + '</td>' +
          '<td><span class="badge ' + (stCls[cr.status] || 'badge-pending') + '">' + (stMap[cr.status] || cr.status) + '</span></td>' +
          '<td>' +
            (cr.status === 'draft' ? '<button class="btn btn-sm btn-o" onclick="submitCert(' + cr.id + ')" title="إرسال"><i class="ti ti-send"></i></button> ' : '') +
            (cr.status === 'submitted' ? '<button class="btn btn-sm btn-success" onclick="approveCert(' + cr.id + ')" title="اعتماد"><i class="ti ti-check"></i></button> <button class="btn btn-sm btn-danger" onclick="rejectCert(' + cr.id + ')" title="رفض"><i class="ti ti-x"></i></button> ' : '') +
            '<button class="btn btn-sm btn-o" onclick="viewCertDetail(' + cr.id + ')" title="تفاصيل"><i class="ti ti-eye"></i></button> ' +
            '<button class="btn btn-sm btn-danger" onclick="deleteCert(' + cr.id + ')" title="حذف"><i class="ti ti-trash"></i></button>' +
          '</td>' +
        '</tr>';
      });
    }

    h += '</table></div></div>';
    h += '<div id="certDetailArea"></div>';
    c.innerHTML = h;
  },

  _renderPurchases: function(pid) {
    var App = NEXORA.App;
    var DB = NEXORA.DB;
    var H = NEXORA.Helpers;
    var c = document.getElementById('cfTabContent');
    if (!c) return;

    var today = new Date().toISOString().split('T')[0];
    var purchases = DB.cash_flow.filter(function(e) {
      return e.project_id === pid && e.type === 'outflow' && (e.category === 'materials' || e.category === 'other');
    });

    var todayPurchases = purchases.filter(function(e) { return e.date === today; });
    var todayTotal = todayPurchases.reduce(function(s, e) { return s + (e.amount || 0); }, 0);

    var weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    var weekStartStr = weekStart.toISOString().split('T')[0];
    var weekPurchases = purchases.filter(function(e) { return e.date >= weekStartStr && e.date <= today; });
    var weekTotal = weekPurchases.reduce(function(s, e) { return s + (e.amount || 0); }, 0);

    var h = '<div class="stats">' +
      '<div class="stat-card gold"><div class="num">' + H.fmt(todayTotal) + '</div><div class="lbl">مشتريات اليوم</div></div>' +
      '<div class="stat-card blue"><div class="num">' + todayPurchases.length + '</div><div class="lbl">عدد مشتريات اليوم</div></div>' +
      '<div class="stat-card teal"><div class="num">' + H.fmt(weekTotal) + '</div><div class="lbl">مشتريات الأسبوع</div></div>' +
    '</div>';

    h += '<div class="card"><div class="card-title"><i class="ti ti-shopping-cart-plus"></i> شراء سريع</div>' +
      '<div id="purchMsg" class="message-box"></div>' +
      '<div class="grid-4">' +
        '<div><label>الوصف</label><input type="text" id="fPurchDesc" placeholder="أسمنت، حديد..."></div>' +
        '<div><label>المبلغ</label><input type="number" id="fPurchAmount" placeholder="10000" step="any"></div>' +
        '<div><label>الفئة</label><select id="fPurchCat"><option value="materials">مواد</option><option value="other">أخرى</option></select></div>' +
        '<div><label>التاريخ</label><input type="date" id="fPurchDate" value="' + today + '"></div>' +
      '</div>' +
      '<button class="btn btn-primary" onclick="addQuickPurchase()"><i class="ti ti-device-floppy"></i> تسجيل الشراء</button>' +
    '</div>';

    h += '<div class="card"><div class="card-title"><i class="ti ti-list"></i> مشتريات اليوم - ' + H.esc(today) + '</div>' +
      '<div style="overflow-x:auto;"><table>' +
        '<tr><th>الوصف</th><th>الفئة</th><th>المبلغ</th><th>إجراءات</th></tr>';

    var todayOnly = purchases.filter(function(e) { return e.date === today; }).sort(function(a, b) { return (b.id || 0) - (a.id || 0); });
    if (!todayOnly.length) {
      h += '<tr><td colspan="4" style="text-align:center;color:var(--TX2);padding:20px;">لا توجد مشتريات اليوم</td></tr>';
    } else {
      todayOnly.forEach(function(e) {
        var catLabel = e.category === 'materials' ? 'مواد' : 'أخرى';
        h += '<tr>' +
          '<td>' + H.esc(e.description) + '</td>' +
          '<td><span class="badge badge-progress">' + catLabel + '</span></td>' +
          '<td style="font-weight:700;color:var(--RE);">' + H.fmt(e.amount) + '</td>' +
          '<td><button class="btn btn-sm btn-danger" onclick="deleteCashFlow(' + e.id + ')" title="حذف"><i class="ti ti-trash"></i></button></td>' +
        '</tr>';
      });
      h += '<tr style="background:var(--BG);font-weight:700;">' +
        '<td>إجمالي اليوم</td><td></td>' +
        '<td style="color:var(--RE);">' + H.fmt(todayTotal) + '</td><td></td>' +
      '</tr>';
    }

    h += '</table></div></div>';
    c.innerHTML = h;
  }
};

window.renderCashflow = function() { NEXORA.Views.Cashflow.render(); };

window.CFSwitchProject = function(pid) {
  NEXORA.App.curProjId = pid ? parseInt(pid) : null;
  NEXORA.Views.Cashflow.render();
};

window.CFSwitchTab = function(tab, btn) {
  NEXORA.Views.Cashflow._activeTab = tab;
  var tabs = document.querySelectorAll('#cfTabs .tab-btn');
  tabs.forEach(function(t) { t.classList.remove('active'); });
  if (btn) btn.classList.add('active');
  var pid = NEXORA.App.curProjId;
  if (tab === 'cashflow') NEXORA.Views.Cashflow._renderCashflow(pid);
  else if (tab === 'certificates') NEXORA.Views.Cashflow._renderCertificates(pid);
  else if (tab === 'purchases') NEXORA.Views.Cashflow._renderPurchases(pid);
};

window.CFCatUpdate = function() {
  var type = document.getElementById('fCfType').value;
  var catEl = document.getElementById('fCfCategory');
  if (type === 'inflow') {
    catEl.innerHTML = '<option value="payment">تحصيل</option><option value="advance">دفعة مقدمة</option><option value="other">أخرى</option>';
  } else {
    catEl.innerHTML = '<option value="materials">مواد</option><option value="labor">عمالة</option><option value="equipment">معدات</option><option value="subcontract">مقاول من الباطن</option><option value="other">أخرى</option>';
  }
};

window.addCashFlowEntry = function() {
  var App = NEXORA.App;
  var DB = NEXORA.DB;
  var H = NEXORA.Helpers;
  var pid = App.curProjId;
  if (!pid) return H.msg('cfMsg', 'اختر مشروع أولاً', 'error');

  var type = document.getElementById('fCfType').value;
  var category = document.getElementById('fCfCategory').value;
  var amount = parseFloat(document.getElementById('fCfAmount').value) || 0;
  var date = document.getElementById('fCfDate').value;
  var desc = document.getElementById('fCfDesc').value.trim();
  var ref = document.getElementById('fCfRef').value.trim();

  if (!desc) return H.msg('cfMsg', 'أدخل وصف الحركة', 'error');
  if (amount <= 0) return H.msg('cfMsg', 'أدخل مبلغ صحيح', 'error');
  if (!date) return H.msg('cfMsg', 'اختر التاريخ', 'error');

  DB.cash_flow.push({
    id: H.gf(DB.cash_flow),
    project_id: pid,
    type: type,
    category: category,
    description: desc,
    amount: amount,
    date: date,
    reference: ref,
    created_by: App.cu ? App.cu.id : 0,
    created_at: new Date().toISOString()
  });
  DB.save();
  H.msg('cfMsg', 'تمت إضافة الحركة بنجاح', 'success');
  if (typeof showToast === 'function') showToast('تمت إضافة الحركة', 'success');

  document.getElementById('fCfAmount').value = '';
  document.getElementById('fCfDesc').value = '';
  document.getElementById('fCfRef').value = '';
  NEXORA.Views.Cashflow.render();
};

window.deleteCashFlow = function(id) {
  if (!confirm('هل أنت متأكد من حذف هذه الحركة؟')) return;
  var DB = NEXORA.DB;
  DB.cash_flow = DB.cash_flow.filter(function(x) { return x.id !== id; });
  DB.save();
  if (typeof showToast === 'function') showToast('تم حذف الحركة', 'success');
  NEXORA.Views.Cashflow.render();
};

window.createCertificate = function() {
  var App = NEXORA.App;
  var DB = NEXORA.DB;
  var H = NEXORA.Helpers;
  var pid = App.curProjId;
  if (!pid) return H.msg('certMsg', 'اختر مشروع أولاً', 'error');

  var period = document.getElementById('fCertPeriod').value.trim();
  if (!period) return H.msg('certMsg', 'أدخل الفترة', 'error');

  var boq = DB.boq_items.filter(function(x) { return x.project_id === pid; });
  var certs = DB.payment_certificates.filter(function(x) { return x.project_id === pid; });
  var totalExecuted = boq.reduce(function(s, b) { return s + (b.executed_amount || 0); }, 0);
  var previousPayments = certs.reduce(function(s, x) { return s + (x.executed_amount || 0); }, 0);
  var thisAmount = totalExecuted - previousPayments;
  if (thisAmount < 0) thisAmount = 0;

  var retentionPct = 5;
  var retentionAmt = thisAmount * retentionPct / 100;
  var advanceRecovery = 0;
  var netDue = thisAmount - retentionAmt - advanceRecovery;

  var certNo = 'C-' + (certs.length + 1);

  DB.payment_certificates.push({
    id: H.gf(DB.payment_certificates),
    project_id: pid,
    cert_no: certNo,
    period: period,
    total_amount: thisAmount,
    executed_amount: thisAmount,
    retention_pct: retentionPct,
    retention_amount: retentionAmt,
    advance_recovery: advanceRecovery,
    previous_payments: previousPayments,
    net_due: netDue,
    status: 'draft',
    created_by: App.cu ? App.cu.id : 0,
    created_at: new Date().toISOString()
  });
  DB.save();
  H.msg('certMsg', 'تم إنشاء المستخلص ' + certNo, 'success');
  if (typeof showToast === 'function') showToast('تم إنشاء المستخلص: ' + certNo, 'success');
  NEXORA.Views.Cashflow._renderCertificates(pid);
};

window.submitCert = function(id) {
  var DB = NEXORA.DB;
  var c = DB.payment_certificates.find(function(x) { return x.id === id; });
  if (!c) return;
  c.status = 'submitted';
  DB.save();
  if (typeof showToast === 'function') showToast('تم إرسال المستخلص للمراجعة', 'info');
  NEXORA.Views.Cashflow._renderCertificates(NEXORA.App.curProjId);
};

window.approveCert = function(id) {
  var DB = NEXORA.DB;
  var c = DB.payment_certificates.find(function(x) { return x.id === id; });
  if (!c) return;
  c.status = 'approved';
  DB.save();
  if (typeof showToast === 'function') showToast('تم اعتماد المستخلص', 'success');
  NEXORA.Views.Cashflow._renderCertificates(NEXORA.App.curProjId);
};

window.rejectCert = function(id) {
  var DB = NEXORA.DB;
  var c = DB.payment_certificates.find(function(x) { return x.id === id; });
  if (!c) return;
  c.status = 'rejected';
  DB.save();
  if (typeof showToast === 'function') showToast('تم رفض المستخلص', 'warning');
  NEXORA.Views.Cashflow._renderCertificates(NEXORA.App.curProjId);
};

window.deleteCert = function(id) {
  if (!confirm('هل أنت متأكد من حذف هذا المستخلص؟')) return;
  var DB = NEXORA.DB;
  DB.payment_certificates = DB.payment_certificates.filter(function(x) { return x.id !== id; });
  DB.save();
  if (typeof showToast === 'function') showToast('تم حذف المستخلص', 'success');
  NEXORA.Views.Cashflow._renderCertificates(NEXORA.App.curProjId);
};

window.viewCertDetail = function(id) {
  var DB = NEXORA.DB;
  var H = NEXORA.Helpers;
  var pid = NEXORA.App.curProjId;
  var cert = DB.payment_certificates.find(function(x) { return x.id === id; });
  if (!cert) return;

  var boq = DB.boq_items.filter(function(x) { return x.project_id === pid; });
  var area = document.getElementById('certDetailArea');
  if (!area) return;

  var h = '<div class="card" style="border-right:4px solid var(--P);">' +
    '<div class="flex-between" style="margin-bottom:12px;">' +
      '<div class="card-title" style="margin:0;"><i class="ti ti-file-text"></i> تفاصيل المستخلص ' + H.esc(cert.cert_no) + ' - ' + H.esc(cert.period) + '</div>' +
      '<button class="btn btn-sm" onclick="document.getElementById(\'certDetailArea\').innerHTML=\'\'"><i class="ti ti-x"></i> إغلاق</button>' +
    '</div>' +
    '<div style="overflow-x:auto;"><table>' +
      '<tr><th>رقم البند</th><th>الوصف</th><th>الوحدة</th><th>الكمية الإجمالية</th><th>المنفذ</th><th>سعر الوحدة</th><th>المبلغ المنفذ</th></tr>';

  var totalExec = 0;
  boq.forEach(function(b) {
    if ((b.executed_qty || 0) > 0) {
      totalExec += (b.executed_amount || 0);
      h += '<tr>' +
        '<td>' + H.esc(b.item_no || '') + '</td>' +
        '<td>' + H.esc(b.name) + '</td>' +
        '<td>' + H.esc(b.unit) + '</td>' +
        '<td>' + H.fmt(b.quantity) + '</td>' +
        '<td>' + H.fmt(b.executed_qty) + '</td>' +
        '<td>' + H.fmt(b.unit_rate) + '</td>' +
        '<td style="font-weight:700;">' + H.fmt(b.executed_amount || 0) + '</td>' +
      '</tr>';
    }
  });

  h += '<tr style="background:var(--BG);font-weight:700;">' +
    '<td colspan="6">الإجمالي المنفذ</td>' +
    '<td>' + H.fmt(totalExec) + '</td>' +
  '</tr></table></div>' +
  '<div style="margin-top:12px;padding:12px;background:var(--BG);border-radius:8px;">' +
    '<div style="display:flex;justify-content:space-between;margin-bottom:6px;"><span>المبلغ الإجمالي:</span><strong>' + H.fmt(cert.total_amount) + '</strong></div>' +
    '<div style="display:flex;justify-content:space-between;margin-bottom:6px;"><span>احتفاظ (' + cert.retention_pct + '%):</span><strong style="color:var(--G);">-' + H.fmt(cert.retention_amount) + '</strong></div>' +
    '<div style="display:flex;justify-content:space-between;margin-bottom:6px;"><span>استرداد المقدمة:</span><strong>-' + H.fmt(cert.advance_recovery) + '</strong></div>' +
    '<div style="display:flex;justify-content:space-between;margin-bottom:6px;"><span>الدفعات السابقة:</span><strong>' + H.fmt(cert.previous_payments) + '</strong></div>' +
    '<hr>' +
    '<div style="display:flex;justify-content:space-between;font-size:18px;"><span style="font-weight:700;">صافي المستحق:</span><strong style="color:var(--P);">' + H.fmt(cert.net_due) + ' ريال</strong></div>' +
  '</div></div>';

  area.innerHTML = h;
  area.scrollIntoView({ behavior: 'smooth' });
};

window.addQuickPurchase = function() {
  var App = NEXORA.App;
  var DB = NEXORA.DB;
  var H = NEXORA.Helpers;
  var pid = App.curProjId;
  if (!pid) return H.msg('purchMsg', 'اختر مشروع أولاً', 'error');

  var desc = document.getElementById('fPurchDesc').value.trim();
  var amount = parseFloat(document.getElementById('fPurchAmount').value) || 0;
  var category = document.getElementById('fPurchCat').value;
  var date = document.getElementById('fPurchDate').value;

  if (!desc) return H.msg('purchMsg', 'أدخل وصف الشراء', 'error');
  if (amount <= 0) return H.msg('purchMsg', 'أدخل مبلغ صحيح', 'error');
  if (!date) return H.msg('purchMsg', 'اختر التاريخ', 'error');

  DB.cash_flow.push({
    id: H.gf(DB.cash_flow),
    project_id: pid,
    type: 'outflow',
    category: category,
    description: desc,
    amount: amount,
    date: date,
    reference: '',
    created_by: App.cu ? App.cu.id : 0,
    created_at: new Date().toISOString()
  });
  DB.save();
  H.msg('purchMsg', 'تم تسجيل الشراء بنجاح', 'success');
  if (typeof showToast === 'function') showToast('تم تسجيل الشراء: ' + desc, 'success');

  document.getElementById('fPurchDesc').value = '';
  document.getElementById('fPurchAmount').value = '';
  NEXORA.Views.Cashflow._renderPurchases(pid);
};
