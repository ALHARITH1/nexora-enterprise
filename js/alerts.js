window.NEXORA = window.NEXORA || {};

NEXORA.Alerts = {
  checkAll: function() {
    var DB = NEXORA.DB;
    var H = NEXORA.Helpers;
    var App = NEXORA.App;
    var alerts = [];

    if (!DB || !DB.projects) return alerts;

    DB.projects.forEach(function(p) {
      var cost = H.projCost(p.id);
      if (p.budget > 0) {
        var ratio = cost / p.budget;
        if (ratio > 1) {
          alerts.push({ severity: 'critical', name: 'تجاوز الميزانية', message: '"' + p.name + '" تجاوز الميزانية بـ ' + Math.round((ratio - 1) * 100) + '%', action: 'costs', project_id: p.id });
        } else if (ratio > 0.9) {
          alerts.push({ severity: 'high', name: 'قريب من تجاوز الميزانية', message: '"' + p.name + '" وصل ' + Math.round(ratio * 100) + '% من الميزانية', action: 'costs', project_id: p.id });
        }
      }

      if (p.end_date) {
        var endDate = new Date(p.end_date);
        var now = new Date();
        var progress = H.projProgress(p.id);
        if (endDate < now && progress < 100) {
          var daysLate = Math.ceil((now - endDate) / 864e5);
          alerts.push({ severity: 'high', name: 'تأخر الجدول', message: '"' + p.name + '" متأخر بـ ' + daysLate + ' يوم', action: 'projects', project_id: p.id });
        }
      }
    });

    (DB.tasks || []).forEach(function(t) {
      if (t.approved === false) {
        var item = H.itm(t.item_id);
        alerts.push({ severity: 'critical', name: 'رفض الجودة', message: 'مهمة "' + t.title + '" مرفوضة', action: 'approvals', task_id: t.id });
      }
    });

    (DB.tasks || []).filter(function(t) {
      var a = (DB.assignments || []).find(function(x) { return x.task_id === t.id; });
      return a && a.due_date && new Date(a.due_date) < new Date() && t.status !== 'done';
    }).forEach(function(t) {
      alerts.push({ severity: 'high', name: 'تأخر المهمة', message: '"' + t.title + '" متأخرة عن الموعد', action: 'approvals', task_id: t.id });
    });

    alerts.sort(function(a, b) {
      var order = { critical: 0, high: 1, medium: 2 };
      return (order[a.severity] || 3) - (order[b.severity] || 3);
    });

    return alerts;
  },

  getCount: function() {
    return this.checkAll().length;
  }
};

window.renderAlertsCenter = function() {
  var el = document.getElementById('alertsContent');
  if (!el) return;

  var alerts = NEXORA.Alerts.checkAll();
  var H = NEXORA.Helpers;

  var h = '<div class="ent-section-header">' +
    '<h2><i class="ti ti-bell"></i> مركز التنبيهات الذكية</h2>' +
    '<span class="badge badge-' + (alerts.length ? 'rejected' : 'approved') + '">' + alerts.length + ' تنبيه</span>' +
  '</div>';

  if (!alerts.length) {
    h += '<div class="empty-state" style="padding:48px;"><i class="ti ti-check-circle" style="font-size:48px;color:var(--GR);"></i><h3>كل شيء على ما يرام</h3><p style="color:var(--TX2);">لا توجد تنبيهات حالياً</p></div>';
  } else {
    var grouped = { critical: [], high: [], medium: [] };
    alerts.forEach(function(a) {
      (grouped[a.severity] || grouped.medium).push(a);
    });

    var labels = { critical: { label: '🔴 حرج', color: 'var(--RE)' }, high: { label: '🟡 مرتفع', color: 'var(--G)' }, medium: { label: '🟢 متوسط', color: 'var(--GR)' } };
    Object.keys(grouped).forEach(function(sev) {
      if (!grouped[sev].length) return;
      h += '<div class="alert-group"><h3 style="color:' + labels[sev].color + ';">' + labels[sev].label + ' (' + grouped[sev].length + ')</h3>';
      grouped[sev].forEach(function(a) {
        h += '<div class="alert-card" style="border-right:4px solid ' + labels[sev].color + ';">' +
          '<div class="alert-card-body"><strong>' + H.esc(a.message) + '</strong><small>' + a.name + '</small></div>' +
          '<button class="btn btn-sm btn-o" onclick="NEXORA.Router.navigate(\'' + a.action + '\')">عرض</button>' +
        '</div>';
      });
      h += '</div>';
    });
  }

  el.innerHTML = h;
};
