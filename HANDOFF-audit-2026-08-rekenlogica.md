# Hand-off audit 2026-08 — wat af is, en wat er nog open staat

> Bijgewerkt 12 augustus 2026. Branch `audit-2026-08`, gemerged naar `astro-migratie` en live.
> Werkende map: `C:\Users\schak\financiele-planning`.

Dit document heeft twee delen. **Deel 1** is wat er op 12 augustus is gedaan. **Deel 2** is de
werklijst voor daarna: eerst de bugs die geen besluit vragen, dan de keuzes die jij moet maken, dan
wat op externe bronverificatie wacht. Als je één ding leest: begin bij A3 in deel 2.

---

# Deel 1 — wat er op 12 augustus is gedaan

Zeven commits. Elke commit is op zichzelf groen (`npm run test`, `npm run build`, `npm run check`
met alleen de bekende `exportExcel.ts`-fout uit de Fase 0-baseline).

| Commit | Wat |
|---|---|
| `78550b6` | E1-optie-A: disclosure dat het model uitgaat van vrij belegd vermogen (box 3) |
| `e896e4d` | A1: één functie voor de inkomensverdeling, twee inline kopieën weg |
| `c2f79e5` | E9: `requiredCapital` rekent met dezelfde eind-jaar-conventie als de simulatie |
| `c01b549` | E6: slagingskans kijkt of het kapitaal ooit negatief werd |
| `962aff3` | E7: Monte Carlo past eenmalige bedragen ná de pensioendatum nu wel toe |
| `5fc543b` | E8: lognormale rendementstrekking |
| `97882b8` | Documentatie |

De commit messages bevatten per punt de narekening en de motivatie, uitvoeriger dan dit overzicht.

## Wat bezoekers hierdoor anders zien

- **E8, de grootste zichtbare verandering.** De Monte Carlo trok rond het rekenkundige gemiddelde en
  compoundde dat, waardoor de mediaan van de simulatie 34% onder de deterministische lijn in
  dezelfde grafiek lag. Nu ligt hij erop. **Slagingskansen stijgen daardoor** (golden scenario:
  5,05% → 8,80%). Dat is de juiste richting, maar het is een zichtbare verandering. De merge-commit
  op `astro-migratie` is het terugdraaipunt als je er anders over gaat denken.
- **E9.** "Benodigd eindvermogen" en "Benodigde maandinleg" dalen met factor 1/√r_post, circa 0,5 tot
  1%. Live: € 598.163 → € 593.834 en € 676 → € 668. Een pot ter grootte van het getoonde doelbedrag
  loopt nu precies leeg in de simulatie (restant 0); voorheen bleef er een positief restant over.
- **E7.** Een eenmalig bedrag ná de pensioendatum verlaagt nu ook de slagingskans en de bandbreedte,
  niet alleen de deterministische lijn.
- **E1-A.** Disclosure op drie plekken: onder het veld "Huidig vermogen", in de aannameregel onder
  het resultaat, en in het artikel `welke-aannames-gebruikt-de-fo-planner.md` (FAQ-item plus alinea).
- **E6 en A1.** Geen zichtbaar effect. Bij A1 was dat de zuiverheidstoets (alle fixtures
  ongewijzigd); bij E6 is het gemeten en genoteerd, zie hieronder.

## Drie dingen die je moet weten

**1. Het vorige hand-off-document had bij E9 een fout.** Daar stond "verwijder de `+ 0.5`". Dat
levert exponent `yr` op, een begin-jaar-annuïteit, en wijkt een half jaar de ándere kant op. Correct
is `yr + 1`. Narekening met het voorbeeld uit `AUDIT-fase0-1-feiten.md` (25 jaar, 2% reëel,
€12.000/jaar):

```
oud (yr + 0.5)     € 236.612,7
nieuw (yr + 1)     € 234.281,5   = gesloten formule W × (1 − 1,02^−25) / 0,02
yr (begin-jaar)    € 238.967,1   <- wat het hand-off-document voorstelde
```

**2. E6 verandert geen enkel getoond percentage, en dat is gemeten, niet aangenomen.** Oud en nieuw
criterium op exact dezelfde seeded paden: nul verschil bij vermogens van €400k tot €2 mln en
volatiliteiten tot 25%. Pas bij een onrealistische 40% volatiliteit na pensionering kantelen 2 van
de 2.000 paden. Na E8 kan het helemaal niet meer voorkomen. De KPI meet nu wat zijn label belooft;
de getoonde percentages veranderen er niet door. Ik noem dit expliciet zodat het niet als "opgelost"
in de boeken komt terwijl er niets bewoog.

**3. Twee besluiten die onderweg zijn genomen.**
- *A1, het klem-gedrag blijft lokaal.* `actualFromCapital = capital > 0 ? fromCapital : 0` raakt
  alleen de weergegeven `incomeFromCapital`/`totalIncome` en gaat niet de gedeelde functie in. De
  kapitaalmutatie gebruikt bewust de ónbeperkte waarde, anders gaat het gemeten tekort stilzwijgend
  iets anders betekenen.
- *E8, lognormaal trekken (optie a).* Gekozen boven optie b (½σ² bij het gemiddelde optellen), omdat
  de mediaan dan exact klopt in plaats van benaderd, en omdat het trekkingen onder −100% rendement
  onmogelijk maakt. Dat laatste was precies het mechanisme achter E6.

---

# Deel 2 — de werklijst voor daarna

Vier blokken, in de volgorde waarin ik ze zou oppakken. Volledige onderbouwing per punt staat in
`AUDIT-2026-08-bevindingen.md` (scan-tabel en detailkaarten) en `AUDIT-fase3-livetests.md`.

## Blok 1 — bevestigde bugs, geen besluit nodig, gewoon fixen

Dit blok kan meteen. Er valt niets te kiezen, het is fout en het is live gereproduceerd.

### A3 — begin hier. Hoogste risico van wat er nog open staat.
`Math.abs()` verbergt een negatief eindvermogen, waardoor de getoonde trend omdraait. Live gemeten:
bij een tegenvaller van −€200k toont de tool € 35.381 (correct); bij −€300k toont hij **€ 147.630**,
dus hóger, terwijl de werkelijke uitkomst daalt naar **−€ 147.630**. Een bezoeker leest hieruit dat
een grótere tegenvaller gunstiger is voor zijn eindvermogen. Dat is het omgekeerde van de waarheid,
en het is het soort fout dat je niet wilt uitleggen als er ooit naar gevraagd wordt.

**Aanpak:** één tekenbewuste `eur()`-helper in plaats van de huidige onvoorwaardelijke `Math.abs()`,
en meteen de resterende `eur()`-aanroepen meenemen (zie `AUDIT-fase0-1-feiten.md`, "A3 uitgebreid").
Neemt **E10** mee (benodigde inleg kan negatief uitkomen). De golden-master-tests staan klaar als
vangnet.

### A5 — extreme invoer wordt niet geclampt
Live gereproduceerd: een absurd rendement levert een eindvermogen van 6,6 biljoen euro op, zonder
enige waarschuwing. **Aanpak:** grenzen op rendement en volatiliteit, of een zichtbare melding.

### A22 — jaarveld bij eenmalige bedragen heeft geen bovengrens
Een bedrag in een jaar buiten de looptijd wordt stil genegeerd. De gebruiker denkt dat het meetelt.
**Aanpak:** grens op het jaarveld, of een zichtbare melding dat het bedrag buiten de looptijd valt.

### A8/A9 — stille terugval op 2026-cijfers
Bij een jaar waarvoor geen parameters bestaan valt de tool stil terug op 2026 in plaats van te
melden dat het jaar ontbreekt. **Mijn aanbeveling:** falen met een duidelijke melding. In het
Wft-domein is een zichtbare fout beter dan een onzichtbaar verkeerd cijfer. Dit staat in de
bevindingen als open vraag 7 aan jou, maar ik zie hier eerlijk gezegd maar één verdedigbaar antwoord.

### A19 en A18 — klein
- **A19**: `currentIncome` wordt ingevuld maar nergens in de berekening gebruikt, alleen in de
  Excel-export. Kiezen: veld weghalen, of labelen als "alleen voor je eigen dossier".
- **A18**: focus springt bij het verwijderen van een middelste rij. De data blijft correct. Een
  stabiel `id` toevoegen is een kleine, veilige verbetering.

## Blok 2 — de her-ijkingssessie: keuzes die jij moet maken

Deze hangen aan elkaar. **E4 is de motor, doe die eerst**, de rest leunt erop.

### E4 — eerst. Geen besluit nodig, wel het meeste werk.
`brutoToNetto()` in `pensionCalc.ts` kent geen heffingskortingen, waardoor de FO-planner en de
Bruto-netto-tool elkaar tegenspreken. Live gemeten op € 30.000 bruto: Bruto-netto-tool € 2.313
netto/maand, FO-planner € 1.606. **Verschil € 707 per maand.** Dit is de enige hoge bevinding die de
gebruiker te *somber* stemt in plaats van te optimistisch.

**Aanpak:** één functie die het totale bruto box 1-inkomen belast, inclusief heffingskortingen, met
AOW, werkgeverspensioen en straks lijfrente als stapelende bronnen. Inclusief de
POST_AOW-tegenhanger in `fiscaleParameters.ts`.

### E1-optie-B — jouw eigen voorstel: veld "waarvan fiscaal beklemd"
Uitgesteld tot ná E4, om drie redenen:

1. **Het hangt vast aan E4.** `brutoToNetto`/`nettoToBruto` rekenen vanaf schijf 1, terwijl een
   lijfrente-uitkering marginaal bovenop AOW en werkgeverspensioen belast wordt. Bruteren met de
   huidige motor levert een nieuwe, subtielere rekenfout op: minder zichtbaar dan de fout die je
   ermee repareert.
2. **Een lijfrentepot is geen pot waar je vrij uit onttrekt.** Bij expiratie moet het kapitaal worden
   omgezet in periodieke uitkeringen (art. 3.125 Wet IB 2001). Modelleer je het als vermogen waar de
   tool naar behoefte uit put, dan modelleer je iets wat wettelijk niet mag.
3. **Aanbevolen ontwerp:** invoerveld onder vermogen (dat is wat de gebruiker op zijn overzicht
   ziet), maar intern omgezet naar een bruto periodieke uitkering vanaf de pensioendatum en
   behandeld als derde inkomensbron naast AOW en werkgeverspensioen. Het bedrag moet dan uit
   `currentCapital` gehaald worden vóór de vrije-onttrekkingslogica én vóór de Monte Carlo, anders
   telt het dubbel. `nettoToBruto` (nu dode code, bevinding A20) wordt daarmee alsnog nuttig.

**Zoek eerst op, vóór de bouw:** het maximum jaarbedrag voor een tijdelijke oudedagslijfrente in
2026 en de minimumlooptijd. Hoort met bron in `FISCALE-BRONNEN.md`. Niet uit het hoofd invullen.

### E2 — box 3 modelleren, ja of nee?
Nu volledig afwezig. Voor jouw doelgroep (groot vrij belegd vermogen) is dit de grootste ontbrekende
kostenpost, groter dan het verschil tussen twee risicoprofielen. **Mijn aanbeveling:** modelleren,
maar simpel gehouden (forfait en tarief uit `fiscaleParameters.ts`, geen vermogensmix-verfijning).
De huidige FAQ zegt dat box 3 bewust wordt weggelaten omdat het de uitkomst minder betrouwbaar zou
maken. Dat argument houdt geen stand als de weglating zelf de grootste afwijking veroorzaakt.

### E3 — kostenveld, of alleen microcopy?
Het ingevulde rendement wordt nu behandeld als wat de gebruiker netto overhoudt. 0,5% kosten per
jaar over 30 jaar scheelt circa 14% eindvermogen (1,005³⁰ = 1,161). **Mijn aanbeveling:** een
kostenveld met een realistische default. Microcopy die om "rendement ná kosten" vraagt is goedkoper,
maar verschuift het rekenwerk naar de gebruiker en die doet het niet.

### E5 — indexatieveld per bron, of alleen FAQ?
Het model houdt AOW en werkgeverspensioen constant in reële euro's en neemt dus aan dat beide exact
met de inflatie meestijgen. Voor AOW verdedigbaar, voor aanvullend pensioen niet: indexatie is
voorwaardelijk. 1%-punt achterstand per jaar over 30 jaar geeft een 26% lagere reële uitkering dan
het model toont. **Mijn aanbeveling:** een indexatieveld voor het aanvullend pensioen, AOW laten
zoals het is. Een FAQ-vermelding alleen dekt een afwijking van deze omvang niet af.

### De inlegconventie in `simulateAccumulation`
`monthlyPMT * 12` wordt pas ná de jaarlijkse rendementsfactor bijgeschreven, terwijl de inleg
maandelijks is: geen rendement over de eigen inleg in het jaar zelf. Bewust laten liggen bij E9,
omdat `monteCarlo.ts` het identiek doet en de twee dus onderling consistent blijven. Los het op in
deze sessie, in beide bestanden tegelijk.

## Blok 3 — wacht op externe bronverificatie (jouw eigen beoordeling)

Het auditplan schrijft voor dat jij elke externe bron zelf controleert. Deze punten staan daarop
geblokkeerd.

- **F1 en A7, hoog risico.** De fiscale parameters van de site wijken af van die in je eigen
  jaarruimte-skill, en op de jaarruimtepagina staan voor jaar 2020 twee tegenstrijdige formules op
  één scherm ("13,3% − 7,44" tweemaal, "30% − 6,27" eenmaal), terwijl het getoonde resultaat
  (€ 2.046 bij factor A € 1.000) geen van beide teksten volgt als je ze letterlijk narekent. Twee
  keer fout, niet één keer. **Welke kant gecorrigeerd moet worden, de tekst of de onderliggende
  jaardata, is pas te zeggen na jouw beoordeling van de 🟡-bronnen** in `FISCALE-BRONNEN.md` §5.
- **De jaarruimte-configfixes** uit `FISCALE-BRONNEN.md` §5, zelfde blokkade.
- **B2, B4, B5** — tijdsgebonden claims in de content (spaarrente, CBS-cijfers, het
  30%-jaarruimtepercentage, AOW/Trinity/Cagan/DNB). Laag tot midden risico.
- **F2** — nu één bronvermelding voor alle cijfers, geen bron per waarde. Procesverbetering:
  `FISCALE-BRONNEN.md` is daar het begin van, maar de koppeling per waarde ontbreekt nog.

## Blok 4 — content en proces, geen haast

- **B7** — consistentiecheck tussen de cijfers in de artikelen en de cijfers die de tools tonen. Niet
  onderzocht.
- **J2** — welke aannames zouden in de FAQ moeten staan. Deels ingelost met de E1-A-toevoeging, niet
  systematisch nagelopen.
- **A21** — de Bruto-netto-berekening is niet testbaar zonder de rekenlogica naar een eigen module te
  extraheren. Doe dit als je toch aan E4 werkt, dan is het bijna gratis.
- **A6** — Box-Muller zonder epsilon-guard. Kans verwaarloosbaar, bewust niet gefixt.

---

## Werkwijze die zich bewees

- Elke rekenwijziging onafhankelijk narekenen vóór het bijwerken van een golden-fixture, niet
  andersom. Bij E9 haalde dat een fout in het vorige hand-off-document boven water; bij E6 liet het
  zien dat de fix geen numeriek effect heeft. Beide waren onzichtbaar geweest als de fixtures
  klakkeloos waren geregenereerd.
- Elke wijziging eerst voorleggen, dan pas toepassen.
- Vóór elke commit: `npm run build`, `npm run test`, `npm run check`.
- Live controleren in de browser via de preview-tools, niet via Bash.
- Werken op een eigen branch, met een merge-commit (`--no-ff`) naar `astro-migratie`, zodat er één
  terugdraaipunt is voor het geheel.
