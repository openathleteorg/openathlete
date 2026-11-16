import Link from 'next/link';

import { pricesFor } from './prices';

const { quoted: q, coachYear } = pricesFor('de');

export function ContentDe() {
  return (
    <div>
      <p>
        Wer in Frankreich Ausdauerathleten betreut, oder überall dort, wo
        französische Vereine den Ton angeben, landet oft bei der Wahl zwischen
        TrainingPeaks und Nolio. Dieser Artikel nimmt OpenAthlete dazu, das wir
        selbst entwickeln, und vergleicht die drei aus Sicht eines Coaches: was
        du zahlst, wenn die Zahl deiner Athleten wächst, was deine Athleten
        brauchen und was jedes Tool besser kann als die anderen. Die Preise
        stammen von den Preisseiten der Anbieter, geprüft am 03.11.2026.
        Dollarpreise verstehen sich ohne Steuern, so wie TrainingPeaks sie
        anzeigt.
      </p>

      <h2>Drei Preislogiken</h2>
      <p>
        <strong>TrainingPeaks</strong> rechnet pro Athlet ab. Der Coach-Plan
        beginnt bei {q('tpCoach')} im Monat mit vier Basic-Athleten und einem
        Premium-Athleten; jeder weitere Premium-Athlet kostet {q('tpPerMax')} im
        Monat, mit steigender Zahl sinkend auf {q('tpPerMin')}. Dazu kommt eine
        Einrichtungsgebühr von {q('tpSetup')}, die mit einem Promo-Code
        entfällt. Athleten können bei Basic bleiben ({q('tpCoachUnlimited')} im
        Monat decken beliebig viele ab), aber dann landen ihre geplanten
        Workouts nicht auf der Uhr. Die meisten Coaches zahlen deshalb entweder
        Premium oder bitten die Athleten, selbst {q('tpYear')} im Jahr zu
        zahlen.
      </p>
      <p>
        <strong>Nolio</strong> rechnet nach Stufen ab. Starter kostet{' '}
        {q('nStarter')} im Monat für 3 Athleten, Classic {q('nClassic')} für 25
        und Pro {q('nPro')} für 30 Athleten mit zwei Coaches; ein zusätzlicher
        Coach kostet {q('nExtraCoach')} im Monat. Athleten müssen für die
        Synchronisierung mit der Uhr nichts zahlen: Der kostenlose
        Athletenzugang enthält sie. Für Vereine gibt es eigene Pläne, Club
        Starter für {q('nClubStarter')} und Club Classic für {q('nClubClassic')}{' '}
        im Monat.
      </p>
      <p>
        <strong>OpenAthlete</strong> ist bis zu fünf Athleten kostenlos. Darüber
        hebt der Supporter-Plan für {q('oaYear')} im Jahr das Limit auf, egal
        wie viele Athleten du betreust, und bringt zusätzlich KI über unsere
        Schlüssel mit. Die Synchronisierung mit der Uhr ist für Athleten
        kostenlos. Selbst gehostet ist es kostenlos und ohne Limits. Vereine
        bekommen einen kostenlosen Vereinsbereich, und Athleten, die ein Coach
        über einen Verein betreut, zählen nicht zu den fünf.
      </p>

      <table>
        <thead>
          <tr>
            <th>Athleten</th>
            <th>TrainingPeaks (Athleten mit Premium)</th>
            <th>Nolio</th>
            <th>OpenAthlete</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>3</td>
            <td>{coachYear('trainingpeaks', 3)}</td>
            <td>{coachYear('nolio', 3)} (Starter)</td>
            <td>Kostenlos</td>
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
        Jahreskosten für einen Coach bei monatlicher Abrechnung, Listenpreise
        geprüft am 03.11.2026. Die Spalte TrainingPeaks geht davon aus, dass der
        Coach für jeden Athleten Premium bezahlt; zahlen deine Athleten ihr
        Premium bereits selbst, fällt deine Rechnung deutlich niedriger aus.
      </p>

      <h2>Was jedes Tool am besten kann</h2>
      <p>
        <strong>TrainingPeaks</strong> ist die gemeinsame Sprache. Viele
        Athleten kommen mit einem Konto und ihrer Trainingshistorie dort an,
        viele Coaches denken in TSS und im Performance Management Chart, und
        wenn du Trainingspläne verkaufst, bringt sie der Marktplatz zu Käufern.
        Die mobilen Apps sind ausgereift, und TrainingPeaks Virtual deckt das
        Indoor-Radtraining ab. Seit dem 22.07.2026 gehört es zu Garmin; was das
        ändern könnte, steht in{' '}
        <Link href="/de/blog/trainingpeaks-alternatives-after-garmin-acquisition">
          TrainingPeaks-Alternativen nach der Übernahme durch Garmin
        </Link>
        .
      </p>
      <p>
        <strong>Nolio</strong> ist für französische Vereine gemacht. Es ist ein
        Unternehmen aus Grenoble, Partner des französischen
        Leichtathletikverbands, mit Preisen für Vereine, mehreren Coaches in
        einem Konto, nativen Apps für iOS und Android und einer Bibliothek mit
        mehr als 200 Übungsvideos fürs Krafttraining. Wenn dein Verein ein Konto
        für drei Coaches und sechzig Mitglieder will, mit nativen Apps auf jedem
        Handy, hat Nolio genau dafür einen Plan.
      </p>
      <p>
        <strong>OpenAthlete</strong> hält den Preis pauschal und bietet ein paar
        Dinge, mit denen die beiden anderen nicht werben. KI läuft über deinen
        eigenen Schlüssel (oder das Supporter-Kontingent): Du schreibst „10 km
        locker, dann 6 × 400 m im 5-km-Tempo“ und bekommst eine strukturierte
        Einheit mit den Zonen des Athleten; nach jeder Aktivität erhält der
        Athlet eine kurze Einordnung und ein paar Fragen, und die gemeldete
        Anstrengung und eventuelle Schmerzen landen in einem
        Verletzungsprotokoll und auf deinem Dashboard. Über den MCP-Server
        können Claude oder ChatGPT das Training eines Athleten lesen und bis zu
        60 Einheiten in seinen Kalender planen. Vereine bekommen einen
        kostenlosen Vereinsbereich ohne Athletenlimit: Gruppen mit eigenen
        Coaches, eine gemeinsame Bibliothek, wöchentliche Vereinseinheiten, für
        die Athleten zu- oder absagen, und eine Einheit, einen Tag oder eine
        Woche, auf eine ganze Gruppe kopiert und an die Zonen jedes Athleten
        angepasst. Der Code steht unter AGPL-3.0, ein Verein kann also auch eine
        eigene Instanz mit Single Sign-on und Registrierung nur auf Einladung
        betreiben.
      </p>

      <h2>Was jedem fehlt</h2>
      <p>
        TrainingPeaks nennt auf seinen Preisseiten keine eingebaute KI, und die
        Gebühr pro Athlet summiert sich schnell, wenn du Premium bezahlst. Die
        Coach-Pläne von Nolio kosten ab dem ersten Athleten Geld, und mit KI
        wirbt Nolio nicht. Keines von beiden ist Open Source.
      </p>
      <p>
        Auch OpenAthlete hat echte Lücken. Die Apps für iOS und Android sind in
        der Testphase, Athleten nutzen vorerst die installierbare Web-App. Der
        Vereinsbereich hat keine Vereinsabrechnung: Mitgliedsbeiträge laufen
        außerhalb von OpenAthlete. Kein Marktplatz, keine Bibliothek mit
        Übungsvideos, keine Partnerschaft mit einem Verband. Workouts gehen an
        Uhren von Garmin, Suunto und COROS, nicht an Polar. Die
        Trainingsbelastung ist Banister-TRIMP aus der Herzfrequenz, mit
        Session-RPE daneben, die Zahlen stimmen also nicht mit TSS überein, wenn
        deine Athleten von TrainingPeaks kommen.
      </p>

      <h2>Drei Coaches, drei Antworten</h2>
      <p>
        Ein Coach allein mit zwölf Läufern, die eine Mischung aus Forerunnern,
        einer COROS Pace und einer Suunto tragen: Hier ist TrainingPeaks am
        teuersten, sofern die Athleten ihr Premium nicht selbst zahlen. Nolio
        Classic und OpenAthlete erledigen beide den Job; der Unterschied liegt
        bei {coachYear('nolio', 12)} gegenüber {q('oaYear')} im Jahr, KI auf der
        einen Seite und native Apps auf der anderen.
      </p>
      <p>
        Ein Verein mit drei Coaches und sechzig Mitgliedern: Wollen die
        Mitglieder heute schon eine native App auf dem Handy, passen die
        Vereinspläne von Nolio am besten. Reicht die installierbare Web-App,
        erledigt das der Vereinsbereich von OpenAthlete kostenlos, mit Gruppen,
        einer gemeinsamen Bibliothek und dem Bahntraining am Dienstag schon im
        Kalender jedes Mitglieds. Eine selbst gehostete Instanz ist eine Option,
        wenn jemand im Verein gern einen Server betreibt.
      </p>
      <p>
        Ein Coach, der Pläne an Athleten verkauft, mit denen er nie spricht:
        Bleib bei TrainingPeaks. Weder Nolio noch OpenAthlete haben einen
        Marktplatz.
      </p>
      <p>
        Mehr Details, mit Quellen für jede Aussage, auf den Seiten{' '}
        <Link href="/de/compare/nolio">OpenAthlete vs. Nolio</Link> und{' '}
        <Link href="/de/compare/trainingpeaks">
          OpenAthlete vs. TrainingPeaks
        </Link>
        , und was OpenAthlete Coaches bietet, auf der{' '}
        <Link href="/de/coaches">Seite für Coaches</Link>.
      </p>
    </div>
  );
}
