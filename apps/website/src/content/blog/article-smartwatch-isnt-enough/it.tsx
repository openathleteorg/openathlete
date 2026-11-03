import Link from 'next/link';

export function ContentIt() {
  return (
    <div>
      <p>
        Un moderno orologio da corsa registra molto: traccia GPS, passo,
        frequenza cardiaca, cadenza, a volte potenza, più sonno e variabilità
        della frequenza cardiaca di notte. Poi ti consegna delle conclusioni: un
        VO2max stimato, un tempo di recupero, un punteggio di prontezza, uno
        stato di allenamento «produttivo» o «improduttivo». Le misure sono in
        genere buone. È sulle conclusioni che serve cautela, perché all'orologio
        manca quasi tutto ciò che un allenatore vorrebbe sapere.
      </p>

      <h2>Cosa misura l'orologio e cosa stima</h2>
      <p>
        Tempo, distanza e passo dal GPS sono abbastanza affidabili per
        allenarsi, a parte palazzi alti, bosco fitto e curve strette in pista.
        La frequenza cardiaca è misurata, ma la qualità dipende dal sensore. In
        uno studio confrontato con l'ECG, i sensori ottici da polso erano meno
        precisi di una fascia toracica, con una precisione variabile per
        dispositivo e tipo di esercizio (Gillinov et al.,{' '}
        <a href="https://pubmed.ncbi.nlm.nih.gov/28709155/">
          Med Sci Sports Exerc, 2017
        </a>
        ). In pratica il sensore ottico va bene nei lenti costanti e fatica
        nelle ripetute, con il freddo e con il cinturino allentato.
      </p>
      <p>
        Tutto il resto è una stima costruita su questi dati. Le calorie sono
        l'esempio più evidente: uno studio di Stanford su sette dispositivi da
        polso ha visto che la maggior parte misurava la frequenza cardiaca con
        un errore mediano sotto il 5% in bici, ma nessuno stimava il dispendio
        energetico con un errore inferiore al 20% (Shcherbina et al.,{' '}
        <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC5491979/">
          J Pers Med, 2017
        </a>
        ). VO2max, tempo di recupero e punteggi di prontezza escono da algoritmi
        proprietari che i produttori descrivono a grandi linee ma non pubblicano
        in una forma verificabile. Possono essere tendenze utili. Non sono
        misure.
      </p>

      <h2>Cosa l'orologio non sa</h2>
      <p>
        Non sa cosa doveva essere la sessione. Un 10 km a 4:45/km è un buon
        medio per un runner e un errore per un altro che aveva in programma un
        lento. Senza il programma non c'è niente con cui confrontare.
      </p>
      <p>
        Non sa come ti sei sentito. Lo sforzo percepito è spesso la prima cosa a
        cambiare quando la fatica si accumula, prima della frequenza cardiaca o
        del passo. Una revisione sistematica ha trovato che le misure
        autoriferite degli atleti rispondevano al carico di allenamento con più
        sensibilità e coerenza dei marcatori oggettivi, frequenza a riposo
        compresa (Saw et al.,{' '}
        <a href="https://pubmed.ncbi.nlm.nih.gov/26423706/">
          Br J Sports Med, 2016
        </a>
        ). Alcuni orologi ora chiedono un voto a fine uscita; se il tuo lo fa,
        usalo.
      </p>
      <p>
        Non conosce la tua vita. La fatica mentale alza lo sforzo percepito
        senza cambiare frequenza cardiaca o lattato, almeno in laboratorio (
        <a href="https://pubmed.ncbi.nlm.nih.gov/28044281/">
          Van Cutsem et al., Sports Med, 2017
        </a>
        ). Stress al lavoro, un neonato, un volo intercontinentale: l'orologio
        può coglierne una parte attraverso sonno e HRV, ma non può sapere
        perché.
      </p>
      <p>
        Non sa del fastidio al tendine d'Achille, della gara tra otto settimane,
        né che stai riprendendo dopo tre settimane di stop. Ti definirà
        «improduttivo» senza problemi in pieno scarico pre-gara.
      </p>

      <h2>Usalo per ciò che sa fare</h2>
      <p>
        Fidati delle misure, metti in dubbio le conclusioni. Per le sessioni in
        cui conta la frequenza cardiaca, una fascia toracica vale la spesa.
        Guarda le tendenze di prontezza e HRV su una settimana o più, non come
        un verdetto quotidiano: un punteggio basso dopo una buona notte e con le
        gambe fresche è probabilmente un errore dell'algoritmo, non tuo.
      </p>
      <p>
        Aggiungi tu il contesto. Dopo ogni sessione, un voto da 0 a 10 e una
        riga di note («polpacci duri», «caldo, 28 °C», «dormito male»)
        richiedono trenta secondi e rendono i tuoi dati leggibili un mese dopo.
        Una volta alla settimana confronta ciò che hai fatto con ciò che avevi
        in programma: sessioni fatte, saltate, modificate, e perché.
      </p>
      <p>
        E tieni il programma da qualche parte che non sia la tua testa. Gli
        allenamenti suggeriti dall'orologio si basano sulle sue stime e
        conoscono il tuo obiettivo solo per quello che hai inserito. Un
        programma scritto da te o da un allenatore, con le sessioni chiave
        sistemate intorno alla tua vita, dà ai dati un riferimento.
      </p>

      <h2>Questa settimana</h2>
      <p>
        Scegli una stima del tuo orologio (stato di allenamento, tempo di
        recupero o prontezza) e annotala ogni giorno accanto al tuo voto da 0 a
        10 su quanto ti senti fresco. A fine settimana guarda quante volte
        coincidevano. Saprai quanto peso dare a quel numero.
      </p>

      <p>
        OpenAthlete è una piattaforma gratuita che si appoggia sopra il tuo
        orologio: importa le attività da Garmin, COROS, Suunto, Polar e Strava
        (o file FIT, GPX e TCX), le affianca alla sessione prevista e riunisce
        nello stesso calendario RPE, TRIMP cardiaco, sonno e HRV del tuo
        dispositivo. Gli allenamenti strutturati si possono inviare agli orologi
        Garmin, Suunto e COROS. Vedi{' '}
        <Link href="/it/features/watch-sync">
          sincronizzazione con l'orologio
        </Link>{' '}
        e <Link href="/it/features/training-load">carico di allenamento</Link>.
      </p>
    </div>
  );
}
