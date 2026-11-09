import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentIt() {
  return (
    <div>
      <p>
        Metti i tuoi migliori tempi tra pochi minuti e una ventina su un grafico
        distanza-tempo e i punti cadono quasi su una retta. La sua pendenza è la
        tua velocità critica: i metri che aggiungi per ogni secondo di sforzo in
        più. La retta non parte da zero. Taglia l’asse delle distanze un po’ più
        in alto, a un valore chiamato D′ (D primo): una quantità fissa di
        distanza che puoi percorrere più veloce della velocità critica prima di
        dover rallentare.
      </p>
      <p>
        L’idea viene da Monod e Scherrer (1965), che la descrissero per il
        lavoro di un gruppo muscolare con il nome di potenza critica. Nella
        corsa si applica allo stesso modo, con la velocità al posto della
        potenza e la distanza al posto del lavoro. Dal punto di vista
        fisiologico, la velocità critica è il confine tra gli sforzi in cui
        consumo di ossigeno e lattato si stabilizzano e quelli in cui continuano
        a salire finché non ti fermi (Poole et al., 2016). Sta vicino al massimo
        stato stazionario del lattato, un po’ sopra, cioè proprio ciò che la{' '}
        <Link href="/it/learn/lactate-threshold">soglia del lattato</Link> cerca
        di stimare.
      </p>

      <h2>Come si calcola la velocità critica</h2>
      <Formula
        where={[
          'd = distanza di un miglior sforzo (m), t = la sua durata (s)',
          'VC = velocità critica (m/s), D′ = distanza sopra la VC (m)',
          'Sopra la VC: tempo limite t = D′ / (v − VC)',
        ]}
      >
        d = D′ + VC × t
      </Formula>
      <p>
        Con due sforzi massimali la retta si risolve a mano. Con tre o più si
        adatta con i minimi quadrati, e la dispersione dei punti dice quanto
        fidarsi della pendenza. Gli sforzi devono durare all’incirca tra 2 e 20
        minuti: quelli più brevi dipendono da qualità di velocità pura che il
        modello non descrive, in quelli più lunghi entrano in gioco fatica e
        alimentazione.
      </p>

      <h2>Un esempio di calcolo</h2>
      <p>
        Un podista ha quattro riferimenti recenti: 1000 m in 3:10 (190 s), 2000
        m in 6:55 (415 s), 3000 m in 10:30 (630 s) e 5000 m in 18:00 (1080 s).
      </p>
      <ul>
        <li>
          L’adattamento distanza-tempo dà una pendenza di 4,50 m/s: la velocità
          critica è 16,2 km/h, cioè 3:42 al chilometro.
        </li>
        <li>L’intercetta dà D′ ≈ 145 m.</li>
        <li>
          Con quattro punti, l’intervallo al 95 % sulla pendenza è di ±0,11 m/s:
          la velocità critica sta tra 3:37 e 3:48 al chilometro.
        </li>
        <li>
          A 3:20 al chilometro (5,0 m/s), D′ finisce dopo 145 / (5,0 − 4,50) ≈
          290 s, circa 1450 m. Il modello prevede un 1500 in circa 5:01.
        </li>
      </ul>
      <p>
        Il ritmo dei 5 km (3:36 al chilometro) è più veloce della velocità
        critica. È normale: ogni gara abbastanza breve da finire prima che D′
        sia esaurito si corre sopra.
      </p>

      <h2>Come usarla in allenamento</h2>
      <p>
        La velocità critica divide i tuoi ritmi in due mondi. Sotto, la fatica
        arriva lentamente e il limite dipende soprattutto da durata ed energia.
        Sopra, ogni metro oltre la retta viene preso da D′, e quando D′ è finito
        rallenti, qualunque cosa dica la tua motivazione.
      </p>
      <ul>
        <li>
          Ripetute sopra la VC: 5 × 1000 m a 3:30 al chilometro (4,76 m/s) per
          il podista dell’esempio. Ogni ripetuta percorre 1000 − 4,50 × 210 ≈ 55
          m sopra la velocità critica, circa il 38 % di D′. I recuperi ne
          restituiscono una parte, non tutto, ed è per questo che le ultime
          ripetute costano di più (Jones e Vanhatalo, 2017).
        </li>
        <li>
          Lavoro appena sotto la VC: 3 × 10' tra 3:48 e 3:52 al chilometro.
          Duro, ma lo stato stazionario regge.
        </li>
        <li>
          Gestione della gara: parti in un 5 km più veloce della VC e consumi D′
          troppo presto. Distribuiscilo sulla distanza e arrivi prima.
        </li>
      </ul>
      <p>
        Smyth e Muniz-Pumares (2020) hanno mostrato che la velocità critica si
        può stimare dai dati grezzi di allenamento di maratoneti amatori, senza
        test dedicati, e che è legata al loro tempo in maratona. Le statistiche
        di OpenAthlete fanno lo stesso nella vista Capacità: adattano la retta
        ai tuoi migliori sforzi tra 2 e 20 minuti (almeno tre), mostrano
        l’intervallo al 95 % e calcolano allo stesso modo la potenza critica in
        bici. La <Link href="/it/features">pagina delle funzionalità</Link>{' '}
        riassume cos’altro viene calcolato dal tuo storico.
      </p>

      <h2>Limiti</h2>
      <p>
        I migliori tempi in allenamento non sono test massimali. Se il tuo
        miglior 3000 viene da un medio, la velocità stimata sarà più bassa di
        quella reale: il risultato vale al massimo quello che mostrano i tuoi
        sforzi. Sforzi di durata troppo simile danno un intervallo largo, e un
        record GPS fatto in discesa o con il vento a favore tira la retta verso
        l’alto. Il modello non dice nulla nemmeno delle gare lunghe. La velocità
        critica non si tiene per ore, e una maratona si corre nettamente sotto,
        a una frazione che dipende più da resistenza e alimentazione che dalla
        retta. Per queste distanze, incrociala con strumenti basati sulle tue
        gare, come il{' '}
        <Link href="/it/tools/race-predictor">predittore di tempi</Link> o le{' '}
        <Link href="/it/pace-charts">tabelle dei ritmi</Link>, e lascia la{' '}
        <Link href="/it/learn/vma">VAM</Link> all’estremo breve della curva.
      </p>
    </div>
  );
}
