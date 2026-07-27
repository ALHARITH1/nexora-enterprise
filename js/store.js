window.NEXORA = window.NEXORA || {};

NEXORA.Store = (function() {
  var DB_VER = NEXORA.Config.DB_VER;
  var DB_TABLES = NEXORA.Config.DB_TABLES;

  var _dbQueue = [];

  var DB = {
    companies: [],
    employees: [],
    projects: [],
    items: [],
    tasks: [],
    assignments: [],
    dailylogs: [],
    approvals: [],
    costs: [],
    processes: [],
    process_logs: [],
    boq_items: [],
    payment_certificates: [],
    cash_flow: [],
    daily_wages: [],
    _ready: false,
    save: function() {
      this._saveToDB();
      var self = this;
      DB_TABLES.forEach(function(k) {
        if (Array.isArray(self[k])) {
          try { localStorage.setItem('tbr_' + k, JSON.stringify(self[k])); } catch(e) {}
        }
      });
    },
    _saveToDB: function() {
      var self = this;
      if (!window.indexedDB) return Promise.resolve();
      return NEXORA.Store.dbTx('readwrite', function(stores) {
        DB_TABLES.forEach(function(t) {
          var ob = stores[t];
          ob.clear();
          self[t].forEach(function(item) { ob.put(item); });
        });
      });
    },
    nextId: function(arr) {
      return arr.length ? Math.max.apply(null, arr.map(function(x) { return x.id; })) + 1 : 1;
    }
  };

  function openDB() {
    return new Promise(function(res) {
      if (!window.indexedDB) return res(null);
      var timedOut = false;
      var timer = setTimeout(function() {
        timedOut = true;
        DB._ready = false;
        res(null);
      }, 3000);
      var r = indexedDB.open(NEXORA.Config.DB_STORE, DB_VER);
      r.onupgradeneeded = function(e) {
        var db = e.target.result;
        DB_TABLES.forEach(function(t) {
          if (!db.objectStoreNames.contains(t))
            db.createObjectStore(t, { keyPath: 'id' });
        });
      };
      r.onsuccess = function(e) {
        if (!timedOut) {
          clearTimeout(timer);
          DB._ready = true;
          res(e.target.result);
        }
      };
      r.onerror = function() {
        clearTimeout(timer);
        DB._ready = false;
        res(null);
      };
    });
  }

  function dbTx(mode, fn) {
    return new Promise(function(res, rej) {
      if (!DB._ready) {
        _dbQueue.push(function() { dbTx(mode, fn).then(res).catch(rej); });
        return;
      }
      openDB().then(function(db) {
        if (!db) return res();
        var tx = db.transaction(DB_TABLES, mode);
        var stores = {};
        DB_TABLES.forEach(function(t) { stores[t] = tx.objectStore(t); });
        tx.oncomplete = function() { db.close(); res(); };
        tx.onerror = function(e) { db.close(); rej(e.target.error); };
        fn(stores, tx);
      }).catch(rej);
    });
  }

  function dbGetAll() {
    return new Promise(function(res) {
      var result = {};
      DB_TABLES.forEach(function(t) { result[t] = []; });
      if (!window.indexedDB) {
        DB_TABLES.forEach(function(t) {
          try { result[t] = JSON.parse(localStorage.getItem('tbr_' + t) || '[]'); } catch(e) { result[t] = []; }
        });
        return res(result);
      }
      openDB().then(function(db) {
        if (!db) {
          DB_TABLES.forEach(function(t) {
            try { result[t] = JSON.parse(localStorage.getItem('tbr_' + t) || '[]'); } catch(e) { result[t] = []; }
          });
          return res(result);
        }
        var pending = DB_TABLES.length;
        DB_TABLES.forEach(function(t) {
          var s = db.transaction(t, 'readonly').objectStore(t).getAll();
          s.onsuccess = function() {
            result[t] = s.result || [];
            if (!--pending) { db.close(); res(result); }
          };
          s.onerror = function() {
            result[t] = [];
            if (!--pending) { db.close(); res(result); }
          };
        });
      }).catch(function() {
        DB_TABLES.forEach(function(t) {
          try { result[t] = JSON.parse(localStorage.getItem('tbr_' + t) || '[]'); } catch(e) { result[t] = []; }
        });
        res(result);
      });
    });
  }

  function migrateFromLocal() {
    if (!window.indexedDB) return Promise.resolve();
    if (localStorage.getItem('tbr_migrated')) return Promise.resolve();
    var hasData = DB_TABLES.some(function(t) { return localStorage.getItem('tbr_' + t); });
    if (!hasData) {
      localStorage.setItem('tbr_migrated', '1');
      return Promise.resolve();
    }
    return dbTx('readwrite', function(stores) {
      DB_TABLES.forEach(function(t) {
        var data;
        try { data = JSON.parse(localStorage.getItem('tbr_' + t) || '[]'); } catch(e) { data = []; }
        data.forEach(function(item) { stores[t].put(item); });
      });
    }).then(function() {
      localStorage.setItem('tbr_migrated', '1');
    }).catch(function(e) {
      console.warn('Migration error:', e);
    });
  }

  function init() {
    return dbGetAll().then(function(data) {
      DB_TABLES.forEach(function(t) { DB[t] = data[t]; });
      return migrateFromLocal();
    }).then(function() {
      DB._ready = true;
      var q = _dbQueue.slice();
      _dbQueue = [];
      q.forEach(function(fn) { fn(); });
    }).catch(function() {
      DB._ready = true;
    });
  }

  return {
    DB: DB,
    openDB: openDB,
    dbTx: dbTx,
    dbGetAll: dbGetAll,
    migrateFromLocal: migrateFromLocal,
    init: init
  };
})();

NEXORA.DB = NEXORA.Store.DB;
