// Deterministische pseudo-random generator voor de Monte Carlo-simulatie. Niet
// geschikt voor cryptografie. mulberry32 is een eenvoudige, snelle 32-bit PRNG met
// een periode van 2^32, statistisch ruim voldoende voor de 2.000 scenario's van de
// FO-planner.
//
// Tot 22 september 2026 alleen voor tests; productie trok met Math.random(). Sinds
// dan krijgt runMonteCarlo() zonder meegegeven generator deze, met een startwaarde
// uit de invoer, zodat dezelfde invoer altijd dezelfde slagingskans geeft (zie
// startwaardeVoorInvoer() in monteCarlo.ts).
//
// Referentie-implementatie: mulberry32 (Tommy Ettinger, public domain).

export function makeRng(seed: number): () => number {
  let a = seed | 0
  return function rng(): number {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
