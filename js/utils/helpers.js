window.NEXORA = window.NEXORA || {};

NEXORA.Helpers = {
  $(id) { return document.getElementById(id); },

  msg(id, t, tp) {
    var e = NEXORA.Helpers.$(id);
    if (!e) return;
    e.textContent = t;
    e.className = 'message-box ' + tp;
  },

  clr(id) {
    var e = NEXORA.Helpers.$(id);
    if (!e) return;
    e.className = 'message-box';
    e.textContent = '';
  },

  gf(a) { return NEXORA.DB.nextId(a); },

  emp(n) { return NEXORA.DB.employees.find(function(x) { return x.id === n; }); },

  proj(n) { return NEXORA.DB.projects.find(function(x) { return x.id === n; }); },

  itm(n) { return NEXORA.DB.items.find(function(x) { return x.id === n; }); },

  tsk(n) { return NEXORA.DB.tasks.find(function(x) { return x.id === n; }); },

  asn(n) { return NEXORA.DB.assignments.find(function(x) { return x.id === n; }); },

  coProjects() {
    var cu = NEXORA.App ? NEXORA.App.cu : null;
    if (!cu) return [];
    return cu.is_owner ? NEXORA.DB.projects : NEXORA.DB.projects;
  },

  fmt(n) { return (n || 0).toLocaleString('en-US'); },

  esc(s) {
    var d = document.createElement('div');
    d.appendChild(document.createTextNode(s));
    return d.innerHTML;
  },

  taskProgress(tid) {
    var H = NEXORA.Helpers;
    var t = H.tsk(tid);
    if (!t) return 0;
    if (!t.estimated_hours) return (t.status === 'done' && t.approved) ? 100 : 0;
    var as = NEXORA.DB.assignments.filter(function(x) { return x.task_id === tid; });
    var doneH = as.reduce(function(s, a) { return s + (a.completed_hours || 0); }, 0);
    return Math.min(100, Math.round(doneH / t.estimated_hours * 100));
  },

  itemProgress(iid) {
    var H = NEXORA.Helpers;
    var ts = NEXORA.DB.tasks.filter(function(x) { return x.item_id === iid; });
    if (!ts.length) return 0;
    var wSum = 0, pSum = 0;
    ts.forEach(function(t) {
      var w = t.estimated_hours || 1;
      wSum += w;
      pSum += w * H.taskProgress(t.id);
    });
    return wSum ? Math.round(pSum / wSum) : 0;
  },

  projProgress(pid) {
    var H = NEXORA.Helpers;
    var its = NEXORA.DB.items.filter(function(x) { return x.project_id === pid; });
    if (!its.length) return 0;
    var wSum = 0, pSum = 0;
    its.forEach(function(i) {
      var w = i.weight || (i.budget || 1);
      wSum += w;
      pSum += w * H.itemProgress(i.id);
    });
    return wSum ? Math.round(pSum / wSum) : 0;
  },

  itemCost(iid) {
    return NEXORA.DB.costs.filter(function(x) { return x.item_id === iid; })
      .reduce(function(s, x) { return s + (x.cost || 0); }, 0);
  },

  itemProfit(iid) {
    var H = NEXORA.Helpers;
    var i = H.itm(iid);
    if (!i) return { profit: 0, margin: 0, status: 'none', cost: 0, budget: 0 };
    var c = H.itemCost(iid);
    var p = (i.budget || 0) - c;
    return {
      profit: p,
      margin: i.budget ? Math.round(p / i.budget * 100) : 0,
      status: p >= 0 ? 'profit' : 'loss',
      cost: c,
      budget: i.budget || 0
    };
  },

  projCost(pid) {
    var H = NEXORA.Helpers;
    return NEXORA.DB.items.filter(function(x) { return x.project_id === pid; })
      .reduce(function(s, i) { return s + H.itemCost(i.id); }, 0);
  },

  projProfit(pid) {
    var H = NEXORA.Helpers;
    var p = H.proj(pid);
    if (!p) return { profit: 0, margin: 0, status: 'none', cost: 0, budget: 0 };
    var c = H.projCost(pid);
    var pf = (p.budget || 0) - c;
    return {
      profit: pf,
      margin: p.budget ? Math.round(pf / p.budget * 100) : 0,
      status: pf >= 0 ? 'profit' : 'loss',
      cost: c,
      budget: p.budget || 0
    };
  },

  breadcrumb(items) {
    return '<div style="display:flex;align-items:center;gap:4px;font-size:var(--fs-sm);color:var(--TX2);margin-bottom:10px;flex-wrap:wrap;">' +
      items.map(function(item, i) {
        if (i === items.length - 1)
          return '<span style="font-weight:700;color:var(--TX);">' + item.label + '</span>';
        return '<a href="#" onclick="' + (item.onclick || 'return false') + '" style="color:var(--P);text-decoration:none;font-weight:600;" onmouseover="this.style.textDecoration=\'underline\'" onmouseout="this.style.textDecoration=\'none\'">' + item.label + '</a><span style="color:var(--TX3);">/</span>';
      }).join('') + '</div>';
  }
};

window.$ = NEXORA.Helpers.$.bind(NEXORA.Helpers);
window.fmt = NEXORA.Helpers.fmt;
window.esc = NEXORA.Helpers.esc;
window.msg = NEXORA.Helpers.msg;
window.clr = NEXORA.Helpers.clr;
window.gf = NEXORA.Helpers.gf;
window.emp = NEXORA.Helpers.emp;
window.proj = NEXORA.Helpers.proj;
window.itm = NEXORA.Helpers.itm;
window.tsk = NEXORA.Helpers.tsk;
window.asn = NEXORA.Helpers.asn;
window.coProjects = NEXORA.Helpers.coProjects;
window.taskProgress = NEXORA.Helpers.taskProgress;
window.itemProgress = NEXORA.Helpers.itemProgress;
window.projProgress = NEXORA.Helpers.projProgress;
window.itemCost = NEXORA.Helpers.itemCost;
window.itemProfit = NEXORA.Helpers.itemProfit;
window.projCost = NEXORA.Helpers.projCost;
window.projProfit = NEXORA.Helpers.projProfit;
window.breadcrumb = NEXORA.Helpers.breadcrumb;
