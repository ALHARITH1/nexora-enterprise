window.NEXORA = window.NEXORA || {};
NEXORA.Views = NEXORA.Views || {};

NEXORA.Views.BOQ = {
  render: async function() {
    var App = NEXORA.App;
    var H = NEXORA.Helpers;
    var pid = App.curProjId;
    var el = document.getElementById('boqContent');
    if (!el) return;

    el.innerHTML = '<div class="card"><div class="empty-state"><i class="ti ti-loader"></i>جاري التحميل...</div></div>';

    var units = ['m2', 'm3', 'nos', 'kg', 'lm', 'm', 'each'];
    var unitLabels = {'m2': 'م2', 'm3': 'م3', 'nos': 'عدد', 'kg': 'كجم', 'lm': 'م', 'm': 'متر', 'each': 'قطعة'};

    try {
      var projects = await NEXORA.Repositories.projects.list();
      var p = projects.find(x => String(x.id) === String(pid));

      var projOpts = '<option value="">-- اختر مشروع --</option>';
      projects.forEach(function(pr) {
        var sel = String(pr.id) === String(pid) ? ' selected' : '';
        projOpts += '<option value="' + pr.id + '"' + sel + '>' + H.esc(pr.name) + '</option>';
      });

      var h = '<div class="card" style="padding:12px 16px;">' +
        '<div class="flex-between">' +
          '<div style="display:flex;align-items:center;gap:10px;">' +
            '<label style="margin:0;white-space:nowrap;">المشروع:</label>' +
            '<select id="boqProjSelect" onchange="BOQSwitchProject(this.value)" style="min-width:200px;">' + projOpts + '</select>' +
          '</div>' +
        '</div>' +
      '</div>';

      if (!pid || !p) {
        h += '<div class="card"><div class="empty-state"><i class="ti ti-clipboard-list"></i>اختر مشروع لعرض جدول الكميات</div></div>';
        el.innerHTML = h;
        return;
      }

      var boq = await NEXORA.Repositories.boq_items.list({ project_id: pid });
      var totalAmount = boq.reduce(function(s, b) { return s + (parseFloat(b.amount) || 0); }, 0);
      var totalExecuted = boq.reduce(function(s, b) { return s + (parseFloat(b.executed_amount) || 0); }, 0);
      var execPct = totalAmount > 0 ? Math.round(totalExecuted / totalAmount * 100) : 0;
      var progressColor = execPct >= 75 ? 'green' : execPct >= 40 ? 'orange' : 'blue';

      var unitOpts = '';
      units.forEach(function(u) {
        unitOpts += '<option value="' + u + '">' + unitLabels[u] + ' (' + u + ')</option>';
      });

      h += '<div class="stats">' +
        '<div class="stat-card blue"><div class="num">' + boq.length + '</div><div class="lbl">عدد البنود</div></div>' +
        '<div class="stat-card gold"><div class="num">' + H.fmt(totalAmount) + '</div><div class="lbl">إجمالي المبلغ</div></div>' +
        '<div class="stat-card green"><div class="num">' + H.fmt(totalExecuted) + '</div><div class="lbl">المبلغ المنفذ</div></div>' +
        '<div class="stat-card ' + (execPct >= 75 ? 'green' : execPct >= 40 ? 'orange' : 'blue') + '">' +
          '<div class="num">' + execPct + '%</div><div class="lbl">نسبة التنفيذ</div></div>' +
      '</div>';

      h += '<div style="margin-bottom:16px;">' +
        '<div style="display:flex;justify-content:space-between;margin-bottom:4px;">' +
          '<span style="font-weight:600;font-size:13px;">تقدم التنفيذ</span>' +
          '<span style="font-weight:700;font-size:13px;color:var(--P);">' + execPct + '%</span>' +
        '</div>' +
        '<div class="progress-bar" style="height:10px;">' +
          '<div class="progress-fill ' + progressColor + '" style="width:' + execPct + '%"></div>' +
        '</div>' +
      '</div>';

      h += '<div class="card"><div class="card-title"><i class="ti ti-plus-circle"></i> إضافة بند جديد</div>' +
        '<div id="boqMsg" class="message-box"></div>' +
        '<div class="grid-4">' +
          '<div><label>رقم البند</label><input type="text" id="fBoqItemNo" placeholder="1.1"></div>' +
          '<div><label>الوصف</label><input type="text" id="fBoqName" placeholder="أعمال الحفر"></div>' +
          '<div><label>الوحدة</label><select id="fBoqUnit">' + unitOpts + '</select></div>' +
          '<div><label>الكمية</label><input type="number" id="fBoqQty" placeholder="100" step="any"></div>' +
        '</div>' +
        '<div class="grid-2" style="max-width:420px;">' +
          '<div><label>سعر الوحدة</label><input type="number" id="fBoqRate" placeholder="500" step="any"></div>' +
          '<div><label>المبلغ</label><input type="number" id="fBoqAmount" readonly placeholder="0" style="background:var(--BG);"></div>' +
        '</div>' +
        '<button class="btn btn-primary" onclick="addBOQItem()" id="btnAddBoq"><i class="ti ti-device-floppy"></i> إضافة</button>' +
      '</div>';

      h += '<div class="card"><div class="card-title"><i class="ti ti-clipboard-list"></i> جدول الكميات - ' + H.esc(p.name) + '</div>' +
        '<div style="overflow-x:auto;"><table>' +
          '<tr><th>رقم البند</th><th>الوصف</th><th>الوحدة</th><th>الكمية</th><th>سعر الوحدة</th><th>المبلغ</th><th>المنفذ</th><th>المبلغ المنفذ</th><th>الحالة</th><th>إجراءات</th></tr>';

      if (!boq.length) {
        h += '<tr><td colspan="10" style="text-align:center;color:var(--TX2);padding:30px;">لا توجد بنود بعد</td></tr>';
      } else {
        boq.forEach(function(b) {
          var stClass = b.status === 'done' ? 'badge-done' : b.status === 'in_progress' ? 'badge-progress' : 'badge-pending';
          var stLabel = b.status === 'done' ? '✓ منجز' : b.status === 'in_progress' ? '● جاري' : '○ بانتظار';
          h += '<tr id="boqRow_' + b.id + '">' +
            '<td style="font-weight:700;">' + H.esc(b.item_no || '') + '</td>' +
            '<td>' + H.esc(b.name) + '</td>' +
            '<td>' + H.esc(unitLabels[b.unit] || b.unit) + '</td>' +
            '<td>' + H.fmt(b.quantity) + '</td>' +
            '<td>' + H.fmt(b.unit_rate) + '</td>' +
            '<td style="font-weight:700;">' + H.fmt(b.amount) + '</td>' +
            '<td><input type="number" id="execQty_' + b.id + '" value="' + (b.executed_qty || 0) + '" step="any" style="width:80px;padding:4px 8px;font-size:12px;" onchange="updateExecQty(\'' + b.id + '\', this.value)"></td>' +
            '<td style="font-weight:700;color:var(--GR);">' + H.fmt(b.executed_amount || 0) + '</td>' +
            '<td><span class="badge ' + stClass + '">' + stLabel + '</span></td>' +
            '<td>' +
              '<button class="btn btn-sm btn-o" onclick="editBOQItem(\'' + b.id + '\')" title="تعديل"><i class="ti ti-pencil"></i></button> ' +
              '<button class="btn btn-sm btn-danger" onclick="deleteBOQItem(\'' + b.id + '\')" title="حذف"><i class="ti ti-trash"></i></button>' +
            '</td>' +
          '</tr>';
        });

        h += '<tr style="background:var(--BG);font-weight:700;">' +
          '<td colspan="5" style="text-align:left;">الإجمالي</td>' +
          '<td>' + H.fmt(totalAmount) + '</td>' +
          '<td></td>' +
          '<td style="color:var(--GR);">' + H.fmt(totalExecuted) + '</td>' +
          '<td colspan="2"></td>' +
        '</tr>';
      }

      h += '</table></div></div>';
      el.innerHTML = h;

      var rateEl = document.getElementById('fBoqRate');
      var qtyEl = document.getElementById('fBoqQty');
      var amtEl = document.getElementById('fBoqAmount');
      function calcAmount() {
        var q = parseFloat(qtyEl.value) || 0;
        var r = parseFloat(rateEl.value) || 0;
        amtEl.value = q * r;
      }
      if (rateEl && qtyEl && amtEl) {
        rateEl.addEventListener('input', calcAmount);
        qtyEl.addEventListener('input', calcAmount);
      }
    } catch(err) {
      el.innerHTML = '<div class="card"><div class="empty-state"><i class="ti ti-alert-triangle" style="color:var(--ER);"></i>حدث خطأ: ' + H.esc(err.message) + '</div></div>';
    }
  }
};

window.renderBOQ = function() { NEXORA.Views.BOQ.render(); };

window.BOQSwitchProject = function(pid) {
  NEXORA.App.curProjId = pid ? String(pid) : null;
  NEXORA.Views.BOQ.render();
};

window.addBOQItem = async function() {
  var App = NEXORA.App;
  var H = NEXORA.Helpers;
  var pid = App.curProjId;
  if (!pid) return H.msg('boqMsg', 'اختر مشروع أولاً', 'error');

  var itemNo = document.getElementById('fBoqItemNo').value.trim();
  var name = document.getElementById('fBoqName').value.trim();
  var unit = document.getElementById('fBoqUnit').value;
  var qty = parseFloat(document.getElementById('fBoqQty').value) || 0;
  var rate = parseFloat(document.getElementById('fBoqRate').value) || 0;

  if (!name) return H.msg('boqMsg', 'أدخل وصف البند', 'error');
  if (qty <= 0) return H.msg('boqMsg', 'أدخل كمية صحيحة', 'error');
  if (rate <= 0) return H.msg('boqMsg', 'أدخل سعر وحدة صحيح', 'error');

  var amount = qty * rate;
  const btn = document.getElementById('btnAddBoq');
  if (btn) btn.disabled = true;

  try {
    await NEXORA.Repositories.boq_items.create({
      project_id: pid,
      item_no: itemNo,
      name: name,
      unit: unit,
      quantity: qty,
      unit_rate: rate,
      amount: amount,
      executed_qty: 0,
      executed_amount: 0,
      status: 'pending'
    });

    H.msg('boqMsg', 'تمت إضافة البند بنجاح', 'success');
    if (typeof showToast === 'function') showToast('تمت إضافة البند: ' + name, 'success');
    await NEXORA.Views.BOQ.render();
  } catch (err) {
    H.msg('boqMsg', 'فشل: ' + err.message, 'error');
  } finally {
    if (btn) btn.disabled = false;
  }
};

window.updateExecQty = async function(id, val) {
  try {
    var b = await NEXORA.Repositories.boq_items.getById(id);
    if (!b) return;
    var q = parseFloat(val) || 0;
    var executed_amount = q * (parseFloat(b.unit_rate) || 0);
    var status = 'pending';
    if (q >= b.quantity && b.quantity > 0) status = 'done';
    else if (q > 0) status = 'in_progress';

    await NEXORA.Repositories.boq_items.update(id, {
      executed_qty: q,
      executed_amount: executed_amount,
      status: status
    });
    if (typeof showToast === 'function') showToast('تم تحديث التنفيذ', 'info');
    await NEXORA.Views.BOQ.render();
  } catch(err) {
    alert('فشل التحديث: ' + err.message);
  }
};

window.editBOQItem = async function(id) {
  try {
    var b = await NEXORA.Repositories.boq_items.getById(id);
    if (!b) return;

    var newNo = prompt('رقم البند:', b.item_no || '');
    if (newNo === null) return;
    var newName = prompt('الوصف:', b.name);
    if (newName === null) return;
    var newQtyStr = prompt('الكمية:', b.quantity);
    if (newQtyStr === null) return;
    var newRateStr = prompt('سعر الوحدة:', b.unit_rate);
    if (newRateStr === null) return;
    var newUnit = prompt('الوحدة (m2/m3/nos/kg/lm/m/each):', b.unit);
    if (newUnit === null) return;

    var newQty = parseFloat(newQtyStr) || 0;
    var newRate = parseFloat(newRateStr) || 0;

    await NEXORA.Repositories.boq_items.update(id, {
      item_no: newNo,
      name: newName,
      unit: newUnit,
      quantity: newQty,
      unit_rate: newRate,
      amount: newQty * newRate,
      executed_amount: (b.executed_qty || 0) * newRate
    });

    if (typeof showToast === 'function') showToast('تم تعديل البند', 'success');
    await NEXORA.Views.BOQ.render();
  } catch(err) {
    alert('فشل التعديل: ' + err.message);
  }
};

window.deleteBOQItem = async function(id) {
  if (!confirm('هل أنت متأكد من حذف هذا البند؟')) return;
  try {
    await NEXORA.Repositories.boq_items.delete(id);
    if (typeof showToast === 'function') showToast('تم حذف البند', 'success');
    await NEXORA.Views.BOQ.render();
  } catch(err) {
    alert('فشل الحذف: ' + err.message);
  }
};
