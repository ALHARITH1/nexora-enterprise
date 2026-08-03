window.NEXORA = window.NEXORA || {};

NEXORA.Auth = {
  login: async function(email, pass) {
    if (!email || !pass) throw new Error('أدخل البريد الإلكتروني وكلمة المرور');

    if (!NEXORA.Supabase || !NEXORA.Supabase.client || typeof NEXORA.Supabase.client.auth?.signInWithPassword !== 'function') {
      throw new Error('خدمة المصادقة غير متوفرة');
    }

    const { data, error } = await NEXORA.Supabase.client.auth.signInWithPassword({ email, password: pass });
    if (error) throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    if (!data.session) throw new Error('فشل تسجيل الدخول');

    const user = data.session.user;
    
    // Fetch membership to resolve role and company securely
    const { data: member, error: memberErr } = await NEXORA.Supabase.client
      .from('company_memberships')
      .select('company_id, role_code')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();

    if (memberErr || !member) {
      // Must have an active membership to log in properly to the tenant side
      await NEXORA.Supabase.client.auth.signOut();
      throw new Error('الحساب معطّل أو غير مسجل في شركة');
    }

    const sessionUser = {
      id: user.id,
      email: user.email,
      company_id: member.company_id,
      role_code: member.role_code,
      full_name: user.user_metadata?.full_name || email.split('@')[0]
    };
    
    sessionStorage.setItem('nexora_session', JSON.stringify(sessionUser));
    return sessionUser;
  },

  register: async function(companyName, email, adminName, pass) {
    if (!companyName || !email || !adminName || !pass) throw new Error('أكمل جميع الحقول المطلوبة');

    if (!NEXORA.Supabase || !NEXORA.Supabase.client) {
      throw new Error('خدمة المصادقة غير متوفرة');
    }

    // 1. Sign up the user
    const { data, error } = await NEXORA.Supabase.client.auth.signUp({
      email,
      password: pass,
      options: { data: { full_name: adminName } }
    });

    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('فشل التسجيل');

    // 2. The database creates the company securely via an RPC call.
    const { data: newComp, error: compErr } = await NEXORA.Supabase.client.rpc('register_company_with_admin', {
      p_company_name: companyName,
      p_company_email: email,
      p_company_phone: '',
      p_admin_name: adminName
    });
    
    if (compErr) {
       console.warn('RPC register_company_with_admin failed:', compErr);
       throw new Error('تم تسجيل الحساب لكن فشل إنشاء الشركة. يرجى التواصل مع الدعم.');
    }
    
    return { message: 'تم التسجيل بنجاح. يرجى تسجيل الدخول.' };
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
    
    // Clear in-memory user reference
    if (window.NEXORA.App) {
      window.NEXORA.App.cu = null;
    }

    document.body.classList.remove('authed');
    const app = document.getElementById('appShell');
    if (app) app.classList.add('hidden');
    if (typeof NEXORA.Router !== 'undefined') NEXORA.Router.navigate('landing');
  },

  getUser: function() {
    try {
      // We ONLY trust sessionStorage which is set by successful Supabase login.
      // We do not trust localStorage for role bypasses.
      const s = sessionStorage.getItem('nexora_session');
      if (!s) return null;
      
      const user = JSON.parse(s);
      
      // Ensure essential fields exist
      if (!user.id || !user.role_code || !user.company_id) {
          this.logout();
          return null;
      }
      return user;
    } catch (e) { return null; }
  },

  isAuthenticated: function() {
    return !!this.getUser();
  },

  isAdmin: function() {
    const u = this.getUser();
    if (!u) return false;
    const r = u.role_code;
    return r === 'company_admin' || r === 'platform_admin';
  },

  isOwner: function() {
    const u = this.getUser();
    return u && (u.role_code === 'company_admin' || u.role_code === 'platform_admin');
  }
};
