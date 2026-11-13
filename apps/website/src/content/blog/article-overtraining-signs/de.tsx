import Link from 'next/link';

import { Sources } from './sources';

export function ContentDe() {
  return (
    <div>
      <p>
        Die meisten Läufer, die sagen, sie seien übertrainiert, sind es nicht.
        Sie sind müde von einem harten Block, und genau das ist der Sinn eines
        harten Blocks. Oder sie sind im Overreaching, essen zu wenig, brüten
        etwas aus oder schlafen wegen der Arbeit sechs Stunden pro Nacht. Ein
        echtes Übertrainingssyndrom ist selten, ernst und braucht lange, bis es
        ausheilt. Die eigentliche Kunst besteht darin, diese Zustände früh
        auseinanderzuhalten, denn jeder verlangt eine andere Reaktion.
      </p>

      <h2>Drei Zustände, ein Kontinuum</h2>
      <p>
        Die Referenz ist hier das gemeinsame Konsenspapier des European College
        of Sport Science und des American College of Sports Medicine (Meeusen et
        al., 2013). Es beschreibt ein Kontinuum, das weniger über Symptome
        definiert ist als darüber, wie lange die Erholung dauert.
      </p>
      <ul>
        <li>
          <strong>Funktionelles Overreaching.</strong> Eine gezielte Überlastung
          drückt deine Leistung für ein paar Tage bis zwei Wochen. Nach der
          Erholung bist du wieder auf demselben Niveau oder etwas besser. Ein
          Trainingslager oder die härteste Woche einer Marathonvorbereitung
          endet oft hier.
        </li>
        <li>
          <strong>Nicht funktionelles Overreaching.</strong> Derselbe Einbruch,
          aber er hält Wochen bis Monate an, und am Ende steht kein
          Leistungssprung, sondern nur verlorene Zeit. Meist leiden auch
          Stimmung und Schlaf.
        </li>
        <li>
          <strong>Übertrainingssyndrom.</strong> Die Leistung bleibt Monate oder
          länger im Keller, mit einem breiteren Spektrum an Symptomen. Ärzte
          können es nur diagnostizieren, indem sie alles andere ausschließen.
        </li>
      </ul>
      <p>
        Eine unbequeme Folge: Welcher Zustand es war, weißt du erst im
        Nachhinein. Zwei Wochen nach Beginn eines Leistungstiefs sehen
        funktionelles und nicht funktionelles Overreaching gleich aus.
      </p>
      <p>
        Lohnt es sich, funktionelles Overreaching gezielt anzusteuern? Eine
        französische Studie mit trainierten Triathleten mahnt zur Vorsicht. Nach
        drei Wochen Überlastung und einem Tapering verbesserten sich die
        Athleten am meisten, die stark ermüdet waren, ohne Leistung zu
        verlieren. Wer ins funktionelle Overreaching gerutscht war, legte
        weniger zu und hatte mehr Infekte (Aubry et al., 2014). So hart zu
        trainieren, dass du es spürst, ist in Ordnung. Zu trainieren, bis deine
        Leistung einbricht, ist keine bessere Version davon.
      </p>

      <h2>Die fünf Anzeichen, auf die du achten solltest</h2>
      <p>
        Keines davon ist für sich allein eine Diagnose, und jedes kann eine ganz
        normale Erklärung haben. Entscheidend ist, wenn mehrere zusammen
        auftreten und länger anhalten, als eine normale Erholung dauern würde.
      </p>

      <h3>
        1. Die Leistung sinkt, und eine lockere Woche bringt sie nicht zurück
      </h3>
      <p>
        Das ist das zentrale Anzeichen im Konsenspapier. In der Praxis sieht das
        so aus: Eine Schwelleneinheit, die du normalerweise in 4:15 pro km
        läufst, kostet dich jetzt bei 4:25 alles, oder bei Intervallen steigt
        deine Herzfrequenz nicht so hoch wie sonst, obwohl du am Anschlag
        läufst. Eine schlechte Einheit bedeutet nichts. Dasselbe Bild nach vier
        oder fünf lockeren Tagen solltest du ernst nehmen.
      </p>

      <h3>2. Die üblichen Einheiten fühlen sich härter an</h3>
      <p>
        Deine Anstrengungsbewertung steigt bei gleicher Pace und Herzfrequenz.
        Ein lockerer 8-km-Lauf, den du sonst mit 3 von 10 bewerten würdest,
        fühlt sich jetzt wie eine 5 an. Das ist ein subtiles Signal, aber ein
        frühes. Eine systematische Übersichtsarbeit fand, dass die
        Selbsteinschätzung von Ermüdung, Stimmung und Muskelkater den
        Trainingsstress besser abbildete als gängige objektive Marker (Saw et
        al., 2016). Das funktioniert allerdings nur, wenn du nach jeder Einheit
        ehrlich protokollierst, auch nach den langweiligen.
      </p>

      <h3>3. Deine Stimmung verändert sich</h3>
      <p>
        Reizbarkeit, fehlende Motivation, keine Lust auf einen Lauf, auf den du
        dich sonst freuen würdest. Studien an Schwimmern in den 1980er-Jahren
        zeigten, dass Stimmungsstörungen mit der Trainingsbelastung zunahmen und
        wieder abnahmen, sobald die Belastung sank (Morgan et al., 1987). Die
        Menschen um dich herum merken es oft vor dir.
      </p>

      <h3>4. Schlaf und Ruhewerte verschieben sich</h3>
      <p>
        Du bist erschöpft, schläfst aber schlecht, wachst um 4 Uhr auf oder
        fühlst dich nach acht Stunden nicht erholt. Auch Ruhepuls und
        Herzfrequenzvariabilität können sich verändern, aber lies sie mit
        Vorsicht. Ein einzelner Morgenwert ist größtenteils Rauschen: Schau auf
        den Wochendurchschnitt im Vergleich zu deinem eigenen Ausgangswert
        (Plews et al., 2013). Und die HRV kann sich im Overreaching in beide
        Richtungen bewegen, „HRV gestiegen“ ist also nicht automatisch eine gute
        Nachricht.
      </p>

      <h3>5. Schwere Beine, die schwer bleiben, und ständig krank</h3>
      <p>
        Normale Müdigkeit verschwindet nach zwei oder drei lockeren Tagen. Diese
        nicht. Oft kommt eine Erkältung nach der anderen dazu, oder kleine
        Wehwehchen wandern von einem Bein ins andere. In der oben erwähnten
        Triathletenstudie waren Infekte in der Overreaching-Gruppe deutlich
        häufiger.
      </p>

      <h2>Schließ die üblichen Verdächtigen aus</h2>
      <p>
        Bevor du dem Training die Schuld gibst, überleg, was sonst dasselbe Bild
        verursacht. Ein Virus, den du nicht ganz losgeworden bist. Eisenmangel,
        der bei Ausdauerläufern häufig ist, besonders bei Frauen. Eine zu
        geringe Energieverfügbarkeit, bei der du zu wenig isst für das, was du
        verbrauchst: Der IOC-Konsens zum relativen Energiemangel im Sport
        (RED-S) nennt Leistungseinbußen, Müdigkeit, häufige Infekte und
        Stressfrakturen als Folgen (Mountjoy et al., 2023).
        Schilddrüsenprobleme. Stress in Job oder Familie, den dein Körper als
        Belastung zählt, auch wenn dein Trainingstagebuch es nicht tut. Wenn du
        seit mehr als zwei oder drei Wochen ohne klaren Grund unter deinem
        Niveau bleibst und müde bist, geh zum Arzt und lass ein Blutbild machen.
      </p>

      <h2>Was du in welcher Phase tust</h2>
      <p>
        <strong>Nach einer geplanten Überlastung</strong> nimm dir die leichtere
        Woche, die du eingeplant hast. Lockeres Laufen, Schlaf, normale
        Mahlzeiten. Wenn du dich nach fünf bis zehn Tagen wieder spritzig
        fühlst, warst du genau da, wo du hinwolltest.
      </p>
      <p>
        <strong>Wenn die leichtere Woche nicht gereicht hat,</strong> streich
        für ein oder zwei weitere Wochen jede Intensität. Kurze lockere Läufe
        oder Pause, keine Intervalle, keine Wettkämpfe. Dann teste dich
        behutsam, etwa mit 3 × 8&apos; an der Schwelle, und vergleich Pace und
        Herzfrequenz mit dem, was du vorher geschafft hast.
      </p>
      <p>
        <strong>Wenn du das echte Syndrom vermutest,</strong> hör mit dem
        strukturierten Training auf und geh zu einem Sportmediziner. Die
        Erholung wird in Monaten gemessen, und ein zu früher Wiedereinstieg ist
        der häufigste Grund, warum sie länger dauert.
      </p>

      <h2>So lässt du es gar nicht so weit kommen</h2>
      <p>
        Plane leichtere Wochen ein, bevor du sie brauchst, jede dritte oder
        vierte Woche. Pack keinen großen Block auf einen stressigen Monat im
        Job. Variiere deine Tage: Carl Foster beschrieb, wie Training, das jeden
        Tag hart war und sich von Tag zu Tag kaum unterschied (er nannte das
        Monotonie), bei den Athleten, die er begleitete, mit Krankheit
        zusammenfiel (Foster, 1998). Und nimm dir jeden Morgen dreißig Sekunden,
        um Schlaf, Stress, Ermüdung und Muskelkater zu bewerten. Das ist der
        Hooper-Index (Hooper et al., 1995), und über ein paar Wochen sagt er
        mehr als jede einzelne Zahl deiner Uhr.
      </p>

      <h2>Was OpenAthlete zeigt und was nicht</h2>
      <p>
        OpenAthlete diagnostiziert weder Overreaching noch Übertraining. Es
        bündelt die oben genannten Signale an einem Ort. Jede Einheit hat eine
        Belastung aus der Herzfrequenz (TRIMP) und, wenn du sie bewertest, ein
        Session-RPE, sodass du siehst, wenn die Anstrengung bei gleicher Arbeit
        steigt. Fitness, Ermüdung und Form werden über die Zeit dargestellt.
        Schlaf, HRV und Ruhepuls kommen von Garmin, Polar, Suunto oder COROS,
        oder du trägst sie von Hand ein, und der Hooper-Index steht im Kalender
        neben jedem Tag. Wenn du die optionalen Fragen nach der Aktivität
        aktivierst, werden die Anstrengung und eventuell erwähnte Schmerzen
        erfasst, und diese Schmerzen sieht auch dein Coach. Die Formschwellen in
        der App sind Konventionen zur Beschreibung der Kurve, keine Diagnose.
        Mehr dazu auf der Seite zur{' '}
        <Link href="/de/features/training-load">Trainingsbelastung</Link>, und
        für die Planung lies{' '}
        <Link href="/de/blog/injury-prevention-2-when-algorithms-predict-the-break">
          wie du den Umfang mit leichteren Wochen aufbaust
        </Link>
        .
      </p>

      <h2>Quellen</h2>
      <Sources />
    </div>
  );
}
