import Link from 'next/link';

import { Sources } from './sources';

export function ContentDe() {
  return (
    <div>
      <p>
        Frag zehn Läufer, warum sie sich verletzt haben, und die meisten nennen
        dir sofort eine Ursache: die neuen Schuhe, das Bahntraining, der
        Wettkampf mit den langen Bergabpassagen, „zu viel, zu früh“. Die
        Forschung antwortet weniger eindeutig. Der Zusammenhang zwischen
        Trainingsbelastung und Laufverletzungen ist real, aber schwächer,
        verrauschter und individueller, als es die Dashboards der meisten
        Trainings-Apps vermuten lassen. In diesem Artikel geht es darum, was die
        Studienlage tatsächlich hergibt und wo sie an ihre Grenzen stößt.
      </p>

      <h2>Wie oft sich Läufer verletzen</h2>
      <p>
        Eine systematische Übersichtsarbeit zu Langstreckenläufern fand je nach
        Studie jährliche Verletzungsraten zwischen 19&nbsp;% und 79&nbsp;% (van
        Gent et al., 2007). Diese Spanne sagt genauso viel darüber aus, wie
        unterschiedlich Studien eine Verletzung definieren, wie über das Laufen
        selbst. Aussagekräftiger ist die Zählung pro Laufstunde: Eine spätere
        Metaanalyse kam bei Laufanfängern auf rund 18 Verletzungen pro 1.000
        Stunden, bei Freizeitläufern auf etwa 8 (Videbæk et al., 2015).
        Einsteiger verletzen sich bei gleicher Laufzeit also etwa doppelt so
        oft. Das ist der erste Hinweis darauf, dass vor allem die Lücke zwischen
        dem zählt, was du tust, und dem, was dein Körper gewohnt ist.
      </p>
      <p>
        Der über alle Studien hinweg beständigste Risikofaktor ist weder der
        Umfang noch das Tempo, sondern eine frühere Verletzung (van der Worp et
        al., 2015). Hattest du schon einmal Probleme mit der Achillessehne,
        verdient diese Sehne mehr Vorsicht als jeder Quotient in einem Diagramm.
      </p>

      <h2>Belastung gegen Belastbarkeit</h2>
      <p>
        Das hilfreichste Modell für Überlastungsverletzungen stammt von
        Bertelsen und Kollegen (2017). Eine Verletzung entsteht, wenn die
        Belastung einer bestimmten Struktur, etwa des Schienbeins oder der
        Plantarfaszie, wiederholt und über einen gewissen Zeitraum das
        übersteigt, was diese Struktur verkraftet. Zwei Größen verändern sich:
        die Belastung, die du aufbringst, und die Belastbarkeit des Gewebes. Sie
        steigt mit allmählichem Training und sinkt bei schlechtem Schlaf, zu
        geringer Energiezufuhr, Krankheit oder nach einer früheren Verletzung.
      </p>
      <p>
        Dieses Modell zeigt die größte Schwäche jeder Belastungskennzahl. Deine
        Uhr misst Zeit, Distanz und Herzfrequenz. Deinem Schienbein ist die
        Herzfrequenz egal. Ein zweistündiger Traillauf mit 1.200&nbsp;m Abstieg
        und ein zweistündiger Lauf im Flachen bei gleicher durchschnittlicher
        Herzfrequenz ergeben einen ähnlichen TRIMP, aber deine Oberschenkel und
        Knie werden dir sagen, dass das nicht derselbe Tag war. Werte zur
        Trainingsbelastung beschreiben die Kosten für dein Herz-Kreislauf-System
        recht gut. Die Kosten für eine bestimmte Sehne oder einen bestimmten
        Knochen beschreiben sie nur indirekt.
      </p>

      <h2>Was die Studien an Läufern zeigen</h2>
      <p>
        Es gibt weniger gute Studien an Läufern, als man erwarten würde, und die
        meisten begleiten Anfänger. Drei davon solltest du kennen.
      </p>
      <p>
        In einer dänischen Kohorte von 874 Laufanfängern mit GPS-Uhren hatten
        diejenigen, die ihren Wochenumfang innerhalb von zwei Wochen um mehr als
        30&nbsp;% steigerten, eine höhere Rate an „distanzbedingten“
        Verletzungen (patellofemorales Schmerzsyndrom, Iliotibialband-Syndrom,
        Shin Splints und einige weitere) als diejenigen, die unter 10&nbsp;%
        blieben (Nielsen et al., 2014). Die Gesamtverletzungsrate unterschied
        sich zwischen den Gruppen nicht, und selbst dieser spezifische Befund
        war statistisch grenzwertig. Die Autoren bezeichneten die Studie als
        explorativ.
      </p>
      <p>
        In einer randomisierten Studie aus den Niederlanden bereiteten sich 532
        Laufanfänger auf einen 6,7-km-Lauf vor, entweder mit einem Standardplan
        über 8 Wochen oder mit einem sanfteren 13-Wochen-Plan nach der
        10-%-Regel. Die Verletzungsraten waren nahezu identisch: 20,8&nbsp;% und
        20,3&nbsp;% (Buist et al., 2008).
      </p>
      <p>
        In der Studie Run Clever steigerten 447 Freizeitläufer 16 Wochen lang
        entweder den Umfang oder die Intensität ihres Trainings. Die Forscher
        erwarteten, dass jeder Ansatz seine eigene Art von Verletzungen
        hervorbringt. Sie fanden keinen Unterschied (Ramskov et al., 2018).
      </p>
      <p>
        Zusammengefasst: Große, plötzliche Sprünge spielen wahrscheinlich eine
        Rolle, vor allem bei Anfängern. Dass eine Feinsteuerung der Steigerung
        unterhalb dieser Schwelle viel verändert, ist nicht belegt. Was das
        Woche für Woche praktisch bedeutet, liest du in{' '}
        <Link href="/de/blog/injury-prevention-2-when-algorithms-predict-the-break">
          wie schnell du deinen Wochenumfang steigern solltest
        </Link>
        .
      </p>

      <h2>Die Acute:Chronic Workload Ratio und warum sie umstritten ist</h2>
      <p>
        Wer sich mit Verletzungen und Belastung beschäftigt hat, ist der
        Acute:Chronic Workload Ratio (ACWR) begegnet: die Belastung der letzten
        Woche geteilt durch deine durchschnittliche Wochenbelastung der letzten
        vier Wochen. Sie entstand aus Studien an schnellen Werfern im Cricket
        (Hulin et al., 2014) und wurde durch Tim Gabbetts Artikel von 2016 zum
        „Training-Injury Prevention Paradox“ populär, der einen „Sweet Spot“
        zwischen 0,8 und 1,3 und eine Gefahrenzone oberhalb von 1,5 beschrieb
        (Gabbett, 2016). Innerhalb weniger Jahre fanden sich diese Zahlen in
        Apps, Trainerlehrgängen und unzähligen Blogartikeln, darunter auch in
        einer früheren Version dieses Textes.
      </p>
      <p>Die Kritik kam genauso schnell.</p>
      <ul>
        <li>
          In der üblichen Berechnung steckt die letzte Woche sowohl im Zähler
          als auch im Nenner. Lolli und Kollegen (2019) zeigten, dass diese
          mathematische Kopplung schon für sich genommen eine Korrelation
          erzeugt, selbst bei Zufallsdaten.
        </li>
        <li>
          Impellizzeri und Kollegen (2020) argumentierten, dass die Division
          durch die chronische Belastung einen Zusammenhang zwischen beiden
          Größen voraussetzt, der nie geprüft wurde, dass sich der Quotient je
          nach gleitendem oder exponentiell gewichtetem Mittelwert
          unterschiedlich verhält und dass die Schwellenwerte aus wenigen
          Stichproben aus Mannschaftssportarten abgeleitet und dann auf alle
          übertragen wurden. Ein Jahr später gingen sie noch weiter und
          empfahlen, die ACWR samt der zugrunde liegenden Theorie zu verwerfen
          (Impellizzeri et al., 2021).
        </li>
        <li>
          Die meisten ACWR-Studien sind Beobachtungsstudien aus
          Mannschaftssportarten mit einer überschaubaren Zahl an Verletzungen.
          Eine Variable, die in einer Gruppe mit Verletzungen zusammenhängt,
          sagt nicht voraus, welche einzelne Person sich verletzen wird. Roald
          Bahr hat das für Screening-Tests allgemein festgehalten, und es gilt
          auch hier (Bahr, 2016).
        </li>
      </ul>
      <p>
        Meine Einschätzung: Die Idee hinter der ACWR, nämlich nicht plötzlich
        viel mehr zu tun als in letzter Zeit, ist alt, vernünftig und passt zu
        den oben genannten Laufdaten. Die genauen Schwellenwerte sind dagegen
        nicht belegt. Betrachte „1,5“ als Folklore, nicht als Physiologie, und
        sei skeptisch bei allem, was dein Training auf eine einzige Prozentzahl
        für das Verletzungsrisiko reduziert.
      </p>

      <h2>Was du daraus machst</h2>
      <p>
        Unsichere Evidenz ist kein Grund, die Belastung zu ignorieren. Sie ist
        ein Grund, sie für das zu nutzen, was sie gut kann: zu bemerken, dass
        sich diese Woche stark von den letzten unterscheidet, und dich zu
        fragen, warum.
      </p>
      <p>
        Achte auf die Veränderungen, die Belastungskennzahlen übersehen. Das
        erste Bahntraining seit Monaten, ein Wettkampf mit vielen Höhenmetern
        bergab, neue Schuhe mit geringerer Sprengung, der Wechsel vom Trail auf
        Asphalt: Jede dieser Änderungen belastet bestimmte Gewebe auf neue
        Weise, selbst wenn sich die Wochensumme kaum bewegt. Ändere davon immer
        nur eine Sache auf einmal.
      </p>
      <p>
        Nimm dein subjektives Empfinden ernst. Eine systematische
        Übersichtsarbeit fand, dass die Selbstauskunft von Athleten (Stimmung,
        Müdigkeit, Muskelkater) zuverlässiger auf Training reagierte als gängige
        objektive Marker wie Herzfrequenz oder Blutwerte (Saw et al., 2016).
        Notiere Schmerzen an dem Tag, an dem sie auftreten, mit einem Wort dazu,
        wo und wie stark. Schmerzen, die deinen Laufstil verändern, die am
        nächsten Morgen schlimmer sind oder die genau an einer Stelle eines
        Knochens sitzen, sind ein Grund aufzuhören und dich untersuchen zu
        lassen, ganz egal, was ein Diagramm sagt.
      </p>
      <p>
        Und denk an die Belastbarkeit. Eine Woche mit schlechtem Schlaf, ein
        Magen-Darm-Infekt oder eine Phase, in der du zu wenig isst, senkt das,
        was dein Gewebe verkraften kann. Derselbe Trainingsplan ist für
        denselben Läufer nicht in jedem Monat des Jahres dieselbe Belastung.
      </p>

      <h2>Wo OpenAthlete ins Spiel kommt</h2>
      <p>
        OpenAthlete sagt keine Verletzungen voraus und gibt dir keinen
        Risikowert. Es zeigt dir die Werte, die laut diesem Artikel einen Blick
        wert sind, nebeneinander. Jede Einheit erhält eine Belastung aus der
        Herzfrequenz (TRIMP), daneben steht die Session-RPE. Fitness, Ermüdung
        und Form werden über dein bisheriges Training dargestellt und über die
        geplanten Einheiten hochgerechnet, und jede Woche zeigt ihre Belastung
        im Vergleich zu einem Bereich, der aus deinen letzten Wochen berechnet
        wird. Das ist eine Faustregel, keine Sicherheitsgrenze. Nach einer
        Aktivität halten ein paar optionale Fragen fest, wie hart sie sich
        angefühlt hat und welche Schmerzen du angibst. Diese Schmerzen landen in
        einem Verletzungsprotokoll, das dein Coach sieht. Details und Formeln
        findest du auf der{' '}
        <Link href="/de/features/training-load">
          Seite zur Trainingsbelastung
        </Link>
        .
      </p>

      <h2>Quellen</h2>
      <Sources />
    </div>
  );
}
