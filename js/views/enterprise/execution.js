window.NEXORA = window.NEXORA || {};
NEXORA.Views = NEXORA.Views || {};

NEXORA.Views.EnterpriseExecution = {
  render: async function() {
    var App = NEXORA.App;
    var H = NEXORA.Helpers;
    var PC = NEXORA.ProcessCatalog;
    var el = document.getElementById('entExecutionContent');
    if (!el) return;

    el.innerHTML = '<div class="card"><div class="empty-state"><i class="ti ti-loader"></i>جاري التحميل...</div></div>';

    try {
      var allProcesses = await NEXORA.Repositories.processes.list();
      var tier2 = PC ? PC.getByTier(2) : [];

      var h = '<div class="ent-section-header">' +
        '<h2><i class="ti ti-bolt"></i> التنفيذ والسرعة</h2>' +
        '<p style="color:var(--TX2);">15 عملية — واجهة سريعة للمهندسين</p>' +
      '</div>';

      tier2.forEach(function(p) {
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
        '</div>';
      });

      el.innerHTML = h;
    } catch (err) {
      el.innerHTML = '<div class="card"><div class="empty-state"><i class="ti ti-alert-triangle" style="color:var(--ER);"></i>حدث خطأ: ' + H.esc(err.message) + '</div></div>';
    }
  }
};

window.renderEntExecution = function() { NEXORA.Views.EnterpriseExecution.render(); };
