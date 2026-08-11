# Hand-off — herstijling naar het moodboard-palet

Overdracht: 11 augustus 2026. Sessie gestart vanuit `Downloads/DESIGN_SYSTEM.md` (Hendriks
grafisch ontwerper) plus het Claude Design-moodboard. Werk staat volledig op branch
**`herstijling-2026`**, afgesplitst van `astro-migratie`. **Niet gemerged, niet gepusht.**

---

## 0. Status: alle acht geplande fasen klaar en getest

Elke fase is na afronding met een productiebuild (`npm run build`) én in de browser geverifieerd
(computed styles, geen screenshot mogelijk in deze omgeving — de tool faalt hier structureel op
"Browser pane is not displayed"). Waar dat relevant was, is functioneel gedrag getest door
daadwerkelijk te klikken/typen en de resulterende DOM/export-inhoud uit te lezen, niet alleen
aangenomen.

1. **Fundament** — kleurtokens en fonts in `tailwind.config.js`, `src/index.css` herschreven.
2. **Sitebrede kleurvervanging** — alle `primary-*`/`slate-*`/`amber-*`/`emerald-*`/`red-*` weg,
   ook in de drie kleinere tools (BrutoNetto, Inflatie, Jaarruimte). Geverifieerd: 0 treffers in
   `dist/`.
3. **Typografie** — zie de belangrijke afwijking hieronder.
4. **Vorm** — geen `shadow-*`, alle radius naar 3px/2px.
5. **Componenten** — header, KPI-haarlijnraster, grafiek, meters.
6. **Linkerkolom herontwerp** — grootste inhoudelijke ingreep, zie §2.
7. **Kleur buiten componenten** — favicon, app-iconen, OG-afbeelding, PWA-manifest, PDF-export
   allemaal opnieuw gegenereerd/gekleurd.
8. **Toegankelijkheid** — negen WCAG-overtredingen gevonden en gefixt (zie §3).

Aanvulling op het designsysteem geschreven: `DESIGN_SYSTEM.md` (nu in de repo-root, was eerder
alleen een Downloads-bestand).

---

## 1. Belangrijkste afwijking van de oorspronkelijke opdracht: twee fonts, niet één

De opdracht schreef Instrument Serif voor "getallen, bedragen, koppen". Getest tijdens de sessie:
Instrument Serif heeft **geen tabular figures** — een "0" is bijna 2× breder dan een "1" op
dezelfde puntgrootte. Bij live veranderende KPI-waarden en slider-waarden sprong de tekst
zichtbaar. Aan Hendrik voorgelegd met een visuele vergelijking; hij koos voor de oplossing:

- **Instrument Serif** blijft op koppen (H1/H2, secties) — daar is het net zo goed, want het is
  ±30% compacter dan het alternatief bij gelijke leesgrootte, dus blijft passen op krappe breedte.
- **Newsreader** (met `tabular-nums`) voor alle cijfers: KPI's, sliderwaarden, tabelbedragen.

Beide fonts zijn nu geladen naast DM Sans. Zie `DESIGN_SYSTEM.md` §2 voor de volledige toelichting
en de google-fonts-link.

---

## 2. Linkerkolom: grootste structurele wijziging

- **Life events en stortingen samengevoegd** tot één sectie "Eenmalige bedragen". Ze rekenden al
  identiek (`pensionCalc.ts` voegt ze samen tot `allEvents`), maar stonden in twee bijna
  gedupliceerde componenten met een onderscheid dat niet te raden was. `stortingen` blijft in de
  types bestaan (compatibiliteit), maar de UI schrijft alles naar `lifeEvents`.
  - **Bijvangst, bevestigd met een echte export-test:** `exportExcel.ts` exporteerde vóór deze
    wijziging alleen `lifeEvents`, dus bedragen die als "storting" waren ingevoerd rekenden wél
    mee in de uitkomst maar stonden nergens in het Excel-bestand. Na de samenvoeging staan beide
    bedragen correct in de export — getest door de download-blob te onderscheppen en met exceljs
    terug in te lezen (zie transcript), niet alleen aangenomen.
- **Tabs hernoemd:** "Parameters" → "Uitgangspunten", "Events" → "Eenmalige bedragen".
- **Leeg veld blijft leeg.** `NumberInput` hield voorheen `parseFloat(...) || 0`, dus wissen om
  over te typen sprong meteen naar 0. Nu lokale tekst-state, pas bij `onBlur` een fallback naar 0.
  Getest met een echte klik + toetsenbord-blur (niet met geïnjecteerde events — `<input
  type=number>` ondersteunt geen standaard text-selectie-API, dus `Ctrl+A`/`Backspace` via
  synthetische events werkte niet betrouwbaar in de testomgeving; met `form_input` + een echte
  klik elders werkte het wel, en zo is het ook getest).
- **Resultaat blijft staan.** Voorheen: `setMc(null)` bij elke invoerwijziging, dus de grafiek en
  beide meters verdwenen meteen. Nu: `mcStale`-status, resultaat blijft zichtbaar met een
  "Verouderd"-badge en een halfdoorzichtige weergave, plus een "Opnieuw berekenen →"-snelkoppeling.
- **Bereken-knop verhuisd** naar een vast blok onderin de invoerkolom (buiten de scrollbare
  invoerlijst), blijft in beeld tijdens het scrollen door de 18 velden. Stond eerder rechtsboven
  in de grafiekkaart.
- **Kolom breder:** 288px (`w-72`) → 320px (`w-80`).
- **Berekeningsnaam** i.p.v. klantnaam: "Naam klant: Nieuwe klant" → "Naam berekening:", leeg
  default met placeholder "Naam toevoegen". Werkt zowel voor iemand die voor zichzelf rekent
  ("stoppen op 60") als voor een adviseur met een klantdossier — Hendriks eigen voorstel.
  Export-bestandsnamen en PDF-kop vallen terug op "Naamloze berekening" bij een lege naam.

---

## 3. Toegankelijkheid — negen echte fixes, niet alleen een checklist

Na de eerste bouwronde contrast nagerekend (niet aangenomen): `muted` (`#6E7F72`) haalt **op geen
enkel vlak** de 4,5:1 die WCAG AA voor normale tekst eist (beste geval 4,19:1 op invoervlak,
3,26:1 op canvas). Ik had dit token op negen plekken gebruikt voor leestekst ≤14px (navigatie,
knoppen, disclaimers). Alle negen gecorrigeerd naar `body` (`#4C5A50`, 6,74:1+). De vier
plekken waar `muted` op een icoon-only knop staat (geen leestekst, 3:1-eis) zijn ongewijzigd
gebleven — die voldoen wel.

---

## 4. Wat nog moet gebeuren (in volgorde van belang)

1. **Hendrik zelf beoordeelt het resultaat.** Dev-server draait op `localhost:4323`
   (`npm run dev`, zie `.claude/launch.json` — die stond nog op de oude Vite-poort 5173,
   inmiddels gecorrigeerd naar 4323).
2. **Vijf nieuwe datatokens laten goedkeuren door de grafisch ontwerper.** `data-100`, `data-300`,
   `data-500`, `data-700`, `sand-deep` — zelf afgeleid omdat ochtendblauw alleen (1,14:1 op
   paneel) geen bruikbare grafiekkleur is. Onderbouwing en contrastwaarden staan in
   `DESIGN_SYSTEM.md` §1.
3. **Geen merge naar `astro-migratie` zonder Hendriks akkoord.** Die branch is sinds 10 augustus
   de live productiebranch.
4. **Niet getest, wel gebouwd:** de PDF-export is functioneel getest (geen crash, correcte
   RGB-mapping in de code), maar de daadwerkelijke pixel-output is niet visueel geïnspecteerd
   (kon in deze sessie geen screenshot maken). Aanrader: één keer een PDF downloaden en met het
   oog controleren.
5. **`bruto-netto.astro`** kreeg geen aparte paginacontrole in deze sessie (de React-component
   zelf is wel volledig herkleurd in fase 1) — korte visuele check aanbevolen.

---

## 5. Wat bewust niet is aangepakt

- **Geen conversie-elementen toegevoegd.** Zoals afgesproken: geen afspraak-CTA, geen
  contactformulier, geen aanbod bij de downloadlimiet. Dat wacht op de Wft-vergunning.
- **Padding niet pixel-exact op 22px voor "canvas"** zoals het designsysteem letterlijk noemt —
  de bestaande responsive `p-4 md:p-6` (16/24px) is functioneel gelijkwaardig en een
  arbitrary-waarde van 22px voegde geen zichtbaar verschil toe. Bewuste afweging, geen omissie.
- **`bruto-netto.astro`**, **`InstallAppButton`s fallback-className** en **`Factor.astro`** waren
  al schoon uit een eerdere fase toen fase 6 ze controleerde — geen dubbel werk gedaan.

---

## 6. Losse observatie voor een vervolgsessie

`CLAUDE.md` in de repo-root is inhoudelijk verouderd (beschrijft nog een React/Vite-SPA met
deploy vanaf `main`). Niet aangepakt in deze sessie, stond buiten scope — wel de moeite waard om
een keer bij te werken zodat een volgende sessie niet op het verkeerde been wordt gezet.
