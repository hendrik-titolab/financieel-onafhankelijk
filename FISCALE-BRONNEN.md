# Fiscale bronnen: analyse en openstaande vragen

> **De cijfers staan hier niet.** Ze staan in `C:\Users\schak\Documents\Fiscale bron\fiscale-cijfers.json`,
> met bron en status per waarde. Daaruit worden `fiscaleParameters.ts` en `risicoprofielen.ts` gegenereerd,
> sinds november 2026 in de repo [rekenkern](https://github.com/hendrik-titolab/rekenkern), `src/config/`.
>
> Dit document bewaart de redenering achter de audit van augustus 2026 en wat daaruit nog openstaat.
> Bijgewerkt op 4 november 2026: de punten die de audit noemde, zijn getoetst aan de huidige code.

**Ontstaan:** audit 2026-08 (`docs/archief/AUDIT-fase0-1-feiten.md`, `docs/archief/AUDIT-fase2-externe-bronnen.md`).

---

## Waarom de cijfers verhuisd zijn

Dezelfde getallen stonden op minstens drie plekken: `fiscaleParameters.ts`, dit document, en de
parameters van de jaarruimte-skill. Die spraken elkaar aantoonbaar tegen. Zolang een cijfer op drie
plekken staat, is de vraag niet óf ze uit elkaar lopen maar wanneer je het merkt.

---

## Jaarruimte: wat de audit vond en wat daarmee is gebeurd

| Bevinding uit augustus | Stand nu |
|---|---|
| Percentage 2016 moest 13,8% zijn | Staat op 13,8% |
| Factor A: 2018 en 2022 moesten 6,27 zijn | Staan op 6,27 |
| Reserveringsruimte vanaf 2023 liep een jaar achter | Hersteld: € 38.000, € 41.608, € 42.108, € 42.753 |
| Tot en met 2022 ontbrak het mechanisme met twee leeftijdstarieven | Ingebouwd in `bepaalPlafond()` voor 2021 en 2022 |
| Toevoeging aan de oudedagsreserve ontbrak | Ingebouwd tot en met 2022, ook in de wizard voor eerdere jaren (2026.09.8 en 2026.09.9) |

Hendrik heeft franchise, maximum toetsingsinkomen, percentage en factor A voor 2021 tot en met 2026 op
25 augustus 2026 zelf nagetrokken. De tool rekent alleen voor de belastingjaren 2021 tot en met 2026,
omdat een gemiste aftrek over eerdere jaren niet meer te herstellen is (besluit 13 augustus 2026). De
jaren 2016 tot en met 2020 staan er alleen om onbenutte ruimte uit te rekenen.

**Het omslagpunt.** Het regime tot en met 2022 kende twee leeftijdstarieven, met als omslagpunt de
AOW-leeftijd van dat jaar min tien jaar. Dat volgt uit artikel 3.127 lid 2 Wet IB 2001: de leeftijd bij
het begin van het kalenderjaar.

---

## Twee definitiekwesties die géén fout zijn

Genoteerd zodat ze niet elk jaar opnieuw uitgezocht worden.

- De tabel van de Belastingdienst noemde de afbouwgrens van de algemene heffingskorting eerder
  **€29.737**, terwijl de formule rekent met `verzamelinkomen − €29.736`. De configuratie gebruikt de
  formulewaarde en is dus juist.
- De tabel noemt de korting nihil **vanaf €78.427**, de configuratie houdt €78.426 aan. Bij €78.426 komt
  de formule op €0,19 uit, afgerond nul. Verschil in definitie, niet in uitkomst.

---

## Gecontroleerd op 4 november 2026

| Onderdeel | Bron | Uitkomst |
|---|---|---|
| AOW per 1 juli 2026: bruto, Zvw, netto, vakantiegeld | [SVB, bedragen AOW](https://www.svb.nl/nl/aow/bedragen-aow/aow-bedragen) | Klopt |
| Jaarruimte 2026: € 19.172, € 137.800, € 42.753, factor 6,27 | [Overzicht cijfers leven 2026](https://odb.belastingdienst.nl/wp-content/uploads/2026/01/20251218-Overzicht-cijfers-leven-2026-FsL.pdf), met wetsartikel per regel | Klopt |
| Lijfrente: € 63.288 en € 27.192 | Zelfde overzicht | Klopt |

---

## Openstaand

1. **Reserveringsruimte 2025 (€ 42.108)** is bij de controle van augustus niet apart genoemd. Nog niet
   expliciet bevestigd.
2. **De jaren 2016 tot en met 2020** zijn niet primair bevestigd, zie `fiscale-cijfers.json`. Ze raken
   alleen de wizard voor onbenutte ruimte.
3. **De cijfers voor 2027.** De Tweede Kamer stemt op 12 november 2026 over het Belastingplan, de Eerste
   Kamer daarna. Zie `voorlopig2027` in de bron: de verlaging van het heffingsvrije vermogen is op
   3 november 2026 ingetrokken, en dat staat daar nog niet bij.

De volledige lijst wordt automatisch gegenereerd uit de bron en staat in
`Documents\Fiscale bron\Fiscale cijfers, formules en uitgangspunten.md`, deel 4.
