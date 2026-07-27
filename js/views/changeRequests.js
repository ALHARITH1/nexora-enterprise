window.NEXORA = window.NEXORA || {};
NEXORA.Views = NEXORA.Views || {};

NEXORA.Views.ChangeRequests = {
  render: function() {
    var App = NEXORA.App;
    var DB = NEXORA.DB;
    var H = NEXORA.Helpers;
    var el = document.getElementById('changesContent');
    if (!el) return;

    var pid = App.curProjId;
    if (!DB.change_requests) DB.change_requests = [];

    var projOptions = '<option value="">— اختر مشروع —</option>';
    DB.projects.forEach(function(p) {
      projOptions += '<option value="' + p.id + '"' + (pid == p.id ? ' selected' : '') + '>' + H.esc(p.name) + '</option>';
    });

    var filtered = pid ? DB.change_requests.filter(function(c) { return c.project_id == pid; }) : DB.change_requests;

    var pending = 0, review = 0, approved = 0, rejected = 0;
    filtered.forEach(function(c) {
      if (c.status === 'مقدم') pending++;
      else if (c.status === 'قيد المراجعة') review++;
      else if (c.status === 'معتمد') approved++;
      else if (c.status === 'مرفوض') rejected++;
    });

    var h = '<div class="card"><div class="flex-between"><div class="card-title"><i class="ti ti-git-branch"></i> طلبات التغيير</div>' +
      '<div style="display:flex;gap:8px;align-items:center;">' +
      '<select id="crProjSelect" style="width:auto;min-width:180px;margin:0;" onchange="NEXORA.App.curProjId=this.value?parseInt(this.value):null;NEXORA.Views.ChangeRequests.render()">' + projOptions + '</select>' +
      '<button class="btn btn-primary btn-sm" onclick="NEXORA.Views.ChangeRequests._showForm()"><i class="ti ti-plus"></i> طلب جديد</button>' +
      '</div></div></div>';

    h += '<div class="stats">' +
      '<div class="stat-card gold"><div class="num">' + pending + '</div><div class="lbl">مقدم</div></div>' +
      '<div class="stat-card blue"><div class="num">' + review + '</div><div class="lbl">قيد المراجعة</div></div>' +
      '<div class="stat-card green"><div class="num">' + approved + '</div><div class="lbl">معتمد</div></div>' +
      '<div class="stat-card"><div class="num" style="color:var(--R);">' + rejected + '</div><div class="lbl">مرفوض</div></div>' +
    '</div>';

    h += '<div class="card"><div id="crFormArea"></div></div>';

    h += '<div class="card"><div class="card-title"><i class="ti ti-table"></i> الطلبات</div>';
    if (!filtered.length) {
      h += '<div class="empty-state"><i class="ti ti-git-branch"></i>لا توجد طلبات تغيير</div>';
    } else {
      h += '<div class="table-responsive"><table class="table"><thead><tr><th>العنوان</th><th>النوع</th><th>التأثير</th><th>الطالب</th><th>التاريخ</th><th>الحالة</th><th></th></tr></thead><tbody>';
      filtered.forEach(function(c) {
        var stCls = c.status === 'معتمد' ? 'badge-done' : c.status === 'مرفوض' ? 'badge-todo' : c.status === 'قيد المراجعة' ? 'badge-progress' : '';
        var canReview = NEXORA.RBAC.canEdit() && (c.status === 'مقدم' || c.status === 'قيد المراجعة');
        h += '<tr><td><strong>' + H.esc(c.title) + '</strong></td><td>' + H.esc(c.type || '-') + '</td>' +
          '<td><span class="badge ' + (c.impact === 'عالي' ? 'badge-todo' : c.impact === 'متوسط' ? 'badge-progress' : 'badge-done') + '">' + H.esc(c.impact || '-') + '</span></td>' +
          '<td>' + H.esc(c.requested_by_name || '-') + '</td><td>' + (c.created_at ? new Date(c.created_at).toLocaleDateString('ar-SA') : '-') + '</td>' +
          '<td><span class="badge ' + stCls + '">' + H.esc(c.status) + '</span></td>' +
          '<td>' + (canReview ?
            '<button class="btn btn-sm btn-success" onclick="NEXORA.Views.ChangeRequests._updateStatus(' + c.id + ',\'معتمد\')" title="اعتماد"><i class="ti ti-check"></i></button> ' +
            '<button class="btn btn-sm btn-o" style="color:var(--R);" onclick="NEXORA.Views.ChangeRequests._updateStatus(' + c.id + ',\'مرفوض\')" title="رفض"><i class="ti ti-x"></i></button>'
            : '') +
          '<button class="btn btn-sm btn-o" onclick="NEXORA.Views.ChangeRequests._remove(' + c.id + ')" style="margin-right:4px;"><i class="ti ti-trash"></i></button></td></tr>';
      });
      h += '</tbody></table></div>';
    }
    h += '</div>';

    el.innerHTML = h;
  },

  _showForm: function() {
    var area = document.getElementById('crFormArea');
    if (!area) return;
    area.innerHTML = '<div class="card" style="border:2px solid var(--P);">' +
      '<div class="card-title">طلب تغيير جديد</div>' +
      '<div class="grid-2">' +
        '<div class="form-group"><label>العنوان</label><input id="crTitle" class="form-input" required></div>' +
        '<div class="form-group"><label>النوع</label><select id="crType" class="form-input"><option>نطاق</option><option>جدول زمني</option><option>تكاليف</option><option>جودة</option><option>أخرى</option></select></div>' +
        '<div class="form-group"><label>التأثير</label><select id="crImpact" class="form-input"><option>عالي</option><option>متوسط</option><option>منخفض</option></select></div>' +
      '</div>' +
      '<div class="form-group"><label>الوصف</label><textarea id="crDesc" class="form-input" rows="3"></textarea></div>' +
      '<div style="display:flex;gap:8px;margin-top:12px;">' +
        '<button class="btn btn-primary" onclick="NEXORA.Views.ChangeRequests._save()"><i class="ti ti-check"></i> إرسال</button>' +
        '<button class="btn btn-o" onclick="document.getElementById(\'crFormArea\').innerHTML=\'\'">إلغاء</button>' +
      '</div></div>';
  },

  _save: function() {
    var title = document.getElementById('crTitle').value.trim();
    if (!title) { showToast('أدخل عنوان الطلب', 'warning'); return; }
    if (!NEXORA.DB.change_requests) NEXORA.DB.change_requests = [];
    var user = NEXORA.Auth.getUser();
    NEXORA.DB.change_requests.push({
      id: NEXORA.Helpers.gf(NEXORA.DB.change_requests),
      project_id: NEXORA.App.curProjId,
      title: title,
      description: document.getElementById('crDesc').value.trim(),
      type: document.getElementById('crType').value,
      impact: document.getElementById('crImpact').value,
      status: 'مقدم',
      requested_by: user ? user.id : 0,
      requested_by_name: user ? user.full_name : '',
      created_at: new Date().toISOString()
    });
    NEXORA.DB.save();
    showToast('تم إرسال طلب التغيير', 'success');
    this.render();
  },

  _updateStatus: function(id, status) {
    var cr = NEXORA.DB.change_requests.find(function(c) { return c.id === id; });
    if (cr) {
      cr.status = status;
      cr.reviewed_at = new Date().toISOString();
      NEXORA.DB.save();
      showToast('تم تحديث الحالة', 'success');
      this.render();
    }
  },

  _remove: function(id) {
    NEXORA.DB.change_requests = NEXORA.DB.change_requests.filter(function(c) { return c.id !== id; });
    NEXORA.DB.save();
    this.render();
  }
};

window.renderChangeRequests = function() { NEXORA.Views.ChangeRequests.render(); };
