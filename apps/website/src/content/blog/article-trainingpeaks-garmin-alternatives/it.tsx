import Link from 'next/link';

import { articlePrices } from './prices';
import { SOURCES } from './sources';

export function ContentIt() {
  const p = articlePrices('it');
  return (
    <div>
      <p>
        Il 22 luglio 2026 Garmin ha annunciato l&apos;acquisizione di
        TrainingPeaks e di TrainHeroic, l&apos;app per l&apos;allenamento di
        forza dello stesso gruppo, Peaksware. Le condizioni non sono state rese
        note. Da allora la stessa domanda torna nei forum degli allenatori e
        nella nostra casella di posta: devo cambiare, e per andare dove?
      </p>
      <p>
        La risposta breve è che oggi niente ti obbliga a cambiare. Quella lunga
        segue, con le alternative che vale la pena provare e il modo di portarti
        dietro lo storico. Una di queste, OpenAthlete, la sviluppiamo noi: leggi
        quella parte con lo scetticismo che merita. Le altre abbiamo cercato di
        descriverle come farebbero i loro utenti.
      </p>

      <h2>Che cosa è cambiato davvero</h2>
      <p>
        Il proprietario. Per ora, nient&apos;altro. Il{' '}
        <a href={SOURCES.garminPress}>comunicato di Garmin</a> dice che circa
        120 persone di TrainingPeaks e TrainHeroic entrano in Garmin e che le
        piattaforme restano a Louisville, in Colorado. Non dice nulla su
        account, prezzi o dispositivi compatibili. Non è stato annunciato alcun
        cambio di prezzo per Premium o Coach Edition, e gli account allenatore
        funzionano come a giugno. Alcune testate, tra cui{' '}
        <a href={SOURCES.cyclelytic}>CycleLytic</a>, hanno riportato che Garmin
        avrebbe garantito che la compatibilità con gli altri marchi non
        cambierà. Non abbiamo trovato questo impegno messo per iscritto da
        Garmin, ma nemmeno nulla che vada nella direzione opposta. I tuoi atleti
        con COROS, Suunto, Polar o Wahoo sincronizzano ancora.
      </p>
      <p>
        Perché allora gli allenatori si fanno la domanda? Soprattutto per chi
        decide adesso la direzione del prodotto. TrainingPeaks valeva in quanto
        strato neutrale tra tutti i marchi di orologi e tutti gli allenatori.
        Ora è un produttore di orologi a decidere su cosa lavorano i suoi
        ingegneri. Garmin potrebbe benissimo mantenerlo neutrale, perché è
        proprio questo che ha comprato. Però, quando acquistò Firstbeat nel
        2020, disse che le licenze a terzi sarebbero continuate, e{' '}
        <a href={SOURCES.the5krunner}>the5krunner</a>, citando DC Rainmaker,
        osserva che da allora nuovi accordi non se ne sono visti. Questo non
        dimostra nulla su TrainingPeaks. Spiega però perché gli allenatori con
        atleti di marchi diversi stanno all&apos;erta.
      </p>
      <p>
        Poi c&apos;è un precedente. Today&apos;s Plan apparteneva a Specialized,
        aveva una base fedele di allenatori di ciclismo e ha{' '}
        <a href={SOURCES.todaysPlan}>chiuso a marzo 2024</a>. Allenatori con
        anni di storico lì dentro hanno avuto pochi mesi per recuperare tutto.
        Nessuno si aspetta lo stesso da TrainingPeaks, che è molto più grande,
        ma chi ci è passato adesso tiene sempre pronto un piano di uscita. E il
        prezzo era un tema già prima di luglio: Premium annuale è passato da
        124,99 USD a 134,99 USD nell&apos;aprile 2025.
      </p>

      <h2>Conviene cambiare?</h2>
      <p>
        Per molti la risposta onesta è no, o non ancora. Passa in rassegna
        questi punti prima di dedicare un weekend alla migrazione.
      </p>

      <h3>Gli orologi dei tuoi atleti</h3>
      <p>
        Se tutti i tuoi atleti usano Garmin, per te l&apos;acquisizione è
        neutra, forse persino positiva. Se un terzo del gruppo usa COROS, Suunto
        o Polar, sei tu quello che deve tenere gli occhi aperti. Fai la lista
        oggi: il marchio di ogni atleta e se gli allenamenti pianificati
        arrivano sul suo orologio. È la prima cosa che perderesti se
        un&apos;integrazione dovesse peggiorare.
      </p>

      <h3>Quanto paghi</h3>
      <p>
        Prezzi di listino al {p.checkedOn}: TrainingPeaks Premium costa 19,95
        USD al mese o {p.tpPremiumYear} all&apos;anno. Coach Edition parte da
        21,99 USD al mese con un atleta Premium incluso, poi da 9 a 4,50 USD al
        mese per ogni atleta Premium in più a seconda della dimensione del
        gruppo, più 99 USD di attivazione che un codice promozionale azzera (
        <a href={SOURCES.tpCoachPricing}>prezzi per allenatori</a>). Gli
        allenamenti arrivano sull&apos;orologio solo per gli atleti Premium: un
        allenatore che paga Premium a 10 atleti spende circa {p.tpCoach10}{' '}
        all&apos;anno tasse escluse. Se preferisci tenerti quei soldi, è un
        motivo per guardarti intorno, chiunque sia il proprietario.
      </p>

      <h3>Da cosa dipendi</h3>
      <p>
        Alcune cose non hanno un vero equivalente. Se vendi piani sul
        marketplace di TrainingPeaks, quel pubblico non ti segue. Se i tuoi
        atleti d&apos;inverno pedalano su TrainingPeaks Virtual o amano le app
        native, mettilo in conto. E se i tuoi atleti sono contenti e
        l&apos;unico preoccupato sei tu, spostare 25 persone per un rischio
        ipotetico può costarti più fiducia di quanta ne guadagni. Gli allenatori
        che ci hanno provato raccontano che spesso gli atleti dicono
        semplicemente di no.
      </p>

      <h3>I tuoi dati</h3>
      <p>
        Qualunque cosa tu decida, esporta il tuo storico adesso. Ti costa una
        serata e toglie quasi tutto il rischio. Come farlo è spiegato in fondo
        all&apos;articolo.
      </p>

      <h2>Le alternative indipendenti</h2>
      <p>
        Nessuna appartiene a un produttore di orologi. I prezzi sono quelli di
        listino al {p.checkedOn}; controlla la pagina indicata prima di pagare.
      </p>

      <h3>intervals.icu</h3>
      <p>
        Gratuito, con un piano Supporter da 4 USD al mese (
        <a href={SOURCES.intervals}>intervals.icu</a>). Per chi si allena da
        solo e ama i numeri è la prima tappa: forma, fatica e freschezza, curve
        di potenza e di passo, editor degli allenamenti, calendario e una delle
        liste di integrazioni più lunghe in circolazione (Garmin, COROS, Suunto,
        Polar, Wahoo, Zwift e molte altre). Gli allenatori possono seguire i
        propri atleti e pianificare per loro; team e organizzazioni di coaching
        richiedono Supporter. Non c&apos;è un&apos;app mobile ufficiale (ci
        pensano app di terze parti) e molti trovano l&apos;interfaccia fitta
        all&apos;inizio. Se vivi dentro il grafico di forma e fatica, parti da
        qui.
      </p>

      <h3>Nolio</h3>
      <p>
        Di Grenoble, partner della federazione francese di atletica e scelta
        predefinita nei club francesi. Gli atleti sono gratuiti (Premium a 6,90
        € al mese); i piani allenatore partono da 19,90 € al mese per 3 atleti e
        29,90 € fino a 25, con piani più economici per i club costituiti come
        associazione (<a href={SOURCES.nolio}>prezzi Nolio</a>). App native iOS
        e Android, una libreria di video di esercizi di forza, commenti su ogni
        seduta. Per un allenatore o un club francofono è il sostituto più
        diretto. In Italia è poco diffuso, e il prezzo sale a scaglioni con il
        numero di atleti: {p.nolioCoach10} all&apos;anno per un allenatore con
        10 atleti.
      </p>

      <h3>Final Surge</h3>
      <p>
        Americano, diffuso tra gli allenatori di corsa, le scuole superiori e i
        college. Gli atleti hanno tutte le funzioni gratis; gli allenatori
        pagano una tariffa fissa di 19 USD al mese da 1 a 5 atleti o 39 USD al
        mese fino a 100 (<a href={SOURCES.finalSurge}>prezzi Final Surge</a>).
        App native e allenamenti strutturati inviati a Garmin e COROS. La
        tariffa fissa è il punto forte: 40 atleti costano quanto 10. Poco
        presente in Europa e senza funzioni di IA, per quanto abbiamo visto,
        cosa che qualche allenatore considererà un pregio.
      </p>

      <h3>Tredict</h3>
      <p>
        Tedesco, gestito dal suo fondatore, attento alla privacy e il più
        battagliero sull&apos;acquisizione di Garmin (
        <a href={SOURCES.tredictBlog}>la sua analisi</a>). Invia gli allenamenti
        a Garmin, COROS, Suunto, Wahoo, Hammerhead e Zwift, e ha funzioni per
        allenatori e un&apos;API. Il modello di prezzo è insolito: 49 USD una
        tantum per dodici mesi di accesso completo, poi accesso in sola lettura
        gratuito, e due mesi di prova (
        <a href={SOURCES.tredictPrice}>prezzi Tredict</a>). Squadra piccola e
        comunità piccola, ma vicino nello spirito a ciò che TrainingPeaks è
        stato a lungo per tanti.
      </p>

      <h3>Runalyze</h3>
      <p>
        Nato tra Kaiserslautern e Kiel, è amato dai runner che cercano analisi:
        VO2max effettivo, previsioni di gara, un indice di forma per la
        maratona, carico di allenamento. Si sincronizza con Garmin, COROS,
        Suunto, Polar, Wahoo, Strava e altri. Gratuito, con Premium a 60 €
        all&apos;anno (<a href={SOURCES.runalyze}>prezzi Runalyze</a>). È un
        diario di allenamento e uno strumento di analisi più che una piattaforma
        di pianificazione o di coaching: va bene per il runner che si allena da
        solo e usava TrainingPeaks soprattutto per guardare indietro, non per
        l&apos;allenatore che pianifica per altri.
      </p>

      <h3>Golden Cheetah</h3>
      <p>
        Software desktop libero e gratuito per Windows, macOS e Linux, pensato
        prima di tutto per il ciclismo, con un&apos;analisi della potenza molto
        approfondita (<a href={SOURCES.goldenCheetah}>goldencheetah.org</a>).
        Niente cloud, niente collaborazione con l&apos;allenatore, nessun invio
        di allenamenti all&apos;orologio. Merita un posto qui perché nessuno
        potrà mai spegnerlo.
      </p>

      <h3>OpenAthlete</h3>
      <p>
        Il nostro, quindi giudica di conseguenza. È open source (AGPL), gratis
        da ospitare in proprio, oppure ospitato da noi in Francia. Tutte le
        funzioni sono gratuite nella versione ospitata, compreso il coaching
        fino a 5 atleti; Supporter, a 5 € al mese o 50 € all&apos;anno, aggiunge
        atleti illimitati e IA con le nostre chiavi (
        <Link href="/it/pricing">prezzi</Link>). Le sedute pianificate vanno
        sugli orologi Garmin, Suunto e COROS; le attività arrivano da questi tre
        marchi, da Polar e da Strava. Il carico di allenamento è il TRIMP da
        frequenza cardiaca, con l&apos;RPE di seduta accanto, e forma, fatica e
        freschezza vengono proiettate sulle sedute pianificate. L&apos;IA è
        facoltativa e funziona con la tua chiave o con la quota Supporter.
      </p>
      <p>
        I limiti sono reali. Non ci sono ancora app native negli store: le app
        iOS e Android sono in fase di test e nel frattempo gli atleti usano la
        web app installabile. Non c&apos;è un marketplace per vendere piani, né
        un account club (un atleta può avere più allenatori, ma non esiste
        un&apos;organizzazione con fatturazione comune), né un&apos;app per i
        rulli, né l&apos;invio di allenamenti agli orologi Polar. L&apos;analisi
        è meno profonda di quella di intervals.icu, e il progetto è giovane e
        sviluppato da una sola persona. La nostra risposta a «e se sparite?» è
        la licenza: il codice e i tuoi dati restano utilizzabili senza di noi.
        Il confronto voce per voce è su{' '}
        <Link href="/it/compare/trainingpeaks">
          OpenAthlete vs TrainingPeaks
        </Link>
        , come funziona il coaching sulla{' '}
        <Link href="/it/coaches">pagina per allenatori</Link>, e gli altri
        confronti sono <Link href="/it/compare">qui</Link>.
      </p>

      <h2>Come cambiare senza perdere lo storico</h2>

      <h3>Prima esporta da TrainingPeaks</h3>
      <p>
        Il centro assistenza di TrainingPeaks descrive una funzione Export Data
        nella web app: scegli un periodo di massimo 12 mesi e ottieni una
        cartella con tutti i file degli allenamenti di quel periodo; lo stesso
        strumento produce un riepilogo CSV degli allenamenti. Ogni allenamento
        si può anche scaricare singolarmente, nel formato in cui era stato
        caricato (<a href={SOURCES.tpExportHelp}>Data Export</a>). Un{' '}
        <a href={SOURCES.tpExportBlog}>articolo del blog di TrainingPeaks</a>{' '}
        dice che l&apos;esportazione in blocco è per gli abbonati Athlete
        Edition, e alcuni utenti nei forum riferiscono che serve Premium:
        controlla cosa mostra il tuo account. Sei anni di storico sono sei
        esportazioni. Fallo prima di disdire, non dopo. Non abbiamo trovato un
        modo documentato per esportare in blocco la libreria di allenamenti o il
        piano futuro, quindi metti in conto di ricreare i modelli che usi.
      </p>

      <h3>Ricollega gli account dell&apos;orologio</h3>
      <p>
        Quasi tutte le piattaforme recuperano le attività passate dal marchio
        dell&apos;orologio al momento del collegamento, ed è più comodo dei
        file. Quanto si va indietro dipende dall&apos;API del marchio più che
        dalla piattaforma. Su OpenAthlete, Strava e COROS danno tutto lo storico
        (COROS invia 50 file al giorno, quindi uno storico lungo richiede
        diversi giorni), Garmin e Suunto gli ultimi 30 giorni, Polar nulla di
        precedente al collegamento. Le altre piattaforme incontrano limiti
        simili per gli stessi motivi; chiedi prima di contare su
        un&apos;importazione completa.
      </p>

      <h3>Completa con i file FIT</h3>
      <p>
        Quello che l&apos;API non restituisce lo trovi nella cartella esportata.
        Carica i file FIT sulla nuova piattaforma; su OpenAthlete puoi
        trascinarne diversi insieme sul calendario (20 MB per file). I file FIT
        multisport di un triathlon non sono ancora supportati.
      </p>

      <h3>Usa entrambe per un blocco</h3>
      <p>
        Se alleni altre persone, tieni TrainingPeaks per un altro blocco mentre
        i tuoi atleti si collegano alla nuova piattaforma, pianifica lì le
        quattro settimane successive e guarda cosa non funziona. Cambiare dopo
        la gara obiettivo o all&apos;inizio del periodo di transizione è molto
        più semplice che a metà di una preparazione per la maratona.
      </p>
      <p>E se questo mese fai una cosa sola, fai l&apos;esportazione.</p>
    </div>
  );
}
