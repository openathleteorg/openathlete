import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentIt() {
  return (
    <div>
      <p>
        Il tapering, o scarico pre-gara, è il tratto di allenamento più leggero
        prima di una gara obiettivo. La logica è semplice: settimane di lavoro
        duro ti rendono più in forma e insieme più stanco, e la stanchezza se ne
        va prima della forma. Se abbassi il carico per un po’, la fatica
        sparisce e gran parte di quanto costruito resta. Fatto bene, arrivi al
        via più fresco di quanto ti sia sentito da mesi. Fatto male, perché hai
        tagliato poco o riposato troppo, arrivi ancora stanco o un po’ spento.
      </p>

      <h2>Cosa dicono gli studi</h2>
      <p>
        Bosquet e colleghi (2007) hanno messo insieme 27 studi su atleti
        agonisti di corsa, ciclismo e nuoto. Lo schema migliore è stato un
        tapering di circa due settimane, con un taglio progressivo del volume
        del 41-60%, senza cambiare né l’intensità né il numero di sedute
        settimanali. Mujika e Padilla (2003), rivedendo la letteratura
        precedente, arrivavano a una ricetta simile: mantenere l’intensità,
        ridurre molto il volume, non tagliare la frequenza oltre il 20% circa e
        preferire una riduzione progressiva a uno stop netto. Collocavano il
        miglioramento abituale intorno al 3%, con un intervallo dallo 0,5 al 6%.
      </p>
      <p>
        Sui maratoneti amatori, Smyth e Lawlor (2021) hanno analizzato i diari
        di allenamento di oltre 158.000 runner. I tapering rigorosi, in cui il
        volume cala settimana dopo settimana, sono associati a tempi migliori di
        quelli più rilassati, e quelli rigorosi di tre settimane hanno reso di
        più, con un guadagno mediano di circa cinque minuti e mezzo (2,6%)
        rispetto a un tapering minimo. Sono dati osservazionali: forse i runner
        più costanti fanno semplicemente un tapering migliore. Ma vanno nella
        stessa direzione degli esperimenti.
      </p>

      <h2>Il tapering in forma, fatica e freschezza</h2>
      <p>
        Il <Link href="/it/learn/ctl-atl-tsb">modello forma-fatica</Link> rende
        visibile il meccanismo. La forma (CTL) è una media esponenziale del
        carico giornaliero con costante di tempo di 42 giorni, la fatica (ATL)
        una media con costante di 7 giorni, e la freschezza (TSB) è la
        differenza:
      </p>
      <Formula
        where={[
          'Peso giornaliero della CTL = 1 − e^(−1/42) ≈ 0,024',
          'Peso giornaliero dell’ATL = 1 − e^(−1/7) ≈ 0,133',
        ]}
      >
        CTL(oggi) = CTL(ieri) + (carico − CTL(ieri)) × 0,024
      </Formula>
      <p>
        Dato che l’ATL reagisce circa cinque volte e mezzo più in fretta della
        CTL, un calo del carico fa scendere la fatica molto prima della forma, e
        la TSB sale. Tutto il tapering sta in questa frase.
      </p>

      <h2>Un esempio con i numeri</h2>
      <p>
        Un maratoneta ha appena fatto tre settimane a circa 560 di{' '}
        <Link href="/it/learn/trimp">TRIMP</Link> a settimana (circa 80 km per
        lui, 80 al giorno in media), dopo una base di 65 al giorno. Per tenere i
        conti leggibili, il carico è distribuito in modo uniforme su ogni
        settimana.
      </p>
      <ul>
        <li>Inizio del tapering: CTL 70,9, ATL 79,3, TSB −8,4.</li>
        <li>
          A due settimane dalla gara il volume scende del 30% (circa 56 km, 56
          al giorno). A fine settimana: CTL 68,6, ATL 64,6, TSB +4,1.
        </li>
        <li>
          Settimana della gara, volume al 45% del picco (circa 36 al giorno, una
          trentina di km prima del giorno della gara). La vigilia: CTL 64,3, ATL
          48,1, TSB +16,2.
        </li>
      </ul>
      <p>
        In due settimane la fatica è scesa di 31 punti e la forma di 6,6, circa
        il 9%. Se lo stesso runner si fosse fermato del tutto per quei 13
        giorni, la sua CTL sarebbe scesa intorno a 52. Il modello è
        approssimativo, ma mostra perché si riduce il volume invece di fermarsi
        e perché l’effetto si concentra negli ultimi giorni.
      </p>

      <h2>Come fare il tapering</h2>
      <ul>
        <li>
          Maratona: due o tre settimane. 10 km o mezza: una o due settimane.
          Gara secondaria: tre o quattro giorni più leggeri.
        </li>
        <li>
          Riduci il volume per gradi: 20-30% la prima settimana di un tapering
          di tre, 40-60% nella settimana della gara. Accorcia prima il lungo.
        </li>
        <li>
          Mantieni il ritmo della settimana e un po’ di intensità. Per esempio 3
          × 2 km a ritmo maratona dieci giorni prima, poi 6 × 1 min un po’ più
          veloci del ritmo gara quattro giorni prima: le gambe restano abituate
          alla velocità senza accumulare fatica.
        </li>
        <li>
          Dormi, mangia normalmente e lascia scarpe nuove, gel nuovi ed esercizi
          di forza nuovi a dopo la gara.
        </li>
      </ul>
      <p>
        In OpenAthlete puoi segnare quelle settimane come un ciclo di
        allenamento in fase di tapering, e le{' '}
        <Link href="/it/features/training-load">
          curve del carico di allenamento
        </Link>{' '}
        vengono proiettate sulle sedute pianificate: vedi la freschezza con cui
        arriverai alla gara prima ancora di correre la prima seduta di scarico.
      </p>

      <h2>Limiti</h2>
      <p>
        Non esiste una TSB obiettivo validata per il giorno della gara: il
        numero dipende da come si misura il carico e dall’atleta, e i migliori
        tapering degli studi sono stati giudicati dalla prestazione, non da una
        curva. Un tapering non salva una preparazione troppo corta e non
        corregge in una settimana un sovraccarico accumulato. Anche le
        sensazioni ingannano: gambe pesanti e nervosismo sono frequenti e di
        solito spariscono al via. Usa le curve per pianificare e le sedute a
        ritmo gara per giudicare.
      </p>
    </div>
  );
}
