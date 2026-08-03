import fs from 'node:fs';
import path from 'node:path';
import { describe, test, expect } from 'vitest';

const repositoryRoot = process.cwd();

describe('WP-06 PWA Reliability & Explicit Feature Limits', () => {
  test('PDF export is explicitly disabled after removal of the vulnerable dependency', () => {
    const packageJson = JSON.parse(fs.readFileSync(path.resolve(repositoryRoot, 'package.json'), 'utf8'));
    const reportsSource = fs.readFileSync(path.resolve(repositoryRoot, 'js/views/reports.js'), 'utf8');

    expect(packageJson.dependencies).not.toHaveProperty('jspdf');
    expect(packageJson.dependencies).not.toHaveProperty('jspdf-autotable');
    expect(reportsSource).not.toContain('new jspdf.jsPDF');
    expect(reportsSource).not.toContain('onclick="exportReportPDF');
    expect(reportsSource).toContain('تصدير PDF غير متاح حالياً');
  });

  test('PWA configuration excludes Supabase API traffic from runtime caching', () => {
    const viteConfig = fs.readFileSync(path.resolve(repositoryRoot, 'vite.config.js'), 'utf8');

    expect(viteConfig).toContain("handler: 'NetworkOnly'");
    expect(viteConfig).toContain("url.hostname.includes('supabase')");
    expect(viteConfig).toContain("url.pathname.includes('/auth/v1')");
    expect(viteConfig).toContain("url.pathname.includes('/rest/v1')");
  });
});
