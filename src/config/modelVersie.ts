/**
 * Versie van de rekenmodellen en de peildatum van de fiscale parameters.
 *
 * Een uitgebracht rapport moet later terug te vinden zijn: welke formules en welke
 * belastingcijfers stonden erachter. Zonder dat is een advies uit maart niet te
 * onderscheiden van een advies uit september, terwijl de uitkomsten kunnen
 * verschillen. Dat is ook het antwoord op de offline-app: een gecachete versie
 * draagt zijn eigen versienummer mee (audit 7 september 2026, bevindingen 6 en 26).
 *
 * Ophogen bij elke wijziging die een uitkomst verandert. Niet bij tekst of opmaak.
 */
// 2026.09.2: box 3 per jaar in de planner, partner apart belast, reële volatiliteit (8 en 9 september 2026).
// 2026.09.3: overbruggingsToeslag telt het box 3-verschil niet meer mee als er geen
// echte overbruggingsperiode is (14 september 2026).
// 2026.09.4: de jaarruimtetool schat het belastingvoordeel met de schijven en
// heffingskortingen van het aftrekjaar zelf, in plaats van altijd met die van het
// parameterjaar (WP9, 16 september 2026). Raakt alleen aftrekjaren ongelijk aan
// PARAMETER_JAAR; de jaarruimte zelf verandert nergens.
// 2026.09.5: review 22 september 2026. Liquiditeitstoets in de opbouwfase, sluitende
// opbouw van het doelbedrag (overbrugging, later geld, box 3), indexatiekeuze per
// uitkering, Monte Carlo met een startwaarde uit de invoer, slechtweerwaarde
// (5e percentiel) op de pensioendatum.
export const MODEL_VERSIE = '2026.09.5'

/** Belastingjaar waarop fiscaleParameters.ts is gebaseerd. */
export const PARAMETER_JAAR = 2026

/** Datum waarop die parameters voor het laatst zijn nagelopen. */
export const PARAMETER_PEILDATUM = '2026-09-07'

/** Korte weergave voor scherm en rapport, bijv. "model 2026.09.1 · cijfers 2026". */
export function modelStempel(): string {
  return `model ${MODEL_VERSIE} · fiscale cijfers ${PARAMETER_JAAR}`
}
