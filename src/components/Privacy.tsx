import { FEEDBACK_URL } from '../config/site'

// ── Privacy en gegevensgebruik ────────────────────────────────────────────────
// Inhoudelijk vergelijkbaar met src/pages/privacy.astro op de astro-migratie-
// branch, maar aangepast aan wat déze (main) versie van de app daadwerkelijk
// doet: geen localStorage-opslag van berekeningen (dat zit alleen in de
// astro-migratie-jaarruimtetool), wel een PWA-servicemedewerker die appbestanden
// cachet voor offline gebruik.

export function Privacy() {
  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 py-10">
      <h1 className="text-3xl font-bold text-slate-900 mb-6">Privacy en gegevensgebruik</h1>

      <div className="text-slate-600 leading-relaxed space-y-4 text-sm">
        <p>
          Kort samengevat: je hoeft geen account aan te maken, we zetten geen trackingcookies, en
          we verkopen je gegevens niet. We tellen wel, cookieloos, hoeveel bezoekers de site
          gebruiken. Hieronder staat precies wat er wel gebeurt.
        </p>

        <h2 className="text-lg font-semibold text-slate-900 pt-3">Rekentools</h2>
        <p>
          De bedragen die je invult in de pensioenplanner en de bruto-netto-calculator worden
          alleen in je eigen browser verwerkt, om de berekening te tonen. Ze gaan niet naar een
          server en worden nergens door ons opgeslagen: sluit of ververs je de pagina, dan is de
          invoer weg.
        </p>
        <p>
          Eén uitzondering: we houden lokaal in je browser (localStorage) een simpel getal bij,
          hoe vaak je een Excel- of PDF-bestand hebt gedownload. Daarmee beperken we het aantal
          gratis downloads. Dat getal bevat geen persoonsgegevens, gaat niet naar een server en
          verdwijnt als je je browsergegevens wist.
        </p>

        <h2 className="text-lg font-semibold text-slate-900 pt-3">Cookies en meetgegevens</h2>
        <p>
          Deze site zet geen trackingcookies. We gebruiken wel Vercel Web Analytics om te zien
          hoeveel mensen de site en de rekentools bezoeken. Die meting werkt zonder cookies en
          zonder een profiel van jou persoonlijk op te bouwen: we zien bezoekersaantallen per
          pagina en waar bezoekers vandaan komen, niet wie je bent.
        </p>
        <p>
          De hostingpartij (Vercel) verwerkt, zoals elke webhost, technische gegevens die nodig
          zijn om de site te laten werken en beschikbaar te houden, zoals IP-adressen in
          serverlogs. Dat gebeurt buiten onze directe controle om, op infrastructuurniveau.
        </p>

        <h2 className="text-lg font-semibold text-slate-900 pt-3">Installeren als app</h2>
        <p>
          Deze site kan als app op je apparaat geïnstalleerd worden en werkt dan ook offline. Wat
          daarvoor lokaal wordt opgeslagen, zijn alleen de appbestanden zelf (zoals de code en
          vormgeving), zodat de tool sneller laadt en zonder internetverbinding werkt. Er worden
          geen persoonlijke gegevens in die opslag bewaard.
        </p>

        <h2 className="text-lg font-semibold text-slate-900 pt-3">Feedbackformulier</h2>
        <p>
          Laat je feedback achter via{' '}
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
          , dan loopt dat via Google Formulieren. Wat je daar invult (en eventueel je e-mailadres,
          als je dat zelf toevoegt) valt onder het privacybeleid van Google, niet onder dat van
          ons. We gebruiken de reacties alleen om de site en de tools te verbeteren.
        </p>

        <h2 className="text-lg font-semibold text-slate-900 pt-3">Vragen</h2>
        <p>
          Vraag over deze pagina, of denk je dat er iets niet klopt? Laat het weten via hetzelfde{' '}
          {FEEDBACK_URL && (
            <a
              href={FEEDBACK_URL}
              className="text-primary-600 hover:text-primary-700 underline"
              rel="noopener"
              target="_blank"
            >
              feedbackformulier
            </a>
          )}
          .
        </p>

        <p className="text-xs text-slate-400 pt-3">Laatst bijgewerkt: 10 augustus 2026.</p>
      </div>
    </div>
  )
}
