# Hand-off — app-installatie + overige openstaande punten

Overdracht: 10 augustus 2026, na een lange sessie. Doel: een nieuwe sessie kan hiermee koud
verder, met als eerste actiepunt de PWA-app-installatie op astro-migratie.

---

## 0. Voor je begint — BELANGRIJKE WIJZIGING

**De cutover is vandaag gebeurd.** `astro-migratie` is nu de Production Branch op Vercel
(Project Settings → Environments → Production → Branch Tracking, via "Promote to Production"
op de laatste astro-migratie-deployment). `benikfinancieelonafhankelijk.nl` serveert dus nu
Astro, niet meer de React-SPA.

**Dit keert eerdere hand-offs om.** Oudere documenten in deze repo (`HANDOFF-website.md`,
`HANDOFF-content-vormgeving.md`, `HANDOFF-algemene-voorwaarden.md`) gaan er nog vanuit dat
`main` live is en `astro-migratie` alleen een preview. Dat klopt niet meer. Behandel `main`
vanaf nu als **legacy/archief**, niet als de site waar bezoekers komen. Nieuw werk hoort op
`astro-migratie`.

- Repo: `C:\Users\schak\financiele-planning` (**niet** `beleggingsplatform`).
- Werk in de hoofdrepo op `astro-migratie` (`git checkout astro-migratie`), of gebruik de
  bestaande worktree als die nog bestaat: check met `git worktree list`.
- Lees ook de bestaande hand-off-documenten in de repo-root voor achtergrond, met de
  bovenstaande correctie in het achterhoofd.

---

## 1. Status na deze sessie (10 augustus 2026)

Een van de grootste sessies tot nu toe, met werk op zowel `main` als `astro-migratie`
(main dus vóór de cutover). Belangrijkste, kort:

- **Algemene voorwaarden + privacy** op beide branches. Contractpartij: Titolab, onderdeel van
  HendrikSchakel Holding B.V., KvK 51309963, btw NL823206567B01, bevoegde rechter Amsterdam.
- **Vercel Analytics** stond alleen op astro-migratie, nu ook toegevoegd aan (het inmiddels
  legacy) main en destijds live geverifieerd. Op astro-migratie was het al aanwezig en werkt
  na de cutover gewoon door.
- **Beveiliging fors verbeterd.** xlsx (kritiek, geen fix meer) → exceljs. jspdf 2.5.2 (kritiek
  path-traversal + HTML-injectie) → 4.2.1. **Astro zelf geüpgraded van 5.18.2 → 7.2.0**
  (inclusief @astrojs/react 4→6, @astrojs/mdx 4→7), wat ook astro/esbuild/sharp-kwetsbaarheden
  oploste. Geverifieerd: dist-output van alle 14 uitleg-pagina's vergeleken vóór/na de upgrade,
  enige verschil was witruimte en Astro's eigen scoped-CSS-hash, geen inhoudelijke wijziging.
  Resterend op astro-migratie: alleen exceljs/uuid (matig, alleen op te lossen door exceljs
  terug te zetten naar 3.x — bewust niet gedaan, regressie weegt niet op tegen het risico).
- **Hoofdtool sitebreed hernoemd** naar "Rekentool financieel onafhankelijk?" (was
  "Pensioen- & FO-planner"), met een klein screenshot in het blauwe hero-blok op `/` en `/tools`.
- **Em-dashes stijlregel structureel doorgevoerd**: ~41 zinnen (content + UI-microcopy: footer,
  meldingen, invoerteksten). **Bronnenlijst-titels** (citaten van externe bronnen, bijv.
  "CBS — dashboard...") zijn bewust nog niet aangepast — andere categorie, Hendrik heeft daar
  nog geen besluit over genomen. Vraag het, neem niet aan.
- **Downloadlimiet**: max 3 gratis Excel/PDF-exports samen (gedeelde teller), bijgehouden in
  localStorage (`fp_download_count`), op astro-migratie. Bij het bereiken van de grens worden
  beide downloadknoppen disabled en verschijnt: "Je hebt het maximum aan gratis downloads
  bereikt. Neem contact op als je meer berekeningen wil downloaden." Getest tot en met de live
  site: drie downloads, vierde geblokkeerd, reset na het wissen van localStorage werkt.
- **Ontbrekende spaties gefixt** (10 augustus, ná de cutover, gevonden door Hendrik zelf op de
  live site): Astro/JSX collapt witruimte tussen tekst die eindigt op een regel en een
  `<a>`-tag of `{expressie}` die op de volgende regel begint, tenzij je expliciet `{' '}`
  toevoegt. Gaf dingen als "hetfeedbackformulier", "viaffp.nl". 7 plekken gefixt op
  `/over`, `/privacy`, `/voorwaarden`. **Let hierop bij nieuwe content**: een tekstregel die
  eindigt vlak vóór een link of `{expressie}` op de volgende regel heeft altijd een expliciete
  `{' '}` nodig.

---

## 2. Eerste actiepunt: app-installatie (PWA) op astro-migratie

Hendrik wil de PWA-installatiemogelijkheid, die vandaag op main is gebouwd (vóór de cutover,
dus nu inactief omdat main niet meer live is), terug op astro-migratie. Expliciet aangegeven:
**niet urgent** ("ik denk dat niemand de app heeft gedownload"), maar wel gewenst.

**Wat er op main (nu legacy, ter referentie) staat, goed getest en werkend:**
- `src/hooks/useInstallPrompt.ts` — vangt het `beforeinstallprompt`-event op via een
  **module-brede store**, niet een listener per component. Dit is een bewuste les uit deze
  sessie: het event vuurt vroeg (vlak na laden), ver vóórdat het installatiebanner (dat pas
  ná een berekening mount) bestaat. Een eerdere versie met per-component listeners werkte
  daardoor niet voor het banner. Niet opnieuw die fout maken.
- `src/components/InstallAppButton.tsx` — de knop. Chrome/Edge/Android: roept de echte
  installatieprompt aan. iOS/iPadOS (geen `beforeinstallprompt`-API op Safari): opent een
  dialoog met handmatige stappen ("deel-icoon → Zet op beginscherm → Voeg toe"). Al
  geïnstalleerd of niet-ondersteunde browser: toont niets (geen dode knop).
- Geïntegreerd op twee plekken: een altijd-zichtbare knop in de header, en een dismissible
  banner in het resultatenpaneel dat pas verschijnt ná een eerste berekening
  (`localStorage`-sleutel `fp_install_banner_dismissed` onthoudt wegklikken).
- iOS-detectieformule (`/iPad|iPhone|iPod/.test(userAgent) || (platform === 'MacIntel' &&
  maxTouchPoints > 1)`) getest tegen echte iPad/iPhone/Mac/Android/Windows user-agent-strings.

**De blokkade op astro-migratie:** `src/layouts/BaseLayout.astro` bevat een bewust ingebouwd
"kill-switch"-script uit een eerdere sessie dat bij élke paginalading alle service workers
uitschrijft en alle caches wist, met als doel de oude main-PWA op te ruimen bij terugkerende
bezoekers ("sunset van de vorige SPA-versie"). Nu astro-migratie zelf live is, moet dit
mechanisme aangepast worden — niet zomaar verwijderen (dan blijven eventuele main-installaties
van vóór vandaag hangen) en niet zomaar laten staan (dan registreert een nieuwe astro-migratie
service worker zich, waarna dit script 'm meteen weer uitschrijft, dus geïnstalleerde PWA
werkt nooit goed).

**Aanpak, voorstel:**
1. Vraag Hendrik hoe belangrijk het opruimen van oude main-installaties nog is (waarschijnlijk
   verwaarloosbaar, gezien "niemand heeft de app gedownload"), voordat je dit bouwt.
2. Vervang de blanket-cleanup door iets gerichters: alleen service workers/caches opruimen die
   niet bij de nieuwe astro-migratie-PWA horen, in plaats van altijd alles wissen. Of, als
   Hendrik het risico verwaarloosbaar vindt, het kill-switch-script gewoon verwijderen en
   vervangen door een normale PWA-registratie.
3. PWA-integratie toevoegen aan Astro: `@vite-pwa/astro` is de aangewezen package (astro-eigen
   wrapper rond dezelfde vite-plugin-pwa die main gebruikte). Iconen bestaan al in
   `public/` (`apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `favicon.svg`) —
   hergebruiken, niet opnieuw genereren.
4. `useInstallPrompt.ts` en `InstallAppButton.tsx` overzetten (kunnen vrijwel 1-op-1 mee,
   het zijn al losse React-modules). Header-knop hoort in `src/components/Header.astro`
   (die rendert een React-component of directe link, check de bestaande structuur). Banner
   hoort in `src/components/PensionPlanner/ResultsPanel.tsx`, na de Monte Carlo-gauges, zelfde
   patroon als op main.
5. Privacypagina (`src/pages/privacy.astro`) bijwerken met de `fp_install_banner_dismissed`-
   sleutel — de downloadteller staat er al in.
6. **Testmethode die werkte:** simuleer `beforeinstallprompt` door een custom Event te
   dispatchen (`window.dispatchEvent(new Event('beforeinstallprompt', {cancelable:true}))`
   met een gemockte `.prompt()`/`.userChoice`), vóórdat je op "Bereken" klikt. Check dat zowel
   de header-knop als het banner (dat pas daarna mount) hetzelfde event zien.

---

## 3. Overige openstaande punten

- **Sitemap opnieuw indienen in Google Search Console.** Main serveerde `/sitemap.xml`,
  astro-migratie genereert automatisch `/sitemap-index.xml` (andere URL). Dit is Hendriks
  eigen actie, waarschijnlijk nog niet gedaan.
- **Bronnenlijst-titels**: nog niet em-dash-vrij gemaakt (zie sectie 1). Vraag Hendrik of dat
  ook moet, dat zijn citaten van externe bronnen, geen eigen tekst.
- **Web Analytics kort herbevestigen** dat het na de cutover nog steeds correct dataverzamelt
  (was al aanwezig op astro-migratie vóór de cutover, zou moeten doorlopen).
- **`main` (legacy)**: heeft zelf nog een niet-opgeloste esbuild/vite-kwetsbaarheid (major-
  sprong 5→8 nodig, dev-server-only risico). Nu main niet meer live is, is dit niet meer
  urgent — expliciet niet meer oppakken tenzij Hendrik main om een andere reden weer gaat
  gebruiken.
- **Wat te doen met `main` zelf**: geen actie nodig, maar dit is een open vraag voor Hendrik
  (archiveren? aanhouden als noodgreep-rollback?), niet iets om zelf te beslissen.
- **Vercel bot-bescherming**: tijdens deze sessie kreeg herhaald geautomatiseerd
  poll-verkeer (curl, elke ~8 seconden, om een deploy te detecteren) een "Vercel Security
  Checkpoint"-blokkade. Geen actie nodig, maar een aandachtspunt voor een volgende sessie: bij
  het controleren of een deploy live staat, niet in een strakke lus pollen, en bij twijfel de
  Browser-tool (echte browsercontext) gebruiken in plaats van curl.

---

## 4. Blijvende randvoorwaarden

- Rekenlogica en fiscale cijfers niet aanraken zonder expliciet akkoord.
- Content-claims, cijfers, bronnen: nooit verzinnen, altijd nagerekend of bronvermeld.
- Wft-grens: educatief/indicatief, nooit persoonlijk financieel advies.
- Merk (Titolab) blijft subtiel: alleen de kleinste footerregel + JSON-LD.
- **Een eventuele rollback naar `main` is net zo'n eigen, bewuste beslissing van Hendrik als de
  cutover zelf was** — niet zelf uitvoeren, ook niet bij problemen, tenzij hij dat op dát moment
  expliciet vraagt.
- Nieuwe pagina's/wijzigingen: altijd lokaal bouwen én in de browser testen (niet alleen
  "build slaagt") vóór pushen. Bij tekst met een link erin: check op de ontbrekende-spatie-bug
  uit sectie 1.
