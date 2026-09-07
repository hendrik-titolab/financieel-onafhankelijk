---
titel: "Welke aannames gebruikt de FO-planner?"
beschrijving: "De FO-planner rekent met een reëel rendement, een fasegevoelige belasting en 2.000 Monte Carlo-simulaties. Uitleg van elke aanname, met rekenvoorbeeld."
samenvatting: "De planner geeft geen vast antwoord maar een slagingskans, berekend over 2.000 simulaties met wisselend rendement. Alle bedragen staan in koopkracht van vandaag: het nominale rendement wordt eerst gecorrigeerd voor inflatie. Belasting wordt berekend over je AOW en pensioen samen, met de tarieven, heffingskortingen en de bijdrage Zorgverzekeringswet die bij je leeftijd en woonsituatie horen. Elke aanname is aan te passen; niets ligt vast."
pillar: "wat-is-financiele-onafhankelijkheid"
volgorde: 6
bijgewerkt: "2026-08-22"
tool:
  label: "Bekijk je eigen uitkomst in de planner"
  href: "/ben-ik-financieel-onafhankelijk"
faq:
  - vraag: "Waarom geeft de planner geen vast eindbedrag?"
    antwoord: "Omdat niemand het toekomstige rendement kent. Eén vast getal zou net zo goed verzonnen kunnen zijn. Een slagingskans over 2.000 scenario's laat zien hoe gevoelig je plan is voor tegenvallende jaren, in plaats van te doen alsof de uitkomst vaststaat."
  - vraag: "Wat als ik geen zin heb om zelf rendement en volatiliteit in te vullen?"
    antwoord: "Dan gebruik je een van de vijf standaard risicoprofielen (van defensief tot offensief). Die zijn vooraf ingevuld met een redelijk rendement en bijbehorende schommeling. Zelf invullen kan altijd via het vinkje bij risicoprofiel."
  - vraag: "Rekent de planner ook met box 3 (vermogensbelasting)?"
    antwoord: "Als je dat invult wel. Bij het risicoprofiel staat een veld voor vermogensbelasting in procentpunten, dat van je rendement af gaat. De planner rekent voor wat de heffing bij jouw vermogen ongeveer is, op basis van de forfaitaire percentages en het heffingsvrije vermogen van 2026, en je kunt die schatting met één klik overnemen. Laat je het veld op 0 staan, dan rekent de planner zonder vermogensbelasting en valt de uitkomst gunstiger uit dan in werkelijkheid. Het is een vereenvoudiging: de heffing wordt niet elk jaar opnieuw over je actuele vermogen berekend, en de verdeling tussen spaargeld en beleggingen telt niet mee."
  - vraag: "Klopt de uitkomst ook als mijn geld in een lijfrente of op een bankspaarrekening staat?"
    antwoord: "Deels automatisch. Je eigen vermogen blijft de planner behandelen als vrij belegd vermogen in box 3, vul daar dus alleen dat deel in. Voor een lijfrente-, bankspaar- of pensioenbeleggingsuitkering is er een apart veld: die uitkering is belast in box 1 en kan niet vrij worden opgenomen. Vul daar de verwáchte bruto-uitkering in, niet het opgebouwde bedrag. Die vind je op de prognose van je aanbieder."
bronnen:
  - titel: "Belastingdienst: tarieven box 1"
    url: "https://www.belastingdienst.nl/wps/wcm/connect/nl/werk-en-inkomen/content/hoeveel-inkomstenbelasting-betalen"
  - titel: "Monte Carlo-methode (Wikipedia)"
    url: "https://nl.wikipedia.org/wiki/Monte_Carlo-methode"
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

Bij 7% nominaal rendement en 3% inflatie is dat (1,07 / 1,03) − 1 ≈ 3,9%. Met dat
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
voer je in als life events. Die tellen mee in het jaar waarin ze vallen, vóórdat het
rendement van dat jaar wordt bijgeschreven.

## Welke aannames staan al klaar, en welke stel jij zelf in?

Vijf risicoprofielen (van defensief tot offensief) hebben een vooraf ingevuld rendement
en bijbehorende schommeling. Wil je zelf de knoppen vasthouden, dan vul je rendement en
volatiliteit rechtstreeks in via het vinkje bij risicoprofiel.

Zelf in te stellen staan verder: je leeftijd, pensioenleeftijd en levensverwachting, je
huidige vermogen en inleg, je gewenste inkomen, de inflatieverwachting, en de hoogte en
ingangsdatum van AOW en werkgeverspensioen. Niets ligt vast. Verander een aanname, en de
bedragen rekenen meteen opnieuw. Voor de slagingskans klik je op Bereken: die komt uit 2.000
scenario's en draait daarom niet bij elke toetsaanslag mee.

## Wat de planner bewust niet doet

Het rendement dat bij een risicoprofiel hoort is een brutorendement: dat is het verwachte
rendement van de portefeuille zelf, vóór kosten en vóór belasting. Wat daarvan af gaat, vul je
apart in bij kosten van beleggen en bij vermogensbelasting. Laat je die twee op 0 staan, dan
rekent de planner alsof beleggen gratis is en er geen belasting over je vermogen wordt geheven.
De uitkomst valt dan gunstiger uit dan in werkelijkheid.

Voor de vermogensbelasting rekent de planner voor wat de heffing bij jouw vermogen ongeveer is,
op basis van de forfaitaire percentages en het heffingsvrije vermogen die de Belastingdienst voor
2026 publiceert. Dat is een schatting en geen aanslag: de planner berekent de heffing niet elk
jaar opnieuw over je actuele vermogen, en houdt geen rekening met de verdeling tussen spaargeld
en beleggingen of met schulden. De druk loopt bovendien op naarmate je vermogen groeit, doordat
het heffingsvrije deel een steeds kleiner aandeel wordt. Bij een ton is het ongeveer 0,9% van je
vermogen per jaar, bij een miljoen ruim 2%.

Specifieke beleggingsproducten kent de planner niet. Je vult één rendement en één
kostenpercentage in voor je hele vermogen.

De planner gaat er ook van uit dat je eigen vermogen vrij belegd is, in box 3: vul daar dus
alleen dat deel in. Heb je daarnaast een lijfrente, banksparen of pensioenbeleggen, dan is
daar een apart veld voor: die uitkering is belast in box 1 en kan niet vrij worden opgenomen,
dus hoort niet bij je vrije vermogen.

Verander één aanname en klik opnieuw op Bereken, dan zie je hoe de slagingskans meebeweegt. Die
kans komt uit 2.000 doorgerekende scenario's en verschijnt dus niet vanzelf terwijl je typt: je
vorige uitkomst blijft staan met de melding dat hij verouderd is. Dat is het hele punt van de
tool: niet één vast antwoord, maar zicht op wat je uitkomst kwetsbaar maakt.
