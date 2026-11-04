import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentIt() {
  return (
    <div>
      <p>
        CTL, ATL e TSB sono tre curve ricavate dallo stesso carico di
        allenamento giornaliero. La CTL (<em>chronic training load</em>) viene
        chiamata forma, l’ATL (<em>acute training load</em>) fatica e la TSB (
        <em>training stress balance</em>) freschezza. Nascono dal modello
        impulso-risposta pubblicato da Eric Banister nel 1975: ogni seduta fa
        salire sia la forma sia la fatica, la fatica sparisce in pochi giorni,
        la forma in settimane, e la prestazione sta nella differenza tra le due.
        Le sigle sono state rese popolari più tardi dai software per il
        ciclismo, ma i conti sono quelli di Banister.
      </p>

      <h2>Come si calcolano</h2>
      <p>
        Si parte da un carico al giorno, per esempio la somma dei{' '}
        <Link href="/it/learn/trimp">TRIMP</Link> delle sedute della giornata (0
        nei giorni di riposo). Forma e fatica sono medie pesate esponenzialmente
        di questa serie, con costanti di tempo diverse:
      </p>
      <Formula
        where={[
          'CTL: τ = 42 giorni, ogni giorno pesa 1 − e^(−1/42) ≈ 0,0235',
          'ATL: τ = 7 giorni, ogni giorno pesa 1 − e^(−1/7) ≈ 0,133',
          'TSB = CTL − ATL',
        ]}
      >
        oggi = ieri + (1 − e^(−1/τ)) × (carico − ieri)
      </Formula>
      <p>
        Con τ = 42 giorni, l’effetto di una seduta sulla CTL si dimezza in circa
        29 giorni; sull’ATL, in meno di 5. Alcuni strumenti usano la scorciatoia
        delle medie mobili, 2 / (N + 1), come peso giornaliero. Non è lo stesso
        modello: con N = 42 dà 0,047, il doppio di 0,0235, il che equivale a
        dimezzare entrambe le costanti di tempo e rende le curve molto più
        reattive (Clarke e Skiba, 2013, spiegano la derivazione).
      </p>
      <p>
        Gli strumenti non concordano neanche sul giorno usato per la TSB.
        OpenAthlete sottrae i valori dello stesso giorno, dopo aver contato il
        carico di quel giorno; altri usano quelli di ieri, per descrivere quanto
        sei fresco all’inizio della seduta di oggi. Sugli stessi dati la
        differenza può essere di qualche punto: non confrontare i numeri tra
        un’app e l’altra.
      </p>

      <h2>Un esempio con i numeri</h2>
      <p>
        Una runner viaggia da mesi su una media di 60 di TRIMP al giorno: CTL e
        ATL sono a 60, la TSB a 0. Inizia una settimana pesante a 90 al giorno.
        Dopo il primo giorno:
      </p>
      <ul>
        <li>CTL = 60 + 0,0235 × (90 − 60) = 60,7</li>
        <li>ATL = 60 + 0,133 × (90 − 60) = 64,0</li>
        <li>TSB = 60,7 − 64,0 = −3,3</li>
      </ul>
      <p>
        Dopo sette giorni a 90, la CTL è salita appena a 64,6 mentre l’ATL è
        balzata a 79,0: la TSB è a −14,4. È un po’ più in forma e decisamente
        stanca. Poi scende a 40 al giorno per una settimana. L’ATL cala in
        fretta a 54,3, la CTL scende solo a 60,8 e la TSB torna positiva, +6,5.
        Questa asimmetria, la fatica che se ne va prima della forma, è tutto il
        principio del <Link href="/it/learn/taper">tapering</Link>.
      </p>

      <h2>Come usarle in allenamento</h2>
      <p>
        La CTL dice quanto allenamento hai assorbito nell’ultimo mese o due. Una
        crescita costante di qualche punto a settimana durante un blocco di
        costruzione è il quadro tipico; un salto brusco va messo in discussione,
        e anche un lungo plateau se ti aspettavi progressi. L’ATL si muove ogni
        settimana e spiega soprattutto perché hai le gambe pesanti. La TSB è
        quella che si guarda prima di una gara: la maggior parte degli atleti
        corre bene tra un valore leggermente negativo e uno chiaramente
        positivo, ma il valore giusto è personale e lo impari solo annotando la
        TSB prima delle gare andate bene e di quelle andate male.
      </p>
      <p>
        Le curve diventano più utili quando si allungano nel futuro. Se le
        sedute pianificate hanno una stima del carico, il modello può proiettare
        CTL, ATL e TSB fino al giorno della gara e mostrare se le ultime due
        settimane ti portano davvero fresco al via. OpenAthlete lo fa: calcola
        le curve dalle tue attività e le proietta sulle sedute del tuo
        calendario. Segnala una TSB sotto −20 o sopra +25; queste soglie sono
        convenzioni per leggere la curva, non limiti validati. Nella{' '}
        <Link href="/it/features/training-load">
          pagina sul carico di allenamento
        </Link>{' '}
        trovi i dettagli e il codice.
      </p>

      <h2>Limiti</h2>
      <p>
        Il modello vale quanto il carico giornaliero che gli dai. Il TRIMP da
        frequenza cardiaca sottostima sprint, forza e discese, quindi le curve
        perdono una parte di quello che un trail runner o un triatleta fa in
        palestra. Anche i buchi nei dati pesano: una settimana di uscite senza
        fascia cardio sembra una settimana di riposo.
      </p>
      <p>
        Le costanti di tempo sono convenzioni. Banister le stimava atleta per
        atleta e i valori variano molto; 42 e 7 giorni sono default ragionevoli,
        non la tua fisiologia. Hellard e colleghi (2006) hanno mostrato quanto
        siano instabili i parametri stimati anche con buoni dati di nuotatori
        d’élite. E il modello non sa nulla di sonno, malattia o stress fuori
        dallo sport. Una TSB negativa non diagnostica un sovrallenamento, e una
        alta non garantisce che tu sia pronto. Leggi le curve insieme all’
        <Link href="/it/learn/session-rpe">RPE di seduta</Link>, all’
        <Link href="/it/learn/hrv">HRV</Link> e alle sensazioni.
      </p>
    </div>
  );
}
