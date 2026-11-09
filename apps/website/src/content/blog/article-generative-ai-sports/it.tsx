import Link from 'next/link';

import { Sources } from './sources';

export function ContentIt() {
  return (
    <div>
      <p>
        Per un atleta di endurance l'IA generativa non è né un gadget né una
        rivoluzione. È uno strumento per il testo. È bravissima a trasformare un
        linguaggio approssimativo in una struttura e una struttura in testo
        leggibile, ed è poco affidabile ogni volta che deve avere ragione sul
        tuo corpo o su numeri che nessuno le ha dato. Vista così, è chiaro dove
        fa risparmiare tempo e dove può fare danni.
      </p>

      <h2>Le riesce bene: scrivere una seduta</h2>
      <p>
        Inserire un allenamento strutturato nell'app dell'orologio è noioso.
        Descriverlo no. "20 minuti facili, poi 6 × 3 minuti forte con 2 minuti
        di corsetta, 10 minuti di defaticamento" è proprio il tipo di frase che
        un modello linguistico gestisce bene: la divide in passi, calcola le
        ripetizioni e, se conosce le tue zone, dà un obiettivo a ogni passo. Il
        "forte" da 3 minuti diventa il tuo intervallo di ritmo da VO2max, la
        "corsetta" il ritmo di recupero.
      </p>
      <p>
        Prima di mandare la seduta all'orologio conviene controllare due cose:
        la durata totale (a volte il modello salta o raddoppia un blocco) e
        l'intensità scelta per le parole vaghe. "Forte" può voler dire soglia
        per qualcuno e ritmo dei 5 km per qualcun altro. Se ha sbagliato,
        diglielo, o la prossima volta scrivi "alla soglia".
      </p>

      <h2>Le riesce bene: trasformare le sensazioni in dati</h2>
      <p>
        Dopo un lungo, quasi nessuno compila un modulo con cinque cursori. Si
        dice piuttosto: "la prima ora bene, poi il caldo mi ha steso, gli ultimi
        5 km sono stati una fatica e il polpaccio destro si è indurito". Un
        modello linguistico può ricavarne un punteggio di fatica intorno a 8 e
        una nota: polpaccio destro, contrattura, nella parte finale. Nel giro di
        qualche settimana, quelle note diventano qualcosa che un allenatore può
        davvero filtrare.
      </p>
      <p>
        Conta più di quanto sembri. Una revisione sistematica di Saw e colleghi
        (2016) ha trovato che le misure soggettive, riferite dall'atleta,
        seguono il carico di allenamento meglio della maggior parte dei
        marcatori oggettivi. Il collo di bottiglia è sempre stato convincere gli
        atleti a registrarle. Ridurre lo sforzo a una frase o a un messaggio
        vocale aiuta.
      </p>

      <h2>Le riesce bene: riassumere e riscrivere</h2>
      <p>
        Incolla quattro settimane di note sugli allenamenti e chiedi un
        riassunto prima di sentire il tuo allenatore: farà emergere i temi
        ricorrenti (l'Achille che protesta dopo le salite, le sedute del giovedì
        che saltano sempre) più in fretta di te. Può riscrivere una settimana
        attorno a un vincolo, per esempio una trasferta di lavoro da martedì a
        giovedì con solo il tapis roulant dell'hotel, e darti una bozza
        ragionevole. Può tradurre un piano che il tuo allenatore ha scritto in
        un'altra lingua. In ogni caso ottieni una bozza da controllare, non un
        ordine da eseguire.
      </p>

      <h2>Utilizzabile con cautela: spiegare</h2>
      <p>
        Chiedi cosa distingue il lavoro alla soglia dalle ripetute da VO2max, o
        perché il ritmo del lungo deve sembrare facile, e di solito avrai una
        spiegazione decente. Il rischio è che aggiunga con sicurezza un
        dettaglio sbagliato o citi uno studio che non esiste. I modelli
        linguistici producono testo scorrevole, non fatti verificati, un
        problema che i ricercatori chiamano allucinazione (Ji e colleghi, 2023).
        Se una risposta cita una fonte, cercala prima di ripeterla.
      </p>

      <h2>Le riesce male: fare diagnosi</h2>
      <p>
        Scrivi "mi fa male l'esterno del ginocchio dopo 20 km" e riceverai una
        risposta ordinata sulla bandelletta ileotibiale, con esercizi di
        allungamento e un piano di ritorno alla corsa. Forse ha ragione.
        Potrebbe anche essere tutt'altro, e il modello non ha modo di saperlo:
        non può visitarti, guardarti correre o premere sul punto che fa male.
        Una risposta plausibile a una domanda medica è peggio di nessuna
        risposta, perché rimanda la visita che avrebbe chiarito tutto. Un dolore
        che persiste, che ti fa zoppicare, che peggiora mentre corri o che c'è
        anche a riposo è roba da fisioterapista o da medico.
      </p>

      <h2>Le riesce male: piani completi dal nulla</h2>
      <p>
        Düking e colleghi (2024) hanno chiesto a ChatGPT piani di corsa di sei
        settimane e li hanno fatti valutare da allenatori esperti secondo 22
        criteri. Con poche informazioni, il piano stava sotto la media in 19 di
        essi. Con informazioni dettagliate andava molto meglio, ma gli autori
        sconsigliano comunque di seguire questi piani senza un allenatore
        esperto. L'errore tipico è facile da immaginare: corri 30 km a
        settimana, chiedi un piano per la maratona e la prima settimana ne
        prevede 50, perché il modello ha riempito il tuo storico con quello di
        un runner medio.
      </p>

      <h2>Le riesce male: numeri che non le hai dato</h2>
      <p>
        Chiedi "quanto ho corso a settembre?" senza darle i tuoi dati e un
        modello di chat può semplicemente inventare una cifra plausibile. Anche
        con i dati incollati, sommare trenta righe non è il suo forte. Totali,
        medie e calcoli di carico devono venire da un software che li calcola, e
        il modello linguistico dovrebbe solo commentare il risultato.
      </p>

      <h2>Come ottenere risposte più utili</h2>
      <p>
        Dalle contesto: le tue zone o i tuoi tempi recenti, il volume
        settimanale delle ultime quattro-sei settimane, la gara e la data, i
        giorni in cui puoi allenarti e qualsiasi fastidio in corso. Chiedile di
        dichiarare le sue ipotesi prima di scrivere qualsiasi cosa. Poi
        confronta il risultato con poche regole semplici: niente grandi salti di
        volume settimanale, non più sedute dure di quelle a cui sei abituato
        (due a settimana bastano e avanzano alla maggior parte dei runner
        amatori) e giorni facili che siano davvero facili.
      </p>

      <h2>In OpenAthlete</h2>
      <p>
        Le funzioni di IA di OpenAthlete restano dal lato del testo di quella
        linea. L'IA scrive una seduta strutturata partendo da una frase e usando
        le tue zone, modifica una seduta con una breve istruzione, fa tre o
        quattro domande dopo un'attività e trasforma le risposte in un punteggio
        di fatica e una nota sul dolore per il tuo allenatore, e dà una breve
        lettura di ogni attività. Vedi ogni seduta prima che arrivi
        all'orologio. Non fa diagnosi e funziona solo con il tuo consenso, con
        la tua chiave API o con la quota del piano Supporter. La{' '}
        <Link href="/it/features/ai-coach">pagina sull'IA</Link> ha i dettagli.
      </p>

      <h2>Fonti</h2>
      <Sources />
    </div>
  );
}
