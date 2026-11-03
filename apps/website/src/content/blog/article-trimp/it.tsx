import Link from 'next/link';

export function ContentIt() {
  return (
    <div>
      <p>
        Il TRIMP, da <em>training impulse</em>, è il primo tentativo serio di
        riassumere una seduta in un solo numero. Eric Banister e i suoi colleghi
        lo proposero negli anni Settanta come dato in ingresso del loro modello
        forma-fatica, e cinquant'anni dopo sta ancora, in una forma o
        nell'altra, dietro gran parte dei grafici di carico basati sulla
        frequenza cardiaca. Si calcola a mano, ed è il modo migliore per capire
        cosa misura bene e dove ti può ingannare.
      </p>

      <h2>La formula</h2>
      <p>
        Il TRIMP di Banister moltiplica la durata della seduta per la quota di
        frequenza cardiaca di riserva che hai usato, poi pesa quell'intensità in
        modo esponenziale, così che i minuti duri contino più di quelli facili:
      </p>
      <p>
        <code>TRIMP = durata (min) × FCr × 0,64 × e^(1,92 × FCr)</code>
      </p>
      <p>
        dove <code>FCr = (FCmedia − FCriposo) / (FCmax − FCriposo)</code>, la
        frazione della riserva cardiaca usata durante la seduta. Per le donne i
        coefficienti diventano 0,86 e 1,67:{' '}
        <code>TRIMP = durata × FCr × 0,86 × e^(1,67 × FCr)</code>.
      </p>
      <p>
        La parte interessante è il peso esponenziale. È stato adattato al modo
        in cui il lattato nel sangue sale con la frequenza cardiaca: quasi
        piatto alle intensità facili, molto ripido vicino alla soglia (Morton,
        Fitz-Clarke e Banister, 1990). I coefficienti diversi per uomini e donne
        vengono dallo stesso lavoro e descrivono medie di gruppo, non te.
        Nessuno ha dimostrato che si adattino bene a un singolo atleta, quindi
        meglio non considerare un TRIMP di 112 più preciso di uno di 105.
      </p>

      <h2>Un esempio con i numeri</h2>
      <p>
        Prendiamo un runner con 50 battiti a riposo e una massima di 190, quindi
        una riserva di 140 battiti. Fa un'ora di corsa lenta a una media di 140
        bpm.
      </p>
      <ul>
        <li>FCr = (140 − 50) / (190 − 50) = 90 / 140 = 0,643</li>
        <li>Peso = 0,64 × e^(1,92 × 0,643) = 0,64 × 3,44 = 2,20</li>
        <li>TRIMP = 60 × 0,643 × 2,20 = 85</li>
      </ul>
      <p>
        Con i coefficienti femminili la stessa ora vale 97. Stesso cuore, stessa
        uscita, il 14% di differenza solo per la scelta del coefficiente: questo
        dice quanto il numero assoluto dipenda dalle ipotesi.
      </p>
      <p>
        Ora una seduta di soglia per lo stesso runner: 20 minuti di
        riscaldamento a 135 bpm, 5 × 4' a 175 bpm con 3' di recupero
        corricchiando a 140, poi 8 minuti di defaticamento a 130. Di nuovo
        sessanta minuti. Sommato blocco per blocco, il TRIMP è 114. Calcolato
        sulla frequenza media dell'intera seduta (149 bpm), è 105.
      </p>
      <p>
        Quella differenza è l'esponenziale al lavoro: quattro minuti a 175
        costano molto più di quanto suggerisca la media, quindi fare la media di
        una seduta che mescola tratti facili e ripetute la sottostima sempre. Il
        metodo originale di Banister usava la media perché era quello che davano
        i cardiofrequenzimetri dell'epoca. Oggi qualsiasi orologio registra la
        frequenza ogni secondo, e integrarla secondo per secondo è la scelta
        migliore. Più la seduta è lunga e varia, più conta.
      </p>
      <p>
        Per avere un'idea, un lungo di 2 h 30 a 135 bpm vale circa 187, e 20
        minuti a 185 bpm (quasi al massimo per questo runner) circa 79. La
        formula dice quindi che uno sforzo breve e molto intenso può costare
        quanto un'ora facile. Se le tue gambe siano d'accordo è un'altra storia.
      </p>

      <h2>Cosa devi impostare bene</h2>
      <p>
        Il TRIMP vale quanto i suoi due valori di riferimento. Una FCmax troppo
        alta di 10 battiti fa sembrare tutte le sedute più facili; troppo bassa
        gonfia tutto. Usa il valore più alto che hai visto in una gara dura o in
        una salita a tutta, non 220 meno l'età, che sbaglia spesso di 10 bpm o
        più in un senso o nell'altro. La frequenza a riposo si misura sdraiati
        al risveglio, facendo la media di qualche mattina. Se non conosci i tuoi
        valori, il nostro{' '}
        <Link href="/it/tools/heart-rate-zones">
          strumento per le zone cardiache
        </Link>{' '}
        spiega come stimarli.
      </p>
      <p>
        Poi c'è il sensore. Quelli ottici al polso vanno bene nelle uscite
        regolari e sbagliano spesso nei primi minuti, al freddo e nelle ripetute
        brevi. Una fascia toracica elimina gran parte di quel rumore. Un polso
        che si aggancia alla cadenza e segna 170 bpm in una corsa lenta ti darà
        un TRIMP che non ha niente a che vedere con l'uscita.
      </p>

      <h2>Dove il TRIMP sbaglia</h2>
      <p>
        La frequenza cardiaca misura cosa fa il tuo sistema cardiovascolare, non
        quanto pagano i muscoli. Le conseguenze sono prevedibili.
      </p>
      <p>
        Il caso classico è la discesa. Un trail con 1.500 m di D− può lasciarti
        i quadricipiti distrutti per quattro giorni mentre il cuore resta
        moderato in discesa, quindi il TRIMP la sottovaluta. Forza, pliometria e
        sprint in salita hanno lo stesso problema.
      </p>
      <p>
        Le ripetute brevi sono un altro. Il cuore impiega uno o due minuti per
        raggiungere lo sforzo, quindi in un 30/30 non arriva mai al livello che
        il lavoro meriterebbe, e il TRIMP esce basso.
      </p>
      <p>
        Il caldo agisce al contrario. In una giornata calda la deriva cardiaca
        può alzare la frequenza di dieci battiti o più a parità di passo nel
        giro di un'ora. Il TRIMP la conta come una seduta più dura.
        Fisiologicamente lo era, quindi non è del tutto sbagliato, ma una
        settimana d'agosto sembra più pesante della stessa settimana a marzo.
      </p>
      <p>
        Infine, la frequenza cardiaca non si confronta tra sport diversi. Quasi
        tutti salgono meno in bici che di corsa, e ancora meno in acqua: un
        TRIMP di ciclismo e uno di corsa con lo stesso valore non rappresentano
        lo stesso stress. Per questo alcuni allenatori usano una FCmax per ogni
        sport.
      </p>

      <h2>Altre versioni, e l'RPE di seduta</h2>
      <p>
        Diverse varianti cercano di correggere parte di questi limiti. Il TRIMP
        di Edwards (1993) moltiplica i minuti passati in ciascuna di cinque zone
        cardiache per un fattore da 1 a 5. Quello di Lucía (Lucía et al., 2003)
        usa tre zone delimitate dalle soglie ventilatorie, pesate 1, 2 e 3. Il
        TRIMP individualizzato di Manzi (Manzi et al., 2009) sostituisce la
        curva media di Banister con il profilo del lattato dell'atleta: più
        preciso, ma serve un test in laboratorio.
      </p>
      <p>
        L'alternativa più semplice fa a meno del cardio. L'RPE di seduta di
        Foster (Foster et al., 2001) moltiplica la durata in minuti per quanto
        ti è sembrata dura la seduta su una scala da 0 a 10: 50 minuti a RPE 6
        fanno 300. Vede il danno muscolare, il caldo, una notte storta e una
        giornata pesante al lavoro, perché li senti tu. Gli studi che hanno
        confrontato i due metodi li trovano ben correlati ma lontani dall'essere
        identici (Impellizzeri et al., 2004), ed è proprio questo che serve:
        quando TRIMP e RPE di seduta non coincidono, sta succedendo qualcosa.
        Una soglia percepita come un 8 con un TRIMP normale merita un secondo
        sguardo.
      </p>

      <h2>Da una seduta a forma e fatica</h2>
      <p>
        Un TRIMP isolato dice poco. Serve come dato giornaliero del modello di
        Banister, che tiene due medie esponenziali del tuo carico: una lenta per
        la forma, di solito con una costante di 42 giorni (la CTL), e una veloce
        per la fatica, con 7 giorni (l'ATL). La freschezza, o TSB, è la
        differenza. Durante un blocco resta sotto zero; nello scarico pre-gara
        la fatica cala più in fretta della forma e la freschezza risale. Il
        modello è una descrizione, non una legge, e i 42 e 7 giorni sono
        convenzioni più che valori misurati su di te, ma l'andamento nell'arco
        di settimane è utile.
      </p>
      <p>
        Ne derivano due regole pratiche. Confronta il tuo carico con se stesso,
        non con quello di un altro né tra sistemi diversi: un TRIMP di 100 e un
        TSS di 100 su TrainingPeaks sono unità diverse. E leggi la curva su più
        settimane; un giorno da solo significa poco.
      </p>

      <h2>Come lo usa OpenAthlete</h2>
      <p>
        OpenAthlete calcola il TRIMP di Banister di ogni attività con frequenza
        cardiaca, secondo per secondo quando la traccia è completa, con i
        coefficienti 0,64/1,92 e 0,86/1,67 e la FCmax e la FC a riposo delle tue
        metriche. Se dai un voto di sforzo a un'attività, mostra anche l'RPE di
        seduta accanto, così vedi quando i due non coincidono. Forma, fatica e
        freschezza vengono poi proiettate sulle sedute che hai pianificato. La{' '}
        <Link href="/it/features/training-load">
          pagina sul carico di allenamento
        </Link>{' '}
        include un piccolo calcolatore di TRIMP e i link alle formule nel codice
        sorgente.
      </p>

      <h2>Fonti</h2>
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
          Wenger HA, Green HJ (a cura di), Physiological Testing of the
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
          Manzi V, Iellamo F, Impellizzeri F, D'Ottavio S, Castagna C. Relation
          between individualized training impulses and performance in distance
          runners. Medicine and Science in Sports and Exercise,
          2009;41(11):2090–2096.
        </li>
      </ul>
    </div>
  );
}
