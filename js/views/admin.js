window.NEXORA = window.NEXORA || {};

NEXORA.Views = NEXORA.Views || {};

NEXORA.Views.Admin = {
  render: function() {
    var App = NEXORA.App;
    var el = document.getElementById('adminContent');
    if (!el) return;

    var h = '<div class="card"><div class="card-title"><i class="ti ti-user-plus"></i> إضافة موظف جديد</div>' +
      '<div id="adminMsg" class="message-box"></div>' +
      '<div class="grid-4">' +
        '<div><label>الاسم الكامل</label><input type="text" id="fEmpName" placeholder="محمد أحمد"></div>' +
        '<div><label>البريد الإلكتروني</label><input type="email" id="fEmpEmail" placeholder="m@company.com"></div>' +
        '<div><label>الدور</label><select id="fEmpRole">' +
          '<option value="project_manager">مدير مشروع</option>' +
          '<option value="site_engineer" selected>مهندس موقع</option>' +
          '<option value="supervisor">مشرف</option>' +
          '<option value="accountant">محاسب</option>' +
          '<option value="warehouse_keeper">أمين مستودع</option>' +
          '<option value="worker">عامل</option>' +
        '</select></div>' +
        '<div><label>أجر الساعة (ريال)</label><input type="number" id="fEmpRate" placeholder="50" value="50"></div>' +
      '</div>' +
      '<button class="btn btn-primary" onclick="addEmployee()" id="btnAddEmp"><i class="ti ti-plus"></i> إضافة الموظف</button>' +
    '</div>';

    h += '<div class="card"><div class="card-title"><i class="ti ti-users"></i> قائمة الموظفين</div><div id="adminEmpList"><div class="empty-state"><i class="ti ti-loader"></i>جاري التحميل...</div></div></div>';

    el.innerHTML = h;
    NEXORA.Views.Admin.renderUsers();
  },

  addEmployee: async function() {
    var H = NEXORA.Helpers;
    var cu = NEXORA.App.cu || NEXORA.Auth.getUser();

    var name = (document.getElementById('fEmpName') || {}).value.trim();
    var email = (document.getElementById('fEmpEmail') || {}).value.trim();
    var role = (document.getElementById('fEmpRole') || {}).value;
    var rate = parseFloat((document.getElementById('fEmpRate') || {}).value) || 50;

    if (!name || !email) return H.msg('adminMsg', 'أدخل الاسم والبريد', 'error');
    
    const btn = document.getElementById('btnAddEmp');
    if (btn) btn.disabled = true;

    try {
      // Create employee directly in repo
      await NEXORA.Repositories.employees.create({
        full_name: name,
        email: email,
        role: role,
        role_code: role,
        is_admin: role === 'company_admin' || role === 'project_manager' ? 1 : 0,
        hour_rate: rate,
        status: 'active'
      });
      
      H.msg('adminMsg', '✅ تمت إضافة الموظف', 'success');
      document.getElementById('fEmpName').value = '';
      document.getElementById('fEmpEmail').value = '';
      document.getElementById('fEmpRate').value = '50';
      this.renderUsers();
    } catch (err) {
      H.msg('adminMsg', 'خطأ: ' + err.message, 'error');
    } finally {
      if (btn) btn.disabled = false;
    }
  },

  renderUsers: async function() {
    var H = NEXORA.Helpers;
    var c = document.getElementById('adminEmpList');
    if (!c) return;

    try {
      var emps = await NEXORA.Repositories.employees.list();

      if (!emps.length) {
        c.innerHTML = '<div class="empty-state"><i class="ti ti-users"></i>لا يوجد موظفون</div>';
        return;
      }

      c.innerHTML = emps.map(function(e) {
        var roleCls = NEXORA.Config.ROLES[e.role_code || e.role] || 'badge-worker';
        var adminBadge = e.is_admin ? ' <span class="badge badge-admin">مسؤول</span>' : '';
        return '<div class="list-item">' +
          '<div class="info"><strong>' + H.esc(e.full_name || e.name) + adminBadge + '</strong><small>' + H.esc(e.email) + '</small><small><span class="badge ' + H.esc(roleCls) + '">' + H.esc(e.role_code || e.role) + '</span> — ' + H.fmt(e.hour_rate) + ' ريال/ساعة</small></div>' +
          '<div style="display:flex;gap:6px;">' +
            '<button class="btn btn-sm btn-o" onclick="showEditEmployee(\'' + e.id + '\')"><i class="ti ti-pencil"></i> تعديل</button>' +
            '<button class="btn btn-sm btn-danger" onclick="removeEmployee(\'' + e.id + '\')"><i class="ti ti-trash"></i> حذف</button>' +
          '</div>' +
        '</div>';
      }).join('');
    } catch (err) {
      c.innerHTML = '<div class="empty-state"><i class="ti ti-alert-triangle" style="color:var(--ER);"></i>حدث خطأ أثناء الجلب</div>';
      console.error(err);
    }
  },

  removeEmployee: async function(id) {
    var cu = NEXORA.App.cu || NEXORA.Auth.getUser();
    if (String(id) === String(cu.id)) return;
    if (!confirm('هل أنت متأكد من حذف هذا الموظف؟')) return;
    
    try {
      await NEXORA.Repositories.employees.delete(id);
      if (typeof showToast === 'function') showToast('تم الحذف', 'success');
      this.renderUsers();
    } catch (err) {
      alert('فشل الحذف: ' + err.message);
    }
  },

  showEditEmployee: async function(id) {
    try {
      var e = await NEXORA.Repositories.employees.getById(id);
      if (!e) return;
      document.getElementById('editEmpId').value = e.id;
      document.getElementById('editEmpName').value = e.full_name || e.name;
      document.getElementById('editEmpEmail').value = e.email;
      document.getElementById('editEmpRole').value = e.role_code || e.role;
      document.getElementById('editEmpRate').value = e.hour_rate || 0;
      NEXORA.Components.Modal.open('empModal');
    } catch (err) {
      alert('فشل جلب بيانات الموظف: ' + err.message);
    }
  },

  closeEmpModal: function() {
    NEXORA.Components.Modal.close('empModal');
    var msgEl = document.getElementById('empModalMsg');
    if (msgEl) { msgEl.textContent = ''; msgEl.className = 'message-box'; }
  },

  saveEditEmployee: async function() {
    var H = NEXORA.Helpers;

    var id = document.getElementById('editEmpId').value;
    var name = document.getElementById('editEmpName').value.trim();
    var email = document.getElementById('editEmpEmail').value.trim();
    var role = document.getElementById('editEmpRole').value;
    var rate = parseFloat(document.getElementById('editEmpRate').value) || 0;

    if (!name || !email) return H.msg('empModalMsg', 'أدخل الاسم والبريد', 'error');

    try {
      await NEXORA.Repositories.employees.update(id, {
        full_name: name,
        email: email,
        role: role,
        role_code: role,
        hour_rate: rate,
        is_admin: role === 'company_admin' || role === 'project_manager' ? 1 : 0
      });
      if (typeof showToast === 'function') showToast('تم الحفظ', 'success');
      this.closeEmpModal();
      this.renderUsers();
    } catch (err) {
      H.msg('empModalMsg', 'فشل الحفظ: ' + err.message, 'error');
    }
  }
};

window.renderAdmin = function() { NEXORA.Views.Admin.render(); };
window.addEmployee = function() { NEXORA.Views.Admin.addEmployee(); };
window.removeEmployee = function(id) { NEXORA.Views.Admin.removeEmployee(id); };
window.showEditEmployee = function(id) { NEXORA.Views.Admin.showEditEmployee(id); };
window.closeEmpModal = function() { NEXORA.Views.Admin.closeEmpModal(); };
window.saveEditEmployee = function() { NEXORA.Views.Admin.saveEditEmployee(); };
