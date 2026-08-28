// ---------- Shared setup ----------

// Positions are percentages (left, top) within #kettles-container.
// Order = row by row, left to right: row 1 = slots 1-3, row 2 = slots 4-7,
// row 3 = slots 8-12.
const KETTLE_POSITIONS = [
  { x: 6,  y: 30 }, // 1
  { x: 13, y: 30 }, // 2
  { x: 45, y: 30 }, // 3
  { x: 20, y: 50.5 }, // 4
  { x: 52, y: 50.5 }, // 5
  { x: 66, y: 50.5 }, // 6
  { x: 87, y: 50.5 }, // 7
  { x: 13, y: 72 }, // 8
  { x: 33, y: 72 }, // 9
  { x: 59, y: 72 }, // 10
  { x: 80, y: 72 }, // 11
  { x: 94, y: 72 }  // 12
];

const TOTAL_SLOTS = KETTLE_POSITIONS.length; // 12
const ON_COUNT = 6; // how many slots are "1" (occupied) each round
const TOP_ROW_COUNT = 6; // kettle arena: indices 0-5 = top/inner layer

const kettlesContainer = document.getElementById('kettles-container');
const kettlesShuffleBtn = document.getElementById('kettles-shuffle');
const moveContainer = document.getElementById('kettles-move-container');
const kettlesResetBtn = document.getElementById('kettles-reset');
const kettlesStatusEl = document.getElementById('kettles-status');
const moveTitleEl = document.getElementById('kettles-move-title');
const playerButtons = document.querySelectorAll('.player-btn');

let currentPlayer = 1;

// gridStates: the 12 squares in the top grid (0/1)
// kettleStates: the 12 physical kettle slots below - index 0-5 = top/inner
//               layer, index 6-11 = floor/outer layer (0/1)
let gridStates = [];
let kettleStates = [];

let selectedKettleSlot = null; // used only in Player 1 mode (swap-to-move)
let gridSlotEls = [];
let moveSlotEls = [];

function generateRandomStates(minInFirstSix) {
  let states;
  do {
    states = Array(ON_COUNT).fill(1).concat(Array(TOTAL_SLOTS - ON_COUNT).fill(0));
    for (let i = states.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [states[i], states[j]] = [states[j], states[i]];
    }
  } while (minInFirstSix && states.slice(0, 6).reduce((a, b) => a + b, 0) < minInFirstSix);
  return states;
}

// ---------- Top grid ----------

function renderGrid() {
  kettlesContainer.innerHTML = '';
  gridSlotEls = [];

  KETTLE_POSITIONS.forEach((pos, i) => {
    const slot = document.createElement('div');
    slot.className = 'kettle-slot';
    slot.style.left = pos.x + '%';
    slot.style.top = pos.y + '%';
    slot.dataset.index = i;

    if (gridStates[i] === 1) {
      const dot = document.createElement('div');
      dot.className = 'dot';
      slot.appendChild(dot);
    }

    if (currentPlayer === 2) {
      slot.classList.add('editable');
      slot.addEventListener('click', () => {
        gridStates[i] = gridStates[i] === 1 ? 0 : 1;
        renderGrid();
        updateStatus();
      });
    }

    kettlesContainer.appendChild(slot);
    gridSlotEls.push(slot);
  });
}

// ---------- Movable / display semicircle arena ----------

function computeArcPositions(containerW, containerH, radius) {
  // 6 points swept left-to-right across a downward-bulging semicircle,
  // anchored along the top edge of the container.
  const cx = containerW / 2;
  const cy = 0;
  const positions = [];
  for (let i = 0; i < 6; i++) {
    const thetaDeg = 180 + (i / 5) * 180;
    const theta = (thetaDeg * Math.PI) / 180;
    const x = cx + radius * Math.cos(theta);
    const y = cy - radius * Math.sin(theta);
    positions.push({ x, y });
  }
  return positions;
}

function renderMoveArena() {
  moveContainer.innerHTML = '';
  moveSlotEls = [];

  // Use offsetWidth/offsetHeight (untransformed layout size) rather than
  // getBoundingClientRect, since the whole kettles section is scaled down
  // to fit the screen via a CSS transform - we want the arcs computed
  // against the true, un-scaled canvas size, not the visually shrunk one.
  const w = moveContainer.offsetWidth;
  const h = moveContainer.offsetHeight;

  const innerRadius = Math.min(w * 0.32, h * 0.85);
  const outerRadius = Math.min(w * 0.46, h * 1.15);

  const innerPositions = computeArcPositions(w, h, innerRadius);
  const outerPositions = computeArcPositions(w, h, outerRadius);
  const allPositions = innerPositions.concat(outerPositions);

  allPositions.forEach((pos, i) => {
    const slot = document.createElement('div');
    slot.className = 'kettle-move-slot';
    slot.style.left = pos.x + 'px';
    slot.style.top = pos.y + 'px';
    slot.dataset.index = i;

    if (currentPlayer === 1) {
      slot.addEventListener('click', () => handleKettleSlotClick(i));
    }

    moveContainer.appendChild(slot);
    moveSlotEls.push(slot);
  });

  updateMoveArenaVisuals();
}

function handleKettleSlotClick(index) {
  if (selectedKettleSlot === null) {
    if (kettleStates[index] === 1) {
      selectedKettleSlot = index;
    }
  } else if (selectedKettleSlot === index) {
    selectedKettleSlot = null;
  } else {
    const temp = kettleStates[selectedKettleSlot];
    kettleStates[selectedKettleSlot] = kettleStates[index];
    kettleStates[index] = temp;
    selectedKettleSlot = null;
  }
  updateMoveArenaVisuals();
  updateStatus();
}

function updateMoveArenaVisuals() {
  moveSlotEls.forEach((slot, i) => {
    slot.innerHTML = '';
    slot.classList.remove('selected', 'has-kettle', 'selectable');

    if (kettleStates[i] === 1) {
      const icon = document.createElement('div');
      icon.className = 'kettle-icon';
      slot.appendChild(icon);
      slot.classList.add('has-kettle');
    }

    if (currentPlayer === 1) {
      if (i === selectedKettleSlot) {
        slot.classList.add('selected');
      } else if (selectedKettleSlot !== null || kettleStates[i] === 1) {
        slot.classList.add('selectable');
      }
    }
  });
}

// ---------- Status ----------

function updateStatus() {
  let correctCount = 0;
  for (let i = 0; i < TOTAL_SLOTS; i++) {
    if (gridStates[i] === kettleStates[i]) correctCount++;
  }

  if (correctCount === TOTAL_SLOTS) {
    kettlesStatusEl.textContent = 'Solved!';
    kettlesStatusEl.classList.add('solved');
  } else {
    kettlesStatusEl.textContent = correctCount + ' / ' + TOTAL_SLOTS + ' correct';
    kettlesStatusEl.classList.remove('solved');
  }
}

// ---------- Round setup ----------

function updateModeUI() {
  moveTitleEl.textContent = currentPlayer === 1
    ? 'Move the kettles below to match the pattern above'
    : 'Click the grid above to match the kettles below';
  kettlesResetBtn.textContent = currentPlayer === 1 ? 'Reset Kettles' : 'Reset Grid';
}

function startRound(regenerateGiven) {
  if (currentPlayer === 1) {
    // Grid is the random "given" pattern; kettles are player-editable,
    // always starting on the top row.
    if (regenerateGiven) gridStates = generateRandomStates(0);
    kettleStates = Array(TOTAL_SLOTS).fill(0).map((_, i) => (i < TOP_ROW_COUNT ? 1 : 0));
    selectedKettleSlot = null;
  } else {
    // Kettles are the random "given" pattern (>=3 guaranteed on top row);
    // grid starts blank and is player-editable.
    if (regenerateGiven) kettleStates = generateRandomStates(3);
    gridStates = Array(TOTAL_SLOTS).fill(0);
  }

  updateModeUI();
  renderGrid();
  renderMoveArena();
  updateStatus();
}

// ---------- Buttons ----------

kettlesShuffleBtn.addEventListener('click', () => startRound(true));

kettlesResetBtn.addEventListener('click', () => startRound(false));

playerButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    currentPlayer = parseInt(btn.dataset.player, 10);
    playerButtons.forEach(b => b.classList.toggle('active', b === btn));
    startRound(true);
  });
});

// ---------- Scale-to-fit ----------
// The kettles section is built at a fixed "design" size (#kettles-inner is
// 1000px wide). Rather than letting individual pieces reflow/resize on
// small screens (which breaks the puzzle's geometry), we scale the whole
// section down as one unit so it fits the available width - the same
// effect a mobile browser gives you when it zooms out to fit a wide page,
// just applied deliberately to this section instead of the whole page.

const kettlesOuter = document.getElementById('kettles-outer');
const kettlesInner = document.getElementById('kettles-inner');

function applyKettlesScale() {
  if (!kettlesOuter || !kettlesInner) return;
  const pageEl = document.getElementById('page-kettles');
  if (!pageEl.classList.contains('active')) return; // can't measure while hidden

  // Reset transform first so we measure the true, unscaled size.
  kettlesInner.style.transform = 'none';
  const naturalWidth = kettlesInner.offsetWidth;
  const naturalHeight = kettlesInner.offsetHeight;

  const pageStyle = getComputedStyle(pageEl);
  const availableWidth = pageEl.clientWidth
    - parseFloat(pageStyle.paddingLeft || 0)
    - parseFloat(pageStyle.paddingRight || 0);

  const scale = Math.min(1, availableWidth / naturalWidth);

  kettlesInner.style.transform = 'scale(' + scale + ')';
  // Match the outer wrapper's box to the visually scaled size so it takes
  // up the correct amount of space in the page's layout (otherwise the
  // page would still reserve room for the full, unscaled 1000px section).
  kettlesOuter.style.width = (naturalWidth * scale) + 'px';
  kettlesOuter.style.height = (naturalHeight * scale) + 'px';
}

// Re-layout the arcs if the window is resized
window.addEventListener('resize', () => {
  if (document.getElementById('page-kettles').classList.contains('active')) {
    renderMoveArena();
    applyKettlesScale();
  }
});

// Re-layout when switching into the Kettles tab, in case sizing changed while hidden.
// Deferred via setTimeout so it runs after tabs.js's click handler has toggled
// the 'active' class (listener execution order isn't guaranteed otherwise).
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (btn.dataset.page === 'page-kettles') {
      setTimeout(() => {
        renderMoveArena();
        applyKettlesScale();
      }, 0);
    }
  });
});

// ---------- Kick things off ----------

startRound(true);
applyKettlesScale();