// Caesar's Calendar — popup.js
// Highlights today's month, date number, and day-of-week on the board.

const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN',
                 'JUL','AUG','SEP','OCT','NOV','DEC'];
const DAYS   = ['SUN','MON','TUE','WED','THU','FRI','SAT'];

function highlightToday() {
  const now       = new Date();
  const monthKey  = MONTHS[now.getMonth()];
  const dateKey   = String(now.getDate());
  const dayKey    = DAYS[now.getDay()];

  [monthKey, dateKey, dayKey].forEach(key => {
    const el = document.querySelector(`[data-cell="${key}"]`);
    if (el) el.classList.add('target');
  });
}

document.addEventListener('DOMContentLoaded', highlightToday);
