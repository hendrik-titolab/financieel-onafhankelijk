import { BOX3, BOX3_JAREN, BOX3_TOEREKENING } from '../config/fiscaleParameters'
import type { Woonsituatie } from '../types'

/**
 * Box 3 in de FO-planner.
 *
 * Het probleem dat dit oplost. De risicoprofielen werden in de UI aangeprezen als
 * "netto: wat je overhoudt na kosten van beleggen en na belasting in box 3",
 * terwijl risicoprofielen.ts diezelfde getallen als nominaal rendement
 * documenteert en de rekenkern nergens iets aftrok. Het uitlegartikel zei op de
 * ene regel "geen rekening met box 3" en twee regels verder "netto, na kosten en
 * na box 3". Drie plekken die elkaar tegenspraken, en geen ervan die rekende
 * (audit 7 september 2026, bevinding 10).
 *
 * Wat hier nu staat is een vereenvoudiging, en dat is een bewuste keuze. Een
 * volledig box 3-model met vermogensmix, schulden en fiscaal partnerschap bouwen
 * terwijl het stelsel richting heffing over werkelijk rendement beweegt, levert
 * een fiscale motor op die bij invoering opnieuw fout is. Voor een
 * Wft-vergunningaanvraag is dat een risico dat je niet neemt voor een uitkomst die
 * je ook eerlijk kunt benoemen.
 *
 * Daarom: de gebruiker vult zelf een belastingdruk in procentpunten in, en deze
 * module rekent voor wat die druk ongeveer is bij het opgegeven vermogen. Dat is
 * navolgbaar, het gebruikt uitsluitend gepubliceerde parameters, en het is één
 * plek om te vervangen zodra het volledige model er komt.
 *
 * VERVANGPUNT. Wie hier later het echte model inbouwt, vervangt
 * geschatteBox3Druk() door een jaarlijkse heffing per jaar in de kasstroomlus.
 * De aanroepers hoeven daarvoor niet te veranderen: pensionCalc.ts en
 * monteCarlo.ts kennen alleen nettoNominaalRendement() hieronder.
 */

/** Box 3-heffing over een vermogen in een jaar, in euro's. */
export function box3HeffingPerJaar(vermogen: number, woonsituatie: Woonsituatie): number {
  const vrij = woonsituatie === 'samenwonend'
    ? BOX3.heffingsvrijVermogen.fiscaalPartnersSamen
    : BOX3.heffingsvrijVermogen.alleenstaand

  const grondslag = Math.max(0, vermogen - vrij)
  // Het forfait voor beleggingen, niet dat voor spaargeld: de planner gaat uit van
  // vrij belegd vermogen. Wie vooral spaart betaalt minder, en zal deze schatting
  // dus naar beneden bijstellen.
  return grondslag * BOX3.forfaitairRendement.beleggingen * BOX3.tarief
}

/**
 * De box 3-druk als percentage van het totale vermogen, in procentpunten.
 *
 * Dit is precies waarom één vast percentage niet voor iedereen kan kloppen: door
 * het heffingsvrije vermogen loopt de druk op met de omvang van het vermogen. Bij
 * € 100.000 alleenstaand is het ongeveer 0,9 procentpunt, bij € 1.000.000 ruim
 * 2,0. Vandaar een invoerveld met deze schatting ernaast, en geen vast getal in
 * de code.
 */
export function geschatteBox3Druk(vermogen: number, woonsituatie: Woonsituatie): number {
  if (vermogen <= 0) return 0
  return (box3HeffingPerJaar(vermogen, woonsituatie) / vermogen) * 100
}

/**
 * De schatting zoals hij in het invoerveld terechtkomt: op één decimaal.
 *
 * Apart van geschatteBox3Druk() zodat het scherm, de default en de vergelijking
 * "wijkt de ingevulde waarde af van de schatting" gegarandeerd hetzelfde getal
 * gebruiken. Anders staat er 1,9 in het veld terwijl de code met 1,94666 vergelijkt
 * en de knop "schatting overnemen" nooit verdwijnt.
 */
export function box3DrukAfgerond(vermogen: number, woonsituatie: Woonsituatie): number {
  return Math.round(geschatteBox3Druk(vermogen, woonsituatie) * 10) / 10
}

/**
 * Het nominale rendement dat overblijft na kosten en vermogensbelasting.
 *
 * Beide worden als procentpunten van het rendement afgetrokken, niet als
 * percentage ván het rendement: zo werken lopende kosten en zo werkt een
 * forfaitaire heffing over het vermogen ook. 6% bruto met 0,4% kosten en 1,9%
 * belasting geeft 3,7% netto.
 *
 * Staan beide op nul, dan verandert er niets aan de uitkomst. Dat is de
 * begintoestand: de tool rekende tot september 2026 met het volle rendement,
 * alleen zei de tekst iets anders.
 */
export function nettoNominaalRendement(
  brutoNominaal: number,
  kostenPct: number,
  belastingPct: number
): number {
  return brutoNominaal - (kostenPct || 0) - (belastingPct || 0)
}

/* ══════════════════════════════════════════════════════════════════════════
 * De box 3-rekentool: het forfait en het tegenbewijs naast elkaar
 * ══════════════════════════════════════════════════════════════════════════
 *
 * Alles hieronder hoort bij /tools/box3 en staat los van de FO-planner. De
 * functies daarboven blijven ongemoeid: die schatten alleen de belastingdruk in
 * procentpunten en worden door pensionCalc.ts en monteCarlo.ts gebruikt.
 *
 * Twee berekeningen, want sinds de arresten van de Hoge Raad mag je aantonen dat
 * je werkelijke rendement lager was dan het forfait. Alleen het forfait rekenen
 * geeft iedereen met een tegenvallend jaar een te hoog bedrag, en dat is niet
 * onvolledig maar misleidend.
 *
 * Bron voor de rekenregels: Belastingdienst, "hoe is het box 3-inkomen op mijn
 * voorlopige aanslag 2026 berekend" en "wat is mijn werkelijk rendement",
 * geraadpleegd 8 september 2026. De parameters komen uit fiscale-cijfers.json.
 */

export type Box3Jaar = keyof typeof BOX3_JAREN

/**
 * Afronding.
 *
 * De Belastingdienst rondt op elke stap af in het voordeel van de
 * belastingplichtige: rendement over bezittingen naar beneden, rendement over
 * schulden naar boven, voordeel en belasting naar beneden. Het aandeel bij stap 4
 * wordt afgekapt op twee decimalen en niet afgerond.
 *
 * Dat staat nergens met zoveel woorden, het is afgeleid uit de vijf gepubliceerde
 * rekenvoorbeelden en elk voorbeeld is nagerekend. Het scheelt echt: 90.643 /
 * 150.000 is 60,4287%, en de Belastingdienst rekent met 60,42%, niet met 60,43%.
 * De toets in __tests__/box3.test.ts legt alle vijf de voorbeelden vast, dus als
 * dit ooit verandert valt die om.
 *
 * schoon() haalt eerst de ruis uit drijvendekommagetallen weg. Zonder die stap
 * maakt Math.floor van 137,00000000000003 nog steeds 137, maar van een waarde die
 * net onder een rond getal uitkomt 136, en dat is een euro die niemand kan
 * verklaren.
 */
const schoon = (x: number): number => Number(x.toFixed(6))
const omlaag = (x: number): number => Math.floor(schoon(x))
const omhoog = (x: number): number => Math.ceil(schoon(x))

function afkap(x: number, decimalen: number): number {
  const f = Math.pow(10, decimalen)
  return Math.floor(schoon(x * f)) / f
}

export interface Box3Invoer {
  jaar: Box3Jaar
  /** Verdubbelt het heffingsvrije vermogen en de schuldendrempel. */
  fiscaalPartner: boolean
  /** Bank- en spaartegoeden op 1 januari. Eigen forfait, meestal het laagste. */
  banktegoeden: number
  /** Aandelen, obligaties, fondsen, crypto. Zelfde forfait als overige bezittingen. */
  beleggingen: number
  /** Tweede woning, verhuurd vastgoed, vorderingen. */
  overigeBezittingen: number
  /** Schulden in box 3 op 1 januari, vóór de drempel. */
  schulden: number
  /**
   * Aandeel van persoon 1 in de grondslag sparen en beleggen, 0 tot 1.
   *
   * Fiscale partners mogen die grondslag verdelen zoals ze willen. Het tarief is
   * vlak, dus de verdeling verandert het totaal hooguit een euro of twee via de
   * afronding per persoon. De tool laat de keuze daarom niet zien en rekent met
   * de helft, maar de parameter bestaat wel: zonder die knop is het vijfde
   * rekenvoorbeeld van de Belastingdienst (alles bij één partner) niet na te
   * rekenen, en dat is juist een goede toets op de afrondingsregels.
   */
  verdelingPersoon1?: number
}

export interface Box3ForfaitUitkomst {
  /** Stap 1, per soort vermogen en het totaal. */
  rendementBanktegoeden: number
  rendementOverig: number
  rendementSchulden: number
  belastbaarRendement: number
  /** Stap 2. */
  aftrekbareSchulden: number
  rendementsgrondslag: number
  /** Stap 3. */
  heffingsvrijVermogen: number
  grondslagSparenEnBeleggen: number
  /** Stap 4 tot en met 6, per persoon. */
  personen: 1 | 2
  perPersoon: { grondslag: number; aandeelPct: number; voordeel: number; belasting: number }[]
  /** Het totaal voor het huishouden. */
  voordeel: number
  belasting: number
}

/**
 * Het forfaitaire box 3-bedrag, in zes stappen zoals de Belastingdienst ze telt.
 *
 * Let op stap 4. Je zou verwachten dat het forfaitaire rendement gewoon belast
 * wordt na aftrek van het heffingsvrije vermogen, maar zo werkt het niet: het
 * heffingsvrije vermogen wordt vertaald naar een percentage van de
 * rendementsgrondslag, en dát percentage gaat over het hele belastbare rendement
 * heen. Bij een gemengd vermogen pakt dat anders uit dan een simpele aftrek,
 * omdat het percentage ook op het spaardeel drukt.
 */
export function box3Forfait(invoer: Box3Invoer): Box3ForfaitUitkomst {
  const p = BOX3_JAREN[invoer.jaar]
  const partner = invoer.fiscaalPartner
  const personen: 1 | 2 = partner ? 2 : 1

  const bank = Math.max(0, invoer.banktegoeden || 0)
  const overig = Math.max(0, invoer.beleggingen || 0) + Math.max(0, invoer.overigeBezittingen || 0)
  const schulden = Math.max(0, invoer.schulden || 0)
  const bezittingen = bank + overig

  // Stap 1. Het schuldrendement gaat naar boven omdat het van het totaal af gaat.
  const drempel = partner ? p.schuldendrempel.fiscaalPartnersSamen : p.schuldendrempel.alleenstaand
  const aftrekbareSchulden = Math.max(0, schulden - drempel)
  const rendementBanktegoeden = omlaag(bank * p.forfaitairRendement.spaargeld)
  const rendementOverig = omlaag(overig * p.forfaitairRendement.beleggingen)
  const rendementSchulden = omhoog(aftrekbareSchulden * p.forfaitairRendement.schulden)
  const belastbaarRendement = rendementBanktegoeden + rendementOverig - rendementSchulden

  // Stap 2 en 3.
  const rendementsgrondslag = bezittingen - aftrekbareSchulden
  const heffingsvrijVermogen = partner
    ? p.heffingsvrijVermogen.fiscaalPartnersSamen
    : p.heffingsvrijVermogen.alleenstaand
  const grondslagSparenEnBeleggen = Math.max(0, rendementsgrondslag - heffingsvrijVermogen)

  // Stap 4 tot en met 6, per persoon.
  //
  // NaN glipt door ?? heen, want dat vangt alleen null en undefined af. Math.max(0, NaN)
  // is NaN, en vanaf daar is elke vermenigvuldiging eronder ook NaN: grondslag,
  // aandeelPct, voordeel en uiteindelijk de belasting. Het scherm toont dan geen fout
  // maar "€ NaN" (bevinding review 14 september 2026). Een verdeling die geen getal is
  // bevat geen informatie, dus terugvallen op de helft, net als bij een weggelaten
  // waarde. ±Infinity houdt wél richting en blijft daarom gewoon geklemd op 0 of 1.
  const opgegevenDeel = invoer.verdelingPersoon1
  const bruikbaarDeel = typeof opgegevenDeel === 'number' && !Number.isNaN(opgegevenDeel)
    ? opgegevenDeel
    : 0.5
  const deel1 = personen === 2 ? Math.min(1, Math.max(0, bruikbaarDeel)) : 1
  const delen = personen === 2 ? [deel1, 1 - deel1] : [1]

  const perPersoon = delen.map(deel => {
    const grondslag = grondslagSparenEnBeleggen * deel
    const aandeelPct = rendementsgrondslag > 0
      ? afkap((grondslag / rendementsgrondslag) * 100, BOX3_TOEREKENING.aandeelDecimalen)
      : 0
    // Een negatief belastbaar rendement (veel schuld, weinig bezit) mag de
    // uitkomst niet omhoog duwen via een negatief voordeel.
    const voordeel = Math.max(0, omlaag(belastbaarRendement * (aandeelPct / 100)))
    return { grondslag, aandeelPct, voordeel, belasting: omlaag(voordeel * p.tarief) }
  })

  return {
    rendementBanktegoeden,
    rendementOverig,
    rendementSchulden,
    belastbaarRendement,
    aftrekbareSchulden,
    rendementsgrondslag,
    heffingsvrijVermogen,
    grondslagSparenEnBeleggen,
    personen,
    perPersoon,
    voordeel: perPersoon.reduce((s, x) => s + x.voordeel, 0),
    belasting: perPersoon.reduce((s, x) => s + x.belasting, 0),
  }
}

export interface WerkelijkRendementInvoer {
  /**
   * Reguliere voordelen: rente, huur, pacht, dividend, winstuitkering, vergoeding
   * voor het verstrekken van kapitaal, licentievergoeding, gebruiksvergoeding
   * (artikel 5.27, eerste lid).
   */
  reguliereVoordelen: number
  /**
   * De waarde van het saldo van bezittingen én schulden, op 1 januari en op
   * 31 december. Let op het woord saldo: artikel 5.28 rekent met bezittingen min
   * schulden, niet met de bezittingen alleen.
   */
  waardeBegin: number
  waardeEind: number
  /** Stortingen: bijgekocht of ingelegd tijdens het jaar. Gaat eraf, het is geen rendement. */
  aankopen: number
  /** Onttrekkingen: verkocht of opgenomen tijdens het jaar. Gaat erbij, anders lijkt het verlies. */
  verkopen: number
  /**
   * Betaalde rente over een box 3-schuld.
   *
   * Juridisch geen kostenaftrek maar een negatief regulier voordeel (artikel
   * 5.27, tweede lid). Dezelfde uitkomst, en het verklaart waarom juist deze post
   * meetelt terwijl gewone kosten niet aftrekbaar zijn: het is geen kost, het is
   * een negatieve opbrengst.
   */
  renteSchulden: number
}

export interface WerkelijkRendementUitkomst {
  /** Null als de gebruiker het rendement rechtstreeks heeft ingevuld. */
  waardeontwikkeling: number | null
  /** Vóór afronding en nulstelling, dus kan negatief zijn en centen bevatten. */
  bruto: number
  /** Wat er fiscaal telt: afgerond naar beneden, en een negatief jaar op nul. */
  rendement: number
  opNulGezet: boolean
}

/**
 * Een werkelijk rendement dat de gebruiker zelf al weet.
 *
 * Wie het bedrag van zijn bank of zijn adviseur krijgt, hoeft het niet terug te
 * rekenen naar waarde begin, waarde eind, aankopen en verkopen. Dezelfde
 * afronding naar beneden en dezelfde nulstelling gelden.
 */
export function werkelijkRendementDirect(bedrag: number): WerkelijkRendementUitkomst {
  const bruto = bedrag || 0
  return {
    waardeontwikkeling: null,
    bruto,
    rendement: Math.max(0, omlaag(bruto)),
    opNulGezet: bruto < 0,
  }
}

/**
 * Het werkelijke rendement over het hele box 3-vermogen samen.
 *
 * Reguliere voordelen plus vermogensaanwas (artikel 5.26, eerste en tweede lid).
 * De vermogensaanwas volgt artikel 5.28: waarde van het saldo van bezittingen en
 * schulden aan het eind van het jaar, min diezelfde waarde aan het begin,
 * verminderd met stortingen en vermeerderd met onttrekkingen.
 *
 * Drie dingen die mensen hier verkeerd verwachten, en die alle drie kloppen:
 * ongerealiseerde waardestijging telt mee (papieren winst is belast), kosten zijn
 * niet aftrekbaar behalve rente op een box 3-schuld, en een negatief jaar levert
 * geen verrekenbaar verlies op maar wordt op nul gezet.
 *
 * Wat hier bewust níet gebeurt: de schuldendrempel aftrekken. Artikel 5.26, derde
 * lid, verklaart artikel 5.3, derde lid, onderdeel f buiten toepassing, en dat
 * onderdeel ís de drempel. Aan de forfaitkant geldt hij wel. Datzelfde lid zet
 * ook de vrijstelling voor groene beleggingen (artikel 5.13) opzij, dus als die
 * ooit in deze tool komt: hij verlaagt het forfait, niet het werkelijke rendement.
 *
 * De correctie voor stortingen en onttrekkingen is wat het rendement scheidt van
 * de kasstroom: wie in juli € 10.000 bijstort ziet zijn vermogen groeien zonder
 * dat hij iets verdiend heeft.
 */
export function werkelijkRendement(invoer: WerkelijkRendementInvoer): WerkelijkRendementUitkomst {
  const waardeontwikkeling =
    (invoer.waardeEind || 0) - (invoer.waardeBegin || 0)
    - Math.max(0, invoer.aankopen || 0) + Math.max(0, invoer.verkopen || 0)

  const bruto =
    (invoer.reguliereVoordelen || 0) + waardeontwikkeling - Math.max(0, invoer.renteSchulden || 0)

  return {
    waardeontwikkeling,
    bruto,
    // Naar beneden afronden op hele euro's. Bij de aangifte mag elk veld op een
    // hele euro worden afgerond in het voordeel van de belastingplichtige, en aan
    // deze kant is dat naar beneden: hoe lager het werkelijke rendement, hoe
    // lager de aanslag. Aan de forfaitkant gebeurt hetzelfde, alleen gaat het
    // schuldrendement daar juist naar boven omdat het van het totaal af gaat.
    rendement: Math.max(0, omlaag(bruto)),
    opNulGezet: bruto < 0,
  }
}

export interface Box3Vergelijking {
  forfait: Box3ForfaitUitkomst
  werkelijk: WerkelijkRendementUitkomst
  /** Welke van de twee de aanslag bepaalt. */
  geldt: 'forfait' | 'werkelijk'
  /** Het bedrag waarover geheven wordt. */
  grondslag: number
  belasting: number
  /** Wat het tegenbewijs oplevert. Nul als het forfait al gunstiger was. */
  voordeelTegenbewijs: number
}

/**
 * Forfait tegen tegenbewijs, en welke van de twee geldt.
 *
 * Het werkelijke rendement telt alleen mee als het lager is dan het forfaitaire
 * voordeel uit sparen en beleggen, dus ná aftrek van het heffingsvrije vermogen
 * (artikel 5.25 Wet IB 2001). Dat is de vergelijking die de meeste mensen fout
 * maken: bij het werkelijke rendement geldt zelf géén heffingsvrij vermogen, dus
 * je vergelijkt een volledig belast bedrag met een bedrag waar de vrijstelling al
 * uit is. Precies daarom is tegenbewijs bij een kleiner vermogen bijna nooit
 * gunstig, ook niet in een slecht beursjaar.
 *
 * Bij fiscale partners wordt hier op huishoudniveau vergeleken. De wet doet het
 * per persoon, met dezelfde verdeling voor het werkelijke rendement als voor de
 * grondslag, en dan valt de keuze voor beide partners hetzelfde uit. Alleen de
 * afronding per persoon kan een euro schelen.
 */
export function box3Vergelijking(
  invoer: Box3Invoer,
  werkelijkInvoer: WerkelijkRendementInvoer | { bedrag: number } | null
): Box3Vergelijking {
  const forfait = box3Forfait(invoer)
  const tarief = BOX3_JAREN[invoer.jaar].tarief

  const leeg: WerkelijkRendementUitkomst = {
    waardeontwikkeling: null, bruto: 0, rendement: 0, opNulGezet: false,
  }
  const werkelijk = werkelijkInvoer === null
    ? leeg
    : 'bedrag' in werkelijkInvoer
      ? werkelijkRendementDirect(werkelijkInvoer.bedrag)
      : werkelijkRendement(werkelijkInvoer)

  if (!werkelijkInvoer) {
    return {
      forfait, werkelijk, geldt: 'forfait',
      grondslag: forfait.voordeel, belasting: forfait.belasting, voordeelTegenbewijs: 0,
    }
  }

  const gunstiger = werkelijk.rendement < forfait.voordeel
  const grondslag = gunstiger ? werkelijk.rendement : forfait.voordeel
  const belasting = gunstiger ? omlaag(grondslag * tarief) : forfait.belasting

  return {
    forfait,
    werkelijk,
    geldt: gunstiger ? 'werkelijk' : 'forfait',
    grondslag,
    belasting,
    voordeelTegenbewijs: Math.max(0, forfait.belasting - belasting),
  }
}
