window.NEXORA = window.NEXORA || {};

NEXORA.Repositories = (function() {
  
  function getClient() {
    if (!NEXORA.Supabase || !NEXORA.Supabase.client) {
      throw new Error('Supabase client is not initialized or offline.');
    }
    return NEXORA.Supabase.client;
  }

  function getCompanyId() {
    var u = NEXORA.Auth.getUser();
    if (!u || !u.company_id) throw new Error('Unauthorized or no active company context.');
    return u.company_id;
  }

  // Base factory for tenant-scoped repositories
  function createRepository(tableName) {
    return {
      // List with optional eq/in/order filters. Forces tenant scope context via RLS/client.
      list: async function(filters = {}, options = {}) {
        const query = getClient().from(tableName).select('*');
        
        // Let RLS handle tenant scoping, but we can also explicitly eq('company_id') if required.
        // For security, RLS is the ultimate boundary.
        
        for (const [key, val] of Object.entries(filters)) {
          if (Array.isArray(val)) {
            query.in(key, val);
          } else {
            query.eq(key, val);
          }
        }
        
        if (options.orderBy) {
          query.order(options.orderBy, { ascending: options.ascending !== false });
        }
        
        if (options.limit) {
          query.limit(options.limit);
        }

        const { data, error } = await query;
        if (error) throw new Error(`[Repo] ${tableName} list failed: ` + error.message);
        return data || [];
      },

      getById: async function(id) {
        if (!id) throw new Error('ID is required');
        const { data, error } = await getClient().from(tableName).select('*').eq('id', id).maybeSingle();
        if (error) throw new Error(`[Repo] ${tableName} getById failed: ` + error.message);
        return data;
      },

      create: async function(payload) {
        // Enforce server-derived company context
        const compId = getCompanyId();
        
        // Strip caller-supplied ownership fields if they differ, or just enforce it
        const safePayload = { ...payload, company_id: compId };
        
        const { data, error } = await getClient().from(tableName).insert(safePayload).select().single();
        if (error) throw new Error(`[Repo] ${tableName} create failed: ` + error.message);
        return data;
      },

      update: async function(id, payload) {
        if (!id) throw new Error('ID is required for update');
        
        // Strip out company_id to prevent ownership reassignment
        const safePayload = { ...payload };
        delete safePayload.company_id;
        delete safePayload.id;

        const { data, error } = await getClient().from(tableName).update(safePayload).eq('id', id).select().single();
        if (error) throw new Error(`[Repo] ${tableName} update failed: ` + error.message);
        return data;
      },

      delete: async function(id) {
        if (!id) throw new Error('ID is required for delete');
        // RLS handles the permission to delete.
        const { error } = await getClient().from(tableName).delete().eq('id', id);
        if (error) throw new Error(`[Repo] ${tableName} delete failed: ` + error.message);
        return true;
      }
    };
  }

  // Pre-instantiate repositories for standard business tables
  const repos = {};
  NEXORA.Config.DB_TABLES.forEach(table => {
    repos[table] = createRepository(table);
  });

  // Export specific namespaces for cleaner consumer code
  return {
    ...repos,
    // Add custom domain operations here if needed, bypassing generic CRUD for complex ops
  };
})();
