window.NEXORA = window.NEXORA || {};
NEXORA.Views = NEXORA.Views || {};

NEXORA.Views.TurboCashflow = {
  render: function() {
    var DB = NEXORA.DB;
    var H = NEXORA.Helpers;
    var el = document.getElementById('turboCashflowContent');
    if (!el) return;

    var flows = (DB.cash_flow || []).sort(function(a, b) { return (b.date || '').localeCompare(a.date || ''); });
    var totalIn = flows.filter(function(c) { return c.type === 'income'; }).reduce(function(s, c) { return s + (c.amount || 0); }, 0);
    var totalOut = flows.filter(function(c) { return c.type === 'expense'; }).reduce(function(s, c) { return s + (c.amount || 0); }, 0);
    var balance = totalIn - totalOut;

    var h = '<div class="turbo-section-header">' +
      '<h2><i class="ti ti-cash"></i> السيولة النقدية</h2>' +
    '</div>';

    h += '<div class="turbo-balance-card">' +
      '<div class="turbo-balance-row"><span class="turbo-bal-label">وارد</span><span style="color:var(--GR);font-weight:700;">+ ' + H.fmt(totalIn) + '</span></div>' +
      '<div class="turbo-balance-row"><span class="turbo-bal-label">صادر</span><span style="color:var(--RE);font-weight:700;">- ' + H.fmt(totalOut) + '</span></div>' +
      '<div class="turbo-balance-row" style="border-top:2px solid var(--BD);padding-top:8px;"><span class="turbo-bal-label" style="font-weight:700;">الرصيد</span>' +
      '<span style="font-size:var(--fs-xl);font-weight:700;color:' + (balance >= 0 ? 'var(--GR)' : 'var(--RE)') + ';">' + H.fmt(balance) + ' ر.س</span></div>' +
    '</div>';

    h += '<div class="turbo-quick-form card">' +
      '<div class="card-title"><i class="ti ti-plus"></i> إدخال حركة</div>' +
      '<div id="turboCashMsg" class="message-box"></div>' +
      '<div class="turbo-form-row">' +
        '<select id="turboCashType" class="turbo-input"><option value="income">وارد (+)</option><option value="expense">صادر (-)</option></select>' +
        '<input type="text" id="turboCashDesc" class="turbo-input" placeholder="الوصف">' +
        '<input type="number" id="turboCashAmount" class="turbo-input" placeholder="المبلغ">' +
      '</div>' +
      '<button class="btn btn-primary" onclick="NEXORA.Views.TurboCashflow.add()"><i class="ti ti-check"></i> تسجيل</button>' +
    '</div>';

    h += '<div class="card"><div class="card-title"><i class="ti ti-history"></i> آخر الحركات</div>';
    if (!flows.length) {
      h += '<div class="empty-state"><i class="ti ti-cash"></i>لا توجد حركات</div>';
    } else {
      h += flows.slice(0, 15).map(function(c) {
        var isIn = c.type === 'income';
        return '<div class="list-item"><div class="info"><strong>' + H.esc(c.description || c.desc || 'حركة') + '</strong><small>' + (c.date || '') + '</small></div>' +
          '<span style="font-weight:700;color:' + (isIn ? 'var(--GR)' : 'var(--RE)') + ';">' + (isIn ? '+' : '-') + ' ' + H.fmt(c.amount || 0) + ' ر.س</span></div>';
      }).join('');
    }
    h += '</div>';

    el.innerHTML = h;
  },

  add: function() {
    var DB = NEXORA.DB;
    var H = NEXORA.Helpers;
    var type = document.getElementById('turboCashType').value;
    var desc = document.getElementById('turboCashDesc').value.trim();
    var amount = parseFloat(document.getElementById('turboCashAmount').value) || 0;
    if (!desc || !amount) return H.msg('turboCashMsg', 'أدخل الوصف والمبلغ', 'error');

    if (!DB.cash_flow) DB.cash_flow = [];
    DB.cash_flow.push({
      id: H.gf(DB.cash_flow),
      project_id: App.curProjId || 0,
      type: type,
      description: desc,
      amount: amount,
      date: new Date().toISOString().split('T')[0]
    });
    DB.save();
    H.msg('turboCashMsg', 'تم التسجيل', 'success');
    document.getElementById('turboCashDesc').value = '';
    document.getElementById('turboCashAmount').value = '';
    NEXORA.Views.TurboCashflow.render();
  }
};

window.renderTurboCashflow = function() { NEXORA.Views.TurboCashflow.render(); };
