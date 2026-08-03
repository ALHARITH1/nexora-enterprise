import { describe, test, expect, beforeEach } from 'vitest';
import axe from 'axe-core';

describe('WP-07 Accessibility & Interaction Quality (WCAG AA)', () => {
  beforeEach(() => {
    const fs = require('fs');
    const path = require('path');
    const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
    document.body.innerHTML = html;
  });

  test('Automated axe audit reports no serious or critical accessibility violations', async () => {
    const results = await axe.run(document.body, {
      rules: {
        'region': { enabled: false } // Disable region rule for partial DOM snippet testing
      }
    });

    const criticalViolations = results.violations.filter(
      v => v.impact === 'critical' || v.impact === 'serious'
    );

    expect(criticalViolations.length).toBe(0);
  });
});
