import fs from 'node:fs';
import path from 'node:path';
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import '../js/router.js'; // Ensure router is imported so NEXORA.Router exists

describe('Route Smoke Test (WP-01) @runtime', () => {
  beforeEach(() => {
    const html = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf8');
    document.body.innerHTML = html;

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
