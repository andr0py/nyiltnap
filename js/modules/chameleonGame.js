/* ==========================================================================
   MODUL 1: KÁROLY, A KAMÉLEON BÚJÓCSKA (KIDOLGOZOTT KÉPPONT- ÉS SZÍNTESZT)
   - 7 pálya: 5 tiszta diagnosztikai alapszín (piros, zöld, kék, fehér, fekete)
     + 2 nyugodt, szemkímélő minta (lágy hajnalpír színátmenet és szelíd
     pasztell pöttyös háttér — vibráló sakktábla nélkül!)
   - Kidolgozott kaméleon karakter: fejbúb-sisak, hátgerinc-taréj, oldalsó
     csíkok, ágon kapaszkodó mancsok, kunkori farok, körbenéző/pislogó szem
     és csillagkapó nyelv-animáció megtaláláskor!
   ========================================================================== */

import { sound } from '../soundEngine.js';

const STAGES = [
  {
    name: 'Piros',
    type: 'solid',
    bg: '#ef233c',
    body: '#ef233c',
    outline: 'rgba(15, 23, 42, 0.56)',
    stripe: 'rgba(255, 255, 255, 0.26)'
  },
  {
    name: 'Zöld',
    type: 'solid',
    bg: '#16a34a',
    body: '#16a34a',
    outline: 'rgba(15, 23, 42, 0.54)',
    stripe: 'rgba(254, 240, 138, 0.28)'
  },
  {
    name: 'Kék',
    type: 'solid',
    bg: '#0284c7',
    body: '#0284c7',
    outline: 'rgba(255, 255, 255, 0.66)',
    stripe: 'rgba(224, 242, 254, 0.3)'
  },
  {
    name: 'Fehér',
    type: 'solid',
    bg: '#ffffff',
    body: '#ffffff',
    outline: 'rgba(30, 41, 59, 0.48)',
    stripe: 'rgba(148, 163, 184, 0.3)'
  },
  {
    name: 'Fekete',
    type: 'solid',
    bg: '#07090e',
    body: '#07090e',
    outline: 'rgba(254, 243, 199, 0.62)',
    stripe: 'rgba(254, 243, 199, 0.24)'
  },
  {
    name: 'Lágy Hajnalpír Átmenet',
    type: 'gradient',
    stops: [
      { pos: 0, r: 254, g: 215, b: 170 },   // lágy barack (#fed7aa)
      { pos: 0.5, r: 254, g: 243, b: 199 }, // meleg krémsárga (#fef3c7)
      { pos: 1, r: 186, g: 230, b: 253 }    // nyugodt égkék (#bae6fd)
    ],
    bg: '#fef3c7',
    body: '#fef3c7',
    outline: 'rgba(30, 41, 59, 0.5)',
    stripe: 'rgba(255, 255, 255, 0.45)'
  },
  {
    name: 'Szelíd Mentalevél Pöttyök',
    type: 'softdots',
    bg: '#d1fae5',
    dotColor: '#a7f3d0',
    body: '#c4f5de',
    outline: 'rgba(15, 23, 42, 0.5)',
    stripe: 'rgba(255, 255, 255, 0.42)'
  }
];

let canvas = null;
let ctx = null;
let animFrameId = null;
let celebrationTimeout = null;
let listenersBound = false;
let onModuleComplete = null;

const state = {
  isPlaying: false,
  isCelebrating: false,
  stageIndex: 0,
  foundCount: 0,
  accumulatedMs: 0,
  stageStartPerf: 0,
  elapsedSeconds: 0,
  completed: false,
  hudDockedBottom: false,
  karoly: {
    x: 320,
    y: 320,
    dir: 1,
    hitRadius: 72,
    celebrateStart: 0
  },
  sparkles: [],
  ripples: []
};

/** Kiszámítja a lágy gradiens pontos színét Károly aktuális helyén, hogy tökéletesen beleolvadjon */
function sampleGradientColor(stage, x, w) {
  if (!stage.stops || w <= 0) return stage.body;
  const t = Math.max(0, Math.min(1, x / w));
  let s0 = stage.stops[0];
  let s1 = stage.stops[stage.stops.length - 1];

  for (let i = 0; i < stage.stops.length - 1; i++) {
    if (t >= stage.stops[i].pos && t <= stage.stops[i + 1].pos) {
      s0 = stage.stops[i];
      s1 = stage.stops[i + 1];
      break;
    }
  }

  const span = Math.max(0.001, s1.pos - s0.pos);
  const localT = (t - s0.pos) / span;
  const r = Math.round(s0.r + (s1.r - s0.r) * localT);
  const g = Math.round(s0.g + (s1.g - s0.g) * localT);
  const b = Math.round(s0.b + (s1.b - s0.b) * localT);
  return `rgb(${r}, ${g}, ${b})`;
}

function renderStageDots() {
  const dotsWrap = document.getElementById('chameleon-stage-dots');
  if (!dotsWrap) return;

  dotsWrap.innerHTML = '';
  for (let i = 0; i < STAGES.length; i++) {
    const d = document.createElement('span');
    d.className = 'hud-stage-dot';
    if (i < state.foundCount) d.classList.add('done');
    else if (i === state.stageIndex && state.isPlaying) d.classList.add('current');
    dotsWrap.appendChild(d);
  }
}

function updateHud() {
  const countEl = document.getElementById('chameleon-hud-count');
  const timeEl = document.getElementById('chameleon-hud-time');

  if (countEl) {
    countEl.textContent = `Károly: ${state.foundCount} / ${STAGES.length}`;
  }
  if (timeEl) {
    let totalMs = state.accumulatedMs;
    if (state.isPlaying && !state.isCelebrating && state.stageStartPerf > 0) {
      totalMs += performance.now() - state.stageStartPerf;
    }
    const sec = (totalMs / 1000).toFixed(1);
    timeEl.textContent = `${sec} mp`;
  }
}

function syncHudAwayFromKaroly() {
  const hud = document.getElementById('hud-chameleon');
  if (!hud || !canvas) return;
  // Ha Károly a felső sáv közelében bújik el, a menü udvariasan leköltözik alulra!
  if (state.karoly.y < 165) {
    state.hudDockedBottom = true;
    hud.classList.add('hud-docked-bottom');
  } else {
    state.hudDockedBottom = false;
    hud.classList.remove('hud-docked-bottom');
  }
}

function placeKarolyRandomly() {
  if (!canvas) return;
  const w = canvas.width || window.innerWidth;
  const h = canvas.height || window.innerHeight;

  const padX = Math.min(115, Math.max(85, w * 0.09));
  const padY = 95;

  state.karoly.x = padX + Math.random() * Math.max(60, w - padX * 2);
  state.karoly.y = padY + Math.random() * Math.max(60, h - padY * 2);
  state.karoly.dir = Math.random() < 0.5 ? 1 : -1;

  syncHudAwayFromKaroly();
  renderStageDots();
}

function drawBackground(w, h, stage) {
  if (!ctx) return;

  if (stage.type === 'solid') {
    ctx.fillStyle = stage.bg;
    ctx.fillRect(0, 0, w, h);
  } else if (stage.type === 'gradient' && stage.stops) {
    const grad = ctx.createLinearGradient(0, 0, w, 0);
    stage.stops.forEach((st) => {
      grad.addColorStop(st.pos, `rgb(${st.r}, ${st.g}, ${st.b})`);
    });
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  } else if (stage.type === 'softdots') {
    ctx.fillStyle = stage.bg;
    ctx.fillRect(0, 0, w, h);

    // Nagy, nyugodt, alacsony kontrasztú pasztell körök — egyáltalán nem vibrál a szemnek
    ctx.fillStyle = stage.dotColor || '#a7f3d0';
    const spacing = 148;
    let rowIdx = 0;
    for (let y = 55; y < h + spacing; y += spacing * 0.86) {
      const offsetX = (rowIdx % 2) * (spacing / 2);
      for (let x = -40 + offsetX; x < w + spacing; x += spacing) {
        ctx.beginPath();
        ctx.arc(x, y, 42, 0, Math.PI * 2);
        ctx.fill();
      }
      rowIdx++;
    }
  }
}

function drawPixelStar(c, x, y, r, color) {
  c.save();
  c.fillStyle = color;
  c.strokeStyle = '#1e293b';
  c.lineWidth = 2;
  c.beginPath();
  for (let i = 0; i < 5; i++) {
    const outerAngle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
    const innerAngle = outerAngle + Math.PI / 5;
    const ox = x + Math.cos(outerAngle) * r;
    const oy = y + Math.sin(outerAngle) * r;
    const ix = x + Math.cos(innerAngle) * (r * 0.45);
    const iy = y + Math.sin(innerAngle) * (r * 0.45);
    if (i === 0) c.moveTo(ox, oy);
    else c.lineTo(ox, oy);
    c.lineTo(ix, iy);
  }
  c.closePath();
  c.fill();
  c.stroke();
  c.restore();
}

function drawKaroly(now, canvasWidth) {
  if (!ctx) return;
  const stage = STAGES[Math.min(state.stageIndex, STAGES.length - 1)];
  const k = state.karoly;

  ctx.save();

  let hopOffset = 0;
  let scale = 1;
  let celebrateProgress = 0;
  if (state.isCelebrating) {
    celebrateProgress = Math.min(1, (now - k.celebrateStart) / 920);
    hopOffset = -Math.abs(Math.sin(celebrateProgress * Math.PI * 3)) * 26;
    scale = 1 + Math.sin(celebrateProgress * Math.PI) * 0.14;
  }

  ctx.translate(k.x, k.y + hopOffset);
  ctx.scale(k.dir * scale, scale);

  const adaptiveFill =
    stage.type === 'gradient' ? sampleGradientColor(stage, k.x, canvasWidth) : stage.body;
  const bodyFill = state.isCelebrating ? '#22c55e' : adaptiveFill;
  const strokeColor = state.isCelebrating ? '#1e293b' : stage.outline;
  const accentFill = state.isCelebrating ? '#facc15' : stage.stripe;
  const branchFill = state.isCelebrating ? '#b45309' : adaptiveFill;

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // 1. Kis faág és falevél Károly lábai alatt
  ctx.strokeStyle = strokeColor;
  ctx.fillStyle = branchFill;
  ctx.lineWidth = state.isCelebrating ? 4 : 3;
  ctx.beginPath();
  ctx.moveTo(-48, 33);
  ctx.quadraticCurveTo(0, 30, 50, 35);
  ctx.lineTo(48, 40);
  ctx.quadraticCurveTo(0, 36, -48, 39);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Kis levél az ág végén
  ctx.fillStyle = state.isCelebrating ? '#4ade80' : accentFill;
  ctx.beginPath();
  ctx.moveTo(46, 35);
  ctx.quadraticCurveTo(60, 24, 65, 34);
  ctx.quadraticCurveTo(56, 44, 46, 35);
  ctx.fill();
  ctx.stroke();

  // 2. Duplán feltekeredő kunkori kaméleonfarok
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = state.isCelebrating ? 4.2 : 3.5;
  ctx.beginPath();
  ctx.moveTo(-34, 15);
  ctx.bezierCurveTo(-68, 18, -74, -22, -48, -26);
  ctx.bezierCurveTo(-28, -28, -26, -4, -44, -3);
  ctx.bezierCurveTo(-53, -3, -53, -16, -44, -16);
  ctx.stroke();

  // 3. Háti taréj-pikkelyek
  ctx.fillStyle = accentFill;
  ctx.lineWidth = 2.6;
  const spinePoints = [-26, -16, -6, 4];
  spinePoints.forEach((sx) => {
    ctx.beginPath();
    ctx.moveTo(sx - 4.5, -18);
    ctx.lineTo(sx, -28);
    ctx.lineTo(sx + 4.5, -18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  });

  // 4. Károly ívelt teste + jellegzetes kaméleon sisak-fejbúb (casque)
  ctx.fillStyle = bodyFill;
  ctx.lineWidth = state.isCelebrating ? 4 : 3.4;
  ctx.beginPath();
  ctx.moveTo(-38, 16);
  ctx.bezierCurveTo(-40, -18, -8, -25, 10, -21);
  // Kaméleon sisak-csúcs a feje búbján
  ctx.quadraticCurveTo(18, -36, 28, -22);
  ctx.quadraticCurveTo(47, -14, 50, 6);
  ctx.quadraticCurveTo(50, 20, 32, 22);
  ctx.lineTo(-28, 22);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 5. Kedves oldalsó kaméleon-csíkok a hátán
  ctx.strokeStyle = accentFill;
  ctx.lineWidth = 3.2;
  [-20, -8, 4].forEach((bx) => {
    ctx.beginPath();
    ctx.moveTo(bx, -12);
    ctx.quadraticCurveTo(bx - 3, 2, bx, 12);
    ctx.stroke();
  });

  // 6. Ágon kapaszkodó kis kétujjas kaméleon-lábak
  ctx.strokeStyle = strokeColor;
  ctx.fillStyle = bodyFill;
  ctx.lineWidth = 3;
  // Hátsó láb
  ctx.beginPath();
  ctx.moveTo(-20, 20);
  ctx.lineTo(-25, 33);
  ctx.lineTo(-15, 33);
  ctx.stroke();
  // Első láb
  ctx.beginPath();
  ctx.moveTo(16, 20);
  ctx.lineTo(13, 33);
  ctx.lineTo(23, 33);
  ctx.stroke();

  // 7. Csillagkapó nyelv-animáció megtaláláskor!
  if (state.isCelebrating) {
    const tongueReach = Math.sin(Math.min(1, celebrateProgress * 1.4) * Math.PI);
    const tx = 48 + tongueReach * 38;
    const ty = 8 - tongueReach * 14;

    ctx.strokeStyle = '#fb7185';
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.moveTo(47, 9);
    ctx.quadraticCurveTo(47 + tongueReach * 20, 2, tx, ty);
    ctx.stroke();

    if (tongueReach > 0.25) {
      drawPixelStar(ctx, tx + 4, ty - 2, 10, '#facc15');
    }
  }

  // 8. Barátságos mosoly
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(27, 11);
  ctx.quadraticCurveTo(38, 18, 47, 10);
  ctx.stroke();

  // 9. Kíváncsian körbenéző és pislogó toronyszem
  const blinkCycle = now % 2600;
  const isBlinking = !state.isCelebrating && blinkCycle > 2420;
  const lookAngle = now * 0.0018;
  const pupilDx = state.isCelebrating ? 2 : Math.cos(lookAngle) * 2.4;
  const pupilDy = state.isCelebrating ? -0.5 : Math.sin(lookAngle * 0.7) * 1.6;

  // Külső szemgyűrű
  ctx.fillStyle = bodyFill;
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(28, -4, 12.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Belső szemgolyó
  ctx.fillStyle = stage.bg === '#07090e' && !state.isCelebrating ? '#1e293b' : '#ffffff';
  ctx.beginPath();
  ctx.arc(28, -4, 8.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  if (isBlinking) {
    ctx.beginPath();
    ctx.moveTo(20, -4);
    ctx.lineTo(36, -4);
    ctx.stroke();
  } else {
    ctx.fillStyle = stage.bg === '#07090e' && !state.isCelebrating ? '#fef3c7' : '#0f172a';
    ctx.beginPath();
    ctx.arc(28 + pupilDx, -4 + pupilDy, 4.2, 0, Math.PI * 2);
    ctx.fill();

    // Fénycsillanás a pupillán
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(29.5 + pupilDx, -5.8 + pupilDy, 1.7, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();

  if (state.isCelebrating) {
    ctx.save();
    ctx.font = '800 22px "Trebuchet MS", "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#ffffff';
    ctx.fillStyle = '#1e293b';
    const msg = 'Megvagy, Károly!';
    ctx.strokeText(msg, k.x, Math.max(95, k.y - 60));
    ctx.fillText(msg, k.x, Math.max(95, k.y - 60));
    ctx.restore();
  }
}

function renderLoop(now) {
  if (!state.isPlaying || !canvas || !ctx) return;

  const w = canvas.width;
  const h = canvas.height;
  const stage = STAGES[Math.min(state.stageIndex, STAGES.length - 1)];

  drawBackground(w, h, stage);

  for (let i = state.ripples.length - 1; i >= 0; i--) {
    const r = state.ripples[i];
    r.radius += 2.6;
    r.alpha -= 0.045;
    if (r.alpha <= 0) {
      state.ripples.splice(i, 1);
      continue;
    }
    ctx.save();
    ctx.globalAlpha = r.alpha;
    ctx.strokeStyle = stage.bg === '#07090e' ? '#ffffff' : '#1e293b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  drawKaroly(now, w);

  for (let i = state.sparkles.length - 1; i >= 0; i--) {
    const s = state.sparkles[i];
    s.x += s.vx;
    s.y += s.vy;
    s.vy += 0.12;
    s.alpha -= 0.022;
    if (s.alpha <= 0) {
      state.sparkles.splice(i, 1);
      continue;
    }
    ctx.save();
    ctx.globalAlpha = Math.max(0, s.alpha);
    drawPixelStar(ctx, s.x, s.y, s.size, s.color);
    ctx.restore();
  }

  updateHud();
  animFrameId = requestAnimationFrame(renderLoop);
}

function spawnCelebrationStars(x, y) {
  const colors = ['#f59e0b', '#22c55e', '#38bdf8', '#fb7185', '#a855f7'];
  for (let i = 0; i < 16; i++) {
    const angle = (Math.PI * 2 * i) / 16 + Math.random() * 0.2;
    const speed = 2.5 + Math.random() * 4.5;
    state.sparkles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      size: 8 + Math.random() * 6,
      alpha: 1,
      color: colors[i % colors.length]
    });
  }
}

function finishChameleonGame() {
  state.isPlaying = false;
  state.isCelebrating = false;
  if (animFrameId) {
    cancelAnimationFrame(animFrameId);
    animFrameId = null;
  }

  state.elapsedSeconds = Math.max(0.5, Number((state.accumulatedMs / 1000).toFixed(1)));
  state.completed = true;
  sound.playFanfare();

  const summaryModal = document.getElementById('summary-chameleon');
  const summaryText = document.getElementById('chameleon-summary-text');
  if (summaryText) {
    summaryText.textContent = `Mind a ${STAGES.length} képen megtaláltad Károlyt mindössze ${state.elapsedSeconds} másodperc alatt!`;
  }
  if (summaryModal) {
    summaryModal.classList.remove('hidden');
  }

  if (typeof onModuleComplete === 'function') {
    onModuleComplete('chameleon', { autoCertificateCheck: false });
  }
}

function handleCanvasTap(clientX, clientY) {
  if (!state.isPlaying || state.isCelebrating || !canvas) return;

  const rect = canvas.getBoundingClientRect();
  const x = clientX - rect.left;
  const y = clientY - rect.top;

  const dist = Math.hypot(x - state.karoly.x, y - state.karoly.y);
  if (dist <= state.karoly.hitRadius) {
    state.accumulatedMs += performance.now() - state.stageStartPerf;
    state.foundCount = Math.min(STAGES.length, state.foundCount + 1);
    state.isCelebrating = true;
    state.karoly.celebrateStart = performance.now();

    sound.playChameleonFound();
    spawnCelebrationStars(state.karoly.x, state.karoly.y);
    renderStageDots();
    updateHud();

    if (celebrationTimeout) clearTimeout(celebrationTimeout);
    celebrationTimeout = setTimeout(() => {
      state.isCelebrating = false;
      state.stageIndex++;
      if (state.stageIndex >= STAGES.length) {
        finishChameleonGame();
      } else {
        placeKarolyRandomly();
        state.stageStartPerf = performance.now();
      }
    }, 940);
  } else {
    sound.playSoftBoop();
    state.ripples.push({ x, y, radius: 10, alpha: 0.7 });
  }
}

function startPlaySession() {
  const briefing = document.getElementById('briefing-chameleon');
  const summary = document.getElementById('summary-chameleon');
  if (briefing) briefing.classList.add('hidden');
  if (summary) summary.classList.add('hidden');

  document.body.classList.add('test-running');

  canvas = /** @type {HTMLCanvasElement | null} */ (document.getElementById('chameleon-canvas'));
  if (!canvas) return;
  ctx = canvas.getContext('2d');
  handleResize();

  state.stageIndex = 0;
  state.foundCount = 0;
  state.accumulatedMs = 0;
  state.sparkles = [];
  state.ripples = [];
  state.isCelebrating = false;
  state.isPlaying = true;

  placeKarolyRandomly();
  state.stageStartPerf = performance.now();
  updateHud();

  if (animFrameId) cancelAnimationFrame(animFrameId);
  animFrameId = requestAnimationFrame(renderLoop);
}

function bindEventsOnce() {
  if (listenersBound) return;
  listenersBound = true;

  const startBtn = document.getElementById('btn-start-chameleon');
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      sound.playClick();
      startPlaySession();
    });
  }

  const replayBtn = document.getElementById('btn-chameleon-replay');
  if (replayBtn) {
    replayBtn.addEventListener('click', () => {
      sound.playClick();
      startPlaySession();
    });
  }

  const doneBtn = document.getElementById('btn-chameleon-finish');
  if (doneBtn) {
    doneBtn.addEventListener('click', () => {
      sound.playClick();
      if (typeof onModuleComplete === 'function') {
        onModuleComplete('chameleon', { exitToHub: true });
      }
    });
  }

  const c = document.getElementById('chameleon-canvas');
  if (c) {
    c.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      handleCanvasTap(e.clientX, e.clientY);
    });
  }
}

export function handleResize() {
  if (!canvas) {
    canvas = /** @type {HTMLCanvasElement | null} */ (document.getElementById('chameleon-canvas'));
  }
  if (!canvas) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

export function stopSession() {
  state.isPlaying = false;
  state.isCelebrating = false;
  const hud = document.getElementById('hud-chameleon');
  if (hud) hud.classList.remove('hud-docked-bottom');
  if (animFrameId) {
    cancelAnimationFrame(animFrameId);
    animFrameId = null;
  }
  if (celebrationTimeout) {
    clearTimeout(celebrationTimeout);
    celebrationTimeout = null;
  }
}

export function init(callbacks = {}) {
  onModuleComplete = callbacks.onComplete || null;
  bindEventsOnce();
  stopSession();

  const briefing = document.getElementById('briefing-chameleon');
  const summary = document.getElementById('summary-chameleon');
  if (briefing) briefing.classList.remove('hidden');
  if (summary) summary.classList.add('hidden');
}

export function reset() {
  stopSession();
  state.stageIndex = 0;
  state.foundCount = 0;
  state.accumulatedMs = 0;
  state.elapsedSeconds = 0;
  state.completed = false;
  state.sparkles = [];
  state.ripples = [];
  renderStageDots();
  updateHud();
}

export function getResults() {
  const completed = state.completed && state.foundCount === STAGES.length;
  let summaryText = 'Még nem próbáltad ki';
  if (completed) {
    summaryText = `Károly ${state.foundCount}/${STAGES.length} alkalommal megtalálva (${state.elapsedSeconds} mp alatt)!`;
  } else if (state.foundCount > 0) {
    summaryText = `Károly ${state.foundCount}/${STAGES.length} alkalommal megtalálva`;
  }

  return {
    completed,
    foundCount: state.foundCount,
    totalStages: STAGES.length,
    elapsedSeconds: state.elapsedSeconds,
    summaryText
  };
}
