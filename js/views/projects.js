window.NEXORA = window.NEXORA || {};

NEXORA.Views = NEXORA.Views || {};

NEXORA.Views.Projects = {
  render: async function() {
    var App = NEXORA.App;
    var H = NEXORA.Helpers;
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
      '<button class="btn btn-primary" onclick="createProject()" id="btnCreateProj"><i class="ti ti-device-floppy"></i> إنشاء</button>' +
    '</div>' +
    '<div class="card"><div class="card-title"><i class="ti ti-list"></i> جميع المشاريع</div><div id="projList"><div class="empty-state"><i class="ti ti-loader"></i>جاري التحميل...</div></div></div>';

    el.innerHTML = h;

    var projList = document.getElementById('projList');
    if (!projList) return;

    try {
      const projects = await NEXORA.Repositories.projects.list({}, { orderBy: 'id', ascending: false });
      const items = await NEXORA.Repositories.items.list(); // Needed for item counts

      if (!projects.length) {
        projList.innerHTML = '<div class="empty-state"><i class="ti ti-folder-open"></i>لا توجد مشاريع</div>';
        return;
      }

      projList.innerHTML = projects.map(function(p) {
        // We simulate progress for now since full calculation requires all DB tables.
        // In a real implementation, a backend RPC would provide this aggregate.
        var pr = 0; 
        var pc = pr >= 75 ? 'green' : pr >= 40 ? 'orange' : 'purple';
        var its = items.filter(function(x) { return String(x.project_id) === String(p.id); }).length;
        
        return '<div class="list-item" style="cursor:pointer;" onclick="openProject(\'' + p.id + '\')">' +
          '<div class="info"><strong>' + H.esc(p.name) + '</strong><small>' + its + ' بنود</small><small>' + H.fmt(p.budget) + ' ريال</small></div>' +
          '<div style="text-align:left;min-width:120px;"><span style="font-weight:700;">' + pr + '%</span><div class="progress-bar"><div class="progress-fill ' + pc + '" style="width:' + pr + '%"></div></div></div>' +
        '</div>';
      }).join('');
    } catch (err) {
      projList.innerHTML = '<div class="empty-state"><i class="ti ti-alert-triangle" style="color:var(--ER);"></i>حدث خطأ أثناء جلب المشاريع</div>';
      console.error(err);
    }
  },

  create: async function() {
    var H = NEXORA.Helpers;

    var n = document.getElementById('fProjName').value.trim();
    var b = parseFloat(document.getElementById('fProjBudget').value) || 0;
    if (!n) return H.msg('projMsg', 'أدخل الاسم', 'error');

    const btn = document.getElementById('btnCreateProj');
    if (btn) btn.disabled = true;

    try {
      await NEXORA.Repositories.projects.create({
        name: n,
        budget: b,
        start_date: document.getElementById('fProjStart').value || null,
        end_date: document.getElementById('fProjEnd').value || null,
        status: 'active'
      });
      
      H.msg('projMsg', '✅ تم', 'success');
      document.getElementById('fProjName').value = '';
      document.getElementById('fProjBudget').value = '';
      document.getElementById('fProjStart').value = '';
      document.getElementById('fProjEnd').value = '';
      
      this.render();
    } catch (err) {
      H.msg('projMsg', err.message, 'error');
    } finally {
      if (btn) btn.disabled = false;
    }
  },

  open: function(pid) {
    var App = NEXORA.App;
    App.curProjId = pid;
    NEXORA.Router.navigate('project');
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
