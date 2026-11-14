import Link from 'next/link';

export function ContentDe() {
  return (
    <div>
      <p>
        OpenAthlete ist eine Trainingsplattform für Ausdauersportler und ihre
        Coaches. Sie bietet einen Kalender für geplante Einheiten, strukturierte
        Workouts, die auf deine Uhr gehen, Aktivitäten, die von dort
        zurückkommen, ein Modell für die Trainingsbelastung und einen
        gemeinsamen Bereich, in dem Coach und Athlet am selben Plan arbeiten.
        Der Code ist Open Source unter der Lizenz AGPL-3.0. Die gehostete
        Version ist kostenlos, und du kannst die Plattform auch auf deinem
        eigenen Server betreiben.
      </p>
      <p>
        Diese Seite erklärt, warum es OpenAthlete gibt, was es heute kann und,
        genauso wichtig, was es nicht kann.
      </p>

      <h2>Warum es OpenAthlete gibt</h2>
      <p>
        OpenAthlete wird von einem unabhängigen Entwickler aus Grenoble gebaut,
        der Ultras läuft. Es stehen keine Investoren dahinter. Am Anfang stand
        eine bekannte Routine: die Saison in einer Tabelle planen, jede
        Intervalleinheit noch einmal von Hand in die App des Uhrenherstellers
        tippen und dann eine dritte App öffnen, um zu sehen, ob die Einheit wie
        geplant gelaufen ist. Drei Tools, und keines wusste von den anderen.
      </p>
      <p>
        Die kommerziellen Plattformen, die dieses Problem richtig lösen, sind
        gute Produkte. Sie berechnen Coaches aber pro Athlet und speichern
        jahrelange Trainingshistorie auf ihren Servern, zu ihren Bedingungen.
        Als Today&apos;s Plan im März 2024 eingestellt wurde, merkten die
        Nutzer, wie viel dieser Historie sie tatsächlich mitnehmen konnten. Im
        Juli 2026 hat Garmin TrainingPeaks gekauft, eine der bekanntesten
        Coaching-Plattformen. Damit liegen die Pläne vieler Coaches nun in den
        Händen eines Uhrenherstellers.
      </p>
      <p>
        Die Idee hinter OpenAthlete: Der Kern einer Trainingsplattform (ein
        Kalender, strukturierte Workouts, ein Belastungsmodell, die Verbindung
        zur Uhr) ist Infrastruktur. Und Infrastruktur ist besser, wenn jeder sie
        lesen, betreiben und am Leben halten kann.
      </p>

      <h2>Was es heute kann</h2>
      <p>
        <strong>Planung.</strong> Du baust Workouts Schritt für Schritt auf, zum
        Beispiel 15 Minuten locker, 5 × 4 Minuten an der Schwelle mit 2 Minuten
        Trabpause, 10 Minuten locker. Die Zielvorgaben kommen aus deinen eigenen
        Zonen, Paces oder Prozentwerten von VMA, FTP oder maximaler
        Herzfrequenz. Die Einheiten liegen in einem Kalender, in dem du sie per
        Drag-and-drop verschieben kannst, und ein Coach kann ganze Wochen auf
        einmal verschieben oder kopieren.
      </p>
      <p>
        <strong>Deine Uhr.</strong> Geplante Workouts werden an Uhren von
        Garmin, Suunto und COROS gesendet. Absolvierte Aktivitäten kommen von
        Garmin, COROS, Suunto, Polar und Strava oder aus einer FIT-, GPX- oder
        TCX-Datei. Wenn du ein Konto verbindest, bringen Strava und COROS deine
        komplette Historie mit, Garmin und Suunto die letzten 30 Tage und Polar
        nur neue Aktivitäten.
      </p>
      <p>
        <strong>Trainingsbelastung.</strong> Die Belastung wird per TRIMP aus
        der Herzfrequenz berechnet, zusätzlich wird das Session-RPE erfasst.
        Fitness, Ermüdung und Form (CTL, ATL und TSB) werden über deine
        geplanten Einheiten hinweg prognostiziert. So siehst du, was die
        nächsten drei Wochen mit deiner Form machen, und zwar vor dem Wettkampf
        statt danach. Die Seite zur{' '}
        <Link href="/de/features/training-load">Trainingsbelastung</Link>{' '}
        erklärt das Modell.
      </p>
      <p>
        <strong>Coaching.</strong> Ein Coach plant direkt im Kalender jedes
        Athleten, nutzt Vorlagen und sieht, was tatsächlich trainiert wurde. Ein
        Athlet kann mehrere Coaches haben, und es gibt einen Gruppenchat. Das
        Coaching von bis zu fünf Athleten ist kostenlos. Vereine bekommen einen
        kostenlosen Vereinsbereich mit Gruppen und ihren Coaches, einer
        gemeinsamen Workout-Bibliothek, wöchentlichen Vereinseinheiten und
        Plänen, die auf eine ganze Gruppe kopiert werden; Athleten, die ein
        Coach über einen Verein betreut, zählen nicht zu dieser Grenze.
      </p>
      <p>
        <strong>KI, wenn du willst.</strong> Nichts läuft, bevor du zustimmst,
        und du kannst deine Zustimmung jederzeit widerrufen. Wenn sie aktiv ist,
        kann die KI aus einem Satz eine strukturierte Einheit schreiben, eine
        Einheit nach einer kurzen Anweisung anpassen, dir nach einer Aktivität
        drei oder vier Fragen stellen und deine Antworten in einen
        Anstrengungswert und eine Schmerznotiz für deinen Coach umwandeln, jede
        neue Aktivität kurz einordnen und die Belastung einer geplanten Einheit
        schätzen. Du nutzt deinen eigenen API-Schlüssel (OpenAI, Anthropic,
        Google, Mistral und andere oder ein lokales Modell auf einer selbst
        gehosteten Instanz) oder das Kontingent, das im Supporter-Plan enthalten
        ist. Einen Chat in der App gibt es nicht: Wenn du dich unterhalten
        willst, kann Claude oder ChatGPT über den{' '}
        <Link href="/de/features/mcp-server">MCP-Server</Link> dein Training
        lesen und Einheiten in deinem Kalender planen.
      </p>

      <h2>Was es nicht kann</h2>
      <ul>
        <li>
          Workouts lassen sich nicht an Polar-Uhren oder an Strava senden. Beide
          dienen nur als Quelle für Aktivitäten.
        </li>
        <li>
          Es gibt keine Vereinsabrechnung: Der Vereinsbereich ist kostenlos, und
          Mitgliedsbeiträge laufen außerhalb von OpenAthlete.
        </li>
        <li>
          Es sagt keine Verletzungen voraus. Es erfasst Schmerzen, wenn Athleten
          sie melden, und zeigt sie ihrem Coach. Das ist weniger spektakulär,
          aber ehrlicher.
        </li>
        <li>Es gibt nur metrische Einheiten.</li>
        <li>
          Die Apps für iOS und Android sind in der Testphase. Bis dahin
          funktioniert die Web-App auf dem Smartphone und lässt sich auf dem
          Startbildschirm installieren.
        </li>
        <li>
          Die COROS-Anbindung ist neu. Rechne mit Ecken und Kanten und sag uns
          Bescheid, wenn du auf eine stößt.
        </li>
      </ul>

      <h2>Wie es finanziert wird</h2>
      <p>
        Alle Funktionen sind in der gehosteten Version kostenlos. Der
        Supporter-Plan für 5 € im Monat oder 50 € im Jahr bringt zwei Dinge
        dazu: KI, die über die Schlüssel von OpenAthlete läuft, mit einem
        monatlichen Kontingent, und Coaching für mehr als fünf Athleten. Selbst
        hosten ist kostenlos und ohne Einschränkungen. Details findest du auf
        der <Link href="/de/pricing">Preisseite</Link>.
      </p>
      <p>
        Die gehostete API und die Datenbank laufen bei OVH in Frankreich, die
        Web-App wird über Vercel ausgeliefert. Eine selbst gehostete Instanz
        sendet nichts an OpenAthlete, und ein automatisierter Test prüft das bei
        jedem Release.
      </p>

      <h2>Wo du anfängst</h2>
      <p>
        Wenn du allein trainierst: Verbinde deine Uhr, lege deine Zonen fest
        (der{' '}
        <Link href="/de/tools/heart-rate-zones">
          Rechner für Herzfrequenzzonen
        </Link>{' '}
        ist ein guter Ausgangspunkt, wenn du sie noch nie gemessen hast) und
        plane eine Woche. Wenn du coachst, lade zuerst einen einzigen Athleten
        ein und zieht gemeinsam eine komplette Woche durch, bevor du alle
        anderen umziehst.
      </p>
      <p>
        Der Quellcode liegt auf{' '}
        <a href="https://github.com/openathleteorg/openathlete">GitHub</a>.
        Fehlermeldungen und Feature-Wünsche gehören dorthin oder auf Discord.
        Sie werden gelesen und entscheiden zu einem guten Teil darüber, was als
        Nächstes gebaut wird.
      </p>
    </div>
  );
}
