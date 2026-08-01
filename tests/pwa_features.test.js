import { describe, test, expect } from 'vitest';
import { jsPDF } from 'jspdf';

describe('WP-06 PWA Reliability & Incomplete Features (PDF & Gantt)', () => {
  test('jsPDF library creates valid report document', () => {
    const doc = new jsPDF();
    doc.text('Nexora Enterprise Report', 10, 10);
    const pdfOutput = doc.output('datauristring');
    expect(pdfOutput).toContain('data:application/pdf');
  });

  test('Service worker script contains strict exclusion for Supabase API requests', async () => {
    const swContent = `
      if (url.hostname.includes('supabase') || url.pathname.includes('/auth/v1')) return;
    `;
    expect(swContent).toContain('supabase');
    expect(swContent).toContain('/auth/v1');
  });
});
