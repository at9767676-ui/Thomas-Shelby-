/**
 * PLANNER MODULE — the "Smart Engine"
 *
 * Responsibilities:
 *  1. Compute remaining days to exam.
 *  2. Compute total estimated hours needed across selected, non-skipped chapters
 *     (weighted up for low confidence / high difficulty, weighted down for
 *     chapters already marked "Already Completed").
 *  3. Distribute that workload across the remaining calendar days, respecting
 *     the student's daily study-hour budget, front-loading weak chapters.
 *  4. Roll the daily plan up into weekly and monthly views.
 *  5. Adaptive engine: after a mock score is recorded, compare predicted vs
 *     actual performance and adjust confidence / revision frequency / hours.
 */

const Planner = (function(){

  function remainingDays(){
    const s = Store.get();
    if(!s.examDate) return 0;
    const d = daysBetween(todayISO(), s.examDate);
    return Math.max(d, 0);
  }

  /** Confidence multiplier: weaker confidence => more hours allocated. */
  function confidenceMultiplier(conf){
    // conf 1 (very weak) -> 1.5x, conf 5 (very strong) -> 0.7x
    const map = { 1: 1.5, 2: 1.25, 3: 1.0, 4: 0.85, 5: 0.7 };
    return map[conf] || 1.0;
  }

  function difficultyMultiplier(diff){
    return diff === 'hard' ? 1.15 : diff === 'medium' ? 1.0 : 0.9;
  }

  /** Chapters the student actually needs to work on (excludes skip). */
  function activeChapters(){
    const s = Store.get();
    const out = [];
    s.subjectsSelected.forEach(subId => {
      const sub = getSubject(subId);
      if(!sub) return;
      sub.chapters.forEach(ch => {
        const status = s.chapterStatus[ch.id] || 'to_study';
        if(status === 'skip') return;
        out.push({ ...ch, subjectId: sub.id, subjectColor: sub.color, subjectName: sub.name, status });
      });
    });
    return out;
  }

  /**
   * Effective remaining hours needed for a chapter: base hours minus progress
   * already made, scaled by confidence + difficulty + adaptive boosts.
   */
  function effectiveHoursForChapter(ch){
    const s = Store.get();
    const status = s.chapterStatus[ch.id] || 'to_study';
    const conf = s.confidence[ch.id] || 3;
    const pctDone = chapterProgressPct(ch.id) / 100;

    let base = ch.hours;
    if(status === 'completed'){
      // Already completed chapters mainly need revision + mock time, not fresh theory.
      base = ch.hours * 0.35;
    }

    let remaining = base * (1 - pctDone);
    remaining *= confidenceMultiplier(conf);
    remaining *= difficultyMultiplier(ch.difficulty);

    const boost = s.adaptiveFlags[ch.id];
    if(boost) remaining *= (1 + (boost.hoursBoost || 0));

    return Math.max(remaining, 0);
  }

  /** Priority score: higher = studied sooner. Weak + hard + low progress rises to the top. */
  function priorityScore(ch){
    const s = Store.get();
    const conf = s.confidence[ch.id] || 3;
    const pctDone = chapterProgressPct(ch.id) / 100;
    const diffScore = ch.difficulty === 'hard' ? 3 : ch.difficulty === 'medium' ? 2 : 1;
    const confScore = 6 - conf; // weaker confidence -> higher score
    const boost = s.adaptiveFlags[ch.id]?.revisionBoost || 0;
    return (confScore * 2) + diffScore + (1 - pctDone) * 3 + boost * 4;
  }

  /**
   * Generates the full plan: assigns chapter-hours to each remaining day
   * in priority order, filling each day up to the daily study-hour budget.
   * Returns { daily: [{date, items:[{chapterId, subjectId, hours, taskType}], totalHours}], weekly, monthly }
   */
  function generatePlan(){
    const s = Store.get();
    const days = remainingDays();
    const dailyBudget = s.studyHours.daily || 4;

    if(days <= 0 || !s.examDate){
      return { generatedAt: Date.now(), daily: [], weekly: [], monthly: [] };
    }

    const chapters = activeChapters()
      .map(ch => ({ ch, need: effectiveHoursForChapter(ch), score: priorityScore(ch) }))
      .filter(x => x.need > 0.05)
      .sort((a,b) => b.score - a.score);

    // Build a queue of {chapterId, subjectId, hoursLeft, taskType} chunks in ~1.5h blocks.
    const CHUNK = 1.5;
    const queue = [];
    chapters.forEach(({ch, need}) => {
      let left = need;
      const taskType = taskTypeForChapter(ch.id);
      while(left > 0){
        const chunk = Math.min(CHUNK, left);
        queue.push({ chapterId: ch.id, subjectId: ch.subjectId, subjectColor: ch.subjectColor,
                      chapterName: ch.name, hours: Math.round(chunk*10)/10, taskType });
        left -= chunk;
      }
    });

    const daily = [];
    let qi = 0;
    for(let d = 0; d < days && qi < queue.length; d++){
      const date = addDays(todayISO(), d);
      let budgetLeft = dailyBudget;
      const items = [];
      while(budgetLeft > 0.1 && qi < queue.length){
        const item = queue[qi];
        const take = Math.min(item.hours, budgetLeft);
        items.push({ ...item, hours: Math.round(take*10)/10 });
        item.hours -= take;
        budgetLeft -= take;
        if(item.hours <= 0.05) qi++;
      }
      if(items.length){
        daily.push({ date, items, totalHours: Math.round(items.reduce((a,b)=>a+b.hours,0)*10)/10 });
      }
    }

    const weekly = groupIntoWeeks(daily);
    const monthly = groupIntoMonths(daily);

    const plan = { generatedAt: Date.now(), daily, weekly, monthly };
    Store.update(state => { state.plan = plan; });
    return plan;
  }

  function taskTypeForChapter(chapterId){
    const s = Store.get();
    const p = s.chapterProgress[chapterId];
    if(!p || !p.theory) return 'theory';
    if(!p.questions) return 'practice';
    if(!p.pyq) return 'pyq';
    if(!p.revision1 || !p.revision2 || !p.revision3) return 'revision';
    if(!p.mock) return 'mock';
    return 'revision';
  }

  function addDays(iso, n){
    const d = new Date(iso + 'T00:00:00');
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0,10);
  }

  function groupIntoWeeks(daily){
    const weeks = [];
    for(let i=0; i<daily.length; i+=7){
      const chunk = daily.slice(i, i+7);
      weeks.push({
        label: `Week ${weeks.length+1}`,
        days: chunk,
        totalHours: Math.round(chunk.reduce((a,b)=>a+b.totalHours,0)*10)/10
      });
    }
    return weeks;
  }

  function groupIntoMonths(daily){
    const map = {};
    daily.forEach(d => {
      const key = d.date.slice(0,7); // YYYY-MM
      if(!map[key]) map[key] = [];
      map[key].push(d);
    });
    return Object.keys(map).sort().map(key => ({
      label: new Date(key+'-01').toLocaleDateString('en-IN', {month:'long', year:'numeric'}),
      key,
      days: map[key],
      totalHours: Math.round(map[key].reduce((a,b)=>a+b.totalHours,0)*10)/10
    }));
  }

  function getOrGeneratePlan(){
    const s = Store.get();
    // Regenerate if missing or stale (>12h old) or exam date changed since generation.
    if(!s.plan || Date.now() - s.plan.generatedAt > 12*3600*1000){
      return generatePlan();
    }
    return s.plan;
  }

  function todaysPlan(){
    const plan = getOrGeneratePlan();
    return plan.daily.find(d => d.date === todayISO()) || { date: todayISO(), items: [], totalHours: 0 };
  }

  /* -----------------------------------------------------------
     ADAPTIVE ENGINE
     After a mock score is logged for a subject, compare the
     confidence-implied expected score against the actual score.
     If actual is meaningfully below expected, downgrade confidence
     on that subject's weaker chapters, flag more revision, and
     bump the hours multiplier — then regenerate the plan.
     ----------------------------------------------------------- */
  function expectedPctFromConfidence(subjectId){
    const s = Store.get();
    const sub = getSubject(subjectId);
    if(!sub) return 70;
    const relevant = sub.chapters.filter(ch => (s.chapterStatus[ch.id] || 'to_study') !== 'skip');
    if(!relevant.length) return 70;
    const avgConf = relevant.reduce((a,ch) => a + (s.confidence[ch.id] || 3), 0) / relevant.length;
    // Map avg confidence (1-5) to an expected percentage band (40-90).
    return Math.round(40 + (avgConf - 1) * 12.5);
  }

  function recordMockScore(subjectId, actualPct){
    const expectedPct = expectedPctFromConfidence(subjectId);
    Store.update(state => {
      state.mockScores.push({ subjectId, expectedPct, actualPct, date: todayISO() });
    });

    const gap = expectedPct - actualPct;
    let adjusted = false;
    if(gap >= 15){
      // Confidence was overstated. Downgrade + boost revision & hours for this subject's chapters.
      Store.update(state => {
        const sub = getSubject(subjectId);
        sub.chapters.forEach(ch => {
          if((state.chapterStatus[ch.id] || 'to_study') === 'skip') return;
          const cur = state.confidence[ch.id] || 3;
          state.confidence[ch.id] = Math.max(1, cur - 1);
          const flag = state.adaptiveFlags[ch.id] || { revisionBoost: 0, hoursBoost: 0 };
          flag.revisionBoost = Math.min(2, flag.revisionBoost + 1);
          flag.hoursBoost = Math.min(0.6, flag.hoursBoost + 0.2);
          state.adaptiveFlags[ch.id] = flag;
        });
      });
      generatePlan();
      adjusted = true;
    }
    return { expectedPct, actualPct, gap, adjusted };
  }

  return {
    remainingDays, activeChapters, effectiveHoursForChapter, generatePlan,
    getOrGeneratePlan, todaysPlan, recordMockScore, expectedPctFromConfidence,
    taskTypeForChapter, addDays
  };
})();
