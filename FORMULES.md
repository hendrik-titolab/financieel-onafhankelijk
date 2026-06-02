# Rekenformules — Pensioenplanner benikfinancieelonafhankelijk.nl

Overzicht van alle formules die in de tool worden gebruikt, met uitleg per formule.

---

## 1. Reëel rendement (Fisher-vergelijking)

```
reëel rendement = ((1 + nominaal/100) / (1 + inflatie/100) - 1) × 100
```

**Wat het doet:** Zet het nominale rendement (bijv. 7%) om naar het reële rendement
(bijv. ~4,4% bij 2,5% inflatie). Door met het reële rendement te rekenen blijft de
koopkracht van alle bedragen constant op "huidig niveau" — €4.000 gewenst inkomen
vandaag is straks in de berekening nog steeds €4.000 in koopkracht van nu.

---

## 2. Belasting (bruto → netto, box 1)

```
Vóór AOW-leeftijd:
  netto = bruto × (1 − 36,97%)                                    [inkomen ≤ €75.624]
  netto = €75.624 × 63,03% + (bruto − €75.624) × 50,5%           [inkomen > €75.624]

Ná AOW-leeftijd:
  netto = bruto × (1 − 19,07%)                                    [inkomen ≤ €75.624]
  netto = €75.624 × 80,93% + (bruto − €75.624) × 50,5%           [inkomen > €75.624]
```

**Wat het doet:** Zet het bruto werkgeverspensioen om naar netto. Het tarief in schijf 1
verschilt voor en na de AOW-leeftijd (36,97% vs 19,07%) — dit heet phase-aware belasting.
Vóór de AOW-leeftijd zit de AOW-premie nog in het tarief; daarna niet meer.

---

## 3. Benodigde onttrekking uit eigen vermogen

```
maandelijks uit eigen vermogen = max(0, gewenst netto − AOW netto − werkgeverspensioen netto)
```

**Wat het doet:** Bepaalt per jaar hoeveel er uit het eigen vermogen moet komen, rekening
houdend met wat AOW en werkgeverspensioen al dekken. AOW en werkgeverspensioen kunnen
een andere startleeftijd hebben dan de pensioenleeftijd. In de overbruggingsperiode
(vóór AOW/werkgeverspensioen) dekt het eigen vermogen het volledige gewenste inkomen.

---

## 4. Vermogensopbouw (jaar voor jaar)

```
Per jaar vóór pensionering:
  kapitaal(jaar+1) = (kapitaal + eenmalige_event) × (1 + reëel rendement) + maandinleg × 12
```

**Wat het doet:** Simuleert hoe het vermogen jaar voor jaar groeit. Life events en
stortingen worden aan het begin van het jaar verwerkt vóór de groei — zodat ze ook
rendement maken gedurende dat jaar.

---

## 5. Benodigd eindvermogen (contante waarde)

```
benodigd kapitaal = Σ  jaarlijkse onttrekking / (1 + reëel rendement)^(jaar + 0,5)
                   jaar=0..N
```

**Wat het doet:** Berekent hoeveel kapitaal je op je pensioendatum nodig hebt om alle
toekomstige opnames te kunnen doen. De `+ 0,5` in de exponent gaat ervan uit dat
onttrekkingen gemiddeld halverwege het jaar plaatsvinden (midpoint-conventie) — iets
realistischer dan begin of einde van het jaar.

---

## 6. Benodigde maandinleg (binaire zoekalgoritme)

```
Zoek maandinleg M zodat: opbouwsimulatie(M) = benodigd kapitaal
Methode: halveer het zoekinterval 60 keer (nauwkeurigheid < €0,01)
```

**Wat het doet:** Lost de vraag op "hoeveel moet ik per maand inleggen om precies genoeg
te hebben?" Er bestaat geen directe formule voor (vanwege de life events), dus het
algoritme probeert systematisch hogere en lagere bedragen totdat het de juiste inleg
gevonden heeft.

---

## 7. Monte Carlo simulatie

```
Per simulatie (2.000 totaal), per jaar:

  rendement = N(gemiddeld reëel rendement, volatiliteit)    [Box-Muller normaalverdeling]

  Vóór pensionering:
    kapitaal(jaar+1) = (kapitaal + event) × (1 + rendement) + maandinleg × 12

  Ná pensionering:
    kapitaal(jaar+1) = kapitaal × (1 + rendement) − jaarlijkse onttrekking

  Slagingskans 100% = simulaties waarbij kapitaal ≥ 0 aan einde / 2.000
  Slagingskans 75%  = simulaties waarbij kapitaal ≥ 0 met 75% onttrekking / 2.000
```

**Wat het doet:** Herhaalt de berekening 2.000 keer, maar met elk jaar een ander
willekeurig rendement (normaal verdeeld rondom het opgegeven gemiddelde). Dit laat zien
hoe groot de kans is dat het plan ook uitkomt als de markten meevallen of tegenvallen.

**Variantiedrag:** Doordat rendementen fluctueren, valt de mediaan (P50) van de simulaties
iets lager uit dan de enkelvoudige berekening. Geometrisch gemiddelde ≈ rekenkundig
gemiddelde − σ²/2. Dit is wiskundig correct en geen fout in de berekening.

---

## 8. Jaarruimte (lijfrente-aftrek box 1)

### Basisgrootheden

```
toetsingsinkomen  = min(bruto jaarinkomen t−1, maximuminkomen)
pensioengrondslag = max(0, toetsingsinkomen − franchise)
```

### Jaarruimte per situatie

**Pre-2023 (oud regime):**
```
jaarruimte = 13,3% × pensioengrondslag − 7,44 × factor A
```

**2023+ met traditioneel DB-pensioen:**
```
jaarruimte = 30% × pensioengrondslag − 6,27 × factor A
```

**2023+ met Wtp-pensioen (beschikbare premie):**
```
jaarruimte = 30% × pensioengrondslag − werkgeverspremie
```

**Geen werkgeverspensioen (bijv. ZZP):**
```
jaarruimte = 30% × pensioengrondslag
```

### Reserveringsruimte

```
per jaar   = min(onbenut bedrag dat jaar, cap voor dat jaar)
beschikbaar = min(som van gecapte bedragen, €80.000)
```

### Totaal en belastingvoordeel

```
totaal beschikbaar = jaarruimte + beschikbare reserveringsruimte
nog in te leggen   = max(0, totaal beschikbaar − al ingelegd dit jaar)
belastingvoordeel  = nog in te leggen × belastingtarief
```

**Wat het doet:** Berekent het maximale bedrag dat fiscaal aftrekbaar in een
lijfrenteproduct gestort mag worden. Factor A (pensioenaangroei via werkgever, uit
de UPO) verlaagt de ruimte omdat de werkgever al pensioen opbouwt. De
reserveringsruimte laat toe om onbenutte ruimte uit eerdere jaren (max 10 jaar
terug) alsnog te benutten.

---

## Parameters jaarruimte per belastingjaar

| Jaar  | Franchise | Max inkomen | % | Factor | Cap/jaar |
|-------|-----------|-------------|---|--------|----------|
| 2026⚠ | €18.171  | €143.800    | 30% | 6,27 | €8.000 |
| 2025  | €17.848  | €141.224    | 30% | 6,27 | €8.000 |
| 2024  | €17.545  | €137.800    | 30% | 6,27 | €8.000 |
| 2023  | €16.322  | €128.810    | 30% | 6,27 | €8.000 |
| 2022  | €12.837  | €114.866    | 13,3% | 7,44 | €7.587 |
| 2021  | €11.954  | €112.189    | 13,3% | 7,44 | €7.277 |
| 2020  | €11.408  | €110.111    | 13,3% | 7,44 | €7.030 |

⚠ 2026 is een schatting op basis van indexatie. Controleer belastingdienst.nl.
