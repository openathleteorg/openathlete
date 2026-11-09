import Link from 'next/link';

export function ContentIt() {
  return (
    <div>
      <p>
        Qualche anno di storico di allenamento è un sacco di materiale: ogni
        seduta di ripetute, ogni traccia di frequenza cardiaca, ogni nota tipo
        "dormito cinque ore, gambe vuote". Per un allenatore è ancora di più:
        anni di allenamenti strutturati, modelli e stagioni costruite per ogni
        atleta. Dove sta quel materiale, e chi decide cosa ne sarà, sembra una
        questione astratta fino al giorno in cui una piattaforma chiude o cambia
        proprietario.
      </p>

      <h2>Le piattaforme chiudono e cambiano proprietario</h2>
      <p>
        Today's Plan, una piattaforma di allenamento e coaching, ha chiuso a
        marzo 2024. I suoi utenti hanno dovuto esportare quello che potevano e
        ricostruire tutto altrove. A luglio 2026 Garmin{' '}
        <a href="https://www.garmin.com/en-US/newsroom/press-release/corporate/garmin-acquires-trainingpeaks-and-trainheroic-leading-endurance-and-strength-training-platforms-for-athletes-and-coaches/">
          ha acquisito TrainingPeaks e TrainHeroic
        </a>
        . TrainingPeaks va avanti, e niente dice che tratterà in modo diverso
        gli altri marchi. Ma i piani, le librerie di allenamenti e i rapporti
        con gli atleti di molti allenatori di endurance ora appartengono a un
        produttore di orologi, e le decisioni su quella piattaforma verranno
        prese tenendo conto degli interessi di Garmin.
      </p>
      <p>
        Niente di scandaloso. Le aziende vengono comprate e a volte falliscono.
        Il punto è che, con una piattaforma chiusa, il tuo storico di
        allenamento dura quanto l'azienda che lo custodisce.
      </p>

      <h2>Cosa ottieni davvero quando "esporti i tuoi dati"</h2>
      <p>
        Se vivi nell'Unione europea, l'articolo 20 del GDPR ti dà il diritto
        alla portabilità: i dati che hai fornito, in un formato strutturato e
        leggibile da una macchina. In pratica, quello che puoi portare via
        cambia molto. I file delle attività (FIT, GPX) di solito escono senza
        problemi, perché ogni strumento li legge. Gli allenamenti pianificati, i
        commenti dell'allenatore, i modelli e il modo in cui è stata costruita
        una stagione sono un'altra storia: spesso sono salvati in un formato
        proprio della piattaforma e, anche quando si possono esportare, può
        darsi che nessun altro strumento sappia importarli.
      </p>
      <p>
        Due abitudini aiutano, qualunque strumento tu usi. Fai arrivare le tue
        attività in più di un posto, per esempio dall'account dell'orologio sia
        alla piattaforma di allenamento sia a un secondo servizio, così nessuna
        azienda ha l'unica copia. E chiedi un'esportazione completa una volta
        all'anno, prima di averne bisogno, per vedere cosa otterresti davvero.
      </p>

      <h2>Cosa cambia l'open source, e cosa no</h2>
      <p>
        Il codice di OpenAthlete è{' '}
        <a href="https://github.com/openathleteorg/openathlete">pubblico</a>.
        Questo ha alcune conseguenze concrete. Puoi leggere come viene calcolato
        il carico di allenamento invece di fidarti di una scatola nera. Puoi
        vedere quali dati lasciano il server e dove vanno. E se il progetto si
        fermasse domani, il codice, lo schema del database e i file di
        migrazione resterebbero lì, e chiunque potrebbe continuare a farlo
        girare. I dati stanno in un normale database PostgreSQL, non in un
        formato che capisce una sola azienda.
      </p>
      <p>
        L'open source non rende sicuro un software da solo. Un codice che
        nessuno legge non è più sicuro solo perché è pubblico, e un piccolo
        progetto ha meno revisori di uno popolare. Non garantisce nemmeno che
        qualcuno continuerà a mantenerlo. Quello che garantisce è che hai il
        permesso di guardare, e che esiste la possibilità di andare avanti senza
        l'autore originale.
      </p>

      <h2>Perché l'AGPL</h2>
      <p>
        OpenAthlete è distribuito con la{' '}
        <a href="https://www.gnu.org/licenses/agpl-3.0.html">
          GNU Affero General Public License v3
        </a>
        . Chiunque può usarlo, modificarlo, farlo girare e ridistribuirlo. La
        condizione è che, se lo modifichi e lasci che altre persone usino la tua
        versione attraverso una rete, devi offrire loro il codice sorgente di
        quella versione. La GPL normale non lo richiede per un software usato
        come servizio web, ed è per questo che esiste la variante Affero.
      </p>
      <p>
        In pratica, nessuno può prendere OpenAthlete, aggiungere funzioni e
        venderlo come servizio ospitato chiuso. I miglioramenti di chiunque lo
        offra ad altri tornano a tutti. La versione ospitata su openathlete.org
        usa lo stesso codice pubblico; le funzioni che hanno senso solo lì, come
        la fatturazione, restano disattivate finché non vengono configurate.
      </p>

      <h2>Self-hosting, senza abbellimenti</h2>
      <p>
        Puoi installare OpenAthlete sul tuo server con il{' '}
        <code>docker-compose.yml</code> del repository o con le immagini
        pubblicate su GHCR. Servono PostgreSQL e Redis, entrambi inclusi nel
        file compose. È gratuito, senza limiti di atleti né funzioni a
        pagamento. Un'istanza self-hosted non invia nulla a OpenAthlete, e un
        test automatico lo verifica a ogni rilascio. Puoi collegare il single
        sign-on tramite OIDC, scegliere iscrizioni aperte, su invito o chiuse, e
        far girare le funzioni di IA su un modello locale tramite Ollama, così
        che niente lasci la tua macchina.
      </p>
      <p>
        I costi però sono reali. Backup, aggiornamenti e sicurezza sono a carico
        tuo. I collegamenti con gli orologi usano le tue credenziali da
        sviluppatore presso ogni fornitore: alcune, come quelle di Strava, si
        ottengono in fretta, altre, come quelle di Garmin, passano da una
        revisione della richiesta prima di dare accesso all'API. Il caricamento
        di file FIT, GPX o TCX funziona senza niente di tutto questo. Il
        self-hosting ha più senso per un allenatore o un gruppo con qualcuno a
        suo agio con un server, o per un'organizzazione che deve tenere i dati
        dei suoi atleti sulla propria infrastruttura. La{' '}
        <Link href="/it/self-hosting">pagina sul self-hosting</Link> spiega
        l'installazione.
      </p>

      <h2>Se preferisci non gestire un server</h2>
      <p>
        La versione ospitata è gratuita, con tutte le funzioni. API e database
        girano su OVH, in Francia, e l'app web è servita da Vercel. Il piano
        Supporter (5 € al mese o 50 € all'anno) aggiunge l'IA sulle chiavi di
        OpenAthlete e la possibilità di seguire più di cinque atleti, e aiuta a
        pagare i server. Le ragioni del progetto sono nella{' '}
        <Link href="/it/open-source">pagina sull'open source</Link>.
      </p>
    </div>
  );
}
