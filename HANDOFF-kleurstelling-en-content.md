# Hand-off — kleurstelling + uitbreiding content (artikelen en video's)

Overdracht: 10 augustus 2026, na de PWA-installatie-sessie. Doel: een nieuwe sessie kan
hiermee direct starten met kleurstelling en content, zonder eerst de hele dag opnieuw te
moeten doorlopen.

---

## 0. Status vóór je begint

`astro-migratie` is de live productiebranch (sinds de cutover op 10 augustus), ook de
GitHub-default-branch. `main` is gearchiveerd (`ARCHIVED.md` erop). PWA-installatie,
Search Console (hendrik@titolab.nl is nu Eigenaar) en Bing Webmaster Tools zijn vandaag
afgerond en geverifieerd. Zie `HANDOFF-app-installatie.md` voor die details, niet
relevant voor deze twee nieuwe taken.

Werk in `C:\Users\schak\financiele-planning`, branch `astro-migratie`.

**Belangrijk, geldt voor beide taken hieronder:** kleurkeuzes en content-onderwerpen zijn
merk-/positioneringskeuzes van Hendrik. Niet zelf invullen of alvast een richting kiezen,
ook niet als het antwoord voor de hand lijkt te liggen. Eerst vragen.

---

## 1. Kleurstelling

**Huidige staat** (`tailwind.config.js`): één enkele "primary"-kleurschaal (blauw), en
zelfs die is onvolledig — alleen 50/100/500/600/700 zijn gedefinieerd, geen 200/300/400/
800/900. Verder leunt de site volledig op Tailwind's standaard `slate`-grijzen voor tekst
en achtergronden. Er is geen secundaire of accentkleur. Dit is dus geen "klein tintje
bijstellen", eerder een vrij dunne basis die waarschijnlijk een echte uitbreiding nodig
heeft, afhankelijk van wat Hendrik voor ogen heeft.

**Eerste vraag aan Hendrik, vóór er iets gebouwd wordt:** wat is het doel van deze
wijziging? Bijvoorbeeld:
- Verfijning van de bestaande blauwe basis (missende tinten aanvullen, consistenter maken)
- Een echte herziening van het kleurenpalet (nieuwe primary/secundaire/accentkleur)
- Aansluiten bij een merk/logo dat al ergens vastligt (bijv. voor Titolab of de
  HendrikSchakel Holding-huisstijl, als die bestaat)

**Werkwijze:** Hendrik maakt mockups/moodboards liever zelf met **Claude Design** dan met
een HTML-artifact van mij. Bij een vraag om een visuele vergelijking of stijlvoorstel dus
niet automatisch een artifact bouwen — eerst checken of hij dat zelf via Claude Design wil
doen, of dat hij toch een artifact van mij wil.

**Technisch, ter oriëntatie (niet meteen aanpassen):** de kleur wordt gebruikt via
Tailwind-classes (`text-primary-600`, `bg-primary-50`, etc.) verspreid over componenten
in `src/components/`. Een paar losstaande hardcoded hex-kleuren staan ook in JS/TS,
bijvoorbeeld de `SuccessGauge`-kleuren in `ResultsPanel.tsx` (`#059669`/`#d97706`/
`#dc2626` voor goed/redelijk/risicovol) en de PWA-manifest `theme_color`
(`src/integrations/pwa.mjs`, ook `#2563eb` — moet in de pas blijven met de site als de
primary-kleur verandert).

---

## 2. Content: artikelen

`CONTENT-BACKLOG.md` (repo-root, deze branch) bestaat al en is uitgebreid: vijf pillars,
elk met 💡-ideeën klaar om te schrijven. Kort per pillar wat er nog open staat:

- **Wat is financiële onafhankelijkheid?** — 4 losse idee-artikelen (eigen woning, in het
  buitenland wonen, zzp'er, AOW-overbrugging).
- **Hoeveel pensioen heb ik nodig?** — 2 idee-artikelen (zzp-pensioen, Wtp).
- **Beleggen** *(nieuw pillar, expliciet gemarkeerd als "sterkste funnel naar het
  beleggingsplatform")* — verreweg de grootste hoeveelheid open ideeën, 10+ stuks, plus 2
  nieuwe rekentools op de roadmap (samengestelde rente, "hoeveel moet ik maandelijks
  beleggen"). **Let op**: dit is de contentpijler die naar het aparte, nog ongebouwde
  "beleggingsplatform"-merk moet gaan cross-promoten — dat platform bestaat nu alleen als
  plan (`C:\Users\schak\beleggingsplatform\PLAN.md`), nog geen code. Niet aannemen dat die
  cross-promotie-link al ergens technisch klaarstaat.
- **Beleggen, met een ⚠️-markering**: "Beleggen in crypto, vastgoed, crowdfunding, goud,
  olie" heeft een expliciete notitie: *"Bespreken vóór schrijven"* — niet zomaar oppakken
  zonder dat gesprek eerst te voeren.
- **Inflatie & koopkracht** — 1 idee-artikel (reëel vs. nominaal rendement).
- **Salaris & belasting** — 4 idee-artikelen, gekoppeld aan de bestaande bruto-nettotool.

**Eerste vraag aan Hendrik:** met welke pillar/welke artikelen wil hij beginnen, en is de
⚠️-markering bij het crypto/vastgoed-artikel al besproken of nog niet.

**Format om te volgen** (uit een eerdere sessie, zie
[[benikfinancieelonafhankelijk-voice-en-status]] in mijn geheugen, en `SCHRIJFGIDS.md` in
deze repo): sectie "Websiteteksten / long read (breed publiek)" — B1-B2, vakwoorden
omschreven, rekenvoorbeelden als bewijs, geen harde CTA aan het eind, geen em-dashes.

---

## 3. Content: video's

Dit is volledig open, bewust nog niet ingevuld in een eerdere sessie ("geen
contentplan/hostingplatform bekend, zou een lege/dunne pagina worden — wachten tot er
concrete video's en een platformkeuze zijn"). Er staat nog niets over video's in
`CONTENT-BACKLOG.md`.

**Vragen die eerst beantwoord moeten worden, vóór er iets gebouwd wordt:**
1. Wie maakt de video's, en zijn er al concept-video's of moet dit vanaf nul?
2. Welk platform: YouTube, Vimeo, of zelf hosten? Zie onderstaande vergelijking.
3. Wat voor format (korte uitlegvideo's per rekentool/artikel? langere content?) en hoe
   vaak?
4. Komt er een eigen `/videos`-hub (aparte navigatie-ingang, zoals Tools/Uitleg), of
   worden video's ingebed bij bestaande artikelen?

**Platformvergelijking, ter voorbereiding (onderzocht, nog geen keuze gemaakt):**

| | YouTube | Vimeo |
|---|---|---|
| Kosten | Gratis, onbeperkt | Betaald: Standard-tier rond $20/mnd voor unlimited storage, wachtwoordbeveiliging en een aangepaste embed-player |
| Advertenties op de embed | Ja, niet zelf te controleren | Nee, op betaalde tiers |
| Branding/uitstraling | Vast: YouTube-logo, related videos aan het eind | Volledig aanpasbaar: eigen kleuren, logo, geen Vimeo-branding op betaalde tiers |
| Bereik/vindbaarheid | Sterk: eigen zoekmachine, discovery | Geen eigen ontdekkingsmechanisme |
| Limiet | Geen | 2TB bandbreedte/maand gedeeld over alle self-serve tiers (sinds een prijsherziening in 2026) |

Gangbare aanpak bij bedrijven: **beide combineren** — YouTube voor bereik/vindbaarheid als
apart kanaal, Vimeo voor de nette, reclamevrije embed op de eigen site. Voor een site die
nog geen enkele video heeft, is dat waarschijnlijk over-engineered als eerste stap; een
pragmatische start (bijv. alleen YouTube, geen kosten, later heroverwegen) ligt meer voor
de hand, maar dat is aan Hendrik.

Sources: [YouTube vs Vimeo for Business — Swarmify](https://swarmify.com/blog/youtube-vs-vimeo-for-business/), [Vimeo Pricing 2026 — UniLink](https://www.unilink.us/blog/vimeo-pricing-plans-2026), [Vimeo vs YouTube: Full Platform Comparison (2026 Data) — Green Frog Labs](https://greenfroglabs.com/blog/vimeo-vs-youtube)

---

## 4. Blijvende randvoorwaarden (ongewijzigd)

- Content-claims, cijfers, bronnen: nooit verzinnen, altijd nagerekend of bronvermeld.
- Wft-grens: educatief/indicatief, nooit persoonlijk financieel advies.
- Merk (Titolab) blijft subtiel: alleen de kleinste footerregel + JSON-LD.
- Nieuwe pagina's/wijzigingen: altijd lokaal bouwen én in de browser testen vóór pushen.
- Bij tekst met een link erin: check op de bekende ontbrekende-spatie-bug (Astro/JSX
  collapt witruimte tussen tekst en een `<a>`/`{expressie}` op de volgende regel zonder
  expliciete `{' '}`).
