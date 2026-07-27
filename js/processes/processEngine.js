window.NEXORA = window.NEXORA || {};

NEXORA.ProcessEngine = (function() {

  function getStatus(processId, projectId) {
    var DB = NEXORA.DB;
    if (!projectId) return 'pending';
    var proc = DB.processes.find(function(p) {
      return p.process_id === processId && p.project_id === projectId;
    });
    return proc ? proc.status : 'pending';
  }

  function setStatus(processId, projectId, status, note) {
    var DB = NEXORA.DB;
    var H = NEXORA.Helpers;
    var now = new Date().toISOString();
    var changedBy = NEXORA.App && NEXORA.App.cu ? NEXORA.App.cu.id : 0;

    if (!projectId) {
      if (typeof showToast === 'function') showToast('اختر مشروع أولاً', 'warning');
      return false;
    }

    var proc = DB.processes.find(function(p) {
      return p.process_id === processId && p.project_id === projectId;
    });

    if (proc) {
      proc.status = status;
      proc.note = note || proc.note || '';
      proc.updated_at = now;
    } else {
      DB.processes.push({
        id: H.gf(DB.processes),
        process_id: processId,
        project_id: projectId,
        status: status,
        note: note || '',
        created_at: now,
        updated_at: now
      });
    }

    DB.process_logs.push({
      id: H.gf(DB.process_logs),
      process_id: processId,
      project_id: projectId,
      status: status,
      note: note || '',
      changed_by: changedBy,
      changed_at: now
    });

    DB.save();
    return true;
  }

  function getLogs(processId, projectId) {
    var DB = NEXORA.DB;
    return DB.process_logs
      .filter(function(l) {
        var matchProc = processId ? l.process_id === processId : true;
        var matchProj = projectId ? l.project_id === projectId : true;
        return matchProc && matchProj;
      })
      .sort(function(a, b) {
        return new Date(b.changed_at) - new Date(a.changed_at);
      });
  }

  function getProgress(projectId) {
    var catalog = NEXORA.ProcessCatalog.catalog;
    var total = catalog.length;
    if (!total) return 0;
    var completed = 0;

    catalog.forEach(function(p) {
      var st = getStatus(p.id, projectId);
      if (st === 'done') completed++;
    });

    return Math.round(completed / total * 100);
  }

  function getGroupProgress(projectId, groupName) {
    var catalog = NEXORA.ProcessCatalog.getByGroup(groupName);
    var total = catalog.length;
    if (!total) return 0;
    var completed = 0;

    catalog.forEach(function(p) {
      var st = getStatus(p.id, projectId);
      if (st === 'done') completed++;
    });

    return Math.round(completed / total * 100);
  }

  function canStart(processId, projectId) {
    var DB = NEXORA.DB;
    if (!projectId) return false;

    var proc = NEXORA.ProcessCatalog.getProcess(processId);
    if (!proc) return false;

    var currentStatus = getStatus(processId, projectId);
    if (currentStatus === 'done') return false;

    var prereqMap = {
      'P2': ['P1'],
      'P3': ['P1', 'P2'],
      'P4': ['P3'],
      'P6': ['P4'],
      'P7': ['P6'],
      'P9': ['P7'],
      'P10': ['P9'],
      'P12': ['P10', 'P11'],
      'P15': ['P14'],
      'P27': ['P3'],
      'P38': ['P27'],
      'P39': ['P38'],
      'P49': ['P38'],
      'P50': ['P47'],
      'P51': ['P50', 'P49']
    };

    var prereqs = prereqMap[processId];
    if (!prereqs || !prereqs.length) return true;

    for (var i = 0; i < prereqs.length; i++) {
      if (getStatus(prereqs[i], projectId) !== 'done') return false;
    }
    return true;
  }

  function getTimeline(projectId) {
    var catalog = NEXORA.ProcessCatalog.catalog;
    var result = [];

    catalog.forEach(function(p) {
      var st = getStatus(p.id, projectId);
      var logs = DB.process_logs.filter(function(l) {
        return l.process_id === p.id && l.project_id === projectId;
      }).sort(function(a, b) {
        return new Date(a.changed_at) - new Date(b.changed_at);
      });

      var lastDate = logs.length ? logs[0].changed_at : null;

      result.push({
        process: p,
        status: st,
        date: lastDate
      });
    });

    return result;
  }

  var DB = NEXORA.DB;

  return {
    getStatus: getStatus,
    setStatus: setStatus,
    getLogs: getLogs,
    getProgress: getProgress,
    getGroupProgress: getGroupProgress,
    canStart: canStart,
    getTimeline: getTimeline
  };

})();
