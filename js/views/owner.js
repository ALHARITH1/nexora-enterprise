window.NEXORA = window.NEXORA || {};
NEXORA.Views = NEXORA.Views || {};

NEXORA.Views.Owner = {
  render: async function() {
    var App = NEXORA.App;
    var H = NEXORA.Helpers;
    var cu = App.cu;
    var el = document.getElementById('ownerContent');
    if (!el) return;

    el.innerHTML = '<div class="card"><div class="empty-state"><i class="ti ti-loader"></i>جاري التحميل...</div></div>';

    try {
      var companies = await NEXORA.Repositories.companies.list();
      var employees = await NEXORA.Repositories.employees.list();
      var projects = await NEXORA.Repositories.projects.list();

      var totalCo = companies.length;
      var trialCo = companies.filter(function(c) { return c.subscription === 'trial'; });
      var activeCo = companies.filter(function(c) { return c.subscription === 'active'; });
      var expiredCo = companies.filter(function(c) { return c.subscription === 'expired'; });

      var h = '<div class="stats">' +
        '<div class="stat-card blue"><div class="num">' + totalCo + '</div><div class="lbl">إجمالي الشركات</div></div>' +
        '<div class="stat-card gold"><div class="num">' + trialCo.length + '</div><div class="lbl">في الفترة التجريبية</div></div>' +
        '<div class="stat-card green"><div class="num">' + activeCo.length + '</div><div class="lbl">اشتراكات مفعلة</div></div>' +
        '<div class="stat-card red"><div class="num">' + expiredCo.length + '</div><div class="lbl">منتهية</div></div>' +
      '</div>';

      h += '<div class="card"><div class="card-title"><i class="ti ti-building"></i> الشركات</div>';

      if (!companies.length) {
        h += '<div class="empty-state"><i class="ti ti-building"></i>لا توجد شركات مسجلة</div>';
      } else {
        h += '<div style="overflow-x:auto;"><table><thead><tr><th>المعرف</th><th>الشركة</th><th>البريد</th><th>الاشتراك</th><th>بداية التجربة</th><th>نهاية التجربة</th><th>الأيام المتبقية</th><th>الموظفون</th><th>المشاريع</th><th>تغيير</th></tr></thead><tbody>';

        companies.forEach(function(co) {
          var emps = employees.filter(function(e) { return String(e.company_id) === String(co.id); }).length;
          var projs = projects.filter(function(p) { return String(p.company_id) === String(co.id); }).length;
          var daysLeft = Math.ceil((new Date(co.trial_end) - new Date()) / (1000 * 60 * 60 * 24));
          var subCls = co.subscription === 'active' ? 'badge-done' : co.subscription === 'trial' ? 'badge-progress' : 'badge-rejected';
          var subLabel = co.subscription === 'active' ? 'مفعل' : co.subscription === 'trial' ? 'تجريبي' : 'منتهي';

          h += '<tr>' +
            '<td style="color:var(--TX3);">#' + co.id + '</td>' +
            '<td><strong>' + H.esc(co.name) + '</strong></td>' +
            '<td>' + H.esc(co.email) + '</td>' +
            '<td><span class="badge ' + subCls + '">' + subLabel + '</span></td>' +
            '<td>' + (co.trial_start ? new Date(co.trial_start).toLocaleDateString('ar-SA') : '—') + '</td>' +
            '<td>' + (co.trial_end ? new Date(co.trial_end).toLocaleDateString('ar-SA') : '—') + '</td>' +
            '<td style="font-weight:700;color:' + (daysLeft > 7 ? 'var(--GR)' : daysLeft > 0 ? 'var(--G)' : 'var(--RE)') + ';">' + (daysLeft > 0 ? daysLeft + ' يوم' : 'منتهي') + '</td>' +
            '<td>' + emps + '</td>' +
            '<td>' + projs + '</td>' +
            '<td><select style="width:auto;min-width:100px;margin:0;padding:4px 8px;font-size:var(--fs-sm);" onchange="changeSubscription(' + co.id + ',this.value)">' +
              '<option value="trial"' + (co.subscription === 'trial' ? ' selected' : '') + '>تجريبي</option>' +
              '<option value="active"' + (co.subscription === 'active' ? ' selected' : '') + '>مفعل</option>' +
              '<option value="expired"' + (co.subscription === 'expired' ? ' selected' : '') + '>منتهي</option>' +
            '</select></td>' +
          '</tr>';
        });

        h += '</tbody></table></div>';
      }
      h += '</div>';

      h += '<div class="card"><div class="card-title"><i class="ti ti-bolt"></i> إجراءات سريعة</div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
          '<button class="btn btn-primary" onclick="extendAllTrials()"><i class="ti ti-clock-plus"></i> تمديد جميع التجارب 30 يوم</button>' +
          '<button class="btn btn-danger" onclick="ownerClearAllData()"><i class="ti ti-trash"></i> مسح جميع البيانات</button>' +
        '</div></div>';

      el.innerHTML = h;
    } catch(err) {
      el.innerHTML = '<div class="card"><div class="empty-state"><i class="ti ti-alert-triangle" style="color:var(--ER);"></i>حدث خطأ: ' + H.esc(err.message) + '</div></div>';
    }
  },

  changeSubscription: async function(cid, status) {
    try {
      var updates = { subscription: status };
      if (status === 'active') updates.subscribed_at = new Date().toISOString();
      await NEXORA.Repositories.companies.update(cid, updates);
      if (typeof showToast === 'function') showToast('تم التحديث', 'success');
      await NEXORA.Views.Owner.render();
    } catch(err) {
      alert('فشل التحديث: ' + err.message);
    }
  },

  extendAllTrials: async function() {
    try {
      var companies = await NEXORA.Repositories.companies.list();
      var promises = [];
      companies.forEach(function(co) {
        if (co.subscription === 'trial' || co.subscription === 'expired') {
          var end = new Date(co.trial_end);
          if (end < new Date()) end = new Date();
          end.setDate(end.getDate() + 30);
          promises.push(NEXORA.Repositories.companies.update(co.id, {
            trial_end: end.toISOString(),
            subscription: 'trial'
          }));
        }
      });
      await Promise.all(promises);
      if (typeof showToast === 'function') showToast('تم تمديد جميع التجارب 30 يوم', 'success');
      await NEXORA.Views.Owner.render();
    } catch(err) {
      alert('فشل التمديد: ' + err.message);
    }
  }
};

window.renderOwnerDashboard = function() { NEXORA.Views.Owner.render(); };
window.changeSubscription = function(c, s) { NEXORA.Views.Owner.changeSubscription(c, s); };
window.extendAllTrials = function() { NEXORA.Views.Owner.extendAllTrials(); };

window.ownerClearAllData = async function() {
  if (!confirm('هل أنت متأكد من مسح جميع البيانات؟ هذا الإجراء لا يمكن التراجع عنه.')) return;
  if (!confirm('تأكيد أخير: مسح جميع بيانات جميع الشركات؟')) return;
  
  try {
    if (typeof showToast === 'function') showToast('جاري مسح البيانات...', 'info');
    
    for (var t of NEXORA.Config.DB_TABLES) {
      if(NEXORA.Repositories[t]) {
        var items = await NEXORA.Repositories[t].list();
        for (var i of items) {
          await NEXORA.Repositories[t].delete(i.id);
        }
      }
    }
    
    if (typeof showToast === 'function') showToast('تم مسح جميع البيانات', 'success');
    await NEXORA.Views.Owner.render();
  } catch(err) {
    alert('فشل المسح: ' + err.message);
  }
};
