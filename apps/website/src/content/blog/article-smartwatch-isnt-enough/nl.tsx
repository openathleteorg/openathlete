import Link from 'next/link';

export function ContentNl() {
  return (
    <div>
      <p>
        Een modern hardloophorloge registreert veel: je gps-track, tempo,
        hartslag, cadans, soms vermogen, en ’s nachts je slaap en
        hartslagvariabiliteit. Daarna geeft het je conclusies: een geschatte
        VO2max, een hersteltijd, een readiness-score, een trainingsstatus die
        “productief” of “onproductief” zegt. De metingen zijn meestal goed. Bij
        de conclusies moet je oppassen, want het horloge mist het meeste van wat
        een coach zou willen weten.
      </p>

      <h2>Wat het horloge meet en wat het schat</h2>
      <p>
        Tijd, afstand en tempo uit gps zijn betrouwbaar genoeg om mee te
        trainen, behalve tussen hoge gebouwen, onder bomen en in krappe
        baanbochten. Je hartslag wordt gemeten, maar hoe goed hangt af van de
        sensor. In een studie met ecg als referentie waren optische polssensoren
        minder nauwkeurig dan een borstband, en de nauwkeurigheid verschilde per
        apparaat en soort inspanning (Gillinov et al.,{' '}
        <a href="https://pubmed.ncbi.nlm.nih.gov/28709155/">
          Med Sci Sports Exerc, 2017
        </a>
        ). In de praktijk doen optische sensoren het prima bij gelijkmatige runs
        en hebben ze moeite met intervallen, kou en losse bandjes.
      </p>
      <p>
        Al het andere is een schatting op basis van die gegevens. Calorieën zijn
        het duidelijkste voorbeeld: een studie van Stanford met zeven
        polsapparaten vond dat de meeste de hartslag op de fiets met een mediane
        fout onder de 5% maten, maar dat geen enkele het energieverbruik schatte
        met een fout onder de 20% (Shcherbina et al.,{' '}
        <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC5491979/">
          J Pers Med, 2017
        </a>
        ). VO2max, hersteltijd en readiness-scores komen uit eigen algoritmes
        die fabrikanten in algemene termen beschrijven, maar niet zo publiceren
        dat je ze kunt controleren. Het kunnen nuttige trends zijn. Metingen
        zijn het niet.
      </p>

      <h2>Wat het horloge niet weet</h2>
      <p>
        Het weet niet wat de training had moeten zijn. Een run van 10 km op
        4:45/km is een goede tempoloop voor de ene loper en een vergissing voor
        een ander die een rustige run had gepland. Zonder het schema is er niets
        om mee te vergelijken.
      </p>
      <p>
        Het weet niet hoe de training voelde. Ervaren inspanning is vaak het
        eerste wat verandert als vermoeidheid zich opstapelt, nog voor je
        hartslag of tempo. Een systematische review vond dat de eigen
        beoordelingen van atleten gevoeliger en consistenter op
        trainingsbelasting reageerden dan objectieve markers, rusthartslag
        inbegrepen (Saw et al.,{' '}
        <a href="https://pubmed.ncbi.nlm.nih.gov/26423706/">
          Br J Sports Med, 2016
        </a>
        ). Sommige horloges vragen nu na een run om een score; doet het jouwe
        dat, gebruik het dan.
      </p>
      <p>
        Het kent je leven niet. Mentale vermoeidheid verhoogt de ervaren
        inspanning zonder je hartslag of lactaat te veranderen, in elk geval in
        het lab (
        <a href="https://pubmed.ncbi.nlm.nih.gov/28044281/">
          Van Cutsem et al., Sports Med, 2017
        </a>
        ). Stress op je werk, een pasgeboren baby, een lange vlucht: het horloge
        vangt daar via slaap en HRV misschien iets van op, maar kan niet weten
        waarom.
      </p>
      <p>
        Het weet niets van het pijntje in je achillespees, de wedstrijd over
        acht weken of het feit dat je terugkomt na drie weken rust. Tijdens een
        taper noemt het je zonder blikken of blozen “onproductief”.
      </p>

      <h2>Gebruik het waar het goed in is</h2>
      <p>
        Vertrouw de metingen, stel vragen bij de conclusies. Voor trainingen
        waarbij je hartslag ertoe doet, is een borstband het geld waard. Kijk
        naar trends in readiness en HRV over een week of langer, niet als
        dagelijks oordeel: een lage score na een goede nachtrust met frisse
        benen betekent waarschijnlijk dat het algoritme het mis heeft, niet jij.
      </p>
      <p>
        Voeg de context zelf toe. Na elke training kosten een score van 0 tot 10
        en één regel notities (“kuiten stijf”, “heet, 28 °C”, “slecht geslapen”)
        dertig seconden, en ze maken je gegevens een maand later nog leesbaar.
        Vergelijk één keer per week wat je deed met wat je had gepland:
        trainingen gedaan, gemist, aangepast, en waarom.
      </p>
      <p>
        En bewaar je schema ergens anders dan in je hoofd. De voorgestelde
        workouts van het horloge zelf zijn gebouwd op zijn schattingen en weten
        van je doelwedstrijd niet meer dan wat je hebt ingevoerd. Een schema dat
        jij of een coach heeft geschreven, met de sleuteltrainingen rond je
        leven gepland, geeft de gegevens iets om tegen af te zetten.
      </p>

      <h2>Deze week</h2>
      <p>
        Kies één schatting die je horloge je geeft (trainingsstatus, hersteltijd
        of readiness) en schrijf die elke dag op naast je eigen score van 0–10
        voor hoe fris je je voelt. Kijk aan het eind van de week hoe vaak ze
        overeenkwamen. Dan weet je hoeveel gewicht je dat getal moet geven.
      </p>

      <p>
        OpenAthlete is een gratis platform dat bovenop je horloge werkt: het
        importeert activiteiten van Garmin, COROS, Suunto, Polar en Strava (of
        FIT-, GPX- en TCX-bestanden), zet ze naast de geplande training en houdt
        RPE, TRIMP uit je hartslag en slaap en HRV van je apparaat in dezelfde
        kalender bij. Gestructureerde workouts kun je naar horloges van Garmin,
        Suunto en COROS sturen. Bekijk{' '}
        <Link href="/nl/features/watch-sync">
          synchronisatie met je horloge
        </Link>{' '}
        en <Link href="/nl/features/training-load">trainingsbelasting</Link>.
      </p>
    </div>
  );
}
