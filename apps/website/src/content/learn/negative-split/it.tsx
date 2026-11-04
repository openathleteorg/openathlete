import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentIt() {
  return (
    <div>
      <p>
        Correre in negative split significa chiudere la seconda metà di una gara
        più veloce della prima. Il contrario, il positive split, è quello che fa
        quasi chiunque senza volerlo: una partenza spinta dall’adrenalina e dal
        pubblico, poi un lungo calo. Gli allenatori lo consigliano da decenni,
        soprattutto come rimedio a quel calo. Le prove scientifiche sono più
        scarse di quanto il consiglio lasci intendere, ma l’abitudine che
        costruisce, trattenersi all’inizio, vale per tutto ciò che va dai 10 km
        in su.
      </p>

      <h2>Come si misura</h2>
      <p>
        Dividi la gara in due tratti di uguale distanza e confronta i tempi.
        Esprimendo lo scarto come percentuale della prima metà puoi confrontare
        una 10 km con una maratona:
      </p>
      <Formula
        where={[
          'T1 = tempo della prima metà, T2 = tempo della seconda',
          'Valore negativo: negative split. Valore positivo: positive split. Tra −1 e +1% circa: andatura regolare',
        ]}
      >
        split (%) = (T2 − T1) / T1 × 100
      </Formula>
      <p>
        La fascia di ±1% per parlare di andatura regolare è una convenzione
        pratica, non uno standard: la deriva del GPS, il vento o una sola salita
        bastano a spostare una metà di tanto. Su un percorso mosso o in linea,
        confronta metà con profilo simile, oppure guarda il{' '}
        <Link href="/it/learn/grade-adjusted-pace">
          passo corretto per la pendenza
        </Link>{' '}
        invece del cronometro.
      </p>

      <h2>Un esempio con i numeri</h2>
      <p>
        Una runner punta a 50:00 sui 10 km, cioè 5:00/km di media. Passa al
        quinto km in 25:30 (5:06/km) e corre gli altri 5 km in 24:30 (4:54/km).
      </p>
      <ul>
        <li>T2 − T1 = 1470 − 1530 = −60 s</li>
        <li>split = −60 / 1530 × 100 = −3,9%</li>
      </ul>
      <p>
        È un negative split netto, forse troppo: recuperare un minuto nella
        seconda metà di una 10 km di solito vuol dire che la partenza era troppo
        prudente e che qualcosa è rimasto per strada.
      </p>
      <p>
        In maratona i margini sono più sottili. Per 3:30:00 (4:59/km di media),
        un piano sensato è passare alla mezza in 1:45:50 (5:01/km) e correre la
        seconda metà in 1:44:10 (4:56/km): uno split del −1,6%. Andare appena
        due o tre secondi al km più piano della media nella prima metà costa 50
        secondi al passaggio e lascia margine per gli ultimi 10 km, dove si
        perde la maggior parte delle maratone.
      </p>

      <h2>Come usarlo</h2>
      <p>
        Lo scopo non è sprintare alla fine, ma evitare di pagare gli interessi
        di una partenza troppo veloce. I primi chilometri sopra il tuo passo
        sostenibile consumano glicogeno e tolleranza alla fatica che più avanti
        non recuperi. Qualche regola pratica:
      </p>
      <ul>
        <li>
          Fissa il passo obiettivo da una gara recente, non da una speranza. Il{' '}
          <Link href="/it/tools/race-predictor">predittore di tempi</Link> e le{' '}
          <Link href="/it/pace-charts">tabelle dei passi</Link> danno i passaggi
          al km per un tempo finale.
        </li>
        <li>
          In mezza o in maratona, corri i primi 3-5 km da 5 a 10 secondi al km
          più piano del passo obiettivo, poi assestati. In una 10 km, il
          chilometro da frenare è il primo.
        </li>
        <li>
          Provalo in allenamento. Un progressivo, per esempio 12 km partendo
          lento e chiudendo gli ultimi 3 a passo maratona, ti insegna che cosa
          vuol dire trattenersi. Un lungo di 26 km con gli ultimi 8 a passo
          maratona fa lo stesso con più fatica nelle gambe.
        </li>
        <li>
          Giudica la gara a posteriori dal suo split. Un positive split oltre il
          3 o 4% in maratona indica quasi sempre la prima metà, non la seconda.
        </li>
      </ul>

      <h2>Limiti</h2>
      <p>
        La ricerca non fa del negative split una legge. Nella loro rassegna
        sulle strategie di andatura, Abbiss e Laursen (2008) osservano che un
        passo distribuito in modo uniforme tende a funzionare nelle prove oltre
        un paio di minuti, e che nelle prove molto lunghe gli atleti allenati di
        solito rallentano progressivamente, qualunque fosse il piano. Díaz e
        colleghi (2018) hanno analizzato tutti i record del mondo di maratona
        degli ultimi cinquant’anni: in media i primatisti hanno corso la prima
        metà un po’ più veloce della seconda. I record più recenti sono i più
        regolari, e gli autori suggeriscono che il futuro sia un passo quasi
        costante più che un negative split marcato.
      </p>
      <p>
        L’obiettivo onesto per la maggior parte dei runner è quindi un passo
        regolare con una leggera tendenza negativa, non un finale da film. Anche
        il percorso ci mette lo zampino: una gara che sale nella seconda metà
        darà un positive split al cronometro anche se lo sforzo è stato
        perfettamente costante. Nel trail e negli ultra, dove terreno e notte
        pesano sulla seconda metà, confrontare le metà a tempo dice poco;
        contano di più sforzo percepito, frequenza cardiaca e alimentazione.
      </p>
    </div>
  );
}
