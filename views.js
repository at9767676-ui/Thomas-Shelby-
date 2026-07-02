/**
 * VIEW RENDERERS
 * Each function builds innerHTML for its #view-* container and wires events.
 * Views are re-rendered on navigation and after any state-changing action.
 */

/* ============================================================
   DASHBOARD
   ============================================================ */
function renderDashboard(){
  const s = Store.get();
  updateExamDial(); updateStreakChip();
  const el = document.getElementById('view-dashboard');
  const days = Planner.remainingDays();
  const allChapters = Planner.activeChapters();
  const overallPct = allChapters.length
    ? Math.round(allChapters.reduce((a,ch)=>a+chapterProgressPct(ch.id),0)/allChapters.length) : 0;
  const todaysHours = (s.hoursLog.filter(e=>e.date===todayISO()).reduce((a,e)=>a+e.hours,0));
  const totalHours = totalHoursLogged(s);
  const today = Planner.todaysPlan();
  const weekPlan = Planner.getOrGeneratePlan().weekly[0];
  const monthPlan = Planner.getOrGeneratePlan().monthly[0];

  el.innerHTML = `
    <div class="bento">
      ${statCard('clock', 'var(--indigo)', days, 'Days to Exam', s.attempt ? `Attempt: ${s.attempt}` : '')}
      ${statCard('target', 'var(--amber)', overallPct+'%', 'Overall Progress', '')}
      ${statCard('flame', 'var(--strong)', s.streak.current, 'Study Streak', `Best: ${s.streak.longest} days`)}
      ${statCard('book', 'var(--sub-audit)', Math.round(totalHours), 'Hours Studied', `Today: ${todaysHours.toFixed(1)}h`)}
    </div>

    <div class="section-heading"><h2>Today's Target</h2><button class="link-btn" onclick="navigateTo('planner')">Open Planner →</button></div>
    <div class="card today-card">
      ${today.items.length ? today.items.map(item => `
        <div class="today-row">
          <div class="today-dot" style="background:${resolveColor(item.subjectColor)}"></div>
          <div>
            <div class="today-row-title">${item.chapterName}</div>
            <div class="today-row-sub">${capitalize(item.taskType)} · ${getSubject(item.subjectId).name}</div>
          </div>
          <div class="today-row-hours">${item.hours}h</div>
        </div>`).join('') : emptyState('book', "You're all caught up", 'No chapters scheduled for today — great pace!')}
    </div>

    <div class="grid grid-2" style="margin-top:26px">
      <div class="card" style="padding:20px">
        <h3 style="font-size:13.5px;font-weight:600;margin-bottom:12px">This Week</h3>
        <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:10px">
          <span class="mono" style="font-size:24px;font-weight:700;color:var(--amber)">${weekPlan?weekPlan.totalHours:0}h</span>
          <span style="font-size:12px;color:var(--text-faint)">planned across ${weekPlan?weekPlan.days.length:0} days</span>
        </div>
        <div class="progress-track"><div class="progress-fill" style="width:${Math.min(100, todaysHours/(s.studyHours.daily||1)*100)}%"></div></div>
      </div>
      <div class="card" style="padding:20px">
        <h3 style="font-size:13.5px;font-weight:600;margin-bottom:12px">This Month</h3>
        <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:10px">
          <span class="mono" style="font-size:24px;font-weight:700;color:var(--indigo)">${monthPlan?monthPlan.totalHours:0}h</span>
          <span style="font-size:12px;color:var(--text-faint)">${monthPlan?monthPlan.label:''}</span>
        </div>
        <div class="progress-track"><div class="progress-fill" style="width:${overallPct}%;background:linear-gradient(90deg,var(--indigo),#8AA3FF)"></div></div>
      </div>
    </div>

    <div class="section-heading"><h2>Pending Tasks</h2><button class="link-btn" onclick="navigateTo('subjects')">View Subjects →</button></div>
    <div class="card" style="padding:8px 20px">
      ${pendingTasksList(s)}
    </div>
  `;
}

function pendingTasksList(s){
  const chapters = Planner.activeChapters().filter(ch => chapterProgressPct(ch.id) < 100).slice(0, 6);
  if(!chapters.length) return emptyState('check', 'Nothing pending', 'Every active chapter is fully complete.');
  return chapters.map(ch => {
    const pct = chapterProgressPct(ch.id);
    const conf = Store.get().confidence[ch.id] || 3;
    return `
    <div class="today-row" style="cursor:pointer" onclick="navigateTo('chapters',{subjectId:'${ch.subjectId}'})">
      <div class="today-dot" style="background:${resolveColor(ch.subjectColor)}"></div>
      <div>
        <div class="today-row-title">${ch.name}</div>
        <div class="today-row-sub">${getSubject(ch.subjectId).name}</div>
      </div>
      <span class="badge badge-${confidenceBand(conf)}" style="margin-left:auto">${pct}%</span>
    </div>`;
  }).join('');
}

function statCard(iconName, color, value, label, trend){
  return `
  <div class="card stat-card">
    <div class="stat-icon" style="background:color-mix(in srgb, ${color} 16%, transparent); color:${color}">${icon(iconName)}</div>
    <div class="stat-value">${value}</div>
    <div class="stat-label">${label}</div>
    ${trend ? `<div class="stat-trend" style="color:var(--text-faint)">${trend}</div>` : ''}
  </div>`;
}

function emptyState(iconName, title, sub){
  return `<div class="empty-state">${icon(iconName)}<h3>${title}</h3><p>${sub}</p></div>`;
}

function resolveColor(cssVarExpr){
  // cssVarExpr like "var(--sub-accounts)" -> resolved hex, so it also works in inline styles reliably.
  if(!cssVarExpr) return '#888';
  if(cssVarExpr.startsWith('var(')){
    const name = cssVarExpr.slice(4,-1);
    return getComputedStyle(document.body).getPropertyValue(name).trim() || '#888';
  }
  return cssVarExpr;
}

function capitalize(str){ return str.charAt(0).toUpperCase()+str.slice(1); }

/* ============================================================
   SUBJECTS
   ============================================================ */
function renderSubjects(){
  const s = Store.get();
  const el = document.getElementById('view-subjects');
  if(!s.subjectsSelected.length){
    el.innerHTML = emptyState('book', 'No subjects selected', 'Complete setup to add subjects.');
    return;
  }
  el.innerHTML = `<div class="grid grid-3" id="subjectGrid"></div>`;
  const grid = document.getElementById('subjectGrid');
  s.subjectsSelected.forEach(subId => {
    const sub = getSubject(subId);
    const chapters = sub.chapters.filter(ch => (s.chapterStatus[ch.id]||'to_study') !== 'skip');
    const avgPct = chapters.length ? Math.round(chapters.reduce((a,ch)=>a+chapterProgressPct(ch.id),0)/chapters.length) : 0;
    const weak = chapters.filter(ch => confidenceBand(s.confidence[ch.id]||3)==='weak').length;
    const totalHours = chapters.reduce((a,ch)=>a+ch.hours,0);

    const card = document.createElement('div');
    card.className = 'card subject-card';
    card.style.setProperty('--sub-color', sub.color);
    card.innerHTML = `
      <div class="subject-card-top">
        <div>
          <div class="subject-card-name">${sub.name}</div>
          <div class="subject-card-group">Group ${sub.group} · ${chapters.length} chapters</div>
        </div>
        <canvas class="ring-mini" width="46" height="46" data-ring></canvas>
      </div>
      <div class="progress-track"><div class="progress-fill" style="width:${avgPct}%;background:linear-gradient(90deg, ${resolveColor(sub.color)}, ${resolveColor(sub.color)}aa)"></div></div>
      <div class="subject-card-stats">
        <span>${avgPct}% done</span>
        <span>${totalHours}h total</span>
        <span style="color:${weak?'var(--weak)':'var(--text-faint)'}">${weak} weak</span>
      </div>
    `;
    card.addEventListener('click', () => navigateTo('chapters', { subjectId: subId, title: sub.name }));
    grid.appendChild(card);
    Analytics.drawDonut(card.querySelector('[data-ring]'), avgPct, resolveColor(sub.color));
  });
}

/* ============================================================
   CHAPTERS (per subject)
   ============================================================ */
let chapterFilter = 'all';
function renderChapters(subjectId){
  const s = Store.get();
  const el = document.getElementById('view-chapters');
  const targetSubject = subjectId || s.subjectsSelected[0];
  if(!targetSubject){ el.innerHTML = emptyState('book','No subject selected',''); return; }
  const sub = getSubject(targetSubject);

  document.getElementById('viewTitle').textContent = sub.name;

  el.innerHTML = `
    <div class="filter-bar" id="subjectSwitcher">
      ${s.subjectsSelected.map(id => `<button class="filter-chip ${id===targetSubject?'active':''}" data-switch-subject="${id}">${getSubject(id).short}</button>`).join('')}
    </div>
    <div class="filter-bar">
      ${['all','weak','medium','strong','skipped'].map(f => `<button class="filter-chip ${chapterFilter===f?'active':''}" data-filter="${f}">${capitalize(f)}</button>`).join('')}
    </div>
    <div id="chapterListWrap"></div>
  `;

  document.querySelectorAll('[data-switch-subject]').forEach(b => b.addEventListener('click', () => navigateTo('chapters', { subjectId: b.dataset.switchSubject, title: getSubject(b.dataset.switchSubject).name })));
  document.querySelectorAll('[data-filter]').forEach(b => b.addEventListener('click', () => { chapterFilter = b.dataset.filter; renderChapters(targetSubject); }));

  const wrap = document.getElementById('chapterListWrap');
  let chapters = sub.chapters;
  if(chapterFilter === 'skipped') chapters = chapters.filter(ch => (s.chapterStatus[ch.id]||'to_study')==='skip');
  else {
    chapters = chapters.filter(ch => (s.chapterStatus[ch.id]||'to_study') !== 'skip');
    if(chapterFilter !== 'all') chapters = chapters.filter(ch => confidenceBand(s.confidence[ch.id]||3) === chapterFilter);
  }

  if(!chapters.length){ wrap.innerHTML = emptyState('book','No chapters here','Try a different filter.'); return; }

  wrap.innerHTML = chapters.map(ch => {
    const pct = chapterProgressPct(ch.id);
    const conf = s.confidence[ch.id] || 3;
    const band = confidenceBand(conf);
    const stripColor = band === 'weak' ? 'var(--weak)' : band === 'medium' ? 'var(--medium)' : 'var(--strong)';
    return `
    <div class="chapter-list-row" data-open-chapter="${ch.id}">
      <div class="status-strip" style="background:${stripColor}"></div>
      <div style="flex:1">
        <div class="cl-name">${ch.name}</div>
        <div class="cl-meta">${ch.hours}h · ${ch.difficulty} · ${confidenceLabel(conf)}</div>
      </div>
      <div class="cl-progress progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
      <div class="cl-pct">${pct}%</div>
    </div>`;
  }).join('');

  wrap.querySelectorAll('[data-open-chapter]').forEach(row => {
    row.addEventListener('click', () => openChapterDrawer(row.dataset.openChapter));
  });
}

/* ============================================================
   PLANNER
   ============================================================ */
let plannerTab = 'daily';
function renderPlanner(){
  const el = document.getElementById('view-planner');
  const plan = Planner.getOrGeneratePlan();

  el.innerHTML = `
    <div class="planner-tabs">
      <button data-ptab="daily" class="${plannerTab==='daily'?'active':''}">Daily</button>
      <button data-ptab="weekly" class="${plannerTab==='weekly'?'active':''}">Weekly</button>
      <button data-ptab="monthly" class="${plannerTab==='monthly'?'active':''}">Monthly</button>
      <button class="btn btn-secondary btn-sm" style="margin-left:auto" id="regenPlanBtn">${icon('refresh')} Regenerate</button>
    </div>
    <div id="plannerBody"></div>
  `;
  document.querySelectorAll('[data-ptab]').forEach(b => b.addEventListener('click', () => { plannerTab = b.dataset.ptab; renderPlanner(); }));
  document.getElementById('regenPlanBtn').addEventListener('click', () => { Planner.generatePlan(); toast('Plan regenerated.', 'success'); renderPlanner(); });

  const body = document.getElementById('plannerBody');
  if(!plan.daily.length){ body.innerHTML = emptyState('clock', 'No plan yet', 'Complete setup with an exam attempt to generate a plan.'); return; }

  if(plannerTab === 'daily') body.innerHTML = renderDailyPlan(plan.daily.slice(0, 14));
  else if(plannerTab === 'weekly') body.innerHTML = renderWeeklyPlan(plan.weekly);
  else body.innerHTML = renderMonthlyPlan(plan.monthly);
}

function renderDailyPlan(days){
  return days.map(d => `
    <div class="card day-card">
      <div class="day-card-head">
        <span class="dc-date">${formatDate(d.date)}</span>
        ${d.date===todayISO() ? '<span class="badge badge-strong">Today</span>' : ''}
        <span class="dc-hours">${d.totalHours}h</span>
      </div>
      ${d.items.map(item => `
        <div class="plan-task">
          <div class="pt-dot" style="background:${resolveColor(item.subjectColor)}"></div>
          <span>${item.chapterName}</span>
          <span class="pt-type">${item.taskType} · ${item.hours}h</span>
        </div>`).join('')}
    </div>`).join('');
}

function renderWeeklyPlan(weeks){
  if(!weeks.length) return emptyState('clock','No weeks planned','');
  return weeks.slice(0,6).map(w => `
    <div class="section-heading"><h2>${w.label} <span class="mono" style="color:var(--text-faint);font-size:12px">· ${w.totalHours}h</span></h2></div>
    <div class="week-grid">
      ${w.days.map(d => `
        <div class="card week-cell">
          <div class="wc-day">${formatDate(d.date,true)}</div>
          ${d.items.slice(0,4).map(item => `<div class="wc-task" style="border-left:3px solid ${resolveColor(item.subjectColor)}">${truncate(item.chapterName,20)}</div>`).join('')}
          ${d.items.length>4 ? `<div class="wc-task" style="opacity:.6">+${d.items.length-4} more</div>` : ''}
        </div>`).join('')}
    </div>`).join('');
}

function renderMonthlyPlan(months){
  if(!months.length) return emptyState('clock','No months planned','');
  return months.map(m => {
    const loadByDate = {};
    m.days.forEach(d => loadByDate[d.date] = d.totalHours);
    const first = new Date(m.key + '-01');
    const daysInMonth = new Date(first.getFullYear(), first.getMonth()+1, 0).getDate();
    const startWeekday = first.getDay();
    let cells = '';
    for(let i=0;i<startWeekday;i++) cells += `<div></div>`;
    for(let day=1; day<=daysInMonth; day++){
      const iso = `${m.key}-${String(day).padStart(2,'0')}`;
      const hrs = loadByDate[iso] || 0;
      const maxH = Store.get().studyHours.daily || 4;
      cells += `<div class="month-cell"><span class="mc-num">${day}</span><div class="mc-load" style="background:${hrs? 'var(--amber)':'var(--surface-2)'};opacity:${hrs?Math.min(1,hrs/maxH):0.2}"></div></div>`;
    }
    return `
    <div class="section-heading"><h2>${m.label} <span class="mono" style="color:var(--text-faint);font-size:12px">· ${m.totalHours}h</span></h2></div>
    <div class="month-cal">${cells}</div>`;
  }).join('');
}

function formatDate(iso, short=false){
  const d = new Date(iso+'T00:00:00');
  return d.toLocaleDateString('en-IN', short ? {weekday:'short', day:'2-digit'} : {weekday:'long', day:'2-digit', month:'short'});
}
function truncate(str,n){ return str.length>n ? str.slice(0,n-1)+'…' : str; }

/* ============================================================
   ANALYTICS
   ============================================================ */
function renderAnalytics(){
  const s = Store.get();
  const el = document.getElementById('view-analytics');
  const allChapters = Planner.activeChapters();
  const overallPct = allChapters.length ? Math.round(allChapters.reduce((a,ch)=>a+chapterProgressPct(ch.id),0)/allChapters.length) : 0;
  const accuracy = Analytics.questionAccuracy();
  const { weak, strong } = Analytics.weakStrongChapters();
  const subjectProgress = Analytics.subjectWiseProgress();

  el.innerHTML = `
    <div class="grid grid-3">
      <div class="card chart-card">
        <h3>Study Hours</h3><p class="chart-sub">Last 14 days</p>
        <canvas id="hoursChart" style="width:100%;height:140px"></canvas>
      </div>
      <div class="card chart-card" style="display:flex;flex-direction:column;align-items:center">
        <h3 style="align-self:flex-start">Overall Completion</h3><p class="chart-sub" style="align-self:flex-start">Across active chapters</p>
        <canvas id="completionDonut" style="width:140px;height:140px"></canvas>
      </div>
      <div class="card chart-card" style="display:flex;flex-direction:column;align-items:center">
        <h3 style="align-self:flex-start">Question Accuracy</h3><p class="chart-sub" style="align-self:flex-start">Timed practice success rate</p>
        <canvas id="accuracyDonut" style="width:140px;height:140px"></canvas>
      </div>
    </div>

    <div class="grid grid-2" style="margin-top:18px">
      <div class="card chart-card">
        <h3>Mock Scores</h3><p class="chart-sub">Actual % over time</p>
        <canvas id="mockLine" style="width:100%;height:160px"></canvas>
      </div>
      <div class="card chart-card">
        <h3>Subject-wise Progress</h3><p class="chart-sub">${subjectProgress.length} subjects</p>
        ${subjectProgress.map(sp => `
          <div class="subject-progress-row">
            <span class="spr-name">${sp.name}</span>
            <div class="progress-track" style="flex:1"><div class="progress-fill" style="width:${sp.pct}%;background:${resolveColor(sp.color)}"></div></div>
            <span class="spr-pct">${sp.pct}%</span>
          </div>`).join('')}
      </div>
    </div>

    <div class="grid grid-2" style="margin-top:18px">
      <div class="card chart-card">
        <h3>Weak Chapters</h3><p class="chart-sub">${weak.length} chapters need attention</p>
        ${weak.slice(0,6).map(ch => `<div class="today-row" style="cursor:pointer" onclick="navigateTo('chapters',{subjectId:'${ch.subjectId}'})"><div class="today-dot" style="background:var(--weak)"></div><div class="today-row-title">${ch.name}</div></div>`).join('') || emptyState('check','No weak chapters','Nice work.')}
      </div>
      <div class="card chart-card">
        <h3>Strong Chapters</h3><p class="chart-sub">${strong.length} chapters mastered</p>
        ${strong.slice(0,6).map(ch => `<div class="today-row"><div class="today-dot" style="background:var(--strong)"></div><div class="today-row-title">${ch.name}</div></div>`).join('') || emptyState('target','Building strength','Confidence will rise as you progress.')}
      </div>
    </div>

    <div class="section-heading"><h2>Study Heatmap</h2><span style="font-size:11.5px;color:var(--text-faint)">Last 26 weeks</span></div>
    <div class="card" style="padding:18px"><div class="heat-grid" id="heatGrid"></div></div>
  `;

  Analytics.drawBarChart(document.getElementById('hoursChart'), Analytics.hoursByDay(14));
  Analytics.drawDonut(document.getElementById('completionDonut'), overallPct, resolveColor('var(--amber)'));
  Analytics.drawDonut(document.getElementById('accuracyDonut'), accuracy, resolveColor('var(--strong)'));
  Analytics.drawLineChart(document.getElementById('mockLine'), s.mockScores.map(m => ({ value: m.actualPct })), resolveColor('var(--indigo)'));

  const heat = Analytics.studyHeatmap();
  const heatGrid = document.getElementById('heatGrid');
  heatGrid.innerHTML = heat.map(d => `<div class="heat-cell" title="${d.date}: ${d.hours}h" style="background:${Analytics.heatColor(d.hours)}"></div>`).join('');
}

/* ============================================================
   VAULT
   ============================================================ */
function renderVault(){
  const s = Store.get();
  const el = document.getElementById('view-vault');
  el.innerHTML = `
    <div class="vault-upload" id="vaultDropzone">
      ${icon('upload')}
      <div style="font-weight:600;font-size:13.5px">Drop files here or click to upload</div>
      <div style="font-size:11.5px;color:var(--text-faint);margin-top:4px">Notes · RTP · MTP · PYQ · Formula Sheets · Summaries</div>
      <input type="file" id="vaultFileInput" multiple style="display:none">
    </div>
    <div class="section-heading"><h2>Your Files</h2><span style="font-size:11.5px;color:var(--text-faint)">${s.vault.length} files</span></div>
    <div id="vaultList">${s.vault.length ? s.vault.map(vaultRow).join('') : emptyState('file','Vault is empty','Upload your first study material above.')}</div>
  `;

  const dz = document.getElementById('vaultDropzone');
  const input = document.getElementById('vaultFileInput');
  dz.addEventListener('click', () => input.click());
  input.addEventListener('change', (e) => handleVaultFiles(e.target.files));
  ['dragover','dragleave','drop'].forEach(evt => dz.addEventListener(evt, (e) => {
    e.preventDefault();
    dz.classList.toggle('dragover', evt==='dragover');
    if(evt==='drop') handleVaultFiles(e.dataTransfer.files);
  }));

  document.querySelectorAll('[data-delete-vault]').forEach(b => b.addEventListener('click', (e) => {
    e.stopPropagation();
    Store.update(state => { state.vault = state.vault.filter(v => v.id !== b.dataset.deleteVault); });
    toast('File removed.', 'info');
    renderVault();
  }));
}

function vaultRow(v){
  return `
  <div class="vault-file-row">
    <div class="vault-file-icon">${icon('file')}</div>
    <div style="flex:1">
      <div class="vault-file-name">${v.name}</div>
      <div class="vault-file-meta">${v.type} · ${v.sizeKB}KB · ${v.dateAdded}</div>
    </div>
    <button class="icon-btn" data-delete-vault="${v.id}">${icon('trash')}</button>
  </div>`;
}

function handleVaultFiles(fileList){
  Array.from(fileList).forEach(file => {
    const reader = new FileReader();
    reader.onload = () => {
      Store.update(state => {
        state.vault.push({
          id: 'v' + Date.now() + Math.random().toString(36).slice(2,6),
          name: file.name,
          type: guessVaultType(file.name),
          sizeKB: Math.round(file.size/1024),
          dateAdded: todayISO(),
        });
      });
      renderVault();
    };
    reader.readAsArrayBuffer(file); // we don't persist binary content to keep storage lightweight; metadata only
  });
  toast(`${fileList.length} file(s) added to vault.`, 'success');
}

function guessVaultType(name){
  const n = name.toLowerCase();
  if(n.includes('rtp')) return 'RTP';
  if(n.includes('mtp')) return 'MTP';
  if(n.includes('pyq')) return 'PYQ';
  if(n.includes('formula')) return 'Formula Sheet';
  if(n.includes('summary')) return 'Summary Notes';
  return 'Notes';
}

/* ============================================================
   ACHIEVEMENTS
   ============================================================ */
function renderAchievements(){
  const s = Store.get();
  const el = document.getElementById('view-achievements');
  el.innerHTML = `<div class="grid grid-3">
    ${ACHIEVEMENTS.map(a => {
      const unlocked = !!s.achievementsUnlocked[a.id];
      return `
      <div class="card achievement-card ${unlocked?'':'locked'}">
        <div class="achievement-badge">${icon(a.icon)}</div>
        <div class="achievement-name">${a.name}</div>
        <div class="achievement-desc">${a.desc}</div>
        ${unlocked ? `<div class="achievement-date">Unlocked ${s.achievementsUnlocked[a.id]}</div>` : ''}
      </div>`;
    }).join('')}
  </div>`;
}

/* ============================================================
   SETTINGS
   ============================================================ */
function renderSettings(){
  const s = Store.get();
  const el = document.getElementById('view-settings');
  el.innerHTML = `
    <div class="card" style="padding:8px 22px;margin-bottom:20px">
      <div class="settings-row">
        <div><div class="settings-row-title">Theme</div><div class="settings-row-sub">Switch between dark and light mode</div></div>
        <div class="switch ${s.theme==='dark'?'on':''}" id="themeSwitch"></div>
      </div>
      <div class="settings-row">
        <div><div class="settings-row-title">Attempt</div><div class="settings-row-sub">Currently: ${s.attempt || 'Not set'} · Exam date ${s.examDate||'—'}</div></div>
        <button class="btn btn-secondary btn-sm" id="changeAttemptBtn">Change</button>
      </div>
      <div class="settings-row">
        <div><div class="settings-row-title">Daily Study Hours</div><div class="settings-row-sub">Used by the Smart Engine to build your plan</div></div>
        <div style="display:flex;align-items:center;gap:10px">
          <input type="range" min="1" max="12" step="0.5" id="settingsHoursRange" value="${s.studyHours.daily}">
          <span class="mono" id="settingsHoursValue">${s.studyHours.daily}h</span>
        </div>
      </div>
    </div>

    <div class="card" style="padding:8px 22px;margin-bottom:20px">
      <div class="settings-row">
        <div><div class="settings-row-title">Backup</div><div class="settings-row-sub">Save a local snapshot you can restore later</div></div>
        <button class="btn btn-secondary btn-sm" id="backupBtn">Backup Now</button>
      </div>
      <div class="settings-row">
        <div><div class="settings-row-title">Restore</div><div class="settings-row-sub">Load your most recent backup</div></div>
        <button class="btn btn-secondary btn-sm" id="restoreBtn">Restore</button>
      </div>
      <div class="settings-row">
        <div><div class="settings-row-title">Export Data</div><div class="settings-row-sub">Download all your data as JSON</div></div>
        <button class="btn btn-secondary btn-sm" id="exportBtn">Export</button>
      </div>
      <div class="settings-row">
        <div><div class="settings-row-title">Reset Progress</div><div class="settings-row-sub">Erase everything and start over</div></div>
        <button class="btn btn-danger btn-sm" id="resetBtn">Reset</button>
      </div>
    </div>
  `;

  document.getElementById('themeSwitch').addEventListener('click', () => document.getElementById('themeToggleBtn').click());

  document.getElementById('changeAttemptBtn').addEventListener('click', () => {
    if(confirm('Changing your attempt will regenerate your countdown and plan. Continue?')){
      startOnboarding();
    }
  });

  const hoursRange = document.getElementById('settingsHoursRange');
  hoursRange.addEventListener('input', () => {
    document.getElementById('settingsHoursValue').textContent = hoursRange.value + 'h';
  });
  hoursRange.addEventListener('change', () => {
    Store.update(state => { state.studyHours.daily = parseFloat(hoursRange.value); });
    Planner.generatePlan();
    toast('Daily study hours updated — plan regenerated.', 'success');
  });

  document.getElementById('backupBtn').addEventListener('click', () => { Store.backupToLocal(); toast('Backup saved.', 'success'); });
  document.getElementById('restoreBtn').addEventListener('click', () => {
    if(Store.restoreFromBackup()){ toast('Backup restored.', 'success'); location.reload(); }
    else toast('No backup found.', 'error');
  });
  document.getElementById('exportBtn').addEventListener('click', () => {
    const blob = new Blob([Store.exportJSON()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `ca-inter-planner-export-${todayISO()}.json`;
    a.click();
  });
  document.getElementById('resetBtn').addEventListener('click', () => {
    if(confirm('This will permanently erase all your progress. Are you sure?')){
      Store.reset();
      location.reload();
    }
  });
}
