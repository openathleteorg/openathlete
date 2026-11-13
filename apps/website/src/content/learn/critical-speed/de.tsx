import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentDe() {
  return (
    <div>
      <p>
        Trag deine Bestzeiten von wenigen Minuten bis etwa zwanzig gegen die
        zurückgelegte Distanz auf, und die Punkte liegen fast auf einer Geraden.
        Ihre Steigung ist deine kritische Geschwindigkeit (Critical Speed, CS):
        die Strecke, die du mit jeder zusätzlichen Sekunde Anstrengung Meter für
        Meter dazugewinnen kannst. Die Gerade beginnt nicht bei null. Sie
        schneidet die Distanzachse etwas darüber, bei einem Wert namens D′
        (D-Strich): eine feste Distanz, die du schneller als mit kritischer
        Geschwindigkeit laufen kannst, bevor du langsamer werden musst.
      </p>
      <p>
        Die Idee stammt von Monod und Scherrer (1965), die sie für die Arbeit
        einer Muskelgruppe unter dem Namen kritische Leistung (Critical Power)
        beschrieben. Sie lässt sich aufs Laufen übertragen, mit Geschwindigkeit
        statt Leistung und Distanz statt Arbeit. Physiologisch ist die kritische
        Geschwindigkeit die Grenze zwischen Belastungen, bei denen
        Sauerstoffaufnahme und Laktat sich auf einem stabilen Niveau einpendeln,
        und Belastungen, bei denen sie weiter ansteigen, bis du aufhörst (Poole
        et al., 2016). Sie liegt nahe am und etwas über dem maximalen
        Laktat-Steady-State, den die{' '}
        <Link href="/de/learn/lactate-threshold">Laktatschwelle</Link> zu
        schätzen versucht.
      </p>

      <h2>So wird die kritische Geschwindigkeit berechnet</h2>
      <Formula
        where={[
          'd = Distanz einer Bestleistung (m), t = ihre Dauer (s)',
          'CS = kritische Geschwindigkeit (m/s), D′ = Distanz oberhalb der CS (m)',
          'Oberhalb der CS: Zeit bis zur Erschöpfung t = D′ / (v − CS)',
        ]}
      >
        d = D′ + CS × t
      </Formula>
      <p>
        Mit zwei maximalen Belastungen lässt sich die Gerade von Hand berechnen.
        Mit drei oder mehr passt man sie nach der Methode der kleinsten Quadrate
        an, und die Streuung der Punkte um die Gerade zeigt dir, wie sehr du der
        Steigung trauen kannst. Die Belastungen sollten zwischen etwa 2 und 20
        Minuten dauern: Kürzere beruhen auf Sprintfähigkeiten, die das Modell
        nicht beschreibt, längere bringen Ermüdung und Energieversorgung ins
        Spiel.
      </p>

      <h2>Ein Rechenbeispiel</h2>
      <p>
        Eine Läuferin hat vier aktuelle Bestzeiten: 1.000 m in 3:10 (190 s),
        2.000 m in 6:55 (415 s), 3.000 m in 10:30 (630 s) und 5.000 m in 18:00
        (1.080 s).
      </p>
      <ul>
        <li>
          Passt man die Distanz gegen die Zeit an, ergibt sich eine Steigung von
          4,50 m/s: Die kritische Geschwindigkeit liegt bei 16,2 km/h oder 3:42
          pro km.
        </li>
        <li>Der Achsenabschnitt ist D′ ≈ 145 m.</li>
        <li>
          Mit vier Punkten beträgt das 95-%-Intervall der Steigung ±0,11 m/s,
          die kritische Geschwindigkeit liegt also irgendwo zwischen 3:37 und
          3:48 pro km.
        </li>
        <li>
          Bei 3:20 pro km (5,0 m/s) ist D′ nach 145 / (5,0 − 4,50) ≈ 290 s
          aufgebraucht, nach etwa 1.450 m. Das Modell sagt für 1.500 m rund 5:01
          voraus.
        </li>
      </ul>
      <p>
        Beachte, dass das 5-km-Tempo (3:36 pro km) schneller ist als die
        kritische Geschwindigkeit. Das ist zu erwarten: Jeder Wettkampf, der
        kurz genug ist, um ins Ziel zu kommen, bevor D′ leer ist, wird darüber
        gelaufen.
      </p>

      <h2>So nutzt du sie im Training</h2>
      <p>
        Die kritische Geschwindigkeit teilt deine Paces in zwei Welten. Darunter
        baut sich Ermüdung langsam auf, und die Grenze sind vor allem Zeit und
        Energie. Darüber wird jeder Meter jenseits der Linie von D′ abgezogen,
        und wenn D′ aufgebraucht ist, wirst du langsamer, egal was deine
        Motivation sagt.
      </p>
      <ul>
        <li>
          Intervalle über der CS: 5 × 1.000 m in 3:30 pro km (4,76 m/s) für die
          Läuferin oben. Jede Wiederholung legt 1.000 − 4,50 × 210 ≈ 55 m
          oberhalb der kritischen Geschwindigkeit zurück, etwa 38 % von D′. Die
          Pausen füllen einen Teil davon wieder auf, aber nicht alles, deshalb
          fühlen sich die letzten Wiederholungen härter an (Jones und Vanhatalo,
          2017).
        </li>
        <li>
          Training knapp unter der CS: 3 × 10&apos; in 3:48 bis 3:52 pro km.
          Hart, aber der Steady State hält.
        </li>
        <li>
          Pacing im Wettkampf: Startest du einen 5-km-Lauf schneller als die CS,
          verbrauchst du D′ früh. Verteilst du es über die Distanz, kommst du
          schneller ins Ziel.
        </li>
      </ul>
      <p>
        Smyth und Muniz-Pumares (2020) zeigten, dass sich die kritische
        Geschwindigkeit aus den rohen Trainingsdaten von
        Freizeit-Marathonläufern schätzen lässt, ohne eigene Tests, und dass sie
        mit ihren Marathonzeiten zusammenhängt. Die Statistiken von OpenAthlete
        machen in ihrer Ansicht „Fähigkeiten“ dasselbe: Sie passen die Gerade an
        deine Bestleistungen zwischen 2 und 20 Minuten an (mindestens drei
        davon), zeigen das 95-%-Intervall und machen dasselbe mit der Leistung
        für die kritische Leistung auf dem Rad. Auf der{' '}
        <Link href="/de/features">Funktionsseite</Link> steht, was sonst noch
        aus deiner Trainingshistorie berechnet wird.
      </p>

      <h2>Grenzen</h2>
      <p>
        Bestleistungen aus dem Training sind keine Maximaltests. War deine
        3.000-m-Bestzeit ein Tempodauerlauf, liegt die angepasste
        Geschwindigkeit unter deiner tatsächlichen: Das Ergebnis ist höchstens
        das, was deine Belastungen zeigen. Liegen die Belastungen bei ähnlicher
        Dauer eng beieinander, wird das Intervall breit, und eine GPS-Bestzeit
        bergab oder mit Rückenwind zieht die Gerade nach oben. Über lange
        Wettkämpfe sagt das Modell außerdem nichts. Die kritische
        Geschwindigkeit ist kein Tempo, das du stundenlang halten kannst, und
        ein Marathon wird deutlich darunter gelaufen, bei einem Anteil, der mehr
        von Ausdauer und Energieversorgung abhängt als von der Geraden selbst.
        Kombiniere sie dafür mit wettkampfbasierten Tools wie dem{' '}
        <Link href="/de/tools/race-predictor">Zielzeitrechner</Link> oder den{' '}
        <Link href="/de/pace-charts">Pacetabellen</Link>, und nimm die{' '}
        <Link href="/de/learn/vma">VMA</Link> für das kurze Ende der Kurve.
      </p>
    </div>
  );
}
