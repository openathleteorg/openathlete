import Link from 'next/link';

import { Sources } from './sources';

export function ContentDe() {
  return (
    <div>
      <p>
        Du läufst seit zwei Monaten etwa 40 km pro Woche. Dein Marathon ist in
        16 Wochen, und deine umfangreichsten Wochen sollen 70 km erreichen. In
        diesem Artikel geht es darum, von der einen Zahl zur anderen zu kommen,
        ohne Woche 9 mit einem Eisbeutel am Schienbein zu verbringen. Er ist
        bewusst praktisch gehalten: Was die Forschung über Belastung und
        Verletzungen sagt und was nicht, liest du in{' '}
        <Link href="/de/blog/preventing-training-injuries">
          Laufverletzungen und Trainingsbelastung
        </Link>
        .
      </p>

      <h2>Die 10-Prozent-Regel ist eine ausgedachte Obergrenze</h2>
      <p>
        Niemand weiß so genau, woher die 10-Prozent-Regel stammt, und sie wurde
        seltener getestet, als ihre Bekanntheit vermuten lässt. Als
        niederländische Forscher 532 Laufanfängern entweder einen Standardplan
        über 8 Wochen oder einen langsameren Plan über 13 Wochen mit
        Steigerungen von 10 % gaben, waren die Verletzungsraten gleich: etwa
        jeder fünfte Läufer in jeder Gruppe (Buist et al., 2008). Eine dänische
        Kohorte mit 874 Anfängern fand ein mögliches Signal erst oberhalb von 30
        % über zwei Wochen, und selbst das war grenzwertig (Nielsen et al.,
        2014).
      </p>
      <p>
        Die Regel versagt außerdem in beide Richtungen. Bei geringem Umfang ist
        sie absurd langsam: Aus 20 km pro Woche werden 22. Bei höherem Umfang
        und jede Woche ohne Pause angewendet, schaukelt sie sich auf. Vierzig
        Kilometer plus 10 % pro Woche über zehn Wochen ergeben 104 km. Das
        sollte niemand tun, und doch sagt die Regel genau das.
      </p>
      <p>
        Was die Studienlage und der IOC-Konsens zur Belastung (Soligard et al.,
        2016) tatsächlich stützen, ist der Grundgedanke: schrittweise steigern,
        plötzliche große Sprünge vermeiden und auf den Menschen eingehen, den
        man vor sich hat. Der Rest ist Trainererfahrung, und ich kennzeichne ihn
        auch so.
      </p>

      <h2>Wie ich den Umfang stattdessen aufbaue</h2>
      <p>
        <strong>Eine Stufe, dann halten.</strong> Leg einen Block drauf, etwa 4
        bis 6 km oder 30 Minuten, und bleib dann eine oder zwei Wochen auf
        diesem Niveau, bevor die nächste Stufe kommt. Meiner Erfahrung nach
        verkraften Läufer ein Niveau, das sie wiederholt haben, besser als jede
        Woche einen neuen Rekord. Das ist Beobachtung, keine Studienlage.
      </p>
      <p>
        <strong>Jede dritte oder vierte Woche eine Entlastungswoche.</strong>{' '}
        Reduziere den Umfang um etwa ein Viertel bis ein Drittel und behalte
        eine kurze Qualitätseinheit bei, zum Beispiel 6 × 1&apos; schnell am
        Mittwoch, damit du nicht schlapp in den nächsten Block startest. Für den
        genauen Prozentsatz gibt es keine starke Studie. Für die Gewohnheit, die
        Woche einzuplanen, bevor du sie brauchst, schon.
      </p>
      <p>
        <strong>Immer nur eine Neuerung.</strong> Leg nicht 6 km drauf in
        derselben Woche, in der deine erste Bahneinheit der Saison, dein erster
        langer, hügeliger Traillauf oder ein neues Paar Schuhe mit weniger
        Sprengung ansteht. Die Studie Run Clever fand ähnliche Verletzungsraten,
        egal ob die Intensität oder der Umfang gesteigert wurde (Ramskov et al.,
        2018). Beides gleichzeitig zu steigern wurde nicht untersucht, und ich
        würde mich nicht freiwillig melden, um es herauszufinden.
      </p>
      <p>
        <strong>Den langen Lauf separat steigern.</strong> Jedes Mal, wenn er
        länger wird, zehn bis fünfzehn Minuten mehr, und zu Beginn eines Aufbaus
        höchstens etwa ein Drittel des Wochenumfangs. Wer 40 km pro Woche läuft
        und davon 25 km im langen Lauf, packt den Großteil der Woche in eine
        einzige Einheit.
      </p>
      <p>
        <strong>Zähl, was dich wirklich belastet.</strong> Auf der Straße sind
        Kilometer ein brauchbarer Näherungswert. Im Trail zählen Zeit und
        Höhenmeter: 1.000 m Abstieg in einer Woche sind eine Belastung, die
        keine Distanzangabe erfasst, und deine Oberschenkel melden sie mit zwei
        Tagen Verzögerung.
      </p>
      <p>
        <strong>Pausen respektieren.</strong> Nach ein paar freien Tagen machst
        du einfach weiter. Nach zwei oder drei Wochen Pause starte ich wieder
        bei der Hälfte bis zwei Dritteln des vorherigen Umfangs und baue über
        drei oder vier Wochen wieder auf. Dein Durchschnitt der letzten Wochen
        ist gesunken, auch wenn deine Erinnerung daran es nicht ist.
      </p>

      <h2>Ein Beispiel über 16 Wochen</h2>
      <p>
        So könnte der Aufbau von 40 auf 70 km aussehen. Die Dauer der langen
        Läufe geht von einem lockeren Tempo um 6:00 pro km aus.
      </p>
      <table>
        <thead>
          <tr>
            <th>Woche</th>
            <th>Umfang</th>
            <th>Langer Lauf</th>
            <th>Hinweis</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td>40 km</td>
            <td>1h20</td>
            <td>Aktuelles Niveau</td>
          </tr>
          <tr>
            <td>2</td>
            <td>44 km</td>
            <td>1h30</td>
            <td>Erste Stufe</td>
          </tr>
          <tr>
            <td>3</td>
            <td>44 km</td>
            <td>1h30</td>
            <td>Halten</td>
          </tr>
          <tr>
            <td>4</td>
            <td>34 km</td>
            <td>1h15</td>
            <td>Entlastungswoche</td>
          </tr>
          <tr>
            <td>5</td>
            <td>48 km</td>
            <td>1h40</td>
            <td></td>
          </tr>
          <tr>
            <td>6</td>
            <td>52 km</td>
            <td>1h45</td>
            <td></td>
          </tr>
          <tr>
            <td>7</td>
            <td>52 km</td>
            <td>1h50</td>
            <td>Halten</td>
          </tr>
          <tr>
            <td>8</td>
            <td>40 km</td>
            <td>1h30</td>
            <td>Entlastungswoche</td>
          </tr>
          <tr>
            <td>9</td>
            <td>56 km</td>
            <td>2h00</td>
            <td></td>
          </tr>
          <tr>
            <td>10</td>
            <td>60 km</td>
            <td>2h05</td>
            <td></td>
          </tr>
          <tr>
            <td>11</td>
            <td>60 km</td>
            <td>2h15</td>
            <td>Halten</td>
          </tr>
          <tr>
            <td>12</td>
            <td>46 km</td>
            <td>1h40</td>
            <td>Entlastungswoche</td>
          </tr>
          <tr>
            <td>13</td>
            <td>65 km</td>
            <td>2h20</td>
            <td></td>
          </tr>
          <tr>
            <td>14</td>
            <td>70 km</td>
            <td>2h30</td>
            <td>Spitze</td>
          </tr>
          <tr>
            <td>15</td>
            <td>52 km</td>
            <td>1h45</td>
            <td>Tapering</td>
          </tr>
          <tr>
            <td>16</td>
            <td>30 km + Wettkampf</td>
            <td>Wettkampf</td>
            <td>Wettkampfwoche</td>
          </tr>
        </tbody>
      </table>
      <p>
        Schau dir Woche 5 an. Verglichen mit der Entlastungswoche 4 ist das ein
        Sprung um 41 %, der in jeder App mit Belastungsquotient sämtliche Alarme
        auslösen würde. Verglichen mit den Wochen 2 und 3, dem Niveau, auf dem
        der Läufer tatsächlich trainiert hat, sind es 9 %. Vergleiche eine neue
        Woche mit dem Training vor der Entlastungswoche, nicht mit der
        Entlastungswoche selbst.
      </p>
      <p>
        Achte auch darauf, was der Plan nicht tut: Er erhöht nie in derselben
        Woche den Umfang und führt eine neue Art von Einheit ein, und die Spitze
        liegt zwei Wochen vor dem Wettkampf, nicht eine. Ist dein Zielwettkampf
        ein hügeliger Trail, ersetze Kilometer durch Stunden und ergänze eine
        Spalte für Höhenmeter.
      </p>

      <h2>Womit du eine Woche vergleichen solltest</h2>
      <p>
        Wenn du eine einzige Zahl willst, vergleiche diese Woche mit dem
        Durchschnitt der drei oder vier Wochen davor, ohne die aktuelle Woche in
        diesen Durchschnitt einzurechnen. Nimm sie als Anlass, genauer
        hinzuschauen, nicht als Urteil. Das beliebte Verhältnis von akuter zu
        chronischer Belastung (ACWR) und sein „Sweet Spot“ von 0,8 bis 1,3
        wurden heftig kritisiert, unter anderem genau wegen dieser doppelten
        Zählung (Impellizzeri et al., 2020). Es gibt keinen validierten
        Schwellenwert, weder für dich noch für sonst jemanden.
      </p>

      <h2>Wann du halten oder zurückgehen solltest</h2>
      <p>
        Hör auf zu steigern, und meist auch für ein paar Tage mit dem Laufen,
        wenn ein Schmerz deinen Laufstil verändert, während des Laufs schlimmer
        wird oder am nächsten Morgen stärker ist. Schmerz an einer genau
        lokalisierbaren Stelle eines Knochens, etwa am Schienbein oder auf dem
        Fußrücken, verdient eine fachliche Einschätzung vor dem nächsten Lauf,
        nicht nach den nächsten drei.
      </p>
      <p>
        Halte das aktuelle Niveau oder zieh die Entlastungswoche vor, wenn sich
        lockere Läufe mehrere Tage hintereinander schwerer anfühlen als sonst,
        wenn dich dasselbe lockere Tempo mehr Herzfrequenz kostet oder wenn dein
        Schlaf schlechter geworden ist. Das sind die frühen Anzeichen, die in{' '}
        <Link href="/de/blog/5-signs-of-overtraining-and-how-to-avoid-it">
          Übertraining und Overreaching
        </Link>{' '}
        beschrieben sind. Eine Stufe um eine Woche zu verschieben kostet dich
        fast nichts. Eine Stressfraktur kostet dich den Wettkampf.
      </p>

      <h2>Die Planung in OpenAthlete</h2>
      <p>
        In der Saisonansicht von OpenAthlete kannst du einen Aufbau wie den oben
        als Blöcke anlegen (Grundlage, spezifische Phase, Tapering, Erholung),
        mit deinem Wettkampf obendrauf, und jede Woche zeigt ihre Belastung im
        Vergleich zu einem Bereich, der aus deinen letzten Wochen berechnet
        wird. Dieser Bereich ist eine Faustregel, um eine Woche einzuordnen,
        keine Sicherheitsgrenze. Fitness, Ermüdung und Form werden über die
        geplanten Einheiten hochgerechnet, sodass du siehst, was eine
        Entlastungswoche mit deiner Form macht, bevor du sie läufst. Schmerzen,
        die du in den optionalen Fragen nach einer Aktivität angibst, landen in
        einem Verletzungsprotokoll, das dein Coach sehen kann. Mehr dazu auf den
        Seiten{' '}
        <Link href="/de/features/training-calendar">Trainingskalender</Link> und{' '}
        <Link href="/de/features/training-load">Trainingsbelastung</Link>.
      </p>

      <h2>Quellen</h2>
      <Sources />
    </div>
  );
}
