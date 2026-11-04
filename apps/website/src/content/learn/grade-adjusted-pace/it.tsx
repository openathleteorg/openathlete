import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentIt() {
  return (
    <div>
      <p>
        Il passo corretto per la pendenza, o GAP (<em>grade-adjusted pace</em>),
        trasforma quello che hai corso in salita o in discesa nel passo che ti
        sarebbe costato la stessa energia in piano. Un chilometro a 7:30 su una
        strada all’8% sembra lento sull’orologio; corretto per la pendenza, vale
        poco meno di 5:00 in piano. Il GAP esiste perché il passo grezzo smette
        di dire molto appena il terreno si inclina, e nel trail succede quasi
        sempre.
      </p>
      <p>
        I modelli sono diversi. Quello usato qui, e in OpenAthlete, viene da
        Alberto Minetti e colleghi, che hanno misurato il consumo di ossigeno di
        podisti su un tapis roulant inclinato tra −45% e +45% e hanno adattato
        una curva ai risultati (Minetti et al., 2002).
      </p>

      <h2>Come si calcola il passo corretto per la pendenza</h2>
      <p>
        La curva di Minetti dà il costo energetico di un metro di corsa in base
        alla pendenza, per chilo di massa corporea. In piano vale 3,6 J/kg/m. Il
        GAP applica al tuo passo il rapporto tra il costo in piano e quello in
        pendenza:
      </p>
      <Formula
        where={[
          'C(i) = 155,4i⁵ − 30,4i⁴ − 43,3i³ + 46,3i² + 19,5i + 3,6, in J/kg/m',
          'i = pendenza come frazione: 0,08 per l’8%, −0,10 per il −10%',
          'C(0) = 3,6 in piano',
        ]}
      >
        GAP = passo in pendenza × 3,6 / C(i)
      </Formula>
      <p>
        Lo stesso rapporto funziona al contrario: il passo da tenere in salita
        per un dato sforzo in piano è <code>passo in piano × C(i) / 3,6</code>.
        Su un’attività intera, il calcolo si fa punto per punto sull’altitudine
        registrata e poi si media, così un’uscita mossa mostra un GAP accanto al
        passo medio grezzo.
      </p>

      <h2>Esempio di calcolo</h2>
      <ul>
        <li>
          Salita: 7:30/km su una pendenza dell’8%. C(0,08) = 5,43, cioè 1,51
          volte il costo in piano. 7:30 (450 s) / 1,51 = 298 s, circa 4:58/km in
          piano.
        </li>
        <li>
          Al contrario: chi corre il lento in piano a 5:30/km vuole tenere lo
          stesso sforzo su una salita al 6%. C(0,06) = 4,93, 1,37 volte il costo
          in piano, quindi 5:30 × 1,37 = 7:32/km. Al 15% il rapporto sale a 2,06
          e il passo a 11:20/km: lì quasi tutti camminano, e fanno bene.
        </li>
        <li>
          Discesa: 4:30/km al −10%. C(−0,10) = 2,15, appena 0,6 volte il costo
          in piano, quindi l’equivalente in piano è 7:32/km. Il conto energetico
          è basso; quello dei quadricipiti molto meno.
        </li>
      </ul>
      <p>
        Il{' '}
        <Link href="/it/tools/grade-adjusted-pace">
          calcolatore del passo corretto per la pendenza
        </Link>{' '}
        rifà questi conti per qualsiasi passo e pendenza.
      </p>

      <h2>Come usarlo in allenamento</h2>
      <p>
        Il GAP serve soprattutto a confrontare uscite su terreni diversi. Un
        giro di 14 km con 500 m di dislivello positivo a 6:10/km di media e 14
        km in piano a 5:20/km possono essere stati la stessa seduta per il tuo
        cuore. Guardare il GAP insieme alla frequenza cardiaca ti dice se una
        giornata lenta dipendeva dalle salite o da te.
      </p>
      <p>
        Aiuta anche a fissare riferimenti sui percorsi mossi. Se il tuo lento
        deve restare a uno sforzo da 5:30 in piano, una salita al 6% a 7:30 va
        bene; la stessa salita a 6:30 è un medio travestito. Nelle ripetute in
        salita tipo 8 × 2', il GAP ti permette di verificare che l’ultima
        valesse quanto la prima anche se il passo sull’orologio è cambiato.
      </p>
      <p>
        In gara, con prudenza. Il GAP dice quanto costa una salita in energia,
        non quanto durerà una gara in montagna; per quello, il{' '}
        <Link href="/it/learn/km-effort">km-sforzo</Link> e lo{' '}
        <Link href="/it/tools/trail-time-estimator">
          stimatore del tempo nel trail
        </Link>{' '}
        rispondono meglio alla domanda.
      </p>
      <p>
        OpenAthlete applica la curva di Minetti a ogni corsa e trail che
        sincronizzi. La pendenza viene letta dall’altitudine su finestre di 10 m
        e limitata a ±30%, perché letture più ripide di solito sono rumore del
        GPS o del barometro, non terreno.
      </p>

      <h2>Limiti</h2>
      <p>
        I soggetti di Minetti correvano su un nastro liscio. Sassi, radici,
        fango e tornanti aggiungono un costo che la curva non conosce: su
        terreno tecnico, il tuo sforzo reale è stato più alto di quello che
        mostra il GAP.
      </p>
      <p>
        Le discese sono il punto debole. Sulla carta il costo continua a
        scendere fino a un minimo intorno a −18/−20%, dove un metro costa la
        metà che in piano. In pratica, oltre il −10% circa, a limitarti sono
        frenata, appoggi e lavoro eccentrico dei quadricipiti, molto prima
        dell’energia. Una discesa veloce mostra un GAP tranquillo, ma spesso è
        quella che ti lascia indolenzito per tre giorni.
      </p>
      <p>
        I dati di altitudine sono rumorosi. Un orologio barometrico fa meglio
        dell’altitudine GPS, ma entrambi creano piccole salite finte in piano
        che spostano il GAP. Le rampe corte e ripide, come uno strappo di 20 m,
        vengono smussate dalla finestra di calcolo.
      </p>
      <p>
        Infine, altre piattaforme usano altri modelli. Strava dichiara di aver
        costruito il suo GAP sui dati di frequenza cardiaca dei suoi utenti e
        non su misure di laboratorio, e dà meno credito alle discese. I numeri
        cambiano da uno strumento all’altro: confronta le uscite dentro lo
        stesso strumento, non tra due.
      </p>
    </div>
  );
}
