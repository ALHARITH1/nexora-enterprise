/**
 * Base Repository class providing asynchronous tenant-scoped data access
 */

export class BaseRepository {
  constructor(tableName, dbKey) {
    this.tableName = tableName;
    this.dbKey = dbKey || tableName;
  }

  getCompanyId() {
    const user = window.NEXORA?.Auth?.getUser();
    return user ? user.company_id : null;
  }

  async getAll(queryFilter = {}) {
    const companyId = this.getCompanyId();

    // Supabase query path
    if (window.NEXORA?.Supabase?.client) {
      try {
        let q = window.NEXORA.Supabase.client.from(this.tableName).select('*');
        if (companyId) q = q.eq('company_id', companyId);
        Object.entries(queryFilter).forEach(([key, val]) => {
          q = q.eq(key, val);
        });
        const { data, error } = await q;
        if (!error && data) return data;
      } catch (err) {
        console.warn(`[Repository ${this.tableName}] Supabase query error:`, err.message);
      }
    }

    // Local DB fallback path
    let items = window.NEXORA?.DB?.[this.dbKey] || [];
    if (companyId) {
      items = items.filter(item => !item.company_id || item.company_id === companyId);
    }
    Object.entries(queryFilter).forEach(([key, val]) => {
      items = items.filter(item => item[key] === val);
    });
    return [...items];
  }

  async getById(id) {
    const items = await this.getAll();
    return items.find(i => String(i.id) === String(id)) || null;
  }

  async create(record) {
    const companyId = this.getCompanyId();
    const newRecord = {
      id: record.id || ((typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : 'rec-' + Date.now()),
      company_id: companyId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...record
    };

    if (window.NEXORA?.Supabase?.client) {
      try {
        const { data, error } = await window.NEXORA.Supabase.client.from(this.tableName).insert([newRecord]).select().single();
        if (!error && data) return data;
      } catch (err) {
        console.warn(`[Repository ${this.tableName}] Create error:`, err.message);
      }
    }

    if (window.NEXORA?.DB) {
      window.NEXORA.DB[this.dbKey] = window.NEXORA.DB[this.dbKey] || [];
      window.NEXORA.DB[this.dbKey].push(newRecord);
      if (window.NEXORA.DB.save) window.NEXORA.DB.save();
    }
    return newRecord;
  }

  async update(id, updates) {
    const companyId = this.getCompanyId();

    if (window.NEXORA?.Supabase?.client) {
      try {
        let q = window.NEXORA.Supabase.client.from(this.tableName).update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id);
        if (companyId) q = q.eq('company_id', companyId);
        const { data, error } = await q.select().single();
        if (!error && data) return data;
      } catch (err) {
        console.warn(`[Repository ${this.tableName}] Update error:`, err.message);
      }
    }

    if (window.NEXORA?.DB?.[this.dbKey]) {
      const idx = window.NEXORA.DB[this.dbKey].findIndex(i => String(i.id) === String(id));
      if (idx !== -1) {
        window.NEXORA.DB[this.dbKey][idx] = {
          ...window.NEXORA.DB[this.dbKey][idx],
          ...updates,
          updated_at: new Date().toISOString()
        };
        if (window.NEXORA.DB.save) window.NEXORA.DB.save();
        return window.NEXORA.DB[this.dbKey][idx];
      }
    }
    throw new Error(`Record ${id} not found in ${this.tableName}`);
  }

  async delete(id) {
    const companyId = this.getCompanyId();

    if (window.NEXORA?.Supabase?.client) {
      try {
        let q = window.NEXORA.Supabase.client.from(this.tableName).delete().eq('id', id);
        if (companyId) q = q.eq('company_id', companyId);
        await q;
      } catch (err) {
        console.warn(`[Repository ${this.tableName}] Delete error:`, err.message);
      }
    }

    if (window.NEXORA?.DB?.[this.dbKey]) {
      window.NEXORA.DB[this.dbKey] = window.NEXORA.DB[this.dbKey].filter(i => String(i.id) !== String(id));
      if (window.NEXORA.DB.save) window.NEXORA.DB.save();
    }
    return true;
  }
}
