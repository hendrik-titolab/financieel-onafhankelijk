import { FEEDBACK_URL } from '../config/site'

// ── Algemene voorwaarden ──────────────────────────────────────────────────────
// Zelfde inhoud als src/pages/voorwaarden.astro op de astro-migratie-branch.
// Bij een tekstwijziging: allebei bijwerken zolang de cutover niet heeft
// plaatsgevonden.

export function Voorwaarden() {
  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 py-10">
      <h1 className="text-3xl font-bold text-slate-900 mb-6">Algemene voorwaarden</h1>

      <div className="text-slate-600 leading-relaxed space-y-4 text-sm">
        <p>
          Deze voorwaarden gelden voor het gebruik van benikfinancieelonafhankelijk.nl: alle
          rekentools en alle uitlegartikelen. Door de site te gebruiken ga je hiermee akkoord.
        </p>

        <h2 className="text-lg font-semibold text-slate-900 pt-3">1. Wie we zijn</h2>
        <p>
          Deze site wordt uitgegeven door Titolab. Titolab is onderdeel van HendrikSchakel
          Holding B.V., handelend onder KvK-nummer 51309963, btw-nummer NL823206567B01.
        </p>

        <h2 className="text-lg font-semibold text-slate-900 pt-3">2. Wat deze site is, en wat niet</h2>
        <p>
          Ben ik financieel onafhankelijk? geeft gratis uitleg en rekentools over financiële
          onafhankelijkheid, pensioen en vermogensopbouw. Er is geen account nodig en je betaalt
          niets.
        </p>
        <p>
          Wat je hier vindt is geen financieel, fiscaal of juridisch advies, en ook geen
          aanbeveling voor een product van een specifieke aanbieder. De uitleg en de rekentools
          zijn bedoeld om je op weg te helpen, niet om een besluit op te baseren. Voor advies dat
          rekening houdt met je hele situatie raadpleeg je een erkend adviseur, bijvoorbeeld via{' '}
          <a
            href="https://ffp.nl"
            className="text-primary-600 hover:text-primary-700 underline"
            rel="noopener"
            target="_blank"
          >
            ffp.nl
          </a>
          . We rekenen bewust met een kansverdeling (Monte Carlo-simulatie) in plaats van één
          uitkomst, zodat je een realistisch beeld krijgt in plaats van schijnzekerheid.
        </p>

        <h2 className="text-lg font-semibold text-slate-900 pt-3">3. Gebruik van de rekentools</h2>
        <p>
          De rekentools werken met de gegevens die je zelf invult en met aannames over onder meer
          rendement, inflatie en belastingen. Verander je de aannames, dan verandert de uitkomst
          mee.
        </p>
        <p>
          De uitkomsten zijn indicatief: een inschatting op basis van de huidige regels en de
          aannames die je hebt gekozen, geen garantie voor de toekomst. Aan een berekening op deze
          site kun je geen rechten ontlenen.
        </p>

        <h2 className="text-lg font-semibold text-slate-900 pt-3">4. Aansprakelijkheid</h2>
        <p>
          We besteden zorg aan de juistheid van de rekentools en de content, en rekenen met
          openbare, controleerbare bronnen zoals cijfers van de Belastingdienst en het CBS. Toch
          kan er een fout in zitten, of kunnen regels inmiddels zijn gewijzigd.
        </p>
        <p>
          Titolab is niet aansprakelijk voor schade die voortkomt uit het gebruik van deze site of
          uit beslissingen die je baseert op de rekentools of de content, behalve bij opzet of
          grove nalatigheid. Gebruik van de site is op eigen risico.
        </p>

        <h2 className="text-lg font-semibold text-slate-900 pt-3">5. Intellectueel eigendom</h2>
        <p>
          De teksten, rekentools en vormgeving van deze site zijn eigendom van Titolab, tenzij
          anders vermeld. Je mag de site gebruiken voor persoonlijk gebruik en, met
          bronvermelding, een enkel citaat of rekenvoorbeeld overnemen. Een heel artikel of de
          rekentool zelf kopiëren, herpubliceren of commercieel hergebruiken mag alleen met
          voorafgaande schriftelijke toestemming.
        </p>

        <h2 className="text-lg font-semibold text-slate-900 pt-3">6. Wijzigingen van deze voorwaarden</h2>
        <p>
          We kunnen deze voorwaarden aanpassen, bijvoorbeeld als de site of de wetgeving
          verandert. De datum onderaan deze pagina laat zien wanneer dat voor het laatst gebeurde.
          Gebruik je de site na een wijziging, dan geldt de nieuwe versie.
        </p>

        <h2 className="text-lg font-semibold text-slate-900 pt-3">7. Toepasselijk recht</h2>
        <p>
          Op deze voorwaarden is Nederlands recht van toepassing. Komen we er samen niet uit, dan
          leggen we het geschil voor aan de bevoegde rechter in Amsterdam.
        </p>

        <h2 className="text-lg font-semibold text-slate-900 pt-3">8. Contact</h2>
        <p>
          Vraag over deze voorwaarden, of denk je dat er iets niet klopt? Laat het weten via{' '}
          {FEEDBACK_URL && (
            <a
              href={FEEDBACK_URL}
              className="text-primary-600 hover:text-primary-700 underline"
              rel="noopener"
              target="_blank"
            >
              het feedbackformulier
            </a>
          )}
          .
        </p>

        <p className="text-xs text-slate-400 pt-3">Laatst bijgewerkt: 10 augustus 2026.</p>
      </div>
    </div>
  )
}
