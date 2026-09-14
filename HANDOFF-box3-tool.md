# Handoff: box 3-rekentool

Geschreven 8 september 2026, voor een aparte chatsessie. Besluit Hendrik: eerst deze tool bouwen,
daarna pas het volledige box 3-model in de FO-planner.

## Waarom deze tool

Twee redenen, en de tweede is de belangrijkste.

**Er is vraag naar.** `CONTENT-BACKLOG.md` heeft "Hoeveel belasting betaal ik over mijn spaargeld
en beleggingen? (box 3)" al als idee staan. Zeven uitlegartikelen verwijzen naar box 3, en er is
geen enkel artikel dat het uitlegt. Een rekentool plus artikel vult dat gat.

**Het lost openstaand punt 2 van de FO-planner op.** `src/utils/box3.ts` is expliciet als
vervangpunt ontworpen: `pensionCalc.ts` en `monteCarlo.ts` kennen alleen `nettoNominaalRendement()`
en verder niets van box 3. Bouw je hier een correcte motor, dan kan de planner die daarna
consumeren zonder dat de rekenkern verandert. Dat is de goede volgorde, en het is de reden dat de
planner nu nog een invulbaar percentage gebruikt in plaats van een half model.

## Scope: forfait én tegenbewijs

Beide kanten uitrekenen en tonen welke gunstiger is.

Alleen het forfait rekenen geeft iedereen met een tegenvallend rendement een te hoog bedrag. Sinds
de arresten van de Hoge Raad mag je aantonen dat je werkelijke rendement lager was dan het
forfait, en dan telt het werkelijke. Een rekentool die dat weglaat is niet onvolledig maar
misleidend, en juist die vergelijking is de vraag waar mensen mee zitten.

## Lees dit eerst, het is het grootste risico

**Over de tegenbewijsregeling staat nul in deze repo.** Een grep over de hele repo op
`tegenbewijs`, `overbruggingswet`, `wet werkelijk rendement` en `WWR` geeft geen enkele treffer.
De term "werkelijk rendement" komt vier keer voor, telkens als reden om iets níet te bouwen.

Dit is op dit moment het meest betwiste onderdeel van de Nederlandse belastingheffing. Neem
niets aan, ook niet wat plausibel klinkt. Alles moet met bronvermelding, en volgens de werkwijze
in `CLAUDE.md` horen fiscale cijfers in de bron thuis en niet in de code:

> `C:\Users\schak\Documents\Fiscale bron\fiscale-cijfers.json`, waarde aanpassen, `node genereer.mjs`
> draaien in die map, en de gewijzigde config hier committen.

### Wat er in die bron bij moet, vóórdat er code komt

1. **De toerekeningsformule van forfaitair voordeel naar belastbaar bedrag.** Dit staat al als
   open punt onder `box3._ontbreekt` en is genoemd in `docs/archief/HANDOFF-volgende-week.md`. Zonder dit kan
   de tool niet af: je kunt wel het forfaitaire voordeel per categorie berekenen, maar niet wat er
   uiteindelijk belast wordt.
2. **De schuldendrempel.**
3. **De tegenbewijsregeling.** Wat telt als werkelijk rendement, of ongerealiseerde
   waardeontwikkeling meetelt, over welke jaren het kan, en welk formulier of welke procedure
   erbij hoort.
4. **Peildatum en status per waarde**, zoals de bron dat al doet ("voorlopig" versus "definitief").

## Wat er al klaarstaat

**`src/config/fiscaleParameters.ts`**, blok `BOX3`, met bron in
`docs/archief/AUDIT-fase2-externe-bronnen.md` sectie 3 (Belastingdienst, geraadpleegd 12 augustus 2026):

```ts
export const BOX3 = {
  tarief: 0.36,
  heffingsvrijVermogen: { alleenstaand: 59_357, fiscaalPartnersSamen: 118_714 },
  forfaitairRendement: { spaargeld: 0.0128, beleggingen: 0.06, schulden: 0.027 },
} as const
```

Let op: spaargeld 1,28% en schulden 2,70% zijn **voorlopig**, beleggingen 6,00% is definitief. Dat
onderscheid hoort in de tool zichtbaar te zijn.

**Het commentaar boven dat blok klopt niet meer.** Er staat "Nog niet in gebruik. Staat klaar voor
E2", terwijl `box3.ts` het sinds september 2026 gebruikt. Corrigeren in de bron, niet in het
gegenereerde bestand.

**`src/utils/box3.ts`** met `box3HeffingPerJaar()`, `geschatteBox3Druk()`, `box3DrukAfgerond()` en
`nettoNominaalRendement()`, plus tests in `src/utils/__tests__/box3.test.ts` die de bedragen
vastleggen (€ 878 bij € 100.000, € 20.318 bij € 1.000.000). Die functies gaan uit van één
vermogensbedrag en het beleggingsforfait; de nieuwe tool heeft een rijker model nodig en mag deze
vervangen, mits de bestaande tests blijven kloppen of bewust worden bijgesteld.

**Herbruikbaar:** `src/utils/bedrag.ts` voor alle invoervelden (Nederlandse notatie, tekstveld met
`inputMode="decimal"`, zie audit-bevinding 8), en `src/config/modelVersie.ts` voor de
modelversie- en peildatumstempel onder het resultaat.

## Bouwpatroon

De Inflatie-tool is de maatstaf: **359 regels** in één `src/components/Inflatie/index.tsx`, met
een duidelijke vierdeling (presentatie-helpers, rekenlogica, subcomponenten, hoofdcomponent),
vier `useState`-hooks en live herberekening zonder knop. Geen tests, geen localStorage.

Vergelijk `src/components/Jaarruimte/index.tsx`: 945 regels, mét opslag en validatie. Een box
3-tool zit daar waarschijnlijk tussenin.

Concreet:

1. `src/components/Box3/index.tsx` — de tool.
2. `src/pages/tools/box3.astro` — circa 50 regels, kopieer de opzet van
   `src/pages/tools/jaarruimte.astro`: `title`/`description`, een `faq`-array, `articleSchema` +
   `faqSchema` + `breadcrumbSchema` uit `src/lib/seo.ts`, en het eiland met `client:only="react"`.
   Zet wél een `canonical`, dat doen `jaarruimte.astro` en `inflatie.astro` allebei niet.
3. Eén object toevoegen aan de `tools`-array in `src/pages/tools/index.astro`. Dat voedt zowel de
   kaartjes als de `itemListSchema`. `Header.astro` hoeft niet aangepast: alles onder `/tools/`
   krijgt vanzelf de actieve staat.
4. De rekenlogica in `src/utils/box3.ts` en niet in het component, anders dan bij Inflatie. Deze
   berekening moet getest worden en moet later door de planner te gebruiken zijn.

## Voorstel voor de invoer

Naar het model van de jaarruimtetool, die ook een fiscale berekening met veel velden is.

- Peildatum 1 januari van het belastingjaar, met een jaarkeuze zoals bij jaarruimte.
- Bank- en spaartegoeden, beleggingen en overige bezittingen, schulden: elk apart, want ze hebben
  elk hun eigen forfait.
- Fiscaal partner ja/nee, want dat verdubbelt het heffingsvrije vermogen.
- Voor het tegenbewijs: het werkelijke rendement over dat jaar, met een toelichting over wat
  daar wel en niet in hoort.

En als uitkomst: het forfaitaire bedrag, het bedrag volgens werkelijk rendement, welke van de
twee geldt, en het verschil. Plus de modelstempel en de bronstatus per parameter.

## Terugkoppeling naar de FO-planner

Als de motor klopt, vervang je in `src/utils/box3.ts` de functie `geschatteBox3Druk()` door een
echte jaarlijkse heffing over het actuele vermogen, aangeroepen in de kasstroomlus van
`pensionCalc.ts` en `monteCarlo.ts`.

Het invoerveld in de planner blijft bestaan maar wordt dan een keuze in plaats van de enige route:
`vermogensbelastingHandmatig` in `PensionInputs` schakelt nu al tussen "volg de schatting" en
"ik vul het zelf in". Dat wordt "reken het echt uit" tegenover "ik vul het zelf in".

Let op bij die stap: de heffing hoort dan per jaar over het dán actuele vermogen te lopen, niet
als vast percentage over de hele looptijd. Dat is precies wat de audit als vereenvoudiging
aanmerkte.

## Wat de tool níet moet doen

- Geen persoonlijk fiscaal advies. Wft-grens, zoals overal op deze site: educatief en indicatief.
- Geen aangifte invullen of nabootsen.
- Niet suggereren dat de uitkomst een aanslag is. Zeker bij het tegenbewijs is het een indicatie
  waarmee iemand naar zijn adviseur of de Belastingdienst gaat.

## Checklist voor de opvolger

- [ ] Bron aanvullen in `fiscale-cijfers.json` (de vier punten hierboven), `node genereer.mjs`
      draaien, gewijzigde config committen
- [ ] Commentaar boven `BOX3` corrigeren in de bron
- [ ] Rekenlogica in `src/utils/box3.ts` met tests die de bedragen handmatig narekenen, zoals de
      andere fiscale tests in deze repo doen
- [ ] Component, pagina, en het object in de `tools`-array
- [ ] Uitlegartikel `hoeveel-belasting-betaal-ik-over-mijn-vermogen.md` volgens het zod-schema in
      `src/content.config.ts` (`titel`, `beschrijving`, `samenvatting`, `bijgewerkt` verplicht)
- [ ] `CLAUDE.md` bijwerken: van vier naar vijf rekentools
- [ ] Releasepoort groen: `tsc --noEmit`, `astro check`, `vitest run`, build
