import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentNl() {
  return (
    <div>
      <p>
        Session RPE is de eenvoudigste maat voor trainingsbelasting die in
        onderzoek overeind blijft: geef aan hoe zwaar de hele training was op
        een schaal van 0 tot 10, vermenigvuldig met de duur in minuten, en je
        hebt een belasting in willekeurige eenheden. Carl Foster en collega’s
        beschreven de methode eind jaren negentig en testten haar in 2001 tegen
        hartslagmethoden. Je hebt geen sensor nodig, het werkt voor elke sport,
        ook voor kracht- en techniektrainingen, en het vangt dingen op die
        hartslag niet ziet, zoals zware benen na een afdaling of de mentale
        kosten van een wedstrijd.
      </p>

      <h2>Hoe session RPE wordt berekend</h2>
      <Formula
        where={[
          'RPE: score voor ervaren inspanning van de hele training, op de categorie-ratioschaal 0–10 (CR-10)',
          'minuten: totale duur van de training, inclusief warming-up en cooling-down',
          'resultaat in willekeurige eenheden (AU)',
        ]}
      >
        trainingsbelasting = RPE × minuten
      </Formula>
      <p>
        De schaal is een versie van Borgs CR-10: 0 is rust, 1 heel licht, 3
        matig, 5 zwaar, 7 heel zwaar, 10 maximaal. De vraag gaat over de
        training als geheel, niet over het zwaarste interval of hoe je je nu
        voelt. Fosters protocol vraagt om de score ongeveer 30 minuten na
        afloop, als de laatste inspanning het antwoord niet meer overheerst. In
        de praktijk werkt een score bij het uploaden van de activiteit, op
        dezelfde dag, goed genoeg als je het consequent doet.
      </p>

      <h2>Een rekenvoorbeeld</h2>
      <p>De week van een loper, training voor training gescoord:</p>
      <ul>
        <li>Dinsdag, 60 min met 5 × 4' op drempeltempo, RPE 7: 420 AU</li>
        <li>Woensdag, 45 min rustig, RPE 3: 135 AU</li>
        <li>Donderdag, 50 min stevige duurloop, RPE 4: 200 AU</li>
        <li>Zaterdag, 100 min lange duurloop, RPE 5: 500 AU</li>
        <li>Zondag, 40 min herstelloopje, RPE 2: 80 AU</li>
      </ul>
      <p>
        De weekbelasting is 1.335 AU. De drempeltraining is 15% van de
        trainingstijd maar bijna een derde van de belasting, en dat klopt met
        hoe de meeste lopers hun week zouden omschrijven. Foster (1998) leidde
        uit de dagwaarden ook twee weekindicatoren af. Monotonie is de
        gemiddelde dagbelasting gedeeld door de standaardafwijking: hier 191 /
        184 ≈ 1,0, met twee rustdagen en echt contrast tussen zware en lichte
        dagen. Strain is weekbelasting × monotonie, ongeveer 1.390. Elke dag
        dezelfde matige hoeveelheid trainen drijft de monotonie op, en in de
        gegevens van Foster volgden ziektes vaak op weken met een hoge strain.
      </p>

      <h2>Hoe je het in je training gebruikt</h2>
      <p>
        Scoor elke training, ook de rustige en die in de sportschool. Gaten
        maken het weektotaal betekenisloos. Kijk daarna naar trends: een week
        die 30% boven je recente weken ligt is een sprong, wat het absolute
        getal ook is. De geplande inspanning vergelijken met de gescoorde zegt
        vaak meer dan de belasting zelf. Een rustige duurloop die een 5 krijgt
        in plaats van een 3, of een drempeltraining die als een 9 voelde, zegt
        iets over vermoeidheid, hitte of ziekte voordat welke curve dan ook het
        laat zien.
      </p>
      <p>
        Session RPE werkt ook het best naast een objectieve maat. Als de{' '}
        <Link href="/nl/learn/trimp">TRIMP</Link> gelijk blijft terwijl session
        RPE stijgt voor dezelfde trainingen, betaalt het lichaam meer voor
        dezelfde prestatie. Trainers gebruiken precies dat verschil om de
        volgende dagen bij te sturen.
      </p>
      <p>
        In OpenAthlete heeft elke activiteit een RPE van 0 tot 10, en een
        trainer kan die verplicht maken voordat een training als voltooid telt.
        Het overzicht van de trainingsbelasting toont session RPE (RPE ×
        minuten) naast de TRIMP op basis van hartslag. Als de AI-functies aan
        staan, kunnen een paar korte vragen na een activiteit de RPE invullen op
        basis van het antwoord van de sporter. Meer op de{' '}
        <Link href="/nl/features/training-load">
          pagina over trainingsbelasting
        </Link>
        .
      </p>

      <h2>Beperkingen</h2>
      <p>
        Het is subjectief, en dat is tegelijk het punt en de zwakte. Scores
        schuiven mee met stemming, motivatie en ervaring; beginners proppen
        alles vaak in 4 tot 7. De willekeurige eenheden zijn niet om te rekenen
        naar TRIMP of TSS, dus zonder herschaling kun je de getallen niet in
        dezelfde curve mengen. Duur weegt lineair: een rustige fietstocht van 3
        uur op RPE 3 (540 AU) scoort hoger dan een harde intervaltraining van 40
        minuten op RPE 8 (320 AU), wat klopt voor de totale belasting maar niet
        voor de specifieke prikkel van intensiteit. En een score zegt niets over
        waarom de training zwaar was. Het overzicht van Haddad en collega’s
        (2017) vindt session RPE valide in veel sporten, met correlaties met
        hartslagmethoden die over het algemeen goed maar verre van perfect zijn.
        Gebruik het als een second opinion die altijd beschikbaar is, niet als
        het enige getal.
      </p>
    </div>
  );
}
