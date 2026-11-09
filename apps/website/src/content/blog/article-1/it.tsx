import Link from 'next/link';

export function ContentIt() {
  return (
    <div>
      <p>
        OpenAthlete è una piattaforma di allenamento per atleti di endurance e
        per i loro allenatori. Ha un calendario delle sedute pianificate,
        allenamenti strutturati che arrivano sull'orologio, attività che ne
        tornano, un modello di carico di allenamento e uno spazio condiviso dove
        allenatore e atleta lavorano sullo stesso piano. Il codice è open
        source, con licenza AGPL-3.0. La versione ospitata è gratuita, e puoi
        anche installarla sul tuo server.
      </p>
      <p>
        Questo articolo spiega perché esiste, cosa fa oggi e, altrettanto utile,
        cosa non fa.
      </p>

      <h2>Perché esiste</h2>
      <p>
        Dietro OpenAthlete c'è uno sviluppatore indipendente di Grenoble che
        corre ultra. Nessun investitore. Il progetto è nato da una routine nota
        a molti: pianificare la stagione su un foglio di calcolo, ridigitare
        ogni seduta di ripetute nell'app del produttore dell'orologio, poi
        aprire una terza app per vedere se la seduta era andata come previsto.
        Tre strumenti, e nessuno sapeva niente degli altri due.
      </p>
      <p>
        Le piattaforme commerciali che risolvono il problema sono buoni
        prodotti. Fanno però pagare gli allenatori per atleta e conservano anni
        di storico sui loro server, alle loro condizioni. Quando Today's Plan ha
        chiuso, a marzo 2024, i suoi utenti hanno scoperto quanta parte di
        quello storico potevano davvero portare via. A luglio 2026 Garmin ha
        comprato TrainingPeaks, una delle piattaforme di coaching più
        conosciute: i piani di molti allenatori ora dipendono da un produttore
        di orologi.
      </p>
      <p>
        L'idea di OpenAthlete è che il cuore di una piattaforma di allenamento
        (un calendario, allenamenti strutturati, un modello di carico, il
        collegamento con l'orologio) sia infrastruttura. E un'infrastruttura
        funziona meglio quando chiunque può leggerla, farla girare e tenerla in
        vita.
      </p>

      <h2>Cosa fa oggi</h2>
      <p>
        <strong>Pianificazione.</strong> Costruisci gli allenamenti passo per
        passo, per esempio 15 minuti facili, 5 × 4 minuti alla soglia con 2
        minuti di corsetta, 10 minuti facili, e gli obiettivi vengono dalle tue
        zone, dai tuoi ritmi o da percentuali di VAM, FTP o frequenza cardiaca
        massima. Le sedute stanno in un calendario dove si trascinano, e un
        allenatore può spostare o copiare intere settimane in un colpo.
      </p>
      <p>
        <strong>Il tuo orologio.</strong> Gli allenamenti pianificati vengono
        inviati agli orologi Garmin, Suunto e COROS. Le attività svolte arrivano
        da Garmin, COROS, Suunto, Polar e Strava, oppure da un file FIT, GPX o
        TCX. Quando colleghi un account, Strava e COROS importano tutto lo
        storico, Garmin e Suunto gli ultimi 30 giorni, Polar solo le nuove
        attività.
      </p>
      <p>
        <strong>Carico di allenamento.</strong> Il carico è calcolato con il
        TRIMP a partire dalla frequenza cardiaca, con l'RPE di seduta registrato
        accanto. Forma, fatica e freschezza (CTL, ATL e TSB) sono proiettate
        sulle sedute pianificate, così vedi cosa faranno le prossime tre
        settimane alla tua forma prima della gara e non dopo. La pagina sul{' '}
        <Link href="/it/features/training-load">carico di allenamento</Link>{' '}
        spiega il modello.
      </p>
      <p>
        <strong>Allenatori.</strong> L'allenatore pianifica direttamente nel
        calendario di ogni atleta, riusa i modelli e vede cosa è stato fatto
        davvero. Un atleta può avere più di un allenatore, e c'è una chat di
        gruppo. Seguire fino a cinque atleti è gratis.
      </p>
      <p>
        <strong>IA, se la vuoi.</strong> Non parte niente senza il tuo consenso,
        che puoi ritirare quando vuoi. Una volta attivata, l'IA può scrivere una
        seduta strutturata partendo da una frase, modificare una seduta con una
        breve istruzione, farti tre o quattro domande dopo un'attività e
        trasformare le risposte in un punteggio di fatica e una nota sul dolore
        che il tuo allenatore vede, darti una breve lettura di ogni nuova
        attività e stimare il carico di una seduta pianificata. Usi la tua
        chiave API (OpenAI, Anthropic, Google, Mistral e altri, oppure un
        modello locale su un'istanza self-hosted) o la quota inclusa nel piano
        Supporter. Nell'app non c'è una chat: se vuoi conversare, il{' '}
        <Link href="/it/features/mcp-server">server MCP</Link> permette a Claude
        o a ChatGPT di leggere il tuo allenamento e pianificare sedute nel tuo
        calendario.
      </p>

      <h2>Cosa non fa</h2>
      <ul>
        <li>
          Gli allenamenti non si possono inviare agli orologi Polar né a Strava.
          Entrambi sono solo fonti di attività.
        </li>
        <li>
          Non esiste un'entità club o squadra. Un allenatore può pianificare per
          molti atleti insieme, ma non c'è una pagina né una gestione del club.
        </li>
        <li>
          Non prevede gli infortuni. Registra il dolore quando l'atleta lo
          segnala e lo mostra all'allenatore: meno spettacolare, più onesto.
        </li>
        <li>Le unità sono solo metriche.</li>
        <li>
          Le app per iOS e Android sono in fase di test. Nel frattempo l'app web
          funziona sul telefono e si può installare nella schermata home.
        </li>
        <li>
          Il collegamento con COROS è nuovo: qualche imperfezione è possibile, e
          ci fa piacere se ce la segnali.
        </li>
      </ul>

      <h2>Come si finanzia</h2>
      <p>
        Tutte le funzioni sono gratuite sulla versione ospitata. Il piano
        Supporter, a 5 € al mese o 50 € all'anno, aggiunge due cose: l'IA sulle
        chiavi di OpenAthlete, con una quota mensile, e la possibilità di
        seguire più di cinque atleti. Il self-hosting è gratuito e senza limiti.
        I dettagli sono nella <Link href="/it/pricing">pagina dei prezzi</Link>.
      </p>
      <p>
        L'API e il database della versione ospitata girano su OVH, in Francia, e
        l'app web è servita da Vercel. Un'istanza self-hosted non invia nulla a
        OpenAthlete, e un test automatico lo verifica a ogni rilascio.
      </p>

      <h2>Da dove cominciare</h2>
      <p>
        Se ti alleni da solo, collega l'orologio, imposta le tue zone (il{' '}
        <Link href="/it/tools/heart-rate-zones">
          calcolatore delle zone di frequenza cardiaca
        </Link>{' '}
        è un buon punto di partenza se non le hai mai misurate) e pianifica una
        settimana. Se alleni, invita prima un solo atleta e fate una settimana
        completa insieme prima di spostare tutti.
      </p>
      <p>
        Il codice sorgente è su{' '}
        <a href="https://github.com/openathleteorg/openathlete">GitHub</a>.
        Segnalazioni di bug e richieste di funzioni si lasciano lì o su Discord.
        Vengono lette, e decidono buona parte di ciò che verrà costruito dopo.
      </p>
    </div>
  );
}
