import Link from 'next/link';

import { Sources } from './sources';

export function ContentNl() {
  return (
    <div>
      <p>
        "AI" staat in trainingssoftware voor twee heel verschillende dingen, en
        de marketing gooit ze graag op één hoop. Het eerste zijn statistische
        modellen die met getallen werken: hartslag, tempo, vermogen,
        hartslagvariabiliteit, slaap. Ze schatten iets in of proberen iets te
        voorspellen. Het tweede zijn taalmodellen, de familie van ChatGPT,
        Claude en Mistral, die tekst lezen en schrijven. Het bewijs voor elk van
        beide ziet er heel anders uit, dus het helpt om ze apart te bekijken.
      </p>

      <h2>Veel van wat als AI wordt verkocht, is rekenwerk</h2>
      <p>
        Curves voor fitheid, vermoeidheid en vorm (CTL, ATL, TSB) zijn
        exponentieel gewogen gemiddelden van de dagelijkse belasting, afgeleid
        van het impuls-responsmodel van Banister uit de jaren zeventig. TRIMP
        zet duur en hartslag om in een belastingscore. Session-RPE is nog
        eenvoudiger: de methode van Foster vermenigvuldigt de inschatting van de
        inspanning door de atleet op een schaal van 0–10 met de duur in minuten,
        dus een duurloop van 60 minuten op RPE 6 levert 360 eenheden op. Niets
        hiervan is machine learning, en dat is goed. Je kunt de formule
        controleren, je weet wat ze negeert, en als het getal er raar uitziet,
        kun je uitzoeken waarom.
      </p>
      <p>
        De consensusverklaring over het monitoren van belasting die Bourdon en
        collega's in 2017 publiceerden, raadt precies dit soort tools aan: meet
        wat er gedaan is (externe belasting, zoals afstand en tempo) en hoe
        zwaar het voor de atleet was (interne belasting, zoals hartslag en RPE),
        en bekijk ze samen over de tijd. Dat is nog steeds de ruggengraat van
        goede praktijk, en er is geen neuraal netwerk voor nodig.
      </p>

      <h2>Voorspellen is zwakker dan de reclames doen geloven</h2>
      <p>
        Bij blessurevoorspelling lopen de beloftes het verst voor op de data.
        Het overzichtsartikel van Roald Bahr uit 2016 in het British Journal of
        Sports Medicine legt uit waarom screeningstests geen blessure kunnen
        voorspellen voor een individu: zelfs een sterke risicofactor op
        groepsniveau laat een enorme overlap tussen de atleten die geblesseerd
        raken en die dat niet worden. Machine learning heeft dat beeld nog niet
        veel veranderd. Een systematische review van Van Eetvelde en collega's
        uit 2021 vond elf studies naar machine learning voor het voorspellen van
        sportblessures, met prestaties van nauwelijks beter dan kop of munt (een
        AUC van 0,52) tot goed (0,87), en riep op tot meer werk aan het
        interpreteren van de modellen.
      </p>
      <p>
        De acute:chronische werkbelastingsratio (ACWR) is een nuttig
        waarschuwend voorbeeld. Een paar jaar lang verspreidde het idee dat een
        ratio tussen 0,8 en 1,3 een veilige "sweet spot" was zich door apps en
        trainerscursussen. Impellizzeri en collega's lieten in 2020 zien dat de
        ratio fundamentele statistische problemen heeft, en dat het bewijs voor
        de sweet spot geen stand houdt. Grote sprongen in belasting van week tot
        week zijn nog steeds een slecht idee. Een precies risicocijfer dat op
        die ratio is gebouwd, is dat niet.
      </p>
      <p>
        Dus als een app je "blessurerisico: 23%" laat zien, vraag dan hoe dat
        getal gevalideerd is, bij wie, en hoe vaak het fout zat. Als er geen
        antwoord komt, zie het dan als decoratie.
      </p>

      <h2>Waar modellen op getallen wel helpen: HRV, met een basislijn</h2>
      <p>
        Hartslagvariabiliteit is het nuttigste dagelijkse signaal dat de meeste
        atleten thuis kunnen meten. In een kleine studie van vier weken lieten
        Kiviniemi en collega's (2007) de HRV van 's ochtends bepalen welke
        training er die dag op het programma stond: zwaar als de HRV stabiel
        bleef of steeg, rustig of rust als die onder de eigen recente
        bandbreedte van de atleet zakte. Die groep verbeterde de maximale
        loopsnelheid meer dan een groep die een vast schema volgde. Plews en
        collega's (2013) voegden een belangrijk praktisch punt toe: één
        ochtendmeting is rumoerig, en voortschrijdende gemiddelden over ongeveer
        een week, vergeleken met de eigen basislijn van de atleet, zeggen veel
        meer.
      </p>
      <p>
        Let op wat dit is: een persoonlijke basislijn en een eenvoudige regel.
        Het werkt omdat het individueel is, niet omdat het model slim is. Het
        vraagt ook gedisciplineerd meten, elke ochtend onder dezelfde
        omstandigheden, en daar gaat het bij de meeste mensen mis.
      </p>

      <h2>Subjectieve data verslaat nog steeds de meeste sensoren</h2>
      <p>
        De systematische review van Saw, Main en Gastin uit 2016 vergeleek
        subjectieve maten (stemming, ervaren stress, vermoeidheid) met
        objectieve (bloedwaarden, rusthartslag, hartslagreactie op inspanning).
        De subjectieve maten volgden veranderingen in trainingsbelasting
        gevoeliger en consistenter. Simpel gezegd: de atleet vragen hoe die zich
        voelt, en dat elke keer vastleggen, is een van de beste
        monitoringinstrumenten die er zijn.
      </p>
      <p>
        Hier blijken taalmodellen echt nuttig, op een weinig glamoureuze manier.
        Een atleet typt of zegt graag "benen zwaar vanaf km 8, linker
        achillespees achteraf wat gevoelig op de trap", maar vult zelden vijf
        schuifjes in. Een taalmodel kan die zin omzetten in een inspanningsscore
        en een pijnnotitie (linker achillespees, licht, na het lopen) die een
        coach kan filteren en in een grafiek zetten. Het is gestructureerde
        gegevensinvoer, gedaan door iets dat losse formuleringen begrijpt.
      </p>

      <h2>Taalmodellen die trainingsschema's schrijven</h2>
      <p>
        Düking en collega's (2024) vroegen ChatGPT om hardloopschema's van zes
        weken met drie niveaus van detail in de prompt en lieten coachingexperts
        ze beoordelen op 22 kwaliteitscriteria. Met minimale input scoorde het
        schema op 19 van de 22 criteria onder het midden. Met gedetailleerde
        input (trainingsgeschiedenis, doelen, beperkingen) zakte dat naar één.
        De auteurs raden toch af om zulke schema's te gebruiken zonder feedback
        van een ervaren coach. Een studie naar krachttrainingsprogramma's van
        Washif en collega's (2024) kwam tot een vergelijkbare conclusie:
        geloofwaardige concepten die verfijnd moeten worden door iemand die het
        vak kent.
      </p>
      <p>
        Taalmodellen beweren ook vlot onware dingen, een fout die hallucinatie
        heet (Ji en collega's, 2023, geven een overzicht van het probleem). In
        training ziet dat eruit als een weekvolume dat niet klopt, een "studie"
        die niet bestaat, of een herstelloop die stilletjes op drempeltempo is
        gezet. Die fouten zijn makkelijk over het hoofd te zien, juist omdat de
        rest van de tekst goed leest.
      </p>

      <h2>Wat dit in de praktijk betekent</h2>
      <p>
        Gebruik taalmodellen voor tekstwerk: een gestructureerde training
        schrijven uit een beschrijving, een maand aan notities samenvatten,
        feedback na een training vastleggen, een begrip uitleggen. Houd
        beslissingen over belasting en intensiteit bij getallen die je kunt
        controleren, het liefst met een coach of je eigen ervaring als laatste
        filter. Wees sceptisch over elke risicoscore waarvan je de validatie
        niet kunt zien. En wil je één gewoonte die het onderzoek duidelijk
        ondersteunt: leg vast hoe elke training voelde.
      </p>

      <h2>Hoe OpenAthlete AI gebruikt</h2>
      <p>
        Trainingsbelasting in OpenAthlete is TRIMP uit de hartslag, met
        session-RPE ernaast: formules, geen black box. AI is optioneel en doet
        het tekstwerk dat hierboven is beschreven: een gestructureerde training
        uit één zin, drie of vier vragen na een activiteit die een
        inspanningsscore en een pijnlogboek voor de coach worden, en een korte
        duiding van elke activiteit. Er is geen blessurevoorspelling. De{' '}
        <Link href="/nl/features/ai-coach">AI-pagina</Link> laat zien wat het
        doet en welke aanbieders je kunt gebruiken.
      </p>

      <h2>Bronnen</h2>
      <Sources />
    </div>
  );
}
