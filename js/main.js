import '../css/variables.css';
import '../css/base.css';
import '../css/components.css';
import '../css/layout.css';
import '../css/landing.css';
import '../css/auth.css';
import '../css/dashboard.css';
import '../css/kanban.css';
import '../css/processes.css';
import '../css/dark.css';
import '../css/turbo.css';
import '../css/enterprise.css';

import 'chart.js/auto';

import './config.js';
import './utils/helpers.js';
import './supabaseClient.js';
import './auth.js';
import './rbac.js';
import './store.js';
import './router.js';
import './components/toast.js';
import './components/modal.js';
import './components/charts.js';
import './components/sidebar.js';
import './components/header.js';
import './components/interactive.js';
import './views/dashboard.js';
import './views/projects.js';
import './views/projectDetail.js';
import './views/itemDetail.js';
import './views/approvals.js';
import './views/costs.js';
import './views/reports.js';
import './views/employees.js';
import './views/admin.js';
import './views/owner.js';
import './processes/processCatalog.js';
import './processes/processEngine.js';
import './processes/processWizard.js';
import './views/processes.js';
import './views/processDetail.js';
import './views/processDashboard.js';
import './views/boq.js';
import './views/dailyLabor.js';
import './views/cashflow.js';
import './views/stakeholders.js';
import './views/contracts.js';
import './views/changeRequests.js';
import './alerts.js';
import './views/turbo/dashboard.js';
import './views/turbo/daily.js';
import './views/turbo/purchases.js';
import './views/turbo/cashflow.js';
import './views/enterprise/planning.js';
import './views/enterprise/execution.js';
import './views/enterprise/control.js';
import './app.js';

export async function initAppModule() {
  if (typeof window.NEXORA !== 'undefined' && window.NEXORA.App) {
    try {
      await window.NEXORA.App.init();
    } catch (e) {
      console.error('[NEXORA] Application initialization failed:', e);
      showStartupError(e.message || 'حدث خطأ أثناء تحميل التطبيق');
    }
  } else {
    showStartupError('تعذر تحميل مكونات التطبيق الأساسية');
  }
}

function showStartupError(msg) {
  const errUI = document.getElementById('appErrorBoundary');
  const errText = document.getElementById('appErrorText');
  if (errUI && errText) {
    errText.textContent = msg;
    errUI.classList.remove('hidden');
  }
}

function bindDOMEvents() {
  const routerNav = (route) => (e) => { e.preventDefault(); if (window.NEXORA?.Router) NEXORA.Router.navigate(route); };
  
  const navLoginBtn = document.getElementById('navLoginBtn');
  if (navLoginBtn) navLoginBtn.addEventListener('click', routerNav('login'));
  
  const navStartBtn = document.getElementById('navStartBtn');
  if (navStartBtn) navStartBtn.addEventListener('click', routerNav('login'));

  const heroStartBtn = document.getElementById('heroStartBtn');
  if (heroStartBtn) heroStartBtn.addEventListener('click', routerNav('login'));

  const ctaStartBtn = document.getElementById('ctaStartBtn');
  if (ctaStartBtn) ctaStartBtn.addEventListener('click', routerNav('login'));

  const authBackBtn = document.getElementById('authBackBtn');
  if (authBackBtn) authBackBtn.addEventListener('click', routerNav('landing'));

  const sidebarLogoutBtn = document.getElementById('sidebarLogoutBtn');
  if (sidebarLogoutBtn) sidebarLogoutBtn.addEventListener('click', () => {
    if (window.NEXORA?.Auth) NEXORA.Auth.logout();
  });

  document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', function() {
      const tabName = this.getAttribute('data-tab');
      if (window.NEXORA?.AuthPage) {
        NEXORA.AuthPage._switchTab(tabName, this);
      } else {
        // Fallback tab switching
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
        if (tabName === 'login') {
          document.getElementById('authLoginForm')?.classList.add('active');
        } else {
          document.getElementById('authRegisterForm')?.classList.add('active');
        }
      }
    });
  });
}

if (typeof window !== 'undefined') {
  window.initAppModule = initAppModule;
  document.addEventListener('DOMContentLoaded', () => {
    bindDOMEvents();
    initAppModule();
  });
}
