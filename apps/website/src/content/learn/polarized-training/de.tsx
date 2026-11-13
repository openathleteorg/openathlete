import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentDe() {
  return (
    <div>
      <p>
        Polarisiertes Training beschreibt eine Art, die Trainingsintensität zu
        verteilen: der Großteil des Umfangs klar locker, ein kleinerer, aber
        echter Anteil klar hart und sehr wenig dazwischen. Die Idee stammt nicht
        aus einem Laborprotokoll, sondern aus der Beobachtung dessen, was
        Ausdauerathleten der Weltspitze tatsächlich tun. Bei der Auswertung
        beschreibender Studien stellte Stephen Seiler fest, dass national und
        international erfolgreiche Ausdauerathleten mit 10 bis 13 Einheiten pro
        Woche sich meist bei etwa 80&nbsp;% ihrer Einheiten mit niedriger
        Intensität einpendeln und etwa 20&nbsp;%, die von harter Arbeit geprägt
        sind, etwa Intervallen bei rund 90&nbsp;% der VO2max (Seiler, 2010).
      </p>
      <p>
        Dieses Muster wird oft auf „80/20“ verkürzt. Die Kurzform verschweigt
        zwei wichtige Details: welche Zonen du zählst und ob du Einheiten oder
        Minuten zählst.
      </p>

      <h2>Die drei Zonen dahinter</h2>
      <p>
        Polarisiertes Training nutzt ein Drei-Zonen-Modell, das auf zwei
        physiologischen Schwellen beruht. Zone 1 liegt unterhalb der ersten
        ventilatorischen Schwelle bzw.{' '}
        <Link href="/de/learn/lactate-threshold">Laktatschwelle</Link>{' '}
        (Blutlaktat um 2&nbsp;mmol/l): lockeres Laufen, bei dem du dich in
        ganzen Sätzen unterhalten kannst. Zone 2 liegt zwischen den beiden
        Schwellen. Zone 3 liegt oberhalb der zweiten Schwelle (um 4&nbsp;mmol/l,
        nahe der{' '}
        <Link href="/de/learn/critical-speed">kritischen Geschwindigkeit</Link>
        ), dort, wo die Intervalle stattfinden.
      </p>
      <p>
        Vorsicht bei den Namen. In den Fünf-Zonen-Systemen der meisten Uhren
        bedeutet „<Link href="/de/learn/zone-2">Zone 2</Link>“ lockere
        Grundlagenausdauer, die in Zone 1 des Drei-Zonen-Modells fällt.
        Polarisiertes Training verlangt nicht, dass du lockere Läufe in Zone 2
        meidest; es verlangt, dass du wenig Zeit zwischen den Schwellen
        verbringst.
      </p>

      <h2>Eine Zahl dafür</h2>
      <p>
        Treff und Kollegen (2019) schlugen einen Polarisationsindex vor, um eine
        polarisierte Verteilung von anderen zu unterscheiden. Er nutzt den
        Anteil der Trainingszeit (oder Distanz) in jeder der drei Zonen:
      </p>
      <Formula
        where={[
          'Z1, Z2, Z3 = Anteil der gesamten Trainingszeit in jeder Zone (0,80 für 80 %), Z1 + Z2 + Z3 = 1',
          'Gültig, wenn Z1 > Z3 > Z2. Ist Z3 = 0, gilt PI = 0. Ist Z2 = 0, setze 0,01 für Z2 und Z3 − 0,01 für Z3 ein',
          'PI > 2,00: polarisiert. PI ≤ 2,00: nicht polarisiert',
        ]}
      >
        PI = log10(Z1 / Z2 × Z3 × 100)
      </Formula>

      <h2>Ein Rechenbeispiel</h2>
      <p>
        Ein Läufer trainiert 8 Stunden pro Woche. Über einen Monat liegt die
        Zeit in den Zonen im Schnitt bei 80&nbsp;% in Zone 1, 5&nbsp;% in Zone 2
        und 15&nbsp;% in Zone 3.
      </p>
      <ul>
        <li>Z1 / Z2 = 0,80 / 0,05 = 16</li>
        <li>16 × 0,15 × 100 = 240</li>
        <li>PI = log10(240) = 2,38, über 2,00: polarisiert</li>
      </ul>
      <p>
        Ändere die Verteilung auf 75&nbsp;% / 20&nbsp;% / 5&nbsp;%, eine
        Pyramide mit viel Tempodauerlauf und wenigen Intervallen: PI =
        log10(0,75 / 0,20 × 0,05 × 100) = log10(18,75) = 1,27. Ein
        schwellenlastiger Block mit 60&nbsp;% / 35&nbsp;% / 5&nbsp;% ergibt
        0,93. Gleiche Wochenstunden, drei sehr unterschiedliche Wochen.
      </p>

      <h2>Einheiten oder Minuten</h2>
      <p>
        Seilers 80/20 zählt Einheiten. Die Zeit in den Zonen ergibt ein anderes
        Bild, denn eine harte Einheit besteht größtenteils aus Aufwärmen,
        Trabpausen und Auslaufen. Eine 70-minütige Einheit mit 5 × 4&nbsp;min im
        3.000- bis 5.000-m-Tempo enthält 20 Minuten Belastung, und weil die
        Herzfrequenz dem Tempo hinterherhinkt, werden davon noch weniger in Zone
        3 erfasst. Seiler und Kjerland (2006) haben bei elf
        Junioren-Skilangläufern über 32 Tage beides gemessen: Nach Herzfrequenz
        verteilten sich ihre Ausdauereinheiten zu 75&nbsp;% / 8&nbsp;% /
        17&nbsp;% auf die drei Zonen, und die Session-RPE ergab fast dasselbe
        Ergebnis. Vier lockere Läufe von einer Stunde plus diese
        Intervalleinheit ergeben eine Woche, die nach Einheiten 80/20 ist, aber
        nur 20 ihrer 310 Minuten, etwa 6&nbsp;%, sind hart. Beides ist nicht
        falsch, aber vergleiche Gleiches mit Gleichem.
      </p>

      <h2>So nutzt du es</h2>
      <p>
        Für einen Läufer mit fünf oder sechs Einheiten pro Woche kann eine
        polarisierte Woche so aussehen: drei oder vier lockere Läufe und ein
        langer Lauf, alle unterhalb der ersten Schwelle, dazu ein oder zwei
        harte Einheiten wie 5 × 4&nbsp;min oder 6 × 3&nbsp;min im 3.000- bis
        5.000-m-Tempo mit gleich langen Trabpausen. Die lockeren Tage müssen
        locker bleiben, was für die meisten langsamer heißt, als ihnen lieb ist;
        leg die Obergrenze mit dem{' '}
        <Link href="/de/tools/heart-rate-zones">Herzfrequenzzonen-Rechner</Link>{' '}
        oder dem Sprechtest fest. Die Statistik von OpenAthlete zeigt den Anteil
        deines Trainings unterhalb, zwischen und oberhalb deiner Schwellen. Das
        reicht, um zu prüfen, welche Art von Woche du tatsächlich gelaufen bist.
      </p>

      <h2>Grenzen</h2>
      <p>
        Die stärkste kontrollierte Bestätigung kommt von Stöggl und Sperlich
        (2014): 48 gut trainierte Läufer, Radfahrer, Triathleten und
        Skilangläufer absolvierten neun Wochen lang eines von vier Programmen,
        und die polarisierte Gruppe verbesserte die VO2peak um 11,7&nbsp;% und
        die Zeit bis zur Erschöpfung um 17,4&nbsp;%, mehr als die Gruppen mit
        hohem Umfang, Schwellentraining oder Intervalltraining. Neun Wochen und
        48 Athleten, aufgeteilt auf vier Gruppen, sind eine kurze und kleine
        Studie, und die Teilnehmer waren bereits fit. Seiler (2010) selbst
        beschreibt das 80/20-Muster als deskriptiv: Es ist das, worauf
        erfolgreiche Athleten hinauslaufen, kein Beweis, dass es für alle
        optimal ist. Ein Läufer mit vier Stunden pro Woche profitiert vielleicht
        mehr von etwas Schwellentraining als von strikter Polarisierung; diese
        Frage ist noch offen. Und schließlich hängen die Zonen von Schwellen ab,
        die du testen oder schätzen musst, und ein Fehler von 10&nbsp;bpm
        verschiebt Minuten von einer Zone in die nächste.
      </p>
    </div>
  );
}
