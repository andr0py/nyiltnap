/* ==========================================================================
   MODUL 5: EGYSZERŰSÍTETT KÉPÉLESSÉG ÉS GEOMETRIA TESZT
   Nagy, tiszta geometriai alakzatok (körök, csillagok, szimmetrikus minták)
   Gyerekbarát kérdés: "Minden forma szép kerek és tisztán olvasható?"
   ========================================================================== */

import { sound } from '../soundEngine.js';

let canvas = null;
let ctx = null;
let listenersBound = false;
let onModuleComplete = null;

const state = {
  isPlaying: false,
  patternIndex: 0,
  isSharp: null,
  completed: false
};

function drawStarShape(c, cx, cy, outerR, innerR, fill, stroke) {
  c.save();
  c.fillStyle = fill;
  c.strokeStyle = stroke;
  c.lineWidth = 3;
  c.beginPath();
  for (let i = 0; i < 5; i++) {
    const a1 = (i * 2 * Math.PI) / 5 - Math.PI / 2;
    const a2 = a1 + Math.PI / 5;
    const ox = cx + Math.cos(a1) * outerR;
    const oy = cy + Math.sin(a1) * outerR;
    const ix = cx + Math.cos(a2) * innerR;
    const iy = cy + Math.sin(a2) * innerR;
    if (i === 0) c.moveTo(ox, oy);
    else c.lineTo(ox, oy);
    c.lineTo(ix, iy);
  }
  c.closePath();
  c.fill();
  c.stroke();
  c.restore();
}

export function drawSharpnessScene() {
  if (!canvas || !ctx) return;
  const w = canvas.width;
  const h = canvas.height;
  const isNight = state.patternIndex === 1;

  // Alap háttér + finom szimmetrikus négyzetháló
  ctx.fillStyle = isNight ? '#0f172a' : '#fffdf5';
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = isNight ? 'rgba(148, 163, 184, 0.2)' : 'rgba(30, 41, 59, 0.1)';
  ctx.lineWidth = 1;
  const step = 64;
  for (let x = 0; x < w; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y < h; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  const ink = isNight ? '#f8fafc' : '#1e293b';
  const cx = w / 2;
  const cy = Math.max(210, (h - 90) / 2);

  // 1. Négy sarokban szimmetrikus körök és csillagok (sarok-geometria ellenőrzés)
  const cornerMarginX = Math.min(110, w * 0.12);
  const cornerTopY = 126;
  const cornerBotY = Math.max(cornerTopY + 140, h - 150);

  const corners = [
    [cornerMarginX, cornerTopY],
    [w - cornerMarginX, cornerTopY],
    [cornerMarginX, cornerBotY],
    [w - cornerMarginX, cornerBotY]
  ];

  corners.forEach(([x, y], idx) => {
    ctx.save();
    ctx.strokeStyle = idx % 2 === 0 ? '#0284c7' : '#16a34a';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(x, y, 42, 0, Math.PI * 2);
    ctx.stroke();

    drawStarShape(ctx, x, y, 22, 10, '#facc15', ink);
    ctx.restore();
  });

  // 2. Középső nagy koncentrikus körök és csillag
  const maxRing = Math.min(w * 0.24, (h - 260) * 0.42, 175);
  const ringColors = ['#0284c7', '#16a34a', '#f59e0b', '#ef4444'];

  for (let i = 4; i >= 1; i--) {
    const r = (maxRing / 4) * i;
    if (r < 18) continue;
    ctx.save();
    ctx.strokeStyle = ringColors[(i - 1) % ringColors.length];
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, cy - 28, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  drawStarShape(ctx, cx, cy - 28, 34, 15, '#facc15', ink);

  // Bal és jobb oldali szimmetrikus négyzet és háromszög (ha elég széles a kijelző)
  if (w >= 760) {
    const sideOffset = Math.min(290, w * 0.28);

    // Bal oldali szabályos négyzet
    ctx.save();
    ctx.fillStyle = isNight ? '#1e293b' : '#e0f2fe';
    ctx.strokeStyle = ink;
    ctx.lineWidth = 3.5;
    ctx.fillRect(cx - sideOffset - 45, cy - 73, 90, 90);
    ctx.strokeRect(cx - sideOffset - 45, cy - 73, 90, 90);
    ctx.restore();

    // Jobb oldali szabályos háromszög
    ctx.save();
    ctx.fillStyle = isNight ? '#1e293b' : '#dcfce7';
    ctx.strokeStyle = ink;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(cx + sideOffset, cy - 76);
    ctx.lineTo(cx + sideOffset + 50, cy + 16);
    ctx.lineTo(cx + sideOffset - 50, cy + 16);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // 3. Tisztán olvasható gyerekbarát mondatok különböző méretekben
  const textBaseY = Math.min(h - 145, cy + Math.max(95, maxRing) + 12);
  ctx.save();
  ctx.fillStyle = ink;
  ctx.textAlign = 'center';

  ctx.font = '800 24px "Trebuchet MS", "Segoe UI", sans-serif';
  ctx.fillText('Szép kerek körök és ragyogó csillagok!', cx, textBaseY);

  ctx.font = '700 17px "Segoe UI", system-ui, sans-serif';
  ctx.fillText('Károly, a kaméleon minden betűt tisztán el tud olvasni.', cx, textBaseY + 30);
  ctx.restore();
}

export function toggleSharpnessPattern() {
  state.patternIndex = state.patternIndex === 0 ? 1 : 0;
  drawSharpnessScene();
}

function recordAnswer(isSharp) {
  state.isSharp = isSharp;
  state.completed = true;
  state.isPlaying = false;

  if (isSharp) {
    sound.playFanfare();
  } else {
    sound.playClick();
  }

  const promptBar = document.getElementById('sharpness-prompt-bar');
  if (promptBar) promptBar.style.display = 'none';

  const summaryModal = document.getElementById('summary-sharpness');
  const summaryText = document.getElementById('sharpness-summary-text');
  if (summaryText) {
    summaryText.textContent = isSharp
      ? 'Köszönjük! Feljegyeztük, hogy minden kör, csillag és felirat szép éles!'
      : 'Köszönjük az észrevételt! Feljegyeztük, hogy a kép homályosnak tűnt.';
  }
  if (summaryModal) {
    summaryModal.classList.remove('hidden');
  }

  if (typeof onModuleComplete === 'function') {
    onModuleComplete('sharpness', { autoCertificateCheck: false });
  }
}

function startSharpnessSession() {
  const briefing = document.getElementById('briefing-sharpness');
  const summary = document.getElementById('summary-sharpness');
  const promptBar = document.getElementById('sharpness-prompt-bar');

  if (briefing) briefing.classList.add('hidden');
  if (summary) summary.classList.add('hidden');
  if (promptBar) promptBar.style.display = 'flex';

  document.body.classList.add('test-running');

  canvas = /** @type {HTMLCanvasElement | null} */ (document.getElementById('sharpness-canvas'));
  if (!canvas) return;
  ctx = canvas.getContext('2d');
  state.isPlaying = true;
  handleResize();
}

function bindEventsOnce() {
  if (listenersBound) return;
  listenersBound = true;

  const startBtn = document.getElementById('btn-start-sharpness');
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      sound.playClick();
      startSharpnessSession();
    });
  }

  const patternBtn = document.getElementById('btn-sharpness-pattern');
  if (patternBtn) {
    patternBtn.addEventListener('click', () => {
      sound.playClick();
      toggleSharpnessPattern();
    });
  }

  const yesBtn = document.getElementById('btn-sharpness-yes');
  if (yesBtn) {
    yesBtn.addEventListener('click', () => {
      recordAnswer(true);
    });
  }

  const noBtn = document.getElementById('btn-sharpness-no');
  if (noBtn) {
    noBtn.addEventListener('click', () => {
      recordAnswer(false);
    });
  }

  const finishBtn = document.getElementById('btn-sharpness-finish');
  if (finishBtn) {
    finishBtn.addEventListener('click', () => {
      sound.playClick();
      if (typeof onModuleComplete === 'function') {
        onModuleComplete('sharpness', { exitToHub: true });
      }
    });
  }
}

export function handleResize() {
  if (!canvas) {
    canvas = /** @type {HTMLCanvasElement | null} */ (document.getElementById('sharpness-canvas'));
  }
  if (!canvas) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  if (state.isPlaying) {
    drawSharpnessScene();
  }
}

export function stopSession() {
  state.isPlaying = false;
}

export function init(callbacks = {}) {
  onModuleComplete = callbacks.onComplete || null;
  bindEventsOnce();
  stopSession();

  const briefing = document.getElementById('briefing-sharpness');
  const summary = document.getElementById('summary-sharpness');
  const promptBar = document.getElementById('sharpness-prompt-bar');

  if (briefing) briefing.classList.remove('hidden');
  if (summary) summary.classList.add('hidden');
  if (promptBar) promptBar.style.display = 'none';
}

export function reset() {
  stopSession();
  state.patternIndex = 0;
  state.isSharp = null;
  state.completed = false;
}

export function getResults() {
  const completed = state.completed && state.isSharp !== null;
  let summaryText = 'Még nem próbáltad ki';
  if (completed) {
    summaryText = state.isSharp
      ? 'Minden forma szép kerek és tisztán olvasható!'
      : 'Homályos vagy torzult forma jelezve';
  }

  return {
    completed,
    isSharp: state.isSharp,
    summaryText
  };
}
