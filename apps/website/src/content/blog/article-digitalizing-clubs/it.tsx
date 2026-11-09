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

      <h2>Due modi per gestire una società su OpenAthlete oggi</h2>
      <p>
        Prima la risposta diretta: OpenAthlete non ha un account per società.
        Niente gruppi, niente calendario di società, niente fatturazione alla
        società. Quello che c'è funziona comunque per una società, in uno di
        questi due modi.
      </p>
      <p>
        <strong>Un account per allenatore, sui nostri server.</strong> Ogni
        allenatore ha il suo account gratuito, che copre fino a cinque atleti;
        Supporter (5 € al mese o 50 € l'anno per allenatore) toglie il limite.
        Un atleta può avere più allenatori, quindi quello di corsa e quello di
        forza pianificano nello stesso calendario. Le conversazioni di gruppo
        tengono insieme un gruppo di allenamento, ogni seduta ha il suo filo di
        commenti e ogni allenatore ha una dashboard per i propri atleti con
        rispetto del piano, volume, forma e avvisi su dolori e inattività. I
        tesserati possono usare qualsiasi orologio: le attività arrivano da
        Garmin, COROS, Suunto, Polar, Strava o da file, e gli allenamenti
        pianificati arrivano sugli orologi Garmin, COROS e Suunto. Possono anche
        iscriversi alle proprie sedute da Google Calendar o Calendario di Apple.
      </p>
      <p>
        <strong>La società ha la sua istanza.</strong> OpenAthlete è open
        source, quindi una società può installarlo su un piccolo server e avere
        la propria piattaforma al proprio indirizzo, senza limiti di atleti né
        abbonamento. I tesserati possono accedere con single sign-on tramite
        Authentik, Keycloak o qualsiasi provider OpenID Connect, e le iscrizioni
        possono essere solo su invito o chiuse. Un'istanza self-hosted non invia
        nulla a OpenAthlete. Una precisazione onesta: la sincronizzazione con
        COROS funziona subito, ma Garmin, Suunto, Polar e Strava chiedono alla
        società di registrarsi al programma per sviluppatori di ciascun marchio,
        e Garmin e Suunto approvano i partner uno per uno. L'importazione di
        file funziona sempre.
      </p>
      <p>
        Per una società con uno o due allenatori e qualche decina di atleti, la
        prima opzione è il modo più rapido per iniziare. Per una società più
        grande, con qualcuno a proprio agio con un server, la seconda è quanto
        di più vicino a un account di società esista oggi. La{' '}
        <Link href="/it/clubs">pagina per le società</Link> confronta le due,
        con i costi per una società di 50 atleti, e la{' '}
        <Link href="/it/self-hosting">pagina sul self-hosting</Link> spiega
        l'installazione. Le funzioni per le società sono nella roadmap; se la
        tua ha esigenze precise, raccontarci come vi allenate davvero è il
        contributo più utile che puoi darci.
      </p>
    </div>
  );
}
