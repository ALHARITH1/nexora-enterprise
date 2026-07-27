window.NEXORA = window.NEXORA || {};

NEXORA.Views = NEXORA.Views || {};

NEXORA.Views.Reports = {
  render: function() {
    var App = NEXORA.App;
    var DB = NEXORA.DB;
    var H = NEXORA.Helpers;
    var cu = App.cu;
    var el = document.getElementById('reportsContent');
    if (!el) return;

    var h = '<div class="card" style="padding:12px 16px;">' +
      '<div class="tab-bar" id="reportTabs">' +
        '<button class="tab-btn active" onclick="switchReportTab(\'projects\',this)"><i class="ti ti-folder-open"></i> المشاريع</button>' +
        '<button class="tab-btn" onclick="switchReportTab(\'budget\',this)"><i class="ti ti-coin"></i> الميزانية مقابل التنفيذ</button>' +
        '<button class="tab-btn" onclick="switchReportTab(\'employees\',this)"><i class="ti ti-users"></i> الموظفون</button>' +
        '<button class="tab-btn" onclick="switchReportTab(\'overdue\',this)"><i class="ti ti-alert-triangle"></i> المتأخرة</button>' +
        '<button class="tab-btn" onclick="switchReportTab(\'pending\',this)"><i class="ti ti-clock"></i> بانتظار الاعتماد</button>' +
        '<button class="tab-btn" onclick="switchReportTab(\'advanced\',this)"><i class="ti ti-filter"></i> فلترة متقدمة</button>' +
      '</div>' +
    '</div>' +
    '<div id="reportTabContent"></div>';

    el.innerHTML = h;
    NEXORA.Views.Reports.reportProjects();
  },

  switchTab: function(id, btn) {
    var tabs = document.querySelectorAll('#reportTabs .tab-btn');
    tabs.forEach(function(t) { t.classList.remove('active'); });
    if (btn) btn.classList.add('active');

    if (id === 'projects') NEXORA.Views.Reports.reportProjects();
    else if (id === 'budget') NEXORA.Views.Reports.reportBudget();
    else if (id === 'employees') NEXORA.Views.Reports.reportEmployees();
    else if (id === 'overdue') NEXORA.Views.Reports.reportOverdue();
    else if (id === 'pending') NEXORA.Views.Reports.reportPendingApproval();
    else if (id === 'advanced') NEXORA.Views.Reports.renderFilteredReportsInTab();
  },

  reportProjects: function() {
    var DB = NEXORA.DB;
    var H = NEXORA.Helpers;
    var c = document.getElementById('reportTabContent');
    if (!c) return;

    var projects = DB.projects;
    var totalBudget = projects.reduce(function(s, p) { return s + (p.budget || 0); }, 0);
    var totalCost = projects.reduce(function(s, p) { return s + H.projCost(p.id); }, 0);
    var totalProfit = totalBudget - totalCost;
    var activeCount = projects.filter(function(p) { return p.status === 'active'; }).length;

    var h = '<div class="stats">' +
      '<div class="stat-card blue"><div class="num">' + projects.length + '</div><div class="lbl">إجمالي المشاريع</div></div>' +
      '<div class="stat-card gold"><div class="num">' + activeCount + '</div><div class="lbl">مشاريع نشطة</div></div>' +
      '<div class="stat-card green"><div class="num">' + H.fmt(totalBudget) + '</div><div class="lbl">إجمالي الميزانية</div></div>' +
      '<div class="stat-card red"><div class="num">' + H.fmt(totalCost) + '</div><div class="lbl">إجمالي التكاليف</div></div>' +
    '</div>';

    h += '<div class="card"><div class="card-title"><i class="ti ti-folder-open"></i> تقرير المشاريع</div>' +
      '<div style="overflow-x:auto;"><table><thead><tr><th>المشروع</th><th>الميزانية</th><th>التكلفة</th><th>الربح/الخسارة</th><th>التقدم</th><th>الحالة</th></tr></thead><tbody>';

    projects.forEach(function(p) {
      var pp = H.projProfit(p.id);
      var pr = H.projProgress(p.id);
      var prCls = pr >= 75 ? 'green' : pr >= 40 ? 'gold' : 'blue';
      h += '<tr style="cursor:pointer;" onclick="openProject(' + p.id + ')">' +
        '<td><strong>' + H.esc(p.name) + '</strong></td>' +
        '<td>' + H.fmt(p.budget) + '</td>' +
        '<td>' + H.fmt(pp.cost) + '</td>' +
        '<td style="color:' + (pp.profit >= 0 ? 'var(--GR)' : 'var(--RE)') + ';font-weight:700;">' + H.fmt(pp.profit) + '</td>' +
        '<td><div class="progress-bar" style="width:100px;display:inline-block;vertical-align:middle;"><div class="progress-fill ' + prCls + '" style="width:' + pr + '%"></div></div> ' + pr + '%</td>' +
        '<td><span class="badge ' + (p.status === 'active' ? 'badge-progress' : 'badge-done') + '">' + (p.status === 'active' ? 'نشط' : 'مكتمل') + '</span></td>' +
      '</tr>';
    });

    h += '</tbody></table></div></div>';

    h += '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
      '<button class="btn btn-primary btn-sm" onclick="exportReportPDF(\'reportTabContent\',\'تقرير المشاريع\')"><i class="ti ti-file-pdf"></i> تصدير PDF</button>' +
      '<button class="btn btn-sm" onclick="exportReportCSV(getProjectReportRows(),\'مشاريع\')"><i class="ti ti-file-spreadsheet"></i> تصدير CSV</button>' +
      '<button class="btn btn-g btn-sm" onclick="exportReportJSON()"><i class="ti ti-json"></i> تصدير JSON</button>' +
    '</div>';

    c.innerHTML = h;

    window.getProjectReportRows = function() {
      return DB.projects.map(function(p) {
        var pp = H.projProfit(p.id);
        return { name: p.name, budget: p.budget, cost: pp.cost, profit: pp.profit, progress: H.projProgress(p.id), status: p.status };
      });
    };
  },

  reportBudget: function() {
    var DB = NEXORA.DB;
    var H = NEXORA.Helpers;
    var c = document.getElementById('reportTabContent');
    if (!c) return;

    var h = '<div class="card"><div class="card-title"><i class="ti ti-coin"></i> الميزانية مقابل التنفيذ الفعلي</div>' +
      '<div style="overflow-x:auto;"><table><thead><tr><th>المشروع</th><th>الميزانية</th><th>التكلفة الفعلية</th><th>الفرق</th><th>النسبة</th></tr></thead><tbody>';

    DB.projects.forEach(function(p) {
      var pp = H.projProfit(p.id);
      var ratio = p.budget ? Math.round(pp.cost / p.budget * 100) : 0;
      var diff = p.budget - pp.cost;
      var diffColor = diff >= 0 ? 'var(--GR)' : 'var(--RE)';
      h += '<tr>' +
        '<td><strong>' + H.esc(p.name) + '</strong></td>' +
        '<td>' + H.fmt(p.budget) + '</td>' +
        '<td>' + H.fmt(pp.cost) + '</td>' +
        '<td style="color:' + diffColor + ';font-weight:700;">' + H.fmt(diff) + '</td>' +
        '<td><div class="progress-bar" style="width:100px;display:inline-block;vertical-align:middle;"><div class="progress-fill ' + (ratio > 100 ? 'red' : ratio > 75 ? 'orange' : 'green') + '" style="width:' + Math.min(ratio, 100) + '%"></div></div> ' + ratio + '%</td>' +
      '</tr>';
    });

    h += '</tbody></table></div></div>';

    DB.projects.forEach(function(p) {
      var items = DB.items.filter(function(x) { return x.project_id === p.id; });
      if (!items.length) return;
      h += '<div class="card"><div class="card-title"><i class="ti ti-list"></i> ' + H.esc(p.name) + ' — البنود</div>' +
        '<div style="overflow-x:auto;"><table><thead><tr><th>البند</th><th>الميزانية</th><th>التكلفة</th><th>الفرق</th></tr></thead><tbody>';
      items.forEach(function(it) {
        var ic = H.itemCost(it.id);
        var diff = (it.budget || 0) - ic;
        h += '<tr><td>' + H.esc(it.name) + '</td><td>' + H.fmt(it.budget) + '</td><td>' + H.fmt(ic) + '</td><td style="color:' + (diff >= 0 ? 'var(--GR)' : 'var(--RE)') + ';font-weight:700;">' + H.fmt(diff) + '</td></tr>';
      });
      h += '</tbody></table></div></div>';
    });

    h += '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
      '<button class="btn btn-primary btn-sm" onclick="exportReportPDF(\'reportTabContent\',\'تقرير الميزانية\')"><i class="ti ti-file-pdf"></i> تصدير PDF</button>' +
    '</div>';

    c.innerHTML = h;
  },

  reportEmployees: function() {
    var DB = NEXORA.DB;
    var H = NEXORA.Helpers;
    var cu = NEXORA.App.cu;
    var c = document.getElementById('reportTabContent');
    if (!c) return;

    var emps = DB.employees.filter(function(e) { return e.company_id === cu.company_id; });

    var h = '<div class="card"><div class="card-title"><i class="ti ti-users"></i> أداء الموظفين</div>' +
      '<div style="overflow-x:auto;"><table><thead><tr><th>الموظف</th><th>الدور</th><th>المهام</th><th>المهام المنجزة</th><th>الساعات</th><th>التكلفة</th><th>الأداء</th></tr></thead><tbody>';

    emps.forEach(function(e) {
      var empTasks = DB.tasks.filter(function(t) { return t.assigned_to === e.id; });
      var doneTasks = empTasks.filter(function(t) { return t.status === 'done' && t.approved; });
      var empAssignments = DB.assignments.filter(function(a) { return a.employee_id === e.id; });
      var totalHours = empAssignments.reduce(function(s, a) { return s + (a.completed_hours || 0); }, 0);
      var totalCost = totalHours * (e.hour_rate || 0);
      var perf = empTasks.length ? Math.round(doneTasks.length / empTasks.length * 100) : 0;
      var roleCls = NEXORA.Config.ROLES[e.role] || 'badge-worker';

      h += '<tr><td><strong>' + H.esc(e.full_name) + '</strong></td>' +
        '<td><span class="badge ' + H.esc(roleCls) + '">' + H.esc(e.role) + '</span></td>' +
        '<td>' + empTasks.length + '</td>' +
        '<td>' + doneTasks.length + '</td>' +
        '<td>' + H.fmt(totalHours) + '</td>' +
        '<td>' + H.fmt(totalCost) + '</td>' +
        '<td><div class="progress-bar" style="width:80px;display:inline-block;vertical-align:middle;"><div class="progress-fill ' + (perf >= 75 ? 'green' : perf >= 40 ? 'gold' : 'red') + '" style="width:' + perf + '%"></div></div> ' + perf + '%</td>' +
      '</tr>';
    });

    h += '</tbody></table></div></div>';

    h += '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
      '<button class="btn btn-primary btn-sm" onclick="exportReportPDF(\'reportTabContent\',\'تقرير الموظفين\')"><i class="ti ti-file-pdf"></i> تصدير PDF</button>' +
      '<button class="btn btn-sm" onclick="exportReportCSV(getEmpReportRows(),\'موظفين\')"><i class="ti ti-file-spreadsheet"></i> تصدير CSV</button>' +
    '</div>';

    c.innerHTML = h;

    window.getEmpReportRows = function() {
      return emps.map(function(e) {
        var empTasks = DB.tasks.filter(function(t) { return t.assigned_to === e.id; });
        var doneTasks = empTasks.filter(function(t) { return t.status === 'done' && t.approved; });
        var empAssignments = DB.assignments.filter(function(a) { return a.employee_id === e.id; });
        var totalHours = empAssignments.reduce(function(s, a) { return s + (a.completed_hours || 0); }, 0);
        return { name: e.full_name, role: e.role, tasks: empTasks.length, done: doneTasks.length, hours: totalHours, cost: totalHours * (e.hour_rate || 0) };
      });
    };
  },

  reportOverdue: function() {
    var DB = NEXORA.DB;
    var H = NEXORA.Helpers;
    var c = document.getElementById('reportTabContent');
    if (!c) return;

    var lateTasks = DB.tasks.filter(function(t) {
      var a = DB.assignments.find(function(x) { return x.task_id === t.id; });
      return a && a.due_date && new Date(a.due_date) < new Date() && t.status !== 'done' && t.status !== 'pending_approval';
    });

    var lateProjects = DB.projects.filter(function(p) {
      return p.status === 'active' && p.end_date && new Date(p.end_date) < new Date() && H.projProgress(p.id) < 100;
    });

    var h = '<div class="stats">' +
      '<div class="stat-card red"><div class="num">' + lateTasks.length + '</div><div class="lbl">مهام متأخرة</div></div>' +
      '<div class="stat-card orange"><div class="num">' + lateProjects.length + '</div><div class="lbl">مشاريع متأخرة</div></div>' +
    '</div>';

    h += '<div class="card"><div class="card-title"><i class="ti ti-alert-triangle" style="color:var(--RE);"></i> المهام المتأخرة</div>';
    if (!lateTasks.length) {
      h += '<div class="empty-state"><i class="ti ti-check-circle"></i>لا توجد مهام متأخرة</div>';
    } else {
      h += '<div style="overflow-x:auto;"><table><thead><tr><th>المهمة</th><th>المشروع</th><th>المسند إلى</th><th>تاريخ التسليم</th><th>الأيام</th></tr></thead><tbody>';
      lateTasks.forEach(function(t) {
        var i = H.itm(t.item_id);
        var u = H.emp(t.assigned_to);
        var a = DB.assignments.find(function(x) { return x.task_id === t.id; });
        var days = Math.ceil((new Date() - new Date(a.due_date)) / (1000 * 60 * 60 * 24));
        var pr = i ? H.proj(i.project_id) : null;
        h += '<tr><td><strong>' + H.esc(t.title) + '</strong></td>' +
          '<td>' + (pr ? H.esc(pr.name) : '—') + '</td>' +
          '<td>' + (u ? H.esc(u.full_name) : '—') + '</td>' +
          '<td>' + new Date(a.due_date).toLocaleDateString('ar-SA') + '</td>' +
          '<td style="color:var(--RE);font-weight:700;">' + days + ' يوم</td></tr>';
      });
      h += '</tbody></table></div>';
    }
    h += '</div>';

    h += '<div class="card"><div class="card-title"><i class="ti ti-clock" style="color:var(--G);"></i> المشاريع المتأخرة</div>';
    if (!lateProjects.length) {
      h += '<div class="empty-state"><i class="ti ti-check-circle"></i>لا توجد مشاريع متأخرة</div>';
    } else {
      lateProjects.forEach(function(p) {
        var pr = H.projProgress(p.id);
        var days = Math.ceil((new Date() - new Date(p.end_date)) / (1000 * 60 * 60 * 24));
        h += '<div class="list-item"><div class="info"><strong>' + H.esc(p.name) + '</strong><small>نسبة الإنجاز: ' + pr + '%</small></div>' +
          '<span style="color:var(--RE);font-weight:700;">متأخر ' + days + ' يوم</span></div>';
      });
    }
    h += '</div>';

    h += '<button class="btn btn-primary btn-sm" onclick="exportReportPDF(\'reportTabContent\',\'تقرير المتأخرات\')"><i class="ti ti-file-pdf"></i> تصدير PDF</button>';

    c.innerHTML = h;
  },

  reportPendingApproval: function() {
    var DB = NEXORA.DB;
    var H = NEXORA.Helpers;
    var c = document.getElementById('reportTabContent');
    if (!c) return;

    var pending = DB.tasks.filter(function(t) { return t.status === 'done' && t.approved === null; });

    var h = '<div class="stats">' +
      '<div class="stat-card gold"><div class="num">' + pending.length + '</div><div class="lbl">مهام بانتظار الاعتماد</div></div>' +
    '</div>';

    h += '<div class="card"><div class="card-title"><i class="ti ti-clock"></i> مهام بانتظار الاعتماد</div>';
    if (!pending.length) {
      h += '<div class="empty-state"><i class="ti ti-check-circle"></i>لا توجد مهام بانتظار الاعتماد</div>';
    } else {
      h += '<div style="overflow-x:auto;"><table><thead><tr><th>المهمة</th><th>البند</th><th>المشروع</th><th>المسند إلى</th><th>الإجراءات</th></tr></thead><tbody>';
      pending.forEach(function(t) {
        var i = H.itm(t.item_id);
        var u = H.emp(t.assigned_to);
        var pr = i ? H.proj(i.project_id) : null;
        h += '<tr><td><strong>' + H.esc(t.title) + '</strong></td>' +
          '<td>' + (i ? H.esc(i.name) : '—') + '</td>' +
          '<td>' + (pr ? H.esc(pr.name) : '—') + '</td>' +
          '<td>' + (u ? H.esc(u.full_name) : '—') + '</td>' +
          '<td><div style="display:flex;gap:4px;">' +
            '<button class="btn btn-success btn-sm" onclick="quickApprove(' + t.id + ',true)"><i class="ti ti-check"></i></button>' +
            '<button class="btn btn-danger btn-sm" onclick="quickApprove(' + t.id + ',false)"><i class="ti ti-x"></i></button>' +
          '</div></td></tr>';
      });
      h += '</tbody></table></div>';
    }
    h += '</div>';

    h += '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
      '<button class="btn btn-primary btn-sm" onclick="exportReportPDF(\'reportTabContent\',\'تقرير الاعتمادات المعلقة\')"><i class="ti ti-file-pdf"></i> تصدير PDF</button>' +
    '</div>';

    c.innerHTML = h;
  },

  renderFilteredReportsInTab: function() {
    var c = document.getElementById('reportTabContent');
    if (!c) return;

    var h = '<div class="card"><div class="card-title"><i class="ti ti-filter"></i> تقارير متقدمة</div>' +
      '<div class="grid-4">' +
        '<div><label>نوع التقرير</label><select id="advReportType" onchange="applyReportFilter()">' +
          '<option value="projects">المشاريع</option>' +
          '<option value="costs">التكاليف</option>' +
          '<option value="tasks">المهام</option>' +
          '<option value="employees">الموظفون</option>' +
          '<option value="delays">التأخيرات</option>' +
        '</select></div>' +
        '<div><label>من تاريخ</label><input type="date" id="advDateFrom" onchange="applyReportFilter()"></div>' +
        '<div><label>إلى تاريخ</label><input type="date" id="advDateTo" onchange="applyReportFilter()"></div>' +
        '<div style="display:flex;align-items:flex-end;"><button class="btn btn-primary btn-sm" onclick="applyReportFilter()"><i class="ti ti-search"></i> بحث</button></div>' +
      '</div>' +
    '</div>' +
    '<div id="advReportResult"></div>' +
    '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;">' +
      '<button class="btn btn-primary btn-sm" onclick="exportReportPDF(\'advReportResult\',\'تقرير متقدم\')"><i class="ti ti-file-pdf"></i> تصدير PDF</button>' +
      '<button class="btn btn-sm" onclick="exportReportCSV(advCsvRows||[],\'تقرير_متقدم\')"><i class="ti ti-file-spreadsheet"></i> تصدير CSV</button>' +
      '<button class="btn btn-g btn-sm" onclick="exportReportJSON()"><i class="ti ti-json"></i> تصدير JSON</button>' +
      '<button class="btn btn-sm" style="background:var(--GR);color:#fff;" onclick="exportAllData()"><i class="ti ti-download"></i> نسخة احتياطية كاملة</button>' +
      '<button class="btn btn-sm btn-danger" onclick="importAllData()"><i class="ti ti-upload"></i> استيراد نسخة احتياطية</button>' +
    '</div>';

    c.innerHTML = h;
    NEXORA.Views.Reports.applyReportFilter();
  },

  applyReportFilter: function() {
    var DB = NEXORA.DB;
    var H = NEXORA.Helpers;
    var type = (document.getElementById('advReportType') || {}).value || 'projects';
    var dateFrom = (document.getElementById('advDateFrom') || {}).value;
    var dateTo = (document.getElementById('advDateTo') || {}).value;
    var rc = document.getElementById('advReportResult');
    if (!rc) return;

    var h = '';
    window.advCsvRows = [];

    if (type === 'projects') {
      var projs = DB.projects.filter(function(p) {
        if (dateFrom && p.start_date && p.start_date < dateFrom) return false;
        if (dateTo && p.end_date && p.end_date > dateTo) return false;
        return true;
      });
      h += '<div class="card"><div class="card-title"><i class="ti ti-folder-open"></i> المشاريع (' + projs.length + ')</div>';
      h += '<div style="overflow-x:auto;"><table><thead><tr><th>المشروع</th><th>الميزانية</th><th>التكلفة</th><th>الربح</th><th>التقدم</th><th>البداية</th><th>النهاية</th></tr></thead><tbody>';
      projs.forEach(function(p) {
        var pp = H.projProfit(p.id);
        var pr = H.projProgress(p.id);
        window.advCsvRows.push({ name: p.name, budget: p.budget, cost: pp.cost, profit: pp.profit, progress: pr });
        h += '<tr><td>' + H.esc(p.name) + '</td><td>' + H.fmt(p.budget) + '</td><td>' + H.fmt(pp.cost) + '</td><td style="color:' + (pp.profit >= 0 ? 'var(--GR)' : 'var(--RE)') + ';font-weight:700;">' + H.fmt(pp.profit) + '</td><td>' + pr + '%</td><td>' + (p.start_date || '—') + '</td><td>' + (p.end_date || '—') + '</td></tr>';
      });
      h += '</tbody></table></div></div>';
    } else if (type === 'costs') {
      var costs = DB.costs || [];
      if (dateFrom) costs = costs.filter(function(c) { return c.date >= dateFrom; });
      if (dateTo) costs = costs.filter(function(c) { return c.date <= dateTo; });
      var totalCosts = costs.reduce(function(s, c) { return s + (c.cost || 0); }, 0);
      h += '<div class="card"><div class="card-title"><i class="ti ti-coin"></i> التكاليف (' + costs.length + ' سجل — إجمالي: ' + H.fmt(totalCosts) + ')</div>';
      h += '<div style="overflow-x:auto;"><table><thead><tr><th>التاريخ</th><th>الموظف</th><th>الساعات</th><th>المعدل</th><th>التكلفة</th></tr></thead><tbody>';
      costs.forEach(function(c) {
        var u = H.emp(c.employee_id);
        var it = H.itm(c.item_id);
        window.advCsvRows.push({ date: c.date, employee: u ? u.full_name : '', hours: c.hours, rate: c.hour_rate, cost: c.cost });
        h += '<tr><td>' + (c.date || '—') + '</td><td>' + (u ? H.esc(u.full_name) : '—') + '</td><td>' + (c.hours || 0) + '</td><td>' + H.fmt(c.hour_rate) + '</td><td>' + H.fmt(c.cost) + '</td></tr>';
      });
      h += '</tbody></table></div></div>';
    } else if (type === 'tasks') {
      var tasks = DB.tasks;
      if (dateFrom) tasks = tasks.filter(function(t) { return t.created_at >= dateFrom || !t.created_at; });
      if (dateTo) tasks = tasks.filter(function(t) { return t.created_at <= dateTo || !t.created_at; });
      h += '<div class="card"><div class="card-title"><i class="ti ti-checklist"></i> المهام (' + tasks.length + ')</div>';
      h += '<div style="overflow-x:auto;"><table><thead><tr><th>المهمة</th><th>البند</th><th>الحالة</th><th>التقدم</th><th>الاعتماد</th></tr></thead><tbody>';
      tasks.forEach(function(t) {
        var i = H.itm(t.item_id);
        var pr = H.taskProgress(t.id);
        var statusMap = { todo: 'badge-todo', in_progress: 'badge-progress', done: 'badge-done', pending_approval: 'badge-pending' };
        var statusLabel = { todo: 'معلقة', in_progress: 'قيد العمل', done: 'منجزة', pending_approval: 'بانتظار' };
        window.advCsvRows.push({ title: t.title, item: i ? i.name : '', status: t.status, progress: pr });
        h += '<tr><td>' + H.esc(t.title) + '</td><td>' + (i ? H.esc(i.name) : '—') + '</td><td><span class="badge ' + (statusMap[t.status] || 'badge-todo') + '">' + (statusLabel[t.status] || t.status) + '</span></td><td>' + pr + '%</td><td>' + (t.approved === true ? '✅' : t.approved === false ? '❌' : '—') + '</td></tr>';
      });
      h += '</tbody></table></div></div>';
    } else if (type === 'employees') {
      var emps = DB.employees.filter(function(e) { return e.company_id === NEXORA.App.cu.company_id; });
      h += '<div class="card"><div class="card-title"><i class="ti ti-users"></i> الموظفون (' + emps.length + ')</div>';
      h += '<div style="overflow-x:auto;"><table><thead><tr><th>الموظف</th><th>البريد</th><th>الدور</th><th>المعدل/ساعة</th><th>المهام</th><th>الساعات</th><th>التكلفة</th></tr></thead><tbody>';
      emps.forEach(function(e) {
        var eTasks = DB.tasks.filter(function(t) { return t.assigned_to === e.id; });
        var eAssigns = DB.assignments.filter(function(a) { return a.employee_id === e.id; });
        var hrs = eAssigns.reduce(function(s, a) { return s + (a.completed_hours || 0); }, 0);
        var cost = hrs * (e.hour_rate || 0);
        window.advCsvRows.push({ name: e.full_name, email: e.email, role: e.role, rate: e.hour_rate, tasks: eTasks.length, hours: hrs, cost: cost });
        h += '<tr><td>' + H.esc(e.full_name) + '</td><td>' + H.esc(e.email) + '</td><td><span class="badge ' + H.esc(NEXORA.Config.ROLES[e.role] || '') + '">' + H.esc(e.role) + '</span></td><td>' + H.fmt(e.hour_rate) + '</td><td>' + eTasks.length + '</td><td>' + H.fmt(hrs) + '</td><td>' + H.fmt(cost) + '</td></tr>';
      });
      h += '</tbody></table></div></div>';
    } else if (type === 'delays') {
      var lateTasks = DB.tasks.filter(function(t) {
        var a = DB.assignments.find(function(x) { return x.task_id === t.id; });
        return a && a.due_date && new Date(a.due_date) < new Date() && t.status !== 'done' && t.status !== 'pending_approval';
      });
      h += '<div class="card"><div class="card-title"><i class="ti ti-alert-triangle" style="color:var(--RE);"></i> التأخيرات (' + lateTasks.length + ')</div>';
      h += '<div style="overflow-x:auto;"><table><thead><tr><th>المهمة</th><th>المشروع</th><th>المسند إلى</th><th>التسليم</th><th>الأيام</th></tr></thead><tbody>';
      lateTasks.forEach(function(t) {
        var i = H.itm(t.item_id);
        var u = H.emp(t.assigned_to);
        var a = DB.assignments.find(function(x) { return x.task_id === t.id; });
        var pr = i ? H.proj(i.project_id) : null;
        var days = a ? Math.ceil((new Date() - new Date(a.due_date)) / (1000 * 60 * 60 * 24)) : 0;
        window.advCsvRows.push({ task: t.title, project: pr ? pr.name : '', employee: u ? u.full_name : '', due: a.due_date, days: days });
        h += '<tr><td>' + H.esc(t.title) + '</td><td>' + (pr ? H.esc(pr.name) : '—') + '</td><td>' + (u ? H.esc(u.full_name) : '—') + '</td><td>' + (a ? new Date(a.due_date).toLocaleDateString('ar-SA') : '—') + '</td><td style="color:var(--RE);font-weight:700;">' + days + '</td></tr>';
      });
      h += '</tbody></table></div></div>';
    }

    rc.innerHTML = h;
  },

  exportReportPDF: function(elementId, title) {
    var el = document.getElementById(elementId);
    if (!el) return;
    if (typeof html2canvas === 'undefined' || typeof jspdf === 'undefined') {
      if (typeof showToast === 'function') showToast('جاري تحميل مكتبات التصدير...', 'info');
      return;
    }
    html2canvas(el, { scale: 2, useCORS: true }).then(function(canvas) {
      var imgData = canvas.toDataURL('image/png');
      var pdf = new jspdf.jsPDF('l', 'mm', 'a4');
      var pdfW = pdf.internal.pageSize.getWidth();
      var pdfH = (canvas.height * pdfW) / canvas.width;
      pdf.setFontSize(16);
      pdf.text(title || 'TADR', pdfW / 2, 15, { align: 'center' });
      pdf.addImage(imgData, 'PNG', 5, 20, pdfW - 10, pdfH);
      pdf.save((title || 'report') + '.pdf');
      if (typeof showToast === 'function') showToast('تم التصدير بنجاح', 'success');
    }).catch(function() {
      if (typeof showToast === 'function') showToast('حدث خطأ أثناء التصدير', 'error');
    });
  },

  exportReportCSV: function(rows, filename) {
    if (!rows || !rows.length) return;
    var keys = Object.keys(rows[0]);
    var csv = '\uFEFF' + keys.join(',') + '\n' + rows.map(function(r) {
      return keys.map(function(k) {
        var v = r[k] == null ? '' : String(r[k]);
        return '"' + v.replace(/"/g, '""') + '"';
      }).join(',');
    }).join('\n');
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = (filename || 'report') + '.csv';
    a.click();
    URL.revokeObjectURL(url);
    if (typeof showToast === 'function') showToast('تم تصدير CSV', 'success');
  },

  exportReportJSON: function() {
    var DB = NEXORA.DB;
    var data = {};
    NEXORA.Config.DB_TABLES.forEach(function(t) { data[t] = DB[t] || []; });
    var json = JSON.stringify(data, null, 2);
    var blob = new Blob([json], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'nexora_backup_' + new Date().toISOString().split('T')[0] + '.json';
    a.click();
    URL.revokeObjectURL(url);
    if (typeof showToast === 'function') showToast('تم تصدير النسخة الاحتياطية', 'success');
  },

  exportAllData: function() {
    NEXORA.Views.Reports.exportReportJSON();
  },

  importAllData: function() {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = function(e) {
      var file = e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function(ev) {
        try {
          var data = JSON.parse(ev.target.result);
          if (!data || typeof data !== 'object') {
            if (typeof showToast === 'function') showToast('ملف غير صالح', 'error');
            return;
          }
          var DB = NEXORA.DB;
          var imported = 0;
          NEXORA.Config.DB_TABLES.forEach(function(t) {
            if (!Array.isArray(data[t])) return;
            data[t].forEach(function(item) {
              var exists = DB[t].some(function(x) { return x.id === item.id; });
              if (!exists) {
                DB[t].push(item);
                imported++;
              }
            });
          });
          DB.save();
          if (typeof showToast === 'function') showToast('تم الاستيراد: ' + imported + ' سجل', 'success');
          NEXORA.Views.Reports.render();
        } catch (err) {
          if (typeof showToast === 'function') showToast('خطأ في قراءة الملف', 'error');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }
};

window.renderReports = function() { NEXORA.Views.Reports.render(); };
window.switchReportTab = function(id, btn) { NEXORA.Views.Reports.switchTab(id, btn); };
window.applyReportFilter = function() { NEXORA.Views.Reports.applyReportFilter(); };
window.exportReportPDF = function(a, b) { NEXORA.Views.Reports.exportReportPDF(a, b); };
window.exportReportCSV = function(a, b) { NEXORA.Views.Reports.exportReportCSV(a, b); };
window.exportReportJSON = function() { NEXORA.Views.Reports.exportReportJSON(); };
window.exportAllData = function() { NEXORA.Views.Reports.exportAllData(); };
window.importAllData = function() { NEXORA.Views.Reports.importAllData(); };
