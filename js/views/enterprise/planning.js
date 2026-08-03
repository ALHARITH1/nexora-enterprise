window.NEXORA = window.NEXORA || {};
NEXORA.Views = NEXORA.Views || {};

NEXORA.Views.EnterprisePlanning = {
  render: async function() {
    var App = NEXORA.App;
    var H = NEXORA.Helpers;
    var PC = NEXORA.ProcessCatalog;
    var el = document.getElementById('entPlanningContent');
    if (!el) return;

    el.innerHTML = '<div class="card"><div class="empty-state"><i class="ti ti-loader"></i>جاري التحميل...</div></div>';

    try {
      var allProcesses = await NEXORA.Repositories.processes.list();
      var tier1 = PC ? PC.getByTier(1) : [];

      var h = '<div class="ent-section-header">' +
        '<h2><i class="ti ti-dashboard"></i> التخطيط الفائق</h2>' +
        '<p style="color:var(--TX2);">24 عملية — BOQ + مخاطر + جدول زمني</p>' +
      '</div>';

      tier1.forEach(function(p) {
        var proc = allProcesses.find(function(x) { return String(x.process_id) === String(p.id) && String(x.project_id) === String(App.curProjId); });
        var status = proc ? proc.status : 'pending';
        var statusCls = status === 'done' ? 'badge-approved' : status === 'in_progress' ? 'badge-progress' : 'badge-pending';
        var statusTxt = status === 'done' ? '✓ منجز' : status === 'in_progress' ? '● جارٍ' : '○ معلق';

        h += '<div class="ent-process-card" onclick="NEXORA.App.curProcessId=\'' + p.id + '\';NEXORA.Router.navigate(\'processDetail\')">' +
          '<div class="ent-proc-header">' +
            '<span class="ent-proc-icon">' + p.icon + '</span>' +
            '<div class="ent-proc-info"><strong>' + H.esc(p.name) + '</strong><small>' + p.group + '</small></div>' +
            '<span class="badge ' + statusCls + '">' + statusTxt + '</span>' +
          '</div>' +
          '<div style="color:var(--TX2);font-size:var(--fs-sm);margin-top:6px;">' + H.esc(p.desc).substring(0, 100) + '...</div>' +
        '</div>';
      });

      el.innerHTML = h;
    } catch (err) {
      el.innerHTML = '<div class="card"><div class="empty-state"><i class="ti ti-alert-triangle" style="color:var(--ER);"></i>حدث خطأ: ' + H.esc(err.message) + '</div></div>';
    }
  }
};

window.renderEntPlanning = function() { NEXORA.Views.EnterprisePlanning.render(); };
