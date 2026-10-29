/* ==========================================================================
   MODUL 5: ÁTDOLGOZOTT KÉPÉLESSÉG, GEOMETRIA ÉS CSILLAGSZÁMOLÓ TESZT
   SPDX-License-Identifier: 0BSD
   - 4 sarok-fókuszgyűrű szálkereszttel (sarokgeometria és torzítás ellenőrzése)
   - Középen 3 nagy, éles geometriai alapforma: Kék Kör, Aranykeretes Négyzet, Zöld Háromszög
   - 1. lépés: Egyértelműen megszámolható (4, 5, 6 vagy 7 db) arany csillag
     a 3 nagy formán belül. A gyerek rányomhat egyből a lenti számgombra (4/5/6/7),
     VAGY ujjával sorban meg is érintheti a csillagokat (1, 2, 3...)!
   - 2. lépés: Gyerekbarát képélesség-megerősítés ("Igen, szép éles!" / "Nem, homályos!")
   ========================================================================== */

import { sound } from '../soundEngine.js';

let canvas = null;
let ctx = null;
let listenersBound = false;
let onModuleComplete = null;
let animFrameId = null;
let phaseTransitionTimer = null;

const STAR_COUNTS = [4, 5, 6, 7];

/**
 * Aktuális csillagok pozíciója a vásznon az érintéses számoláshoz
 * @type {Array<{x:number, y:number, r:number, tappedOrder:number}>}
 */
let activeStars = [];

const state = {
  isPlaying: false,
  /** @type {'counting' | 'transitioning' | 'sharpness'} */
  phase: 'counting',
  patternIndex: 0,
  targetStarCount: 5,
  countedStars: 0,
  tappedCount: 0,
  hintHighlightUntil: 0,
  celebrateUntil: 0,
  isSharp: null,
  completed: false
};

function pickFreshStarCount() {
  const candidates = STAR_COUNTS.filter((n) => n !== state.targetStarCount);
  const pool = candidates.length > 0 ? candidates : STAR_COUNTS;
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Kiszámítja a 3 nagy forma (Kör, Négyzet, Háromszög) belsejébe kerülő csillagok
 * relatív elosztását:
 * - 4 csillag: [1, 2, 1]
 * - 5 csillag: [2, 1, 2]
 * - 6 csillag: [2, 2, 2]
 * - 7 csillag: [2, 3, 2]
 * @param {number} total
 * @returns {[number, number, number]}
 */
function getPerShapeStarSplit(total) {
  if (total === 4) return [1, 2, 1];
  if (total === 5) return [2, 1, 2];
  if (total === 6) return [2, 2, 2];
  return [2, 3, 2];
}

/**
 * Egy formán belül 1, 2 vagy 3 csillag kényelmes, jól elkülönülő elhelyezése
 * @param {number} cx
 * @param {number} cy
 * @param {number} shapeR
 * @param {number} countInShape
 * @param {'circle' | 'square' | 'triangle'} kind
 */
function buildStarPositionsInShape(cx, cy, shapeR, countInShape, kind) {
  const yShift = kind === 'triangle' ? shapeR * 0.2 : 0;
  const baseCy = cy + yShift;

  if (countInShape === 1) {
    return [{ x: cx, y: baseCy }];
  }
  if (countInShape === 2) {
    const dx = shapeR * (kind === 'triangle' ? 0.34 : 0.42);
    return [
      { x: cx - dx, y: baseCy },
      { x: cx + dx, y: baseCy }
    ];
  }
  // 3 csillag (piramis elrendezésben a középső négyzetben)
  const dx = shapeR * 0.44;
  const dy = shapeR * 0.38;
  return [
    { x: cx, y: baseCy - dy },
    { x: cx - dx, y: baseCy + dy * 0.85 },
    { x: cx + dx, y: baseCy + dy * 0.85 }
  ];
}

function getSafeViewportBounds(w, h) {
  const hudEl = document.getElementById('hud-sharpness');
  const promptEl = document.getElementById('sharpness-prompt-bar');

  let topSafe = 86;
  if (hudEl) {
    const r = hudEl.getBoundingClientRect();
    if (r.height > 0) {
      topSafe = Math.max(82, r.bottom + 14);
    }
  }

  let bottomSafe = h - 108;
  if (promptEl && promptEl.style.display !== 'none') {
    const r = promptEl.getBoundingClientRect();
    if (r.height > 0) {
      bottomSafe = Math.min(h - 92, r.top - 14);
    }
  }

  if (bottomSafe - topSafe < 200) {
    bottomSafe = Math.max(topSafe + 200, h - 90);
  }

  return { topSafe, bottomSafe };
}

function rebuildStarLayout() {
  if (!canvas) return;
  const w = canvas.width;
  const h = canvas.height;
  const { topSafe, bottomSafe } = getSafeViewportBounds(w, h);
  const safeH = bottomSafe - topSafe;

  // Megőrizzük az eddigi érintési sorrendet ablakátméretezéskor vagy háttérváltáskor
  const prevOrders = activeStars.map((s) => s.tappedOrder);

  const shapeR = Math.max(46, Math.min(w * 0.105, safeH * 0.25, 102));
  const gapX = Math.max(shapeR * 2.35, Math.min(w * 0.27, 290));
  const centerY = Math.round(topSafe + safeH * 0.43);
  const cx = w / 2;

  const [leftCount, midCount, rightCount] = getPerShapeStarSplit(state.targetStarCount);
  const starRadius = Math.max(15, Math.min(25, shapeR * 0.26));

  const coords = [
    ...buildStarPositionsInShape(cx - gapX, centerY, shapeR, leftCount, 'circle'),
    ...buildStarPositionsInShape(cx, centerY, shapeR, midCount, 'square'),
    ...buildStarPositionsInShape(cx + gapX, centerY, shapeR, rightCount, 'triangle')
  ];

  activeStars = coords.map((pt, idx) => ({
    x: pt.x,
    y: pt.y,
    r: starRadius,
    tappedOrder: prevOrders[idx] || 0
  }));
}

function drawCornerFocusTarget(c, x, y, radius, ringColor, ink) {
  c.save();
  c.strokeStyle = ringColor;
  c.lineWidth = 3;
  c.beginPath();
  c.arc(x, y, radius, 0, Math.PI * 2);
  c.stroke();

  c.lineWidth = 2;
  c.beginPath();
  c.arc(x, y, radius * 0.52, 0, Math.PI * 2);
  c.stroke();

  // Éles szálkereszt a sarok-geometria vizsgálatához (csillag nélkül, hogy ne zavarja a számolást!)
  c.strokeStyle = ink;
  c.lineWidth = 2;
  const cross = radius * 0.3;
  c.beginPath();
  c.moveTo(x - cross, y);
  c.lineTo(x + cross, y);
  c.moveTo(x, y - cross);
  c.lineTo(x, y + cross);
  c.stroke();
  c.restore();
}

function drawStarWithBadge(c, star, stroke, pulseScale, showGlow, badgeNumber) {
  const { x, y, r } = star;
  c.save();
  c.translate(x, y);
  c.scale(pulseScale, pulseScale);

  if (showGlow || star.tappedOrder > 0) {
    c.beginPath();
    c.arc(0, 0, r + 9, 0, Math.PI * 2);
    c.fillStyle =
      star.tappedOrder > 0 ? 'rgba(34, 197, 94, 0.28)' : 'rgba(250, 204, 21, 0.36)';
    c.fill();
  }

  c.fillStyle = '#facc15';
  c.strokeStyle = stroke;
  c.lineWidth = 3;
  c.lineJoin = 'round';
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
  c.stroke();

  if (badgeNumber > 0) {
    c.fillStyle = '#1e293b';
    c.font = `800 ${Math.max(12, Math.round(r * 0.72))}px "Trebuchet MS", "Segoe UI", sans-serif`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(String(badgeNumber), 0, 1);
  } else {
    // Éles kis fénycsillanás a csillagon
    c.fillStyle = '#fef9c3';
    c.beginPath();
    c.arc(-r * 0.16, -r * 0.18, Math.max(2, r * 0.13), 0, Math.PI * 2);
    c.fill();
  }

  c.restore();
}

export function drawSharpnessScene(now = performance.now()) {
  if (!canvas || !ctx) return;
  const w = canvas.width;
  const h = canvas.height;
  const isNight = state.patternIndex === 1;

  // 1. Alap háttér + 1px éles négyzetháló
  ctx.fillStyle = isNight ? '#0f172a' : '#fffdf5';
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = isNight ? 'rgba(148, 163, 184, 0.2)' : 'rgba(30, 41, 59, 0.09)';
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
  const { topSafe, bottomSafe } = getSafeViewportBounds(w, h);
  const safeH = bottomSafe - topSafe;
  const cx = w / 2;

  // 2. Négy sarok-fókuszgyűrű szálkereszttel (sarokélesség ellenőrzése)
  const cornerMarginX = Math.max(44, Math.min(82, w * 0.07));
  const cornerR = w < 640 ? 20 : 26;
  const cornerTopY = topSafe + cornerR + 4;
  const cornerBotY = bottomSafe - cornerR - 4;

  drawCornerFocusTarget(ctx, cornerMarginX, cornerTopY, cornerR, '#0284c7', ink);
  drawCornerFocusTarget(ctx, w - cornerMarginX, cornerTopY, cornerR, '#16a34a', ink);
  drawCornerFocusTarget(ctx, cornerMarginX, cornerBotY, cornerR, '#16a34a', ink);
  drawCornerFocusTarget(ctx, w - cornerMarginX, cornerBotY, cornerR, '#0284c7', ink);

  // 3. Három nagy, éles geometriai főalakzat középen: Kör, Négyzet, Háromszög
  const shapeR = Math.max(46, Math.min(w * 0.105, safeH * 0.25, 102));
  const gapX = Math.max(shapeR * 2.35, Math.min(w * 0.27, 290));
  const centerY = Math.round(topSafe + safeH * 0.43);

  // A) Bal oldali éles KÖR
  const leftX = cx - gapX;
  ctx.save();
  ctx.fillStyle = isNight ? '#1e293b' : '#e0f2fe';
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(leftX, centerY, shapeR, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.lineWidth = 1.8;
  ctx.strokeStyle = ink;
  ctx.beginPath();
  ctx.arc(leftX, centerY, shapeR - 7, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // B) Középső éles NÉGYZET
  ctx.save();
  ctx.fillStyle = isNight ? '#1e293b' : '#fef3c7';
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 4;
  ctx.fillRect(cx - shapeR, centerY - shapeR, shapeR * 2, shapeR * 2);
  ctx.strokeRect(cx - shapeR, centerY - shapeR, shapeR * 2, shapeR * 2);
  ctx.lineWidth = 1.8;
  ctx.strokeStyle = ink;
  ctx.strokeRect(cx - shapeR + 7, centerY - shapeR + 7, (shapeR - 7) * 2, (shapeR - 7) * 2);
  ctx.restore();

  // C) Jobb oldali éles HÁROMSZÖG
  const rightX = cx + gapX;
  ctx.save();
  ctx.fillStyle = isNight ? '#1e293b' : '#dcfce7';
  ctx.strokeStyle = '#16a34a';
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(rightX, centerY - shapeR - 6);
  ctx.lineTo(rightX + shapeR + 10, centerY + shapeR);
  ctx.lineTo(rightX - shapeR - 10, centerY + shapeR);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Forma-feliratok közvetlenül az alakzatok alatt (betűélesség teszt!)
  ctx.save();
  ctx.fillStyle = ink;
  ctx.textAlign = 'center';
  ctx.font = w < 640
    ? '800 13px "Trebuchet MS", "Segoe UI", sans-serif'
    : '800 16px "Trebuchet MS", "Segoe UI", sans-serif';
  const labelY = centerY + shapeR + 24;
  ctx.fillText('KÖR', leftX, labelY);
  ctx.fillText('NÉGYZET', cx, labelY);
  ctx.fillText('HÁROMSZÖG', rightX, labelY);
  ctx.restore();

  // 4. Arany csillagok kirajzolása a 3 nagy formában
  if (activeStars.length !== state.targetStarCount) {
    rebuildStarLayout();
  }

  const isCelebrating = now < state.celebrateUntil || state.phase === 'transitioning' || state.phase === 'sharpness';
  const isHinting = now < state.hintHighlightUntil;

  activeStars.forEach((star, idx) => {
    let pulseScale = 1;
    let showGlow = false;
    let badgeNum = star.tappedOrder;

    if (isCelebrating) {
      pulseScale = now < state.celebrateUntil ? 1 + Math.sin(now * 0.025 + idx) * 0.13 : 1.04;
      showGlow = true;
      badgeNum = idx + 1;
    } else if (isHinting) {
      pulseScale = 1 + Math.sin(now * 0.022 + idx) * 0.12;
      showGlow = true;
      badgeNum = idx + 1;
    }

    drawStarWithBadge(ctx, star, '#1e293b', pulseScale, showGlow, badgeNum);
  });

  // Ha eltalálta a csillagszámot, jól látható zöld siker-felirat jelenik meg a formák felett!
  if (state.phase === 'transitioning' || state.phase === 'sharpness') {
    const bannerY = Math.max(topSafe + 24, centerY - shapeR - 22);
    ctx.save();
    ctx.font = w < 640
      ? '800 17px "Trebuchet MS", "Segoe UI", sans-serif'
      : '800 22px "Trebuchet MS", "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = isNight ? '#4ade80' : '#15803d';
    ctx.fillText(`✓ Ügyes! Pontosan ${state.targetStarCount} arany csillag ragyog a formákban!`, cx, bannerY);
    ctx.restore();
  }

  // 5. Olvashatósági és élességi tesztmondatok a biztonságos alsó sáv felett
  const textBaseY = Math.min(bottomSafe - 30, Math.max(labelY + 30, bottomSafe - 46));
  ctx.save();
  ctx.fillStyle = ink;
  ctx.textAlign = 'center';

  ctx.font = w < 640
    ? '800 16px "Trebuchet MS", "Segoe UI", sans-serif'
    : '800 21px "Trebuchet MS", "Segoe UI", sans-serif';
  ctx.fillText('Éles körök, egyenes vonalak és kristálytiszta betűk!', cx, textBaseY);

  ctx.font = w < 640
    ? '700 13px "Segoe UI", system-ui, sans-serif'
    : '700 15px "Segoe UI", system-ui, sans-serif';
  ctx.fillText('ÁRVÍZTŰRŐ TÜKÖRFÚRÓGÉP · 1234567890 · Minden apró részlet jól olvasható.', cx, textBaseY + 23);
  ctx.restore();
}

function startEffectLoop() {
  if (animFrameId) cancelAnimationFrame(animFrameId);
  const loop = (now) => {
    if (!state.isPlaying) {
      animFrameId = null;
      return;
    }
    drawSharpnessScene(now);
    if (now < state.hintHighlightUntil || now < state.celebrateUntil) {
      animFrameId = requestAnimationFrame(loop);
    } else {
      animFrameId = null;
      drawSharpnessScene();
    }
  };
  animFrameId = requestAnimationFrame(loop);
}

function syncPromptBarUI() {
  const questionEl = document.getElementById('sharpness-step-question');
  const countGroup = document.getElementById('sharpness-count-group');
  const qualityGroup = document.getElementById('sharpness-quality-group');

  if (state.phase === 'counting') {
    if (questionEl) {
      questionEl.textContent = '1/2. Hány arany csillag van a 3 nagy formában összesen?';
    }
    if (countGroup) countGroup.classList.remove('hidden');
    if (qualityGroup) qualityGroup.classList.add('hidden');

    document.querySelectorAll('.star-count-btn').forEach((el) => {
      const btn = /** @type {HTMLButtonElement} */ (el);
      const val = btn.dataset.starGuess || '';
      btn.textContent = val;
      btn.classList.remove('wrong-guess', 'correct-guess');
      btn.disabled = false;
    });
  } else if (state.phase === 'sharpness') {
    if (questionEl) {
      questionEl.textContent = `2/2. Szuper (${state.targetStarCount} csillag)! Minden forma és betű szép éles?`;
    }
    if (countGroup) countGroup.classList.add('hidden');
    if (qualityGroup) qualityGroup.classList.remove('hidden');
  }
}

function completeCountingStep() {
  if (state.phase !== 'counting') return;

  state.phase = 'transitioning';
  state.countedStars = state.targetStarCount;
  sound.playSuccess();

  const matchingBtn = /** @type {HTMLButtonElement | null} */ (
    document.querySelector(`.star-count-btn[data-star-guess="${state.targetStarCount}"]`)
  );
  document.querySelectorAll('.star-count-btn').forEach((el) => {
    /** @type {HTMLButtonElement} */ (el).disabled = true;
  });
  if (matchingBtn) {
    matchingBtn.textContent = `✓ ${state.targetStarCount}`;
    matchingBtn.classList.remove('wrong-guess');
    matchingBtn.classList.add('correct-guess');
  }

  const questionEl = document.getElementById('sharpness-step-question');
  if (questionEl) {
    questionEl.textContent = `✓ Talált! Pontosan ${state.targetStarCount} arany csillag van a képen!`;
  }

  state.celebrateUntil = performance.now() + 560;
  startEffectLoop();

  if (phaseTransitionTimer) clearTimeout(phaseTransitionTimer);
  phaseTransitionTimer = setTimeout(() => {
    state.phase = 'sharpness';
    syncPromptBarUI();
    rebuildStarLayout();
    drawSharpnessScene();
  }, 520);
}

export function submitStarGuess(guessedNumber) {
  if (!state.isPlaying || state.phase !== 'counting') return;

  if (guessedNumber === state.targetStarCount) {
    completeCountingStep();
    return;
  }

  sound.playSoftBoop();
  const wrongBtn = /** @type {HTMLButtonElement | null} */ (
    document.querySelector(`.star-count-btn[data-star-guess="${guessedNumber}"]`)
  );
  if (wrongBtn) {
    wrongBtn.classList.add('wrong-guess');
    wrongBtn.disabled = true;
  }

  const questionEl = document.getElementById('sharpness-step-question');
  if (questionEl) {
    questionEl.textContent = 'Számold meg a 3 nagy formában lévő csillagokat (rájuk is koppinthatsz)!';
  }

  state.hintHighlightUntil = performance.now() + 1200;
  startEffectLoop();
}

function handleCanvasPointerDown(clientX, clientY) {
  if (!state.isPlaying || state.phase !== 'counting' || !canvas) return;

  const rect = canvas.getBoundingClientRect();
  const x = clientX - rect.left;
  const y = clientY - rect.top;

  for (let i = 0; i < activeStars.length; i++) {
    const star = activeStars[i];
    const dist = Math.hypot(x - star.x, y - star.y);
    if (dist <= star.r + 18) {
      if (star.tappedOrder === 0) {
        state.tappedCount++;
        star.tappedOrder = state.tappedCount;
        sound.playTargetHit(state.tappedCount);
      } else {
        sound.playClick();
      }

      drawSharpnessScene();

      // Ha a gyerek az összes csillagot végigérintette a képernyőn, automatikusan elfogadjuk!
      if (state.tappedCount >= state.targetStarCount) {
        completeCountingStep();
      } else {
        const questionEl = document.getElementById('sharpness-step-question');
        if (questionEl) {
          questionEl.textContent = `Eddig megszámolva: ${state.tappedCount} csillag... keresd meg a többit is, vagy nyomj a számra!`;
        }
      }
      return;
    }
  }
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
      ? `Ügyesen megszámoltad mind a ${state.countedStars} arany csillagot, és visszaigazoltad, hogy minden forma szép éles!`
      : `Megszámoltad mind a ${state.countedStars} csillagot, és feljegyeztük, hogy a kép homályosnak tűnt.`;
  }
  if (summaryModal) {
    summaryModal.classList.remove('hidden');
  }

  if (typeof onModuleComplete === 'function') {
    onModuleComplete('sharpness', { autoCertificateCheck: false });
  }
}

function startSharpnessSession() {
  stopSession();

  const briefing = document.getElementById('briefing-sharpness');
  const summary = document.getElementById('summary-sharpness');
  const promptBar = document.getElementById('sharpness-prompt-bar');

  if (briefing) briefing.classList.add('hidden');
  if (summary) summary.classList.add('hidden');
  if (promptBar) promptBar.style.display = 'flex';

  document.body.classList.add('test-running');

  state.targetStarCount = pickFreshStarCount();
  state.countedStars = 0;
  state.tappedCount = 0;
  state.phase = 'counting';
  state.hintHighlightUntil = 0;
  state.celebrateUntil = 0;
  activeStars = [];
  syncPromptBarUI();

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

  document.querySelectorAll('.star-count-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const val = Number(/** @type {HTMLElement} */ (btn).dataset.starGuess || '0');
      if (val > 0) submitStarGuess(val);
    });
  });

  const c = document.getElementById('sharpness-canvas');
  if (c) {
    c.addEventListener('pointerdown', (e) => {
      if (!state.isPlaying) return;
      e.preventDefault();
      handleCanvasPointerDown(e.clientX, e.clientY);
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

  const replayBtn = document.getElementById('btn-sharpness-replay');
  if (replayBtn) {
    replayBtn.addEventListener('click', () => {
      sound.playClick();
      startSharpnessSession();
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
    rebuildStarLayout();
    drawSharpnessScene();
  }
}

export function stopSession() {
  state.isPlaying = false;
  if (animFrameId) {
    cancelAnimationFrame(animFrameId);
    animFrameId = null;
  }
  if (phaseTransitionTimer) {
    clearTimeout(phaseTransitionTimer);
    phaseTransitionTimer = null;
  }
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
  state.phase = 'counting';
  state.patternIndex = 0;
  state.countedStars = 0;
  state.tappedCount = 0;
  state.isSharp = null;
  state.completed = false;
  activeStars = [];
}

export function getResults() {
  const completed = state.completed && state.isSharp !== null;
  let summaryText = 'Még nem próbáltad ki';
  if (completed) {
    const starsPart = state.countedStars > 0 ? `${state.countedStars} csillag megszámolva · ` : '';
    summaryText = state.isSharp
      ? `${starsPart}Minden forma szép éles!`
      : `${starsPart}Homályos kép jelezve`;
  }

  return {
    completed,
    countedStars: state.countedStars,
    isSharp: state.isSharp,
    summaryText
  };
}
