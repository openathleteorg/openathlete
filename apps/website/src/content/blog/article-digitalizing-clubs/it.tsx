import Link from 'next/link';

export function ContentIt() {
  return (
    <div>
      <p>
        Pensa a una società di corsa o di triathlon qualsiasi. Pista il martedì,
        soglia o salite il giovedì, lungo di gruppo la domenica. Tre o quattro
        allenatori volontari, un responsabile tecnico che cura anche il sito
        della società, e tra quaranta e duecento tesserati, da chi prepara la
        prima 10 km a chi insegue la maratona sotto le 3 ore. L'allenamento vive
        in un gruppo WhatsApp, in un foglio condiviso che capisce una sola
        persona e nella memoria del responsabile tecnico.
      </p>
      <p>
        Funziona, finché non funziona più. Chi gestiva il foglio si trasferisce.
        Un tesserato con il tendine d'Achille dolorante lo dice a un allenatore
        che il martedì dopo non c'è. Il gruppo WhatsApp ha 140 persone e metà
        l'ha silenziato. Portare l'allenamento online non risolve niente di
        tutto questo da solo. Organizzarlo un minimo, sì.
      </p>

      <h2>Parti da chi allena chi</h2>
      <p>
        Prima di scegliere uno strumento, metti la struttura per iscritto. Le
        società che funzionano bene hanno di solito gli stessi elementi,
        qualunque sia il software:
      </p>
      <ul>
        <li>
          Gruppi definiti dal ritmo attuale, non dall'ambizione. Un gruppo
          "lento a 5:30-6:00/km" e uno "4:45-5:15/km" sono più chiari di
          "intermedio" e "avanzato", e si può passare dall'uno all'altro senza
          che sembri una promozione o una retrocessione.
        </li>
        <li>
          Un allenatore di riferimento per gruppo, e un sostituto per le
          settimane in cui manca.
        </li>
        <li>
          Per i tesserati che vogliono un piano individuale, un allenatore
          principale. Altri possono aiutare, ma una sola persona risponde del
          carico complessivo.
        </li>
        <li>
          Un unico posto dove si annotano infortuni e fastidi, così il prossimo
          allenatore di turno lo sa.
        </li>
      </ul>

      <h2>Scrivi le sedute della società una volta sola</h2>
      <p>
        Gran parte delle sedute di società si ripete con delle varianti: da 6 a
        10 × 400 m a ritmo 5 km con 200 m di recupero corsa, 3 × 8' a soglia,
        salite da 45". Il responsabile tecnico (o chi si diverte a farlo) scrive
        le sedute della settimana una volta, con obiettivi in percentuale della
        VAM, della soglia o della frequenza cardiaca massima di ogni tesserato
        invece che a ritmi fissi. Così chi corre a 4:00/km e chi corre a 6:00/km
        fanno lo stesso allenamento ciascuno alla propria intensità, e gli
        allenatori di gruppo regolano solo il volume: otto ripetute per un
        gruppo, cinque per un altro.
      </p>
      <p>
        Tienile in una libreria condivisa, non nella testa di qualcuno. Il
        giorno in cui il responsabile tecnico lascia, la società conserva le sue
        sedute.
      </p>

      <h2>Separa gli avvisi dalle conversazioni sull'allenamento</h2>
      <p>
        Un'unica chat di gruppo per tutto è il posto dove le informazioni vanno
        a morire. Dividila: un canale solo per gli avvisi (cambi di luogo, gare,
        assemblea), dove scrivono solo gli allenatori, e conversazioni
        sull'allenamento per gruppo. Il commento sulla seduta di una persona va
        su quella seduta, non in una chat da sessanta persone.
      </p>

      <h2>I dati sanitari richiedono attenzione</h2>
      <p>
        I dolori segnalati e le note sugli infortuni sono dati relativi alla
        salute, una categoria particolare secondo il GDPR, e possono esserlo
        anche frequenza cardiaca e sonno. I tesserati hanno diritto di sapere
        chi li vede. In pratica: chiedi il consenso prima di collegare
        l'orologio, dai a ogni allenatore accesso solo ai tesserati che segue
        davvero e decidi chi può leggere le note sugli infortuni. Per i ragazzi,
        coinvolgi i genitori.
      </p>

      <h2>Due modi per gestire una società su OpenAthlete</h2>
      <p>
        OpenAthlete ha uno spazio per le società. È gratuito sui nostri server,
        senza limiti di atleti, e una società che preferisce il proprio server
        ha le stesse funzioni installando OpenAthlete lì.
      </p>
      <p>
        <strong>Uno spazio per la società, sui nostri server.</strong> Un
        allenatore crea la società in Impostazioni &gt; Club e assegna a
        ciascuno un ruolo: proprietario, amministratore, allenatore, assistente
        o atleta. Ogni allenatore della società raggiunge gli atleti della
        società, e questi atleti non contano nel limite di cinque atleti di un
        account allenatore gratuito. I tesserati entrano da un elenco che
        importi (incollato, o in CSV dal foglio di calcolo della società, gruppi
        compresi), con un codice di accesso o tramite link che scadono. Ogni
        gruppo, per ritmo o per livello, ha i suoi allenatori, e la libreria
        della società raccoglie gli allenamenti e le cartelle che usano tutti i
        suoi allenatori.
      </p>
      <p>
        Per pianificare un gruppo, copi una seduta, un giorno o una settimana a
        molti atleti in una volta. Ogni copia si adatta alle zone e alle soglie
        dell'atleta, un'anteprima mostra cosa manca a ciascuno prima di
        confermare, e un solo annullamento riporta tutto indietro. Le sedute
        settimanali della società, come la pista del martedì allo stadio,
        arrivano nei calendari del gruppo con quattro settimane di anticipo: gli
        atleti dicono se vengono, l'allenatore vede quanti saranno e, se annulla
        una data, tutti ricevono una notifica. I messaggi vanno a un gruppo o a
        tutta la società, subito o programmati, e ogni seduta conserva il suo
        filo di commenti. La dashboard dell'allenatore è pensata per decine di
        atleti, con i totali di un periodo, avvisi quando una metrica come la
        frequenza cardiaca a riposo o il peso supera una soglia, e una barra
        laterale fatta per passare da un atleta all'altro fra trenta.
      </p>
      <p>
        Un atleta può comunque avere più allenatori, quindi quello di corsa e
        quello di forza pianificano nello stesso calendario. I tesserati possono
        usare qualsiasi orologio: le attività arrivano da Garmin, COROS, Suunto,
        Polar, Strava o da file, e gli allenamenti pianificati arrivano sugli
        orologi Garmin, COROS e Suunto, non sui Polar. Possono anche iscriversi
        alle proprie sedute da Google Calendar o Calendario di Apple. Quello che
        manca ancora è la fatturazione alla società: le quote si gestiscono
        fuori da OpenAthlete.
      </p>
      <p>
        <strong>La società ha la sua istanza.</strong> OpenAthlete è open
        source, quindi una società può installarlo su un piccolo server e avere
        la propria piattaforma al proprio indirizzo, con le stesse funzioni per
        le società, senza limiti di atleti né abbonamento. I tesserati possono
        accedere con single sign-on tramite Authentik, Keycloak o qualsiasi
        provider OpenID Connect, e le iscrizioni possono essere solo su invito o
        chiuse. Un'istanza self-hosted non invia nulla a OpenAthlete. Una
        precisazione onesta: la sincronizzazione con COROS funziona subito, ma
        Garmin, Suunto, Polar e Strava chiedono alla società di registrarsi al
        programma per sviluppatori di ciascun marchio, e Garmin e Suunto
        approvano i partner uno per uno. L'importazione di file funziona sempre.
      </p>
      <p>
        Per la maggior parte delle società, lo spazio sui nostri server è il
        modo più rapido per iniziare. Una società che vuole tenere i dati dei
        tesserati sul proprio server, e ha qualcuno a proprio agio nel gestirne
        uno, può scegliere la seconda strada. La{' '}
        <Link href="/it/clubs">pagina per le società</Link> presenta le due, e
        la <Link href="/it/self-hosting">pagina sul self-hosting</Link> spiega
        l'installazione. Se la tua società ha esigenze precise, raccontarci come
        vi allenate davvero è il contributo più utile che puoi darci.
      </p>
    </div>
  );
}
