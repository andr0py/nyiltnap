/* ==========================================================================
   MODUL 4: 30 MÁSODPERCES CÉLPONTVADÁSZAT (REAKCIÓTESZT)
   Nagy 30s arkád visszaszámláló, élő "Lelőtt célpontok: X" pontszám,
   folyamatosan felbukkanó színes célpontok és átlagos válaszidő (ms) mérés
   ========================================================================== */

import { sound } from '../soundEngine.js';

const GAME_DURATION_SEC = 30;
const TARGET_PALETTE = [
  { fill: '#ef4444', ring: '#fee2e2' },
  { fill: '#0284c7', ring: '#e0f2fe' },
  { fill: '#16a34a', ring: '#dcfce7' },
  { fill: '#f59e0b', ring: '#fef3c7' },
  { fill: '#9333ea', ring: '#f3e8ff' }
];

let canvas = null;
let ctx = null;
let animFrameId = null;
let timerIntervalId = null;
let listenersBound = false;
let onModuleComplete = null;
let lastSpawnPerf = 0;

/** @type {Array<{x:number, y:number, vx:number, vy:number, r:number, palette:{fill:string, ring:string}, spawnPerf:number, bobPhase:number}>} */
let targets = [];
/** @type {Array<{x:number, y:number, r:number, color:string, alpha:number}>} */
let bursts = [];
/** @type {Array<{x:number, y:number, text:string, color:string, alpha:number}>} */
let popTexts = [];

const state = {
  isPlaying: false,
  secondsLeft: GAME_DURATION_SEC,
  hits: 0,
  /** @type {number[]} */
  reactionTimes: [],
  avgReactionMs: 0,
  completed: false
};

function updateHud() {
  const timerBox = document.getElementById('target-timer-box');
  const timerEl = document.getElementById('target-timer-val');
  const scoreEl = document.getElementById('target-score-val');

  if (timerEl) {
    timerEl.textContent = `Idő: ${state.secondsLeft} mp`;
  }
  if (timerBox) {
    if (state.secondsLeft <= 5 && state.isPlaying) {
      timerBox.classList.add('timer-urgent');
    } else {
      timerBox.classList.remove('timer-urgent');
    }
  }
  if (scoreEl) {
    scoreEl.textContent = `Lelőtt célpontok: ${state.hits}`;
  }
}

function spawnTarget() {
  if (!canvas) return;
  const w = canvas.width;
  const h = canvas.height;

  const r = 44 + Math.random() * 12; // 88px - 112px átmérő (nagy gyerekbarát célpont!)
  const minX = r + 24;
  const maxX = Math.max(minX + 40, w - r - 24);
  const minY = 115 + r;
  const maxY = Math.max(minY + 40, h - r - 28);

  const palette = TARGET_PALETTE[Math.floor(Math.random() * TARGET_PALETTE.length)];

  targets.push({
    x: minX + Math.random() * (maxX - minX),
    y: minY + Math.random() * (maxY - minY),
    vx: (Math.random() - 0.5) * 2.6,
    vy: (Math.random() - 0.5) * 2.2,
    r,
    palette,
    spawnPerf: performance.now(),
    bobPhase: Math.random() * Math.PI * 2
  });
}

function drawTarget(c, t, now) {
  const pulse = Math.sin(now * 0.008 + t.bobPhase) * 2.5;
  const outerR = t.r + pulse;

  c.save();

  // Képregényes eltolt árnyék
  c.fillStyle = 'rgba(30, 41, 59, 0.22)';
  c.beginPath();
  c.arc(t.x + 4, t.y + 5, outerR, 0, Math.PI * 2);
  c.fill();

  // Külső gyűrű
  c.fillStyle = t.palette.fill;
  c.strokeStyle = '#1e293b';
  c.lineWidth = 3.5;
  c.beginPath();
  c.arc(t.x, t.y, outerR, 0, Math.PI * 2);
  c.fill();
  c.stroke();

  // Középső világos gyűrű
  c.fillStyle = t.palette.ring;
  c.beginPath();
  c.arc(t.x, t.y, outerR * 0.64, 0, Math.PI * 2);
  c.fill();
  c.stroke();

  // Belső telitalálat kör
  c.fillStyle = t.palette.fill;
  c.beginPath();
  c.arc(t.x, t.y, outerR * 0.32, 0, Math.PI * 2);
  c.fill();
  c.stroke();

  // Kis fénycsillanás a tetején
  c.fillStyle = 'rgba(255, 255, 255, 0.75)';
  c.beginPath();
  c.arc(t.x - outerR * 0.32, t.y - outerR * 0.32, 6, 0, Math.PI * 2);
  c.fill();

  c.restore();
}

function finishTargetHunt() {
  state.isPlaying = false;
  if (timerIntervalId) {
    clearInterval(timerIntervalId);
    timerIntervalId = null;
  }
  if (animFrameId) {
    cancelAnimationFrame(animFrameId);
    animFrameId = null;
  }

  if (state.reactionTimes.length > 0) {
    const sum = state.reactionTimes.reduce((acc, v) => acc + v, 0);
    state.avgReactionMs = Math.round(sum / state.reactionTimes.length);
  } else {
    state.avgReactionMs = 0;
  }

  state.completed = true;
  updateHud();
  sound.playFanfare();

  const summaryModal = document.getElementById('summary-target');
  const summaryText = document.getElementById('target-summary-text');
  if (summaryText) {
    if (state.hits > 0) {
      summaryText.textContent = `30 másodperc alatt ${state.hits} célpontot találtál el! Átlagos válaszidőd: ${state.avgReactionMs} ms.`;
    } else {
      summaryText.textContent = 'Lejárt a 30 másodperc! Próbáld meg újra elkapni a színes célpontokat!';
    }
  }
  if (summaryModal) {
    summaryModal.classList.remove('hidden');
  }

  if (typeof onModuleComplete === 'function') {
    onModuleComplete('target', { autoCertificateCheck: false });
  }
}

function renderLoop(now) {
  if (!state.isPlaying || !canvas || !ctx) return;

  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  // Mindig legyen 3-5 aktív célpont a képernyőn
  if (targets.length < 3 || (targets.length < 5 && now - lastSpawnPerf > 580)) {
    spawnTarget();
    lastSpawnPerf = now;
  }

  // Célpontok mozgatása és visszapattanása a szélekről
  for (let i = targets.length - 1; i >= 0; i--) {
    const t = targets[i];
    t.x += t.vx;
    t.y += t.vy;

    const minX = t.r + 16;
    const maxX = w - t.r - 16;
    const minY = 104 + t.r;
    const maxY = h - t.r - 18;

    if (t.x < minX) {
      t.x = minX;
      t.vx = Math.abs(t.vx);
    } else if (t.x > maxX) {
      t.x = maxX;
      t.vx = -Math.abs(t.vx);
    }

    if (t.y < minY) {
      t.y = minY;
      t.vy = Math.abs(t.vy);
    } else if (t.y > maxY) {
      t.y = maxY;
      t.vy = -Math.abs(t.vy);
    }

    drawTarget(ctx, t, now);
  }

  // Találati hullámgyűrűk
  for (let i = bursts.length - 1; i >= 0; i--) {
    const b = bursts[i];
    b.r += 4.5;
    b.alpha -= 0.045;
    if (b.alpha <= 0) {
      bursts.splice(i, 1);
      continue;
    }
    ctx.save();
    ctx.globalAlpha = b.alpha;
    ctx.strokeStyle = b.color;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Felugró "+1" és reakcióidő feliratok
  for (let i = popTexts.length - 1; i >= 0; i--) {
    const pt = popTexts[i];
    pt.y -= 1.5;
    pt.alpha -= 0.03;
    if (pt.alpha <= 0) {
      popTexts.splice(i, 1);
      continue;
    }
    ctx.save();
    ctx.globalAlpha = pt.alpha;
    ctx.font = '800 18px "Trebuchet MS", "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = pt.color;
    ctx.fillText(pt.text, pt.x, pt.y);
    ctx.restore();
  }

  animFrameId = requestAnimationFrame(renderLoop);
}

function hitAt(clientX, clientY) {
  if (!state.isPlaying || !canvas) return;
  const rect = canvas.getBoundingClientRect();
  const x = clientX - rect.left;
  const y = clientY - rect.top;

  for (let i = targets.length - 1; i >= 0; i--) {
    const t = targets[i];
    const dist = Math.hypot(x - t.x, y - t.y);
    if (dist <= t.r + 16) {
      const reactionMs = Math.max(80, Math.round(performance.now() - t.spawnPerf));
      state.reactionTimes.push(reactionMs);
      state.hits++;

      sound.playTargetHit(state.hits);
      bursts.push({ x: t.x, y: t.y, r: t.r * 0.4, color: t.palette.fill, alpha: 1 });
      popTexts.push({
        x: t.x,
        y: t.y - t.r,
        text: `+1 (${reactionMs} ms)`,
        color: '#1e293b',
        alpha: 1
      });

      targets.splice(i, 1);
      spawnTarget();
      updateHud();
      break;
    }
  }
}

/** Billentyűzetes teszt-segéd fejlesztéshez */
export function popFirstTargetForTest() {
  if (!state.isPlaying || targets.length === 0 || !canvas) return;
  const rect = canvas.getBoundingClientRect();
  hitAt(rect.left + targets[0].x, rect.top + targets[0].y);
}

function startTargetSession() {
  const briefing = document.getElementById('briefing-target');
  const summary = document.getElementById('summary-target');
  if (briefing) briefing.classList.add('hidden');
  if (summary) summary.classList.add('hidden');

  document.body.classList.add('test-running');

  canvas = /** @type {HTMLCanvasElement | null} */ (document.getElementById('target-canvas'));
  if (!canvas) return;
  ctx = canvas.getContext('2d');
  handleResize();

  stopSession();

  targets = [];
  bursts = [];
  popTexts = [];
  state.secondsLeft = GAME_DURATION_SEC;
  state.hits = 0;
  state.reactionTimes = [];
  state.avgReactionMs = 0;
  state.isPlaying = true;

  spawnTarget();
  spawnTarget();
  spawnTarget();
  lastSpawnPerf = performance.now();
  updateHud();

  timerIntervalId = setInterval(() => {
    if (!state.isPlaying) return;
    state.secondsLeft = Math.max(0, state.secondsLeft - 1);
    updateHud();

    if (state.secondsLeft > 0 && state.secondsLeft <= 5) {
      sound.playCountdownTick();
    }

    if (state.secondsLeft <= 0) {
      finishTargetHunt();
    }
  }, 1000);

  animFrameId = requestAnimationFrame(renderLoop);
}

function bindEventsOnce() {
  if (listenersBound) return;
  listenersBound = true;

  const startBtn = document.getElementById('btn-start-target');
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      sound.playClick();
      startTargetSession();
    });
  }

  const restartHudBtn = document.getElementById('btn-target-restart');
  if (restartHudBtn) {
    restartHudBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      sound.playClick();
      startTargetSession();
    });
  }

  const replayBtn = document.getElementById('btn-target-replay');
  if (replayBtn) {
    replayBtn.addEventListener('click', () => {
      sound.playClick();
      startTargetSession();
    });
  }

  const finishBtn = document.getElementById('btn-target-finish');
  if (finishBtn) {
    finishBtn.addEventListener('click', () => {
      sound.playClick();
      if (typeof onModuleComplete === 'function') {
        onModuleComplete('target', { exitToHub: true });
      }
    });
  }

  const c = document.getElementById('target-canvas');
  if (c) {
    c.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      hitAt(e.clientX, e.clientY);
    });
  }
}

export function handleResize() {
  if (!canvas) {
    canvas = /** @type {HTMLCanvasElement | null} */ (document.getElementById('target-canvas'));
  }
  if (!canvas) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

export function stopSession() {
  state.isPlaying = false;
  if (timerIntervalId) {
    clearInterval(timerIntervalId);
    timerIntervalId = null;
  }
  if (animFrameId) {
    cancelAnimationFrame(animFrameId);
    animFrameId = null;
  }
}

export function init(callbacks = {}) {
  onModuleComplete = callbacks.onComplete || null;
  bindEventsOnce();
  stopSession();

  const briefing = document.getElementById('briefing-target');
  const summary = document.getElementById('summary-target');
  if (briefing) briefing.classList.remove('hidden');
  if (summary) summary.classList.add('hidden');
}

export function reset() {
  stopSession();
  state.secondsLeft = GAME_DURATION_SEC;
  state.hits = 0;
  state.reactionTimes = [];
  state.avgReactionMs = 0;
  state.completed = false;
  targets = [];
  bursts = [];
  popTexts = [];
  updateHud();
}

export function getResults() {
  const completed = state.completed;
  let summaryText = 'Még nem próbáltad ki';
  if (completed) {
    if (state.hits > 0) {
      summaryText = `${state.hits} célpont eltalálva ${GAME_DURATION_SEC} mp alatt! (Átlag: ${state.avgReactionMs} ms)`;
    } else {
      summaryText = `0 célpont eltalálva ${GAME_DURATION_SEC} mp alatt`;
    }
  }

  return {
    completed,
    hits: state.hits,
    durationSec: GAME_DURATION_SEC,
    avgReactionMs: state.avgReactionMs,
    summaryText
  };
}
