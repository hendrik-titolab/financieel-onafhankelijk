# Financiële Planning App — Projectdocumentatie

## Wat is dit?
Een React+Vite webapplicatie voor pensioenplanning en jaarruimteberekeningen. Gebouwd voor financieel adviseurs én voor publiek gebruik. Staat live op https://benikfinancieelonafhankelijk.nl

**Stack:** React 18 + Vite + TypeScript + Tailwind CSS  
**Hosting:** Vercel (automatisch deploy bij git push naar main)  
**Repo:** https://github.com/hendrik-titolab/financieel-onafhankelijk  
**Lokaal:** `C:\Users\schak\financiele-planning`

---

## Huidige staat van de app

### Tab 1: Pensioenplanning
- Twee-tabblad invoerpaneel: **Parameters** (sliders) en **Events** (life events + stortingen)
- Life events: naam + bedrag + jaar, progressieve rijen
- Stortingen/onttrekkingen: bedrag + jaar, progressieve rijen
- Monte Carlo analyse met twee gauges: 75% én 100% inkomensdoel
- Inflatie-display: "Toon nominale inkomensbedragen" — laat zien wat bijv. €4.000 nominaal waard is bij pensionering en daarna
- PDF export + Excel export + "Exporteer & sluit sessie" knop
- Vermogensgrafiek met Monte Carlo bandbreedte toggle

### Tab 2: Jaarruimte
- Pensioentype-keuze: **Geen / DB-pensioen / Wtp-pensioen**
  - DB: factor A invoer met bron (UPO t-1)
  - Wtp: werkgeverspremie invoer met bron (jaaroverzicht pensioenuitvoerder t-1)
- Dynamische labels die het juiste bronjaar tonen (bijv. "Inkomen 2024" bij jaarruimte 2025)
- Correcte formule per jaar:
  - Pre-2023: 13,3% × grondslag − 7,44 × factor A
  - 2023+: 30% × grondslag − 6,27 × factor A (DB) of − werkgeverspremie (Wtp)
- Reserveringsruimte met twee modi:
  - **Ik weet de bedragen**: direct onbenut bedrag per jaar invoeren
  - **Bereken voor mij**: uitklapbare kaartjes per jaar met inkomen + pensioentype + factor A → jaarruimte én onbenut automatisch berekend
- Berekeningen opslaan in localStorage, laden en verwijderen
- Progress bar (al ingelegd vs. totaal beschikbaar)

### Technische details
- Alle bedragen in reële koopkracht (reëel rendement na inflatie)
- Monte Carlo: 2.000 simulaties, Box-Muller normaalverdeling, parallel 75%-tracker
- Phase-aware tax: werkgeverspensioen belast met 36,97% pre-AOW, 19,07% post-AOW
- Data zit uitsluitend in localStorage van de browser — geen server, geen database
- PWA geconfigureerd (offline werking, installeerbaar als app)

---

## Deployment

### Live URL
https://benikfinancieelonafhankelijk.nl  
(domein geregistreerd via TransIP, DNS A-record → 216.198.79.1 Vercel)

### Vercel
- Project: `financieel-onafhankelijk` in account `titolab`
- Automatische deploy bij elke `git push` naar `main`
- HTTPS automatisch geregeld door Vercel

### Lokale dev server starten
```
cd C:\Users\schak\financiele-planning
npm run dev   (via Command Prompt, niet PowerShell)
```
Opent op http://localhost:5173

### Update deployen
```
cd C:\Users\schak\financiele-planning
git add .
git commit -m "Omschrijving van wijziging"
git push
```
Vercel deployt automatisch binnen ~1 minuut.

---

## Claude Skill: Jaarruimteberekening

Locatie: `C:\Users\schak\.claude\skills\jaarruimte-berekening\`

De skill helpt Claude correcte jaarruimteberekeningen uitvoeren. Bevat:
- Datakwaliteitswaarschuwing (garbage in = garbage out)
- Formules voor alle situaties (geen pensioen, DB, Wtp)
- Jaarlijks updatable parameters in `references/parameters.md`
- Verificatiestap na elke berekening

**Jaarlijkse update:** alleen `references/parameters.md` aanpassen met nieuwe belastingparameters zodra de Belastingdienst deze publiceert (oktober/november).

---

## Nog te doen / checklist

### Functionaliteit checken (na live gaan)
- [ ] Alle invoervelden starten met standaardwaarden voor elke bezoeker
- [ ] Berekeningen kloppen (steekproef met bekende getallen)
- [ ] PDF export werkt in productie
- [ ] Excel export werkt in productie
- [ ] Jaarruimte tab — alle drie pensioentypes correct
- [ ] Reserveringsruimte "Bereken voor mij" modus werkt correct
- [ ] Monte Carlo simulatie draait goed

### Privacy & AVG
- [ ] Privacyverklaring toevoegen (geen persoonsgegevens gaan naar server, alles in localStorage)
- [ ] Disclaimer toevoegen: "indicatieve berekening, geen officieel financieel advies"
- [ ] Cookiebanner overwegen (technisch niet nodig want geen tracking, maar voor de vorm)

### Nog te implementeren
- [ ] PWA installatie op Android tablet (rootcertificaat mkcert installeren — alleen voor lokaal gebruik)
- [ ] Mogelijk: uitleg/onboarding voor eerste gebruikers

### Jaarlijks terugkerende taak
- [ ] Parameters updaten in `src/utils/jaarruimte.ts` én in `C:\Users\schak\.claude\skills\jaarruimte-berekening\references\parameters.md` zodra nieuwe belastingparameters bekend zijn

---

## Belangrijke technische beslissingen

| Beslissing | Reden |
|---|---|
| Reëel rendement (na inflatie) | Koopkracht blijft behouden; €4.000 vandaag = €4.000 koopkracht bij pensionering |
| localStorage, geen backend | Privacy by design; geen persoonsgegevens op server |
| Phase-aware tax voor werkgeverspensioen | Vóór AOW-leeftijd 36,97%, erna 19,07% — cruciaal voor correcte overbruggingsperiode |
| Wtp onderscheid in jaarruimte | Formule wijkt af: 30% × grondslag − werkgeverspremie i.p.v. − 6,27 × factor A |
| Vercel voor hosting | Gratis, automatische HTTPS, eenvoudig koppelen van eigen domein |

---

## Bestandsstructuur (belangrijkste bestanden)

```
src/
├── types/index.ts              # Alle TypeScript types
├── utils/
│   ├── pensionCalc.ts          # Kernberekeningen pensioen
│   ├── monteCarlo.ts           # Monte Carlo simulatie
│   ├── jaarruimte.ts           # Jaarruimteberekeningen + parameters
│   ├── exportExcel.ts          # Excel export
│   └── exportPDF.ts            # PDF export
└── components/
    ├── PensionPlanner/
    │   ├── index.tsx            # Hoofdcomponent met state
    │   ├── InputPanel.tsx       # Invoerpaneel (Parameters + Events tabs)
    │   ├── ResultsPanel.tsx     # Resultaten, grafieken, Monte Carlo
    │   └── WealthChart.tsx      # Vermogensgrafiek
    └── Jaarruimte/
        └── index.tsx            # Jaarruimte tab (volledig)
```
