// Caesar's Calendar — popup.js

const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN',
                 'JUL','AUG','SEP','OCT','NOV','DEC'];
const DAYS   = ['SUN','MON','TUE','WED','THU','FRI','SAT'];

const CELL = 40;
const GAP  = 5;
const UNIT = CELL + GAP; // 45px — one board cell + its gap

function highlightToday() {
  const now      = new Date();
  const monthKey = MONTHS[now.getMonth()];
  const dateKey  = String(now.getDate());
  const dayKey   = DAYS[now.getDay()];
  [monthKey, dateKey, dayKey].forEach(key => {
    const el = document.querySelector(`[data-cell="${key}"]`);
    if (el) el.classList.add('target');
  });
}

// ─── Snap helpers ─────────────────────────────────────────────

// Returns the grid's top-left corner in wrapper-relative px.
function getGridOrigin() {
  const grid    = document.querySelector('.grid');
  const wrapper = document.querySelector('.extension-wrapper');
  const gr = grid.getBoundingClientRect();
  const wr = wrapper.getBoundingClientRect();
  return { x: gr.left - wr.left, y: gr.top - wr.top };
}

// Snaps a wrapper-relative (left, top) to the nearest grid cell.
function snapToGrid(left, top) {
  const o   = getGridOrigin();
  const col = Math.round((left - o.x) / UNIT);
  const row = Math.round((top  - o.y) / UNIT);
  return {
    left: o.x + col * UNIT,
    top:  o.y + row * UNIT
  };
}

// ─── Piece interaction ────────────────────────────────────────
//
//  • Click-and-hold then drag  → moves the piece
//  • Single tap (click)        → rotates 90° clockwise
//  • Double tap (double-click) → flips horizontally
//
function initPiece(el) {
  let rotation      = 0;     // 0 | 90 | 180 | 270
  let flipped       = false;
  let hasMoved      = false;
  let pendingClicks = 0;
  let clickTimer    = null;

  // On first interaction, convert CSS-class-based position to inline
  // so we can freely update left/top during drags.
  function ensureInlinePosition() {
    if (el.style.left) return;
    const wrapper = el.closest('.extension-wrapper');
    const er = el.getBoundingClientRect();
    const wr = wrapper.getBoundingClientRect();
    el.style.left = (er.left - wr.left) + 'px';
    el.style.top  = (er.top  - wr.top)  + 'px';
  }

  function applyTransform() {
    const f = flipped ? ' scaleX(-1)' : '';
    el.style.transform = `rotate(${rotation}deg)${f}`;
  }

  function rotate() {
    rotation = (rotation + 90) % 360;
    applyTransform();
  }

  function flip() {
    flipped = !flipped;
    applyTransform();
  }

  el.addEventListener('mousedown', (e) => {
    e.preventDefault();
    ensureInlinePosition();

    hasMoved = false;
    const startMouseX = e.clientX;
    const startMouseY = e.clientY;
    const startLeft   = parseFloat(el.style.left) || 0;
    const startTop    = parseFloat(el.style.top)  || 0;

    // Lift piece above everything while dragging
    el.style.zIndex     = '1000';
    el.style.transition = 'none';

    function onMove(e) {
      const dx = e.clientX - startMouseX;
      const dy = e.clientY - startMouseY;

      if (!hasMoved && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
        hasMoved = true;
        if (clickTimer) { clearTimeout(clickTimer); clickTimer = null; }
        pendingClicks = 0;
      }

      if (hasMoved) {
        el.style.left = (startLeft + dx) + 'px';
        el.style.top  = (startTop  + dy) + 'px';
      }
    }

    function onUp() {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup',   onUp);
      el.style.zIndex = '';

      if (hasMoved) {
        // Snap to nearest board cell with a quick ease animation
        el.style.transition = 'left 0.12s ease, top 0.12s ease';
        const snapped = snapToGrid(
          parseFloat(el.style.left),
          parseFloat(el.style.top)
        );
        el.style.left = snapped.left + 'px';
        el.style.top  = snapped.top  + 'px';
      } else {
        // Tap — count clicks, fire after 250 ms silence
        pendingClicks++;
        if (clickTimer) clearTimeout(clickTimer);
        clickTimer = setTimeout(() => {
          if (pendingClicks === 1) rotate();      // single tap → rotate
          else if (pendingClicks >= 2) flip();    // double tap → flip
          pendingClicks = 0;
          clickTimer = null;
        }, 250);
      }
    }

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup',   onUp);
  });
}

// ─── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  highlightToday();
  document.querySelectorAll('.piece').forEach(initPiece);
});
