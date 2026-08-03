window.NEXORA = window.NEXORA || {};

NEXORA.Views = NEXORA.Views || {};

NEXORA.Views.ProcessDetail = {
  render: async function(pid) {
    var App = NEXORA.App;
    var H = NEXORA.Helpers;
    var cu = App.cu;
    var el = document.getElementById('processDetailContent');
    if (!el) return;

    var process = PMBOK_CATALOG.find(function(p) { return p.id === pid; });
    if (!process) {
      el.innerHTML = '<div class="empty-state"><i class="ti ti-alert-circle"></i>العملية غير موجودة</div>';
      return;
    }

    el.innerHTML = '<div class="card"><div class="empty-state"><i class="ti ti-loader"></i>جاري التحميل...</div></div>';

    try {
      var projId = App.curProjId;
      var projects = await NEXORA.Repositories.projects.list();
      var proj = projId ? projects.find(p => String(p.id) === String(projId)) : null;

      var dbProcs = projId ? await NEXORA.Repositories.processes.list({ project_id: projId }) : [];
      NEXORA.Views.Processes._currentDbProcs = dbProcs;
      var st = NEXORA.Views.Processes.getProcessStatus(pid, projId);

      var groupObj = PMBOK_GROUPS.find(function(g) { return g.name === process.group; });
      var groupColor = groupObj ? groupObj.color : 'var(--P)';

      var stCls = st === 'done' ? 'badge-done' : st === 'in_progress' ? 'badge-progress' : 'badge-todo';
      var stLabel = st === 'done' ? '✓ مكتمل' : st === 'in_progress' ? '◉ جاري' : '○ قيد الانتظار';
      var tierLabel = process.tier === 1 ? '⭐ المستوى الأساسي (Tier 1)' : '🏢 المستوى المؤسسي (Tier 2)';

      var h = '<div class="back-link" onclick="showView(\'processes\')"><i class="ti ti-arrow-right"></i> رجوع للعمليات</div>';

      h += '<div class="card" style="border-right:5px solid ' + groupColor + ';">' +
        '<div class="flex-between" style="flex-wrap:wrap;gap:8px;">' +
          '<div>' +
            '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">' +
              '<span style="background:' + groupColor + ';color:#fff;padding:4px 10px;border-radius:999px;font-size:var(--fs-xs);font-weight:700;">' + process.id + '</span>' +
              '<span class="badge ' + stCls + '">' + stLabel + '</span>' +
              '<span style="background:var(--BG);border:1px solid var(--BD);padding:2px 8px;border-radius:999px;font-size:var(--fs-xs);color:var(--TX2);">' + tierLabel + '</span>' +
            '</div>' +
            '<h2 style="color:var(--P);font-size:var(--fs-xl);">' + process.icon + ' ' + H.esc(process.name) + '</h2>' +
            '<div style="font-size:var(--fs-sm);color:var(--TX2);margin-top:4px;">' +
              '<span style="color:' + groupColor + ';font-weight:700;">' + H.esc(process.group) + '</span>' +
              ' — <span>' + H.esc(process.groupEn) + '</span>' +
              (proj ? ' — <span style="color:var(--P);font-weight:600;">' + H.esc(proj.name) + '</span>' : '') +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';

      h += '<div class="card">' +
        '<div class="card-title"><i class="ti ti-info-circle"></i> الوصف</div>' +
        '<p style="color:var(--TX);line-height:1.8;">' + H.esc(process.desc) + '</p>' +
      '</div>';

      h += '<div class="card">' +
        '<div class="card-title"><i class="ti ti-hammer" style="color:var(--G);"></i> التطبيق في المقاولات</div>' +
        '<p style="color:var(--TX);line-height:1.8;background:var(--GL);padding:14px;border-radius:var(--radius-sm);border:1px solid #e8d8a4;">' + H.esc(process.construction) + '</p>' +
      '</div>';

      h += '<div class="grid-2">' +
        '<div class="card">' +
          '<div class="card-title"><i class="ti ti-arrow-down" style="color:var(--GR);"></i> المدخلات</div>';

      if (process.inputs && process.inputs.length) {
        h += process.inputs.map(function(inp) {
          return '<div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--BD);"><span style="width:8px;height:8px;border-radius:50%;background:var(--GR);flex-shrink:0;"></span><span style="font-size:var(--fs-base);">' + H.esc(inp) + '</span></div>';
        }).join('');
      } else {
        h += '<div style="color:var(--TX3);font-size:var(--fs-sm);">—</div>';
      }

      h += '</div>' +
        '<div class="card">' +
          '<div class="card-title"><i class="ti ti-arrow-up" style="color:var(--P);"></i> المخرجات</div>';

      if (process.outputs && process.outputs.length) {
        h += process.outputs.map(function(out) {
          return '<div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--BD);"><span style="width:8px;height:8px;border-radius:50%;background:var(--P);flex-shrink:0;"></span><span style="font-size:var(--fs-base);">' + H.esc(out) + '</span></div>';
        }).join('');
      } else {
        h += '<div style="color:var(--TX3);font-size:var(--fs-sm);">—</div>';
      }

      h += '</div></div>';

      h += '<div class="card">' +
        '<div class="card-title"><i class="ti ti-settings"></i> التحكم في الحالة</div>';

      if (!projId) {
        h += '<div class="message-box warning" style="display:block;">يرجى اختيار مشروع من صفحة العمليات أولاً</div>';
      } else {
        h += '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
          '<button class="btn ' + (st === 'pending' ? 'btn-warning' : 'btn-o') + '" onclick="NEXORA.Views.ProcessDetail.setDetailStatus(\'' + process.id + '\',\'' + projId + '\',\'pending\')"><i class="ti ti-clock"></i> قيد الانتظار</button>' +
          '<button class="btn ' + (st === 'in_progress' ? 'btn-primary' : 'btn-o') + '" onclick="NEXORA.Views.ProcessDetail.setDetailStatus(\'' + process.id + '\',\'' + projId + '\',\'in_progress\')"><i class="ti ti-player-play"></i> جاري التنفيذ</button>' +
          '<button class="btn ' + (st === 'done' ? 'btn-success' : 'btn-o') + '" onclick="NEXORA.Views.ProcessDetail.setDetailStatus(\'' + process.id + '\',\'' + projId + '\',\'done\')"><i class="ti ti-check"></i> مكتمل</button>' +
        '</div>';
      }

      h += '</div>';

      h += '<div class="card">' +
        '<div class="card-title"><i class="ti ti-history"></i> سجل التغييرات</div>';

      var allLogs = await NEXORA.Repositories.process_logs.list();
      var logs = allLogs.filter(function(l) { return String(l.process_id) === String(pid) && String(l.project_id) === String(projId); })
        .sort(function(a, b) { return new Date(b.created_at) - new Date(a.created_at); });

      if (!logs.length) {
        h += '<div style="color:var(--TX3);font-size:var(--fs-sm);padding:12px 0;">لا يوجد سجل تغييرات</div>';
      } else {
        var employees = await NEXORA.Repositories.employees.list();
        logs.forEach(function(l) {
          var who = employees.find(e => String(e.id) === String(l.created_by));
          var logStCls = l.status === 'done' ? 'badge-done' : l.status === 'in_progress' ? 'badge-progress' : 'badge-todo';
          var logStLabel = l.status === 'done' ? '✓ مكتمل' : l.status === 'in_progress' ? '◉ جاري' : '○ قيد الانتظار';
          h += '<div class="list-item">' +
            '<div class="info">' +
              '<div style="display:flex;align-items:center;gap:6px;">' +
                '<span class="badge ' + logStCls + '">' + logStLabel + '</span>' +
                '<strong style="font-size:var(--fs-sm);">' + (who ? H.esc(who.full_name) : 'النظام') + '</strong>' +
              '</div>' +
              '<small style="color:var(--TX3);">' + new Date(l.created_at).toLocaleString('ar-SA') + '</small>' +
              (l.note ? '<small>' + H.esc(l.note) + '</small>' : '') +
            '</div>' +
          '</div>';
        });
      }

      h += '</div>';

      el.innerHTML = h;
    } catch(err) {
      el.innerHTML = '<div class="card"><div class="empty-state"><i class="ti ti-alert-triangle" style="color:var(--ER);"></i>حدث خطأ: ' + H.esc(err.message) + '</div></div>';
    }
  },

  setDetailStatus: async function(pid, projId, status) {
    if (typeof NEXORA.Views.Processes.setProcessStatus === 'function') {
      await NEXORA.Views.Processes.setProcessStatus(pid, projId, status, '');
      await NEXORA.Views.ProcessDetail.render(pid);
    }
  }
};

window.openProcessDetail = function(pid) { NEXORA.App.curProcessId = pid; NEXORA.Views.ProcessDetail.render(pid); };
