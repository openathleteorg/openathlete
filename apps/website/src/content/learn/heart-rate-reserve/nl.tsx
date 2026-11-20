import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentNl() {
  return (
    <div>
      <p>
        De hartslagreserve is het bereik waar je hart echt mee kan werken: je
        maximale hartslag min je rusthartslag. Een loper met een rusthartslag
        van 50 en een maximum van 190 heeft 140 slagen reserve. Trainingszones
        op basis van dat bereik, in plaats van een simpel percentage van je
        maximum, zijn wat de meeste mensen bedoelen met de methode van Karvonen,
        naar de Finse fysioloog Martti Karvonen, die haar gebruikte in een
        studie uit 1957 naar hoe training de hartslag verlaagt.
      </p>
      <p>
        Het voordeel is dat ze rekening houdt met je vertrekpunt. Twee lopers
        met hetzelfde maximum maar een verschillende rusthartslag hebben niet
        hetzelfde rustige tempo in slagen per minuut, en de reserve ziet dat. Ze
        sluit ook beter aan bij de fysiologie dan percentages van het maximum:
        Swain en Leutholtz (1997) lieten zien dat een bepaald percentage van de
        hartslagreserve overeenkomt met hetzelfde percentage van de
        zuurstofopnamereserve, terwijl een percentage van de maximale hartslag
        niet overeenkomt met hetzelfde percentage van de VO2max.
      </p>

      <h2>Zo wordt ze berekend</h2>
      <Formula
        where={[
          'HRR = HRmax − HRrust, in slagen per minuut',
          'intensiteit = het gewenste deel van de reserve, 0,6 voor 60%',
        ]}
      >
        doelhartslag = HRrust + (HRmax − HRrust) × intensiteit
      </Formula>
      <p>
        De gebruikelijke vijf zones zijn banden van 10% van de reserve: 50–60%,
        60–70%, 70–80%, 80–90% en 90–100%. De percentages zijn afspraken, geen
        drempels die bij jou gemeten zijn, en dat doet er straks toe.
      </p>

      <h2>Een rekenvoorbeeld</h2>
      <p>
        Rusthartslag 50 bpm, maximum 190 bpm, dus een reserve van 140 slagen.
      </p>
      <ul>
        <li>Zone 1 (50–60%): 50 + 0,5 × 140 = 120 tot 134 bpm</li>
        <li>Zone 2 (60–70%): 134 tot 50 + 0,7 × 140 = 148 bpm</li>
        <li>Zone 3 (70–80%): 148 tot 162 bpm</li>
        <li>Zone 4 (80–90%): 162 tot 176 bpm</li>
        <li>Zone 5 (90–100%): 176 tot 190 bpm</li>
      </ul>
      <p>
        Met percentages van het maximum zou dezelfde zone 2 tussen 114 en 133
        bpm liggen, ruim 15 slagen lager. Voor een fitte loper is 114 bpm
        nauwelijks een sukkeldrafje, en daarom merken mensen die overstappen op
        Karvonen vaak dat hun rustige duurlopen niet langer als wandelen voelen.
      </p>
      <p>
        Houd nu het maximum op 190, maar verhoog de rusthartslag naar 65. De
        reserve zakt naar 125 slagen en zone 2 wordt 65 + 0,6 × 125 = 140 tot 65
        + 0,7 × 125 = 152,5, dus ruwweg 140 tot 153 bpm. Hetzelfde maximum, een
        andere zone, omdat het vertrekpunt verschoof.
      </p>

      <h2>De twee getallen goed bepalen</h2>
      <p>
        Je rusthartslag meet je het best liggend bij het wakker worden, voor de
        koffie, over meerdere ochtenden; neem een typische waarde, niet de
        laagste die je ooit zag. Horloges geven vaak het minimum tijdens je
        slaap, dat een paar slagen lager kan liggen en de reserve iets opblaast.
      </p>
      <p>
        De maximale hartslag is lastiger. De hoogste waarde die je zag aan het
        eind van een zware wedstrijd, of na de laatste van een reeks zware
        heuvelsprints, is meer waard dan welke formule ook. Heb je niets, dan
        geven Tanaka, Monahan en Seals (2001) 208 − 0,7 × leeftijd, dus 180 bpm
        op je 40e. Dat is een gemiddelde over de bevolking: veel mensen zitten
        er 10 slagen of meer naast, naar boven of naar beneden, en een maximum
        dat 10 slagen te hoog is schuift elke zone zo’n 6 tot 9 slagen omhoog.
      </p>

      <h2>Zo gebruik je haar in je training</h2>
      <p>
        Hartslagzones werken het best bij lange, gelijkmatige inspanningen,
        waarbij je hart tijd heeft om tot rust te komen. Rustige duurlopen en
        lange duurlopen in <Link href="/nl/learn/zone-2">zone 2</Link> zijn het
        duidelijkste voorbeeld: voor de loper hierboven 134 tot 148 bpm,
        ongeacht het tempo op een heuvelachtige of winderige dag. Tempolopen van
        30 tot 40 minuten in zone 3, of 2 × 15 minuten bovenin zone 4 (rond 169
        tot 173 bpm, 85–88% van de reserve), zijn ook makkelijk op hartslag te
        sturen.
      </p>
      <p>
        Bij korte intervallen zoals 5 × 4 minuten op drempel loopt je hartslag
        achter op de inspanning: hij heeft een minuut of twee nodig om te
        stijgen, en de eerste herhaling ziet er op je horloge makkelijk uit
        terwijl dat niet zo is. Stuur die op tempo of vermogen en gebruik je
        hartslag achteraf om te controleren of de training deed wat je wilde.
        Hetzelfde deel van de reserve zit ook in belastingsscores zoals{' '}
        <Link href="/nl/learn/trimp">TRIMP</Link>, dus je rust- en maximumwaarde
        goed bepalen loont dubbel.
      </p>
      <p>
        De <Link href="/nl/tools/heart-rate-zones">hartslagzonecalculator</Link>{' '}
        doet het rekenwerk voor beide methoden. In OpenAthlete kun je
        hartslagzones instellen als percentage van je maximum of van je reserve,
        wordt de reserve berekend uit je rust- en maximale hartslag, en kunnen
        trainingsstappen mikken op een percentage van de hartslagreserve.
      </p>

      <h2>Beperkingen</h2>
      <p>
        Alles rust op twee invoerwaarden, en die bevatten allebei ruis. Je
        rusthartslag verschuift een paar slagen door slaap, stress, warmte of
        een opkomende verkoudheid; je hartslag tijdens inspanning stijgt door
        hitte, uitdroging, cafeïne en hoogte, en drijft bij lange inspanningen
        omhoog. Sommige medicijnen, vooral bètablokkers, veranderen beide
        uiteinden van het bereik.
      </p>
      <p>
        De grotere beperking is dat 60%, 70% of 80% van de reserve voor iedereen
        hetzelfde is, terwijl de fysiologie dat niet is. De{' '}
        <Link href="/nl/learn/lactate-threshold">lactaatdrempel</Link> van de
        ene loper ligt op 82% van de reserve, die van een ander op 90%. Ken je
        je drempelhartslag uit een labtest of een wedstrijdinspanning van 30
        minuten, dan zijn zones die daarop gebaseerd zijn nauwkeuriger. Karvonen
        is een degelijke standaard als je die niet kent.
      </p>
    </div>
  );
}
