/* ==========================================================================
   MODUL 2: PIXEL-KIFESTŐ MEGLEPETÉS (24×14 RÉSZLETGAZDAG PIXEL COLORING)
   - 12 gondosan árnyalt, szerethető mesekönyvi pixel-art figura kevert sorrendben
   - Kényelmes ujj-ecset a gyors és élvezetes színezéshez (sarkokig tesztelve)
   - Intelligensen kitérő (Auto-Dodge) menüsáv: ha az ujj a menü felé közelít,
     a menü átköltözik a képernyő túloldalára, amíg a gyerek ott színez!
   ========================================================================== */

import { sound } from '../soundEngine.js';

const COLS = 24;
const ROWS = 14;
const TOTAL_CELLS = COLS * ROWS;

/**
 * 21 színű árnyalt mesekönyvi paletta.
 * Egyetlen kód sem hófehér (#ffffff), így az érintetlen fehér kockák
 * mindig egyértelműen megkülönböztethetők a már kiszínezett területektől.
 */
const PIXEL_PALETTE = {
  '.': '#bae6fd', // Világos égkék háttér
  s: '#7dd3fc',   // Élénk égkék
  S: '#0284c7',   // Mély tengerkék
  W: '#38bdf8',   // Hullámkék
  N: '#1e293b',   // Esti űrkék
  c: '#fef9c3',   // Napfényes pufi felhő krémfehér
  g: '#86efac',   // Világos réti fűzöld
  G: '#22c55e',   // Élénk fűzöld
  D: '#15803d',   // Sötét erdei levélzöld
  Y: '#facc15',   // Napsárga / arany
  y: '#fde047',   // Lágy citromsárga
  O: '#fb923c',   // Narancssárga
  o: '#ea580c',   // Cirmos/árnyék narancs
  R: '#ef4444',   // Élénkpiros
  r: '#b91c1c',   // Mélypiros árnyék
  P: '#f472b6',   // Élénk rózsaszín
  p: '#fbcfe8',   // Pufi rózsaszín pofi/fülbelső
  V: '#a855f7',   // Élénk lila
  M: '#fde68a',   // Meleg vanília krém
  T: '#b45309',   // Fahéjbarna
  t: '#78350f',   // Csokibarna
  A: '#94a3b8',   // Ezüstszürke
  K: '#0f172a'    // Kontúr / csillogó szem
};

/** 12 darab 24×14-es, szimmetrikus és árnyalt mesekönyvi pixel-art sablon */
const PIXEL_TEMPLATES = [
  {
    name: 'Cirmos Kiscica',
    rows: [
      '........................',
      '......oo........oo......',
      '.....oOOo......oOOo.....',
      '....oOppOoOOOOoOppOo....',
      '....oOOOOoOOOOoOOOOo....',
      '...oOOOOOOOOOOOOOOOOo...',
      '...oOOKKOOOOOOOOOKKOo...',
      '...ooOKKOOOPPOOOOKKoo...',
      '...oOOppOOOKKOOOppOOo...',
      '....ooOOOOOMMOOOOOoo....',
      '......oOOOMMMMOOOo..oo..',
      '.....oOOOOMMMMOOOOooOo..',
      'gggggoMMOOMMMMOOMMooOggg',
      'GGGGGGGGGGGGGGGGGGGGGGGG'
    ]
  },
  {
    name: 'Vidám Kiskutya',
    rows: [
      '........................',
      '....tttt........tttt....',
      '...ttTTTtMMMMMMtTTTtt...',
      '..ttTTTTMMMMMMMMTTTTtt..',
      '..ttTTTMMMMMMMMMMTTTtt..',
      '..ttTTMMKKMMMMKKMMTTtt..',
      '...ttTMMKKMMMMKKMMTtt...',
      '....tMMMMMMKKMMMMMMt....',
      '.....TMMMMKKKKMMMMT.....',
      '......TMMMMRRMMMMT......',
      '......RRRRRRRRRRRR......',
      '.....TMMMMYMMYMMMMT.....',
      'gggggTTMMTTTTTTMMTTggggg',
      'GGGGGGGGGGGGGGGGGGGGGGGG'
    ]
  },
  {
    name: 'Barátságos Dínó',
    rows: [
      '..............OOOO......',
      '.............OGGGGG.....',
      '............OGGGKGGG....',
      '............OGGGGGGGG...',
      '............OGGGGKKKK...',
      '...........OGGGGGGGG....',
      '.........OOGGGGGyyGG....',
      '.......OOGGGGGGGyyyG....',
      '.....OOGGGGGGGGGyyyGG...',
      '...OOGGGGGGGGGGGyyyG....',
      '..GGGGGGGGGGGGGGyyG.....',
      '...GGGG....DDD..DDD.....',
      'gggggGGggggDDDggDDDggggg',
      'DDDDGGGGGGGGGGGGGGGGDDDD'
    ]
  },
  {
    name: 'Színes Pillangó',
    rows: [
      '.........K....K.........',
      '..VVVV....K..K....VVVV..',
      '.VVPPVVV...KK...VVVPPVV.',
      '.VPPPPPVVV.KK.VVVPPPPPV.',
      '.VPYYPPPVVVKKVVVPPPYYPV.',
      '..VPPPPPPOOKKOOPPPPPPV..',
      '...VVVVVVVKKKKVVVVVVV...',
      '.....VVVVOOKKOOVVVV.....',
      '...VVOOOOOVKKVOOOOOVV...',
      '..VVOOYYOOVKKVOOYYOOVV..',
      '..VVOOOOOVVKKVVOOOOOVV..',
      '...VVVVVV..KK..VVVVVV...',
      'gggggggggggKKggggggggggg',
      'GGGGGGGGGGGGGGGGGGGGGGGG'
    ]
  },
  {
    name: 'Csillagközi Űrrakéta',
    rows: [
      'NNYNNNNNNNNRRNNNNNNNNyNN',
      'NNNNNNNNNNRRRRNNNNNNNNNN',
      'NNNNNyNNNRRRRRRNNNYNNNNN',
      'NNNNNNNNAMMMMMMANNNNNNNN',
      'NNNNNNNNAMMSSMMANNNNNNNN',
      'NNYNNNNNAMSSSSMANNNNNyNN',
      'NNNNNNNNAMMSSMMANNNNNNNN',
      'NNNNNNRRAMMMMMMARRNNNNNN',
      'NNNNNRRRAMMMMMMARRRNNNNN',
      'NNNNRRRRAAAAAAAARRRRNNNN',
      'NNNNRRNNNOOOOOONNNRRNNNN',
      'NNyNNNNNNOOYYOONNNNNNYNN',
      'NNNNNNNNNNOYYONNNNNNNNNN',
      'NNNNYNNNNNNYYNNNNNNyNNNN'
    ]
  },
  {
    name: 'Álmos Kisbagoly',
    rows: [
      '........................',
      '......tt........tt......',
      '.....tTTTTTTTTTTTTt.....',
      '....tTTyyyyTTyyyyTTt....',
      '....tTTyKKyTTyKKyTTt....',
      '....tTTyyyyOOyyyyTTt....',
      '...ttTTTTTTOOTTTTTTtt...',
      '..tttTTMMMMMMMMMMTTttt..',
      '..tttTTMTMMTTMMTMTTttt..',
      '...ttTTMMMMMMMMMMTTtt...',
      '.....TTTTMMMMMMTTTT.....',
      '........OO....OO........',
      'GGTTTTTTTTTTTTTTTTTTTTGG',
      'GGGDDDD..........DDDDGGG'
    ]
  },
  {
    name: 'Mosolygós Béka',
    rows: [
      '........................',
      '.....GGGG......GGGG.....',
      '....GGyyGG....GGyyGG....',
      '....GGKKGGGGGGGGKKGG....',
      '...GGGGGGGGGGGGGGGGGG...',
      '..GGGppGGGGGGGGGGppGGG..',
      '..GGGGGGKKKKKKKKGGGGGG..',
      '...GGGGGGGGGGGGGGGGGG...',
      '....GGGGyyyyyyyyGGGG....',
      '...GGGGGyyyyyyyyGGGGG...',
      '..GGGGGGyyyyyyyyGGGGGG..',
      'WWWWDDDDDDDDDDDDDDDDWWWW',
      'WWDDDDDDDDDDDDDDDDDDDDWW',
      'SSSSSSSSSSSSSSSSSSSSSSSS'
    ]
  },
  {
    name: 'Édes Piros Eper',
    rows: [
      '...........DD...........',
      '..........DDDD..........',
      '......GGGGDDDDGGGG......',
      '.....GGGGGGGGGGGGGG.....',
      '....RRRRGGRRRRGGRRRR....',
      '...RRRRyRRRRRRRRyRRRR...',
      '...RRRRRRRRyyRRRRRRRR...',
      '....RRyRRRRRRRRRRyRR....',
      '....RRRRRRyRRyRRRRRR....',
      '.....RRRRRRRRRRRRRR.....',
      '......RRRyRRRRyRRR......',
      '.......RRRRRRRRRR.......',
      '........RRRRRRRR........',
      '..........RRRR..........'
    ]
  },
  {
    name: 'Vitorlás Kishajó',
    rows: [
      '...........TRRR.........',
      '..........MT............',
      '.........MMT.RR.........',
      '........MMMT.RRR........',
      '.......MMMMT.RRRR.......',
      '......MMMMMT.RRRRR......',
      '.....MMMMMMT.RRRRRR.....',
      '....MMMMMMMT.RRRRRRR....',
      '...........T............',
      '...TTTTTTTTTTTTTTTTTT...',
      '....TTTTYMMYYMMYTTTT....',
      '.....TTTTTTTTTTTTTT.....',
      'ssWWssTTTTTTTTTTTTssWWss',
      'SSSSSSSSSSSSSSSSSSSSSSSS'
    ]
  },
  {
    name: 'Pöttyös Gombaházikó',
    rows: [
      '.........RRRRRR.........',
      '......RRRMMRRRRMMRRR....',
      '...RRRRMMRRRRRRMMRRRR...',
      '..RRRRRRRRRRRRRRRRRRRR..',
      '.RRRMMRRRRRMMRRRRRMMRRR.',
      '.RRRRRRRRRRRRRRRRRRRRRR.',
      '..rrrrrrrrrrrrrrrrrrrr..',
      '......MMMMMMMMMMMM......',
      '......MMYYMMMMYYMM......',
      '......MMYYMMMMYYMM......',
      '......MMMMTTTTMMMM......',
      '.....MMMMMTTTTMMMMM.....',
      'gggggMMMMMTTTTMMMMMggggg',
      'GGGGGGGGGGGGGGGGGGGGGGGG'
    ]
  },
  {
    name: 'Szivárvány és Felhők',
    rows: [
      'ssssssssssssssssssssssss',
      'sssssssRRRRRRRRRRsssssss',
      'sssssRRROOOOOOOORRRsssss',
      'ssssRROOYYYYYYYYOORRssss',
      'sssRROOYYGGGGGGYYOORRsss',
      'ssRROOYYGGSSSSGGYYOORRss',
      'ssRROOYGGSSVVSSGGYOORRss',
      'sRROOYYGSSVVVVSSGYYOORRs',
      'sRROOYGGSVVssVVSGGYOORRs',
      'ssccccssSVssssVSssccccss',
      'scccccccccsssscccccccccs',
      'sccccccccccssccccccccccs',
      'ssccccccccssssccccccccss',
      'ssssssssssssssssssssssss'
    ]
  },
  {
    name: 'Mosolygós Napocska',
    rows: [
      '....O......OO......O....',
      '.....OO...YYYY...OO.....',
      '......O.YYYYYYYY.O......',
      '.......YYYYYYYYYY.......',
      '..OO..YYKKYYYYKKYY..OO..',
      '....O.YYKKYYYYKKYY.O....',
      '.....YYYppYYYYppYYY.....',
      '......YYYYKKKKYYYY......',
      '....O..YYYYYYYYYY..O....',
      '...OO....YYYYYY....OO...',
      'gggggggg..OOOO..gggggggg',
      'gggggggggggggggggggggggg',
      'GGGGGGGGGGGGGGGGGGGGGGGG',
      'DDDDGGGGGGGGGGGGGGGGDDDD'
    ]
  }
];

const CELEBRATE_DURATION_MS = 4000;

let listenersBound = false;
let onModuleComplete = null;
let celebrateRafId = null;
let celebrateStartTime = 0;
let isPointerDown = false;
let lastPoint = null;
let lastSoundStep = 0;

/** Kevert pakli (shuffle bag), hogy mind a 12 figura sorra kerüljön ismétlés nélkül */
/** @type {number[]} */
let templateDeck = [];

/** @type {HTMLElement[]} */
let cellElements = [];

const state = {
  isPlaying: false,
  isCelebrating: false,
  filledCount: 0,
  coveredPercent: 0,
  completed: false,
  hudDockedBottom: false,
  currentTemplate: PIXEL_TEMPLATES[0]
};

function drawNextTemplate() {
  if (templateDeck.length === 0) {
    templateDeck = PIXEL_TEMPLATES.map((_, i) => i);
    for (let i = templateDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = templateDeck[i];
      templateDeck[i] = templateDeck[j];
      templateDeck[j] = tmp;
    }
    // Ha az új pakli teteje pont az előző sablon lenne, cseréljük meg az utolsóval
    if (
      templateDeck.length > 1 &&
      PIXEL_TEMPLATES[templateDeck[templateDeck.length - 1]] === state.currentTemplate
    ) {
      const top = templateDeck.pop();
      if (top !== undefined) templateDeck.unshift(top);
    }
  }
  const nextIdx = templateDeck.pop() ?? 0;
  return PIXEL_TEMPLATES[nextIdx];
}

function getTemplateColor(col, row) {
  const rowStr = state.currentTemplate.rows[row] || '';
  const code = rowStr[col] || '.';
  return PIXEL_PALETTE[code] || '#bae6fd';
}

function syncHudDockPosition(clientY) {
  const hud = document.getElementById('hud-grid');
  if (!hud) return;

  const h = window.innerHeight || 800;
  const approachZone = Math.min(175, h * 0.27);

  if (!state.hudDockedBottom && clientY < approachZone) {
    // Az ujj a felső menüsáv felé közeledik -> áthelyezzük alulra, amíg ott színez
    state.hudDockedBottom = true;
    hud.classList.add('hud-docked-bottom');
  } else if (state.hudDockedBottom && clientY > h * 0.52) {
    // Amikor az ujj elhagyta a felső sávot és lejjebb színez, a menü visszatér a helyére
    state.hudDockedBottom = false;
    hud.classList.remove('hud-docked-bottom');
  }
}

function resetHudDock() {
  state.hudDockedBottom = false;
  const hud = document.getElementById('hud-grid');
  if (hud) {
    hud.classList.remove('hud-docked-bottom');
    hud.classList.remove('hud-hidden-celebrate');
  }
  document.body.classList.remove('actively-painting');
}

function cancelCelebrationCountdown() {
  state.isCelebrating = false;
  if (celebrateRafId) {
    cancelAnimationFrame(celebrateRafId);
    celebrateRafId = null;
  }
  const celebrateBar = document.getElementById('grid-celebration-bar');
  if (celebrateBar) celebrateBar.classList.add('hidden');
}

function startCelebrationCountdown() {
  cancelCelebrationCountdown();
  state.isCelebrating = true;

  const container = document.getElementById('grid-matrix');
  if (container) container.classList.add('completed-artwork');

  const hud = document.getElementById('hud-grid');
  if (hud) hud.classList.add('hud-hidden-celebrate');

  const celebrateBar = document.getElementById('grid-celebration-bar');
  const titleEl = document.getElementById('grid-celebrate-title');
  const timerEl = document.getElementById('grid-celebrate-timer-label');
  const fillEl = document.getElementById('grid-celebrate-bar-fill');

  if (titleEl) {
    titleEl.textContent = `Szuper! Előbújt: ${state.currentTemplate.name}!`;
  }
  if (fillEl) {
    fillEl.style.transform = 'scaleX(1)';
  }
  if (timerEl) {
    timerEl.textContent = '4.0 mp';
  }
  if (celebrateBar) {
    celebrateBar.classList.remove('hidden');
  }

  if (typeof onModuleComplete === 'function') {
    onModuleComplete('grid', { autoCertificateCheck: false });
  }

  celebrateStartTime = performance.now();

  const tick = (now) => {
    if (!state.isCelebrating) return;
    const elapsed = now - celebrateStartTime;
    const remainingMs = Math.max(0, CELEBRATE_DURATION_MS - elapsed);
    const ratio = remainingMs / CELEBRATE_DURATION_MS;

    if (fillEl) {
      fillEl.style.transform = `scaleX(${ratio.toFixed(4)})`;
    }
    if (timerEl) {
      timerEl.textContent = `${(remainingMs / 1000).toFixed(1)} mp`;
    }

    if (remainingMs <= 0) {
      cancelCelebrationCountdown();
      showGridSummary();
      return;
    }

    celebrateRafId = requestAnimationFrame(tick);
  };

  celebrateRafId = requestAnimationFrame(tick);
}

function updateHud() {
  const pctEl = document.getElementById('grid-hud-pct');
  if (!pctEl) return;

  if (state.coveredPercent >= 80) {
    pctEl.textContent = `${state.coveredPercent}% · ${state.currentTemplate.name}!`;
  } else {
    pctEl.textContent = `Kiszínezve: ${state.coveredPercent}%`;
  }
}

function buildGrid(chooseNewShape = true) {
  const container = document.getElementById('grid-matrix');
  if (!container) return;

  cancelCelebrationCountdown();
  container.classList.remove('completed-artwork');

  if (chooseNewShape) {
    state.currentTemplate = drawNextTemplate();
  }

  container.innerHTML = '';
  container.style.gridTemplateColumns = `repeat(${COLS}, 1fr)`;
  container.style.gridTemplateRows = `repeat(${ROWS}, 1fr)`;

  cellElements = [];
  state.filledCount = 0;
  state.coveredPercent = 0;
  lastSoundStep = 0;
  resetHudDock();

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = document.createElement('div');
      cell.className = 'matrix-cell';
      container.appendChild(cell);
      cellElements.push(cell);
    }
  }

  updateHud();
}

function paintSingleCell(col, row) {
  if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return false;
  const idx = row * COLS + col;
  const cell = cellElements[idx];
  if (!cell || cell.classList.contains('painted')) return false;

  cell.classList.add('painted');
  cell.style.backgroundColor = getTemplateColor(col, row);
  state.filledCount++;
  return true;
}

/** Kényelmes ujj-ecset: az érintett mezőt és közvetlen kereszt-szomszédait színezi */
function paintBrushAt(col, row) {
  if (!state.isPlaying) return;

  let anyNew = false;
  if (paintSingleCell(col, row)) anyNew = true;
  if (paintSingleCell(col - 1, row)) anyNew = true;
  if (paintSingleCell(col + 1, row)) anyNew = true;
  if (paintSingleCell(col, row - 1)) anyNew = true;
  if (paintSingleCell(col, row + 1)) anyNew = true;

  if (!anyNew) return;

  state.coveredPercent = Math.round((state.filledCount / TOTAL_CELLS) * 100);
  if (state.coveredPercent > 0) {
    state.completed = true;
  }

  if (state.filledCount - lastSoundStep >= 4 || state.filledCount === TOTAL_CELLS) {
    lastSoundStep = state.filledCount;
    sound.playGridTone(state.filledCount, TOTAL_CELLS);
  }

  updateHud();

  if (state.filledCount === TOTAL_CELLS) {
    state.coveredPercent = 100;
    state.completed = true;
    state.isPlaying = false;
    document.body.classList.remove('actively-painting');
    sound.playFanfare();
    startCelebrationCountdown();
  }
}

function paintLineBetween(x0, y0, x1, y1) {
  const container = document.getElementById('grid-matrix');
  if (!container) return;
  const rect = container.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return;

  syncHudDockPosition(y1);

  const dist = Math.hypot(x1 - x0, y1 - y0);
  const steps = Math.max(1, Math.ceil(dist / 14));

  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    const px = x0 + (x1 - x0) * t - rect.left;
    const py = y0 + (y1 - y0) * t - rect.top;

    const col = Math.floor((px / rect.width) * COLS);
    const row = Math.floor((py / rect.height) * ROWS);
    paintBrushAt(col, row);
  }
}

function showGridSummary() {
  cancelCelebrationCountdown();
  state.isPlaying = false;
  document.body.classList.remove('actively-painting');
  if (state.coveredPercent > 0) {
    state.completed = true;
  }

  const summaryModal = document.getElementById('summary-grid');
  const summaryText = document.getElementById('grid-summary-text');
  if (summaryText) {
    if (state.coveredPercent === 100) {
      summaryText.textContent = `Szuper! 100%-osan elővarázsoltad a képet: ${state.currentTemplate.name}!`;
    } else if (state.coveredPercent >= 60) {
      summaryText.textContent = `Ügyes vagy! A képernyő ${state.coveredPercent}%-át színezted ki (a kép: ${state.currentTemplate.name})!`;
    } else {
      summaryText.textContent = `A képernyő ${state.coveredPercent}%-át színezted ki — próbáld meg felfedni a teljes titkos ábrát!`;
    }
  }
  if (summaryModal) {
    summaryModal.classList.remove('hidden');
  }

  if (typeof onModuleComplete === 'function') {
    onModuleComplete('grid', { autoCertificateCheck: false });
  }
}

function startGridSession(chooseNewShape = true) {
  const briefing = document.getElementById('briefing-grid');
  const summary = document.getElementById('summary-grid');
  if (briefing) briefing.classList.add('hidden');
  if (summary) summary.classList.add('hidden');

  document.body.classList.add('test-running');
  buildGrid(chooseNewShape);
  state.isPlaying = true;
  isPointerDown = false;
  lastPoint = null;
}

function bindEventsOnce() {
  if (listenersBound) return;
  listenersBound = true;

  const startBtn = document.getElementById('btn-start-grid');
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      sound.playClick();
      startGridSession(true);
    });
  }

  const clearBtn = document.getElementById('btn-grid-clear');
  if (clearBtn) {
    clearBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      sound.playClick();
      buildGrid(true);
      state.isPlaying = true;
    });
  }

  const doneHudBtn = document.getElementById('btn-grid-done');
  if (doneHudBtn) {
    doneHudBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      sound.playClick();
      showGridSummary();
    });
  }

  const replayBtn = document.getElementById('btn-grid-replay');
  if (replayBtn) {
    replayBtn.addEventListener('click', () => {
      sound.playClick();
      startGridSession(true);
    });
  }

  const finishBtn = document.getElementById('btn-grid-finish');
  if (finishBtn) {
    finishBtn.addEventListener('click', () => {
      sound.playClick();
      if (typeof onModuleComplete === 'function') {
        onModuleComplete('grid', { exitToHub: true });
      }
    });
  }

  const celebrateNewBtn = document.getElementById('btn-grid-celebrate-new');
  if (celebrateNewBtn) {
    celebrateNewBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      sound.playClick();
      startGridSession(true);
    });
  }

  const celebrateNextBtn = document.getElementById('btn-grid-celebrate-next');
  if (celebrateNextBtn) {
    celebrateNextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      sound.playClick();
      cancelCelebrationCountdown();
      if (typeof onModuleComplete === 'function') {
        onModuleComplete('grid', { exitToHub: true });
      }
    });
  }

  const container = document.getElementById('grid-matrix');
  if (container) {
    container.addEventListener('pointerdown', (e) => {
      if (!state.isPlaying) return;
      isPointerDown = true;
      document.body.classList.add('actively-painting');
      lastPoint = { x: e.clientX, y: e.clientY };
      paintLineBetween(e.clientX, e.clientY, e.clientX, e.clientY);
    });

    container.addEventListener('pointermove', (e) => {
      if (!state.isPlaying) return;
      if (isPointerDown || e.pointerType === 'touch') {
        const prev = lastPoint || { x: e.clientX, y: e.clientY };
        paintLineBetween(prev.x, prev.y, e.clientX, e.clientY);
        lastPoint = { x: e.clientX, y: e.clientY };
      }
    });

    container.addEventListener(
      'touchmove',
      (e) => {
        if (!state.isPlaying) return;
        e.preventDefault();
        for (let i = 0; i < e.touches.length; i++) {
          const t = e.touches[i];
          paintLineBetween(t.clientX, t.clientY, t.clientX, t.clientY);
        }
      },
      { passive: false }
    );
  }

  const endStroke = () => {
    isPointerDown = false;
    lastPoint = null;
    document.body.classList.remove('actively-painting');
  };

  window.addEventListener('pointerup', endStroke);
  window.addEventListener('pointercancel', endStroke);
}

export function stopSession() {
  state.isPlaying = false;
  isPointerDown = false;
  lastPoint = null;
  cancelCelebrationCountdown();
  resetHudDock();
}

export function init(callbacks = {}) {
  onModuleComplete = callbacks.onComplete || null;
  bindEventsOnce();
  stopSession();

  const briefing = document.getElementById('briefing-grid');
  const summary = document.getElementById('summary-grid');
  if (briefing) briefing.classList.remove('hidden');
  if (summary) summary.classList.add('hidden');
}

export function reset() {
  stopSession();
  state.filledCount = 0;
  state.coveredPercent = 0;
  state.completed = false;
  const container = document.getElementById('grid-matrix');
  if (container) container.innerHTML = '';
  updateHud();
}

export function getResults() {
  const completed = state.completed && state.coveredPercent > 0;
  const summaryText = completed
    ? `${state.coveredPercent}% kiszínezve (${state.currentTemplate.name})!`
    : 'Még nem próbáltad ki';

  return {
    completed,
    coveredPercent: state.coveredPercent,
    shapeName: state.currentTemplate.name,
    summaryText
  };
}
