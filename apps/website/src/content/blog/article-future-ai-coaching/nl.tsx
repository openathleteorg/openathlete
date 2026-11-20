import Link from 'next/link';

import { Sources } from './sources';

export function ContentNl() {
  return (
    <div>
      <p>
        Een paar jaar geleden betekende „AI-coaching” meestal een chatbot die
        een algemeen schema van twaalf weken schreef en je vergat zodra je het
        tabblad sloot. Wat sindsdien veranderd is, is niet dat taalmodellen
        training ineens beter begrijpen. Het is dat ze nu kunnen handelen: je
        kalender openen, de activiteiten van vorige maand lezen en trainingen in
        het plan zetten dat je horloge morgenochtend downloadt. Dat is wat
        mensen bedoelen met agents, en het is de moeite waard om rustig te
        bekijken wat dat voor coaches verandert en wat niet.
      </p>

      <h2>Wat MCP is, in het kort</h2>
      <p>
        Het Model Context Protocol is een open standaard, in november 2024
        geïntroduceerd door Anthropic, waarmee een AI-client zoals Claude of
        ChatGPT tools kan aanroepen die een andere applicatie aanbiedt. Een
        trainingsplatform kan tools aanbieden als „lees de kalender voor deze
        weken”, „haal de trainingsbelasting op”, „plan deze trainingen” of
        „verplaats deze training naar donderdag”. Het model beslist welke tools
        het aanroept en in welke volgorde. De applicatie beslist waar het model
        aan mag komen, en controleert elk verzoek zoals ze een klik van de
        gebruiker zou controleren.
      </p>
      <p>
        Die scheiding is belangrijk. Het model levert de taal en het redeneren;
        het platform houdt de data, de rechten en de regels. Een model dat je
        verkeerd begrijpt, kan iets doms voorstellen, maar kan niet bij iets
        komen wat het platform niet openstelt.
      </p>

      <h2>Een realistische maandag</h2>
      <p>
        Neem een coach met vijftien atleten. Op maandagochtend schrijft een van
        hen, negen weken voor een marathon, dat ze sinds zaterdag griep heeft en
        op zijn vroegst donderdag terug verwacht te zijn. Het gebruikelijke
        werk: haar kalender openen, vijf of zes trainingen verwijderen of
        verplaatsen, de rest van de week herschrijven, de duurloop inkorten en
        checken of de week erna nog klopt. Tien of vijftien minuten, en het is
        het derde zo'n bericht van de dag.
      </p>
      <p>
        Met een agent die aan het platform gekoppeld is, kan de coach schrijven:
        „Anna is sinds zaterdag ziek, waarschijnlijk tot donderdag. Leg het
        vast, houd alles rustig tot zondag, verplaats de 3 × 15 minuten op
        marathontempo van zaterdag naar volgende dinsdag en maak van de duurloop
        op zondag 1u15 rustig.” De agent legt de ziekte vast, leest de kalender,
        voert de wijzigingen door en meldt terug. De coach bekijkt de week in de
        kalender, past één ding aan en gaat verder.
      </p>
      <p>
        Let op wie de beslissingen nam. Elke keuze in die instructie (hoe lang
        het rustig blijft, welke training belangrijk genoeg is om te
        verplaatsen, hoe lang de duurloop moet zijn) kwam van de coach. De agent
        deed het klikwerk. Dat is de eerlijke versie van wat agents coaching
        vandaag bieden: de administratieve helft van het werk wordt veel
        goedkoper, en de helft waar het om oordeelsvermogen gaat, blijft waar ze
        was.
      </p>

      <h2>Waar agents nog slecht in zijn</h2>
      <p>
        <strong>Weten wat ze niet weten.</strong> Een agent plant een blok, ook
        als de data mager is: geen hartslag bij de helft van de lopen, geen
        inspanningsscores, een week reizen die niemand noemde. Impellizzeri en
        collega's betogen al jaren dat interne belasting, hoe zwaar de training
        voor deze atleet was, de aanpassing aandrijft, en juist dat deel
        ontbreekt het vaakst in de data. Een coach ziet het gat. Een model is
        geneigd het met aannames te vullen.
      </p>
      <p>
        <strong>Oordeel op lange termijn.</strong> Of er een derde
        kwaliteitstraining bij moet, wanneer de taper begint, of deze atleet nu
        een herstelweek nodig heeft of er nog een aankan: dat hangt af van jaren
        geschiedenis, van werk en gezin, van hoe iemand op vermoeidheid
        reageert. Toen Düking en collega's (2024) coachingexperts loopschema's
        van ChatGPT lieten beoordelen, werden de schema's veel beter met meer
        invoerinformatie, maar werden ze nog steeds niet als optimaal
        beoordeeld. De auteurs raden een controle door een ervaren coach aan.
      </p>
      <p>
        <strong>Zelfverzekerde fouten.</strong> Een verkeerd gelezen zone maakt
        van een herstelloop een drempeltraining. Een datum die één dag
        verschuift, zet de duurloop op de dag voor een wedstrijd. Taalmodellen
        maken deze fouten in vlotte, redelijk klinkende tekst, en daardoor zie
        je ze makkelijk over het hoofd.
      </p>
      <p>
        <strong>Verantwoordelijkheid.</strong> Als een plan bijdraagt aan een
        blessure, moet iemand die beslissing dragen en er met de atleet over
        praten. Een model kan dat niet.
      </p>

      <h2>De coach in de loop houden, in de praktijk</h2>
      <p>
        „Human in the loop” is makkelijk gezegd. In een coachingtool komt het
        neer op een paar concrete ontwerpkeuzes:
      </p>
      <ul>
        <li>
          De agent schrijft in dezelfde kalender die de coach en de atleet zien.
          Niets gebeurt in een verborgen laag, dus een slechte wijziging is
          meteen zichtbaar.
        </li>
        <li>
          Hij is geïnstrueerd om trainingen te verplaatsen en te bewerken in
          plaats van ze te verwijderen en opnieuw aan te maken, zodat een
          wijziging een wijziging blijft.
        </li>
        <li>
          Afgeronde trainingen en opgenomen activiteiten zijn geschiedenis. De
          agent kan ze niet herschrijven.
        </li>
        <li>
          AI draait alleen na uitdrukkelijke toestemming, die je kunt intrekken.
        </li>
        <li>
          De data gaat naar de modelaanbieder die jij hebt gekozen, met jouw
          sleutel. Op een zelfgehoste instantie met een lokaal model verlaat ze
          je server niet.
        </li>
      </ul>

      <h2>Een voorzichtige gok voor de komende jaren</h2>
      <p>
        De administratieve kosten van coaching blijven dalen. Een coach die op
        zondagavond de weken van twintig atleten herschrijft, zal daar veel
        minder tijd aan kwijt zijn. Dat kan twee kanten op: meer atleten per
        coach, of meer aandacht per atleet. Het tweede is het betere gebruik, en
        atleten zullen merken welke keuze hun coach maakte.
      </p>
      <p>
        Atleten die zichzelf coachen met een agent doen het goed als ze al weten
        hoe goede training eruitziet en de agent gebruiken om die uit te voeren.
        Riskanter is het voor beginners, die een slecht plan het minst goed
        herkennen en het eerst volgen. We verwachten niet snel een betrouwbare
        voorspelling van blessures; het onderzoek naar screening en machine
        learning geeft daar weinig reden toe. En het deel van coaching dat
        draait om merken dat het „gaat prima” van een atleet niet prima
        betekent, verdwijnt niet.
      </p>

      <h2>Uitproberen</h2>
      <p>
        OpenAthlete heeft een{' '}
        <Link href="/nl/features/mcp-server">MCP-server</Link> die werkt met
        Claude, ChatGPT en andere clients. Hij kan de context, kalender,
        activiteiten en trainingsbelasting van een atleet lezen, ziekte of
        reizen vastleggen en tot 60 trainingen in één keer plannen. De
        trainingen verschijnen dan in de kalender en komen op horloges van
        Garmin, Suunto en COROS. Hij is gratis, en coaches kunnen hem gebruiken
        voor alle atleten die ze begeleiden.
      </p>

      <h2>Bronnen</h2>
      <Sources />
    </div>
  );
}
