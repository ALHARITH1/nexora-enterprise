window.NEXORA = window.NEXORA || {};
NEXORA.Views = NEXORA.Views || {};

NEXORA.Views.Contracts = {
  render: function() {
    var App = NEXORA.App;
    var DB = NEXORA.DB;
    var H = NEXORA.Helpers;
    var el = document.getElementById('contractsContent');
    if (!el) return;

    var pid = App.curProjId;
    if (!DB.contracts) DB.contracts = [];

    var projOptions = '<option value="">— اختر مشروع —</option>';
    DB.projects.forEach(function(p) {
      projOptions += '<option value="' + p.id + '"' + (pid == p.id ? ' selected' : '') + '>' + H.esc(p.name) + '</option>';
    });

    var filtered = pid ? DB.contracts.filter(function(c) { return c.project_id == pid; }) : DB.contracts;

    var totalVal = 0, activeCount = 0, completedCount = 0;
    filtered.forEach(function(c) {
      totalVal += c.value || 0;
      if (c.status === 'نشط') activeCount++;
      if (c.status === 'مكتمل') completedCount++;
    });

    var h = '<div class="card"><div class="flex-between"><div class="card-title"><i class="ti ti-file-text"></i> إدارة العقود</div>' +
      '<div style="display:flex;gap:8px;align-items:center;">' +
      '<select id="ctProjSelect" style="width:auto;min-width:180px;margin:0;" onchange="NEXORA.App.curProjId=this.value?parseInt(this.value):null;NEXORA.Views.Contracts.render()">' + projOptions + '</select>' +
      '<button class="btn btn-primary btn-sm" onclick="NEXORA.Views.Contracts._showForm()"><i class="ti ti-plus"></i> عقد جديد</button>' +
      '</div></div></div>';

    h += '<div class="stats">' +
      '<div class="stat-card purple"><div class="num">' + filtered.length + '</div><div class="lbl">العقود</div></div>' +
      '<div class="stat-card green"><div class="num">' + activeCount + '</div><div class="lbl">نشطة</div></div>' +
      '<div class="stat-card blue"><div class="num">' + completedCount + '</div><div class="lbl">مكتملة</div></div>' +
      '<div class="stat-card gold"><div class="num">' + H.fmt(totalVal) + '</div><div class="lbl">القيمة الإجمالية</div></div>' +
    '</div>';

    h += '<div class="card"><div id="ctFormArea"></div></div>';

    h += '<div class="card"><div class="card-title"><i class="ti ti-table"></i> العقود</div>';
    if (!filtered.length) {
      h += '<div class="empty-state"><i class="ti ti-file-text"></i>لا توجد عقود مسجلة</div>';
    } else {
      h += '<div class="table-responsive"><table class="table"><thead><tr><th>رقم العقد</th><th>العنوان</th><th>المقاول</th><th>النوع</th><th>القيمة</th><th>من</th><th>إلى</th><th>الحالة</th><th></th></tr></thead><tbody>';
      filtered.forEach(function(c) {
        var stCls = c.status === 'نشط' ? 'badge-done' : c.status === 'مكتمل' ? 'badge-progress' : c.status === 'ملغي' ? 'badge-todo' : '';
        h += '<tr><td>' + H.esc(c.contract_no || '-') + '</td><td><strong>' + H.esc(c.title) + '</strong></td><td>' + H.esc(c.contractor_name || '-') + '</td>' +
          '<td>' + H.esc(c.type || '-') + '</td><td>' + H.fmt(c.value || 0) + '</td><td>' + (c.start_date || '-') + '</td><td>' + (c.end_date || '-') + '</td>' +
          '<td><span class="badge ' + stCls + '">' + H.esc(c.status) + '</span></td>' +
          '<td><button class="btn btn-sm btn-o" onclick="NEXORA.Views.Contracts._remove(' + c.id + ')"><i class="ti ti-trash"></i></button></td></tr>';
      });
      h += '</tbody></table></div>';
    }
    h += '</div>';

    el.innerHTML = h;
  },

  _showForm: function() {
    var area = document.getElementById('ctFormArea');
    if (!area) return;
    area.innerHTML = '<div class="card" style="border:2px solid var(--P);">' +
      '<div class="card-title">عقد جديد</div>' +
      '<div class="grid-2">' +
        '<div class="form-group"><label>رقم العقد</label><input id="ctNo" class="form-input"></div>' +
        '<div class="form-group"><label>العنوان</label><input id="ctTitle" class="form-input" required></div>' +
        '<div class="form-group"><label>المقاول/المورد</label><input id="ctContractor" class="form-input"></div>' +
        '<div class="form-group"><label>النوع</label><select id="ctType" class="form-input"><option>توريد</option><option>مقاولات فرعية</option><option>استشاري</option><option>أخرى</option></select></div>' +
        '<div class="form-group"><label>القيمة</label><input id="ctValue" class="form-input" type="number" min="0"></div>' +
        '<div class="form-group"><label>الحالة</label><select id="ctStatus" class="form-input"><option>نشط</option><option>مكتمل</option><option>ملغي</option><option>معلق</option></select></div>' +
        '<div class="form-group"><label>تاريخ البداية</label><input id="ctStart" class="form-input" type="date"></div>' +
        '<div class="form-group"><label>تاريخ النهاية</label><input id="ctEnd" class="form-input" type="date"></div>' +
      '</div>' +
      '<div style="display:flex;gap:8px;margin-top:12px;">' +
        '<button class="btn btn-primary" onclick="NEXORA.Views.Contracts._save()"><i class="ti ti-check"></i> حفظ</button>' +
        '<button class="btn btn-o" onclick="document.getElementById(\'ctFormArea\').innerHTML=\'\'">إلغاء</button>' +
      '</div></div>';
  },

  _save: function() {
    var title = document.getElementById('ctTitle').value.trim();
    if (!title) { showToast('أدخل عنوان العقد', 'warning'); return; }
    if (!NEXORA.DB.contracts) NEXORA.DB.contracts = [];
    NEXORA.DB.contracts.push({
      id: NEXORA.Helpers.gf(NEXORA.DB.contracts),
      project_id: NEXORA.App.curProjId,
      contract_no: document.getElementById('ctNo').value.trim(),
      title: title,
      contractor_name: document.getElementById('ctContractor').value.trim(),
      type: document.getElementById('ctType').value,
      value: parseFloat(document.getElementById('ctValue').value) || 0,
      status: document.getElementById('ctStatus').value,
      start_date: document.getElementById('ctStart').value,
      end_date: document.getElementById('ctEnd').value,
      created_at: new Date().toISOString()
    });
    NEXORA.DB.save();
    showToast('تم إضافة العقد', 'success');
    this.render();
  },

  _remove: function(id) {
    NEXORA.DB.contracts = NEXORA.DB.contracts.filter(function(c) { return c.id !== id; });
    NEXORA.DB.save();
    this.render();
  }
};

window.renderContracts = function() { NEXORA.Views.Contracts.render(); };
