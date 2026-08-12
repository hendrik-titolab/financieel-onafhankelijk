# Hand-off — audit 2026-08, rekenlogica-cluster: afgerond

> Bijgewerkt 12 augustus 2026, aan het eind van de rekenlogica-sessie. Branch `audit-2026-08`,
> **niet gemerged naar `astro-migratie`, niet gepusht**. Werkende map:
> `C:\Users\schak\financiele-planning`.

## Status: alle zes de punten uitgevoerd

Zes commits, in deze volgorde. Elke commit is op zichzelf groen (`npm run test`, `npm run build`,
`npm run check` met alleen de bekende `exportExcel.ts`-fout uit de Fase 0-baseline).

| Commit | Wat |
|---|---|
| `78550b6` | E1-optie-A: disclosure dat het model uitgaat van vrij belegd vermogen (box 3) |
| `e896e4d` | A1: één functie voor de inkomensverdeling, twee inline kopieën weg |
| `c2f79e5` | E9: `requiredCapital` rekent met dezelfde eind-jaar-conventie als de simulatie |
| `c01b549` | E6: slagingskans kijkt of het kapitaal ooit negatief werd |
| `962aff3` | E7: Monte Carlo past eenmalige bedragen ná de pensioendatum nu wel toe |
| `5fc543b` | E8: lognormale rendementstrekking |

De commit messages bevatten per punt de narekening en de motivatie. Lees die bij twijfel, ze zijn
uitvoeriger dan dit overzicht.

### Wat er inhoudelijk is veranderd aan de uitkomsten

- **E9**: "Benodigd eindvermogen" en "Benodigde maandinleg" dalen met factor 1/√r_post, circa 0,5
  tot 1%. Live: € 598.163 → € 593.834 en € 676 → € 668. Een pot ter grootte van het getoonde
  doelbedrag loopt nu precies leeg in de simulatie (restant 0), voorheen bleef er een positief
  restant over.
- **E8**: de hele Monte Carlo-verdeling schuift omhoog. De mediaan lag 34% onder het
  deterministische "Verwacht eindvermogen", nu ligt hij er vlak omheen (verhouding 0,977 bij het
  ijkpunt uit `AUDIT-fase3-livetests.md`, gemiddeld 0,991 over tien seeds). Slagingskansen stijgen
  navenant: golden scenario 1 van 5,05% naar 8,80%.
- **E7**: een eenmalig bedrag ná de pensioendatum verlaagt nu ook de slagingskans en de bandbreedte,
  niet alleen de deterministische lijn. Golden scenario 4: 3,10% i.p.v. 5,05% (en na E8 5,95%).
- **E6**: geen zichtbaar effect op de cijfers, gemeten en gerapporteerd. Zie hieronder.
- **A1**: geen numeriek effect, alle fixtures ongewijzigd. Dat was de zuiverheidstoets.

### Twee besluiten die in deze sessie zijn genomen

1. **A1, het klem-gedrag blijft lokaal.** `actualFromCapital = capital > 0 ? fromCapital : 0` raakt
   alleen de weergegeven `incomeFromCapital`/`totalIncome` en gaat niet de gedeelde functie in. De
   kapitaalmutatie gebruikt bewust de ónbeperkte waarde, anders gaat het gemeten tekort stilzwijgend
   iets anders betekenen. Uitgeschreven in commit `e896e4d`.
2. **E8, lognormaal trekken (optie a).** Gekozen boven optie b (½σ² bij het gemiddelde optellen),
   omdat de mediaan dan exact klopt in plaats van benaderd, en omdat het trekkingen onder −100%
   rendement onmogelijk maakt. Dat laatste was het mechanisme achter E6.

### Correctie op het vorige hand-off-document

Dat schreef bij E9 voor: "verwijder de `+ 0.5`". Dat is fout. Exponent `yr` is een
begin-jaar-annuïteit en wijkt een half jaar de ándere kant op. Correct is `yr + 1`. Narekening met
het voorbeeld uit `AUDIT-fase0-1-feiten.md` (25 jaar, 2% reëel, €12.000/jaar):

```
oud (yr + 0.5)     € 236.612,7
nieuw (yr + 1)     € 234.281,5   = gesloten formule W × (1 − 1,02^−25) / 0,02
yr (begin-jaar)    € 238.967,1   <- wat het hand-off-document voorstelde
```

---

## Wat bewust is blijven liggen

### 1. E1-optie-B: het veld "waarvan fiscaal beklemd" (lijfrente, banksparen, pensioenbeleggen)

Hendriks idee, besproken aan het begin van deze sessie, **uitgesteld naar de her-ijkingssessie**.
Drie redenen, in volgorde van gewicht:

1. **Het hangt vast aan E4.** `brutoToNetto`/`nettoToBruto` kennen geen heffingskortingen en rekenen
   vanaf schijf 1, terwijl een lijfrente-uitkering marginaal bovenop AOW en werkgeverspensioen
   belast wordt. Bruteren met de huidige motor levert een nieuwe, subtielere rekenfout op: minder
   zichtbaar dan de fout die je ermee repareert. **E4 dus eerst.**
2. **Een lijfrentepot is geen pot waar je vrij uit onttrekt.** Bij expiratie moet het kapitaal worden
   omgezet in periodieke uitkeringen (art. 3.125 Wet IB 2001). Modelleer je het als vermogen waar de
   tool naar behoefte uit put, dan modelleer je iets wat wettelijk niet mag.
3. **Aanbevolen ontwerp als het zover is:** invoerveld onder vermogen (dat is wat de gebruiker op
   zijn overzicht ziet), maar intern omgezet naar een bruto periodieke uitkering vanaf de
   pensioendatum en behandeld als derde inkomensbron naast AOW en werkgeverspensioen. Het bedrag
   moet dan uit `currentCapital` gehaald worden vóór de vrije-onttrekkingslogica én vóór de Monte
   Carlo, anders telt het dubbel. `nettoToBruto` (nu dode code, bevinding A20) wordt daarmee alsnog
   nuttig.

**Nog op te zoeken vóór de bouw:** het maximum jaarbedrag voor een tijdelijke oudedagslijfrente in
2026, plus de minimumlooptijd. Hoort in `FISCALE-BRONNEN.md` met bron. Niet uit het hoofd invullen.

### 2. De inlegconventie in `simulateAccumulation`

`monthlyPMT * 12` wordt pas ná de jaarlijkse rendementsfactor bijgeschreven, terwijl de inleg
feitelijk maandelijks is: geen rendement over de eigen inleg in het jaar zelf. Bewust laten liggen
bij E9, omdat `monteCarlo.ts` het identiek doet en de twee dus onderling consistent blijven. Het is
een conventievraag over het inlegmoment, geen aansluitfout tussen doel en simulatie. Los het op in
de her-ijkingssessie, in beide bestanden tegelijk.

### 3. E6 heeft geen meetbaar effect, en dat is genoteerd, niet weggemoffeld

Gemeten met een seeded herberekening (oud en nieuw criterium op exact dezelfde paden): nul verschil
bij vermogens van €400k tot €2 mln en bij volatiliteiten tot 25%. Pas bij een onrealistische 40%
volatiliteit na pensionering kantelen 2 van de 2.000 paden. Na E8 kan het helemaal niet meer
voorkomen. De KPI meet nu wat zijn label belooft; de getoonde percentages veranderen er niet door.

### 4. De rest van de audit, ongewijzigd buiten scope

E2 (box 3), E3 (kosten), E4 (bruto-netto zonder heffingskortingen), E5 (indexatie), F1/A7 (welke
kant van de jaarruimte-formule correct is, wacht op Hendriks beoordeling van de 🟡-bronnen), de
jaarruimte-configfixes uit `FISCALE-BRONNEN.md` §5, en de B-serie content-fixes (B2/B4/B5).

---

## Volgende stap

De her-ijkingssessie over bruto-netto pensioeninkomen. Volgorde die ik zou aanhouden:

1. **E4 eerst**: één functie die het totale bruto box 1-inkomen belast, inclusief heffingskortingen,
   met AOW, werkgeverspensioen en straks lijfrente als stapelende bronnen. Dit is de motor waar al
   het andere op leunt. Live gemeten verschil nu: € 707/maand op € 30.000 bruto.
2. Daarna E1-optie-B (het beklemd-veld), dat bovenop die motor gebouwd wordt.
3. Daarna E2 (box 3), E3 (kosten) en E5 (indexatie), elk met een eigen besluit over wel/niet
   modelleren.
4. De inlegconventie uit punt 2 hierboven, in `pensionCalc.ts` en `monteCarlo.ts` tegelijk.

## Werkwijze die is aangehouden (en die zich bewees)

- Elke wijziging eerst voorleggen, dan pas toepassen.
- Vóór elke commit: `npm run build`, `npm run test`, `npm run check`.
- Elke rekenwijziging onafhankelijk narekenen vóór het bijwerken van een golden-fixture, niet
  andersom. Bij E9 haalde dat een fout in het vorige hand-off-document boven water; bij E6 liet het
  zien dat de fix geen numeriek effect heeft. Beide waren onzichtbaar geweest als de fixtures
  klakkeloos waren geregenereerd.
- Live controleren in de browser via de preview-tools, niet via Bash.
- Nog steeds: **niet pushen naar `astro-migratie`**, dat is de live productiebranch.
