/**
 * ANALYTICS MODULE
 * Lightweight canvas chart renderers — no external chart library, so the
 * planner works fully offline. Each function draws into a given <canvas>.
 */

const Analytics = (function(){

  function cssVar(name){
    return getComputedStyle(document.body).getPropertyValue(name).trim();
  }

  function setupCanvas(canvas){
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    return { ctx, w: rect.width, h: rect.height };
  }

  /** Last N days of study hours, from hoursLog. */
  function hoursByDay(n=14){
    const s = Store.get();
    const map = {};
    s.hoursLog.forEach(e => { map[e.date] = (map[e.date]||0) + e.hours; });
    const out = [];
    for(let i = n-1; i >= 0; i--){
      const date = Planner.addDays(todayISO(), -i);
      out.push({ date, hours: Math.round((map[date]||0)*10)/10 });
    }
    return out;
  }

  function drawBarChart(canvas, data){
    const { ctx, w, h } = setupCanvas(canvas);
    ctx.clearRect(0,0,w,h);
    const max = Math.max(1, ...data.map(d => d.hours));
    const padL = 6, padB = 22, padT = 10;
    const chartW = w - padL*2, chartH = h - padB - padT;
    const barW = chartW / data.length * 0.55;
    const gap = chartW / data.length;
    const amber = cssVar('--amber') || '#E8A33D';
    const dim = cssVar('--text-faint') || '#6B7080';

    data.forEach((d, i) => {
      const x = padL + i*gap + (gap - barW)/2;
      const barH = (d.hours / max) * chartH;
      const y = padT + chartH - barH;
      const grad = ctx.createLinearGradient(0, y, 0, y+barH);
      grad.addColorStop(0, amber);
      grad.addColorStop(1, 'rgba(232,163,61,0.35)');
      ctx.fillStyle = d.hours > 0 ? grad : 'rgba(255,255,255,0.06)';
      roundRect(ctx, x, y, barW, Math.max(barH,2), 3);
      ctx.fill();

      ctx.fillStyle = dim;
      ctx.font = '9px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      const label = new Date(d.date+'T00:00:00').toLocaleDateString('en-IN',{day:'2-digit'});
      ctx.fillText(label, x + barW/2, h - 6);
    });
  }

  function roundRect(ctx, x, y, w, h, r){
    ctx.beginPath();
    ctx.moveTo(x+r, y);
    ctx.arcTo(x+w, y, x+w, y+h, r);
    ctx.arcTo(x+w, y+h, x, y+h, r);
    ctx.arcTo(x, y+h, x, y, r);
    ctx.arcTo(x, y, x+w, y, r);
    ctx.closePath();
  }

  function drawDonut(canvas, pct, color){
    const { ctx, w, h } = setupCanvas(canvas);
    ctx.clearRect(0,0,w,h);
    const cx = w/2, cy = h/2, r = Math.min(w,h)/2 - 8;
    const track = cssVar('--surface-2') || '#171A23';
    ctx.lineWidth = 10;
    ctx.strokeStyle = track;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.stroke();

    ctx.strokeStyle = color || cssVar('--amber');
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(cx, cy, r, -Math.PI/2, -Math.PI/2 + (pct/100)*Math.PI*2);
    ctx.stroke();

    ctx.fillStyle = cssVar('--text') || '#EDEEF3';
    ctx.font = '700 18px JetBrains Mono, monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(pct + '%', cx, cy);
  }

  function drawLineChart(canvas, points, color){
    const { ctx, w, h } = setupCanvas(canvas);
    ctx.clearRect(0,0,w,h);
    if(!points.length){
      ctx.fillStyle = cssVar('--text-faint');
      ctx.font = '11px Inter'; ctx.textAlign = 'center';
      ctx.fillText('No mock scores logged yet', w/2, h/2);
      return;
    }
    const padL = 26, padB = 20, padT = 12, padR = 10;
    const chartW = w - padL - padR, chartH = h - padB - padT;
    const max = 100, min = 0;

    // gridlines
    ctx.strokeStyle = cssVar('--border-soft');
    ctx.lineWidth = 1;
    [0,25,50,75,100].forEach(v => {
      const y = padT + chartH - (v/100)*chartH;
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(w-padR, y); ctx.stroke();
      ctx.fillStyle = cssVar('--text-faint'); ctx.font = '8px JetBrains Mono, monospace'; ctx.textAlign='right';
      ctx.fillText(v, padL-4, y+3);
    });

    const stepX = points.length > 1 ? chartW / (points.length - 1) : 0;
    ctx.beginPath();
    points.forEach((p, i) => {
      const x = padL + i*stepX;
      const y = padT + chartH - ((p.value-min)/(max-min))*chartH;
      if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    });
    ctx.strokeStyle = color || cssVar('--amber');
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.stroke();

    points.forEach((p, i) => {
      const x = padL + i*stepX;
      const y = padT + chartH - ((p.value-min)/(max-min))*chartH;
      ctx.beginPath(); ctx.arc(x,y,3.5,0,Math.PI*2);
      ctx.fillStyle = color || cssVar('--amber'); ctx.fill();
    });
  }

  /** Heatmap of study hours over last ~182 days, GitHub-contribution style. */
  function studyHeatmap(){
    const s = Store.get();
    const map = {};
    s.hoursLog.forEach(e => { map[e.date] = (map[e.date]||0) + e.hours; });
    const days = [];
    for(let i = 181; i >= 0; i--){
      const date = Planner.addDays(todayISO(), -i);
      days.push({ date, hours: map[date] || 0 });
    }
    return days;
  }

  function heatColor(hours){
    if(hours <= 0) return 'var(--surface-2)';
    if(hours < 1.5) return 'rgba(232,163,61,0.25)';
    if(hours < 3) return 'rgba(232,163,61,0.5)';
    if(hours < 5) return 'rgba(232,163,61,0.75)';
    return 'var(--amber)';
  }

  function questionAccuracy(){
    const s = Store.get();
    let attempts = 0, success = 0;
    Object.values(s.timedQuestions).forEach(rec => {
      (rec.attempts||[]).forEach(a => { attempts++; if(a.success) success++; });
    });
    return attempts ? Math.round((success/attempts)*100) : 0;
  }

  function subjectWiseProgress(){
    const s = Store.get();
    return s.subjectsSelected.map(id => {
      const sub = getSubject(id);
      const relevant = sub.chapters.filter(ch => (s.chapterStatus[ch.id]||'to_study') !== 'skip');
      const avg = relevant.length
        ? Math.round(relevant.reduce((a,ch)=>a+chapterProgressPct(ch.id),0)/relevant.length)
        : 0;
      return { id, name: sub.name, color: sub.color, pct: avg };
    });
  }

  function weakStrongChapters(){
    const s = Store.get();
    const chapters = Planner.activeChapters();
    const weak = [], strong = [];
    chapters.forEach(ch => {
      const conf = s.confidence[ch.id] || 3;
      const band = confidenceBand(conf);
      if(band === 'weak') weak.push(ch);
      if(band === 'strong') strong.push(ch);
    });
    return { weak, strong };
  }

  return {
    hoursByDay, drawBarChart, drawDonut, drawLineChart,
    studyHeatmap, heatColor, questionAccuracy, subjectWiseProgress, weakStrongChapters
  };
})();
