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
let locked = false;
let streak = 0;

// --- Preload cache ---
// imageCache[setName][n] = an <img> Image object whose decode() has resolved
const imageCache = {};
const preloadPromises = {}; // setName -> Promise that resolves when the whole set is ready

function urlFor(setName, n) {
  return setName + '/' + n + '.png';
}

function preloadSet(setName) {
  if (preloadPromises[setName]) return preloadPromises[setName];

  imageCache[setName] = {};
  const loads = [];
  for (let i = 1; i <= TOTAL_SYMBOLS; i++) {
    const img = new Image();
    img.src = urlFor(setName, i);
    const p = (img.decode ? img.decode() : new Promise((res) => { img.onload = res; img.onerror = res; }))
      .catch(() => {}) // don't let one bad decode kill the rest
      .then(() => { imageCache[setName][i] = img; });
    loads.push(p);
  }
  preloadPromises[setName] = Promise.all(loads);
  return preloadPromises[setName];
}

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

// Reroll button
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

  currentAnswer = null;
  streak = 0;
  streakCountEl.textContent = streak;

  // Make sure this set's images are decoded before showing (usually instant,
  // since we preload every set in the background already)
  preloadSet(setName).then(showNewSymbol);
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
  const cached = imageCache[currentSet] && imageCache[currentSet][currentAnswer];
  // Using the already-decoded image's src reuses the decoded bitmap;
  // falls back to a normal load if for some reason it isn't cached yet.
  imageEl.src = cached ? cached.src : urlFor(currentSet, currentAnswer);
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
    streak = 0;
    streakCountEl.textContent = streak;
    btn.classList.add('wrong');
    setTimeout(() => btn.classList.remove('wrong'), 400);
  }
}

// --- Kick things off ---
// Preload the starting set first so the very first symbol is fast, then
// preload the other sets in the background so switching sets is fast too.
preloadSet(currentSet).then(showNewSymbol);

SETS.forEach(setName => {
  if (setName === currentSet) return;
  const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 200));
  idle(() => preloadSet(setName));
});

// Allow number keys 1-9 to trigger the corresponding guess button
document.addEventListener('keydown', (e) => {
  const num = parseInt(e.key, 10);
  if (!Number.isInteger(num) || num < 1 || num > TOTAL_SYMBOLS) return;

  const btn = [...buttonsEl.children].find(b => b.dataset.value === String(num));
  if (btn && !btn.disabled) btn.click();
});