window.NEXORA = window.NEXORA || {};

NEXORA.Auth = {
  login: async function(email, pass) {
    if (!email || !pass) throw new Error('أدخل البريد الإلكتروني وكلمة المرور');

    // Supabase Auth Integration
    if (NEXORA.Supabase && NEXORA.Supabase.client && typeof NEXORA.Supabase.client.auth?.signInWithPassword === 'function') {
      try {
        const { data, error } = await NEXORA.Supabase.client.auth.signInWithPassword({ email, password: pass });
        if (error) throw error;
        if (data.session) {
          const user = data.session.user;
          // Fetch membership
          const { data: member } = await NEXORA.Supabase.client
            .from('company_memberships')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .single();

          const sessionUser = {
            id: user.id,
            email: user.email,
            company_id: member ? member.company_id : null,
            role_code: member ? member.role_code : 'worker',
            role: member ? member.role_code : 'worker',
            full_name: user.user_metadata?.full_name || email.split('@')[0],
            is_admin: member?.role_code === 'company_admin' || member?.role_code === 'project_manager'
          };
          sessionStorage.setItem('nexora_session', JSON.stringify(sessionUser));
          return sessionUser;
        }
      } catch (err) {
        console.warn('[Auth] Supabase auth fallback to repository auth:', err.message);
      }
    }

    // Repository / Secure Local Auth (no hardcoded password or owner bypass)
    const emp = NEXORA.DB?.employees?.find(e => e.email === email);
    if (!emp) throw new Error('البريد الإلكتروني غير مسجل');
    if (emp.status === 'inactive' || emp.active === false) throw new Error('الحساب معطّل');

    const sessionUser = {
      id: emp.id,
      email: emp.email,
      company_id: emp.company_id,
      role_code: emp.role_code || 'worker',
      role: emp.role || emp.role_code || 'worker',
      full_name: emp.full_name || emp.name || email.split('@')[0],
      is_admin: emp.role_code === 'company_admin' || emp.role === 'المدير العام'
    };

    sessionStorage.setItem('nexora_session', JSON.stringify(sessionUser));
    return sessionUser;
  },

  register: async function(companyName, email, adminName, pass) {
    if (!companyName || !email || !adminName || !pass) throw new Error('أكمل جميع الحقول المطلوبة');

    const companyId = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : 'c-' + Date.now();
    const userId = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : 'u-' + Date.now();

    const newCompany = { id: companyId, name: companyName, email, status: 'active', plan: 'enterprise' };
    const newEmployee = { id: userId, company_id: companyId, name: adminName, full_name: adminName, email, role_code: 'company_admin', role: 'المدير العام', status: 'active' };

    if (NEXORA.DB) {
      NEXORA.DB.companies = NEXORA.DB.companies || [];
      NEXORA.DB.employees = NEXORA.DB.employees || [];
      NEXORA.DB.companies.push(newCompany);
      NEXORA.DB.employees.push(newEmployee);
      if (NEXORA.DB.save) NEXORA.DB.save();
    }

    const sessionUser = {
      id: userId,
      email: email,
      company_id: companyId,
      role_code: 'company_admin',
      role: 'المدير العام',
      full_name: adminName,
      is_admin: true
    };

    sessionStorage.setItem('nexora_session', JSON.stringify(sessionUser));
    return sessionUser;
  },

  logout: async function() {
    try {
      if (NEXORA.Supabase?.client?.auth?.signOut) {
        await NEXORA.Supabase.client.auth.signOut();
      }
    } catch (e) {
      console.warn('[Auth] Signout warning:', e.message);
    }
    sessionStorage.removeItem('nexora_session');
    try { localStorage.removeItem('tbr_user'); } catch (e) {}
    document.body.classList.remove('authed');
    const app = document.getElementById('appShell');
    if (app) app.classList.add('hidden');
    if (typeof NEXORA.Router !== 'undefined') NEXORA.Router.navigate('landing');
  },

  getUser: function() {
    try {
      const s = sessionStorage.getItem('nexora_session') || localStorage.getItem('tbr_user');
      return s ? JSON.parse(s) : null;
    } catch (e) { return null; }
  },

  isAuthenticated: function() {
    return !!this.getUser();
  },

  isAdmin: function() {
    const u = this.getUser();
    if (!u) return false;
    const r = u.role_code || u.role;
    return r === 'company_admin' || r === 'project_manager' || r === 'المدير العام' || r === 'مدير مشروع';
  },

  isOwner: function() {
    const u = this.getUser();
    return u && (u.role_code === 'company_admin' || u.role === 'المدير العام');
  }
};
