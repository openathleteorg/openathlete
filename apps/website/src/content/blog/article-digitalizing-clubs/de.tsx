import Link from 'next/link';

export function ContentDe() {
  return (
    <div>
      <p>
        Stell dir einen typischen Lauf- oder Triathlonverein vor. Dienstags
        Bahntraining, donnerstags ein Tempodauerlauf oder Bergsprints, sonntags
        der gemeinsame lange Lauf. Drei oder vier ehrenamtliche Trainer, ein
        Cheftrainer, der nebenbei noch die Vereinswebsite pflegt, und irgendwo
        zwischen vierzig und zweihundert Mitglieder, von den Neulingen vor ihrem
        ersten 10-km-Lauf bis zu denen, die einen Marathon unter 3 Stunden
        laufen wollen. Das Training steckt in einer WhatsApp-Gruppe, in einer
        geteilten Tabelle, die nur eine Person versteht, und im Kopf des
        Cheftrainers.
      </p>
      <p>
        Das funktioniert, bis es nicht mehr funktioniert. Die Person mit der
        Tabelle zieht weg. Ein Mitglied mit gereizter Achillessehne sagt es
        einem Trainer, der am nächsten Dienstag nicht da ist. Die
        WhatsApp-Gruppe hat 140 Mitglieder, und die Hälfte hat sie
        stummgeschaltet. Das Training online zu verlagern, löst nichts davon von
        allein, aber es ein wenig zu organisieren, schon.
      </p>

      <h2>Kläre zuerst, wer wen trainiert</h2>
      <p>
        Bevor du ein Tool auswählst, schreib die Struktur auf. Vereine, die rund
        laufen, haben meist dieselben wenigen Elemente, egal mit welcher
        Software:
      </p>
      <ul>
        <li>
          Gruppen nach aktueller Pace, nicht nach Ehrgeiz. Eine Gruppe „locker
          5:30–6:00/km“ und eine Gruppe „4:45–5:15/km“ sind klarer als
          „Fortgeschrittene“ und „Leistungsgruppe“, und Mitglieder können
          wechseln, ohne dass es sich wie Auf- oder Abstieg anfühlt.
        </li>
        <li>
          Ein namentlich benannter Trainer pro Gruppe und eine Vertretung für
          die Wochen, in denen er nicht da ist.
        </li>
        <li>
          Für Mitglieder, die einen individuellen Plan wollen, ein
          hauptverantwortlicher Coach. Andere Trainer können helfen, aber eine
          Person ist für die Gesamtbelastung zuständig.
        </li>
        <li>
          Ein einziger Ort, an dem Verletzungen und Wehwehchen notiert werden,
          damit der nächste Trainer im Dienst Bescheid weiß.
        </li>
      </ul>

      <h2>Schreib die Vereinseinheiten einmal auf</h2>
      <p>
        Die meisten Vereinseinheiten wiederholen sich mit Variationen: 6 bis 10
        × 400 m im 5-km-Tempo mit 200 m Trabpause, 3 × 8&apos; an der Schwelle,
        Bergsprints über 45&quot;. Der Cheftrainer (oder wer Spaß daran hat)
        schreibt die Einheiten der Woche einmal auf, mit Zielvorgaben in Prozent
        der VMA, der Schwelle oder der maximalen Herzfrequenz jedes Mitglieds
        statt fester Paces. Dann laufen der 4:00/km-Läufer und der
        6:00/km-Läufer dasselbe Workout in ihrer eigenen Intensität, und die
        Gruppentrainer passen nur den Umfang an: acht Wiederholungen für die
        eine Gruppe, fünf für die andere.
      </p>
      <p>
        Leg diese Einheiten in einer gemeinsamen Bibliothek ab, nicht im Kopf
        einer einzelnen Person. An dem Tag, an dem der Cheftrainer aufhört,
        behält der Verein seine Einheiten.
      </p>

      <h2>Trenne Ankündigungen von Trainingsgesprächen</h2>
      <p>
        Ein einziger Gruppenchat für alles ist der Ort, an dem Informationen
        verloren gehen. Teile ihn auf: ein Kanal nur für Ankündigungen
        (Ortswechsel, Wettkämpfe, Mitgliederversammlung), in dem nur Trainer
        posten, und Trainingsgespräche pro Gruppe. Feedback zur Einheit einer
        bestimmten Person gehört zu dieser Einheit, nicht in einen Chat mit
        sechzig Leuten.
      </p>

      <h2>Gesundheitsdaten brauchen Sorgfalt</h2>
      <p>
        Schmerzmeldungen und Verletzungsnotizen sind Gesundheitsdaten, in der EU
        eine besondere Kategorie nach der DSGVO, und auch Herzfrequenz- oder
        Schlafdaten können dazugehören. Mitglieder haben ein Recht darauf zu
        wissen, wer sie sieht. In der Praxis heißt das: Frag die Mitglieder,
        bevor du ihre Uhrendaten verbindest, gib Trainern nur Zugriff auf die
        Mitglieder, die sie tatsächlich betreuen, und leg fest, wer
        Verletzungsnotizen sehen darf. Bei Jugendlichen bezieh die Eltern mit
        ein.
      </p>

      <h2>Zwei Wege, einen Verein mit OpenAthlete zu führen</h2>
      <p>
        OpenAthlete hat einen Vereinsbereich. Er ist auf unseren Servern
        kostenlos, ohne Athletenlimit, und ein Verein, der lieber einen eigenen
        Server nutzt, bekommt dieselben Funktionen, wenn er OpenAthlete dort
        installiert.
      </p>
      <p>
        <strong>Ein Vereinsbereich, auf unseren Servern.</strong> Ein Coach legt
        den Verein unter Einstellungen &gt; Vereine an und gibt jedem Mitglied
        eine Rolle: Inhaber, Admin, Coach, Assistent oder Athlet. Jeder Coach
        des Vereins erreicht die Athleten des Vereins, und diese Athleten zählen
        nicht zur Grenze von fünf Athleten eines kostenlosen Coach-Kontos. Die
        Mitglieder kommen über eine Liste, die du importierst (eingefügt oder
        als CSV aus der Vereinstabelle, mit Gruppen), über einen Beitrittscode
        oder über Links, die ablaufen. Jede Gruppe, nach Pace oder Niveau, hat
        ihre eigenen Coaches, und die Vereinsbibliothek enthält die Workouts und
        Ordner, die alle Coaches des Vereins nutzen.
      </p>
      <p>
        Um für eine Gruppe zu planen, kopierst du eine Einheit, einen Tag oder
        eine Woche auf viele Athleten auf einmal. Jede Kopie richtet sich nach
        den Zonen und Schwellen des jeweiligen Athleten, eine Vorschau zeigt vor
        dem Bestätigen, was jedem fehlt, und ein einziges Rückgängig nimmt alles
        zurück. Wöchentliche Vereinseinheiten, etwa das Bahntraining am Dienstag
        im Stadion, landen vier Wochen im Voraus in den Kalendern der Gruppe:
        Die Athleten sagen, ob sie kommen, der Coach sieht, wie viele es sind,
        und sagt er einen Termin ab, bekommen alle eine Benachrichtigung.
        Nachrichten gehen an eine Gruppe oder den ganzen Verein, sofort oder
        geplant, und jede Einheit behält ihren eigenen Kommentarverlauf. Das
        Coach-Dashboard ist für Dutzende Athleten gebaut, mit Summen über einen
        Zeitraum, Warnungen, wenn ein Messwert wie Ruhepuls oder Gewicht eine
        Schwelle überschreitet, und einer Seitenleiste, mit der man zwischen
        dreißig Athleten wechselt.
      </p>
      <p>
        Ein Athlet kann weiterhin mehrere Coaches haben, sodass Lauftrainer und
        Krafttrainer im selben Kalender planen. Die Mitglieder können jede Uhr
        nutzen: Aktivitäten kommen von Garmin, COROS, Suunto, Polar, Strava oder
        aus Dateien, und geplante Workouts gehen auf Uhren von Garmin, COROS und
        Suunto, nicht auf Polar. Mitglieder können ihre geplanten Einheiten
        außerdem in Google oder Apple Kalender abonnieren. Was noch fehlt, ist
        eine Vereinsabrechnung: Mitgliedsbeiträge laufen weiter außerhalb von
        OpenAthlete.
      </p>
      <p>
        <strong>Der Verein betreibt seine eigene Instanz.</strong> OpenAthlete
        ist Open Source, also kann ein Verein es auf einem kleinen Server
        installieren und hat dann seine eigene Plattform unter eigener Adresse,
        mit denselben Vereinsfunktionen, ohne Athletenlimit und ohne Abo.
        Mitglieder können sich per Single Sign-on mit Authentik, Keycloak oder
        jedem OpenID-Connect-Anbieter anmelden, und die Registrierung lässt sich
        auf Einladung beschränken oder ganz schließen. Eine selbst gehostete
        Instanz sendet nichts an OpenAthlete. Eine ehrliche Einschränkung: Die
        COROS-Synchronisierung funktioniert sofort, aber für Garmin, Suunto,
        Polar und Strava muss sich der Verein beim Entwicklerprogramm der
        jeweiligen Marke registrieren, und Garmin und Suunto lassen Partner
        einzeln zu. Der Dateiimport funktioniert immer.
      </p>
      <p>
        Für die meisten Vereine ist der Vereinsbereich auf unseren Servern der
        schnellere Start. Ein Verein, der die Daten seiner Mitglieder auf einem
        eigenen Server haben will und jemanden hat, der sich den Betrieb
        zutraut, kann den zweiten Weg gehen. Die{' '}
        <Link href="/de/clubs">Seite für Vereine</Link> stellt beide vor, und
        die <Link href="/de/self-hosting">Self-Hosting-Seite</Link> beschreibt
        die Installation. Wenn dein Verein besondere Anforderungen hat, ist eine
        Beschreibung, wie ihr tatsächlich trainiert, der wertvollste Input, den
        wir bekommen können.
      </p>
    </div>
  );
}
