# Nyílt Napi Gyerekbarát Érintőképernyő Kioszk — Látvány- és Kényelmi Továbbfejlesztési Terv

A visszajelzések alapján finomhangoljuk a játékélményt és a grafikát: nagyobb felbontású, sokkal szebb és változatosabb (12-féle árnyalt) pixel-art alakzatokat kap a Pixel-Kifestő, a lebegő felső vezérlősáv automatikusan kitér az ujj elől színezés közben, Károly bújócskája részletgazdagabb karaktergrafikát és két nyugodt, szemkímélő mintát kap a vibráló sakktábla helyett, továbbá minden felületen javítjuk a *„Képélesség és Formák”* elírást.

## Felhasználói Jóváhagyás és Kiemelt Változtatások

> [!IMPORTANT]
> A jelenlegi frissítés az alábbi négy területet érinti a korábban véglegesített görgetésmentes (100vh) és alapból néma kioszk működés megtartásával:

- **12 részletgazdagabb, árnyalt Pixel-Kifestő alakzat**: A korábbi durva (16×10-es) felbontást finomabb **24×14-es pixel-rácsra** emeljük bővített színpalettával és kényelmes ecsetszélességgel, így sokkal formásabb, árnyaltabb mesekönyvi figurák (*Cica, Kiskutya, Barátságos Dínó, Pillangó, Űrrakéta, Kisbagoly, Vidám Béka, Piros Eper, Vitorlás Hajó, Gombaházikó, Szivárványos Felhő, Mosolygós Napocska*) rajzolódnak ki.
- **Ujj elől automatikusan kitérő menüsáv**: Amikor a játékos ujja színezés (vagy játék) közben megközelíti a felső vezérlősávot, a menü finom animációval átköltözik a képernyő aljára — ha pedig lent színez a felhasználó, visszalép felülre, így egyetlen pillanatra sem takarja ki a munkaterületet.
- **Kidolgozottabb Károly, a Kaméleon teszt szemkímélő mintákkal**: A szemet fárasztó sakktábla kikerül; az 5 tiszta alapszín (piros, zöld, kék, fehér, fekete) mellé **2 nyugodt, szemkímélő minta** (lágy pasztell színátmenet és nagy léptékű, szelíd pasztell pöttyös/hullámos háttér) érkezik. Maga Károly is részletesebb rajzolatot, kíváncsian nézelődő/pislogó szemet, apró kapaszkodó lábakat, faág-sziluettet és látványosabb nyelv-csillagkapó örömanimációt kap.
- **Helyesírási javítás mindenhol**: A *„Képrélesség”* elírást minden feliraton, kártyán, oklevél-soron és dokumentációban **„Képélesség”**-re (*„Képélesség és Formák”* / *„Képélesség és Geometria”*) javítjuk.

---

## 1. Áttekintés és Alapkoncepció

- **Mit nyújt a fejlesztés**: Esztétikusabb, valódi gyerekkönyv-minőségű pixel-illusztrációkat és zavartalan teljes képernyős érintésélményt, ahol sem a lebegő gombok nem állnak az ujj útjába, sem erős optikai vibráció nem fárasztja a látogatók szemét.
- **Fő érték**: A finomabb pixelrács és az árnyalt színek valódi „aha-élményt” adnak a gyerekeknek, amikor felismerik a kirajzolódó cicát, dínót vagy űrrakétát, miközben az ujj-érzékeny kitérő menüsáv garantálja, hogy a kijelző felső és alsó pereme is akadálytalanul bejárható legyen.

---

## 2. Felhasználói Élmény és Vizuális Dizájn

### 1. Részletgazdag Pixel-Kifestő (24×14-es rács, 12 új figura)
- **Finomabb arányok + gyors színezhetőség**: A `24 × 14` (336 cellás) mátrix 16:9 / 16:10 arányú kijelzőkön szabályos négyzetekből áll, amelyeken már szépen kirajzolódnak a fülek, szemek, szárnyak és fény-árnyék részletek. Hogy a kisebb gyerekeknek se legyen fárasztó kiszínezni 336 kockát, az ujjhúzás finom **kiterjesztett ecsettel** (az érintett cella és közvetlen szomszédsága mentén) fest, így gyors, élvezetes mozdulatokkal tárul fel a kép, beleértve a sarkokat is.
- **12 véletlenszerűen váltakozó, árnyalt mesekönyvi sablon**:
  1. *Kíváncsi Cica* (narancs-krém cirmos kiscica rózsaszín orral)
  2. *Vidám Kiskutya* (barna-vajfehér kutyus lógó fülekkel)
  3. *Barátságos Zöld Dínó* (mosolygós kis dinoszaurusz háti taréjjal)
  4. *Színes Pillangó* (szimmetrikus, mintás szárnyú lepke)
  5. *Csillagközi Űrrakéta* (piros-ezüstkék rakéta lángcsóvával és csillagokkal)
  6. *Álmos Kisbagoly* (faágon ülő nagy szemű bagoly)
  7. *Mosolygós Béka* (tavirózsán csücsülő zöld békaporonty)
  8. *Édes Piros Eper* (árnyalt piros szamóca zöld levélkoronával)
  9. *Vitorlás Kishajó* (kétszínű dagadó vitorlákkal és hullámokkal)
  10. *Pöttyös Gombaházikó* (piros kalapos meseházikó világító ablakkal)
  11. *Szivárvány és Felhő* (lágy ívű szivárvány pufi felhőkkel)
  12. *Mosolygós Napocska* (árnyalt napsugarak zöld dombok felett)

### 2. Intelligensen Kitérő (Auto-Dodge) Felső Menüsáv
- **Működési elv**: A Pixel-Kifestőben (és az interaktív rajzoló felületeken) a rendszer figyeli az aktív ujj / mutató függőleges pozícióját:
  - Alaphelyzetben a vezérlősáv **felül** helyezkedik el.
  - Amint a színező ujj belép a felső sáv közelébe (a képernyő felső ~22%-ába), a vezérlősáv egy 180 ms-os sima `transform` csúszással **leugrik a képernyő aljára** (és átlátszó érintés-átengedő módban sem blokkolja a húzást), amíg a felhasználó a felső régióban színez.
  - Amikor az ujj a képernyő alsó ~22%-ába ér, a sáv ugyanígy visszaköltözik felülre — így mindig pontosan az ellenkező oldalon pihen, mint ahol a gyerek éppen dolgozik!

### 3. Kidolgozottabb Károly, a Kaméleon Játék (7 Pálya, Szemkímélő Minták)
- **Szemkímélő háttérkészlet (vibráló sakktábla nélkül)**:
  - Megmarad az 5 tiszta diagnosztikai alapszín (*Élénkpiros, Fűzöld, Égkék, Hófehér, Éjfekete*), amelyek elengedhetetlenek a képpont-ellenőrzéshez.
  - Melléjük **2 nyugodt, szembarát minta** kerül:
    1. *Lágy Napszak-Színátmenet (Gradiens)*: Finom barack-arany-égkék átmenet, amely egyáltalán nem vibrál, ugyanakkor kiválóan teszteli a kijelző színátmenet-simaságát.
    2. *Szelíd Pasztell Pöttyös / Hullámos Minta*: Nagy méretű, alacsony kontrasztkülönbségű, lágy mentazöld alapon finom világoszöld körök/levelek — kellemes a szemnek, mégis játékos búvóhely Károlynak.
- **Részletesebb Károly karakter és visszajelzés**:
  - Károly kidolgozottabb kaméleon-sziluettet kap (jellegzetes sisakszerű fejbúb, hátgerinc-taréj, finom oldalsó csíkok/pöttyök, kis kétujjas kaméleon-mancsok egy apró faág-darabon, többszörösen feltekeredő farok és forgó, kíváncsian körbenéző-pislogó szem).
  - Ha Károly mintás vagy színátmenetes háttéren ül, a teste pontosan átveszi az alatta lévő pozíció helyi színét/mintázatát, miközben a gyerekbarát körvonala továbbra is jól kivehető marad.
  - Megtaláláskor Károly vidáman kinyújtja a nyelvét, elkap egy csillagot, szivárványos-smaragdzöldre vált, a felső számláló mellett pedig vizuális pálya-jelző pöttyök is mutatják az előrehaladást.

---

## 3. Technikai Architektúra és Állapotleképezés

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                   Alkalmazásmag és Képernyő-Router                          │
│  • KIOSK_CONFIG (Cégnév + alapból rejtett/néma hangmód)                     │
│  • Javított "Képélesség és Formák" feliratok a regiszterben és Oklevélen    │
└───────────────┬─────────────────────────────────────────────┬───────────────┘
                │                                             │
                ▼                                             ▼
┌───────────────────────────────────────┐     ┌───────────────────────────────┐
│   Pixel-Kifestő Modul (24×14 Mátrix)  │     │  Károly Kaméleon Modul (7x)   │
│  • 12 árnyalt pixel-art sablon        │     │  • 5 alapszín + 2 lágy minta  │
│  • Kényelmes ecsetszélességű festés   │     │  • Kidolgozott kaméleon rajz  │
│  • Ujj-pozíció figyelő Auto-Dodge HUD │     │    forgó/pislogó szemmel      │
│    (Fent <-> Lent átköltöző menüsáv)  │     │  • Csillagkapó nyelv-animáció │
└───────────────────────────────────────┘     └───────────────────────────────┘
```

### Interaktív Állapot- és Mozgáskezelés
- **Auto-Dodge HUD vezérlés**: A menüsáv egy `.hud-docked-bottom` CSS osztályt kap, amely kizárólag hardveresen gyorsított `transform` tulajdonsággal (vagy felső/alsó pozíció-átmenettel, `pointer-events: none` kerettel) mozgatja át a sávot, ha az ujj koordinátája belép az aktuális dokkolási zóna `140px`-es előterébe. Hiszterézis-küszöb biztosítja, hogy a képernyő közepén húzva a sáv soha ne ugráljon ide-oda.
- **Véletlenszerű sablon-rotáció (Shuffle Bag)**: A 12 pixel-alakzatot kevert sorrendben (pakli-szerűen) adagolja a rendszer, így egymás után 12 játékot indítva garantáltan mind a 12 különböző figura sorra kerül ismétlődés nélkül!
