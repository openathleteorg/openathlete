import Link from 'next/link';

import { pricesFor } from './prices';

const { quoted: q, coachYear } = pricesFor('it');

export function ContentIt() {
  return (
    <div>
      <p>
        Se alleni atleti di endurance in Francia, o dove i club francesi dettano
        lo standard, la scelta spesso si riduce a TrainingPeaks o Nolio. Questo
        articolo aggiunge OpenAthlete, che sviluppiamo noi, e confronta i tre
        dal punto di vista dell'allenatore: quanto paghi quando il gruppo
        cresce, di cosa hanno bisogno i tuoi atleti e cosa ciascuno fa meglio
        degli altri. I prezzi vengono dalla pagina prezzi di ciascuna azienda,
        controllata il 3 novembre 2026. I prezzi in dollari sono al netto delle
        tasse, come li mostra TrainingPeaks.
      </p>

      <h2>Tre logiche di prezzo</h2>
      <p>
        <strong>TrainingPeaks</strong> fa pagare per atleta. Il piano per
        allenatori parte da {q('tpCoach')} al mese con quattro atleti Basic e
        uno Premium; ogni atleta Premium in più costa {q('tpPerMax')} al mese,
        che scendono fino a {q('tpPerMin')} con i volumi. C'è un costo di
        attivazione di {q('tpSetup')}, annullato con un codice promozionale. Gli
        atleti possono restare su Basic ({q('tpCoachUnlimited')} al mese ne
        coprono quanti vuoi), ma allora gli allenamenti pianificati non arrivano
        all'orologio, quindi la maggior parte degli allenatori paga il Premium o
        chiede agli atleti di pagare {q('tpYear')} all'anno di tasca propria.
      </p>
      <p>
        <strong>Nolio</strong> fa pagare a fasce. Starter costa {q('nStarter')}{' '}
        al mese per 3 atleti, Classic {q('nClassic')} per 25 e Pro {q('nPro')}{' '}
        per 30 atleti e due allenatori; un allenatore in più costa{' '}
        {q('nExtraCoach')} al mese. Gli atleti non pagano la sincronizzazione
        dell'orologio: il piano gratuito la include. I club hanno i loro piani,
        Club Starter a {q('nClubStarter')} e Club Classic a {q('nClubClassic')}{' '}
        al mese.
      </p>
      <p>
        <strong>OpenAthlete</strong> è gratuito fino a cinque atleti. Oltre, il
        piano Supporter a {q('oaYear')} all'anno toglie il limite, qualunque sia
        il gruppo, e aggiunge anche l'IA sulle nostre chiavi. La
        sincronizzazione dell'orologio è gratuita per gli atleti. Installarlo
        sul proprio server è gratuito e senza limiti.
      </p>

      <table>
        <thead>
          <tr>
            <th>Atleti</th>
            <th>TrainingPeaks (atleti su Premium)</th>
            <th>Nolio</th>
            <th>OpenAthlete</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>3</td>
            <td>{coachYear('trainingpeaks', 3)}</td>
            <td>{coachYear('nolio', 3)} (Starter)</td>
            <td>Gratis</td>
          </tr>
          <tr>
            <td>10</td>
            <td>{coachYear('trainingpeaks', 10)}</td>
            <td>{coachYear('nolio', 10)} (Classic)</td>
            <td>{q('oaYear')}</td>
          </tr>
          <tr>
            <td>25</td>
            <td>{coachYear('trainingpeaks', 25)}</td>
            <td>{coachYear('nolio', 25)} (Classic)</td>
            <td>{q('oaYear')}</td>
          </tr>
          <tr>
            <td>30</td>
            <td>{coachYear('trainingpeaks', 30)}</td>
            <td>{coachYear('nolio', 30)} (Pro)</td>
            <td>{q('oaYear')}</td>
          </tr>
        </tbody>
      </table>
      <p>
        Costo annuale per un allenatore, fatturazione mensile, prezzi di listino
        controllati il 3 novembre 2026. La colonna TrainingPeaks presuppone che
        l'allenatore paghi il Premium di ogni atleta; se i tuoi atleti lo pagano
        già, il conto è molto più basso.
      </p>

      <h2>Cosa fa meglio ciascuno</h2>
      <p>
        <strong>TrainingPeaks</strong> è la lingua comune. Molti atleti arrivano
        con un account e uno storico lì, molti allenatori ragionano in TSS e
        Performance Management Chart, e se vendi piani, il suo negozio li mette
        davanti agli acquirenti. Le app mobili sono mature e TrainingPeaks
        Virtual copre i rulli. Dal 22 luglio 2026 appartiene a Garmin; cosa può
        cambiare ne parliamo in
        <Link href="/it/blog/trainingpeaks-alternatives-after-garmin-acquisition">
          alternative a TrainingPeaks dopo l'acquisizione di Garmin
        </Link>
        .
      </p>
      <p>
        <strong>Nolio</strong> è fatto per i club francesi. È un'azienda di
        Grenoble, partner della federazione francese di atletica, con prezzi per
        associazioni, più allenatori sullo stesso account, app native iOS e
        Android e una libreria di oltre 200 video di esercizi per la forza. Se
        il tuo club vuole un solo account per tre allenatori e sessanta
        tesserati, Nolio ha un piano pensato per questo e noi no.
      </p>
      <p>
        <strong>OpenAthlete</strong> tiene un prezzo fisso e aggiunge alcune
        cose che gli altri due non pubblicizzano. L'IA funziona con la tua
        chiave (o con la quota Supporter): scrivi "10 km lenti poi 6 × 400 m a
        passo 5 km" e ottieni una seduta strutturata con le zone dell'atleta;
        dopo ogni attività l'atleta riceve una breve lettura e qualche domanda,
        e lo sforzo e gli eventuali dolori segnalati finiscono in un registro
        infortuni e sulla tua dashboard. Tramite il server MCP, Claude o ChatGPT
        possono leggere l'allenamento di un atleta e pianificare fino a 60
        sedute nel suo calendario. Il codice è AGPL-3.0, quindi un club può
        gestire la propria istanza, con accesso unico (SSO) e iscrizioni solo su
        invito.
      </p>

      <h2>Cosa manca a ciascuno</h2>
      <p>
        TrainingPeaks non elenca IA integrata nelle sue pagine prezzi, e il
        costo per atleta sale in fretta se paghi il Premium. I piani per
        allenatori di Nolio sono a pagamento dal primo atleta e Nolio non
        pubblicizza IA. Nessuno dei due è open source.
      </p>
      <p>
        Anche le lacune di OpenAthlete sono reali. Le app iOS e Android sono in
        test, quindi per ora gli atleti usano l'app web installabile. Non c'è un
        account club: ogni allenatore ha il suo, e un atleta può avere più
        allenatori. Niente negozio, niente libreria di video, nessuna
        partnership con federazioni. Gli allenamenti vanno su orologi Garmin,
        Suunto e COROS, non Polar. Il carico è il TRIMP di Banister dalla
        frequenza cardiaca, con l'RPE di seduta accanto, quindi i numeri non
        corrisponderanno al TSS se i tuoi atleti arrivano da TrainingPeaks.
      </p>

      <h2>Tre allenatori, tre risposte</h2>
      <p>
        Un allenatore indipendente con dodici runner su un mix di Forerunner, un
        COROS Pace e un Suunto: qui TrainingPeaks costa di più, a meno che gli
        atleti non paghino il proprio Premium. Nolio Classic e OpenAthlete fanno
        entrambi il lavoro; la differenza è tra {coachYear('nolio', 12)} e{' '}
        {q('oaYear')} all'anno, l'IA da una parte e le app native dall'altra.
      </p>
      <p>
        Un club con tre allenatori e sessanta tesserati che vogliono un'app sul
        telefono subito: i piani club di Nolio sono i più adatti. Un'istanza
        OpenAthlete propria è un'opzione se qualcuno nel club è disposto a
        gestire un server.
      </p>
      <p>
        Un allenatore che vende piani ad atleti con cui non parla mai: resta su
        TrainingPeaks. Né Nolio né OpenAthlete hanno un negozio.
      </p>
      <p>
        Più dettagli, con una fonte per ogni affermazione, nelle pagine{' '}
        <Link href="/it/compare/nolio">OpenAthlete vs Nolio</Link> e{' '}
        <Link href="/it/compare/trainingpeaks">
          OpenAthlete vs TrainingPeaks
        </Link>
        , e cosa offre OpenAthlete agli allenatori nella{' '}
        <Link href="/it/coaches">pagina per allenatori</Link>.
      </p>
    </div>
  );
}
