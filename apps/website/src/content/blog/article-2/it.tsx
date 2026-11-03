import Link from 'next/link';

import { Sources } from './sources';

export function ContentIt() {
  return (
    <div>
      <p>
        Nei software di allenamento, "IA" indica due cose molto diverse, che il
        marketing tende a confondere. Da una parte ci sono modelli statistici
        che lavorano sui numeri: frequenza cardiaca, ritmo, potenza, variabilità
        della frequenza cardiaca, sonno. Stimano qualcosa o cercano di
        prevederlo. Dall'altra ci sono i modelli linguistici, la famiglia di
        ChatGPT, Claude e Mistral, che leggono e scrivono testo. Le prove
        scientifiche sono molto diverse per l'una e per l'altra, quindi conviene
        guardarle separatamente.
      </p>

      <h2>Molto di ciò che si vende come IA è aritmetica</h2>
      <p>
        Le curve di forma, fatica e freschezza (CTL, ATL, TSB) sono medie
        ponderate esponenzialmente del carico giornaliero, eredi del modello
        impulso-risposta di Banister degli anni Settanta. Il TRIMP trasforma
        durata e frequenza cardiaca in un punteggio di carico. L'RPE di seduta è
        ancora più semplice: il metodo di Foster moltiplica la valutazione della
        fatica dell'atleta, su una scala da 0 a 10, per la durata in minuti,
        quindi una corsa di 60 minuti a RPE 6 vale 360 unità. Niente di tutto
        questo è machine learning, ed è un pregio: puoi controllare la formula,
        sai cosa trascura e, quando un numero sembra sbagliato, puoi capire
        perché.
      </p>
      <p>
        La dichiarazione di consenso sul monitoraggio del carico pubblicata da
        Bourdon e colleghi nel 2017 raccomanda proprio questo tipo di strumenti:
        misurare cosa è stato fatto (carico esterno, come distanza e ritmo) e
        quanto è costato all'atleta (carico interno, come frequenza cardiaca e
        RPE), e guardarli insieme nel tempo. È ancora la base di una buona
        pratica, e non serve nessuna rete neurale.
      </p>

      <h2>La previsione è più debole di quanto dicano le pubblicità</h2>
      <p>
        La previsione degli infortuni è il campo in cui le promesse corrono più
        avanti dei dati. La revisione di Roald Bahr uscita nel 2016 sul British
        Journal of Sports Medicine spiega perché i test di screening non possono
        prevedere l'infortunio di un singolo: anche un fattore di rischio forte
        a livello di gruppo lascia una sovrapposizione enorme tra chi si
        infortuna e chi no. Il machine learning non ha ancora cambiato molto il
        quadro. Una revisione sistematica di Van Eetvelde e colleghi (2021) ha
        trovato undici studi sulla previsione degli infortuni sportivi con il
        machine learning, con prestazioni che andavano da poco meglio del lancio
        di una moneta (AUC di 0,52) a buone (0,87), e ha chiesto più lavoro
        sull'interpretazione dei modelli.
      </p>
      <p>
        Il rapporto tra carico acuto e cronico è un buon esempio da tenere a
        mente. Per qualche anno l'idea che un rapporto tra 0,8 e 1,3 fosse una
        "zona ideale" sicura si è diffusa in app e corsi per allenatori.
        Impellizzeri e colleghi hanno mostrato nel 2020 che il rapporto ha
        problemi statistici di fondo e che le prove a favore di quella zona
        ideale non reggono. Aumentare molto il carico da una settimana all'altra
        resta una cattiva idea. Una percentuale di rischio precisa costruita su
        quel rapporto, invece, vale poco.
      </p>
      <p>
        Quindi, quando un'app ti mostra "rischio infortunio: 23%", chiedi come è
        stato validato quel numero, su chi e quante volte ha sbagliato. Se non
        c'è risposta, consideralo una decorazione.
      </p>

      <h2>Dove i modelli sui numeri aiutano: l'HRV, con un riferimento</h2>
      <p>
        La variabilità della frequenza cardiaca è il segnale quotidiano più
        utile che la maggior parte degli atleti può misurare a casa. In un
        piccolo studio di quattro settimane, Kiviniemi e colleghi (2007) hanno
        lasciato decidere all'HRV del mattino la seduta del giorno: intensa se
        l'HRV restava stabile o saliva, facile o riposo se scendeva sotto
        l'intervallo abituale dell'atleta. Quel gruppo ha migliorato la velocità
        massima di corsa più di un gruppo con un piano fisso. Plews e colleghi
        (2013) hanno aggiunto un punto pratico importante: una singola misura
        mattutina è rumorosa, e le medie mobili su circa una settimana,
        confrontate con il riferimento personale dell'atleta, sono molto più
        informative.
      </p>
      <p>
        Nota di cosa si tratta: un riferimento personale e una regola semplice.
        Funziona perché è individuale, non perché il modello sia furbo. E
        richiede una misura disciplinata, ogni mattina nelle stesse condizioni,
        ed è lì che quasi tutti mollano.
      </p>

      <h2>Le sensazioni battono ancora quasi tutti i sensori</h2>
      <p>
        La revisione sistematica di Saw, Main e Gastin (2016) ha confrontato
        misure soggettive (umore, stress percepito, fatica) con misure oggettive
        (marcatori nel sangue, frequenza cardiaca a riposo, risposta cardiaca
        allo sforzo). Le misure soggettive seguivano le variazioni di carico con
        maggiore sensibilità e coerenza. In parole semplici: chiedere all'atleta
        come si sente, e annotarlo ogni volta, è uno dei migliori strumenti di
        monitoraggio disponibili.
      </p>
      <p>
        È qui che i modelli linguistici si rivelano davvero utili, senza
        clamore. Un atleta scrive o dice volentieri "gambe pesanti dal km 8,
        Achille sinistro un po' dolorante sulle scale dopo", ma raramente
        compila cinque cursori. Un modello linguistico può trasformare quella
        frase in un punteggio di fatica e una nota sul dolore (Achille sinistro,
        lieve, dopo la corsa) che l'allenatore può filtrare e seguire. È
        inserimento di dati strutturati, fatto da qualcosa che capisce le frasi
        approssimative.
      </p>

      <h2>Quando un modello linguistico scrive un piano</h2>
      <p>
        Düking e colleghi (2024) hanno chiesto a ChatGPT piani di corsa di sei
        settimane con tre livelli di dettaglio nella richiesta e li hanno fatti
        valutare da allenatori esperti secondo 22 criteri di qualità. Con
        informazioni minime, il piano stava sotto la media in 19 criteri su 22.
        Con informazioni dettagliate (storico, obiettivi, vincoli), in uno solo.
        Gli autori sconsigliano comunque di usare questi piani senza il parere
        di un allenatore esperto. Uno studio di Washif e colleghi (2024) sui
        programmi di forza arriva a una conclusione simile: bozze plausibili da
        rifinire da parte di qualcuno che conosce il mestiere.
      </p>
      <p>
        I modelli linguistici affermano anche cose false con grande
        disinvoltura, un difetto chiamato allucinazione (Ji e colleghi ne fanno
        il punto nel 2023). Nell'allenamento significa un volume settimanale che
        non torna, uno "studio" che non esiste o una corsa di recupero messa
        senza dirlo a ritmo soglia. Sono errori facili da non vedere proprio
        perché il resto del testo si legge bene.
      </p>

      <h2>Cosa significa in pratica</h2>
      <p>
        Usa i modelli linguistici per il lavoro sul testo: scrivere una seduta
        strutturata da una descrizione, riassumere un mese di note, raccogliere
        le sensazioni dopo l'allenamento, spiegare un concetto. Tieni le
        decisioni su carico e intensità su numeri che puoi verificare, con un
        allenatore o la tua esperienza come ultimo filtro. Diffida di qualsiasi
        indice di rischio di cui non vedi la validazione. E se vuoi un'unica
        abitudine chiaramente sostenuta dalla ricerca, annota come ti sei
        sentito in ogni seduta.
      </p>

      <h2>Come OpenAthlete usa l'IA</h2>
      <p>
        In OpenAthlete il carico di allenamento è il TRIMP calcolato dalla
        frequenza cardiaca, con l'RPE di seduta accanto: formule, non una
        scatola nera. L'IA è facoltativa e si occupa del lavoro sul testo
        descritto sopra: una seduta strutturata da una frase, tre o quattro
        domande dopo un'attività che diventano un punteggio di fatica e un
        registro del dolore per l'allenatore, e una breve lettura di ogni
        attività. Non c'è previsione degli infortuni. La{' '}
        <Link href="/it/features/ai-coach">pagina sull'IA</Link> spiega cosa fa
        e quali fornitori puoi usare.
      </p>

      <h2>Fonti</h2>
      <Sources />
    </div>
  );
}
