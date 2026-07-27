window.NEXORA = window.NEXORA || {};

NEXORA.ProcessWizard = (function() {

  var currentStep = 0;
  var selectedTier = 1;
  var selectedGroupIdx = 0;

  var steps = [
    { title: 'مرحباً بمحرك العمليات', icon: '🚀' },
    { title: 'اختر نوع مقاولك', icon: '👷' },
    { title: 'ابدأ بالمجموعة الأولى', icon: '📋' },
    { title: 'جاهز للعمل!', icon: '✅' }
  ];

  function render() {
    var el = document.getElementById('processWizardContent');
    if (!el) return;

    var groups = NEXORA.ProcessCatalog.groups;

    var h = '<div class="card" style="border-right:4px solid var(--P);margin-bottom:16px;">' +
      '<div class="card-title"><i class="ti ti-engineering"></i> محرك العمليات PMBOK</div>' +
      '<div style="color:var(--TX2);font-size:var(--fs-sm);">الخطوات الإعدادية السريعة لإدارة عمليات المشروع</div>' +
    '</div>';

    h += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;flex-wrap:wrap;">';
    for (var s = 0; s < steps.length; s++) {
      var isActive = s === currentStep;
      var isDone = s < currentStep;
      var stepColor = isActive ? 'var(--P)' : isDone ? 'var(--GR)' : 'var(--BD)';
      var textColor = isActive ? '#fff' : isDone ? '#fff' : 'var(--TX3)';
      h += '<div style="display:flex;align-items:center;gap:6px;">' +
        '<div style="width:32px;height:32px;border-radius:50%;background:' + stepColor + ';color:' + textColor + ';display:flex;align-items:center;justify-content:center;font-weight:700;font-size:var(--fs-sm);">' +
          (isDone ? '✓' : (s + 1)) +
        '</div>' +
        '<span style="font-size:var(--fs-sm);color:' + (isActive ? 'var(--TX)' : 'var(--TX3)') + ';font-weight:' + (isActive ? '700' : '400') + ';">' + steps[s].title + '</span>' +
      '</div>';
      if (s < steps.length - 1) {
        h += '<div style="flex:1;height:2px;background:' + (s < currentStep ? 'var(--GR)' : 'var(--BD)') + ';min-width:20px;"></div>';
      }
    }
    h += '</div>';

    h += '<div class="card" style="min-height:250px;">';

    if (currentStep === 0) {
      h += '<div style="text-align:center;padding:24px 0;">' +
        '<div style="font-size:48px;margin-bottom:12px;">🚀</div>' +
        '<h2 style="color:var(--P);margin-bottom:8px;">مرحباً بمحرك العمليات PMBOK</h2>' +
        '<p style="color:var(--TX2);max-width:500px;margin:0 auto 16px;line-height:1.8;">' +
          'سيساعدك هذا المحرك على إعداد وتشغيل عمليات إدارة المشروع وفق معايير PMBOK العالمية. ' +
          'العمليات مقسمة إلى ' + NEXORA.ProcessCatalog.catalog.length + ' عملية في ' + groups.length + ' مجموعات رئيسية.' +
        '</p>' +
        '<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:16px;">';
      groups.forEach(function(g) {
        h += '<div style="background:var(--BG2);border:1px solid var(--BD);border-radius:var(--radius-sm);padding:8px 14px;display:flex;align-items:center;gap:6px;">' +
          '<i class="' + g.icon + '" style="color:' + g.color + ';"></i>' +
          '<span style="font-size:var(--fs-sm);font-weight:600;">' + g.name + '</span>' +
          '<span style="font-size:var(--fs-xs);color:var(--TX3);">(' + NEXORA.ProcessCatalog.getByGroup(g.name).length + ')</span>' +
        '</div>';
      });
      h += '</div></div>';

    } else if (currentStep === 1) {
      h += '<div style="text-align:center;padding:16px 0;">' +
        '<h2 style="margin-bottom:12px;">👷 اختر نوع مقاولك</h2>' +
        '<p style="color:var(--TX2);margin-bottom:20px;">هذا يحدد عدد العمليات التي ستظهر لك</p>' +
        '<div style="display:flex;gap:16px;justify-content:center;flex-wrap:wrap;">';

      var tier1Count = NEXORA.ProcessCatalog.getByTier(1).length;
      var tier2Count = NEXORA.ProcessCatalog.catalog.length;

      h += '<div onclick="NEXORA.ProcessWizard._selectTier(1)" style="cursor:pointer;width:220px;padding:20px;border:2px solid ' + (selectedTier === 1 ? 'var(--GR)' : 'var(--BD)') + ';border-radius:var(--radius);background:' + (selectedTier === 1 ? 'var(--GR)' : 'var(--BG2)') + ';color:' + (selectedTier === 1 ? '#fff' : 'var(--TX)') + ';transition:all 0.2s;">' +
        '<div style="font-size:32px;margin-bottom:8px;">⚡</div>' +
        '<div style="font-weight:700;font-size:var(--fs-lg);">مقاول صغير</div>' +
        '<div style="font-size:var(--fs-sm);margin-top:4px;opacity:0.8;">Tier 1 — ' + tier1Count + ' عملية أساسية</div>' +
        '<div style="font-size:var(--fs-xs);margin-top:8px;opacity:0.7;">مناسب للمقاولين والأعمال البسيطة</div>' +
      '</div>';

      h += '<div onclick="NEXORA.ProcessWizard._selectTier(2)" style="cursor:pointer;width:220px;padding:20px;border:2px solid ' + (selectedTier === 2 ? 'var(--P)' : 'var(--BD)') + ';border-radius:var(--radius);background:' + (selectedTier === 2 ? 'var(--P)' : 'var(--BG2)') + ';color:' + (selectedTier === 2 ? '#fff' : 'var(--TX)') + ';transition:all 0.2s;">' +
        '<div style="font-size:32px;margin-bottom:8px;">🏢</div>' +
        '<div style="font-weight:700;font-size:var(--fs-lg);">شركة مقاولات</div>' +
        '<div style="font-size:var(--fs-sm);margin-top:4px;opacity:0.8;">Tier 2 — ' + tier2Count + ' عملية كاملة</div>' +
        '<div style="font-size:var(--fs-xs);margin-top:8px;opacity:0.7;">مناسب للشركات والمشاريع الكبيرة</div>' +
      '</div>';

      h += '</div></div>';

    } else if (currentStep === 2) {
      var grp = groups[selectedGroupIdx] || groups[0];
      var grpProcs = NEXORA.ProcessCatalog.getByGroup(grp.name);

      h += '<div style="padding:16px 0;">' +
        '<div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">' +
          '<div style="width:40px;height:40px;border-radius:50%;background:' + grp.color + ';color:#fff;display:flex;align-items:center;justify-content:center;"><i class="' + grp.icon + '"></i></div>' +
          '<div>' +
            '<h2 style="margin:0;color:' + grp.color + ';">' + grp.name + '</h2>' +
            '<div style="font-size:var(--fs-sm);color:var(--TX2);">' + grp.nameEn + ' — ' + grpProcs.length + ' عمليات</div>' +
          '</div>' +
        '</div>';

      h += '<div style="margin-bottom:16px;">' +
        '<div style="display:flex;align-items:center;gap:6px;margin-bottom:12px;">' +
          '<span style="font-size:var(--fs-sm);color:var(--TX2);">المجموعة:</span>';
      for (var g = 0; g < groups.length; g++) {
        var gg = groups[g];
        h += '<button class="btn btn-sm ' + (g === selectedGroupIdx ? 'btn-primary' : 'btn-o') + '" onclick="NEXORA.ProcessWizard._selectGroup(' + g + ')" style="font-size:var(--fs-xs);">' +
          '<i class="' + gg.icon + '"></i> ' + gg.name +
        '</button>';
      }
      h += '</div></div>';

      h += '<div style="max-height:300px;overflow-y:auto;">';
      grpProcs.forEach(function(p) {
        if (selectedTier === 1 && p.tier === 2) return;
        h += '<div class="list-item">' +
          '<div class="info">' +
            '<div style="display:flex;align-items:center;gap:6px;">' +
              '<span>' + p.icon + '</span>' +
              '<strong>' + p.id + ' — ' + p.name + '</strong>' +
              (p.tier === 1 ? '<span style="background:var(--GR);color:#fff;border-radius:999px;padding:1px 6px;font-size:10px;">T1</span>' : '<span style="background:var(--P);color:#fff;border-radius:999px;padding:1px 6px;font-size:10px;">T2</span>') +
            '</div>' +
            '<small style="color:var(--TX3);">' + p.desc.substring(0, 90) + '...</small>' +
          '</div>' +
        '</div>';
      });
      h += '</div></div>';

    } else if (currentStep === 3) {
      var totalProcs = selectedTier === 1 ? NEXORA.ProcessCatalog.getByTier(1).length : NEXORA.ProcessCatalog.catalog.length;
      h += '<div style="text-align:center;padding:24px 0;">' +
        '<div style="font-size:48px;margin-bottom:12px;">✅</div>' +
        '<h2 style="color:var(--GR);margin-bottom:8px;">جاهز للعمل!</h2>' +
        '<p style="color:var(--TX2);margin-bottom:16px;line-height:1.8;">تم الإعداد بنجاح. يمكنك الآن إدارة عمليات مشروعك.</p>' +
        '<div style="display:flex;gap:12px;justify-content:center;margin-bottom:20px;flex-wrap:wrap;">' +
          '<div style="background:var(--GL);padding:12px 16px;border-radius:var(--radius-sm);border:1px solid #e8d8a4;">' +
            '<div style="font-weight:700;color:var(--G);">' + totalProcs + '</div>' +
            '<div style="font-size:var(--fs-sm);color:var(--TX2);">عمليات متاحة</div>' +
          '</div>' +
          '<div style="background:var(--GL);padding:12px 16px;border-radius:var(--radius-sm);border:1px solid #e8d8a4;">' +
            '<div style="font-weight:700;color:var(--G);">' + NEXORA.ProcessCatalog.groups.length + '</div>' +
            '<div style="font-size:var(--fs-sm);color:var(--TX2);">مجموعات PMBOK</div>' +
          '</div>' +
          '<div style="background:var(--GL);padding:12px 16px;border-radius:var(--radius-sm);border:1px solid #e8d8a4;">' +
            '<div style="font-weight:700;color:var(--G);">' + (selectedTier === 1 ? '⚡ بسيط' : '🏢 مؤسسي') + '</div>' +
            '<div style="font-size:var(--fs-sm);color:var(--TX2);">الوضع المختار</div>' +
          '</div>' +
        '</div>' +
        '<button class="btn btn-primary" onclick="NEXORA.ProcessWizard.finish()"><i class="ti ti-player-play"></i> ابدأ إدارة العمليات</button>' +
      '</div>';
    }

    h += '</div>';

    h += '<div style="display:flex;justify-content:space-between;margin-top:12px;">' +
      '<button class="btn btn-o" onclick="NEXORA.ProcessWizard.prev()" ' + (currentStep === 0 ? 'disabled style="opacity:0.4;cursor:default;"' : '') + '><i class="ti ti-arrow-right"></i> السابق</button>' +
      '<button class="btn btn-primary" onclick="NEXORA.ProcessWizard.next()" ' + (currentStep === steps.length - 1 ? 'disabled style="opacity:0.4;cursor:default;"' : '') + '>التالي <i class="ti ti-arrow-left"></i></button>' +
    '</div>';

    el.innerHTML = h;
  }

  function next() {
    if (currentStep < steps.length - 1) {
      currentStep++;
      render();
    }
  }

  function prev() {
    if (currentStep > 0) {
      currentStep--;
      render();
    }
  }

  function selectGroup(groupIndex) {
    selectedGroupIdx = groupIndex;
    render();
  }

  function finish() {
    try {
      localStorage.setItem('nexora_proc_tier', selectedTier);
    } catch (e) {}

    currentStep = 0;

    if (typeof showView === 'function') {
      showView('processes');
    }
    if (typeof showToast === 'function') {
      showToast('تم إعداد محرك العمليات بنجاح!', 'success');
    }
  }

  function _selectTier(t) {
    selectedTier = t;
    render();
  }

  function _selectGroup(g) {
    selectedGroupIdx = g;
    render();
  }

  return {
    get currentStep() { return currentStep; },
    set currentStep(v) { currentStep = v; },
    render: render,
    next: next,
    prev: prev,
    selectGroup: selectGroup,
    finish: finish,
    _selectTier: _selectTier,
    _selectGroup: _selectGroup
  };

})();

window.renderProcessWizard = function() { NEXORA.ProcessWizard.render(); };
