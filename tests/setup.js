import { beforeEach, vi } from 'vitest';

// Mock localStorage
const localStorageMock = (function () {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString(); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Setup mock window environment properties
beforeEach(() => {
  window.localStorage.clear();
  document.body.innerHTML = '<div id="app"></div>';
});
