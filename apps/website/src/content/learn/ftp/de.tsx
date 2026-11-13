import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentDe() {
  return (
    <div>
      <p>
        Die funktionelle Schwellenleistung, kurz FTP (functional threshold
        power), ist die höchste Leistung in Watt, die du etwa eine Stunde lang
        annähernd konstant halten kannst. Andrew Coggan definierte sie als
        praktischen Ersatz für die im Labor bestimmten Schwellen, und das Buch{' '}
        <em>Training and Racing with a Power Meter</em> von Hunter Allen und
        Coggan machte sie zum Fixpunkt des meisten Radtrainings: Zonen, Workouts
        und Belastungswerte werden alle in Prozent der FTP angegeben. Mit
        Leistungsmessern fürs Laufen hat dieselbe Idee inzwischen auch das
        Laufen erreicht.
      </p>
      <p>
        Die FTP ist ein Feldwert, gemessen mit einem Powermeter und einer harten
        Belastung, keine im Labor gemessene physiologische Grenze. Ihr nächster
        Verwandter in der Leistungsphysiologie ist die kritische Leistung. Es
        lohnt sich, beide zusammen zu verstehen, denn sie liegen oft nur ein
        paar Watt auseinander und sind trotzdem nicht dasselbe.
      </p>

      <h2>Wie die FTP geschätzt wird</h2>
      <p>
        Die ursprüngliche Definition ist die Durchschnittsleistung eines
        einstündigen Zeitfahrens. Das wollen nur wenige regelmäßig machen,
        deshalb ist der übliche Test ein 20-minütiger Maximaltest, meist mit
        einer vorangehenden harten 5-Minuten-Belastung, die deine anaerobe
        Reserve etwas abbaut. Das Ergebnis wird um 5&nbsp;% reduziert:
      </p>
      <Formula
        where={[
          'P20 = Durchschnittsleistung eines 20-minütigen Maximaltests, in Watt',
        ]}
      >
        FTP ≈ 0,95 × P20
      </Formula>
      <p>
        Der Faktor 0,95 ist eine durchschnittliche Korrektur dafür, dass du 20
        Minuten lang mehr Druck machen kannst als 60. Für manche Fahrer passt er
        gut, für andere schlecht, wie die Grenzen weiter unten zeigen.
      </p>

      <h2>Kritische Leistung</h2>
      <p>
        Die kritische Leistung geht auf Monod und Scherrer (1965) zurück. Trägst
        du deine besten Belastungen als Gesamtarbeit gegen die Zeit auf, liegen
        die Punkte zwischen etwa 2 und 20 Minuten auf einer Geraden. Ihre
        Steigung ist die kritische Leistung (CP); ihr Achsenabschnitt W′ („W
        Strich“) ist eine feste Arbeitsmenge, die du oberhalb der CP leisten
        kannst, bevor du langsamer werden musst:
      </p>
      <Formula
        where={[
          'CP = kritische Leistung, in Watt',
          'W′ = Arbeitskapazität oberhalb der CP, in Joule',
          't = Dauer der Belastung, in Sekunden',
        ]}
      >
        P(t) = CP + W′ / t
      </Formula>
      <p>
        Physiologisch markiert die CP die Grenze zwischen dem schweren Bereich,
        in dem sich Sauerstoffaufnahme und Blutlaktat stabilisieren, und dem
        sehr schweren Bereich, in dem beide weiter ansteigen, bis du aufhörst
        (Poole et al., 2016). Oberhalb der CP verbraucht jede Sekunde etwas W′,
        unterhalb füllt sich W′ langsam wieder auf. Das Gegenstück beim Laufen,
        mit Geschwindigkeit statt Leistung, ist die{' '}
        <Link href="/de/learn/critical-speed">kritische Geschwindigkeit</Link>.
      </p>

      <h2>Ein Rechenbeispiel</h2>
      <p>
        Eine Radfahrerin tritt in einem 20-Minuten-Test im Schnitt 262&nbsp;W.
        Ihre Bestwerte aus den letzten Ausfahrten sind 340&nbsp;W über
        3&nbsp;Minuten, 310&nbsp;W über 5, 275&nbsp;W über 12 und eben diese
        262&nbsp;W über 20.
      </p>
      <ul>
        <li>FTP ≈ 0,95 × 262 = 249&nbsp;W</li>
        <li>
          Eine Anpassung der Arbeit gegen die Zeit über die vier Belastungen
          (61,2, 93,0, 198,0 und 314,4&nbsp;kJ) ergibt CP = 248&nbsp;W und W′ =
          18,0&nbsp;kJ
        </li>
        <li>
          Vorhergesagte 10-Minuten-Leistung: 248 + 17.965 / 600 = 278&nbsp;W,
          stimmig mit den 5- und 12-Minuten-Bestwerten links und rechts davon
        </li>
        <li>
          Eine Attacke mit 400&nbsp;W verbraucht 400 − 248 = 152 Joule W′ pro
          Sekunde, also 17.965 / 152 ≈ 118 Sekunden, bis die Reserve leer ist
        </li>
      </ul>
      <p>
        Hier stimmen FTP und CP auf ein Watt genau überein. Das ist in Gruppen
        häufig, beim Einzelnen aber unzuverlässig: Bei 17 trainierten Radfahrern
        fanden Karsten et al. (2021) eine durchschnittliche CP von 256&nbsp;W
        und eine FTP von 249&nbsp;W, doch die Differenz reichte bei einzelnen
        Fahrern von etwa 19&nbsp;W in die eine bis 33&nbsp;W in die andere
        Richtung.
      </p>

      <h2>Wie du die FTP im Training nutzt</h2>
      <p>
        Coggans klassische Leistungszonen sind Prozentwerte der FTP. Bei
        249&nbsp;W: Grundlagenausdauer (56–75&nbsp;%) liegt bei 139 bis
        187&nbsp;W, Tempo (76–90&nbsp;%) bei 189 bis 224&nbsp;W, Schwelle
        (91–105&nbsp;%) bei 227 bis 261&nbsp;W und VO2max-Training
        (106–120&nbsp;%) bei 264 bis 299&nbsp;W. Typische Einheiten ergeben sich
        daraus:
      </p>
      <ul>
        <li>
          2 × 20 Minuten bei 95–100&nbsp;% der FTP (237 bis 249&nbsp;W), 5
          Minuten locker
        </li>
        <li>3 × 12 Minuten bei 100–105&nbsp;% mit 4 Minuten Erholung</li>
        <li>
          5 × 4 Minuten bei 110–120&nbsp;% (274 bis 299&nbsp;W), gleich lange
          Erholung
        </li>
        <li>Lange Grundlagenausfahrten von 2 bis 4 Stunden unter 75&nbsp;%</li>
      </ul>
      <p>
        CP und W′ liefern etwas, das die FTP nicht kann: Sie sagen dir, wie
        lange du oberhalb der Schwelle bleiben kannst. Das hilft bei der
        Renneinteilung an einem Anstieg, bei einem kurzen Zeitfahren oder in
        einem Rennen mit wiederholten Tempoverschärfungen. Teste alle sechs bis
        acht Wochen neu, oder früher, wenn sich Schwelleneinheiten zu leicht
        oder unmöglich anfühlen.
      </p>
      <p>
        In OpenAthlete ist die FTP für Radfahren und Laufen ein Wert, den du
        einträgst oder synchronisierst; die App führt keinen Test für dich
        durch. Abschnitte im{' '}
        <Link href="/de/features/workout-builder">Workout-Editor</Link> können
        einen Prozentwert der FTP oder der kritischen Leistung als Ziel haben.
        Die Ansicht „Fähigkeiten“ in der Statistik schätzt die kritische
        Leistung aus deinen Rad-Bestwerten zwischen 2 und 20 Minuten und zeigt
        ein 95-%-Intervall: Diese Bestwerte stammen aus dem Training, nicht aus
        Maximaltests, das Ergebnis ist also höchstens das, was sie hergeben.
      </p>

      <h2>Grenzen</h2>
      <p>
        Die Stunde in der Definition ist dehnbar. Als Borszcz et al. (2018) 23
        trainierte Radfahrer baten, bei ihrer 20-Minuten-FTP bis zur Erschöpfung
        zu fahren, hielten sie im Schnitt 50,9 Minuten durch, mit einer
        Standardabweichung von fast 16 Minuten: Manche fuhren deutlich länger
        als eine Stunde, andere hörten nach etwa der Hälfte auf. Fahrer mit
        großer anaerober Kapazität bekommen aus dem 20-Minuten-Test eine
        überhöhte FTP, Dieseltypen eine zu niedrige.
      </p>
      <p>
        Auch die Testbedingungen verschieben den Wert: Hitze drinnen ohne
        ausreichende Kühlung, Fehler bei der Einteilung, Ermüdung, Motivation.
        Die kritische Leistung hat ihre eigenen Schwachstellen. Sie hängt davon
        ab, welche Dauern du einspeist, sie versagt außerhalb von etwa 2 bis 20
        Minuten, und Belastungen aus normalen Ausfahrten sind selten echte
        Maximalbelastungen. Keiner der beiden Werte sagt etwas über die
        Ermüdungsresistenz aus, also wie viel dieser Leistung nach drei Stunden
        im Sattel noch übrig ist. Für die Intensität über die Herzfrequenz siehe{' '}
        <Link href="/de/learn/heart-rate-reserve">Herzfrequenzreserve</Link>;
        für die Laborschwellen, denen sich die FTP annähern will, siehe{' '}
        <Link href="/de/learn/lactate-threshold">Laktatschwelle</Link>.
      </p>
    </div>
  );
}
