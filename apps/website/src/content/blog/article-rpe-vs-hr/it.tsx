import Link from 'next/link';

export function ContentIt() {
  return (
    <div>
      <p>
        Due uscite, stesso giro, stesso passo di 5:00/km, stessa frequenza
        cardiaca media di 148 bpm. Il martedì gli avresti dato 3 su 10. Il
        giovedì, dopo due notti corte e una lunga giornata di lavoro, 6. Il tuo
        orologio archivia le due sessioni come identiche. Il tuo corpo no.
      </p>

      <p>
        Frequenza cardiaca e sforzo percepito (RPE, da{' '}
        <em>rating of perceived exertion</em>) misurano entrambi il carico
        interno: quanto ti è costato il lavoro, in contrapposizione al carico
        esterno, cioè il lavoro in sé (distanza, passo, potenza). La distinzione
        viene da Impellizzeri, Marcora e Coutts, secondo cui è il carico interno
        a guidare l'adattamento e i due vanno monitorati insieme (
        <a href="https://doi.org/10.1123/ijspp.2018-0935">
          Int J Sports Physiol Perform, 2019
        </a>
        ). Frequenza cardiaca e RPE guardano il carico interno da angolazioni
        diverse, e sono in disaccordo abbastanza spesso da rendere quel
        disaccordo degno di essere letto.
      </p>

      <h2>Cosa ti dice davvero la frequenza cardiaca</h2>
      <p>
        La frequenza cardiaca è la risposta cardiovascolare al lavoro. Negli
        sforzi costanti di qualche minuto o più segue bene l'intensità, ed è per
        questo che le zone cardio e i carichi di tipo TRIMP funzionano per la
        maggior parte dell'allenamento di endurance. Ma non risponde solo
        all'intensità.
      </p>
      <p>
        È in ritardo. All'inizio di una ripetuta da 4 minuti le servono uno o
        due minuti per raggiungere lo sforzo, quindi sottostima le ripetute
        brevi e non dice quasi nulla di utile su uno sprint in salita di 30
        secondi. Deriva. In un lungo a passo costante sale lentamente mentre
        cala la gittata sistolica, di più con il caldo o se sei disidratato;
        Coyle e González-Alonso ne descrivono i meccanismi (
        <a href="https://pubmed.ncbi.nlm.nih.gov/11337829/">
          Exerc Sport Sci Rev, 2001
        </a>
        ). Si muove con la caffeina, la malattia, la quota e lo stress. E il
        numero sul polso può essere semplicemente sbagliato: rispetto a un ECG,
        i sensori ottici da polso sono risultati meno precisi di una fascia
        toracica, con una precisione variabile a seconda del dispositivo e
        dell'attività (Gillinov et al.,{' '}
        <a href="https://pubmed.ncbi.nlm.nih.gov/28709155/">
          Med Sci Sports Exerc, 2017
        </a>
        ).
      </p>

      <h2>Cosa aggiunge l'RPE</h2>
      <p>
        L'RPE è il riassunto che il tuo cervello fa di tutto insieme: respiro,
        gambe, caldo, motivazione, quanta attenzione ha richiesto la sessione.
        Il metodo della session-RPE di Carl Foster lo trasforma in un numero di
        carico: valuta l'intera sessione sulla scala di Borg da 0 a 10 circa 30
        minuti dopo la fine e moltiplica per la durata in minuti (Foster et al.,{' '}
        <a href="https://pubmed.ncbi.nlm.nih.gov/11708692/">
          J Strength Cond Res, 2001
        </a>
        ). Un lento di 50 minuti valutato 3 dà 150 unità arbitrarie; una
        sessione di soglia di 70 minuti con 5 × 4' valutata 7 ne dà 490.
      </p>
      <p>
        In media i due metodi concordano. In giovani calciatori, il carico da
        session-RPE era correlato con tre metodi basati sulla frequenza
        cardiaca, con correlazioni individuali tra circa 0,50 e 0,85
        (Impellizzeri et al.,{' '}
        <a href="https://pubmed.ncbi.nlm.nih.gov/15179175/">
          Med Sci Sports Exerc, 2004
        </a>
        ). In giovani fondisti dello sci di fondo, frequenza cardiaca e
        session-RPE davano quasi la stessa distribuzione delle intensità, con
        circa tre quarti delle sessioni nella zona facile (Seiler e Kjerland,{' '}
        <a href="https://pubmed.ncbi.nlm.nih.gov/16430681/">
          Scand J Med Sci Sports, 2006
        </a>
        ). Correlazioni di quest'ordine significano anche che sulla singola
        sessione si separano spesso. È lì che diventano utili.
      </p>

      <h2>Leggere il disaccordo</h2>
      <p>
        <strong>Frequenza cardiaca normale, RPE più alto del solito.</strong>{' '}
        L'uscita del giovedì. Il sistema cardiovascolare ha fatto lo stesso
        lavoro, ma la sessione è costata di più. Sonno scarso, fatica mentale,
        fatica accumulata e l'inizio di una malattia alzano l'RPE prima di
        vedersi sul cardio. Una sessione così è rumore. Tre lenti così in una
        settimana sono un motivo per alleggerire o spostare la prossima sessione
        dura.
      </p>
      <p>
        <strong>Frequenza cardiaca più alta del solito, RPE normale.</strong> Di
        solito è l'ambiente o il sensore: caldo, umidità, un caffè doppio, un
        cinturino allentato. Controlla le condizioni prima di trarre conclusioni
        sulla tua forma. Se persiste nei giorni freschi, e soprattutto con una
        frequenza a riposo alta, pensa a una malattia in arrivo.
      </p>
      <p>
        <strong>Frequenza cardiaca più bassa del solito, RPE più alto.</strong>{' '}
        Lo schema da prendere sul serio, in particolare se non riesci più a far
        salire il cuore nelle ripetute. È uno dei segnali descritti negli atleti
        in overreaching nel consenso ECSS/ACSM sul sovrallenamento (Meeusen et
        al.,{' '}
        <a href="https://pubmed.ncbi.nlm.nih.gov/23247672/">
          Med Sci Sports Exerc, 2013
        </a>
        ), che però chiarisce che nessun marcatore da solo basta per la
        diagnosi. Riposa qualche giorno e verifica se entrambi i valori tornano
        normali.
      </p>
      <p>
        <strong>Entrambi più bassi allo stesso passo.</strong> Stai migliorando.
        Goditelo, e resisti alla tentazione di accelerare tutti i tuoi lenti.
      </p>

      <h2>Quale usare, e quando</h2>
      <p>
        Nei lenti e nei lunghi, un tetto di frequenza cardiaca è il modo più
        semplice per mantenere facili i giorni facili, purché tu tolleri la
        deriva nell'ultima ora. Per ripetute di 5 minuti o meno usa il passo o
        la potenza come obiettivo e l'RPE come controllo: il cardio arriva
        troppo tardi per guidare una ripetuta. In gara e nelle lunghe giornate
        in montagna, l'RPE è l'unica misura che tiene conto del caldo, del
        dislivello e dei 40 km già nelle gambe.
      </p>
      <p>
        Per il carico, tienili entrambi. Il TRIMP da frequenza cardiaca dà un
        numero che non dipende dal tuo umore; la session-RPE coglie le sessioni
        che il resto della tua vita ha reso più dure. Quando le due tendenze
        divergono per una settimana o più, qualcosa è cambiato fuori
        dall'allenamento.
      </p>

      <h2>Questa settimana</h2>
      <p>
        Dopo ogni sessione aspetta mezz'ora, chiediti «quanto è stata dura
        questa sessione nel complesso?» e annota un numero da 0 a 10. Scrivi
        accanto la frequenza cardiaca media. Scegli un giro facile che corri
        spesso e confronta le coppie a fine settimana. Non serve altro per
        iniziare a vedere in quali giorni il cardio raccontava tutta la storia e
        in quali no.
      </p>

      <p>
        OpenAthlete conserva entrambi per ogni attività: il TRIMP calcolato dai
        dati cardio del tuo orologio e, appena inserisci un RPE, il carico da
        session-RPE accanto. Se attivi le funzioni di IA, alcune brevi domande
        dopo ogni attività compilano l'RPE e annotano eventuali dolori, per te o
        per il tuo allenatore. È gratuito; la pagina sul{' '}
        <Link href="/it/features/training-load">carico di allenamento</Link>{' '}
        spiega come vengono combinati i dati, e il{' '}
        <Link href="/it/tools/heart-rate-zones">
          calcolatore delle zone cardio
        </Link>{' '}
        ti aiuta a impostare le zone.
      </p>
    </div>
  );
}
