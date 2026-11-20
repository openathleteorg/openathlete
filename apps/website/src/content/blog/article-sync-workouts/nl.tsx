import { DISCORD_URL } from '@/config';
import Link from 'next/link';

export function ContentNl() {
  return (
    <div>
      <p>
        Een gestructureerde training op je horloge doet drie handige dingen: het
        vertelt je wanneer elk blok begint en eindigt, het laat zien of je in
        het doelbereik zit, en het telt de herhalingen zodat jij dat niet hoeft
        te doen. Bij een training als 15&nbsp;min rustig, 5 × 4&nbsp;min op
        drempel met 2&nbsp;min dribbelen als herstel, 10&nbsp;min rustig, is dat
        het verschil tussen de training lopen en hoofdrekenen tijdens het lopen.
      </p>
      <p>
        Hoe de training van het schema naar je pols komt, hangt af van het merk.
        Deze gids behandelt de drie merken die trainingen uit andere apps
        accepteren (Garmin, COROS en Suunto), legt uit wat je met een Polar
        doet, en sluit af met een checklist voor de dag dat een training niet
        verschijnt.
      </p>

      <h2>Welke horloges trainingen kunnen ontvangen</h2>
      <p>
        Elk merk laat je een training maken in de eigen app. Minder merken laten
        een extern platform er een sturen.
      </p>
      <ul>
        <li>
          <strong>Garmin</strong> accepteert trainingen van goedgekeurde
          partners. Ze komen in je Garmin Connect-kalender terecht en bij de
          volgende synchronisatie op je horloge.
        </li>
        <li>
          <strong>Suunto</strong> accepteert ze als guides: ‘guide’ is
          Suunto&apos;s naam voor een gestructureerde training die je kiest bij
          het starten van een oefening.
        </li>
        <li>
          <strong>COROS</strong> accepteert gestructureerde loop-, trail- en
          fietstrainingen, die in de kalender van de COROS-app en daarna op het
          horloge verschijnen.
        </li>
        <li>
          Via de openbare API van <strong>Polar</strong> kunnen apps je
          activiteiten en slaap lezen, maar niets naar je account schrijven.
          Daarom kan OpenAthlete daar geen trainingen naartoe sturen. In Polar
          Flow kun je trainingen wel nog steeds met de hand maken.
        </li>
        <li>
          <strong>Strava</strong> kent helemaal geen gestructureerde trainingen,
          dus er is niets om naartoe te sturen.
        </li>
      </ul>

      <h2>Wat een training ‘gestructureerd’ maakt</h2>
      <p>
        Een horloge kan je alleen door blokken leiden. Elk blok heeft een lengte
        nodig (duur of afstand) en bij voorkeur een doel: een tempobereik, een
        hartslagbereik of een vermogensbereik. Herhalingen groeperen blokken,
        dus ‘5 × (4&nbsp;min op 4:10–4:20/km, 2&nbsp;min rustig)’ is één
        herhalingsblok van twee blokken.
      </p>
      <p>
        Een training die alleen ‘60 minuten rustig’ zegt, zonder blokken,
        verstuurt niets: er is niets waardoor het horloge je kan leiden. Wil je
        hem op je horloge, maak er dan één blok van 60 minuten van met een
        hartslagplafond.
      </p>
      <p>
        Doelen die als zones zijn opgegeven, verdienen een opmerking. Je zones
        op een trainingsplatform en de zones op je horloge zijn zelden dezelfde.
        Als een blok een van je zones als doel heeft, stuurt OpenAthlete de
        echte waarden (bijvoorbeeld 148–158&nbsp;bpm of 4:35–4:45/km) in plaats
        van ‘zone 3’, zodat het doel op je pols overeenkomt met het plan, welke
        zones het horloge ook voor je heeft opgeslagen. Hetzelfde geldt voor
        percentages van je maximale hartslag of drempelvermogen, zolang die
        waarden in je metingen staan.
      </p>

      <h2>Garmin</h2>
      <p>
        Zodra Garmin gekoppeld is en de export van trainingen aanstaat, gaat
        elke gestructureerde training naar je Garmin Connect-kalender. Het
        horloge haalt hem op bij de volgende synchronisatie met de app op je
        telefoon. Op de meeste recente Forerunner-, Fenix- en Venu-modellen
        krijg je een training die voor vandaag gepland staat aangeboden als je
        de bijbehorende activiteit start; anders vind je hem in het
        trainingsmenu onder trainingen of in de trainingskalender. De menunamen
        verschillen per model, dus kijk in de handleiding als je hem niet vindt.
      </p>
      <p>
        Verplaats of bewerk je de training in OpenAthlete, dan volgt de kopie
        bij Garmin. Verstuurd worden trainingen voor hardlopen, fietsen, zwemmen
        in het zwembad, krachttraining, cardio, yoga en pilates. Bij zwemmen in
        het zwembad accepteert Garmin alleen tempo als doel, dus vallen
        hartslagdoelen bij zwemblokken weg. Garmin beperkt een training ook tot
        100 blokken inclusief herhalingen, wat alleen uitmaakt als je heel lange
        baantrainingen stap voor stap uitschrijft.
      </p>
      <p>
        Details over het instellen vind je op de{' '}
        <Link href="/nl/connect/garmin">pagina over de Garmin-koppeling</Link>.
      </p>

      <h2>COROS</h2>
      <p>
        Loop-, trailrun- en fietstrainingen gaan naar COROS. Ze verschijnen in
        de kalender van de COROS-app en komen bij het synchroniseren op het
        horloge. Zwem- en krachttrainingen worden niet verstuurd.
      </p>
      <p>
        COROS heeft een eigenaardigheid die je vóór je wedstrijdweek moet
        kennen: een app kan daar geen geplande training verwijderen. Verplaats
        of verwijder je een training in OpenAthlete, dan blijft de oude in de
        COROS-kalender staan, gemarkeerd als geannuleerd, en verwijder je hem in
        de COROS-app. Kies bij het koppelen de regio waarin je je COROS-account
        hebt aangemaakt (Europa, de VS en andere regio&apos;s, of het Chinese
        vasteland); COROS bewaart elk account op precies één regionale server.
      </p>
      <p>
        De COROS-koppeling is de nieuwste en is live sinds november 2026.
        Details en bekende beperkingen staan op de{' '}
        <Link href="/nl/connect/coros">pagina over de COROS-koppeling</Link>.
      </p>

      <h2>Suunto</h2>
      <p>
        Loop-, trailrun-, fiets- en zwemtrainingen komen als guides aan in je
        Suunto-account. Op het horloge kies je de guide bij het starten van de
        oefening, net als elke andere Suunto-guide. Krachttrainingen blijven in
        OpenAthlete. Voor het instellen, zie de{' '}
        <Link href="/nl/connect/suunto">pagina over de Suunto-koppeling</Link>.
      </p>

      <h2>Polar: activiteiten erin, trainingen met de hand</h2>
      <p>
        Met een Polar-horloge kunnen je activiteiten, je slaap en je nachtelijke
        HRV nog steeds automatisch in OpenAthlete terechtkomen. Voor de training
        zelf heb je twee opties: maak hem in Polar Flow aan als trainingsdoel
        met fases en synchroniseer het horloge, of volg hem in de
        OpenAthlete-app op je telefoon. Geen van beide is zo handig als een
        directe synchronisatie, en dat is goed om te weten voordat je een
        horloge koopt als gestructureerde trainingen belangrijk voor je zijn.
      </p>

      <h2>Als je coach de trainingen plant</h2>
      <p>
        Trainingen gaan via de koppeling van de sporter, niet van de coach. Je
        coach kan in je kalender plannen, welk horloge hij of zij ook heeft, of
        zelfs zonder horloge. Zolang jij Garmin, COROS of Suunto gekoppeld hebt
        met de export van trainingen aan, komen de trainingen van je coach net
        zo op je pols als de trainingen die je zelf plant. Een coach kan
        sporters met alle drie de merken begeleiden zonder voor elk merk iets
        anders te doen.
      </p>

      <h2>De training staat niet op mijn horloge: een checklist</h2>
      <p>
        Loop de punten op volgorde na. De eerste twee verklaren de meeste
        gevallen.
      </p>
      <ul>
        <li>
          <strong>Valt de training binnen de komende zeven dagen?</strong>{' '}
          OpenAthlete stuurt de komende week, niet het hele plan. Een training
          over drie weken komt vanzelf op je horloge zodra hij binnen de komende
          zeven dagen valt. Trainingen in het verleden worden niet verstuurd.
        </li>
        <li>
          <strong>Heeft het horloge sindsdien gesynchroniseerd?</strong> De
          training komt eerst in Garmin Connect, de COROS-app of de Suunto-app
          terecht. Open de app van het merk op je telefoon en laat het horloge
          synchroniseren.
        </li>
        <li>
          <strong>Staat de export aan?</strong> Controleer onder Instellingen,
          Koppelingen of de export van trainingen voor dat merk aanstaat.
        </li>
        <li>
          <strong>Heeft de training blokken?</strong> Een duur zonder blokken
          verstuurt niets.
        </li>
        <li>
          <strong>Ondersteunt het merk deze sport?</strong> Een krachttraining
          gaat niet naar COROS of Suunto, een zwemtraining niet naar COROS.
        </li>
        <li>
          <strong>Kan je model gestructureerde trainingen volgen?</strong> De
          meeste recente loophorloges kunnen dat, sommige instap- of oudere
          modellen niet.
        </li>
        <li>
          <strong>Alleen bij COROS:</strong> een verplaatste training kan twee
          keer verschijnen, één keer gemarkeerd als geannuleerd. Verwijder de
          geannuleerde in de COROS-app.
        </li>
        <li>
          <strong>Nog steeds niets?</strong> Ontkoppel het merk onder
          Instellingen, Koppelingen en koppel het opnieuw. Vraag het daarna op
          onze <a href={DISCORD_URL}>Discord</a> en vermeld de datum van de
          training.
        </li>
      </ul>

      <h2>Met de hand</h2>
      <p>
        Je hebt geen platform nodig om een training op een horloge te krijgen.
        Garmin Connect, de COROS-app en Polar Flow hebben allemaal een
        trainingseditor: blokken toevoegen, opslaan, synchroniseren. Voor één
        kerntraining per week is dat tien minuten werk en werkt het prima.
        Lastig wordt het als een plan vaak verandert, als een coach trainingen
        schrijft voor meerdere sporters, of als de tempo&apos;s bijgewerkte
        zones moeten volgen. Dan loont het om een platform het versturen te
        laten doen.
      </p>
      <p>
        OpenAthlete stuurt in het gratis abonnement trainingen naar Garmin,
        COROS en Suunto, en importeert activiteiten van die drie plus Polar en
        Strava. Op de{' '}
        <Link href="/nl/features/watch-sync">
          pagina over horlogesynchronisatie
        </Link>{' '}
        vind je de volledige tabel per merk.
      </p>
    </div>
  );
}
