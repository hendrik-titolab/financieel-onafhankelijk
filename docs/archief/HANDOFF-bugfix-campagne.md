# Hand-off — bug-fix campagne (volgende, laatste stap)

Overdracht: 11 augustus 2026, avond, ná de herstijlingssessie. Nieuwe chat morgen. Doel van die
sessie: systematisch bugs zoeken en fixen over de hele site, niet alleen de FO-planner.

**Werk op branch `astro-migratie`** (live productiebranch, automatische Vercel-deploy bij push).
Geen aparte feature-branch nodig voor kleine fixes — zo is vandaag ook gewerkt, elke fix apart
gecommit en gepusht, telkens live geverifieerd met een `fetch(..., {cache:'no-store'})`-check
(zie onderaan, "Werkwijze die vandaag goed werkte").

---

## 0. Status: waar deze sessie eindigde

De volledige herstijling (acht fasen, zie `DESIGN_SYSTEM.md` en `HANDOFF-herstijling-2026.md`)
staat live. Daarna zijn er ná Hendriks eigen gebruik van de live site nog **zes losse fixes**
gedaan, stuk voor stuk gevonden door de site echt te gebruiken, niet door code te lezen:

1. Zichtbare titel boven de FO-planner (was `sr-only`)
2. Scroll-aanwijzing bij de invoerkolom — twee iteraties, zie §2 hieronder voor de les daaruit
3. Inflatiecijfer "langjarig gemiddelde ~2%" was feitelijk onjuist (ECB-doelstelling, geen
   historisch gemiddelde) → gecorrigeerd naar circa 3,5% (CBS 1960-2025, bron in de commit)
4. Mobiel: na "Bereken" scrollt de pagina nu automatisch naar de grafiek (< 1024px)
5. **Echte bug gevonden en gefixt**: bij een pensioenleeftijd die ver afwijkt van de
   AOW-/werkgeverspensioen-ingangsleeftijd (bijv. stoppen op 50, pensioen pas op 65) was het
   voor een gebruiker niet meer te zien wat zijn eigen ingestelde pensioenleeftijd was terwijl
   hij de pensioenuitkeringen invulde — de rekenlogica zelf klopte, de UI verborg de context.
   Referentieregel toegevoegd.
6. PWA-installatieknop op desktop-Chrome: **geen bug bevestigd.** Manifest, iconen (192×192,
   512×512, juiste content-types), service worker: allemaal technisch correct, opnieuw
   uitgebreid nagerekend. Werkt bevestigd op tablet. Vermoedelijke verklaring: Chrome's eigen,
   niet-openbare betrokkenheids-heuristiek voor wanneer `beforeinstallprompt` afgaat — dat is
   browsergedrag, niet iets wat de site kan forceren. **Hendrik beschouwt dit als "in orde"**,
   niet actief oppakken tenzij er nieuw bewijs komt dat het toch aan de code ligt (bijv. als het
   ook op een ander desktop-apparaat/account niet verschijnt na een paar dagen normaal gebruik).

Alle zes gecommit, gepusht naar `astro-migratie`, en live geverifieerd (niet alleen "build
slaagt", maar de daadwerkelijke gewijzigde tekst/class/gedrag opgehaald van de live URL).

---

## 1. Wat "de bug-fix campagne" morgen zou moeten dekken

Vandaag zijn bugs vooral gevonden doordat Hendrik de site echt gebruikte en iets raars zag. Dat
is efficiënt maar niet systematisch — er is nog geen volledige, doelbewuste ronde langs alle vier
tools en alle pagina's geweest sinds de herstijling. Voorstel voor morgen, in volgorde van
risico (hoogste eerst):

### Hoogste risico: de vier rekentools, functioneel + visueel
- **FO-planner**: nog niet getest zijn combinaties van uiterste waarden (leeftijd 18, 100 jaar
  levensverwachting, 0 vermogen, negatieve overschotten, alle vier eenmalige-bedragen-rijen tot
  de limiet van 20, het "Zelf rendement en volatiliteit invullen"-pad met extreme waarden).
- **Bruto-netto**: nog niet visueel/functioneel opnieuw getest ná de herstijling in deze sessie
  (wel de kleuren geverifieerd via computed styles, niet het rekenpad zelf doorlopen).
- **Jaarruimte**: de grootste, meest complexe tool (twee reserveringsruimte-modi, drie
  pensioentypes, opslaan in localStorage) — niet grondig herbezocht sinds de herstijling.
- **Inflatie**: klein, maar controleer of de tekst "Het rode vlak tussen de lijnen…" nog klopt nu
  het vlak signaalkleur (`#A85A3C`) is i.p.v. letterlijk rood — mogelijk een tekstuele
  inconsistentie die is blijven staan tijdens de kleurvervanging.

### Middelhoog risico: randgevallen in de nieuwe UI-elementen van vandaag
- KPI-haarlijnraster: test een scenario waarbij zowel "Overschot" als "Benodigde maandinleg"
  tegelijk in een net-niet-standaardstaat staan (bijv. inleg exact voldoende, `—` in de cel).
- Scroll-aanwijzing (het bouncing pijltje): getest op 390px, 950px en 1280px in deze sessie, niet
  op tussenliggende/andere veelvoorkomende breedtes (bijv. 768px tablet-liggend, 1440px).
- "Eenmalige bedragen": test het geval waarbij je een middelste rij verwijdert (niet de laatste)
  — de progressieve-rij-logica is niet expliciet op die volgorde getest.

### Lager risico, wel de moeite waard
- PDF-export: in deze sessie nooit **visueel** geïnspecteerd (de automatiseringstool liep vast op
  een downloaddialoog). Eén keer zelf downloaden en het resultaat bekijken.
- Alle 24 routes langs op de live site (niet alleen lokaal gebouwd) — vooral de 14 uitlegartikelen
  op gebroken opmaak/kleuren die de sitebrede sed-vervanging gemist kan hebben.
- `/privacy` en `/voorwaarden`: bevatten juridische tekst, dubbelchecken dat daar nergens per
  ongeluk een halve zin is weggevallen tijdens de kleurvervanging (find-and-replace over 133+
  kleurklassen is foutgevoelig, ook al is de build steeds gecontroleerd).

---

## 2. Les uit vandaag: hoe het scroll-pijltje twee iteraties kostte

Waarom dit expliciet vermelden: dezelfde soort fout kan in de bug-fix campagne weer opduiken.

- **Eerste versie**: pijltje vast aan de onderkant van het zichtbare vlak (`position:absolute`),
  verdwijnt pas bij de daadwerkelijke onderkant. Hendrik: voelde aan als vastzittend, bewoog niet
  mee met scrollen.
- **Tweede versie**: pijltje verplaatst ín de inhoud (na het Inflatie-veld), schuift normaal mee.
  Op Hendriks eigen grote tweede scherm (lagere effectieve viewporthoogte door browserchrome dan
  ik had aangenomen) viel het pijltje al buiten beeld vóór het laden — precies het probleem dat
  het pijltje moest oplossen, nu opnieuw, op een andere manier.
- **Derde versie (huidige, live)**: weer vast aan de onderkant van het zichtbare vlak (zoals
  versie 1), maar verdwijnt nu al bij de eerste scrollbeweging (niet pas bij de onderkant) i.p.v.
  nooit te bewegen. Combineert: altijd zichtbaar bij laden op elke schermhoogte, én reageert
  direct op scrollen.

**Les:** een fixed-position element testen op één schermgrootte (mijn eigen browserpane) zegt
weinig over hoe het zich gedraagt op Hendriks eigen apparaten. Test dit soort viewport-afhankelijke
UI voortaan expliciet op meerdere hoogtes (bijv. 700px, 950px, 1400px) vóórdat je 'm oplevert, niet
pas nadat Hendrik het zelf tegenkomt.

---

## 3. Werkwijze die vandaag goed werkte, aanhouden

1. Wijziging maken, lokaal bouwen (`npm run build`), lokaal in de browser testen (niet alleen
   aannemen dat de build slaagt = het werkt).
2. Commit met een uitgebreide, feitelijke commit message (wat, waarom, wat er eerst fout ging).
3. `git push origin astro-migratie`.
4. **Altijd live verifiëren**, nooit aannemen dat pushen = live staat. Vercel-deploy duurt
   doorgaans 20-40 seconden. Check met een `fetch()` met `cache:'no-store'` op de live URL naar
   een concreet, nieuw stukje tekst/class uit de wijziging — niet zomaar "de pagina laadt".
   Let op: React-eilanden (`client:only="react"`) renderen niks in de kale server-HTML, dus voor
   wijzigingen in de FO-planner/Bruto-netto/Jaarruimte/Inflatie moet de check via een
   `javascript_exec` in een echte browserpagina, niet via een kale `curl`/`fetch`-HTML-check.
5. Geen Vercel-dashboardtoegang — deploy-status altijd afleiden uit de live site zelf, nooit uit
   het dashboard aannemen.

---

## 4. Nog openstaand, niet vergeten

- **Vijf datatokens** (`data-100/300/500/700`, `sand-deep`) nog niet beoordeeld door Hendriks
  grafisch ontwerper — Hendrik bespreekt dit zelf, niet zelf actie op ondernemen.
- **Analytics-events**: Hendrik had gevraagd of dit extra cookies vereist — nee, uitgezocht en
  met bron bevestigd (Vercel Web Analytics is cookieloos, ook voor custom events). Nog niet
  gebouwd, alleen de vraag beantwoord. Hendrik moet nog beslissen of hij dit wil.
- **`currentIncome`-veld** blijft bewust ongebruikt in de berekening (alleen Excel-export) —
  Hendrik ziet toekomstige waarde hierin voor een advies ("X% van je huidige inkomen"). Niet
  aanpassen zonder nieuw overleg.
- **PWA-installatieknop desktop**: zie §0, punt 6. Beschouwd als in orde, niet actief oppakken.
