import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentIt() {
  return (
    <div>
      <p>
        La VAM, velocità aerobica massima (VMA in francese, MAS o vVO2max in
        inglese), è la velocità di corsa più bassa alla quale il tuo consumo di
        ossigeno arriva al tetto, il tuo{' '}
        <Link href="/it/learn/vo2max">VO2max</Link>. Oltre, l’energia in più
        arriva dal metabolismo anaerobico, ed è per questo che quasi tutti
        reggono la VAM solo per 4–8 minuti. Il concetto viene dalla scuola
        francese: il test su pista di Luc Léger nel 1980, poi i lavori di
        Véronique Billat negli anni Novanta. Il vantaggio è pratico: il VO2max è
        un numero da laboratorio in millilitri, la VAM è una velocità che puoi
        correre in pista.
      </p>

      <h2>Come si calcola la VAM</h2>
      <p>
        Il metodo da campo più diretto è il test di 6 minuti (mezzo Cooper).
        Dopo 20 minuti di riscaldamento e qualche allungo, corri la distanza più
        lunga possibile in 6 minuti, a ritmo regolare. Sei minuti rientrano nel
        tempo che quasi tutti reggono alla VAM, quindi la velocità media ne è
        una buona stima:
      </p>
      <Formula
        where={[
          'distanza in metri, tempo in minuti; × 0,06 converte m/min in km/h',
        ]}
      >
        VAM (km/h) = distanza / tempo × 0,06
      </Formula>
      <p>
        Il test di Cooper da 12 minuti è più facile da gestire ma dà un valore
        un po’ basso, perché quasi tutti calano dopo 6 o 7 minuti a quella
        velocità. I test incrementali (quello di Léger e Boucher, il VAMEVAL)
        aumentano la velocità di 0,5 o 1 km/h a ogni stadio finché non riesci
        più a tenere il passo; l’ultimo stadio completato dà la VAM. Servono
        pista, coni e una traccia audio, ma il problema della gestione del ritmo
        sparisce.
      </p>
      <p>
        Puoi anche partire da una gara recente. Ogni distanza si corre a una
        quota tipica della VAM: circa 95% sui 5 km, 90% sui 10 km, 85% in mezza
        maratona e 80% in maratona. Dividi la velocità media per quella quota.
        Un 5 o 10 km pianeggiante stima meglio di una maratona, dove
        rifornimenti e caldo contano più della potenza aerobica.
      </p>

      <h2>Un esempio con i numeri</h2>
      <ul>
        <li>
          Test di 6 minuti: 1500 m → 1500 / 6 × 0,06 = 15,0 km/h (4:00/km)
        </li>
        <li>
          Test di Cooper, stesso corridore: 2900 m in 12 minuti → 14,5 km/h
        </li>
        <li>10 km in 45:00: 13,33 km/h di media, diviso 0,90 → 14,8 km/h</li>
      </ul>
      <p>
        Tre metodi, tre risultati entro 0,5 km/h l’uno dall’altro. È una
        dispersione normale, e ricorda che la VAM è una stima con un margine,
        non un dato fisso come l’altezza. Con 15 km/h i ritmi diventano:
      </p>
      <ul>
        <li>100% VAM: 15,0 km/h, 4:00/km, 125 m in 30 secondi</li>
        <li>95%: 14,25 km/h, 4:13/km</li>
        <li>85% (vicino alla soglia per molti): 12,75 km/h, 4:42/km</li>
        <li>65–75% (corsa lenta): da 9,75 a 11,25 km/h, da 6:09 a 5:20/km</li>
      </ul>

      <h2>Come usarla in allenamento</h2>
      <p>
        La VAM è il metro delle ripetute. Formati classici alla VAM o quasi: il
        30/30 (30 secondi al 100% e 30 di corsa leggera) ripetuto da 10 a 20
        volte, 6 × 1000 m al 95% con 2 minuti di recupero, 5 × 3 minuti tra 95 e
        100%. Billat ha mostrato che il tempo di mantenimento alla VAM varia
        molto tra corridori dello stesso livello (Billat e Koralsztein, 1996):
        per questo ripetute brevi con recuperi brevi permettono di accumulare
        più minuti a quell’intensità di un unico sforzo lungo.
      </p>
      <p>
        Sotto la VAM le percentuali diventano meno affidabili. Due corridori da
        15 km/h possono avere la soglia all’82% e al 90% della VAM, a seconda
        della resistenza e della storia di allenamento. Per il medio e il lungo,
        la frequenza cardiaca (vedi il{' '}
        <Link href="/it/tools/heart-rate-zones">
          calcolatore delle zone cardiache
        </Link>
        ) o ritmi ricavati dalle gare come il{' '}
        <Link href="/it/learn/vdot">VDOT</Link> guidano spesso meglio. Il{' '}
        <Link href="/it/tools/vma">calcolatore della VAM</Link> trasforma un
        test o una gara in ritmi, e le{' '}
        <Link href="/it/pace-charts">tabelle dei ritmi</Link> fanno il conto al
        chilometro.
      </p>
      <p>
        In OpenAthlete la VAM è una delle tue capacità. I passi di una seduta
        possono puntare a una sua percentuale (per esempio 95%), e la seduta
        arriva con ritmi veri sugli orologi Garmin, Suunto o COROS.
      </p>

      <h2>Limiti</h2>
      <p>
        La VAM dipende dal test: tapis roulant, pista, strada ondulata o una
        giornata di vento danno numeri diversi, e 6 minuti gestiti male possono
        costare 0,5 km/h. Mescola poi due cose, VO2max ed economia di corsa: due
        corridori con lo stesso VO2max possono avere 1–2 km/h di differenza di
        VAM se uno corre in modo più economico. E dice poco della resistenza. Un
        corridore con VAM alta e pochi chilometri crollerà in una mezza che un
        altro con meno VAM e più volume chiude tranquillo. Usala per fissare i
        ritmi delle ripetute, ripeti il test ogni due o tre mesi e lascia che le
        gare ti dicano il resto.
      </p>
    </div>
  );
}
