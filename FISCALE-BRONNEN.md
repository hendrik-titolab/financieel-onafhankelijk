# Fiscale bronnen — analyse en openstaande vragen

> **De cijfers staan hier niet meer.** Ze staan sinds 13 augustus 2026 in
> `C:\Users\schak\Documents\Fiscale bron\fiscale-cijfers.json`, met bron en status per waarde, en
> `src/config/fiscaleParameters.ts` wordt daaruit gegenereerd.
>
> Wat hier wél staat: de analyse uit de audit van augustus 2026. Wat er precies mis lijkt in de
> jaarruimteparameters, welk mechanisme ontbreekt, en wat er nog beoordeeld moet worden. Die
> redenering past niet in een datastructuur en zou anders verloren gaan.

**Ontstaan:** audit 2026-08 (`AUDIT-fase0-1-feiten.md`, `AUDIT-fase2-externe-bronnen.md`).

---

## Waarom de cijfers verhuisd zijn

Dezelfde getallen stonden op minstens drie plekken: `fiscaleParameters.ts`, dit document, en de
parameters van de jaarruimte-skill. Die spraken elkaar aantoonbaar tegen. Zolang een cijfer op drie
plekken staat, is de vraag niet óf ze uit elkaar lopen maar wanneer je het merkt.

De generator in de bronmap lost dat op voor de code. Voor dit document betekende het: de tabellen
eruit, de analyse erin laten.

---

## Jaarruimte: wat er precies mis lijkt

Bron voor 2026 is belastingdienst.nl (bevestigd). Voor 2016 tot en met 2025 een derde-partij-
overzicht dat op belastingdienst.nl gehost staat, met wetsartikel per regel. Dat laatste is
**voorlopig**: compleet voor alle elf jaren, maar nog niet primair bevestigd.

**Franchise en maximum toetsingsinkomen kwamen voor alle elf jaren tot op de euro overeen.** Dat
deel van de configuratie is betrouwbaar gebleken. De fouten zitten elders.

### Percentage
Alleen 2016 wijkt af: dat moet 13,8% zijn, niet 13,3%. De daling naar 13,3% ging pas in bij 2018,
niet bij 2017 zoals tijdens de audit eerst werd vermoed.

### Factor A-vermenigvuldiger
Twee jaren wijken af, niet één. **2018** moet 6,27 zijn in plaats van 6,50: de overstap gebeurde
dus een jaar eerder dan de configuratie aangeeft. En **2022** moet 6,27 zijn in plaats van 7,44.
Die 7,44 is een uitschieter die ook nergens in de reeks past, want 2021 en 2023 staan allebei op
6,27.

### Reserveringsruimte
Fout in **alle** jaren behalve 2026, en op twee verschillende manieren.

**Vanaf 2023** klopt de systematiek wel maar de bedragen niet: de site lijkt een jaar achter te
lopen. Het cijfer dat de site voor 2024 gebruikt is exact het echte cijfer van 2023, en 2025
herhaalt gewoon het foute cijfer van 2024.

**Vóór 2023 ontbreekt het hele mechanisme.** Het was toen geen vast bedrag maar twee
leeftijdstarieven, met als omslagpunt steevast de **AOW-leeftijd van dat jaar min tien jaar**. Dat
patroon is consistent over alle gecontroleerde jaren:

| Jaar | AOW-leeftijd | Omslagpunt |
|---|---|---|
| 2016 | 65 jaar en 6 maanden | 55 jaar en 6 maanden |
| 2020 | 66 jaar en 4 maanden | 56 jaar en 4 maanden |
| 2021 | 66 jaar en 4 maanden | 56 jaar en 4 maanden |
| 2022 | 66 jaar en 7 maanden | 56 jaar en 7 maanden |

`jaarruimte.ts` kent dit onderscheid nergens. **Dit is geen bijwerk-taak maar een ontwerpvraag:**
dit alsnog bouwen voor de jaren vóór 2023, of expliciet in de tool vermelden dat de
reserveringsruimte voor die jaren een vereenvoudiging hanteert. Los van elk jaarcijfer.

Let op: het patroon "min tien jaar" is consistent in alle gecontroleerde jaren maar wordt in de
bron niet expliciet zo benoemd. Dat is afgeleid, niet geciteerd.

### Toevoeging oudedagsreserve (FOR)
Ontbreekt volledig, en is in de bron bevestigd als een apart mechanisme: 9,44% van de winst, met
een eigen maximum dat per jaar verschilt (€9.218 in 2020, €9.395 in 2021, €9.632 in 2022). Het
verlaagt de jaarruimte. Relevant voor elke ondernemer die een jaarruimteberekening over een jaar
vóór 2023 laat doen.

---

## Twee definitiekwesties die géén fout zijn

Bij het bevestigen van de heffingskortingen kwamen twee verschillen naar boven die er als een fout
uitzien maar het niet zijn. Genoteerd zodat ze niet elk jaar opnieuw uitgezocht worden.

- De tabel van de Belastingdienst noemt de afbouwgrens van de algemene heffingskorting **€29.737**,
  terwijl de formule op diezelfde pagina rekent met `verzamelinkomen − €29.736`. De configuratie
  gebruikt de formulewaarde en is dus juist.
- De tabel noemt de korting nihil **vanaf €78.427**, de configuratie houdt €78.426 aan. Bij €78.426
  komt de formule op €0,19 uit, afgerond nul. Verschil in definitie, niet in uitkomst.

---

## Openstaand, wacht op eigen beoordeling

1. **Jaarruimte 2016-2025 van voorlopig naar bevestigd.** Zoek per jaar een directe
   belastingdienst.nl-pagina of wetten.overheid.nl art. 3.127 Wet IB 2001, in plaats van de
   derde-partijbron. Hier hangen de correcties hierboven aan: zolang de bron voorlopig is, staat
   niet vast welke kant gecorrigeerd moet worden, de tekst of de jaardata.
2. **De reserveringsruimte vóór 2023:** bouwen of vermelden. Ontwerpvraag, zie hierboven.
3. **De FOR:** inbouwen of expliciet buiten scope verklaren.
4. **AOW-bedragen** zijn niet extern herbevestigd. Bron is svb.nl.
5. **De exacte terugkijktermijn en leeftijdsgrens voor jaren vóór 2020**, waar het patroon wel
   consistent is maar niet expliciet in de bron staat.

De volledige lijst met openstaande punten, inclusief de punten die niets met jaarruimte te maken
hebben, wordt automatisch gegenereerd uit de bron en staat in
`Documents\Fiscale bron\Fiscale cijfers, formules en uitgangspunten.md`, deel 4.
