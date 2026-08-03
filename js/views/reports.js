window.NEXORA = window.NEXORA || {};

NEXORA.Views = NEXORA.Views || {};

NEXORA.Views.Reports = {
  render: function() {
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

  _showLoading: function() {
    var c = document.getElementById('reportTabContent');
    if (c) c.innerHTML = '<div class="card"><div class="empty-state"><i class="ti ti-loader"></i>جاري التحميل...</div></div>';
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

  reportProjects: async function() {
    this._showLoading();
    var H = NEXORA.Helpers;
    var c = document.getElementById('reportTabContent');
    if (!c) return;

    try {
      var projects = await NEXORA.Repositories.projects.list();
      var costs = await NEXORA.Repositories.costs.list();
      var items = await NEXORA.Repositories.items.list();
      
      var projCost = function(pid) {
        return costs.filter(x => String(x.project_id) === String(pid)).reduce((s, x) => s + (x.cost || x.amount || 0), 0);
      };
      var projProgress = function(pid) {
        var its = items.filter(x => String(x.project_id) === String(pid));
        if (!its.length) return 0;
        var done = its.reduce((s, x) => s + (x.progress || 0), 0);
        return Math.round(done / its.length);
      };

      var totalBudget = projects.reduce((s, p) => s + (p.budget || 0), 0);
      var totalCost = projects.reduce((s, p) => s + projCost(p.id), 0);
      var activeCount = projects.filter(p => p.status === 'active').length;

      var h = '<div class="stats">' +
        '<div class="stat-card blue"><div class="num">' + projects.length + '</div><div class="lbl">إجمالي المشاريع</div></div>' +
        '<div class="stat-card gold"><div class="num">' + activeCount + '</div><div class="lbl">مشاريع نشطة</div></div>' +
        '<div class="stat-card green"><div class="num">' + H.fmt(totalBudget) + '</div><div class="lbl">إجمالي الميزانية</div></div>' +
        '<div class="stat-card red"><div class="num">' + H.fmt(totalCost) + '</div><div class="lbl">إجمالي التكاليف</div></div>' +
      '</div>';

      h += '<div class="card"><div class="card-title"><i class="ti ti-folder-open"></i> تقرير المشاريع</div>' +
        '<div style="overflow-x:auto;"><table><thead><tr><th>المشروع</th><th>الميزانية</th><th>التكلفة</th><th>الربح/الخسارة</th><th>التقدم</th><th>الحالة</th></tr></thead><tbody>';

      projects.forEach(function(p) {
        var pc = projCost(p.id);
        var pp = (p.budget || 0) - pc;
        var pr = projProgress(p.id);
        var prCls = pr >= 75 ? 'green' : pr >= 40 ? 'gold' : 'blue';
        h += '<tr style="cursor:pointer;" onclick="openProject(' + p.id + ')">' +
          '<td><strong>' + H.esc(p.name) + '</strong></td>' +
          '<td>' + H.fmt(p.budget) + '</td>' +
          '<td>' + H.fmt(pc) + '</td>' +
          '<td style="color:' + (pp >= 0 ? 'var(--GR)' : 'var(--RE)') + ';font-weight:700;">' + H.fmt(pp) + '</td>' +
          '<td><div class="progress-bar" style="width:100px;display:inline-block;vertical-align:middle;"><div class="progress-fill ' + prCls + '" style="width:' + pr + '%"></div></div> ' + pr + '%</td>' +
          '<td><span class="badge ' + (p.status === 'active' ? 'badge-progress' : 'badge-done') + '">' + (p.status === 'active' ? 'نشط' : 'مكتمل') + '</span></td>' +
        '</tr>';
      });

      h += '</tbody></table></div></div>';

      h += '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
        '<button class="btn btn-primary btn-sm" type="button" disabled aria-disabled="true" title="تصدير PDF غير متاح حالياً بسبب قيود دعم العربية RTL"><i class="ti ti-file-pdf"></i> تصدير PDF (غير متاح)</button>' +
        '<button class="btn btn-sm" onclick="exportReportCSV(getProjectReportRows(),\'مشاريع\')"><i class="ti ti-file-spreadsheet"></i> تصدير CSV</button>' +
        '<button class="btn btn-g btn-sm" onclick="exportReportJSON()"><i class="ti ti-json"></i> تصدير JSON</button>' +
      '</div>';

      c.innerHTML = h;

      window.getProjectReportRows = function() {
        return projects.map(function(p) {
          var pc = projCost(p.id);
          var pp = (p.budget || 0) - pc;
          return { name: p.name, budget: p.budget, cost: pc, profit: pp, progress: projProgress(p.id), status: p.status };
        });
      };
    } catch(err) {
      c.innerHTML = '<div class="empty-state"><i class="ti ti-alert-triangle" style="color:var(--ER);"></i>حدث خطأ: ' + H.esc(err.message) + '</div>';
    }
  },

  reportBudget: async function() {
    this._showLoading();
    var H = NEXORA.Helpers;
    var c = document.getElementById('reportTabContent');
    if (!c) return;

    try {
      var projects = await NEXORA.Repositories.projects.list();
      var items = await NEXORA.Repositories.items.list();
      var costs = await NEXORA.Repositories.costs.list();

      var projCost = function(pid) {
        return costs.filter(x => String(x.project_id) === String(pid)).reduce((s, x) => s + (x.cost || x.amount || 0), 0);
      };
      var itemCost = function(iid) {
        return costs.filter(x => String(x.item_id) === String(iid)).reduce((s, x) => s + (x.cost || x.amount || 0), 0);
      };

      var h = '<div class="card"><div class="card-title"><i class="ti ti-coin"></i> الميزانية مقابل التنفيذ الفعلي</div>' +
        '<div style="overflow-x:auto;"><table><thead><tr><th>المشروع</th><th>الميزانية</th><th>التكلفة الفعلية</th><th>الفرق</th><th>النسبة</th></tr></thead><tbody>';

      projects.forEach(function(p) {
        var pc = projCost(p.id);
        var ratio = p.budget ? Math.round(pc / p.budget * 100) : 0;
        var diff = (p.budget || 0) - pc;
        var diffColor = diff >= 0 ? 'var(--GR)' : 'var(--RE)';
        h += '<tr>' +
          '<td><strong>' + H.esc(p.name) + '</strong></td>' +
          '<td>' + H.fmt(p.budget) + '</td>' +
          '<td>' + H.fmt(pc) + '</td>' +
          '<td style="color:' + diffColor + ';font-weight:700;">' + H.fmt(diff) + '</td>' +
          '<td><div class="progress-bar" style="width:100px;display:inline-block;vertical-align:middle;"><div class="progress-fill ' + (ratio > 100 ? 'red' : ratio > 75 ? 'orange' : 'green') + '" style="width:' + Math.min(ratio, 100) + '%"></div></div> ' + ratio + '%</td>' +
        '</tr>';
      });

      h += '</tbody></table></div></div>';

      projects.forEach(function(p) {
        var pItems = items.filter(function(x) { return String(x.project_id) === String(p.id); });
        if (!pItems.length) return;
        h += '<div class="card"><div class="card-title"><i class="ti ti-list"></i> ' + H.esc(p.name) + ' — البنود</div>' +
          '<div style="overflow-x:auto;"><table><thead><tr><th>البند</th><th>الميزانية</th><th>التكلفة</th><th>الفرق</th></tr></thead><tbody>';
        pItems.forEach(function(it) {
          var ic = itemCost(it.id);
          var diff = (it.budget || 0) - ic;
          h += '<tr><td>' + H.esc(it.name) + '</td><td>' + H.fmt(it.budget) + '</td><td>' + H.fmt(ic) + '</td><td style="color:' + (diff >= 0 ? 'var(--GR)' : 'var(--RE)') + ';font-weight:700;">' + H.fmt(diff) + '</td></tr>';
        });
        h += '</tbody></table></div></div>';
      });

      h += '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
        '<button class="btn btn-primary btn-sm" type="button" disabled aria-disabled="true" title="تصدير PDF غير متاح حالياً بسبب قيود دعم العربية RTL"><i class="ti ti-file-pdf"></i> تصدير PDF (غير متاح)</button>' +
      '</div>';

      c.innerHTML = h;
    } catch(err) {
      c.innerHTML = '<div class="empty-state"><i class="ti ti-alert-triangle" style="color:var(--ER);"></i>حدث خطأ: ' + H.esc(err.message) + '</div>';
    }
  },

  reportEmployees: async function() {
    this._showLoading();
    var H = NEXORA.Helpers;
    var cu = NEXORA.App.cu;
    var c = document.getElementById('reportTabContent');
    if (!c) return;

    try {
      var allEmps = await NEXORA.Repositories.employees.list();
      var allTasks = await NEXORA.Repositories.tasks.list();
      var allAssignments = await NEXORA.Repositories.assignments.list();

      var emps = allEmps.filter(e => cu && cu.company_id ? String(e.company_id) === String(cu.company_id) : true);

      var h = '<div class="card"><div class="card-title"><i class="ti ti-users"></i> أداء الموظفين</div>' +
        '<div style="overflow-x:auto;"><table><thead><tr><th>الموظف</th><th>الدور</th><th>المهام</th><th>المهام المنجزة</th><th>الساعات</th><th>التكلفة</th><th>الأداء</th></tr></thead><tbody>';

      emps.forEach(function(e) {
        var empTasks = allTasks.filter(function(t) { return String(t.assigned_to) === String(e.id); });
        var doneTasks = empTasks.filter(function(t) { return t.status === 'done' && t.approved; });
        var empAssignments = allAssignments.filter(function(a) { return String(a.employee_id) === String(e.id); });
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
        '<button class="btn btn-primary btn-sm" type="button" disabled aria-disabled="true" title="تصدير PDF غير متاح حالياً بسبب قيود دعم العربية RTL"><i class="ti ti-file-pdf"></i> تصدير PDF (غير متاح)</button>' +
        '<button class="btn btn-sm" onclick="exportReportCSV(getEmpReportRows(),\'موظفين\')"><i class="ti ti-file-spreadsheet"></i> تصدير CSV</button>' +
      '</div>';

      c.innerHTML = h;

      window.getEmpReportRows = function() {
        return emps.map(function(e) {
          var empTasks = allTasks.filter(function(t) { return String(t.assigned_to) === String(e.id); });
          var doneTasks = empTasks.filter(function(t) { return t.status === 'done' && t.approved; });
          var empAssignments = allAssignments.filter(function(a) { return String(a.employee_id) === String(e.id); });
          var totalHours = empAssignments.reduce(function(s, a) { return s + (a.completed_hours || 0); }, 0);
          return { name: e.full_name, role: e.role, tasks: empTasks.length, done: doneTasks.length, hours: totalHours, cost: totalHours * (e.hour_rate || 0) };
        });
      };
    } catch(err) {
      c.innerHTML = '<div class="empty-state"><i class="ti ti-alert-triangle" style="color:var(--ER);"></i>حدث خطأ: ' + H.esc(err.message) + '</div>';
    }
  },

  reportOverdue: async function() {
    this._showLoading();
    var H = NEXORA.Helpers;
    var c = document.getElementById('reportTabContent');
    if (!c) return;

    try {
      var allTasks = await NEXORA.Repositories.tasks.list();
      var allAssignments = await NEXORA.Repositories.assignments.list();
      var allProjects = await NEXORA.Repositories.projects.list();
      var allItems = await NEXORA.Repositories.items.list();
      var allEmps = await NEXORA.Repositories.employees.list();

      var projProgress = function(pid) {
        var its = allItems.filter(x => String(x.project_id) === String(pid));
        if (!its.length) return 0;
        var done = its.reduce((s, x) => s + (x.progress || 0), 0);
        return Math.round(done / its.length);
      };

      var lateTasks = allTasks.filter(function(t) {
        var a = allAssignments.find(function(x) { return String(x.task_id) === String(t.id); });
        return a && a.due_date && new Date(a.due_date) < new Date() && t.status !== 'done' && t.status !== 'pending_approval';
      });

      var lateProjects = allProjects.filter(function(p) {
        return p.status === 'active' && p.end_date && new Date(p.end_date) < new Date() && projProgress(p.id) < 100;
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
          var i = allItems.find(it => String(it.id) === String(t.item_id));
          var u = allEmps.find(e => String(e.id) === String(t.assigned_to));
          var a = allAssignments.find(function(x) { return String(x.task_id) === String(t.id); });
          var days = Math.ceil((new Date() - new Date(a.due_date)) / (1000 * 60 * 60 * 24));
          var pr = i ? allProjects.find(p => String(p.id) === String(i.project_id)) : null;
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
          var pr = projProgress(p.id);
          var days = Math.ceil((new Date() - new Date(p.end_date)) / (1000 * 60 * 60 * 24));
          h += '<div class="list-item"><div class="info"><strong>' + H.esc(p.name) + '</strong><small>نسبة الإنجاز: ' + pr + '%</small></div>' +
            '<span style="color:var(--RE);font-weight:700;">متأخر ' + days + ' يوم</span></div>';
        });
      }
      h += '</div>';

      h += '<button class="btn btn-primary btn-sm" type="button" disabled aria-disabled="true" title="تصدير PDF غير متاح حالياً بسبب قيود دعم العربية RTL"><i class="ti ti-file-pdf"></i> تصدير PDF (غير متاح)</button>';

      c.innerHTML = h;
    } catch(err) {
      c.innerHTML = '<div class="empty-state"><i class="ti ti-alert-triangle" style="color:var(--ER);"></i>حدث خطأ: ' + H.esc(err.message) + '</div>';
    }
  },

  reportPendingApproval: async function() {
    this._showLoading();
    var H = NEXORA.Helpers;
    var c = document.getElementById('reportTabContent');
    if (!c) return;

    try {
      var allTasks = await NEXORA.Repositories.tasks.list();
      var allItems = await NEXORA.Repositories.items.list();
      var allProjects = await NEXORA.Repositories.projects.list();
      var allEmps = await NEXORA.Repositories.employees.list();

      var pending = allTasks.filter(function(t) { return t.status === 'done' && t.approved === null; });

      var h = '<div class="stats">' +
        '<div class="stat-card gold"><div class="num">' + pending.length + '</div><div class="lbl">مهام بانتظار الاعتماد</div></div>' +
      '</div>';

      h += '<div class="card"><div class="card-title"><i class="ti ti-clock"></i> مهام بانتظار الاعتماد</div>';
      if (!pending.length) {
        h += '<div class="empty-state"><i class="ti ti-check-circle"></i>لا توجد مهام بانتظار الاعتماد</div>';
      } else {
        h += '<div style="overflow-x:auto;"><table><thead><tr><th>المهمة</th><th>البند</th><th>المشروع</th><th>المسند إلى</th><th>الإجراءات</th></tr></thead><tbody>';
        pending.forEach(function(t) {
          var i = allItems.find(it => String(it.id) === String(t.item_id));
          var u = allEmps.find(e => String(e.id) === String(t.assigned_to));
          var pr = i ? allProjects.find(p => String(p.id) === String(i.project_id)) : null;
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
        '<button class="btn btn-primary btn-sm" type="button" disabled aria-disabled="true" title="تصدير PDF غير متاح حالياً بسبب قيود دعم العربية RTL"><i class="ti ti-file-pdf"></i> تصدير PDF (غير متاح)</button>' +
      '</div>';

      c.innerHTML = h;
    } catch(err) {
      c.innerHTML = '<div class="empty-state"><i class="ti ti-alert-triangle" style="color:var(--ER);"></i>حدث خطأ: ' + H.esc(err.message) + '</div>';
    }
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
      '<button class="btn btn-primary btn-sm" type="button" disabled aria-disabled="true" title="تصدير PDF غير متاح حالياً بسبب قيود دعم العربية RTL"><i class="ti ti-file-pdf"></i> تصدير PDF (غير متاح)</button>' +
      '<button class="btn btn-sm" onclick="exportReportCSV(advCsvRows||[],\'تقرير_متقدم\')"><i class="ti ti-file-spreadsheet"></i> تصدير CSV</button>' +
      '<button class="btn btn-g btn-sm" onclick="exportReportJSON()"><i class="ti ti-json"></i> تصدير JSON</button>' +
      '<button class="btn btn-sm" style="background:var(--GR);color:#fff;" onclick="exportAllData()"><i class="ti ti-download"></i> نسخة احتياطية كاملة</button>' +
      '<button class="btn btn-sm btn-danger" onclick="importAllData()"><i class="ti ti-upload"></i> استيراد نسخة احتياطية</button>' +
    '</div>';

    c.innerHTML = h;
    NEXORA.Views.Reports.applyReportFilter();
  },

  applyReportFilter: async function() {
    var H = NEXORA.Helpers;
    var type = (document.getElementById('advReportType') || {}).value || 'projects';
    var dateFrom = (document.getElementById('advDateFrom') || {}).value;
    var dateTo = (document.getElementById('advDateTo') || {}).value;
    var rc = document.getElementById('advReportResult');
    if (!rc) return;

    rc.innerHTML = '<div class="empty-state"><i class="ti ti-loader"></i>جاري التحميل...</div>';
    
    try {
      var h = '';
      window.advCsvRows = [];
      
      var allProjects = await NEXORA.Repositories.projects.list();
      var allTasks = await NEXORA.Repositories.tasks.list();
      var allCosts = await NEXORA.Repositories.costs.list();
      var allItems = await NEXORA.Repositories.items.list();
      var allEmps = await NEXORA.Repositories.employees.list();
      var allAssignments = await NEXORA.Repositories.assignments.list();

      if (type === 'projects') {
        var projs = allProjects.filter(function(p) {
          if (dateFrom && p.start_date && p.start_date < dateFrom) return false;
          if (dateTo && p.end_date && p.end_date > dateTo) return false;
          return true;
        });
        h += '<div class="card"><div class="card-title"><i class="ti ti-folder-open"></i> المشاريع (' + projs.length + ')</div>';
        h += '<div style="overflow-x:auto;"><table><thead><tr><th>المشروع</th><th>الميزانية</th><th>التكلفة</th><th>الربح</th><th>التقدم</th><th>البداية</th><th>النهاية</th></tr></thead><tbody>';
        projs.forEach(function(p) {
          var pc = allCosts.filter(x => String(x.project_id) === String(p.id)).reduce((s, x) => s + (x.cost || x.amount || 0), 0);
          var pp = (p.budget || 0) - pc;
          
          var pItems = allItems.filter(x => String(x.project_id) === String(p.id));
          var pr = pItems.length ? Math.round(pItems.reduce((s, x) => s + (x.progress || 0), 0) / pItems.length) : 0;
          
          window.advCsvRows.push({ name: p.name, budget: p.budget, cost: pc, profit: pp, progress: pr });
          h += '<tr><td>' + H.esc(p.name) + '</td><td>' + H.fmt(p.budget) + '</td><td>' + H.fmt(pc) + '</td><td style="color:' + (pp >= 0 ? 'var(--GR)' : 'var(--RE)') + ';font-weight:700;">' + H.fmt(pp) + '</td><td>' + pr + '%</td><td>' + (p.start_date || '—') + '</td><td>' + (p.end_date || '—') + '</td></tr>';
        });
        h += '</tbody></table></div></div>';
      } else if (type === 'costs') {
        var costs = allCosts;
        if (dateFrom) costs = costs.filter(function(c) { return c.date >= dateFrom; });
        if (dateTo) costs = costs.filter(function(c) { return c.date <= dateTo; });
        var totalCosts = costs.reduce(function(s, c) { return s + (c.cost || 0); }, 0);
        h += '<div class="card"><div class="card-title"><i class="ti ti-coin"></i> التكاليف (' + costs.length + ' سجل — إجمالي: ' + H.fmt(totalCosts) + ')</div>';
        h += '<div style="overflow-x:auto;"><table><thead><tr><th>التاريخ</th><th>الموظف</th><th>الساعات</th><th>المعدل</th><th>التكلفة</th></tr></thead><tbody>';
        costs.forEach(function(c) {
          var u = allEmps.find(e => String(e.id) === String(c.employee_id));
          window.advCsvRows.push({ date: c.date, employee: u ? u.full_name : '', hours: c.hours, rate: c.hour_rate, cost: c.cost });
          h += '<tr><td>' + (c.date || '—') + '</td><td>' + (u ? H.esc(u.full_name) : '—') + '</td><td>' + (c.hours || 0) + '</td><td>' + H.fmt(c.hour_rate) + '</td><td>' + H.fmt(c.cost) + '</td></tr>';
        });
        h += '</tbody></table></div></div>';
      } else if (type === 'tasks') {
        var tasks = allTasks;
        if (dateFrom) tasks = tasks.filter(function(t) { return t.created_at >= dateFrom || !t.created_at; });
        if (dateTo) tasks = tasks.filter(function(t) { return t.created_at <= dateTo || !t.created_at; });
        h += '<div class="card"><div class="card-title"><i class="ti ti-checklist"></i> المهام (' + tasks.length + ')</div>';
        h += '<div style="overflow-x:auto;"><table><thead><tr><th>المهمة</th><th>البند</th><th>الحالة</th><th>التقدم</th><th>الاعتماد</th></tr></thead><tbody>';
        tasks.forEach(function(t) {
          var i = allItems.find(it => String(it.id) === String(t.item_id));
          var pr = t.status === 'done' ? 100 : (t.status === 'in_progress' ? 50 : 0);
          var statusMap = { todo: 'badge-todo', in_progress: 'badge-progress', done: 'badge-done', pending_approval: 'badge-pending' };
          var statusLabel = { todo: 'معلقة', in_progress: 'قيد العمل', done: 'منجزة', pending_approval: 'بانتظار' };
          window.advCsvRows.push({ title: t.title, item: i ? i.name : '', status: t.status, progress: pr });
          h += '<tr><td>' + H.esc(t.title) + '</td><td>' + (i ? H.esc(i.name) : '—') + '</td><td><span class="badge ' + (statusMap[t.status] || 'badge-todo') + '">' + (statusLabel[t.status] || t.status) + '</span></td><td>' + pr + '%</td><td>' + (t.approved === true ? '✅' : t.approved === false ? '❌' : '—') + '</td></tr>';
        });
        h += '</tbody></table></div></div>';
      } else if (type === 'employees') {
        var emps = allEmps.filter(function(e) { return String(e.company_id) === String(NEXORA.App.cu.company_id); });
        h += '<div class="card"><div class="card-title"><i class="ti ti-users"></i> الموظفون (' + emps.length + ')</div>';
        h += '<div style="overflow-x:auto;"><table><thead><tr><th>الموظف</th><th>البريد</th><th>الدور</th><th>المعدل/ساعة</th><th>المهام</th><th>الساعات</th><th>التكلفة</th></tr></thead><tbody>';
        emps.forEach(function(e) {
          var eTasks = allTasks.filter(function(t) { return String(t.assigned_to) === String(e.id); });
          var eAssigns = allAssignments.filter(function(a) { return String(a.employee_id) === String(e.id); });
          var hrs = eAssigns.reduce(function(s, a) { return s + (a.completed_hours || 0); }, 0);
          var cost = hrs * (e.hour_rate || 0);
          window.advCsvRows.push({ name: e.full_name, email: e.email, role: e.role, rate: e.hour_rate, tasks: eTasks.length, hours: hrs, cost: cost });
          h += '<tr><td>' + H.esc(e.full_name) + '</td><td>' + H.esc(e.email) + '</td><td><span class="badge ' + H.esc(NEXORA.Config.ROLES[e.role] || '') + '">' + H.esc(e.role) + '</span></td><td>' + H.fmt(e.hour_rate) + '</td><td>' + eTasks.length + '</td><td>' + H.fmt(hrs) + '</td><td>' + H.fmt(cost) + '</td></tr>';
        });
        h += '</tbody></table></div></div>';
      } else if (type === 'delays') {
        var lateTasks = allTasks.filter(function(t) {
          var a = allAssignments.find(function(x) { return String(x.task_id) === String(t.id); });
          return a && a.due_date && new Date(a.due_date) < new Date() && t.status !== 'done' && t.status !== 'pending_approval';
        });
        h += '<div class="card"><div class="card-title"><i class="ti ti-alert-triangle" style="color:var(--RE);"></i> التأخيرات (' + lateTasks.length + ')</div>';
        h += '<div style="overflow-x:auto;"><table><thead><tr><th>المهمة</th><th>المشروع</th><th>المسند إلى</th><th>التسليم</th><th>الأيام</th></tr></thead><tbody>';
        lateTasks.forEach(function(t) {
          var i = allItems.find(it => String(it.id) === String(t.item_id));
          var u = allEmps.find(e => String(e.id) === String(t.assigned_to));
          var a = allAssignments.find(function(x) { return String(x.task_id) === String(t.id); });
          var pr = i ? allProjects.find(p => String(p.id) === String(i.project_id)) : null;
          var days = a ? Math.ceil((new Date() - new Date(a.due_date)) / (1000 * 60 * 60 * 24)) : 0;
          window.advCsvRows.push({ task: t.title, project: pr ? pr.name : '', employee: u ? u.full_name : '', due: a.due_date, days: days });
          h += '<tr><td>' + H.esc(t.title) + '</td><td>' + (pr ? H.esc(pr.name) : '—') + '</td><td>' + (u ? H.esc(u.full_name) : '—') + '</td><td>' + (a ? new Date(a.due_date).toLocaleDateString('ar-SA') : '—') + '</td><td style="color:var(--RE);font-weight:700;">' + days + '</td></tr>';
        });
        h += '</tbody></table></div></div>';
      }

      rc.innerHTML = h;
    } catch(err) {
      rc.innerHTML = '<div class="empty-state"><i class="ti ti-alert-triangle" style="color:var(--ER);"></i>حدث خطأ: ' + H.esc(err.message) + '</div>';
    }
  },

  exportReportPDF: function() {
    if (typeof showToast === 'function') {
      showToast('تصدير PDF غير متاح حالياً بسبب قيود دعم العربية RTL', 'info');
    }
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

  exportReportJSON: async function() {
    try {
      if (typeof showToast === 'function') showToast('جاري تجهيز النسخة الاحتياطية...', 'info');
      var data = {};
      
      for (var t of NEXORA.Config.DB_TABLES) {
        if(NEXORA.Repositories[t]) {
           data[t] = await NEXORA.Repositories[t].list();
        }
      }
      
      var json = JSON.stringify(data, null, 2);
      var blob = new Blob([json], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'nexora_backup_' + new Date().toISOString().split('T')[0] + '.json';
      a.click();
      URL.revokeObjectURL(url);
      if (typeof showToast === 'function') showToast('تم تصدير النسخة الاحتياطية', 'success');
    } catch(err) {
      if (typeof showToast === 'function') showToast('حدث خطأ أثناء التصدير', 'error');
    }
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
      reader.onload = async function(ev) {
        try {
          var data = JSON.parse(ev.target.result);
          if (!data || typeof data !== 'object') {
            if (typeof showToast === 'function') showToast('ملف غير صالح', 'error');
            return;
          }
          
          if (typeof showToast === 'function') showToast('جاري استيراد البيانات...', 'info');
          
          var imported = 0;
          for (var t of NEXORA.Config.DB_TABLES) {
            if (!Array.isArray(data[t]) || !NEXORA.Repositories[t]) continue;
            var existing = await NEXORA.Repositories[t].list();
            
            for (var item of data[t]) {
              var exists = existing.some(x => String(x.id) === String(item.id));
              if (!exists) {
                // To avoid ID collisions, we may need to omit 'id' if serial, but for legacy it might be needed.
                // We'll let the Repositories deal with it, or maybe use raw insert.
                await NEXORA.Repositories[t].create(item);
                imported++;
              }
            }
          }
          if (typeof showToast === 'function') showToast('تم الاستيراد: ' + imported + ' سجل', 'success');
          NEXORA.Views.Reports.render();
        } catch (err) {
          console.error(err);
          if (typeof showToast === 'function') showToast('خطأ في الاستيراد', 'error');
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
