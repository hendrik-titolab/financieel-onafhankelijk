# Hand-off voor Claude Chat — contentsessie benikfinancieelonafhankelijk.nl

Je werkt vandaag met Hendrik Schakel aan de content voor **benikfinancieelonafhankelijk.nl**.
Deze hand-off geeft je alle context om koud te starten; je hebt geen toegang tot de repo, dus
alles wat je nodig hebt staat hieronder. Lever je output zó aan dat het in de bestaande site
(Astro, Content Collections) direct in te plakken is — het exacte formaat staat in §3.

---

## 1. Het project in het kort

- **Wat:** een groeiende kennisautoriteit over vermogensopbouw, pensioen en financiële
  onafhankelijkheid, met **gratis uitleg + rekentools**.
- **Positionering:** neutrale, betrouwbare autoriteitssite die (subtiel) betaalde
  Titolab-producten voedt. Titolab is de stille uitgever.
- **Verdienmodel:** B2B-gedreven (adviseurstooling, leads, later abonnement). Doel:
  kennisautoriteit met ~€2 mln verkoopwaarde in ~5 jaar.
- **Publiek:** breed publiek én financieel adviseurs. Iemand die "ben ik financieel
  onafhankelijk" googelt moet het snappen.
- **Techniek (achtergrond):** Astro-site, content in Markdown (Content Collections). Staat nu
  op een preview-branch, nog niet op het echte domein.

---

## 2. De vier doelen van vandaag

### Doel 1 — Hendriks schrijfstijl vastleggen in een herbruikbare *skill*
Maak Hendriks stem "geheel eigen" via een iteratieve lus **test → evalueer → bijstellen → test**:

1. **Verzamel input.** Vraag Hendrik om: 2–4 stukjes eigen tekst die goed "klinken", zijn
   bestaande stijlgids (indien er een is), en een lijst van zijn overtuigingen + favoriete
   manieren om iets uit te leggen.
2. **Extraheer een stijlprofiel** en giet het in een *skill* (formaat in §5): stem/toon,
   zinsbouw & ritme, woordkeus, signature-moves, do's en don'ts.
3. **Test:** schrijf een korte passage of miniartikel mét de skill.
4. **Evalueer:** laat Hendrik scoren — wat landt, wat niet, welk woord/ritme klopt niet.
5. **Stel de skill bij** en test opnieuw op een *nieuw* onderwerp. Herhaal tot het
   betrouwbaar "als Hendrik" klinkt. Bevries dan v1.

> **Belangrijke spanning om met Hendrik te beslissen:** de site is tot nu toe strikt
> **neutraal en B1** geschreven. Hendrik wil er nu zijn **persoonlijke stem en overtuigingen**
> in. Definieer samen de mengverhouding: toegankelijk (B1) + herkenbaar Hendrik + binnen de
> guardrails (§4). Overweeg twee registers in één skill: (a) de neutrale *huisstem* voor
> uitleg, (b) een *opiniestem* voor stukken met een standpunt (altijd onderbouwd, nooit als
> direct advies).

**Portabiliteit:** schrijf de skill als zelfstandig Markdown-bestand, zodat het bruikbaar is
als Claude-skill, als project-/custom-instructie in elke Claude-omgeving, én als
custom-instructie of Custom GPT in ChatGPT.

### Doel 2 — Content "in de steigers" + strategie uitwerken
Werk de **content-pillars** uit, doorspekt met Hendriks persoonlijke overtuigingen en zijn
manieren om dingen te vertellen. Per pillar: de invalshoek van de pillar-pagina + een lijst
clusteronderwerpen (mogen stubs zijn). Leg terugkerende "signature-uitleggen" vast (zie de
voorbeelden in §6) zodat ze consequent terugkomen.

### Doel 3 — 15 kant-en-klare artikelen + hand-off voor Claude Code
Lever **15 afgeronde artikelen** op in het formaat van §3 (elk als één Markdown-codeblok, klaar
om te plakken). Sluit af met een korte **"hand-off voor Claude Code"** die vermeldt: welke
nieuwe pillars aangemaakt moeten worden, de 15 bestanden (slug · pillar · volgorde), eventuele
nieuwe tool-CTA's, en aandachtspunten voor interne links. Claude Code zet ze dan in de site,
regelt navigatie + structured data, bouwt en deployt naar de preview.

### Doel 4 — Daarna: SEO, GEO en overige optimalisatie
Ná het deployen van de 15 artikelen (dat doet Claude Code) volgt de optimalisatiefase:
keyword-validatie via Search Console, GEO-check (citeren LLM's ons?), interne-link-audit,
meta/OG-fijnslijpen, performance, nieuwsbrief-capture en een "voor adviseurs"-pagina. **Niet
voor vandaag** — vandaag draait om doel 1–3.

---

## 3. Artikelformaat (zo lever je aan — drop-in voor de site)

Elk artikel = één Markdown-bestand met deze frontmatter, gevolgd door de body. Houd je exact
aan de veldnamen.

```markdown
---
titel: "<de zoekvraag — wordt de H1 en basis voor de SEO-title>"
beschrijving: "<meta description, ~140–160 tekens>"
samenvatting: "<kort antwoord bovenaan de pagina, 2–4 zinnen — 'answer-first'>"
pillar: "<slug van de pillar>"        # weglaten als DIT de pillar zelf is
isPillar: false                        # true als dit een pillar-pagina is
volgorde: 1                            # sorteervolgorde binnen de pillar/hub
bijgewerkt: "2026-07-20"
tool:                                  # optioneel — link naar een rekentool
  label: "<CTA-tekst>"
  href: "/ben-ik-financieel-onafhankelijk"
faq:
  - vraag: "..."
    antwoord: "..."
bronnen:
  - titel: "..."
    url: "https://..."
---

Korte inleiding (1–2 zinnen).

## Eerste subkop
Tekst met interne links, bijv. [de 4%-regel](/uitleg/wat-is-de-4-procent-regel).

## Tweede subkop
...
```

**Vaste regels per artikel:**
- Eén zoekvraag per pagina; de **titel is die vraag** (H1).
- Kort antwoord bovenaan (`samenvatting`) — dit is wat Google/LLM's citeren.
- 3–5 `##`-subkoppen; korte alinea's; taalniveau **B1** als basis.
- Sluit af met een **FAQ** (2–3 vragen) en **bronnen** (stabiele URL's).
- Interne links naar de pillar, zusterartikelen en (waar kan) een rekentool.
- Slug = bestandsnaam zonder extensie, in kebab-case (bijv. `wat-zijn-aandelen`).

---

## 4. Guardrails (niet overtreden)

- **Geen persoonlijk financieel advies** (Wft-grens). Alles is educatief en indicatief.
  Overtuigingen mogen — maar als *onderbouwd inzicht*, nooit als directief ("doe dit / doe dit
  niet"). Voorbeeld: niet "koop geen crypto", wél "voor de meeste mensen niet nodig, en dit is
  waarom".
- **Neutraliteit blijft de basis**, ook met Hendriks stem erover. Autoriteit vereist gevoelde
  onafhankelijkheid.
- **Bronnen:** noem alleen echte, stabiele bronnen (CBS, DNB, Nibud, AFM, Belastingdienst, SVB,
  mijnpensioenoverzicht.nl, Wikipedia voor concepten). **Verzin geen URL's.**
- **Fiscale precisie:** exacte belastingcijfers/heffingskortingen/AOW-bedragen staan centraal in
  de repo-config en veranderen jaarlijks. Houd bedragen in artikelen **algemeen** of markeer ze
  als "controleren", zodat Claude Code ze aan de config kan koppelen. Noem geen precieze
  percentages/bedragen tenzij Hendrik ze bevestigt.
- **Toon:** toegankelijk, niet betuttelend, geen verkooppraat.

---

## 5. Formaat van de schrijfstijl-skill (doel 1)

Lever de skill als één Markdown-bestand met deze structuur:

```markdown
---
name: schrijfstijl-hendrik-schakel
description: Gebruik deze stijl bij het schrijven of redigeren van content voor
  benikfinancieelonafhankelijk.nl (en aanverwante financiële content van Hendrik Schakel).
---

# Schrijfstijl Hendrik Schakel

## Wanneer gebruiken
## Stem & toon
## Zinsbouw & ritme
## Woordkeus (voorkeur / vermijden)
## Signature-moves (met voorbeelden)
## Structuurregels (answer-first, B1, koppen, FAQ)
## Guardrails (geen advies, bronnen, neutraliteit)
## Voorbeeld: zwakke versie → Hendrik-versie
```

Houd het generiek genoeg om ook in ChatGPT te plakken (geen Claude-specifieke syntax in de body).

---

## 6. Wat al bestaat (niet dupliceren) + signature-voorbeelden

**Live pillars & clusters (9 artikelen):**
- Pillar `wat-is-financiele-onafhankelijkheid` → clusters:
  `hoeveel-geld-financieel-onafhankelijk`, `wat-is-de-4-procent-regel`, `wat-is-fire`,
  `hoeveel-sparen-om-eerder-te-stoppen`, `waarvan-hangt-financiele-onafhankelijkheid-af`.
- Pillar `hoeveel-pensioen-heb-ik-nodig` → clusters: `hoeveel-aow-krijg-ik`,
  `wat-is-een-pensioentekort`, `wat-is-jaarruimte`.

**Rekentools (voor de `tool`-CTA en interne links):**
- Planner → `/ben-ik-financieel-onafhankelijk`
- Bruto-netto → `/bruto-netto`
- Jaarruimte → `/tools/jaarruimte`

**Nog aan te maken pillars (voor de 15 artikelen):** *Beleggen* (sterkste funnel), *Inflatie &
koopkracht*, *Salaris & belasting*. Plus verdieping van FO en Pensioen.

**Signature-uitleggen die al werken (stijl-ankers om door te trekken):**
- Financiële onafhankelijkheid = een **verhouding**, geen bedrag ("met €0 uitgaven ben je met
  €1 al onafhankelijk").
- "**Cash is niet risicoloos**" — inflatie holt spaargeld uit.
- Flexibiliteit in uitgaven als onderschatte, krachtige factor.
- Altijd: kort antwoord eerst, dan pas de nuance.

**Suggestie voor de 15 (Hendrik kiest):** ~5 Beleggen (o.a. *wat zijn aandelen*, *wat zijn
obligaties*, *sparen of beleggen*, *indexfondsen/ETF's*, *rendement en risico*), ~3 Inflatie
(o.a. *hoe inflatie rijke mensen arm maakt*), ~2 Salaris & belasting (o.a. *box 3 op
spaargeld*), ~3 FO-verdieping (o.a. *eigen woning en FO*, *in het buitenland wonen voor je
pensioen*, *FO als zzp'er*), ~2 Pensioen (o.a. *pensioen opbouwen als zzp'er*, *wat is de
Wtp*). Voll­edige ideeënlijst zit in de repo (`CONTENT-BACKLOG.md`) — Hendrik kan die inbrengen.

---

## 7. Wat je aan het eind oplevert (terug naar Claude Code)

1. **De schrijfstijl-skill** (SKILL.md-tekst, v1, na de test-lus).
2. **Pillar-strategie** kort: per pillar de invalshoek + clusterlijst + Hendriks
   overtuigingen/aanpak.
3. **15 artikelen**, elk als één Markdown-codeblok in het formaat van §3.
4. **Hand-off voor Claude Code:** lijst van nieuwe pillars (voor nav), de 15 bestanden
   (slug · pillar · volgorde), nieuwe tool-CTA's, en interne-link-aandachtspunten.

Claude Code plaatst de bestanden, breidt de navigatie uit, controleert links + structured data,
bouwt en deployt naar de preview. Daarna start doel 4 (SEO/GEO).

---

*Meenemen naar de sessie, Hendrik:* je schrijfsamples, je bestaande stijlgids (indien aanwezig),
je overtuigingen-lijst, en welke ~15 onderwerpen je als eerste wilt.
