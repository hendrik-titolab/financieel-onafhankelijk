# Metingen, vanaf november 2026

GA4-property `565853781`, stream `16412900702`, tag `G-QT8H2CEQ29`. Search Console: `sc-domain:benikfinancieelonafhankelijk.nl`. De juiste sitemap is `/sitemap-index.xml`; die verwijst naar `/sitemap-0.xml`. `/sitemap.xml` bestaat hier niet.

Bekijk wekelijks 28 volledige dagen tegenover de voorgaande 28. De eerste vier weken zijn een nulmeting. Kijk per rekentool naar `tool_start`, `tool_result`, `tool_error`, `tool_no_response` en `tool_export`. `tool_id` geeft aan welke van de zeven tools gebruikt is. Een standaardvoorbeeld bij het laden telt niet als berekening door de bezoeker. Pas na invoer telt een resultaat. Export telt pas nadat de exportfunctie zonder fout terugkeert; dat bewijst niet dat iemand het bestand heeft geopend.

De FO-planner meldt een berekenfout zichtbaar en maakt opnieuw proberen mogelijk. Mislukte exports tonen ook een melding. Een wachttijd van 20 seconden zonder resultaatevent geeft `tool_no_response`; dit is een signaal, geen bewijs dat de berekening servermatig mislukte. De fiscale rekenkern en aannames zijn niet gewijzigd.

## Privacy

De gedeelde laag in `public/site-meting.js` laadt Google pas na toestemming. Weigering stuurt geen Google-pings. Cookiekeuze staat in de footer en op de planner. Intrekken verwijdert Analytics-cookies en herlaadt de pagina. Keuze: 180 dagen. Analytics-cookie: één jaar zonder telkens verlengen. GA4-gebeurtenissen: 14 maanden; samengevoegde standaardrapporten kunnen langer beschikbaar blijven.

Geen bedragen, vermogen, inkomen, geboortedatum, andere invoer, query's, veldinhoud of foutteksten naar GA4. Alleen vaste labels en veilige openbare paginapaden. Geen sessieopnamen of heatmaps. Uitgebreide meting en advertentiefuncties staan uit. Previews meten niet. De Vercel-bezoekersteller is verwijderd om dubbele meting te voorkomen. Consent en blokkeerders betekenen dat GA4 geen complete teller is.

## Gevonden worden

Gebruik Search Console voor zoekvragen, pagina's, klikken, vertoningen, indexering en de ondersteunde Google AI-rapportage. Een agent kan de tekst ophalen zonder JavaScript; zo'n aanvraag verschijnt niet noodzakelijk in GA4. Hostinglogs meten dat verkeer apart. AI-verwijzingen in GA4 zijn alleen bezoeken met een herkenbare verwijzer. Het is geen telling van alle vermeldingen door AI.

## Controle en publicatie

`npm test`, `npm run check`, `npm run build`. Controleer daarna op productie dat zonder toestemming geen Google-script laadt, dat toestaan en intrekken werken en dat eigen invoer werkelijk een resultaatevent geeft. Controleer ontvangst in GA4 Realtime. Een groene build bewijst geen Google-ontvangst.

Op 25 november 2026 is op GitHub `main` de defaultbranch op commit `e989d0e`; de oude documentatie over `astro-migratie` was verouderd. Controleer de productiebranch in Vercel bij publicatie, zodat nieuwe versies automatisch op de juiste branch worden gebouwd.
