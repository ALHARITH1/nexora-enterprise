window.NEXORA = window.NEXORA || {};
NEXORA.Views = NEXORA.Views || {};

NEXORA.Views.EnterpriseControl = {
  render: function() {
    var App = NEXORA.App;
    var DB = NEXORA.DB;
    var H = NEXORA.Helpers;
    var PC = NEXORA.ProcessCatalog;
    var el = document.getElementById('entControlContent');
    if (!el) return;

    var tier3 = PC.getByTier(3);
    var alerts = NEXORA.Alerts ? NEXORA.Alerts.checkAll() : [];

    var h = '<div class="ent-section-header">' +
      '<h2><i class="ti ti-brain"></i> التحكم الذكي</h2>' +
      '<p style="color:var(--TX2);">12 عملية — تنبيهات فورية + KPIs</p>' +
    '</div>';

    if (alerts.length) {
      h += '<div class="ent-alerts-bar">';
      alerts.slice(0, 5).forEach(function(a) {
        var color = a.severity === 'critical' ? 'var(--RE)' : a.severity === 'high' ? 'var(--G)' : 'var(--GR)';
        h += '<div class="ent-alert-item" style="border-right:4px solid ' + color + ';">' +
          '<span style="font-size:18px;">' + (a.severity === 'critical' ? '🔴' : a.severity === 'high' ? '🟡' : '🟢') + '</span>' +
          '<div><strong>' + H.esc(a.message) + '</strong><small>' + a.name + '</small></div>' +
        '</div>';
      });
      h += '</div>';
    }

    tier3.forEach(function(p) {
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

window.renderEntControl = function() { NEXORA.Views.EnterpriseControl.render(); };
