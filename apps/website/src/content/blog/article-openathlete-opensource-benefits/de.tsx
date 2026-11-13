import Link from 'next/link';

export function ContentDe() {
  return (
    <div>
      <p>
        Ein paar Jahre Trainingshistorie sind eine Menge Material: jede
        Intervalleinheit, jede Herzfrequenzkurve, jede Notiz wie „fünf Stunden
        geschlafen, Beine tot“. Für einen Coach ist es noch mehr: jahrelang
        aufgebaute strukturierte Workouts, Vorlagen und Saisonplanungen für
        jeden Athleten. Wo dieses Material liegt und wer entscheidet, was damit
        passiert, wirkt wie eine abstrakte Frage, bis zu dem Tag, an dem eine
        Plattform schließt oder den Besitzer wechselt.
      </p>

      <h2>Plattformen schließen und wechseln den Besitzer</h2>
      <p>
        Today’s Plan, eine Trainings- und Coaching-Plattform, wurde im März 2024
        eingestellt. Die Nutzer mussten exportieren, was sie konnten, und
        anderswo neu anfangen. Im Juli 2026{' '}
        <a href="https://www.garmin.com/en-US/newsroom/press-release/corporate/garmin-acquires-trainingpeaks-and-trainheroic-leading-endurance-and-strength-training-platforms-for-athletes-and-coaches/">
          übernahm Garmin TrainingPeaks und TrainHeroic
        </a>
        . TrainingPeaks läuft weiter, und nichts deutet darauf hin, dass andere
        Marken anders behandelt werden. Aber die Pläne, Workout-Bibliotheken und
        Coaching-Beziehungen vieler Ausdauer-Coaches gehören jetzt einem
        Uhrenhersteller, und Entscheidungen über diese Plattform werden mit
        Blick auf Garmins Interessen getroffen.
      </p>
      <p>
        Nichts davon ist ein Skandal. Firmen werden gekauft und scheitern
        manchmal. Der Punkt ist: Bei einer geschlossenen Plattform ist deine
        Trainingshistorie nur so beständig wie das Unternehmen dahinter.
      </p>

      <h2>Was „Daten exportieren“ dir wirklich bringt</h2>
      <p>
        Wenn du in der EU lebst, gibt dir Artikel 20 der DSGVO ein Recht auf
        Datenübertragbarkeit: die Daten, die du bereitgestellt hast, in einem
        strukturierten, maschinenlesbaren Format. In der Praxis ist sehr
        unterschiedlich, was du mitnehmen kannst. Aktivitätsdateien (FIT, GPX)
        kommen meist problemlos heraus, weil jedes Tool sie liest. Geplante
        Workouts, Kommentare vom Coach, Vorlagen und der Aufbau einer Saison
        sind eine andere Sache: Sie werden meist im plattformeigenen Format
        gespeichert, und selbst wenn du sie exportieren kannst, kann sie
        womöglich nichts anderes importieren.
      </p>
      <p>
        Zwei Gewohnheiten helfen, egal welches Tool du nutzt. Lass deine
        Aktivitäten an mehr als einen Ort fließen, zum Beispiel von deinem
        Uhren-Konto sowohl zu deiner Trainingsplattform als auch zu einem
        zweiten Dienst, damit kein einzelnes Unternehmen die einzige Kopie hat.
        Und fordere einmal im Jahr einen vollständigen Export an, bevor du ihn
        brauchst, um zu sehen, was du tatsächlich bekommen würdest.
      </p>

      <h2>Was Open Source ändert und was nicht</h2>
      <p>
        Der Code von OpenAthlete ist{' '}
        <a href="https://github.com/openathleteorg/openathlete">öffentlich</a>.
        Das hat ein paar konkrete Folgen. Du kannst nachlesen, wie die
        Trainingsbelastung berechnet wird, statt einer Blackbox zu vertrauen. Du
        kannst sehen, welche Daten den Server verlassen und wohin sie gehen. Und
        wenn das Projekt morgen enden würde, wären Code, Datenbankschema und
        Migrationsdateien weiterhin da, und jeder könnte es weiter betreiben.
        Die Daten selbst liegen in einer ganz normalen PostgreSQL-Datenbank,
        nicht in einem Format, das nur ein Unternehmen versteht.
      </p>
      <p>
        Open Source macht Software nicht von selbst sicher. Code, den niemand
        liest, ist nicht sicherer, nur weil er öffentlich ist, und ein kleines
        Projekt hat weniger Prüfer als ein populäres. Es garantiert auch nicht,
        dass jemand die Software weiter pflegt. Was es garantiert: dass du
        hineinschauen darfst und dass die Möglichkeit besteht, ohne den
        ursprünglichen Autor weiterzumachen.
      </p>

      <h2>Warum die AGPL</h2>
      <p>
        OpenAthlete steht unter der{' '}
        <a href="https://www.gnu.org/licenses/agpl-3.0.html">
          GNU Affero General Public License v3
        </a>
        . Jeder darf es nutzen, verändern, betreiben und weitergeben. Die
        Bedingung: Wenn du es veränderst und andere deine Version über ein
        Netzwerk nutzen lässt, musst du diesen Nutzern den Quellcode deiner
        Version anbieten. Die normale GPL verlangt das für Software, die als
        Webdienst läuft, nicht. Genau deshalb gibt es die Affero-Variante.
      </p>
      <p>
        Praktisch heißt das: Niemand kann OpenAthlete nehmen, Funktionen
        ergänzen und es als geschlossenen gehosteten Dienst verkaufen.
        Verbesserungen von allen, die es für andere betreiben, kommen allen
        zugute. Die gehostete Version auf openathlete.org läuft mit demselben
        öffentlichen Code; Funktionen, die nur dort sinnvoll sind, etwa die
        Abrechnung, bleiben ausgeschaltet, solange sie nicht konfiguriert sind.
      </p>

      <h2>Selbst hosten, ehrlich betrachtet</h2>
      <p>
        Du kannst OpenAthlete mit der <code>docker-compose.yml</code> aus dem
        Repository oder den veröffentlichten Images auf GHCR auf deinem eigenen
        Server betreiben. Es braucht PostgreSQL und Redis, beide sind in der
        Compose-Datei enthalten. Es ist kostenlos, ohne Begrenzung der
        Athletenzahl und ohne Paywall. Eine selbst gehostete Instanz sendet
        nichts an OpenAthlete, und ein automatisierter Test prüft das bei jedem
        Release. Du kannst Single Sign-on über OIDC anbinden, offene,
        einladungsbasierte oder geschlossene Registrierung wählen und die
        KI-Funktionen mit einem lokalen Modell über Ollama betreiben, sodass
        überhaupt nichts deinen Rechner verlässt.
      </p>
      <p>
        Die Kosten sind allerdings real. Du bist für Backups, Updates und
        Sicherheit verantwortlich. Die Verbindungen zu Sportuhren nutzen deine
        eigenen Entwickler-Zugangsdaten beim jeweiligen Anbieter: Manche, wie
        Strava, bekommst du schnell, andere, wie Garmin, prüfen Anträge, bevor
        sie API-Zugang gewähren. Das Hochladen von FIT-, GPX- oder TCX-Dateien
        funktioniert ohne all das. Selbst hosten lohnt sich am ehesten für einen
        Coach oder eine Gruppe mit jemandem, der sich mit dem Betrieb eines
        Servers auskennt, oder für eine Organisation, die die Daten ihrer
        Athleten auf eigener Infrastruktur braucht. Die{' '}
        <Link href="/de/self-hosting">Seite zum Selbst-Hosting</Link> erklärt
        die Einrichtung.
      </p>

      <h2>Wenn du lieber keinen Server betreiben willst</h2>
      <p>
        Die gehostete Version ist kostenlos und enthält alle Funktionen. API und
        Datenbank laufen bei OVH in Frankreich, die Web-App wird von Vercel
        ausgeliefert. Der Supporter-Plan (5&nbsp;€ im Monat oder 50&nbsp;€ im
        Jahr) bietet KI über die Schlüssel von OpenAthlete und Coaching für mehr
        als fünf Athleten, und er hilft, die Server zu bezahlen. Mehr zu den
        Beweggründen hinter dem Projekt findest du auf der{' '}
        <Link href="/de/open-source">Open-Source-Seite</Link>.
      </p>
    </div>
  );
}
