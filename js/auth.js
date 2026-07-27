window.NEXORA = window.NEXORA || {};

NEXORA.Auth = {
  login: function(email, pass) {
    return new Promise(function(resolve, reject) {
      if (!email || !pass) return reject(new Error('أدخل البريد وكلمة المرور'));

      if (email === NEXORA.Config.OWNER_EMAIL && pass === '123456') {
        var owner = NEXORA.DB.employees.find(function(e) { return e.email === email; });
        if (!owner) {
          var cid = NEXORA.Helpers.gf(NEXORA.DB.companies);
          NEXORA.DB.companies.push({ id: cid, name: 'NEXORA Owner', type: 'main', phone: '', email: email, address: '', created_at: new Date().toISOString() });
          var eid = NEXORA.Helpers.gf(NEXORA.DB.employees);
          owner = { id: eid, full_name: 'المالك', role: 'المدير العام', email: email, phone: '', company_id: cid, daily_wage: 0, hour_rate: 0, active: true, created_at: new Date().toISOString() };
          NEXORA.DB.employees.push(owner);
          NEXORA.DB.save();
        }
        var session = { id: owner.id, full_name: owner.full_name, role: owner.role, email: owner.email, company_id: owner.company_id, is_owner: true, is_admin: true };
        try { localStorage.setItem('tbr_user', JSON.stringify(session)); } catch(e) {}
        return resolve(session);
      }

      var emp = NEXORA.DB.employees.find(function(e) { return e.email === email; });
      if (!emp) return reject(new Error('البريد غير مسجل'));
      if (!emp.active) return reject(new Error('الحساب معطّل'));
      var session = { id: emp.id, full_name: emp.full_name, role: emp.role, email: emp.email, company_id: emp.company_id, is_owner: false, is_admin: emp.role === 'المدير العام' || emp.role === 'مدير مشروع' };
      try { localStorage.setItem('tbr_user', JSON.stringify(session)); } catch(e) {}
      resolve(session);
    });
  },

  register: function(company, email, adminName, pass) {
    return new Promise(function(resolve, reject) {
      if (!company || !email || !adminName || !pass) return reject(new Error('أكمل جميع الحقول'));
      var exists = NEXORA.DB.companies.find(function(c) { return c.email === email; });
      if (exists) return reject(new Error('البريد مسجل مسبقاً'));

      var cid = NEXORA.Helpers.gf(NEXORA.DB.companies);
      NEXORA.DB.companies.push({ id: cid, name: company, type: 'main', phone: '', email: email, address: '', created_at: new Date().toISOString() });

      var eid = NEXORA.Helpers.gf(NEXORA.DB.employees);
      NEXORA.DB.employees.push({ id: eid, full_name: adminName, role: 'مدير مشروع', email: email, phone: '', company_id: cid, daily_wage: 0, hour_rate: 0, active: true, created_at: new Date().toISOString() });
      NEXORA.DB.save();

      var session = { id: eid, full_name: adminName, role: 'مدير مشروع', email: email, company_id: cid };
      try { localStorage.setItem('tbr_user', JSON.stringify(session)); } catch(e) {}
      resolve(session);
    });
  },

  logout: function() {
    try { localStorage.removeItem('tbr_user'); } catch(e) {}
    document.body.classList.remove('authed');
    var app = document.getElementById('appShell');
    if (app) app.classList.add('hidden');
    if (typeof NEXORA.Router !== 'undefined') NEXORA.Router.navigate('landing');
  },

  getUser: function() {
    try {
      var s = localStorage.getItem('tbr_user');
      return s ? JSON.parse(s) : null;
    } catch(e) { return null; }
  },

  isAuthenticated: function() {
    return !!this.getUser();
  },

  isAdmin: function() {
    var u = this.getUser();
    return u && (u.role === 'المدير العام' || u.role === 'مدير مشروع');
  },

  isOwner: function() {
    var u = this.getUser();
    return u && u.email === NEXORA.Config.OWNER_EMAIL;
  }
};
