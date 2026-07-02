/**
 * CHAPTER DRAWER + TIMED QUESTION ENGINE
 * Progress never increases from a plain click. Theory/PYQ/revision/mock are
 * simple completion checks, but "Questions" is gated behind a timed ICAI-level
 * question: the student must solve it within the allotted time or the
 * attempt is logged as failed and progress does not advance.
 */

let activeChapterId = null;
let timerInterval = null;
let timerState = null; // { remaining, limit, chapterId }

function openChapterDrawer(chapterId){
  activeChapterId = chapterId;
  document.getElementById('drawerOverlay').classList.add('open');
  renderDrawer();
}
function closeDrawer(){
  document.getElementById('drawerOverlay').classList.remove('open');
  activeChapterId = null;
}

function renderDrawer(){
  const ch = getChapter(activeChapterId);
  const sub = getSubjectOfChapter(activeChapterId);
  const s = Store.get();
  const p = ensureChapterProgress(s, activeChapterId);
  Store.set(s);
  const status = s.chapterStatus[activeChapterId] || 'to_study';
  const conf = s.confidence[activeChapterId] || 3;
  const pct = chapterProgressPct(activeChapterId);
  const band = confidenceBand(conf);

  const drawer = document.getElementById('chapterDrawer');
  drawer.innerHTML = `
    <div class="drawer-header">
      <div>
        <div class="drawer-subject-tag" style="color:${sub.color}">${sub.short}</div>
        <h3 class="drawer-title">${ch.name}</h3>
        <div class="drawer-meta">
          <span>${ch.hours}h estimated</span>
          <span>·</span>
          <span style="text-transform:capitalize">${ch.difficulty}</span>
          <span>·</span>
          <span class="badge badge-${band}">${confidenceLabel(conf)}</span>
        </div>
      </div>
      <button class="icon-btn drawer-close" id="drawerCloseBtn">${icon('x')}</button>
    </div>

    <div class="drawer-progress-ring-wrap">
      <canvas id="drawerRing" width="72" height="72" style="width:72px;height:72px"></canvas>
      <div>
        <div style="font-family:var(--font-mono);font-size:22px;font-weight:700">${pct}%</div>
        <div style="font-size:11.5px;color:var(--text-faint)">Theory · Questions · PYQ · Revision · Mock — 20% each</div>
      </div>
    </div>

    <div style="margin-bottom:22px">
      <div style="font-size:12.5px;font-weight:600;margin-bottom:8px">Confidence</div>
      <div class="confidence-picker" id="drawerConfidence">
        ${[1,2,3,4,5].map(n => `<svg data-star="${n}" class="${n<=conf?'filled':''}" viewBox="0 0 24 24" style="width:22px;height:22px;cursor:pointer;fill:${n<=conf?'var(--amber)':'var(--border)'};stroke:none">${ICONS.star}</svg>`).join('')}
      </div>
    </div>

    <div style="font-size:12.5px;font-weight:600;margin-bottom:8px">Chapter Checklist</div>
    ${taskRow('theory', 'Theory', 'Watch/read the chapter theory', p.theory, true)}
    ${taskRow('questions', 'Question Practice', p.theory ? 'Timed ICAI-level question — unlocked' : 'Complete theory to unlock', p.questions, p.theory, true)}
    ${taskRow('pyq', 'PYQ', 'Previous Year Questions', p.pyq, p.questions)}
    ${taskRow('revision1', 'Revision — Pass 1', 'First revision pass', p.revision1, p.pyq)}
    ${taskRow('revision2', 'Revision — Pass 2', 'Second revision pass', p.revision2, p.revision1)}
    ${taskRow('revision3', 'Revision — Pass 3', 'Third revision pass', p.revision3, p.revision2)}
    ${taskRow('mock', 'Mock Covered', 'Chapter included in a mock test', p.mock, p.revision3)}

    <div style="margin-top:22px;display:flex;gap:8px">
      <button class="btn btn-ghost btn-sm" id="markStatusCompleted" style="flex:1">${status==='completed'?'✓ Marked Completed':'Mark as Completed'}</button>
      <button class="btn btn-ghost btn-sm" id="markStatusSkip" style="flex:1">${status==='skip'?'✓ Skipped':'Skip Chapter'}</button>
    </div>
  `;

  Analytics.drawDonut(document.getElementById('drawerRing'), pct, sub.color.startsWith('var')? getComputedStyle(document.body).getPropertyValue(sub.color.slice(4,-1)).trim() : sub.color);

  document.getElementById('drawerCloseBtn').addEventListener('click', closeDrawer);

  document.getElementById('drawerConfidence').addEventListener('click', (e) => {
    const starEl = e.target.closest('[data-star]');
    if(!starEl) return;
    Store.update(state => { state.confidence[activeChapterId] = parseInt(starEl.dataset.star); });
    renderDrawer();
  });

  document.getElementById('markStatusCompleted').addEventListener('click', () => {
    Store.update(state => { state.chapterStatus[activeChapterId] = state.chapterStatus[activeChapterId]==='completed' ? 'to_study' : 'completed'; });
    renderDrawer();
  });
  document.getElementById('markStatusSkip').addEventListener('click', () => {
    Store.update(state => { state.chapterStatus[activeChapterId] = state.chapterStatus[activeChapterId]==='skip' ? 'to_study' : 'skip'; });
    renderDrawer();
    Planner.generatePlan();
  });

  wireTaskChecks();
}

function taskRow(key, title, sub, done, unlocked, isTimedGate=false){
  const locked = !unlocked && !done;
  return `
  <div class="task-item">
    <div class="task-check ${done?'done':''} ${locked?'locked':''}" data-task="${key}" data-locked="${locked}">
      ${icon('check')}
    </div>
    <div>
      <div class="task-title">${title}</div>
      <div class="task-sub">${sub}</div>
    </div>
    ${isTimedGate && !done ? `<button class="btn btn-primary btn-sm task-cta" data-start-timer="${key}" ${locked?'disabled':''}>${icon('play')} Start</button>` : ''}
  </div>`;
}

function wireTaskChecks(){
  document.querySelectorAll('.task-check').forEach(el => {
    el.addEventListener('click', () => {
      if(el.dataset.locked === 'true') { toast('Complete the previous step first.', 'error'); return; }
      const key = el.dataset.task;
      if(key === 'questions'){
        toast('Questions require the timed practice — use Start.', 'info');
        return;
      }
      toggleTask(key);
    });
  });
  document.querySelectorAll('[data-start-timer]').forEach(btn => {
    btn.addEventListener('click', () => {
      if(btn.disabled) return;
      openTimedQuestion(activeChapterId);
    });
  });
}

function toggleTask(key){
  Store.update(state => {
    const p = ensureChapterProgress(state, activeChapterId);
    p[key] = !p[key];
  });
  logStudySession(0.25, activeChapterId); // small credit for checklist interaction / streak tracking
  checkAchievements();
  renderDrawer();
  if(currentView) renderView(currentView);
}

/* ------------------------------------------------------------
   TIMED QUESTION ENGINE
   ------------------------------------------------------------ */
function openTimedQuestion(chapterId){
  const ch = getChapter(chapterId);
  const limit = TIMER_DURATIONS[ch.difficulty] || 900;
  timerState = { remaining: limit, limit, chapterId };

  document.getElementById('timerModalOverlay').classList.add('open');
  renderTimerModal();

  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timerState.remaining -= 1;
    if(timerState.remaining <= 0){
      clearInterval(timerInterval);
      timerState.remaining = 0;
      finishTimedQuestion(false);
    }
    updateTimerDisplay();
  }, 1000);
}

function renderTimerModal(){
  const ch = getChapter(timerState.chapterId);
  const modal = document.getElementById('timerModal');
  modal.innerHTML = `
    <div class="onboard-eyebrow">Timed Practice · ${ch.difficulty}</div>
    <h3 style="font-size:18px;margin:6px 0 4px">${ch.name}</h3>
    <p style="font-size:12.5px;color:var(--text-dim);margin-bottom:6px">Solve one ICAI-level question on this chapter within the time limit. Work it out on paper, then mark it Solved.</p>
    <div class="timer-ring-wrap">
      <svg class="timer-ring" viewBox="0 0 180 180">
        <circle class="timer-ring-track" cx="90" cy="90" r="80"/>
        <circle class="timer-ring-fill" id="timerRingFill" cx="90" cy="90" r="80"/>
      </svg>
      <div class="timer-center">
        <div class="timer-time" id="timerTimeText">--:--</div>
        <div class="timer-label">remaining</div>
      </div>
    </div>
    <div class="timer-actions">
      <button class="btn btn-secondary" id="timerAbandon">Abandon</button>
      <button class="btn btn-primary" id="timerSolved">I've Solved It</button>
    </div>
  `;
  document.getElementById('timerAbandon').addEventListener('click', () => {
    clearInterval(timerInterval);
    document.getElementById('timerModalOverlay').classList.remove('open');
    toast('Practice abandoned — progress unchanged.', 'info');
  });
  document.getElementById('timerSolved').addEventListener('click', () => finishTimedQuestion(true));
  updateTimerDisplay();
}

function updateTimerDisplay(){
  const { remaining, limit } = timerState;
  const mm = String(Math.floor(remaining/60)).padStart(2,'0');
  const ss = String(remaining%60).padStart(2,'0');
  const timeText = document.getElementById('timerTimeText');
  if(timeText) timeText.textContent = `${mm}:${ss}`;

  const circumference = 2 * Math.PI * 80;
  const pct = remaining / limit;
  const ring = document.getElementById('timerRingFill');
  if(ring){
    ring.style.strokeDasharray = circumference;
    ring.style.strokeDashoffset = circumference * (1 - pct);
    ring.classList.toggle('danger', pct < 0.2);
  }
}

function finishTimedQuestion(success){
  clearInterval(timerInterval);
  const { chapterId, limit, remaining } = timerState;
  const timeTakenSec = limit - remaining;

  Store.update(state => {
    if(!state.timedQuestions[chapterId]) state.timedQuestions[chapterId] = { attempts: [] };
    state.timedQuestions[chapterId].attempts.push({ date: todayISO(), success, timeTakenSec, limitSec: limit });
    if(success){
      const p = ensureChapterProgress(state, chapterId);
      p.questions = true;
    }
  });

  document.getElementById('timerModalOverlay').classList.remove('open');

  if(success){
    toast('Question solved in time — Questions progress unlocked.', 'success');
    logStudySession(Math.round((timeTakenSec/3600)*10)/10 || 0.1, chapterId);
    checkAchievements();
  } else {
    toast("Time's up — attempt logged. Try again to unlock Questions progress.", 'error');
  }

  if(activeChapterId === chapterId) renderDrawer();
  if(currentView) renderView(currentView);
}

function checkAchievements(){
  const s = Store.get();
  let unlockedNew = [];
  ACHIEVEMENTS.forEach(a => {
    if(!s.achievementsUnlocked[a.id] && a.check(s)){
      unlockedNew.push(a);
    }
  });
  if(unlockedNew.length){
    Store.update(state => {
      unlockedNew.forEach(a => { state.achievementsUnlocked[a.id] = todayISO(); });
    });
    unlockedNew.forEach(a => toast(`Achievement unlocked: ${a.name}`, 'success'));
  }
}
