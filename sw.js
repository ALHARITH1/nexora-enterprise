const CACHE = 'nexora-v3.3.0';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/variables.css',
  './css/base.css',
  './css/components.css',
  './css/layout.css',
  './css/landing.css',
  './css/auth.css',
  './css/dashboard.css',
  './css/kanban.css',
  './css/processes.css',
  './css/dark.css',
  './js/config.js',
  './js/utils/helpers.js',
  './js/supabaseClient.js',
  './js/auth.js',
  './js/rbac.js',
  './js/store.js',
  './js/router.js',
  './js/app.js',
  './js/components/toast.js',
  './js/components/modal.js',
  './js/components/charts.js',
  './js/components/sidebar.js',
  './js/components/header.js',
  './js/components/interactive.js',
  './js/views/dashboard.js',
  './js/views/projects.js',
  './js/views/projectDetail.js',
  './js/views/itemDetail.js',
  './js/views/approvals.js',
  './js/views/costs.js',
  './js/views/reports.js',
  './js/views/employees.js',
  './js/views/admin.js',
  './js/views/owner.js',
  './js/processes/processCatalog.js',
  './js/processes/processEngine.js',
  './js/processes/processWizard.js',
  './js/views/processes.js',
  './js/views/processDetail.js',
  './js/views/processDashboard.js',
  './js/views/boq.js',
  './js/views/dailyLabor.js',
  './js/views/cashflow.js',
  './js/views/stakeholders.js',
  './js/views/contracts.js',
  './js/views/changeRequests.js'
];
const CDN_ASSETS = [
  'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&display=swap',
  'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.44.0/dist/tabler-icons.min.css',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => Promise.allSettled(
      [...STATIC_ASSETS, ...CDN_ASSETS].map(u => c.add(u).catch(() => null))
    )).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname === '/' || url.pathname === '') {
    e.respondWith(
      fetch(e.request).then(res => {
        caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        return res;
      }).catch(() => caches.match(e.request).then(r => r || caches.match('./index.html').then(r => r || new Response('غير متصل', { status: 503 }))))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).then(res => {
      if (res && res.status === 200 && (res.type === 'basic' || res.type === 'cors')) {
        caches.open(CACHE).then(c => c.put(e.request, res.clone()));
      }
      return res;
    }).catch(() => new Response('', { status: 503 })))
  );
});

self.addEventListener('message', e => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});
