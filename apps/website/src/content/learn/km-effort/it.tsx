import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentIt() {
  return (
    <div>
      <p>
        Il km-sforzo è il modo in cui chi corre in montagna trasforma il
        dislivello in distanza: ogni 100 m di dislivello positivo valgono un
        chilometro in più. Un trail di 25 km con 1.000 m di D+ fa 35 km-sforzo,
        e puoi confrontarlo con un lungo di 35 km su strada, o con un altro
        trail dello stesso totale, in modo più onesto che guardando solo la
        distanza.
      </p>
      <p>
        È una convenzione, non una legge della fisiologia. È nata nel trail
        francese (<em>kilomètre-effort</em>), dove allenatori e organizzatori
        avevano bisogno di un modo rapido per dire quanto fosse duro un
        percorso, e l’ITRA usa la stessa somma, distanza più D+ diviso 100, per
        classificare le gare. Il bello è che la fai a mente sulla linea di
        partenza.
      </p>

      <h2>Come si calcola il km-sforzo</h2>
      <Formula
        where={[
          'km = distanza del percorso o dell’uscita',
          'D+ = dislivello positivo totale in metri',
        ]}
      >
        km-sforzo = km + D+ / 100
      </Formula>
      <p>
        Le discese non contano: non danno né bonus né penalità. Alcuni
        allenatori pesano la salita in modo diverso su percorsi molto ripidi o
        molto corribili, altri aggiungono una parte del D−, ma 100 m per
        chilometro è la versione più diffusa e quella usata qui.
      </p>
      <p>
        Con il km-sforzo, una gara passata diventa una previsione. Lo{' '}
        <Link href="/it/tools/trail-time-estimator">
          stimatore del tempo nel trail
        </Link>{' '}
        applica la formula di resistenza di Peter Riegel al km-sforzo invece che
        alla distanza:
      </p>
      <Formula
        where={[
          'T_ref, E_ref = tempo e km-sforzo di una gara che hai corso',
          'E = km-sforzo della gara obiettivo',
          'k = 1,06 (valore di Riegel su strada) per il limite basso, 1,10 per quello alto',
        ]}
      >
        T = T_ref × (E / E_ref)^k
      </Formula>

      <h2>Esempio di calcolo</h2>
      <ul>
        <li>
          Riferimento: un trail di 25 km con 1.000 m di D+, quindi 25 + 1.000 /
          100 = 35 km-sforzo, chiuso in 3:00:00. Fanno 10.800 s / 35 = 5:09 per
          km-sforzo.
        </li>
        <li>
          Obiettivo: 42 km con 2.000 m di D+, quindi 42 + 20 = 62 km-sforzo.
        </li>
        <li>Limite basso: 3:00:00 × (62 / 35)^1,06 = 5 h 30.</li>
        <li>Limite alto: 3:00:00 × (62 / 35)^1,10 = 5 h 38.</li>
        <li>
          Quindi da 5 h 30 a 5 h 38, circa 5:20 per km-sforzo e una media di 7,5
          km/h sui 42 km reali.
        </li>
      </ul>
      <p>
        L’esponente 1,06 viene dal lavoro di Riegel sui record su strada e su
        pista. Il limite alto di 1,10 è una nostra ipotesi per il rallentamento
        in più delle lunghe giornate in montagna, non un valore pubblicato: per
        questo ottieni una forbice e non un tempo al minuto.
      </p>

      <h2>Come usarlo in allenamento</h2>
      <p>
        Conta le settimane in km-sforzo oltre che in chilometri. Dodici
        chilometri con 600 m di D+ fanno 18 km-sforzo; una settimana di 55 km
        con 2.000 m di D+ ne fa 75, quanto 75 km in piano. Un piano che conta
        solo i chilometri ti sovraccarica senza dirtelo.
      </p>
      <p>
        Scegli i lunghi in base al km-sforzo. Se la gara obiettivo fa 62
        km-sforzo, un lungo da 30 a 35 km-sforzo con una quota di salita
        realistica ti dice molto più di 30 km in piano. Tieni il D+ per
        chilometro vicino a quello della gara: intorno ai 30 m/km su un percorso
        mosso ma corribile, 60 m/km o più per uno alpino.
      </p>
      <p>
        Il passo per km-sforzo dà un’idea approssimativa della forma da un
        percorso all’altro. Se scende nel corso di un blocco su terreni simili,
        è un segnale migliore di un singolo giro veloce. I{' '}
        <Link href="/it/training-plans/trail">piani di allenamento trail</Link>{' '}
        sono costruiti su questo tipo di progressione, e per le salite in sé il{' '}
        <Link href="/it/learn/grade-adjusted-pace">
          passo corretto per la pendenza
        </Link>{' '}
        dice quanta energia è costata ciascuna.
      </p>

      <h2>Limiti</h2>
      <p>
        Una regola unica per tutte le pendenze è una semplificazione. Su una
        salita dolce e corribile, 100 m di D+ costano meno di un chilometro; su
        un muro al 25% fatto camminando con i bastoncini possono costare di più.
        Il terreno pesa ancora di più: sassi, radici, fango, neve e ghiaioni
        rallentano ben oltre quello che dice il dislivello, e due gare con lo
        stesso km-sforzo possono finire molto lontane l’una dall’altra.
      </p>
      <p>
        Ignorare le discese è il punto cieco più grande. Su un percorso con
        discese lunghe e ripide, nella seconda metà comandano i quadricipiti,
        non il fiato, e il km-sforzo non lo vede arrivare. Anche la notte,
        l’altitudine oltre i 2.000 m circa, il caldo e il tempo ai ristori
        restano fuori dalla formula. Un riferimento su strada presuppone
        sentieri corribili e porta la tua velocità su strada in salita: su
        terreno tecnico, aspettati di finire oltre la forbice.
      </p>
      <p>
        Infine, il km-sforzo non dice nulla del tuo indice ITRA o UTMB, che
        usano modelli propri. Usalo come moneta comune per pianificare, non come
        un voto.
      </p>
    </div>
  );
}
