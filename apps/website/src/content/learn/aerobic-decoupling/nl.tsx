import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentNl() {
  return (
    <div>
      <p>
        Loop 90 minuten in een gelijkmatig, rustig tempo en je hartslag blijft
        zelden vlak. Hij kruipt omhoog: een paar slagen in het tweede uur, meer
        als het warm is, en nog meer als lange duurlopen nieuw voor je zijn.
        Aerobe ontkoppeling (aerobic decoupling) zet een getal op die stijging.
        Ze vergelijkt hoeveel tempo (of vermogen) je per hartslag haalt in de
        eerste helft van een gelijkmatige inspanning met de tweede helft. Joe
        Friel maakte het begrip populair bij duursporters, en TrainingPeaks
        noemt het Pa:HR voor tempo en Pw:HR voor vermogen.
      </p>

      <h2>Zo bereken je de ontkoppeling</h2>
      <p>
        Verdeel eerst het gelijkmatige deel van de inspanning in twee helften
        van gelijke duur. Bereken voor elke helft de efficiency factor (EF):
        gemiddelde output gedeeld door gemiddelde hartslag. Druk daarna het
        verlies van de ene naar de andere helft uit als percentage:
      </p>
      <Formula
        where={[
          'EF = gemiddelde output / gemiddelde hartslag, per helft',
          'Output = voor helling gecorrigeerde snelheid bij hardlopen, vermogen bij fietsen',
        ]}
      >
        Ontkoppeling (%) = (EF1 − EF2) / EF1 × 100
      </Formula>
      <p>
        Een positieve waarde betekent dat je in de tweede helft minder per
        hartslag leverde: de hartslag steeg bij hetzelfde tempo, of het tempo
        zakte bij dezelfde hartslag. Is het parcours niet vlak, corrigeer de
        snelheid dan voor de helling, anders lijkt een klim in de tweede helft
        op vermoeidheid. De gangbare lezing volgens Friel: onder 5% is stabiel,
        5 tot 10% laat wat drift zien, boven 10% ging de inspanning je aerobe
        uithoudingsvermogen te boven.
      </p>

      <h2>Een rekenvoorbeeld</h2>
      <p>
        Een loper doet 90 minuten op een vlak rondje in 5:20 per km, oftewel
        187,5 meter per minuut.
      </p>
      <ul>
        <li>
          Eerste 45 minuten: gemiddeld 142 bpm, dus EF1 = 187,5 / 142 = 1,320
        </li>
        <li>
          Laatste 45 minuten: zelfde tempo, gemiddeld 150 bpm, dus EF2 = 187,5 /
          150 = 1,250
        </li>
        <li>Ontkoppeling = (1,320 − 1,250) / 1,320 × 100 = 5,3%</li>
      </ul>
      <p>
        Net boven 5%: enige drift. Had de tweede helft gemiddeld 146 bpm
        gehaald, dan kwam het op 2,7%, ruim stabiel. Op de fiets is de rekensom
        hetzelfde met watts: 200 W bij 135 bpm, daarna 195 W bij 140 bpm, geeft
        EF-waarden van 1,48 en 1,39 en een ontkoppeling van 6,0%. Let op: het
        vermogen daalde en de hartslag steeg, en beide tellen tegen je.
      </p>

      <h2>Zo gebruik je het in je training</h2>
      <p>
        Ontkoppeling is het nuttigst als herhaalbare test van je aerobe
        uithoudingsvermogen tijdens een basisperiode. Kies een gelijkmatige
        training die je vaker gaat doen: een rustige duurloop van 75 tot 120
        minuten op hetzelfde vlakke rondje, of een rit onderin je duurzone. Houd
        de intensiteit elke keer in{' '}
        <Link href="/nl/tools/heart-rate-zones">
          dezelfde hartslag- of vermogenszone
        </Link>{' '}
        en volg het getal over de weken.
      </p>
      <ul>
        <li>
          Zit een loop van 90 minuten boven 5%, dan gaan duur of tempo je
          huidige uithoudingsvermogen te boven. Houd het tempo vast of loop iets
          langzamer, en bouw de duur op.
        </li>
        <li>
          Blijft het getal onder 5%, maak de loop dan langer of voeg aan het
          eind een gelijkmatig blok op marathontempo toe en kijk of het stabiel
          blijft.
        </li>
        <li>
          Voor een marathon of een lange trail is een lange duurloop met blokken
          op marathontempo die onder 5% blijft een geruststellend teken. Een
          grote drift is een reden om je doeltempo of je voedingsplan te
          herzien.
        </li>
      </ul>
      <p>
        OpenAthlete berekent de ontkoppeling en de efficiency factor voor elke
        hardloopactiviteit op basis van voor helling gecorrigeerde snelheid en
        hartslag, en voor fietsritten op basis van vermogen. Op de
        activiteitenpagina kun je de warming-up met een schuifregelaar weglaten
        of een deel van de inspanning selecteren, en de kaart toont beide
        helften en een status: stabiel, enige drift of duidelijke drift. Onder
        20 minuten markeert hij de inspanning als te kort om je
        uithoudingsvermogen te beoordelen.
      </p>

      <h2>Beperkingen</h2>
      <p>
        Ontkoppeling zegt alleen iets bij een gelijkmatige inspanning.
        Intervallen, stoppen voor verkeerslichten of een loop met een snelle
        eindsprint maken de vergelijking onbruikbaar. Hitte is de grootste
        stoorfactor: Coyle en González-Alonso (2001) beschrijven hoe een
        stijgende lichaamstemperatuur de hartslag opdrijft terwijl het
        slagvolume daalt, en uitdroging versterkt dat nog. Een ontkoppeling van
        7% op een middag van 30 °C en 3% op een koele ochtend kunnen dezelfde
        conditie beschrijven. Optische polssensoren die je cadans oppikken, een
        borstband met droge contacten of GPS-drift onder bomen vertekenen
        telkens één helft. En ontkoppeling zegt niets over snelheid: je kunt
        perfect gekoppeld zijn op een tempo dat te traag is voor je doel. Lees
        het naast je tempo, je{' '}
        <Link href="/nl/learn/trimp">trainingsbelasting</Link> en de
        omstandigheden van de dag.
      </p>
    </div>
  );
}
