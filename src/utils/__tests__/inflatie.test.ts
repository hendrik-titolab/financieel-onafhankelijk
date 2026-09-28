// Inflatietool (/tools/inflatie). Review 28 september 2026, bevinding 9: de
// rekenlogica stond in het component en had geen toets.
import { describe, it, expect } from 'vitest'
import { bereken } from '../inflatie'

describe('inflatietool — bereken', () => {
  it('de standaardinvoer: € 10.000, 3% inflatie, 1,5% rente, 20 jaar', () => {
    const r = bereken({ startbedrag: 10_000, inflatie: 3, spaarrente: 1.5, looptijd: 20 })
    // 10.000 × 1,015^20 = 13.468,55 op de rekening
    expect(r.nominaalEind).toBeCloseTo(13_468.5501, 3)
    // 13.468,55 / 1,03^20 = 7.457,21 in koopkracht van nu
    expect(r.koopkrachtEind).toBeCloseTo(7_457.2096, 3)
    // Koopkrachtverlies ten opzichte van nu: 10.000 − 7.457,21
    expect(r.verliesEuro).toBeCloseTo(2_542.7904, 3)
    expect(r.verliesPct).toBeCloseTo(25.4279, 3)
    // (1,015 / 1,03) − 1 = −1,4563%
    expect(r.reeelRendement).toBeCloseTo(-1.456311, 5)
    expect(r.jaren).toHaveLength(21)
  })

  it('het vlak in de grafiek is iets anders dan het koopkrachtverlies', () => {
    // Bevinding 2 van dezelfde review: beide heetten "koopkrachtverlies".
    const r = bereken({ startbedrag: 10_000, inflatie: 3, spaarrente: 1.5, looptijd: 20 })
    const laatste = r.jaren[r.jaren.length - 1]
    expect(laatste.uitgehold).toBeCloseTo(13_468.5501 - 7_457.2096, 3)
    expect(laatste.uitgehold).not.toBeCloseTo(r.verliesEuro, 0)
  })

  it('rente boven inflatie geeft een koopkrachtwinst, dus een negatief verlies', () => {
    const r = bereken({ startbedrag: 25_000, inflatie: 2, spaarrente: 4, looptijd: 10 })
    expect(r.nominaalEind).toBeCloseTo(37_006.1071, 3)
    expect(r.koopkrachtEind).toBeCloseTo(30_357.8971, 3)
    expect(r.verliesEuro).toBeLessThan(0)
  })

  it('klemt de invoer: rente en inflatie 0 tot 20%, looptijd 1 tot 30 jaar, geen negatief bedrag', () => {
    expect(bereken({ startbedrag: -5, inflatie: 3, spaarrente: 1, looptijd: 5 }).nominaalEind).toBe(0)
    expect(bereken({ startbedrag: 100, inflatie: 50, spaarrente: 0, looptijd: 1 }).koopkrachtEind)
      .toBeCloseTo(100 / 1.2, 9)
    expect(bereken({ startbedrag: 100, inflatie: 0, spaarrente: 0, looptijd: 0 }).jaren).toHaveLength(2)
    expect(bereken({ startbedrag: 100, inflatie: 0, spaarrente: 0, looptijd: 40 }).jaren).toHaveLength(31)
  })
})
