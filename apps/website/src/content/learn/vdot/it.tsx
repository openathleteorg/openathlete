import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentIt() {
  return (
    <div>
      <p>
        Il VDOT è il numero al centro del metodo di Jack Daniels. Il nome viene
        da “V-dot-O2max”, il modo in cui i fisiologi scrivono il VO2max, ma non
        si misura in laboratorio. Daniels e il matematico Jimmy Gilbert lo hanno
        ricavato a ritroso dai risultati di gara negli anni Settanta: se hai
        corso una distanza a una certa velocità, quale VO2max lo spiegherebbe
        con un’economia di corsa nella media? La risposta è un unico indice che
        fotografa il tuo livello attuale, prevede i tuoi tempi su altre distanze
        e ti dà i ritmi di allenamento.
      </p>
      <p>
        Dato che nasce da una prestazione, il VDOT include già ciò che un VO2max
        di laboratorio lascia fuori: quanto è economica la tua falcata e quale
        quota del massimo riesci a tenere per un’intera gara. Questi tre fattori
        insieme spiegano gran parte della prestazione di endurance (Joyner e
        Coyle, 2008). Per questo due runner con lo stesso{' '}
        <Link href="/it/learn/vo2max">VO2max</Link> possono avere VDOT distanti
        diversi punti, e per questo il VDOT prevede i tempi meglio del VO2max.
      </p>

      <h2>Come si calcola il VDOT</h2>
      <p>
        Le formule di Daniels e Gilbert sono due. La prima dà il costo di
        ossigeno della corsa a una velocità v, in metri al minuto. La seconda dà
        la quota di VO2max che un runner riesce a sostenere in una gara di t
        minuti: quasi il 100% per una decina di minuti, intorno al 90% per 45
        minuti, meno dell’85% in maratona.
      </p>
      <Formula
        where={[
          'Costo di ossigeno (ml/kg/min) = −4,6 + 0,182258 × v + 0,000104 × v²',
          'Quota sostenibile = 0,8 + 0,1894393 × e^(−0,012778 × t) + 0,2989558 × e^(−0,1932605 × t)',
          'v = distanza (m) / tempo (min); t = durata della gara in minuti',
        ]}
      >
        VDOT = costo di ossigeno / quota sostenibile
      </Formula>
      <p>
        Le formule valgono dai 1.500 m alla maratona. Sotto, la capacità
        anaerobica pesa troppo; sopra, alimentazione e caldo contano più della
        forma aerobica.
      </p>

      <h2>Un esempio con i numeri</h2>
      <p>Una runner chiude una 10 km piatta in 45:00.</p>
      <ul>
        <li>Velocità: 10.000 m / 45 min = 222,2 m/min</li>
        <li>
          Costo di ossigeno: −4,6 + 0,182258 × 222,2 + 0,000104 × 222,2² = 41,0
          ml/kg/min
        </li>
        <li>
          Quota sostenibile per 45 minuti: 0,8 + 0,1894 × e^(−0,575) + 0,2990 ×
          e^(−8,70) = 0,907
        </li>
        <li>VDOT = 41,0 / 0,907 = 45,3</li>
      </ul>
      <p>
        Al contrario, lo stesso VDOT prevede circa 21:42 sui 5 km, 1:39:44 in
        mezza maratona e 3:27:15 in maratona.
      </p>
      <p>
        I ritmi di allenamento vengono da quote fisse del VDOT, riconvertite in
        velocità con la formula del costo di ossigeno. Per un VDOT di 45,3:
      </p>
      <ul>
        <li>Facile (59-74%): da 6:21 a 5:18 al km</li>
        <li>Maratona (la velocità di maratona prevista): 4:55 al km</li>
        <li>Soglia (88%): 4:37 al km</li>
        <li>Intervalli (97,5%): 4:15 al km</li>
        <li>Ripetute brevi (105%): 4:00 al km, cioè 96 secondi sui 400 m</li>
      </ul>

      <h2>Come usarlo in allenamento</h2>
      <p>
        Ogni ritmo ha il suo compito. Il ritmo soglia serve per i tempo run di
        20 minuti o per ripetute lunghe come 5 × 1 km con un minuto di corsa
        lenta. Il ritmo intervalli serve per ripetute da tre a cinque minuti,
        per esempio 5 × 1.000 m con recupero uguale, vicino al lavoro alla{' '}
        <Link href="/it/learn/vma">VAM</Link>. Il ritmo delle ripetute brevi
        serve per prove corte e veloci di 200 o 400 m con recupero completo, per
        l’economia di corsa. Il ritmo facile copre quasi tutta la settimana.
      </p>
      <p>
        Due abitudini tengono il sistema onesto. Fissa il VDOT da una gara
        recente, non da quella che speri di correre: allenarsi al ritmo
        obiettivo prima di averne il livello è il modo classico per andare in
        crisi. E alzalo a piccoli passi, un punto dopo una buona gara o un
        blocco di sedute ben controllate, invece di inseguire ogni giornata
        buona.
      </p>
      <p>
        In OpenAthlete, la pagina dei record calcola il tuo VDOT dal tuo miglior
        sforzo tra 1.500 m e maratona e mostra i ritmi di allenamento
        corrispondenti. Su questo sito, le{' '}
        <Link href="/it/pace-charts">tabelle dei ritmi</Link> usano le stesse
        formule, e il{' '}
        <Link href="/it/tools/race-predictor">calcolatore dei tempi gara</Link>{' '}
        dà un secondo parere con la formula di Riegel.
      </p>

      <h2>Limiti</h2>
      <p>
        Il VDOT presuppone che la tua resistenza sia all’altezza della tua
        velocità. Un runner veloce sui 10 km ma con pochi chilometri nelle gambe
        di solito manca la maratona prevista, spesso di parecchi minuti, perché
        le tabelle danno per scontato un allenamento adatto alla distanza.
        Salite, caldo, vento e una gara gestita male abbassano l’indice, quindi
        un VDOT preso in una giornata storta ti sottostima. La quota sostenibile
        è una curva media: alcuni runner tengono una frazione del massimo più
        alta di altri, e trail e ultra escono da ciò per cui le formule sono
        state costruite. Prendi il VDOT come un punto di partenza ben tarato e
        regola i ritmi su sensazioni e frequenza cardiaca.
      </p>
    </div>
  );
}
