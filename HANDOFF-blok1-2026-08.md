# Blok 1 afgewerkt — wat er is gefixt en wat er nog ligt

> Branch `fix-blok1-2026-08`, afgetakt van `astro-migratie` (commit `60b352f`).
> **Nog niet gemerged en niet live.** Zes commits, elk apart terug te draaien.
> Vervolg op `HANDOFF-audit-2026-08-rekenlogica.md`, deel 2, blok 1.

---

## Wat er is gefixt

| Commit | Bevinding | Zichtbaar voor de bezoeker? |
|---|---|---|
| `e420e0e` | A3 + E10 | Ja, groot |
| `d0bed8f` | A18 | Nee |
| `d75c78a` | A22 | Ja |
| `021254b` | Reserveringsruimte, tien jaar | Ja, klein |
| `1452150` | A5 | Ja, bij extreme invoer |
| `92ff5a1` | Opruiming | Nee |

De commit messages bevatten per punt de narekening, de gemeten waarden en de
afwegingen. Hieronder alleen wat je moet weten om te beslissen.

### A3, de belangrijkste van dit blok

`eur()` deed onvoorwaardelijk `Math.abs()`, ook op de KPI "Verwacht eindvermogen".
Een negatief eindvermogen kwam daardoor als positief bedrag op het scherm, en
omdat een grotere tegenvaller een groter absoluut getal geeft, draaide de gelezen
trend om.

Live gemeten, defaults met één eenmalig bedrag in 2030:

| Bedrag 2030 | Vóór de fix | Na de fix |
|---|---|---|
| −€ 200.000 | € 185.349 | −€ 185.349 |
| −€ 300.000 | € 401.813 | −€ 401.813 |

Een grotere tegenvaller geeft nu weer een lager eindvermogen. `eurAbs()` is
toegevoegd voor de plekken waar het label het teken al draagt (de KPI die wisselt
tussen "Overschot" en "Tekort"), anders had daar "Tekort −€ x" gestaan. De
handmatige min-workaround bij "Restkapitaal" is weg: die deed met de hand wat
`eur()` nu zelf doet.

E10 is meegenomen: de benodigde maandinleg wordt voor weergave op 0 geklemd,
zoals `exportExcel.ts:94` al deed.

### De reserveringsruimte, jouw opmerking van vanavond

Het jaarveld stond op `baseYear − 11` terwijl `MAX_RESERVERING_RIJEN` al 10 was.
Die twee spraken elkaar tegen, en het elfde jaar telt fiscaal niet mee. Beide
zijn nu aan dezelfde constante gekoppeld.

Daar is een tweede grens onder gezet. Bij een ouder belastingjaar bleef de
tienjaarsgrens namelijk buiten de parametertabel vallen: bij belastingjaar 2020
zou de ondergrens op 2010 uitkomen, en `getParams()` valt voor een onbekend jaar
stil terug op de cijfers van 2026. Geen melding, wel een verkeerd bedrag. De
nieuwe `getOudsteParameterJaar()` legt de oudste sleutel uit `JAARRUIMTE_PARAMS`
eronder.

Live gecontroleerd, min/max rechtstreeks van het invoerveld gelezen:

| Belastingjaar | Bereik nu | Tienjaarsgrens zou zijn |
|---|---|---|
| 2025 | 2016 t/m 2024 | 2015 |
| 2020 | 2016 t/m 2019 | 2010 |

Elk jaar dat nu nog te kiezen is, heeft echte parameters.

---

## Drie dingen die je moet weten

**1. Twee vragen die dit oproept, allebei van jou.**

- Voor belastingjaar 2025 valt 2015 nu buiten beeld terwijl het fiscaal binnen de
  tien jaar ligt. Wil je dat jaar aanbieden, dan moeten eerst de parameters voor
  2015 in `fiscaleParameters.ts`, met bron.
- Vóór 2023 keek de reserveringsruimte zeven jaar terug, niet tien. Voor oudere
  belastingjaren is tien dus te ruim. Dat regimeverschil is precies wat in F1
  openstaat op jouw eigen bronbeoordeling, dus ik heb het bewust niet gecodeerd.
  Zeven hardcoderen op mijn eigen gezag zou hetzelfde soort fout zijn als de fout
  die we aan het opruimen zijn.

**2. A5 is begrenzen geworden, niet waarschuwen.** Het handoff-document liet de
keuze open. Begrenzen kan nooit een onzinnige uitkomst opleveren en sluit aan bij
wat de min/max op het veld al beloven. Wil je liever dat de gebruiker zijn eigen
extreme waarde houdt en alleen een waarschuwing ziet, dan is dat een kleine
wijziging op één plek in `NumberInput`.

**3. Een meetfout van mijzelf, genoteerd zodat de volgende sessie hem niet
herhaalt.** Bij het testen van A5 leek de begrenzing niet te werken. Dat lag aan
de testmethode: ik zette de waarde via een synthetisch `blur`-event, en React
luistert voor `onBlur` op `focusout`. Met een echte Tab klopte het wel. Elke
UI-test in dit project die met synthetische events werkt, is om deze reden
verdacht.

---

## Wat er van blok 1 nog ligt

- **A8/A9, de terugval in `getParams()` zelf.** Het bereikbare pad ernaartoe is nu
  dicht, maar de functie valt nog steeds stil terug op 2026 voor een onbekend
  jaar, en er zijn andere aanroepers. Dit stond als open vraag 7 bij jou. Mijn
  aanbeveling blijft: falen met een duidelijke melding.
- **A19, `currentIncome`.** Wordt ingevuld, telt nergens mee, staat wel in de
  Excel-export. Kiezen: veld weghalen, of labelen als "alleen voor je eigen
  dossier". Ik heb hier geen voorkeur die zwaar genoeg weegt om hem zonder jou te
  maken, want het raakt wat een adviseur in zijn dossier verwacht.
- **A9 nader bekeken, mogelijk geen bug.** De audit noteerde dat
  `getAvailableYears()` de jaren 2016 tot en met 2019 mist terwijl
  `JAARRUIMTE_PARAMS` ze wel bevat. Dat lijkt me juist correct ontwerp: die jaren
  zijn nodig als bronjaar voor de reserveringsruimte, niet als belastingjaar
  waarvoor je nu nog jaarruimte kunt benutten. Ik zou dit als "geen bevinding"
  afsluiten, maar dat is aan jou.

---

## Controle vóór elke commit

`npm run test` (33 groen), `npm run build` (schoon), `npm run check`
(onveranderd 1 fout, de bekende `exportExcel.ts`-melding uit de Fase 0-baseline).
De hint-teller ging van 25 naar 24 door de opruimcommit.

Alles is live nagelopen op `localhost:4321` via de preview-tools, met de waarden
rechtstreeks uit de DOM gelezen in plaats van van een screenshot afgelezen.

## Mergen

Nog niet gedaan, bewust: dit gaat rechtstreeks naar productie en A3 verandert een
zichtbaar getal op de belangrijkste pagina. Wanneer je akkoord bent:

```bash
git checkout astro-migratie && git merge --no-ff fix-blok1-2026-08
```
