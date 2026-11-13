import Link from 'next/link';

export function ContentDe() {
  return (
    <div>
      <p>
        Viele gute Coaches organisieren ihre gesamte Arbeit in einer Tabelle.
        Ein Tabellenblatt pro Athlet, eine Zeile pro Tag, eine Farbe für jede
        Art von Einheit und eine Spalte für Kommentare, die der Athlet ausfüllt
        oder eben nicht. Das kostet nichts, passt sich jeder Methode an, und
        niemand kann es dir wegnehmen. Der Titel dieses Artikels ist etwas
        unfair: Excel ist nicht tot, und für manche Coaches ist es nach wie vor
        das richtige Werkzeug.
      </p>
      <p>
        Es hat aber seinen Preis, und der wächst mit der Zahl der Athleten auf
        eine Weise, die man leicht übersieht. Dieser Artikel geht die Kosten
        durch, zeigt, wie du mehr aus einer Tabelle herausholst, wenn du dabei
        bleibst, und ab wann sich spezielle Software lohnt.
      </p>

      <h2>Wo die Tabelle funktioniert</h2>
      <p>
        Mit drei bis fünf Athleten, die du gut kennst, die überwiegend nach
        Gefühl trainieren und sich nach den Schlüsseleinheiten bei dir melden,
        ist eine Tabelle schwer zu schlagen. In eine Zelle kannst du alles
        schreiben: „6 × 1 km im 10-km-Tempo, 90'' Trabpause, nach 4 abbrechen,
        wenn die Waden meckern“ ist eine völlig brauchbare Vorgabe, und keine
        Software zwingt dich in ihr eigenes Vokabular. Mit Google Sheets ist das
        Teilen einfach, die Historie bleibt, wo du sie abgelegt hast, und es
        gibt kein Abo.
      </p>

      <h2>Wo es anfängt, Aufwand zu kosten</h2>
      <p>
        Der erste Kostenpunkt liegt beim Athleten. Eine Einheit, die in einer
        Zelle steht, muss in Garmin Connect oder die COROS-App abgetippt werden,
        damit sie auf der Uhr erscheint, oder man muss sie sich beim Laufen
        merken. Die meisten machen das für die Schlüsseleinheit der Woche und
        lassen es beim Rest. Der Schwellenlauf wird dann in der Pace gelaufen,
        an die sich der Athlet erinnert, nicht in der, die du aufgeschrieben
        hast.
      </p>
      <p>
        Der zweite ist der Rückweg. Um Geplantes mit Absolviertem zu
        vergleichen, muss jemand den Lauf aus Strava oder der Uhren-App in die
        Tabelle übertragen: Distanz, Zeit, vielleicht die durchschnittliche
        Herzfrequenz. Entweder macht das der Athlet, unregelmäßig, oder du, am
        Sonntagabend. So oder so bekommst du eine Zusammenfassung der Einheit,
        nicht die Einheit selbst: Du siehst, dass die 6 × 1 km im Schnitt bei
        4:05/km lagen, aber nicht, dass die letzten beiden Wiederholungen bei
        4:15 mit steigender Herzfrequenz liefen.
      </p>
      <p>
        Der dritte sind Änderungen. Ein Wettkampf verschiebt sich um zwei
        Wochen, ein Athlet ist fünf Tage krank, eine Reise in die Berge ersetzt
        einen Block Bahntraining. In einer Tabelle schreibst du Zeilen von Hand
        um, prüfst, ob die Wochensummen noch stimmen, und hoffst, dass der
        Athlet die aktuelle Version geöffnet hat und nicht die aus der E-Mail
        vom letzten Dienstag.
      </p>
      <p>
        Der vierte ist die Belastung. Die meisten Coaches, die bei Tabellen
        bleiben, erfassen den Umfang (Kilometer, Stunden) und kaum etwas
        anderes, weil alles Weitere Formeln und Dateneingabe bedeutet. Der
        Umfang allein verschleiert viel: 60 km locker und 60 km mit zwei
        intensiven Einheiten sind nicht dieselbe Woche.
      </p>

      <h2>Wenn du bei der Tabelle bleibst, dann richtig</h2>
      <p>
        Ein paar Gewohnheiten beheben das meiste davon, ohne das Werkzeug zu
        wechseln.
      </p>
      <ul>
        <li>
          Nutze pro Athlet eine geteilte Online-Tabelle statt Dateien per
          E-Mail. Dann gibt es nur eine Version, und der Athlet sieht
          Änderungen, sobald du sie machst.
        </li>
        <li>
          Ergänze zwei Spalten, die der Athlet nach jeder Einheit ausfüllt:
          Dauer in Minuten und Anstrengung auf einer Skala von 0 bis 10.
          Multiplizierst du beide, hast du die Session-RPE nach Foster (Foster
          et al., 2001), ein Belastungsmaß, das überhaupt kein Gerät braucht: 50
          Minuten mit RPE 6 ergeben 300. Summierst du das pro Woche, siehst du,
          wie ein Block aufgebaut wird oder wo eine Woche zu viel war.
        </li>
        <li>
          Leg für jede wiederkehrende Einheit eine Vorlage an („Schwelle 5 ×
          4'“, „langer Lauf, die letzten 20' im Marathontempo“) und kopiere sie,
          statt sie neu zu tippen. Weniger Tippfehler, und der Athlet lernt das
          Vokabular.
        </li>
        <li>
          Bitte um eine Zeile Kommentar pro Einheit, keinen Absatz. „Beine
          schwer, linke Achillessehne morgens steif“ ist genau das, was du
          brauchst, um ein Problem früh zu erkennen.
        </li>
      </ul>
      <p>
        Damit macht eine Tabelle für eine Handvoll Athleten einen ordentlichen
        Job. Die Einheit landet aber trotzdem nicht auf der Uhr, und sie hängt
        weiterhin davon ab, dass jemand Zahlen abtippt, die längst woanders
        existieren.
      </p>

      <h2>Was Software ändert</h2>
      <p>
        Der Sinn einer Coaching-Plattform sind nicht die Diagramme. Sondern dass
        die Daten fließen, ohne dass jemand sie kopiert. Du schreibst die
        Einheit einmal, mit Vorgaben aus den persönlichen Zonen des Athleten;
        sie geht auf seine Uhr; die Aktivität kommt nach dem Lauf von selbst
        zurück und steht neben dem Plan, Schritt für Schritt. Verschiebt sich
        ein Wettkampf, ziehst du den Block auf ein neues Datum, und die Uhr
        zieht mit. Die Belastung wird aus jeder Einheit berechnet, egal ob
        jemand daran gedacht hat, eine Spalte auszufüllen.
      </p>
      <p>
        Ganz ohne Aufwand geht es aber auch hier nicht. Du verbringst ein, zwei
        Abende damit, deine üblichen Einheiten als Vorlagen nachzubauen, einige
        deiner Athleten brauchen Hilfe beim Verbinden ihrer Uhr, und du gibst
        ein wenig von der Freiheit der leeren Zelle auf. Ob sich das lohnt,
        hängt vor allem davon ab, wie viele Athleten du hast und wie oft sich
        Pläne ändern. Als grobe Faustregel wird die Frage irgendwo jenseits von
        fünf Athleten relevant, oder spätestens dann, wenn einer von ihnen eine
        Schlüsseleinheit nach einer veralteten Planversion läuft.
      </p>

      <h2>Ausprobieren, ohne zu zahlen</h2>
      <p>
        OpenAthlete ist für Coaches mit bis zu fünf Athleten kostenlos, mit
        allen Funktionen: Kalender, Workout-Editor, Einheiten, die an Uhren von
        Garmin, Suunto und COROS gesendet werden, Aktivitäten, die von diesen
        Marken sowie von Polar und Strava importiert werden, und
        Trainingsbelastung aus der Herzfrequenz mit Session-RPE daneben. Ab
        sechs Athleten kostet Supporter 50&nbsp;€ pro Jahr für beliebig viele
        Athleten. Du kannst es einen Monat lang mit ein oder zwei Athleten
        parallel zu deiner Tabelle nutzen, bevor du dich entscheidest. Die{' '}
        <Link href="/de/coaches">Seite für Coaches</Link> zeigt, wie die
        Coach-Ansicht aussieht.
      </p>

      <h2>Quelle</h2>
      <ul>
        <li>
          Foster C, Florhaug JA, Franklin J, et al. A new approach to monitoring
          exercise training. Journal of Strength and Conditioning Research,
          2001;15(1):109–115.
        </li>
      </ul>
    </div>
  );
}
