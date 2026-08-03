window.NEXORA = window.NEXORA || {};
NEXORA.Views = NEXORA.Views || {};

NEXORA.Views.Cashflow = {
  _activeTab: 'cashflow',

  render: async function() {
    var App = NEXORA.App;
    var H = NEXORA.Helpers;
    var pid = App.curProjId;
    var el = document.getElementById('cashflowContent');
    if (!el) return;

    var activeTab = NEXORA.Views.Cashflow._activeTab;
    el.innerHTML = '<div class="card"><div class="empty-state"><i class="ti ti-loader"></i>جاري التحميل...</div></div>';

    try {
      var projects = await NEXORA.Repositories.projects.list();
      var p = projects.find(x => String(x.id) === String(pid));

      var projOpts = '<option value="">-- اختر مشروع --</option>';
      projects.forEach(function(pr) {
        var sel = String(pr.id) === String(pid) ? ' selected' : '';
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
      var flows = await NEXORA.Repositories.cash_flow.list({ project_id: pid });
      
      var summary = window.NEXORA.FinanceUtils ? window.NEXORA.FinanceUtils.calculateCashFlowSummary(flows) : { inflow: 0, outflow: 0, netBalance: 0 };
      
      var totalIn = summary.inflow;
      var totalOut = summary.outflow;
      var net = summary.netBalance;
      var isPos = net >= 0;

      el.textContent = ''; // clear safely

      var h = '<div class="page-header" style="margin-bottom:20px;">' +
        '<h2><i class="ti ti-cash"></i> السيولة النقدية</h2>' +
        '<div class="header-actions">' +
          '<button class="btn btn-outline" data-action="exportCashflow"><i class="ti ti-download"></i> تصدير التقرير</button>' +
        '</div>' +
      '</div>';
      
      var headerDiv = document.createElement('div');
      headerDiv.innerHTML = h;
      el.appendChild(headerDiv);

      var cardsDiv = document.createElement('div');
      cardsDiv.className = 'grid-3';
      cardsDiv.style.marginBottom = '20px';
      cardsDiv.innerHTML = 
        '<div class="stat-card" style="border-right:4px solid var(--GR);">' +
          '<div class="stat-icon" style="color:var(--GR);background:#dcfce7;"><i class="ti ti-arrow-up-right"></i></div>' +
          '<div class="stat-info"><div class="stat-label">إجمالي الوارد</div><div class="stat-value" style="color:var(--GR);">' + H.fmt(totalIn) + ' <small>ر.س</small></div></div>' +
        '</div>' +
        '<div class="stat-card" style="border-right:4px solid var(--RE);">' +
          '<div class="stat-icon" style="color:var(--RE);background:#fee2e2;"><i class="ti ti-arrow-down-right"></i></div>' +
          '<div class="stat-info"><div class="stat-label">إجمالي الصادر</div><div class="stat-value" style="color:var(--RE);">' + H.fmt(totalOut) + ' <small>ر.س</small></div></div>' +
        '</div>' +
        '<div class="stat-card" style="border-right:4px solid ' + (isPos ? 'var(--GR)' : 'var(--RE)') + ';">' +
          '<div class="stat-icon" style="color:' + (isPos ? 'var(--GR)' : 'var(--RE)') + ';background:' + (isPos ? '#dcfce7' : '#fee2e2') + ';"><i class="ti ' + (isPos ? 'ti-trending-up' : 'ti-trending-down') + '"></i></div>' +
          '<div class="stat-info"><div class="stat-label">صافي الرصيد</div><div class="stat-value" style="color:' + (isPos ? 'var(--GR)' : 'var(--RE)') + ';">' + H.fmt(net) + ' <small>ر.س</small></div></div>' +
        '</div>';
      el.appendChild(cardsDiv);

      var filtersDiv = document.createElement('div');
      filtersDiv.className = 'card';
      filtersDiv.style.marginBottom = '20px';
      
      // Project filter options
      var projsHtml = projects.map(function(p) {
        return '<option value="' + p.id + '">' + H.esc(p.name) + '</option>';
      }).join('');
      
      filtersDiv.innerHTML = 
        '<div class="card-title"><i class="ti ti-filter"></i> تصفية الحركات</div>' +
        '<div class="form-row">' +
          '<div class="form-group">' +
            '<label>المشروع</label>' +
            '<select id="cfProjectFilter" class="input"><option value="">كل المشاريع</option>' + projsHtml + '</select>' +
          '</div>' +
          '<div class="form-group">' +
            '<label>نوع الحركة</label>' +
            '<select id="cfTypeFilter" class="input"><option value="">الكل</option><option value="inflow">وارد</option><option value="outflow">صادر</option></select>' +
          '</div>' +
          '<div class="form-group" style="display:flex;align-items:flex-end;">' +
            '<button class="btn btn-primary" data-action="filterCashflow" style="width:100%;">تطبيق الفلتر</button>' +
          '</div>' +
        '</div>';
      el.appendChild(filtersDiv);

      var chartAndList = document.createElement('div');
      chartAndList.innerHTML = 
        '<div class="grid-2">' +
          '<div class="card"><div class="card-title">تحليل السيولة (رسم بياني)</div><div class="chart-container" id="cfChartContainer"></div></div>' +
          '<div class="card"><div class="card-title">تفاصيل الحركات</div><div id="cfListContainer"></div></div>' +
        '</div>';
      el.appendChild(chartAndList);

      setTimeout(function() {
        NEXORA.Views.Cashflow.renderChart(flows);
        NEXORA.Views.Cashflow.renderList(flows);
      }, 50);

    } catch(err) {
      el.textContent = '';
      var errDiv = document.createElement('div');
      errDiv.className = 'card';
      errDiv.innerHTML = '<div class="empty-state"><i class="ti ti-alert-triangle" style="color:var(--ER);"></i>حدث خطأ: <span class="err-text"></span></div>';
      errDiv.querySelector('.err-text').textContent = err.message;
      el.appendChild(errDiv);
    }
  },

  _renderCashflow: async function(pid) {
    var App = NEXORA.App;
    var H = NEXORA.Helpers;
    var c = document.getElementById('cfTabContent');
    if (!c) return;

    if (!pid) {
      c.innerHTML = '<div class="card"><div class="empty-state">اختر مشروع أولاً</div></div>';
      return;
    }

    try {
      var entries = await NEXORA.Repositories.cash_flow.list({ project_id: pid });
      var inflows = entries.filter(function(e) { return e.type === 'inflow'; });
      var outflows = entries.filter(function(e) { return e.type === 'outflow'; });
      var totalIn = inflows.reduce(function(s, e) { return s + (parseFloat(e.amount) || 0); }, 0);
      var totalOut = outflows.reduce(function(s, e) { return s + (parseFloat(e.amount) || 0); }, 0);
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
        '<button class="btn btn-primary" onclick="addCashFlowEntry()" id="btnCfAdd"><i class="ti ti-device-floppy"></i> إضافة</button>' +
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
          if (e.type === 'inflow') runningBal += (parseFloat(e.amount) || 0);
          else runningBal -= (parseFloat(e.amount) || 0);
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
            '<td><button class="btn btn-sm btn-danger" onclick="deleteCashFlow(\'' + e.id + '\')" title="حذف"><i class="ti ti-trash"></i></button></td>' +
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
    } catch(err) {
      c.innerHTML = '<div class="empty-state">فشل تحميل الحركات: ' + H.esc(err.message) + '</div>';
    }
  },

  _renderBarChart: function(entries) {
    var el = document.getElementById('cfBarChart');
    if (!el) return;

    var monthData = {};
    entries.forEach(function(e) {
      if (!e.date) return;
      var m = e.date.substring(0, 7);
      if (!monthData[m]) monthData[m] = { inflow: 0, outflow: 0 };
      if (e.type === 'inflow') monthData[m].inflow += (parseFloat(e.amount) || 0);
      else monthData[m].outflow += (parseFloat(e.amount) || 0);
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

  _renderCertificates: async function(pid) {
    var H = NEXORA.Helpers;
    var c = document.getElementById('cfTabContent');
    if (!c) return;

    if (!pid) {
      c.innerHTML = '<div class="card"><div class="empty-state">اختر مشروع أولاً</div></div>';
      return;
    }

    try {
      var certs = await NEXORA.Repositories.payment_certificates.list({ project_id: pid });
      var boq = await NEXORA.Repositories.boq_items.list({ project_id: pid });

      var totalExecuted = boq.reduce(function(s, b) { return s + (parseFloat(b.executed_amount) || 0); }, 0);
      var totalPrevPaid = certs.reduce(function(s, x) { return s + (parseFloat(x.executed_amount) || 0); }, 0);
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
          '<button class="btn btn-primary" onclick="createCertificate()" id="btnCreateCert"><i class="ti ti-device-floppy"></i> إنشاء المستخلص</button>' +
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
              (cr.status === 'draft' ? '<button class="btn btn-sm btn-o" onclick="submitCert(\'' + cr.id + '\')" title="إرسال"><i class="ti ti-send"></i></button> ' : '') +
              (cr.status === 'submitted' ? '<button class="btn btn-sm btn-success" onclick="approveCert(\'' + cr.id + '\')" title="اعتماد"><i class="ti ti-check"></i></button> <button class="btn btn-sm btn-danger" onclick="rejectCert(\'' + cr.id + '\')" title="رفض"><i class="ti ti-x"></i></button> ' : '') +
              '<button class="btn btn-sm btn-o" onclick="viewCertDetail(\'' + cr.id + '\')" title="تفاصيل"><i class="ti ti-eye"></i></button> ' +
              '<button class="btn btn-sm btn-danger" onclick="deleteCert(\'' + cr.id + '\')" title="حذف"><i class="ti ti-trash"></i></button>' +
            '</td>' +
          '</tr>';
        });
      }

      h += '</table></div></div>';
      h += '<div id="certDetailArea"></div>';
      c.innerHTML = h;
    } catch (err) {
      c.innerHTML = '<div class="empty-state">فشل تحميل المستخلصات: ' + H.esc(err.message) + '</div>';
    }
  },

  _renderPurchases: async function(pid) {
    var App = NEXORA.App;
    var H = NEXORA.Helpers;
    var c = document.getElementById('cfTabContent');
    if (!c) return;

    if (!pid) {
      c.innerHTML = '<div class="card"><div class="empty-state">اختر مشروع أولاً</div></div>';
      return;
    }

    try {
      var allCF = await NEXORA.Repositories.cash_flow.list({ project_id: pid });
      var today = new Date().toISOString().split('T')[0];
      var purchases = allCF.filter(function(e) {
        return e.type === 'outflow' && (e.category === 'materials' || e.category === 'other');
      });

      var todayPurchases = purchases.filter(function(e) { return e.date === today; });
      var todayTotal = todayPurchases.reduce(function(s, e) { return s + (parseFloat(e.amount) || 0); }, 0);

      var weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      var weekStartStr = weekStart.toISOString().split('T')[0];
      var weekPurchases = purchases.filter(function(e) { return e.date >= weekStartStr && e.date <= today; });
      var weekTotal = weekPurchases.reduce(function(s, e) { return s + (parseFloat(e.amount) || 0); }, 0);

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
        '<button class="btn btn-primary" onclick="addQuickPurchase()" id="btnPurchAdd"><i class="ti ti-device-floppy"></i> تسجيل الشراء</button>' +
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
            '<td><button class="btn btn-sm btn-danger" onclick="deleteCashFlow(\'' + e.id + '\')" title="حذف"><i class="ti ti-trash"></i></button></td>' +
          '</tr>';
        });
        h += '<tr style="background:var(--BG);font-weight:700;">' +
          '<td>إجمالي اليوم</td><td></td>' +
          '<td style="color:var(--RE);">' + H.fmt(todayTotal) + '</td><td></td>' +
        '</tr>';
      }

      h += '</table></div></div>';
      c.innerHTML = h;
    } catch (err) {
      c.innerHTML = '<div class="empty-state">فشل تحميل المشتريات: ' + H.esc(err.message) + '</div>';
    }
  }
};

window.renderCashflow = function() { NEXORA.Views.Cashflow.render(); };

window.CFSwitchProject = function(pid) {
  NEXORA.App.curProjId = pid ? String(pid) : null;
  NEXORA.Views.Cashflow.render();
};

window.CFSwitchTab = function(tab, btn) {
  NEXORA.Views.Cashflow._activeTab = tab;
  var tabs = document.querySelectorAll('#cfTabs .tab-btn');
  tabs.forEach(function(t) { t.classList.remove('active'); });
  if (btn) btn.classList.add('active');
  NEXORA.Views.Cashflow.render();
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

window.addCashFlowEntry = async function() {
  var App = NEXORA.App;
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

  const btn = document.getElementById('btnCfAdd');
  if(btn) btn.disabled = true;

  try {
    await NEXORA.Repositories.cash_flow.create({
      project_id: pid,
      type: type,
      category: category,
      description: desc,
      amount: amount,
      date: date,
      reference: ref,
      status: 'active'
    });

    H.msg('cfMsg', 'تمت إضافة الحركة بنجاح', 'success');
    if (typeof showToast === 'function') showToast('تمت إضافة الحركة', 'success');
    await NEXORA.Views.Cashflow.render();
  } catch(err) {
    H.msg('cfMsg', 'فشل: ' + err.message, 'error');
  } finally {
    if(btn) btn.disabled = false;
  }
};

window.deleteCashFlow = async function(id) {
  if (!confirm('هل أنت متأكد من حذف هذه الحركة؟')) return;
  try {
    await NEXORA.Repositories.cash_flow.delete(id);
    if (typeof showToast === 'function') showToast('تم حذف الحركة', 'success');
    await NEXORA.Views.Cashflow.render();
  } catch(err) {
    alert('فشل الحذف: ' + err.message);
  }
};

window.createCertificate = async function() {
  var App = NEXORA.App;
  var H = NEXORA.Helpers;
  var pid = App.curProjId;
  if (!pid) return H.msg('certMsg', 'اختر مشروع أولاً', 'error');

  var period = document.getElementById('fCertPeriod').value.trim();
  if (!period) return H.msg('certMsg', 'أدخل الفترة', 'error');

  const btn = document.getElementById('btnCreateCert');
  if(btn) btn.disabled = true;

  try {
    var boq = await NEXORA.Repositories.boq_items.list({ project_id: pid });
    var certs = await NEXORA.Repositories.payment_certificates.list({ project_id: pid });

    var totalExecuted = boq.reduce(function(s, b) { return s + (parseFloat(b.executed_amount) || 0); }, 0);
    var previousPayments = certs.reduce(function(s, x) { return s + (parseFloat(x.executed_amount) || 0); }, 0);
    var thisAmount = totalExecuted - previousPayments;
    if (thisAmount < 0) thisAmount = 0;

    var retentionPct = 5;
    var retentionAmt = thisAmount * retentionPct / 100;
    var advanceRecovery = 0;
    var netDue = thisAmount - retentionAmt - advanceRecovery;

    var certNo = 'C-' + (certs.length + 1);

    await NEXORA.Repositories.payment_certificates.create({
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
      status: 'draft'
    });

    H.msg('certMsg', 'تم إنشاء المستخلص ' + certNo, 'success');
    if (typeof showToast === 'function') showToast('تم إنشاء المستخلص: ' + certNo, 'success');
    await NEXORA.Views.Cashflow._renderCertificates(pid);
  } catch(err) {
    H.msg('certMsg', 'فشل: ' + err.message, 'error');
  } finally {
    if(btn) btn.disabled = false;
  }
};

window.submitCert = async function(id) {
  try {
    await NEXORA.Repositories.payment_certificates.update(id, { status: 'submitted' });
    if (typeof showToast === 'function') showToast('تم إرسال المستخلص للمراجعة', 'info');
    await NEXORA.Views.Cashflow._renderCertificates(NEXORA.App.curProjId);
  } catch (err) { alert('فشل التحديث: ' + err.message); }
};

window.approveCert = async function(id) {
  try {
    await NEXORA.Repositories.payment_certificates.update(id, { status: 'approved' });
    if (typeof showToast === 'function') showToast('تم اعتماد المستخلص', 'success');
    await NEXORA.Views.Cashflow._renderCertificates(NEXORA.App.curProjId);
  } catch (err) { alert('فشل الاعتماد: ' + err.message); }
};

window.rejectCert = async function(id) {
  try {
    await NEXORA.Repositories.payment_certificates.update(id, { status: 'rejected' });
    if (typeof showToast === 'function') showToast('تم رفض المستخلص', 'warning');
    await NEXORA.Views.Cashflow._renderCertificates(NEXORA.App.curProjId);
  } catch (err) { alert('فشل الرفض: ' + err.message); }
};

window.deleteCert = async function(id) {
  if (!confirm('هل أنت متأكد من حذف هذا المستخلص؟')) return;
  try {
    await NEXORA.Repositories.payment_certificates.delete(id);
    if (typeof showToast === 'function') showToast('تم حذف المستخلص', 'success');
    await NEXORA.Views.Cashflow._renderCertificates(NEXORA.App.curProjId);
  } catch (err) { alert('فشل الحذف: ' + err.message); }
};

window.viewCertDetail = async function(id) {
  var H = NEXORA.Helpers;
  var pid = NEXORA.App.curProjId;
  
  var area = document.getElementById('certDetailArea');
  if (!area) return;
  area.innerHTML = '<div class="card"><div class="empty-state"><i class="ti ti-loader"></i>...</div></div>';

  try {
    var cert = await NEXORA.Repositories.payment_certificates.getById(id);
    if (!cert) return;
    var boq = await NEXORA.Repositories.boq_items.list({ project_id: pid });

    var h = '<div class="card" style="border-right:4px solid var(--P);">' +
      '<div class="flex-between" style="margin-bottom:12px;">' +
        '<div class="card-title" style="margin:0;"><i class="ti ti-file-text"></i> تفاصيل المستخلص ' + H.esc(cert.cert_no) + ' - ' + H.esc(cert.period) + '</div>' +
        '<button class="btn btn-sm" onclick="document.getElementById(\'certDetailArea\').innerHTML=\'\'"><i class="ti ti-x"></i> إغلاق</button>' +
      '</div>' +
      '<div style="overflow-x:auto;"><table>' +
        '<tr><th>رقم البند</th><th>الوصف</th><th>الوحدة</th><th>الكمية الإجمالية</th><th>المنفذ</th><th>سعر الوحدة</th><th>المبلغ المنفذ</th></tr>';

    var totalExec = 0;
    boq.forEach(function(b) {
      if ((parseFloat(b.executed_qty) || 0) > 0) {
        totalExec += (parseFloat(b.executed_amount) || 0);
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
  } catch (err) {
    area.innerHTML = '<div class="empty-state">فشل التحميل: ' + H.esc(err.message) + '</div>';
  }
};

window.addQuickPurchase = async function() {
  var App = NEXORA.App;
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

  const btn = document.getElementById('btnPurchAdd');
  if(btn) btn.disabled = true;

  try {
    await NEXORA.Repositories.cash_flow.create({
      project_id: pid,
      type: 'outflow',
      category: category,
      description: desc,
      amount: amount,
      date: date,
      reference: '',
      status: 'active'
    });

    H.msg('purchMsg', 'تم تسجيل الشراء بنجاح', 'success');
    if (typeof showToast === 'function') showToast('تم تسجيل الشراء: ' + desc, 'success');
    await NEXORA.Views.Cashflow._renderPurchases(pid);
  } catch (err) {
    H.msg('purchMsg', 'فشل: ' + err.message, 'error');
  } finally {
    if(btn) btn.disabled = false;
  }
};
