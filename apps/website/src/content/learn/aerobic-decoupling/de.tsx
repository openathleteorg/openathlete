import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentDe() {
  return (
    <div>
      <p>
        Lauf 90 Minuten in einem gleichmäßigen, lockeren Tempo, und deine
        Herzfrequenz bleibt selten konstant. Sie schleicht nach oben: ein paar
        Schläge in der zweiten Stunde, mehr, wenn es heiß ist, und noch mehr,
        wenn lange Läufe neu für dich sind. Die aerobe Entkopplung macht diesen
        Anstieg messbar. Sie vergleicht, wie viel Pace (oder Leistung) du pro
        Herzschlag in der ersten Hälfte einer gleichmäßigen Belastung erzielst,
        mit der zweiten Hälfte. Joe Friel hat sie unter Ausdauersportlern
        bekannt gemacht, und TrainingPeaks bezeichnet sie als Pa:HR für die Pace
        und Pw:HR für die Leistung.
      </p>

      <h2>So wird die Entkopplung berechnet</h2>
      <p>
        Teile zuerst den gleichmäßigen Teil der Belastung in zwei zeitlich
        gleich lange Hälften. Berechne für jede Hälfte den Efficiency Factor
        (EF): durchschnittlicher Output geteilt durch durchschnittliche
        Herzfrequenz. Dann drückst du den Verlust von der einen zur anderen
        Hälfte in Prozent aus:
      </p>
      <Formula
        where={[
          'EF = durchschnittlicher Output / durchschnittliche Herzfrequenz, für jede Hälfte',
          'Output = steigungsbereinigte Geschwindigkeit beim Laufen, Leistung beim Radfahren',
        ]}
      >
        Entkopplung (%) = (EF1 − EF2) / EF1 × 100
      </Formula>
      <p>
        Ein positiver Wert bedeutet, dass du in der zweiten Hälfte pro Schlag
        weniger erzielt hast: Die Herzfrequenz stieg bei gleicher Pace, oder die
        Pace sank bei gleicher Herzfrequenz. Ist die Strecke nicht flach, sollte
        die Geschwindigkeit steigungsbereinigt sein, sonst sieht ein Anstieg in
        der zweiten Hälfte wie Ermüdung aus. Die übliche Lesart nach Friel:
        unter 5 % ist stabil, 5 bis 10 % zeigen eine gewisse Drift, über 10 %
        hat die Belastung deine aerobe Ausdauer überfordert.
      </p>

      <h2>Ein Rechenbeispiel</h2>
      <p>
        Ein Läufer absolviert 90 Minuten auf einer flachen Runde in 5:20 pro km,
        also 187,5 Meter pro Minute.
      </p>
      <ul>
        <li>
          Erste 45 Minuten: im Schnitt 142 bpm, also EF1 = 187,5 / 142 = 1,320
        </li>
        <li>
          Letzte 45 Minuten: gleiche Pace, im Schnitt 150 bpm, also EF2 = 187,5
          / 150 = 1,250
        </li>
        <li>Entkopplung = (1,320 − 1,250) / 1,320 × 100 = 5,3 %</li>
      </ul>
      <p>
        Knapp über 5 %: eine gewisse Drift. Hätte die zweite Hälfte im Schnitt
        bei 146 bpm gelegen, wären es 2,7 %, also klar stabil. Auf dem Rad ist
        die Rechnung dieselbe, nur mit Watt: 200 W bei 135 bpm, dann 195 W bei
        140 bpm, ergibt EF-Werte von 1,48 und 1,39 und eine Entkopplung von 6,0
        %. Beachte, dass die Leistung gesunken und die Herzfrequenz gestiegen
        ist, beides zählt gegen dich.
      </p>

      <h2>So nutzt du sie im Training</h2>
      <p>
        Am nützlichsten ist die Entkopplung als wiederholbarer Test der aeroben
        Ausdauer während einer Grundlagenphase. Wähle eine gleichmäßige Einheit,
        die du wiederholen wirst: einen lockeren Lauf von 75 bis 120 Minuten auf
        derselben flachen Runde oder eine Ausfahrt am unteren Ende deines
        Grundlagenbereichs. Halte die Intensität jedes Mal in der{' '}
        <Link href="/de/tools/heart-rate-zones">
          gleichen Herzfrequenz- oder Leistungszone
        </Link>{' '}
        und beobachte den Wert über Wochen.
      </p>
      <ul>
        <li>
          Liegt ein 90-Minuten-Lauf über 5 %, übersteigen Dauer oder Pace deine
          aktuelle Ausdauer. Behalte die Pace bei oder nimm sie leicht zurück
          und steigere die Dauer.
        </li>
        <li>
          Bleibt der Wert dauerhaft unter 5 %, verlängere den Lauf oder häng am
          Ende einen gleichmäßigen Block im Marathontempo an und schau, ob er
          stabil bleibt.
        </li>
        <li>
          Vor einem Marathon oder einem langen Traillauf ist ein langer Lauf mit
          Abschnitten im Marathontempo, der unter 5 % bleibt, ein beruhigendes
          Zeichen. Eine starke Drift ist ein Grund, das Zieltempo oder die
          Verpflegung zu überdenken.
        </li>
      </ul>
      <p>
        OpenAthlete berechnet die Entkopplung und den Efficiency Factor für jede
        Laufaktivität mit steigungsbereinigter Geschwindigkeit und Herzfrequenz
        und für Radfahrten mit Leistung. Auf der Aktivitätsseite kannst du das
        Aufwärmen mit einem Schieberegler ausklammern oder einen Abschnitt der
        Belastung auswählen, und die Karte zeigt beide Hälften und einen Status:
        stabil, leichte Drift oder deutliche Drift. Unter 20 Minuten
        kennzeichnet sie die Belastung als zu kurz, um die Ausdauer zu
        beurteilen.
      </p>

      <h2>Grenzen</h2>
      <p>
        Die Entkopplung ist nur bei einer gleichmäßigen Belastung
        aussagekräftig. Intervalle, Stopps an Ampeln oder ein Lauf mit schnellem
        Endspurt machen den Vergleich zunichte. Der größte Störfaktor ist Hitze:
        Coyle und González-Alonso (2001) beschreiben, wie die steigende
        Körpertemperatur die Herzfrequenz nach oben treibt, während das pro
        Schlag gepumpte Volumen sinkt, und Dehydrierung verstärkt das noch. Eine
        Entkopplung von 7 % an einem Nachmittag mit 30 °C und 3 % an einem
        kühlen Morgen können dieselbe Fitness beschreiben. Optische Sensoren am
        Handgelenk, die sich an der Schrittfrequenz festbeißen, ein Brustgurt
        mit trockenen Kontakten oder GPS-Drift unter Bäumen verfälschen jeweils
        eine Hälfte. Und schließlich sagt die Entkopplung nichts über das Tempo
        aus: Du kannst perfekt gekoppelt sein, in einer Pace, die für dein Ziel
        zu langsam ist. Lies sie zusammen mit deiner Pace, deiner{' '}
        <Link href="/de/learn/trimp">Trainingsbelastung</Link> und den
        Bedingungen des Tages.
      </p>
    </div>
  );
}
