import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentIt() {
  return (
    <div>
      <p>
        Il TRIMP, da <em>training impulse</em>, trasforma una seduta in un solo
        numero partendo da due dati che il tuo orologio registra già: quanto hai
        corso e quanto era alta la frequenza cardiaca. Eric Banister lo ha
        proposto negli anni Settanta come ingresso del suo modello forma-fatica,
        e la maggior parte dei grafici di carico basati sul cardio ne usa ancora
        una versione. Si calcola a mano senza fatica, ed è il modo migliore per
        capire cosa coglie e cosa gli sfugge.
      </p>

      <h2>Come si calcola il TRIMP</h2>
      <p>
        Il TRIMP di Banister prende la quota di frequenza cardiaca di riserva
        che hai usato, la moltiplica per la durata e applica una pesatura
        esponenziale: un minuto vicino alla soglia costa molto più di un minuto
        di corsa lenta.
      </p>
      <Formula
        where={[
          'FCr = (FC − FCriposo) / (FCmax − FCriposo), la frazione di frequenza cardiaca di riserva',
          'y = 0,64 e k = 1,92 per gli uomini; y = 0,86 e k = 1,67 per le donne',
        ]}
      >
        TRIMP = minuti × FCr × y × e^(k × FCr)
      </Formula>
      <p>
        La pesatura è stata tarata su come sale il lattato con la frequenza
        cardiaca: quasi piatto a ritmi facili, ripido vicino alla soglia
        (Morton, Fitz-Clarke e Banister, 1990). I due set di coefficienti sono
        medie degli uomini e delle donne di quegli studi. Nessuno ha dimostrato
        che si adattino bene al singolo atleta, quindi un TRIMP di 112 non è
        davvero più preciso di uno di 105.
      </p>
      <p>
        Puoi applicare la formula una volta sola alla frequenza media della
        seduta, oppure minuto per minuto (secondo per secondo con la traccia
        completa) e sommare. Il secondo metodo è migliore, e l’esempio qui sotto
        mostra perché.
      </p>

      <h2>Un esempio con i numeri</h2>
      <p>
        Un runner con frequenza a riposo di 48 e massima di 188 ha una riserva
        di 140 battiti. Corre 45 minuti a 150 bpm di media.
      </p>
      <ul>
        <li>FCr = (150 − 48) / 140 = 0,729</li>
        <li>Pesatura = 0,64 × e^(1,92 × 0,729) = 0,64 × 4,05 = 2,59</li>
        <li>TRIMP = 45 × 0,729 × 2,59 = 85</li>
      </ul>
      <p>
        Con i coefficienti femminili la stessa uscita vale 95. Stesso cuore,
        stessa corsa, un 12% di differenza solo per la scelta dei coefficienti.
      </p>
      <p>
        Ora distribuisci 20 minuti con la stessa media in un altro modo: 10
        minuti a 175 bpm e 10 minuti a 125 bpm. Calcolato sulla media (150 bpm
        per 20 minuti), il TRIMP vale 38. Calcolato blocco per blocco, vale 33 +
        10 = 43, circa il 15% in più. Siccome la pesatura è esponenziale, i
        minuti duri aggiungono più di quanto tolgano quelli facili, e la media
        appiattisce proprio la parte che stanca. Per questo le ripetute vengono
        sottostimate quando si usa solo la frequenza media.
      </p>

      <h2>Come usarlo in allenamento</h2>
      <p>
        Il punteggio di una seduta isolata serve a poco. Il TRIMP diventa utile
        quando lo sommi: un totale settimanale per confrontare i blocchi e una
        serie giornaliera che alimenta le{' '}
        <Link href="/it/learn/ctl-atl-tsb">
          curve di forma, fatica e freschezza
        </Link>{' '}
        (CTL, ATL, TSB). Qualche abitudine aiuta:
      </p>
      <ul>
        <li>
          Tieni aggiornate la frequenza a riposo e la massima. Una massima
          sovrastimata di 10 battiti riduce ogni FCr e abbassa tutti i punteggi.
        </li>
        <li>
          Confrontati con te stesso. Un totale di 600 a settimana non significa
          nulla in assoluto; passare da 450 a 650 in due settimane sì.
        </li>
        <li>
          Leggi il TRIMP insieme alle sensazioni. Se un lento abituale segna il
          20% in più del solito, il caldo, una brutta notte o un raffreddore in
          arrivo sono spiegazioni più probabili di un salto di forma.
        </li>
      </ul>
      <p>
        OpenAthlete calcola il TRIMP di Banister dalla frequenza cardiaca
        secondo per secondo di ogni attività (dalla media quando manca la
        traccia), con i coefficienti qui sopra, e mostra accanto l’
        <Link href="/it/learn/session-rpe">RPE di seduta</Link>. La{' '}
        <Link href="/it/features/training-load">
          pagina sul carico di allenamento
        </Link>{' '}
        ha un calcolatore e i link al codice sorgente.
      </p>

      <h2>Limiti</h2>
      <p>
        La frequenza cardiaca è una misura interna e reagisce in ritardo. Negli
        sprint da 30 secondi o nelle salite brevi non fa in tempo a salire,
        quindi il TRIMP sottovaluta il lavoro anaerobico e neuromuscolare. La
        forza, la discesa e i danni muscolari di un trail si vedono appena.
        Caldo, disidratazione, caffeina e quota alzano il cardio a parità di
        lavoro, e la{' '}
        <Link href="/it/learn/aerobic-decoupling">deriva cardiaca</Link> gonfia
        la seconda metà degli sforzi lunghi. Infine la formula ignora lo sport:
        un’ora a 140 bpm in bici e un’ora a 140 bpm di corsa danno lo stesso
        punteggio, anche se la corsa di solito lascia più segni. Affianca al
        TRIMP una misura soggettiva e leggilo come una tendenza, non come un
        verdetto.
      </p>
    </div>
  );
}
