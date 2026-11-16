import Link from 'next/link';

import { pricesFor } from './prices';

const { quoted: q, coachYear } = pricesFor('it');

export function ContentIt() {
  return (
    <div>
      <p>
        TrainingPeaks è da tempo la piattaforma predefinita degli allenatori di
        endurance, e per buoni motivi: il Performance Management Chart, un
        vocabolario (TSS, CTL, TSB) che ormai mezzo ambiente parla, un negozio
        pieno di piani e app mobili mature. Chi cerca altrove lo fa soprattutto
        per i soldi. L'account Basic gratuito non invia gli allenamenti
        pianificati all'orologio, e gli allenatori pagano per ogni atleta su
        Premium. Da quando Garmin ha comprato TrainingPeaks il 22 luglio 2026,
        alcuni vogliono anche una piattaforma che non appartenga a un produttore
        di orologi; la questione ha un articolo a parte,
        <Link href="/it/blog/trainingpeaks-alternatives-after-garmin-acquisition">
          alternative a TrainingPeaks dopo l'acquisizione di Garmin
        </Link>
        . Questo resta su prezzi e funzioni.
      </p>
      <p>
        Questo articolo confronta quattro alternative su quanto costano e cosa
        fanno: intervals.icu, Nolio, Final Surge e OpenAthlete, che è la nostra.
        I prezzi vengono dalla pagina prezzi di ciascuna azienda, controllata il
        3 novembre 2026. I prezzi in dollari USA sono al netto delle tasse, come
        li mostrano le aziende.
      </p>

      <h2>Quanto costa TrainingPeaks</h2>
      <p>
        Per un atleta, Basic è gratuito e Premium costa {q('tpMonth')} al mese o{' '}
        {q('tpYear')} all'anno. Inviare allenamenti strutturati all'orologio è
        una funzione Premium, ed è il motivo principale per cui chi si allena da
        solo passa a pagamento.
      </p>
      <p>
        Per un allenatore, il piano base costa {q('tpCoach')} al mese, con
        quattro atleti Basic e uno Premium. Ogni atleta Premium in più aggiunge{' '}
        {q('tpPerMax')} al mese, che scendono fino a {q('tpPerMin')} con i
        volumi, e c'è un costo di attivazione di {q('tpSetup')}, annullato con
        un codice promozionale. In pratica, un allenatore i cui atleti hanno
        tutti bisogno degli allenamenti sull'orologio paga circa{' '}
        {coachYear('trainingpeaks', 10)} all'anno per dieci atleti e{' '}
        {coachYear('trainingpeaks', 30)} per trenta, a meno che gli atleti non
        si paghino il proprio Premium.
      </p>

      <h2>Cosa confrontare</h2>
      <p>
        Gli elenchi di funzioni si somigliano tutti. Quattro domande distinguono
        meglio queste piattaforme:
      </p>
      <ul>
        <li>
          Gli allenamenti pianificati arrivano all'orologio con il piano
          gratuito, e per quali marche?
        </li>
        <li>
          Come viene calcolato il carico di allenamento, e la formula è
          visibile? Nessuna alternativa usa il TSS, quindi i numeri non
          corrisponderanno a quelli a cui sei abituato.
        </li>
        <li>Come cresce il prezzo per l'allenatore con il numero di atleti?</li>
        <li>
          Puoi portare via i tuoi dati, e cosa succede se l'azienda chiude?
          Today's Plan, una piattaforma di coaching a pagamento, ha chiuso nel
          marzo 2024 e i suoi utenti hanno dovuto trasferire tutti gli atleti.
        </li>
      </ul>

      <h2>intervals.icu</h2>
      <p>
        intervals.icu è gratuito, con un piano Supporter facoltativo a{' '}
        {q('icuMonth')} al mese ({q('icuYear')} all'anno). È l'opzione più forte
        di questa lista per l'analisi: curve di potenza, grafici personalizzati
        e la lista di integrazioni più ampia, con Wahoo e Zwift per gli
        allenamenti, che OpenAthlete non copre. Allenare altri è gratuito;
        squadre e organizzazioni richiedono Supporter. Non ci sono app mobili
        ufficiali (esistono app di terzi) e il codice è chiuso. Se ti alleni da
        solo e ami i dati, parti da qui.
      </p>

      <h2>Nolio</h2>
      <p>
        Nolio, azienda di Grenoble partner della federazione francese di
        atletica, ha un piano gratuito per atleti generoso, con sincronizzazione
        dell'orologio e allenamenti strutturati. Premium costa{' '}
        {q('nolioPremium')} al mese. I piani per allenatori costano{' '}
        {q('nStarter')} al mese per 3 atleti, {q('nClassic')} per 25 e{' '}
        {q('nPro')} per 30 atleti e due allenatori. Ci sono piani per i club,
        app native e oltre 200 video di esercizi. Non pubblicizza IA integrata
        e, come le altre, ha codice chiuso. Il nostro{' '}
        <Link href="/it/blog/nolio-vs-trainingpeaks-vs-openathlete-2025-comparison">
          confronto a tre con TrainingPeaks
        </Link>{' '}
        approfondisce il lato allenatore.
      </p>

      <h2>Final Surge</h2>
      <p>
        Final Surge è gratuito per gli atleti. Gli allenatori pagano una tariffa
        fissa di {q('fsStarter')} al mese da 1 a 5 atleti o {q('fsPro')} fino a
        100, senza costo per atleta. Gli allenamenti strutturati vanno a Garmin
        e COROS. È pensato per allenatori, scuole e club di corsa americani, con
        sconti per le scuole e app native. Prezzi semplici e onesti; meno
        profondità nell'analisi.
      </p>

      <h2>OpenAthlete</h2>
      <p>
        Tutte le funzioni sono gratuite sui nostri server: calendario, editor di
        allenamenti, invio degli allenamenti a Garmin, Suunto e COROS, carico di
        allenamento e coaching fino a cinque atleti. Il piano Supporter
        facoltativo ({q('oaMonth')} al mese o {q('oaYear')} all'anno) aggiunge
        l'IA sulle nostre chiavi e atleti illimitati, e nient'altro. Il codice è
        AGPL-3.0, quindi puoi anche installarlo sul tuo server, gratis e senza
        limiti. Anche i club hanno uno spazio gratuito, senza limiti di atleti:
        gruppi con i loro allenatori, una libreria di allenamenti condivisa,
        sedute settimanali del club e piani copiati a tutto un gruppo.
      </p>
      <p>
        Il carico di allenamento è il TRIMP di Banister dalla frequenza
        cardiaca, con l'RPE di seduta accanto, e forma, fatica e freschezza sono
        proiettate sulle sedute pianificate. Le funzioni di IA usano la tua
        chiave (OpenAI, Anthropic, Mistral e altri) con qualsiasi piano: una
        seduta strutturata da una frase, una breve lettura di ogni attività e
        qualche domanda dopo ogni uscita che registra sforzo e dolori per
        l'allenatore. Claude o ChatGPT possono anche pianificare nel calendario
        tramite il server MCP.
      </p>
      <p>
        Cosa non fa ancora: le app iOS e Android sono in test (nel frattempo
        l'app web si installa sul telefono), non ci sono negozio di piani, app
        per l'allenamento indoor né fatturazione per i club, e l'analisi della
        potenza è meno approfondita che su intervals.icu. Gli allenamenti non
        possono andare sugli orologi Polar, perché la loro API è in sola
        lettura. Le unità sono solo metriche.
      </p>

      <h2>I numeri a confronto</h2>
      <table>
        <thead>
          <tr>
            <th></th>
            <th>Atleta che si allena da solo, allenamenti sull'orologio</th>
            <th>Allenatore con 10 atleti, all'anno</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>TrainingPeaks</td>
            <td>Premium, {q('tpYear')}/anno</td>
            <td>{coachYear('trainingpeaks', 10)} (atleti su Premium)</td>
          </tr>
          <tr>
            <td>intervals.icu</td>
            <td>Gratis (Supporter {q('icuYear')}/anno facoltativo)</td>
            <td>Gratis; le squadre richiedono Supporter</td>
          </tr>
          <tr>
            <td>Nolio</td>
            <td>Gratis</td>
            <td>{coachYear('nolio', 10)} (Classic)</td>
          </tr>
          <tr>
            <td>Final Surge</td>
            <td>Gratis</td>
            <td>{coachYear('final-surge', 10)} (Pro)</td>
          </tr>
          <tr>
            <td>OpenAthlete</td>
            <td>Gratis</td>
            <td>{q('oaYear')} (Supporter)</td>
          </tr>
        </tbody>
      </table>
      <p>
        Prezzi di listino controllati il 3 novembre 2026. Le aziende li
        cambiano: verifica le loro pagine prima di decidere.
      </p>

      <h2>Quale fa per te</h2>
      <p>
        Resta su TrainingPeaks se vendi piani nel suo negozio, se i tuoi atleti
        usano TrainingPeaks Virtual o se tutto il tuo lavoro si basa sul TSS e
        non vuoi reimparare i numeri. Scegli intervals.icu per l'analisi
        gratuita più profonda, soprattutto con un misuratore di potenza. Scegli
        Nolio se alleni in un club francese e vuoi prezzi per associazioni e app
        native subito. Scegli Final Surge per una squadra scolastica o un club
        americano con tariffa fissa. Scegli OpenAthlete se vuoi gli allenamenti
        sul tuo Garmin, Suunto o COROS senza pagare, un prezzo fisso da
        allenatore, l'IA con la tua chiave, uno spazio club gratuito o un codice
        che puoi ospitare tu.
      </p>

      <h2>Portarti lo storico</h2>
      <p>
        Le tue attività sono anche nell'account del tuo orologio, che di solito
        è la fonte più semplice. In OpenAthlete, Strava e COROS portano tutto lo
        storico, Garmin e Suunto gli ultimi 30 giorni, e Polar solo quello che
        registri dopo il collegamento; i file FIT, GPX e TCX più vecchi si
        caricano in blocco. Allenamenti pianificati e piani non passano da una
        piattaforma all'altra, quindi ricrea le tue sedute abituali come
        modelli. Non abbiamo verificato noi l'esportazione in blocco di
        TrainingPeaks: controlla il suo centro assistenza prima di contarci.
      </p>
      <p>
        Se vuoi provare OpenAthlete, la{' '}
        <Link href="/it/pricing">pagina dei prezzi</Link> spiega cosa è gratuito
        e cosa aggiunge Supporter.
      </p>
    </div>
  );
}
