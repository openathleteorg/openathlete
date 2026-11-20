import Link from 'next/link';

export function ContentNl() {
  return (
    <div>
      <p>
        Een paar jaar trainingsgeschiedenis is een hoop materiaal: elke
        intervaltraining, elke hartslagcurve, elke notitie als “vijf uur
        geslapen, benen dood”. Voor een coach is het nog meer: jaren aan
        gestructureerde workouts, sjablonen en seizoenen die voor elke atleet
        zijn opgebouwd. Waar dat materiaal staat en wie beslist wat ermee
        gebeurt, lijkt een abstracte vraag, tot de dag waarop een platform stopt
        of van eigenaar wisselt.
      </p>

      <h2>Platforms stoppen en wisselen van eigenaar</h2>
      <p>
        Today’s Plan, een platform voor training en coaching, stopte in maart
        2024. De gebruikers moesten exporteren wat ze konden en elders opnieuw
        beginnen. In juli 2026{' '}
        <a href="https://www.garmin.com/en-US/newsroom/press-release/corporate/garmin-acquires-trainingpeaks-and-trainheroic-leading-endurance-and-strength-training-platforms-for-athletes-and-coaches/">
          nam Garmin TrainingPeaks en TrainHeroic over
        </a>
        . TrainingPeaks gaat gewoon door, en niets wijst erop dat andere merken
        anders behandeld zullen worden. Maar de schema’s, workoutbibliotheken en
        coachingrelaties van veel duursportcoaches zijn nu in handen van een
        horlogefabrikant, en beslissingen over dat platform worden genomen met
        de belangen van Garmin in het achterhoofd.
      </p>
      <p>
        Niets hiervan is een schandaal. Bedrijven worden overgenomen en gaan
        soms failliet. Het punt is dat je trainingsgeschiedenis op een gesloten
        platform maar zo duurzaam is als het bedrijf erachter.
      </p>

      <h2>Wat “je gegevens exporteren” je echt oplevert</h2>
      <p>
        Woon je in de EU, dan geeft artikel 20 van de AVG je recht op
        dataportabiliteit: de gegevens die je hebt verstrekt, in een
        gestructureerd, machineleesbaar formaat. In de praktijk verschilt het
        sterk wat je kunt meenemen. Activiteitsbestanden (FIT, GPX) komen er
        meestal goed uit, omdat elke tool ze kan lezen. Geplande workouts,
        opmerkingen van je coach, sjablonen en de manier waarop een seizoen is
        opgebouwd zijn een ander verhaal: die worden vaak opgeslagen in een
        eigen formaat van het platform, en zelfs als je ze kunt exporteren, kan
        misschien niets anders ze importeren.
      </p>
      <p>
        Twee gewoontes helpen, welke tool je ook gebruikt. Laat je activiteiten
        naar meer dan één plek stromen, bijvoorbeeld van je horlogeaccount naar
        zowel je trainingsplatform als een tweede dienst, zodat geen enkel
        bedrijf de enige kopie heeft. En vraag één keer per jaar een volledige
        export aan, voordat je hem nodig hebt, om te zien wat je echt zou
        krijgen.
      </p>

      <h2>Wat open source verandert, en wat niet</h2>
      <p>
        De code van OpenAthlete is{' '}
        <a href="https://github.com/openathleteorg/openathlete">openbaar</a>.
        Dat heeft een paar concrete gevolgen. Je kunt lezen hoe de
        trainingsbelasting wordt berekend in plaats van een black box te
        vertrouwen. Je kunt zien welke gegevens de server verlaten en waar ze
        naartoe gaan. En als het project morgen zou stoppen, zouden de code, het
        databaseschema en de migratiebestanden er nog steeds zijn, en kan
        iedereen het blijven draaien. De gegevens zelf staan in een gewone
        PostgreSQL-database, niet in een formaat dat maar één bedrijf begrijpt.
      </p>
      <p>
        Open source maakt software niet vanzelf veilig. Code die niemand leest,
        is niet veiliger omdat hij openbaar is, en een klein project heeft
        minder reviewers dan een populair project. Het garandeert ook niet dat
        iemand het blijft onderhouden. Wat het wel garandeert, is dat je mag
        kijken, en dat de mogelijkheid bestaat om zonder de oorspronkelijke
        auteur verder te gaan.
      </p>

      <h2>Waarom de AGPL</h2>
      <p>
        OpenAthlete valt onder de{' '}
        <a href="https://www.gnu.org/licenses/agpl-3.0.html">
          GNU Affero General Public License v3
        </a>
        . Iedereen mag het gebruiken, aanpassen, draaien en verder verspreiden.
        De voorwaarde is dat als je het aanpast en mensen jouw versie via een
        netwerk laat gebruiken, je die gebruikers de broncode van jouw versie
        moet aanbieden. De gewone GPL eist dat niet voor software die als
        webdienst draait, en daarom bestaat de Affero-variant.
      </p>
      <p>
        In de praktijk betekent het dat niemand OpenAthlete kan nemen, er
        functies aan kan toevoegen en het als gesloten gehoste dienst kan
        verkopen. Verbeteringen van iedereen die het voor anderen draait, komen
        bij iedereen terug. De gehoste versie op openathlete.org draait dezelfde
        openbare code; functies die alleen daar zinvol zijn, zoals betalingen,
        staan uit zolang ze niet zijn geconfigureerd.
      </p>

      <h2>Zelf hosten, eerlijk gezegd</h2>
      <p>
        Je kunt OpenAthlete op je eigen server draaien met de{' '}
        <code>docker-compose.yml</code> uit de repository of de gepubliceerde
        images op GHCR. Het heeft PostgreSQL en Redis nodig, die allebei in het
        compose-bestand zitten. Het is gratis, zonder limiet op het aantal
        atleten en zonder betaalmuur. Een zelf gehoste instantie stuurt niets
        naar OpenAthlete, en een geautomatiseerde test controleert dat bij elke
        release. Je kunt single sign-on via OIDC koppelen, kiezen voor open
        registratie, alleen op uitnodiging of gesloten, en de AI-functies op een
        lokaal model via Ollama draaien, zodat er helemaal niets je computer
        verlaat.
      </p>
      <p>
        De kosten zijn wel echt. Jij bent verantwoordelijk voor back-ups,
        updates en beveiliging. Koppelingen met horloges gebruiken je eigen
        ontwikkelaarsgegevens bij elke aanbieder: sommige, zoals Strava, heb je
        snel, andere, zoals Garmin, beoordelen aanvragen voordat ze API-toegang
        geven. FIT-, GPX- of TCX-bestanden uploaden werkt zonder dat allemaal.
        Zelf hosten is het zinvolst voor een coach of een groep met iemand die
        handig is met het beheren van een server, of voor een organisatie die de
        gegevens van haar atleten op eigen infrastructuur nodig heeft. De{' '}
        <Link href="/nl/self-hosting">pagina over zelf hosten</Link> legt de
        installatie uit.
      </p>

      <h2>Als je liever geen server beheert</h2>
      <p>
        Alles wat je nodig hebt om te trainen is gratis in de gehoste versie. De
        API en database draaien bij OVH in Frankrijk en de webapp wordt geleverd
        door Vercel. Het Supporter-abonnement (vanaf €&nbsp;5 per maand of
        €&nbsp;50 per jaar) helpt de servers te betalen en voegt als bedankje
        het Lab toe, eerdere toegang tot nieuwe functies, de geavanceerde
        coachtools en clubs, AI op de sleutels van OpenAthlete en coaching voor
        meer dan vijf atleten. Meer over de gedachte achter het project lees je
        op de <Link href="/nl/open-source">open-sourcepagina</Link>.
      </p>
    </div>
  );
}
