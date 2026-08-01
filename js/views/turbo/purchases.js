window.NEXORA = window.NEXORA || {};
NEXORA.Views = NEXORA.Views || {};

NEXORA.Views.TurboPurchases = {
  render: function() {
    var DB = NEXORA.DB;
    var H = NEXORA.Helpers;
    var el = document.getElementById('turboPurchasesContent');
    if (!el) return;

    var allCosts = (DB.costs || []).concat(DB.cash_flow || []).filter(function(c) {
      return (c.type === 'outflow' || c.type === 'expense' || c.category === 'مشتريات' || c.category === 'materials');
    });
    var recentCosts = allCosts.sort(function(a, b) {
      var dA = a.cost_date || a.transaction_date || a.date || '';
      var dB = b.cost_date || b.transaction_date || b.date || '';
      return dB.localeCompare(dA);
    }).slice(0, 20);

    var h = '<div class="turbo-section-header">' +
      '<h2><i class="ti ti-shopping-cart"></i> المشتريات</h2>' +
    '</div>';

    h += '<div class="turbo-quick-form card">' +
      '<div class="card-title"><i class="ti ti-plus"></i> شراء سريع</div>' +
      '<div id="turboPurchMsg" class="message-box"></div>' +
      '<div class="turbo-form-row">' +
        '<input type="text" id="turboPurchDesc" class="turbo-input" placeholder="وصف الشراء">' +
        '<input type="number" id="turboPurchAmount" class="turbo-input" placeholder="المبلغ">' +
      '</div>' +
      '<div class="turbo-form-row">' +
        '<select id="turboPurchProject" class="turbo-input"><option value="">— المشروع —</option>' +
        (DB.projects || []).map(function(p) { return '<option value="' + p.id + '">' + H.esc(p.name) + '</option>'; }).join('') +
        '</select>' +
        '<button class="btn btn-primary" onclick="NEXORA.Views.TurboPurchases.add()"><i class="ti ti-check"></i> تسجيل</button>' +
      '</div>' +
    '</div>';

    h += '<div class="card"><div class="card-title"><i class="ti ti-history"></i> آخر المشتريات</div>';
    if (!recentCosts.length) {
      h += '<div class="empty-state"><i class="ti ti-shopping-cart"></i>لا توجد مشتريات</div>';
    } else {
      h += recentCosts.map(function(c) {
        var dStr = c.cost_date || c.transaction_date || c.date || '';
        return '<div class="list-item"><div class="info"><strong>' + H.esc(c.description || c.desc || 'شراء') + '</strong><small>' + dStr + '</small></div>' +
          '<span style="font-weight:700;color:var(--RE);">- ' + H.fmt(c.cost || c.amount || 0) + ' ر.س</span></div>';
      }).join('');
    }
    h += '</div>';

    el.innerHTML = h;
  },

  add: async function() {
    var DB = NEXORA.DB;
    var H = NEXORA.Helpers;
    var desc = document.getElementById('turboPurchDesc').value.trim();
    var amount = parseFloat(document.getElementById('turboPurchAmount').value) || 0;
    var selectedProjId = document.getElementById('turboPurchProject').value;
    var pid = selectedProjId || (NEXORA.App && NEXORA.App.curProjId) || null;

    if (!desc || !amount) return H.msg('turboPurchMsg', 'أدخل الوصف والمبلغ', 'error');

    var todayStr = window.NEXORA.DateUtils ? window.NEXORA.DateUtils.getLocalDateString() : new Date().toISOString().split('T')[0];

    const costRecord = {
      project_id: pid,
      category: 'materials',
      description: desc,
      amount: amount,
      cost: amount,
      cost_date: todayStr,
      date: todayStr
    };

    if (NEXORA.Repositories && NEXORA.Repositories.costs) {
      await NEXORA.Repositories.costs.create(costRecord);
    } else {
      if (!DB.costs) DB.costs = [];
      costRecord.id = H.gf(DB.costs);
      DB.costs.push(costRecord);
      if (DB.save) DB.save();
    }

    H.msg('turboPurchMsg', 'تم تسجيل الشراء', 'success');
    document.getElementById('turboPurchDesc').value = '';
    document.getElementById('turboPurchAmount').value = '';
    NEXORA.Views.TurboPurchases.render();
  }
};

window.renderTurboPurchases = function() { NEXORA.Views.TurboPurchases.render(); };
