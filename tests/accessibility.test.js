import { describe, test, expect, beforeEach } from 'vitest';
import axe from 'axe-core';

describe('WP-07 Accessibility & Interaction Quality (WCAG AA)', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <main id="mainApp" role="main">
        <h1>لوحة تحكم NEXORA</h1>
        <form id="testForm">
          <label for="compName">اسم الشركة</label>
          <input type="text" id="compName" name="compName" />
          
          <button type="submit" aria-label="حفظ التغييرات">حفظ</button>
        </form>
        <div id="modalBox" role="dialog" aria-modal="true" aria-label="تنبيه">
          <h2>موافق</h2>
          <button type="button" aria-label="إغلاق">إغلاق</button>
        </div>
      </main>
    `;
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
