import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentIt() {
  return (
    <div>
      <p>
        L’FTP (<em>functional threshold power</em>, potenza di soglia
        funzionale) è la potenza più alta che riesci a tenere in modo più o meno
        stabile per circa un’ora, in watt. Andrew Coggan l’ha definita come un
        sostituto pratico delle soglie di laboratorio, e il libro di Hunter
        Allen e Coggan, <em>Training and Racing with a Power Meter</em>, ne ha
        fatto il riferimento dell’allenamento in bici: zone, sedute e punteggi
        di carico si esprimono in percentuale dell’FTP. I sensori di potenza per
        la corsa hanno poi portato la stessa idea nel running.
      </p>
      <p>
        L’FTP è un valore da campo, misurato con un misuratore di potenza e uno
        sforzo a tutta, non un confine fisiologico misurato in laboratorio. Il
        parente più stretto in fisiologia è la potenza critica, che conviene
        capire insieme: le due cadono spesso a pochi watt l’una dall’altra senza
        essere la stessa cosa.
      </p>

      <h2>Come si stima l’FTP</h2>
      <p>
        La definizione originale è la potenza media di una cronometro di un’ora.
        Pochi hanno voglia di farla spesso, quindi il test più comune sono 20
        minuti a tutta, di solito preceduti da uno sforzo duro di 5 minuti per
        intaccare la riserva anaerobica, con il risultato ridotto del 5%:
      </p>
      <Formula
        where={[
          'P20 = potenza media di uno sforzo di 20 minuti a tutta, in watt',
        ]}
      >
        FTP ≈ 0,95 × P20
      </Formula>
      <p>
        Il fattore 0,95 corregge in media il fatto che su 20 minuti spingi più
        forte che su 60. Ad alcuni ciclisti va bene, ad altri meno, come si vede
        nei limiti più sotto.
      </p>

      <h2>La potenza critica</h2>
      <p>
        La potenza critica nasce con Monod e Scherrer (1965). Se metti i tuoi
        migliori sforzi su un grafico lavoro totale / tempo, tra circa 2 e 20
        minuti i punti si allineano su una retta. La pendenza è la potenza
        critica (CP); l’intercetta, W′ («W primo»), è una quantità fissa di
        lavoro che puoi fare sopra la CP prima di dover rallentare:
      </p>
      <Formula
        where={[
          'CP = potenza critica, in watt',
          'W′ = capacità di lavoro sopra la CP, in joule',
          't = durata dello sforzo, in secondi',
        ]}
      >
        P(t) = CP + W′ / t
      </Formula>
      <p>
        In termini fisiologici, la CP separa il dominio pesante, dove consumo di
        ossigeno e lattato si stabilizzano, da quello severo, dove continuano a
        salire fino allo stop (Poole et al., 2016). Sopra la CP ogni secondo
        consuma un po’ di W′; sotto, W′ si ricarica lentamente. L’equivalente
        nella corsa, con la velocità al posto della potenza, è la{' '}
        <Link href="/it/learn/critical-speed">velocità critica</Link>.
      </p>

      <h2>Un esempio con i numeri</h2>
      <p>
        Una ciclista fa 262 W di media in un test di 20 minuti. I suoi migliori
        sforzi recenti sono 340 W su 3 minuti, 310 W su 5, 275 W su 12 e quei
        262 W su 20.
      </p>
      <ul>
        <li>FTP ≈ 0,95 × 262 = 249 W</li>
        <li>
          Una regressione del lavoro sul tempo per i quattro sforzi (61,2, 93,0,
          198,0 e 314,4 kJ) dà CP = 248 W e W′ = 18,0 kJ
        </li>
        <li>
          Potenza prevista sui 10 minuti: 248 + 17.965 / 600 = 278 W, coerente
          con i record sui 5 e 12 minuti che la racchiudono
        </li>
        <li>
          Uno scatto a 400 W consuma 400 − 248 = 152 joule di W′ al secondo,
          quindi 17.965 / 152 ≈ 118 secondi prima di svuotare la riserva
        </li>
      </ul>
      <p>
        Qui FTP e CP coincidono quasi al watt. Succede spesso in media ed è poco
        affidabile sul singolo: su 17 ciclisti allenati, Karsten et al. (2021)
        hanno trovato una CP media di 256 W e un FTP di 249 W, ma lo scarto per
        il singolo ciclista andava da circa 19 W in un senso a 33 W nell’altro.
      </p>

      <h2>Come usare l’FTP in allenamento</h2>
      <p>
        Le zone di potenza classiche di Coggan sono percentuali dell’FTP. Con
        249 W: endurance (56–75%) da 139 a 187 W, tempo (76–90%) da 189 a 224 W,
        soglia (91–105%) da 227 a 261 W e VO2max (106–120%) da 264 a 299 W. Da
        lì seguono le sedute tipiche:
      </p>
      <ul>
        <li>2 × 20 minuti al 95–100% dell’FTP (237–249 W), 5 minuti facili</li>
        <li>3 × 12 minuti al 100–105% con 4 minuti di recupero</li>
        <li>5 × 4 minuti al 110–120% (274–299 W), recupero uguale</li>
        <li>Uscite lunghe di 2–4 ore sotto il 75%</li>
      </ul>
      <p>
        CP e W′ aggiungono ciò che l’FTP non dice: quanto puoi restare sopra la
        soglia. Serve per gestire una salita, una cronometro breve o una gara
        piena di rilanci. Ripeti il test ogni sei-otto settimane, o prima se le
        sedute alla soglia diventano troppo facili o impossibili.
      </p>
      <p>
        In OpenAthlete l’FTP per bici e corsa è una metrica che inserisci o
        sincronizzi; l’app non ti fa fare test. I passi del{' '}
        <Link href="/it/features/workout-builder">
          costruttore di allenamenti
        </Link>{' '}
        possono avere come obiettivo una percentuale dell’FTP o della potenza
        critica. La vista Capacità delle statistiche stima la potenza critica
        dai tuoi migliori valori di potenza in bici tra 2 e 20 minuti e mostra
        un intervallo al 95%: quei valori vengono dall’allenamento, non da test
        massimali, quindi il risultato vale al massimo quanto mostrano.
      </p>

      <h2>Limiti</h2>
      <p>
        L’ora della definizione è approssimativa. Quando Borszcz et al. (2018)
        hanno fatto pedalare 23 ciclisti allenati al loro FTP da 20 minuti fino
        all’esaurimento, hanno resistito in media 50,9 minuti, con una
        deviazione standard di quasi 16 minuti: alcuni sono andati ben oltre
        l’ora, altri si sono fermati verso la metà. Chi ha una grande capacità
        anaerobica ottiene dal test di 20 minuti un FTP gonfiato; i diesel, uno
        troppo basso.
      </p>
      <p>
        Anche le condizioni del test spostano il numero: caldo sui rulli senza
        ventilazione sufficiente, partenza troppo veloce, fatica, motivazione.
        La potenza critica ha i suoi punti deboli. Dipende dalle durate che
        scegli, non regge fuori da circa 2–20 minuti, e gli sforzi presi da
        uscite normali raramente sono a tutta. Nessuna delle due dice qualcosa
        sulla durabilità, su quanta di quella potenza resta dopo tre ore in
        sella. Per l’intensità in termini cardiaci, vedi la{' '}
        <Link href="/it/learn/heart-rate-reserve">
          frequenza cardiaca di riserva
        </Link>
        ; per le soglie di laboratorio che l’FTP cerca di approssimare, la{' '}
        <Link href="/it/learn/lactate-threshold">soglia del lattato</Link>.
      </p>
    </div>
  );
}
