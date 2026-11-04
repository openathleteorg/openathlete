import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentIt() {
  return (
    <div>
      <p>
        L’RPE di seduta è la misura di carico più semplice che regge alla prova
        della ricerca: dai un voto da 0 a 10 a quanto è stata dura la seduta
        intera, lo moltiplichi per la durata in minuti e ottieni un carico in
        unità arbitrarie. Carl Foster e colleghi lo hanno descritto alla fine
        degli anni Novanta e confrontato con i metodi basati sulla frequenza
        cardiaca nel 2001. Non serve alcun sensore, funziona in ogni sport,
        forza e sedute tecniche comprese, e coglie quello che il cardio non
        vede, come i quadricipiti distrutti da una discesa o il costo mentale di
        una gara.
      </p>

      <h2>Come si calcola l’RPE di seduta</h2>
      <Formula
        where={[
          'RPE: sforzo percepito sull’intera seduta, sulla scala CR-10 da 0 a 10',
          'minuti: durata totale, riscaldamento e defaticamento compresi',
          'risultato in unità arbitrarie (UA)',
        ]}
      >
        carico della seduta = RPE × minuti
      </Formula>
      <p>
        La scala è una versione della CR-10 di Borg: 0 è riposo, 1 molto facile,
        3 moderato, 5 duro, 7 molto duro, 10 massimale. La domanda riguarda la
        seduta nel suo insieme, non la ripetuta più dura né come ti senti
        adesso. Il protocollo di Foster chiede il voto circa 30 minuti dopo la
        fine, quando l’ultimo sforzo non domina più la risposta. In pratica,
        dare il voto quando carichi l’attività, lo stesso giorno, va bene se
        resti coerente.
      </p>

      <h2>Un esempio con i numeri</h2>
      <p>La settimana di un runner, con il voto seduta per seduta:</p>
      <ul>
        <li>martedì, 60 min con 5 × 4' a soglia, RPE 7: 420 UA</li>
        <li>mercoledì, 45 min di corsa lenta, RPE 3: 135 UA</li>
        <li>giovedì, 50 min di medio, RPE 4: 200 UA</li>
        <li>sabato, lungo di 100 min, RPE 5: 500 UA</li>
        <li>domenica, 40 min di rigenerante, RPE 2: 80 UA</li>
      </ul>
      <p>
        Il carico settimanale è di 1.335 UA. La seduta a soglia vale il 15% del
        tempo di allenamento ma quasi un terzo del carico, il che corrisponde a
        come la maggior parte dei runner descriverebbe la settimana. Foster
        (1998) ha ricavato anche due indicatori settimanali dai valori
        giornalieri. La monotonia è il carico giornaliero medio diviso per la
        sua deviazione standard: qui 191 / 184 ≈ 1,0, con due giorni di riposo e
        un vero contrasto tra giorni duri e facili. Lo strain è carico
        settimanale × monotonia, circa 1.390. Allenarsi ogni giorno con la
        stessa dose moderata fa salire la monotonia, e nei dati di Foster le
        malattie tendevano a seguire le settimane di strain elevato.
      </p>

      <h2>Come usarlo in allenamento</h2>
      <p>
        Dai un voto a tutte le sedute, anche alle uscite facili e alla palestra.
        I buchi rendono inutile il totale settimanale. Poi guarda l’andamento:
        una settimana del 30% sopra le precedenti è un salto, qualunque sia il
        numero assoluto. Confrontare lo sforzo previsto con quello votato spesso
        dice più del carico stesso. Una corsa lenta votata 5 invece di 3, o una
        seduta a soglia vissuta come un 9, segnala fatica, caldo o malattia
        prima di qualsiasi curva.
      </p>
      <p>
        L’RPE di seduta rende di più accanto a una misura oggettiva. Quando il{' '}
        <Link href="/it/learn/trimp">TRIMP</Link> resta stabile mentre l’RPE
        sale per gli stessi allenamenti, il corpo sta pagando di più per lo
        stesso lavoro. Gli allenatori usano proprio questa differenza per
        aggiustare i giorni successivi.
      </p>
      <p>
        In OpenAthlete ogni attività ha un RPE da 0 a 10, e un allenatore può
        richiederlo perché una seduta risulti validata. La vista del carico
        mostra l’RPE di seduta (RPE × minuti) accanto al TRIMP da frequenza
        cardiaca. Se le funzioni di IA sono attive, qualche breve domanda dopo
        l’attività può compilare l’RPE a partire dalla risposta dell’atleta.
        Maggiori dettagli nella{' '}
        <Link href="/it/features/training-load">
          pagina sul carico di allenamento
        </Link>
        .
      </p>

      <h2>Limiti</h2>
      <p>
        È soggettivo, ed è insieme il suo pregio e il suo difetto. I voti
        cambiano con l’umore, la motivazione e l’esperienza; i principianti
        tendono a schiacciare tutto tra 4 e 7. Le unità arbitrarie non si
        convertono in TRIMP né in TSS, quindi non si possono mescolare nella
        stessa curva senza riscalarle. La durata pesa in modo lineare: tre ore
        di bici tranquilla a RPE 3 (540 UA) superano una seduta di ripetute di
        40 minuti a RPE 8 (320 UA), il che è giusto per il carico totale e
        fuorviante per lo stress specifico dell’intensità. E un voto non dice
        perché la seduta è stata dura. La review di Haddad e colleghi (2017)
        conclude che l’RPE di seduta è valido in molti sport, con correlazioni
        con i metodi cardiaci in genere buone ma lontane dalla perfezione. Usalo
        come un secondo parere sempre disponibile, non come l’unico numero.
      </p>
    </div>
  );
}
