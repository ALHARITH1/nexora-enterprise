window.NEXORA = window.NEXORA || {};
NEXORA.Views = NEXORA.Views || {};

NEXORA.Views.TurboPurchases = {
  render: function() {
    var App = NEXORA.App;
    var DB = NEXORA.DB;
    var H = NEXORA.Helpers;
    var el = document.getElementById('turboPurchasesContent');
    if (!el) return;

    var today = new Date().toISOString().split('T')[0];
    var allCosts = (DB.costs || []).concat(DB.cash_flow || []).filter(function(c) {
      return (c.type === 'expense' || c.category === 'مشتريات');
    });
    var recentCosts = allCosts.sort(function(a, b) { return (b.date || '').localeCompare(a.date || ''); }).slice(0, 20);

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
        DB.projects.map(function(p) { return '<option value="' + p.id + '">' + H.esc(p.name) + '</option>'; }).join('') +
        '</select>' +
        '<button class="btn btn-primary" onclick="NEXORA.Views.TurboPurchases.add()"><i class="ti ti-check"></i> تسجيل</button>' +
      '</div>' +
    '</div>';

    h += '<div class="card"><div class="card-title"><i class="ti ti-history"></i> آخر المشتريات</div>';
    if (!recentCosts.length) {
      h += '<div class="empty-state"><i class="ti ti-shopping-cart"></i>لا توجد مشتريات</div>';
    } else {
      h += recentCosts.map(function(c) {
        return '<div class="list-item"><div class="info"><strong>' + H.esc(c.description || c.desc || 'شراء') + '</strong><small>' + (c.date || '') + '</small></div>' +
          '<span style="font-weight:700;color:var(--RE);">- ' + H.fmt(c.cost || c.amount || 0) + ' ر.س</span></div>';
      }).join('');
    }
    h += '</div>';

    el.innerHTML = h;
  },

  add: function() {
    var DB = NEXORA.DB;
    var H = NEXORA.Helpers;
    var desc = document.getElementById('turboPurchDesc').value.trim();
    var amount = parseFloat(document.getElementById('turboPurchAmount').value) || 0;
    var pid = parseInt(document.getElementById('turboPurchProject').value) || 0;
    if (!desc || !amount) return H.msg('turboPurchMsg', 'أدخل الوصف والمبلغ', 'error');

    DB.costs.push({
      id: H.gf(DB.costs),
      item_id: 0,
      employee_id: 0,
      hours: 0,
      hour_rate: 0,
      cost: amount,
      description: desc,
      date: new Date().toISOString().split('T')[0]
    });
    DB.save();
    H.msg('turboPurchMsg', 'تم تسجيل الشراء', 'success');
    document.getElementById('turboPurchDesc').value = '';
    document.getElementById('turboPurchAmount').value = '';
    NEXORA.Views.TurboPurchases.render();
  }
};

window.renderTurboPurchases = function() { NEXORA.Views.TurboPurchases.render(); };
