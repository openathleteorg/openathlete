import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentNl() {
  return (
    <div>
      <p>
        VDOT is het getal in het hart van het trainingssysteem van Jack Daniels.
        De naam komt van “V-dot-O2max”, de manier waarop fysiologen VO2max
        schrijven, maar het wordt niet in een lab gemeten. Daniels en de
        wiskundige Jimmy Gilbert rekenden het in de jaren zeventig terug uit
        wedstrijdresultaten: gegeven hoe snel je een afstand liep, welke VO2max
        zou dat verklaren als je loopeconomie gemiddeld was? Het antwoord is één
        score die je huidige loopvorm rangschikt, voorspelt wat je op andere
        afstanden kunt lopen, en je een set trainingstempo’s geeft.
      </p>
      <p>
        Omdat VDOT uit een prestatie komt, zit er al in wat een VO2max uit het
        lab weglaat: hoe zuinig je pas is en welk deel van je maximum je een
        hele wedstrijd kunt volhouden. Die drie factoren samen verklaren het
        grootste deel van duurprestaties (Joyner en Coyle, 2008). Daarom kunnen
        twee lopers met dezelfde <Link href="/nl/learn/vo2max">VO2max</Link> een
        VDOT hebben die meerdere punten verschilt, en daarom voorspelt VDOT
        wedstrijdtijden beter dan VO2max.
      </p>

      <h2>Hoe VDOT wordt berekend</h2>
      <p>
        De formules van Daniels en Gilbert bestaan uit twee delen. Het eerste
        geeft de zuurstofkosten van lopen met een snelheid v, in meter per
        minuut. Het tweede geeft het deel van de VO2max dat een loper kan
        volhouden in een wedstrijd van t minuten: bijna 100% gedurende zo’n 10
        minuten, rond 90% gedurende 45 minuten, onder 85% voor een marathon.
      </p>
      <Formula
        where={[
          'Zuurstofkosten (ml/kg/min) = −4,6 + 0,182258 × v + 0,000104 × v²',
          'Houdbaar deel = 0,8 + 0,1894393 × e^(−0,012778 × t) + 0,2989558 × e^(−0,1932605 × t)',
          'v = afstand (m) / tijd (min); t = wedstrijdtijd in minuten',
        ]}
      >
        VDOT = zuurstofkosten / houdbaar deel
      </Formula>
      <p>
        De formules gelden van ongeveer 1.500 m tot de marathon. Daaronder
        leunen wedstrijden op anaerobe capaciteit; daarboven beslissen voeding
        en hitte meer dan aerobe fitheid.
      </p>

      <h2>Een rekenvoorbeeld</h2>
      <p>Een loper finisht een vlakke 10 km in 45:00.</p>
      <ul>
        <li>Snelheid: 10.000 m / 45 min = 222,2 m/min</li>
        <li>
          Zuurstofkosten: −4,6 + 0,182258 × 222,2 + 0,000104 × 222,2² = 41,0
          ml/kg/min
        </li>
        <li>
          Houdbaar deel voor 45 minuten: 0,8 + 0,1894 × e^(−0,575) + 0,2990 ×
          e^(−8,70) = 0,907
        </li>
        <li>VDOT = 41,0 / 0,907 = 45,3</li>
      </ul>
      <p>
        Draai de formules om en dezelfde VDOT voorspelt ongeveer 21:42 op de 5
        km, 1:39:44 op de halve marathon en 3:27:15 op de marathon.
      </p>
      <p>
        Trainingstempo’s komen uit vaste fracties van de VDOT, met de formule
        voor zuurstofkosten terugvertaald naar een snelheid. Voor een VDOT van
        45,3:
      </p>
      <ul>
        <li>Rustig (59 tot 74%): 6:21 tot 5:18 per km</li>
        <li>Marathon (de voorspelde marathonsnelheid): 4:55 per km</li>
        <li>Drempel (88%): 4:37 per km</li>
        <li>Interval (97,5%): 4:15 per km</li>
        <li>Repetition (105%): 4:00 per km, of 96 seconden per 400 m</li>
      </ul>

      <h2>Hoe je VDOT in je training gebruikt</h2>
      <p>
        Elk tempo heeft een taak. Drempeltempo is voor tempolopen van 20 minuten
        of cruise-intervallen zoals 5 × 1 km met een minuut dribbelen.
        Intervaltempo is voor herhalingen van drie tot vijf minuten,
        bijvoorbeeld 5 × 1.000 m met even lange dribbelpauzes, wat dicht in de
        buurt komt van wat Franse trainers werk op{' '}
        <Link href="/nl/learn/vma">VMA</Link> (de snelheid bij VO2max) noemen.
        Repetition-tempo is voor korte, snelle herhalingen van 200 of 400 m met
        volledig herstel, gericht op loopeconomie. Rustig tempo beslaat het
        grootste deel van de week.
      </p>
      <p>
        Twee gewoonten houden het systeem eerlijk. Bepaal je VDOT op basis van
        een recente wedstrijd, niet van de wedstrijd die je hoopt te lopen:
        trainen op streeftempo voordat je de vorm hebt, is de klassieke manier
        om jezelf in een gat te trainen. En verhoog hem in kleine stappen, één
        punt na een goede wedstrijd of een blok trainingen dat beheerst
        aanvoelde, in plaats van elke goede dag na te jagen.
      </p>
      <p>
        In OpenAthlete berekent de recordpagina je VDOT uit je sterkste
        inspanning tussen 1.500 m en de marathon en toont ze de bijbehorende
        trainingstempo’s. Op deze site gebruiken de{' '}
        <Link href="/nl/pace-charts">tempotabellen</Link> dezelfde formules, en
        de <Link href="/nl/tools/race-predictor">wedstrijdtijdvoorspeller</Link>{' '}
        geeft een second opinion met de formule van Riegel.
      </p>

      <h2>Beperkingen</h2>
      <p>
        VDOT gaat ervan uit dat je uithoudingsvermogen past bij je snelheid. Een
        loper met een snelle 10 km en weinig kilometers haalt de voorspelde
        marathontijd meestal niet, vaak met enkele minuten, omdat de tabellen
        uitgaan van training die bij de afstand past. Heuvels, hitte, wind en
        een slecht ingedeelde wedstrijd verlagen allemaal de score, dus een VDOT
        van een slechte dag onderschat je. Het houdbare deel is een gemiddelde
        curve: sommige lopers houden een hoger deel van hun maximum vol dan
        anderen, en trail- of ultrawedstrijden vallen buiten waarvoor de
        formules gebouwd zijn. Zie VDOT als een goed gekalibreerd startpunt, en
        stel tempo’s bij op gevoel en hartslag.
      </p>
    </div>
  );
}
