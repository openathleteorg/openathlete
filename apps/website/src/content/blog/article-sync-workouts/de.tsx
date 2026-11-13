import { DISCORD_URL } from '@/config';
import Link from 'next/link';

export function ContentDe() {
  return (
    <div>
      <p>
        Ein strukturiertes Workout auf deiner Uhr erledigt drei nützliche Dinge:
        Es sagt dir, wann jeder Abschnitt beginnt und endet, es zeigt, ob du im
        Zielbereich bist, und es zählt die Wiederholungen, damit du es nicht tun
        musst. Bei einer Einheit wie 15&nbsp;min locker, 5 × 4&nbsp;min an der
        Schwelle mit 2&nbsp;min Trabpause, 10&nbsp;min locker ist das der
        Unterschied zwischen dem Laufen der Einheit und Kopfrechnen beim Laufen.
      </p>
      <p>
        Wie die Einheit aus dem Trainingsplan ans Handgelenk kommt, hängt von
        der Marke ab. Dieser Leitfaden behandelt die drei Marken, die Workouts
        aus anderen Apps annehmen (Garmin, COROS und Suunto), erklärt, was du
        mit einer Polar machst, und endet mit einer Checkliste für den Tag, an
        dem ein Workout nicht auftaucht.
      </p>

      <h2>Welche Uhren Workouts empfangen können</h2>
      <p>
        Jede Marke lässt dich in ihrer eigenen App ein Workout erstellen.
        Weniger Marken lassen eine externe Plattform eines schicken.
      </p>
      <ul>
        <li>
          <strong>Garmin</strong> nimmt Workouts von zugelassenen Partnern an.
          Sie landen in deinem Garmin-Connect-Kalender und kommen beim nächsten
          Sync auf die Uhr.
        </li>
        <li>
          <strong>Suunto</strong> nimmt sie als Guides an: „Guide“ ist Suuntos
          Name für eine strukturierte Einheit, die du beim Start einer
          Trainingseinheit auswählst.
        </li>
        <li>
          <strong>COROS</strong> nimmt strukturierte Lauf-, Trail- und
          Radeinheiten an, die im Kalender der COROS-App und danach auf der Uhr
          erscheinen.
        </li>
        <li>
          Über die öffentliche API von <strong>Polar</strong> können Apps deine
          Aktivitäten und deinen Schlaf lesen, aber nichts in dein Konto
          schreiben. Deshalb kann OpenAthlete dorthin keine Workouts senden. In
          Polar Flow kannst du Einheiten aber weiterhin von Hand erstellen.
        </li>
        <li>
          <strong>Strava</strong> kennt überhaupt keine strukturierten Workouts,
          es gibt also nichts, wohin man senden könnte.
        </li>
      </ul>

      <h2>Was ein Workout „strukturiert“ macht</h2>
      <p>
        Eine Uhr kann dich nur durch Abschnitte führen. Jeder Abschnitt braucht
        eine Länge (Dauer oder Distanz) und idealerweise ein Ziel: einen
        Pace-Bereich, einen Herzfrequenzbereich oder einen Leistungsbereich.
        Wiederholungen fassen Abschnitte zusammen, „5 × (4&nbsp;min bei
        4:10–4:20/km, 2&nbsp;min locker)“ ist also ein Wiederholungsblock aus
        zwei Abschnitten.
      </p>
      <p>
        Eine Einheit, die nur „60 Minuten locker“ lautet, ohne Abschnitte,
        sendet nichts: Es gibt nichts, wodurch die Uhr dich führen könnte. Wenn
        du sie auf der Uhr haben willst, mach daraus einen einzigen
        60-Minuten-Abschnitt mit einer Herzfrequenzobergrenze.
      </p>
      <p>
        Ziele, die als Zonen angegeben sind, verdienen einen Hinweis. Deine
        Zonen in einer Trainingsplattform und die Zonen auf deiner Uhr sind
        selten dieselben. Wenn ein Abschnitt eine deiner Zonen als Ziel hat,
        sendet OpenAthlete die tatsächlichen Werte (etwa 148–158&nbsp;bpm oder
        4:35–4:45/km) statt „Zone 3“, sodass das Ziel am Handgelenk zum Plan
        passt, egal welche Zonen die Uhr für dich hinterlegt hat. Dasselbe gilt
        für Prozentwerte der maximalen Herzfrequenz oder der Schwellenleistung,
        sofern diese Werte in deinen Metriken eingetragen sind.
      </p>

      <h2>Garmin</h2>
      <p>
        Sobald Garmin verbunden und der Workout-Export eingeschaltet ist, geht
        jede strukturierte Einheit in deinen Garmin-Connect-Kalender. Die Uhr
        holt sie sich beim nächsten Sync mit der Smartphone-App. Auf den meisten
        aktuellen Forerunner-, Fenix- und Venu-Modellen wird dir ein für heute
        geplantes Workout angeboten, wenn du die passende Aktivität startest;
        ansonsten findest du es im Trainingsmenü unter Workouts oder im
        Trainingskalender. Die Menübezeichnungen unterscheiden sich je nach
        Modell, schau also ins Handbuch, wenn du es nicht findest.
      </p>
      <p>
        Verschiebst oder bearbeitest du die Einheit in OpenAthlete, zieht die
        Kopie bei Garmin nach. Gesendet werden Einheiten für Laufen, Radfahren,
        Schwimmen im Becken, Krafttraining, Cardio, Yoga und Pilates. Beim
        Beckenschwimmen akzeptiert Garmin nur die Pace als Ziel, daher fallen
        Herzfrequenzziele bei Schwimmabschnitten weg. Außerdem begrenzt Garmin
        ein Workout auf 100 Abschnitte inklusive Wiederholungen, was nur dann
        eine Rolle spielt, wenn du sehr lange Bahneinheiten Schritt für Schritt
        aufschreibst.
      </p>
      <p>
        Details zur Einrichtung findest du auf der{' '}
        <Link href="/de/connect/garmin">Seite zur Garmin-Verbindung</Link>.
      </p>

      <h2>COROS</h2>
      <p>
        Lauf-, Trailrunning- und Radeinheiten gehen an COROS. Sie erscheinen im
        Kalender der COROS-App und kommen beim Sync auf die Uhr. Schwimm- und
        Krafteinheiten werden nicht gesendet.
      </p>
      <p>
        COROS hat eine Eigenheit, die du vor der Wettkampfwoche kennen solltest:
        Eine App kann dort keine geplante Einheit löschen. Verschiebst oder
        entfernst du eine Einheit in OpenAthlete, bleibt die alte im
        COROS-Kalender als abgesagt markiert stehen, und du löschst sie in der
        COROS-App. Wähle beim Verbinden die Region, in der du dein COROS-Konto
        angelegt hast (Europa, die USA und andere Regionen oder Festlandchina);
        COROS speichert jedes Konto auf genau einem regionalen Server.
      </p>
      <p>
        Die COROS-Anbindung ist die neueste und seit November 2026 live. Details
        und bekannte Einschränkungen stehen auf der{' '}
        <Link href="/de/connect/coros">Seite zur COROS-Verbindung</Link>.
      </p>

      <h2>Suunto</h2>
      <p>
        Lauf-, Trailrunning-, Rad- und Schwimmeinheiten kommen als Guides in
        deinem Suunto-Konto an. Auf der Uhr wählst du den Guide beim Start der
        Trainingseinheit aus, wie jeden anderen Suunto-Guide. Krafteinheiten
        bleiben in OpenAthlete. Zur Einrichtung siehe die{' '}
        <Link href="/de/connect/suunto">Seite zur Suunto-Verbindung</Link>.
      </p>

      <h2>Polar: Aktivitäten rein, Workouts von Hand</h2>
      <p>
        Mit einer Polar-Uhr können deine Aktivitäten, dein Schlaf und deine
        nächtliche HRV weiterhin automatisch in OpenAthlete landen. Für die
        Einheit selbst hast du zwei Möglichkeiten: Erstelle sie in Polar Flow
        als Trainingsziel mit Phasen und synchronisiere die Uhr, oder folge ihr
        in der OpenAthlete-App auf deinem Smartphone. Beides ist nicht so bequem
        wie ein direkter Sync, und das solltest du wissen, bevor du eine Uhr
        kaufst, wenn dir strukturierte Einheiten wichtig sind.
      </p>

      <h2>Wenn dein Coach die Einheiten plant</h2>
      <p>
        Einheiten gehen über die Verbindung des Athleten raus, nicht über die
        des Coaches. Dein Coach kann in deinem Kalender planen, egal welche Uhr
        er hat oder ob überhaupt eine. Solange du Garmin, COROS oder Suunto mit
        eingeschaltetem Workout-Export verbunden hast, kommen seine Einheiten
        genauso an dein Handgelenk wie die, die du selbst planst. Ein Coach kann
        Athleten mit allen drei Marken betreuen, ohne für jede etwas anders zu
        machen.
      </p>

      <h2>Das Workout ist nicht auf meiner Uhr: eine Checkliste</h2>
      <p>
        Geh die Punkte der Reihe nach durch. Die ersten beiden erklären die
        meisten Fälle.
      </p>
      <ul>
        <li>
          <strong>Liegt die Einheit in den nächsten sieben Tagen?</strong>{' '}
          OpenAthlete sendet die kommende Woche, nicht den ganzen Plan. Eine
          Einheit in drei Wochen geht von selbst auf die Uhr, sobald sie
          innerhalb der nächsten sieben Tage liegt. Vergangene Einheiten werden
          nicht gesendet.
        </li>
        <li>
          <strong>Hat die Uhr seitdem synchronisiert?</strong> Das Workout
          landet zuerst in Garmin Connect, der COROS-App oder der Suunto-App.
          Öffne die Smartphone-App der Marke und lass die Uhr synchronisieren.
        </li>
        <li>
          <strong>Ist der Export eingeschaltet?</strong> Prüfe unter
          Einstellungen, Verbindungen, ob der Workout-Export für diese Marke
          aktiv ist.
        </li>
        <li>
          <strong>Hat die Einheit Abschnitte?</strong> Eine Dauer ohne
          Abschnitte sendet nichts.
        </li>
        <li>
          <strong>Unterstützt die Marke diese Sportart?</strong> Eine
          Krafteinheit geht nicht an COROS oder Suunto, eine Schwimmeinheit
          nicht an COROS.
        </li>
        <li>
          <strong>Kann dein Modell strukturierten Workouts folgen?</strong> Die
          meisten aktuellen Laufuhren können das, manche Einsteiger- oder ältere
          Modelle nicht.
        </li>
        <li>
          <strong>Nur bei COROS:</strong> Eine verschobene Einheit kann doppelt
          erscheinen, einmal als abgesagt markiert. Lösch die abgesagte in der
          COROS-App.
        </li>
        <li>
          <strong>Immer noch nichts?</strong> Trenne die Marke unter
          Einstellungen, Verbindungen und verbinde sie neu. Frag dann auf
          unserem <a href={DISCORD_URL}>Discord</a> nach und nenn das Datum der
          Einheit.
        </li>
      </ul>

      <h2>Von Hand erledigen</h2>
      <p>
        Du brauchst keine Plattform, um ein Workout auf eine Uhr zu bringen.
        Garmin Connect, die COROS-App und Polar Flow haben alle einen
        Workout-Editor: Abschnitte anlegen, speichern, synchronisieren. Für eine
        Schlüsseleinheit pro Woche sind das zehn Minuten und funktioniert gut.
        Mühsam wird es, wenn sich ein Plan oft ändert, wenn ein Coach Einheiten
        für mehrere Athleten schreibt oder wenn die Paces aktualisierten Zonen
        folgen sollen. Dann lohnt es sich, eine Plattform das Senden übernehmen
        zu lassen.
      </p>
      <p>
        OpenAthlete sendet Workouts im Free-Plan an Garmin, COROS und Suunto und
        importiert Aktivitäten von diesen dreien sowie von Polar und Strava. Auf
        der{' '}
        <Link href="/de/features/watch-sync">
          Seite zur Uhren-Synchronisierung
        </Link>{' '}
        findest du die vollständige Tabelle nach Marken.
      </p>
    </div>
  );
}
