import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentNl() {
  return (
    <div>
      <p>
        Functional threshold power, of FTP, is het hoogste vermogen in watt dat
        je ongeveer een uur in een min of meer stabiele toestand kunt volhouden.
        Andrew Coggan definieerde het als praktische vervanger van de drempels
        uit het lab, en het boek <em>Training and Racing with a Power Meter</em>{' '}
        van Hunter Allen en Coggan maakte het tot het ijkpunt van de meeste
        wielertraining: zones, trainingen en belastingsscores worden allemaal
        uitgedrukt als percentage ervan. Vermogensmeters voor hardlopers hebben
        hetzelfde idee sindsdien naar het hardlopen gebracht.
      </p>
      <p>
        FTP is een veldwaarde, gemeten met een vermogensmeter en een zware
        inspanning, geen fysiologische grens die in een lab wordt bepaald. De
        naaste verwant in de inspanningsfysiologie is het kritisch vermogen, dat
        de moeite waard is om ernaast te begrijpen, omdat de twee vaak binnen
        een paar watt van elkaar uitkomen en toch niet hetzelfde zijn.
      </p>

      <h2>Zo wordt FTP geschat</h2>
      <p>
        De oorspronkelijke definitie is het gemiddelde vermogen van een tijdrit
        van een uur. Weinig mensen willen dat vaak doen, dus de gangbare test is
        20 minuten voluit, meestal voorafgegaan door een zware inspanning van 5
        minuten om je anaerobe reserve wat af te romen, met de uitkomst 5% naar
        beneden bijgesteld:
      </p>
      <Formula
        where={[
          'P20 = gemiddeld vermogen van een inspanning van 20 minuten voluit, in watt',
        ]}
      >
        FTP ≈ 0,95 × P20
      </Formula>
      <p>
        De factor 0,95 is een gemiddelde correctie voor het feit dat je 20
        minuten harder kunt trappen dan 60. Bij sommige renners klopt hij goed,
        bij andere slecht, zoals de beperkingen hieronder laten zien.
      </p>

      <h2>Kritisch vermogen</h2>
      <p>
        Het kritisch vermogen komt van Monod en Scherrer (1965). Zet je beste
        inspanningen uit als totale arbeid tegen tijd en tussen ongeveer 2 en 20
        minuten liggen de punten op een rechte lijn. De helling is het kritisch
        vermogen (CP); het snijpunt, W′ (‘W-accent’), is een vaste hoeveelheid
        arbeid die je boven CP kunt leveren voordat je moet vertragen:
      </p>
      <Formula
        where={[
          'CP = kritisch vermogen, in watt',
          'W′ = arbeidscapaciteit boven CP, in joule',
          't = duur van de inspanning, in seconden',
        ]}
      >
        P(t) = CP + W′ / t
      </Formula>
      <p>
        Fysiologisch markeert CP de grens tussen het zware domein, waarin
        zuurstofopname en bloedlactaat zich stabiliseren, en het zeer zware
        domein, waarin ze blijven stijgen tot je stopt (Poole et al., 2016).
        Boven CP kost elke seconde wat W′; eronder vult W′ zich langzaam weer
        aan. Het equivalent bij hardlopen, met snelheid in plaats van vermogen,
        is de <Link href="/nl/learn/critical-speed">kritische snelheid</Link>.
      </p>

      <h2>Een rekenvoorbeeld</h2>
      <p>
        Een renner trapt gemiddeld 262 W tijdens een test van 20 minuten. De
        beste inspanningen uit recente ritten zijn 340 W gedurende 3 minuten,
        310 W gedurende 5, 275 W gedurende 12 en die 262 W gedurende 20.
      </p>
      <ul>
        <li>FTP ≈ 0,95 × 262 = 249 W</li>
        <li>
          Arbeid tegen tijd uitzetten voor de vier inspanningen (61,2, 93,0,
          198,0 en 314,4 kJ) geeft CP = 248 W en W′ = 18,0 kJ
        </li>
        <li>
          Voorspeld vermogen over 10 minuten: 248 + 17.965 / 600 = 278 W, in
          lijn met de beste 5 en 12 minuten aan weerszijden
        </li>
        <li>
          Een demarrage op 400 W kost 400 − 248 = 152 joule W′ per seconde, dus
          17.965 / 152 ≈ 118 seconden voordat de reserve leeg is
        </li>
      </ul>
      <p>
        Hier komen FTP en CP binnen een watt overeen. In groepen is dat
        gebruikelijk, voor individuen onbetrouwbaar: bij 17 getrainde renners
        vonden Karsten et al. (2021) gemiddeld een CP van 256 W en een FTP van
        249 W, maar het verschil per renner liep van ongeveer 19 W de ene kant
        op tot 33 W de andere.
      </p>

      <h2>Zo gebruik je FTP in je training</h2>
      <p>
        De klassieke vermogenszones van Coggan zijn percentages van FTP. Met 249
        W: duur (56–75%) is 139 tot 187 W, tempo (76–90%) 189 tot 224 W, drempel
        (91–105%) 227 tot 261 W en VO2max-werk (106–120%) 264 tot 299 W.
        Typische trainingen volgen daaruit:
      </p>
      <ul>
        <li>
          2 × 20 minuten op 95–100% van FTP (237 tot 249 W), 5 minuten rustig
        </li>
        <li>3 × 12 minuten op 100–105% met 4 minuten herstel</li>
        <li>5 × 4 minuten op 110–120% (274 tot 299 W), even lang herstel</li>
        <li>Lange duurritten van 2 tot 4 uur onder 75%</li>
      </ul>
      <p>
        CP en W′ voegen iets toe wat FTP niet doet: ze vertellen hoe lang je
        boven je drempel kunt blijven. Dat helpt bij het indelen van een klim,
        een korte tijdrit of een wedstrijd met herhaalde versnellingen. Test
        elke zes tot acht weken opnieuw, of eerder als drempeltrainingen te
        makkelijk of onhaalbaar aanvoelen.
      </p>
      <p>
        In OpenAthlete is FTP voor fietsen en hardlopen een waarde die je
        invoert of synchroniseert; de app neemt zelf geen test af. Stappen in de{' '}
        <Link href="/nl/features/workout-builder">trainingsbouwer</Link> kunnen
        mikken op een percentage van FTP of van het kritisch vermogen. De
        weergave Capaciteiten in de statistieken bepaalt het kritisch vermogen
        uit je beste fietsvermogens tussen 2 en 20 minuten en toont een
        95%-interval: die toptijden komen uit trainingen, niet uit maximale
        tests, dus de uitkomst is hoogstens wat ze laten zien.
      </p>

      <h2>Beperkingen</h2>
      <p>
        Het uur in de definitie is rekbaar. Toen Borszcz et al. (2018) 23
        getrainde renners vroegen om op hun 20-minuten-FTP te fietsen tot ze
        niet meer konden, hielden ze het gemiddeld 50,9 minuten vol, met een
        standaardafwijking van bijna 16 minuten: sommigen gingen ruim over het
        uur, anderen stopten na ongeveer de helft. Renners met een grote
        anaerobe capaciteit krijgen uit de 20-minutentest een te hoge FTP,
        dieseltypes een te lage.
      </p>
      <p>
        Ook de testomstandigheden verschuiven het getal: binnen warmte zonder
        genoeg koeling, een verkeerde indeling, vermoeidheid, motivatie. Het
        kritisch vermogen heeft eigen zwakke punten. Het hangt af van welke
        duren je erin stopt, het werkt niet buiten ruwweg 2 tot 20 minuten, en
        inspanningen uit gewone ritten zijn zelden voluit. Geen van beide
        getallen zegt iets over duurzaamheid, hoeveel van dat vermogen er na
        drie uur in het zadel nog over is. Voor intensiteit in hartslag, zie{' '}
        <Link href="/nl/learn/heart-rate-reserve">hartslagreserve</Link>; voor
        de labdrempels die FTP probeert te benaderen, zie{' '}
        <Link href="/nl/learn/lactate-threshold">lactaatdrempel</Link>.
      </p>
    </div>
  );
}
