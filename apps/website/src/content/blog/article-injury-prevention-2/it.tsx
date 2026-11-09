import Link from 'next/link';

import { Sources } from './sources';

export function ContentIt() {
  return (
    <div>
      <p>
        Da due mesi corri circa 40 km a settimana. La tua maratona è tra 16
        settimane e vorresti che le settimane più impegnative arrivassero a 70
        km. Questo articolo parla di come passare da un numero all'altro senza
        trascorrere la nona settimana con il ghiaccio sulla tibia. È pratico di
        proposito: per ciò che la ricerca dice, e non dice, su carico e
        infortuni, leggi{' '}
        <Link href="/it/blog/preventing-training-injuries">
          infortuni nella corsa e carico di allenamento
        </Link>
        .
      </p>

      <h2>La regola del 10% è un tetto inventato</h2>
      <p>
        Nessuno sa bene da dove venga la regola del 10%, ed è stata messa alla
        prova molto meno di quanto la sua fama farebbe pensare. Quando alcuni
        ricercatori olandesi hanno assegnato a 532 principianti un piano
        standard di 8 settimane oppure uno più lento di 13 settimane basato su
        aumenti del 10%, i tassi di infortunio sono stati gli stessi: circa un
        runner su cinque in ciascun gruppo (Buist et al., 2008). Una coorte
        danese di 874 principianti ha trovato un possibile segnale solo oltre il
        30% in due settimane, e anche quello al limite della significatività
        (Nielsen et al., 2014).
      </p>
      <p>
        In più la regola sbaglia in entrambe le direzioni. A basso volume è
        assurdamente lenta: 20 km a settimana diventano 22. A volumi più alti,
        applicata ogni settimana senza pause, esplode. Quaranta chilometri più
        il 10% a settimana per dieci settimane fanno 104 km. Nessuno dovrebbe
        farlo, eppure è quello che dice la regola.
      </p>
      <p>
        Ciò che gli studi e il consenso del CIO sul carico (Soligard et al.,
        2016) sostengono è l'idea generale: aumentare in modo graduale, evitare
        salti grandi e improvvisi, adattarsi alla persona. Il resto è giudizio
        da allenatore, e lo presenterò come tale.
      </p>

      <h2>Come aumento il volume</h2>
      <p>
        <strong>Un gradino, poi un pianerottolo.</strong> Aggiungi un blocco,
        per esempio da 4 a 6 km o 30 minuti, poi resta a quel livello per una o
        due settimane prima del gradino successivo. Per esperienza, un runner
        assorbe meglio un livello già ripetuto che un nuovo record ogni
        settimana. È osservazione, non un risultato sperimentale.
      </p>
      <p>
        <strong>Settimana di scarico ogni tre o quattro.</strong> Taglia il
        volume di circa un quarto o un terzo e mantieni una breve seduta di
        qualità, per esempio 6 × 1&apos; veloce il mercoledì, per non arrivare
        spento al blocco successivo. La percentuale esatta non ha uno studio
        solido alle spalle. L'abitudine di pianificarla prima di averne bisogno,
        sì.
      </p>
      <p>
        <strong>Una novità alla volta.</strong> Non aggiungere 6 km nella stessa
        settimana della prima seduta in pista della stagione, del primo trail
        lungo con dislivello o di un paio di scarpe nuove con meno drop. Lo
        studio Run Clever ha trovato che far progredire l'intensità o il volume
        dava tassi di infortunio simili (Ramskov et al., 2018). Far progredire
        entrambi insieme non era la domanda, e non mi offrirei volontario per
        scoprirlo.
      </p>
      <p>
        <strong>Il lungo segue un percorso tutto suo.</strong> Da dieci a
        quindici minuti in più ogni volta che sale e, all'inizio della
        preparazione, non oltre un terzo circa della settimana. Un runner da 40
        km che fa un lungo di 25 km mette quasi tutta la settimana in una sola
        seduta.
      </p>
      <p>
        <strong>Conta ciò che ti carica davvero.</strong> Su strada, i
        chilometri sono un'approssimazione accettabile. Sui sentieri, conta
        tempo e dislivello: 1.000 m di discesa in una settimana sono uno stress
        che nessuna distanza descrive, e i quadricipiti te lo faranno sapere con
        due giorni di ritardo.
      </p>
      <p>
        <strong>Rispetta le pause.</strong> Dopo qualche giorno di stop,
        riprendi da dove eri. Dopo due o tre settimane ferme, riparto dalla metà
        o dai due terzi del volume precedente e ricostruisco in tre o quattro
        settimane. La tua media recente è calata, anche se il ricordo che ne hai
        no.
      </p>

      <h2>Un esempio su 16 settimane</h2>
      <p>
        Ecco come potrebbe essere la progressione da 40 a 70 km. Le durate del
        lungo presuppongono un ritmo facile di circa 6:00 al km.
      </p>
      <table>
        <thead>
          <tr>
            <th>Settimana</th>
            <th>Volume</th>
            <th>Lungo</th>
            <th>Nota</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td>40 km</td>
            <td>1h20</td>
            <td>Livello attuale</td>
          </tr>
          <tr>
            <td>2</td>
            <td>44 km</td>
            <td>1h30</td>
            <td>Primo gradino</td>
          </tr>
          <tr>
            <td>3</td>
            <td>44 km</td>
            <td>1h30</td>
            <td>Pianerottolo</td>
          </tr>
          <tr>
            <td>4</td>
            <td>34 km</td>
            <td>1h15</td>
            <td>Scarico</td>
          </tr>
          <tr>
            <td>5</td>
            <td>48 km</td>
            <td>1h40</td>
            <td></td>
          </tr>
          <tr>
            <td>6</td>
            <td>52 km</td>
            <td>1h45</td>
            <td></td>
          </tr>
          <tr>
            <td>7</td>
            <td>52 km</td>
            <td>1h50</td>
            <td>Pianerottolo</td>
          </tr>
          <tr>
            <td>8</td>
            <td>40 km</td>
            <td>1h30</td>
            <td>Scarico</td>
          </tr>
          <tr>
            <td>9</td>
            <td>56 km</td>
            <td>2h00</td>
            <td></td>
          </tr>
          <tr>
            <td>10</td>
            <td>60 km</td>
            <td>2h05</td>
            <td></td>
          </tr>
          <tr>
            <td>11</td>
            <td>60 km</td>
            <td>2h15</td>
            <td>Pianerottolo</td>
          </tr>
          <tr>
            <td>12</td>
            <td>46 km</td>
            <td>1h40</td>
            <td>Scarico</td>
          </tr>
          <tr>
            <td>13</td>
            <td>65 km</td>
            <td>2h20</td>
            <td></td>
          </tr>
          <tr>
            <td>14</td>
            <td>70 km</td>
            <td>2h30</td>
            <td>Picco</td>
          </tr>
          <tr>
            <td>15</td>
            <td>52 km</td>
            <td>1h45</td>
            <td>Tapering</td>
          </tr>
          <tr>
            <td>16</td>
            <td>30 km + gara</td>
            <td>Gara</td>
            <td>Settimana di gara</td>
          </tr>
        </tbody>
      </table>
      <p>
        Guarda la settimana 5. Rispetto alla settimana di scarico precedente è
        un salto del 41%, abbastanza da far scattare tutti gli allarmi di un'app
        basata sui rapporti. Rispetto alle settimane 2 e 3, il livello a cui il
        runner si allenava davvero, è il 9%. Confronta una nuova settimana con
        l'allenamento prima dello scarico, non con lo scarico stesso.
      </p>
      <p>
        Nota anche cosa il piano non fa: non aggiunge mai volume e un nuovo tipo
        di seduta nella stessa settimana, e il picco arriva due settimane prima
        della gara, non una. Se il tuo obiettivo è un trail con dislivello,
        sostituisci i chilometri con le ore e aggiungi una colonna per il D+.
      </p>

      <h2>Con cosa confrontare una settimana</h2>
      <p>
        Se vuoi un solo numero, confronta questa settimana con la media delle
        tre o quattro precedenti, senza includere questa settimana nella media.
        Usalo come invito a guardare meglio, non come verdetto. Il popolare
        rapporto carico acuto:cronico e la sua "zona ottimale" tra 0,8 e 1,3
        sono stati criticati duramente, anche proprio per questo doppio
        conteggio (Impellizzeri et al., 2020). Non esiste una soglia validata,
        né per te né per nessun altro.
      </p>

      <h2>Quando fermarsi o fare un passo indietro</h2>
      <p>
        Interrompi la progressione, e di solito la corsa per qualche giorno, se
        un dolore cambia il modo in cui corri, peggiora durante l'uscita o è
        peggiore la mattina dopo. Un dolore su un punto preciso di un osso, come
        la tibia o il dorso del piede, merita il parere di un professionista
        prima della prossima uscita, non dopo le tre successive.
      </p>
      <p>
        Resta al livello attuale, o anticipa la settimana di scarico, se le
        uscite facili ti sembrano più dure del solito per diversi giorni di
        fila, se lo stesso ritmo facile ti costa più battiti o se il sonno è
        peggiorato. Sono i primi segnali descritti in{' '}
        <Link href="/it/blog/5-signs-of-overtraining-and-how-to-avoid-it">
          sovrallenamento e overreaching
        </Link>
        . Rimandare un gradino di una settimana non ti costa quasi nulla. Una
        frattura da stress ti costa la gara.
      </p>

      <h2>Pianificarlo in OpenAthlete</h2>
      <p>
        La vista stagione di OpenAthlete ti permette di disegnare una
        progressione come questa a blocchi (base, specifico, tapering, recupero)
        con la gara sopra, e ogni settimana mostra il suo carico rispetto a un
        intervallo costruito sulle tue ultime settimane. Quell'intervallo è
        un'indicazione per inquadrare la settimana, non un limite di sicurezza.
        Forma, fatica e freschezza sono proiettate sulle sedute pianificate,
        così vedi l'effetto di una settimana di scarico sulla freschezza prima
        di correrla. I dolori citati nelle domande facoltative dopo ogni
        attività finiscono in un registro degli infortuni che il tuo allenatore
        vede. Più dettagli nelle pagine{' '}
        <Link href="/it/features/training-calendar">
          calendario di allenamento
        </Link>{' '}
        e <Link href="/it/features/training-load">carico di allenamento</Link>.
      </p>

      <h2>Fonti</h2>
      <Sources />
    </div>
  );
}
