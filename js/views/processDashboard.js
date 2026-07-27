window.NEXORA = window.NEXORA || {};

NEXORA.Views = NEXORA.Views || {};

NEXORA.Views.ProcessDashboard = {
  render: function() {
    var App = NEXORA.App;
    var DB = NEXORA.DB;
    var H = NEXORA.Helpers;
    var cu = App.cu;
    var el = document.getElementById('processDashboardContent');
    if (!el) return;

    var pid = App.curProjId;
    var proj = pid ? H.proj(pid) : null;

    var projOptions = '<option value="">— اختر مشروع —</option>';
    DB.projects.forEach(function(p) {
      projOptions += '<option value="' + p.id + '"' + (pid == p.id ? ' selected' : '') + '>' + H.esc(p.name) + '</option>';
    });

    var stats = NEXORA.ProcessCatalog.getStats(pid);
    var pctColor = stats.pct >= 75 ? 'var(--GR)' : stats.pct >= 40 ? 'var(--G)' : 'var(--P)';

    var h = '<div class="card" style="border-right:4px solid var(--P);margin-bottom:16px;">' +
      '<div class="flex-between">' +
        '<div>' +
          '<div class="card-title"><i class="ti ti-dashboard"></i> لوحة متابعة العمليات</div>' +
          '<div style="font-size:var(--fs-sm);color:var(--TX2);">نظرة شاملة على تقدم عمليات المشروع وفق معايير PMBOK</div>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:8px;">' +
          '<select id="dashProcProjSelect" style="width:auto;min-width:180px;margin:0;" onchange="NEXORA.Views.ProcessDashboard._onProjectChange(this.value)">' + projOptions + '</select>' +
          '<button class="btn btn-sm btn-o" onclick="NEXORA.Views.ProcessDashboard._openWizard()" title="الإعداد السريع"><i class="ti ti-engineering"></i> الإعداد</button>' +
        '</div>' +
      '</div>' +
    '</div>';

    h += '<div class="stats">' +
      '<div class="stat-card purple"><div class="num">' + stats.total + '</div><div class="lbl">إجمالي العمليات</div></div>' +
      '<div class="stat-card green"><div class="num">' + stats.completed + '</div><div class="lbl">مكتملة</div></div>' +
      '<div class="stat-card blue"><div class="num">' + stats.inProgress + '</div><div class="lbl">جارية</div></div>' +
      '<div class="stat-card gold"><div class="num">' + stats.pending + '</div><div class="lbl">قيد الانتظار</div></div>' +
      '<div class="stat-card purple"><div class="num" style="color:' + pctColor + ';">' + stats.pct + '%</div><div class="lbl">التقدم الإجمالي</div></div>' +
    '</div>';

    h += '<div class="card" style="padding:14px 16px;margin-bottom:16px;">' +
      '<div class="progress-bar" style="height:12px;"><div class="progress-fill ' + (stats.pct >= 75 ? 'green' : stats.pct >= 40 ? 'gold' : 'blue') + '" style="width:' + stats.pct + '%"></div></div>' +
    '</div>';

    h += '<div class="card" style="margin-bottom:16px;">' +
      '<div class="card-title"><i class="ti ti-layers"></i> تقدم المجموعات</div>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px;">';

    var groups = NEXORA.ProcessCatalog.groups;
    groups.forEach(function(g) {
      var grpProcs = NEXORA.ProcessCatalog.getByGroup(g.name);
      var grpDone = 0;
      grpProcs.forEach(function(p) {
        if (NEXORA.ProcessEngine.getStatus(p.id, pid) === 'done') grpDone++;
      });
      var grpPct = grpProcs.length ? Math.round(grpDone / grpProcs.length * 100) : 0;

      h += '<div style="border:1px solid var(--BD);border-right:4px solid ' + g.color + ';border-radius:var(--radius-sm);padding:14px;">' +
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">' +
          '<div style="width:30px;height:30px;border-radius:50%;background:' + g.color + ';color:#fff;display:flex;align-items:center;justify-content:center;font-size:var(--fs-sm);"><i class="' + g.icon + '"></i></div>' +
          '<div style="flex:1;">' +
            '<div style="font-weight:700;font-size:var(--fs-sm);color:' + g.color + ';">' + g.name + '</div>' +
            '<div style="font-size:var(--fs-xs);color:var(--TX3);">' + g.nameEn + '</div>' +
          '</div>' +
          '<div style="text-align:left;">' +
            '<div style="font-weight:700;font-size:var(--fs-base);color:' + g.color + ';">' + grpPct + '%</div>' +
            '<div style="font-size:var(--fs-xs);color:var(--TX3);">' + grpDone + '/' + grpProcs.length + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="progress-bar" style="height:6px;"><div class="progress-fill ' + (grpPct >= 75 ? 'green' : grpPct >= 40 ? 'gold' : 'blue') + '" style="width:' + grpPct + '%"></div></div>' +
      '</div>';
    });

    h += '</div></div>';

    h += '<div class="grid-2" style="margin-bottom:16px;">' +
      '<div class="card">' +
        '<div class="card-title"><i class="ti ti-player-play" style="color:var(--GR);"></i> بدء سريع</div>' +
        '<p style="color:var(--TX2);font-size:var(--fs-sm);line-height:1.7;margin-bottom:12px;">ابدأ بإعداد عمليات مشروعك بسرعة من خلال معالج الإعداد.</p>' +
        '<button class="btn btn-primary" onclick="NEXORA.Views.ProcessDashboard._openWizard()"><i class="ti ti-engineering"></i> فتح معالج الإعداد</button>' +
        (pid ? '<button class="btn btn-o" style="margin-right:8px;" onclick="showView(\'processes\')"><i class="ti ti-list"></i> عرض جميع العمليات</button>' : '') +
      '</div>' +
      '<div class="card">' +
        '<div class="card-title"><i class="ti ti-chart-line" style="color:var(--P);"></i> ملخص سريع</div>';

    if (proj) {
      h += '<div class="list-item"><div class="info"><strong>المشروع</strong></div><span style="color:var(--P);font-weight:600;">' + H.esc(proj.name) + '</span></div>';
    } else {
      h += '<div class="list-item"><div class="info"><strong>المشروع</strong></div><span style="color:var(--TX3);">لم يتم اختيار مشروع</span></div>';
    }
    h += '<div class="list-item"><div class="info"><strong>الوضع</strong></div><span>' + (NEXORA.Views.Processes.getTier() === 1 ? '⚡ بسيط (Tier 1)' : '🏢 مؤسسي (Tier 2)') + '</span></div>';
    h += '<div class="list-item"><div class="info"><strong>نسبة الإنجاز</strong></div><span style="font-weight:700;color:' + pctColor + ';">' + stats.pct + '%</span></div>';

    h += '</div></div>';

    h += '<div class="card">' +
      '<div class="card-title"><i class="ti ti-history"></i> آخر النشاطات</div>';

    var recentLogs = NEXORA.ProcessEngine.getLogs(null, pid).slice(0, 10);

    if (!recentLogs.length) {
      h += '<div class="empty-state" style="padding:16px;"><i class="ti ti-clock"></i>لا توجد نشاطات حديثة</div>';
    } else {
      recentLogs.forEach(function(l) {
        var proc = NEXORA.ProcessCatalog.getProcess(l.process_id);
        var who = H.emp(l.changed_by);
        var stCls = l.status === 'done' ? 'badge-done' : l.status === 'in_progress' ? 'badge-progress' : 'badge-todo';
        var stLabel = l.status === 'done' ? '✓ مكتمل' : l.status === 'in_progress' ? '◉ جاري' : '○ قيد الانتظار';
        var procName = proc ? proc.name : l.process_id;
        var procIcon = proc ? proc.icon : '📋';
        var projObj = H.proj(l.project_id);
        var projName = projObj ? projObj.name : '';

        h += '<div class="list-item">' +
          '<div class="info">' +
            '<div style="display:flex;align-items:center;gap:6px;">' +
              '<span class="badge ' + stCls + '">' + stLabel + '</span>' +
              '<strong style="font-size:var(--fs-sm);">' + procIcon + ' ' + H.esc(procName) + '</strong>' +
            '</div>' +
            '<small style="color:var(--TX3);">' +
              (who ? H.esc(who.full_name) : 'النظام') +
              (projName ? ' — ' + H.esc(projName) : '') +
            '</small>' +
            '<small style="color:var(--TX3);">' + new Date(l.changed_at).toLocaleString('ar-SA') + '</small>' +
            (l.note ? '<small>' + H.esc(l.note) + '</small>' : '') +
          '</div>' +
        '</div>';
      });
    }

    h += '</div>';

    el.innerHTML = h;
  },

  _onProjectChange: function(val) {
    NEXORA.App.curProjId = val ? parseInt(val) : null;
    NEXORA.Views.ProcessDashboard.render();
  },

  _openWizard: function() {
    var wizardEl = document.getElementById('processWizardContent');
    if (wizardEl) {
      NEXORA.ProcessWizard.currentStep = 0;
      NEXORA.ProcessWizard.render();
      if (typeof showView === 'function') showView('processWizard');
    } else if (typeof showView === 'function') {
      showView('processes');
    }
  }
};

window.renderProcessDashboard = function() { NEXORA.Views.ProcessDashboard.render(); };
