/* ==========================================================================
   ALKALMAZÁSMAG ÉS ÁLLAPOTKEZELŐ ROUTER (js/main.js)
   SPDX-License-Identifier: 0BSD (Korlátozásmentesen szabadon felhasználható)
   - Központi Kioszk Konfiguráció (Cégnév + Hang engedélyezése/tiltása)
   - Moduláris teszt-regiszter és STATE.guidedScreens útválasztó
   - Rejtett Tripla-Koppintás (Triple-Tap) Animátor Reset
   - Tétlenségi Watchdog + Átkattintás-védett (Capture-Shield) Képernyővédő
   - Globális koppintási csillag-effektek
   ========================================================================== */

import { sound } from './soundEngine.js';
import * as chameleonGame from './modules/chameleonGame.js';
import * as gridTest from './modules/gridTest.js';
import * as multiTouchTest from './modules/multiTouchTest.js';
import * as targetTest from './modules/targetTest.js';
import * as sharpnessTest from './modules/sharpnessTest.js';
import * as reportModule from './modules/report.js';

/* ==========================================================================
   1. KIOSZK ALAPKONFIGURÁCIÓ (ITT ÁLLÍTHATÓ A CÉGNÉV ÉS A HANG!)
   ========================================================================== */
export const KIOSK_CONFIG = {
  /** A kezdőlapi üdvözlő feliratban megjelenő cégnév */
  companyName: '[Cég Neve]',

  /**
   * Hangrendszer engedélyezése:
   * - false (alapértelmezett): A hang teljesen le van tiltva, és a fejlécben
   *   a Hang: Be/Ki gomb sem jelenik meg (ideális hangszóró nélküli kioszkhoz).
   * - true: A hangeffektek működnek, és megjelenik a fejlécben a hangkapcsoló.
   */
  enableAudio: false
};

export const COMPANY_NAME = KIOSK_CONFIG.companyName;

// Hangmotor szinkronizálása az alapkonfigurációval már induláskor
sound.setSystemAudioAllowed(KIOSK_CONFIG.enableAudio);

/* ==========================================================================
   2. MODUL REGISZTER ÉS AKTÍV KÉPERNYŐLISTA
   Új modul hozzáadásakor vagy meglévő kikapcsolásakor ezt a két struktúrát
   kell szerkeszteni (részletes leírás a README.md fájlban).
   ========================================================================== */
const MODULE_ICONS = {
  chameleon: `<svg width="26" height="26" viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <path d="M7 21C7 12 16 9 24 14C27 16 27 21 22 22H9" fill="#4ade80" stroke="#1e293b" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M9 21C4 21 3 15 7 15C9 15 9 18 7 18" stroke="#1e293b" stroke-width="2.5" stroke-linecap="round"/>
    <circle cx="21" cy="15" r="2.5" fill="#1e293b"/>
  </svg>`,
  grid: `<svg width="26" height="26" viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <rect x="5" y="5" width="9" height="9" rx="2" fill="#facc15" stroke="#1e293b" stroke-width="2.2"/>
    <rect x="18" y="5" width="9" height="9" rx="2" fill="#38bdf8" stroke="#1e293b" stroke-width="2.2"/>
    <rect x="5" y="18" width="9" height="9" rx="2" fill="#4ade80" stroke="#1e293b" stroke-width="2.2"/>
    <rect x="18" y="18" width="9" height="9" rx="2" fill="#ef4444" stroke="#1e293b" stroke-width="2.2"/>
  </svg>`,
  multitouch: `<svg width="26" height="26" viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <path d="M16 4L18.8 11.4L26.8 12L20.6 17.2L22.6 25L16 20.6L9.4 25L11.4 17.2L5.2 12L13.2 11.4L16 4Z" fill="#facc15" stroke="#1e293b" stroke-width="2.2" stroke-linejoin="round"/>
  </svg>`,
  target: `<svg width="26" height="26" viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <circle cx="16" cy="16" r="11" fill="#ef4444" stroke="#1e293b" stroke-width="2.2"/>
    <circle cx="16" cy="16" r="6.5" fill="#ffffff" stroke="#1e293b" stroke-width="2"/>
    <circle cx="16" cy="16" r="2.8" fill="#ef4444"/>
  </svg>`,
  sharpness: `<svg width="26" height="26" viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <circle cx="12" cy="16" r="7" fill="#bae6fd" stroke="#1e293b" stroke-width="2.2"/>
    <polygon points="22,8 28,23 16,23" fill="#fde047" stroke="#1e293b" stroke-width="2.2" stroke-linejoin="round"/>
  </svg>`
};

export const MODULE_REGISTRY = {
  'screen-chameleon': {
    key: 'chameleon',
    shortTitle: 'Károly Bújócska',
    certLabel: 'Károly Bújócska (Képpontteszt)',
    iconBg: 'illus-green',
    iconSvg: MODULE_ICONS.chameleon,
    module: chameleonGame
  },
  'screen-grid': {
    key: 'grid',
    shortTitle: 'Pixel-Kifestő',
    certLabel: 'Pixel-Kifestő Rácsteszt',
    iconBg: 'illus-amber',
    iconSvg: MODULE_ICONS.grid,
    module: gridTest
  },
  'screen-multitouch': {
    key: 'multitouch',
    shortTitle: 'Tűzijáték',
    certLabel: 'Multi-Touch Tűzijáték',
    iconBg: 'illus-purple',
    iconSvg: MODULE_ICONS.multitouch,
    module: multiTouchTest
  },
  'screen-target': {
    key: 'target',
    shortTitle: '30s Célpont',
    certLabel: '30s Célpontvadászat',
    iconBg: 'illus-coral',
    iconSvg: MODULE_ICONS.target,
    module: targetTest
  },
  'screen-sharpness': {
    key: 'sharpness',
    shortTitle: 'Élesség & Forma',
    certLabel: 'Képélesség és Geometria',
    iconBg: 'illus-blue',
    iconSvg: MODULE_ICONS.sharpness,
    module: sharpnessTest
  }
};

export const STATE = {
  currentScreen: 'screen-welcome',
  isGuidedMode: false,
  /**
   * Aktív tesztképernyők sorrendje.
   * Ha egy képernyőt eltávolítasz innen, az adott játék automatikusan
   * elrejtőzik a kezdőlapról, a morzsasávból és az oklevélről is.
   */
  guidedScreens: [
    'screen-chameleon',
    'screen-grid',
    'screen-multitouch',
    'screen-target',
    'screen-sharpness',
    'screen-certificate'
  ]
};

function getActiveGameScreenIds() {
  return STATE.guidedScreens.filter((id) => id !== 'screen-certificate' && Boolean(MODULE_REGISTRY[id]));
}

/* ==========================================================================
   3. KÉPERNYŐVÁLTÓ ÉS MODUL ÉLETCIKLUS KEZELÉS
   ========================================================================== */
function stopAllRunningSessions() {
  Object.values(MODULE_REGISTRY).forEach((entry) => {
    if (typeof entry.module.stopSession === 'function') {
      entry.module.stopSession();
    }
  });
  reportModule.reset();
}

function getCertificateSummaryItems() {
  return getActiveGameScreenIds().map((screenId) => {
    const meta = MODULE_REGISTRY[screenId];
    return {
      key: meta.key,
      label: meta.certLabel,
      iconBg: meta.iconBg,
      iconSvg: meta.iconSvg,
      result: meta.module.getResults()
    };
  });
}

function updateWelcomeAndHeaderProgress() {
  const activeScreenIds = getActiveGameScreenIds();
  let completedCount = 0;

  document.querySelectorAll('[data-launch-screen]').forEach((el) => {
    const htmlEl = /** @type {HTMLElement} */ (el);
    const screenId = htmlEl.dataset.launchScreen || '';
    if (screenId === 'screen-certificate') return;

    const isEnabled = activeScreenIds.includes(screenId);
    htmlEl.style.display = isEnabled ? '' : 'none';

    const meta = MODULE_REGISTRY[screenId];
    if (!meta || !isEnabled) return;

    const res = meta.module.getResults();
    if (htmlEl.classList.contains('game-card')) {
      htmlEl.classList.toggle('completed', Boolean(res.completed));
      const statusSpan = htmlEl.querySelector('.game-status-text');
      if (statusSpan) {
        statusSpan.textContent = res.completed ? 'Teljesítve!' : 'Kipróbálásra vár';
      }
      const ctaSpan = htmlEl.querySelector('.game-card-cta-label');
      if (ctaSpan) {
        ctaSpan.textContent = res.completed ? 'Újrajátszás' : 'Indítás!';
      }
    }
  });

  activeScreenIds.forEach((screenId) => {
    const res = MODULE_REGISTRY[screenId].module.getResults();
    if (res.completed) completedCount++;
  });

  const totalCount = activeScreenIds.length;
  const certHeaderLabel = document.getElementById('cert-progress-label');
  if (certHeaderLabel) {
    certHeaderLabel.textContent = `Oklevél (${completedCount}/${totalCount})`;
  }

  const welcomeNote = document.getElementById('welcome-progress-note');
  if (welcomeNote) {
    welcomeNote.textContent =
      completedCount === totalCount && totalCount > 0
        ? `Minden próbát teljesítettél (${completedCount}/${totalCount})! Nézd meg az Okleveledet!`
        : `Teljesített játékok: ${completedCount} / ${totalCount} · Bármelyik kártyával kezdhetsz!`;
  }

  renderBreadcrumbs();
}

function renderBreadcrumbs() {
  const bar = document.getElementById('kiosk-breadcrumbs');
  if (!bar) return;

  const shouldShow =
    STATE.isGuidedMode &&
    STATE.currentScreen !== 'screen-welcome' &&
    STATE.currentScreen !== 'screen-certificate';

  bar.classList.toggle('visible', shouldShow);
  bar.innerHTML = '';
  if (!shouldShow) return;

  STATE.guidedScreens.forEach((screenId, idx) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'crumb-btn';
    if (screenId === STATE.currentScreen) btn.classList.add('active');

    if (screenId === 'screen-certificate') {
      btn.textContent = `${idx + 1}. Oklevél`;
    } else {
      const meta = MODULE_REGISTRY[screenId];
      if (!meta) return;
      const res = meta.module.getResults();
      if (res.completed) btn.classList.add('done');
      btn.textContent = `${idx + 1}. ${meta.shortTitle}`;
    }

    btn.addEventListener('click', () => {
      sound.playClick();
      showScreen(screenId);
    });
    bar.appendChild(btn);
  });
}

function handleModuleComplete(_moduleKey, options = {}) {
  updateWelcomeAndHeaderProgress();

  if (!options.exitToHub) {
    return;
  }

  if (STATE.isGuidedMode) {
    advanceGuided();
    return;
  }

  // Ha mind az összes aktív játék elkészült, automatikusan megnyitja a konfettis Oklevelet
  const activeIds = getActiveGameScreenIds();
  const allDone =
    activeIds.length > 0 &&
    activeIds.every((id) => MODULE_REGISTRY[id].module.getResults().completed);

  if (allDone) {
    showScreen('screen-certificate');
  } else {
    showScreen('screen-welcome');
  }
}

export function advanceGuided() {
  const idx = STATE.guidedScreens.indexOf(STATE.currentScreen);
  if (idx >= 0 && idx < STATE.guidedScreens.length - 1) {
    showScreen(STATE.guidedScreens[idx + 1]);
  } else {
    showScreen('screen-certificate');
  }
}

export function showScreen(screenId) {
  stopAllRunningSessions();
  document.body.classList.remove('test-running');

  document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
  const targetEl = document.getElementById(screenId);
  if (targetEl) {
    targetEl.classList.add('active');
    STATE.currentScreen = screenId;
  }

  const meta = MODULE_REGISTRY[screenId];
  if (meta) {
    meta.module.init({ onComplete: handleModuleComplete });
  } else if (screenId === 'screen-certificate') {
    reportModule.init(getCertificateSummaryItems());
  }

  updateWelcomeAndHeaderProgress();
  resetWatchdog();
}

export function resetAllModules() {
  stopAllRunningSessions();
  Object.values(MODULE_REGISTRY).forEach((entry) => {
    entry.module.reset();
  });
  reportModule.reset();
  STATE.isGuidedMode = false;
  updateWelcomeAndHeaderProgress();
}

/* ==========================================================================
   4. REJTETT ANIMÁTOR RESET (TRIPLE-TAP: 3 GYORS KOPPINTÁS A FEJLÉC CÍMÉRE)
   ========================================================================== */
/** @type {number[]} */
let tripleTapTimestamps = [];
let toastTimer = null;

function showAnimatorToast(message) {
  const toast = document.getElementById('animator-toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('visible');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('visible');
  }, 2200);
}

function registerTripleTapCandidate(e) {
  e.stopPropagation();
  const now = performance.now();
  tripleTapTimestamps = tripleTapTimestamps.filter((t) => now - t < 850);
  tripleTapTimestamps.push(now);

  if (tripleTapTimestamps.length >= 3) {
    tripleTapTimestamps = [];
    performAnimatorReset();
  }
}

export function performAnimatorReset() {
  hideIdleAlert();
  hideScreensaver();
  resetAllModules();
  sound.playClick();
  showScreen('screen-welcome');
  showAnimatorToast('Játékállás nullázva — kész a következő látogatóra!');
}

/* ==========================================================================
   5. GLOBÁLIS KOPPINTÁSI CSILLAG-EFFEKT (AZONNALI VIZUÁLIS VISSZAJELZÉS)
   ========================================================================== */
const STAR_COLORS = ['#f59e0b', '#16a34a', '#0284c7', '#ef4444', '#9333ea'];

function spawnTapStars(clientX, clientY) {
  const layer = document.getElementById('tap-fx-layer');
  if (!layer) return;

  for (let i = 0; i < 6; i++) {
    const star = document.createElement('div');
    star.className = 'tap-star';
    const angle = (Math.PI * 2 * i) / 6 + (Math.random() - 0.5) * 0.4;
    const dist = 26 + Math.random() * 24;
    const dx = Math.round(Math.cos(angle) * dist);
    const dy = Math.round(Math.sin(angle) * dist);
    const color = STAR_COLORS[i % STAR_COLORS.length];

    star.style.left = `${clientX}px`;
    star.style.top = `${clientY}px`;
    star.style.setProperty('--dx', `${dx}px`);
    star.style.setProperty('--dy', `${dy}px`);
    star.innerHTML = `<svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true">
      <polygon points="10,1 12.6,7 19,7.5 14,12 15.6,18.5 10,15 4.4,18.5 6,12 1,7.5 7.4,7" fill="${color}" stroke="#1e293b" stroke-width="1.5"/>
    </svg>`;

    layer.appendChild(star);
    setTimeout(() => {
      star.remove();
    }, 480);
  }
}

/* ==========================================================================
   6. TÉTLENSÉGI WATCHDOG ÉS SEMLEGES SZÖVEGŰ BEÉGÉSVÉDŐ KÉPERNYŐVÉDŐ
   ========================================================================== */
const IDLE_LIMIT_SEC = 120;
const IDLE_COUNTDOWN_SEC = 60;

let idleTimeoutId = null;
let idleIntervalId = null;
let countdownRemaining = IDLE_COUNTDOWN_SEC;

let ssCanvas = null;
let ssCtx = null;
let ssAnimFrame = null;
let isScreensaverActive = false;

/**
 * Ébresztési kattintás-pajzs (Capture-Phase Wake Shield):
 * Megakadályozza, hogy a képernyővédő (vagy tétlenségi ablak) felébresztésére
 * szolgáló érintés ujjfelemeléskor (pointerup / touchend / szintetikus click)
 * megnyomjon egy alatta lévő játékkártyát vagy menügombot!
 */
let wakingPointerActive = false;
let wakeGuardUntil = 0;

function isIdleModalActive() {
  const modal = document.getElementById('modal-idle');
  return Boolean(modal && modal.classList.contains('active'));
}

const ssCard = {
  x: 120,
  y: 120,
  w: 470,
  h: 185,
  vx: 1.35,
  vy: 1.0
};
/** @type {Array<{x:number, y:number, vx:number, vy:number, r:number, color:string}>} */
let ssStars = [];

function drawRoundedBox(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.lineTo(x + w - r, y);
  c.arcTo(x + w, y, x + w, y + r, r);
  c.lineTo(x + w, y + h - r);
  c.arcTo(x + w, y + h, x + w - r, y + h, r);
  c.lineTo(x + r, y + h);
  c.arcTo(x, y + h, x, y + h - r, r);
  c.lineTo(x, y + r);
  c.arcTo(x, y, x + r, y, r);
  c.closePath();
}

function initScreensaverCanvas() {
  ssCanvas = /** @type {HTMLCanvasElement | null} */ (document.getElementById('screensaver-canvas'));
  if (!ssCanvas) return;
  ssCtx = ssCanvas.getContext('2d');
  ssCanvas.width = window.innerWidth;
  ssCanvas.height = window.innerHeight;

  ssStars = [];
  for (let i = 0; i < 42; i++) {
    ssStars.push({
      x: Math.random() * ssCanvas.width,
      y: Math.random() * ssCanvas.height,
      vx: (Math.random() - 0.5) * 0.65,
      vy: (Math.random() - 0.5) * 0.65,
      r: 2 + Math.random() * 2.5,
      color: STAR_COLORS[i % STAR_COLORS.length]
    });
  }

  ssCard.w = Math.min(480, ssCanvas.width - 48);
  ssCard.h = 180;
  ssCard.x = Math.max(24, (ssCanvas.width - ssCard.w) / 2);
  ssCard.y = Math.max(24, (ssCanvas.height - ssCard.h) / 2);
}

function animateScreensaver(now) {
  if (!isScreensaverActive || !ssCanvas || !ssCtx) return;

  const w = ssCanvas.width;
  const h = ssCanvas.height;

  ssCtx.fillStyle = '#090d16';
  ssCtx.fillRect(0, 0, w, h);

  for (let i = 0; i < ssStars.length; i++) {
    const st = ssStars[i];
    st.x += st.vx;
    st.y += st.vy;
    if (st.x < 0) st.x = w;
    if (st.x > w) st.x = 0;
    if (st.y < 0) st.y = h;
    if (st.y > h) st.y = 0;

    ssCtx.fillStyle = st.color;
    ssCtx.globalAlpha = 0.45;
    ssCtx.fillRect(st.x, st.y, st.r * 2, st.r * 2);
  }
  ssCtx.globalAlpha = 1;

  ssCard.x += ssCard.vx;
  ssCard.y += ssCard.vy;

  if (ssCard.x <= 20) {
    ssCard.x = 20;
    ssCard.vx = Math.abs(ssCard.vx);
  } else if (ssCard.x + ssCard.w >= w - 20) {
    ssCard.x = w - 20 - ssCard.w;
    ssCard.vx = -Math.abs(ssCard.vx);
  }

  if (ssCard.y <= 20) {
    ssCard.y = 20;
    ssCard.vy = Math.abs(ssCard.vy);
  } else if (ssCard.y + ssCard.h >= h - 20) {
    ssCard.y = h - 20 - ssCard.h;
    ssCard.vy = -Math.abs(ssCard.vy);
  }

  ssCtx.save();
  ssCtx.fillStyle = '#fffdf5';
  ssCtx.strokeStyle = '#facc15';
  ssCtx.lineWidth = 4;
  drawRoundedBox(ssCtx, ssCard.x, ssCard.y, ssCard.w, ssCard.h, 24);
  ssCtx.fill();
  ssCtx.stroke();

  // Barátságos csillag/embléma a kártya jobb felső sarkában
  const kx = ssCard.x + ssCard.w - 56;
  const ky = ssCard.y + 52;
  ssCtx.fillStyle = '#fef3c7';
  ssCtx.strokeStyle = '#1e293b';
  ssCtx.lineWidth = 3;
  ssCtx.beginPath();
  ssCtx.arc(kx, ky, 22, 0, Math.PI * 2);
  ssCtx.fill();
  ssCtx.stroke();

  ssCtx.fillStyle = '#f59e0b';
  ssCtx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a1 = (i * 2 * Math.PI) / 5 - Math.PI / 2;
    const a2 = a1 + Math.PI / 5;
    const ox = kx + Math.cos(a1) * 12;
    const oy = ky + Math.sin(a1) * 12;
    const ix = kx + Math.cos(a2) * 5.5;
    const iy = ky + Math.sin(a2) * 5.5;
    if (i === 0) ssCtx.moveTo(ox, oy);
    else ssCtx.lineTo(ox, oy);
    ssCtx.lineTo(ix, iy);
  }
  ssCtx.closePath();
  ssCtx.fill();
  ssCtx.stroke();

  ssCtx.fillStyle = '#1e293b';
  ssCtx.textAlign = 'left';
  ssCtx.font = '800 22px "Trebuchet MS", "Segoe UI", sans-serif';
  ssCtx.fillText('Nyílt Napi Játéksziget', ssCard.x + 26, ssCard.y + 52);

  ssCtx.fillStyle = '#475569';
  ssCtx.font = '700 16px "Segoe UI", sans-serif';
  ssCtx.fillText('Próbáld ki a vidám érintőképernyős játékokat!', ssCard.x + 26, ssCard.y + 86);

  const pulse = 0.65 + Math.sin(now * 0.004) * 0.35;
  ssCtx.fillStyle = `rgba(2, 132, 199, ${pulse})`;
  ssCtx.font = '800 18px "Trebuchet MS", "Segoe UI", sans-serif';
  ssCtx.fillText('Érintsd meg a képernyőt a kezdéshez!', ssCard.x + 26, ssCard.y + 138);

  ssCtx.restore();

  ssAnimFrame = requestAnimationFrame(animateScreensaver);
}

function showScreensaver() {
  if (isScreensaverActive) return;
  isScreensaverActive = true;
  const overlay = document.getElementById('screensaver-overlay');
  if (overlay) overlay.classList.add('active');
  initScreensaverCanvas();
  if (ssAnimFrame) cancelAnimationFrame(ssAnimFrame);
  ssAnimFrame = requestAnimationFrame(animateScreensaver);
}

function hideScreensaver() {
  if (!isScreensaverActive) return;
  isScreensaverActive = false;
  const overlay = document.getElementById('screensaver-overlay');
  if (overlay) overlay.classList.remove('active');
  if (ssAnimFrame) {
    cancelAnimationFrame(ssAnimFrame);
    ssAnimFrame = null;
  }
}

function showIdleAlert() {
  countdownRemaining = IDLE_COUNTDOWN_SEC;
  const numEl = document.getElementById('idle-countdown-num');
  const modal = document.getElementById('modal-idle');
  if (numEl) numEl.textContent = String(countdownRemaining);
  if (modal) modal.classList.add('active');

  if (idleIntervalId) clearInterval(idleIntervalId);
  idleIntervalId = setInterval(() => {
    countdownRemaining--;
    if (numEl) numEl.textContent = String(countdownRemaining);
    if (countdownRemaining <= 0) {
      hideIdleAlert();
      resetAllModules();
      showScreen('screen-welcome');
    }
  }, 1000);
}

function hideIdleAlert() {
  if (idleIntervalId) {
    clearInterval(idleIntervalId);
    idleIntervalId = null;
  }
  const modal = document.getElementById('modal-idle');
  if (modal) modal.classList.remove('active');
}

export function resetWatchdog() {
  if (isScreensaverActive) {
    hideScreensaver();
    sound.playClick();
  }
  hideIdleAlert();

  if (idleTimeoutId) {
    clearTimeout(idleTimeoutId);
    idleTimeoutId = null;
  }

  if (STATE.currentScreen === 'screen-welcome') {
    idleTimeoutId = setTimeout(() => {
      showScreensaver();
    }, IDLE_LIMIT_SEC * 1000);
  } else {
    idleTimeoutId = setTimeout(() => {
      showIdleAlert();
    }, IDLE_LIMIT_SEC * 1000);
  }
}

/* ==========================================================================
   7. ESEMÉNYKEZELŐK ÉS INDÍTÁS (BOOTSTRAP)
   ========================================================================== */
function bindGlobalControls() {
  // Cégnév beillesztése a kezdőlapi főcímbe
  const companyTitleEl = document.getElementById('welcome-company-title');
  if (companyTitleEl) {
    companyTitleEl.textContent = `Üdvözlünk a ${KIOSK_CONFIG.companyName} 2026-os Nyílt Napján!`;
  }

  // Hang Ki/Be kapcsoló láthatósága és működése KIOSK_CONFIG.enableAudio alapján
  const soundBtn = document.getElementById('btn-sound-toggle');
  const soundLabel = document.getElementById('sound-label');
  if (soundBtn) {
    if (KIOSK_CONFIG.enableAudio) {
      soundBtn.style.display = 'inline-flex';
      if (soundLabel) soundLabel.textContent = 'Hang: Be';
      soundBtn.addEventListener('click', () => {
        const isOn = sound.toggle();
        if (soundLabel) soundLabel.textContent = isOn ? 'Hang: Be' : 'Hang: Ki';
        if (isOn) sound.playClick();
      });
    } else {
      soundBtn.style.display = 'none';
    }
  }

  // Játékkártyák és fejléc gyorslinkek indítása szabad sorrendben
  document.querySelectorAll('[data-launch-screen]').forEach((el) => {
    el.addEventListener('click', () => {
      const targetScreen = /** @type {HTMLElement} */ (el).dataset.launchScreen;
      if (!targetScreen) return;
      sound.playClick();
      STATE.isGuidedMode = false;
      showScreen(targetScreen);
    });
  });

  // Játék közbeni "Kártyák" visszalépő gombok
  document.querySelectorAll('.js-back-to-hub').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      sound.playClick();
      STATE.isGuidedMode = false;
      showScreen('screen-welcome');
    });
  });

  // Oklevél képernyő gombjai
  const certRestartBtn = document.getElementById('btn-cert-restart');
  if (certRestartBtn) {
    certRestartBtn.addEventListener('click', () => {
      sound.playClick();
      resetAllModules();
      showScreen('screen-welcome');
    });
  }

  const certBackBtn = document.getElementById('btn-cert-back-hub');
  if (certBackBtn) {
    certBackBtn.addEventListener('click', () => {
      sound.playClick();
      showScreen('screen-welcome');
    });
  }

  // Kezdőlap gomb
  const homeBtn = document.getElementById('btn-global-home');
  if (homeBtn) {
    homeBtn.addEventListener('click', () => {
      sound.playClick();
      STATE.isGuidedMode = false;
      showScreen('screen-welcome');
    });
  }

  // Rejtett Animátor Reset: 3 gyors koppintás a fejléc logójára/címére vagy a sarok-emblémára
  document.querySelectorAll('.js-triple-tap-reset').forEach((trigger) => {
    trigger.addEventListener('pointerdown', registerTripleTapCandidate);
  });

  // CAPTURE-FÁZISÚ ÉBRESZTÉSI VÉDELEM:
  // Ha a képernyővédő vagy a tétlenségi ablak aktív, az első érintés kizárólag
  // felébreszti a kijelzőt (és megmutatja a Kezdőlapot), de elnyeli a teljes
  // pointerdown -> pointerup -> click sorozatot, így SOHA nem nyit meg véletlenül játékot!
  window.addEventListener(
    'pointerdown',
    (e) => {
      if (isScreensaverActive) {
        wakingPointerActive = true;
        wakeGuardUntil = performance.now() + 800;
        spawnTapStars(e.clientX, e.clientY);
        if (STATE.currentScreen !== 'screen-welcome') {
          showScreen('screen-welcome');
        }
        resetWatchdog();
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return;
      }

      if (isIdleModalActive()) {
        wakingPointerActive = true;
        wakeGuardUntil = performance.now() + 800;
        spawnTapStars(e.clientX, e.clientY);
        sound.playClick();
        resetWatchdog();
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return;
      }

      // Új, normál érintés aktív felületen: töröljük a korábbi ébresztési zárat
      wakingPointerActive = false;
      wakeGuardUntil = 0;
    },
    true
  );

  window.addEventListener(
    'touchstart',
    (e) => {
      if (isScreensaverActive || isIdleModalActive() || wakingPointerActive) {
        if (isScreensaverActive || isIdleModalActive()) {
          wakingPointerActive = true;
          wakeGuardUntil = performance.now() + 800;
          resetWatchdog();
        }
        if (e.cancelable) e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
      }
    },
    { capture: true, passive: false }
  );

  const releaseWakePointer = (e) => {
    if (wakingPointerActive) {
      wakingPointerActive = false;
      wakeGuardUntil = performance.now() + 450;
      if (e.cancelable) e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
    } else if (performance.now() < wakeGuardUntil) {
      if (e.cancelable) e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
    }
  };

  window.addEventListener('pointerup', releaseWakePointer, true);
  window.addEventListener('pointercancel', releaseWakePointer, true);
  window.addEventListener('touchend', releaseWakePointer, { capture: true, passive: false });
  window.addEventListener('mouseup', releaseWakePointer, true);

  window.addEventListener(
    'click',
    (e) => {
      if (wakingPointerActive || performance.now() < wakeGuardUntil) {
        wakeGuardUntil = 0;
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
      }
    },
    true
  );

  // Csillag-effekt gomb- és kártyaérintéskor (normál, nem ébresztő érintéseknél)
  document.addEventListener('pointerdown', (e) => {
    const target = /** @type {HTMLElement | null} */ (e.target);
    if (target && target.closest('.btn-storybook, .game-card, .nav-text-btn')) {
      spawnTapStars(e.clientX, e.clientY);
    }
    resetWatchdog();
  });

  // Inaktivitási modal gomb tartalék eseménykezelő
  const idleResumeBtn = document.getElementById('btn-idle-resume');
  if (idleResumeBtn) {
    idleResumeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      sound.playClick();
      resetWatchdog();
    });
  }

  // Ablakméret változás lekezelése minden vászon-modulhoz
  window.addEventListener('resize', () => {
    chameleonGame.handleResize();
    multiTouchTest.handleResize();
    targetTest.handleResize();
    sharpnessTest.handleResize();
    reportModule.handleResize();
    if (isScreensaverActive) initScreensaverCanvas();
  });

  // Fejlesztői billentyűzet-gyorsgombok otthoni teszteléshez
  window.addEventListener('keydown', (e) => {
    if (isScreensaverActive || isIdleModalActive()) {
      resetWatchdog();
      e.preventDefault();
      return;
    }
    resetWatchdog();
    const k = e.key;
    if (k === 'Escape') {
      showScreen('screen-welcome');
    } else if ((k === 'm' || k === 'M') && KIOSK_CONFIG.enableAudio) {
      const isOn = sound.toggle();
      if (soundLabel) soundLabel.textContent = isOn ? 'Hang: Be' : 'Hang: Ki';
    } else if (STATE.currentScreen === 'screen-multitouch') {
      if (k === '2') multiTouchTest.simulateFireworkTouches(2);
      if (k === '5') multiTouchTest.simulateFireworkTouches(5);
      if (k === '0') multiTouchTest.simulateFireworkTouches(10);
    } else if (STATE.currentScreen === 'screen-target' && k === ' ') {
      targetTest.popFirstTargetForTest();
      e.preventDefault();
    } else if (STATE.currentScreen === 'screen-sharpness') {
      if (k === 'g' || k === 'G') {
        sharpnessTest.toggleSharpnessPattern();
      } else if (k === '4' || k === '5' || k === '6' || k === '7') {
        sharpnessTest.submitStarGuess(Number(k));
      }
    }
  });
}

window.addEventListener('DOMContentLoaded', () => {
  bindGlobalControls();
  resetAllModules();
  showScreen('screen-welcome');
});
