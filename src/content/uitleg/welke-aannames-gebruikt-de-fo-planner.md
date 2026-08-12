---
titel: "Welke aannames gebruikt de FO-planner?"
beschrijving: "De FO-planner rekent met een reëel rendement, een fasegevoelige belasting en 2.000 Monte Carlo-simulaties. Uitleg van elke aanname, met rekenvoorbeeld."
samenvatting: "De planner geeft geen vast antwoord maar een slagingskans, berekend over 2.000 simulaties met wisselend rendement. Alle bedragen staan in koopkracht van vandaag: het nominale rendement wordt eerst gecorrigeerd voor inflatie. Belasting wordt fasegevoelig berekend, met een ander tarief voor en na je AOW-leeftijd. Elke aanname is aan te passen; niets ligt vast."
pillar: "wat-is-financiele-onafhankelijkheid"
volgorde: 6
bijgewerkt: "2026-08-12"
tool:
  label: "Bekijk je eigen uitkomst in de planner"
  href: "/ben-ik-financieel-onafhankelijk"
faq:
  - vraag: "Waarom geeft de planner geen vast eindbedrag?"
    antwoord: "Omdat niemand het toekomstige rendement kent. Eén vast getal zou net zo goed verzonnen kunnen zijn. Een slagingskans over 2.000 scenario's laat zien hoe gevoelig je plan is voor tegenvallende jaren, in plaats van te doen alsof de uitkomst vaststaat."
  - vraag: "Wat als ik geen zin heb om zelf rendement en volatiliteit in te vullen?"
    antwoord: "Dan gebruik je een van de vijf standaard risicoprofielen (van defensief tot offensief). Die zijn vooraf ingevuld met een redelijk rendement en bijbehorende schommeling. Zelf invullen kan altijd via het vinkje bij risicoprofiel."
  - vraag: "Rekent de planner ook met box 3 (vermogensbelasting)?"
    antwoord: "Nee. Box 3 hangt sterk af van je vermogensmix, vrijstellingen en jaarlijkse regelwijzigingen, en zou de uitkomst minder betrouwbaar maken dan nu geen rekening ermee houden. Houd er zelf rekening mee dat je netto rendement op spaargeld en beleggingen hierdoor iets lager uitvalt."
  - vraag: "Klopt de uitkomst ook als mijn geld in een lijfrente of op een bankspaarrekening staat?"
    antwoord: "Niet zonder meer. De planner gaat uit van vrij belegd vermogen in box 3 en haalt het gewenste inkomen netto uit je vermogen. Uit een lijfrente, bankspaarrekening of pensioenbeleggingsrekening is elke uitkering belast als inkomen in box 1. Er moet dan bruto meer uit om hetzelfde netto over te houden, waardoor je vermogen sneller opraakt dan de planner laat zien. Vul in dat geval alleen je vrij belegde vermogen in."
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

Bij 7% nominaal rendement en 2,5% inflatie is dat (1,07 / 1,025) − 1 ≈ 4,4%. Met dat
gecorrigeerde percentage rekent de planner verder. Het voordeel: je hoeft zelf niet te
turnen op wat 4.000 euro over dertig jaar nog waard is. Dat zit al in de berekening.

## Hoe wordt bruto pensioen netto?

Voor het werkgeverspensioen reken je in de planner een bruto bedrag in, en die wordt
netto gemaakt met de belastingschijven van box 1, hetzelfde systeem als over je loon.
Één verschil: het tarief in de eerste schijf is lager ná je AOW-leeftijd dan ervoor,
omdat er dan geen AOW-premie meer in het tarief zit. Van hetzelfde brutobedrag houd je
na je AOW-leeftijd dus verhoudingsgewijs meer over.

De exacte schijfgrenzen en tarieven wijzigen elk jaar. De planner gebruikt de tarieven
van het lopende belastingjaar; kijk voor de actuele cijfers op belastingdienst.nl.

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
uitkomst rekent meteen opnieuw.

## Wat de planner bewust niet doet

Geen rekening met box 3, met specifieke beleggingsproducten of met kosten daarvan. Dat
zou de uitkomst niet preciezer maken, alleen ingewikkelder om uit te leggen.

De planner gaat er ook van uit dat je vermogen vrij belegd is, in box 3. Staat een deel op
een lijfrenterekening, een bankspaarrekening of een pensioenbeleggingsrekening, dan klopt de
uitkomst niet zonder meer. Zulk kapitaal is fiscaal beklemd: je mag het niet vrij opnemen, en
elke uitkering telt mee als inkomen in box 1. Om hetzelfde bedrag netto over te houden moet er
bruto meer uit, en dat betekent dat je vermogen sneller opraakt dan de grafiek laat zien. Vul in
dat geval alleen je vrij belegde vermogen in. Verander één
aanname in de planner, en de slagingskans verschuift meteen mee. Dat is het hele punt:
niet één vast antwoord, maar zicht op wat je uitkomst kwetsbaar maakt.
