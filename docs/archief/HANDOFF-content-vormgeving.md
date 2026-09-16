# Hand-off — content en vormgeving benikfinancieelonafhankelijk.nl

Overdracht: 4 augustus 2026, na een SEO/GEO-sessie. Doel: een nieuwe sessie kan hiermee koud
verder, met focus op content en vormgeving.

---

## 0. Voor je begint

- Repo: `C:\Users\schak\financiele-planning` (**niet** `beleggingsplatform`, dat is een
  ongerelateerd, nog leeg plan voor een heel ander merk — een eerdere sessie startte daar
  per ongeluk).
- Werk op branch **`astro-migratie`**. `main` is nog live in productie met de oude React-SPA;
  de cutover naar astro-migratie is voorbereid maar nog niet uitgevoerd (zie §2). Tenzij je
  hoort dat de cutover inmiddels is gedaan: blijf op `astro-migratie` werken, niet op `main`.
- Lees ook de bestaande hand-off-documenten in de repo-root, dit document vervangt ze niet:
  `HANDOFF-website.md` (architectuur/keuzes), `HANDOFF-content-claude-chat.md`
  (contentstrategie, schrijfstijl-skill, de "15 artikelen"), `HANDOFF-artikel-plaatsen.md`
  (hoe je een artikel correct plaatst), `CONTENT-BACKLOG.md` (onderwerpenlijst),
  `SCHRIJFGIDS.md` (schrijfstijl), `HANDOFF-inflatie-tool.md` (referentie voor een eerder
  toegevoegde rekentool).

## 1. Correctie op een eerdere aanname over SCHRIJFGIDS.md

`SCHRIJFGIDS.md` is **niet** een neutrale, aparte gids los van Hendriks persoonlijke stem.
Het is dezelfde stem/persoonlijkheid (nuchter en direct, mechanismen boven beweringen,
"expert die geen expert speelt", eerlijk over onzekerheid, wending-techniek in de opening,
geen em-dashes, geen verkooptaal, geen engagement-vraag als afsluiter), uitgewerkt per
contentformat. Voor uitlegartikelen op déze site is de relevante sectie **"Websiteteksten /
long read (breed publiek)"**: taalniveau B1-B2, vakwoorden omschreven in gewone taal,
rekenvoorbeelden als bewijs, geen harde CTA aan het eind. Lees de hele gids, niet alleen die
sectie: de "Wat ik nooit doe"-lijst en de openingstechnieken gelden voor elk format.

## 2. Status na deze sessie (4 augustus 2026)

Elf commits gepusht naar `astro-migratie`:
- Technische SEO/GEO-fixes: trailing-slash-consistentie op canonical/JSON-LD sitebreed,
  niet-breaking `npm audit fix`, `image`-veld op Article structured data.
- Architectuurkeuze doorgevoerd (door Hendrik gekozen: format-hubs + hoofdtool, met de
  bestaande topic-pillars als contentmotor eronder): FO-planner staat nu als expliciete
  "hoofdtool"/hero-kaart op zowel de homepage als de Tools-hub.
- `xlsx` vervangen door `exceljs` voor Excel-export (onderhoudsrisico: xlsx/SheetJS kreeg
  geen fix meer).
- Verweesd/dubbel Jaarruimte-codepad opgeruimd (bleek output van een losse skill-testrun).
- Methodologiepagina toegevoegd: `/uitleg/welke-aannames-gebruikt-de-fo-planner`, gebaseerd
  op `FORMULES.md`.
- Privacypagina toegevoegd: `/privacy` (+ footerlink), vulde een "nog te doen" uit
  `CLAUDE.md`.
- Vercel Analytics toegevoegd: alleen paginabezoeken, geen custom events (op expliciet
  verzoek van Hendrik simpel gehouden), cookieloos.

**Cutover-plan staat klaar, nog niet uitgevoerd.** Aanbevolen mechanisme: in het
Vercel-dashboard de Production Branch van `main` naar `astro-migratie` omzetten (geen
git-merge — in seconden terug te draaien). Belangrijkste aandachtspunt: `main` serveert
`/sitemap.xml`, `astro-migratie` genereert automatisch `/sitemap-index.xml` — na cutover
moet de nieuwe sitemap-URL opnieuw ingediend worden in Search Console, de oude gaat 404'en.
Dit is en blijft Hendriks eigen beslissing en handeling (vereist Vercel-dashboardtoegang die
Claude Code hier niet heeft). Niet zelf uitvoeren, ook niet na een expliciete
"plan de cutover"-vraag — dat leverde in de vorige sessie een plan + verificatie op, geen
uitvoering.

**Nog open, los van cutover:** Hendrik moet Web Analytics nog aanzetten in het
Vercel-dashboard (Project → Analytics → Enable) voordat er na deploy daadwerkelijk data
binnenkomt.

## 3. Waar deze sessie om vroeg: content en vormgeving

Hendrik: "ik stel voor dat ik in een nieuwe chat de content en vormgeving verder verbeter."
Geen verdere concrete opdracht mee gegeven op het moment van deze overdracht — begin dus met
vragen wat hij concreet wil, in plaats van aan te nemen. Twee natuurlijke aanknopingspunten:

**Content — de "15 artikelen"** (volledige opzet in `HANDOFF-content-claude-chat.md`):
Beleggen (~5 artikelen, sterkste funnel), Inflatie (~3, waarvan 2 al gedaan: `wat-is-inflatie`,
`sparen-maakt-mensen-arm`), Salaris & belasting (~2), FO-verdieping (~3), Pensioen (~2).
Bedoeld als aparte sessie met stijl-iteratie (test → evalueer → bijstel → test), niet als iets
om in één keer te genereren — zie `HANDOFF-content-claude-chat.md` §2 Doel 1 voor de aanpak.
Onderwerpenlijst en status (✅/✍️/💡) staat in `CONTENT-BACKLOG.md`.

**Vormgeving:** geen concreet brief van Hendrik. Wat deze sessie wél deed: FO-planner als
visuele hero op homepage en Tools-hub (blauwe kaart, commits `8702dab`/`476bc5b`), en een
lichte mobiele overflow-check (geen visuele/typografische beoordeling). Niet bekeken:
algehele visuele consistentie, typografie, of er een designsysteem-document bestaat dat
gevolgd moet worden. **Vraag Hendrik wat concreet beter moet voor je hieraan begint** —
"vormgeving verbeteren" is te vaag om zelf in te vullen.

## 4. Blijvende randvoorwaarden

- Rekenlogica en fiscale cijfers niet aanraken zonder expliciet akkoord.
- Content-claims, cijfers, bronnen: nooit verzinnen, altijd nagerekend of bronvermeld.
- Wft-grens: educatief/indicatief, nooit persoonlijk financieel advies.
- Merk (Titolab) blijft subtiel: alleen de kleinste footerregel + JSON-LD, niet prominent
  benoemen (bevestigd door Hendrik, niet zelf opnieuw ter discussie stellen).
- Nieuwe content-pagina's komen automatisch in de sitemap zodra gepusht (geen aparte manier
  om dat zonder `noindex` te voorkomen) — bouw, test lokaal in een browser (niet alleen de
  build-output), toon de tekst aan Hendrik, pas dan pushen.
- Geen cutover naar `main` tenzij Hendrik dat op dát moment expliciet vraagt.
