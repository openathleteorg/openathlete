import Link from 'next/link';

import { Sources } from './sources';

export function ContentIt() {
  return (
    <div>
      <p>
        Un paio di anni fa, "coaching con l'IA" voleva dire soprattutto un
        chatbot che scriveva un piano generico di dodici settimane e si
        dimenticava di te appena chiudevi la scheda. Quello che è cambiato da
        allora non è che i modelli linguistici capiscano all'improvviso meglio
        l'allenamento. È che adesso possono agire: aprire il tuo calendario,
        leggere le attività del mese scorso e scrivere sedute nel piano che il
        tuo orologio scaricherà domattina. È quello che si chiama agente, e vale
        la pena ragionare con calma su cosa cambia per gli allenatori e cosa no.
      </p>

      <h2>Cos'è MCP, in breve</h2>
      <p>
        Il Model Context Protocol è uno standard aperto, presentato da Anthropic
        a novembre 2024, che permette a un client di IA come Claude o ChatGPT di
        chiamare strumenti esposti da un'altra applicazione. Una piattaforma di
        allenamento può esporre strumenti come "leggi il calendario di queste
        settimane", "ottieni il carico di allenamento", "pianifica queste
        sedute" o "sposta questa seduta a giovedì". Il modello decide quali
        strumenti chiamare e in che ordine. L'applicazione decide cosa il
        modello può toccare e controlla ogni richiesta come controllerebbe un
        clic dell'utente.
      </p>
      <p>
        Questa separazione conta. Il modello porta il linguaggio e il
        ragionamento; la piattaforma tiene i dati, i permessi e le regole. Un
        modello che ti capisce male può proporre una sciocchezza, ma non può
        raggiungere niente che la piattaforma non esponga.
      </p>

      <h2>Un lunedì realistico</h2>
      <p>
        Prendiamo un allenatore con quindici atleti. Lunedì mattina una di loro,
        a nove settimane da una maratona, scrive che ha l'influenza da sabato e
        che, se va bene, riprenderà giovedì. Il lavoro di sempre: aprire il suo
        calendario, cancellare o spostare cinque o sei sedute, riscrivere il
        resto della settimana, accorciare il lungo e controllare che la
        settimana successiva abbia ancora senso. Dieci o quindici minuti, ed è
        il terzo messaggio del genere della giornata.
      </p>
      <p>
        Con un agente collegato alla piattaforma, l'allenatore può scrivere:
        "Anna è malata da sabato, probabilmente fino a giovedì. Registralo,
        tieni tutto facile fino a domenica, sposta il 3 × 15 minuti a ritmo
        maratona di sabato a martedì prossimo e porta il lungo di domenica a
        1h15 facile". L'agente registra la malattia, legge il calendario, fa le
        modifiche e riferisce. L'allenatore guarda la settimana nel calendario,
        corregge una cosa e passa oltre.
      </p>
      <p>
        Nota chi ha preso le decisioni. Ogni scelta in quell'istruzione (quanto
        restare sul facile, quale seduta merita di essere spostata, quanto deve
        durare il lungo) viene dall'allenatore. L'agente ha fatto i clic. È la
        versione onesta di ciò che gli agenti offrono oggi al coaching: la metà
        amministrativa del lavoro costa molto meno, e la metà fatta di giudizio
        resta dov'era.
      </p>

      <h2>Dove gli agenti sbagliano ancora</h2>
      <p>
        <strong>Sapere cosa non sanno.</strong> Un agente pianifica un blocco
        anche quando i dati sono scarsi: niente frequenza cardiaca su metà delle
        corse, nessun RPE, una settimana di viaggio di cui nessuno ha parlato.
        Impellizzeri e colleghi sostengono da anni che è il carico interno,
        quanto l'allenamento è costato a quell'atleta, a guidare l'adattamento,
        ed è proprio la parte che più spesso manca nei dati. Un allenatore vede
        il buco. Un modello tende a riempirlo con supposizioni.
      </p>
      <p>
        <strong>Il giudizio a lungo termine.</strong> Se aggiungere una terza
        seduta di qualità, quando iniziare lo scarico pre-gara, se questo atleta
        ha bisogno adesso di una settimana leggera o può reggerne un'altra:
        tutto dipende da anni di storico, dal lavoro e dalla famiglia, da come
        reagisce alla fatica. Quando Düking e colleghi (2024) hanno fatto
        valutare da allenatori esperti dei piani di corsa scritti da ChatGPT, i
        piani miglioravano molto con più informazioni, ma non venivano comunque
        giudicati ottimali, e gli autori raccomandano la revisione di un
        allenatore.
      </p>
      <p>
        <strong>Errori fatti con sicurezza.</strong> Una zona letta male
        trasforma una corsa di recupero in una seduta alla soglia. Una data
        sbagliata di un giorno mette il lungo la vigilia di una gara. I modelli
        linguistici fanno questi errori dentro un testo scorrevole e
        ragionevole, ed è per questo che sfuggono facilmente.
      </p>
      <p>
        <strong>La responsabilità.</strong> Quando un piano contribuisce a un
        infortunio, qualcuno deve assumersi quella decisione e parlarne con
        l'atleta. Un modello non può.
      </p>

      <h2>Tenere l'allenatore nel giro, in pratica</h2>
      <p>
        "Tenere una persona nel giro" è facile a dirsi. In uno strumento di
        coaching si traduce in poche scelte di progettazione concrete:
      </p>
      <ul>
        <li>
          L'agente scrive nello stesso calendario che vedono allenatore e
          atleta. Niente succede in uno strato nascosto, quindi una modifica
          sbagliata si vede subito.
        </li>
        <li>
          Ha l'istruzione di spostare e modificare le sedute invece di
          cancellarle e ricrearle: una modifica resta una modifica.
        </li>
        <li>
          Le sedute svolte e le attività registrate sono storico. L'agente non
          può riscriverle.
        </li>
        <li>
          L'IA funziona solo dopo un consenso esplicito, che si può ritirare.
        </li>
        <li>
          I dati vanno al fornitore di modelli che hai scelto, con la tua
          chiave. Su un'istanza self-hosted con un modello locale, non lasciano
          il tuo server.
        </li>
      </ul>

      <h2>Un'ipotesi prudente per i prossimi anni</h2>
      <p>
        Il costo amministrativo del coaching continuerà a scendere. Un
        allenatore che passa la domenica sera a riscrivere le settimane di venti
        atleti ci dedicherà molto meno tempo. Può andare in due direzioni: più
        atleti per allenatore o più attenzione per atleta. La seconda è l'uso
        migliore, e gli atleti si accorgeranno di quale ha scelto il loro
        allenatore.
      </p>
      <p>
        Gli atleti che si allenano da soli con un agente se la caveranno bene se
        sanno già com'è un buon allenamento e usano l'agente per metterlo in
        pratica. È più rischioso per i principianti, che sono i meno capaci di
        riconoscere un piano sbagliato e i più propensi a seguirlo. Non ci
        aspettiamo una previsione affidabile degli infortuni a breve: la ricerca
        su screening e machine learning dà pochi motivi per crederci. E la parte
        del mestiere che consiste nel capire che il "tutto bene" di un atleta
        non vuol dire tutto bene non sparirà.
      </p>

      <h2>Provarlo</h2>
      <p>
        OpenAthlete ha un <Link href="/it/features/mcp-server">server MCP</Link>{' '}
        che funziona con Claude, ChatGPT e altri client. Può leggere il contesto
        di un atleta, il calendario, le attività e il carico di allenamento,
        registrare una malattia o un viaggio e pianificare fino a 60 sedute in
        una volta; le sedute compaiono poi nel calendario e arrivano agli
        orologi Garmin, Suunto e COROS. È gratuito, e un allenatore può usarlo
        con tutti gli atleti che segue.
      </p>

      <h2>Fonti</h2>
      <Sources />
    </div>
  );
}
