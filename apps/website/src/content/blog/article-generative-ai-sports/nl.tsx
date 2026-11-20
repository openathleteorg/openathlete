import Link from 'next/link';

import { Sources } from './sources';

export function ContentNl() {
  return (
    <div>
      <p>
        Voor een duursporter is generatieve AI geen speeltje en geen revolutie.
        Het is een teksttool. Het is heel goed in losse taal omzetten in
        structuur en structuur in leesbare tekst, en onbetrouwbaar zodra het
        gelijk moet hebben over je lichaam of over getallen die niemand het gaf.
        Wie het zo bekijkt, ziet snel waar het tijd bespaart en waar het je kan
        schaden.
      </p>

      <h2>Goed in: een training schrijven</h2>
      <p>
        Een gestructureerde workout intypen in de app van je horloge is
        omslachtig. Hem beschrijven niet. „20 minuten rustig, dan 6 × 3 minuten
        hard met 2 minuten dribbelen, 10 minuten uitlopen” is precies het soort
        zin waar een taalmodel goed mee overweg kan: het splitst hem in stappen,
        herkent de herhalingen en geeft elke stap een doel als het je zones
        kent. „Hard” voor 3 minuten wordt je VO2max-tempobereik, „dribbelen”
        wordt hersteltempo.
      </p>
      <p>
        Twee dingen zijn het controleren waard voordat de training naar je
        horloge gaat: de totale duur (modellen laten soms een blok weg of
        verdubbelen het) en de intensiteit die het koos voor vage woorden.
        „Hard” kan voor de een drempel betekenen en voor de ander 5
        km-wedstrijdtempo. Koos het model verkeerd, zeg het dan, of schrijf de
        volgende keer „op drempel”.
      </p>

      <h2>Goed in: feedback omzetten in data</h2>
      <p>
        Na een duurloop vult bijna niemand een formulier met vijf schuifjes in.
        Je zegt eerder iets als: „het eerste uur ging prima, toen kreeg de hitte
        me te pakken, de laatste 5 km waren een gevecht en mijn rechterkuit trok
        vast.” Een taalmodel kan daar een inspanningsscore van ongeveer 8 en een
        notitie van maken: rechterkuit, verkramping, laat in de loop. Over weken
        worden die notities iets waar een coach echt op kan filteren.
      </p>
      <p>
        Dat is belangrijker dan het klinkt. Een systematische review van Saw en
        collega's (2016) liet zien dat subjectieve, zelfgerapporteerde maten de
        trainingsbelasting beter volgen dan de meeste objectieve markers. De
        bottleneck was altijd om atleten ze te laten vastleggen. Als een zin of
        een spraakbericht volstaat, helpt dat.
      </p>

      <h2>Goed in: samenvatten en herschrijven</h2>
      <p>
        Plak de notities van vier weken training erin en vraag om een
        samenvatting voordat je met je coach praat: het haalt de terugkerende
        thema's eruit (de achillespees die na heuveltrainingen opspeelt, de
        donderdagtrainingen die steeds sneuvelen) sneller dan jij. Het kan een
        week herschrijven rond een beperking, zeg een werkreis van dinsdag tot
        donderdag met alleen een loopband in het hotel, en je een redelijk
        concept geven. Het kan een plan vertalen dat je coach in een andere taal
        schreef. Steeds krijg je een concept om te controleren, geen antwoord om
        te gehoorzamen.
      </p>

      <h2>Bruikbaar met voorzichtigheid: uitleggen</h2>
      <p>
        Vraag wat drempeltraining onderscheidt van VO2max-intervallen, of waarom
        het tempo van een duurloop makkelijk moet voelen, en je krijgt meestal
        een fatsoenlijke uitleg. Het risico is dat het er met stelligheid een
        detail aan toevoegt dat niet klopt, of een studie aanhaalt die niet
        bestaat. Taalmodellen produceren vlotte tekst, geen gecontroleerde
        feiten, een probleem dat onderzoekers hallucinatie noemen (Ji en
        collega's, 2023). Noemt een antwoord een bron, zoek die bron dan op
        voordat je hem herhaalt.
      </p>

      <h2>Slecht in: diagnosticeren</h2>
      <p>
        Typ „buitenkant van mijn knie doet pijn na 20 km” en je krijgt een
        keurig antwoord over de iliotibiale band, met rekoefeningen en een plan
        om weer te gaan lopen. Misschien klopt het. Het kan ook iets heel anders
        zijn, en het model kan dat niet weten: het kan je niet onderzoeken, je
        niet zien lopen en niet op de pijnlijke plek drukken. Een plausibel
        antwoord op een medische vraag is erger dan geen antwoord, omdat het het
        bezoek uitstelt dat het had opgelost. Pijn die aanhoudt, je doet manken,
        erger wordt tijdens het lopen of ook in rust aanwezig is, hoort bij een
        fysiotherapeut of een arts.
      </p>

      <h2>Slecht in: volledige plannen uit het niets</h2>
      <p>
        Düking en collega's (2024) vroegen ChatGPT om loopschema's van zes weken
        en lieten coachingexperts ze beoordelen op 22 criteria. Met weinig input
        scoorde het schema op 19 daarvan onder het midden van de schaal. Met
        gedetailleerde input deed het het veel beter, maar de auteurs raden toch
        af zulke schema's te volgen zonder ervaren coach. De typische fout is
        makkelijk voor te stellen: je loopt 30 km per week, je vraagt om een
        marathonschema, en de eerste week bevat 50 km omdat het model je
        geschiedenis heeft aangevuld met die van een gemiddelde loper.
      </p>

      <h2>Slecht in: getallen die het niet kreeg</h2>
      <p>
        Vraag „hoeveel heb ik in september gelopen?” zonder je data mee te geven
        en een chatmodel verzint misschien gewoon een plausibel getal. Zelfs met
        de data erin geplakt is dertig rijen optellen niet zijn sterkste kant.
        Totalen, gemiddelden en belastingberekeningen moeten komen van software
        die ze berekent, en het taalmodel moet alleen over het resultaat praten.
      </p>

      <h2>Bruikbaardere antwoorden krijgen</h2>
      <p>
        Geef het context: je zones of recente wedstrijdtijden, je weekvolume
        over de afgelopen vier tot zes weken, de wedstrijd en de datum ervan, de
        dagen waarop je kunt trainen, en elk pijntje van dit moment. Vraag het
        om zijn aannames te noemen voordat het iets schrijft. Controleer de
        uitkomst daarna aan een paar simpele regels: geen grote sprong in
        weekvolume, niet meer zware trainingen dan je gewend bent (twee per week
        is voor de meeste recreatieve lopers ruim genoeg), en rustige dagen die
        echt rustig zijn.
      </p>

      <h2>In OpenAthlete</h2>
      <p>
        De AI-functies in OpenAthlete blijven aan de tekstkant van die grens. Ze
        schrijven uit één zin een gestructureerde training met jouw zones,
        passen een training aan op basis van een korte instructie, stellen na
        een activiteit drie of vier vragen en maken van de antwoorden een
        inspanningsscore en een pijnnotitie voor je coach, en geven een korte
        lezing van elke activiteit. Je ziet elke training voordat hij naar je
        horloge gaat. Ze stellen geen diagnoses en draaien alleen met jouw
        toestemming, op je eigen API-sleutel of het Supporter-tegoed. De{' '}
        <Link href="/nl/features/ai-coach">AI-pagina</Link> heeft de details.
      </p>

      <h2>Bronnen</h2>
      <Sources />
    </div>
  );
}
