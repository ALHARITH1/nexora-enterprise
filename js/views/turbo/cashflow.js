window.NEXORA = window.NEXORA || {};
NEXORA.Views = NEXORA.Views || {};

NEXORA.Views.TurboCashflow = {
  render: function() {
    var DB = NEXORA.DB;
    var H = NEXORA.Helpers;
    var el = document.getElementById('turboCashflowContent');
    if (!el) return;

    var flows = (DB.cash_flow || []).sort(function(a, b) {
      var dA = a.transaction_date || a.date || '';
      var dB = b.transaction_date || b.date || '';
      return dB.localeCompare(dA);
    });

    var summary = window.NEXORA.FinanceUtils ? window.NEXORA.FinanceUtils.calculateCashFlowSummary(flows) : { inflow: 0, outflow: 0, netBalance: 0 };
    var totalIn = summary.inflow;
    var totalOut = summary.outflow;
    var balance = summary.netBalance;

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
        '<select id="turboCashType" class="turbo-input"><option value="inflow">وارد (+)</option><option value="outflow">صادر (-)</option></select>' +
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
        var isIn = (c.type === 'inflow' || c.type === 'income');
        var dStr = c.transaction_date || c.date || '';
        return '<div class="list-item"><div class="info"><strong>' + H.esc(c.description || c.desc || 'حركة') + '</strong><small>' + dStr + '</small></div>' +
          '<span style="font-weight:700;color:' + (isIn ? 'var(--GR)' : 'var(--RE)') + ';">' + (isIn ? '+' : '-') + ' ' + H.fmt(c.amount || 0) + ' ر.س</span></div>';
      }).join('');
    }
    h += '</div>';

    el.innerHTML = h;
  },

  add: async function() {
    var DB = NEXORA.DB;
    var H = NEXORA.Helpers;
    var rawType = document.getElementById('turboCashType').value;
    var type = (rawType === 'income' || rawType === 'inflow') ? 'inflow' : 'outflow';
    var desc = document.getElementById('turboCashDesc').value.trim();
    var amount = parseFloat(document.getElementById('turboCashAmount').value) || 0;
    if (!desc || !amount) return H.msg('turboCashMsg', 'أدخل الوصف والمبلغ', 'error');

    var curProjId = (NEXORA.App && NEXORA.App.curProjId) ? NEXORA.App.curProjId : null;
    var todayStr = window.NEXORA.DateUtils ? window.NEXORA.DateUtils.getLocalDateString() : new Date().toISOString().split('T')[0];

    const record = {
      project_id: curProjId,
      type: type,
      category: 'عام',
      description: desc,
      amount: amount,
      transaction_date: todayStr,
      date: todayStr
    };

    if (NEXORA.Repositories && NEXORA.Repositories.cashFlow) {
      await NEXORA.Repositories.cashFlow.create(record);
    } else {
      if (!DB.cash_flow) DB.cash_flow = [];
      record.id = H.gf(DB.cash_flow);
      DB.cash_flow.push(record);
      if (DB.save) DB.save();
    }

    H.msg('turboCashMsg', 'تم التسجيل', 'success');
    document.getElementById('turboCashDesc').value = '';
    document.getElementById('turboCashAmount').value = '';
    NEXORA.Views.TurboCashflow.render();
  }
};

window.renderTurboCashflow = function() { NEXORA.Views.TurboCashflow.render(); };
