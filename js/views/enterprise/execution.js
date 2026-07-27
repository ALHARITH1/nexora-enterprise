window.NEXORA = window.NEXORA || {};
NEXORA.Views = NEXORA.Views || {};

NEXORA.Views.EnterpriseExecution = {
  render: function() {
    var App = NEXORA.App;
    var DB = NEXORA.DB;
    var H = NEXORA.Helpers;
    var PC = NEXORA.ProcessCatalog;
    var el = document.getElementById('entExecutionContent');
    if (!el) return;

    var tier2 = PC.getByTier(2);

    var h = '<div class="ent-section-header">' +
      '<h2><i class="ti ti-bolt"></i> التنفيذ والسرعة</h2>' +
      '<p style="color:var(--TX2);">15 عملية — واجهة سريعة للمهندسين</p>' +
    '</div>';

    tier2.forEach(function(p) {
      var proc = DB.processes.find(function(x) { return x.process_id === p.id && x.project_id === App.curProjId; });
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
  }
};

window.renderEntExecution = function() { NEXORA.Views.EnterpriseExecution.render(); };
