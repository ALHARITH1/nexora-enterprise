window.NEXORA = window.NEXORA || {};
NEXORA.Views = NEXORA.Views || {};

NEXORA.Views.Stakeholders = {
  render: function() {
    var App = NEXORA.App;
    var DB = NEXORA.DB;
    var H = NEXORA.Helpers;
    var el = document.getElementById('stakeholdersContent');
    if (!el) return;

    var pid = App.curProjId;
    if (!DB.stakeholders) DB.stakeholders = [];

    var projOptions = '<option value="">— اختر مشروع —</option>';
    DB.projects.forEach(function(p) {
      projOptions += '<option value="' + p.id + '"' + (pid == p.id ? ' selected' : '') + '>' + H.esc(p.name) + '</option>';
    });

    var filtered = pid ? DB.stakeholders.filter(function(s) { return s.project_id == pid; }) : DB.stakeholders;

    var high_high = 0, high_low = 0, low_high = 0, low_low = 0;
    filtered.forEach(function(s) {
      if (s.influence === 'high' && s.interest === 'high') high_high++;
      else if (s.influence === 'high') high_low++;
      else if (s.interest === 'high') low_high++;
      else low_low++;
    });

    var h = '<div class="card"><div class="flex-between"><div class="card-title"><i class="ti ti-users-group"></i> أصحاب المصلحة</div>' +
      '<div style="display:flex;gap:8px;align-items:center;">' +
      '<select id="shProjSelect" style="width:auto;min-width:180px;margin:0;" onchange="NEXORA.App.curProjId=this.value?parseInt(this.value):null;NEXORA.Views.Stakeholders.render()">' + projOptions + '</select>' +
      '<button class="btn btn-primary btn-sm" onclick="NEXORA.Views.Stakeholders._showForm()"><i class="ti ti-plus"></i> إضافة</button>' +
      '</div></div></div>';

    h += '<div class="stats">' +
      '<div class="stat-card purple"><div class="num">' + filtered.length + '</div><div class="lbl">الإجمالي</div></div>' +
      '<div class="stat-card green"><div class="num">' + high_high + '</div><div class="lbl">إدارة مكثفة</div></div>' +
      '<div class="stat-card blue"><div class="num">' + high_low + '</div><div class="lbl">إرضاء</div></div>' +
      '<div class="stat-card gold"><div class="num">' + low_high + '</div><div class="lbl">إعلام</div></div>' +
    '</div>';

    h += '<div class="card"><div id="shFormArea"></div></div>';

    h += '<div class="card"><div class="card-title"><i class="ti ti-table"></i> قائمة أصحاب المصلحة</div>';
    if (!filtered.length) {
      h += '<div class="empty-state"><i class="ti ti-users-group"></i>لا يوجد أصحاب مصلحة مسجلون</div>';
    } else {
      h += '<div class="table-responsive"><table class="table"><thead><tr><th>الاسم</th><th>الدور</th><th>الهاتف</th><th>التأثير</th><th>الاهتمام</th><th>التصنيف</th><th></th></tr></thead><tbody>';
      filtered.forEach(function(s) {
        var cls = s.influence === 'high' && s.interest === 'high' ? 'badge-done' :
                  s.influence === 'high' ? 'badge-progress' :
                  s.interest === 'high' ? 'badge-todo' : '';
        var clsLabel = s.influence === 'high' && s.interest === 'high' ? 'إدارة مكثفة' :
                       s.influence === 'high' ? 'إرضاء' :
                       s.interest === 'high' ? 'إعلام' : 'مراقبة';
        h += '<tr><td><strong>' + H.esc(s.name) + '</strong></td><td>' + H.esc(s.role) + '</td><td>' + H.esc(s.phone || '-') + '</td>' +
          '<td>' + (s.influence === 'high' ? 'عالي' : 'منخفض') + '</td><td>' + (s.interest === 'high' ? 'عالي' : 'منخفض') + '</td>' +
          '<td><span class="badge ' + cls + '">' + clsLabel + '</span></td>' +
          '<td><button class="btn btn-sm btn-o" onclick="NEXORA.Views.Stakeholders._remove(' + s.id + ')"><i class="ti ti-trash"></i></button></td></tr>';
      });
      h += '</tbody></table></div>';
    }
    h += '</div>';

    el.innerHTML = h;
  },

  _showForm: function() {
    var area = document.getElementById('shFormArea');
    if (!area) return;
    area.innerHTML = '<div class="card" style="border:2px solid var(--P);">' +
      '<div class="card-title">إضافة صاحب مصلحة جديد</div>' +
      '<div class="grid-2">' +
        '<div class="form-group"><label>الاسم</label><input id="shName" class="form-input" required></div>' +
        '<div class="form-group"><label>الدور</label><select id="shRole" class="form-input"><option>عميل</option><option>مقاول فرعي</option><option>جهة حكومية</option><option>مزود</option><option>مجتمع محلي</option><option>مستثمر</option></select></div>' +
        '<div class="form-group"><label>الهاتف</label><input id="shPhone" class="form-input"></div>' +
        '<div class="form-group"><label>البريد</label><input id="shEmail" class="form-input" type="email"></div>' +
        '<div class="form-group"><label>التأثير</label><select id="shInfluence" class="form-input"><option value="high">عالي</option><option value="low">منخفض</option></select></div>' +
        '<div class="form-group"><label>الاهتمام</label><select id="shInterest" class="form-input"><option value="high">عالي</option><option value="low">منخفض</option></select></div>' +
      '</div>' +
      '<div style="display:flex;gap:8px;margin-top:12px;">' +
        '<button class="btn btn-primary" onclick="NEXORA.Views.Stakeholders._save()"><i class="ti ti-check"></i> حفظ</button>' +
        '<button class="btn btn-o" onclick="document.getElementById(\'shFormArea\').innerHTML=\'\'">إلغاء</button>' +
      '</div></div>';
  },

  _save: function() {
    var name = document.getElementById('shName').value.trim();
    if (!name) { showToast('أدخل الاسم', 'warning'); return; }
    if (!NEXORA.DB.stakeholders) NEXORA.DB.stakeholders = [];
    NEXORA.DB.stakeholders.push({
      id: NEXORA.Helpers.gf(NEXORA.DB.stakeholders),
      project_id: NEXORA.App.curProjId,
      name: name,
      role: document.getElementById('shRole').value,
      phone: document.getElementById('shPhone').value.trim(),
      email: document.getElementById('shEmail').value.trim(),
      influence: document.getElementById('shInfluence').value,
      interest: document.getElementById('shInterest').value,
      created_at: new Date().toISOString()
    });
    NEXORA.DB.save();
    showToast('تمت الإضافة بنجاح', 'success');
    this.render();
  },

  _remove: function(id) {
    NEXORA.DB.stakeholders = NEXORA.DB.stakeholders.filter(function(s) { return s.id !== id; });
    NEXORA.DB.save();
    this.render();
  }
};

window.renderStakeholders = function() { NEXORA.Views.Stakeholders.render(); };
