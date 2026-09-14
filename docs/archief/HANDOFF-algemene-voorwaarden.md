# Hand-off — algemene voorwaarden benikfinancieelonafhankelijk.nl

Overdracht: 10 augustus 2026. Doel: een nieuwe sessie kan hiermee koud verder, met als
eerste actiepunt de algemene voorwaarden van de site.

---

## 0. Voor je begint

- Repo: `C:\Users\schak\financiele-planning` (**niet** `beleggingsplatform`, dat is een
  ongerelateerd, nog leeg plan voor een heel ander merk — meerdere eerdere sessies zijn daar
  per ongeluk in gestart).
- Werk op branch **`astro-migratie`**. `main` is nog live in productie met de oude React-SPA;
  de cutover is voorbereid maar nog niet uitgevoerd. Blijf op `astro-migratie` werken tenzij
  je hoort dat de cutover inmiddels is gedaan.
- Deze sessie werkte in een losse **git-worktree**
  (`.../scratchpad/astro-migratie-worktree`, buiten de hoofdrepo) om tegelijk op `main` en
  `astro-migratie` te kunnen werken. Check bij een nieuwe sessie met `git worktree list` of
  die nog bestaat en nog op `astro-migratie` staat, of maak een nieuwe aan/werk gewoon in de
  hoofdrepo na een `git checkout astro-migratie`.
- Lees ook de bestaande hand-off-documenten in de repo-root: `HANDOFF-website.md`
  (architectuur/keuzes), `HANDOFF-content-claude-chat.md` (contentstrategie,
  schrijfstijl-skill), `HANDOFF-artikel-plaatsen.md` (hoe je een artikel correct plaatst),
  `HANDOFF-content-vormgeving.md` (vorige overdracht), `CONTENT-BACKLOG.md`
  (onderwerpenlijst), `SCHRIJFGIDS.md` (schrijfstijl, vandaag nog aangescherpt, zie §2).

## 1. Status na deze sessie (10 augustus 2026)

Vijf commits gepusht naar `astro-migratie`:

- `CONTENT-BACKLOG.md` gecorrigeerd naar de werkelijke stand: de backlog liep achter op de
  repo (artikelen die al live stonden, stonden nog als concept/idee).
- Nieuw artikel **"Hoe hoog kan inflatie worden?"**
  (`/uitleg/hoe-hoog-kan-inflatie-worden`, pillar `wat-is-inflatie`). Behandelt waarom
  inflatie ontstaat, hoe hoog de inflatie in Nederland ooit was (1975 vs. 2022, CBS), en
  hyperinflatie als uiterste (Duitsland 1923, Argentinië 1989, Zimbabwe 2008, bron:
  Hanke & Krus 2012, Cato Working Paper). Cijfers stuk voor stuk nagetrokken bij CBS en de
  Hanke-Krus-tabel, niet uit het hoofd ingevuld. Tekst is Hendriks eigen herschrijving van
  een Claude-concept.
- **`SCHRIJFGIDS.md` aangescherpt** met twee regels, gedestilleerd uit de vergelijking tussen
  het Claude-concept en Hendriks herschrijving:
  - Bij een uitlegartikel met een definitievraag als titel mag de openingszin een platte
    definitie zijn i.p.v. de standaard wending-opening. Bij een opiniestuk niet.
  - Een harde CTA mag, maar alleen op het punt waar de lezer al naar de eigen situatie is
    gebracht, niet als vaste afsluitformule.
  - **Let op:** deze twee regels staan alleen in de repo-versie van de schrijfgids. De
    Drive-master ("Schrijfgids Hendrik Schakel (definitief)") werkt Hendrik daar zelf op bij
    (er is geen tool om een bestaand Google Doc programmatisch te bewerken). Check bij twijfel
    of dat inmiddels is gebeurd, anders lopen de twee installaties uit elkaar.
- Backlog-item "Wat doet inflatie met je spaargeld?" is afgevinkt: beantwoord door
  bovenstaand artikel, met een andere hoek dan oorspronkelijk gepland (geschiedenis en
  hyperinflatie i.p.v. spaargeld-mechaniek, die hoek zat al in "Sparen maakt mensen arm").

## 2. Eerste actiepunt: algemene voorwaarden

Hendrik wil de site voorzien van **algemene voorwaarden, inclusief een stuk over waarom de
FO-planner-tool is gemaakt.** Verder gaf hij geen scope mee. Begin dus met vragen, niet met
schrijven:

- Voor welke onderdelen van de site gelden de voorwaarden? Alleen de FO-planner, of ook de
  andere tools (bruto-netto, jaarruimte) en de content?
- Is dit een juridisch document (aansprakelijkheid, gebruiksvoorwaarden) met een apart "waarom
  deze tool"-stuk ernaast, of moet dat verhaal in de voorwaarden zelf verweven worden?
- Wie beoordeelt de juridische tekst voordat die live gaat? Dit raakt de Wft-grens
  (educatief/indicatief, geen persoonlijk advies) die voor de hele site geldt: onjuiste of te
  stellige formuleringen zijn hier geen stijlfout maar een risico.
- Bestaat er al een vergelijkbaar document (bijv. de privacypagina, `/privacy`, toegevoegd in
  een eerdere sessie) waarvan toon en structuur hergebruikt kunnen worden?

Schrijf zelf geen voorwaarden-tekst zonder deze vragen eerst te stellen.

## 3. Blijvende randvoorwaarden

- Rekenlogica en fiscale cijfers niet aanraken zonder expliciet akkoord.
- Content-claims, cijfers, bronnen: nooit verzinnen, altijd nagerekend of bronvermeld.
- Wft-grens: educatief/indicatief, nooit persoonlijk financieel advies.
- Merk (Titolab) blijft subtiel: alleen de kleinste footerregel + JSON-LD.
- Nieuwe content-pagina's komen automatisch in de sitemap zodra gepusht. Bouw, test lokaal in
  een browser (niet alleen de build-output), toon de tekst aan Hendrik, pas dan pushen.
- Geen cutover naar `main` tenzij Hendrik dat op dát moment expliciet vraagt.
- Nog open uit een eerdere sessie, nog niet geverifieerd: Hendrik moet Web Analytics nog
  aanzetten in het Vercel-dashboard (Project → Analytics → Enable).
