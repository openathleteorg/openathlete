import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentNl() {
  return (
    <div>
      <p>
        Je hart klopt niet als een metronoom. Bij 50 bpm is de gemiddelde tijd
        tussen twee slagen 1,2 seconde, maar de ene tussenpoos kan 1150 ms zijn
        en de volgende 1240 ms. Hartslagvariabiliteit (HRV) meet die variatie.
        Het grootste deel van de snelle variatie van slag tot slag komt van de
        nervus vagus, de parasympathische ‘rem’ op het hart, dus HRV is een
        venster, smal en met veel ruis, op hoe je autonome zenuwstelsel omgaat
        met training, slaap, ziekte en stress.
      </p>

      <h2>Zo wordt HRV berekend</h2>
      <p>
        Er bestaan tientallen HRV-indices (het Task Force-rapport uit 1996 noemt
        de meeste). Sporters en hun horloges gebruiken vooral rMSSD, de wortel
        uit het gemiddelde van de gekwadrateerde opeenvolgende verschillen
        tussen slag-tot-slagintervallen (RR-intervallen):
      </p>
      <Formula
        where={[
          'RRi = de tijd tussen twee opeenvolgende slagen, in milliseconden',
          'N = het aantal intervallen in de meting',
        ]}
      >
        rMSSD = √( Σ (RRi+1 − RRi)² / (N − 1) )
      </Formula>
      <p>
        rMSSD geeft de vagale activiteit goed weer en blijft bruikbaar bij korte
        metingen: een paar minuten liggend bij het wakker worden, of de
        diepe-slaapvensters die een horloge ’s nachts kiest. Omdat dagwaarden
        scheef verdeeld zijn (een paar heel hoge nachten trekken een gewoon
        gemiddelde omhoog), nemen trainingsstudies meestal eerst de natuurlijke
        logaritme, ln rMSSD, voordat ze middelen.
      </p>

      <h2>Een rekenvoorbeeld</h2>
      <p>
        Neem vijf opeenvolgende RR-intervallen: 1000, 1050, 980, 1020 en 990 ms.
      </p>
      <ul>
        <li>Opeenvolgende verschillen: +50, −70, +40, −30 ms</li>
        <li>Kwadraten: 2500 + 4900 + 1600 + 900 = 9900</li>
        <li>Gemiddelde over de 4 verschillen: 9900 / 4 = 2475</li>
        <li>rMSSD = √2475 = 49,7 ms, dus ln rMSSD = 3,91</li>
      </ul>
      <p>
        Een echte meting heeft honderden intervallen, maar de rekensom is
        dezelfde. Nu een week nachtmetingen: 62, 58, 65, 48, 60, 63 en 59 ms.
        Het gemiddelde van hun logaritmen is 4,08, wat terugrekent naar 59 ms.
        De nacht van 48 ms na een lange duurloop op zondag ziet er op zichzelf
        verontrustend uit, maar verschuift het weekcijfer nauwelijks. Meet je de
        week erna 52, 49, 55, 50, 47, 51 en 48 ms, dan zakt de 7-daagse waarde
        naar 3,92 (50 ms). Dat is een blijvende verschuiving, en een vraag
        waard.
      </p>

      <h2>Zo gebruik je HRV in je training</h2>
      <p>
        Het getal van één ochtend zegt weinig. Plews en collega’s (2013) lieten
        zien dat bij topduursporters het voortschrijdende 7-daagse gemiddelde
        van ln rMSSD, en hoeveel het schommelt, de aanpassing veel beter volgt
        dan losse metingen. Een praktische routine:
      </p>
      <ul>
        <li>
          Meet elke dag op dezelfde manier: ’s nachts met hetzelfde horloge, of
          bij het wakker worden, liggend, voor de koffie.
        </li>
        <li>
          Bouw een basislijn op uit minstens drie of vier weken normale training
          en bepaal daaromheen je gebruikelijke bereik.
        </li>
        <li>
          Lees het 7-daagse gemiddelde af tegen dat bereik, naast je
          rusthartslag, je slaap en hoe trainingen aanvoelen.
        </li>
      </ul>
      <p>
        Kiviniemi en collega’s (2007) gingen verder: een groep matig getrainde
        mannen deed zware trainingen alleen op dagen waarop hun HRV niet was
        gedaald, en anders rustige duurlopen. Ze verbeterden hun maximale
        loopsnelheid meer dan een groep met een vast schema. Dat is een
        bruikbaar idee, maar één studie met kleine groepen, geen regel. Voor de
        meeste sporters werkt HRV het best als reden om een week beter te
        bekijken: staat het 7-daagse gemiddelde al een week onder je bereik, is
        je rusthartslag gestegen en voelde de 5 × 4' op drempel als een
        wedstrijd, neem dan de rustige dag.
      </p>
      <p>
        OpenAthlete importeert nachtelijke HRV van Garmin, Polar, Suunto en
        COROS (of je voert het met de hand in), toont de waarde van afgelopen
        nacht in de dagelijkse welzijnsrij van de kalender en tekent het
        voortschrijdende 7-daagse gemiddelde van ln rMSSD in de
        herstelstatistieken. Het laat de trend zien; het maakt er geen
        readiness-score van.
      </p>

      <h2>Beperkingen</h2>
      <p>
        Absolute waarden zijn persoonlijk: gezonde, fitte mensen zitten ergens
        tussen onder 30 en boven 100 ms, dus vergelijken met een trainingsmaatje
        heeft geen zin. Apparaten verschillen ook. Sommige geven rMSSD over de
        hele nacht, andere over een venster van 5 minuten, weer andere een eigen
        score; wissel je van horloge, dan begint je basislijn opnieuw. Alcohol,
        een late maaltijd, hitte, reizen en de menstruatiecyclus verschuiven
        allemaal je HRV zonder verband met training. En hoger is niet altijd
        beter: Buchheit (2014) wijst erop dat bij zeer fitte sporters HRV
        tijdens zware training kan ophouden met stijgen of zelfs dalen terwijl
        ze zich goed aanpassen, en dat een scherpe stijging kan samengaan met
        diepe vermoeidheid. HRV is één signaal tussen andere; lees het samen met{' '}
        <Link href="/nl/learn/session-rpe">hoe zwaar trainingen voelden</Link>{' '}
        en met{' '}
        <Link href="/nl/learn/ctl-atl-tsb">je trainingsbelastingscurves</Link>,
        nooit los.
      </p>
    </div>
  );
}
