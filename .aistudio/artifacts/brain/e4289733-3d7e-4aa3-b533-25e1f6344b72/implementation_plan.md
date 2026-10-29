# Nyílt Napi Gyerekbarát Érintőképernyő Kioszk — Érintésbiztonsági, Játékélmény- és Licencfejlesztési Terv

Megszüntetjük a képernyővédő felébresztésekor jelentkező véletlen gombmegnyomási hibát, 4 másodperces vizuális visszaszámláló sávot adunk a Pixel-Kifestő végéhez az elkészült kép zavartalan megcsodálásához, játékos csillagszámoló feladattal bővítjük a Képélesség és Formák tesztet, valamint korlátozásmentes, cégek számára is teljesen szabadon felhasználható licencet vezetünk be a dokumentációban és a kezdőlapon.

## Felhasználói Jóváhagyás és Megerősített Döntések

> [!IMPORTANT]
> Az egyeztetett válaszok alapján az alábbi négy fejlesztést valósítjuk meg a meglévő görgetésmentes (`100vh`), 100%-ban offline és alapértelmezetten néma kioszk működés megtartásával:

- **Képernyővédő felébresztés védelme (átkattintás-mentes ébresztés)**: A képernyővédő (és a tétlenségi figyelmeztető ablak) megérintése kizárólag felébreszti a kijelzőt és megmutatja a Kezdőlapot — az ébresztő érintés soha többé nem nyit meg alatta lévő játékkártyát vagy menügombot.
- **Pixel-Kifestő 4 másodperces vizuális visszaszámláló sáv**: 100%-os színezéskor a kép nem homályosodik el azonnal: a rácsvonalak kisimulnak, a teljes pixel-illusztráció szabadon látható marad, alul pedig megjelenik egy 4 másodperces animált visszaszámláló sáv azonnali *„Tovább most!”* és *„Új titkos kép”* gombokkal.
- **Képélesség és Formák — Csillagszámoló extra feladat**: A szemrevételezés két lépésből áll: először a gyerekek megszámolják a képernyő sarkaiban és közepén ragyogó arany csillagokat és kiválasztják a helyes számot a nagy számválasztó gombokkal, majd visszajeleznek a formák és betűk élességéről.
- **Korlátozásmentes szabad licenc (0BSD / Unlicense jellegű)**: Teljesen szabadon — magánszemélyek és cégek által is — korlátozás, regisztráció és jogi kötöttség nélkül használható, módosítható és terjeszthető licenc kerül a projekt licencdokumentumába, a leírásba, valamint apró, diszkrét feliratként a kezdőlap alsó sávjába.

---

## 1. Áttekintés és Alapkoncepció

- **Mit nyújt a fejlesztés**: Üzembiztosabb kioszk-interakciót (a látogatók mindig a Kezdőlapra érkeznek a képernyővédő megérintésekor), valódi sikerélményt a kifestett pixel-alkotások megtekintéséhez tétlen bizonytalanság nélkül, aktív figyelmet igénylő vizuális mini-játékot a képélesség-tesztben, valamint egyértelmű, minden korlátozástól mentes jogi keretet céges nyílt napokhoz.
- **Célközönség**: Nyílt napra érkező óvodás és kisiskolás gyerekek, szülők, valamint a szoftvert saját rendezvényükön szabadon bevető vállalatok és animátorok.
- **Fő érték**: Minden interakció kiszámítható, gyerekbarát és önmagát magyarázza, miközben a kijelző teljes felületének és élességének ellenőrzése valódi játék marad.

---

## 2. Felhasználói Élmény és Vizuális Dizájn

### Kulcsfolyamatok

1. **Átkattintás-mentes ébresztés a Képernyővédőről**:
   - Amikor a képernyővédő aktív, a látogató bárhol megérintheti a kijelzőt (akár ott is, ahol a Kezdőlapon kártya vagy fejlécgomb található).
   - Az érintés elnyeli a teljes mutató- és kattintási eseménysorozatot (`pointerdown` → `pointerup` → `click`), felfedi a Kezdőlapot, és egy rövid védőidőablakig megakadályozza a véletlen továbbkattintást.
2. **Pixel-Kifestő 4 másodperces csodáló fázis**:
   - Amint az utolsó fehér kocka is kiszíneződik (100%), a sötét rácsrések finoman összezárulnak, így a pixel-figura tiszta mesekönyvi képként tündököl teljes képernyőn.
   - A képet nem takarja el elmosódott ablak: a képernyő alján felcsúszik egy keskeny, átlátható ünnepi sáv a figura nevével (*„Előbújt: Cirmos Kiscica!”*), egy folyamatosan csökkenő **4 másodperces vizuális folyamatjelző csíkkal** és számlálóval, valamint két nagy (`>= 60×60px`) gombbal (*„Új titkos kép”* és *„Tovább most!”*).
   - Így a gyerekeknek van idejük megnézni a művüket, a mozgó csík miatt pontosan látják, mi történik, de ha nem szeretnének várni, egyetlen érintéssel azonnal továbbléphetnek. A 4 másodperc leteltekor megjelenik az összesítő kártya.
3. **Képélesség és Formák — 2 lépéses csillagszámoló próba**:
   - **1. lépés (Számolás)**: A vásznon a sarkokban lévő körökben, a középső gyűrűben és az oldalsó alakzatoknál véletlenszerűen **5, 6, 7 vagy 8 darab** éles kontúrú arany csillag jelenik meg. Az alsó kérdező sávban a feladat: *„1/2. Számold meg, hány arany csillag ragyog a képen!”*, mellette 4 darab vaskos (`>= 60×60px`) számválasztó gombbal (pl. `5`, `6`, `7`, `8`).
   - Téves tipp esetén a csillagok barátságosan megvillannak a vásznon (*„Nézz körül a sarkokban is, és próbáld újra!”*), helyes válasz esetén pedig ünnepi csillogással átvált a sáv a **2. lépésre**: *„2/2. Ügyes vagy! Minden forma és betű szép éles?”* (*„Igen, éles!”* / *„Nem, homályos!”*).
   - A *„Másik háttér”* gomb nemcsak világos és esti hátteret vált, hanem igény szerint friss csillag-elrendezést is rajzol.
4. **Diszkrét szabad licenc jelölés a Kezdőlapon**:
   - A Kezdőlap alsó sávjában — kapszula vagy keret nélküli, csendes tipográfiával, a görgetésmentes `100vh` arányokat teljesen megőrizve — megjelenik egy rövid tájékoztató sor: *„Szabadon felhasználható nyílt forráskód (0BSD) · Cégek és intézmények számára is korlátozásmentes”*.

### Vizuális Identitás és Térbeli Matematika

- **Színpaletta (60-30-10 egyensúly)**:
  - *60% Domináns felület*: Meleg mesekönyvi krémfehér (`--bg-storybook: #fffdf5`).
  - *30% Strukturális kártyák és sávok*: Tiszta fehér (`--surface-card: #ffffff`), határozott sötétkék képregényes kontúrral (`--ink-outline: #1e293b`, `3px`).
  - *10% Akció- és visszajelző színek*: Napsárga (`--accent-amber: #f59e0b`) a csillagokhoz és a 4 másodperces visszaszámláló sávhoz, smaragdzöld (`--accent-green: #16a34a`) a sikeres találathoz és továbblépéshez, égkék (`--accent-blue: #0284c7`) a számválasztó gombok aktív állapotához.
- **Érintési és Elrendezési Szabályok**:
  - Minden új interaktív gomb (a számválasztó gombok és a kifestő visszaszámláló sávjának gombjai is) garantáltan eléri a minimum **`60 × 60 px`** érintőfelületet.
  - A visszaszámláló csík kizárólag kompozitor-barát `transform: scaleX(...)` animációt használ a 60 FPS-es sima futásért.
  - A Kezdőlap alsó licencsora keret nélküli (`12px–13px`, `--ink-muted`) szövegként illeszkedik a láblécbe, így egyetlen pixelnyi függőleges görgetést sem idéz elő.

---

## 3. Főbb Termékdöntések és Kompromisszumok

- **1. Döntés: Kétrétegű (Capture-Phase) Ébresztési Pajzs a Képernyővédőhöz**
  - *Választott megoldás*: A képernyővédő nem tűnik el azonnal a lenyomás (`pointerdown`) pillanatában, hanem megvárja az ujj felemelését (vagy egy globális `capture` fázisú kattintás-elnyelő pajzs blokkol minden `click` / `pointerup` eseményt az ébresztést követő `450 ms`-ban).
  - *Miért*: Érintőképernyőkön a böngésző a `pointerdown` után néhány tizedmásodperccel generálja a szintetikus `click` eseményt; ha a takaróréteg már a lenyomáskor eltűnik, a `click` az alatta fekvő gombra esik. A capture-fázisú pajzs 100%-osan kizárja a véletlen indítást egérrel és érintőpanellel egyaránt.
- **2. Döntés: Zero-Clause BSD (0BSD) / Közkinccsé Tett Szabad Licenc**
  - *Választott megoldás*: A **0BSD (BSD Zero Clause License)** szövegét alkalmazzuk magyar és angol nyelven.
  - *Miért*: Ez a nemzetközileg elismert nyílt licenc még az MIT licencnél is szabadabb: kifejezetten megengedi a magán- és **üzleti/vállalati felhasználást**, átmárkázást és módosítást anélkül, hogy jogi szövegek kihelyezésére kötelezné az üzemeltető céget, miközben a felelősségkizárást tisztán rögzíti.
- **3. Döntés: Kétlépcsős Számolás + Élesség-visszajelzés**
  - *Választott megoldás*: A csillagszámolás közvetlenül ugyanazon az alsó interaktív sávon zajlik, amely a helyes válasz után átalakul az élességi kérdéssé.
  - *Miért*: Így nem kerülnek új lebegő ablakok a formák fölé, a gyerek valóban végigpásztázza a képernyő mind a négy sarkát és közepét, ugyanakkor a diagnosztikai igen/nem visszajelzés is megmarad az Oklevél számára.

---

## 4. Technikai Architektúra és Állapotkezelés

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                     Alkalmazásmag és Ébresztési Védelem                      │
│  • Képernyővédő & Inaktivitási Ablak: Capture-fázisú Click-Shield (450 ms)   │
│  • Kezdőlap: 100vh 5 kártyás rács + diszkrét 0BSD szabad licenc jelölés      │
└───────────────┬──────────────────────────────────────────────┬───────────────┘
                │                                              │
                ▼                                              ▼
┌────────────────────────────────────────┐    ┌────────────────────────────────┐
│   Pixel-Kifestő Modul (24×14 Mátrix)   │    │  Képélesség és Formák Modul    │
│  • SZÍNEZÉS (0–99%): Auto-Dodge menü   │    │  • 1. FÁZIS: Csillagszámolás   │
│  • CSODÁLÓ SÁV (100%, 4.0 mp):         │    │    (5–8 arany csillag a vásznon│
│    - Kisimuló, résmentes pixel-kép     │    │     + 4 db >=60px számgomb)    │
│    - scaleX() vizuális visszaszámláló  │    │  • 2. FÁZIS: Élesség kérdés    │
│    - [Új titkos kép] / [Tovább most!]  │    │    ([Igen, éles!] / [Homályos])│
│  • ÖSSZESÍTŐ ABLAK (4 mp vagy gombny.) │    │  • Oklevél-eredmény mentése    │
└────────────────────────────────────────┘    └────────────────────────────────┘
```

### Adatmodell és Állapotátmenetek

- **Ébresztési eseményzár (`wakeGuardUntil`)**:
  - Amikor a képernyővédő vagy a tétlenségi ablak aktív, az érintés beállít egy `wakeGuardUntil = performance.now() + 450` időbélyeget, és a dokumentum legfelső `capture` szintjén (`addEventListener('click', ..., true)`) megállítja (`preventDefault` + `stopPropagation`) az ébresztő ujjmozdulatból származó utólagos kattintásokat.
- **Pixel-Kifestő állapotgép (`PLAYING` → `CELEBRATING_4S` → `SUMMARY`)**:
  - `100%` elérésekor a modul `CELEBRATING_4S` állapotba lép: a felső menüsáv elrejtőzik, a rács megkapja a résmentes megjelenítést, és elindul a `4000 ms`-os visszaszámláló sáv.
  - Ha a felhasználó megnyomja a *„Tovább most!”* gombot, azonnal megnyílik az eredményablak (vagy továbbhalad a játékválasztóra); ha megnyomja az *„Új titkos kép”* gombot, a számláló megszakad és új figura indul; ha végignézi a 4 másodpercet, a sáv lejártakor nyílik meg az eredménykártya. Képernyőváltáskor vagy animátor-resetkor az időzítő tisztán felszabadul.
- **Képélesség és Formák állapotgép (`COUNTING_STARS` → `ASKING_SHARPNESS` → `SUMMARY`)**:
  - Indításkor a modul kisorsol egy `targetStarCount` értéket (`5..8`), kirajzolja pontosan ezt a számú csillagot a sarok- és középső pozíciókba, és felkínál 4 növekvő sorrendbe rendezett számválasztó gombot.
  - Helyes szám megérintésekor a vásznon rövid csillagfény-visszajelzés fut le, az állapot átvált `ASKING_SHARPNESS` módba, majd az élességi válasz után mindkét adat bekerül az Oklevél szövegébe.
