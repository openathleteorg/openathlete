import Link from 'next/link';

export function ContentDe() {
  return (
    <div>
      <p>
        TRIMP, kurz für Training Impulse, ist der älteste ernsthafte Versuch,
        eine Trainingseinheit in einer einzigen Zahl auszudrücken. Eric Banister
        und seine Kollegen schlugen ihn in den 1970er-Jahren als Eingangsgröße
        für ihr Fitness-Ermüdungs-Modell vor, und fünfzig Jahre später steckt er
        in der einen oder anderen Form noch immer hinter den meisten
        Belastungsdiagrammen, die auf der Herzfrequenz basieren. Er ist einfach
        genug, um ihn von Hand zu berechnen, und das ist der beste Weg zu
        verstehen, was er richtig macht und wo er dich in die Irre führt.
      </p>

      <h2>Die Formel</h2>
      <p>
        Banisters TRIMP multipliziert die Dauer einer Einheit damit, wie weit du
        in deine Herzfrequenzreserve hineingegangen bist, und gewichtet diese
        Intensität exponentiell, sodass harte Minuten mehr kosten als lockere:
      </p>
      <p>
        <code>TRIMP = Dauer (min) × HFR × 0,64 × e^(1,92 × HFR)</code>
      </p>
      <p>
        wobei <code>HFR = (HFø − HFRuhe) / (HFmax − HFRuhe)</code> der Anteil
        deiner Herzfrequenzreserve ist, den du in der Einheit genutzt hast. Für
        Frauen lauten die Koeffizienten 0,86 und 1,67:{' '}
        <code>TRIMP = Dauer × HFR × 0,86 × e^(1,67 × HFR)</code>.
      </p>
      <p>
        Spannend ist die exponentielle Gewichtung. Sie wurde an den Verlauf des
        Blutlaktats angepasst, das mit der Herzfrequenz steigt: bei lockerer
        Intensität fast flach, nahe der Schwelle steil (Morton, Fitz-Clarke und
        Banister, 1990). Die getrennten Koeffizienten für Männer und Frauen
        stammen aus derselben Arbeit und beschreiben Gruppendurchschnitte, nicht
        dich. Niemand hat gezeigt, dass sie für einen einzelnen Athleten gut
        passen, und das solltest du im Hinterkopf behalten, bevor du einen TRIMP
        von 112 für genauer hältst als einen von 105.
      </p>

      <h2>Ein Rechenbeispiel</h2>
      <p>
        Nimm einen Läufer mit einem Ruhepuls von 50 und einer HFmax von 190,
        also einer Reserve von 140 Schlägen. Er läuft eine lockere Stunde mit
        durchschnittlich 140 bpm.
      </p>
      <ul>
        <li>HFR = (140 − 50) / (190 − 50) = 90 / 140 = 0,643</li>
        <li>Gewichtung = 0,64 × e^(1,92 × 0,643) = 0,64 × 3,44 = 2,20</li>
        <li>TRIMP = 60 × 0,643 × 2,20 = 85</li>
      </ul>
      <p>
        Mit den Koeffizienten für Frauen kommt dieselbe Stunde auf 97. Dasselbe
        Herz, derselbe Lauf, 14 % Unterschied allein durch die Wahl der
        Koeffizienten. Das zeigt, wie stark der absolute Wert von Annahmen
        abhängt.
      </p>
      <p>
        Jetzt eine Schwelleneinheit desselben Läufers: 20 Minuten Aufwärmen bei
        135 bpm, 5 × 4&apos; bei 175 bpm mit 3&apos; Trabpause bei 140, dann 8
        Minuten Auslaufen bei 130. Wieder sechzig Minuten. Blockweise
        aufsummiert ergibt das einen TRIMP von 114. Aus der durchschnittlichen
        Herzfrequenz der gesamten Einheit (149 bpm) berechnet, ergibt es 105.
      </p>
      <p>
        Diese Lücke ist die Exponentialfunktion bei der Arbeit: Vier Minuten bei
        175 kosten weit mehr, als der Durchschnitt vermuten lässt. Wer eine
        Einheit mit lockeren und harten Abschnitten mittelt, unterschätzt sie
        deshalb immer. Banisters ursprüngliche Methode nutzte den Durchschnitt,
        weil die Pulsmesser der damaligen Zeit nur das liefern konnten. Heute
        zeichnet jede Uhr die Herzfrequenz sekündlich auf, und die
        sekundengenaue Integration ist die bessere Wahl. Je länger und
        abwechslungsreicher die Einheit, desto mehr macht das aus.
      </p>
      <p>
        Zur Einordnung: Ein gleichmäßiger langer Lauf über 2:30 h bei 135 bpm
        kommt auf etwa 187, 20 Minuten bei 185 bpm (für diesen Läufer fast
        Vollgas) auf etwa 79. Laut Formel kann eine kurze, sehr harte Belastung
        also so viel kosten wie eine lockere Stunde. Ob deine Beine das genauso
        sehen, ist eine andere Frage.
      </p>

      <h2>Was du richtig einstellen musst</h2>
      <p>
        TRIMP ist nur so gut wie seine beiden Referenzwerte. Eine HFmax, die 10
        Schläge zu hoch angesetzt ist, lässt jede Einheit leichter aussehen,
        eine zu niedrige bläht alles auf. Nimm den höchsten Wert, den du in
        einem harten Wettkampf oder bei einem maximalen Bergsprint gesehen hast,
        nicht 220 minus Lebensalter, was oft um 10 bpm oder mehr in die eine
        oder andere Richtung danebenliegt. Den Ruhepuls misst du am besten
        liegend direkt nach dem Aufwachen, gemittelt über mehrere Morgen. Wenn
        du deine Werte nicht kennst, erklärt unser{' '}
        <Link href="/de/tools/heart-rate-zones">
          Rechner für Herzfrequenzzonen
        </Link>
        , wie du sie schätzt.
      </p>
      <p>
        Dann der Sensor. Optische Sensoren am Handgelenk sind bei gleichmäßigen
        Läufen in Ordnung und oft falsch in den ersten Minuten einer Einheit,
        bei Kälte und bei kurzen Intervallen. Ein Brustgurt beseitigt den
        Großteil dieses Rauschens. Ein Handgelenkswert von 170 bpm bei einem
        lockeren Lauf, der in Wahrheit die Schrittfrequenz misst, liefert dir
        einen TRIMP, der nichts mit dem Lauf zu tun hat.
      </p>

      <h2>Wo TRIMP danebenliegt</h2>
      <p>
        Die Herzfrequenz misst, was dein Herz-Kreislauf-System tut, nicht, was
        deine Muskeln bezahlen. Das hat vorhersehbare Folgen.
      </p>
      <p>
        Bergablaufen ist der klassische Fall. Ein Traillauf mit 1.500 m Abstieg
        kann deine Oberschenkel für vier Tage zerstören, während die
        Herzfrequenz bergab moderat bleibt. TRIMP unterschätzt ihn also.
        Krafteinheiten, Plyometrie und Bergsprints haben dasselbe Problem.
      </p>
      <p>
        Kurze Intervalle sind ein weiterer Fall. Die Herzfrequenz braucht ein
        bis zwei Minuten, um der Anstrengung zu folgen, und erreicht bei einer
        30/30-Einheit nie das Niveau, das die Arbeit verdient. Der TRIMP fällt
        zu niedrig aus.
      </p>
      <p>
        Hitze wirkt in die andere Richtung. An einem heißen Tag kann der
        kardiale Drift die Herzfrequenz bei gleicher Pace über eine Stunde um
        zehn Schläge oder mehr steigen lassen. TRIMP wertet das als härtere
        Einheit. Physiologisch war sie das auch, ganz falsch ist es also nicht,
        aber eine Sommerwoche sieht dadurch schwerer aus als dieselbe Woche im
        März.
      </p>
      <p>
        Und schließlich ist die Herzfrequenz zwischen Sportarten nicht
        vergleichbar. Die meisten Menschen erreichen auf dem Rad niedrigere
        Herzfrequenzen als beim Laufen und im Wasser noch niedrigere. Ein
        Rad-TRIMP und ein Lauf-TRIMP mit demselben Wert stehen also nicht für
        denselben Stress. Manche Coaches verwenden deshalb sportartspezifische
        Maximalwerte.
      </p>

      <h2>Andere Varianten und Session-RPE</h2>
      <p>
        Mehrere Varianten versuchen, Teile davon zu beheben. Der Edwards-TRIMP
        (1993) multipliziert die Minuten in jeder von fünf Herzfrequenzzonen mit
        1 bis 5. Der Lucía-TRIMP (Lucía et al., 2003) nutzt drei Zonen, die über
        die ventilatorischen Schwellen festgelegt und mit 1, 2 und 3 gewichtet
        werden. Manzis individualisierter TRIMP (Manzi et al., 2009) ersetzt
        Banisters Populationskurve durch das eigene Laktatprofil des Athleten.
        Das ist genauer, setzt aber einen Labortest voraus.
      </p>
      <p>
        Die einfachste Alternative verzichtet ganz auf die Herzfrequenz. Fosters
        Session-RPE (Foster et al., 2001) multipliziert die Dauer in Minuten
        damit, wie hart sich die Einheit auf einer Skala von 0 bis 10 angefühlt
        hat: 50 Minuten bei RPE 6 ergeben 300. Es erfasst Muskelschäden, Hitze,
        schlechten Schlaf und einen miesen Arbeitstag, weil du sie spürst.
        Studien, die beide Methoden verglichen, fanden eine gute Korrelation,
        aber längst keine Übereinstimmung (Impellizzeri et al., 2004), und genau
        darum geht es: Wenn TRIMP und Session-RPE auseinanderliegen, ist etwas
        los. Ein Schwellenlauf, der sich wie eine 8 angefühlt hat, während der
        TRIMP normal aussieht, verdient einen zweiten Blick.
      </p>

      <h2>Von der einzelnen Einheit zu Fitness und Ermüdung</h2>
      <p>
        Ein einzelner TRIMP sagt nicht viel aus. Sein Nutzen liegt darin, als
        tägliche Eingangsgröße in Banisters Modell zu dienen, das zwei
        exponentiell gewichtete Mittelwerte deiner Belastung führt: einen
        langsamen für die Fitness, meist mit einer Zeitkonstante von 42 Tagen
        (oft CTL genannt), und einen schnellen für die Ermüdung mit 7 Tagen
        (ATL). Die Form, oder TSB, ist die Differenz. Während eines Blocks liegt
        die Form unter null, im Tapering sinkt die Ermüdung schneller als die
        Fitness, und die Form steigt wieder darüber. Das Modell ist eine
        Beschreibung, kein Naturgesetz, und die 42 und 7 Tage sind Konventionen,
        keine an dir gemessenen Werte. Der Trend über Wochen ist aber nützlich.
      </p>
      <p>
        Daraus folgen zwei praktische Regeln. Vergleiche deine Belastung mit
        sich selbst, nicht mit der von anderen und nicht über Systeme hinweg:
        Ein TRIMP von 100 und ein TSS von 100 bei TrainingPeaks sind
        unterschiedliche Einheiten. Und lies die Kurve über Wochen, ein
        einzelner Tag bedeutet wenig.
      </p>

      <h2>Wie OpenAthlete ihn nutzt</h2>
      <p>
        OpenAthlete berechnet den Banister-TRIMP für jede Aktivität mit
        Herzfrequenz, sekundengenau, wenn der Datenstrom vorhanden ist, mit den
        Koeffizienten 0,64/1,92 und 0,86/1,67 und mit HFmax und Ruhepuls aus
        deinen Messwerten. Wenn du einer Aktivität einen Anstrengungswert gibst,
        wird daneben auch das Session-RPE angezeigt, sodass du siehst, wann die
        beiden auseinanderliegen. Fitness, Ermüdung und Form werden dann über
        deine geplanten Einheiten hinweg prognostiziert. Die Seite zur{' '}
        <Link href="/de/features/training-load">Trainingsbelastung</Link> hat
        einen kleinen TRIMP-Rechner und verlinkt die Formeln im Quellcode.
      </p>

      <h2>Quellen</h2>
      <ul>
        <li>
          Banister EW, Calvert TW, Savage MV, Bach T. A systems model of
          training for athletic performance. Australian Journal of Sports
          Medicine, 1975;7:57–61.
        </li>
        <li>
          Morton RH, Fitz-Clarke JR, Banister EW. Modeling human performance in
          running. Journal of Applied Physiology, 1990;69(3):1171–1177.{' '}
          <a href="https://doi.org/10.1152/jappl.1990.69.3.1171">
            doi:10.1152/jappl.1990.69.3.1171
          </a>
        </li>
        <li>
          Banister EW. Modeling elite athletic performance. In: MacDougall JD,
          Wenger HA, Green HJ (eds), Physiological Testing of the
          High-Performance Athlete. Human Kinetics, 1991.
        </li>
        <li>Edwards S. The Heart Rate Monitor Book. Polar Electro, 1993.</li>
        <li>
          Foster C, Florhaug JA, Franklin J, et al. A new approach to monitoring
          exercise training. Journal of Strength and Conditioning Research,
          2001;15(1):109–115.
        </li>
        <li>
          Lucía A, Hoyos J, Santalla A, Earnest C, Chicharro JL. Tour de France
          versus Vuelta a España: which is harder? Medicine and Science in
          Sports and Exercise, 2003;35(5):872–878.
        </li>
        <li>
          Impellizzeri FM, Rampinini E, Coutts AJ, Sassi A, Marcora SM. Use of
          RPE-based training load in soccer. Medicine and Science in Sports and
          Exercise, 2004;36(6):1042–1047.
        </li>
        <li>
          Manzi V, Iellamo F, Impellizzeri F, D&apos;Ottavio S, Castagna C.
          Relation between individualized training impulses and performance in
          distance runners. Medicine and Science in Sports and Exercise,
          2009;41(11):2090–2096.
        </li>
      </ul>
    </div>
  );
}
