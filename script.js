const TOTAL_SYMBOLS = 9;
const FEEDBACK_DELAY_MS = 250;
const SETS = ['Symbols', 'Squiggles', 'Poses'];

const imageEl = document.getElementById('symbol');
const buttonsEl = document.getElementById('buttons');
const rerollContainer = document.getElementById('reroll-container');
const setSwitcherEl = document.getElementById('set-switcher');
const streakCountEl = document.getElementById('streak-count');

let currentSet = SETS[0];
let currentAnswer = null;
let locked = false; // prevents clicking while feedback is showing
let streak = 0;

// Build the set-switcher buttons
SETS.forEach(setName => {
  const btn = document.createElement('button');
  btn.textContent = setName;
  btn.dataset.set = setName;
  if (setName === currentSet) btn.classList.add('active');
  btn.addEventListener('click', () => switchSet(setName));
  setSwitcherEl.appendChild(btn);
});

// Build the 1-9 buttons
for (let i = 1; i <= TOTAL_SYMBOLS; i++) {
  const btn = document.createElement('button');
  btn.textContent = i;
  btn.dataset.value = i;
  btn.addEventListener('click', () => handleGuess(i, btn));
  buttonsEl.appendChild(btn);
}

// Reroll button - picks a new random image without needing a correct guess
const rerollBtn = document.createElement('button');
rerollBtn.id = 'reroll';
rerollBtn.textContent = '⟳';
rerollBtn.title = 'Reroll';
rerollBtn.addEventListener('click', () => {
  if (locked) return;
  showNewSymbol();
});
rerollContainer.appendChild(rerollBtn);

function switchSet(setName) {
  if (setName === currentSet) return;
  currentSet = setName;

  [...setSwitcherEl.children].forEach(btn => {
    btn.classList.toggle('active', btn.dataset.set === setName);
  });

  // Reset to a fresh random image from the new set, no lingering image
  currentAnswer = null;
  streak = 0;
  streakCountEl.textContent = streak;
  showNewSymbol();
}

function pickRandomSymbol(excludeCurrent) {
  let next;
  if (TOTAL_SYMBOLS > 1 && excludeCurrent !== null) {
    do {
      next = Math.floor(Math.random() * TOTAL_SYMBOLS) + 1;
    } while (next === excludeCurrent);
  } else {
    next = Math.floor(Math.random() * TOTAL_SYMBOLS) + 1;
  }
  return next;
}

function showNewSymbol() {
  currentAnswer = pickRandomSymbol(currentAnswer);
  imageEl.src = currentSet + '/' + currentAnswer + '.png';
  locked = false;
  clearButtonStates();
}

function clearButtonStates() {
  [...buttonsEl.children].forEach(btn => {
    btn.classList.remove('correct', 'wrong');
    btn.disabled = false;
  });
}

function handleGuess(value, btn) {
  if (locked) return;

  if (value === currentAnswer) {
    locked = true;
    [...buttonsEl.children].forEach(b => b.disabled = true);
    btn.classList.add('correct');
    streak++;
    streakCountEl.textContent = streak;
    setTimeout(showNewSymbol, FEEDBACK_DELAY_MS);
  } else {
    // brief wrong feedback, doesn't lock the round
    streak = 0;
    streakCountEl.textContent = streak;
    btn.classList.add('wrong');
    setTimeout(() => btn.classList.remove('wrong'), 400);
  }
}

// Kick things off
showNewSymbol();

// Allow number keys 1-9 to trigger the corresponding guess button
document.addEventListener('keydown', (e) => {
  const num = parseInt(e.key, 10);
  if (!Number.isInteger(num) || num < 1 || num > TOTAL_SYMBOLS) return;

  const btn = [...buttonsEl.children].find(b => b.dataset.value === String(num));
  if (btn && !btn.disabled) btn.click();
});