import Link from 'next/link';

import { Sources } from './sources';

export function ContentNl() {
  return (
    <div>
      <p>
        Je loopt al twee maanden ongeveer 40 km per week. Je marathon is over 16
        weken en je zou willen dat je grootste weken 70 km halen. Dit artikel
        gaat erover hoe je van het ene getal naar het andere komt zonder week 9
        door te brengen met een zak ijs op je scheenbeen. Het is bewust
        praktisch: wat onderzoek wel en niet zegt over belasting en blessures,
        lees je in{' '}
        <Link href="/nl/blog/preventing-training-injuries">
          hardloopblessures en trainingsbelasting
        </Link>
        .
      </p>

      <h2>De 10%-regel is een verzonnen plafond</h2>
      <p>
        Niemand weet precies waar de 10%-regel vandaan komt, en hij is minder
        vaak getest dan zijn bekendheid doet vermoeden. Toen Nederlandse
        onderzoekers 532 beginnende lopers ofwel een standaardschema van 8 weken
        gaven, ofwel een trager schema van 13 weken gebaseerd op stappen van
        10%, waren de blessurecijfers gelijk: ongeveer één op de vijf lopers in
        elke groep (Buist et al., 2008). Een Deens cohort van 874 beginners vond
        pas een mogelijk signaal boven 30% over twee weken, en zelfs dat was
        twijfelachtig (Nielsen et al., 2014).
      </p>
      <p>
        De regel faalt bovendien in beide richtingen. Bij een laag volume is hij
        absurd traag: 20 km per week wordt 22. Bij een hoger volume, elke week
        zonder pauze toegepast, stapelt hij zich op. Veertig kilometer plus 10%
        per week gedurende tien weken is 104 km. Niemand zou dat moeten doen, en
        toch is dat wat de regel zegt.
      </p>
      <p>
        Wat het bewijs en de IOC-consensus over belasting (Soligard et al.,
        2016) wel ondersteunen, is het algemene idee: geleidelijk opbouwen,
        plotselinge grote sprongen vermijden en je aanpassen aan de persoon voor
        je. De rest is coachingsinzicht, en dat benoem ik ook zo.
      </p>

      <h2>Hoe ik volume in plaats daarvan opbouw</h2>
      <p>
        <strong>Een stap, dan vasthouden.</strong> Doe er een flinke stap bij,
        zeg 4 tot 6 km of 30 minuten, en blijf dan een week of twee op dat
        niveau voor de volgende stap. In mijn ervaring verwerken lopers een
        niveau dat ze herhaald hebben beter dan elke week een nieuw record. Dat
        is observatie, geen onderzoeksdata.
      </p>
      <p>
        <strong>Elke derde of vierde week een lichtere week.</strong> Verlaag
        het volume met ongeveer een kwart tot een derde en houd één korte
        kwaliteitstraining aan, bijvoorbeeld 6 × 1&apos; snel op woensdag, zodat
        je niet futloos aan het volgende blok begint. Voor het exacte percentage
        is geen sterke studie. Voor de gewoonte om die week te plannen voordat
        je hem nodig hebt wel.
      </p>
      <p>
        <strong>Eén nieuw ding tegelijk.</strong> Doe er geen 6 km bij in
        dezelfde week als je eerste baantraining van het seizoen, je eerste
        lange heuvelachtige trail of een nieuw paar schoenen met minder drop. De
        Run Clever-studie vond vergelijkbare blessurecijfers bij het opbouwen
        van intensiteit of het opbouwen van volume (Ramskov et al., 2018). Beide
        tegelijk opbouwen was niet de vraag, en ik zou me niet aanmelden om het
        uit te zoeken.
      </p>
      <p>
        <strong>Laat de duurloop apart groeien.</strong> Tien tot vijftien
        minuten meer elke keer dat hij langer wordt, en aan het begin van een
        opbouw maximaal ongeveer een derde van de week. Een loper die 40 km per
        week loopt met een duurloop van 25 km stopt het grootste deel van de
        week in één training.
      </p>
      <p>
        <strong>Tel wat je echt belast.</strong> Op de weg zijn kilometers een
        redelijke benadering. Op trails tellen tijd en hoogtemeters: 1.000 m
        afdalen in een week is een belasting die geen afstandsgetal vangt, en je
        quadriceps melden het met twee dagen vertraging.
      </p>
      <p>
        <strong>Respecteer pauzes.</strong> Na een paar dagen rust ga je gewoon
        verder. Na twee of drie weken rust begin ik opnieuw op de helft tot twee
        derde van het vorige volume en bouw ik over drie of vier weken weer op.
        Je recente gemiddelde is gedaald, ook al is je herinnering eraan dat
        niet.
      </p>

      <h2>Een voorbeeld van 16 weken</h2>
      <p>
        Zo zou de opbouw van 40 naar 70 km eruit kunnen zien. De duur van de
        duurlopen gaat uit van een rustig tempo rond 6:00 per km.
      </p>
      <table>
        <thead>
          <tr>
            <th>Week</th>
            <th>Volume</th>
            <th>Duurloop</th>
            <th>Opmerking</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td>40 km</td>
            <td>1h20</td>
            <td>Huidig niveau</td>
          </tr>
          <tr>
            <td>2</td>
            <td>44 km</td>
            <td>1h30</td>
            <td>Eerste stap</td>
          </tr>
          <tr>
            <td>3</td>
            <td>44 km</td>
            <td>1h30</td>
            <td>Vasthouden</td>
          </tr>
          <tr>
            <td>4</td>
            <td>34 km</td>
            <td>1h15</td>
            <td>Lichtere week</td>
          </tr>
          <tr>
            <td>5</td>
            <td>48 km</td>
            <td>1h40</td>
            <td></td>
          </tr>
          <tr>
            <td>6</td>
            <td>52 km</td>
            <td>1h45</td>
            <td></td>
          </tr>
          <tr>
            <td>7</td>
            <td>52 km</td>
            <td>1h50</td>
            <td>Vasthouden</td>
          </tr>
          <tr>
            <td>8</td>
            <td>40 km</td>
            <td>1h30</td>
            <td>Lichtere week</td>
          </tr>
          <tr>
            <td>9</td>
            <td>56 km</td>
            <td>2h00</td>
            <td></td>
          </tr>
          <tr>
            <td>10</td>
            <td>60 km</td>
            <td>2h05</td>
            <td></td>
          </tr>
          <tr>
            <td>11</td>
            <td>60 km</td>
            <td>2h15</td>
            <td>Vasthouden</td>
          </tr>
          <tr>
            <td>12</td>
            <td>46 km</td>
            <td>1h40</td>
            <td>Lichtere week</td>
          </tr>
          <tr>
            <td>13</td>
            <td>65 km</td>
            <td>2h20</td>
            <td></td>
          </tr>
          <tr>
            <td>14</td>
            <td>70 km</td>
            <td>2h30</td>
            <td>Piek</td>
          </tr>
          <tr>
            <td>15</td>
            <td>52 km</td>
            <td>1h45</td>
            <td>Taper</td>
          </tr>
          <tr>
            <td>16</td>
            <td>30 km + wedstrijd</td>
            <td>Wedstrijd</td>
            <td>Wedstrijdweek</td>
          </tr>
        </tbody>
      </table>
      <p>
        Kijk naar week 5. Vergeleken met de lichtere week 4 is dat een sprong
        van 41%, die in een app op basis van belastingsratio's elk alarm zou
        laten afgaan. Vergeleken met week 2 en 3, het niveau waarop de loper
        echt trainde, is het 9%. Vergelijk een nieuwe week met de training van
        vóór de herstelweek, niet met de herstelweek zelf.
      </p>
      <p>
        Let ook op wat het schema niet doet: het verhoogt nooit het volume en
        voegt een nieuw soort training toe in dezelfde week, en de piek ligt
        twee weken voor de wedstrijd, niet één. Is je doelwedstrijd een
        heuvelachtige trail, vervang kilometers dan door uren en voeg een kolom
        voor hoogtemeters toe.
      </p>

      <h2>Waarmee je een week vergelijkt</h2>
      <p>
        Wil je één getal, vergelijk deze week dan met het gemiddelde van de drie
        of vier weken ervoor, zonder deze week in dat gemiddelde mee te tellen.
        Gebruik het als aanleiding om beter te kijken, niet als oordeel. De
        populaire acute:chronische belastingsratio (ACWR) en zijn „sweet spot”
        van 0,8 tot 1,3 zijn zwaar bekritiseerd, onder meer om precies dat
        probleem van dubbeltellen (Impellizzeri et al., 2020). Er is geen
        gevalideerde drempel, niet voor jou en niet voor iemand anders.
      </p>

      <h2>Wanneer je vasthoudt of terugschakelt</h2>
      <p>
        Stop met opbouwen, en meestal ook een paar dagen met lopen, als een pijn
        je manier van lopen verandert, erger wordt tijdens een loop of de
        volgende ochtend erger is. Pijn op één precieze plek van een bot, zoals
        het scheenbeen of de bovenkant van de voet, verdient een professionele
        mening vóór de volgende loop, niet na de volgende drie.
      </p>
      <p>
        Houd het huidige niveau vast, of neem de lichtere week eerder, als
        rustige loopjes meerdere dagen achter elkaar zwaarder voelen dan
        normaal, als hetzelfde rustige tempo je meer hartslag kost, of als je
        slaap slechter is geworden. Dat zijn de vroege signalen die beschreven
        staan in{' '}
        <Link href="/nl/blog/5-signs-of-overtraining-and-how-to-avoid-it">
          overtraining en overreaching
        </Link>
        . Een stap een week later zetten kost je bijna niets. Een stressfractuur
        kost je de wedstrijd.
      </p>

      <h2>Plannen in OpenAthlete</h2>
      <p>
        Met de seizoensweergave in OpenAthlete kun je een opbouw zoals hierboven
        tekenen als blokken (basis, specifiek, taper, herstel) met je wedstrijd
        erboven, en elke week toont zijn belasting ten opzichte van een bereik
        dat uit je recente weken is berekend. Dat bereik is een vuistregel om
        een week te plaatsen, geen veiligheidsgrens. Fitheid, vermoeidheid en
        vorm worden doorgerekend over de trainingen die je hebt gepland, zodat
        je ziet wat een lichtere week met je vorm doet voordat je hem loopt.
        Pijn die je noemt in de optionele vragen na een activiteit komt in een
        blessurelogboek dat je coach kan zien. Meer op de pagina's{' '}
        <Link href="/nl/features/training-calendar">trainingskalender</Link> en{' '}
        <Link href="/nl/features/training-load">trainingsbelasting</Link>.
      </p>

      <h2>Bronnen</h2>
      <Sources />
    </div>
  );
}
