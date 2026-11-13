import Link from 'next/link';

import { pricesFor } from './prices';

const { quoted: q, coachYear } = pricesFor('de');

export function ContentDe() {
  return (
    <div>
      <p>
        TrainingPeaks ist seit Langem die Standardplattform für Coaches im
        Ausdauersport, und das aus guten Gründen: das Performance Management
        Chart, ein Vokabular (TSS, CTL, TSB), das inzwischen die halbe Szene
        spricht, ein Marktplatz voller Trainingspläne und ausgereifte Apps. Wer
        sich nach etwas anderem umsieht, tut das meist wegen des Geldes. Das
        kostenlose Basic-Konto schickt geplante Workouts nicht auf deine Uhr,
        und Coaches zahlen für jeden Athleten mit Premium. Seit Garmin
        TrainingPeaks am 22.07.2026 übernommen hat, wollen manche außerdem eine
        Plattform, die keinem Uhrenhersteller gehört. Diese Frage hat einen
        eigenen Artikel,{' '}
        <Link href="/de/blog/trainingpeaks-alternatives-after-garmin-acquisition">
          TrainingPeaks-Alternativen nach der Übernahme durch Garmin
        </Link>
        ; hier geht es nur um Preise und Funktionen.
      </p>
      <p>
        Dieser Beitrag vergleicht vier Alternativen danach, was sie kosten und
        was sie können: intervals.icu, Nolio, Final Surge und OpenAthlete, das
        wir entwickeln. Die Preise stammen von den Preisseiten der jeweiligen
        Anbieter, geprüft am 03.11.2026. Preise in US-Dollar verstehen sich ohne
        Steuern, so wie die Anbieter sie angeben.
      </p>

      <h2>Was TrainingPeaks kostet</h2>
      <p>
        Für Athleten ist Basic kostenlos, Premium kostet {q('tpMonth')} im Monat
        oder {q('tpYear')} im Jahr. Strukturierte Workouts auf die Uhr zu
        schicken ist eine Premium-Funktion, und genau deshalb wechseln
        selbstgecoachte Läufer meist auf Premium.
      </p>
      <p>
        Für Coaches kostet der Einstiegstarif {q('tpCoach')} im Monat, inklusive
        vier Basic-Athleten und einem mit Premium. Jeder weitere Premium-Athlet
        kostet zusätzlich {q('tpPerMax')} im Monat, mit Mengenrabatt bis
        hinunter zu {q('tpPerMin')}, dazu kommt eine Einrichtungsgebühr von{' '}
        {q('tpSetup')}, die mit einem Gutscheincode entfällt. In der Praxis
        zahlt ein Coach, dessen Athleten alle Workouts auf der Uhr brauchen,
        etwa {coachYear('trainingpeaks', 10)} im Jahr für zehn Athleten und{' '}
        {coachYear('trainingpeaks', 30)} für dreißig, sofern die Athleten ihr
        Premium nicht selbst bezahlen.
      </p>

      <h2>Worauf es beim Vergleich ankommt</h2>
      <p>
        Funktionslisten sehen alle gleich aus. Vier Fragen unterscheiden diese
        Plattformen besser:
      </p>
      <ul>
        <li>
          Kommen geplante Workouts im kostenlosen Tarif auf die Uhr, und für
          welche Marken?
        </li>
        <li>
          Wie wird die Trainingsbelastung berechnet, und kannst du die Formel
          einsehen? Keine der Alternativen verwendet TSS, die Zahlen werden also
          nicht zu dem passen, was du gewohnt bist.
        </li>
        <li>Wie wächst der Coach-Preis mit der Zahl der Athleten?</li>
        <li>
          Kommst du an deine Daten, und was passiert, wenn das Unternehmen
          aufhört? Today&apos;s Plan, eine kostenpflichtige Coaching-Plattform,
          wurde im März 2024 eingestellt, und die Nutzer mussten jeden einzelnen
          Athleten umziehen.
        </li>
      </ul>

      <h2>intervals.icu</h2>
      <p>
        intervals.icu ist kostenlos, mit einem optionalen Supporter-Tarif für{' '}
        {q('icuMonth')} im Monat ({q('icuYear')} im Jahr). Für die Analyse ist
        es hier die stärkste Option: Leistungskurven, eigene Diagramme und die
        längste Liste an Integrationen, darunter Wahoo und Zwift für Workouts,
        die OpenAthlete nicht abdeckt. Coaching ist kostenlos, Teams und
        Organisationen brauchen Supporter. Offizielle Apps gibt es nicht (wohl
        aber Apps von Drittanbietern), und der Code ist geschlossen. Wenn du ein
        datenaffiner Athlet bist, der sich selbst trainiert, fang hier an.
      </p>

      <h2>Nolio</h2>
      <p>
        Nolio, ein Unternehmen aus Grenoble und Partner des französischen
        Leichtathletikverbands, hat einen großzügigen kostenlosen Tarif für
        Athleten mit Uhren-Synchronisierung und strukturierten Workouts. Premium
        kostet {q('nolioPremium')} im Monat. Die Coach-Tarife kosten{' '}
        {q('nStarter')} im Monat für 3 Athleten, {q('nClassic')} für 25 und{' '}
        {q('nPro')} für 30 Athleten mit zwei Coaches. Es gibt Vereinstarife,
        native Apps und mehr als 200 Übungsvideos. Integrierte KI wird nicht
        beworben, und wie die anderen ist Nolio Closed Source. Unser{' '}
        <Link href="/de/blog/nolio-vs-trainingpeaks-vs-openathlete-2025-comparison">
          Dreiervergleich mit TrainingPeaks
        </Link>{' '}
        geht ausführlicher auf die Coach-Seite ein.
      </p>

      <h2>Final Surge</h2>
      <p>
        Final Surge ist für Athleten kostenlos. Coaches zahlen pauschal{' '}
        {q('fsStarter')} im Monat für 1 bis 5 Athleten oder {q('fsPro')} für bis
        zu 100, ohne Gebühr pro Athlet. Strukturierte Workouts gehen an Garmin
        und COROS. Die Plattform ist auf US-Lauftrainer, Schulen und Vereine
        zugeschnitten, mit Schulrabatten und nativen Apps. Einfache, ehrliche
        Preise; bei der Analyse etwas dünner.
      </p>

      <h2>OpenAthlete</h2>
      <p>
        Auf unseren Servern ist jede Funktion kostenlos: Kalender,
        Workout-Builder, geplante Workouts an Garmin, Suunto und COROS,
        Trainingsbelastung und Coaching für bis zu fünf Athleten. Der optionale
        Supporter-Tarif ({q('oaMonth')} im Monat oder {q('oaYear')} im Jahr)
        bringt KI über unsere Schlüssel und unbegrenzt viele betreute Athleten,
        sonst nichts. Der Code steht unter AGPL-3.0, du kannst ihn also auch
        kostenlos und ohne Einschränkungen auf deinem eigenen Server betreiben.
      </p>
      <p>
        Die Trainingsbelastung ist Banister-TRIMP auf Basis der Herzfrequenz,
        ergänzt durch Session-RPE, und Fitness, Ermüdung und Form werden über
        die geplanten Einheiten hochgerechnet. KI-Funktionen laufen in jedem
        Tarif mit deinem eigenen Schlüssel (OpenAI, Anthropic, Mistral und
        andere): eine strukturierte Einheit aus einem Satz, eine kurze
        Einschätzung jeder Aktivität und ein paar Fragen nach jedem Lauf, die
        Anstrengung und Schmerzen für den Coach festhalten. Claude oder ChatGPT
        können über den MCP-Server auch direkt in den Kalender planen.
      </p>
      <p>
        Was es noch nicht kann: Die Apps für iOS und Android sind in der
        Testphase (bis dahin lässt sich die Web-App auf dem Handy installieren),
        es gibt keinen Marktplatz für Pläne, keine Indoor-Trainings-App, kein
        Vereinskonto, und die Leistungsanalyse ist weniger tief als bei
        intervals.icu. Workouts können nicht an Polar-Uhren gehen, weil die API
        von Polar nur Lesezugriff erlaubt. Einheiten gibt es nur metrisch.
      </p>

      <h2>Die Zahlen im Überblick</h2>
      <table>
        <thead>
          <tr>
            <th></th>
            <th>Selbstgecoachter Athlet, Workouts auf der Uhr</th>
            <th>Coach mit 10 Athleten, pro Jahr</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>TrainingPeaks</td>
            <td>Premium, {q('tpYear')}/Jahr</td>
            <td>{coachYear('trainingpeaks', 10)} (Athleten mit Premium)</td>
          </tr>
          <tr>
            <td>intervals.icu</td>
            <td>Kostenlos (Supporter {q('icuYear')}/Jahr optional)</td>
            <td>Kostenlos; Teams brauchen Supporter</td>
          </tr>
          <tr>
            <td>Nolio</td>
            <td>Kostenlos</td>
            <td>{coachYear('nolio', 10)} (Classic)</td>
          </tr>
          <tr>
            <td>Final Surge</td>
            <td>Kostenlos</td>
            <td>{coachYear('final-surge', 10)} (Pro)</td>
          </tr>
          <tr>
            <td>OpenAthlete</td>
            <td>Kostenlos</td>
            <td>{q('oaYear')} (Supporter)</td>
          </tr>
        </tbody>
      </table>
      <p>
        Listenpreise geprüft am 03.11.2026. Anbieter ändern sie; schau auf ihren
        Seiten nach, bevor du dich entscheidest.
      </p>

      <h2>Was zu wem passt</h2>
      <p>
        Bleib bei TrainingPeaks, wenn du Pläne über den Marktplatz verkaufst,
        deine Athleten auf TrainingPeaks Virtual angewiesen sind oder dein
        ganzes Coaching auf TSS aufbaut und du die Zahlen nicht neu lernen
        willst. Nimm intervals.icu für die tiefste kostenlose Analyse, besonders
        mit Powermeter. Nimm Nolio, wenn du einen französischen Verein betreust
        und schon heute Vereinspreise und native Apps willst. Nimm Final Surge
        für ein US-Schul- oder Vereinsteam mit einfachen Pauschalpreisen. Nimm
        OpenAthlete, wenn du Workouts auf Garmin, Suunto oder COROS willst, ohne
        zu bezahlen, einen pauschalen Coach-Preis, KI mit deinem eigenen
        Schlüssel oder Code, den du selbst hosten kannst.
      </p>

      <h2>Deine Trainingshistorie umziehen</h2>
      <p>
        Deine Aktivitäten liegen auch in deinem Uhrenkonto, das meist die
        einfachste Quelle ist. In OpenAthlete bringen Strava und COROS deine
        gesamte Historie mit, Garmin und Suunto die letzten 30 Tage und Polar
        nur das, was du nach dem Verbinden aufzeichnest; ältere FIT-, GPX- und
        TCX-Dateien lassen sich gesammelt hochladen. Geplante Workouts und Pläne
        lassen sich nicht zwischen Plattformen übertragen, leg deine
        Standardeinheiten also als Vorlagen neu an. Den Massenexport von
        TrainingPeaks haben wir nicht selbst geprüft, schau also in dessen
        Hilfe-Center nach, bevor du dich darauf verlässt.
      </p>
      <p>
        Wenn du OpenAthlete ausprobieren willst, zeigt die{' '}
        <Link href="/de/pricing">Preisseite</Link> genau, was kostenlos ist und
        was Supporter hinzufügt.
      </p>
    </div>
  );
}
