window.NEXORA = window.NEXORA || {};
NEXORA.Views = NEXORA.Views || {};

NEXORA.Views.Costs = {
  render: async function() {
    var App = NEXORA.App;
    var H = NEXORA.Helpers;
    var el = document.getElementById('costsContent');
    if (!el) return;

    el.innerHTML = '<div class="card"><div class="empty-state"><i class="ti ti-loader"></i>جاري التحميل...</div></div>';

    try {
      var items = await NEXORA.Repositories.items.list();
      var projects = await NEXORA.Repositories.projects.list();
      var costs = await NEXORA.Repositories.costs.list();

      var h = '<div class="card"><div class="card-title"><i class="ti ti-coin"></i> تحليل التكاليف حسب البند</div>' +
        '<div style="overflow-x:auto;"><table><tr><th>البند</th><th>المشروع</th><th>الميزانية</th><th>التكلفة</th><th>الربح/الخسارة</th><th>هامش</th><th>الحالة</th></tr>';

      items.forEach(function(i) {
        var p = projects.find(x => String(x.id) === String(i.project_id));
        var c = costs.filter(x => String(x.item_id) === String(i.id)).reduce(function(s, x) { return s + (parseFloat(x.cost) || 0); }, 0);
        var pfit = (parseFloat(i.budget) || 0) - c;
        var status = pfit >= 0 ? 'profit' : 'loss';
        var margin = i.budget ? Math.round(pfit / i.budget * 100) : 0;
        
        var profitColor = status === 'profit' ? 'var(--GR)' : 'var(--RE)';
        var profitSign = status === 'profit' ? '+' : '';
        var statusText = status === 'profit' ? '✔ ربح' : '✘ خسارة';
        var statusClass = status === 'profit' ? 'badge-profit' : 'badge-loss';

        h += '<tr><td>' + H.esc(i.name) + '</td><td style="color:var(--TX2);">' + (p ? H.esc(p.name) : '') + '</td><td>' + H.fmt(i.budget) + '</td><td style="color:var(--G);">' + H.fmt(c) + '</td>' +
          '<td style="font-weight:700;color:' + profitColor + ';">' + profitSign + H.fmt(pfit) + '</td>' +
          '<td>' + margin + '%</td><td><span class="badge ' + statusClass + '">' + statusText + '</span></td></tr>';
      });

      var tb = items.reduce(function(s, i) { return s + (parseFloat(i.budget) || 0); }, 0);
      var tc = costs.reduce(function(s, x) { return s + (parseFloat(x.cost) || 0); }, 0);
      var tp = tb - tc;
      var netColor = tp >= 0 ? 'var(--GR)' : 'var(--RE)';
      var netLabel = tp >= 0 ? 'صافي الربح' : 'صافي الخسارة';

      h += '</table></div>' +
        '<div style="margin-top:12px;display:flex;gap:12px;flex-wrap:wrap;">' +
          '<div style="flex:1;padding:12px;background:var(--BG);border-radius:6px;text-align:center;"><div style="font-size:11px;color:var(--TX2);">إجمالي الميزانية</div><div style="font-size:20px;font-weight:800;">' + H.fmt(tb) + '</div></div>' +
          '<div style="flex:1;padding:12px;background:var(--BG);border-radius:6px;text-align:center;"><div style="font-size:11px;color:var(--TX2);">إجمالي التكاليف</div><div style="font-size:20px;font-weight:800;color:var(--G);">' + H.fmt(tc) + '</div></div>' +
          '<div style="flex:1;padding:12px;background:' + netColor + ';border-radius:6px;text-align:center;color:#fff;"><div style="font-size:11px;opacity:.9;">' + netLabel + '</div><div style="font-size:20px;font-weight:800;">' + H.fmt(Math.abs(tp)) + '</div></div>' +
        '</div></div>';

      el.innerHTML = h;
    } catch(err) {
      el.innerHTML = '<div class="card"><div class="empty-state"><i class="ti ti-alert-triangle" style="color:var(--ER);"></i>حدث خطأ: ' + H.esc(err.message) + '</div></div>';
    }
  }
};

window.renderCosts = function() { NEXORA.Views.Costs.render(); };
