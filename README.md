# Nyílt Napi Érintőképernyő Kioszk (Gyerekbarát Kiadás)

## 1. Project Overview

A **Nyílt Napi Érintőképernyő Kioszk** egy 100%-ban offline, teljesen névtelen (GDPR-konform), egyképernyős (görgetésmentes) webalkalmazás céges nyílt napokra és érintőterminálokra. Az alkalmazás a klasszikus érintőpanel- és kijelződiagnosztikai teszteket öt vidám, mesekönyvi pixel-art stílusú gyerekjátékká alakítja át:

- **Károly, a Kaméleon Bújócska** — Képpont- és színhomogenitás ellenőrzés 5 tiszta alapszínen és 2 szemkímélő mintán, mérhető keresési idővel.
- **Pixel-Kifestő Meglepetés (Rácsteszt)** — 24×14-es teljes képernyős érintőmátrix ujj elől kitérő menüsávval, amelyben 12 véletlenszerűen váltakozó, árnyalt pixel-art alakzat (*Cirmos Kiscica, Vidám Kiskutya, Barátságos Dínó, Színes Pillangó, Csillagközi Űrrakéta, Álmos Kisbagoly, Mosolygós Béka, Édes Piros Eper, Vitorlás Kishajó, Pöttyös Gombaházikó, Szivárvány és Felhők, Mosolygós Napocska*) rajzolódik ki.
- **Tűzijáték Mód (Multi-Touch)** — Akár 10 egyidejű ujj érzékelése látványos pixel-csillag robbanásokkal.
- **30 Másodperces Célpontvadászat** — Reakcióidő (ms) és találati pontosság mérése nagy arkád visszaszámlálóval.
- **Képélesség és Formák** — Egyszerűsített, gyerekbarát geometriai és olvashatósági ellenőrzés.
- **Névtelen Mester Oklevél & Konfetti** — Egyképernyős ünnepi értékelő felület személyes adatok bekérése nélkül.

### Gyors Konfiguráció (`KIOSK_CONFIG` a `js/main.js` tetején)
A `js/main.js` fájl legelején található `KIOSK_CONFIG` objektumban egyetlen sorral testreszabható a cégnév és a hangrendszer:
- `companyName`: A kezdőlapi *„Üdvözlünk a [Cég Neve] 2026-os Nyílt Napján!”* szövegben megjelenő név.
- `enableAudio`: Alapértelmezetten `false` (teljesen néma üzemmód, és a fejlécből is automatikusan elrejti a hangkapcsoló gombot a hangszóró nélküli kioszkokhoz). Ha a terminálnak van hangszórója, állítsd `true`-ra, és azonnal aktiválódik a Web Audio szintetizátor, valamint megjelenik a fejlécben a `Hang: Be / Ki` gomb!

---

## 2. Modular Architecture

A projekt tiszta, felelősségi körök szerint szétválasztott ES-modulokra épül:

```text
/
├── index.html                  # Görgetésmentes HTML váz, képernyő-szekciók és párbeszédablakok
├── css/
│   └── styles.css              # 100vh mesekönyvi pixel-art stíluslap, >=60x60px érintőgombok
├── js/
│   ├── main.js                 # KIOSK_CONFIG, képernyő-router, watchdog, triple-tap animátor reset
│   ├── soundEngine.js          # Web Audio API hangszintetizátor (központilag tiltható/engedélyezhető)
│   └── modules/
│       ├── chameleonGame.js    # "Károly, a Kaméleon" 7 pályás (szemkímélő) bújócska
│       ├── gridTest.js         # 24x14-es Pixel-Kifestő 12 árnyalt figurával + kitérő menüvel
│       ├── multiTouchTest.js   # Tűzijátékos többujjas érintőteszt
│       ├── targetTest.js       # 30 másodperces célpontvadászat (időzítővel és ms átlaggal)
│       ├── sharpnessTest.js    # Gyerekbarát képélesség és geometria ellenőrzés
│       └── report.js           # Névtelen oklevél generáló és Canvas konfetti animáció
└── README.md                   # Fejlesztői és üzemeltetési dokumentáció
```

### Egységes Modul-Interfész
Minden `js/modules/` alatti játéknak egységes életciklus-függvényeket kell exportálnia:
- `init(callbacks)` — Felkészíti és megjeleníti a modul kezdőállapotát; a `callbacks.onComplete(key, { exitToHub: true })` hívással jelzi a központi routernek a befejezést.
- `reset()` — Leállítja az összes belső `setInterval` / `setTimeout` / `requestAnimationFrame` folyamatot, és alaphelyzetbe állítja a modul pontszámait.
- `getResults()` — Visszaad egy `{ completed: boolean, summaryText: string, ...metrics }` objektumot az Oklevél és a kezdőlapi állapotjelző számára.
- `handleResize()` *(opcionális, Canvas modulokhoz)* — Újraméretezi a vásznat ablakméret-változáskor.
- `stopSession()` *(opcionális)* — Megállítja a futó játékmenetet képernyőváltáskor az eddigi eredmény törlése nélkül.

---

## 3. How to Add a New Test Module

Új játék vagy hardverteszt hozzáadása 5 átlátható lépésből áll:

### 1. lépés: Hozz létre egy új `.js` fájlt a `js/modules/` mappában
Hozz létre például egy `js/modules/reflexTest.js` fájlt:

```javascript
// js/modules/reflexTest.js
import { sound } from '../soundEngine.js';

let onModuleComplete = null;
const state = { completed: false };

export function init(callbacks = {}) {
  onModuleComplete = callbacks.onComplete || null;
  const finishBtn = document.getElementById('btn-reflex-finish');
  if (finishBtn) {
    finishBtn.onclick = () => {
      state.completed = true;
      sound.playFanfare();
      if (onModuleComplete) onModuleComplete('reflex', { exitToHub: true });
    };
  }
}

export function stopSession() {}

export function reset() {
  stopSession();
  state.completed = false;
}

export function getResults() {
  return {
    completed: state.completed,
    summaryText: state.completed ? 'Villámgyors reflex igazolva!' : 'Még nem próbáltad ki'
  };
}
```

### 2. lépés: Exportáld az `init()`, `reset()` és `getResults()` függvényeket
Ügyelj arra, hogy a `reset()` minden futó időzítőt leállítson, hogy a rejtett tripla-koppintásos animátor reset bármely pillanatban biztonságosan megszakíthassa a játékot.

### 3. lépés: Adj hozzá egy `<section>` elemet az `index.html` fájlhoz
A `<main class="view-container">` elemen belül helyezd el az új képernyőt egyedi `id`-val (`id="screen-reflex"`).

### 4. lépés: Regisztráld a modult a `js/main.js` routerben és a morzsasávban
Importáld a modult a `js/main.js` tetején, add hozzá a `MODULE_REGISTRY` objektumhoz, majd vedd fel a képernyő-azonosítót a `STATE.guidedScreens` tömbbe (a `'screen-certificate'` elé):

```javascript
import * as reflexTest from './modules/reflexTest.js';

// MODULE_REGISTRY bővítése:
'screen-reflex': {
  key: 'reflex',
  shortTitle: 'Reflex',
  certLabel: 'Reflex Próba',
  iconBg: 'illus-blue',
  iconSvg: '<svg width="26" height="26" viewBox="0 0 32 32"></svg>',
  module: reflexTest
}

// STATE.guidedScreens bővítése:
guidedScreens: [
  'screen-chameleon',
  'screen-grid',
  'screen-multitouch',
  'screen-target',
  'screen-sharpness',
  'screen-reflex',
  'screen-certificate'
]
```

### 5. lépés: Adj hozzá egy kártyát a Kezdőlap (`.games-grid`) rácsához
Az `index.html` fájlban szúrj be egy `<button type="button" class="game-card" data-launch-screen="screen-reflex">` elemet. A keretrendszer automatikusan beköti az indítást, a teljesítés-számlálót és az Oklevelet.

---

## 4. How to Disable or Replace an Existing Test

### Meglévő teszt ideiglenes kikapcsolása
A `js/main.js` fájlban található `STATE.guidedScreens` tömb vezérli az összes aktív modult. Ha egy tesztet ki szeretnél venni, kommentezd ki vagy töröld a sorát a `STATE.guidedScreens` tömbből:

```javascript
guidedScreens: [
  'screen-chameleon',
  'screen-grid',
  'screen-multitouch',
  'screen-target',
  // 'screen-sharpness', <-- Kikapcsolva
  'screen-certificate'
]
```

A kikapcsolt modul kártyája, fejléc-hivatkozása és oklevél-sora automatikusan elrejtőzik, az Oklevél számlálója pedig automatikusan igazodik a fennmaradó tesztek számához.

### Meglévő teszt vagy Pixel-Kifestő alakzatok bővítése
- Egy teljes modul cseréjéhez elég a `MODULE_REGISTRY['screen-...'].module` hivatkozást átállítani az új modulra.
- Új pixel-art kifestő alakzat hozzáadásához a `js/modules/gridTest.js` fájl `PIXEL_TEMPLATES` tömbjébe vegyél fel egy új `24×14`-es karaktertérképet — a sorsoló automatikusan beveszi a kevert rotációba!

---

## 5. Kiosk & Local Deployment

Az alkalmazás **100%-ban offline** működik, semmilyen internetkapcsolatot nem igényel.

### Cégnév és Hang beállítása telepítés előtt (`js/main.js`)
```javascript
export const KIOSK_CONFIG = {
  companyName: 'Példa Kft.',
  enableAudio: false // Állítsd true-ra, ha a terminál rendelkezik hangszóróval!
};
```

### A) Futtatás helyi HTTP szerverről + Kioszk böngésző módban
Indíts egy helyi statikus szervert a projekt gyökérkönyvtárában:
```bash
python3 -m http.server 8080
```
Majd indítsd a böngészőt teljes képernyős kioszk módban:
```bash
chrome.exe --kiosk http://localhost:8080
```

### B) Közvetlen megnyitás szerver nélkül (`index.html` / Dedikált Kioszk PC)
Helyi webszerver nélkül indítsd a Chrome vagy Edge böngészőt a helyi ES-modulok betöltését engedélyező kioszk kapcsolókkal:

```bash
# Windows:
chrome.exe --kiosk --allow-file-access-from-files "C:\kiosk\index.html"

# Linux:
chromium-browser --kiosk --allow-file-access-from-files /opt/kiosk/index.html
```

### Rejtett Személyzeti (Animátor) Funkciók
- **3 gyors koppintás (Triple-Tap) a bal felső emblémára / címre**: Azonnali nullázás és visszatérés a Kezdőlapra (aktív játék közben a bal felső sarok-emblémán is működik).
- **`Esc` billentyű**: Azonnali visszalépés a Kezdőlapra.
- **`M` billentyű** *(csak ha `enableAudio: true`)*: Hang némítása / visszakapcsolása.
