import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentIt() {
  return (
    <div>
      <p>
        La frequenza cardiaca di riserva è il margine su cui il tuo cuore lavora
        davvero: la frequenza massima meno quella a riposo. Se a riposo sei a 50
        e arrivi a 190, hai 140 battiti di riserva. Costruire le zone su questo
        margine, invece che su una semplice percentuale della massima, è il
        cosiddetto metodo di Karvonen, dal fisiologo finlandese Martti Karvonen,
        che lo usò nel 1957 in uno studio su come l’allenamento abbassava la
        frequenza cardiaca.
      </p>
      <p>
        Il vantaggio è che tiene conto del punto di partenza. Due runner con la
        stessa massima ma frequenze a riposo diverse non hanno lo stesso ritmo
        facile in battiti al minuto, e la riserva lo vede. In più si accorda
        meglio con la fisiologia: Swain e Leutholtz (1997) hanno mostrato che
        una percentuale della frequenza cardiaca di riserva corrisponde alla
        stessa percentuale della riserva di consumo di ossigeno, mentre una
        percentuale della frequenza massima non corrisponde alla stessa
        percentuale del VO2max.
      </p>

      <h2>Come si calcola</h2>
      <Formula
        where={[
          'FCR = FCmax − FCriposo, in battiti al minuto',
          'intensità = la quota di riserva che vuoi, 0,6 per il 60%',
        ]}
      >
        FC obiettivo = FCriposo + (FCmax − FCriposo) × intensità
      </Formula>
      <p>
        Le cinque zone più usate sono fasce del 10% della riserva: 50–60%,
        60–70%, 70–80%, 80–90% e 90–100%. Sono convenzioni, non soglie misurate
        su di te, e questo conta più avanti.
      </p>

      <h2>Un esempio con i numeri</h2>
      <p>Frequenza a riposo 50 bpm, massima 190 bpm: 140 battiti di riserva.</p>
      <ul>
        <li>Zona 1 (50–60%): 50 + 0,5 × 140 = da 120 a 134 bpm</li>
        <li>Zona 2 (60–70%): da 134 a 50 + 0,7 × 140 = 148 bpm</li>
        <li>Zona 3 (70–80%): da 148 a 162 bpm</li>
        <li>Zona 4 (80–90%): da 162 a 176 bpm</li>
        <li>Zona 5 (90–100%): da 176 a 190 bpm</li>
      </ul>
      <p>
        Con le percentuali della massima, la stessa zona 2 andrebbe da 114 a 133
        bpm, una quindicina di battiti in meno. Per un runner allenato, 114 bpm
        è quasi camminare: per questo molti, passando a Karvonen, scoprono che
        le uscite facili smettono di sembrare passeggiate.
      </p>
      <p>
        Ora lascia la massima a 190 e porta la frequenza a riposo a 65. La
        riserva scende a 125 battiti e la zona 2 diventa 65 + 0,6 × 125 = 140
        fino a 65 + 0,7 × 125 = 152,5, cioè circa da 140 a 153 bpm. Stessa
        massima, zona diversa, perché si è spostato il punto di partenza.
      </p>

      <h2>Misurare bene i due valori</h2>
      <p>
        La frequenza a riposo si prende sdraiati al risveglio, prima del caffè,
        per diverse mattine; tieni un valore tipico, non il più basso mai visto.
        Gli orologi spesso riportano il minimo notturno, qualche battito più
        basso, e così gonfiano un po’ la riserva.
      </p>
      <p>
        La massima è più difficile. Il valore più alto visto alla fine di una
        gara dura, o dopo l’ultima di una serie di salite a tutta, vale più di
        qualsiasi formula. Se non hai niente, Tanaka, Monahan e Seals (2001)
        propongono 208 − 0,7 × età, cioè 180 bpm a 40 anni. È una media di
        popolazione: molte persone se ne discostano di 10 battiti o più, e una
        massima sovrastimata di 10 battiti alza ogni zona di 6–9 battiti.
      </p>

      <h2>Come usarla in allenamento</h2>
      <p>
        Le zone cardio danno il meglio negli sforzi lunghi e costanti, quando il
        cuore ha il tempo di stabilizzarsi. Le uscite facili e il lungo in{' '}
        <Link href="/it/learn/zone-2">zona 2</Link> sono il caso tipico: da 134
        a 148 bpm per il runner dell’esempio, qualunque sia il passo in una
        giornata di vento o su un percorso mosso. Un medio di 30–40 minuti in
        zona 3, o 2 × 15 minuti nella parte alta della zona 4 (circa 169–173
        bpm, l’85–88% della riserva), si gestiscono bene col cardio.
      </p>
      <p>
        Sulle ripetute brevi, come 5 × 4 minuti alla soglia, la frequenza
        cardiaca è in ritardo sullo sforzo: impiega uno o due minuti a salire, e
        la prima ripetuta sembra facile sull’orologio anche quando non lo è.
        Gestisci quelle sedute a passo o a potenza, e usa il cardio dopo per
        verificare che la seduta abbia fatto il suo lavoro. La stessa frazione
        di riserva entra anche nei punteggi di carico come il{' '}
        <Link href="/it/learn/trimp">TRIMP</Link>: valori di riposo e massima
        corretti servono due volte.
      </p>
      <p>
        Il{' '}
        <Link href="/it/tools/heart-rate-zones">
          calcolatore delle zone cardio
        </Link>{' '}
        fa i conti con entrambi i metodi. In OpenAthlete le zone cardio si
        impostano in percentuale della massima o della riserva, la riserva viene
        calcolata dalle tue metriche di frequenza a riposo e massima, e i passi
        di un allenamento possono avere come obiettivo una percentuale della
        frequenza cardiaca di riserva.
      </p>

      <h2>Limiti</h2>
      <p>
        Tutto si regge su due valori, e nessuno dei due è fermo. La frequenza a
        riposo varia di qualche battito con il sonno, lo stress, il caldo o un
        raffreddore in arrivo; quella sotto sforzo sale con il caldo, la
        disidratazione, la caffeina e la quota, e deriva verso l’alto negli
        sforzi lunghi. Alcuni farmaci, i betabloccanti in particolare, cambiano
        entrambi gli estremi.
      </p>
      <p>
        Il limite più grande è che il 60, il 70 o l’80% della riserva sono
        uguali per tutti, la fisiologia no. La{' '}
        <Link href="/it/learn/lactate-threshold">soglia del lattato</Link> di un
        runner cade all’82% della riserva, quella di un altro al 90%. Se conosci
        la tua frequenza alla soglia, da un test in laboratorio o da uno sforzo
        di 30 minuti in gara, ancorare le zone lì è più preciso. Karvonen resta
        un buon punto di partenza quando non la conosci.
      </p>
    </div>
  );
}
