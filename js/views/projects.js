window.NEXORA = window.NEXORA || {};

NEXORA.Views = NEXORA.Views || {};

NEXORA.Views.Projects = {
  render: function() {
    var App = NEXORA.App;
    var DB = NEXORA.DB;
    var H = NEXORA.Helpers;
    var cu = App.cu;
    var el = document.getElementById('projectsContent');
    if (!el) return;

    var h = '<div class="card"><div class="card-title"><i class="ti ti-plus"></i> مشروع جديد</div>' +
      '<div id="projMsg" class="message-box"></div>' +
      '<div class="grid-4">' +
        '<div><label>الاسم</label><input type="text" id="fProjName" placeholder=" مشروع برج سكني"></div>' +
        '<div><label>الميزانية</label><input type="number" id="fProjBudget" placeholder="2000000"></div>' +
        '<div><label>البداية</label><input type="date" id="fProjStart"></div>' +
        '<div><label>النهاية</label><input type="date" id="fProjEnd"></div>' +
      '</div>' +
      '<button class="btn btn-primary" onclick="createProject()"><i class="ti ti-device-floppy"></i> إنشاء</button>' +
    '</div>' +
    '<div class="card"><div class="card-title"><i class="ti ti-list"></i> جميع المشاريع</div><div id="projList"></div></div>';

    el.innerHTML = h;

    var projList = document.getElementById('projList');
    if (!projList) return;

    if (!DB.projects.length) {
      projList.innerHTML = '<div class="empty-state"><i class="ti ti-folder-open"></i>لا توجد</div>';
      return;
    }

    projList.innerHTML = DB.projects.map(function(p) {
      var pr = H.projProgress(p.id);
      var pc = pr >= 75 ? 'green' : pr >= 40 ? 'orange' : 'purple';
      var its = DB.items.filter(function(x) { return x.project_id === p.id; }).length;
      return '<div class="list-item" style="cursor:pointer;" onclick="openProject(' + p.id + ')">' +
        '<div class="info"><strong>' + H.esc(p.name) + '</strong><small>' + its + ' بنود</small><small>' + H.fmt(p.budget) + ' ريال</small></div>' +
        '<div style="text-align:left;min-width:120px;"><span style="font-weight:700;">' + pr + '%</span><div class="progress-bar"><div class="progress-fill ' + pc + '" style="width:' + pr + '%"></div></div></div>' +
      '</div>';
    }).join('');
  },

  create: function() {
    var App = NEXORA.App;
    var DB = NEXORA.DB;
    var H = NEXORA.Helpers;
    var cu = App.cu;

    var n = document.getElementById('fProjName').value.trim();
    var b = parseFloat(document.getElementById('fProjBudget').value) || 0;
    if (!n) return H.msg('projMsg', 'أدخل الاسم', 'error');

    DB.projects.push({
      id: H.gf(DB.projects),
      company_id: cu.company_id || 1,
      name: n,
      budget: b,
      start_date: document.getElementById('fProjStart').value,
      end_date: document.getElementById('fProjEnd').value,
      status: 'active'
    });
    DB.save();
    H.msg('projMsg', '✅ تم', 'success');
    document.getElementById('fProjName').value = '';
    document.getElementById('fProjBudget').value = '';
    document.getElementById('fProjStart').value = '';
    document.getElementById('fProjEnd').value = '';
    NEXORA.Views.Projects.render();
    if (typeof renderDashboard === 'function') renderDashboard();
  },

  open: function(pid) {
    var App = NEXORA.App;
    App.curProjId = pid;
    if (typeof window._showView === 'function') window._showView('project');
    else if (typeof showView === 'function') showView('project');
    if (typeof renderProjectDetail === 'function') renderProjectDetail();
  },

  switchTab: function(tab, btn) {
    var projTabContents = document.querySelectorAll('#projectContent .tab-content');
    var projTabBtns = document.querySelectorAll('#projectContent .tab-btn');
    projTabContents.forEach(function(x) { x.classList.remove('active'); });
    projTabBtns.forEach(function(x) { x.classList.remove('active'); });
    if (btn) btn.classList.add('active');
    var el = document.getElementById('proj' + (tab === 'items' ? 'Items' : 'Gantt') + 'Tab');
    if (el) el.classList.add('active');
    if (tab === 'gantt' && typeof renderGantt === 'function') renderGantt();
  }
};

window.renderProjects = function() { NEXORA.Views.Projects.render(); };
window.createProject = function() { NEXORA.Views.Projects.create(); };
window.openProject = function(pid) { NEXORA.Views.Projects.open(pid); };
window.switchProjTab = function(t, b) { NEXORA.Views.Projects.switchTab(t, b); };
