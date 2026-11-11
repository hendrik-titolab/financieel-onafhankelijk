# Bevindingen deel 2: tools en artikelen

Review van 10 november 2026, op commit `5b18774` (branch `astro-migratie`). Onderdeel van de
review van benikfinancieelonafhankelijk.nl, adviesvooriedereen.nl en hendrikschakel.nl. De
rekenkern zelf staat in deel 1 (`rekenkern`, pull request 1).

Dit bestand wijzigt geen code. Elk ticket is zo geschreven dat een agent het los kan oppakken.
Vink af wat klaar is, en verwijder dit bestand als alles is verwerkt.

## Oordeel in het kort

Dit is de best geborgde van de drie sites: een harde releasepoort, beveiligingsheaders, geen
bestanden van derden, en rekenvoorbeelden in artikelen die deels door tests worden bewaakt. Ik
heb de audits van augustus en september niet overgedaan.

Wat ik vond, zit vooral in de artikelen. Bijna alle rekenvoorbeelden kloppen tot op de euro. Vier
kloppen niet of zijn niet na te rekenen, en op één plek zegt de tekst meer dan je kunt waarmaken.
In de tools vond ik één fout die een bezoeker kan raken: een leeggemaakt veld in de box 3-tool.

## Wat ik heb gecontroleerd, en wat niet

Gecontroleerd:

- Alle vijftien artikelen in `src/content/uitleg`, regel voor regel. Elk rekenvoorbeeld
  nagerekend, waar nodig met de rekenkern zelf.
- De standaardwaarden van de planner, het gedeelde invoerveld `NumberInput`, en de invoer van de
  box 3-tool.
- `npx tsc --noEmit` (schoon na `astro sync`), `npx vitest run`, `npm audit --omit=dev`.

Niet gecontroleerd:

- **De PDF- en Excel-export.** Die heb ik niet gegenereerd of gelezen.
- De componenten van jaarruimte, bruto-netto, inflatie en rente-op-rente, behalve hun invoerveld.
- De live site en de build.
- Feiten van na juni 2026 ken ik niet uit mezelf. Dat raakt de passage over Prinsjesdag 2026 in
  het box 3-artikel, de spaarrentes van "zomer 2026" en de inflatie van "de eerste helft van
  2026". Die heb ik niet kunnen toetsen.

Nagerekend en in orde, zodat niemand het opnieuw hoeft te doen:

- De tabel met spaarquotes (alle twaalf cellen), en de zinnen eronder.
- De tabel € 100.000 spaargeld bij 1,25% (alle zestien cellen), en het voorbeeld met € 50.000.
- Het box 3-voorbeeld met € 300.000 (€ 3.834) en de spaarder met € 100.000 (€ 187, € 520).
- De opnameperiodes (€ 446.000, € 588.000, € 693.000) en de rendementstabel met € 100.000.
- Alle bedragen bij de scenario's in het aannamenartikel (€ 220.000, € 137.000, € 173.000, € 554,
  € 456, € 55.000).
- De tabel met hyperinflatie, op de punten hieronder na.

---

## A. Fouten in artikelen

### A1. Het pensioenvoorbeeld in het aannamenartikel loopt achter

- **Waar:** `welke-aannames-gebruikt-de-fo-planner.md`, de alinea "Een voorbeeld met de cijfers
  van 2026".
- **Wat er staat:** alleenstaand, volledige AOW, € 2.500 bruto pensioen per maand. Daarvan blijft
  "ongeveer € 1.712 netto" over, tegen "ruim € 2.050" als je alleen naar de eerste schijf kijkt.
  Het verschil is "ruim € 300".
- **Wat de rekenkern geeft:** € 1.697,64 zonder vakantiegeld over de AOW, en € 1.639,20 met
  vakantiegeld. De planner staat standaard op mét vakantiegeld.
- **Vermoedelijke oorzaak:** het voorbeeld is gemaakt met de AOW van januari 2026. De config
  rekent sinds 28 september met de bedragen van juli.
- **Tweede punt:** de € 2.050 is 2.500 maal (1 min 17,85%). Daar zit de Zvw-bijdrage niet in, in
  de € 1.712 wel. Het verschil is dus niet "precies wat de afbouw van de kortingen en de tweede
  schijf samen doen": ongeveer € 121 ervan is Zvw.
- **Oplossing:** de bedragen opnieuw uitrekenen, kiezen voor met of zonder vakantiegeld en dat
  erbij zeggen, en de Zvw benoemen of aan beide kanten meenemen.
- **Klaar als:** het voorbeeld in een test staat, zoals de box 3-voorbeelden en de
  rendementstabel al zijn vastgelegd. Dan loopt het niet opnieuw achter.

### A2. "Minder dan drie weken" klopt niet bij 50% per maand

- [x] **Afgerond (10 november 2026):** de zin onder "hyperinflatie" zegt nu "in ruim zeven weken". De FAQ-tekst in dezelfde pagina (regel 17, "in minder dan drie weken verdubbelen") is niet aangepast, omdat het ticket die regel niet noemt. Hendrik beslist.

- **Waar:** `hoe-hoog-kan-inflatie-worden.md`, onder "hyperinflatie".
- **Wat er staat:** "Boven een maandelijkse inflatie van 50% [...] Bij dat tempo verdubbelen
  prijzen in minder dan drie weken."
- **Wat klopt:** bij 50% per maand duurt een verdubbeling ln 2 gedeeld door ln 1,5, dat is 1,71
  maand, ruim zeven weken. Je eigen tabel laat het zien: Argentinië zat op 197% per maand en
  verdubbelde in 19,4 dagen.
- **Oplossing:** "in ruim zeven weken".

### A3. Argentinië rekende in 1989 niet in peso's

- **Waar:** hetzelfde artikel, "een product dat aan het begin van de maand 100 peso kostte".
- **Wat:** de munt was toen de austral. De peso kwam pas daarna terug.
- **Zekerheid:** vrij zeker, niet nagezocht. Controleer het en schrijf anders "100 australes" of
  laat de munt weg.

### A4. Het voorbeeld van het volgorde-risico is niet na te rekenen

- **Waar:** `wanneer-ben-je-financieel-onafhankelijk.mdx`, factor "Volgorde-risico".
- **Wat er staat:** € 500.000, € 30.000 opname per jaar, gemiddeld 4%, na vijf jaar € 448.000 of
  € 387.000 naargelang de volgorde.
- **Wat:** de reeks rendementen staat er niet bij en er is geen test die deze bedragen vastlegt.
  Ik heb acht plausibele reeksen geprobeerd met opname aan het begin en aan het eind van het
  jaar. Geen daarvan geeft beide bedragen.
- **Oplossing:** de vijf rendementen noemen en het voorbeeld in een test zetten.
- **Klaar als:** een lezer met de tekst en een rekenmachine op dezelfde bedragen komt.

### A5. Jaarruimte kijkt naar vorig jaar, niet naar dit jaar

- **Waar:** `wat-is-jaarruimte.md`, "Daar gaat af wat je dit jaar al aan pensioen opbouwt".
- **Wat:** de jaarruimte van een jaar rekent met het inkomen en de pensioenopbouw van het jaar
  ervoor. De tool doet dat goed en zegt het ook. Het artikel zegt "dit jaar".
- **Oplossing:** "vorig jaar", met één zin waarom: de cijfers van dit jaar zijn nog niet bekend.

### A6. "Aftrekken van de belasting" moet "van je inkomen" zijn

- **Waar:** `wat-is-een-pensioentekort.md`, "en die inleg aftrekken van de belasting".
- **Wat:** een lijfrentepremie verlaagt je inkomen, niet je belasting. Het verschil is groot: wie
  € 5.000 inlegt, krijgt niet € 5.000 terug. Het jaarruimte-artikel zegt het wel goed.

### A7. Kleine onnauwkeurigheden

- `hoe-hoog-kan-inflatie-worden.md`: "Het eerste was 1975, het jaar van de oliecrisis". De
  oliecrisis begon in 1973. En "maar twee jaren" die ver boven een paar procent uitkwamen: de
  jaren rond 1975 zaten daar dicht tegenaan. Uit mijn hoofd, controleer bij het CBS.
- `wanneer-ben-je-financieel-onafhankelijk.mdx`: "bij 2% nog geen kwart daarvan". Het is een
  tiende (€ 220.804 tegen € 2.172.452). Waar, maar je doet je eigen punt tekort.
- `hoeveel-belasting-betaal-ik-over-mijn-vermogen.md`: de vaststelling van de percentages voor
  2025 en de stemming in de Tweede Kamer staan allebei op 12 februari 2026. Dat kan kloppen. Het
  is wel het soort toeval dat ik één keer zou nakijken.

---

## B. Waar de tekst meer zegt dan je kunt waarmaken

### B1. "Met zekerheid" en "Gegarandeerd" in het spaarartikel

- **Waar:** `sparen-maakt-mensen-arm.md`. "dat je door te sparen over een aantal jaar met
  *zekerheid* diezelfde 10% verliest", "Per jaar. Gegarandeerd.", "Met zekerheid, alleen langzaam
  genoeg om het niet te voelen."
- **Wat:** het verlies is zeker zolang de rente onder de inflatie ligt. Dat is een voorwaarde,
  geen natuurwet. Er zijn jaren geweest waarin de spaarrente boven de inflatie lag.
- **Waarom het telt:** het artikel stuurt de lezer van sparen naar beleggen. Dat mag, je hedget
  het beleggingsdeel ook netjes. Maar stellige woorden aan de ene kant en voorbehouden aan de
  andere kant maken het geheel onevenwichtig. Voor iemand die een vergunning voor vermogensadvies
  aanvraagt, is dit de zin die een toezichthouder aanstreept.
- **Oplossing:** de voorwaarde erbij. Bijvoorbeeld: "Zolang je rente onder de inflatie ligt,
  verlies je elk jaar koopkracht." De kracht van het stuk zit in de tabel, niet in het woord
  "gegarandeerd".

### B2. De inleg stijgt mee met inflatie en nergens staat dat

- **Waar:** het veld Inleg in `PensionPlanner/InputPanel.tsx` (regel 286 tot 292), en
  `welke-aannames-gebruikt-de-fo-planner.md`.
- **Wat:** zie A1 in deel 1. Bij het veld staat geen toelichting. Het artikel zegt dat elk bedrag
  in koopkracht van vandaag staat, maar noemt de inleg niet.
- **Hoe groot:** € 500 per maand, 30 jaar, 6% rendement, 2% inflatie: € 338.584 tegen € 272.299
  bij een inleg die in euro's gelijk blijft.
- **Oplossing, los van de keuze in deel 1:** één zin bij het veld. "We gaan ervan uit dat je
  inleg elk jaar meestijgt met de inflatie."

### B3. AOW-leeftijd 67 zonder toelichting

- **Waar:** het veld "AOW ingangsdatum (leeftijd)" in `InputPanel.tsx` (regel 538), standaard 67.
  En `hoeveel-aow-krijg-ik.md`.
- **Wat:** zie A3 in deel 1. Het artikel zegt terecht dat de leeftijd kan stijgen, maar noemt
  niet dat hij vanaf 2028 al op 67 jaar en 3 maanden staat. Dat staat wel in je eigen bron.
- **Oplossing:** bij het veld een verwijzing naar de SVB, en in het artikel de stap van 2028.

---

## C. Fouten in de tools

### C1. Een leeggemaakt veld in de box 3-tool springt naar min 100 miljoen

- **Waar:** `src/components/Box3/index.tsx`, regel 278, 307 en 315. `NumberInput` in
  `PensionPlanner/InputPanel.tsx`, functie `commit()`.
- **Wat:** een leeg of onleesbaar veld valt terug op de ondergrens. Meestal is die 0. Drie velden
  van het tegenbewijs hebben als ondergrens -100.000.000, omdat een negatief bedrag daar mag.
- **Gevolg:** wie het veld "Werkelijk rendement over het jaar" leegmaakt en doorklikt, ziet er
  -100.000.000 staan. Dat is lager dan het forfait, dus het tegenbewijs "helpt" en de belasting
  wordt € 0. Hetzelfde bij "waarde op 31 december". Bij "waarde op 1 januari" gebeurt het
  omgekeerde.
- **Ernst:** middel. Het getal staat zichtbaar in het veld, dus een oplettende bezoeker ziet het.
  Maar de tool noemt dan wel een belasting van nul.
- **Oplossing:** een aparte terugvalwaarde in `NumberInput` (standaard 0, of de ondergrens als die
  hoger is dan 0), los van `min`.
- **Klaar als:** een leeg veld in alle drie op 0 uitkomt, en de bestaande velden zich gelijk
  gedragen.

### C2. Afhankelijkheden met een melding

- **Wat:** `npm audit --omit=dev` meldt 8 kwetsbaarheden, waarvan 1 kritiek (`dompurify`, via
  `jspdf`) en 5 hoog. Voor zes is er een oplossing zonder breuk. De twee rond `exceljs` en `uuid`
  heb je al bewust laten staan.
- **Let op:** ik ken deze meldingen alleen uit de uitvoer van `npm audit`.
- **Oplossing:** `npm audit fix` in een eigen pull request, daarna beide exports testen.
- **Klaar als:** alleen de bekende melding over `uuid` overblijft.

---

## D. Onderhoud

### D1. Rekenvoorbeelden in artikelen zijn maar deels bewaakt

- **Wat:** de box 3-voorbeelden en de rendementstabel staan in tests. Het pensioenvoorbeeld (A1)
  en het volgorde-risico (A4) niet, en precies die twee kloppen niet of zijn niet na te rekenen.
  `controleer-artikelen.mjs` in de bronnenrepo bewaakt alleen losse parameters, geen afgeleide
  bedragen.
- **Oplossing:** één testbestand "artikelvoorbeelden" in deze repo, met elk rekenvoorbeeld dat uit
  de rekenkern volgt. Elk nieuw voorbeeld krijgt daar een regel.

### D2. De site heeft zelf bijna geen tests meer

- **Wat:** sinds de rekenkern is afgesplitst, staat hier één testbestand (`pdfMcGrafiek.test.ts`,
  3 tests). De componenten, de exports en de koppeling met de kern zijn niet getest. C1 is zo'n
  fout die een eenvoudige test op `NumberInput` had gevangen.
- **Oplossing:** `commit()` uit `NumberInput` halen als pure functie en testen. Daarna de exports
  in Node genereren en op kernbedragen controleren. `CLAUDE.md` zegt dat dat kan.

### D3. Losse eindjes

- `src/components/PensionPlanner/jaarruimte_test.ts` bevat alleen "placeholder, verwijder dit
  bestand".
- `currentIncome` wordt ingevuld en alleen in de Excel gebruikt. Staat al in `CLAUDE.md`.
- `CLAUDE.md` noemt veertien artikelen, het zijn er vijftien.

---

## Volgorde voor de uitvoering

1. A1, A2, A5, A6 en C1: fouten die een lezer of bezoeker nu raken.
2. B1: jouw afweging, maar doe hem vóór de vergunningaanvraag.
3. D1: daarna kunnen A1 en A4 niet meer terugkomen.
4. De rest in één ronde.
