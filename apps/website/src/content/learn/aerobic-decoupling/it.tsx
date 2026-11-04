import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentIt() {
  return (
    <div>
      <p>
        Corri 90 minuti a ritmo facile e costante e la frequenza cardiaca
        difficilmente resterà piatta. Sale piano: qualche battito nella seconda
        ora, di più se fa caldo, ancora di più se i lunghi sono una novità per
        te. Il disaccoppiamento aerobico dà un numero a questa deriva. Confronta
        il passo (o la potenza) che ottieni per battito nella prima metà di uno
        sforzo costante con quello della seconda metà. Joe Friel l’ha reso
        popolare tra gli atleti di endurance, e TrainingPeaks lo chiama Pa:HR
        per il passo e Pw:HR per la potenza.
      </p>

      <h2>Come si calcola il disaccoppiamento</h2>
      <p>
        Si divide la parte costante dello sforzo in due metà di uguale durata.
        Per ciascuna si calcola il fattore di efficienza (EF): produzione media
        divisa per la frequenza cardiaca media. Poi si esprime la perdita da una
        metà all’altra in percentuale:
      </p>
      <Formula
        where={[
          'EF = produzione media / frequenza cardiaca media, per ogni metà',
          'Produzione = velocità corretta per la pendenza nella corsa, potenza in bici',
        ]}
      >
        Disaccoppiamento (%) = (EF1 − EF2) / EF1 × 100
      </Formula>
      <p>
        Un valore positivo vuol dire che hai prodotto meno per battito nella
        seconda metà: il cuore è salito a parità di passo, oppure il passo è
        calato a parità di cuore. Se il percorso non è piatto, la velocità va
        corretta per la pendenza, altrimenti una salita nel finale sembra
        fatica. La lettura abituale, da Friel: sotto il 5% lo sforzo è stabile,
        tra il 5 e il 10% c’è un po’ di deriva, sopra il 10% lo sforzo ha
        superato la tua resistenza aerobica.
      </p>

      <h2>Un esempio con i numeri</h2>
      <p>
        Un runner fa 90 minuti su un anello piatto a 5:20 al chilometro, cioè
        187,5 metri al minuto.
      </p>
      <ul>
        <li>
          Primi 45 minuti: 142 bpm di media, quindi EF1 = 187,5 / 142 = 1,320
        </li>
        <li>
          Ultimi 45 minuti: stesso passo, 150 bpm di media, quindi EF2 = 187,5 /
          150 = 1,250
        </li>
        <li>Disaccoppiamento = (1,320 − 1,250) / 1,320 × 100 = 5,3%</li>
      </ul>
      <p>
        Poco più del 5%: un po’ di deriva. Con 146 bpm di media nella seconda
        metà il dato sarebbe del 2,7%, ben stabile. In bici il conto è lo stesso
        con i watt: 200 W a 135 bpm, poi 195 W a 140 bpm, danno EF di 1,48 e
        1,39 e un disaccoppiamento del 6,0%. La potenza è calata e il cuore è
        salito; contano entrambi contro di te.
      </p>

      <h2>Come usarlo in allenamento</h2>
      <p>
        Il disaccoppiamento è utile soprattutto come test ripetibile di
        resistenza aerobica nel periodo di base. Scegli una seduta costante che
        rifarai: un lento di 75-120 minuti sullo stesso anello piatto, oppure
        un’uscita in bici nella parte bassa della tua zona di fondo. Resta ogni
        volta nella{' '}
        <Link href="/it/tools/heart-rate-zones">
          stessa zona di frequenza cardiaca o di potenza
        </Link>{' '}
        e segui il dato nelle settimane.
      </p>
      <ul>
        <li>
          Se un’uscita di 90 minuti supera il 5%, la durata o il passo vanno
          oltre la tua resistenza attuale. Tieni il passo, o rallenta un po’, e
          allunga gradualmente.
        </li>
        <li>
          Quando resti sotto il 5%, allunga l’uscita o chiudi con un blocco a
          ritmo maratona per vedere se tiene.
        </li>
        <li>
          Prima di una maratona o di un trail lungo, un lungo con tratti a ritmo
          maratona che resta sotto il 5% è un buon segnale. Una forte deriva è
          un motivo per rivedere il ritmo obiettivo, o l’alimentazione in gara.
        </li>
      </ul>
      <p>
        OpenAthlete calcola disaccoppiamento e fattore di efficienza su ogni
        corsa con velocità corretta per la pendenza e frequenza cardiaca, e
        sulle uscite in bici con potenza. Nella pagina dell’attività puoi
        escludere il riscaldamento con un cursore o selezionare un tratto dello
        sforzo, e la scheda mostra le due metà e uno stato: stabile, un po’ di
        deriva o deriva marcata. Sotto i 20 minuti segnala che lo sforzo è
        troppo breve per giudicare la resistenza.
      </p>

      <h2>Limiti</h2>
      <p>
        Il disaccoppiamento ha senso solo su uno sforzo costante. Ripetute,
        soste ai semafori o un finale veloce rompono il confronto. Il caldo è il
        fattore di confusione principale: Coyle e González-Alonso (2001)
        descrivono come l’aumento della temperatura corporea faccia salire la
        frequenza cardiaca mentre cala il volume pompato a ogni battito, e la
        disidratazione si aggiunge. Un 7% in un pomeriggio a 30 °C e un 3% in
        una mattina fresca possono descrivere la stessa forma. Un sensore ottico
        da polso che si aggancia alla cadenza, una fascia con gli elettrodi
        asciutti o un GPS che sbanda sotto gli alberi falsano una delle due
        metà. Infine, il disaccoppiamento non dice nulla della velocità: puoi
        essere perfettamente accoppiato a un passo troppo lento per il tuo
        obiettivo. Leggilo insieme al tuo passo, al tuo{' '}
        <Link href="/it/learn/trimp">carico di allenamento</Link> e alle
        condizioni del giorno.
      </p>
    </div>
  );
}
