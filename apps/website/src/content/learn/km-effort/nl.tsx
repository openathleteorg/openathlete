import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentNl() {
  return (
    <div>
      <p>
        Km-effort is de manier van trailrunners om klimmen in afstand om te
        rekenen: elke 100 hoogtemeters stijging telt als één extra kilometer.
        Een wedstrijd van 25 km met 1000 m D+ wordt 35 km-effort, en die kun je
        eerlijker vergelijken met een duurloop van 35 km op de weg, of met een
        andere trail met hetzelfde totaal, dan met afstand alleen.
      </p>
      <p>
        Het is een afspraak, geen natuurwet van de fysiologie. Het begrip
        ontstond in de Franse trailwereld (<em>kilomètre-effort</em>), waar
        trainers en organisatoren een snelle manier zochten om te zeggen hoe
        zwaar een parcours was, en ITRA gebruikt dezelfde som, afstand plus D+
        gedeeld door 100, om wedstrijden in te delen. Het mooie is dat je het
        aan de start uit je hoofd kunt uitrekenen.
      </p>

      <h2>Zo bereken je km-effort</h2>
      <Formula
        where={[
          'km = afstand van het parcours of de loop',
          'D+ = totale stijging in meters',
        ]}
      >
        km-effort = km + D+ / 100
      </Formula>
      <p>
        Afdalingen tellen niet mee: ze leveren geen bonus en geen straf op.
        Sommige trainers wegen klimmen anders op heel steile of heel loopbare
        parcoursen, en sommigen tellen een deel van de afdaling mee, maar 100 m
        per kilometer is de gangbare versie en de versie die hier wordt
        gebruikt.
      </p>
      <p>
        Heb je de km-effort, dan kun je een eerdere wedstrijd omzetten in een
        voorspelling. De{' '}
        <Link href="/nl/tools/trail-time-estimator">trailtijdcalculator</Link>{' '}
        past de uithoudingsformule van Peter Riegel toe op km-effort in plaats
        van op afstand:
      </p>
      <Formula
        where={[
          'T_ref, E_ref = tijd en km-effort van een wedstrijd die je hebt gelopen',
          'E = km-effort van de doelwedstrijd',
          'k = 1,06 (de waarde van Riegel voor de weg) voor de ondergrens, 1,10 voor de bovengrens',
        ]}
      >
        T = T_ref × (E / E_ref)^k
      </Formula>

      <h2>Een rekenvoorbeeld</h2>
      <ul>
        <li>
          Referentie: een trail van 25 km met 1000 m D+, dus 25 + 1000 / 100 =
          35 km-effort, gefinisht in 3:00:00. Dat is 10.800 s / 35 = 5:09 per
          km-effort.
        </li>
        <li>Doel: 42 km met 2000 m D+, dus 42 + 20 = 62 km-effort.</li>
        <li>Ondergrens: 3:00:00 × (62 / 35)^1,06 = 5 u 30.</li>
        <li>Bovengrens: 3:00:00 × (62 / 35)^1,10 = 5 u 38.</li>
        <li>
          Dus 5 u 30 tot 5 u 38, ongeveer 5:20 per km-effort en gemiddeld 7,5
          km/u over de echte 42 km.
        </li>
      </ul>
      <p>
        De exponent 1,06 komt uit het werk van Riegel over records op de weg en
        de baan. De bovengrens van 1,10 is onze aanname voor de extra vertraging
        op lange dagen in het terrein, geen gepubliceerde waarde, en daarom is
        de uitkomst een venster en geen tijd tot op de minuut.
      </p>

      <h2>Zo gebruik je het in je training</h2>
      <p>
        Tel je week in km-effort en niet alleen in kilometers. Twaalf kilometer
        met 600 hoogtemeters is 18 km-effort: een week van 55 km met 2000 m D+
        is 75 km-effort, evenveel als 75 km op het vlakke, en een schema dat
        alleen kilometers telt, overbelast je zonder het te zeggen.
      </p>
      <p>
        Kies je lange duurlopen op km-effort. Is de doelwedstrijd 62 km-effort,
        dan zegt een lange duurloop van 30 tot 35 km-effort met een realistisch
        aandeel klimmen veel meer dan een vlakke 30 km. Houd de D+ per kilometer
        dicht bij die van de wedstrijd: rond 30 m/km op een glooiend parcours,
        60 m/km of meer voor een alpien parcours.
      </p>
      <p>
        Gebruik je tempo per km-effort als ruwe graadmeter van je conditie over
        verschillende parcoursen. Daalt je tempo per km-effort op vergelijkbaar
        terrein gedurende een trainingsblok, dan is dat een beter teken dan welk
        snel rondje ook. De{' '}
        <Link href="/nl/training-plans/trail">trailtrainingsschema’s</Link> zijn
        rond dit soort opbouw gemaakt, en voor de klimmen zelf vertelt het{' '}
        <Link href="/nl/learn/grade-adjusted-pace">
          hellingsgecorrigeerde tempo
        </Link>{' '}
        wat elke klim aan energie kostte.
      </p>

      <h2>Beperkingen</h2>
      <p>
        Eén regel voor alle hellingen is een vereenvoudiging. Op een flauwe,
        loopbare klim kosten 100 m D+ minder dan een kilometer; op een muur van
        25% waar je met stokken wandelt, kunnen ze meer kosten. De ondergrond
        telt nog zwaarder: stenen, wortels, modder, sneeuw en puin vertragen je
        veel meer dan het hoogteverschil doet vermoeden, en twee wedstrijden met
        dezelfde km-effort kunnen ver uit elkaar eindigen.
      </p>
      <p>
        Afdalingen negeren is de grootste blinde vlek. Op een parcours met
        lange, steile afdalingen bepalen in de tweede helft je bovenbenen het
        tempo, niet je longen, en km-effort ziet dat niet aankomen. Nacht,
        hoogte boven ongeveer 2000 m, hitte en de tijd bij verzorgingsposten
        vallen ook buiten de formule. Een referentie uit een wegwedstrijd gaat
        uit van loopbare paden en neemt je wegsnelheid mee de klimmen op: op
        technisch terrein finish je waarschijnlijk buiten het venster.
      </p>
      <p>
        Tot slot zegt km-effort niets over de UTMB- of ITRA-index, die eigen
        modellen gebruiken. Zie het als een gemeenschappelijke munt om te
        plannen, niet als een score.
      </p>
    </div>
  );
}
