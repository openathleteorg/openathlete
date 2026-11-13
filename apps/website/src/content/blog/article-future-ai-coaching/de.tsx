import Link from 'next/link';

import { Sources } from './sources';

export function ContentDe() {
  return (
    <div>
      <p>
        Vor ein paar Jahren bedeutete „KI-Coaching“ meist einen Chatbot, der
        einen generischen Zwölf-Wochen-Plan schrieb und dich vergaß, sobald du
        den Tab geschlossen hattest. Seitdem hat sich nicht geändert, dass
        Sprachmodelle Training plötzlich besser verstehen. Geändert hat sich,
        dass sie jetzt handeln können: deinen Kalender öffnen, die Aktivitäten
        des letzten Monats lesen und Einheiten in den Plan schreiben, den deine
        Uhr morgen früh herunterlädt. Genau das ist mit Agenten gemeint, und es
        lohnt sich, in Ruhe durchzudenken, was das für Coaches ändert und was
        nicht.
      </p>

      <h2>Was MCP ist, in Kürze</h2>
      <p>
        Das Model Context Protocol ist ein offener Standard, den Anthropic im
        November 2024 vorgestellt hat. Er erlaubt einem KI-Client wie Claude
        oder ChatGPT, Tools aufzurufen, die eine andere Anwendung bereitstellt.
        Eine Trainingsplattform kann Tools anbieten wie „Kalender für diese
        Wochen lesen“, „Trainingsbelastung abrufen“, „diese Einheiten planen“
        oder „diese Einheit auf Donnerstag verschieben“. Das Modell entscheidet,
        welche Tools es in welcher Reihenfolge aufruft. Die Anwendung
        entscheidet, worauf das Modell zugreifen darf, und prüft jede Anfrage
        so, wie sie einen Klick des Nutzers prüfen würde.
      </p>
      <p>
        Diese Trennung ist wichtig. Das Modell bringt die Sprache und das Denken
        mit, die Plattform behält die Daten, die Berechtigungen und die Regeln.
        Ein Modell, das dich missversteht, kann etwas Unsinniges vorschlagen,
        aber es kommt an nichts heran, was die Plattform nicht freigibt.
      </p>

      <h2>Ein realistischer Montag</h2>
      <p>
        Nimm einen Coach mit fünfzehn Athleten. Am Montagmorgen schreibt eine
        von ihnen, neun Wochen vor einem Marathon, dass sie seit Samstag Grippe
        hat und frühestens am Donnerstag wieder einsteigen kann. Die übliche
        Arbeit: ihren Kalender öffnen, fünf oder sechs Einheiten löschen oder
        verschieben, den Rest der Woche umschreiben, den langen Lauf kürzen und
        prüfen, ob die Woche danach noch Sinn ergibt. Zehn oder fünfzehn
        Minuten, und es ist die dritte Nachricht dieser Art an diesem Tag.
      </p>
      <p>
        Mit einem Agenten, der mit der Plattform verbunden ist, kann der Coach
        schreiben: „Anna ist seit Samstag krank, vermutlich bis Donnerstag. Trag
        das ein, halte bis Sonntag alles locker, verschieb die 3 × 15 Minuten im
        Marathontempo vom Samstag auf nächsten Dienstag und mach aus dem langen
        Lauf am Sonntag 1:15 h locker.“ Der Agent erfasst die Krankheit, liest
        den Kalender, nimmt die Änderungen vor und meldet sich zurück. Der Coach
        schaut sich die Woche im Kalender an, korrigiert eine Sache und macht
        weiter.
      </p>
      <p>
        Achte darauf, wer die Entscheidungen getroffen hat. Jede Wahl in dieser
        Anweisung (wie lange es locker bleibt, welche Einheit wichtig genug ist,
        um sie zu verschieben, wie lang der lange Lauf sein soll) kam vom Coach.
        Der Agent hat geklickt. Das ist die ehrliche Version dessen, was Agenten
        dem Coaching heute bieten: Die administrative Hälfte der Arbeit wird
        viel günstiger, die Hälfte, bei der es um Urteilsvermögen geht, bleibt,
        wo sie war.
      </p>

      <h2>Worin Agenten noch schlecht sind</h2>
      <p>
        <strong>Zu wissen, was sie nicht wissen.</strong> Ein Agent plant einen
        Block auch dann, wenn die Datenlage dünn ist: keine Herzfrequenz bei der
        Hälfte der Läufe, keine Anstrengungsbewertungen, eine Woche Reise, die
        niemand erwähnt hat. Impellizzeri und Kollegen betonen seit Jahren, dass
        die interne Belastung, also wie hart das Training für genau diesen
        Athleten war, die Anpassung antreibt, und genau dieser Teil fehlt am
        häufigsten in den Daten. Ein Coach bemerkt die Lücke. Ein Modell neigt
        dazu, sie mit Annahmen zu füllen.
      </p>
      <p>
        <strong>Langfristiges Urteilsvermögen.</strong> Ob eine dritte
        Qualitätseinheit dazukommt, wann das Tapering beginnt, ob dieser Athlet
        jetzt eine Entlastungswoche braucht oder noch eine Woche wegsteckt: Das
        hängt von Jahren an Historie ab, von Job und Familie, davon, wie jemand
        auf Ermüdung reagiert. Als Düking und Kollegen (2024) Coaching-Experten
        Laufpläne von ChatGPT bewerten ließen, wurden die Pläne mit mehr
        Eingabeinformationen deutlich besser, aber trotzdem nicht als optimal
        eingestuft. Die Autoren empfehlen die Prüfung durch einen erfahrenen
        Coach.
      </p>
      <p>
        <strong>Selbstsichere Fehler.</strong> Eine falsch gelesene Zone macht
        aus einem Regenerationslauf eine Schwelleneinheit. Ein um einen Tag
        verrutschtes Datum legt den langen Lauf auf den Tag vor einem Wettkampf.
        Sprachmodelle machen solche Fehler in flüssigem, vernünftig klingendem
        Text, und genau deshalb übersieht man sie leicht.
      </p>
      <p>
        <strong>Verantwortung.</strong> Wenn ein Plan zu einer Verletzung
        beiträgt, muss jemand für diese Entscheidung geradestehen und mit dem
        Athleten darüber sprechen. Ein Modell kann das nicht.
      </p>

      <h2>Den Coach in der Schleife halten, ganz praktisch</h2>
      <p>
        „Human in the Loop“ ist schnell gesagt. In einem Coaching-Tool läuft es
        auf ein paar konkrete Designentscheidungen hinaus:
      </p>
      <ul>
        <li>
          Der Agent schreibt in denselben Kalender, den Coach und Athlet sehen.
          Nichts passiert in einer versteckten Ebene, eine schlechte Änderung
          ist also sofort sichtbar.
        </li>
        <li>
          Er ist angewiesen, Einheiten zu verschieben und zu bearbeiten, statt
          sie zu löschen und neu anzulegen, damit eine Änderung eine Änderung
          bleibt.
        </li>
        <li>
          Absolvierte Einheiten und aufgezeichnete Aktivitäten sind Historie.
          Der Agent kann sie nicht umschreiben.
        </li>
        <li>
          KI läuft nur nach ausdrücklicher Zustimmung, die du widerrufen kannst.
        </li>
        <li>
          Die Daten gehen an den Modellanbieter, den du gewählt hast, mit deinem
          Schlüssel. Auf einer selbst gehosteten Instanz mit lokalem Modell
          verlassen sie deinen Server nicht.
        </li>
      </ul>

      <h2>Eine vorsichtige Prognose für die nächsten Jahre</h2>
      <p>
        Der Verwaltungsaufwand im Coaching wird weiter sinken. Ein Coach, der
        sonntagabends die Wochen von zwanzig Athleten umschreibt, wird dafür
        viel weniger Zeit brauchen. Das kann in zwei Richtungen gehen: mehr
        Athleten pro Coach oder mehr Aufmerksamkeit pro Athlet. Die zweite ist
        die bessere Nutzung, und Athleten werden merken, welche ihr Coach
        gewählt hat.
      </p>
      <p>
        Selbst trainierende Athleten mit einem Agenten fahren gut, wenn sie
        schon wissen, wie gutes Training aussieht, und den Agenten zur Umsetzung
        nutzen. Riskanter ist es für Einsteiger, die einen schlechten Plan am
        wenigsten erkennen und am ehesten befolgen. Eine verlässliche
        Verletzungsvorhersage erwarten wir so bald nicht, die Forschung zu
        Screening und maschinellem Lernen gibt dafür wenig Anlass. Und der Teil
        des Coachings, der darin besteht zu merken, dass das „passt schon“ eines
        Athleten eben nicht passt, verschwindet nicht.
      </p>

      <h2>Ausprobieren</h2>
      <p>
        OpenAthlete hat einen{' '}
        <Link href="/de/features/mcp-server">MCP-Server</Link>, der mit Claude,
        ChatGPT und anderen Clients funktioniert. Er kann den Kontext, den
        Kalender, die Aktivitäten und die Trainingsbelastung eines Athleten
        lesen, Krankheit oder Reisen erfassen und bis zu 60 Einheiten auf einmal
        planen. Die Einheiten erscheinen dann im Kalender und landen auf Uhren
        von Garmin, Suunto und COROS. Er ist kostenlos, und Coaches können ihn
        für alle Athleten nutzen, die sie betreuen.
      </p>

      <h2>Quellen</h2>
      <Sources />
    </div>
  );
}
