const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN',
                 'JUL','AUG','SEP','OCT','NOV','DEC'];
const DAYS   = ['SUN','MON','TUE','WED','THU','FRI','SAT'];

// Add new pieces here — 1 = filled cell, 0 = empty
const SHAPES = {
  u: [
    [1, 0, 1],
    [1, 1, 1]
  ],

  l: [
    [1, 1, 1],
    [1, 0, 0]
  ]
};

const BOARD_CELL = 40; // must match grid-template-columns/rows in popup.css
const PIECE_CELL = 40; // adjust to resize pieces independently

// Builds an SVG from a shape grid using PIECE_CELL sized squares
function buildPieceSVG(shapeGrid) {
  const rows = shapeGrid.length;
  const cols = shapeGrid[0].length;
  const W    = cols * PIECE_CELL;
  const H    = rows * PIECE_CELL;

  let rects = '';
  shapeGrid.forEach((row, r) => {
    row.forEach((filled, c) => {
      if (!filled) return;
      rects += `<rect x="${c * PIECE_CELL}" y="${r * PIECE_CELL}" width="${PIECE_CELL}" height="${PIECE_CELL}"/>`;
    });
  });

  return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <g fill="#b07830">${rects}</g>
  </svg>`;
}

function snapToGrid(left, top) {
  const grid    = document.querySelector('.grid');
  const wrapper = document.querySelector('.extension-wrapper');
  const gr = grid.getBoundingClientRect();
  const wr = wrapper.getBoundingClientRect();

  const ox = Math.round(gr.left - wr.left);
  const oy = Math.round(gr.top  - wr.top);

  const col = Math.round((left - ox) / BOARD_CELL);
  const row = Math.round((top  - oy) / BOARD_CELL);

  return {
    left: ox + col * BOARD_CELL,
    top:  oy + row * BOARD_CELL
  };
}

function initPiece(el) {
  let rotation      = 0;
  let flipped       = false;
  let hasMoved      = false;
  let pendingClicks = 0;
  let clickTimer    = null;

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

  function rotate() { rotation = (rotation + 90) % 360; applyTransform(); } // single click — +90°
  function flip()   { flipped  = !flipped;               applyTransform(); } // double click — mirror

  el.addEventListener('mousedown', (e) => {
    e.preventDefault();
    ensureInlinePosition();

    hasMoved = false;
    const startMouseX = e.clientX;
    const startMouseY = e.clientY;
    const startLeft   = parseFloat(el.style.left) || 0;
    const startTop    = parseFloat(el.style.top)  || 0;

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
        el.style.transition = 'left 0.12s ease, top 0.12s ease';
        const snapped = snapToGrid(parseFloat(el.style.left), parseFloat(el.style.top));
        el.style.left = snapped.left + 'px';
        el.style.top  = snapped.top  + 'px';
      } else {
        pendingClicks++;
        if (clickTimer) clearTimeout(clickTimer);
        clickTimer = setTimeout(() => {
          if (pendingClicks === 1) rotate();
          else if (pendingClicks >= 2) flip();
          pendingClicks = 0;
          clickTimer = null;
        }, 250);
      }
    }

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup',   onUp);
  });
}

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

document.addEventListener('DOMContentLoaded', () => {
  highlightToday();
  document.querySelectorAll('.piece[data-shape]').forEach(el => {
    const shape = SHAPES[el.dataset.shape];
    if (shape) el.innerHTML = buildPieceSVG(shape);
    initPiece(el);
  });
});
