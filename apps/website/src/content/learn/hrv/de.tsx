import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentDe() {
  return (
    <div>
      <p>
        Dein Herz schlägt nicht wie ein Metronom. Bei 50 Schlägen pro Minute
        liegen im Schnitt 1,2 Sekunden zwischen zwei Schlägen, aber ein Abstand
        kann 1.150 ms betragen und der nächste 1.240 ms. Die
        Herzfrequenzvariabilität (HRV) misst diese Schwankung. Der schnelle
        Anteil von Schlag zu Schlag stammt größtenteils vom Vagusnerv, der
        parasympathischen „Bremse“ des Herzens. Die HRV ist damit ein Fenster,
        schmal und verrauscht, auf die Frage, wie dein autonomes Nervensystem
        mit Training, Schlaf, Krankheit und Stress zurechtkommt.
      </p>

      <h2>Wie die HRV berechnet wird</h2>
      <p>
        Es gibt Dutzende HRV-Kennzahlen (das Task-Force-Papier von 1996 listet
        die meisten auf). Athleten und ihre Uhren verwenden überwiegend rMSSD,
        die Wurzel aus dem Mittelwert der quadrierten Differenzen
        aufeinanderfolgender Schlagabstände (RR-Intervalle):
      </p>
      <Formula
        where={[
          'RRi = Zeit zwischen zwei aufeinanderfolgenden Schlägen, in Millisekunden',
          'N = Anzahl der Intervalle in der Messung',
        ]}
      >
        rMSSD = √( Σ (RRi+1 − RRi)² / (N − 1) )
      </Formula>
      <p>
        rMSSD bildet die Vagusaktivität gut ab und bleibt auch bei kurzen
        Messungen brauchbar: ein paar Minuten im Liegen nach dem Aufwachen oder
        die Tiefschlafphasen, die eine Uhr in der Nacht auswählt. Weil die
        Tageswerte schief verteilt sind (ein paar sehr hohe Nächte ziehen einen
        einfachen Mittelwert nach oben), nehmen Trainingsstudien meist zuerst
        den natürlichen Logarithmus, ln rMSSD, und mitteln dann.
      </p>

      <h2>Ein Rechenbeispiel</h2>
      <p>
        Nimm fünf aufeinanderfolgende RR-Intervalle: 1.000, 1.050, 980, 1.020
        und 990 ms.
      </p>
      <ul>
        <li>Aufeinanderfolgende Differenzen: +50, −70, +40, −30 ms</li>
        <li>Quadrate: 2.500 + 4.900 + 1.600 + 900 = 9.900</li>
        <li>Mittelwert über die 4 Differenzen: 9.900 / 4 = 2.475</li>
        <li>rMSSD = √2.475 = 49,7 ms, also ln rMSSD = 3,91</li>
      </ul>
      <p>
        Eine echte Messung enthält Hunderte Intervalle, aber die Rechnung ist
        dieselbe. Jetzt eine Woche mit nächtlichen Werten: 62, 58, 65, 48, 60,
        63 und 59 ms. Der Mittelwert ihrer Logarithmen beträgt 4,08, was
        zurückgerechnet 59 ms ergibt. Die Nacht mit 48 ms nach dem langen Lauf
        am Sonntag sieht für sich genommen alarmierend aus, bewegt den
        Wochenwert aber kaum. Zeigt die nächste Woche 52, 49, 55, 50, 47, 51 und
        48 ms, fällt der 7-Tage-Wert auf 3,92 (50 ms). Das ist eine anhaltende
        Verschiebung, und die ist eine Nachfrage wert.
      </p>

      <h2>So nutzt du die HRV im Training</h2>
      <p>
        Der Wert eines einzelnen Morgens sagt wenig. Plews und Kollegen (2013)
        zeigten bei Ausdauerathleten der Weltspitze, dass der gleitende
        7-Tage-Mittelwert von ln rMSSD und seine Schwankung die Anpassung weit
        besser abbilden als Einzelwerte. Eine praktische Routine:
      </p>
      <ul>
        <li>
          Miss jeden Tag gleich: nachts mit derselben Uhr oder nach dem
          Aufwachen, im Liegen, vor dem Kaffee.
        </li>
        <li>
          Bilde aus mindestens drei bis vier Wochen normalen Trainings einen
          Ausgangswert und lege deinen üblichen Bereich darum fest.
        </li>
        <li>
          Lies den 7-Tage-Mittelwert vor diesem Bereich, zusammen mit Ruhepuls,
          Schlaf und dem Gefühl in den Einheiten.
        </li>
      </ul>
      <p>
        Kiviniemi und Kollegen (2007) gingen weiter: Eine Gruppe mäßig
        trainierter Männer absolvierte harte Einheiten nur an Tagen, an denen
        die HRV nicht gesunken war, und lief sonst locker. Sie steigerten ihre
        maximale Laufgeschwindigkeit stärker als eine Gruppe mit festem Plan.
        Eine nützliche Idee, aber eine einzelne Studie mit kleinen Gruppen,
        keine Regel. Für die meisten Athleten funktioniert die HRV am besten als
        Anlass, eine Woche genauer anzuschauen: Wenn der 7-Tage-Mittelwert seit
        einer Woche unter deinem Bereich liegt, der Ruhepuls erhöht ist und sich
        die 5 × 4' an der Schwelle wie ein Wettkampf angefühlt haben, nimm den
        lockeren Tag.
      </p>
      <p>
        OpenAthlete importiert die nächtliche HRV von Garmin, Polar, Suunto und
        COROS (oder du trägst sie von Hand ein), zeigt den Wert der letzten
        Nacht in der täglichen Wellness-Zeile des Kalenders und stellt den
        gleitenden 7-Tage-Mittelwert von ln rMSSD in der Erholungsstatistik dar.
        Es zeigt den Trend, macht daraus aber keinen Bereitschaftswert.
      </p>

      <h2>Grenzen</h2>
      <p>
        Absolute Werte sind individuell: Gesunde, fitte Menschen liegen zwischen
        unter 30 und über 100 ms, der Vergleich mit einem Trainingspartner ist
        also sinnlos. Auch die Geräte unterscheiden sich. Manche geben rMSSD
        über die ganze Nacht an, manche über ein 5-Minuten-Fenster, manche einen
        proprietären Wert; mit einer neuen Uhr beginnt dein Ausgangswert von
        vorn. Alkohol, ein spätes Essen, Hitze, Reisen und der
        Menstruationszyklus verändern die HRV, ohne dass es mit dem Training zu
        tun hat. Und höher ist nicht immer besser: Buchheit (2014) weist darauf
        hin, dass die HRV bei sehr fitten Athleten in harten Trainingsphasen
        aufhören kann zu steigen oder sogar sinkt, während sie sich gut
        anpassen, und dass ein starker Anstieg mit tiefer Ermüdung einhergehen
        kann. Die HRV ist ein Signal unter mehreren; lies sie zusammen mit{' '}
        <Link href="/de/learn/session-rpe">
          dem Gefühl, wie hart die Einheiten waren
        </Link>{' '}
        und mit{' '}
        <Link href="/de/learn/ctl-atl-tsb">deinen Belastungskurven</Link>, nie
        für sich allein.
      </p>
    </div>
  );
}
