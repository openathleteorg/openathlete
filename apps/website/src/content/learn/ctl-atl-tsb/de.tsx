import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentDe() {
  return (
    <div>
      <p>
        CTL, ATL und TSB sind drei Kurven, die aus derselben täglichen
        Trainingsbelastung berechnet werden. Die CTL (chronic training load)
        wird meist Fitness genannt, die ATL (acute training load) Ermüdung und
        die TSB (training stress balance) Form. Sie stammen aus dem
        Impuls-Antwort-Modell, das Eric Banister 1975 veröffentlichte: Jede
        Einheit steigert zugleich deine Fitness und deine Ermüdung, die Ermüdung
        klingt innerhalb von Tagen ab, die Fitness über Wochen, und die
        Leistungsfähigkeit liegt irgendwo in der Differenz zwischen beiden. Die
        Bezeichnungen CTL, ATL und TSB wurden später durch Radsport-Software
        bekannt, die Mathematik aber stammt von Banister.
      </p>

      <h2>Wie sie berechnet werden</h2>
      <p>
        Ausgangspunkt ist ein Belastungswert pro Tag, zum Beispiel die Summe des{' '}
        <Link href="/de/learn/trimp">TRIMP</Link> aller Einheiten dieses Tages
        (0 an einem Ruhetag). Fitness und Ermüdung sind exponentiell gewichtete
        Mittelwerte dieser Reihe, mit unterschiedlichen Zeitkonstanten:
      </p>
      <Formula
        where={[
          'CTL: τ = 42 Tage, jeder Tag wiegt also 1 − e^(−1/42) ≈ 0,0235',
          'ATL: τ = 7 Tage, jeder Tag wiegt also 1 − e^(−1/7) ≈ 0,133',
          'TSB = CTL − ATL',
        ]}
      >
        heute = gestern + (1 − e^(−1/τ)) × (Belastung − gestern)
      </Formula>
      <p>
        Mit τ = 42 Tagen halbiert sich der Effekt einer Einheit auf die CTL in
        etwa 29 Tagen, auf die ATL in weniger als 5 Tagen. Manche Tools nutzen
        für das Tagesgewicht die Abkürzung 2 / (N + 1) aus dem gleitenden
        Durchschnitt. Das ist nicht dasselbe Modell: Mit N = 42 ergibt sie
        0,047, also das Doppelte von 0,0235. Damit halbieren sich faktisch beide
        Zeitkonstanten, und die Kurven reagieren viel schneller (Clarke und
        Skiba, 2013, zeigen die Herleitung Schritt für Schritt).
      </p>
      <p>
        Tools unterscheiden sich auch darin, welchen Tag die TSB verwendet.
        OpenAthlete zieht die Werte desselben Tages voneinander ab, nachdem die
        Belastung dieses Tages eingerechnet ist; andere verwenden die Werte von
        gestern, damit die TSB beschreibt, wie frisch du in die heutige Einheit
        startest. Bei denselben Daten können beide um ein paar Punkte abweichen,
        vergleiche die Werte also nicht zwischen verschiedenen Apps.
      </p>

      <h2>Ein Rechenbeispiel</h2>
      <p>
        Ein Läufer kommt seit Monaten auf durchschnittlich 60 TRIMP pro Tag: CTL
        und ATL liegen beide bei 60, die TSB bei 0. Er startet eine harte Woche
        mit 90 pro Tag. Nach dem ersten Tag:
      </p>
      <ul>
        <li>CTL = 60 + 0,0235 × (90 − 60) = 60,7</li>
        <li>ATL = 60 + 0,133 × (90 − 60) = 64,0</li>
        <li>TSB = 60,7 − 64,0 = −3,3</li>
      </ul>
      <p>
        Nach sieben Tagen mit 90 ist die CTL langsam auf 64,6 gestiegen, während
        die ATL auf 79,0 gesprungen ist: Die TSB liegt bei −14,4. Der Läufer ist
        etwas fitter und deutlich müde. Dann geht er eine Woche lang auf 40 pro
        Tag zurück. Die ATL fällt schnell auf 54,3, die CTL sinkt nur auf 60,8,
        und die TSB wird mit +6,5 positiv. Diese Asymmetrie, dass die Ermüdung
        schneller verschwindet als die Fitness, ist das ganze Prinzip des{' '}
        <Link href="/de/learn/taper">Taperings</Link>.
      </p>

      <h2>Wie du sie im Training nutzt</h2>
      <p>
        Die CTL zeigt dir, wie viel Training du im letzten Monat oder in den
        letzten zwei Monaten verarbeitet hast. Ein stetiger Anstieg um ein paar
        Punkte pro Woche in einer Aufbauphase ist das übliche Bild; ein starker
        Sprung verdient eine kritische Frage, ein langes Plateau ebenfalls, wenn
        du Fortschritt erwartet hast. Die ATL bewegt sich mit jeder Woche und
        erklärt vor allem, warum sich deine Beine schwer anfühlen. Die TSB ist
        der Wert, auf den alle vor einem Wettkampf schauen: Die meisten Athleten
        laufen gute Wettkämpfe irgendwo zwischen leicht negativ und deutlich
        positiv, aber der richtige Wert ist individuell, und du findest ihn nur
        heraus, indem du deine TSB vor guten und schlechten Wettkämpfen
        notierst.
      </p>
      <p>
        Nützlicher werden die Kurven, wenn sie in die Zukunft reichen. Haben
        deine geplanten Einheiten eine geschätzte Belastung, kann das Modell
        CTL, ATL und TSB bis zum Wettkampftag hochrechnen und zeigen, ob dich
        die letzten zwei Wochen wirklich frisch an den Start bringen.
        OpenAthlete macht genau das: Es berechnet die Kurven aus deinen
        Aktivitäten und rechnet sie über die Einheiten in deinem Kalender hoch.
        Es markiert eine TSB unter −20 oder über +25; diese Schwellen sind
        Konventionen zur Beschreibung der Kurve, keine validierten Grenzwerte.
        Details und Code findest du auf der{' '}
        <Link href="/de/features/training-load">
          Seite zur Trainingsbelastung
        </Link>
        .
      </p>

      <h2>Grenzen</h2>
      <p>
        Das Modell ist nur so gut wie die tägliche Belastung, mit der du es
        fütterst. Der herzfrequenzbasierte TRIMP unterschätzt Sprints,
        Krafttraining und Bergablaufen, sodass den Kurven ein Teil dessen
        entgeht, was ein Trailrunner oder Triathlet im Kraftraum macht. Fehlende
        Daten schaden ebenfalls: Eine Woche mit Läufen ohne Brustgurt sieht aus
        wie eine Woche Pause.
      </p>
      <p>
        Die Zeitkonstanten sind Konventionen. Banister hat sie für jeden
        Athleten einzeln angepasst, und die angepassten Werte streuen stark; 42
        und 7 Tage sind sinnvolle Standardwerte, nicht deine Physiologie.
        Hellard und Kollegen (2006) haben gezeigt, wie instabil die angepassten
        Parameter selbst bei guten Daten von Spitzenschwimmern sind. Und nichts
        im Modell weiß etwas über Schlaf, Krankheit oder Stress außerhalb des
        Sports. Eine negative TSB diagnostiziert kein Overreaching, und eine
        hohe heißt nicht, dass du bereit bist. Lies die Kurven zusammen mit der{' '}
        <Link href="/de/learn/session-rpe">Session-RPE</Link>, der{' '}
        <Link href="/de/learn/hrv">HRV</Link> und deinem Gefühl.
      </p>
    </div>
  );
}
