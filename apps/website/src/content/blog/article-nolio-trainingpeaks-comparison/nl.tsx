import Link from 'next/link';

import { pricesFor } from './prices';

const { quoted: q, coachYear } = pricesFor('nl');

export function ContentNl() {
  return (
    <div>
      <p>
        Coach je duursporters in Frankrijk, of ergens waar Franse clubs de toon
        zetten, dan komt de keuze vaak neer op TrainingPeaks of Nolio. Dit
        artikel voegt OpenAthlete toe, dat wij zelf bouwen, en vergelijkt de
        drie vanuit de stoel van een coach: wat je betaalt als je groep groeit,
        wat je atleten nodig hebben en wat elk van de drie beter doet dan de
        andere. De prijzen komen van de prijspagina van elke aanbieder,
        gecontroleerd op 3 november 2026. Dollarprijzen zijn exclusief
        belasting, zoals TrainingPeaks ze toont.
      </p>

      <h2>Drie prijslogica's</h2>
      <p>
        <strong>TrainingPeaks</strong> rekent per atleet. Het coachplan begint
        bij {q('tpCoach')} per maand met vier Basic-atleten en één op Premium;
        elke extra Premium-atleet kost {q('tpPerMax')} per maand, aflopend naar{' '}
        {q('tpPerMin')} bij grotere aantallen. Er is een opstartkost van{' '}
        {q('tpSetup')}, die vervalt met een promotiecode. Atleten kunnen op
        Basic blijven ({q('tpCoachUnlimited')} per maand dekt er zoveel je
        wilt), maar dan komen hun geplande workouts niet op het horloge. De
        meeste coaches betalen daarom Premium, of vragen atleten om zelf{' '}
        {q('tpYear')} per jaar te betalen.
      </p>
      <p>
        <strong>Nolio</strong> rekent per staffel. Starter kost {q('nStarter')}{' '}
        per maand voor 3 atleten, Classic {q('nClassic')} voor 25, en Pro{' '}
        {q('nPro')} voor 30 atleten met twee coaches; een extra coach kost{' '}
        {q('nExtraCoach')} per maand. Atleten hoeven niet te betalen voor
        synchronisatie met hun horloge: het gratis atletenabonnement bevat die.
        Clubs hebben eigen abonnementen, Club Starter voor {q('nClubStarter')}{' '}
        en Club Classic voor {q('nClubClassic')} per maand.
      </p>
      <p>
        <strong>OpenAthlete</strong> is gratis tot vijf atleten. Daarboven heft
        het Supporter-abonnement, vanaf {q('oaYear')} per jaar, de limiet op,
        hoe groot je groep ook is, en voegt het ook AI op onze sleutels toe.
        Synchronisatie met het horloge is gratis voor atleten. Zelf hosten is
        gratis en zonder limieten. Clubs krijgen een gratis clubomgeving, en
        atleten die een coach via een club begeleidt, tellen niet mee voor de
        vijf.
      </p>

      <table>
        <thead>
          <tr>
            <th>Atleten</th>
            <th>TrainingPeaks (atleten op Premium)</th>
            <th>Nolio</th>
            <th>OpenAthlete</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>3</td>
            <td>{coachYear('trainingpeaks', 3)}</td>
            <td>{coachYear('nolio', 3)} (Starter)</td>
            <td>Gratis</td>
          </tr>
          <tr>
            <td>10</td>
            <td>{coachYear('trainingpeaks', 10)}</td>
            <td>{coachYear('nolio', 10)} (Classic)</td>
            <td>{q('oaYear')}</td>
          </tr>
          <tr>
            <td>25</td>
            <td>{coachYear('trainingpeaks', 25)}</td>
            <td>{coachYear('nolio', 25)} (Classic)</td>
            <td>{q('oaYear')}</td>
          </tr>
          <tr>
            <td>30</td>
            <td>{coachYear('trainingpeaks', 30)}</td>
            <td>{coachYear('nolio', 30)} (Pro)</td>
            <td>{q('oaYear')}</td>
          </tr>
        </tbody>
      </table>
      <p>
        Jaarlijkse kosten voor één coach, tegen catalogusprijzen: maandelijkse
        facturering voor Nolio en TrainingPeaks, het kleinste jaarlijkse
        Supporter-bedrag voor OpenAthlete. Prijzen gecontroleerd op 3 november
        2026. De kolom TrainingPeaks gaat ervan uit dat de coach voor elke
        atleet Premium betaalt; betalen je atleten hun eigen Premium al, dan is
        je rekening veel lager.
      </p>

      <h2>Waar elk het best in is</h2>
      <p>
        <strong>TrainingPeaks</strong> is de gemeenschappelijke taal. Veel
        atleten komen binnen met een account en een geschiedenis daar, veel
        coaches denken in TSS en de Performance Management Chart, en als je
        schema's verkoopt, zet de marketplace ze voor kopers. De mobiele apps
        zijn volwassen, en TrainingPeaks Virtual dekt indoorfietsen af. Sinds 22
        juli 2026 is het van Garmin; wat dat kan veranderen, lees je in{' '}
        <Link href="/nl/blog/trainingpeaks-alternatives-after-garmin-acquisition">
          alternatieven voor TrainingPeaks na de overname door Garmin
        </Link>
        .
      </p>
      <p>
        <strong>Nolio</strong> is gebouwd voor Franse clubs. Het is een bedrijf
        uit Grenoble, partner van de Franse atletiekbond, met prijzen voor
        verenigingen, meerdere coaches op één account, native apps voor iOS en
        Android en een bibliotheek met meer dan 200 oefenvideo's voor
        krachttraining. Wil je club één account voor drie coaches en zestig
        leden, met native apps op elke telefoon, dan heeft Nolio daar precies
        een abonnement voor.
      </p>
      <p>
        <strong>OpenAthlete</strong> houdt de prijs vast en voegt een paar
        dingen toe waar de andere twee geen reclame mee maken. AI draait op je
        eigen sleutel (of het Supporter-tegoed): je schrijft „10 km rustig, dan
        6 × 400 m op 5 km-tempo” en krijgt een gestructureerde training met de
        zones van de atleet; na elke activiteit krijgt de atleet een korte
        lezing en een paar vragen, en de gemelde inspanning en eventuele pijn
        komen in een blessurelogboek en op je dashboard. Via de MCP-server
        kunnen Claude of ChatGPT de training van een atleet lezen en tot 60
        trainingen in diens kalender plannen. Clubs krijgen een gratis
        clubomgeving zonder atletenlimiet: groepen met eigen coaches, een
        gedeelde bibliotheek, wekelijkse clubtrainingen waarop atleten reageren,
        en een training, dag of week die naar een hele groep wordt gekopieerd en
        aan de zones van elke atleet wordt aangepast. De code is AGPL-3.0, dus
        een club kan ook een eigen instantie draaien met single sign-on en
        registratie alleen op uitnodiging.
      </p>

      <h2>Wat elk mist</h2>
      <p>
        TrainingPeaks noemt op zijn prijspagina's geen ingebouwde AI, en de
        kosten per atleet lopen snel op als je Premium betaalt. De
        coachabonnementen van Nolio zijn betaald vanaf de eerste atleet, en
        Nolio maakt geen reclame met AI. Geen van beide is open source.
      </p>
      <p>
        De gaten in OpenAthlete zijn ook echt. De clubomgeving heeft geen
        clubfacturering: lidmaatschapsgeld blijft buiten OpenAthlete. Geen
        marketplace, geen bibliotheek met oefenvideo's, geen samenwerking met
        een bond. Workouts gaan naar horloges van Garmin, Suunto en COROS, niet
        naar Polar. Trainingsbelasting is Banister-TRIMP op basis van hartslag,
        met session-RPE ernaast, dus de getallen komen niet overeen met TSS als
        je atleten van TrainingPeaks komen.
      </p>

      <h2>Drie coaches, drie antwoorden</h2>
      <p>
        Een solocoach met twaalf lopers op een mix van Forerunners, een COROS
        Pace en een Suunto: hier is TrainingPeaks het duurst, tenzij de atleten
        hun eigen Premium betalen. Nolio Classic en OpenAthlete doen allebei het
        werk; het verschil is {coachYear('nolio', 12)} tegenover {q('oaYear')}{' '}
        per jaar, AI aan de ene kant en volwassenere mobiele apps aan de andere.
      </p>
      <p>
        Een club met drie coaches en zestig leden: willen ze een bondspartner en
        een bibliotheek met oefenvideo's, dan passen de clubabonnementen van
        Nolio het best. Zo niet, dan doet de clubomgeving van OpenAthlete het
        gratis, met groepen, een gedeelde bibliotheek en de baantraining van
        dinsdag al in de kalender van elk lid. Een zelfgehoste instantie is een
        optie als iemand in de club graag een server beheert.
      </p>
      <p>
        Een coach die schema's verkoopt aan atleten die hij nooit spreekt: blijf
        bij TrainingPeaks. Nolio noch OpenAthlete heeft een marketplace.
      </p>
      <p>
        Meer details, met bronnen voor elke bewering, op de pagina's{' '}
        <Link href="/nl/compare/nolio">OpenAthlete vs Nolio</Link> en{' '}
        <Link href="/nl/compare/trainingpeaks">
          OpenAthlete vs TrainingPeaks
        </Link>
        , en wat OpenAthlete coaches biedt op de{' '}
        <Link href="/nl/coaches">pagina voor coaches</Link>.
      </p>
    </div>
  );
}
