#!/usr/bin/env node
// Faalt als een bestand in de rekenkern is gewijzigd zonder dat MODEL_VERSIE mee is
// opgehoogd. Reden: op 8-9 september 2026 veranderden vier commits een rekenuitkomst
// (box 3 per jaar, partnermodel, reële volatiliteit) zonder dat MODEL_VERSIE meeging,
// pas op 14 september hersteld (zie HANDOFF-borging-2026-09.md, WP2 en WP8). Dit
// script voorkomt dat dat nog een keer ongemerkt gebeurt.
//
// Draait alleen op pull_request (zie controle.yml): vergelijkt de commits die deze
// PR toevoegt (t.o.v. het gemeenschappelijke voorouder-commit met de basisbranch),
// niet de basisbranch zelf.

import { execSync } from 'node:child_process'

const baseBranch = process.env.GITHUB_BASE_REF || 'astro-migratie'
const base = `origin/${baseBranch}`

// Rekenkern: bestanden die een rekenuitkomst kunnen veranderen. Config/documentatie/
// UI-tekst staat hier bewust niet in, ook al gebruikt die de uitkomsten.
const WATCHED = [
  'src/utils/pensionCalc.ts',
  'src/utils/monteCarlo.ts',
  'src/utils/box3.ts',
  'src/utils/jaarruimte.ts',
  'src/utils/brutoNetto.ts',
  'src/config/fiscaleParameters.ts',
]
const WATCHED_PREFIX = 'src/utils/__tests__/__golden__/'
const VERSION_FILE = 'src/config/modelVersie.ts'

function changedFiles(baseRef, branchName) {
  // actions/checkout op een pull_request-event fetcht standaard alleen de PR-ref
  // zelf; ook met fetch-depth: 0 bestaat 'origin/<basisbranch>' dan niet altijd als
  // lokale ref (bevestigd: eerste CI-run op deze PR faalde hierop met "unknown
  // revision"). Expliciet ophalen maakt het script onafhankelijk van wat de
  // workflow YAML daaromtrent wel of niet al deed.
  // Geen --depth hier: de workflow haalt de PR-ref al met fetch-depth: 0 op, dus de
  // voorouder-commits van de basisbranch zitten meestal al lokaal. Een ondiepe fetch
  // van alleen de tip zou een losstaande geschiedenis kunnen geven waar '...'
  // hieronder geen gemeenschappelijke voorouder in vindt.
  try {
    execSync(`git fetch origin ${branchName}`, { stdio: 'pipe' })
  } catch (e) {
    console.error(`Kon ${branchName} niet ophalen van origin, ga door met wat er al lokaal is.`)
    console.error(e.stderr?.toString() ?? String(e))
  }
  const out = execSync(`git diff --name-only ${baseRef}...HEAD`, { encoding: 'utf8' })
  return out
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
}

const files = changedFiles(base, baseBranch)
const touchedWatched = files.filter(f => WATCHED.includes(f) || f.startsWith(WATCHED_PREFIX))
const touchedVersion = files.includes(VERSION_FILE)

if (touchedWatched.length > 0 && !touchedVersion) {
  console.error(`MODEL_VERSIE (${VERSION_FILE}) is niet opgehoogd, terwijl deze`)
  console.error('rekenkern-bestanden wel zijn gewijzigd in deze PR:')
  for (const f of touchedWatched) console.error(`  - ${f}`)
  console.error('')
  console.error('Verandert deze wijziging een rekenuitkomst? Hoog MODEL_VERSIE op.')
  console.error('Verandert er geen uitkomst (bijvoorbeeld alleen een comment, of een')
  console.error('herschikking zonder gedragswijziging)? Dan is dit een terechte melding')
  console.error('om bewust te negeren, geen bug in dit script.')
  process.exit(1)
}

console.log(
  touchedWatched.length > 0
    ? `Versiecheck OK: MODEL_VERSIE is opgehoogd (${touchedWatched.length} rekenkern-bestand(en) gewijzigd).`
    : 'Versiecheck OK: geen rekenkern-bestanden gewijzigd in deze PR.'
)
