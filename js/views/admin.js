window.NEXORA = window.NEXORA || {};

NEXORA.Views = NEXORA.Views || {};

NEXORA.Views.Admin = {
  render: function() {
    var App = NEXORA.App;
    var DB = NEXORA.DB;
    var H = NEXORA.Helpers;
    var cu = App.cu;
    var el = document.getElementById('adminContent');
    if (!el) return;

    var h = '<div class="card"><div class="card-title"><i class="ti ti-user-plus"></i> إضافة موظف جديد</div>' +
      '<div id="adminMsg" class="message-box"></div>' +
      '<div class="grid-4">' +
        '<div><label>الاسم الكامل</label><input type="text" id="fEmpName" placeholder="محمد أحمد"></div>' +
        '<div><label>البريد الإلكتروني</label><input type="email" id="fEmpEmail" placeholder="m@company.com"></div>' +
        '<div><label>الدور</label><select id="fEmpRole">' +
          '<option value="مدير مشروع">مدير مشروع</option>' +
          '<option value="مهندس موقع" selected>مهندس موقع</option>' +
          '<option value="مشرف">مشرف</option>' +
          '<option value="محاسب">محاسب</option>' +
          '<option value="أمين مستودع">أمين مستودع</option>' +
          '<option value="عامل">عامل</option>' +
        '</select></div>' +
        '<div><label>أجر الساعة (ريال)</label><input type="number" id="fEmpRate" placeholder="50" value="50"></div>' +
      '</div>' +
      '<button class="btn btn-primary" onclick="addEmployee()"><i class="ti ti-plus"></i> إضافة الموظف</button>' +
    '</div>';

    h += '<div class="card"><div class="card-title"><i class="ti ti-users"></i> قائمة الموظفين</div><div id="adminEmpList"></div></div>';

    el.innerHTML = h;
    NEXORA.Views.Admin.renderUsers();
  },

  addEmployee: function() {
    var DB = NEXORA.DB;
    var H = NEXORA.Helpers;
    var cu = NEXORA.App.cu;

    var name = (document.getElementById('fEmpName') || {}).value.trim();
    var email = (document.getElementById('fEmpEmail') || {}).value.trim();
    var role = (document.getElementById('fEmpRole') || {}).value;
    var rate = parseFloat((document.getElementById('fEmpRate') || {}).value) || 50;

    if (!name || !email) return H.msg('adminMsg', 'أدخل الاسم والبريد', 'error');
    if (DB.employees.find(function(e) { return e.email === email; }))
      return H.msg('adminMsg', 'البريد موجود مسبقاً', 'error');

    DB.employees.push({
      id: H.gf(DB.employees),
      company_id: cu.company_id,
      full_name: name,
      email: email,
      role: role,
      is_admin: 0,
      hour_rate: rate
    });
    DB.save();
    H.msg('adminMsg', '✅ تمت إضافة الموظف', 'success');
    document.getElementById('fEmpName').value = '';
    document.getElementById('fEmpEmail').value = '';
    document.getElementById('fEmpRate').value = '50';
    NEXORA.Views.Admin.renderUsers();
  },

  renderUsers: function() {
    var DB = NEXORA.DB;
    var H = NEXORA.Helpers;
    var cu = NEXORA.App.cu;
    var c = document.getElementById('adminEmpList');
    if (!c) return;

    var emps = DB.employees.filter(function(e) { return e.company_id === cu.company_id; });

    if (!emps.length) {
      c.innerHTML = '<div class="empty-state"><i class="ti ti-users"></i>لا يوجد موظفون</div>';
      return;
    }

    c.innerHTML = emps.map(function(e) {
      var roleCls = NEXORA.Config.ROLES[e.role] || 'badge-worker';
      var adminBadge = e.is_admin ? ' <span class="badge badge-admin">مسؤول</span>' : '';
      return '<div class="list-item">' +
        '<div class="info"><strong>' + H.esc(e.full_name) + adminBadge + '</strong><small>' + H.esc(e.email) + '</small><small><span class="badge ' + H.esc(roleCls) + '">' + H.esc(e.role) + '</span> — ' + H.fmt(e.hour_rate) + ' ريال/ساعة</small></div>' +
        '<div style="display:flex;gap:6px;">' +
          '<button class="btn btn-sm btn-o" onclick="showEditEmployee(' + e.id + ')"><i class="ti ti-pencil"></i> تعديل</button>' +
          '<button class="btn btn-sm btn-danger" onclick="removeEmployee(' + e.id + ')"><i class="ti ti-trash"></i> حذف</button>' +
        '</div>' +
      '</div>';
    }).join('');
  },

  removeEmployee: function(id) {
    var DB = NEXORA.DB;
    var cu = NEXORA.App.cu;
    if (id === cu.id) return;
    if (!confirm('هل أنت متأكد من حذف هذا الموظف؟')) return;
    DB.employees = DB.employees.filter(function(e) { return e.id !== id; });
    DB.save();
    if (typeof showToast === 'function') showToast('تم الحذف', 'success');
    NEXORA.Views.Admin.renderUsers();
  },

  showEditEmployee: function(id) {
    var DB = NEXORA.DB;
    var e = DB.employees.find(function(x) { return x.id === id; });
    if (!e) return;
    document.getElementById('editEmpId').value = e.id;
    document.getElementById('editEmpName').value = e.full_name;
    document.getElementById('editEmpEmail').value = e.email;
    document.getElementById('editEmpRole').value = e.role;
    document.getElementById('editEmpRate').value = e.hour_rate || 0;
    NEXORA.Components.Modal.open('empModal');
  },

  closeEmpModal: function() {
    NEXORA.Components.Modal.close('empModal');
    var msgEl = document.getElementById('empModalMsg');
    if (msgEl) { msgEl.textContent = ''; msgEl.className = 'message-box'; }
  },

  saveEditEmployee: function() {
    var DB = NEXORA.DB;
    var H = NEXORA.Helpers;

    var id = parseInt(document.getElementById('editEmpId').value);
    var e = DB.employees.find(function(x) { return x.id === id; });
    if (!e) return;

    var name = document.getElementById('editEmpName').value.trim();
    var email = document.getElementById('editEmpEmail').value.trim();
    var role = document.getElementById('editEmpRole').value;
    var rate = parseFloat(document.getElementById('editEmpRate').value) || 0;

    if (!name || !email) return H.msg('empModalMsg', 'أدخل الاسم والبريد', 'error');

    var dup = DB.employees.find(function(x) { return x.email === email && x.id !== id; });
    if (dup) return H.msg('empModalMsg', 'البريد موجود مسبقاً لموظف آخر', 'error');

    e.full_name = name;
    e.email = email;
    e.role = role;
    e.hour_rate = rate;
    DB.save();
    if (typeof showToast === 'function') showToast('تم الحفظ', 'success');
    NEXORA.Views.Admin.closeEmpModal();
    NEXORA.Views.Admin.renderUsers();
  }
};

window.renderAdmin = function() { NEXORA.Views.Admin.render(); };
window.addEmployee = function() { NEXORA.Views.Admin.addEmployee(); };
window.removeEmployee = function(id) { NEXORA.Views.Admin.removeEmployee(id); };
window.showEditEmployee = function(id) { NEXORA.Views.Admin.showEditEmployee(id); };
window.closeEmpModal = function() { NEXORA.Views.Admin.closeEmpModal(); };
window.saveEditEmployee = function() { NEXORA.Views.Admin.saveEditEmployee(); };
