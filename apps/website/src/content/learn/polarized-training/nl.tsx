import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentNl() {
  return (
    <div>
      <p>
        Gepolariseerd trainen beschrijft een manier om trainingsintensiteit te
        verdelen: het grootste deel van het volume duidelijk rustig, een kleiner
        maar echt deel duidelijk hard, en heel weinig daartussen. Het idee kwam
        niet uit een labprotocol, maar uit het observeren van wat topsporters in
        duursporten werkelijk doen. Bij het doornemen van de beschrijvende
        studies zag Stephen Seiler dat nationaal en internationaal presterende
        duursporters die 10 tot 13 keer per week trainen, meestal uitkomen op
        ongeveer 80% van hun trainingen op lage intensiteit en ongeveer 20% die
        gedomineerd worden door hard werk, zoals intervallen rond 90% van de
        VO2max (Seiler, 2010).
      </p>
      <p>
        Dat patroon wordt vaak afgekort tot “80/20”. De korte versie verbergt
        twee details die ertoe doen: welke zones je telt, en of je trainingen of
        minuten telt.
      </p>

      <h2>De drie zones erachter</h2>
      <p>
        Gepolariseerd trainen gebruikt een model met drie zones, gebaseerd op
        twee fysiologische drempels. Zone 1 ligt onder de eerste ventilatoire
        drempel of{' '}
        <Link href="/nl/learn/lactate-threshold">lactaatdrempel</Link>{' '}
        (bloedlactaat rond 2 mmol/l): rustig lopen waarbij je in volzinnen kunt
        praten. Zone 2 ligt tussen de twee drempels. Zone 3 ligt boven de tweede
        drempel (rond 4 mmol/l, dicht bij de{' '}
        <Link href="/nl/learn/critical-speed">kritieke snelheid</Link>), waar de
        intervallen thuishoren.
      </p>
      <p>
        Let op de naamsverwarring. In de vijfzonesystemen van de meeste horloges
        betekent “<Link href="/nl/learn/zone-2">zone 2</Link>” rustige duur, en
        die valt binnen zone 1 van het driezonemodel. Gepolariseerd trainen zegt
        niet dat je rustige zone 2-loopjes moet vermijden; het zegt dat je
        weinig tijd tussen de drempels moet doorbrengen.
      </p>

      <h2>Er een getal op plakken</h2>
      <p>
        Treff en collega’s (2019) stelden een polarisatie-index voor om een
        gepolariseerde verdeling van de andere te onderscheiden, op basis van
        het aandeel trainingstijd (of afstand) in elk van de drie zones:
      </p>
      <Formula
        where={[
          'Z1, Z2, Z3 = aandeel van de totale trainingstijd in elke zone (0,80 voor 80%), Z1 + Z2 + Z3 = 1',
          'Geldig als Z1 > Z3 > Z2. Als Z3 = 0, dan PI = 0. Als Z2 = 0, gebruik 0,01 voor Z2 en Z3 − 0,01 voor Z3',
          'PI > 2,00: gepolariseerd. PI ≤ 2,00: niet gepolariseerd',
        ]}
      >
        PI = log10(Z1 / Z2 × Z3 × 100)
      </Formula>

      <h2>Een rekenvoorbeeld</h2>
      <p>
        Een loper traint 8 uur per week. Over een maand is de tijd in de zones
        gemiddeld 80% in zone 1, 5% in zone 2 en 15% in zone 3.
      </p>
      <ul>
        <li>Z1 / Z2 = 0,80 / 0,05 = 16</li>
        <li>16 × 0,15 × 100 = 240</li>
        <li>PI = log10(240) = 2,38, boven 2,00: gepolariseerd</li>
      </ul>
      <p>
        Verander de mix naar 75% / 20% / 5%, een piramide met veel tempolopen en
        weinig intervallen: PI = log10(0,75 / 0,20 × 0,05 × 100) = log10(18,75)
        = 1,27. Een drempelzwaar blok van 60% / 35% / 5% geeft 0,93. Dezelfde
        uren per week, drie heel verschillende weken.
      </p>

      <h2>Trainingen of minuten</h2>
      <p>
        Seilers 80/20 telt trainingen. Tijd in de zones geeft een ander beeld,
        omdat een harde training grotendeels uit warming-up, herstelpauzes en
        cooling-down bestaat. Een training van 70 minuten met 5 × 4' op 3 tot 5
        km-tempo bevat 20 minuten werk, en omdat de hartslag achterloopt op het
        tempo, wordt daar nog minder van in zone 3 geregistreerd. Seiler en
        Kjerland (2006) maten het op beide manieren bij elf junior-langlaufers
        gedurende 32 dagen: op basis van hartslag verdeelden hun duurtrainingen
        zich 75% / 8% / 17% over de drie zones, en session RPE gaf bijna
        hetzelfde resultaat. Vier rustige duurlopen van een uur plus die
        intervaltraining maken een week die 80/20 is in trainingen, maar slechts
        20 van de 310 minuten, ongeveer 6%, zijn hard. Geen van beide is fout,
        maar vergelijk appels met appels.
      </p>

      <h2>Hoe je het gebruikt</h2>
      <p>
        Voor een loper met vijf of zes trainingen per week kan een
        gepolariseerde week er zo uitzien: drie of vier rustige duurlopen en een
        lange duurloop, allemaal onder de eerste drempel, plus een of twee harde
        trainingen zoals 5 × 4' of 6 × 3' op 3 tot 5 km-tempo met even lange
        dribbelpauzes. De rustige dagen moeten rustig blijven, wat voor de
        meeste mensen langzamer betekent dan ze zouden willen; leg het plafond
        vast met de{' '}
        <Link href="/nl/tools/heart-rate-zones">
          calculator voor hartslagzones
        </Link>{' '}
        of de praattest. De statistieken van OpenAthlete tonen het aandeel
        training onder, tussen en boven je drempels, en dat is genoeg om te zien
        wat voor week je echt hebt gelopen.
      </p>

      <h2>Beperkingen</h2>
      <p>
        De sterkste gecontroleerde onderbouwing komt van Stöggl en Sperlich
        (2014): 48 goed getrainde lopers, wielrenners, triatleten en langlaufers
        volgden negen weken lang een van vier programma’s, en de gepolariseerde
        groep verbeterde de VO2peak met 11,7% en de tijd tot uitputting met
        17,4%, meer dan de groepen met hoog volume, drempeltraining of
        intervallen. Negen weken en 48 sporters verdeeld over vier groepen is
        een korte en kleine studie, en de deelnemers waren al fit. Seiler (2010)
        noemt het 80/20-patroon zelf beschrijvend: het is waar succesvolle
        sporters op uitkomen, geen bewijs dat het voor iedereen optimaal is. Een
        loper met vier uur per week heeft misschien meer aan wat drempelwerk dan
        aan strikte polarisatie; die vraag is nog open. Tot slot hangen de zones
        af van drempels die je moet testen of schatten, en een fout van 10
        slagen per minuut verschuift minuten van de ene zone naar de andere.
      </p>
    </div>
  );
}
