import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentIt() {
  return (
    <div>
      <p>
        La zona 2 è il ritmo facile e regolare che riempie quasi tutta una
        settimana di allenamento fatta bene: quello del lungo e dei recuperi, in
        cui riesci ancora a parlare con frasi intere. Il nome viene dalla scala
        cardiaca a cinque zone usata da quasi tutti gli orologi e le app, dove
        sta tra la corsa lentissima (zona 1) e la zona 3, già più impegnativa.
        Dal punto di vista fisiologico corrisponde a intensità al prima soglia
        del lattato o appena sotto: il lattato nel sangue è appena sopra i
        valori di riposo e lo sforzo si regge per ore.
      </p>
      <p>
        È diventata di moda negli ultimi anni, soprattutto grazie ai discorsi su
        mitocondri e ossidazione dei grassi. Il consiglio di fondo è molto più
        vecchio: in quasi tutti gli sport di resistenza gli atleti passano la
        maggior parte del tempo di allenamento a bassa intensità, come hanno
        documentato le revisioni di Stephen Seiler sull’allenamento d’élite
        (Seiler, 2010).
      </p>

      <h2>Come si calcola la zona 2</h2>
      <p>
        Non esiste una definizione unica, ed è da qui che nasce quasi tutta la
        confusione. La versione più comune basata sulla frequenza cardiaca usa
        il metodo di Karvonen, sulla tua{' '}
        <Link href="/it/learn/heart-rate-reserve">
          frequenza cardiaca di riserva
        </Link>
        :
      </p>
      <Formula
        where={[
          'FCriposo: frequenza a riposo, misurata da sdraiato al risveglio',
          'FCmax: la frequenza più alta che hai davvero visto, meglio di una formula basata sull’età',
        ]}
      >
        Zona 2 = FCriposo + (0,60 – 0,70) × (FCmax − FCriposo)
      </Formula>
      <p>
        La variante semplice prende il 60–70% della frequenza massima. In
        laboratorio la zona 2 si aggancia invece a marcatori misurati: la prima
        soglia del lattato o ventilatoria. Le percentuali sono solo
        un’approssimazione di quelle soglie, e piuttosto grossolana.
      </p>
      <p>
        Attenzione a una trappola: nel modello a tre zone usato nella ricerca
        (Seiler e altri), la zona 1 è tutto ciò che sta sotto la prima soglia e
        la zona 2 è la fascia tra prima e seconda soglia. Quella «zona 2» è
        ritmo medio, non corsa lenta. Quando leggi uno studio, controlla quale
        scala usa.
      </p>

      <h2>Un esempio di calcolo</h2>
      <p>
        Una runner ha 50 bpm a riposo e ha visto 190 bpm alla fine di una dura
        seduta di salite. La sua riserva è di 140 battiti.
      </p>
      <ul>
        <li>Limite inferiore della zona 2: 50 + 0,60 × 140 = 134 bpm</li>
        <li>Limite superiore: 50 + 0,70 × 140 = 148 bpm</li>
        <li>
          Con il 60–70% della massima: 0,60 × 190 = 114 fino a 0,70 × 190 = 133
          bpm
        </li>
      </ul>
      <p>
        I due metodi quasi non si sovrappongono. Per una runner allenata con un
        battito a riposo basso, 114 bpm è quasi camminare, e la zona calcolata
        sulla massima finisce per lo più in zona 1. Per questo Karvonen di
        solito funziona meglio per chi corre, ed è il metodo predefinito del{' '}
        <Link href="/it/tools/heart-rate-zones">
          calcolatore delle zone cardiache
        </Link>
        .
      </p>
      <p>
        Un altro runner, 60 a riposo e 180 di massima, ottiene da 132 a 144 bpm.
        Numeri simili per due persone molto diverse: le zone hanno senso solo
        con i tuoi valori.
      </p>

      <h2>Come usare la zona 2 in allenamento</h2>
      <p>
        Per la maggior parte dei runner che si allenano da quattro a sei volte a
        settimana, quasi tutto il tempo di corsa va in zona 1 e 2, con una o due
        sedute dure in più. In pratica:
      </p>
      <ul>
        <li>
          Corsa lenta: da 40 a 70 minuti in zona 2, meglio nella parte bassa il
          giorno dopo le ripetute.
        </li>
        <li>
          Lungo: da 1h30 a 2h30, quasi tutto in zona 2. La frequenza sale piano
          piano con la stanchezza e il caldo; accetta qualche battito di deriva
          invece di finire trascinandoti, e annota quanto deriva, perché dice
          qualcosa della tua resistenza (vedi{' '}
          <Link href="/it/learn/aerobic-decoupling">
            disaccoppiamento aerobico
          </Link>
          ).
        </li>
        <li>
          Su terreno mosso, cammina le salite ripide se è questo che ti tiene in
          zona. Nel trail si fa lo stesso anche in gara.
        </li>
        <li>
          Misura i progressi con un riferimento fisso: lo stesso giro piatto
          alla stessa frequenza ogni tre o quattro settimane. Se il passo a 140
          bpm migliora, la tua base aerobica sta crescendo.
        </li>
      </ul>
      <p>
        Il test della parola è un buon controllo: se riesci a dire solo poche
        parole di fila, sei sopra la zona 2, qualunque cosa dica l’orologio.
      </p>
      <p>
        In OpenAthlete le zone cardiache si impostano in percentuale della
        massima o della riserva, per sport, e ogni attività mostra il tempo
        passato in ciascuna zona. La{' '}
        <Link href="/it/features/training-load">
          pagina sul carico di allenamento
        </Link>{' '}
        spiega come la frequenza cardiaca alimenta anche il{' '}
        <Link href="/it/learn/trimp">TRIMP</Link> di ogni seduta.
      </p>

      <h2>Limiti</h2>
      <p>
        Le zone in percentuale presumono che la prima soglia di chiunque cada
        alla stessa frazione della riserva. Non è così: nei runner allenati può
        stare ben sopra il 70%, nei principianti più in basso. Un test della
        soglia, in laboratorio o sul campo, dà confini migliori di qualsiasi
        percentuale.
      </p>
      <p>
        La frequenza massima è l’anello debole. Le formule basate sull’età, come
        quella di Tanaka (208 − 0,7 × età), descrivono una media di popolazione
        e sbagliano di 10 battiti o più per molte persone, spostando l’intera
        zona. Caldo, disidratazione, sonno scarso e caffeina alzano la frequenza
        a parità di passo, e nelle salite brevi il cuore reagisce in ritardo.
      </p>
      <p>
        Infine, ridimensiona le promesse. Buona parte dell’entusiasmo recente
        per zona 2, mitocondri e consumo dei grassi si basa su confronti tra
        ciclisti professionisti e persone poco allenate (San-Millán e Brooks,
        2018). Mostrano in cosa differiscono gli atleti allenati, non cosa farà
        per te una certa quantità di zona 2. Il volume facile funziona, e un po’
        di intensità in più anche: è l’idea dell’
        <Link href="/it/learn/polarized-training">allenamento polarizzato</Link>
        .
      </p>
    </div>
  );
}
