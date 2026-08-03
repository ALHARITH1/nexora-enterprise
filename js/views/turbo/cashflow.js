window.NEXORA = window.NEXORA || {};
NEXORA.Views = NEXORA.Views || {};

NEXORA.Views.TurboCashflow = {
  render: async function() {
    var H = NEXORA.Helpers;
    var el = document.getElementById('turboCashflowContent');
    if (!el) return;

    el.innerHTML = '<div class="card"><div class="empty-state"><i class="ti ti-loader"></i>جاري التحميل...</div></div>';

    try {
      var allFlows = await NEXORA.Repositories.cash_flow.list();
      var flows = allFlows.sort(function(a, b) {
        var dA = a.transaction_date || a.date || '';
        var dB = b.transaction_date || b.date || '';
        return dB.localeCompare(dA);
      });

      var summary = window.NEXORA.FinanceUtils ? window.NEXORA.FinanceUtils.calculateCashFlowSummary(flows) : { inflow: 0, outflow: 0, netBalance: 0 };
      var totalIn = summary.inflow;
      var totalOut = summary.outflow;
      var balance = summary.netBalance;

      // Clear existing content safely
      el.textContent = '';

      var header = document.createElement('div');
      header.className = 'turbo-section-header';
      header.innerHTML = '<h2><i class="ti ti-cash"></i> السيولة النقدية</h2>';
      el.appendChild(header);

      var balCard = document.createElement('div');
      balCard.className = 'turbo-balance-card';
      balCard.innerHTML = 
        '<div class="turbo-balance-row"><span class="turbo-bal-label">وارد</span><span style="color:var(--GR);font-weight:700;">+ ' + H.fmt(totalIn) + '</span></div>' +
        '<div class="turbo-balance-row"><span class="turbo-bal-label">صادر</span><span style="color:var(--RE);font-weight:700;">- ' + H.fmt(totalOut) + '</span></div>' +
        '<div class="turbo-balance-row" style="border-top:2px solid var(--BD);padding-top:8px;"><span class="turbo-bal-label" style="font-weight:700;">الرصيد</span>' +
        '<span style="font-size:var(--fs-xl);font-weight:700;color:' + (balance >= 0 ? 'var(--GR)' : 'var(--RE)') + ';">' + H.fmt(balance) + ' ر.س</span></div>';
      el.appendChild(balCard);

      var formCard = document.createElement('div');
      formCard.className = 'turbo-quick-form card';
      formCard.innerHTML = 
        '<div class="card-title"><i class="ti ti-plus"></i> إدخال حركة</div>' +
        '<div id="turboCashMsg" class="message-box"></div>' +
        '<div class="turbo-form-row">' +
          '<select id="turboCashType" class="turbo-input"><option value="inflow">وارد (+)</option><option value="outflow">صادر (-)</option></select>' +
          '<input type="text" id="turboCashDesc" class="turbo-input" placeholder="الوصف">' +
          '<input type="number" id="turboCashAmount" class="turbo-input" placeholder="المبلغ">' +
        '</div>' +
        '<button class="btn btn-primary" data-action="turboCashflowAdd"><i class="ti ti-check"></i> تسجيل</button>';
      el.appendChild(formCard);

      var historyCard = document.createElement('div');
      historyCard.className = 'card';
      historyCard.innerHTML = '<div class="card-title"><i class="ti ti-history"></i> آخر الحركات</div>';
      
      if (!flows.length) {
        var empty = document.createElement('div');
        empty.className = 'empty-state';
        empty.innerHTML = '<i class="ti ti-cash"></i>لا توجد حركات';
        historyCard.appendChild(empty);
      } else {
        flows.slice(0, 15).forEach(function(c) {
          var isIn = (c.type === 'inflow' || c.type === 'income');
          var dStr = c.transaction_date || c.date || '';
          
          var row = document.createElement('div');
          row.className = 'list-item';
          
          var info = document.createElement('div');
          info.className = 'info';
          var descStrong = document.createElement('strong');
          descStrong.textContent = c.description || c.desc || 'حركة'; // User text via textContent
          var dateSmall = document.createElement('small');
          dateSmall.textContent = dStr;
          
          info.appendChild(descStrong);
          info.appendChild(dateSmall);
          
          var amtSpan = document.createElement('span');
          amtSpan.style.fontWeight = '700';
          amtSpan.style.color = isIn ? 'var(--GR)' : 'var(--RE)';
          amtSpan.textContent = (isIn ? '+' : '-') + ' ' + H.fmt(c.amount || 0) + ' ر.س';
          
          row.appendChild(info);
          row.appendChild(amtSpan);
          historyCard.appendChild(row);
        });
      }
      el.appendChild(historyCard);

    } catch(err) {
      el.textContent = '';
      var errDiv = document.createElement('div');
      errDiv.className = 'card';
      errDiv.innerHTML = '<div class="empty-state"><i class="ti ti-alert-triangle" style="color:var(--ER);"></i>حدث خطأ: <span class="err-text"></span></div>';
      errDiv.querySelector('.err-text').textContent = err.message;
      el.appendChild(errDiv);
    }
  },

  add: async function() {
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

    try {
      await NEXORA.Repositories.cash_flow.create(record);
      H.msg('turboCashMsg', 'تم التسجيل', 'success');
      document.getElementById('turboCashDesc').value = '';
      document.getElementById('turboCashAmount').value = '';
      await NEXORA.Views.TurboCashflow.render();
    } catch(err) {
      H.msg('turboCashMsg', err.message, 'error');
    }
  }
};

window.renderTurboCashflow = function() { NEXORA.Views.TurboCashflow.render(); };
