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
    stakeholders: [],
    contracts: [],
    change_requests: [],
    _ready: false,
    save: function() {
      var self = this;
      // We only save preferences to localStorage now, NOT business data.
      // E.g. Theme, layout, language, but NOT DB_TABLES.
    },
    _saveToDB: function() {
      return Promise.resolve(); // Disabled for business data
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
    return Promise.resolve(); // Disable auto-migration on boot. Handled by manual migration script.
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
