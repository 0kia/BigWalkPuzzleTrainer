// ---------- Shared setup ----------

// Positions are percentages (left, top) within #kettles-container.
// Order = row by row, left to right: row 1 = slots 1-3, row 2 = slots 4-7,
// row 3 = slots 8-12.
const KETTLE_POSITIONS = [
  { x: 6,  y: 30 }, // 1
  { x: 14, y: 30 }, // 2
  { x: 48, y: 30 }, // 3
  { x: 21, y: 48 }, // 4
  { x: 55, y: 48 }, // 5
  { x: 68, y: 48 }, // 6
  { x: 89, y: 48 }, // 7
  { x: 14, y: 68 }, // 8
  { x: 35, y: 72 }, // 9
  { x: 61, y: 72 }, // 10
  { x: 83, y: 72 }, // 11
  { x: 96, y: 72 }  // 12
];

const TOTAL_SLOTS = KETTLE_POSITIONS.length; // 12
const ON_COUNT = 6; // how many slots are "1" (occupied) each round

const kettlesContainer = document.getElementById('kettles-container');
const kettlesShuffleBtn = document.getElementById('kettles-shuffle');
const moveContainer = document.getElementById('kettles-move-container');
const kettlesResetBtn = document.getElementById('kettles-reset');
const kettlesStatusEl = document.getElementById('kettles-status');

// The pattern the player is trying to recreate below (array of 0/1, length 12)
let targetStates = [];

function generateRandomStates() {
  // 6 ones, 6 zeros, shuffled
  const states = Array(ON_COUNT).fill(1).concat(Array(TOTAL_SLOTS - ON_COUNT).fill(0));
  for (let i = states.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [states[i], states[j]] = [states[j], states[i]];
  }
  return states;
}

// ---------- Top target grid ----------

function renderTargetGrid() {
  targetStates = generateRandomStates();
  kettlesContainer.innerHTML = '';

  KETTLE_POSITIONS.forEach((pos, i) => {
    const slot = document.createElement('div');
    slot.className = 'kettle-slot';
    slot.style.left = pos.x + '%';
    slot.style.top = pos.y + '%';
    slot.dataset.index = i;

    if (targetStates[i] === 1) {
      const dot = document.createElement('div');
      dot.className = 'dot';
      slot.appendChild(dot);
    }

    kettlesContainer.appendChild(slot);
  });
}

// ---------- Movable semicircle arena ----------

// moveState[i] = 1 if a kettle currently sits in physical slot i (0-11), else 0.
// Slots 0-5 = inner arc (top layer), slots 6-11 = outer arc (floor layer).
let moveState = [];
let selectedSlot = null;
let moveSlotEls = [];

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

function resetMoveState() {
  // Kettles always start on the top 6 (inner) slots
  moveState = Array(TOTAL_SLOTS).fill(0).map((_, i) => (i < 6 ? 1 : 0));
  selectedSlot = null;
}

function renderMoveArena() {
  moveContainer.innerHTML = '';
  moveSlotEls = [];

  const rect = moveContainer.getBoundingClientRect();
  const w = rect.width;
  const h = rect.height;

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
    slot.addEventListener('click', () => handleSlotClick(i));
    moveContainer.appendChild(slot);
    moveSlotEls.push(slot);
  });

  updateMoveArenaVisuals();
}

function handleSlotClick(index) {
  if (selectedSlot === null) {
    if (moveState[index] === 1) {
      selectedSlot = index;
    }
  } else if (selectedSlot === index) {
    selectedSlot = null;
  } else {
    // swap kettle between selected slot and clicked slot
    const temp = moveState[selectedSlot];
    moveState[selectedSlot] = moveState[index];
    moveState[index] = temp;
    selectedSlot = null;
  }
  updateMoveArenaVisuals();
}

function updateMoveArenaVisuals() {
  let correctCount = 0;

  moveSlotEls.forEach((slot, i) => {
    slot.innerHTML = '';
    slot.classList.remove('selected', 'match', 'has-kettle', 'selectable');

    if (moveState[i] === 1) {
      const icon = document.createElement('div');
      icon.className = 'kettle-icon';
      slot.appendChild(icon);
      slot.classList.add('has-kettle');
    }

    if (i === selectedSlot) {
      slot.classList.add('selected');
    } else if (selectedSlot !== null || moveState[i] === 1) {
      slot.classList.add('selectable');
    }

    if (moveState[i] === targetStates[i]) {
      correctCount++;
    }
  });

  if (correctCount === TOTAL_SLOTS) {
    kettlesStatusEl.textContent = 'Solved!';
    kettlesStatusEl.classList.add('solved');
  } else {
    kettlesStatusEl.textContent = correctCount + ' / ' + TOTAL_SLOTS + ' correct';
    kettlesStatusEl.classList.remove('solved');
  }
}

// ---------- Buttons ----------

kettlesShuffleBtn.addEventListener('click', () => {
  renderTargetGrid();
  resetMoveState();
  renderMoveArena();
});

kettlesResetBtn.addEventListener('click', () => {
  resetMoveState();
  updateMoveArenaVisuals();
});

// Re-layout the arcs if the window is resized
window.addEventListener('resize', () => {
  if (document.getElementById('page-kettles').classList.contains('active')) {
    renderMoveArena();
  }
});

// Re-layout when switching into the Kettles tab, in case sizing changed while hidden.
// Deferred via setTimeout so it runs after tabs.js's click handler has toggled
// the 'active' class (listener execution order isn't guaranteed otherwise).
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (btn.dataset.page === 'page-kettles') {
      setTimeout(renderMoveArena, 0);
    }
  });
});

// ---------- Kick things off ----------

renderTargetGrid();
resetMoveState();
renderMoveArena();