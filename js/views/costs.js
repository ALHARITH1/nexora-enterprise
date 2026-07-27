window.NEXORA = window.NEXORA || {};

NEXORA.Views = NEXORA.Views || {};

NEXORA.Views.Costs = {
  render: function() {
    var App = NEXORA.App;
    var DB = NEXORA.DB;
    var H = NEXORA.Helpers;
    var el = document.getElementById('costsContent');
    if (!el) return;

    var h = '<div class="card"><div class="card-title"><i class="ti ti-coin"></i> تحليل التكاليف حسب البند</div>' +
      '<div style="overflow-x:auto;"><table><tr><th>البند</th><th>المشروع</th><th>الميزانية</th><th>التكلفة</th><th>الربح/الخسارة</th><th>هامش</th><th>الحالة</th></tr>';

    DB.items.forEach(function(i) {
      var p = H.proj(i.project_id);
      var pf = H.itemProfit(i.id);
      var profitColor = pf.status === 'profit' ? 'var(--GR)' : 'var(--RE)';
      var profitSign = pf.status === 'profit' ? '+' : '';
      var statusText = pf.status === 'profit' ? '✔ ربح' : '✘ خسارة';
      var statusClass = pf.status === 'profit' ? 'badge-profit' : 'badge-loss';
      h += '<tr><td>' + H.esc(i.name) + '</td><td style="color:var(--TX2);">' + (p ? H.esc(p.name) : '') + '</td><td>' + H.fmt(i.budget) + '</td><td style="color:var(--G);">' + H.fmt(pf.cost) + '</td>' +
        '<td style="font-weight:700;color:' + profitColor + ';">' + profitSign + H.fmt(pf.profit) + '</td>' +
        '<td>' + pf.margin + '%</td><td><span class="badge ' + statusClass + '">' + statusText + '</span></td></tr>';
    });

    var tb = DB.items.reduce(function(s, i) { return s + (i.budget || 0); }, 0);
    var tc = DB.items.reduce(function(s, i) { return s + H.itemCost(i.id); }, 0);
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
  }
};

window.renderCosts = function() { NEXORA.Views.Costs.render(); };
