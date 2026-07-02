/**
 * STORAGE MODULE
 * Single source of truth for all app state, persisted to localStorage.
 * Nothing else in the app touches localStorage directly — everything
 * goes through Store.get()/Store.set()/Store.update().
 */

const STORAGE_KEY = 'ca_inter_planner_state_v1';

function defaultState(){
  return {
    version: 1,
    setupComplete: false,
    setupCompleteDate: null,
    theme: 'dark',
    sidebarCollapsed: false,

    attempt: null,          // 'September 2026' | 'January 2027' | 'May 2027'
    examDate: null,         // ISO date string
    groups: [],              // [1] | [2] | [1,2]
    subjectsSelected: [],    // subject ids

    chapterStatus: {},       // chapterId -> 'completed' | 'to_study' | 'skip'
    confidence: {},          // chapterId -> 1..5

    studyHours: { daily: 4, slots: { morning: true, afternoon: false, evening: true } },

    // chapterId -> { theory, questions, pyq, revision1, revision2, revision3, mock }
    chapterProgress: {},

    // chapterId -> { attempts: [{date, success, timeTakenSec, limitSec}] }
    timedQuestions: {},

    // { subjectId: { predictedPct, actualPct, date } }
    mockScores: [],

    streak: { current: 0, longest: 0, lastStudyDate: null },

    hoursLog: [],             // [{date, hours, chapterId, subjectId}]

    vault: [],                // [{id, name, type, subjectId, dateAdded, sizeKB, dataUrl?}]

    achievementsUnlocked: {}, // id -> ISO date

    adaptiveFlags: {},        // chapterId -> { revisionBoost: n, hoursBoost: n }

    plan: null,               // cached generated plan { generatedAt, daily:[], weekly:[], monthly:[] }
  };
}

const Store = (function(){
  let state = load();

  function load(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      if(!raw) return defaultState();
      const parsed = JSON.parse(raw);
      // Merge with defaults so new fields introduced later don't break old saves.
      return Object.assign(defaultState(), parsed);
    }catch(e){
      console.warn('Storage load failed, resetting to defaults.', e);
      return defaultState();
    }
  }

  function persist(){
    try{
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }catch(e){
      console.error('Storage persist failed', e);
    }
  }

  return {
    get(){ return state; },
    set(newState){ state = newState; persist(); },
    update(mutatorFn){
      // mutatorFn receives a draft (the real object) and mutates it directly.
      mutatorFn(state);
      persist();
    },
    reset(){
      state = defaultState();
      persist();
    },
    exportJSON(){
      return JSON.stringify(state, null, 2);
    },
    importJSON(json){
      try{
        const parsed = JSON.parse(json);
        state = Object.assign(defaultState(), parsed);
        persist();
        return true;
      }catch(e){
        console.error('Import failed', e);
        return false;
      }
    },
    backupToLocal(){
      // "Backup" = snapshot saved under a separate key, distinct from live state.
      localStorage.setItem(STORAGE_KEY + '_backup', JSON.stringify(state));
    },
    restoreFromBackup(){
      const raw = localStorage.getItem(STORAGE_KEY + '_backup');
      if(!raw) return false;
      state = Object.assign(defaultState(), JSON.parse(raw));
      persist();
      return true;
    }
  };
})();

/* ---------------------------------------------------------
   Derived helpers used across modules
   --------------------------------------------------------- */

function todayISO(){
  return new Date().toISOString().slice(0,10);
}

function daysBetween(isoA, isoB){
  const a = new Date(isoA + 'T00:00:00');
  const b = new Date(isoB + 'T00:00:00');
  return Math.round((b - a) / 86400000);
}

/** Progress % for a single chapter using the fixed 20/20/20/20/20 formula. */
function chapterProgressPct(chapterId){
  const s = Store.get();
  const p = s.chapterProgress[chapterId];
  if(!p) return 0;
  let pct = 0;
  if(p.theory) pct += TASK_WEIGHTS.theory;
  if(p.questions) pct += TASK_WEIGHTS.questions;
  if(p.pyq) pct += TASK_WEIGHTS.pyq;
  if(p.revision1) pct += REVISION_SUB_WEIGHT;
  if(p.revision2) pct += REVISION_SUB_WEIGHT;
  if(p.revision3) pct += REVISION_SUB_WEIGHT;
  if(p.mock) pct += TASK_WEIGHTS.mock;
  return Math.round(pct);
}

function confidenceLabel(n){
  return ({1:'Very Weak',2:'Weak',3:'Average',4:'Strong',5:'Very Strong'})[n] || 'Not Set';
}

function confidenceBand(n){
  if(n <= 2) return 'weak';
  if(n === 3) return 'medium';
  return 'strong';
}

/** Ensures a chapterProgress record exists for a chapter, returns it. */
function ensureChapterProgress(state, chapterId){
  if(!state.chapterProgress[chapterId]){
    state.chapterProgress[chapterId] = {
      theory:false, questions:false, pyq:false,
      revision1:false, revision2:false, revision3:false, mock:false
    };
  }
  return state.chapterProgress[chapterId];
}

/** Logs a study session and updates the streak. */
function logStudySession(hours, chapterId){
  Store.update(state => {
    const subjectId = getSubjectOfChapter(chapterId)?.id || null;
    state.hoursLog.push({ date: todayISO(), hours, chapterId, subjectId });

    const today = todayISO();
    if(state.streak.lastStudyDate !== today){
      const gap = state.streak.lastStudyDate ? daysBetween(state.streak.lastStudyDate, today) : null;
      if(gap === 1){
        state.streak.current += 1;
      } else if(gap === null){
        state.streak.current = 1;
      } else if(gap > 1){
        state.streak.current = 1;
      }
      state.streak.longest = Math.max(state.streak.longest, state.streak.current);
      state.streak.lastStudyDate = today;
    }
  });
}
