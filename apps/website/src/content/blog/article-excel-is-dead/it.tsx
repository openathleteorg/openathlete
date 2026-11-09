import Link from 'next/link';

export function ContentIt() {
  return (
    <div>
      <p>
        Molti bravi allenatori gestiscono tutto il loro lavoro da un foglio di
        calcolo. Una scheda per atleta, una riga per giorno, un colore per tipo
        di seduta e una colonna di commenti che l'atleta compila, oppure no. È
        gratis, si adatta a qualsiasi metodo e nessuno te lo può togliere. Il
        titolo di questo articolo è un po' ingiusto: Excel non è morto, e per
        alcuni allenatori resta lo strumento giusto.
      </p>
      <p>
        Ha però dei costi, che crescono con il numero di atleti in modi facili
        da sottovalutare. Questo articolo li passa in rassegna, spiega come
        sfruttare meglio un foglio di calcolo se decidi di tenerlo, e quando un
        software dedicato comincia a valerne la pena.
      </p>

      <h2>Dove il foglio di calcolo funziona</h2>
      <p>
        Con tre-cinque atleti che conosci bene, che si allenano soprattutto a
        sensazione e ti scrivono dopo le sedute chiave, un foglio di calcolo è
        difficile da battere. In una cella puoi scrivere qualsiasi cosa: "6 × 1
        km a passo 10 km, 1'30 di recupero corricchiando, fermati alla 4 se i
        polpacci tirano" è una prescrizione perfettamente valida, e nessun
        software ti imporrà il suo vocabolario. Con Google Sheets condividere è
        facile, lo storico resta dove l'hai messo e non c'è abbonamento.
      </p>

      <h2>Dove comincia a costare</h2>
      <p>
        Il primo costo è a carico dell'atleta. Una seduta scritta in una cella
        va ricopiata in Garmin Connect o nell'app COROS per comparire
        sull'orologio, oppure ricordata durante l'uscita. Quasi tutti lo fanno
        per la seduta chiave della settimana e saltano il resto, quindi la
        soglia si corre al passo che ricordano, non a quello che hai scritto.
      </p>
      <p>
        Il secondo è il ritorno. Per confrontare il pianificato con il fatto,
        qualcuno deve ricopiare l'uscita da Strava o dall'app dell'orologio:
        distanza, tempo, magari la frequenza media. O lo fa l'atleta, quando se
        ne ricorda, o lo fai tu, la domenica sera. In entrambi i casi hai un
        riassunto della seduta, non la seduta: vedi che il 6 × 1 km è uscito a
        4:05/km di media, non che le ultime due ripetute erano a 4:15 con il
        cuore che saliva.
      </p>
      <p>
        Il terzo sono i cambiamenti. Una gara slitta di due settimane, un atleta
        resta malato cinque giorni, una vacanza in montagna sostituisce un
        blocco in pista. In un foglio di calcolo riscrivi le righe a mano,
        controlli che i totali settimanali abbiano ancora senso e speri che
        l'atleta abbia aperto l'ultima versione e non quella allegata alla mail
        di martedì scorso.
      </p>
      <p>
        Il quarto è il carico. La maggior parte degli allenatori che restano sul
        foglio di calcolo segue il volume (chilometri, ore) e poco altro, perché
        andare oltre richiede formule e inserimento dati. Il volume da solo
        nasconde molto: 60 km di corsa lenta e 60 km con due sedute di qualità
        non sono la stessa settimana.
      </p>

      <h2>Se resti sul foglio di calcolo, fallo bene</h2>
      <p>Qualche abitudine risolve quasi tutto senza cambiare strumento.</p>
      <ul>
        <li>
          Usa un foglio online condiviso per atleta invece di file mandati per
          mail. Così esiste una sola versione, e l'atleta vede le modifiche
          appena le fai.
        </li>
        <li>
          Aggiungi due colonne che l'atleta compila dopo ogni seduta: la durata
          in minuti e lo sforzo su una scala da 0 a 10. Moltiplicale e ottieni
          l'RPE di seduta di Foster (Foster et al., 2001), una misura di carico
          che non richiede alcun dispositivo: 50 minuti a RPE 6 fanno 300.
          Sommalo per settimana e vedi un blocco che cresce, o una settimana che
          è andata oltre.
        </li>
        <li>
          Tieni un modello per ogni seduta ricorrente ("soglia 5 × 4'", "lungo
          con gli ultimi 20' a passo maratona") e copialo invece di riscriverlo.
          Meno errori, e l'atleta impara il vocabolario.
        </li>
        <li>
          Chiedi una riga di commento per seduta, non un paragrafo. "Gambe
          pesanti, tendine d'Achille sinistro rigido al risveglio" è esattamente
          quello che serve per cogliere un problema in tempo.
        </li>
      </ul>
      <p>
        Così un foglio di calcolo fa un lavoro dignitoso con una manciata di
        atleti. Continua a non mettere la seduta sull'orologio, e continua a
        dipendere da persone che ricopiano numeri che esistono già altrove.
      </p>

      <h2>Cosa cambia un software</h2>
      <p>
        Il valore di una piattaforma di allenamento non sono i grafici. È che i
        dati si muovono senza che nessuno li ricopi. Scrivi la seduta una volta,
        con obiettivi presi dalle zone dell'atleta; arriva sul suo orologio;
        l'attività torna da sola dopo l'uscita e si affianca al pianificato,
        passo per passo. Quando una gara si sposta, trascini il blocco alla
        nuova data e l'orologio segue. Il carico si calcola da ogni seduta, che
        qualcuno si sia ricordato di compilare una colonna o no.
      </p>
      <p>
        Nemmeno questo è gratis. Passerai una o due serate a ricreare le tue
        sedute abituali come modelli, alcuni atleti avranno bisogno d'aiuto per
        collegare l'orologio, e rinunci a un po' della libertà della cella
        vuota. Se ne valga la pena dipende soprattutto da quanti atleti segui e
        da quanto spesso cambiano i piani. Come regola di massima, la domanda
        diventa concreta oltre i cinque atleti, o la prima volta che uno di loro
        corre una seduta chiave da una versione vecchia del piano.
      </p>

      <h2>Provare senza pagare</h2>
      <p>
        OpenAthlete è gratuito per gli allenatori fino a cinque atleti, con
        tutte le funzioni: calendario, editor di allenamenti, invio agli orologi
        Garmin, Suunto e COROS, importazione delle attività da queste marche
        oltre che da Polar e Strava, e carico di allenamento dalla frequenza
        cardiaca con l'RPE di seduta accanto. Oltre i cinque atleti, Supporter
        costa 50 € all'anno per un numero illimitato. Puoi usarlo accanto al tuo
        foglio di calcolo con uno o due atleti per un mese prima di decidere. La{' '}
        <Link href="/it/coaches">pagina per allenatori</Link> mostra com'è il
        lato allenatore.
      </p>

      <h2>Fonte</h2>
      <ul>
        <li>
          Foster C, Florhaug JA, Franklin J, et al. A new approach to monitoring
          exercise training. Journal of Strength and Conditioning Research,
          2001;15(1):109–115.
        </li>
      </ul>
    </div>
  );
}
