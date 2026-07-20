# Hand-off — van reken­tool naar website "benikfinancieelonafhankelijk.nl"

Doel van dit document: een volgende sessie (of persoon) kan hiermee koud verder,
zonder de voorgaande chats te kennen.

---

## 1. De opdracht

De huidige tool omvormen tot een **echte website** met **informatie én rekentools**
over financiële onafhankelijkheid.

- **Toon:** neutraal, feitelijk, niet-commercieel.
- **Doelgroep:** breed publiek — niet alleen DGA's of vermogenden. Iemand die googelt
  "ben ik financieel onafhankelijk" of "hoeveel pensioen heb ik nodig" moet het snappen.
- **Doel:** goed gevonden worden door zoekmachines én LLM's, en bezoekers helpen met
  begrijpelijke uitleg + concrete rekentools.

> Let op — schrijfstijl: er bestaat een stijlgids "Hendrik Schakel" (DGA-gericht, zakelijk).
> Die is hier **niet** leidend. Deze site vraagt om een **toegankelijker, neutraler**
> register (streef naar taalniveau B1: korte zinnen, gewone woorden, jargon uitleggen).

---

## 2. Huidige staat (wat er al is)

**Live:** https://benikfinancieelonafhankelijk.nl
**Repo:** https://github.com/hendrik-titolab/financieel-onafhankelijk
**Lokaal:** `C:\Users\schak\financiele-planning`
**Hosting:** Vercel (auto-deploy bij `git push` naar `main`)
**Stack:** React 18 + Vite + TypeScript + Tailwind CSS. **Er is al `react-router-dom`
in gebruik** met een gedeelde Header (navigatie), een Footer en twee routes:
`/` (pensioenplanner) en `/bruto-netto`. De app is dus al géén single-page app meer —
de multi-page-structuur is deels gelegd.

Bestaande onderdelen:
- **Pensioenplanner** (`src/components/PensionPlanner/`) — hoofdtool op route `/`.
  Risicoprofiel-schuif, Monte Carlo (kans op 100% én 75% van het doel), Excel/PDF-export,
  feedbackknop.
- **Bruto-nettotool** (`src/components/BrutoNetto/`) — **af en live** op route `/bruto-netto`.
  Bruto→netto én netto→bruto, uitklapbare stap-voor-stap berekening, eigen SEO-title +
  meta-description, toeslagen-disclaimer.
- **Fiscale parameters centraal** in `src/config/fiscaleParameters.ts` (belasting, jaarruimte,
  AOW). Kwartaalcheck-agent bijgewerkt via geplande taken.
- **Feedback** → Google Formulier → Slack-melding (Apps Script).

> ⚠ **Openstaand technisch schuldpunt:** de bruto-nettotool heeft z'n eigen hardgecodeerde
> belastingcijfers 2026 (het `P`-object bovenin `BrutoNetto/index.tsx`) die de cijfers in
> `fiscaleParameters.ts` dupliceren — inclusief heffingskortingen die daar nog niet in staan.
> De kwartaalcheck-agent controleert alleen `fiscaleParameters.ts`, dus deze tool raakt
> ongemerkt verouderd. **Aan te bevelen:** de heffingskortingen (AHK, arbeidskorting) aan
> `fiscaleParameters.ts` toevoegen en de bruto-nettotool daaruit laten lezen, zodat er één
> bron van waarheid is.

Referentiedocumenten in de repo:
- `CLAUDE.md` — projectoverzicht + deploy-instructies
- `FORMULES.md` — alle rekenformules uitgelegd
- `JAARRUIMTE_TOOL.md` — kennis voor de aparte jaarruimtetool (apart project)
- `src/config/fiscaleParameters.ts` en `src/config/risicoprofielen.ts` — instelbare cijfers

---

## 3. Kernbeslissing vooraf: architectuur

De keuze is deels al gemaakt: er draait **`react-router` met meerdere routes**. De vraag is
nu niet "welk framework", maar **"blijven we op react-router of migreren we alsnog"** —
en vooral: **hoe krijgen we goede SEO** (react-router rendert client-side; zonder
pre-rendering ziet een zoekmachine/LLM weinig).

| Optie | Wat | Voor | Tegen |
|---|---|---|---|
| **B. Doorgaan op Vite + react-router + SSG** (pragmatisch) | Bestaande opzet houden, statische pre-render toevoegen (bijv. `vite-react-ssg`) voor de uitlegpagina's | Minste herbouw; alle huidige tools blijven werken; react-router staat al | Content in code/JSX i.p.v. losse Markdown; SEO iets minder "native" dan Astro |
| **A. Migreren naar Astro** | Content-first; artikelen als Markdown, tools als React-islands | Beste SEO, artikelen makkelijk beheren | Herbouw van de app-shell; de router-opzet vervalt |
| **C. Next.js** | Volwaardig React-framework | Sterke SEO | Zwaarder dan nodig |

**Aanbeveling:** begin met **optie B** — je hebt react-router al, dus de snelste weg naar een
echte site is: uitlegpagina's als routes toevoegen en statische pre-rendering (SSG) inschakelen
zodat elke pagina als kant-en-klare HTML wordt geserveerd (goed voor Google én LLM's). Blijkt
contentbeheer daarna te omslachtig, dan is Astro alsnog een overweging. Zo migreer je niet
onnodig weg van wat al werkt.

> Bevestig deze keuze met de gebruiker vóór de bouw start.

---

## 4. Voorgestelde sitestructuur

```
/                      Home — wat is FO + ingang naar tools en uitleg
/ben-ik-financieel-onafhankelijk   De pensioenplanner (huidige hoofdtool)
/tools/bruto-netto     Bruto-nettoberekening
/tools/...             (toekomst: spaarquote/FIRE-getal, jaarruimte-link)
/uitleg/               Overzicht van alle uitlegartikelen
/uitleg/wat-is-financiele-onafhankelijkheid
/uitleg/hoeveel-pensioen-heb-ik-nodig
/uitleg/aow-uitgelegd
/uitleg/rendement-en-risico
/uitleg/inflatie-en-koopkracht
/uitleg/jaarruimte-en-lijfrente
/over                  Wie erachter zit + disclaimer (indicatief, geen advies)
```

Elke uitlegpagina: heldere kop, korte intro die meteen de vraag beantwoordt, dan verdieping,
en een duidelijke link naar de bijbehorende rekentool.

---

## 5. Content- en SEO/LLM-aanpak

- Schrijf per pagina rond één duidelijke zoekvraag (bijv. "hoeveel vermogen heb ik nodig om
  te stoppen met werken?").
- Structuur: `<h1>` met de vraag, korte samenvatting bovenaan (goed voor LLM-antwoorden),
  daarna verdieping met `<h2>`-koppen.
- Voeg per pagina passende meta-tags toe (title, description) en structured data
  (FAQ/Article schema) — helpt Google en LLM's.
- Interne links tussen uitleg en tools.
- Neutraal en bronvermeldend (belastingdienst.nl, svb.nl, mijnpensioenoverzicht.nl).
- Zie de bestaande memory "content-strategie" voor de onderwerpenlijst.

---

## 6. Rekentools — nu en toekomst

- **Nu:** pensioenplanner (klaar, route `/`), bruto-netto (klaar, route `/bruto-netto`).
- **Toekomst-ideeën:** spaarquote/FIRE-getal (hoeveel spaar ik, wanneer ben ik vrij),
  "hoeveel is mijn pensioentekort", jaarruimte (wordt een **apart** project — zie
  `JAARRUIMTE_TOOL.md`; besluit of het hier embedt of apart blijft).
- Alle tools delen dezelfde rekenkern-stijl: logica in `src/utils/`, instelbare cijfers in
  `src/config/`. Houd dat patroon aan.

---

## 7. Concrete eerste stappen voor de volgende sessie

1. Bevestig de architectuurkeuze met de gebruiker (aanbeveling: doorgaan op react-router + SSG).
2. Schakel statische pre-rendering in (bijv. `vite-react-ssg`) zodat routes als HTML worden
   geserveerd — cruciaal voor SEO/LLM-vindbaarheid.
3. Bouw een echte **home** (`/`) met uitleg + ingangen; verplaats de pensioenplanner naar
   een eigen route (bijv. `/ben-ik-financieel-onafhankelijk`). Let op: de huidige `/` ís de
   planner — die route-wissel raakt ook de klantnaam-logica in de Header.
4. Voeg de eerste uitlegpagina toe als sjabloon; laat de gebruiker de toon beoordelen.
5. Rol de overige uitlegpagina's uit.
6. Regel per route meta-tags/sitemap/structured data (de bruto-nettotool doet dit al
   handmatig via `document.title` — trek dat gelijk over alle pagina's).
7. Los het parameter-duplicatiepunt op (zie sectie 2): heffingskortingen naar
   `fiscaleParameters.ts`, bruto-nettotool daaruit laten lezen.
8. Behoud de bestaande koppelingen: Vercel-deploy, domein, feedback→Slack, kwartaalcheck.

---

## 8. Openstaande beslissingen (voorleggen aan gebruiker)

- Architectuur: doorgaan op react-router + SSG (aanbevolen) of alsnog migreren naar Astro?
- Blijft de jaarruimtetool apart of komt die op deze site?
- Wil de gebruiker een blog/nieuws-sectie of alleen vaste uitlegpagina's?
- Eén auteur-/merkidentiteit (Titolab) zichtbaar, of bewust neutraal/anoniem?
- Taalniveau bevestigen (voorstel: B1, breed toegankelijk).

---

## 9. Werkafspraken

- Deploy via Command Prompt (niet PowerShell): `git add . && git commit -m "..." && git push`.
- Vanaf nu bij grotere wijzigingen: **feature branches** en mergen naar `main`.
- Fiscale cijfers alleen wijzigen in `src/config/fiscaleParameters.ts`.
- Nooit tokens/wachtwoorden in de chat; bij per ongeluk direct revoken.
