import Link from 'next/link';

export function ContentNl() {
  return (
    <div>
      <p>
        OpenAthlete is een trainingsplatform voor duursporters en hun coaches.
        Het heeft een kalender voor geplande trainingen, gestructureerde
        workouts die naar je horloge gaan, activiteiten die ervan terugkomen,
        een model voor trainingsbelasting en een gedeelde ruimte waar coach en
        atleet aan hetzelfde plan werken. De code is open source onder de
        AGPL-3.0-licentie. De gehoste versie is gratis, en je kunt het platform
        ook op je eigen server draaien.
      </p>
      <p>
        Deze pagina legt uit waarom OpenAthlete bestaat, wat het vandaag kan en,
        minstens zo nuttig, wat het niet kan.
      </p>

      <h2>Waarom het bestaat</h2>
      <p>
        OpenAthlete wordt gebouwd door een onafhankelijke ontwikkelaar uit
        Grenoble die ultra&apos;s loopt. Er zitten geen investeerders achter.
        Het begon met een bekende routine: het seizoen plannen in een
        spreadsheet, elke intervaltraining opnieuw intikken in de app van de
        horlogefabrikant en dan een derde app openen om te zien of de training
        volgens plan was verlopen. Drie tools, en geen van alle wist van de
        andere.
      </p>
      <p>
        De commerciële platforms die dit goed oplossen, zijn goede producten. Ze
        rekenen coaches wel per atleet af en bewaren jaren aan
        trainingsgeschiedenis op hun servers, onder hun voorwaarden. Toen
        Today&apos;s Plan in maart 2024 stopte, ontdekten de gebruikers hoeveel
        van die geschiedenis ze echt konden meenemen. In juli 2026 kocht Garmin
        TrainingPeaks, een van de bekendste coachingplatforms, waarmee de
        plannen van veel coaches in handen van een horlogefabrikant kwamen.
      </p>
      <p>
        Het idee achter OpenAthlete is dat de kern van een trainingsplatform
        (een kalender, gestructureerde workouts, een belastingsmodel, een
        koppeling met het horloge) infrastructuur is. En infrastructuur is beter
        als iedereen haar kan lezen, draaien en in leven houden.
      </p>

      <h2>Wat het vandaag kan</h2>
      <p>
        <strong>Plannen.</strong> Je bouwt workouts stap voor stap op,
        bijvoorbeeld 15 minuten rustig, 5 × 4 minuten op drempel met 2 minuten
        dribbelen, 10 minuten rustig, en de doelen komen uit je eigen zones,
        tempo&apos;s of percentages van VMA (maximale aerobe snelheid), FTP of
        maximale hartslag. Trainingen staan in een kalender waarin je ze kunt
        verslepen, en een coach kan hele weken tegelijk verplaatsen of kopiëren.
      </p>
      <p>
        <strong>Je horloge.</strong> Geplande workouts worden naar horloges van
        Garmin, Suunto en COROS gestuurd. Voltooide activiteiten komen binnen
        via Garmin, COROS, Suunto, Polar en Strava, of uit een FIT-, GPX- of
        TCX-bestand. Als je een account koppelt, halen Strava en COROS je
        volledige geschiedenis op, Garmin en Suunto de laatste 30 dagen en Polar
        alleen nieuwe activiteiten.
      </p>
      <p>
        <strong>Trainingsbelasting.</strong> De belasting wordt met TRIMP
        berekend uit de hartslag, en daarnaast wordt de session-RPE vastgelegd.
        Fitheid, vermoeidheid en vorm (CTL, ATL en TSB) worden doorgerekend over
        de trainingen die je hebt gepland, zodat je ziet wat de komende drie
        weken met je vorm doen, vóór de wedstrijd in plaats van erna. De pagina
        over <Link href="/nl/features/training-load">trainingsbelasting</Link>{' '}
        legt het model uit.
      </p>
      <p>
        <strong>Coaching.</strong> Een coach plant rechtstreeks in de kalender
        van elke atleet, hergebruikt sjablonen en ziet wat er echt gedaan is.
        Een atleet kan meer dan één coach hebben, en er is een groepschat. Tot
        vijf atleten coachen is gratis. Een club wordt geopend door een
        Supporter, en leden en coaches doen gratis mee; de club heeft groepen en
        hun coaches, een gedeelde workoutbibliotheek, wekelijkse clubtrainingen
        en plannen die naar een hele groep worden gekopieerd, en atleten die een
        coach via een club begeleidt, tellen niet mee voor die limiet.
      </p>
      <p>
        <strong>AI, als je dat wilt.</strong> Er draait niets voordat je
        toestemming geeft, en je kunt die toestemming altijd intrekken. Staat
        het aan, dan kan AI een gestructureerde training schrijven uit één zin,
        een training aanpassen op basis van een korte instructie, je na een
        activiteit drie of vier vragen stellen en je antwoorden omzetten in een
        inspanningsscore en een pijnnotitie die je coach kan zien, elke nieuwe
        activiteit kort duiden en de belasting van een geplande training
        inschatten. Je gebruikt je eigen API-sleutel (OpenAI, Anthropic, Google,
        Mistral en andere, of een lokaal model op een zelf gehoste instantie) of
        het tegoed dat bij het Supporter-abonnement hoort. Er is geen chat in de
        app: wil je een gesprek, dan laat de{' '}
        <Link href="/nl/features/mcp-server">MCP-server</Link> Claude of ChatGPT
        je training lezen en trainingen in je kalender plannen.
      </p>

      <h2>Wat het niet kan</h2>
      <ul>
        <li>
          Workouts kunnen niet naar Polar-horloges of naar Strava worden
          gestuurd. Beide zijn alleen een bron van activiteiten.
        </li>
        <li>
          Er is geen clubfacturatie: lid worden van een club is gratis, en
          contributie wordt buiten OpenAthlete geregeld.
        </li>
        <li>
          Het voorspelt geen blessures. Het legt pijn vast wanneer atleten die
          melden en laat die aan hun coach zien. Dat is minder indrukwekkend,
          maar eerlijker.
        </li>
        <li>Eenheden zijn alleen metrisch.</li>
        <li>
          De koppeling met COROS is nieuw, dus reken op wat ruwe randjes en laat
          het ons weten als je er een tegenkomt.
        </li>
      </ul>

      <h2>Hoe het betaald wordt</h2>
      <p>
        Alles wat je nodig hebt om te trainen is gratis in de gehoste versie.
        Het Supporter-abonnement, vanaf € 5 per maand of € 50 per jaar,
        financiert het project en voegt als bedankje het Lab toe, eerdere
        toegang tot nieuwe functies, de geavanceerde coachtools en clubs,
        coaching voor meer dan vijf atleten en AI die op de sleutels van
        OpenAthlete draait, binnen een wekelijks tegoed voor redelijk gebruik
        dat elke maandag opnieuw begint. Zelf hosten is gratis, zonder limieten.
        Details staan op de <Link href="/nl/pricing">prijspagina</Link>.
      </p>
      <p>
        De gehoste API en database draaien bij OVH in Frankrijk, en de webapp
        wordt geleverd via Vercel. Een zelf gehoste instantie stuurt niets naar
        OpenAthlete, en een geautomatiseerde test controleert dat bij elke
        release.
      </p>

      <h2>Waar je begint</h2>
      <p>
        Train je alleen, koppel dan je horloge, stel je zones in (de{' '}
        <Link href="/nl/tools/heart-rate-zones">hartslagzonecalculator</Link> is
        een redelijk startpunt als je ze nog nooit hebt gemeten) en plan één
        week. Ben je coach, nodig dan eerst één atleet uit en draai samen een
        volledige week voordat je iedereen overzet.
      </p>
      <p>
        De broncode staat op{' '}
        <a href="https://github.com/openathleteorg/openathlete">GitHub</a>.
        Bugmeldingen en functieverzoeken horen daar of op Discord. Ze worden
        gelezen en bepalen voor een groot deel wat er hierna gebouwd wordt.
      </p>
    </div>
  );
}
