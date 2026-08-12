// Deterministische pseudo-random generator, uitsluitend voor testdoeleinden
// (golden-master-tests op monteCarlo.ts). Niet geschikt voor cryptografie of
// voor iets anders dan reproduceerbare testfixtures — mulberry32 is een
// eenvoudige, snelle 32-bit PRNG met een periode van 2^32, statistisch
// prima genoeg om deterministische Monte Carlo-uitkomsten vast te leggen,
// niet bedoeld als vervanging van Math.random() in productiepaden.
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
