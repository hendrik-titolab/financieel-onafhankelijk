# Handoff — Rekentool "Hoe snel eet inflatie jouw spaargeld op?"

_Laatst bijgewerkt: 2026-07-21 · branch `astro-migratie`_

## Wat is er gebouwd

Een losse, educatieve rekentool voor **benikfinancieelonafhankelijk.nl** die laat zien hoe inflatie
de koopkracht van spaargeld uitholt — óók als het spaargeld rente oplevert. Puur informatief, géén
persoonlijk advies. Live op `/tools/inflatie`.

De tool draait volledig client-side (React-island, geen backend/opslag) en volgt exact de bestaande
conventies van de andere tools (jaarruimte, bruto-netto).

## Bestanden

| Bestand | Rol |
|---|---|
| `src/components/Inflatie/index.tsx` | De React-island `InflatieCalculator` — invoer, rekenlogica, Recharts-grafiek, kerncijfers, box 3-noot. Alles inline (lokale `eur`/`pct`-formatters, `bereken()`-functie). |
| `src/pages/tools/inflatie.astro` | SEO-omhulsel op `/tools/inflatie`: `BaseLayout` + Article/FAQ/Breadcrumb JSON-LD via `src/lib/seo.ts`, intro-copy, en een **"Lees ook"-sectie** naar twee uitleg-pagina's. |
| `src/components/Header.astro` | Nav-array: link **"Inflatie"** toegevoegd naast Jaarruimte. |
| `src/components/Footer.astro` | "Rekentools"-lijst: **"Inflatie & spaargeld"** toegevoegd. |

Hergebruikt (ongewijzigd): `BaseLayout.astro`, `lib/seo.ts`, `index.css` (`.card`/`.input-field`/
`.label` + globale slider-styling), `tailwind.config.js` (`primary`-blauw), Recharts, `lucide-react`.

## Functionele beslissingen (door Hendrik bevestigd)

- **Ultra-simpel, losse tool.** Géén maandelijkse inleg (stretch-feature bewust weggelaten).
- **Defaults, allemaal aanpasbaar:** startbedrag **€10.000**, inflatie **3,0%**, spaarrente **1,5%**,
  looptijd **20 jaar** (slider 1–30).
- **In de navigatie opgenomen** (Header + Footer) — dit was aanvankelijk "alleen losse pagina", maar
  op verzoek alsnog in beide menu's gezet.
- **Bewust buiten scope:** box 3 / vermogensrendementsheffing, CTA/afspraakmodule, backend/opslag,
  persoonlijk advies.

## Rekenlogica

Voor elk jaar `t = 0..looptijd`:
- `nominaal_t   = startbedrag × (1 + spaarrente/100)^t`
- `koopkracht_t = nominaal_t / (1 + inflatie/100)^t`

Afgeleiden:
- `netto reëel rendement = (1 + spaarrente/100) / (1 + inflatie/100) − 1` (Fisher, in % p.j.)
- `koopkrachtverlies (€) = startbedrag − koopkracht_eind` (t.o.v. het startbedrag van nu)
- `koopkrachtverlies (%) = verlies / startbedrag × 100`

Validatie/clamping in `bereken()`: bedragen ≥ 0, rentes 0–20%, looptijd 1–30; lege velden → 0
(geen NaN); deel-door-nul kan niet (noemer altijd > 0).

Het verhaal wordt **eerlijk beide kanten op** getoond: spaarrente < inflatie → koopkracht daalt
(rood/amber); spaarrente > inflatie → koopkracht stijgt (emerald).

## Geverifieerd

- `npm run build` slaagt; `/tools/inflatie` wordt gegenereerd.
- In de browser gecontroleerd met defaults: nominaal €13.469, koopkracht €7.457, verlies
  €2.543 (25,4%), reëel rendement −1,5% p.j. — wiskundig correct, geen console-errors.
- Live-herberekening werkt; met spaarrente 4% > inflatie 3% flipt de kop naar
  "stijging €2.132 (21,3%)", reëel rendement +1,0% p.j.
- Header- en footer-links geverifieerd op de draaiende site (actieve staat klopt).

## ⚠️ Bekend aandachtspunt — grafiek in embedded preview

In de **ingebouwde preview-browser** blijft de Recharts-grafiek leeg: die pane levert geen
`ResizeObserver`-callbacks, waardoor Recharts' `ResponsiveContainer` zijn kind niet mount. Dit is
een limitatie van díe preview-omgeving, **niet** van de code — het is exact hetzelfde
`ResponsiveContainer`-patroon als de bestaande `WealthChart` (pensioenplanner) en rendert normaal in
een gewone browser (Chrome/Edge/Firefox) en op Vercel. → **Verifieer de grafiek na deploy even in
de Vercel-preview of in een echte lokale browser.**

## Git-status

Alle tool-bestanden staan al **gecommit** op `astro-migratie` (o.a. commits
`2c9a512` inflatie-pillar + artikel, `a303cee` 'Lees ook'-links, `cb6080d` bronlinks). Working tree
is verder schoon. Nog niet gemerged naar `main`.

De "Lees ook"-links in `inflatie.astro` wijzen naar bestaande content:
`/uitleg/sparen-maakt-mensen-arm` en `/uitleg/wat-is-inflatie` (beide `.md` aanwezig in
`src/content/uitleg/`).

## Mogelijke vervolgstappen (optioneel, nog niet gedaan)

- Grafiek in Vercel-preview visueel bevestigen.
- Eventueel de tool linken vanuit de inflatie-pillar/artikelen (interne linking tool ↔ content).
- Cutover van `astro-migratie` naar `main` wanneer het geheel klaar is.
