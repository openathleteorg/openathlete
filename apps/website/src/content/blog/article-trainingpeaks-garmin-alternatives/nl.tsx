import Link from 'next/link';

import { articlePrices } from './prices';
import { SOURCES } from './sources';

export function ContentNl() {
  const p = articlePrices('nl');
  return (
    <div>
      <p>
        Op 22 juli 2026 maakte Garmin bekend dat het TrainingPeaks en
        TrainHeroic had gekocht, de krachttrainingsapp van hetzelfde
        moederbedrijf, Peaksware. De voorwaarden werden niet bekendgemaakt.
        Sindsdien komt op coachingfora en in onze inbox steeds dezelfde vraag
        terug: moet ik overstappen, en zo ja, waarnaartoe?
      </p>
      <p>
        Het korte antwoord: niets dwingt je om vandaag over te stappen. Het
        langere antwoord volgt hieronder, met de alternatieven die een blik
        waard zijn en hoe je je trainingsgeschiedenis meeneemt. Een van die
        alternatieven, OpenAthlete, bouwen we zelf, dus lees dat deel met de
        scepsis die het verdient. De andere hebben we geprobeerd te beschrijven
        zoals hun eigen gebruikers dat zouden doen.
      </p>

      <h2>Wat er echt veranderd is</h2>
      <p>
        De eigenaar. Meer is het tot nu toe niet. Volgens het{' '}
        <a href={SOURCES.garminPress}>persbericht van Garmin</a> gaan zo&apos;n
        120 mensen van TrainingPeaks en TrainHeroic naar Garmin en blijven de
        platforms in Louisville, Colorado. Over accounts, prijzen of
        ondersteuning van apparaten zegt het niets. Voor Premium of Coach
        Edition is geen prijswijziging aangekondigd, en coachaccounts werken
        zoals in juni. Sommige media, waaronder{' '}
        <a href={SOURCES.cyclelytic}>CycleLytic</a>, meldden dat Garmin had
        gezegd dat de compatibiliteit met andere horlogemerken niet zou
        veranderen. Die toezegging hebben we niet zwart op wit van Garmin
        gevonden, maar we zagen ook niets wat de andere kant op wijst. Je
        sporters met COROS, Suunto, Polar en Wahoo synchroniseren nog steeds.
      </p>
      <p>
        Waarom vragen coaches het dan? Vooral omdat er nu iemand anders de
        roadmap bepaalt. TrainingPeaks was waardevol als neutrale laag tussen
        alle horlogemerken en alle coaches. Nu beslist een horlogemaker waar
        zijn engineers hun tijd aan besteden. Garmin kan het platform best
        neutraal houden, want voor die neutraliteit heeft het betaald. Toch:
        toen Garmin in 2020 Firstbeat kocht, zei het dat licenties aan derden
        zouden doorgaan, en <a href={SOURCES.the5krunner}>the5krunner</a> merkt
        op, met DC Rainmaker als bron, dat er sindsdien geen nieuwe deals met
        derden meer bij zijn gekomen. Dat bewijst niets over TrainingPeaks. Het
        verklaart wel waarom coaches met gemengde groepen sporters goed
        opletten.
      </p>
      <p>
        Dan is er nog een precedent. Today&apos;s Plan was van Specialized, had
        een trouwe groep wielercoaches en{' '}
        <a href={SOURCES.todaysPlan}>stopte in maart 2024</a>. Coaches met
        jarenlange sportersgeschiedenis op het platform hadden een paar maanden
        om die eruit te halen. Niemand verwacht hetzelfde van TrainingPeaks, dat
        veel groter is, maar wie het heeft meegemaakt, houdt nu een exitplan
        achter de hand. En geld was al vóór juli een onderwerp: Premium ging in
        april 2025 van $&nbsp;124,99 naar $&nbsp;134,99 per jaar.
      </p>

      <h2>Moet je overstappen?</h2>
      <p>
        Voor veel mensen is het eerlijke antwoord: nee, of nog niet. Loop het
        volgende na voordat je een weekend aan de migratie besteedt.
      </p>

      <h3>De horloges van je sporters</h3>
      <p>
        Als elke sporter die je coacht een Garmin draagt, is de overname voor
        jou neutraal, misschien zelfs gunstig. Loopt een derde van je groep met
        COROS, Suunto of Polar, dan ben jij degene die iets in de gaten moet
        houden. Maak vandaag een lijst: welk merk elke sporter gebruikt en of
        geplande trainingen op dat horloge aankomen. Het versturen van
        trainingen is het eerste wat je zou verliezen als een integratie ooit
        slechter wordt.
      </p>

      <h3>Wat je betaalt</h3>
      <p>
        Catalogusprijzen op {p.checkedOn}: TrainingPeaks Premium kost
        $&nbsp;19,95 per maand of {p.tpPremiumYear} per jaar. Coach Edition
        begint bij $&nbsp;21,99 per maand met één Premium-sporter inbegrepen,
        daarna $&nbsp;9 tot $&nbsp;4,50 per maand voor elke extra
        Premium-sporter, afhankelijk van de grootte van je groep, plus $&nbsp;99
        opstartkosten die met een promotiecode vervallen (
        <a href={SOURCES.tpCoachPricing}>coachprijzen van TrainingPeaks</a>).
        Geplande trainingen synchroniseren alleen naar apparaten voor
        Premium-sporters, dus een coach die Premium betaalt voor 10 sporters,
        geeft vóór belasting zo&apos;n {p.tpCoach10} per jaar uit. Als je dat
        geld liever houdt, is dat een reden om rond te kijken, wie het bedrijf
        ook bezit.
      </p>

      <h3>Waar je van afhankelijk bent</h3>
      <p>
        Voor sommige dingen bestaat elders geen echt alternatief. Verkoop je
        schema&apos;s via de marketplace van TrainingPeaks, dan volgt dat
        publiek je niet. Fietsen je sporters in de winter op TrainingPeaks
        Virtual of zijn ze dol op de native apps, reken dat dan mee. En als je
        sporters tevreden zijn en alleen jij je zorgen maakt, kan het verhuizen
        van 25 mensen vanwege een hypothetisch risico meer goodwill kosten dan
        het oplevert. Coaches die het probeerden, vertellen dat klanten vaak
        gewoon nee zeggen.
      </p>

      <h3>Je data</h3>
      <p>
        Wat je ook besluit, exporteer je geschiedenis nu. Het kost een avond en
        neemt het grootste deel van het risico weg. Hoe je dat doet, staat aan
        het eind van dit artikel.
      </p>

      <h2>De onafhankelijke alternatieven</h2>
      <p>
        Geen van deze is van een horlogemaker. De prijzen zijn de
        catalogusprijzen van de aanbieders op {p.checkedOn}; controleer de
        gelinkte pagina voordat je betaalt.
      </p>

      <h3>intervals.icu</h3>
      <p>
        Gratis, met een Supporter-niveau voor $&nbsp;4 per maand (
        <a href={SOURCES.intervals}>intervals.icu</a>). Voor een sporter die
        zichzelf traint en van data houdt, is het de voor de hand liggende
        eerste halte: fitheid, vermoeidheid en vorm, vermogens- en tempocurves,
        een workoutbouwer, een kalender en een van de langste integratielijsten
        die er zijn (Garmin, COROS, Suunto, Polar, Wahoo, Zwift en nog veel
        meer). Coaches kunnen sporters volgen en voor ze plannen; teams en
        coachingorganisaties hebben Supporter nodig. Er is geen officiële
        mobiele app (apps van derden vullen het gat), en veel gebruikers vinden
        de interface in het begin druk. Leef je in de Performance Management
        Chart, begin dan hier.
      </p>

      <h3>Nolio</h3>
      <p>
        Uit Grenoble, partner van de Franse atletiekbond en de standaard bij
        Franse clubs. Voor sporters gratis (Premium €&nbsp;6,90 per maand);
        coachabonnementen beginnen bij €&nbsp;19,90 per maand voor 3 sporters en
        €&nbsp;29,90 voor maximaal 25, met goedkopere abonnementen voor clubs
        die een geregistreerde vereniging zijn (
        <a href={SOURCES.nolio}>prijzen van Nolio</a>). Native apps voor iOS en
        Android, een bibliotheek met video&apos;s van krachtoefeningen, reacties
        op elke training. Voor een coach of club in Frankrijk is het de meest
        directe vervanger. Elders minder bekend, en de prijs stijgt per staffel
        naarmate de groep groeit: {p.nolioCoach10} per jaar voor een coach met
        10 sporters.
      </p>

      <h3>Final Surge</h3>
      <p>
        Amerikaans, populair bij hardloopcoaches, middelbare scholen en
        universiteiten. Sporters krijgen alle sportersfuncties gratis; coaches
        betalen een vast bedrag van $&nbsp;19 per maand voor 1 tot 5 sporters of
        $&nbsp;39 per maand voor maximaal 100 (
        <a href={SOURCES.finalSurge}>prijzen van Final Surge</a>). Native apps
        en gestructureerde trainingen die naar Garmin en COROS worden gestuurd.
        De vaste prijs is de trekpleister: 40 sporters kosten hetzelfde als 10.
        Weinig aanwezig in Europa, en geen AI-functies die wij konden vinden,
        wat sommige coaches als pluspunt zullen zien.
      </p>

      <h3>Tredict</h3>
      <p>
        Duits, gerund door de eigenaar zelf, privacybewust en het meest
        uitgesproken over de Garmin-deal (
        <a href={SOURCES.tredictBlog}>hun analyse</a>). Het stuurt trainingen
        naar Garmin, COROS, Suunto, Wahoo, Hammerhead en Zwift, en heeft
        coachingfuncties en een API. Het prijsmodel is ongebruikelijk: eenmalig
        $&nbsp;49 voor twaalf maanden volledige toegang, daarna gratis
        alleen-lezentoegang, en een proefperiode van twee maanden (
        <a href={SOURCES.tredictPrice}>prijs van Tredict</a>). Een klein team en
        een kleine community, maar qua geest dicht bij wat TrainingPeaks vroeger
        voor veel mensen was.
      </p>

      <h3>Runalyze</h3>
      <p>
        Gemaakt in Kaiserslautern en Kiel, en favoriet bij hardlopers die
        analyse willen: effectieve VO2max, wedstrijdvoorspellingen, een
        marathonvormscore, trainingsbelasting. Het synchroniseert vanuit Garmin,
        COROS, Suunto, Polar, Wahoo, Strava en andere. Gratis, met Premium voor
        €&nbsp;60 per jaar (<a href={SOURCES.runalyze}>prijzen van Runalyze</a>
        ). Het is eerder een trainingslogboek en analysetool dan een platform
        voor planning of coaching, dus het past bij de hardloper die zichzelf
        traint en TrainingPeaks vooral gebruikte om terug te kijken, niet bij de
        coach die voor anderen plant.
      </p>

      <h3>Golden Cheetah</h3>
      <p>
        Gratis opensource-desktopsoftware voor Windows, macOS en Linux, vooral
        gericht op fietsen, met diepgaande vermogensanalyse (
        <a href={SOURCES.goldenCheetah}>goldencheetah.org</a>). Geen cloud, geen
        samenwerking met een coach, geen trainingen naar horloges. Het staat
        hier omdat niemand het ooit kan uitzetten.
      </p>

      <h3>OpenAthlete</h3>
      <p>
        Van ons, dus oordeel daarnaar. Het is open source (AGPL), gratis om zelf
        te hosten, of door ons gehost in Frankrijk. In de gehoste versie is
        alles wat je nodig hebt om te trainen gratis, coaching van maximaal 5
        sporters inbegrepen; Supporter, vanaf €&nbsp;5 per maand of €&nbsp;50
        per jaar, financiert het project en voegt het Lab toe, eerdere toegang
        tot nieuwe functies, de geavanceerde coachtools en clubs, een onbeperkt
        aantal gecoachte sporters en AI op onze sleutels (
        <Link href="/nl/pricing">prijzen</Link>). Een club wordt geopend door
        een Supporter en leden doen gratis mee, zonder limiet op het aantal
        sporters: groepen met hun coaches, een gedeelde bibliotheek, wekelijkse
        clubtrainingen en schema&apos;s die naar een hele groep worden
        gekopieerd. Geplande trainingen gaan naar horloges van Garmin, Suunto en
        COROS; activiteiten komen binnen van die drie plus Polar en Strava. De
        trainingsbelasting is TRIMP op basis van hartslag met session-RPE
        ernaast, en fitheid, vermoeidheid en vorm worden doorgerekend over de
        trainingen die je gepland hebt. AI is optioneel en draait op je eigen
        sleutel of het Supporter-tegoed.
      </p>
      <p>
        De beperkingen zijn echt. Er is geen marketplace om schema&apos;s te
        verkopen, geen clubfacturatie (lid worden van een club is gratis, maar
        lidmaatschapsgelden regel je buiten OpenAthlete), geen app voor
        indoortraining en geen trainingen naar Polar-horloges. De analyse is
        minder diep dan bij intervals.icu, en het project is jong en wordt door
        één ontwikkelaar gebouwd. Ons antwoord op ‘wat als jullie verdwijnen?’
        is de licentie: de code en je data blijven zonder ons bruikbaar. De
        vergelijking punt voor punt staat op{' '}
        <Link href="/nl/compare/trainingpeaks">
          OpenAthlete vs TrainingPeaks
        </Link>
        , hoe coaching werkt op de{' '}
        <Link href="/nl/coaches">pagina voor coaches</Link>, en de andere
        vergelijkingen vind je <Link href="/nl/compare">hier</Link>.
      </p>

      <h2>Zo stap je over zonder je geschiedenis te verliezen</h2>

      <h3>Exporteer eerst uit TrainingPeaks</h3>
      <p>
        Het helpcentrum van TrainingPeaks beschrijft in de webapp een functie
        ‘Export Data’: je kiest een periode van maximaal 12 maanden en krijgt
        een map met alle trainingsbestanden daaruit, en dezelfde tool kan een
        CSV-overzicht van je trainingen maken. Losse bestanden kun je ook per
        training downloaden, in het formaat waarin ze zijn geüpload (
        <a href={SOURCES.tpExportHelp}>Data Export</a>). Volgens een{' '}
        <a href={SOURCES.tpExportBlog}>blogpost van TrainingPeaks</a> is de
        bulkexport bedoeld voor abonnees van Athlete Edition, en sommige
        forumgebruikers zeggen dat er Premium voor nodig is, dus kijk wat je
        account laat zien. Zes jaar geschiedenis betekent zes exports. Doe het
        vóór je opzegt, niet erna. We vonden geen gedocumenteerde manier om je
        trainingsbibliotheek of toekomstige schema in één keer te exporteren,
        dus reken erop dat je de sjablonen die je hergebruikt opnieuw moet
        maken.
      </p>

      <h3>Koppel je horlogeaccounts opnieuw</h3>
      <p>
        De meeste platforms halen eerdere activiteiten op bij het horlogemerk
        zodra je het koppelt, en dat is makkelijker dan bestanden. Hoe ver terug
        je komt, hangt meer af van de API van het merk dan van het platform. Bij
        OpenAthlete leveren Strava en COROS de volledige geschiedenis (COROS
        stuurt 50 bestanden per dag, dus een lange geschiedenis heeft een paar
        dagen nodig), Garmin en Suunto de laatste 30 dagen, en Polar niets van
        vóór de koppeling. Andere platforms lopen om dezelfde redenen tegen
        vergelijkbare grenzen aan; vraag het na voordat je op een volledige
        import rekent.
      </p>

      <h3>Vul de gaten met FIT-bestanden</h3>
      <p>
        Wat de API niet teruggeeft, zit in je exportmap. Upload de FIT-bestanden
        naar het nieuwe platform; bij OpenAthlete kun je er meerdere tegelijk
        naar de kalender slepen (20&nbsp;MB per bestand).
        Multisport-FIT-bestanden van een triatlon worden nog niet ondersteund.
      </p>

      <h3>Gebruik beide één blok lang</h3>
      <p>
        Als je coacht, houd TrainingPeaks dan nog één blok aan terwijl je
        sporters koppelen met het nieuwe platform, plan daar de volgende vier
        weken en kijk wat er misgaat. Overstappen na een doelwedstrijd of aan
        het begin van het rustseizoen is veel makkelijker dan midden in een
        marathonopbouw.
      </p>
      <p>
        En als je deze maand maar één ding doet, laat het dan de export zijn.
      </p>
    </div>
  );
}
