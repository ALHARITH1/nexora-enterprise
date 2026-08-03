import fs from 'node:fs';
import path from 'node:path';
import { describe, test, expect, beforeEach } from 'vitest';
import axe from 'axe-core';

describe('WP-07 Accessibility & Interaction Quality (WCAG AA)', () => {
  beforeEach(() => {
    const html = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf8');
    document.body.innerHTML = html;
  });

  test('Automated axe audit reports no serious or critical accessibility violations', async () => {
    const results = await axe.run(document.body, {
      rules: {
        'region': { enabled: false },
        // jsdom has no layout/canvas implementation; contrast remains a real-browser check.
        'color-contrast': { enabled: false }
      }
    });

    const criticalViolations = results.violations.filter(
      v => v.impact === 'critical' || v.impact === 'serious'
    );

    expect(criticalViolations.length).toBe(0);
  });
});
