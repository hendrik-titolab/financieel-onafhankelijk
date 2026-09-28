---
titel: "Welke aannames gebruikt de FO-planner?"
beschrijving: "De FO-planner rekent met een reëel rendement, een fasegevoelige belasting en 2.000 Monte Carlo-simulaties. Uitleg van elke aanname, met rekenvoorbeeld."
samenvatting: "De planner geeft geen vast antwoord maar een slagingskans, berekend over 2.000 simulaties met wisselend rendement. Alle bedragen staan in koopkracht van vandaag: het nominale rendement wordt eerst gecorrigeerd voor inflatie. Belasting wordt berekend over je AOW en pensioen samen, met de tarieven, heffingskortingen en de bijdrage Zorgverzekeringswet die bij je leeftijd en woonsituatie horen. Elke aanname is aan te passen; niets ligt vast."
pillar: "wat-is-financiele-onafhankelijkheid"
volgorde: 6
bijgewerkt: "2026-09-28"
tool:
  label: "Bekijk je eigen uitkomst in de planner"
  href: "/ben-ik-financieel-onafhankelijk"
faq:
  - vraag: "Waarom geeft de planner geen vast eindbedrag?"
    antwoord: "Omdat niemand het toekomstige rendement kent. Eén vast getal zou net zo goed verzonnen kunnen zijn. Een slagingskans over 2.000 simulaties laat zien hoe gevoelig je plan is voor tegenvallende jaren, in plaats van te doen alsof de uitkomst vaststaat."
  - vraag: "Wat als ik geen zin heb om zelf rendement en volatiliteit in te vullen?"
    antwoord: "Dan gebruik je een van de vijf standaard risicoprofielen (van defensief tot offensief). Die zijn vooraf ingevuld met een verwacht rendement en een bijbehorende schommeling, onderbouwd met historische aandelenrendementen en de huidige rente op staatsleningen. Zelf invullen kan altijd via het vinkje bij risicoprofiel."
  - vraag: "Kan ik testen wat er gebeurt als de AOW lager uitvalt of het rendement tegenvalt?"
    antwoord: "Ja, met de scenario's rechts boven de uitkomst. Je kunt de AOW halveren of weglaten, het rendement 2 procentpunt lager of hoger zetten, de inflatie 1 procentpunt lager of hoger, vijf jaar langer plannen en de indexatie van je pensioen uitzetten. Scenario's zijn te combineren. De planner zet de uitkomst met en zonder scenario naast elkaar."
  - vraag: "Rekent de planner ook met box 3 (vermogensbelasting)?"
    antwoord: "Ja, standaard. De planner berekent de heffing elk jaar opnieuw over het vermogen van dat jaar, met het tarief, het forfait voor beleggingen en het heffingsvrije vermogen van 2026, en haalt dat bedrag van je saldo af. Wil je liever zelf een vast percentage invullen, dan kan dat via de keuze bij vermogensbelasting. Twee vereenvoudigingen: je hele vermogen telt als beleggingen (wie vooral spaart betaalt minder), en schulden tellen niet mee."
  - vraag: "Klopt de uitkomst ook als mijn geld in een lijfrente of op een bankspaarrekening staat?"
    antwoord: "Deels automatisch. Je eigen vermogen blijft de planner behandelen als vrij belegd vermogen in box 3, vul daar dus alleen dat deel in. Voor een lijfrente-, bankspaar- of pensioenbeleggingsuitkering is er een apart veld: die uitkering is belast in box 1 en kan niet vrij worden opgenomen. Vul daar de verwáchte bruto-uitkering in, niet het opgebouwde bedrag. Die vind je op de prognose van je aanbieder."
bronnen:
  - titel: "Belastingdienst: tarieven box 1"
    url: "https://www.belastingdienst.nl/wps/wcm/connect/nl/werk-en-inkomen/content/hoeveel-inkomstenbelasting-betalen"
  - titel: "Monte Carlo-methode (Wikipedia)"
    url: "https://nl.wikipedia.org/wiki/Monte_Carlo-methode"
  - titel: "Deutsches Aktieninstitut: rendementsdriehoek MSCI World, stand 31 december 2025"
    url: "https://www.dai.de/fileadmin/user_upload/251231_MSCI_World-Rendite-Dreick_50_Jahre_Sparplan_Web.pdf"
  - titel: "Europese Centrale Bank: rentecurves eurozone"
    url: "https://www.ecb.europa.eu/stats/financial_markets_and_interest_rates/euro_area_yield_curves/html/index.en.html"
  - titel: "Advies Commissie Parameters, 29 november 2022"
    url: "https://www.eerstekamer.nl/overig/20221130/advies_commissie_parameters_29/document3/f=/vlyih0jdg2xv_opgemaakt.pdf"
---

Vul je gegevens in, klik op Bereken, en je verwacht een getal. Dat is niet wat je krijgt.
Je krijgt een percentage: de kans dat je plan standhoudt. Dat is geen slordigheid van de
tool. Het is eerlijker dan doen alsof de toekomst vaststaat.

## Waarom een kans in plaats van een vast antwoord?

Niemand weet welk rendement de komende dertig jaar oplevert. Een planner die daar één
vast getal over doet, verzint net zo veel als hij berekent. Deze planner rekent daarom
2.000 keer door, elke keer met een ander rendement per jaar, willekeurig getrokken rond
het gemiddelde dat je hebt opgegeven. In sommige van die 2.000 versies vallen de eerste
jaren tegen, in andere vallen ze mee.

De slagingskans is het percentage van die 2.000 versies waarin je aan het einde niet door
je vermogen heen bent. Bij 100% slagingskans hield je vermogen in alle 2.000 versies stand.
Bij 75% is dat bij driekwart het geval. Zo zie je niet alleen óf je plan werkt, maar ook
hoe kwetsbaar het is voor een paar slechte jaren.

## In welke euro's reken je eigenlijk?

Elk bedrag in de planner staat in koopkracht van vandaag, niet in de euro's die je over
dertig jaar daadwerkelijk op je rekening ziet staan. Vul je nu €4.000 gewenst maandinkomen
in, dan blijft dat door de hele berekening heen €4.000 aan koopkracht van nu, ook al is het
bedrag op je rekening in 2056 door inflatie hoger.

Dat werkt via het reële rendement: het rendement na aftrek van inflatie.

```
reëel rendement = (1 + nominaal rendement) / (1 + inflatie) − 1
```

Bij het neutrale profiel, 6,3% nominaal vóór je pensioen, en 3% inflatie is dat
(1,063 / 1,03) − 1 ≈ 3,2%. Met dat
gecorrigeerde percentage rekent de planner verder. Het voordeel: je hoeft zelf niet te
turnen op wat 4.000 euro over dertig jaar nog waard is. Dat zit al in de berekening.

## Hoe wordt bruto pensioen netto?

Voor het werkgeverspensioen vul je in de planner een bruto bedrag in. Dat wordt netto
gemaakt met de belastingschijven van box 1, de heffingskortingen die bij je situatie
horen, en de bijdrage Zorgverzekeringswet die van je pensioen wordt ingehouden.

Belangrijk daarbij: de planner belast je AOW en je pensioen samen, niet elk apart.
Dat moet ook, want de heffingskortingen hangen af van je totale inkomen. Hoe hoger dat
inkomen, hoe kleiner de korting. Bereken je de korting per inkomensbron los, dan tel je
hem twee keer half mee en komt er te veel netto uit.

Dat heeft een gevolg dat de meeste mensen verrast. Na je AOW-leeftijd is het tarief in
de eerste schijf lager, omdat je geen AOW-premie meer betaalt. Maar over een pensioen
bóvenop je AOW betaal je in de praktijk vaak méér dan dat lage tarief doet vermoeden.
Je komt namelijk in de tweede schijf terecht, en tegelijk lopen de algemene
heffingskorting en de ouderenkorting terug naarmate je inkomen stijgt. Over een deel
van je inkomen kan het effectieve tarief daardoor boven de 55% uitkomen.

Een voorbeeld met de cijfers van 2026. Je bent alleenstaand, hebt een volledige AOW en
daarnaast € 2.500 bruto pensioen per maand. Van dat pensioen houd je ongeveer € 1.712
netto per maand over. Zou je alleen naar het tarief van de eerste schijf kijken, dan zou
je op ruim € 2.050 uitkomen. Dat verschil van ruim € 300 per maand is precies wat de
afbouw van de kortingen en de tweede schijf samen doen.

Of je alleenstaand bent of samenwoont maakt hierbij uit, en niet alleen voor de hoogte
van je AOW. Alleenstaanden hebben ook recht op de alleenstaandeouderenkorting. Daarom
vraagt de planner naar je woonsituatie.

De exacte schijfgrenzen, tarieven en kortingen wijzigen elk jaar. De planner gebruikt de
cijfers van het lopende belastingjaar; kijk voor de actuele bedragen op
belastingdienst.nl.

## Wat doet de planner met AOW, een erfenis of een verbouwing?

AOW en werkgeverspensioen kunnen op een ander moment ingaan dan je pensioenleeftijd. In
de jaren dat je daar nog niet uit kunt putten, komt je hele gewenste inkomen uit eigen
vermogen. Zodra AOW of werkgeverspensioen wel loopt, vult je eigen vermogen alleen het
verschil aan.

Eenmalige gebeurtenissen, een erfenis, de verkoop van een huis, een dure verbouwing,
voer je in als eenmalige bedragen. Die tellen mee in het jaar waarin ze vallen, vóórdat het
rendement van dat jaar wordt bijgeschreven. Vul het bedrag in zoals het in dat jaar op je
rekening komt of eraf gaat. De planner rekent het zelf terug naar koopkracht van vandaag:
bij 3% inflatie is € 100.000 over twintig jaar ongeveer € 55.000 van nu.

## Welke aannames staan al klaar, en welke stel jij zelf in?

Vijf risicoprofielen hebben een vooraf ingevuld rendement en een bijbehorende schommeling
(volatiliteit: hoe ver het rendement in een gewoon jaar van het verwachte rendement afwijkt).
Elk profiel is een mix van aandelen en obligaties, dat zijn leningen aan overheden.

| Profiel | Aandelen vóór / ná pensioen | Rendement vóór / ná | Schommeling vóór / ná |
|---|---|---|---|
| Zeer defensief | 10% / 0% | 4,2% / 3,5% | 7,5% / 8,0% |
| Defensief | 30% / 10% | 5,3% / 4,2% | 8,2% / 7,5% |
| Neutraal | 50% / 30% | 6,3% / 5,3% | 10,8% / 8,2% |
| Offensief | 70% / 50% | 7,1% / 6,3% | 14,2% / 10,8% |
| Zeer offensief | 90% / 70% | 7,8% / 7,1% | 18,0% / 14,2% |

Na je pensioendatum schuift elk profiel een stap op naar obligaties. Je haalt dan geld uit je
pot, en een flinke daling vlak na je stoppen kun je minder goed uitzitten.

Dit zijn rendementen vóór inflatie, kosten en belasting; die gaan er in de planner apart af.
Het is het middelste verwachte rendement: in de helft van de simulaties valt het mee, in de
andere helft tegen.

### Waar komen die percentages vandaan?

Uit twee bouwstenen. Aandelen rekenen met 8,0% per jaar. Wie de afgelopen vijftig jaar
maandelijks in wereldwijde aandelen belegde (de MSCI World-index, in euro's, met herbelegd
dividend), haalde over een spaarperiode van 25 jaar gemiddeld 8,0% per jaar, en over 30 jaar
7,9%. Dat berekende het Deutsches Aktieninstitut, stand eind 2025.

Obligaties rekenen met 3,5%. Dat is de rente op tienjarige staatsleningen van eurolanden met
de hoogste kredietwaardigheid, volgens de rentecurve van de Europese Centrale Bank op
21 september 2026: 3,53%.

De schommeling, 20% voor aandelen en 8% voor obligaties, komt uit het advies van de Commissie
Parameters uit 2022. Die commissie adviseert de overheid over de rekenregels voor
pensioenfondsen. De planner gaat ervan uit dat aandelen en obligaties los van elkaar bewegen.

Opvallend: de neutrale mix levert 6,3% op, meer dan het gemiddelde van 8,0% en 3,5% (5,75%).
Omdat aandelen en obligaties niet gelijk op bewegen, schommelt de mix minder dan de twee losse
schommelingen doen vermoeden. En bij hetzelfde gemiddelde jaarrendement groeit een pot die
minder schommelt harder: een verlies van 20% haal je pas terug met 25% winst. Voorwaarde is
dat je de verdeling elk jaar herstelt, en daar gaat de planner van uit. Hetzelfde effect
verklaart waarom zeer defensief ná je pensioen iets meer schommelt dan ervoor: zonder dat
kleine beetje aandelen valt die demping weg.

Wil je zelf de knoppen vasthouden, dan vul je rendement en volatiliteit rechtstreeks in via
het vinkje bij risicoprofiel.

Zelf in te stellen staan verder: je leeftijd, pensioenleeftijd en levensverwachting, je
huidige vermogen en inleg, je gewenste inkomen, de inflatieverwachting, en de hoogte en
ingangsdatum van AOW en werkgeverspensioen. Niets ligt vast. Verander een aanname, en de
bedragen rekenen meteen opnieuw. Voor de slagingskans klik je op Bereken: die komt uit 2.000
simulaties en draait daarom niet bij elke toetsaanslag mee.

## Wat als het anders loopt dan je invult?

Elke aanname hierboven is een verwachting. De vraag is wat er gebeurt als die tegenvalt.
Daarvoor heeft de planner een blok Scenario's, rechts boven de uitkomst. Een scenario is een
stresstest, geen voorspelling: het verandert een aanname, rekent opnieuw en zet de uitkomst
naast die van je eigen invoer. Links blijft je eigen invoer gewoon staan.

Je kunt scenario's combineren, bijvoorbeeld een lager rendement én vijf jaar langer leven. De
vergelijking toont het benodigde vermogen, het verwachte vermogen, het overschot of tekort en,
zodra je op Bereken hebt geklikt, de slagingskans. Staat er een scenario aan, dan zet ook de
PDF- en Excel-export beide uitkomsten naast elkaar.

### AOW: zoals ingevuld, gehalveerd of geen AOW

In de planner stijgt de AOW mee met de inflatie. Hoe hoog hij over twintig jaar is, beslist de
politiek van dan. Kies je Gehalveerd, dan rekent de planner met de helft van het netto
AOW-bedrag dat je hebt ingevuld; bij Geen AOW met nul. Rekent er een partner mee, dan geldt
dat voor jullie allebei. De belasting over je werkgeverspensioen rekent de planner daarna
opnieuw uit, want de heffingskortingen hangen af van je totale inkomen.

### Rendement: 2 procentpunt lager of hoger

Dit verschuift het rendement vóór én ná je pensioendatum. Het neutrale profiel rekent dan met
4,3% of 8,3% in plaats van 6,3%. Twee procentpunt is ongeveer het verschil tussen het
defensieve en het offensieve profiel.

Het klinkt als een klein verschil, maar het stapelt zich op. € 100.000 groeit in 25 jaar bij
het neutrale profiel en 3% inflatie tot ongeveer € 220.000 aan koopkracht van vandaag (zonder
kosten en belasting). Met 2 procentpunt minder rendement wordt dat ongeveer € 137.000.

Dit is iets anders dan de bandbreedte van de simulaties. Die laten goede en slechte jaren
elkaar afwisselen rond je gemiddelde. Dit scenario verschuift het gemiddelde zelf, voor de hele
looptijd. De keuze Hoger laat zien hoeveel je plan op meevallers leunt: werkt het alleen met
2 procentpunt extra, dan is het kwetsbaar.

### Inflatie: 1 procentpunt lager of hoger

Inflatie is in de planner één vast percentage voor de hele looptijd. Met dit scenario zie je
wat een blijvend hogere of lagere inflatie doet. Het rendement blijft gelijk, dus bij hogere
inflatie houd je minder over na inflatie: het neutrale profiel zakt bij 4% inflatie van 3,2%
naar 2,2% per jaar. Dezelfde € 100.000 groeit in 25 jaar dan tot ongeveer € 173.000 in plaats
van € 220.000.

Hogere inflatie raakt je een tweede keer via uitkeringen die niet meestijgen. Een vast
pensioen van € 1.000 per maand is over twintig jaar bij 3% inflatie nog ongeveer € 554 aan
koopkracht van vandaag waard, bij 4% nog € 456. Je gewenste inkomen staat in euro's van
vandaag en groeit dus vanzelf mee.

### Vijf jaar langer leven

De planner rekent dan door tot je ingevulde levensverwachting plus vijf jaar, en je vermogen
moet die jaren ook nog meegaan. Een levensverwachting is een gemiddelde. Veel mensen worden
ouder, en dan moet het geld er nog steeds zijn.

### Geen indexatie

Je werkgeverspensioen en een lijfrente stijgen dan niet mee met de inflatie, je AOW wel. Bij
het invullen kies je per uitkering al of die meestijgt of een vast bedrag is; dit scenario zet
ze allemaal op vast. Stonden ze al op vast, dan verandert er niets. Het effect is hetzelfde als
in het voorbeeld hierboven: een vast bedrag verliest elk jaar koopkracht.

### Wat de scenario's niet doen

Wat er gebeurt als je partner wegvalt, kan de planner nog niet doorrekenen. Daarvoor zijn een
moment van overlijden, een nabestaandenpensioen en een ander inkomensdoel nodig, en die zitten
nog niet in het model.

## Wat de planner bewust niet doet

Het rendement dat bij een risicoprofiel hoort is een brutorendement: dat is het verwachte
rendement van de portefeuille zelf, vóór kosten en vóór belasting. Wat daarvan af gaat, vul je
apart in bij kosten van beleggen en bij vermogensbelasting. Laat je de kosten op 0 staan, dan
rekent de planner alsof beleggen gratis is.
De uitkomst valt dan gunstiger uit dan in werkelijkheid.

De vermogensbelasting in box 3 rekent de planner standaard elk jaar opnieuw uit over het
vermogen van dat jaar, en trekt het bedrag van je saldo af. Daarbij telt je hele vermogen als
beleggingen: wie een groot deel op een spaarrekening heeft, betaalt in werkelijkheid minder.
Schulden en de verdeling tussen spaargeld en beleggingen zitten er niet in. Wil je een eigen
percentage gebruiken, dan kan dat; let dan op dat een vast percentage niet meegroeit met je
vermogen, terwijl de werkelijke druk dat wel doet: bij een ton ongeveer 0,9% per jaar, bij een
miljoen ruim 2%.

Specifieke beleggingsproducten kent de planner niet. Je vult één rendement en één
kostenpercentage in voor je hele vermogen.

De planner gaat er ook van uit dat je eigen vermogen vrij belegd is, in box 3: vul daar dus
alleen dat deel in. Heb je daarnaast een lijfrente, banksparen of pensioenbeleggen, dan is
daar een apart veld voor: die uitkering is belast in box 1 en kan niet vrij worden opgenomen,
dus hoort niet bij je vrije vermogen.

Verander één aanname of zet een scenario aan, klik opnieuw op Bereken, en je ziet hoe de
slagingskans meebeweegt. Die
kans komt uit 2.000 doorgerekende simulaties en verschijnt dus niet vanzelf terwijl je typt: je
vorige uitkomst blijft staan met de melding dat hij verouderd is. Dat is het hele punt van de
tool: niet één vast antwoord, maar zicht op wat je uitkomst kwetsbaar maakt.
