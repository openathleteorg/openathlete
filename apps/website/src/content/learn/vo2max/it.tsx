import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentIt() {
  return (
    <div>
      <p>
        Il VO2max è il ritmo più alto al quale riesci a prelevare ossigeno
        dall’aria e a usarlo nei muscoli. Si esprime in litri al minuto o, più
        utile per chi corre, in millilitri per chilo al minuto, perché un corpo
        più pesante costa di più da spostare. A. V. Hill descrisse il plateau
        del consumo di ossigeno negli anni Venti, e da allora è il numero più
        citato della fisiologia dell’endurance. Misura la cilindrata del tuo
        motore aerobico. Da solo non decide quanto vai forte in gara.
      </p>

      <h2>Cosa determina il VO2max: l’equazione di Fick</h2>
      <p>
        Il consumo di ossigeno è il prodotto del sangue pompato dal cuore per
        l’ossigeno che i muscoli ne estraggono:
      </p>
      <Formula
        where={[
          'Q = gittata cardiaca (litri di sangue al minuto) = frequenza cardiaca × gittata sistolica',
          'CaO2 − CvO2 = differenza di contenuto di ossigeno tra sangue arterioso e venoso (ml di O2 per litro)',
        ]}
      >
        VO2 = Q × (CaO2 − CvO2)
      </Formula>
      <p>
        Allo sforzo massimo, l’estrazione differisce tra allenati e sedentari
        meno della gittata cardiaca, e la frequenza cardiaca massima non sale
        con l’allenamento. Quello che separa un 40 da un 70 è soprattutto la
        gittata sistolica, il sangue spinto fuori a ogni battito. Bassett e
        Howley (2000) concludono che negli atleti allenati il VO2max è limitato
        soprattutto dall’apporto di ossigeno, più che dai muscoli.
      </p>

      <h2>Come si misura o si stima</h2>
      <p>
        Il riferimento è il test in laboratorio: corsa su tapis roulant a
        velocità crescente con una maschera che analizza l’aria espirata, fino a
        quando il consumo di ossigeno smette di salire nonostante la velocità
        aumenti. Tutto il resto è una stima:
      </p>
      <ul>
        <li>
          Il test di Cooper (Cooper, 1968): distanza percorsa in 12 minuti, poi
          VO2max = (distanza in metri − 504,9) / 44,73.
        </li>
        <li>
          Il rapporto tra frequenze (Uth et al., 2004): VO2max ≈ 15,3 × FCmax /
          FCriposo. Veloce, ma richiede una FC massima vera e ignora quanto
          corri forte.
        </li>
        <li>
          La prestazione in gara: il <Link href="/it/learn/vdot">VDOT</Link> di
          Daniels trasforma un tempo in un VO2max «effettivo» che comprende la
          tua economia di corsa.
        </li>
        <li>
          Gli orologi: Garmin, Polar, COROS e altri lo stimano dal rapporto tra
          frequenza cardiaca e ritmo o potenza, con modelli non pubblicati per
          intero.
        </li>
      </ul>

      <h2>Un esempio con i numeri</h2>
      <p>
        Un corridore copre 2900 m nel test di Cooper, ha 48 battiti a riposo e
        188 di massima, e ha appena corso un 10 km in 45:00.
      </p>
      <ul>
        <li>Cooper: (2900 − 504,9) / 44,73 = 53,5 ml/kg/min</li>
        <li>Rapporto tra frequenze: 15,3 × 188 / 48 = 59,9 ml/kg/min</li>
        <li>VDOT dal 10 km: 45,3</li>
      </ul>
      <p>
        Tre numeri tra 45 e 60 per la stessa persona. Nessuno è sbagliato:
        misurano cose diverse. Il rapporto guarda solo il cuore, il Cooper uno
        sforzo di 12 minuti, il VDOT quello che il corridore produce davvero in
        45 minuti. Uno scarto così di solito indica un buon motore con margine
        su economia e resistenza.
      </p>
      <p>
        Per la versione di laboratorio, con valori plausibili: una gittata
        cardiaca di 25 litri al minuto e un’estrazione di 160 ml di ossigeno per
        litro di sangue danno 4000 ml/min, cioè 57 ml/kg/min per un corridore di
        70 kg.
      </p>

      <h2>VO2max, VAM ed economia di corsa</h2>
      <p>
        In piano, correre costa circa 3,5 ml/kg/min di ossigeno per ogni km/h
        (Léger e Mercier, 1984). Dividendo il VO2max per questo costo si ottiene
        una <Link href="/it/learn/vma">VAM</Link> approssimativa: 53,5 / 3,5 ≈
        15,3 km/h, vicino ai 15 km/h che questo corridore fa nel test di 6
        minuti. Chi consuma meno ossigeno per km/h, il più economico, va più
        veloce con lo stesso VO2max. Joyner e Coyle (2008) descrivono la
        prestazione di endurance come tre fattori insieme: il VO2max, la quota
        che riesci a sostenere (legata alla soglia del lattato) e l’economia.
      </p>

      <h2>Come usarlo in allenamento</h2>
      <p>
        Il VO2max risponde al lavoro vicino a esso: da 4 a 6 ripetute da 3 a 5
        minuti al 95–100% della VAM, con recuperi di durata simile, o formati
        brevi come il 30/30. Sale anche con il volume di corsa lenta, grazie a
        una gittata sistolica maggiore. Per fissare i ritmi, VAM e VDOT sono più
        pratici, perché sono velocità. In OpenAthlete il VO2max è una metrica
        importata da Garmin, Polar o COROS o inserita a mano, che puoi seguire
        nella pagina delle metriche accanto all’
        <Link href="/it/learn/hrv">HRV</Link> e alla frequenza a riposo. Il{' '}
        <Link href="/it/tools/vma">calcolatore della VAM</Link> ti dà i ritmi.
      </p>

      <h2>Limiti</h2>
      <p>
        Tra corridori di livello simile, il VO2max prevede male i risultati:
        economia e quota sostenibile contano altrettanto. I valori dell’orologio
        cambiano con caldo, salite, fatica e una frequenza massima sbagliata,
        quindi leggili come una tendenza su più settimane. La genetica fissa
        buona parte del tetto e i miglioramenti rallentano dopo i primi anni,
        mentre soglia ed economia possono continuare a crescere a lungo.
      </p>
    </div>
  );
}
