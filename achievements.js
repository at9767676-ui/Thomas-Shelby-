/**
 * Achievement catalogue. `check(state)` returns true once the condition is met.
 * Kept pure/side-effect-free so it can be evaluated any time state changes.
 */

const ACHIEVEMENTS = [
  {
    id: 'streak-7', name: '7 Day Streak', desc: 'Studied 7 days in a row',
    icon: 'flame',
    check: (s) => s.streak.current >= 7 || s.streak.longest >= 7,
  },
  {
    id: 'streak-30', name: '30 Day Streak', desc: 'Studied 30 days in a row',
    icon: 'flame',
    check: (s) => s.streak.current >= 30 || s.streak.longest >= 30,
  },
  {
    id: 'hours-100', name: '100 Study Hours', desc: 'Logged 100 hours of focused study',
    icon: 'clock',
    check: (s) => totalHoursLogged(s) >= 100,
  },
  {
    id: 'first-mock', name: 'First Mock', desc: 'Completed your first mock test',
    icon: 'target',
    check: (s) => s.mockScores.length >= 1,
  },
  {
    id: 'revision-master', name: 'Revision Master', desc: 'Completed 3 full revision passes on 10 chapters',
    icon: 'refresh',
    check: (s) => Object.values(s.chapterProgress || {}).filter(c => c.revision1 && c.revision2 && c.revision3).length >= 10,
  },
  {
    id: 'pyq-master', name: 'PYQ Master', desc: 'Cleared PYQs for 15 chapters',
    icon: 'award',
    check: (s) => Object.values(s.chapterProgress || {}).filter(c => c.pyq).length >= 15,
  },
];

function totalHoursLogged(state){
  return (state.hoursLog || []).reduce((sum, e) => sum + (e.hours || 0), 0);
}
