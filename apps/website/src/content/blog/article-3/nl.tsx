import Link from 'next/link';

import { Sources } from './sources';

export function ContentNl() {
  return (
    <div>
      <p>
        Vraag tien hardlopers waarom ze geblesseerd raakten en de meesten noemen
        een oorzaak: nieuwe schoenen, de baantraining, de wedstrijd met veel
        afdalen, "te veel te snel". Vraag het aan de wetenschap en het antwoord
        is minder overzichtelijk. Het verband tussen trainingsbelasting en
        hardloopblessures is echt, maar het is zwakker, rommeliger en
        individueler dan de dashboards in de meeste trainingsapps doen
        vermoeden. Dit artikel gaat over wat het bewijs echt ondersteunt, en
        waar het ophoudt.
      </p>

      <h2>Hoe vaak hardlopers geblesseerd raken</h2>
      <p>
        Een systematische review onder langeafstandslopers vond jaarlijkse
        blessurecijfers ergens tussen 19% en 79%, afhankelijk van de studie (van
        Gent et al., 2007). Die spreiding zegt evenveel over hoe verschillend
        studies een blessure definiëren als over hardlopen zelf. Tellen per uur
        hardlopen is nuttiger: een latere meta-analyse kwam bij beginners op
        ongeveer 18 blessures per 1.000 uur tegenover zo'n 8 bij recreatieve
        lopers (Videbæk et al., 2015). Beginners raken bij dezelfde tijd op de
        been ongeveer twee keer zo vaak geblesseerd, en dat is de eerste
        aanwijzing dat het gaat om het verschil tussen wat je doet en wat je
        lichaam gewend is.
      </p>
      <p>
        De meest consistente risicofactor in studies is niet de omvang of het
        tempo. Het is een eerdere blessure (van der Worp et al., 2015). Heb je
        al eens last van je achillespees gehad, dan verdient die pees meer
        voorzichtigheid dan welke ratio in een grafiek ook.
      </p>

      <h2>Belasting tegenover belastbaarheid</h2>
      <p>
        De nuttigste manier om over overbelastingsblessures na te denken komt
        van Bertelsen en collega's (2017). Een blessure ontstaat wanneer de
        belasting op een specifieke structuur, bijvoorbeeld het scheenbeen of de
        fascia plantaris, groter is dan wat die structuur aankan, en dat
        herhaaldelijk, over een bepaalde periode. Twee dingen bewegen: de
        belasting die je aanbrengt, en de belastbaarheid van het weefsel, die
        stijgt met geleidelijke training en daalt door slecht slapen, te weinig
        energie-inname, ziekte of een eerdere blessure.
      </p>
      <p>
        Dat kader legt de grootste zwakte van elke belastingsmaat bloot. Je
        horloge meet tijd, afstand en hartslag. Je scheenbeen geeft niets om
        hartslag. Een trailrun van twee uur met 1.200 m afdalen en een vlakke
        duurloop van twee uur met dezelfde gemiddelde hartslag geven een
        vergelijkbare TRIMP, maar je quadriceps en knieën vertellen je dat het
        niet dezelfde dag was. Belastingscijfers beschrijven de kosten voor je
        hart- en vaatstelsel vrij goed. De kosten voor een bepaalde pees of bot
        beschrijven ze alleen indirect.
      </p>

      <h2>Wat de hardloopstudies laten zien</h2>
      <p>
        Er zijn minder goede studies onder hardlopers dan je zou verwachten, en
        de meeste volgen beginners. Drie zijn de moeite waard om te kennen.
      </p>
      <p>
        In een Deens cohort van 874 beginnende lopers met gps-horloges hadden
        degenen die hun weekafstand in twee weken met meer dan 30% verhoogden
        vaker "afstandsgerelateerde" blessures (patellofemorale pijn,
        ITB-syndroom, shin splints en een paar andere) dan degenen die onder de
        10% bleven (Nielsen et al., 2014). Het totale blessurecijfer verschilde
        niet tussen de groepen, en zelfs de specifieke bevinding was statistisch
        net op het randje. De auteurs noemden de studie verkennend.
      </p>
      <p>
        In een Nederlandse gerandomiseerde studie volgden 532 beginners die zich
        voorbereidden op een loop van 6,7 km een standaardschema van 8 weken of
        een rustiger schema van 13 weken op basis van de 10%-regel. De
        blessurecijfers waren vrijwel gelijk: 20,8% en 20,3% (Buist et al.,
        2008).
      </p>
      <p>
        In de Run Clever-studie verhoogden 447 recreatieve lopers 16 weken lang
        óf de omvang óf de intensiteit van hun training. De onderzoekers
        verwachtten dat elke aanpak een eigen type blessure zou opleveren. Ze
        vonden geen verschil (Ramskov et al., 2018).
      </p>
      <p>
        Alles bij elkaar: grote, plotselinge sprongen doen er waarschijnlijk
        toe, vooral bij beginners. Dat fijnafstemming van de opbouw daaronder
        veel verandert, is niet aangetoond. Wat dat in de praktijk betekent,
        week voor week, lees je in{' '}
        <Link href="/nl/blog/injury-prevention-2-when-algorithms-predict-the-break">
          hoe snel je je kilometers opbouwt
        </Link>
        .
      </p>

      <h2>
        De acute:chronische werkbelastingsratio, en waarom die omstreden is
      </h2>
      <p>
        Als je over blessures en belasting hebt gelezen, ben je de
        acute:chronische werkbelastingsratio (ACWR) tegengekomen: de belasting
        van vorige week gedeeld door je gemiddelde weekbelasting over de laatste
        vier weken. De ratio kwam voort uit studies bij snelle bowlers in
        cricket (Hulin et al., 2014) en werd populair door het artikel van Tim
        Gabbett uit 2016 over de "training-injury prevention paradox", dat een
        "sweet spot" tussen 0,8 en 1,3 beschreef en een gevarenzone boven 1,5
        (Gabbett, 2016). Binnen een paar jaar stonden die getallen in apps,
        trainerscursussen en talloze blogposts, waaronder een eerdere versie van
        deze.
      </p>
      <p>De kritiek kwam net zo snel.</p>
      <ul>
        <li>
          In de gebruikelijke berekening zit de afgelopen week zowel in de
          teller als in de noemer. Lolli en collega's (2019) lieten zien dat
          deze wiskundige koppeling op zichzelf al een correlatie oplevert,
          zelfs met willekeurige data.
        </li>
        <li>
          Impellizzeri en collega's (2020) stelden dat delen door de chronische
          belasting een verband tussen de twee veronderstelt dat nooit getest
          is, dat de ratio zich anders gedraagt afhankelijk van of je
          voortschrijdende of exponentieel gewogen gemiddelden gebruikt, en dat
          de drempels uit een paar steekproeven in teamsporten zijn gehaald en
          daarna op iedereen zijn toegepast. Een jaar later gingen ze verder en
          adviseerden ze de ACWR en de onderliggende theorie los te laten
          (Impellizzeri et al., 2021).
        </li>
        <li>
          De meeste ACWR-studies zijn observationeel, in teamsporten, met een
          bescheiden aantal blessures. Een variabele die in een groep met
          blessures samenhangt, voorspelt niet welk individu geblesseerd raakt.
          Roald Bahr maakte dat punt over screeningstests in het algemeen, en
          het geldt hier ook (Bahr, 2016).
        </li>
      </ul>
      <p>
        Mijn lezing: het idee onder de ACWR, dat je niet ineens veel meer moet
        doen dan je de laatste tijd deed, is oud, verstandig en in lijn met de
        hardloopdata hierboven. De precieze drempels zijn niet vastgesteld. Zie
        "1,5" als folklore, niet als fysiologie, en wees op je hoede voor alles
        wat je training terugbrengt tot één percentage blessurerisico.
      </p>

      <h2>Wat je hiermee doet</h2>
      <p>
        Onzeker bewijs is geen reden om belasting te negeren. Het is een reden
        om het te gebruiken waar het goed in is: opmerken dat deze week heel
        anders is dan de vorige paar, en je afvragen waarom.
      </p>
      <p>
        Let op de veranderingen die belastingsmaten missen. Een eerste
        baantraining in maanden, een wedstrijd met veel afdalen, nieuwe schoenen
        met een lagere drop, een overstap van trails naar asfalt: elk daarvan
        belast specifieke weefsels op een nieuwe manier, ook als het weektotaal
        nauwelijks verandert. Verander er één tegelijk.
      </p>
      <p>
        Neem zelfrapportage serieus. Een systematische review vond dat hoe
        atleten zeggen zich te voelen (stemming, vermoeidheid, spierpijn)
        betrouwbaarder op training reageerde dan gangbare objectieve markers
        zoals hartslag of bloedonderzoek (Saw et al., 2016). Schrijf pijn op op
        de dag dat die opkomt, met een woord over waar en hoe erg. Pijn die je
        manier van lopen verandert, die de volgende ochtend erger is, of die op
        één precieze plek van een bot zit, is een reden om te stoppen en het te
        laten nakijken, wat welke grafiek ook zegt.
      </p>
      <p>
        En houd rekening met belastbaarheid. Een week slecht slapen, een
        buikgriep of een periode van te weinig eten verlaagt wat je weefsels
        aankunnen. Hetzelfde trainingsschema is niet dezelfde belasting voor
        dezelfde loper in elke maand van het jaar.
      </p>

      <h2>Waar OpenAthlete past</h2>
      <p>
        OpenAthlete voorspelt geen blessures en geeft je geen risicoscore. Het
        zet de getallen die volgens dit artikel het volgen waard zijn naast
        elkaar. Elke training krijgt een belasting uit de hartslag (TRIMP), met
        session-RPE ernaast. Fitheid, vermoeidheid en vorm worden getekend over
        je eerdere training en doorgerekend over de trainingen die je hebt
        gepland, en elke week toont de belasting tegenover een bandbreedte op
        basis van je recente weken, wat een vuistregel is en geen
        veiligheidsgrens. Na een activiteit leggen een paar optionele vragen
        vast hoe zwaar het voelde en welke pijn je noemt; die pijn komt in een
        blessurelogboek dat je coach ziet. De details en formules staan op de{' '}
        <Link href="/nl/features/training-load">
          pagina over trainingsbelasting
        </Link>
        .
      </p>

      <h2>Bronnen</h2>
      <Sources />
    </div>
  );
}
