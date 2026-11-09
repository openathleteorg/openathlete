import { DISCORD_URL } from '@/config';
import Link from 'next/link';

export function ContentIt() {
  return (
    <div>
      <p>
        Un allenamento strutturato sull'orologio fa tre cose utili: ti dice
        quando inizia e finisce ogni blocco, ti mostra se sei dentro il range
        previsto e conta le ripetute al posto tuo. In una seduta come 15' lento,
        5 × 4' a soglia con 2' di recupero corricchiando, 10' lento, è la
        differenza tra correre la seduta e fare i conti mentre corri.
      </p>
      <p>
        Portare la seduta da un piano di allenamento al polso dipende dalla
        marca. Questa guida copre le tre marche che accettano allenamenti da
        altre app (Garmin, COROS e Suunto), cosa fare con un Polar, e si chiude
        con una lista di controlli per il giorno in cui un allenamento non
        compare.
      </p>

      <h2>Quali orologi possono ricevere allenamenti</h2>
      <p>
        Tutte le marche ti fanno creare un allenamento nella loro app. Meno sono
        quelle che lasciano entrare un allenamento da una piattaforma esterna.
      </p>
      <ul>
        <li>
          <strong>Garmin</strong> accetta allenamenti dai partner approvati.
          Arrivano nel tuo calendario Garmin Connect e sull'orologio alla
          sincronizzazione successiva.
        </li>
        <li>
          <strong>Suunto</strong> li accetta come guide: è il nome che Suunto dà
          a una seduta strutturata da scegliere quando avvii un esercizio.
        </li>
        <li>
          <strong>COROS</strong> accetta sedute strutturate di corsa, trail e
          bici, che compaiono nel calendario dell'app COROS e poi sull'orologio.
        </li>
        <li>
          L'API pubblica di <strong>Polar</strong> permette di leggere le tue
          attività e il sonno, non di scrivere sul tuo account, quindi
          OpenAthlete non può inviarci allenamenti. Puoi sempre crearli a mano
          in Polar Flow.
        </li>
        <li>
          <strong>Strava</strong> non ha allenamenti strutturati: non c'è niente
          a cui inviarli.
        </li>
      </ul>

      <h2>Cosa rende un allenamento "strutturato"</h2>
      <p>
        Un orologio può guidarti solo attraverso dei passi. Ogni passo ha
        bisogno di una lunghezza (durata o distanza) e, idealmente, di un
        obiettivo: un range di passo, di frequenza cardiaca o di potenza. Le
        ripetizioni raggruppano i passi, quindi "5 × (4' a 4:10–4:20/km, 2'
        lento)" è un blocco di ripetizione con due passi.
      </p>
      <p>
        Una seduta che dice solo "60 minuti lento", senza passi, non invia
        niente: l'orologio non ha nulla da guidare. Se la vuoi al polso,
        trasformala in un unico passo di 60 minuti con un tetto di frequenza
        cardiaca.
      </p>
      <p>
        Due parole sugli obiettivi a zone. Le tue zone in una piattaforma di
        allenamento e quelle dell'orologio raramente coincidono. Quando un passo
        punta a una delle tue zone, OpenAthlete invia i valori reali (per
        esempio 148–158 bpm o 4:35–4:45/km) invece di "zona 3", così l'obiettivo
        al polso corrisponde al piano qualunque siano le zone impostate
        sull'orologio. Lo stesso vale per le percentuali di FCmax o di potenza
        di soglia, purché quei valori siano inseriti nelle tue metriche.
      </p>

      <h2>Garmin</h2>
      <p>
        Con Garmin collegato e l'esportazione degli allenamenti attiva, ogni
        seduta strutturata va nel tuo calendario Garmin Connect. L'orologio la
        riceve alla sincronizzazione successiva con l'app. Sulla maggior parte
        dei Forerunner, Fenix e Venu recenti, l'allenamento previsto per oggi
        viene proposto quando avvii l'attività corrispondente; altrimenti
        cercalo nel menu allenamento, tra gli allenamenti o nel calendario. I
        nomi dei menu cambiano da un modello all'altro, quindi controlla il
        manuale se non lo trovi.
      </p>
      <p>
        Se sposti o modifichi la seduta in OpenAthlete, la copia su Garmin la
        segue. Vengono inviate sedute di corsa, ciclismo, nuoto in piscina,
        forza, cardio, yoga e pilates. In piscina Garmin accetta solo il passo
        come obiettivo, quindi gli obiettivi di frequenza cardiaca nei passi di
        nuoto vengono scartati. Garmin limita anche un allenamento a 100 passi,
        ripetizioni comprese, cosa che conta solo se scrivi sedute in pista
        lunghissime passo per passo.
      </p>
      <p>
        I dettagli di configurazione sono nella{' '}
        <Link href="/it/connect/garmin">pagina di collegamento Garmin</Link>.
      </p>

      <h2>COROS</h2>
      <p>
        Le sedute di corsa, trail e ciclismo vanno a COROS. Compaiono nel
        calendario dell'app COROS e arrivano sull'orologio quando sincronizza.
        Nuoto e forza non vengono inviati.
      </p>
      <p>
        COROS ha una particolarità da conoscere prima della settimana di gara:
        un'app non può cancellare una seduta pianificata. Se sposti o elimini
        una seduta in OpenAthlete, quella vecchia resta nel calendario COROS
        segnata come annullata, e la cancelli tu nell'app COROS. Al
        collegamento, scegli la regione in cui hai creato l'account COROS
        (Europa, Stati Uniti e altre regioni, o Cina continentale): COROS tiene
        ogni account su un solo server regionale.
      </p>
      <p>
        Il connettore COROS è il più recente, attivo da novembre 2026. Dettagli
        e limiti noti nella{' '}
        <Link href="/it/connect/coros">pagina di collegamento COROS</Link>.
      </p>

      <h2>Suunto</h2>
      <p>
        Le sedute di corsa, trail, ciclismo e nuoto arrivano nel tuo account
        Suunto come guide. Sull'orologio, scegli la guida quando avvii
        l'esercizio, come qualsiasi altra guida Suunto. Le sedute di forza
        restano in OpenAthlete. La{' '}
        <Link href="/it/connect/suunto">pagina di collegamento Suunto</Link>{' '}
        spiega la configurazione.
      </p>

      <h2>Polar: le attività arrivano, gli allenamenti si fanno a mano</h2>
      <p>
        Con un Polar, attività, sonno e HRV notturna possono comunque arrivare
        in OpenAthlete in automatico. Per la seduta hai due strade: crearla in
        Polar Flow come obiettivo di allenamento a fasi e sincronizzare
        l'orologio, oppure seguirla dall'app OpenAthlete sul telefono. Nessuna
        delle due è comoda come una sincronizzazione diretta, ed è bene saperlo
        prima di comprare un orologio se le sedute strutturate ti interessano.
      </p>

      <h2>Quando è il tuo allenatore a pianificare</h2>
      <p>
        Le sedute partono dal collegamento dell'atleta, non da quello
        dell'allenatore. Il tuo allenatore può pianificare sul tuo calendario
        con qualsiasi orologio, o senza; finché hai collegato Garmin, COROS o
        Suunto con l'esportazione attiva, le sue sedute arrivano al tuo polso
        come quelle che pianifichi tu. Un allenatore può seguire atleti sulle
        tre marche senza fare niente di diverso per ciascuno.
      </p>

      <h2>L'allenamento non è sull'orologio: la lista di controlli</h2>
      <p>Vai in ordine. I primi due punti spiegano quasi tutti i casi.</p>
      <ul>
        <li>
          <strong>La seduta è nei prossimi sette giorni?</strong> OpenAthlete
          invia la settimana in arrivo, non tutto il piano. Una seduta fra tre
          settimane partirà da sola quando entrerà nei sette giorni. Le sedute
          passate non vengono inviate.
        </li>
        <li>
          <strong>L'orologio ha sincronizzato da allora?</strong> L'allenamento
          arriva prima su Garmin Connect, sull'app COROS o sull'app Suunto. Apri
          l'app della marca e lascia sincronizzare l'orologio.
        </li>
        <li>
          <strong>L'esportazione è attiva?</strong> In Impostazioni, Connettori,
          controlla che l'esportazione degli allenamenti sia attiva per quella
          marca.
        </li>
        <li>
          <strong>La seduta ha dei passi?</strong> Una durata senza passi non
          invia niente.
        </li>
        <li>
          <strong>Quella marca supporta lo sport?</strong> Una seduta di forza
          non va né a COROS né a Suunto; il nuoto non va a COROS.
        </li>
        <li>
          <strong>Il tuo modello segue allenamenti strutturati?</strong> La
          maggior parte degli orologi da corsa recenti sì; alcuni modelli entry
          level o vecchi no.
        </li>
        <li>
          <strong>Solo COROS:</strong> una seduta spostata può comparire due
          volte, una segnata come annullata. Cancella quella nell'app COROS.
        </li>
        <li>
          <strong>Ancora niente?</strong> Scollega e ricollega la marca in
          Impostazioni, Connettori, poi scrivici su{' '}
          <a href={DISCORD_URL}>Discord</a> con la data della seduta.
        </li>
      </ul>

      <h2>Farlo a mano</h2>
      <p>
        Non serve nessuna piattaforma per mettere un allenamento sull'orologio.
        Garmin Connect, l'app COROS e Polar Flow hanno tutti un editor di
        allenamenti: crei i passi, salvi, sincronizzi. Per una seduta chiave a
        settimana sono dieci minuti e funziona bene. Diventa pesante quando il
        piano cambia spesso, quando un allenatore scrive per più atleti o quando
        i passi devono seguire zone aggiornate. È lì che conviene lasciare che
        sia una piattaforma a inviarli.
      </p>
      <p>
        OpenAthlete invia allenamenti a Garmin, COROS e Suunto nel piano
        gratuito, e importa attività da queste tre marche oltre che da Polar e
        Strava. La{' '}
        <Link href="/it/features/watch-sync">
          pagina sulla sincronizzazione
        </Link>{' '}
        ha la tabella completa, marca per marca.
      </p>
    </div>
  );
}
