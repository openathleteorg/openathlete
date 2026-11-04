import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentIt() {
  return (
    <div>
      <p>
        L’allenamento polarizzato descrive un modo di distribuire l’intensità:
        gran parte del volume chiaramente facile, una quota più piccola ma reale
        chiaramente dura, e pochissimo nel mezzo. L’idea non nasce da un
        protocollo di laboratorio, ma dall’osservazione di ciò che fanno davvero
        gli atleti di endurance di alto livello. Rileggendo gli studi
        descrittivi, Stephen Seiler ha notato che gli atleti di livello
        nazionale e internazionale che si allenano da 10 a 13 volte a settimana
        tendono a fare circa l’80% delle sedute a bassa intensità e il 20%
        dominate da lavoro duro, come ripetute intorno al 90% del VO2max
        (Seiler, 2010).
      </p>
      <p>
        Lo schema viene spesso riassunto come «80/20». La scorciatoia nasconde
        due dettagli che contano: quali zone conti e se conti sedute o minuti.
      </p>

      <h2>Le tre zone</h2>
      <p>
        L’allenamento polarizzato usa un modello a tre zone costruito su due
        soglie fisiologiche. La zona 1 sta sotto la prima soglia ventilatoria o{' '}
        <Link href="/it/learn/lactate-threshold">soglia del lattato</Link>{' '}
        (lattato nel sangue intorno a 2 mmol/L): corsa facile in cui riesci a
        parlare con frasi complete. La zona 2 è tra le due soglie. La zona 3
        comincia sopra la seconda soglia (intorno a 4 mmol/L, vicino alla{' '}
        <Link href="/it/learn/critical-speed">velocità critica</Link>), dove
        stanno le ripetute.
      </p>
      <p>
        Occhio all’omonimia. Nei sistemi a cinque zone della maggior parte degli
        orologi, la «<Link href="/it/learn/zone-2">zona 2</Link>» è il fondo
        lento, che ricade nella zona 1 del modello a tre zone. L’allenamento
        polarizzato non ti chiede di evitare quelle uscite facili; ti chiede di
        passare poco tempo tra le due soglie.
      </p>

      <h2>Dargli un numero</h2>
      <p>
        Treff e colleghi (2019) hanno proposto un indice di polarizzazione per
        distinguere una distribuzione polarizzata dalle altre, partendo dalla
        frazione del tempo (o della distanza) di allenamento in ciascuna delle
        tre zone:
      </p>
      <Formula
        where={[
          'Z1, Z2, Z3 = frazione del tempo totale in ogni zona (0,80 per l’80%), Z1 + Z2 + Z3 = 1',
          'Valido se Z1 > Z3 > Z2. Se Z3 = 0, PI = 0. Se Z2 = 0, usa 0,01 per Z2 e Z3 − 0,01 per Z3',
          'PI > 2,00: polarizzato. PI ≤ 2,00: non polarizzato',
        ]}
      >
        PI = log10(Z1 / Z2 × Z3 × 100)
      </Formula>

      <h2>Un esempio con i numeri</h2>
      <p>
        Una runner si allena 8 ore a settimana. In un mese, il suo tempo per
        zona è in media 80% in zona 1, 5% in zona 2 e 15% in zona 3.
      </p>
      <ul>
        <li>Z1 / Z2 = 0,80 / 0,05 = 16</li>
        <li>16 × 0,15 × 100 = 240</li>
        <li>PI = log10(240) = 2,38, sopra 2,00: polarizzato</li>
      </ul>
      <p>
        Cambia il mix in 75% / 20% / 5%, una piramide con molto medio e poche
        ripetute: PI = log10(0,75 / 0,20 × 0,05 × 100) = log10(18,75) = 1,27. Un
        blocco centrato sulla soglia, 60% / 35% / 5%, dà 0,93. Stesse ore
        settimanali, tre settimane molto diverse.
      </p>

      <h2>Sedute o minuti?</h2>
      <p>
        L’80/20 di Seiler conta le sedute. Il tempo per zona dà un’altra
        immagine, perché una seduta dura è fatta soprattutto di riscaldamento,
        recuperi e defaticamento. Una seduta di 70 minuti con 5 × 4' a passo dei
        3000-5000 m contiene 20 minuti di lavoro, e siccome la frequenza
        cardiaca arriva in ritardo, l’orologio ne registra ancora meno in zona
        3. Seiler e Kjerland (2006) hanno misurato in entrambi i modi undici
        giovani fondisti dello sci per 32 giorni: con la frequenza cardiaca, le
        loro sedute di endurance si dividevano in 75% / 8% / 17% fra le tre
        zone, e l’RPE di seduta dava quasi lo stesso risultato. Quattro uscite
        facili da un’ora più quella seduta di ripetute fanno una settimana 80/20
        per sedute, ma solo 20 dei suoi 310 minuti, circa il 6%, sono duri.
        Nessuna delle due letture è sbagliata, ma confronta cose confrontabili.
      </p>

      <h2>Come applicarlo</h2>
      <p>
        Per un runner con cinque o sei sedute a settimana, una settimana
        polarizzata può essere così: tre o quattro uscite facili e un lungo,
        tutti sotto la prima soglia, più una o due sedute dure come 5 × 4' o 6 ×
        3' a passo dei 3000-5000 m con recupero di corsa lenta di pari durata. I
        giorni facili devono restare facili, il che per quasi tutti vuol dire
        più piano di quanto vorremmo; fissa il tetto con il{' '}
        <Link href="/it/tools/heart-rate-zones">
          calcolatore delle zone cardiache
        </Link>{' '}
        o con il test della parola. Le statistiche di OpenAthlete mostrano la
        quota di allenamento sotto, tra e sopra le tue soglie, quanto basta per
        verificare che tipo di settimana hai corso davvero.
      </p>

      <h2>Limiti</h2>
      <p>
        Il sostegno sperimentale più solido viene da Stöggl e Sperlich (2014):
        48 runner, ciclisti, triatleti e fondisti ben allenati hanno seguito per
        nove settimane uno di quattro programmi, e il gruppo polarizzato ha
        migliorato il VO2picco dell’11,7% e il tempo di esaurimento del 17,4%,
        più dei gruppi volume, soglia o ripetute. Nove settimane e 48 atleti
        divisi in quattro gruppi sono uno studio breve e piccolo, su soggetti
        già in forma. Lo stesso Seiler (2010) presenta l’80/20 come descrittivo:
        è ciò verso cui convergono gli atleti di successo, non la prova che sia
        ottimale per tutti. Un runner con quattro ore a settimana forse guadagna
        di più con un po’ di lavoro alla soglia che con una polarizzazione
        rigida; la questione è aperta. Infine, le zone dipendono da soglie da
        testare o stimare, e un errore di 10 battiti sposta minuti da una zona
        all’altra.
      </p>
    </div>
  );
}
