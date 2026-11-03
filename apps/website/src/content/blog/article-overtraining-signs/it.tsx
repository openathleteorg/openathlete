import Link from 'next/link';

import { Sources } from './sources';

export function ContentIt() {
  return (
    <div>
      <p>
        La maggior parte dei runner che si dicono sovrallenati non lo è. Sono
        stanchi dopo un blocco duro, che è esattamente lo scopo di un blocco
        duro. Oppure sono in overreaching, mangiano troppo poco, stanno covando
        qualcosa o dormono sei ore a notte per il lavoro. La vera sindrome da
        sovrallenamento è rara, seria e lenta da risolvere. La capacità utile è
        distinguere presto questi stati, perché ciascuno richiede una risposta
        diversa.
      </p>

      <h2>Tre stati, un continuum</h2>
      <p>
        Il riferimento è la dichiarazione di consenso congiunta dello European
        College of Sport Science e dell&apos;American College of Sports Medicine
        (Meeusen et al., 2013). Descrive un continuum, definito non tanto dai
        sintomi quanto dal tempo necessario per riprendersi.
      </p>
      <ul>
        <li>
          <strong>Overreaching funzionale.</strong> Un sovraccarico voluto ti
          lascia la prestazione più bassa per qualche giorno o un paio di
          settimane. Dopo il riposo torni allo stesso livello o un po&apos;
          meglio. Un ritiro, o la settimana più dura di una preparazione per la
          maratona, spesso finisce qui.
        </li>
        <li>
          <strong>Overreaching non funzionale.</strong> Lo stesso calo, ma dura
          da settimane a mesi e non porta alcun rimbalzo, solo tempo perso.
          Anche umore e sonno di solito ne risentono.
        </li>
        <li>
          <strong>Sindrome da sovrallenamento.</strong> La prestazione resta
          bassa per mesi o più, con un insieme di sintomi più ampio. I medici
          possono diagnosticarla solo escludendo tutto il resto.
        </li>
      </ul>
      <p>
        Una conseguenza scomoda: sai quale dei tre hai avuto solo a posteriori.
        Dopo due settimane di calo, overreaching funzionale e non funzionale si
        assomigliano in tutto.
      </p>
      <p>
        Vale la pena cercare l&apos;overreaching funzionale? Uno studio francese
        su triatleti allenati invita alla prudenza. Dopo tre settimane di
        sovraccarico e un tapering, chi era molto affaticato senza aver perso
        prestazione è migliorato di più. Chi era scivolato in overreaching
        funzionale ha guadagnato meno e ha preso più infezioni (Aubry et al.,
        2014). Allenarsi abbastanza duro da sentirlo va bene. Allenarsi finché
        la prestazione cala non ne è una versione migliore.
      </p>

      <h2>I cinque segnali da tenere d&apos;occhio</h2>
      <p>
        Nessuno è una diagnosi da solo, e ognuno può avere una spiegazione
        banale. Conta vederne diversi insieme, per più tempo di quanto
        richiederebbe un recupero normale.
      </p>

      <h3>1. La prestazione cala e una settimana facile non la riporta su</h3>
      <p>
        È il segnale centrale del consenso. In pratica: una seduta a soglia che
        corri di solito a 4:15 al km ora ti chiede tutto a 4:25, oppure nelle
        ripetute la frequenza cardiaca non sale quanto al solito anche se stai
        andando a tutta. Una seduta storta non significa niente. La stessa
        storia dopo quattro o cinque giorni facili merita attenzione.
      </p>

      <h3>2. Le solite sedute sembrano più dure</h3>
      <p>
        Il tuo voto di sforzo sale a parità di passo e frequenza cardiaca. Un
        lento di 8 km che di solito valuteresti 3 su 10 ora sembra un 5. È un
        segnale sottile e precoce. Una revisione sistematica ha rilevato che il
        modo in cui gli atleti valutano fatica, umore e indolenzimento seguiva
        lo stress dell&apos;allenamento meglio dei comuni marcatori oggettivi
        (Saw et al., 2016). Funziona solo se lo annoti dopo ogni seduta, con
        onestà, anche quelle noiose.
      </p>

      <h3>3. Cambia l&apos;umore</h3>
      <p>
        Irritabilità, motivazione piatta, nessuna voglia di uscire per una corsa
        che di solito ti piace. Studi sui nuotatori negli anni Ottanta
        mostravano disturbi dell&apos;umore che crescevano con il carico di
        allenamento e calavano quando il carico scendeva (Morgan et al., 1987).
        Chi ti sta intorno spesso se ne accorge prima di te.
      </p>

      <h3>4. Sonno e valori a riposo si spostano</h3>
      <p>
        Sei esausto ma dormi male, ti svegli alle 4 o ti alzi stanco dopo otto
        ore. Anche frequenza cardiaca a riposo e variabilità della frequenza
        cardiaca (HRV) possono cambiare, ma leggile con cautela. Una singola
        misura al mattino è soprattutto rumore: guarda la media settimanale
        rispetto al tuo valore di riferimento (Plews et al., 2013). E in
        overreaching l&apos;HRV può muoversi in entrambe le direzioni, quindi
        &quot;l&apos;HRV è salita&quot; non è automaticamente una buona notizia.
      </p>

      <h3>5. Gambe pesanti che restano pesanti, e ti ammali spesso</h3>
      <p>
        La fatica normale passa dopo due o tre giorni facili. Questa no. Spesso
        arriva con un raffreddore dopo l&apos;altro, o piccoli fastidi che
        passano da una gamba all&apos;altra. Nello studio sui triatleti citato
        sopra, le infezioni erano molto più frequenti nel gruppo in
        overreaching.
      </p>

      <h2>Escludi i soliti sospetti</h2>
      <p>
        Prima di dare la colpa all&apos;allenamento, pensa a cosa produce lo
        stesso quadro. Un virus che non hai ancora smaltito. Carenza di ferro,
        frequente nei runner di endurance e soprattutto nelle donne. Bassa
        disponibilità energetica, quando mangi troppo poco per quello che
        consumi: il consenso del CIO sul deficit energetico relativo nello sport
        (REDs) elenca tra le conseguenze calo di prestazione, fatica, infezioni
        frequenti e fratture da stress (Mountjoy et al., 2023). Problemi alla
        tiroide. Lo stress di lavoro o famiglia, che il corpo conta come carico
        anche se il diario di allenamento no. Se da più di due o tre settimane
        rendi meno e sei stanco senza un motivo chiaro, vai dal medico e chiedi
        gli esami del sangue.
      </p>

      <h2>Cosa fare in ogni fase</h2>
      <p>
        <strong>Dopo un sovraccarico pianificato,</strong> fai la settimana di
        scarico prevista. Corsa facile, sonno, pasti normali. Se in cinque-dieci
        giorni ti senti di nuovo brillante, eri dove volevi essere.
      </p>
      <p>
        <strong>Se la settimana di scarico non è bastata,</strong> togli ogni
        intensità per altre una o due settimane. Corse brevi e facili o riposo,
        niente ripetute, niente gare. Poi mettiti alla prova con calma, per
        esempio con 3 × 8&apos; a soglia, e confronta passo e frequenza cardiaca
        con quello che facevi prima.
      </p>
      <p>
        <strong>Se sospetti la vera sindrome,</strong> sospendi
        l&apos;allenamento strutturato e consulta un medico dello sport. Il
        recupero si misura in mesi, e tornare troppo presto è il modo più comune
        per allungarlo.
      </p>

      <h2>Come evitarlo</h2>
      <p>
        Pianifica le settimane di scarico prima di averne bisogno, ogni tre o
        quattro settimane. Evita di sommare un grande blocco a un mese pesante
        al lavoro. Varia le giornate: Carl Foster ha descritto come un
        allenamento duro tutti i giorni, con poca differenza tra un giorno e
        l&apos;altro (lo chiamava monotonia), coincidesse con le malattie negli
        atleti che seguiva (Foster, 1998). E dedica trenta secondi ogni mattina
        a valutare sonno, stress, fatica e indolenzimento. È l&apos;indice di
        Hooper (Hooper et al., 1995), e nel giro di qualche settimana dice più
        di qualsiasi singolo numero dell&apos;orologio.
      </p>

      <h2>Cosa mostra OpenAthlete, e cosa no</h2>
      <p>
        OpenAthlete non diagnostica overreaching né sovrallenamento. Raccoglie
        in un unico posto i segnali descritti sopra. Ogni seduta ha un carico
        calcolato dalla frequenza cardiaca (TRIMP) e, se la valuti, un carico da
        RPE di seduta, così vedi lo sforzo percepito salire a parità di lavoro.
        Forma, fatica e freschezza sono tracciate nel tempo. Sonno, HRV e
        frequenza cardiaca a riposo arrivano da Garmin, Polar, Suunto o COROS,
        oppure li inserisci a mano, e l&apos;indice di Hooper compare accanto a
        ogni giorno del calendario. Se attivi le domande facoltative dopo ogni
        attività, sforzo e dolori che citi vengono registrati, e quei dolori
        arrivano al tuo allenatore. Le soglie di freschezza dell&apos;app sono
        convenzioni per descrivere la curva, non una diagnosi. Più dettagli
        nella{' '}
        <Link href="/it/features/training-load">
          pagina sul carico di allenamento
        </Link>
        , e per la pianificazione leggi{' '}
        <Link href="/it/blog/injury-prevention-2-when-algorithms-predict-the-break">
          come aumentare il volume con settimane di scarico
        </Link>
        .
      </p>

      <h2>Fonti</h2>
      <Sources />
    </div>
  );
}
