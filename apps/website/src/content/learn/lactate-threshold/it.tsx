import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentIt() {
  return (
    <div>
      <p>
        I tuoi muscoli producono lattato a qualunque andatura, anche camminando,
        e lo smaltiscono in continuazione. A ritmo facile le due cose si
        bilanciano e la concentrazione nel sangue resta vicina a quella a
        riposo, intorno a 1 mmol/L. Se acceleri, a un certo punto la produzione
        supera lo smaltimento. Quel punto è la soglia del lattato, ed è il
        motivo per cui un ritmo che tieni per un’ora non ha nulla a che vedere
        con uno più veloce di soli 15 secondi al chilometro.
      </p>
      <p>
        Il guaio è che «la» soglia del lattato non esiste come numero unico.
        Faude, Kindermann e Meyer (2009) hanno passato in rassegna più di venti
        concetti di soglia, con protocolli diversi e regole diverse per leggere
        la stessa curva. In pratica si dividono in due famiglie. La prima soglia
        (LT1, spesso chiamata soglia aerobica) è dove il lattato comincia a
        salire sopra il valore di riposo. La seconda (LT2, soglia anaerobica o,
        nella versione più rigorosa, massimo stato stazionario del lattato) è
        l’intensità più alta alla quale il lattato si stabilizza ancora invece
        di salire fino a farti fermare. Quando un allenatore parla di «corsa a
        soglia», intende quasi sempre la LT2.
      </p>

      <h2>Come si misura</h2>
      <p>
        Il test classico è incrementale, su tapis roulant o in pista: gradini da
        3 a 5 minuti, ognuno più veloce di 0,5–1 km/h, con una goccia di sangue
        presa dal dito o dal lobo dell’orecchio alla fine di ogni gradino. Poi
        si legge la soglia sulla curva. Due regole sono diffuse: una
        concentrazione fissa, di solito 4 mmol/L per la LT2, e un aumento
        rispetto al valore basale, spesso basale + 1 mmol/L per la LT1. La
        velocità tra due gradini si ricava per interpolazione lineare:
      </p>
      <Formula
        where={[
          'La = lattato obiettivo (4 mmol/L, oppure basale + 1)',
          'v1, La1 = velocità e lattato dell’ultimo gradino sotto l’obiettivo',
          'v2, La2 = velocità e lattato del primo gradino sopra',
        ]}
      >
        v = v1 + (La − La1) / (La2 − La1) × (v2 − v1)
      </Formula>
      <p>
        Il massimo stato stazionario del lattato è il riferimento a cui gli
        altri metodi cercano di avvicinarsi, ma per individuarlo servono diversi
        giorni di prove da 30 minuti a ritmo costante: per questo quasi nessuno
        lo misura fuori da un laboratorio (Jones et al., 2019).
      </p>

      <h2>Un esempio di calcolo</h2>
      <p>
        Un podista fa gradini da 4 minuti partendo da 10 km/h e aggiungendo 1
        km/h ogni volta. Lattato a fine gradino: 1,1; 1,2; 1,4; 1,8; 2,6; 4,1 e
        6,3 mmol/L a 10, 11, 12, 13, 14, 15 e 16 km/h.
      </p>
      <ul>
        <li>
          LT2 a 4 mmol/L: tra 14 km/h (2,6) e 15 km/h (4,1). v = 14 + (4 − 2,6)
          / (4,1 − 2,6) × 1 = 14,9 km/h, cioè 4:01 al chilometro.
        </li>
        <li>
          LT1 a basale + 1: il valore più basso è 1,1, quindi l’obiettivo è 2,1
          mmol/L, tra 13 km/h (1,8) e 14 km/h (2,6). v = 13 + 0,3 / 0,8 = 13,4
          km/h, cioè 4:29 al chilometro.
        </li>
      </ul>
      <p>
        Stesso test, stesso sangue, e le due soglie distano quasi 30 secondi al
        chilometro. Con un’altra regola di lettura (il punto più lontano dalla
        retta che unisce il primo e l’ultimo gradino, per esempio) otterresti un
        altro valore ancora. Non è un difetto del test: è il motivo per cui
        conviene chiedere sempre di quale soglia si parla.
      </p>

      <h2>Come usarla in allenamento</h2>
      <p>
        Senza laboratorio, una buona stima sul campo della LT2 è il ritmo che
        potresti tenere in gara per circa un’ora: per la maggior parte dei
        podisti allenati sta tra il ritmo dei 10 km e quello della mezza
        maratona. Le <Link href="/it/pace-charts">tabelle dei ritmi</Link> lo
        ricavano da un tempo recente. La frequenza cardiaca alla LT2 è spesso
        tra l’85 e il 92 % della massima, ma le differenze individuali sono
        ampie.
      </p>
      <ul>
        <li>
          Sedute a soglia: 3 × 10' o 5 × 6' a ritmo LT2 con 1–2 minuti di corsa
          lenta, oppure 20–30 minuti continui (il classico medio veloce). Deve
          essere «impegnativo ma controllato»: riesci a dire qualche parola, non
          una frase.
        </li>
        <li>
          La corsa facile resta sotto la LT1. È quel tetto che la{' '}
          <Link href="/it/learn/zone-2">zona 2</Link> cerca di rappresentare, e
          in una settimana{' '}
          <Link href="/it/learn/polarized-training">polarizzata</Link> la
          maggior parte dei tuoi minuti sta lì.
        </li>
        <li>
          Ripeti il test ogni 6–10 settimane, o usa le gare: la soglia si sposta
          con la forma, e zone vecchie finiscono nel posto sbagliato.
        </li>
      </ul>
      <p>
        OpenAthlete non misura il lattato. Inserisci o sincronizzi le tue zone,
        e le statistiche mostrano come si divide il tuo tempo sotto, tra e sopra
        le soglie, settimana dopo settimana, accanto alle curve di{' '}
        <Link href="/it/features/training-load">carico di allenamento</Link>.
      </p>

      <h2>Limiti</h2>
      <p>
        Il numero dipende dal protocollo: gradini più corti danno una velocità
        di soglia più alta, perché il lattato non ha finito di salire quando si
        preleva. Gli analizzatori portatili differiscono tra loro di qualche
        decimo di mmol/L, e questo sposta parecchio una soglia a valore fisso su
        un tratto piatto della curva. Con il glicogeno basso il lattato cala a
        ogni velocità e la soglia sembra migliore di quanto sia. E una velocità
        trovata sul tapis roulant a 18 °C non si trasferisce così com’è su un
        percorso collinare con il caldo. Se vuoi un riferimento di ritmo tratto
        dalle tue gare invece che da un prelievo, guarda la{' '}
        <Link href="/it/learn/critical-speed">velocità critica</Link>, che si
        colloca appena sopra il massimo stato stazionario del lattato.
      </p>
    </div>
  );
}
