import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentNl() {
  return (
    <div>
      <p>
        VMA staat voor <em>vitesse maximale aérobie</em>, de maximale aerobe
        snelheid. Engelstalige artikelen noemen het MAS of vVO2max: de laagste
        loopsnelheid waarbij je zuurstofopname haar plafond bereikt, je{' '}
        <Link href="/nl/learn/vo2max">VO2max</Link>. Loop je sneller, dan moet
        de extra energie uit anaerobe bronnen komen, en daarom kunnen de meeste
        lopers hun VMA maar 4 tot 8 minuten volhouden. De term komt uit de
        Franse trainingswereld, waar hij sinds de baantest van Luc Léger in 1980
        en het werk van Véronique Billat in de jaren negentig de ruggengraat van
        intervaltraining vormt. De aantrekkingskracht is praktisch: VO2max is
        een labwaarde in milliliters, VMA is een snelheid die je op de baan kunt
        lopen.
      </p>

      <h2>Hoe VMA wordt berekend</h2>
      <p>
        De meest directe veldmethode is de 6-minutentest (de halve Cooper). Na
        een warming-up van 20 minuten met een paar versnellingen loop je in 6
        minuten zo ver mogelijk, in een gelijkmatig tempo. Zes minuten valt
        binnen de tijd dat de meeste lopers hun VMA kunnen volhouden, dus je
        gemiddelde snelheid is er een goede schatting van:
      </p>
      <Formula
        where={[
          'afstand in meter, tijd in minuten; × 0,06 rekent m/min om naar km/u',
        ]}
      >
        VMA (km/u) = afstand / tijd × 0,06
      </Formula>
      <p>
        De 12-minutentest van Cooper is makkelijker in te delen maar valt iets
        te laag uit, omdat bijna iedereen na 6 of 7 minuten op die snelheid
        vertraagt. Progressieve tests (de baantest van Léger en Boucher, de
        VAMEVAL) verhogen de snelheid met 0,5 of 1 km/u op vaste momenten tot je
        het niet meer bijhoudt; de laatste voltooide trap geeft je VMA. Je hebt
        er een baan, pionnen en een geluidsopname voor nodig, maar het probleem
        van tempo-indeling verdwijnt.
      </p>
      <p>
        Je kunt ook terugrekenen vanuit een recente wedstrijd. Elke afstand
        wordt gelopen op een typisch deel van de VMA: ongeveer 95% voor een 5
        km, 90% voor een 10 km, 85% voor een halve marathon en 80% voor een
        marathon. Deel je gemiddelde wedstrijdsnelheid door dat deel. Een vlakke
        5 of 10 km geeft een betere schatting dan een marathon, waar voeding en
        hitte zwaarder wegen dan aeroob vermogen.
      </p>

      <h2>Een rekenvoorbeeld</h2>
      <ul>
        <li>6-minutentest: 1.500 m → 1.500 / 6 × 0,06 = 15,0 km/u (4:00/km)</li>
        <li>Coopertest, dezelfde loper: 2.900 m in 12 minuten → 14,5 km/u</li>
        <li>
          10 km in 45:00: gemiddelde snelheid 13,33 km/u, gedeeld door 0,90 →
          14,8 km/u
        </li>
      </ul>
      <p>
        Drie methoden, drie antwoorden binnen 0,5 km/u van elkaar. Die spreiding
        is normaal, en een herinnering dat VMA een schatting met een marge is,
        geen vaste eigenschap zoals je lengte. Neem 15 km/u en bouw daar je
        tempo’s op:
      </p>
      <ul>
        <li>100% VMA: 15,0 km/u, 4:00/km, 125 m in 30 seconden</li>
        <li>95%: 14,25 km/u, 4:13/km</li>
        <li>85% (voor veel lopers rond de drempel): 12,75 km/u, 4:42/km</li>
        <li>
          65 tot 75% (rustig lopen): 9,75 tot 11,25 km/u, 6:09 tot 5:20/km
        </li>
      </ul>

      <h2>Hoe je VMA in je training gebruikt</h2>
      <p>
        VMA is een meetlat voor intervaltrainingen. Klassieke vormen op of rond
        VMA: 30/30 (30 seconden op 100% VMA, 30 seconden rustig dribbelen) 10
        tot 20 keer herhaald, 6 × 1.000 m op 95% met 2 minuten herstel, 5 × 3
        minuten op 95 tot 100%. Billat liet zien dat de tijd tot uitputting op
        VMA sterk verschilt tussen lopers van hetzelfde niveau (Billat en
        Koralsztein, 1996), en daarom kun je met korte herhalingen en korte
        pauzes meer minuten op die intensiteit verzamelen dan met één lange
        inspanning.
      </p>
      <p>
        Onder de VMA worden percentages minder betrouwbaar. Twee lopers met 15
        km/u kunnen hun drempel op 82% en op 90% van de VMA hebben, afhankelijk
        van uithoudingsvermogen en trainingsgeschiedenis. Voor tempolopen en
        lange duurlopen zijn hartslag (zie de{' '}
        <Link href="/nl/tools/heart-rate-zones">
          calculator voor hartslagzones
        </Link>
        ) of tempo’s op basis van wedstrijden, zoals{' '}
        <Link href="/nl/learn/vdot">VDOT</Link>, vaak een betere leidraad. De{' '}
        <Link href="/nl/tools/vma">VMA-calculator</Link> maakt van een test of
        wedstrijd tempo’s, en de{' '}
        <Link href="/nl/pace-charts">tempotabellen</Link> rekenen ze om per
        kilometer.
      </p>
      <p>
        In OpenAthlete is VMA een van je capaciteitswaarden. Stappen in een
        training kunnen een percentage ervan als doel hebben (bijvoorbeeld 95%
        van de VMA), en de training gaat dan met echte tempo’s naar je horloge
        van Garmin, Suunto of COROS.
      </p>

      <h2>Beperkingen</h2>
      <p>
        VMA hangt af van de test: een loopband, een baan, een heuvelachtige weg
        en een winderige dag geven allemaal andere getallen, en slecht
        ingedeelde 6 minuten kunnen 0,5 km/u kosten. Het mengt ook twee dingen,
        VO2max en loopeconomie: twee lopers met dezelfde VO2max kunnen een VMA
        hebben die 1 tot 2 km/u verschilt als de een zuiniger loopt. Tot slot
        zegt VMA weinig over uithoudingsvermogen. Een loper met een hoge VMA en
        weinig kilometers zakt in tijdens een halve marathon die een loper met
        een lagere VMA en meer kilometers comfortabel volhoudt. Gebruik het om
        intervaltempo’s te bepalen, test elke twee à drie maanden opnieuw, en
        laat wedstrijden je de rest vertellen.
      </p>
    </div>
  );
}
