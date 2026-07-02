/**
 * ONBOARDING WIZARD
 * Steps: 1) Attempt  2) Subjects  3..N) per-subject chapter status + confidence
 * N+1) Study hours & availability. Writes directly into a draft object, then
 * commits to Store only when the student finishes ("Generate My Plan").
 */

const ATTEMPTS = [
  { id: 'sep', label: 'September', date: nextAttemptDate('sep') },
  { id: 'jan', label: 'January', date: nextAttemptDate('jan') },
  { id: 'may', label: 'May', date: nextAttemptDate('may') },
];

function nextAttemptDate(which){
  const now = new Date();
  const year = now.getFullYear();
  const map = { sep: [8, 15], jan: [0, 10], may: [4, 5] }; // month(0-idx), day — ICAI exams typically start these windows
  let [m, d] = map[which];
  let y = year;
  let candidate = new Date(y, m, d);
  if(candidate < now) y += 1;
  return new Date(y, m, d).toISOString().slice(0,10);
}

let draft = null;
let stepIdx = 0;
let steps = [];

function startOnboarding(){
  draft = {
    attempt: null, examDate: null, groups: [], subjectsSelected: [],
    chapterStatus: {}, confidence: {}, studyHours: { daily: 4, slots: { morning:true, afternoon:false, evening:true } }
  };
  stepIdx = 0;
  document.getElementById('onboarding').classList.remove('hidden');
  document.getElementById('app').classList.add('hidden');
  rebuildSteps();
  renderOnboardStep();
}

function rebuildSteps(){
  steps = ['attempt', 'subjects'];
  draft.subjectsSelected.forEach(subId => steps.push('chapters:' + subId));
  steps.push('hours');
}

function goStep(delta){
  const next = stepIdx + delta;
  if(next < 0 || next >= steps.length) return;
  stepIdx = next;
  renderOnboardStep();
}

function renderOnboardStep(){
  const container = document.getElementById('onboardSteps');
  const fill = document.getElementById('onboardProgressFill');
  fill.style.width = `${((stepIdx+1)/steps.length)*100}%`;

  const stepKey = steps[stepIdx];
  let html = '';
  if(stepKey === 'attempt') html = stepAttempt();
  else if(stepKey === 'subjects') html = stepSubjects();
  else if(stepKey.startsWith('chapters:')) html = stepChapters(stepKey.split(':')[1]);
  else if(stepKey === 'hours') html = stepHours();

  container.innerHTML = html;
  wireStepEvents(stepKey);
}

/* ---------------- STEP 1: Attempt ---------------- */
function stepAttempt(){
  return `
  <div class="onboard-step">
    <div class="onboard-eyebrow">Step 1 of ${steps.length}</div>
    <h2 class="onboard-title">When are you appearing?</h2>
    <p class="onboard-desc">Your exam attempt sets the countdown the whole planner is built around.</p>
    <div class="option-grid">
      ${ATTEMPTS.map(a => `
        <div class="option-card ${draft.attempt===a.id?'selected':''}" data-attempt="${a.id}">
          <div class="oc-title">${a.label}</div>
          <div class="oc-sub">${new Date(a.date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</div>
        </div>`).join('')}
    </div>
    ${onboardActions(false)}
  </div>`;
}

/* ---------------- STEP 2: Subjects ---------------- */
function stepSubjects(){
  const activeGroup = draft.groups.length === 1 ? draft.groups[0] : (draft.groups.length===2 ? 'both' : 1);
  return `
  <div class="onboard-step">
    <div class="onboard-eyebrow">Step 2 of ${steps.length}</div>
    <h2 class="onboard-title">Which subjects are you preparing?</h2>
    <p class="onboard-desc">Select one group or both — every chapter inside will be added to your planner.</p>
    <div class="group-toggle">
      <button data-group="1" class="${draft.groups.includes(1)&&draft.groups.length===1?'active':''}">Group 1 only</button>
      <button data-group="2" class="${draft.groups.includes(2)&&draft.groups.length===1?'active':''}">Group 2 only</button>
      <button data-group="both" class="${draft.groups.length===2?'active':''}">Both Groups</button>
    </div>
    <div class="subject-pick-grid">
      ${SUBJECTS.map(s => `
        <div class="subject-pick ${draft.subjectsSelected.includes(s.id)?'selected':''}" style="--sub-color:${s.color}" data-subject="${s.id}">
          <div class="sp-dot"></div>
          <div>
            <div class="sp-name">${s.name}</div>
            <div class="sp-meta">Group ${s.group} · ${s.chapters.length} chapters · ${s.chapters.reduce((a,c)=>a+c.hours,0)}h</div>
          </div>
        </div>`).join('')}
    </div>
    ${onboardActions(draft.subjectsSelected.length===0)}
  </div>`;
}

/* ---------------- STEP 3..N: Chapters + Confidence per subject ---------------- */
function stepChapters(subjectId){
  const sub = getSubject(subjectId);
  return `
  <div class="onboard-step">
    <div class="onboard-eyebrow">Step ${stepIdx+1} of ${steps.length} · ${sub.name}</div>
    <h2 class="onboard-title">Mark each chapter</h2>
    <p class="onboard-desc">Set status and confidence for every chapter. Skipped chapters won't appear in your plan.</p>
    <div class="chapter-select-list">
      ${sub.chapters.map(ch => {
        const status = draft.chapterStatus[ch.id] || 'to_study';
        const conf = draft.confidence[ch.id] || 3;
        const skipped = status === 'skip';
        return `
        <div class="chapter-select-row" data-chrow="${ch.id}">
          <div style="flex:1">
            <div class="cs-name">${ch.name}</div>
            <div class="cs-hours">${ch.hours}h · ${ch.difficulty}</div>
          </div>
          <div class="status-toggle" data-status-for="${ch.id}">
            <button class="on-completed ${status==='completed'?'active':''}" data-status="completed" title="Already Completed">✓</button>
            <button class="on-study ${status==='to_study'?'active':''}" data-status="to_study" title="To Study">S</button>
            <button class="on-skip ${status==='skip'?'active':''}" data-status="skip" title="Skip">⨯</button>
          </div>
          <div class="stars ${skipped?'hidden':''}" data-stars-for="${ch.id}">
            ${[1,2,3,4,5].map(n => `<svg data-star="${n}" class="${n<=conf?'filled':''}" viewBox="0 0 24 24">${ICONS.star}</svg>`).join('')}
          </div>
        </div>`;
      }).join('')}
    </div>
    ${onboardActions(false)}
  </div>`;
}

/* ---------------- Final Step: Hours ---------------- */
function stepHours(){
  const d = draft.studyHours;
  return `
  <div class="onboard-step">
    <div class="onboard-eyebrow">Step ${stepIdx+1} of ${steps.length}</div>
    <h2 class="onboard-title">Daily study capacity</h2>
    <p class="onboard-desc">This sets the daily budget the Smart Engine schedules against.</p>
    <div class="hours-input-row">
      <input type="range" min="1" max="12" step="0.5" id="dailyHoursRange" value="${d.daily}">
      <div class="hours-display"><span id="dailyHoursValue">${d.daily}</span>h</div>
    </div>
    <p class="onboard-desc">When are you usually free to study?</p>
    <div class="slot-grid">
      ${['morning','afternoon','evening'].map(slot => `
        <div class="option-card ${d.slots[slot]?'selected':''}" data-slot="${slot}">
          <div class="oc-title" style="text-transform:capitalize">${slot}</div>
          <div class="oc-sub">${slot==='morning'?'6–11 AM':slot==='afternoon'?'12–5 PM':'6–11 PM'}</div>
        </div>`).join('')}
    </div>
    ${onboardActions(false, true)}
  </div>`;
}

function onboardActions(nextDisabled, isFinal=false){
  return `
  <div class="onboard-actions">
    <button class="btn btn-ghost" id="obBack" ${stepIdx===0?'disabled':''}>Back</button>
    <span class="step-indicator">${stepIdx+1} / ${steps.length}</span>
    <button class="btn btn-primary" id="obNext" ${nextDisabled?'disabled':''}>${isFinal ? 'Generate My Plan' : 'Continue'}</button>
  </div>`;
}

function wireStepEvents(stepKey){
  const back = document.getElementById('obBack');
  const next = document.getElementById('obNext');
  if(back) back.addEventListener('click', () => goStep(-1));

  if(stepKey === 'attempt'){
    document.querySelectorAll('[data-attempt]').forEach(el => {
      el.addEventListener('click', () => {
        draft.attempt = el.dataset.attempt;
        draft.examDate = ATTEMPTS.find(a=>a.id===draft.attempt).date;
        renderOnboardStep();
      });
    });
    if(next) next.disabled = !draft.attempt;
    if(next) next.addEventListener('click', () => goStep(1));
  }

  else if(stepKey === 'subjects'){
    document.querySelectorAll('.group-toggle button').forEach(btn => {
      btn.addEventListener('click', () => {
        const g = btn.dataset.group;
        if(g === 'both') draft.groups = [1,2];
        else draft.groups = [parseInt(g)];
        // auto-select all subjects in chosen groups
        draft.subjectsSelected = SUBJECTS.filter(s => draft.groups.includes(s.group)).map(s=>s.id);
        rebuildSteps();
        renderOnboardStep();
      });
    });
    document.querySelectorAll('[data-subject]').forEach(el => {
      el.addEventListener('click', () => {
        const id = el.dataset.subject;
        const i = draft.subjectsSelected.indexOf(id);
        if(i>-1) draft.subjectsSelected.splice(i,1); else draft.subjectsSelected.push(id);
        rebuildSteps();
        renderOnboardStep();
      });
    });
    next.addEventListener('click', () => goStep(1));
  }

  else if(stepKey.startsWith('chapters:')){
    document.querySelectorAll('.status-toggle button').forEach(btn => {
      btn.addEventListener('click', () => {
        const chId = btn.parentElement.dataset.statusFor;
        draft.chapterStatus[chId] = btn.dataset.status;
        renderOnboardStep();
      });
    });
    document.querySelectorAll('.stars').forEach(starsEl => {
      starsEl.addEventListener('click', (e) => {
        const starEl = e.target.closest('[data-star]');
        if(!starEl) return;
        const chId = starsEl.dataset.starsFor;
        draft.confidence[chId] = parseInt(starEl.dataset.star);
        renderOnboardStep();
      });
    });
    next.addEventListener('click', () => goStep(1));
  }

  else if(stepKey === 'hours'){
    const range = document.getElementById('dailyHoursRange');
    range.addEventListener('input', () => {
      draft.studyHours.daily = parseFloat(range.value);
      document.getElementById('dailyHoursValue').textContent = draft.studyHours.daily;
    });
    document.querySelectorAll('[data-slot]').forEach(el => {
      el.addEventListener('click', () => {
        const slot = el.dataset.slot;
        draft.studyHours.slots[slot] = !draft.studyHours.slots[slot];
        renderOnboardStep();
      });
    });
    next.addEventListener('click', finishOnboarding);
  }
}

function finishOnboarding(){
  Store.update(state => {
    state.attempt = ATTEMPTS.find(a=>a.id===draft.attempt).label;
    state.examDate = draft.examDate;
    state.groups = draft.groups;
    state.subjectsSelected = draft.subjectsSelected;
    state.chapterStatus = draft.chapterStatus;
    state.confidence = draft.confidence;
    state.studyHours = draft.studyHours;
    state.setupComplete = true;
    state.setupCompleteDate = todayISO();
    // Seed chapterProgress records
    draft.subjectsSelected.forEach(subId => {
      getSubject(subId).chapters.forEach(ch => {
        ensureChapterProgress(state, ch.id);
        if(draft.chapterStatus[ch.id] === 'completed'){
          // Already-completed chapters start with theory/questions/pyq credited; revision & mock still pending.
          state.chapterProgress[ch.id].theory = true;
          state.chapterProgress[ch.id].questions = true;
          state.chapterProgress[ch.id].pyq = true;
        }
      });
    });
  });
  Planner.generatePlan();
  showApp();
  navigateTo('dashboard');
  toast('Your personalized plan is ready.', 'success');
}
