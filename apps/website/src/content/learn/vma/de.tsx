import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentDe() {
  return (
    <div>
      <p>
        VMA steht für <em>vitesse maximale aérobie</em>, die maximale aerobe
        Geschwindigkeit. Englische Fachartikel nennen sie MAS oder vVO2max: die
        niedrigste Laufgeschwindigkeit, bei der deine Sauerstoffaufnahme ihre
        Obergrenze erreicht, deine <Link href="/de/learn/vo2max">VO2max</Link>.
        Läufst du schneller, muss die zusätzliche Energie aus anaeroben Quellen
        kommen, deshalb können die meisten Läufer die VMA nur 4 bis 8 Minuten
        halten. Der Begriff stammt aus dem französischen Training, wo er seit
        dem Bahntest von Luc Léger 1980 und den Arbeiten von Véronique Billat in
        den 1990er-Jahren das Rückgrat des Intervalltrainings bildet. Sein Reiz
        ist praktisch: Die VO2max ist ein Laborwert in Millilitern, die VMA eine
        Geschwindigkeit, die du auf der Bahn laufen kannst.
      </p>

      <h2>So wird die VMA berechnet</h2>
      <p>
        Die direkteste Feldmethode ist der 6-Minuten-Test (der halbe
        Cooper-Test). Nach 20 Minuten Aufwärmen mit ein paar Steigerungsläufen
        läufst du in 6 Minuten so weit wie möglich, in gleichmäßigem Tempo.
        Sechs Minuten liegen innerhalb der Zeit, die die meisten Läufer ihre VMA
        halten können, deine Durchschnittsgeschwindigkeit ist also eine gute
        Schätzung dafür:
      </p>
      <Formula
        where={[
          'Distanz in Metern, Zeit in Minuten; × 0,06 rechnet m/min in km/h um',
        ]}
      >
        VMA (km/h) = Distanz / Zeit × 0,06
      </Formula>
      <p>
        Der 12-minütige Cooper-Test lässt sich leichter einteilen, liefert aber
        einen etwas zu niedrigen Wert, weil fast alle nach 6 oder 7 Minuten in
        diesem Tempo langsamer werden. Stufentests (der Bahntest von Léger und
        Boucher, der VAMEVAL) erhöhen die Geschwindigkeit in regelmäßigen
        Abständen um 0,5 oder 1 km/h, bis du nicht mehr mithalten kannst; die
        letzte vollständig absolvierte Stufe ergibt die VMA. Sie brauchen eine
        Bahn, Hütchen und eine Tonspur, nehmen dir aber das Problem der
        Tempoeinteilung ab.
      </p>
      <p>
        Du kannst die VMA auch aus einem aktuellen Wettkampf zurückrechnen. Jede
        Distanz wird bei einem typischen Anteil der VMA gelaufen: etwa 95 % beim
        5-km-Lauf, 90 % beim 10-km-Lauf, 85 % beim Halbmarathon und 80 % beim
        Marathon. Teile deine Durchschnittsgeschwindigkeit im Wettkampf durch
        diesen Anteil. Ein flacher 5- oder 10-km-Lauf liefert eine bessere
        Schätzung als ein Marathon, bei dem Energieversorgung und Hitze stärker
        ins Gewicht fallen als die aerobe Leistungsfähigkeit.
      </p>

      <h2>Ein Rechenbeispiel</h2>
      <ul>
        <li>
          6-Minuten-Test: 1.500 m → 1.500 / 6 × 0,06 = 15,0 km/h (4:00/km)
        </li>
        <li>Cooper-Test, derselbe Läufer: 2.900 m in 12 Minuten → 14,5 km/h</li>
        <li>
          10 km in 45:00: Durchschnittsgeschwindigkeit 13,33 km/h, geteilt durch
          0,90 → 14,8 km/h
        </li>
      </ul>
      <p>
        Drei Methoden, drei Ergebnisse, die höchstens 0,5 km/h
        auseinanderliegen. Diese Streuung ist normal, und sie erinnert daran,
        dass die VMA eine Schätzung mit Spielraum ist, keine feste Eigenschaft
        wie deine Körpergröße. Nimm 15 km/h und leite daraus deine Paces ab:
      </p>
      <ul>
        <li>100 % VMA: 15,0 km/h, 4:00/km, 125 m in 30 Sekunden</li>
        <li>95 %: 14,25 km/h, 4:13/km</li>
        <li>
          85 % (bei vielen Läufern etwa die Schwelle): 12,75 km/h, 4:42/km
        </li>
        <li>
          65 bis 75 % (lockeres Laufen): 9,75 bis 11,25 km/h, 6:09 bis 5:20/km
        </li>
      </ul>

      <h2>So nutzt du die VMA im Training</h2>
      <p>
        Die VMA ist ein Maßstab für Intervalleinheiten. Klassische Formate an
        oder nahe der VMA: 30/30 (30 Sekunden bei 100 % VMA, 30 Sekunden
        lockeres Traben), 10- bis 20-mal wiederholt, 6 × 1.000 m bei 95 % mit 2
        Minuten Pause, 5 × 3 Minuten bei 95 bis 100 %. Billat zeigte, dass die
        Zeit bis zur Erschöpfung bei VMA zwischen Läufern gleichen Niveaus stark
        schwankt (Billat und Koralsztein, 1996); deshalb kannst du mit kurzen
        Wiederholungen und kurzen Pausen mehr Minuten in dieser Intensität
        sammeln als mit einer einzigen langen Belastung.
      </p>
      <p>
        Unterhalb der VMA werden die Prozentwerte unzuverlässiger. Zwei Läufer
        mit 15 km/h können ihre Schwelle bei 82 % und bei 90 % der VMA haben, je
        nach Ausdauer und Trainingsvorgeschichte. Für Tempodauerläufe und lange
        Läufe ist die Herzfrequenz (siehe den{' '}
        <Link href="/de/tools/heart-rate-zones">
          Rechner für Herzfrequenzzonen
        </Link>
        ) oder wettkampfbasierte Paces wie{' '}
        <Link href="/de/learn/vdot">VDOT</Link> oft die bessere Orientierung.
        Der <Link href="/de/tools/vma">VMA-Rechner</Link> macht aus einem Test
        oder einem Wettkampf Paces, und die{' '}
        <Link href="/de/pace-charts">Pacetabellen</Link> rechnen sie pro
        Kilometer um.
      </p>
      <p>
        In OpenAthlete ist die VMA einer deiner Leistungswerte. Workout-Schritte
        können einen Prozentsatz davon als Ziel haben (zum Beispiel 95 % der
        VMA), und die Einheit wird dann mit echten Paces an Uhren von Garmin,
        Suunto oder COROS geschickt.
      </p>

      <h2>Grenzen</h2>
      <p>
        Die VMA hängt vom Test ab: Laufband, Bahn, hügelige Straße und ein
        windiger Tag ergeben jeweils andere Werte, und schlecht eingeteilte 6
        Minuten können 0,5 km/h kosten. Außerdem vermischt sie zwei Dinge,
        VO2max und Laufökonomie: Zwei Läufer mit derselben VO2max können VMAs
        haben, die 1 bis 2 km/h auseinanderliegen, wenn einer ökonomischer
        läuft. Und schließlich sagt die VMA wenig über die Ausdauer. Ein Läufer
        mit hoher VMA und wenig Umfang bricht in einem Halbmarathon ein, den ein
        Läufer mit niedrigerer VMA und mehr Kilometern locker durchhält. Nutze
        sie, um Intervall-Paces festzulegen, teste alle zwei bis drei Monate neu
        und lass dir den Rest von Wettkämpfen sagen.
      </p>
    </div>
  );
}
