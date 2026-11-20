import Link from 'next/link';

export function ContentNl() {
  return (
    <div>
      <p>
        TRIMP, kort voor training impulse, is de oudste serieuze poging om een
        training in één getal te vatten. Eric Banister en zijn collega&apos;s
        stelden het in de jaren 70 voor als invoer voor hun
        fitheid-vermoeidheidsmodel, en vijftig jaar later zit het, in de ene of
        de andere vorm, nog steeds onder de meeste belastingsgrafieken die op
        hartslag draaien. Het is eenvoudig genoeg om met de hand uit te rekenen,
        en dat is de beste manier om te begrijpen wat het goed doet en waar het
        je misleidt.
      </p>

      <h2>De formule</h2>
      <p>
        Banisters TRIMP vermenigvuldigt de duur van een training met hoe diep je
        in je hartslagreserve zat, en weegt die intensiteit vervolgens
        exponentieel, zodat zware minuten meer kosten dan rustige:
      </p>
      <p>
        <code>TRIMP = duur (min) × HRr × 0,64 × e^(1,92 × HRr)</code>
      </p>
      <p>
        waarbij <code>HRr = (HRgem − HRrust) / (HRmax − HRrust)</code> het deel
        van je hartslagreserve is dat je tijdens de training gebruikte. Voor
        vrouwen worden de coëfficiënten 0,86 en 1,67:{' '}
        <code>TRIMP = duur × HRr × 0,86 × e^(1,67 × HRr)</code>.
      </p>
      <p>
        De exponentiële weging is het interessante deel. Die is afgestemd op hoe
        het bloedlactaat stijgt met de hartslag: bij rustige intensiteit bijna
        vlak, rond de drempel steil (Morton, Fitz-Clarke en Banister, 1990). De
        aparte coëfficiënten voor mannen en vrouwen komen uit hetzelfde werk en
        beschrijven groepsgemiddelden, niet jou. Niemand heeft aangetoond dat ze
        goed passen bij één individuele sporter, en dat is het onthouden waard
        voordat je een TRIMP van 112 als preciezer ziet dan een van 105.
      </p>

      <h2>Een rekenvoorbeeld</h2>
      <p>
        Neem een hardloper met een rusthartslag van 50 en een maximum van 190,
        dus een reserve van 140 slagen. Hij loopt een rustig uur met gemiddeld
        140 bpm.
      </p>
      <ul>
        <li>HRr = (140 − 50) / (190 − 50) = 90 / 140 = 0,643</li>
        <li>Weging = 0,64 × e^(1,92 × 0,643) = 0,64 × 3,44 = 2,20</li>
        <li>TRIMP = 60 × 0,643 × 2,20 = 85</li>
      </ul>
      <p>
        Met de coëfficiënten voor vrouwen komt hetzelfde uur uit op 97.
        Hetzelfde hart, dezelfde loop, 14% verschil alleen door de keuze van de
        coëfficiënten. Dat laat zien hoe sterk het absolute getal van aannames
        afhangt.
      </p>
      <p>
        Nu een drempeltraining van dezelfde hardloper: 20 minuten inlopen op 135
        bpm, 5 × 4&apos; op 175 bpm met 3&apos; dribbelen op 140 als herstel,
        dan 8 minuten uitlopen op 130. Weer zestig minuten. Blok voor blok
        opgeteld geeft dat een TRIMP van 114. Berekend uit de gemiddelde
        hartslag van de hele training (149 bpm) geeft het 105.
      </p>
      <p>
        Dat verschil is de exponentiële functie aan het werk: vier minuten op
        175 kosten veel meer dan het gemiddelde doet vermoeden. Wie een training
        met rustige en zware delen middelt, onderschat hem dus altijd. Banisters
        oorspronkelijke methode gebruikte het gemiddelde, omdat de
        hartslagmeters van toen niets anders konden leveren. Tegenwoordig legt
        elk horloge de hartslag per seconde vast, en integreren per seconde is
        de betere keuze. Hoe langer en gevarieerder de training, hoe meer dat
        uitmaakt.
      </p>
      <p>
        Ter vergelijking: een gelijkmatige duurloop van 2:30 u op 135 bpm komt
        uit op ongeveer 187, en 20 minuten op 185 bpm (voor deze loper bijna
        volle bak) op ongeveer 79. Volgens de formule kan een korte, zeer zware
        inspanning dus evenveel kosten als een rustig uur. Of je benen dat ook
        zo zien, is een andere vraag.
      </p>

      <h2>Wat je goed moet instellen</h2>
      <p>
        TRIMP is maar zo goed als zijn twee referentiewaarden. Een HRmax die 10
        slagen te hoog staat, laat elke training lichter lijken, een te lage
        blaast alles op. Neem de hoogste waarde die je zag in een zware
        wedstrijd of een maximale heuvelsprint, niet 220 min je leeftijd, wat
        vaak 10 bpm of meer de ene of de andere kant op zit. Je rusthartslag
        meet je het best liggend direct na het wakker worden, gemiddeld over een
        paar ochtenden. Ken je je waarden niet, dan legt onze{' '}
        <Link href="/nl/tools/heart-rate-zones">tool voor hartslagzones</Link>{' '}
        uit hoe je ze schat.
      </p>
      <p>
        Dan de sensor. Optische polssensoren zijn prima bij gelijkmatige lopen
        en zitten er vaak naast in de eerste minuten van een training, in de kou
        en bij korte intervallen. Een borstband haalt het grootste deel van die
        ruis weg. Een polswaarde van 170 bpm tijdens een rustige loop, die in
        werkelijkheid je cadans meet, geeft je een TRIMP die niets met die loop
        te maken heeft.
      </p>

      <h2>Waar TRIMP de mist in gaat</h2>
      <p>
        Hartslag meet wat je hart- en vaatstelsel doet, niet wat je spieren
        betalen. Dat heeft voorspelbare gevolgen.
      </p>
      <p>
        Bergaf lopen is het klassieke geval. Een trailrun met 1.500 m daling kan
        je bovenbenen vier dagen slopen, terwijl je hartslag bergaf gematigd
        blijft. TRIMP onderschat hem dus. Krachttraining, plyometrie en
        heuvelsprints hebben hetzelfde probleem.
      </p>
      <p>
        Korte intervallen zijn een ander geval. De hartslag heeft een minuut of
        twee nodig om de inspanning bij te benen en bereikt bij een
        30/30-training nooit het niveau dat het werk verdient. De TRIMP valt te
        laag uit.
      </p>
      <p>
        Hitte werkt de andere kant op. Op een warme dag kan cardiale drift je
        hartslag bij hetzelfde tempo in een uur tien slagen of meer laten
        stijgen. TRIMP telt dat als een zwaardere training. Fysiologisch was hij
        dat ook, dus helemaal fout is het niet, maar een zomerweek lijkt
        daardoor zwaarder dan dezelfde week in maart.
      </p>
      <p>
        En tot slot is hartslag niet vergelijkbaar tussen sporten. De meeste
        mensen halen op de fiets lagere hartslagen dan bij het hardlopen, en in
        het water nog lagere. Een fiets-TRIMP en een loop-TRIMP met dezelfde
        waarde staan dus niet voor dezelfde stress. Sommige coaches gebruiken
        daarom per sport een eigen maximum.
      </p>

      <h2>Andere varianten en session-RPE</h2>
      <p>
        Verschillende varianten proberen een deel hiervan op te lossen. De
        Edwards-TRIMP (1993) vermenigvuldigt de minuten in elk van vijf
        hartslagzones met 1 tot 5. De Lucía-TRIMP (Lucía et al., 2003) gebruikt
        drie zones die door de ventilatoire drempels worden bepaald, met
        gewichten 1, 2 en 3. Manzi&apos;s geïndividualiseerde TRIMP (Manzi et
        al., 2009) vervangt Banisters populatiecurve door het eigen
        lactaatprofiel van de sporter. Dat is nauwkeuriger, maar vraagt om een
        labtest.
      </p>
      <p>
        Het eenvoudigste alternatief laat de hartslag helemaal los. Fosters
        session-RPE (Foster et al., 2001) vermenigvuldigt de duur in minuten met
        hoe zwaar de training voelde op een schaal van 0 tot 10: 50 minuten op
        RPE 6 geeft 300. Het vangt spierschade, hitte, slecht slapen en een
        rotdag op het werk, omdat je die voelt. Studies die beide methoden
        vergeleken, vonden een goede correlatie, maar lang geen overeenstemming
        (Impellizzeri et al., 2004), en daar gaat het nu juist om: als TRIMP en
        session-RPE uit elkaar lopen, is er iets aan de hand. Een drempelloop
        die als een 8 voelde terwijl de TRIMP er normaal uitziet, verdient een
        tweede blik.
      </p>

      <h2>Van één training naar fitheid en vermoeidheid</h2>
      <p>
        Eén losse TRIMP zegt niet veel. Het nut zit erin dat hij de dagelijkse
        invoer is van Banisters model, dat twee exponentieel gewogen gemiddelden
        van je belasting bijhoudt: een trage voor fitheid, meestal met een
        tijdconstante van 42 dagen (vaak CTL genoemd), en een snelle voor
        vermoeidheid met 7 dagen (ATL). Vorm, of TSB, is het verschil. Tijdens
        een trainingsblok zit je vorm onder nul, tijdens de taper daalt de
        vermoeidheid sneller dan de fitheid en komt de vorm er weer boven. Het
        model is een beschrijving, geen natuurwet, en de 42 en 7 dagen zijn
        afspraken, geen waarden die bij jou gemeten zijn. De trend over weken is
        wel nuttig.
      </p>
      <p>
        Daaruit volgen twee praktische regels. Vergelijk je belasting met
        zichzelf, niet met die van anderen en niet tussen systemen: een TRIMP
        van 100 en een TSS van 100 bij TrainingPeaks zijn verschillende
        eenheden. En lees de curve over weken, één dag betekent weinig.
      </p>

      <h2>Hoe OpenAthlete het gebruikt</h2>
      <p>
        OpenAthlete berekent de Banister-TRIMP voor elke activiteit met
        hartslag, per seconde als de datastroom er is, met de coëfficiënten
        0,64/1,92 en 0,86/1,67 en met HRmax en rusthartslag uit je metingen. Als
        je een activiteit een inspanningsscore geeft, verschijnt de session-RPE
        ernaast, zodat je ziet wanneer de twee uit elkaar lopen. Fitheid,
        vermoeidheid en vorm worden vervolgens doorgerekend over je geplande
        trainingen. De pagina over{' '}
        <Link href="/nl/features/training-load">trainingsbelasting</Link> heeft
        een kleine TRIMP-calculator en linkt naar de formules in de broncode.
      </p>

      <h2>Bronnen</h2>
      <ul>
        <li>
          Banister EW, Calvert TW, Savage MV, Bach T. A systems model of
          training for athletic performance. Australian Journal of Sports
          Medicine, 1975;7:57–61.
        </li>
        <li>
          Morton RH, Fitz-Clarke JR, Banister EW. Modeling human performance in
          running. Journal of Applied Physiology, 1990;69(3):1171–1177.{' '}
          <a href="https://doi.org/10.1152/jappl.1990.69.3.1171">
            doi:10.1152/jappl.1990.69.3.1171
          </a>
        </li>
        <li>
          Banister EW. Modeling elite athletic performance. In: MacDougall JD,
          Wenger HA, Green HJ (eds), Physiological Testing of the
          High-Performance Athlete. Human Kinetics, 1991.
        </li>
        <li>Edwards S. The Heart Rate Monitor Book. Polar Electro, 1993.</li>
        <li>
          Foster C, Florhaug JA, Franklin J, et al. A new approach to monitoring
          exercise training. Journal of Strength and Conditioning Research,
          2001;15(1):109–115.
        </li>
        <li>
          Lucía A, Hoyos J, Santalla A, Earnest C, Chicharro JL. Tour de France
          versus Vuelta a España: which is harder? Medicine and Science in
          Sports and Exercise, 2003;35(5):872–878.
        </li>
        <li>
          Impellizzeri FM, Rampinini E, Coutts AJ, Sassi A, Marcora SM. Use of
          RPE-based training load in soccer. Medicine and Science in Sports and
          Exercise, 2004;36(6):1042–1047.
        </li>
        <li>
          Manzi V, Iellamo F, Impellizzeri F, D&apos;Ottavio S, Castagna C.
          Relation between individualized training impulses and performance in
          distance runners. Medicine and Science in Sports and Exercise,
          2009;41(11):2090–2096.
        </li>
      </ul>
    </div>
  );
}
