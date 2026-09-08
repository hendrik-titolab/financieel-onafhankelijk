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
export const MODEL_VERSIE = '2026.09.1'

/** Belastingjaar waarop fiscaleParameters.ts is gebaseerd. */
export const PARAMETER_JAAR = 2026

/** Datum waarop die parameters voor het laatst zijn nagelopen. */
export const PARAMETER_PEILDATUM = '2026-09-07'

/** Korte weergave voor scherm en rapport, bijv. "model 2026.09.1 · cijfers 2026". */
export function modelStempel(): string {
  return `model ${MODEL_VERSIE} · fiscale cijfers ${PARAMETER_JAAR}`
}
