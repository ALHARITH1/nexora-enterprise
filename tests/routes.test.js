import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import '../js/router.js'; // Ensure router is imported so NEXORA.Router exists

describe('Route Smoke Test (WP-01) @runtime', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="landingPage" class="landing"></div>
      <div id="authPage" class="auth hidden"></div>
      <div id="appShell" class="app-shell hidden">
        <h2 id="headerTitle"></h2>
        <div id="view-dashboard" class="view-section"><div id="dashContent"></div></div>
        <div id="view-projects" class="view-section"><div id="projectsContent"></div></div>
        <div id="view-project" class="view-section"><div id="projectContent"></div></div>
        <div id="view-item" class="view-section"><div id="itemContent"></div></div>
        <div id="view-approvals" class="view-section"><div id="approvalsContent"></div></div>
        <div id="view-costs" class="view-section"><div id="costsContent"></div></div>
        <div id="view-reports" class="view-section"><div id="reportsContent"></div></div>
        <div id="view-employees" class="view-section"><div id="employeesContent"></div></div>
        <div id="view-admin" class="view-section"><div id="adminContent"></div></div>
        <div id="view-owner" class="view-section"><div id="ownerContent"></div></div>
        <div id="view-processes" class="view-section"><div id="processesContent"></div></div>
        <div id="view-processDetail" class="view-section"><div id="processDetailContent"></div></div>
        <div id="view-processWizard" class="view-section"><div id="processWizardContent"></div></div>
        <div id="view-processDashboard" class="view-section"><div id="processDashboardContent"></div></div>
        <div id="view-boq" class="view-section"><div id="boqContent"></div></div>
        <div id="view-dailyLabor" class="view-section"><div id="dailyLaborContent"></div></div>
        <div id="view-cashflow" class="view-section"><div id="cashflowContent"></div></div>
        <div id="view-stakeholders" class="view-section"><div id="stakeholdersContent"></div></div>
        <div id="view-contracts" class="view-section"><div id="contractsContent"></div></div>
        <div id="view-changes" class="view-section"><div id="changesContent"></div></div>
        <div id="view-turbo" class="view-section"><div id="turboContent"></div></div>
        <div id="view-turboDaily" class="view-section"><div id="turboDailyContent"></div></div>
        <div id="view-turboPurchases" class="view-section"><div id="turboPurchasesContent"></div></div>
        <div id="view-turboCashflow" class="view-section"><div id="turboCashflowContent"></div></div>
        <div id="view-entPlanning" class="view-section"><div id="entPlanningContent"></div></div>
        <div id="view-entExecution" class="view-section"><div id="entExecutionContent"></div></div>
        <div id="view-entControl" class="view-section"><div id="entControlContent"></div></div>
        <div id="view-alerts" class="view-section"><div id="alertsContent"></div></div>
      </div>
    `;

    window.NEXORA = window.NEXORA || {};
    window.NEXORA.Auth = {
      isAuthenticated: () => true,
      getUser: () => ({ id: 'u1', role: 'company_admin', email: 'admin@test.com' })
    };
    window.NEXORA.App = {
      curProcessId: null,
      mode: 'turbo',
      _showLanding: () => {},
      cu: { role: 'company_admin' }
    };
    window.NEXORA.Sidebar = {
      setActive: vi.fn()
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('All discovered routes render without throwing exceptions', () => {
    const routerMap = window.NEXORA.Router._map;
    expect(routerMap).toBeDefined();

    const routes = Object.keys(routerMap);
    expect(routes.length).toBeGreaterThan(0);

    routes.forEach(route => {
      const routeInfo = routerMap[route];
      
      // Mock the render function to prevent actual DOM execution errors 
      // since we're just smoke testing the routing mechanism here.
      window[routeInfo.render] = vi.fn();

      // Trigger navigation
      window.NEXORA.Router._doNavigate(route);

      // Verify the correct section became active
      const section = document.getElementById(routeInfo.section);
      expect(section).not.toBeNull();
      expect(section.classList.contains('active')).toBe(true);

      // Verify the title changed
      const title = document.getElementById('headerTitle');
      expect(title.textContent).toBe(routeInfo.title);

      // Verify the render function was called
      expect(window[routeInfo.render]).toHaveBeenCalled();
    });
  });
});
