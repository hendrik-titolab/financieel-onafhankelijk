# Designsysteem — benikfinancieelonafhankelijk.nl

Richting: **tech helderheid als platform, warmte als vertrouwen.** Weg van het klassieke
fintech-blauw (Tailwind `blue-600`), naar een warm, rustig palet met één duidelijke hiërarchie.

**Status:** live op `astro-migratie` sinds 11 augustus 2026 (commit `4ec2405`). Zie
`HANDOFF-herstijling-2026.md` voor de volledige sessiestatus.

---

## 1. Kleur

### Basispalet (moodboard)

| Naam | Hex | Rol |
|---|---|---|
| Inktgroen | `#29392E` | Alle tekst, primaire knoppen, logo, "goed"-nadruk. Werkt als zwart, houdt kleur. |
| Warm wit | `#EBE9E6` | Tekst op donkere vlakken, lichtste sfeervlak |
| Ochtendblauw | `#DDE6EE` | Interactie & data. Licht, bijna wit — geen bankblauw. |
| Steengrijs | `#95A1A6` | **Alleen** labels op donkere vlakken + hairlines. Nooit klein label op licht. |
| Zand | `#C7BCA9` | Warmte: gesprek, begeleiding, menselijke laag |

### Afgeleide werkkleuren

| Naam | Hex | Rol |
|---|---|---|
| Canvas | `#E4E1DC` | Paginabodem — het donkerste warme vlak |
| Paneel | `#F7F6F4` | Kaarten, panelen — springt naar voren t.o.v. canvas |
| Invoervlak | `#FFFDFA` | Inputs, velden — het lichtste niveau |
| Rand | `#DAD5CD` | 1px randen op panelen |
| Rand zacht | `#E4E1DC` | Scheidingslijnen *binnen* een paneel |
| Tekst secundair | `#4C5A50` | Body-tekst, kleine labels op licht (6,74:1 op paneel) |
| Tekst tertiair | `#6E7F72` | **Alleen grote/decoratieve tekst en iconen** — haalt op geen enkel vlak 4,5:1, dus nooit op leestekst ≤16px. Zie §5. |
| Label op donker | `#C0CBC3` | Klein label op `#29392E` (7,31:1) |
| Signaal | `#A85A3C` | **Enige** signaalkleur: tekort/waarschuwing (4,64:1 op paneel) |
| Inkt hover | `#1F2C23` | Hover-state op donkere knoppen (handmatig verdonkerde `#29392E`, 8 plekken) |
| Signaal hover | `#8F4B30` | Hover-state op de signaalknop ("Ja, wis alles", handmatig verdonkerde `#A85A3C`) |
| Rand header | `#D2CDC5` | Onderrand van de header, vergelijkbaar met maar niet gelijk aan Rand (`#DAD5CD`) |

### Datatokens — aanvulling 11 augustus 2026

Het oorspronkelijke systeem voorzag alleen in ochtendblauw als interactiekleur. Getest tegen
paneel (`#F7F6F4`): ochtendblauw geeft **1,14:1** — onbruikbaar voor een grafiekvlak, staafje of
databolletje (WCAG 1.4.11 non-text contrast vraagt 3:1). Daarom vijf tokens toegevoegd, afgeleid
uit dezelfde tinthoek als ochtendblauw (208°) en zand (38°), alleen dieper in verzadiging:

| Naam | Hex | Contrast op paneel | Rol |
|---|---|---|---|
| `data-100` | `#B6C8D8` | 1,59:1 | **Uitsluitend grafiekvlak** (buitenste Monte Carlo-band), nooit een los UI-element |
| `data-300` | `#83A0B9` | 2,53:1 | **Uitsluitend grafiekvlak** (binnenste Monte Carlo-band) |
| `data-500` | `#527898` | 4,04–4,32:1 | Prognoselijn, gevulde balken, "eigen vermogen"-categorie |
| `data-700` | `#3B5972` | 6,75–6,80:1 | Links, nadruk-tekst, donkerste banddiepte |
| `sand-deep` | `#9A835B` | 3,37:1 | Derde datacategorie (bijv. "werkgeverspensioen"), "redelijk" op een meter |

**Openstaand:** deze vijf tokens zijn functioneel getest en voldoen aan de contrasteisen, maar zijn
nog niet beoordeeld door de grafisch ontwerper. Voorleggen voordat dit als definitief geldt.

### Tailwind-config (v3.4.13 — tokens in `tailwind.config.js`, niet `@theme`)

Zie `tailwind.config.js` in de repo-root voor de volledige, actuele lijst.

### Kleurregels

1. **Drie vlakniveaus.** Canvas → paneel → invoer. Geen `box-shadow`.
2. **Data-500/700 = alles wat reageert of meet.** Ochtendblauw zelf is te licht voor data; de
   diepere data-tokens nemen die rol over. Sliders en actieve tabs gebruiken wél het lichte
   ochtendblauw/inktgroen, omdat daar de vulling of tekst het contrast draagt.
3. **Eén signaalkleur.** `#A85A3C` voor een tekort. Groen vervalt volledig — inktgroen ís de
   huisstijl, dus "positief/doel bereikt" is de donkere `#29392E`-kaart of gewoon inktgroene tekst.
4. **Zand alleen voor de mens.** Nooit voor knoppen in het rekenblad.
5. Steengrijs **en** tekst tertiair (`muted`, `#6E7F72`) nooit voor leestekst op lichte vlakken.
   `#95A1A6` haalt 2,45:1, `#6E7F72` haalt maximaal 4,19:1 (op invoervlak) — geen van beide
   voldoet aan de 4,5:1-eis voor normale tekst. Gebruik `#4C5A50` (`body`). `muted` is alleen
   geschikt voor grote decoratieve tekst (≥24px) of icoon-only knoppen (3:1-eis).

---

## 2. Typografie

**Afwijking van het oorspronkelijke voorstel, getest en bevestigd op 11 augustus 2026:**
Instrument Serif heeft geen tabular figures — een "0" is op 40px bijna twee keer zo breed als
een "1" (110,41px vs 59,77px). Bij live veranderende cijfers (KPI-waarden, slider-waarden)
sprong de tekst zichtbaar tijdens het slepen. Newsreader heeft wél gelijke cijferbreedtes.

| Rol | Font | Grootte |
|---|---|---|
| Koppen (H1/H2, hero, sectietitels) | **Instrument Serif** 400 | 20–36px, smal display-font — ±30% compacter dan Newsreader bij gelijke leesgrootte |
| Cijfers, bedragen, KPI-waarden, sliderwaarden | **Newsreader** 400, met `.tabular` (`font-variant-numeric: tabular-nums`) | KPI 30px · tabelbedrag 18px · slider-waarde 17px |
| UI-tekst, labels, body | **DM Sans** 400/500 | body 14px · UI 13px · hulp 12px |
| Micro-labels (KPI-labels, sectiekoppen) | mono, `.label-mono`-klasse | 11px, `letter-spacing: .06em`, uppercase |

```html
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500&family=Instrument+Serif&family=Newsreader:opsz@6..72&display=swap" rel="stylesheet">
```

Regels:

- **Inter en alle `font-weight: 700`/`600` vervallen.** Alleen DM Sans 400/500 wordt geladen —
  `font-bold`/`font-semibold` renderden daardoor als browser-gesynthetiseerd nep-vet. Nadruk komt
  nu uit schaal, kleur en het serif-font, via `font-medium` (500) waar nodig.
- Veldlabels zijn **sentence case**, niet uppercase — dat is voorbehouden aan sectiekoppen en
  micro-labels (`.label-mono`).

---

## 3. Vorm & ruimte

- **Radius:** `rounded-[3px]` op panelen/knoppen, `rounded-[2px]` op invoervelden. Geen
  `rounded-lg`/`rounded-xl`/`rounded-2xl`/`rounded-md` meer in de codebase.
- **Randen:** `1px solid #DAD5CD` (`border-line`). Binnen een paneel `1px solid #E4E1DC`
  (`border-line-soft`).
- **Geen schaduwen.** Alle `shadow-*` verwijderd, contrast tussen de drie vlakniveaus vervangt
  elevatie.
- **`rounded-full`** blijft alleen op echte cirkels (sliderknop, statusbolletjes, dunne
  voortgangsbalken). Pil-vormige badges zijn omgezet naar `rounded-[3px]`, consistent met de
  header-navigatie.

---

## 4. Componenten (kort — zie de code voor de volledige implementatie)

- **Header:** canvas-achtergrond, geen witte balk. Actieve nav `bg-morning text-ink`.
- **KPI-strip (FO-planner):** één haarlijn-raster (`grid gap-px bg-line border border-line`),
  cellen `bg-panel`, precies **één** donkere cel (`bg-ink`) voor de belangrijkste uitkomst
  (benodigde maandinleg). Tekort krijgt `text-signal` **plus** een 5px stip, nooit kleur alleen.
- **Tabs:** onderlijn-stijl (`border-b-2`), geen pill-groep. Beide tabs identiek gestyled —
  de afwijkende amberkleur van de oude "Events"-tab is vervallen.
- **Grafiek (WealthChart):** Monte Carlo-banden symmetrisch rond de mediaan gekleurd
  (`data-100` buitenste, `data-300` binnenste — even ver van de mediaan is even waarschijnlijk).
  Prognoselijn `#29392E`, geen gradient-vulling (flat 6% opacity i.p.v. verloop).
- **Meters (SuccessGauge):** drempels `#29392E` (goed) / `#9A835B` (redelijk) / `#A85A3C`
  (risicovol), oordeelwoord altijd naast het percentage.
- **Bereken-knop:** inktgroen (`bg-ink`), zoals expliciet voorgeschreven — niet amber. Staat
  vast onderin de invoerkolom (niet meer bovenin de grafiekkaart), blijft in beeld tijdens het
  scrollen door de 18 velden.

---

## 5. Toegankelijkheid

- Kleine tekst (≤16px) minimaal `#4C5A50` op lichte vlakken.
- `#95A1A6` uitsluitend op `#29392E`, of als hairline (scrollbar, dunne rand) — nooit als tekst.
- `#6E7F72` (`muted`) uitsluitend op grote/decoratieve tekst of icoon-only knoppen — gecontroleerd
  op negen plekken in de codebase waar dit token verkeerd op leestekst stond; alle negen
  gecorrigeerd naar `#4C5A50` op 11 augustus 2026.
- Betekenis nooit alleen via kleur: tekort krijgt terracotta **plus** de stip, meters krijgen
  kleur **plus** het oordeelwoord.
- Focus zichtbaar via `outline: 2px solid #29392E`, niet via een blauwe browser-outline.
