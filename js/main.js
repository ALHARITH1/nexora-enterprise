/**
 * Nexora Enterprise Module Entry Point
 */

export function initAppModule() {
  if (typeof window.NEXORA !== 'undefined' && window.NEXORA.App) {
    try {
      window.NEXORA.App.init();
    } catch (e) {
      console.error('[NEXORA] Application initialization failed:', e);
    }
  }
}

if (typeof window !== 'undefined') {
  window.initAppModule = initAppModule;
}
