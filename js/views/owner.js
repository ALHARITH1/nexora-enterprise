window.NEXORA = window.NEXORA || {};

NEXORA.Views = NEXORA.Views || {};

NEXORA.Views.Owner = {
  render: function() {
    var App = NEXORA.App;
    var DB = NEXORA.DB;
    var H = NEXORA.Helpers;
    var cu = App.cu;
    var el = document.getElementById('ownerContent');
    if (!el) return;

    var totalCo = DB.companies.length;
    var trialCo = DB.companies.filter(function(c) { return c.subscription === 'trial'; });
    var activeCo = DB.companies.filter(function(c) { return c.subscription === 'active'; });
    var expiredCo = DB.companies.filter(function(c) { return c.subscription === 'expired'; });

    var h = '<div class="stats">' +
      '<div class="stat-card blue"><div class="num">' + totalCo + '</div><div class="lbl">إجمالي الشركات</div></div>' +
      '<div class="stat-card gold"><div class="num">' + trialCo.length + '</div><div class="lbl">في الفترة التجريبية</div></div>' +
      '<div class="stat-card green"><div class="num">' + activeCo.length + '</div><div class="lbl">اشتراكات مفعلة</div></div>' +
      '<div class="stat-card red"><div class="num">' + expiredCo.length + '</div><div class="lbl">منتهية</div></div>' +
    '</div>';

    h += '<div class="card"><div class="card-title"><i class="ti ti-building"></i> الشركات</div>';

    if (!DB.companies.length) {
      h += '<div class="empty-state"><i class="ti ti-building"></i>لا توجد شركات مسجلة</div>';
    } else {
      h += '<div style="overflow-x:auto;"><table><thead><tr><th>المعرف</th><th>الشركة</th><th>البريد</th><th>الاشتراك</th><th>بداية التجربة</th><th>نهاية التجربة</th><th>الأيام المتبقية</th><th>الموظفون</th><th>المشاريع</th><th>تغيير</th></tr></thead><tbody>';

      DB.companies.forEach(function(co) {
        var emps = DB.employees.filter(function(e) { return e.company_id === co.id; }).length;
        var projs = DB.projects.filter(function(p) { return p.company_id === co.id; }).length;
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
  },

  changeSubscription: function(cid, status) {
    var DB = NEXORA.DB;
    var co = DB.companies.find(function(c) { return c.id === cid; });
    if (!co) return;
    co.subscription = status;
    if (status === 'active') co.subscribed_at = new Date().toISOString();
    DB.save();
    if (typeof showToast === 'function') showToast('تم التحديث', 'success');
    NEXORA.Views.Owner.render();
  },

  extendAllTrials: function() {
    var DB = NEXORA.DB;
    DB.companies.forEach(function(co) {
      if (co.subscription === 'trial' || co.subscription === 'expired') {
        var end = new Date(co.trial_end);
        if (end < new Date()) end = new Date();
        end.setDate(end.getDate() + 30);
        co.trial_end = end.toISOString();
        co.subscription = 'trial';
      }
    });
    DB.save();
    if (typeof showToast === 'function') showToast('تم تمديد جميع التجارب 30 يوم', 'success');
    NEXORA.Views.Owner.render();
  }
};

window.renderOwnerDashboard = function() { NEXORA.Views.Owner.render(); };
window.changeSubscription = function(c, s) { NEXORA.Views.Owner.changeSubscription(c, s); };
window.extendAllTrials = function() { NEXORA.Views.Owner.extendAllTrials(); };

window.ownerClearAllData = function() {
  if (!confirm('هل أنت متأكد من مسح جميع البيانات؟ هذا الإجراء لا يمكن التراجع عنه.')) return;
  if (!confirm('تأكيد أخير: مسح جميع بيانات جميع الشركات؟')) return;
  var DB = NEXORA.DB;
  NEXORA.Config.DB_TABLES.forEach(function(t) { DB[t] = []; });
  DB.save();
  if (typeof showToast === 'function') showToast('تم مسح جميع البيانات', 'success');
  NEXORA.Views.Owner.render();
};
