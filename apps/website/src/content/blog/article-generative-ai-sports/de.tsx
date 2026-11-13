import Link from 'next/link';

import { Sources } from './sources';

export function ContentDe() {
  return (
    <div>
      <p>
        Für Ausdauersportler ist generative KI weder Spielerei noch Revolution.
        Sie ist ein Textwerkzeug. Sie ist sehr gut darin, lose Sprache in
        Struktur zu verwandeln und Struktur in lesbaren Text, und unzuverlässig,
        sobald sie über deinen Körper recht haben muss oder über Zahlen, die ihr
        niemand gegeben hat. Wer sie so betrachtet, sieht schnell, wo sie Zeit
        spart und wo sie schaden kann.
      </p>

      <h2>Stark: eine Einheit schreiben</h2>
      <p>
        Ein strukturiertes Workout in die App deiner Sportuhr einzutippen ist
        mühsam. Es zu beschreiben nicht. „20 Minuten locker, dann 6 × 3 Minuten
        hart mit 2 Minuten Trabpause, 10 Minuten Auslaufen“ ist genau die Art
        Satz, mit der ein Sprachmodell gut umgehen kann: Es zerlegt ihn in
        Schritte, erkennt die Wiederholungen und gibt jedem Schritt ein Ziel,
        wenn es deine Zonen kennt. „Hart“ über 3 Minuten wird zu deinem
        VO2max-Pacebereich, „Traben“ zur Erholungspace.
      </p>
      <p>
        Zwei Dinge solltest du prüfen, bevor die Einheit auf deine Uhr geht: die
        Gesamtdauer (Modelle lassen gelegentlich einen Block weg oder verdoppeln
        ihn) und die Intensität, die es für vage Begriffe gewählt hat. „Hart“
        kann für die eine Person Schwelle bedeuten und für die andere
        5-km-Renntempo. Hat das Modell falsch gewählt, sag es ihm, oder schreib
        beim nächsten Mal „an der Schwelle“.
      </p>

      <h2>Stark: Feedback in Daten verwandeln</h2>
      <p>
        Nach einem langen Lauf füllt kaum jemand ein Formular mit fünf
        Schiebereglern aus. Man sagt eher so etwas wie: „Die erste Stunde lief
        gut, dann hat mir die Hitze zugesetzt, die letzten 5 km waren ein Kampf
        und meine rechte Wade hat zugemacht.“ Ein Sprachmodell kann daraus eine
        Belastungsbewertung von etwa 8 und eine Notiz machen: rechte Wade,
        Verhärtung, gegen Ende des Laufs. Über Wochen werden diese Notizen zu
        etwas, das ein Coach tatsächlich filtern kann.
      </p>
      <p>
        Das ist wichtiger, als es klingt. Eine systematische Übersichtsarbeit
        von Saw und Kollegen (2016) zeigte, dass subjektive, selbst berichtete
        Werte die Trainingsbelastung besser abbilden als die meisten objektiven
        Marker. Der Engpass war immer, Athleten dazu zu bringen, sie zu
        erfassen. Wenn dafür ein Satz oder eine Sprachnachricht reicht, hilft
        das.
      </p>

      <h2>Stark: zusammenfassen und umschreiben</h2>
      <p>
        Füge die Notizen aus vier Wochen Training ein und bitte vor dem Gespräch
        mit deinem Coach um eine Zusammenfassung: Das Modell findet die
        wiederkehrenden Themen (die Achillessehne, die sich nach Bergläufen
        meldet, die Donnerstagseinheiten, die immer wieder ausfallen) schneller
        als du. Es kann eine Woche um eine Einschränkung herum umplanen, etwa
        eine Dienstreise von Dienstag bis Donnerstag mit nur einem
        Hotel-Laufband, und dir einen brauchbaren Entwurf liefern. Es kann einen
        Plan übersetzen, den dein Coach in einer anderen Sprache geschrieben
        hat. Jedes Mal bekommst du einen Entwurf zum Prüfen, keine Anweisung zum
        Befolgen.
      </p>

      <h2>Mit Vorsicht nutzbar: erklären</h2>
      <p>
        Frag, was Schwellentraining von VO2max-Intervallen unterscheidet oder
        warum sich das Tempo im langen Lauf locker anfühlen sollte, und du
        bekommst meist eine ordentliche Erklärung. Das Risiko: Es fügt ein
        selbstbewusst vorgetragenes Detail hinzu, das falsch ist, oder zitiert
        eine Studie, die es nicht gibt. Sprachmodelle erzeugen flüssigen Text,
        keine geprüften Fakten – Forscher nennen das Halluzination (Ji und
        Kollegen, 2023). Wenn eine Antwort eine Quelle nennt, schlag die Quelle
        nach, bevor du sie weitergibst.
      </p>

      <h2>Schwach: Diagnosen stellen</h2>
      <p>
        Tipp „Außenseite vom Knie tut nach 20 km weh“ ein, und du bekommst eine
        saubere Antwort zum Iliotibialband, mit Dehnübungen und einem Plan für
        den Wiedereinstieg ins Laufen. Vielleicht stimmt das. Vielleicht ist es
        aber auch etwas ganz anderes, und das Modell kann es nicht wissen: Es
        kann dich nicht untersuchen, dir nicht beim Laufen zusehen und nicht auf
        die schmerzende Stelle drücken. Eine plausible Antwort auf eine
        medizinische Frage ist schlimmer als gar keine, weil sie den Arztbesuch
        hinauszögert, der das Problem geklärt hätte. Schmerzen, die anhalten,
        dich hinken lassen, beim Laufen zunehmen oder auch in Ruhe da sind,
        gehören zu einem Physiotherapeuten oder einer Ärztin.
      </p>

      <h2>Schwach: komplette Pläne aus dem Nichts</h2>
      <p>
        Düking und Kollegen (2024) ließen ChatGPT sechswöchige Laufpläne
        erstellen und von Trainerexperten anhand von 22 Kriterien bewerten. Mit
        wenig Input lag der Plan bei 19 davon unter der Mitte der Skala. Mit
        detailliertem Input schnitt er deutlich besser ab, dennoch raten die
        Autoren davon ab, solchen Plänen ohne erfahrenen Coach zu folgen. Der
        typische Fehler ist leicht vorstellbar: Du läufst 30 km pro Woche,
        fragst nach einem Marathonplan, und die erste Woche enthält 50 km, weil
        das Modell deine Vorgeschichte mit der eines durchschnittlichen Läufers
        aufgefüllt hat.
      </p>

      <h2>Schwach: Zahlen, die es nicht bekommen hat</h2>
      <p>
        Frag „Wie viel bin ich im September gelaufen?“, ohne deine Daten
        mitzugeben, und ein Chatmodell erfindet womöglich einfach eine plausible
        Zahl. Selbst wenn du die Daten einfügst, ist das Addieren von dreißig
        Zeilen nicht seine Stärke. Summen, Durchschnittswerte und
        Belastungsberechnungen sollten aus Software kommen, die sie berechnet,
        und das Sprachmodell sollte nur über das Ergebnis sprechen.
      </p>

      <h2>So bekommst du brauchbarere Antworten</h2>
      <p>
        Gib ihm Kontext: deine Zonen oder aktuelle Wettkampfzeiten, deinen
        Wochenumfang der letzten vier bis sechs Wochen, den Wettkampf und sein
        Datum, die Tage, an denen du trainieren kannst, und jedes aktuelle
        Zwicken. Bitte es, seine Annahmen zu nennen, bevor es etwas schreibt.
        Prüfe das Ergebnis dann an ein paar einfachen Regeln: kein großer Sprung
        im Wochenumfang, nicht mehr harte Einheiten, als du gewohnt bist (zwei
        pro Woche reichen den meisten Hobbyläufern völlig), und lockere Tage,
        die wirklich locker sind.
      </p>

      <h2>In OpenAthlete</h2>
      <p>
        Die KI-Funktionen in OpenAthlete bleiben auf der Textseite dieser
        Grenze. Sie schreiben aus einem Satz eine strukturierte Einheit mit
        deinen Zonen, ändern eine Einheit auf eine kurze Anweisung hin, stellen
        nach einer Aktivität drei oder vier Fragen und machen aus den Antworten
        einen Belastungswert und eine Schmerznotiz für deinen Coach, und geben
        dir eine kurze Einschätzung jeder Aktivität. Du siehst jede Einheit,
        bevor sie auf deine Uhr geht. Sie stellen keine Diagnosen und laufen nur
        mit deiner Zustimmung, mit deinem eigenen API-Schlüssel oder dem
        Supporter-Kontingent. Details findest du auf der{' '}
        <Link href="/de/features/ai-coach">KI-Seite</Link>.
      </p>

      <h2>Quellen</h2>
      <Sources />
    </div>
  );
}
