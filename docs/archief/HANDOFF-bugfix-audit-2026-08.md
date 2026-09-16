# Bug-fix audit: developer-rol + vakidioot-financieel-planner-rol

> **Status:** auditplan, opgesteld 12 augustus 2026. Nog niet uitgevoerd.
> **Voorganger:** `HANDOFF-bugfix-campagne.md` (blijft staan, dit document vervangt het inhoudelijk).
> **Uitkomst van deze ronde:** een bevindingenrapport, geen codewijziging.
> **Uitvoering sessie 1:** zie `PROMPT-sonnet-sessie-1.md`.

---

## Besluiten van Hendrik, 12 augustus 2026

Deze drie besluiten zijn genomen vóór de uitvoering en overrulen wat er verderop als open vraag
staat.

1. **A12 / E8, rendementen zijn meetkundig bedoeld.** De percentages in `risicoprofielen.ts` zijn
   verwachte samengestelde jaarrendementen, conform wat gangbaar is in Nederlandse
   consumentenrekentools. Gevolg: `pensionCalc.ts` rekent al goed, en **`monteCarlo.ts` is de kant
   die aangepast moet worden** (lognormaal trekken, of het gemiddelde met ½σ² ophogen). Nog te
   verifiëren in Fase 2: schrijven AFM of DNB hier een methodiek voor voor (uniforme
   rekenmethodiek, scenariosets)? Zo ja, dan wint die boven "gangbaar".
2. **D2, doel van de downloadlimiet is contact.** Hendrik wil dat mensen die meer downloads nodig
   hebben contact opnemen, zodat hij zijn gebruikers leert kennen en kan vragen waarvoor zij de
   tool gebruiken. Dit maakt D2 een functionele test in plaats van een besluitvraag: biedt het
   scherm bij de vierde poging daadwerkelijk een contactroute? Zo niet, dan is dat een bevinding.
3. **G1, testmechanisme goedgekeurd.** Vitest plus golden-master-tests worden gebouwd, en de twee
   minimale testbaarheidsingrepen in productiecode (injecteerbare RNG en injecteerbaar
   basisjaar, zie E11) zijn toegestaan als aparte, apart gelabelde commit.

---

## Hoe dit document te gebruiken

Dit is een **auditplan**, geen fixlijst. De volgorde is: eerst alles nalopen en rapporteren,
daarna pas per item akkoord van Hendrik, en daarna pas fixen. Wie dit document oppakt en meteen
begint met wijzigen, doet het verkeerd.

### Werkverdeling tussen modellen

Deze audit is niet uniform van moeilijkheidsgraad. Grofweg:

| Fase | Wat | Geschikt voor |
|---|---|---|
| Fase 0 | Baseline vastleggen (build, commit-hash, `astro check`) | Elk model |
| Fase 1 | Resterende codeverificatie, citaten vastleggen | Elk model |
| **Fase 2** | **Externe fiscale bronverificatie** | **Alleen met menselijke controle van elk cijfer.** Dit is de plek waar een model een plausibel maar onjuist bedrag kan produceren, en in het Wft-domein is dat een vergunningsrisico, geen schoonheidsfout. Elk cijfer krijgt een primaire bron-URL die Hendrik zelf kan openen. |
| Fase 3 | Live browsertests volgens de scenario's hieronder | Elk model, de scenario's staan uitgeschreven |
| Fase 4 | Synthese in het rapport | Elk model |
| **Fixronde** | **Na akkoord** | Mechanische fixes (A4, A11, A16, C1, C2, B1, E11, E12) zijn goed te delegeren. De rekenkernwijzigingen (E1, E2, E4, E5, E6, E7, E8, A1, F1) zijn ontwerpbeslissingen met een financiële onderbouwing en horen niet zonder tests en zonder inhoudelijke review doorgevoerd te worden. Zie G1. |

---

## Context

Na de herstijling van 11 augustus staat er een hand-off (`HANDOFF-bugfix-campagne.md`) klaar voor
een systematische bug-fix ronde over de hele site, niet alleen de FO-planner. Hendrik is akkoord
met dat plan en heeft het uitgebreid met twee expliciete rollen:

1. **Developer**: alle code zien, begrijpen, waar mogelijk vereenvoudigen, ruis en rommel
   verwijderen (alleen echte ruis/rommel), en de restyling van 11 augustus consistent doortrekken
   over de hele site.
2. **Vakidioot financieel planner**: alle berekeningen nalopen op juiste uitgangspunten, formules,
   percentages, fiscale cijfers en ontbrekende uitzonderingen die de uitkomst zouden moeten
   veranderen. Zelfde voor tekst: feitelijke onjuistheden aan de kaak stellen (niet elke nuance
   hoeft, de informatie moet wel kloppen).

Losse expliciete vraag: hoe werkt de downloadlimiet (max 3 gratis), device, IP, hoe gemeten?

**Cruciaal**: "Alle uitkomsten en een verbetersuggestie (soms keuze tussen meerdere) leg je aan mij
voor nadat je alles zorgvuldig hebt nagelopen." Dit is dus een **auditronde die eindigt in een
bevindingenrapport met voorstellen**. Er wordt in deze ronde geen productiecode gewijzigd. Fixes
volgen pas na Hendriks akkoord per item, via de bestaande workflow (lokaal bouwen en testen,
commit, push, live verifiëren).

Er zijn al drie parallelle verkenningen en een planningsronde gedaan. Dit plan beschrijft de
resterende verificatie- en testfase en de vorm van het eindrapport.

### Scope-grens

Binnen scope: rekenkundige juistheid, fiscale juistheid, feitelijke juistheid van content,
codekwaliteit die tot fouten leidt, restyling-consistentie, en de juridische consistentie tussen
wat de site doet en wat de site daarover zegt.

Buiten scope tenzij het uit het bovenstaande rolt: SEO-optimalisatie, performance-optimalisatie,
een volledige WCAG-audit, en nieuwe functionaliteit. Deze grens staat er expliciet in omdat de
audit anders ongemerkt een verbouwing wordt.

### Betekenis van de codes

| Prefix | Domein |
|---|---|
| **A** | Applicatiecode en UI-logica |
| **B** | Content (de 14 uitlegartikelen) |
| **C** | Consistentie van documentatie en vormgeving |
| **D** | Downloadlimiet (Hendriks expliciete vraag) |
| **E** | Economisch/actuarieel model: klopt de financiële redenering |
| **F** | Fiscale parameters, inclusief cross-project (de Claude Skill) |
| **G** | Proces en kwaliteitsborging |
| **J** | Juridische en privacy-consistentie |

Statuscodes: **PO** = bevestigd via code/tekst lezen. **LT** = moet nog live getest in de browser.
**WS** = moet nog extern geverifieerd (WebSearch/WebFetch). **REK** = moet nog met een uitgewerkt
rekenvoorbeeld hard gemaakt. **✅** = persoonlijk in de broncode dubbelgecheckt tijdens het
opstellen van dit plan.

---

## Wat al vaststaat (geclassificeerd)

### E-serie: het rekenmodel zelf

Alle E-items zijn ✅ in de broncode geverifieerd. De genoemde ordes van grootte zijn een eigen
berekening en gaan in het rapport mee met de tussenstappen erbij.

- **E1 (hoog, Wft) — geen fiscale behandeling van de onttrekking uit eigen vermogen.**
  `pensionCalc.ts:204` en `:225` trekken `fromCapital` als **netto** bedrag rechtstreeks van het
  kapitaal af. Het model kent geen onderscheid tussen box 3-vermogen (onttrekking zelf onbelast,
  wel jaarlijkse vermogensheffing) en box 1-potten zoals lijfrente en banksparen (onttrekking
  volledig belast tegen het box 1-tarief). Voor iemand met een lijfrentekapitaal is de uitkomst
  daardoor structureel te gunstig, in de orde van het volledige belastingtarief over de
  onttrekking. Dit is de zwaarste bevinding van de hele audit: iemand kan op basis hiervan
  concluderen dat hij financieel onafhankelijk is terwijl dat niet zo is.
  Voorstel A (klein): expliciete aanname in de UI en de FAQ, "dit model gaat uit van vrij belegd
  vermogen in box 3, niet van lijfrente of banksparen". Voorstel B (juist): een veld "waarvan
  lijfrente/banksparen" en bruteren via de bestaande `nettoToBruto`. A dekt het Wft-risico direct,
  B lost het inhoudelijk op.
- **E2 (hoog) — box 3 wordt ook niet optioneel gemodelleerd.** Het oorspronkelijke plan zette dit
  onder "al in orde, want gedisclosed". Disclosure dekt de aansprakelijkheid, niet de uitkomst.
  Juist voor deze doelgroep (groot vrij belegd vermogen) is de forfaitaire vermogensheffing de
  grootste ontbrekende kostenpost, groter dan het verschil tussen twee naast elkaar liggende
  risicoprofielen. Grep over `src/components/PensionPlanner/` en `src/utils/` bevestigt: geen
  enkele verwijzing. Besluitvraag aan Hendrik, met het exacte forfait en tarief 2026 op te halen
  in Fase 2.
- **E3 (hoog) — geen kosten.** `risicoprofielen.ts` levert brutorendementen (3,0% tot 9,0%
  nominaal) zonder aftrek van fonds- en platformkosten, en er is nergens een kostenveld. 0,5%
  kosten per jaar over 30 jaar kost ongeveer 14% van het eindvermogen (1,005^30 = 1,161, dus
  1/1,161 = 0,861). Voorstel: een kostenveld met een realistische default, of minimaal microcopy
  die de gebruiker vraagt een rendement **na kosten** in te vullen.
- **E4 (hoog) — `brutoToNetto` kent geen heffingskortingen.** `pensionCalc.ts:11-17` past
  uitsluitend schijventarieven toe. Twee gevolgen in tegengestelde richting: vóór de AOW-leeftijd
  wordt de belastingdruk overschat (algemene heffingskorting ontbreekt), ná de AOW-leeftijd wordt
  het marginale tarief onderschat, omdat de afbouw van de algemene heffingskorting en de
  ouderenkorting het effectieve marginale tarief boven het schijventarief tillen. Bijkomend:
  `fiscaleParameters.ts` bevat wél `HEFFINGSKORTING_PRE_AOW` maar géén POST_AOW-tegenhanger, dus
  ouderenkorting en alleenstaande-ouderenkorting ontbreken volledig in de centrale config. En: de
  bruto-nettotool op dezelfde site gebruikt de kortingen wél. **Twee tools op
  benikfinancieelonafhankelijk.nl geven een verschillend netto voor hetzelfde bruto.** Live met
  één concreet bedrag aantonen.
- **E5 (hoog) — AOW en werkgeverspensioen worden impliciet volledig geïndexeerd.** Het model
  rekent in reële euro's en houdt `aowMaandBedragNetto` en `employerPension` over de hele looptijd
  constant. De stille aanname is dus: beide stijgen exact mee met de inflatie. Voor de AOW is dat
  verdedigbaar (koppeling aan het minimumloon), voor een aanvullend pensioen niet: indexatie is
  voorwaardelijk, ook onder de Wtp. Bij 1 procentpunt indexatie-achterstand per jaar over 30 jaar
  is de reële uitkering 26% lager dan het model aanneemt (1 − 0,99^30). Voorstel: een
  indexatieveld per inkomensbron, of minimaal een expliciete vermelding in de FAQ.
- **E6 (hoog) — de slagingskans wordt op het verkeerde moment gemeten.** `monteCarlo.ts:105-106`
  telt een pad als geslaagd bij `capital >= 0` **aan het einde**. Een pad dat tussentijds onder
  nul duikt telt dus mee als geslaagd. Perverse mechaniek: negatief kapitaal maal (1 + een
  negatief rendement) wordt minder negatief, dus een reeks slechte jaren kan een pad "redden". De
  juiste maat is: is het kapitaal ooit onder nul geweest. De getoonde slagingskans is nu naar
  boven vertekend, en dat is precies het getal waar een bezoeker zijn conclusie op baseert. Kleine
  fix, groot effect.
- **E7 (hoog) — Monte Carlo negeert eenmalige bedragen ná de pensioendatum.** `monteCarlo.ts:45`
  filtert op `e.year < retirementYear` en de uitkeringslus (regel 86-102) past geen enkele
  gebeurtenis toe. `pensionCalc.ts:136` en `:224` doen dat wel. Een grote uitgave op 75-jarige
  leeftijd verandert dus wel de deterministische lijn, maar niet de bandbreedte en niet de
  slagingskans. Twee getallen op hetzelfde scherm die elkaar tegenspreken.
- **E8 (midden) — het deterministische "verwacht eindvermogen" ligt structureel boven de mediaan
  van de simulatie.** De simulatie trekt normaal verdeelde jaarrendementen rond het gemiddelde en
  vermenigvuldigt ze; de mediane uitkomst ligt daardoor ongeveer een factor exp(−½σ²·n) lager. Bij
  het profiel offensief (σ = 16%) over 30 jaar is dat exp(0,5 × 0,0256 × 30) = 1,47, dus de KPI
  staat ordegrootte 40 tot 50% boven de p50-band in dezelfde grafiek. Beide getallen zijn op
  zichzelf verdedigbaar, maar ze staan zonder uitleg naast elkaar en de KPI heet "verwacht".
  Voorstel A: KPI hernoemen en een regel uitleg. Voorstel B: de simulatie op het meetkundig
  gemiddelde laten trekken. Hangt samen met A12: in `risicoprofielen.ts` staat nergens of de
  percentages rekenkundig of meetkundig bedoeld zijn, en zonder die keuze is niet vast te stellen
  welk van de twee getallen fout is.
- **E9 (midden, REK) — inconsistente timing-conventies tussen benodigd kapitaal en de simulatie.**
  `pensionCalc.ts:160` disconteert met `Math.pow(rPostAnnual, yr + 0.5)`, dus midden-jaar. De
  simulatie op regel 225 maakt eerst rendement en onttrekt dán een vol jaar, dus eind-jaar. Bij 2%
  reëel scheelt dat ongeveer 1% in het benodigd kapitaal, structureel dezelfde kant op.
  Spiegelbeeldig aan de opbouwkant: `monthlyPMT * 12` wordt op regel 82 en 189 aan het eind van
  het jaar bijgeschreven zonder rendement in dat jaar, terwijl de inleg maandelijks is.
  Netto-effect: iemand kan exact het "benodigde kapitaal" halen en toch geld overhouden. Dit is de
  concrete invulling van het oude A15, dat daarmee vervalt als los item.
- **E10 (laag) — `findRequiredPMT` kan een negatieve benodigde inleg opleveren**
  (`pensionCalc.ts:97`, `lo = -50000`). Gecombineerd met A3 (`eur()` doet altijd `Math.abs()`)
  wordt een negatieve benodigde inleg als positief bedrag getoond. Meenemen in de A3-fix, niet
  apart oplossen.
- **E11 (laag) — `new Date().getFullYear()` staat in de rekenkern** (`pensionCalc.ts:131`,
  `monteCarlo.ts:39`). De uitkomst hangt daarmee af van de systeemdatum, en op 1 januari
  verschuiven alle aan kalenderjaren gekoppelde eenmalige bedragen een jaar op ten opzichte van de
  leeftijdsas. Bovendien maakt het de functies onttestbaar. Voorstel: `currentYear` als optionele
  parameter met de huidige waarde als default.
- **E12 (laag) — de laatste rij van de uitkeringstabel toont inkomen uit vermogen dat niet meer
  onttrokken wordt.** `pensionCalc.ts:194-221` loopt `yr <= yearsInRetirement` en breekt af vóór
  de kapitaalupdate, dus die laatste rij is een presentatierij, geen rekenrij.

### F-serie: fiscale parameters

- **F1 (WS, hoog, cross-project).** `src/config/fiscaleParameters.ts` en Hendriks eigen Claude
  Skill (`~/.claude/skills/jaarruimte-berekening/references/parameters.md`) lopen voor meerdere
  jaren uiteen. Uit het lezen van `JAARRUIMTE_PARAMS` (regel 76-91) komen vier concrete, toetsbare
  hypotheses die de externe verificatie kunnen sturen:
  1. **2022 heeft `factorMultiplier: 7.44`, terwijl 2021 en 2023 beide 6,27 hebben.** Een
     alleenstaande uitschieter die bovendien de eigen kopregel op regel 77 tegenspreekt ("oud
     regime: 13,3%, factor 7,44" boven een blok dat 6,50 en 6,27 bevat). De skill zet diezelfde
     7,44 op 2020 en 2021. Werkhypothese: één gedeelde onjuiste bron, in beide bestanden op een
     ander jaar geplakt.
  2. **2016 staat op 13,3% en 2017 op 13,8%,** terwijl het jaarruimtepercentage in de tijd daalde
     in plaats van steeg. Mogelijk zijn deze twee jaren verwisseld. Dit raakt direct aan A7.
  3. **`maxInkomen` is drie jaar op rij exact €137.800** (2024, 2025, 2026), terwijl dit bedrag
     jaarlijks geïndexeerd wordt. Sterke aanwijzing voor een forward-fill in plaats van een
     overgenomen cijfer.
  4. **`reserveringsruimteMax` staat op €28.000 voor alle jaren 2016 tot en met 2022.** De
     reserveringsruimte werkte vóór 2023 met een fundamenteel ander plafond (een percentage van de
     premiegrondslag met een absoluut maximum in de orde van €8.000, hoger voor 55-plussers) en
     met een terugkijktermijn van 7 in plaats van 10 jaar. Dit is waarschijnlijk geen afwijking
     maar een regime dat helemaal niet geïmplementeerd is. **Als dit klopt, verandert de aard van
     F1**: dan is het niet "site of skill heeft gelijk", maar dekt elk van beide één regime en
     geen van beide allebei. Dat is een andere fix en een ander gesprek.

  Twee dingen ontbreken bovendien volledig in het datamodel: de **toevoeging aan de oudedagsreserve
  (FOR)**, die tot en met 2022 de jaarruimte verlaagde en materieel is voor elke ondernemer die
  achterliggende jaren narekent, en de **terugkijktermijn zelf** (7 versus 10 jaar), die nergens
  als parameter bestaat. Ook ontbreekt de begrenzing tot de AOW-leeftijd.
- **F2 (midden) — de bronketen is de zwakke schakel, niet het cijfer.** `fiscaleParameters.ts:7-9`
  noemt één secundaire bron (Lindenhaeghe advieskaart) voor de hele set, zonder bron per waarde.
  De fouten in F1 zijn vermoedelijk overschrijffouten, niet bronfouten. Voorstel: per jaar een
  primaire bron-URL (belastingdienst.nl, of art. 3.127 Wet IB 2001 via wetten.overheid.nl) plus
  een verificatie-checklist voor de kwartaalagent die regel 12 noemt. Zonder dat herhaalt deze
  audit zich elk jaar.
- **A7 — ✅ bevestigd (PO), hoog.** De uitlegtekst bij de jaarruimtetool klopt niet met de eigen
  data. `src/utils/jaarruimte.ts:95-101` (`getJaarruimteParamsNote`, live gerenderd op
  `src/components/Jaarruimte/index.tsx:758`) hardcodeert "7,44 × factor A" voor élk jaar vóór 2023,
  terwijl `fiscaleParameters.ts` zelf 6,50 heeft voor 2016 tot en met 2018 en 6,27 voor 2019 tot
  en met 2021. Ook "13,3%" klopt niet voor 2017 (13,8% in de eigen data). Zelfde aanname nogmaals
  op `Jaarruimte/index.tsx:629`. Regel 733 is nog stringenter: een volledig vaste string "30% ×
  (inkomen − franchise) − 6,27 × factor A", niet conditioneel op jaar of pensioentype, dus ook
  fout bij Wtp, bij geen pensioentype en bij elk jaar vóór 2023. Welke kant gefixt moet worden is
  pas te zeggen ná F1.
- **A10 (WS, hoog).** Het toelichtingsblok in `BrutoNetto/index.tsx:326-345` dupliceert fiscale
  cijfers als losse literals in plaats van de `fiscaleParameters.ts`-import te gebruiken. Zelf
  herberekend komt het afbouwpunt van de arbeidskorting op ongeveer €132.919, de tekst toont
  "±€132.290". Extern verifiëren wat het cijfer voor 2026 daadwerkelijk is. Het onderliggende
  probleem is de duplicatie zelf: dezelfde faalwijze als A7.

### Applicatiecode

- **A3 — ✅ bevestigd (PO), hoog.** `ResultsPanel.tsx:250` toont `eur(result.projectedCapital)`
  ("Verwacht eindvermogen") zonder tekenbehandeling; `eur()` (regel 25-27) doet altijd
  `Math.abs()`. Bij een groot negatief life-event kan een tekort dus als positief bedrag getoond
  worden. Op regel 317 (`surplusAtEnd`) staat hiervoor al een handmatige workaround met een
  min-teken. **Voorstel is expliciet niet een derde workaround** maar één tekenbewuste formatter
  plus een grep over alle `eur()`-aanroepen, zodat de resterende gevallen in één keer zichtbaar
  worden. Live bewijs met een concreet scenario.
- **A1 (PO)**: drievoudige duplicatie van de onttrekkingslogica voor AOW en werkgeverspensioen in
  `pensionCalc.ts` (`getMonthlyWithdrawal()` op regel 35, plus inline kopieën op regel 199-204 en
  265-271). Risico dat een toekomstige wijziging op één plek de andere twee mist. E4 en E5 raken
  precies deze code, dus dit moet vóór die fixes opgelost worden, niet erna.
- **A17 (LT)**: de KPI-cellen "Overschot" en "Benodigde maandinleg" zijn twee onafhankelijk
  berekende waarden (`isOnTrack` versus `needsMoreContribution`, met `>` in plaats van `>=`). Bij
  een inleg die exact voldoende is live checken of ze elkaar niet tegenspreken. Hangt samen met
  E9: door de afwijkende disconteringsconventies is "exact voldoende" nu een grijs gebied van
  ongeveer 1%.
- **A18 (LT)**: index-as-key (`key={i}`) bij de rijen "Eenmalige bedragen", geen stabiel id. Data
  blijft correct (bevestigd), mogelijk focus-gedrag-bug bij het verwijderen van een middelste rij.
  Live testen.
- **A8/A9 (PO)**: `getParams()` valt stil terug op de cijfers van 2026 voor jaren vóór 2016,
  bereikbaar via de reserveringsruimte-wizard (tot 11 jaar terug); `getAvailableYears()` mist 2016
  tot en met 2019 hoewel `JAARRUIMTE_PARAMS` die jaren wel bevat. Een stille terugval op verkeerde
  jaarcijfers is in het Wft-domein erger dan een foutmelding: voorstel is falen met een duidelijke
  melding, niet raden.
- **A5 (LT)**: geen clamping op zelf ingevoerde extreme rendement- en volatiliteitswaarden (de
  min/max in de UI is cosmetisch, `NumberInput` handhaaft het niet). Extra reden: bij een hoge
  volatiliteit kan de normale verdeling in `sampleNormal` rendementen onder −100% trekken, waarna
  het kapitaal van teken wisselt. Samen met E6 testen.
- **A12 (besluit, geen bug)**: `risicoprofielen.ts` heeft geen bronvermelding, in tegenstelling
  tot `fiscaleParameters.ts`. Uitgebreid met de vraag uit E8: zijn de percentages rekenkundig of
  meetkundig gemiddeld bedoeld? Zonder dat antwoord is de simulatie niet te ijken.
- **A19 (midden)**: `currentIncome` wordt ingevuld, nergens in de berekening gebruikt, en
  verschijnt wél in de Excel-export. Stond als bekend openstaand punt in `CLAUDE.md` maar niet in
  de audit. Een veld dat je invult en dat vervolgens in een exportdocument opduikt suggereert dat
  het meetelt. Voorstel: verwijderen, of labelen als "alleen voor je eigen dossier".
- **A20 (laag)**: `nettoToBruto` (`pensionCalc.ts:19`) is geëxporteerd; controleren of het ergens
  gebruikt wordt. Zo niet, dan is het óf dode code óf precies het gereedschap dat E1 nodig heeft.

### Laag risico en cosmetisch

- **A11 (✅ PO)**: `Inflatie/index.tsx:257` beschrijft "het rode vlak", terwijl dat vlak
  signaalkleur `#A85A3C` (terracotta) is. Enige vermelding van "rood" in heel `src/`.
- **A4 (✅ PO)**: dode filtervoorwaarde in `monteCarlo.ts:113`. `age >= retirementAge -
  yearsToRetirement` is per definitie `age >= currentAge`, dus altijd waar. Het commentaar "skip
  pre-retirement" beschrijft iets dat niet gebeurt.
- **A16 (PO)**: `exportExcel.ts:98` hardcodeert `'2000'` in plaats van `N_SIMULATIONS`. Toevallig
  dezelfde waarde, dus nu cosmetisch.
- **A14 (PO)**: mogelijk dode `stortingen`-array in `pensionCalc.ts` (de UI vult deze niet meer
  sinds de samenvoeging met life events). Let op bij verwijderen: oude opgeslagen sessies in
  localStorage kunnen het veld nog bevatten.
- **A6 (afgesloten, geen actie)**: Box-Muller zonder epsilon-guard bij `Math.random() === 0`, kans
  verwaarloosbaar.
- **C1 (✅ PO)**: `DESIGN_SYSTEM.md` en `HANDOFF-herstijling-2026.md` claimen beide nog "niet
  gemerged naar astro-migratie", terwijl de restyling al zes commits diep in de live geschiedenis
  zit.
- **C2 (PO)**: drie hardcoded hexkleuren buiten het gedocumenteerde tokenpalet (`#1F2C23` op 8
  plekken, `#8F4B30`, `#D2CDC5`). Lijken bewuste hover- en randvarianten, geen restant van het
  oude palet. Voorstel: als tokens opnemen in `DESIGN_SYSTEM.md` in plaats van weghalen.
- **C3 (laag)**: de H1 op de FO-plannerpagina is `sr-only`. Stond als bekend openstaand punt in
  `CLAUDE.md`, hoort in de restyling-consistentiecheck thuis omdat de pagina daardoor als enige
  geen zichtbare kop heeft.

### D: de downloadlimiet (Hendriks expliciete vraag)

- **D1 (✅ PO, mechanisme beantwoord).** `src/utils/downloadLimit.ts` is 21 regels en documenteert
  zichzelf. Key `fp_download_count` in localStorage, de teller telt **PDF en Excel bij elkaar op**,
  limiet 3, **geen device-fingerprinting en geen IP-detectie**, wat technisch ook niet kan omdat er
  geen server is. Resetten door browsergegevens te wissen of een ander apparaat of een
  incognitovenster te gebruiken. De limiet hoort dus bij de browser, niet bij een persoon. Nog live
  bevestigen dat de vierde poging daadwerkelijk geblokkeerd wordt.
- **D2 (LT + besluit) — microcopy en doel.** Controleren dat de tekst in de UI niet suggereert dat
  de limiet hard of persoonsgebonden is, en of het woord "gratis" een betaalde variant impliceert
  die niet bestaat. Business-vraag aan Hendrik: wat is het doel van deze drempel als er geen
  betaalde vervolgstap is? Als het doel lead-generatie of remmen van misbruik is, doet dit
  mechanisme geen van beide.

### J: juridische en privacy-consistentie

- **J1 (midden)**: de site schrijft naar localStorage op minimaal drie plekken
  (`fp_download_count`, opgeslagen jaarruimteberekeningen, PWA-bannerstatus) en laadt Vercel Web
  Analytics. Controleren of `privacy.astro` alle vier noemt en of de kwalificatie klopt
  (functionele opslag, geen toestemming vereist). Geen bug, wel een consistentiecheck die precies
  in deze ronde thuishoort: de audit stelt sowieso vast wát er wordt opgeslagen.
- **J2 (midden)**: per hoge E-bevinding vaststellen of de bijbehorende aanname ergens gedisclosed
  is. Een rekenmodel mag vereenvoudigen, maar in het Wft-domein moet de vereenvoudiging vindbaar
  zijn voor de gebruiker. Dit levert een korte lijst "aannames die in de FAQ horen" op, ongeacht
  welke E-items technisch gefixt worden.

### G: proces en kwaliteitsborging

- **G1 (hoog voor de vervolgronde) — er is geen enkele geautomatiseerde test en geen typecheck in
  de build.** `package.json` bevat alleen `dev`, `build` en `preview`: geen testrunner, geen
  `astro check`, geen linter. Elke fix in `pensionCalc.ts` of `jaarruimte.ts` is daarmee een blinde
  ingreep, en A1 (drievoudige duplicatie) plus F1 (parameters) zijn precies de plekken waar een
  stille regressie het langst onopgemerkt blijft. Voorstel: vóór de fix-ronde een minimale
  Vitest-opzet met golden-master-tests, een handvol vastgelegde scenario's met verwachte uitkomsten
  op `pensionCalc`, `jaarruimte` en de bruto-nettoberekening, plus `astro check` als aparte
  scriptregel. Twee kanttekeningen: dit is de enige aanbeveling in dit rapport die zelf code
  toevoegt in plaats van code corrigeert, dus die moet Hendrik apart goedkeuren; en de simulatie is
  pas vast te leggen als `Math.random` injecteerbaar wordt (seed), anders is dat deel per definitie
  niet reproduceerbaar.
- **G2 (laag)**: in Fase 0 nagaan of `dist/` in `.gitignore` staat en of `npm run build` schoon
  draait vanaf een schone werkkopie.

### Content-artikelen (14 stuks, `src/content/uitleg/`)

- **B1 (✅ PO), hoogste contentprioriteit**: `hoe-hoog-kan-inflatie-worden.md:65`, "100 biljoen
  (dat is een 1 met twaalf nullen erachter, oftewel 1.000 miljard)" is wiskundig fout. 100 biljoen
  is 10^14, dus een 1 met veertien nullen, oftewel 100.000 miljard. Het hoofdgetal klopt (het echte
  Zimbabwaanse bankbiljet), alleen de verklarende bijzin niet.
- **B2 (WS, tier 1)**: `sparen-maakt-mensen-arm.md`, drie tijdsgebonden claims: "drie grote banken
  boden zomer 2026 alle drie exact 1,25%" (opvallend specifiek, dus hoogste prioriteit), "januari
  2026 2,4%" CBS-inflatie, "afgelopen tien jaar gemiddeld ongeveer 3%".
- **B3 (REK)**: zelfde artikel, regel 52, "na zeven jaar" 10% koopkracht kwijt bij 3% inflatie.
  Rekenkundig ligt het omslagpunt op 6,15 jaar.
- **B4 (WS, tier 1, samen met F1)**: `wat-is-jaarruimte.md:31`, "30% in 2026". Intern consistent
  met de site, externe bevestiging extra relevant gezien F1.
- **B5 (WS, tier 2/3, batch)**: overige externe feiten (AOW-bedragen en AOW-leeftijd,
  Trinity-studie 1998, Cagan 1956, depositogarantie €100.000, ECB-inflatiedoel 2%, Hanke & Krus
  2012). Stabiel en laag risico, gebundeld of steekproefsgewijs checken.
- **B6 (afgesloten, positief)**: vrijwel alle interne rekenvoorbeelden en tabellen in de content
  kloppen exact. Geen breed kwaliteitsprobleem.
- **B7 (midden) — consistentie tussen content en tools.** De artikelen noemen concrete percentages
  (inflatie, rendement, jaarruimte) die ook als default of uitleg in de rekentools staan.
  Controleren of die met elkaar overeenkomen. Een lezer die in een artikel 3% inflatie leest en in
  de tool een andere default aantreft, verliest vertrouwen in beide. Goedkope check, omdat F1, B2
  en B4 de cijfers toch al op tafel leggen.

### Al in orde (bevestigen in het rapport, geen actie nodig)

- `realAnnualReturn` in `pensionCalc.ts:29` gebruikt de exacte Fisher-relatie ((1+n)/(1+i) − 1),
  niet de gangbare benadering n − i. Correct, en het verdient vermelding omdat het een bewuste
  keuze is.
- Het 75%-scenario in de simulatie gebruikt dezelfde toevalstrekkingen als het volle scenario
  (`monteCarlo.ts:74`), waardoor de vergelijking eerlijk is. Correct en goed gedocumenteerd.
- AOW-opbouwkorting: geen stille aanname, de gebruiker vult het AOW-bedrag zelf in en een apart
  artikel legt het onderwerp uit.
- Noise-sweep (`console.log`, `TODO`, `FIXME`, `: any`, `@ts-ignore`) over heel `src/`: nul
  treffers.
- Restyling: geen oude Tailwind-blauwtinten meer, `privacy.astro` en `voorwaarden.astro` volledig
  intact (helemaal gelezen, geen weggevallen zinnen), alle 24 routes en de Header- en Footerlinks
  kloppen.
- De toelichting bovenin `downloadLimit.ts` beschrijft het mechanisme en de beperkingen ervan
  correct en eerlijk.

---

## Uitvoeringsvolgorde

**Fase 0 (kort) — baseline vastleggen.** `git status` schoon, commit-hash noteren, `npm run build`
draaien en het resultaat vastleggen, en `npx astro check` eenmalig draaien om te zien of er
type-fouten liggen die nu niet zichtbaar zijn. Zonder deze stap hangt het rapport aan een
onbepaalde staat van de code.

**Fase 1 — resterende codeverificatie** (Read/Grep, geen server). De ✅-items zijn gedaan. Wat
resteert: A1 (de drie kopieën naast elkaar leggen), A8, A9, A14, A16, A19, A20 met citaten
vastleggen, A5-clamping bevestigen, E9 met een uitgewerkt rekenvoorbeeld hard maken, A12 en D2 als
besluitvraag noteren, J1 door `privacy.astro` te leggen naast de daadwerkelijke
localStorage-aanroepen.

**Fase 2 — externe bronverificatie** (WebSearch/WebFetch, geen server), in deze volgorde.
Uitsluitend primaire bronnen: belastingdienst.nl, wetten.overheid.nl (art. 3.127 Wet IB 2001 en het
overgangsrecht), CBS StatLine, SVB. Geen vergelijkingssites of adviseursblogs, ook niet als ze het
"bevestigen".
1. Jaarruimteparameters per jaar 2016 tot en met 2026, plus het reserveringsruimte-regime vóór en
   vanaf 2023 en de terugkijktermijn. Lost F1, F2, A7 en B4 in samenhang op. Toets expliciet de
   vier hypotheses uit F1.
2. Box 3: forfaitair rendement en tarief 2026, plus het heffingsvrij vermogen (E2).
3. Heffingskortingen na de AOW-leeftijd: ouderenkorting, alleenstaande-ouderenkorting en de
   afbouwtrajecten (E4).
4. Afbouwpunt arbeidskorting 2026 (A10).
5. De claim "drie banken exact 1,25%" (B2), het meest specifiek en dus het makkelijkst te
   ontkrachten.
6. CBS-inflatiecijfer januari 2026 en het tienjaarsgemiddelde (B2, resterend).
7. B5 gebundeld of steekproefsgewijs, of expliciet als "laag risico, niet apart geverifieerd" in
   het rapport laten staan.

> **Let op bij Fase 2:** elk cijfer krijgt een primaire bron-URL plus datum van raadpleging in het
> rapport, zodat Hendrik het zelf kan openen. Een cijfer zonder klikbare bron gaat niet het rapport
> in, ook niet als het waarschijnlijk klopt.

**Fase 3 — één ononderbroken live sessie** (dev server via `.claude/launch.json`, controleer de
daadwerkelijke poort in de `astro dev`-output).
1. FO-planner, uiterste waarden: leeftijd 18, levensverwachting 100, vermogen 0, een groot negatief
   life-event als bewijs voor A3, 20 rijen eenmalige bedragen, extreme zelf ingevoerde rendement-
   en volatiliteitswaarden voor A5 en E6.
2. E6 concreet: een scenario waarin het kapitaal halverwege de uitkeringsfase opraakt, en
   vaststellen wat de getoonde slagingskans dan zegt.
3. E7 concreet: een eenmalig bedrag van bijvoorbeeld −€100.000 op leeftijd 75 invoeren en
   vaststellen dat de grafieklijn wél verandert en de slagingskans niet.
4. E8 concreet: bij het profiel offensief het KPI-getal "verwacht eindvermogen" naast de p50-lijn
   in dezelfde grafiek leggen en het verschil noteren.
5. E4 concreet: één bruto bedrag door de bruto-nettotool halen en hetzelfde bedrag als
   werkgeverspensioen in de FO-planner invoeren, en de twee netto-uitkomsten naast elkaar zetten.
6. Middelste rij bij eenmalige bedragen verwijderen, niet de laatste (A18).
7. KPI-raster bij een inleg die exact voldoende is (A17).
8. Downloadlimiet: drie keer downloaden in een mix van PDF en Excel, de vierde poging moet
   geblokkeerd zijn, de localStorage-key aflezen in devtools, en één PDF visueel inspecteren (D1 en
   de PDF-exportcontrole in één moeite). Daarna de microcopy beoordelen (D2).
9. Bruto-netto: het volledige rekenpad doorlopen en het afbouwpunt van de arbeidskorting
   vergelijken met de uitkomst van Fase 2.
10. Jaarruimte: beide reserveringsruimte-modi, alle drie pensioentypes, opslaan en laden in
    localStorage, en het jaar 2020, 2021 of 2022 selecteren als schermbewijs voor A7. Ook een jaar
    vóór 2016 proberen te bereiken via de wizard (A8).
11. Inflatie: functioneel doorlopen, kleur van het signaalvlak nogmaals visueel bevestigen (A11).
12. Elke route ook op consolefouten controleren, niet alleen visueel.
13. Alle 24 routes twee keer langslopen: lokaal tegen de productiebuild (`npm run build` gevolgd
    door `npm run preview`) én op de live site. Die twee kunnen verschillen, want live is de laatste
    deploy en lokaal is de huidige HEAD. Verschil expliciet benoemen als het er is.
14. De FO-planner op een mobiele viewport (375 px) doorlopen. De tool is tweekoloms en er is recent
    al mobiel werk gedaan (commit "mobiel auto-scroll na Bereken"), dus dat is een reëel
    risicogebied.
- Scroll-pijltje: **overslaan**, al door Hendrik zelf getest en goedgekeurd op desktopscherm 2 en
  tablet.

**Belangrijk bij elke test op de simulatie**: die is niet deterministisch (`Math.random` zonder
seed). Bij 2.000 paden en een slagingskans rond 90% is de standaardfout ongeveer 0,7 procentpunt,
dus een herhaalde meting mag tot ongeveer 1,5 procentpunt afwijken zonder dat er iets mis is. Elk
verschil dat groter is telt pas als bevinding.

**Fase 4 — synthese**: bevindingen ordenen in het rapportformat hieronder en voorleggen aan
Hendrik. Geen productiecode wijzigen.

### Tweetrapsoplevering

Fase 1 en 2 leveren de Wft-relevante bevindingen (E1 tot en met E5, F1, F2, A7, A10, B1) en hangen
niet af van de live sessie. Voorstel: die als **tussenrapport** opleveren zodra Fase 2 klaar is,
zodat Hendrik kan beginnen met beslissen terwijl Fase 3 nog loopt. Het volledige rapport volgt
daarna.

---

## Rapportvorm

Eén markdown-bestand, `AUDIT-2026-08-bevindingen.md`, in de projectroot, in dezelfde traditie als
de bestaande `HANDOFF-*.md`'s. Plus een korte samenvatting in de chat met de belangrijkste punten
vooraan.

Het rapport wordt **wel** gecommit, maar op een aparte branch `audit-2026-08`, niet op
`astro-migratie`. Een werkdocument van deze omvang niet vastleggen is een onnodig risico, en op een
eigen branch raakt het de productiebranch en de Vercel-deploy niet.

Structuur:
1. **Scan-tabel** bovenaan: ID, titel, risico (Hoog/Midden/Laag/Cosmetisch), type (Wft-risico,
   Rekenfout, Modelaanname, Codekwaliteit, Content, Proces, Cosmetisch), moeite (S/M/L),
   afhankelijkheid, status.
2. **Per bevinding een detailkaart**: wat er mis is (bestand:regel), waarom het uitmaakt, voorstel
   (soms met een A/B-keuze inclusief korte afweging), betrokken bestanden. Voor elke hoge bevinding
   daarbovenop één regel **"wat een bezoeker hierdoor verkeerd concludeert"** in gewone taal, zodat
   de impact leesbaar is zonder de code erbij.
3. **"Al in orde"-bevindingen** kort vermeld, zonder het volledige template.
4. **Afsluitend drie beslisgroepen** in plaats van een lijst van dertig items: (1) nu fixen, geen
   discussie nodig, (2) besluit van Hendrik nodig, met de vraag expliciet geformuleerd, (3) bewust
   niet fixen, met de reden erbij. Plus een voorgestelde fix-volgorde die de afhankelijkheden
   respecteert (F1 vóór A7 en B4, A1 vóór E4 en E5, G1 vóór alle rekenkernwijzigingen).

---

## Kritieke bestanden

`src/utils/pensionCalc.ts`, `src/utils/monteCarlo.ts`, `src/utils/jaarruimte.ts`,
`src/utils/downloadLimit.ts`, `src/utils/exportExcel.ts`, `src/utils/exportPDF.ts`,
`src/config/fiscaleParameters.ts`, `src/config/risicoprofielen.ts`,
`src/components/PensionPlanner/{index,InputPanel,ResultsPanel,WealthChart}.tsx`,
`src/components/BrutoNetto/index.tsx`, `src/components/Jaarruimte/index.tsx`,
`src/components/Inflatie/index.tsx`, `src/pages/privacy.astro`, `src/content/uitleg/*.md(x)`,
`package.json`, `DESIGN_SYSTEM.md`, `HANDOFF-herstijling-2026.md`.

Alleen lezen, niet wijzigen, want buiten de projectmap:
`~/.claude/skills/jaarruimte-berekening/references/parameters.md`. Als F1 uitwijst dat de skill
fout zit, is het corrigeren daarvan een **aparte opdracht met eigen akkoord**, geen onderdeel van
deze fix-ronde. De skill raakt Hendriks advieswerk, niet alleen de site.

---

## Verificatie en oplevering

- Elke live-test (Fase 3) levert een concreet, reproduceerbaar scenario op: welke invoer, wat er
  gebeurde. Geen "leek in orde" zonder bewijs.
- Elke externe claim (Fase 2) krijgt een primaire bron met URL en datum van raadpleging.
- Elke rekenkundige claim in het rapport (de ordes van grootte bij E2 tot en met E9) krijgt de
  tussenstappen erbij, zodat Hendrik ze kan narekenen in plaats van geloven.
- Het eindrapport bevat geen bevinding zonder verwijzing naar bestand en regel, of voor content
  naar artikel en regel.
- Bevindingen op de simulatie worden alleen opgenomen als het effect groter is dan de meetruis van
  2.000 paden.
- Na oplevering wordt er niets gefixt totdat Hendrik per item of per risicogroep akkoord geeft.
