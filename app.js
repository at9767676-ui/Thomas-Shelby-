/**
 * APP MODULE
 * Boots the app, runs the onboarding wizard, and renders every view.
 * Talks to Store (state), Planner (smart engine), Analytics (charts).
 */

const ICONS = {
  check: '<path d="M20 6L9 17l-5-5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  refresh: '<path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>',
  award: '<circle cx="12" cy="8" r="6"/><path d="M15.5 13.5L17 22l-5-3-5 3 1.5-8.5"/>',
  flame: '<path d="M12 2s5 5.5 5 10a5 5 0 0 1-10 0c0-1 .3-2 1-3 .2 1 1 1.5 1.5 1 .5-2 .5-4-1-6.5C10 2 11 2 12 2z"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
  trash: '<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6"/>',
  star: '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/>',
  x: '<path d="M18 6L6 18M6 6l12 12"/>',
  play: '<path d="M5 3l14 9-14 9V3z"/>',
};
function icon(name, cls=''){ return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${ICONS[name]||''}</svg>`; }

/* ============================================================
   BOOT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  applyTheme(Store.get().theme);
  wireGlobalUI();

  if(!Store.get().setupComplete){
    startOnboarding();
  } else {
    showApp();
    navigateTo('dashboard');
  }
});

function applyTheme(theme){
  document.body.setAttribute('data-theme', theme);
}

function showApp(){
  document.getElementById('onboarding').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  updateExamDial();
  updateStreakChip();
  document.getElementById('brandAttempt').textContent = Store.get().attempt ? `Attempt ${Store.get().attempt}` : 'Attempt —';
}

/* ============================================================
   GLOBAL UI WIRING (sidebar, topbar, drawer/modal close, toasts)
   ============================================================ */
function wireGlobalUI(){
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => navigateTo(btn.dataset.view));
  });

  document.getElementById('sidebarCollapseBtn').addEventListener('click', () => {
    const app = document.getElementById('app');
    app.classList.toggle('collapsed');
    Store.update(s => { s.sidebarCollapsed = app.classList.contains('collapsed'); });
  });

  document.getElementById('mobileMenuBtn').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('mobile-open');
  });

  document.getElementById('themeToggleBtn').addEventListener('click', () => {
    const cur = Store.get().theme;
    const next = cur === 'dark' ? 'light' : 'dark';
    Store.update(s => { s.theme = next; });
    applyTheme(next);
    if(currentView) renderView(currentView);
  });

  document.getElementById('drawerOverlay').addEventListener('click', (e) => {
    if(e.target.id === 'drawerOverlay') closeDrawer();
  });
  document.getElementById('timerModalOverlay').addEventListener('click', (e) => {
    if(e.target.id === 'timerModalOverlay') {/* prevent accidental close during timer */}
  });
}

function toast(msg, type='info'){
  const stack = document.getElementById('toastStack');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  stack.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; setTimeout(()=>el.remove(), 300); }, 3200);
}

function updateExamDial(){
  const days = Planner.remainingDays();
  document.getElementById('dialDays').textContent = Store.get().examDate ? days : '—';
  const circumference = 169.6;
  const s = Store.get();
  let pct = 0;
  if(s.examDate){
    const totalSpan = daysBetween(s.setupCompleteDate || todayISO(), s.examDate) || 1;
    pct = Math.max(0, Math.min(1, 1 - days / Math.max(totalSpan, days, 1)));
  }
  const offset = circumference - (pct * circumference);
  document.getElementById('dialFillCircle').style.strokeDashoffset = isFinite(offset) ? offset : circumference;
}

function updateStreakChip(){
  document.getElementById('streakCount').textContent = Store.get().streak.current;
}

/* ============================================================
   ROUTER
   ============================================================ */
let currentView = null;
const VIEW_TITLES = {
  dashboard: 'Dashboard', subjects: 'Subjects', chapters: 'Chapters', planner: 'Planner',
  analytics: 'Analytics', vault: 'Study Vault', achievements: 'Achievements', settings: 'Settings'
};

function navigateTo(view, params={}){
  currentView = view;
  document.querySelectorAll('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.view === view));
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const el = document.getElementById('view-' + view);
  if(el) el.classList.add('active');
  document.getElementById('viewTitle').textContent = params.title || VIEW_TITLES[view] || view;
  document.getElementById('sidebar').classList.remove('mobile-open');
  renderView(view, params);
}

function renderView(view, params={}){
  switch(view){
    case 'dashboard': return renderDashboard();
    case 'subjects': return renderSubjects();
    case 'chapters': return renderChapters(params.subjectId);
    case 'planner': return renderPlanner();
    case 'analytics': return renderAnalytics();
    case 'vault': return renderVault();
    case 'achievements': return renderAchievements();
    case 'settings': return renderSettings();
  }
}
