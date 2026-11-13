import Link from 'next/link';

export function ContentDe() {
  return (
    <div>
      <p>
        Eine moderne Laufuhr zeichnet viel auf: GPS-Strecke, Pace, Herzfrequenz,
        Kadenz, manchmal Leistung, dazu nachts Schlaf und
        Herzfrequenzvariabilität. Dann liefert sie dir Schlussfolgerungen: einen
        geschätzten VO2max, eine Erholungszeit, einen Bereitschaftswert, einen
        Trainingszustand, der „produktiv“ oder „unproduktiv“ lautet. Die
        Messwerte sind meist gut. Bei den Schlussfolgerungen musst du vorsichtig
        sein, denn der Uhr fehlt das meiste von dem, was ein Coach wissen
        möchte.
      </p>

      <h2>Was die Uhr misst und was sie schätzt</h2>
      <p>
        Zeit, Distanz und Pace per GPS sind fürs Training zuverlässig genug,
        abgesehen von Hochhäusern, dichtem Wald und engen Kurven auf der Bahn.
        Die Herzfrequenz wird gemessen, wie gut, hängt aber vom Sensor ab. In
        einer Studie mit EKG als Referenz waren optische Sensoren am Handgelenk
        ungenauer als ein Brustgurt, und die Genauigkeit schwankte je nach Gerät
        und Art der Belastung (Gillinov et al.,{' '}
        <a href="https://pubmed.ncbi.nlm.nih.gov/28709155/">
          Med Sci Sports Exerc, 2017
        </a>
        ). In der Praxis kommen optische Sensoren mit gleichmäßigen Läufen gut
        zurecht und tun sich schwer mit Intervallen, Kälte und locker sitzenden
        Armbändern.
      </p>
      <p>
        Alles andere ist eine Schätzung auf Basis dieser Eingangsdaten. Kalorien
        sind das deutlichste Beispiel: Eine Stanford-Studie mit sieben
        Handgelenksgeräten ergab, dass die meisten die Herzfrequenz auf dem Rad
        mit einem medianen Fehler unter 5&nbsp;% maßen, aber keines den
        Energieverbrauch mit einem Fehler unter 20&nbsp;% schätzte (Shcherbina
        et al.,{' '}
        <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC5491979/">
          J Pers Med, 2017
        </a>
        ). VO2max, Erholungszeit und Bereitschaftswerte stammen aus proprietären
        Algorithmen, die die Hersteller nur allgemein beschreiben und nicht so
        veröffentlichen, dass du sie überprüfen könntest. Als Trends können sie
        nützlich sein. Messwerte sind sie nicht.
      </p>

      <h2>Was die Uhr nicht weiß</h2>
      <p>
        Sie weiß nicht, was die Einheit eigentlich sein sollte. Ein 10-km-Lauf
        in 4:45/km ist für den einen Läufer ein gutes Tempotraining und für
        einen anderen, der einen lockeren Lauf geplant hatte, ein Fehler. Ohne
        Plan gibt es nichts, womit man vergleichen könnte.
      </p>
      <p>
        Sie weiß nicht, wie sich die Einheit angefühlt hat. Das
        Anstrengungsempfinden verändert sich bei zunehmender Ermüdung oft als
        Erstes, noch vor Herzfrequenz oder Pace. Ein systematisches Review
        ergab, dass selbstberichtete Messgrößen der Athleten empfindlicher und
        zuverlässiger auf die Trainingsbelastung reagierten als objektive
        Marker, den Ruhepuls eingeschlossen (Saw et al.,{' '}
        <a href="https://pubmed.ncbi.nlm.nih.gov/26423706/">
          Br J Sports Med, 2016
        </a>
        ). Manche Uhren fragen inzwischen nach dem Lauf nach einer Bewertung;
        wenn deine das tut, nutze es.
      </p>
      <p>
        Sie kennt dein Leben nicht. Mentale Ermüdung erhöht die empfundene
        Anstrengung, ohne Herzfrequenz oder Laktat zu verändern, zumindest unter
        Laborbedingungen (
        <a href="https://pubmed.ncbi.nlm.nih.gov/28044281/">
          Van Cutsem et al., Sports Med, 2017
        </a>
        ). Stress im Job, ein Neugeborenes, ein Langstreckenflug: Die Uhr
        erfasst einen Teil davon vielleicht über Schlaf und HRV, aber sie kann
        nicht wissen, warum.
      </p>
      <p>
        Sie weiß nichts vom Zwicken in deiner Achillessehne, vom Wettkampf in
        acht Wochen oder davon, dass du nach drei Wochen Pause zurückkommst.
        Während des Taperings nennt sie dich ohne Weiteres „unproduktiv“.
      </p>

      <h2>Nutze sie für das, was sie gut kann</h2>
      <p>
        Vertrau den Messwerten, hinterfrage die Schlussfolgerungen. Für
        Einheiten, bei denen die Herzfrequenz wichtig ist, lohnt sich ein
        Brustgurt. Betrachte Bereitschaft und HRV als Trend über eine Woche oder
        länger, nicht als tägliches Urteil: Ein niedriger Wert nach einer guten
        Nacht und mit frischen Beinen ist wahrscheinlich ein Fehler des
        Algorithmus, nicht deiner.
      </p>
      <p>
        Ergänze den Kontext selbst. Nach jeder Einheit kosten eine Bewertung von
        0 bis 10 und eine Zeile Notizen („Waden fest“, „heiß, 28&nbsp;°C“,
        „schlecht geschlafen“) dreißig Sekunden und machen deine Daten auch
        einen Monat später noch lesbar. Vergleiche einmal pro Woche, was du
        gemacht hast, mit dem, was geplant war: Einheiten erledigt, ausgelassen,
        geändert, und warum.
      </p>
      <p>
        Und bewahre den Plan woanders auf als in deinem Kopf. Die
        Workout-Vorschläge der Uhr beruhen auf ihren eigenen Schätzungen und
        wissen über deinen Zielwettkampf nur, was du eingegeben hast. Ein Plan,
        den du oder ein Coach geschrieben hat, mit Schlüsseleinheiten, die um
        dein Leben herum platziert sind, gibt den Daten einen Maßstab.
      </p>

      <h2>Diese Woche</h2>
      <p>
        Such dir eine Schätzung deiner Uhr aus (Trainingszustand, Erholungszeit
        oder Bereitschaft) und notiere sie jeden Tag neben deiner eigenen
        Bewertung von 0–10, wie frisch du dich fühlst. Schau am Ende der Woche,
        wie oft beide übereinstimmten. Dann weißt du, wie viel Gewicht du dieser
        Zahl geben kannst.
      </p>

      <p>
        OpenAthlete ist eine kostenlose Plattform, die auf deiner Uhr aufsetzt:
        Sie importiert Aktivitäten von Garmin, COROS, Suunto, Polar und Strava
        (oder FIT-, GPX- und TCX-Dateien), stellt sie neben die geplante Einheit
        und zeigt RPE, TRIMP aus der Herzfrequenz sowie Schlaf und HRV deines
        Geräts im selben Kalender. Strukturierte Workouts lassen sich an Uhren
        von Garmin, Suunto und COROS senden. Mehr zur{' '}
        <Link href="/de/features/watch-sync">Synchronisierung mit der Uhr</Link>{' '}
        und zur{' '}
        <Link href="/de/features/training-load">Trainingsbelastung</Link>.
      </p>
    </div>
  );
}
