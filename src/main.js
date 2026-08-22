import './styles.css';
import Matter from 'matter-js';

const { Engine, World, Body, Bodies, Composite } = Matter;

const screens = [...document.querySelectorAll('.screen')];
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const miniCanvas = document.getElementById('miniGameCanvas');
const miniCtx = miniCanvas ? miniCanvas.getContext('2d') : null;

const state = {
  selectedSubject: 'numbers',
  selectedDifficulty: 'easy',
  currentScreen: 'home',
  totalXP: 2480,
  level: 8,
  score: 0,
  runXP: 0,
  combo: 1,
  bestCombo: 1,
  correct: 0,
  attempts: 0,
  timeLeft: 90,
  missionTarget: 5,
  missionLabel: 'Pocket 5 Prime Numbers',
  activeGame: false,
  tokens: [],
  particles: [],
  floatingTexts: [],
  gameConfig: null,
  engine: null,
  striker: null,
  aimLine: null,
  shotInProgress: false,
  draggingStriker: false,
  aimMode: 'beginner',
  lastFrame: 0,
  categoryStats: {},
  practiceFocus: null,
  animationSeed: 0,
  currentLevel: 1,
  countdown: null,
  foulTimer: null,
  turnLocked: false,
  lastNearMiss: 0,
  miniGame: null,
  miniPlayerProgress: {
    shapeHunter: { bestScore: 0, stars: 0 },
    numberCatcher: { bestScore: 0, stars: 0 },
    targetStrike: { bestScore: 0, stars: 0 },
  },
};

const subjectLookup = {
  numbers: {
    name: 'Numbers',
    label: 'Numbers',
    icon: '🔢',
  },
  periodic: {
    name: 'Periodic Table',
    label: 'Periodic Table',
    icon: '🧪',
  },
};

const levelRoadmap = [
  { id: 1, world: 'Number Garden', title: 'Prime Seed', subject: 'numbers', difficulty: 'easy', mission: 'Pocket 5 Prime Numbers', reward: 80, unlocked: true },
  { id: 2, world: 'Number Garden', title: 'Parity Bloom', subject: 'numbers', difficulty: 'easy', mission: 'Pocket 4 Even Numbers', reward: 110, unlocked: true },
  { id: 3, world: 'Number Garden', title: 'Composite Grove', subject: 'numbers', difficulty: 'medium', mission: 'Pocket 5 Composite Numbers', reward: 130, unlocked: true },
  { id: 4, world: 'Prime Valley', title: 'Prime Run', subject: 'numbers', difficulty: 'medium', mission: 'Pocket 7 Prime Numbers', reward: 160, unlocked: false },
  { id: 5, world: 'Prime Valley', title: 'Boss: Prime Burst', subject: 'numbers', difficulty: 'hard', mission: 'Pocket 10 Prime Numbers', reward: 220, unlocked: false },
  { id: 6, world: 'Composite City', title: 'Factor Street', subject: 'numbers', difficulty: 'hard', mission: 'Pocket 8 Composite Numbers', reward: 260, unlocked: false },
];

const difficultySettings = {
  easy: {
    label: 'Easy',
    timeLimit: 90,
    mission: 'Pocket 5 Prime Numbers',
    tokens: [
      { value: 2, category: 'prime' },
      { value: 5, category: 'prime' },
      { value: 7, category: 'prime' },
      { value: 8, category: 'composite' },
      { value: 9, category: 'composite' },
      { value: 11, category: 'prime' },
      { value: 12, category: 'composite' },
      { value: 13, category: 'prime' },
      { value: 15, category: 'composite' },
      { value: 17, category: 'prime' },
      { value: 4, category: 'even' },
      { value: 6, category: 'even' },
      { value: 10, category: 'even' },
      { value: 18, category: 'even' },
      { value: 1, category: 'odd' },
      { value: 3, category: 'odd' },
      { value: 9, category: 'odd' },
      { value: 19, category: 'odd' },
    ],
    board: {
      holeRadius: 28,
      spawnScale: 1,
    },
  },
  medium: {
    label: 'Medium',
    timeLimit: 75,
    mission: 'Pocket 8 Correct Answers',
    tokens: [
      { value: 2, category: 'prime' },
      { value: 5, category: 'prime' },
      { value: 7, category: 'prime' },
      { value: 11, category: 'prime' },
      { value: 13, category: 'prime' },
      { value: 17, category: 'prime' },
      { value: 19, category: 'prime' },
      { value: 23, category: 'prime' },
      { value: 8, category: 'composite' },
      { value: 9, category: 'composite' },
      { value: 12, category: 'composite' },
      { value: 15, category: 'composite' },
      { value: 21, category: 'composite' },
      { value: 24, category: 'composite' },
      { value: 27, category: 'composite' },
      { value: 30, category: 'composite' },
      { value: 4, category: 'even' },
      { value: 6, category: 'even' },
      { value: 10, category: 'even' },
      { value: 14, category: 'even' },
      { value: 16, category: 'even' },
      { value: 20, category: 'even' },
      { value: 22, category: 'even' },
      { value: 26, category: 'even' },
      { value: 1, category: 'odd' },
      { value: 3, category: 'odd' },
      { value: 9, category: 'odd' },
      { value: 15, category: 'odd' },
      { value: 19, category: 'odd' },
      { value: 21, category: 'odd' },
      { value: 25, category: 'odd' },
    ],
    board: {
      holeRadius: 28,
      spawnScale: 1.1,
    },
  },
  hard: {
    label: 'Hard',
    timeLimit: 60,
    mission: 'Pocket 10 Correct Answers',
    tokens: [
      { value: 2, category: 'prime' },
      { value: 5, category: 'prime' },
      { value: 7, category: 'prime' },
      { value: 11, category: 'prime' },
      { value: 13, category: 'prime' },
      { value: 17, category: 'prime' },
      { value: 19, category: 'prime' },
      { value: 23, category: 'prime' },
      { value: 29, category: 'prime' },
      { value: 31, category: 'prime' },
      { value: 6, category: 'composite' },
      { value: 8, category: 'composite' },
      { value: 9, category: 'composite' },
      { value: 12, category: 'composite' },
      { value: 15, category: 'composite' },
      { value: 18, category: 'composite' },
      { value: 21, category: 'composite' },
      { value: 24, category: 'composite' },
      { value: 27, category: 'composite' },
      { value: 30, category: 'composite' },
      { value: 36, category: 'composite' },
      { value: 4, category: 'even' },
      { value: 6, category: 'even' },
      { value: 10, category: 'even' },
      { value: 14, category: 'even' },
      { value: 16, category: 'even' },
      { value: 20, category: 'even' },
      { value: 22, category: 'even' },
      { value: 28, category: 'even' },
      { value: 32, category: 'even' },
      { value: 34, category: 'even' },
      { value: 1, category: 'odd' },
      { value: 3, category: 'odd' },
      { value: 9, category: 'odd' },
      { value: 15, category: 'odd' },
      { value: 17, category: 'odd' },
      { value: 19, category: 'odd' },
      { value: 21, category: 'odd' },
      { value: 25, category: 'odd' },
      { value: 27, category: 'odd' },
      { value: 29, category: 'odd' },
      { value: 33, category: 'odd' },
      { value: 35, category: 'odd' },
    ],
    board: {
      holeRadius: 30,
      spawnScale: 1.2,
    },
  },
};

const periodicConfig = {
  easy: {
    label: 'Easy',
    timeLimit: 90,
    mission: 'Pocket 5 s-BLOCK Elements',
    tokens: [
      { value: 'H', category: 's-BLOCK' },
      { value: 'Li', category: 's-BLOCK' },
      { value: 'Na', category: 's-BLOCK' },
      { value: 'Mg', category: 's-BLOCK' },
      { value: 'B', category: 'p-BLOCK' },
      { value: 'C', category: 'p-BLOCK' },
      { value: 'O', category: 'p-BLOCK' },
      { value: 'Ne', category: 'p-BLOCK' },
      { value: 'Fe', category: 'd-BLOCK' },
      { value: 'Cu', category: 'd-BLOCK' },
      { value: 'Zn', category: 'd-BLOCK' },
      { value: 'Ag', category: 'd-BLOCK' },
      { value: 'La', category: 'f-BLOCK' },
      { value: 'U', category: 'f-BLOCK' },
    ],
  },
  medium: {
    label: 'Medium',
    timeLimit: 75,
    mission: 'Pocket 7 Correct Blocks',
    tokens: [
      { value: 'H', category: 's-BLOCK' },
      { value: 'Li', category: 's-BLOCK' },
      { value: 'Na', category: 's-BLOCK' },
      { value: 'Mg', category: 's-BLOCK' },
      { value: 'K', category: 's-BLOCK' },
      { value: 'Ca', category: 's-BLOCK' },
      { value: 'B', category: 'p-BLOCK' },
      { value: 'C', category: 'p-BLOCK' },
      { value: 'O', category: 'p-BLOCK' },
      { value: 'Ne', category: 'p-BLOCK' },
      { value: 'Cl', category: 'p-BLOCK' },
      { value: 'Ar', category: 'p-BLOCK' },
      { value: 'Fe', category: 'd-BLOCK' },
      { value: 'Cu', category: 'd-BLOCK' },
      { value: 'Zn', category: 'd-BLOCK' },
      { value: 'Ag', category: 'd-BLOCK' },
      { value: 'Pt', category: 'd-BLOCK' },
      { value: 'La', category: 'f-BLOCK' },
      { value: 'Ce', category: 'f-BLOCK' },
      { value: 'U', category: 'f-BLOCK' },
    ],
  },
  hard: {
    label: 'Hard',
    timeLimit: 60,
    mission: 'Pocket 9 Correct Blocks',
    tokens: [
      { value: 'H', category: 's-BLOCK' },
      { value: 'Li', category: 's-BLOCK' },
      { value: 'Na', category: 's-BLOCK' },
      { value: 'Mg', category: 's-BLOCK' },
      { value: 'K', category: 's-BLOCK' },
      { value: 'Ca', category: 's-BLOCK' },
      { value: 'Rb', category: 's-BLOCK' },
      { value: 'B', category: 'p-BLOCK' },
      { value: 'C', category: 'p-BLOCK' },
      { value: 'O', category: 'p-BLOCK' },
      { value: 'Ne', category: 'p-BLOCK' },
      { value: 'P', category: 'p-BLOCK' },
      { value: 'S', category: 'p-BLOCK' },
      { value: 'Cl', category: 'p-BLOCK' },
      { value: 'Ar', category: 'p-BLOCK' },
      { value: 'Fe', category: 'd-BLOCK' },
      { value: 'Cu', category: 'd-BLOCK' },
      { value: 'Zn', category: 'd-BLOCK' },
      { value: 'Ag', category: 'd-BLOCK' },
      { value: 'Pt', category: 'd-BLOCK' },
      { value: 'La', category: 'f-BLOCK' },
      { value: 'Ce', category: 'f-BLOCK' },
      { value: 'U', category: 'f-BLOCK' },
      { value: 'Pu', category: 'f-BLOCK' },
    ],
  },
};

const categoryColors = {
  prime: '#7ef8ff',
  composite: '#ffb86a',
  even: '#86ffb5',
  odd: '#ff8bd5',
  's-BLOCK': '#69f0f7',
  'p-BLOCK': '#ffd166',
  'd-BLOCK': '#8a7dff',
  'f-BLOCK': '#ff6ab0',
};

const holeCategories = [
  { x: 110, y: 104, category: 'prime', label: 'PRIME' },
  { x: canvas.width - 110, y: 104, category: 'composite', label: 'COMPOSITE' },
  { x: 110, y: canvas.height - 104, category: 'odd', label: 'ODD' },
  { x: canvas.width - 110, y: canvas.height - 104, category: 'even', label: 'EVEN' },
];

function setScreen(screenId) {
  screens.forEach((screen) => {
    screen.classList.toggle('active', screen.id === screenId);
  });
  state.currentScreen = screenId;
}

function updateProfileBadges() {
  const levelBadge = document.getElementById('levelBadge');
  const xpBadge = document.getElementById('xpBadge');
  levelBadge.textContent = String(state.level);
  xpBadge.textContent = state.totalXP.toLocaleString();
}

function randomChoice(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function formatMiniTimer(value) {
  return `${Math.max(0, Math.ceil(value))}s`;
}

function updateMiniGameHud() {
  if (!state.miniGame) return;

  const gameConfig = {
    shapeHunter: { title: 'Shape Hunter', target: `FIND: ${state.miniGame.targetLabel || 'TRIANGLE'}` },
    numberCatcher: { title: 'Number Catcher', target: `TARGET: ${state.miniGame.targetNumber || 39}` },
    targetStrike: { title: 'Target Strike', target: state.miniGame.targetText || 'SHOOT ONLY PRIME NUMBERS' },
  };

  const config = gameConfig[state.miniGame.id] || gameConfig.shapeHunter;
  const title = document.getElementById('miniGameTitle');
  const score = document.getElementById('miniGameScore');
  const combo = document.getElementById('miniGameCombo');
  const accuracy = document.getElementById('miniGameAccuracy');
  const timer = document.getElementById('miniGameTimer');
  const target = document.getElementById('miniGameTarget');
  const expression = document.getElementById('miniGameExpression');

  if (title) title.textContent = config.title;
  if (score) score.textContent = String(state.miniGame.score || 0);
  if (combo) combo.textContent = `x${state.miniGame.combo || 1}`;
  if (timer) timer.textContent = formatMiniTimer(state.miniGame.timeLeft || 0);
  if (target) target.textContent = config.target;

  if (expression) {
    if (state.miniGame.id === 'numberCatcher') {
      expression.textContent = `Expression: ${state.miniGame.expression.join(' ') || '—'} = ${state.miniGame.expressionValue ?? '—'}`;
    } else if (state.miniGame.id === 'shapeHunter') {
      expression.textContent = `Status: ${state.miniGame.status || 'Hunt the target'}`;
    } else {
      expression.textContent = `Status: ${state.miniGame.status || 'Shoot only the correct targets'}`;
    }
  }

  const accuracyValue = Math.round((state.miniGame.correct / Math.max(1, state.miniGame.attempts)) * 100);
  if (accuracy) accuracy.textContent = `${accuracyValue}%`;
}

function completeMiniGame(resultLabel, xpEarned) {
  if (!state.miniGame) return;

  const gameId = state.miniGame.id;
  const currentBest = state.miniPlayerProgress[gameId]?.bestScore ?? 0;
  state.miniPlayerProgress[gameId] = {
    bestScore: Math.max(currentBest, state.miniGame.score),
    stars: Math.max(state.miniPlayerProgress[gameId]?.stars ?? 0, state.miniGame.stars || 1),
  };

  state.totalXP += xpEarned;
  state.level = Math.max(1, Math.floor(state.totalXP / 1200) + 1);
  updateProfileBadges();
  showToast(`${resultLabel} • +${xpEarned} XP`, 'success');
  setScreen('mini-player-screen');
  state.miniGame = null;
}

function showToast(message, type = 'success') {
  const toast = document.getElementById('feedback-toast');
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.classList.remove('hidden');
  window.clearTimeout(showToast.timerId);
  showToast.timerId = window.setTimeout(() => {
    toast.classList.add('hidden');
  }, 2600);
}

function setAimMode(mode) {
  state.aimMode = mode;
  document.querySelectorAll('.aim-mode').forEach((button) => {
    button.classList.toggle('active', button.dataset.aimMode === mode);
  });
}

function spawnFloatingText(x, y, text, color = '#7ef8ff') {
  state.floatingTexts.push({
    x,
    y,
    text,
    color,
    life: 46,
    vy: -1.2,
  });
}

function updateFloatingText() {
  state.floatingTexts = state.floatingTexts.filter((float) => {
    float.y += float.vy;
    float.life -= 1;
    float.vy *= 0.98;
    return float.life > 0;
  });
}

function renderWorldMap() {
  const map = document.getElementById('worldMap');
  if (!map) return;

  map.innerHTML = levelRoadmap.map((level) => {
    const stars = Array.from({ length: 3 }, (_, index) => '<span>★</span>').join('');
    return `
      <button class="world-node ${level.unlocked ? 'unlocked' : 'locked'}" data-level="${level.id}" ${level.unlocked ? '' : 'disabled'}>
        <small>${level.world}</small>
        <strong>Lv ${level.id}</strong>
        <span>${level.title}</span>
        <div class="star-row">${stars}</div>
        <small>+${level.reward} XP</small>
      </button>
    `;
  }).join('');

  map.querySelectorAll('.world-node.unlocked').forEach((node) => {
    node.addEventListener('click', () => {
      const selected = levelRoadmap.find((level) => level.id === Number(node.dataset.level));
      if (!selected) return;
      state.selectedSubject = selected.subject;
      state.selectedDifficulty = selected.difficulty;
      state.currentLevel = selected.id;
      setScreen('setup-screen');
      updateSetupLabels();
    });
  });
}

function formatTime(value) {
  const safeValue = Math.max(0, Math.ceil(value));
  const minutes = String(Math.floor(safeValue / 60)).padStart(2, '0');
  const seconds = String(safeValue % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function isPrime(value) {
  if (value < 2) return false;
  if (value === 2) return true;
  if (value % 2 === 0) return false;
  for (let factor = 3; factor * factor <= value; factor += 2) {
    if (value % factor === 0) return false;
  }
  return true;
}

function getExplanation(token) {
  if (token.type === 'number') {
    const value = Number(token.value);
    if (value === 1) return '1 is a special number: it is neither prime nor composite.';
    if (token.category === 'prime') return `${value} is prime because it has exactly two factors: 1 and itself.`;
    if (token.category === 'composite') return `${value} is composite because it has factors other than 1 and itself.`;
    if (token.category === 'even') return `${value} is even because it can be divided evenly by 2.`;
    return `${value} is odd because it cannot be divided evenly by 2.`;
  }

  const map = {
    's-BLOCK': `${token.value} belongs to the s-block because its outer electron enters an s orbital.`,
    'p-BLOCK': `${token.value} belongs to the p-block because its valence electrons occupy a p orbital.`,
    'd-BLOCK': `${token.value} belongs to the d-block because it is a transition metal.`,
    'f-BLOCK': `${token.value} belongs to the f-block because it is a lanthanide or actinide series element.`,
  };

  return map[token.category] || `${token.value} is classified by its electron block.`;
}

function getDifficultyConfig(subject) {
  if (subject === 'periodic') {
    return periodicConfig[state.selectedDifficulty] || periodicConfig.easy;
  }
  return difficultySettings[state.selectedDifficulty] || difficultySettings.easy;
}

function getCategorySummary() {
  const categories = state.gameConfig?.subject === 'periodic'
    ? ['s-BLOCK', 'p-BLOCK', 'd-BLOCK', 'f-BLOCK']
    : ['prime', 'composite', 'even', 'odd'];

  return categories.reduce((summary, category) => {
    summary[category] = { correct: 0, total: 0 };
    return summary;
  }, {});
}

function updateHud() {
  const accuracy = state.attempts === 0 ? 100 : Math.round((state.correct / state.attempts) * 100);
  const remaining = state.tokens.length;

  document.getElementById('scoreValue').textContent = state.score.toString();
  document.getElementById('xpValue').textContent = state.runXP.toString();
  document.getElementById('comboValue').textContent = `x${state.combo}`;
  document.getElementById('accuracyValue').textContent = `${accuracy}%`;
  document.getElementById('remainingValue').textContent = String(remaining);
  document.getElementById('timerValue').textContent = formatTime(state.timeLeft);
  document.getElementById('missionValue').textContent = state.missionLabel;
}

function updateSetupLabels() {
  const label = document.getElementById('setupSubjectLabel');
  label.textContent = subjectLookup[state.selectedSubject]?.name || 'Numbers';

  document.querySelectorAll('.difficulty-card').forEach((button) => {
    button.classList.toggle('active', button.dataset.difficulty === state.selectedDifficulty);
  });
}

function selectSubject(subject) {
  if (subject === 'biology' || subject === 'geography' || subject === 'cs') {
    showToast('That module is coming soon in the next build.', 'error');
    return;
  }

  state.selectedSubject = subject;
  setScreen('setup-screen');
  updateSetupLabels();
}

function selectDifficulty(difficulty) {
  state.selectedDifficulty = difficulty;
  updateSetupLabels();
}

function handleAction(event) {
  const action = event.currentTarget.dataset.action;

  if (action === 'start-game') {
    setScreen('world-screen');
    return;
  }

  if (action === 'subject-select') {
    setScreen('subject-screen');
    return;
  }

  if (action === 'daily-challenge') {
    state.selectedSubject = 'numbers';
    state.selectedDifficulty = 'medium';
    updateSetupLabels();
    beginGame();
    return;
  }

  if (action === 'leaderboard') {
    showToast('Leaderboard: Ava 2430 • Leo 2020 • Sam 1980', 'success');
    return;
  }

  if (action === 'profile') {
    showToast(`Profile: Level ${state.level} • ${state.totalXP.toLocaleString()} XP • 7-day streak`, 'success');
    return;
  }

  if (action === 'mini-player') {
    setScreen('mini-player-screen');
  }
}

function onHomeBack() {
  setScreen('home-screen');
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function setMissionLabel() {
  const config = state.gameConfig || {};
  state.missionLabel = config.mission || 'Collect the right tokens';
}

function buildTokensForGame(subject, difficultyKey) {
  const tokenList = subject === 'periodic'
    ? periodicConfig[difficultyKey]?.tokens || periodicConfig.easy.tokens
    : difficultySettings[difficultyKey]?.tokens || difficultySettings.easy.tokens;

  return tokenList.map((token, index) => ({
    ...token,
    id: `${subject}-${difficultyKey}-${token.value}-${index}`,
    type: subject === 'periodic' ? 'element' : 'number',
    radius: subject === 'periodic' ? 18 : 16,
    category: token.category,
  }));
}

function createBoard() {
  if (!state.engine) {
    state.engine = Engine.create();
    state.engine.world.gravity.y = 0;
  } else {
    World.clear(state.engine.world, false);
    state.engine.timing.timeScale = 1;
  }

  const width = canvas.width;
  const height = canvas.height;
  const boardLeft = 80;
  const boardTop = 90;
  const boardRight = width - 80;
  const boardBottom = height - 75;
  const wallThickness = 30;

  const walls = [
    Bodies.rectangle(width / 2, -wallThickness / 2, width, wallThickness, { isStatic: true }),
    Bodies.rectangle(width / 2, height + wallThickness / 2, width, wallThickness, { isStatic: true }),
    Bodies.rectangle(-wallThickness / 2, height / 2, wallThickness, height, { isStatic: true }),
    Bodies.rectangle(width + wallThickness / 2, height / 2, wallThickness, height, { isStatic: true }),
    Bodies.rectangle(width / 2, boardTop - 20, width - 220, 14, { isStatic: true, render: { visible: false } }),
    Bodies.rectangle(width / 2, boardBottom + 20, width - 220, 14, { isStatic: true, render: { visible: false } }),
    Bodies.rectangle(boardLeft - 20, height / 2, 14, height - 190, { isStatic: true, render: { visible: false } }),
    Bodies.rectangle(boardRight + 20, height / 2, 14, height - 190, { isStatic: true, render: { visible: false } }),
  ];

  World.add(state.engine.world, walls);

  const holes = [
    { x: 110, y: 104, category: 'prime', label: 'PRIME' },
    { x: width - 110, y: 104, category: 'composite', label: 'COMPOSITE' },
    { x: 110, y: height - 104, category: 'odd', label: 'ODD' },
    { x: width - 110, y: height - 104, category: 'even', label: 'EVEN' },
  ];

  if (state.gameConfig?.subject === 'periodic') {
    holes[0].category = 's-BLOCK';
    holes[1].category = 'p-BLOCK';
    holes[2].category = 'f-BLOCK';
    holes[3].category = 'd-BLOCK';
    holes[0].label = 's-BLOCK';
    holes[1].label = 'p-BLOCK';
    holes[2].label = 'f-BLOCK';
    holes[3].label = 'd-BLOCK';
  }

  state.holes = holes;

  const striker = Bodies.circle(width / 2, height - 90, 25, {
    restitution: 0.92,
    friction: 0.02,
    frictionAir: 0.005,
    density: 0.003,
    label: 'striker',
    isStatic: false,
  });

  Body.setInertia(striker, Infinity);
  World.add(state.engine.world, striker);
  state.striker = striker;
}

function repositionStriker() {
  if (!state.striker) return;
  Body.setPosition(state.striker, { x: canvas.width / 2, y: canvas.height - 90 });
  Body.setVelocity(state.striker, { x: 0, y: 0 });
  Body.setAngularVelocity(state.striker, 0);
  state.aimLine = null;
}

function createTokenBodies() {
  const subject = state.gameConfig.subject;
  const tokenList = buildTokensForGame(subject, state.selectedDifficulty);
  const boardCenterX = canvas.width / 2;
  const boardCenterY = canvas.height / 2;

  state.tokens = tokenList.map((token, index) => {
    const x = boardCenterX + ((index % 5) - 2) * 62 + (index % 2 === 0 ? 30 : -20);
    const y = boardCenterY + Math.floor(index / 5) * 52 - 70;

    const body = Bodies.circle(x, y, token.type === 'element' ? 20 : 18, {
      label: String(token.value),
      restitution: 0.96,
      friction: 0.015,
      frictionAir: 0.006,
      density: 0.002,
      render: { fillStyle: categoryColors[token.category] },
    });

    body.token = token;
    body.tokenType = token.type;
    body.category = token.category;
    body.textLabel = String(token.value);
    body.isToken = true;

    if (state.selectedDifficulty === 'hard') {
      const velocity = randomBetween(-1.2, 1.2);
      Body.setVelocity(body, { x: velocity, y: randomBetween(-1.1, 1.1) });
    }

    return body;
  });

  World.add(state.engine.world, state.tokens);
}

function handleFoul(reason, details = '') {
  if (state.turnLocked) return;
  state.turnLocked = true;
  state.combo = 1;

  const penalty = reason === 'striker' ? 10 : reason === 'timeout' ? 5 : 8;
  state.score = Math.max(0, state.score - penalty);
  state.runXP = Math.max(0, state.runXP - penalty);

  const messages = {
    striker: 'FOUL\nStriker Pocketed',
    wrongPocket: `WRONG POCKET\n${details}`,
    timeout: 'TIME OUT',
    invalid: 'INVALID SHOT',
  };

  const title = messages[reason] || 'FOUL';
  const explanation = reason === 'wrongPocket'
    ? `${details} ${details.includes('is') ? '' : 'Try a different angle.'}`
    : reason === 'striker'
      ? 'The striker is out of play. Reset and try again.'
      : reason === 'timeout'
        ? 'The turn timed out. Reset and re-aim.'
        : 'Shot rejected. Wait for the board to settle.';

  showToast(`${title} • -${penalty} • ${explanation}`, 'error');
  playTone('mistake');
  if (state.striker) {
    Body.setVelocity(state.striker, { x: 0, y: 0 });
    Body.setPosition(state.striker, { x: canvas.width / 2, y: canvas.height - 90 });
  }
  state.shotInProgress = false;
  state.draggingStriker = false;
  state.aimLine = null;
  state.turnLocked = false;
  updateHud();
}

function processPocketedToken(tokenBody) {
  const token = tokenBody.token;
  const pocket = state.holes.find((hole) => {
    return Math.hypot(tokenBody.position.x - hole.x, tokenBody.position.y - hole.y) < 34;
  });

  if (!pocket) return;

  const expectedCategory = token.category;
  const isCorrect = pocket.category === expectedCategory;
  state.attempts += 1;

  if (!state.categoryStats[token.category]) {
    state.categoryStats[token.category] = { correct: 0, total: 0 };
  }
  state.categoryStats[token.category].total += 1;

  if (isCorrect) {
    state.correct += 1;
    state.categoryStats[token.category].correct += 1;
    const reward = 10 + Math.max(0, state.combo - 1) * 10;
    state.score += reward;
    state.runXP += reward;
    state.combo = Math.min(9, state.combo + 1);
    state.bestCombo = Math.max(state.bestCombo, state.combo);
    state.missionCount = (state.missionCount || 0) + 1;
    spawnFloatingText(tokenBody.position.x, tokenBody.position.y - 18, `+${reward}`, '#8af7d5');
    showToast(`${token.value || token.symbol} → ${pocket.label} → +${reward} XP`, 'success');
    playTone('success');
    burstParticles(tokenBody.position.x, tokenBody.position.y, categoryColors[token.category]);

    if (state.missionCount >= (state.missionTarget || 5)) {
      state.score += 40;
      state.runXP += 40;
      spawnFloatingText(tokenBody.position.x, tokenBody.position.y - 28, '+40 BONUS', '#ffd166');
      showToast('Mission complete! +40 bonus', 'success');
      playTone('bonus');
      state.missionTarget = state.missionTarget + 3;
    }
  } else {
    state.combo = 1;
    state.score = Math.max(0, state.score - 8);
    state.runXP = Math.max(0, state.runXP - 8);
    const explanation = getExplanation(token);
    showToast(`${token.value || token.symbol} → ${pocket.label} → WRONG • ${explanation}`, 'error');
    playTone('mistake');
    burstParticles(tokenBody.position.x, tokenBody.position.y, '#ff6e71');
  }

  World.remove(state.engine.world, tokenBody);
  state.tokens = state.tokens.filter((body) => body !== tokenBody);

  updateHud();
}

function updateGamePhysics() {
  if (!state.activeGame || !state.engine) return;

  Engine.update(state.engine, 1000 / 60);

  const remainingBodies = [...state.tokens, state.striker];
  remainingBodies.forEach((body) => {
    if (!body || body.isDestroyed) return;
    if (body.label === 'striker' || body.isToken) {
      for (const hole of state.holes) {
        const distance = Math.hypot(body.position.x - hole.x, body.position.y - hole.y);
        if (distance < 26) {
          if (body.isToken) {
            processPocketedToken(body);
          } else if (body.label === 'striker') {
            handleFoul('striker', 'Striker Pocketed');
          }
        }
      }
    }
  });

  if (state.striker) {
    const speed = Math.hypot(state.striker.velocity.x, state.striker.velocity.y);
    const frictionValue = state.shotInProgress ? 0.003 : 0.0015;
    Body.setVelocity(state.striker, {
      x: state.striker.velocity.x * (1 - frictionValue),
      y: state.striker.velocity.y * (1 - frictionValue),
    });

    if (state.shotInProgress && speed < 0.18) {
      state.shotInProgress = false;
      repositionStriker();
    }
  }

  if (state.particles.length) {
    state.particles = state.particles.filter((particle) => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life -= 0.04;
      particle.vy += 0.06;
      return particle.life > 0;
    });
  }

  if (state.tokens.length && Date.now() - state.lastNearMiss > 1800) {
    const nearMiss = state.tokens.find((body) => {
      const target = state.holes.find((hole) => hole.category === body.category);
      if (!target) return false;
      return Math.hypot(body.position.x - target.x, body.position.y - target.y) < 48;
    });

    if (nearMiss) {
      state.lastNearMiss = Date.now();
      showToast('So close! Try a different angle.', 'success');
    }
  }

  updateFloatingText();

  if (state.tokens.length === 0 && state.activeGame) {
    endGame();
  }
}

function beginGame() {
  state.score = 0;
  state.runXP = 0;
  state.combo = 1;
  state.bestCombo = 1;
  state.correct = 0;
  state.attempts = 0;
  state.categoryStats = getCategorySummary();
  state.missionCount = 0;
  state.activeGame = true;
state.turnLocked = false;
state.practiceFocus = state.practiceFocus || null;
state.gameConfig = {
  subject: state.selectedSubject,
  difficulty: state.selectedDifficulty,
  mission: getDifficultyConfig(state.selectedSubject).mission,
};

if (state.selectedSubject === 'numbers') {
  state.gameConfig.mission = state.selectedDifficulty === 'easy'
    ? 'Pocket 5 Prime Numbers'
    : state.selectedDifficulty === 'medium'
      ? 'Pocket 8 Correct Answers'
      : 'Pocket 10 Correct Answers';
} else {
  state.gameConfig.mission = state.selectedDifficulty === 'easy'
    ? 'Pocket 5 s-BLOCK Elements'
    : state.selectedDifficulty === 'medium'
      ? 'Pocket 7 Correct Blocks'
      : 'Pocket 9 Correct Blocks';
}

state.missionTarget = 5;
state.missionLabel = state.gameConfig.mission;
state.timeLeft = getDifficultyConfig(state.selectedSubject).timeLimit;
state.countdown = 3;

createBoard();
createTokenBodies();
updateHud();
showCountdown();
setScreen('game-screen');
}

function showCountdown() {
const overlay = document.getElementById('countdownOverlay');
const text = document.getElementById('countdownText');
const mission = document.getElementById('countdownMission');
const label = state.currentLevel ? `Level ${state.currentLevel}` : 'Ready';

if (state.countdownTimer) {
  window.clearInterval(state.countdownTimer);
}

text.textContent = String(state.countdown || 3);
mission.textContent = state.missionLabel;
overlay.classList.remove('hidden');
document.querySelector('.countdown-label').textContent = label;
state.countdownTimer = window.setInterval(() => {
  state.countdown = Math.max(0, (state.countdown || 0) - 1);
  text.textContent = String(state.countdown);
  if (state.countdown <= 0) {
    window.clearInterval(state.countdownTimer);
    overlay.classList.add('hidden');
    state.countdown = null;
    state.turnLocked = false;
    showToast('Ready! Strike!', 'success');
  }
}, 700);
}

function endGame() {
  if (!state.activeGame) return;
  state.activeGame = false;
  const accuracy = state.attempts === 0 ? 100 : Math.round((state.correct / state.attempts) * 100);
  const totalXP = state.runXP;
  state.totalXP += totalXP;
  state.level = Math.max(1, Math.floor(state.totalXP / 1200) + 1);
  updateProfileBadges();

  document.getElementById('finalScoreValue').textContent = state.score.toString();
  document.getElementById('resultsAccuracy').textContent = `${accuracy}%`;
  document.getElementById('resultsXP').textContent = totalXP.toString();
  document.getElementById('resultsCombo').textContent = `x${state.bestCombo}`;
  document.getElementById('resultsTime').textContent = formatTime(90 - state.timeLeft);

  const resultTitle = accuracy >= 80 ? 'Excellent run' : accuracy >= 60 ? 'Solid grasp' : 'Keep training';
  document.getElementById('resultTitle').textContent = resultTitle;
  document.getElementById('resultSummary').textContent = state.selectedSubject === 'numbers'
    ? 'You are building control over number classification and quick decision-making.'
    : 'You are building strong element-block recognition under pressure.';

  renderAnalysis();
  setScreen('results-screen');
}

function renderAnalysis() {
  const summary = state.selectedSubject === 'numbers'
    ? {
        'Prime Numbers': 78,
        'Composite Numbers': 84,
        'Even Numbers': 91,
        'Odd Numbers': 63,
      }
    : {
        's-BLOCK': 88,
        'p-BLOCK': 77,
        'd-BLOCK': 85,
        'f-BLOCK': 58,
      };

  const breakdown = Object.entries(summary).map(([label, value]) => {
    return `
      <div class="skill-row">
        <div class="skill-head">
          <span>${label}</span>
          <strong>${value}%</strong>
        </div>
        <div class="skill-bar"><div class="skill-fill" style="width: ${value}%"></div></div>
      </div>
    `;
  }).join('');

  document.getElementById('skillBreakdown').innerHTML = breakdown;

  const overallScore = Math.min(99, Math.max(52, Math.round((state.correct / Math.max(1, state.attempts)) * 100)));
  document.getElementById('overallScoreValue').textContent = `${overallScore}%`;

  const weakConcept = state.selectedSubject === 'numbers' ? 'Odd Numbers' : 'f-BLOCK';
  const strongConcept = state.selectedSubject === 'numbers' ? 'Prime and Even numbers' : 's-BLOCK';
  document.getElementById('aiRecommendation').textContent = `You are strong at ${strongConcept}. Practice ${weakConcept} for 5 minutes to improve mastery.`;

  const practiceTitle = state.selectedSubject === 'numbers' ? 'Odd Numbers Booster' : 'f-BLOCK Focus';
  const practiceCopy = state.selectedSubject === 'numbers'
    ? 'Target odd numbers and sharpen your pattern recognition with a quick precision round.'
    : 'Review the actinide and lanthanide categories with a short focused challenge.';

  document.getElementById('practiceTitle').textContent = practiceTitle;
  document.getElementById('practiceCopy').textContent = practiceCopy;

  document.getElementById('practiceStats').innerHTML = `
    <span class="stat-pill">Accuracy: ${overallScore}%</span>
    <span class="stat-pill">Weakest: ${weakConcept}</span>
    <span class="stat-pill">XP: ${state.runXP}</span>
  `;
}

function burstParticles(x, y, color) {
  for (let index = 0; index < 12; index += 1) {
    state.particles.push({
      x,
      y,
      vx: randomBetween(-3, 3),
      vy: randomBetween(-3, 3),
      size: randomBetween(3, 8),
      color,
      life: randomBetween(20, 30),
    });
  }
}

function playTone(kind) {
  const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextConstructor) return;

  const audioContext = new AudioContextConstructor();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.connect(gain);
  gain.connect(audioContext.destination);

  const frequency = kind === 'success' ? 660 : kind === 'bonus' ? 860 : 220;
  oscillator.type = kind === 'mistake' ? 'sawtooth' : 'triangle';
  oscillator.frequency.value = frequency;
  gain.gain.value = 0.04;

  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.12);
}

function drawBoard() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!state.engine || !state.engine.world) {
    return;
  }

  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#7bd8b2');
  gradient.addColorStop(0.4, '#3ea972');
  gradient.addColorStop(1, '#1d6e45');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  for (let i = 0; i < 12; i += 1) {
    const starX = (i * 91 + 50) % (canvas.width - 80) + 45;
    const starY = 40 + (i % 4) * 24;
    ctx.beginPath();
    ctx.arc(starX, starY, 2 + (i % 3), 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = 'rgba(255,255,255,0.10)';
  ctx.beginPath();
  ctx.ellipse(160, 90, 110, 26, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(750, 120, 120, 28, 0, 0, Math.PI * 2);
  ctx.fill();

  const woodDepth = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  woodDepth.addColorStop(0, '#1c6f46');
  woodDepth.addColorStop(1, '#12623d');

  ctx.beginPath();
  ctx.roundRect(45, 70, canvas.width - 90, canvas.height - 120, 32);
  ctx.fillStyle = woodDepth;
  ctx.fill();
  ctx.lineWidth = 8;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.stroke();

  const innerBoard = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  innerBoard.addColorStop(0, '#1ca368');
  innerBoard.addColorStop(1, '#188d59');
  ctx.beginPath();
  ctx.roundRect(92, 115, canvas.width - 186, canvas.height - 210, 28);
  ctx.fillStyle = innerBoard;
  ctx.fill();

  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.stroke();

  state.holes?.forEach((hole) => {
    ctx.beginPath();
    ctx.arc(hole.x, hole.y, 30, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(29, 18, 16, 0.8)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(hole.x, hole.y, 13, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.72)';
    ctx.font = '700 12px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(hole.label, hole.x, hole.y + 5);
  });

  if (state.aimLine && state.striker) {
    const lineLength = Math.hypot(state.aimLine.x - state.striker.position.x, state.aimLine.y - state.striker.position.y);
    const angle = Math.atan2(state.aimLine.y - state.striker.position.y, state.aimLine.x - state.striker.position.x);

    ctx.beginPath();
    ctx.moveTo(state.striker.position.x, state.striker.position.y);
    ctx.lineTo(state.aimLine.x, state.aimLine.y);
    ctx.strokeStyle = 'rgba(105, 240, 247, 0.8)';
    ctx.lineWidth = 3;
    ctx.setLineDash([12, 12]);
    ctx.stroke();
    ctx.setLineDash([]);

    const dotCount = Math.max(4, Math.floor(lineLength / 28));
    for (let i = 0; i <= dotCount; i += 1) {
      const t = i / dotCount;
      const x = state.striker.position.x + Math.cos(angle) * lineLength * t;
      const y = state.striker.position.y + Math.sin(angle) * lineLength * t;
      ctx.beginPath();
      ctx.fillStyle = i === 0 ? '#fff' : 'rgba(105, 240, 247, 0.6)';
      ctx.arc(x, y, i === 0 ? 4 : 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  state.particles.forEach((particle) => {
    ctx.beginPath();
    ctx.fillStyle = particle.color;
    ctx.globalAlpha = Math.max(particle.life / 30, 0.1);
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  });

  state.floatingTexts.forEach((float) => {
    ctx.font = '800 16px Inter';
    ctx.fillStyle = float.color;
    ctx.globalAlpha = Math.max(float.life / 46, 0.15);
    ctx.fillText(float.text, float.x, float.y);
    ctx.globalAlpha = 1;
  });

  const allBodies = Composite.allBodies(state.engine?.world || {});
  allBodies.forEach((body) => {
    if (body.label === 'striker') {
      ctx.beginPath();
      ctx.arc(body.position.x, body.position.y, body.circleRadius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.96)';
      ctx.shadowColor = 'rgba(105, 240, 247, 0.8)';
      ctx.shadowBlur = 18;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(body.position.x, body.position.y, 11, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(53, 64, 255, 0.7)';
      ctx.fill();
      return;
    }

    if (body.isToken) {
      const fill = categoryColors[body.category] || '#d8f0ff';
      ctx.beginPath();
      ctx.arc(body.position.x, body.position.y, body.circleRadius, 0, Math.PI * 2);
      ctx.fillStyle = fill;
      ctx.shadowColor = fill;
      ctx.shadowBlur = 18;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(255,255,255,0.45)';
      ctx.stroke();

      ctx.fillStyle = '#0b1a21';
      ctx.font = '800 14px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(String(body.textLabel), body.position.x, body.position.y + 5);
    }
  });
}

function findNearestAssistTarget() {
  if (!state.tokens || !state.tokens.length) return null;

  const striker = state.striker;
  if (!striker) return null;

  let bestTarget = null;
  let bestDistance = Infinity;

  state.tokens.forEach((body) => {
    const expected = body.category;
    const targetCategory = state.gameConfig?.subject === 'periodic' ? expected : expected;
    const pocket = state.holes.find((hole) => hole.category === targetCategory);
    if (!pocket) return;
    const distance = Math.hypot(body.position.x - striker.position.x, body.position.y - striker.position.y);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestTarget = body;
    }
  });

  return bestTarget;
}

function clampShotAngle(angle, assistStrength) {
  const target = findNearestAssistTarget();
  if (!target) return angle;

  const targetAngle = Math.atan2(target.position.y - state.striker.position.y, target.position.x - state.striker.position.x);
  const diff = Math.atan2(Math.sin(targetAngle - angle), Math.cos(targetAngle - angle));
  return angle + diff * assistStrength;
}

function handlePointerDown(event) {
  if (!state.activeGame || !state.striker || state.shotInProgress || state.countdown !== null) return;

  const point = getCanvasPoint(event);
  const distance = Math.hypot(point.x - state.striker.position.x, point.y - state.striker.position.y);
  if (distance <= 34) {
    state.draggingStriker = true;
    state.dragOrigin = point;
  }
}

function handlePointerMove(event) {
  if (!state.draggingStriker || !state.striker) return;
  const point = getCanvasPoint(event);
  const dx = state.striker.position.x - point.x;
  const dy = state.striker.position.y - point.y;
  const magnitude = Math.hypot(dx, dy) || 1;

  const maxPull = 110;
  const pull = Math.min(magnitude, maxPull);
  const normalizedX = dx / magnitude;
  const normalizedY = dy / magnitude;

  state.dragPower = Math.min(1, pull / maxPull);
  state.aimLine = {
    x: state.striker.position.x + normalizedX * pull,
    y: state.striker.position.y + normalizedY * pull,
  };
}

function handlePointerUp(event) {
  if (!state.draggingStriker || !state.striker) return;

  const point = getCanvasPoint(event);
  const dx = state.striker.position.x - point.x;
  const dy = state.striker.position.y - point.y;
  const magnitude = Math.hypot(dx, dy) || 1;

  if (magnitude < 16) {
    state.draggingStriker = false;
    state.aimLine = null;
    return;
  }

  if (state.shotInProgress || state.countdown !== null) {
    state.draggingStriker = false;
    state.aimLine = null;
    return;
  }

  let shotPower = Math.min(18, magnitude * 0.22 + 5);
  let forceX = (dx / magnitude) * shotPower;
  let forceY = (dy / magnitude) * shotPower;

  if (state.aimMode !== 'expert') {
    const assist = state.aimMode === 'beginner' ? 0.22 : 0.1;
    const target = findNearestAssistTarget();
    if (target) {
      const desiredAngle = Math.atan2(target.position.y - state.striker.position.y, target.position.x - state.striker.position.x);
      const currentAngle = Math.atan2(-forceY, -forceX);
      const diff = Math.atan2(Math.sin(desiredAngle - currentAngle), Math.cos(desiredAngle - currentAngle));
      const finalAngle = currentAngle + diff * assist;
      const speed = Math.hypot(forceX, forceY) || 1;
      forceX = -Math.cos(finalAngle) * speed;
      forceY = -Math.sin(finalAngle) * speed;
    }
  }

  Body.setVelocity(state.striker, { x: forceX, y: forceY });
  state.shotInProgress = true;
  state.draggingStriker = false;
  state.aimLine = null;
}

function getCanvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const x = (event.clientX - rect.left) * scaleX;
  const y = (event.clientY - rect.top) * scaleY;
  return { x, y };
}

function getMiniCanvasPoint(event) {
  if (!miniCanvas) return { x: 0, y: 0 };
  const rect = miniCanvas.getBoundingClientRect();
  const scaleX = miniCanvas.width / rect.width;
  const scaleY = miniCanvas.height / rect.height;
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  };
}

function evaluateMiniExpression(expression) {
  const safeExpression = expression.join(' ').replace(/×/g, '*').replace(/÷/g, '/');
  if (!safeExpression.trim()) return 0;

  try {
    return Function(`"use strict"; return (${safeExpression});`)();
  } catch (error) {
    return null;
  }
}

function startMiniGame(gameId) {
  if (!miniCanvas) return;

  const gamePresets = {
    shapeHunter: {
      title: 'Shape Hunter',
      timeLimit: 40,
      targetLabel: 'TRIANGLE',
      score: 0,
      combo: 1,
      correct: 0,
      attempts: 0,
      objects: [],
      targetShape: 'triangle',
      spawnTimer: 0.7,
      status: 'Find the triangle targets',
    },
    numberCatcher: {
      title: 'Number Catcher',
      timeLimit: 45,
      targetNumber: 39,
      score: 0,
      combo: 1,
      correct: 0,
      attempts: 0,
      objects: [],
      expression: [],
      expressionValue: 0,
      bucketX: miniCanvas.width / 2,
      spawnTimer: 0.8,
      status: 'Catch the numbers to reach the target',
    },
    targetStrike: {
      title: 'Target Strike',
      timeLimit: 40,
      targetText: 'SHOOT ONLY PRIME NUMBERS',
      score: 0,
      combo: 1,
      correct: 0,
      attempts: 0,
      objects: [],
      spawnTimer: 0.9,
      status: 'Hit only the correct values',
    },
  };

  const preset = gamePresets[gameId] || gamePresets.shapeHunter;
  state.miniGame = {
    ...preset,
    id: gameId,
    timeLeft: preset.timeLimit,
    stars: 1,
  };

  if (gameId === 'shapeHunter') {
    const shapes = ['triangle', 'circle', 'square', 'star', 'hexagon', 'rectangle'];
    state.miniGame.targetShape = randomChoice(['triangle', 'circle', 'square', 'star']);
    state.miniGame.targetLabel = state.miniGame.targetShape.toUpperCase();
  }

  setScreen('mini-game-screen');
  updateMiniGameHud();
}

function handleMiniGamePointer(event) {
  if (!state.miniGame || !miniCanvas) return;
  const point = getMiniCanvasPoint(event);

  if (state.miniGame.id === 'shapeHunter') {
    const shapeHit = [...state.miniGame.objects].reverse().find((shape) => {
      return Math.hypot(shape.x - point.x, shape.y - point.y) <= shape.size + 14;
    });

    if (!shapeHit) return;

    const isCorrect = shapeHit.type === state.miniGame.targetShape;
    state.miniGame.attempts += 1;

    if (isCorrect) {
      state.miniGame.correct += 1;
      state.miniGame.score += 10 + (state.miniGame.combo - 1) * 5;
      state.miniGame.combo = Math.min(8, state.miniGame.combo + 1);
      state.miniGame.status = `Nice! ${state.miniGame.targetLabel} found`;
      showToast(`+${10 + (state.miniGame.combo - 1) * 5} • ${state.miniGame.targetLabel}`, 'success');
    } else {
      state.miniGame.score = Math.max(0, state.miniGame.score - 5);
      state.miniGame.combo = 1;
      state.miniGame.status = `Wrong shape — try ${state.miniGame.targetLabel}`;
      showToast('Wrong shape • -5', 'error');
    }

    state.miniGame.objects = state.miniGame.objects.filter((shape) => shape.id !== shapeHit.id);
    updateMiniGameHud();
    return;
  }

  if (state.miniGame.id === 'numberCatcher') {
    const bucketPadding = 120;
    state.miniGame.bucketX = Math.min(miniCanvas.width - bucketPadding, Math.max(bucketPadding, point.x));
    return;
  }

  if (state.miniGame.id === 'targetStrike') {
    const target = [...state.miniGame.objects].reverse().find((item) => {
      return Math.hypot(item.x - point.x, item.y - point.y) <= item.size;
    });

    if (!target) return;

    state.miniGame.attempts += 1;
    const isCorrect = target.correct;

    if (isCorrect) {
      state.miniGame.correct += 1;
      state.miniGame.score += 10;
      state.miniGame.combo += 1;
      state.miniGame.status = 'Perfect hit!';
      showToast('+10 • Great shot', 'success');
    } else {
      state.miniGame.score = Math.max(0, state.miniGame.score - 5);
      state.miniGame.combo = 1;
      state.miniGame.status = 'Wrong target';
      showToast('-5 • Wrong target', 'error');
    }

    state.miniGame.objects = state.miniGame.objects.filter((item) => item.id !== target.id);
    updateMiniGameHud();
  }
}

function updateMiniGame(deltaSeconds) {
  if (!state.miniGame) return;

  const game = state.miniGame;
  game.timeLeft = Math.max(0, game.timeLeft - deltaSeconds);

  if (game.id === 'shapeHunter') {
    game.spawnTimer -= deltaSeconds;
    if (game.spawnTimer <= 0) {
      const shapeNames = ['triangle', 'circle', 'square', 'star', 'hexagon', 'rectangle'];
      const type = randomChoice(shapeNames);
      game.objects.push({
        id: `${game.id}-${Math.random().toString(16).slice(2)}`,
        type,
        x: randomBetween(80, miniCanvas.width - 80),
        y: -30,
        size: randomBetween(26, 42),
        vx: randomBetween(-18, 18),
        vy: randomBetween(110, 180),
        rotation: Math.random() * Math.PI * 2,
      });
      game.spawnTimer = 0.8;
    }

    game.objects.forEach((shape) => {
      shape.x += shape.vx * deltaSeconds;
      shape.y += shape.vy * deltaSeconds;
      shape.rotation += 0.04;
    });

    game.objects = game.objects.filter((shape) => shape.y < miniCanvas.height + 60);

    if (game.timeLeft <= 0) {
      const xp = Math.max(60, game.score + game.correct * 12);
      completeMiniGame('Shape Hunter cleared', xp);
      return;
    }
  }

  if (game.id === 'numberCatcher') {
    game.spawnTimer -= deltaSeconds;
    if (game.spawnTimer <= 0) {
      const numberOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 18, 20, 24, 30];
      const value = randomChoice(numberOptions);
      const isOperator = Math.random() < 0.18;
      game.objects.push({
        id: `${game.id}-${Math.random().toString(16).slice(2)}`,
        value: isOperator ? randomChoice(['+', '×', '−', '÷']) : value,
        x: randomBetween(80, miniCanvas.width - 80),
        y: -20,
        size: 18,
        isOperator: isOperator,
        vx: 0,
        vy: randomBetween(140, 180),
      });
      game.spawnTimer = 0.75;
    }

    const bucketLeft = game.bucketX - 70;
    const bucketRight = game.bucketX + 70;
    game.objects.forEach((item) => {
      item.y += item.vy * deltaSeconds;
      if (item.y >= miniCanvas.height - 90 && item.x >= bucketLeft && item.x <= bucketRight) {
        const tokenValue = item.isOperator ? item.value : String(item.value);
        if (item.isOperator || Number.isFinite(Number(item.value))) {
          game.expression.push(tokenValue);
          if (!item.isOperator) {
            game.expressionValue = evaluateMiniExpression(game.expression);
          }
        }
        game.score += 5;
        game.objects = game.objects.filter((shape) => shape.id !== item.id);
      }
    });

    if (game.expression.length >= 2) {
      const value = evaluateMiniExpression(game.expression);
      if (value !== null && Number(value) === game.targetNumber) {
        game.score += 20;
        game.correct += 1;
        game.status = 'Target complete!';
        showToast(`Target complete! ${game.targetNumber}`, 'success');
        game.expression = [];
        game.expressionValue = 0;
      }
    }

    if (game.timeLeft <= 0) {
      const xp = Math.max(90, game.score + game.correct * 18);
      completeMiniGame('Number Catcher complete', xp);
      return;
    }
  }

  if (game.id === 'targetStrike') {
    game.spawnTimer -= deltaSeconds;
    if (game.spawnTimer <= 0) {
      const values = ['H', 'Na', 'Fe', 'Cl', 'Mg', '7', '9', '12', '17', '21'];
      const value = randomChoice(values);
      const correct = Math.random() < 0.45;
      const isPrime = ['2', '7', '11', '13', '17', '19', '23', '29'];
      const strikeValue = correct ? randomChoice(['H', 'Na', 'Fe', '7', '13', '17']) : randomChoice(['Cl', 'Mg', '9', '21', '12']);
      const actualValue = correct ? strikeValue : value;
      game.objects.push({
        id: `${game.id}-${Math.random().toString(16).slice(2)}`,
        x: miniCanvas.width + 30,
        y: randomBetween(60, miniCanvas.height - 80),
        size: randomBetween(24, 34),
        vx: randomBetween(-150, -90),
        vy: randomBetween(-20, 20),
        value: actualValue,
        correct: correct,
      });
      game.spawnTimer = 1.1;
    }

    game.objects.forEach((item) => {
      item.x += item.vx * deltaSeconds;
      item.y += item.vy * deltaSeconds;
      if (item.y < 30 || item.y > miniCanvas.height - 30) item.vy *= -1;
    });

    game.objects = game.objects.filter((item) => item.x > -40);

    if (game.timeLeft <= 0) {
      const xp = Math.max(80, game.score + game.correct * 15);
      completeMiniGame('Target Strike cleared', xp);
      return;
    }
  }

  updateMiniGameHud();
}

function drawMiniGame() {
  if (!miniCanvas || !miniCtx || !state.miniGame) return;
  const canvasWidth = miniCanvas.width;
  const canvasHeight = miniCanvas.height;
  miniCtx.clearRect(0, 0, canvasWidth, canvasHeight);

  const background = miniCtx.createLinearGradient(0, 0, 0, canvasHeight);
  background.addColorStop(0, '#7dd0ff');
  background.addColorStop(0.35, '#dff9ff');
  background.addColorStop(1, '#e1ffcf');
  miniCtx.fillStyle = background;
  miniCtx.fillRect(0, 0, canvasWidth, canvasHeight);

  miniCtx.fillStyle = 'rgba(255,255,255,0.35)';
  for (let i = 0; i < 12; i += 1) {
    miniCtx.beginPath();
    miniCtx.arc(60 + i * 72, 50 + (i % 3) * 24, 4, 0, Math.PI * 2);
    miniCtx.fill();
  }

  if (state.miniGame.id === 'shapeHunter') {
    state.miniGame.objects.forEach((shape) => {
      miniCtx.save();
      miniCtx.translate(shape.x, shape.y);
      miniCtx.rotate(shape.rotation);
      miniCtx.beginPath();
      miniCtx.fillStyle = '#ff9d4d';
      if (shape.type === 'triangle') {
        miniCtx.moveTo(0, -shape.size);
        miniCtx.lineTo(shape.size, shape.size);
        miniCtx.lineTo(-shape.size, shape.size);
        miniCtx.closePath();
      } else if (shape.type === 'circle') {
        miniCtx.arc(0, 0, shape.size, 0, Math.PI * 2);
      } else if (shape.type === 'square') {
        miniCtx.rect(-shape.size, -shape.size, shape.size * 2, shape.size * 2);
      } else if (shape.type === 'rectangle') {
        miniCtx.rect(-shape.size * 1.3, -shape.size * 0.8, shape.size * 2.6, shape.size * 1.6);
      } else if (shape.type === 'star') {
        const spikes = 5;
        const outer = shape.size;
        const inner = shape.size * 0.5;
        for (let i = 0; i < spikes * 2; i += 1) {
          const angle = (Math.PI / spikes) * i - Math.PI / 2;
          const radius = i % 2 === 0 ? outer : inner;
          const px = Math.cos(angle) * radius;
          const py = Math.sin(angle) * radius;
          if (i === 0) miniCtx.moveTo(px, py);
          else miniCtx.lineTo(px, py);
        }
        miniCtx.closePath();
      } else {
        miniCtx.beginPath();
        for (let i = 0; i < 6; i += 1) {
          const angle = (Math.PI / 3) * i;
          const px = Math.cos(angle) * shape.size;
          const py = Math.sin(angle) * shape.size;
          if (i === 0) miniCtx.moveTo(px, py);
          else miniCtx.lineTo(px, py);
        }
        miniCtx.closePath();
      }
      miniCtx.fill();
      miniCtx.restore();
    });
  }

  if (state.miniGame.id === 'numberCatcher') {
    const bucketX = state.miniGame.bucketX || canvasWidth / 2;
    miniCtx.fillStyle = '#3d9eff';
    miniCtx.fillRect(bucketX - 70, canvasHeight - 60, 140, 26);
    miniCtx.fillStyle = '#c7edff';
    miniCtx.fillRect(bucketX - 65, canvasHeight - 90, 130, 28);

    state.miniGame.objects.forEach((item) => {
      miniCtx.fillStyle = item.isOperator ? '#ff9f45' : '#6dd3ff';
      miniCtx.beginPath();
      miniCtx.arc(item.x, item.y, item.size, 0, Math.PI * 2);
      miniCtx.fill();
      miniCtx.fillStyle = '#123b50';
      miniCtx.font = '700 18px Inter';
      miniCtx.textAlign = 'center';
      miniCtx.fillText(String(item.value), item.x, item.y + 6);
    });
  }

  if (state.miniGame.id === 'targetStrike') {
    state.miniGame.objects.forEach((item) => {
      miniCtx.fillStyle = item.correct ? '#72f7b0' : '#ff6e7f';
      miniCtx.beginPath();
      miniCtx.arc(item.x, item.y, item.size, 0, Math.PI * 2);
      miniCtx.fill();
      miniCtx.fillStyle = '#0d1f2b';
      miniCtx.font = '700 18px Inter';
      miniCtx.textAlign = 'center';
      miniCtx.fillText(String(item.value), item.x, item.y + 6);
    });
  }
}

function animate(timestamp) {
  if (!state.lastFrame) state.lastFrame = timestamp;
  const deltaSeconds = (timestamp - state.lastFrame) / 1000;
  state.lastFrame = timestamp;

  if (state.activeGame) {
    state.timeLeft = Math.max(0, state.timeLeft - deltaSeconds);
    updateGamePhysics();
    updateHud();

    if (state.timeLeft <= 0) {
      endGame();
    }
  }

  if (state.miniGame) {
    updateMiniGame(deltaSeconds);
    drawMiniGame();
  } else {
    drawBoard();
  }

  window.requestAnimationFrame(animate);
}

function attachEventListeners() {
  document.querySelectorAll('[data-action]').forEach((button) => {
    button.addEventListener('click', handleAction);
  });

  document.querySelectorAll('.subject-card.available').forEach((card) => {
    card.addEventListener('click', () => selectSubject(card.dataset.subject));
  });

  document.querySelectorAll('.difficulty-card').forEach((card) => {
    card.addEventListener('click', () => selectDifficulty(card.dataset.difficulty));
  });

  document.querySelectorAll('.back-home').forEach((button) => {
    button.addEventListener('click', onHomeBack);
  });

  document.getElementById('launchGame').addEventListener('click', beginGame);
  document.getElementById('checkAiAnalysis').addEventListener('click', () => setScreen('analysis-screen'));
  document.getElementById('playAgain').addEventListener('click', () => beginGame());
  document.querySelectorAll('.aim-mode').forEach((button) => {
    button.addEventListener('click', () => setAimMode(button.dataset.aimMode));
  });
  document.querySelectorAll('.world-node').forEach((node) => {
    node.addEventListener('click', () => {
      const level = levelRoadmap.find((item) => item.id === Number(node.dataset.level));
      if (!level || !level.unlocked) return;
      state.selectedSubject = level.subject;
      state.selectedDifficulty = level.difficulty;
      state.currentLevel = level.id;
      state.missionLabel = level.mission;
      beginGame();
    });
  });

  document.querySelectorAll('.mini-game-launch').forEach((button) => {
    button.addEventListener('click', () => startMiniGame(button.dataset.miniGame));
  });

  if (miniCanvas) {
    miniCanvas.addEventListener('pointerdown', handleMiniGamePointer);
  }

  document.getElementById('startPractice').addEventListener('click', () => {
    state.selectedSubject = 'numbers';
    state.selectedDifficulty = 'easy';
    state.practiceFocus = 'odd';
    state.gameConfig = { subject: 'numbers', difficulty: 'easy', mission: 'Pocket 5 Odd Numbers' };
    setScreen('practice-screen');
  });

  document.getElementById('practiceNow').addEventListener('click', () => {
    state.selectedSubject = 'numbers';
    state.selectedDifficulty = 'easy';
    state.missionLabel = 'Pocket 5 Odd Numbers';
    state.practiceFocus = 'odd';
    beginGame();
  });

  canvas.addEventListener('pointerdown', handlePointerDown);
  canvas.addEventListener('pointermove', handlePointerMove);
  window.addEventListener('pointerup', handlePointerUp);
}

function init() {
  updateProfileBadges();
  updateSetupLabels();
  renderWorldMap();
  setAimMode('beginner');
  setScreen('home-screen');
  attachEventListeners();
  state.holes = [...holeCategories];
  window.requestAnimationFrame(animate);
}

init();
