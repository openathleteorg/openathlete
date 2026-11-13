import Link from 'next/link';

import { Sources } from './sources';

export function ContentDe() {
  return (
    <div>
      <p>
        „KI“ steht in Trainingssoftware für zwei sehr unterschiedliche Dinge,
        und das Marketing wirft sie gern in einen Topf. Das eine sind
        statistische Modelle, die mit Zahlen arbeiten: Herzfrequenz, Pace,
        Leistung, Herzfrequenzvariabilität, Schlaf. Sie schätzen etwas ab oder
        versuchen, etwas vorherzusagen. Das andere sind Sprachmodelle aus der
        Familie von ChatGPT, Claude und Mistral, die Text lesen und schreiben.
        Die Studienlage ist für beide ganz verschieden, deshalb lohnt es sich,
        sie getrennt zu betrachten.
      </p>

      <h2>Vieles, was als KI verkauft wird, ist Arithmetik</h2>
      <p>
        Die Kurven für Fitness, Ermüdung und Form (CTL, ATL, TSB) sind
        exponentiell gewichtete Mittelwerte der täglichen Belastung und gehen
        auf Banisters Impulse-Response-Modell aus den 1970er-Jahren zurück.
        TRIMP macht aus Dauer und Herzfrequenz einen Belastungswert. Session-RPE
        ist noch einfacher: Bei der Methode nach Foster wird das
        Anstrengungsempfinden des Athleten auf einer Skala von 0–10 mit der
        Dauer in Minuten multipliziert, ein 60-minütiger Lauf mit RPE 6 ergibt
        also 360 Einheiten. Nichts davon ist maschinelles Lernen, und das ist
        gut so. Du kannst die Formel nachprüfen, du weißt, was sie ausblendet,
        und wenn eine Zahl seltsam aussieht, kannst du nachvollziehen, warum.
      </p>
      <p>
        Das 2017 von Bourdon und Kollegen veröffentlichte Konsenspapier zum
        Belastungsmonitoring empfiehlt genau diese Art von Werkzeugen: Erfasse,
        was gemacht wurde (äußere Belastung, etwa Distanz und Pace), und wie
        anstrengend es für den Athleten war (innere Belastung, etwa Herzfrequenz
        und RPE), und betrachte beides gemeinsam im Zeitverlauf. Das ist nach
        wie vor das Rückgrat guter Trainingspraxis, und es braucht kein
        neuronales Netz.
      </p>

      <h2>Vorhersagen sind schwächer, als die Werbung verspricht</h2>
      <p>
        Bei der Verletzungsprognose klaffen Versprechen und Datenlage am
        weitesten auseinander. Roald Bahrs Übersichtsarbeit von 2016 im British
        Journal of Sports Medicine erklärt, warum Screening-Tests Verletzungen
        für den Einzelnen nicht vorhersagen können: Selbst ein starker
        Risikofaktor auf Gruppenebene lässt eine riesige Überschneidung zwischen
        den Athleten, die sich verletzen, und denen, die gesund bleiben.
        Maschinelles Lernen hat daran bisher wenig geändert. Ein systematisches
        Review von Van Eetvelde und Kollegen aus dem Jahr 2021 fand elf Studien
        zu maschinellem Lernen für die Vorhersage von Sportverletzungen. Die
        Güte reichte von kaum besser als ein Münzwurf (AUC von 0,52) bis gut
        (0,87), und die Autoren forderten mehr Arbeit an der Interpretierbarkeit
        der Modelle.
      </p>
      <p>
        Die Acute:Chronic Workload Ratio ist ein lehrreiches Beispiel. Einige
        Jahre lang verbreitete sich in Apps und Trainerlehrgängen die Idee, ein
        Verhältnis zwischen 0,8 und 1,3 sei ein sicherer „Sweet Spot“.
        Impellizzeri und Kollegen zeigten 2020, dass diese Kennzahl grundlegende
        statistische Probleme hat und die Belege für den Sweet Spot nicht
        halten. Große Belastungssprünge von Woche zu Woche sind trotzdem keine
        gute Idee. Eine präzise Risikozahl auf Basis dieses Verhältnisses
        dagegen hat kaum Aussagekraft.
      </p>
      <p>
        Wenn dir eine App also „Verletzungsrisiko: 23&nbsp;%“ anzeigt, frag
        nach: Wie wurde diese Zahl validiert, an wem, und wie oft lag sie
        daneben? Gibt es keine Antwort, betrachte sie als Dekoration.
      </p>

      <h2>
        Wo Zahlenmodelle wirklich helfen: HRV mit persönlichem Ausgangswert
      </h2>
      <p>
        Die Herzfrequenzvariabilität ist das nützlichste tägliche Signal, das
        die meisten Athleten zu Hause messen können. In einer kleinen
        vierwöchigen Studie ließen Kiviniemi und Kollegen (2007) die
        morgendliche HRV über die Einheit des Tages entscheiden: hart, wenn die
        HRV stabil blieb oder stieg, locker oder Ruhetag, wenn sie unter den
        persönlichen Bereich der letzten Tage fiel. Diese Gruppe steigerte ihre
        maximale Laufgeschwindigkeit stärker als eine Gruppe mit festem Plan.
        Plews und Kollegen (2013) ergänzten einen wichtigen praktischen Punkt:
        Ein einzelner Morgenwert ist verrauscht, gleitende Mittelwerte über etwa
        eine Woche, verglichen mit dem eigenen Ausgangswert, sind deutlich
        aussagekräftiger.
      </p>
      <p>
        Achte darauf, was das eigentlich ist: ein persönlicher Ausgangswert und
        eine einfache Regel. Es funktioniert, weil es individuell ist, nicht
        weil das Modell besonders schlau wäre. Und es erfordert disziplinierte
        Messung, jeden Morgen unter denselben Bedingungen, und genau daran
        scheitern die meisten.
      </p>

      <h2>Subjektive Daten schlagen noch immer die meisten Sensoren</h2>
      <p>
        Das systematische Review von Saw, Main und Gastin (2016) verglich
        subjektive Messgrößen (Stimmung, empfundener Stress, Ermüdung) mit
        objektiven (Blutwerte, Ruhepuls, Herzfrequenzreaktion auf Belastung).
        Die subjektiven Messgrößen bildeten Veränderungen der Trainingsbelastung
        empfindlicher und zuverlässiger ab. Einfach gesagt: Den Athleten zu
        fragen, wie er sich fühlt, und das jedes Mal festzuhalten, ist eines der
        besten Monitoring-Werkzeuge überhaupt.
      </p>
      <p>
        Genau hier erweisen sich Sprachmodelle als wirklich nützlich, auf eine
        unspektakuläre Art. Ein Athlet tippt oder sagt gern „Beine ab km 8
        schwer, linke Achillessehne danach auf der Treppe etwas empfindlich“,
        füllt aber selten fünf Schieberegler aus. Ein Sprachmodell kann aus
        diesem Satz einen Anstrengungswert und einen Schmerzeintrag machen
        (linke Achillessehne, leicht, nach dem Lauf), den ein Coach filtern und
        grafisch auswerten kann. Das ist strukturierte Dateneingabe, erledigt
        von etwas, das lockere Formulierungen versteht.
      </p>

      <h2>Sprachmodelle schreiben Trainingspläne</h2>
      <p>
        Düking und Kollegen (2024) ließen ChatGPT sechswöchige Laufpläne mit
        drei unterschiedlich detaillierten Prompts erstellen und von
        Trainingsexperten anhand von 22 Qualitätskriterien bewerten. Mit
        minimalen Angaben lag der Plan bei 19 der 22 Kriterien unter dem
        Skalenmittelpunkt. Mit detaillierten Angaben (Trainingshistorie, Ziele,
        Rahmenbedingungen) war es nur noch eines. Die Autoren raten trotzdem
        davon ab, solche Pläne ohne Rückmeldung eines erfahrenen Coaches zu
        nutzen. Eine Studie von Washif und Kollegen (2024) zu
        Krafttrainingsprogrammen kam zu einem ähnlichen Schluss: plausible
        Entwürfe, die jemand mit Fachwissen nachschärfen muss.
      </p>
      <p>
        Sprachmodelle behaupten außerdem flüssig Falsches, ein Fehler, der als
        Halluzination bekannt ist (Ji und Kollegen geben 2023 einen Überblick
        über das Problem). Im Training sieht das so aus: ein Wochenumfang, der
        nicht aufgeht, eine „Studie“, die es nicht gibt, oder ein
        Regenerationslauf, der stillschweigend im Schwellentempo landet. Diese
        Fehler übersieht man leicht, gerade weil sich der Rest des Textes gut
        liest.
      </p>

      <h2>Was das in der Praxis bedeutet</h2>
      <p>
        Nutze Sprachmodelle für Textarbeit: eine strukturierte Einheit aus einer
        Beschreibung erstellen, einen Monat voller Notizen zusammenfassen,
        Feedback nach einer Einheit erfassen, ein Konzept erklären.
        Entscheidungen über Umfang und Intensität triffst du besser anhand von
        Zahlen, die du nachprüfen kannst, idealerweise mit einem Coach oder
        deiner eigenen Erfahrung als letztem Filter. Sei skeptisch bei jedem
        Risikowert, dessen Validierung du nicht einsehen kannst. Und wenn du dir
        eine Gewohnheit zulegen willst, die die Forschung klar stützt: Halte
        fest, wie sich jede Einheit angefühlt hat.
      </p>

      <h2>Wie OpenAthlete KI einsetzt</h2>
      <p>
        Die Trainingsbelastung in OpenAthlete ist TRIMP aus der Herzfrequenz,
        ergänzt um Session-RPE: Formeln, keine Blackbox. KI ist optional und
        übernimmt die oben beschriebene Textarbeit: eine strukturierte Einheit
        aus einem Satz, drei oder vier Fragen nach einer Aktivität, aus denen
        ein Anstrengungswert und ein Schmerzprotokoll für den Coach werden, und
        eine kurze Einordnung jeder Aktivität. Eine Verletzungsprognose gibt es
        nicht. Auf der <Link href="/de/features/ai-coach">KI-Seite</Link> steht,
        was sie kann und welche Anbieter du nutzen kannst.
      </p>

      <h2>Quellen</h2>
      <Sources />
    </div>
  );
}
