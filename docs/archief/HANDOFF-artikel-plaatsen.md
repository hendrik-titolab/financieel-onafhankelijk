# Hand-off — artikel plaatsen op benikfinancieelonafhankelijk.nl (+ content-library)

Voor een **nieuwe Claude Code-sessie** (met repo-toegang). Doel: een door Hendrik geplakt
artikel op een logische plek in de site zetten, bouwen en naar de preview deployen. Onderaan
(§3) staat de eis voor een **content-library** waarin Hendrik zelf inlogt om na publicatie
aanpassingen te doen — lees die mee, want die bepaalt hoe we het willen inrichten.

---

## 0. Startcheck (doe dit eerst)

Repo: `C:\Users\schak\financiele-planning`. Werk op branch **`astro-migratie`** (de preview;
`main` is nog niet bijgewerkt). Deploy = **commit + push** → Vercel bouwt de preview automatisch.

Lees ter oriëntatie kort:
- `src/content.config.ts` — het schema van de content.
- Eén bestaand artikel, bijv. `src/content/uitleg/wat-is-fire.md` — als voorbeeld.
- `src/pages/uitleg/[...slug].astro` — het artikelsjabloon (answer-first, FAQ, bronnen, JSON-LD).
- `src/components/Header.astro` — de navigatie (voor als er een nieuwe pillar bijkomt).
- `HANDOFF-content-claude-chat.md` en `CONTENT-BACKLOG.md` — context + ideeënlijst.

---

## 1. Hoe de site in elkaar zit (kort)

- **Astro** met content als **Markdown** in `src/content/uitleg/`. Elk bestand = één artikel.
- **Pillar-cluster-model:** een pillar-pagina (`isPillar: true`) met daaronder clusters
  (`pillar: "<pillar-slug>"`). Clusters verschijnen automatisch op de pillar (sectie "Verder
  lezen") en op de hub `/uitleg`. Je hoeft dus geen overzichtslinks handmatig te leggen.
- **Rekentools** (voor de `tool`-CTA en interne links):
  - Planner → `/ben-ik-financieel-onafhankelijk`
  - Bruto-netto → `/bruto-netto`
  - Jaarruimte → `/tools/jaarruimte`

**Bestaande pillars & slugs (niet dupliceren):**
- `wat-is-financiele-onafhankelijkheid` → clusters: `hoeveel-geld-financieel-onafhankelijk`,
  `wat-is-de-4-procent-regel`, `wat-is-fire`, `hoeveel-sparen-om-eerder-te-stoppen`,
  `waarvan-hangt-financiele-onafhankelijkheid-af`.
- `hoeveel-pensioen-heb-ik-nodig` → clusters: `hoeveel-aow-krijg-ik`,
  `wat-is-een-pensioentekort`, `wat-is-jaarruimte`.

**Nog niet bestaande pillars** (maak aan zodra een artikel er onder valt): *Beleggen*,
*Inflatie & koopkracht*, *Salaris & belasting*.

---

## 2. Recept: een geplakt artikel plaatsen

### Stap A — Bepaal de logische plek
Lees het artikel en kies de pillar:
- Past het onder een **bestaande** pillar? → wordt een cluster (zet `pillar:` + volgende vrije
  `volgorde`).
- Hoort het bij een **nieuwe** pillar (Beleggen/Inflatie/Salaris)? → zie stap E.
- Is het zelf een **pillar** (breed, overkoepelend)? → `isPillar: true`, geen `pillar:`.

### Stap B — Giet het in ons formaat (behoud Hendriks stem!)
Als de plaktekst nog niet de frontmatter hieronder heeft, zet 'm om **zonder zijn woorden te
neutraliseren** — Hendrik brengt bewust zijn eigen stem in. Structureer alleen:
- **titel** = de zoekvraag (H1).
- **samenvatting** = kort antwoord bovenaan (2–4 zinnen). Ontbreekt die? Maak 'm uit de opening
  of vraag Hendrik.
- **beschrijving** = meta (~140–160 tekens).
- Body in `##`-secties; sluit af met **FAQ** en **bronnen**.
- Ontbreken bronnen? **Verzin ze niet** — markeer met een TODO en vraag Hendrik.
- Staan er precieze fiscale cijfers/bedragen in? Die horen in de repo-config; houd ze algemeen
  of markeer als "controleren".

```markdown
---
titel: "<de zoekvraag>"
beschrijving: "<meta description, ~140–160 tekens>"
samenvatting: "<kort antwoord bovenaan, 2–4 zinnen>"
pillar: "<pillar-slug>"        # weglaten als dit zelf de pillar is
isPillar: false                # true voor een pillar-pagina
volgorde: <nummer>             # volgende vrije nummer binnen de pillar
bijgewerkt: "2026-07-21"
tool:                          # optioneel
  label: "<CTA-tekst>"
  href: "/ben-ik-financieel-onafhankelijk"
faq:
  - vraag: "..."
    antwoord: "..."
bronnen:
  - titel: "..."
    url: "https://..."
---

Korte inleiding.

## Subkop
Tekst met interne links, bijv. [de 4%-regel](/uitleg/wat-is-de-4-procent-regel).
```

### Stap C — Slug & bestand
Slug = kebab-case van de vraag (bijv. `wat-zijn-aandelen`). Bestand:
`src/content/uitleg/<slug>.md`.

### Stap D — Interne links
Link naar de pillar, 1–2 zusterartikelen en (waar passend) een rekentool. Gebruik alleen
**bestaande** paden; verwijs naar nog-niet-bestaande artikelen in gewone tekst zonder link
(dode links vermijden).

### Stap E — Nieuwe pillar (indien nodig)
- Maak de pillar-pagina `src/content/uitleg/<pillar-slug>.md` met `isPillar: true`.
- Voeg een nav-item toe in `src/components/Header.astro` (array `nav`) — of niet, als je 'm nog
  klein wilt houden; hij staat sowieso op de `/uitleg`-hub.

### Stap F — Bouwen, controleren, deployen
```
npm run build
```
Check: de nieuwe pagina staat in de output, geen errors, en (steekproef) de JSON-LD + sitemap
bevatten de URL. Daarna:
```
git add -A
git commit -m "Content: <titel>"
git push        # naar astro-migratie → Vercel bouwt de preview
```
Meld Hendrik de preview-URL van het nieuwe artikel (`/uitleg/<slug>`).

### Guardrails
Geen persoonlijk financieel advies (Wft-grens) — educatief/indicatief. Neutrale autoriteit
blijft de basis, ook met Hendriks stem. Echte, stabiele bronnen; geen verzonnen URL's. Fiscale
precisie via config.

---

## 3. De content-library (zelf bewerken na publicatie) — belangrijk

**Eis van Hendrik:** hij wil kunnen **inloggen op de website** en na publicatie zelf tekstuele
(en andere) aanpassingen doen, zonder telkens via een chat te hoeven.

**Aanbevolen aanpak — een git-based CMS bovenop de bestaande Markdown-content.** Hendrik logt in
op een admin-scherm, bewerkt artikelen in een gebruiksvriendelijke editor, en elke wijziging
wordt als commit weggeschreven → Vercel deployt automatisch. De content blijft dus gewoon onze
Markdown in de repo (geen migratie nodig), en Claude Code kan er nog steeds aan werken.

**Optie 1 — Keystatic (aanbevolen).**
- Gemaakt voor Astro, integreert direct met onze **content collections**; bewerkt exact onze
  Markdown + frontmatter (titel, samenvatting, FAQ, bronnen…). React + MDX zitten al in de stack.
- Admin-UI op `/keystatic`. In **GitHub-modus** logt Hendrik in met GitHub en gaan wijzigingen
  als commit naar de repo (vereist eenmalig een GitHub-App). **Keystatic Cloud** is een gehoste
  login-variant als we het GitHub-App-gedoe willen vermijden.
- Voordeel: velden matchen 1-op-1 met ons schema; geen aparte contentopslag.

**Optie 2 — Sveltia CMS of Decap CMS.**
- Klassiek `/admin`-scherm, GitHub-backend. Sveltia is de moderne, prettigere variant van Decap
  en regelt GitHub-login relatief eenvoudig. Iets minder strak gekoppeld aan de collections dan
  Keystatic, maar bewezen en simpel.

**Aanbeveling:** begin met **Keystatic in GitHub-modus** (of Cloud). Het is een **aparte
opzet-taak** (integratie toevoegen, config voor de `uitleg`-collectie, login regelen, admin
achter authenticatie). Kan in deze of een volgende sessie; niets aan de content hoeft ervoor te
veranderen — ons Markdown-formaat is al CMS-vriendelijk.

*Aandachtspunten voor de opzet:* admin-route buiten de zoekmachine houden (niet in sitemap,
`noindex`); alleen Hendrik toegang; wijzigingen landen op `astro-migratie` (of later `main`) →
Vercel deployt. Test met één artikel de volledige lus: inloggen → tekst wijzigen → opslaan →
live op preview.

---

## 4. Waar dingen staan
- Content: `src/content/uitleg/*.md` · Schema: `src/content.config.ts`
- Artikelsjabloon: `src/pages/uitleg/[...slug].astro` · Hub: `src/pages/uitleg/index.astro`
- Navigatie: `src/components/Header.astro` · Footer: `src/components/Footer.astro`
- Fiscale cijfers (centraal): `src/config/fiscaleParameters.ts`
- Deploy: push naar `astro-migratie` → Vercel-preview. Cutover naar `main` doet Hendrik bewust.
```
