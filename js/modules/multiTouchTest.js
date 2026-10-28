/* ==========================================================================
   MODUL 3: JÁTÉKOS MULTI-TOUCH TESZT ("TŰZIJÁTÉK MÓD")
   Érintésenként pixel-tűzijáték és csillagrobbanás, egyedi dallamhanggal,
   akár 10 szimultán ujj egyidejű követésével és rekord-regisztrációval
   ========================================================================== */

import { sound } from '../soundEngine.js';

const FIREWORK_COLORS = [
  '#facc15', '#fb7185', '#38bdf8', '#4ade80', '#c084fc',
  '#fb923c', '#2dd4bf', '#f472b6', '#a3e635', '#60a5fa'
];

let canvas = null;
let ctx = null;
let animFrameId = null;
let listenersBound = false;
let onModuleComplete = null;

/** @type {Array<{x:number, y:number, r:number, phase:number}>} */
let skyStars = [];
/** @type {Array<{x:number, y:number, vx:number, vy:number, size:number, color:string, alpha:number, isStar:boolean}>} */
let particles = [];
/** @type {Array<{text:string, x:number, y:number, alpha:number}>} */
let banners = [];
/** @type {Map<number, {x:number, y:number, color:string, index:number}>} */
const activePointers = new Map();

const state = {
  isPlaying: false,
  currentTouches: 0,
  maxTouches: 0,
  completed: false
};

function seedSkyStars(w, h) {
  skyStars = [];
  for (let i = 0; i < 65; i++) {
    skyStars.push({
      x: Math.random() * w,
      y: Math.random() * (h * 0.85),
      r: 1.5 + Math.random() * 2,
      phase: Math.random() * Math.PI * 2
    });
  }
}

function updateHud() {
  const activeEl = document.getElementById('mt-hud-active');
  const maxEl = document.getElementById('mt-hud-max');
  if (activeEl) activeEl.textContent = `Ujjak most: ${state.currentTouches}`;
  if (maxEl) maxEl.textContent = `Rekord: ${state.maxTouches}`;
}

function spawnFireworkBurst(x, y, color, intensity = 28) {
  for (let i = 0; i < intensity; i++) {
    const angle = (Math.PI * 2 * i) / intensity + (Math.random() - 0.5) * 0.25;
    const speed = 2.2 + Math.random() * 6.5;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1.2,
      size: 5 + Math.random() * 6,
      color: i % 4 === 0 ? '#ffffff' : color,
      alpha: 1,
      isStar: i % 3 === 0
    });
  }
}

function drawMiniStar(c, x, y, r, color) {
  c.fillStyle = color;
  c.beginPath();
  for (let i = 0; i < 5; i++) {
    const a1 = (i * 2 * Math.PI) / 5 - Math.PI / 2;
    const a2 = a1 + Math.PI / 5;
    const ox = x + Math.cos(a1) * r;
    const oy = y + Math.sin(a1) * r;
    const ix = x + Math.cos(a2) * (r * 0.42);
    const iy = y + Math.sin(a2) * (r * 0.42);
    if (i === 0) c.moveTo(ox, oy);
    else c.lineTo(ox, oy);
    c.lineTo(ix, iy);
  }
  c.closePath();
  c.fill();
}

function registerFingerCount(count, cx, cy) {
  state.currentTouches = count;
  if (count > 0) {
    state.completed = true;
  }
  if (count > state.maxTouches) {
    state.maxTouches = count;
    if (count >= 10) {
      banners.push({ text: 'SZUPER 10 UJJAS TŰZIJÁTÉK!', x: cx, y: Math.max(140, cy - 60), alpha: 1.2 });
    } else if (count >= 5) {
      banners.push({ text: `${count} UJJ EGYSZERRE! SZUPER!`, x: cx, y: Math.max(140, cy - 60), alpha: 1.1 });
    }
  }
  updateHud();
}

function renderLoop(now) {
  if (!state.isPlaying || !canvas || !ctx) return;

  const w = canvas.width;
  const h = canvas.height;

  // Esti mesekönyvi égbolt enyhe utánvilágítással
  ctx.fillStyle = 'rgba(15, 23, 42, 0.34)';
  ctx.fillRect(0, 0, w, h);

  // Pislogó háttércsillagok
  for (let i = 0; i < skyStars.length; i++) {
    const st = skyStars[i];
    const twinkle = 0.45 + Math.sin(now * 0.003 + st.phase) * 0.35;
    ctx.fillStyle = `rgba(254, 249, 195, ${twinkle})`;
    ctx.fillRect(st.x, st.y, st.r * 2, st.r * 2);
  }

  // Kedves mesekönyvi dombsor az égbolt alján
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.quadraticCurveTo(w * 0.25, h - 42, w * 0.5, h - 18);
  ctx.quadraticCurveTo(w * 0.78, h + 6, w, h - 34);
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();

  // Ha még senki sem ért hozzá, barátságos biztató felirat középen
  if (state.maxTouches === 0 && particles.length === 0) {
    ctx.save();
    ctx.fillStyle = '#fef3c7';
    ctx.font = '800 24px "Trebuchet MS", "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Tedd le minél több ujjad egyszerre a képernyőre!', w / 2, h / 2);
    ctx.restore();
  }

  // Aktív ujjak gyűrűi + folyamatos csillagszikrák
  let idx = 1;
  activePointers.forEach((pt) => {
    if (Math.random() < 0.45) {
      particles.push({
        x: pt.x + (Math.random() - 0.5) * 16,
        y: pt.y + (Math.random() - 0.5) * 16,
        vx: (Math.random() - 0.5) * 3.2,
        vy: -1.5 - Math.random() * 2.5,
        size: 5 + Math.random() * 4,
        color: pt.color,
        alpha: 0.95,
        isStar: true
      });
    }

    ctx.save();
    ctx.strokeStyle = pt.color;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 40 + Math.sin(now * 0.012 + idx) * 5, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = pt.color;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = '800 18px "Trebuchet MS", "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${idx}`, pt.x, pt.y - 50);
    ctx.restore();
    idx++;
  });

  // Tűzijáték részecskék (pixel-kockák és csillagok)
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.11; // finom gravitáció
    p.vx *= 0.985;
    p.alpha -= 0.018;

    if (p.alpha <= 0) {
      particles.splice(i, 1);
      continue;
    }

    ctx.save();
    ctx.globalAlpha = Math.min(1, p.alpha);
    if (p.isStar) {
      drawMiniStar(ctx, p.x, p.y, p.size * 1.2, p.color);
    } else {
      // Retro pixel-art négyzet szikra
      const s = Math.round(p.size);
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(p.x - s / 2), Math.round(p.y - s / 2), s, s);
    }
    ctx.restore();
  }

  // Lebegő dicsérő feliratok
  for (let i = banners.length - 1; i >= 0; i--) {
    const b = banners[i];
    b.y -= 1.1;
    b.alpha -= 0.016;
    if (b.alpha <= 0) {
      banners.splice(i, 1);
      continue;
    }
    ctx.save();
    ctx.globalAlpha = Math.min(1, b.alpha);
    ctx.font = '800 28px "Trebuchet MS", "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#facc15';
    ctx.fillText(b.text, Math.min(w - 180, Math.max(180, b.x)), b.y);
    ctx.restore();
  }

  animFrameId = requestAnimationFrame(renderLoop);
}

/** Billentyűzetes teszt-segéd nem érintős fejlesztői gépekhez (2, 5, 10 ujj szimulációja) */
export function simulateFireworkTouches(fingerCount) {
  if (!state.isPlaying || !canvas) return;
  const w = canvas.width;
  const h = canvas.height;

  sound.playFirework(fingerCount);
  registerFingerCount(fingerCount, w / 2, h * 0.45);

  for (let i = 0; i < fingerCount; i++) {
    const x = w * 0.16 + (i / Math.max(1, fingerCount - 1)) * (w * 0.68);
    const y = h * 0.36 + Math.sin(i * 1.1) * 75;
    const color = FIREWORK_COLORS[i % FIREWORK_COLORS.length];
    spawnFireworkBurst(x, y, color, fingerCount >= 5 ? 36 : 26);
  }

  setTimeout(() => {
    if (activePointers.size === 0) {
      state.currentTouches = 0;
      updateHud();
    }
  }, 500);
}

function showMultiTouchSummary() {
  state.isPlaying = false;
  if (animFrameId) {
    cancelAnimationFrame(animFrameId);
    animFrameId = null;
  }
  activePointers.clear();

  if (state.maxTouches > 0) {
    state.completed = true;
    sound.playFanfare();
  }

  const summaryModal = document.getElementById('summary-multitouch');
  const summaryText = document.getElementById('mt-summary-text');
  if (summaryText) {
    summaryText.textContent =
      state.maxTouches > 0
        ? `Csodás tűzijáték volt! Egyszerre legtöbb ${state.maxTouches} ujjat érzékelt a képernyő!`
        : 'Nem érzékeltünk érintést a tűzijáték téren.';
  }
  if (summaryModal) {
    summaryModal.classList.remove('hidden');
  }

  if (typeof onModuleComplete === 'function') {
    onModuleComplete('multitouch', { autoCertificateCheck: false });
  }
}

function startFireworkSession() {
  const briefing = document.getElementById('briefing-multitouch');
  const summary = document.getElementById('summary-multitouch');
  if (briefing) briefing.classList.add('hidden');
  if (summary) summary.classList.add('hidden');

  document.body.classList.add('test-running');

  canvas = /** @type {HTMLCanvasElement | null} */ (document.getElementById('multitouch-canvas'));
  if (!canvas) return;
  ctx = canvas.getContext('2d');
  handleResize();

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  particles = [];
  banners = [];
  activePointers.clear();
  state.currentTouches = 0;
  state.isPlaying = true;
  updateHud();

  if (animFrameId) cancelAnimationFrame(animFrameId);
  animFrameId = requestAnimationFrame(renderLoop);
}

function bindEventsOnce() {
  if (listenersBound) return;
  listenersBound = true;

  const startBtn = document.getElementById('btn-start-multitouch');
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      sound.playClick();
      startFireworkSession();
    });
  }

  const doneHudBtn = document.getElementById('btn-mt-done');
  if (doneHudBtn) {
    doneHudBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      sound.playClick();
      showMultiTouchSummary();
    });
  }

  const replayBtn = document.getElementById('btn-mt-replay');
  if (replayBtn) {
    replayBtn.addEventListener('click', () => {
      sound.playClick();
      startFireworkSession();
    });
  }

  const finishBtn = document.getElementById('btn-mt-finish');
  if (finishBtn) {
    finishBtn.addEventListener('click', () => {
      sound.playClick();
      if (typeof onModuleComplete === 'function') {
        onModuleComplete('multitouch', { exitToHub: true });
      }
    });
  }

  const c = document.getElementById('multitouch-canvas');
  if (c) {
    // Pointer események (egér és többujjas érintőképernyő egységes támogatása)
    c.addEventListener('pointerdown', (e) => {
      if (!state.isPlaying || !canvas) return;
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const color = FIREWORK_COLORS[activePointers.size % FIREWORK_COLORS.length];

      activePointers.set(e.pointerId, { x, y, color, index: activePointers.size + 1 });
      const count = activePointers.size;

      sound.playFirework(count);
      spawnFireworkBurst(x, y, color, count >= 5 ? 40 : 28);
      registerFingerCount(count, x, y);
    });

    c.addEventListener('pointermove', (e) => {
      if (!state.isPlaying || !canvas) return;
      const pt = activePointers.get(e.pointerId);
      if (!pt) return;
      const rect = canvas.getBoundingClientRect();
      pt.x = e.clientX - rect.left;
      pt.y = e.clientY - rect.top;
    });

    const releasePointer = (e) => {
      activePointers.delete(e.pointerId);
      state.currentTouches = activePointers.size;
      updateHud();
    };

    c.addEventListener('pointerup', releasePointer);
    c.addEventListener('pointercancel', releasePointer);
    c.addEventListener('pointerleave', releasePointer);
  }
}

export function handleResize() {
  if (!canvas) {
    canvas = /** @type {HTMLCanvasElement | null} */ (document.getElementById('multitouch-canvas'));
  }
  if (!canvas) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  seedSkyStars(canvas.width, canvas.height);
}

export function stopSession() {
  state.isPlaying = false;
  activePointers.clear();
  if (animFrameId) {
    cancelAnimationFrame(animFrameId);
    animFrameId = null;
  }
}

export function init(callbacks = {}) {
  onModuleComplete = callbacks.onComplete || null;
  bindEventsOnce();
  stopSession();

  const briefing = document.getElementById('briefing-multitouch');
  const summary = document.getElementById('summary-multitouch');
  if (briefing) briefing.classList.remove('hidden');
  if (summary) summary.classList.add('hidden');
}

export function reset() {
  stopSession();
  state.currentTouches = 0;
  state.maxTouches = 0;
  state.completed = false;
  particles = [];
  banners = [];
  updateHud();
}

export function getResults() {
  const completed = state.completed && state.maxTouches > 0;
  const summaryText = completed
    ? `Legtöbb egyszerre érzékelt ujj: ${state.maxTouches} ujj!`
    : 'Még nem próbáltad ki';

  return {
    completed,
    maxTouches: state.maxTouches,
    summaryText
  };
}
