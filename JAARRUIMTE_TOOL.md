# Jaarruimte Tool — Documentatie voor losse tool

Dit bestand bevat alle relevante informatie om de jaarruimteberekening als 
zelfstandige tool te bouwen. De code stond eerder in deze pensioenplanner app
maar wordt een aparte tool.

---

## Bronbestanden (bewaard in deze repo)

De volledige implementatie staat nog in:
- `src/components/Jaarruimte/index.tsx` — UI component
- `src/utils/jaarruimte.ts` — berekeningslogica + parameters
- `src/types/index.ts` — types (JaarruimteInputs, JaarruimteResult, etc.)

En de Claude skill:
- `C:\Users\schak\.claude\skills\jaarruimte-berekening\SKILL.md`
- `C:\Users\schak\.claude\skills\jaarruimte-berekening\references\parameters.md`

---

## Wat de tool doet

Berekent hoeveel iemand fiscaal mag inleggen in een lijfrenteproduct (banksparen
of lijfrenteverzekering), op basis van:
- **Jaarruimte** (het bedrag voor dit jaar)
- **Reserveringsruimte** (onbenutte jaarruimte uit eerdere jaren, max 10 jaar terug)

---

## Formules

### Jaarruimte

**Pre-2023 (oud regime):**
```
jaarruimte = 13,3% × (toetsingsinkomen − franchise) − 7,44 × factor A
```

**2023+ (Wtp, nieuw regime):**
```
jaarruimte = 30% × (toetsingsinkomen − franchise) − 6,27 × factor A   [DB-regeling]
jaarruimte = 30% × (toetsingsinkomen − franchise) − werkgeverspremie   [Wtp-regeling]
jaarruimte = 30% × (toetsingsinkomen − franchise)                       [geen pensioen]
```

Waarbij:
- **toetsingsinkomen** = min(bruto jaarinkomen t−1, maxInkomen)
- **franchise** = wettelijke aftrek (zie parameters per jaar)
- **factor A** = pensioenaangroei vorig jaar (van UPO, in €/jaar) — alleen bij DB-regeling
- **werkgeverspremie** = door werkgever ingelegde premie in t−1 — alleen bij Wtp-regeling

### Reserveringsruimte

```
per jaar    = min(onbenut bedrag uit dat jaar, cap voor dat jaar)
beschikbaar = min(som van gecapte bedragen, €80.000)
```

### Totaal en belastingvoordeel

```
totaal beschikbaar = jaarruimte + beschikbare reserveringsruimte
nog in te leggen   = max(0, totaal beschikbaar − al ingelegd dit jaar)
belastingvoordeel  = nog in te leggen × belastingtarief
```

---

## Parameters per jaar

| Jaar | Franchise | Max inkomen | % | Factor | Cap/jaar | Schijfgrens |
|------|-----------|-------------|---|--------|----------|-------------|
| 2026⚠| €18.171 | €143.800 | 30% | 6,27 | €8.000 | €76.817 (geschat) |
| 2025 | €17.848 | €141.224 | 30% | 6,27 | €8.000 | €75.624 |
| 2024 | €17.545 | €137.800 | 30% | 6,27 | €8.000 | €75.624 |
| 2023 | €16.322 | €128.810 | 30% | 6,27 | €8.000 | €73.031 |
| 2022 | €12.837 | €114.866 | 13,3% | 7,44 | €7.587 | €69.398 |
| 2021 | €11.954 | €112.189 | 13,3% | 7,44 | €7.277 | €68.507 |
| 2020 | €11.408 | €110.111 | 13,3% | 7,44 | €7.030 | €68.507 |

Belastingtarief: **49,5%** boven schijfgrens, **36,97%** (of historisch equivalent) eronder.

⚠ 2026 is een schatting. Controleer belastingdienst.nl.

---

## UI-ontwerp (wat al gebouwd was)

### Invoer (formulier)
- **Belastingjaar** — dropdown (2020–2026)
- **Klantnaam + adviseursnaam** — tekstinvoer
- **Bruto jaarinkomen [t−1]** — dynamisch label met bronjaar
- **Pensioentype t−1** — drie knoppen: Geen / DB / Wtp
  - DB: factor A veld (bron: UPO t−1, rubriek "pensioenaangroei")
  - Wtp: werkgeverspremie veld (bron: jaaroverzicht pensioenuitvoerder t−1)
- **Al ingelegd dit jaar** — bedrag
- **Reserveringsruimte** — twee modi:
  - *Ik weet de bedragen*: directe invoer jaar + onbenut bedrag
  - *Bereken voor mij*: uitklapbare kaartjes per jaar met inkomen + pensioentype + factor A → automatisch berekend

### Output
- Jaarruimte (berekend)
- Reserveringsruimte (berekend)
- Totaal beschikbaar
- Al ingelegd (voortgangsbalk)
- Nog in te leggen
- Belastingvoordeel (tarief%)
- Opgeslagen berekeningen (localStorage)

---

## Wtp vs DB — uitleg

**DB-regeling (traditioneel, eindloon/middelloon/CDC):**
- Factor A staat op de UPO (Uniform Pensioenoverzicht)
- Rubriek: "pensioenaangroei vorig jaar" of "toename pensioenaanspraak" — in €/jaar
- Gebruik ALTIJD de UPO van jaar t−1, nooit het lopende jaar

**Wtp-regeling (beschikbare premie/DC, ingegaan 2023+):**
- Werkgever legt een vast % van salaris in als pensioenpremie
- Bedrag staat op jaaroverzicht van de pensioenuitvoerder
- Herkenbaar: persoonlijk pensioenpotje, vaste premiebijdrage

**Gemengd jaar:** als de regeling per 1 januari overging → gebruik één van beide
(in de praktijk gaan regelingen bijna altijd per 1 januari over)

---

## Datakwaliteit — BELANGRIJK

De berekening is alleen zo goed als de invoer. Benadruk bij elke berekening:

> "Gebruik altijd officiële documenten — jaaropgave, UPO of aangifte.
> Voor jaarruimte [jaar] heb je de cijfers van [jaar−1] nodig."

Veelgemaakte fouten:
- Huidig salaris gebruiken i.p.v. gerealiseerd inkomen van t−1
- UPO van het verkeerde jaar pakken
- Werknemersbijdrage meerekenen bij Wtp (alleen werkgeverspremie telt)

---

## Technische stack (zelfde als pensioenplanner)

React 18 + Vite + TypeScript + Tailwind CSS

Aanbevolen domein voor de losse tool: nog te bepalen
Hosting: Vercel (zelfde aanpak als benikfinancieelonafhankelijk.nl)
