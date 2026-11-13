import Link from 'next/link';

import { articlePrices } from './prices';
import { SOURCES } from './sources';

export function ContentDe() {
  const p = articlePrices('de');
  return (
    <div>
      <p>
        Am 22.07.2026 gab Garmin bekannt, TrainingPeaks und TrainHeroic, die
        Krafttrainings-App derselben Muttergesellschaft Peaksware, übernommen zu
        haben. Die Konditionen wurden nicht veröffentlicht. Seitdem taucht in
        Coaching-Foren und in unserem Postfach immer wieder dieselbe Frage auf:
        Sollte ich wechseln, und wenn ja, wohin?
      </p>
      <p>
        Die kurze Antwort: Nichts zwingt dich, heute zu wechseln. Die längere
        Antwort folgt, mit den Alternativen, die einen Blick wert sind, und mit
        einer Anleitung, wie du deine Trainingshistorie mitnimmst. Eine dieser
        Alternativen, OpenAthlete, entwickeln wir selbst, lies diesen Teil also
        mit der gebotenen Skepsis. Die anderen haben wir so zu beschreiben
        versucht, wie ihre eigenen Nutzer es tun würden.
      </p>

      <h2>Was sich tatsächlich geändert hat</h2>
      <p>
        Der Eigentümer. Mehr bisher nicht. Laut der{' '}
        <a href={SOURCES.garminPress}>Pressemitteilung von Garmin</a> wechseln
        rund 120 Mitarbeitende von TrainingPeaks und TrainHeroic zu Garmin, und
        die Plattformen bleiben in Louisville, Colorado. Zu Konten, Preisen oder
        Geräteunterstützung sagt sie nichts. Für Premium oder Coach Edition ist
        keine Preisänderung angekündigt, und Coach-Konten funktionieren wie im
        Juni. Einige Medien, darunter{' '}
        <a href={SOURCES.cyclelytic}>CycleLytic</a>, berichteten, Garmin habe
        erklärt, die Kompatibilität mit anderen Uhrenmarken werde sich nicht
        ändern. Eine schriftliche Zusage von Garmin dazu haben wir nicht
        gefunden, aber auch nichts, was in die andere Richtung deutet. Deine
        Athleten mit COROS, Suunto, Polar und Wahoo synchronisieren weiterhin.
      </p>
      <p>
        Warum fragen Coaches dann? Vor allem, weil jetzt jemand anderes die
        Roadmap bestimmt. TrainingPeaks war wertvoll als neutrale Schicht
        zwischen allen Uhrenmarken und allen Coaches. Nun entscheidet ein
        Uhrenhersteller, woran seine Entwickler arbeiten. Gut möglich, dass
        Garmin die Plattform neutral hält, schließlich hat es genau für diese
        Neutralität bezahlt. Trotzdem: Als Garmin 2020 Firstbeat kaufte, hieß
        es, die Lizenzierung an Dritte werde fortgesetzt, und{' '}
        <a href={SOURCES.the5krunner}>the5krunner</a> stellt unter Berufung auf
        DC Rainmaker fest, dass neue Deals mit Drittanbietern seitdem
        ausgeblieben sind. Über TrainingPeaks beweist das nichts. Es erklärt
        aber, warum Coaches mit gemischten Athletengruppen genau hinschauen.
      </p>
      <p>
        Dann gibt es noch einen Präzedenzfall. Today&apos;s Plan gehörte
        Specialized, hatte eine treue Basis von Radsport-Coaches und wurde{' '}
        <a href={SOURCES.todaysPlan}>im März 2024 eingestellt</a>. Coaches mit
        jahrelanger Athletenhistorie dort hatten ein paar Monate Zeit, ihre
        Daten herauszuholen. Niemand erwartet dasselbe von TrainingPeaks, das
        viel größer ist, aber wer das erlebt hat, hält sich heute einen
        Ausstiegsplan bereit. Und Geld war schon vor Juli ein Thema: Premium
        stieg im April 2025 von 124,99&nbsp;$ auf 134,99&nbsp;$ pro Jahr.
      </p>

      <h2>Solltest du wechseln?</h2>
      <p>
        Für viele lautet die ehrliche Antwort: nein, oder noch nicht. Geh die
        folgenden Punkte durch, bevor du ein Wochenende mit der Migration
        verbringst.
      </p>

      <h3>Die Uhren deiner Athleten</h3>
      <p>
        Wenn alle Athleten, die du betreust, eine Garmin tragen, ist die
        Übernahme für dich neutral, vielleicht sogar gut. Läuft ein Drittel
        deiner Athleten mit COROS, Suunto oder Polar, solltest du die
        Entwicklung im Auge behalten. Mach dir heute eine Liste: welche Marke
        jeder Athlet nutzt und ob geplante Workouts auf dieser Uhr ankommen. Die
        Übertragung von Workouts ist das Erste, was du verlieren würdest, falls
        eine Integration je schlechter wird.
      </p>

      <h3>Was du zahlst</h3>
      <p>
        Listenpreise am {p.checkedOn}: TrainingPeaks Premium kostet 19,95&nbsp;$
        im Monat oder {p.tpPremiumYear} im Jahr. Coach Edition beginnt bei
        21,99&nbsp;$ im Monat mit einem inklusive Premium-Athleten, danach
        kostet jeder weitere Premium-Athlet je nach Gruppengröße 9&nbsp;$ bis
        4,50&nbsp;$ im Monat, plus eine Einrichtungsgebühr von 99&nbsp;$, die
        mit einem Promo-Code entfällt (
        <a href={SOURCES.tpCoachPricing}>Coach-Preise von TrainingPeaks</a>).
        Geplante Workouts werden nur für Premium-Athleten auf Geräte
        synchronisiert, ein Coach, der für 10 Athleten Premium bezahlt, gibt
        also vor Steuern etwa {p.tpCoach10} im Jahr aus. Wenn du dieses Geld
        lieber behalten würdest, ist das ein Grund, dich umzusehen, egal wem das
        Unternehmen gehört.
      </p>

      <h3>Wovon du abhängst</h3>
      <p>
        Für manches gibt es anderswo keinen echten Ersatz. Wenn du Pläne über
        den TrainingPeaks-Marktplatz verkaufst, folgt dir dieses Publikum nicht.
        Wenn deine Athleten im Winter TrainingPeaks Virtual fahren oder die
        nativen Apps lieben, rechne das mit ein. Und wenn deine Athleten
        zufrieden sind und nur du dir Sorgen machst, kann es mehr Wohlwollen
        kosten, als es bringt, 25 Leute wegen eines hypothetischen Risikos
        umziehen zu lassen. Coaches, die es versucht haben, berichten, dass
        Kunden oft einfach Nein sagen.
      </p>

      <h3>Deine Daten</h3>
      <p>
        Wie auch immer du dich entscheidest: Exportiere deine Historie jetzt.
        Das kostet einen Abend und beseitigt den Großteil des Risikos. Wie das
        geht, steht am Ende dieses Artikels.
      </p>

      <h2>Die unabhängigen Alternativen</h2>
      <p>
        Keine davon gehört einem Uhrenhersteller. Die Preise sind die
        Listenpreise der Anbieter am {p.checkedOn}; prüfe die verlinkte Seite,
        bevor du zahlst.
      </p>

      <h3>intervals.icu</h3>
      <p>
        Kostenlos, mit einer Supporter-Stufe für 4&nbsp;$ im Monat (
        <a href={SOURCES.intervals}>intervals.icu</a>). Für Athleten, die sich
        selbst trainieren und Daten mögen, ist es die naheliegende erste
        Anlaufstelle: Fitness, Ermüdung und Form, Leistungs- und Pace-Kurven,
        ein Workout-Editor, ein Kalender und eine der längsten
        Integrationslisten überhaupt (Garmin, COROS, Suunto, Polar, Wahoo, Zwift
        und viele mehr). Coaches können Athleten folgen und für sie planen;
        Teams und Coaching-Organisationen brauchen Supporter. Eine offizielle
        mobile App gibt es nicht (Apps von Drittanbietern füllen die Lücke), und
        viele finden die Oberfläche anfangs überladen. Wenn du im Performance
        Management Chart lebst, fang hier an.
      </p>

      <h3>Nolio</h3>
      <p>
        Aus Grenoble, Partner des französischen Leichtathletikverbands und in
        französischen Vereinen der Standard. Für Athleten kostenlos (Premium
        6,90&nbsp;€ im Monat); Coach-Pläne beginnen bei 19,90&nbsp;€ im Monat
        für 3 Athleten und 29,90&nbsp;€ für bis zu 25, mit günstigeren Plänen
        für eingetragene Vereine (<a href={SOURCES.nolio}>Nolio-Preise</a>).
        Native Apps für iOS und Android, eine Bibliothek mit Videos zu
        Kraftübungen, Kommentare zu jeder Einheit. Für einen Coach oder Verein
        in Frankreich ist es der direkteste Ersatz. Anderswo weniger bekannt,
        und der Preis steigt mit der Zahl der Athleten stufenweise:{' '}
        {p.nolioCoach10} im Jahr für einen Coach mit 10 Athleten.
      </p>

      <h3>Final Surge</h3>
      <p>
        Aus den USA, beliebt bei Lauf-Coaches, Schulen und Colleges. Athleten
        bekommen alle Athletenfunktionen kostenlos; Coaches zahlen pauschal
        19&nbsp;$ im Monat für 1 bis 5 Athleten oder 39&nbsp;$ im Monat für bis
        zu 100 (<a href={SOURCES.finalSurge}>Final-Surge-Preise</a>). Native
        Apps und strukturierte Workouts, die an Garmin und COROS gesendet
        werden. Der Pauschalpreis ist das Argument: 40 Athleten kosten dasselbe
        wie 10. In Europa kaum präsent, und KI-Funktionen haben wir keine
        gefunden, was manche Coaches als Pluspunkt sehen werden.
      </p>

      <h3>Tredict</h3>
      <p>
        Aus Deutschland, vom Gründer selbst betrieben, datenschutzbewusst und am
        deutlichsten in seiner Kritik am Garmin-Deal (
        <a href={SOURCES.tredictBlog}>die Analyse von Tredict</a>). Es sendet
        Workouts an Garmin, COROS, Suunto, Wahoo, Hammerhead und Zwift und
        bietet Coaching-Funktionen und eine API. Das Preismodell ist
        ungewöhnlich: einmalig 49&nbsp;$ für zwölf Monate Vollzugriff, danach
        kostenloser Lesezugriff, und eine zweimonatige Testphase (
        <a href={SOURCES.tredictPrice}>Tredict-Preis</a>). Ein kleines Team und
        eine kleine Community, aber im Geist nah an dem, was TrainingPeaks
        früher für viele war.
      </p>

      <h3>Runalyze</h3>
      <p>
        Entwickelt in Kaiserslautern und Kiel und beliebt bei Läufern, die
        Analyse wollen: effektiver VO2max, Wettkampfprognosen, Marathon-Shape,
        Trainingsbelastung. Es synchronisiert von Garmin, COROS, Suunto, Polar,
        Wahoo, Strava und anderen. Kostenlos, Premium kostet 60&nbsp;€ im Jahr (
        <a href={SOURCES.runalyze}>Runalyze-Preise</a>). Es ist eher ein
        Trainingstagebuch und Analysewerkzeug als eine Plattform für Planung
        oder Coaching und passt daher zum selbst trainierenden Läufer, der
        TrainingPeaks vor allem für den Rückblick genutzt hat, nicht zum Coach,
        der für andere plant.
      </p>

      <h3>Golden Cheetah</h3>
      <p>
        Kostenlose Open-Source-Desktopsoftware für Windows, macOS und Linux, mit
        Schwerpunkt Radsport und tiefgehender Leistungsanalyse (
        <a href={SOURCES.goldenCheetah}>goldencheetah.org</a>). Keine Cloud,
        keine Zusammenarbeit mit Coaches, keine Workouts auf die Uhr. Hier steht
        es, weil niemand es je abschalten kann.
      </p>

      <h3>OpenAthlete</h3>
      <p>
        Unser eigenes Projekt, urteile also entsprechend. Es ist Open Source
        (AGPL), kostenlos selbst zu hosten oder von uns in Frankreich gehostet.
        In der gehosteten Version ist jede Funktion kostenlos, Coaching von bis
        zu 5 Athleten eingeschlossen; Supporter für 5&nbsp;€ im Monat oder
        50&nbsp;€ im Jahr bringt unbegrenzt viele betreute Athleten und KI über
        unsere Schlüssel (<Link href="/de/pricing">Preise</Link>). Geplante
        Einheiten gehen an Uhren von Garmin, Suunto und COROS; Aktivitäten
        kommen von diesen dreien sowie von Polar und Strava. Die
        Trainingsbelastung ist TRIMP aus der Herzfrequenz mit Session-RPE
        daneben, und Fitness, Ermüdung und Form werden über die geplanten
        Einheiten vorausberechnet. KI ist optional und läuft über deinen eigenen
        Schlüssel oder das Supporter-Kontingent.
      </p>
      <p>
        Die Grenzen sind real. Native Apps in den Stores gibt es noch nicht: Die
        Apps für iOS und Android sind in der Testphase, bis dahin nutzen
        Athleten die installierbare Web-App. Es gibt keinen Marktplatz für den
        Verkauf von Plänen, kein Vereinskonto (ein Athlet kann mehrere Coaches
        haben, aber es gibt keine Organisation mit gemeinsamer Abrechnung),
        keine App fürs Indoor-Training und keine Workouts für Polar-Uhren. Die
        Analyse ist weniger tief als bei intervals.icu, und das Projekt ist jung
        und wird von einem einzelnen Entwickler gebaut. Unsere Antwort auf „Was,
        wenn es euch nicht mehr gibt?“ ist die Lizenz: Der Code und deine Daten
        bleiben ohne uns nutzbar. Der Vergleich Punkt für Punkt steht unter{' '}
        <Link href="/de/compare/trainingpeaks">
          OpenAthlete vs. TrainingPeaks
        </Link>
        , wie Coaching funktioniert, auf der{' '}
        <Link href="/de/coaches">Seite für Coaches</Link>, und die anderen
        Vergleiche findest du <Link href="/de/compare">hier</Link>.
      </p>

      <h2>So wechselst du, ohne deine Historie zu verlieren</h2>

      <h3>Zuerst aus TrainingPeaks exportieren</h3>
      <p>
        Das Hilfecenter von TrainingPeaks beschreibt in der Web-App eine
        Funktion „Export Data“: Du wählst einen Zeitraum von bis zu 12 Monaten
        und erhältst einen Ordner mit allen Trainingsdateien daraus, und
        dasselbe Werkzeug kann eine CSV-Zusammenfassung deiner Workouts
        erstellen. Einzelne Dateien lassen sich außerdem aus jedem Workout
        herunterladen, im Format, in dem sie hochgeladen wurden (
        <a href={SOURCES.tpExportHelp}>Data Export</a>). Laut einem{' '}
        <a href={SOURCES.tpExportBlog}>Blogartikel von TrainingPeaks</a> ist der
        Massenexport für Abonnenten der Athlete Edition gedacht, und einige
        Forennutzer sagen, er setze Premium voraus. Prüf also, was dein Konto
        anzeigt. Sechs Jahre Historie bedeuten sechs Exporte. Erledige das vor
        der Kündigung, nicht danach. Einen dokumentierten Weg, deine
        Workout-Bibliothek oder deinen künftigen Plan als Ganzes zu exportieren,
        haben wir nicht gefunden. Rechne also damit, die Vorlagen, die du
        wiederverwendest, neu anzulegen.
      </p>

      <h3>Verbinde deine Uhrenkonten neu</h3>
      <p>
        Die meisten Plattformen holen frühere Aktivitäten von der Uhrenmarke,
        sobald du sie verbindest, und das ist einfacher als Dateien. Wie weit
        zurück das reicht, hängt mehr von der API der Marke ab als von der
        Plattform. Bei OpenAthlete liefern Strava und COROS die gesamte Historie
        (COROS sendet 50 Dateien pro Tag, eine lange Historie braucht also
        mehrere Tage), Garmin und Suunto die letzten 30 Tage und Polar nichts
        von vor der Verbindung. Andere Plattformen stoßen aus denselben Gründen
        auf ähnliche Grenzen; frag nach, bevor du mit einem vollständigen Import
        rechnest.
      </p>

      <h3>Fülle die Lücken mit FIT-Dateien</h3>
      <p>
        Was die API nicht liefert, steckt in deinem Exportordner. Lade die
        FIT-Dateien auf die neue Plattform hoch; bei OpenAthlete kannst du
        mehrere auf einmal in den Kalender ziehen (20&nbsp;MB pro Datei).
        Multisport-FIT-Dateien von einem Triathlon werden noch nicht
        unterstützt.
      </p>

      <h3>Nutze beide für einen Block parallel</h3>
      <p>
        Wenn du coachst, behalte TrainingPeaks noch für einen Block, während
        deine Athleten sich mit der neuen Plattform verbinden, plane die
        nächsten vier Wochen dort und schau, was hakt. Nach einem Zielwettkampf
        oder zu Beginn der Off-Season ist der Wechsel viel einfacher als mitten
        in der Marathonvorbereitung.
      </p>
      <p>Und wenn du diesen Monat nur eine Sache erledigst, dann den Export.</p>
    </div>
  );
}
