/* ==========================================================================
   MODUL 6: EREDMÉNYJELZŐ OKLEVÉL ÉS KONFETTI ANIMÁCIÓ (100% NÉVTELEN / GDPR)
   "Nyílt Napi Érintőképernyő Mester" pecsét, Canvas konfetti-eső és fanfár
   ========================================================================== */

import { sound } from '../soundEngine.js';

const CONFETTI_COLORS = [
  '#ef4444', '#f59e0b', '#16a34a', '#0284c7', '#9333ea', '#ec4899', '#facc15'
];

let canvas = null;
let ctx = null;
let animFrameId = null;

/** @type {Array<{x:number, y:number, vx:number, vy:number, w:number, h:number, rot:number, vRot:number, color:string, isStar:boolean}>} */
let confettiPieces = [];

function spawnConfettiWave(w, h) {
  confettiPieces = [];
  const total = 110;
  for (let i = 0; i < total; i++) {
    confettiPieces.push({
      x: Math.random() * w,
      y: -20 - Math.random() * h * 0.85,
      vx: (Math.random() - 0.5) * 2.4,
      vy: 2.2 + Math.random() * 3.8,
      w: 9 + Math.random() * 8,
      h: 6 + Math.random() * 6,
      rot: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 0.14,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      isStar: i % 4 === 0
    });
  }
}

function drawConfettiStar(c, r, color) {
  c.fillStyle = color;
  c.beginPath();
  for (let i = 0; i < 5; i++) {
    const a1 = (i * 2 * Math.PI) / 5 - Math.PI / 2;
    const a2 = a1 + Math.PI / 5;
    const ox = Math.cos(a1) * r;
    const oy = Math.sin(a1) * r;
    const ix = Math.cos(a2) * (r * 0.45);
    const iy = Math.sin(a2) * (r * 0.45);
    if (i === 0) c.moveTo(ox, oy);
    else c.lineTo(ox, oy);
    c.lineTo(ix, iy);
  }
  c.closePath();
  c.fill();
}

function animateConfetti() {
  if (!canvas || !ctx) return;
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  let activeRemaining = 0;
  for (let i = 0; i < confettiPieces.length; i++) {
    const p = confettiPieces[i];
    p.x += p.vx + Math.sin(p.y * 0.02) * 0.6;
    p.y += p.vy;
    p.rot += p.vRot;

    if (p.y < h + 40) {
      activeRemaining++;
    } else if (confettiPieces.length > 0 && p.y > h + 40 && p.y < h + 46) {
      // Egy második lágy hullámhoz néhány darabot visszaengedünk felülről, majd lecseng
      if (i < 35 && !p['recycled']) {
        p.y = -20 - Math.random() * 140;
        p.x = Math.random() * w;
        p['recycled'] = true;
        activeRemaining++;
      }
    }

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    if (p.isStar) {
      drawConfettiStar(ctx, p.w * 0.7, p.color);
    } else {
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    }
    ctx.restore();
  }

  if (activeRemaining > 0) {
    animFrameId = requestAnimationFrame(animateConfetti);
  } else {
    ctx.clearRect(0, 0, w, h);
    animFrameId = null;
  }
}

export function handleResize() {
  if (!canvas) {
    canvas = /** @type {HTMLCanvasElement | null} */ (document.getElementById('confetti-canvas'));
  }
  if (!canvas) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

/**
 * Megjeleníti a névtelen Oklevelet és elindítja a konfetti-esőt
 * @param {Array<{key:string, label:string, iconBg:string, iconSvg:string, result:{completed:boolean, summaryText:string}}>} items
 */
export function init(items = []) {
  document.body.classList.remove('test-running');

  const container = document.getElementById('cert-results-container');
  const subtitleEl = document.getElementById('cert-subtitle-text');

  let completedCount = 0;

  if (container) {
    container.innerHTML = '';
    items.forEach((item, idx) => {
      if (item.result.completed) completedCount++;

      const row = document.createElement('div');
      const isLastOdd = items.length % 2 === 1 && idx === items.length - 1;
      row.className = isLastOdd ? 'cert-result-item span-full' : 'cert-result-item';

      const iconWrap = document.createElement('div');
      iconWrap.className = `cert-result-icon ${item.iconBg}`;
      iconWrap.innerHTML = item.iconSvg;

      const body = document.createElement('div');
      body.className = 'cert-result-body';

      const nameEl = document.createElement('div');
      nameEl.className = 'cert-result-name';
      nameEl.textContent = item.label;

      const valEl = document.createElement('div');
      valEl.className = 'cert-result-value';
      valEl.textContent = item.result.summaryText;

      body.appendChild(nameEl);
      body.appendChild(valEl);
      row.appendChild(iconWrap);
      row.appendChild(body);
      container.appendChild(row);
    });
  }

  if (subtitleEl) {
    if (completedCount === items.length && items.length > 0) {
      subtitleEl.textContent = 'Gratulálunk! Mind az összes játékos próbát sikeresen teljesítetted!';
    } else if (completedCount > 0) {
      subtitleEl.textContent = `Eddig ${completedCount} / ${items.length} próbát teljesítettél — bármikor folytathatod a többivel is!`;
    } else {
      subtitleEl.textContent = 'Próbáld ki a játékokat a kezdőlapon, hogy megteljen az okleveled eredményekkel!';
    }
  }

  // Konfetti animáció és fanfár indítása
  canvas = /** @type {HTMLCanvasElement | null} */ (document.getElementById('confetti-canvas'));
  if (canvas) {
    ctx = canvas.getContext('2d');
    handleResize();
    spawnConfettiWave(canvas.width, canvas.height);
    if (animFrameId) cancelAnimationFrame(animFrameId);
    animFrameId = requestAnimationFrame(animateConfetti);
  }

  sound.playFanfare();
}

export function reset() {
  if (animFrameId) {
    cancelAnimationFrame(animFrameId);
    animFrameId = null;
  }
  confettiPieces = [];
  if (canvas && ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

export function getResults() {
  return {
    completed: true,
    summaryText: 'Nyílt Napi Érintőképernyő Mester'
  };
}
