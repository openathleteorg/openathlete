import Link from 'next/link';

import { pricesFor } from './prices';

const { quoted: q, coachYear } = pricesFor('nl');

export function ContentNl() {
  return (
    <div>
      <p>
        TrainingPeaks is al lang het standaard trainingsplatform voor
        duursportcoaches, en met goede redenen: de Performance Management Chart,
        een vocabulaire (TSS, CTL, TSB) dat de halve sport inmiddels spreekt,
        een marketplace vol schema's en volwassen mobiele apps. Waarom mensen
        ergens anders kijken, gaat vooral over geld. Het gratis Basic-account
        stuurt geplande workouts niet naar je horloge, en coaches betalen voor
        elke atleet op Premium. Sinds Garmin TrainingPeaks op 22 juli 2026
        kocht, willen sommigen ook een platform dat niet van een horlogemaker
        is. Die vraag heeft een eigen artikel,{' '}
        <Link href="/nl/blog/trainingpeaks-alternatives-after-garmin-acquisition">
          alternatieven voor TrainingPeaks na de overname door Garmin
        </Link>
        ; dit artikel houdt het bij prijs en functies.
      </p>
      <p>
        Dit artikel vergelijkt vier alternatieven op wat ze kosten en wat ze
        doen: intervals.icu, Nolio, Final Surge en OpenAthlete, dat wij maken.
        De prijzen komen van de prijspagina van elke aanbieder, gecontroleerd op
        3 november 2026. Prijzen in Amerikaanse dollars zijn exclusief
        belasting, zoals de aanbieders ze tonen.
      </p>

      <h2>Wat TrainingPeaks kost</h2>
      <p>
        Voor een atleet is Basic gratis en kost Premium {q('tpMonth')} per maand
        of {q('tpYear')} per jaar. Gestructureerde workouts naar je horloge
        sturen is een Premium-functie, en dat is de belangrijkste reden waarom
        lopers die zichzelf coachen upgraden.
      </p>
      <p>
        Voor een coach kost het instapabonnement {q('tpCoach')} per maand,
        inclusief vier Basic-atleten en één op Premium. Elke extra
        Premium-atleet kost {q('tpPerMax')} per maand extra, aflopend naar{' '}
        {q('tpPerMin')} bij grotere aantallen, en er is een opstartkost van{' '}
        {q('tpSetup')}, die vervalt met een promotiecode. In de praktijk betaalt
        een coach van wie alle atleten workouts op het horloge nodig hebben
        ongeveer {coachYear('trainingpeaks', 10)} per jaar voor tien atleten en{' '}
        {coachYear('trainingpeaks', 30)} voor dertig, tenzij de atleten hun
        eigen Premium betalen.
      </p>

      <h2>Wat je moet vergelijken</h2>
      <p>
        Functielijsten lijken allemaal op elkaar. Vier vragen onderscheiden deze
        platforms beter:
      </p>
      <ul>
        <li>
          Komen geplande workouts in het gratis abonnement op het horloge, en
          voor welke merken?
        </li>
        <li>
          Hoe wordt trainingsbelasting berekend, en kun je de formule zien? Geen
          van de alternatieven gebruikt TSS, dus de getallen komen niet overeen
          met wat je gewend bent.
        </li>
        <li>Hoe groeit de coachprijs mee met het aantal atleten?</li>
        <li>
          Kun je je data eruit halen, en wat gebeurt er als het bedrijf stopt?
          Today&apos;s Plan, een betaald coachingplatform, stopte in maart 2024
          en de gebruikers moesten elke atleet verhuizen.
        </li>
      </ul>

      <h2>intervals.icu</h2>
      <p>
        intervals.icu is gratis, met een optioneel Supporter-abonnement van{' '}
        {q('icuMonth')} per maand ({q('icuYear')} per jaar). Voor analyse is het
        hier de sterkste optie: vermogenscurves, eigen grafieken en de langste
        lijst met integraties, waaronder Wahoo en Zwift voor workouts, die
        OpenAthlete niet dekt. Coaching is gratis; teams en organisaties hebben
        Supporter nodig. Er zijn geen officiële mobiele apps (wel apps van
        derden) en de code is gesloten. Ben je een atleet die van data houdt en
        zichzelf coacht, begin dan hier.
      </p>

      <h2>Nolio</h2>
      <p>
        Nolio, een bedrijf uit Grenoble en partner van de Franse atletiekbond,
        heeft een royaal gratis abonnement voor atleten met synchronisatie met
        het horloge en gestructureerde workouts. Premium kost{' '}
        {q('nolioPremium')} per maand. De coachabonnementen kosten{' '}
        {q('nStarter')} per maand voor 3 atleten, {q('nClassic')} voor 25 en{' '}
        {q('nPro')} voor 30 atleten met twee coaches. Er zijn clubabonnementen
        voor verenigingen, de apps zijn native, en er zijn meer dan 200
        oefenvideo's. Nolio maakt geen reclame met ingebouwde AI, en net als de
        andere is het closed source. Onze{' '}
        <Link href="/nl/blog/nolio-vs-trainingpeaks-vs-openathlete-2025-comparison">
          driedubbele vergelijking met TrainingPeaks
        </Link>{' '}
        gaat dieper in op de coachkant.
      </p>

      <h2>Final Surge</h2>
      <p>
        Final Surge is gratis voor atleten. Coaches betalen een vast bedrag van{' '}
        {q('fsStarter')} per maand voor 1 tot 5 atleten of {q('fsPro')} voor tot
        100, zonder kosten per atleet. Gestructureerde workouts gaan naar Garmin
        en COROS. Het is gebouwd rond Amerikaanse hardloopcoaches, scholen en
        clubs, met schoolkortingen en native apps. Eenvoudige, eerlijke prijzen;
        minder aan de analysekant.
      </p>

      <h2>OpenAthlete</h2>
      <p>
        Op onze servers is elke functie gratis: kalender, workout-editor,
        geplande workouts naar Garmin, Suunto en COROS, trainingsbelasting en
        coaching tot vijf atleten. Het optionele Supporter-abonnement (vanaf{' '}
        {q('oaMonth')} per maand of {q('oaYear')} per jaar) voegt AI op onze
        sleutels en een onbeperkt aantal begeleide atleten toe, en verder niets.
        De code is AGPL-3.0, dus je kunt het ook gratis en zonder limieten op je
        eigen server draaien. Clubs krijgen ook een gratis clubomgeving, zonder
        atletenlimiet: groepen met eigen coaches, een gedeelde
        workoutbibliotheek, wekelijkse clubtrainingen en schema's die naar een
        hele groep worden gekopieerd.
      </p>
      <p>
        Trainingsbelasting is Banister-TRIMP op basis van hartslag, met
        session-RPE ernaast, en fitheid, vermoeidheid en vorm worden
        doorgerekend over de trainingen die je hebt gepland. AI-functies draaien
        in elk abonnement op je eigen sleutel (OpenAI, Anthropic, Mistral en
        andere): een gestructureerde training uit één zin, een korte lezing van
        elke activiteit, en een paar vragen na elke loop die inspanning en pijn
        vastleggen voor de coach. Claude of ChatGPT kunnen ook via de MCP-server
        in de kalender plannen.
      </p>
      <p>
        Wat het nog niet doet: er is geen marketplace voor schema's, geen app
        voor indoortraining, geen clubfacturering, en de vermogensanalyse is
        minder diep dan bij intervals.icu. Workouts kunnen niet naar
        Polar-horloges, omdat de API van Polar alleen lezen toestaat. Eenheden
        zijn alleen metrisch.
      </p>

      <h2>De cijfers naast elkaar</h2>
      <table>
        <thead>
          <tr>
            <th></th>
            <th>Atleet die zichzelf coacht, workouts op het horloge</th>
            <th>Coach met 10 atleten, per jaar</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>TrainingPeaks</td>
            <td>Premium, {q('tpYear')}/jaar</td>
            <td>{coachYear('trainingpeaks', 10)} (atleten op Premium)</td>
          </tr>
          <tr>
            <td>intervals.icu</td>
            <td>Gratis (Supporter {q('icuYear')}/jaar optioneel)</td>
            <td>Gratis; teams hebben Supporter nodig</td>
          </tr>
          <tr>
            <td>Nolio</td>
            <td>Gratis</td>
            <td>{coachYear('nolio', 10)} (Classic)</td>
          </tr>
          <tr>
            <td>Final Surge</td>
            <td>Gratis</td>
            <td>{coachYear('final-surge', 10)} (Pro)</td>
          </tr>
          <tr>
            <td>OpenAthlete</td>
            <td>Gratis</td>
            <td>{q('oaYear')} (Supporter)</td>
          </tr>
        </tbody>
      </table>
      <p>
        Catalogusprijzen gecontroleerd op 3 november 2026. Aanbieders passen ze
        aan; kijk op hun pagina's voordat je beslist.
      </p>

      <h2>Wat bij wie past</h2>
      <p>
        Blijf bij TrainingPeaks als je schema's verkoopt op de marketplace, je
        atleten op TrainingPeaks Virtual vertrouwen, of je hele coaching op TSS
        is gebouwd en je de getallen niet opnieuw wilt leren. Kies intervals.icu
        voor de diepste gratis analyse, zeker met een vermogensmeter. Kies Nolio
        als je een Franse club coacht en verenigingsprijzen en volwassen native
        apps wilt. Kies Final Surge voor een Amerikaans school- of clubteam met
        eenvoudige vaste prijzen. Kies OpenAthlete als je workouts op Garmin,
        Suunto of COROS wilt zonder te betalen, een vaste coachprijs, AI op je
        eigen sleutel, een gratis clubomgeving, of code die je zelf kunt hosten.
      </p>

      <h2>Je geschiedenis verhuizen</h2>
      <p>
        Je activiteiten staan ook in het account van je horloge, en dat is
        meestal de makkelijkste bron. In OpenAthlete brengen Strava en COROS je
        hele geschiedenis mee, Garmin en Suunto de laatste 30 dagen, en Polar
        alleen wat je na het koppelen opneemt; oudere FIT-, GPX- en
        TCX-bestanden kun je in bulk uploaden. Geplande workouts en schema's
        gaan niet mee tussen platforms, dus bouw je vaste trainingen opnieuw op
        als sjablonen. De bulkexport van TrainingPeaks hebben we zelf niet
        gecontroleerd, dus kijk in het helpcentrum ervan voordat je erop rekent.
      </p>
      <p>
        Wil je OpenAthlete proberen, dan laat de{' '}
        <Link href="/nl/pricing">prijspagina</Link> precies zien wat gratis is
        en wat Supporter toevoegt.
      </p>
    </div>
  );
}
