import Link from 'next/link';

import { Sources } from './sources';

export function ContentIt() {
  return (
    <div>
      <p>
        Chiedi a dieci runner perché si sono infortunati e quasi tutti avranno
        una causa pronta: le scarpe nuove, la seduta in pista, la gara con
        troppa discesa, "ho fatto troppo, troppo presto". La ricerca è meno
        netta. Il legame tra carico di allenamento e infortuni esiste, ma è più
        debole, più rumoroso e più individuale di quanto lascino intendere le
        dashboard della maggior parte delle app. Questo articolo raccoglie ciò
        che le prove permettono di dire, e il punto in cui si fermano.
      </p>

      <h2>Quanto spesso si infortunano i runner</h2>
      <p>
        Una revisione sistematica sui corridori di fondo ha trovato tassi
        annuali di infortunio tra il 19% e il 79% a seconda dello studio (van
        Gent et al., 2007). Una forbice così ampia dice tanto su come ogni
        studio definisce un infortunio quanto sulla corsa in sé. Contare per ora
        di corsa è più utile: una meta-analisi successiva indicava circa 18
        infortuni ogni 1.000 ore nei principianti, contro circa 8 nei runner
        amatori abituali (Videbæk et al., 2015). A parità di tempo di corsa, un
        principiante si fa male il doppio delle volte. Primo indizio: conta lo
        scarto tra ciò che fai e ciò a cui il tuo corpo è abituato.
      </p>
      <p>
        Il fattore di rischio più costante tra gli studi non è il chilometraggio
        né il passo. È un infortunio precedente (van der Worp et al., 2015). Se
        hai già avuto problemi all'Achilleo, quel tendine merita più prudenza di
        qualsiasi rapporto su un grafico.
      </p>

      <h2>Carico contro capacità</h2>
      <p>
        Il modo più utile di pensare agli infortuni da sovraccarico viene da
        Bertelsen e colleghi (2017). Un infortunio si verifica quando il carico
        su una struttura precisa, la tibia o la fascia plantare per esempio,
        supera ciò che quella struttura tollera, ripetutamente, per un certo
        periodo. Si muovono due cose: il carico che applichi e la capacità del
        tessuto, che cresce con un allenamento graduale e cala con il sonno
        scarso, un apporto energetico insufficiente, una malattia o un
        infortunio passato.
      </p>
      <p>
        Questo schema mette a nudo il limite di ogni metrica di carico. Il tuo
        orologio misura tempo, distanza e frequenza cardiaca. Alla tua tibia la
        frequenza cardiaca non interessa. Due ore di trail con 1.200 m di
        dislivello negativo e due ore in piano alla stessa frequenza cardiaca
        media danno un TRIMP simile, ma quadricipiti e ginocchia il giorno dopo
        ti diranno che non era la stessa uscita. I numeri del carico descrivono
        abbastanza bene quanto costa una seduta al sistema cardiovascolare. Ciò
        che costa a un tendine o a un osso specifico, solo in modo indiretto.
      </p>

      <h2>Cosa mostrano gli studi sui runner</h2>
      <p>
        Gli studi validi sui runner sono meno di quanto ci si aspetterebbe, e la
        maggior parte segue principianti. Tre vale la pena conoscerli.
      </p>
      <p>
        In una coorte danese di 874 principianti con orologio GPS, chi aumentava
        la distanza settimanale di oltre il 30% in due settimane aveva più
        infortuni "legati alla distanza" (dolore femoro-rotuleo, sindrome della
        bandelletta ileotibiale, periostite tibiale e pochi altri) rispetto a
        chi restava sotto il 10% (Nielsen et al., 2014). Il tasso complessivo di
        infortuni non differiva tra i gruppi, e anche quel risultato specifico
        era al limite della significatività statistica. Gli autori stessi hanno
        definito lo studio esplorativo.
      </p>
      <p>
        In uno studio randomizzato olandese, 532 principianti che preparavano
        una gara di 6,7 km seguivano un piano standard di 8 settimane oppure uno
        più graduale di 13 settimane basato sulla regola del 10%. I tassi di
        infortunio sono stati quasi identici: 20,8% e 20,3% (Buist et al.,
        2008).
      </p>
      <p>
        Nello studio Run Clever, 447 runner amatori hanno fatto progredire per
        16 settimane il volume oppure l'intensità della loro corsa. I
        ricercatori si aspettavano che ciascun approccio producesse un suo tipo
        di infortunio. Non hanno trovato differenze (Ramskov et al., 2018).
      </p>
      <p>
        Mettendo insieme i pezzi: i salti grandi e improvvisi contano
        probabilmente, soprattutto per i principianti. Al di sotto, rifinire il
        ritmo di progressione non ha dimostrato di cambiare granché. Per la
        pratica settimana per settimana, leggi{' '}
        <Link href="/it/blog/injury-prevention-2-when-algorithms-predict-the-break">
          quanto aumentare il chilometraggio
        </Link>
        .
      </p>

      <h2>Il rapporto carico acuto:cronico, e perché è contestato</h2>
      <p>
        Se hai letto qualcosa su carico e infortuni, avrai incontrato l'ACWR
        (acute:chronic workload ratio): il carico dell'ultima settimana diviso
        per il carico settimanale medio delle ultime quattro. È nato da studi
        sui lanciatori veloci del cricket (Hulin et al., 2014) ed è stato reso
        popolare dall'articolo di Tim Gabbett sul "paradosso
        allenamento-prevenzione degli infortuni", che descriveva una zona
        ottimale tra 0,8 e 1,3 e una zona di pericolo sopra 1,5 (Gabbett, 2016).
        In pochi anni quei numeri erano nelle app, nei corsi per allenatori e in
        molti blog, compresa una versione precedente di questo articolo.
      </p>
      <p>Le critiche sono arrivate altrettanto in fretta.</p>
      <ul>
        <li>
          Nel calcolo abituale, l'ultima settimana sta sia al numeratore sia al
          denominatore. Lolli e colleghi (2019) hanno mostrato che questo
          accoppiamento matematico crea da solo una correlazione, anche con dati
          casuali.
        </li>
        <li>
          Impellizzeri e colleghi (2020) hanno osservato che dividere per il
          carico cronico presuppone una relazione tra i due mai verificata, che
          il rapporto cambia se si usano medie mobili o esponenziali, e che le
          soglie provengono da pochi campioni di sport di squadra, poi applicate
          a tutti. Un anno dopo sono andati oltre e hanno raccomandato di
          abbandonare l'ACWR e la teoria che lo sostiene (Impellizzeri et al.,
          2021).
        </li>
        <li>
          La maggior parte degli studi sull'ACWR è osservazionale, negli sport
          di squadra, con pochi infortuni. Una variabile associata agli
          infortuni in un gruppo non predice quale individuo si farà male. Roald
          Bahr lo ha spiegato per i test di screening in generale, e vale anche
          qui (Bahr, 2016).
        </li>
      </ul>
      <p>
        La mia lettura: l'idea di fondo, non fare all'improvviso molto più di
        quanto facevi nelle ultime settimane, è vecchia, sensata e coerente con
        i dati sui runner visti sopra. Le soglie precise non sono dimostrate.
        Considera "1,5" folclore più che fisiologia, e diffida di tutto ciò che
        riduce il tuo allenamento a una percentuale di rischio infortunio.
      </p>

      <h2>Cosa farne in pratica</h2>
      <p>
        Prove incerte non sono un motivo per ignorare il carico. Sono un motivo
        per usarlo per ciò che sa fare: segnalare che questa settimana è molto
        diversa dalle precedenti, e spingerti a chiederti perché.
      </p>
      <p>
        Guarda i cambiamenti che le metriche di carico non vedono. La prima
        seduta di ripetute in pista dopo mesi, una gara con molta discesa,
        scarpe con meno drop, il passaggio dai sentieri all'asfalto: ognuno
        sollecita certi tessuti in modo nuovo anche se il totale settimanale si
        muove appena. Cambia una sola di queste cose alla volta.
      </p>
      <p>
        Prendi sul serio le sensazioni. Una revisione sistematica ha rilevato
        che ciò che gli atleti riferiscono (umore, fatica, indolenzimento)
        rispondeva all'allenamento in modo più affidabile dei comuni marcatori
        oggettivi come la frequenza cardiaca o gli esami del sangue (Saw et al.,
        2016). Annota un dolore il giorno in cui compare, con dove e quanto. Un
        dolore che cambia la tua corsa, che peggiora la mattina dopo o che si
        concentra su un punto preciso di un osso è un motivo per fermarti e
        farti visitare, qualunque cosa dica un grafico.
      </p>
      <p>
        E tieni conto della capacità. Una settimana di sonno pessimo, un virus
        intestinale o un periodo in cui mangi troppo poco riducono ciò che i
        tuoi tessuti sopportano. Lo stesso piano non è lo stesso carico per lo
        stesso runner in ogni mese dell'anno.
      </p>

      <h2>Cosa fa OpenAthlete</h2>
      <p>
        OpenAthlete non predice gli infortuni e non ti assegna un punteggio di
        rischio. Mostra fianco a fianco i numeri che questo articolo ritiene
        utili. Ogni seduta riceve un carico calcolato dalla frequenza cardiaca
        (TRIMP), con il carico da RPE di seduta accanto. Forma, fatica e
        freschezza sono tracciate sul tuo storico e proiettate sulle sedute
        pianificate, e ogni settimana mostra il suo carico rispetto a un
        intervallo costruito sulle tue ultime settimane: un'indicazione, non un
        limite di sicurezza. Dopo un'attività, alcune domande facoltative
        registrano lo sforzo percepito e gli eventuali dolori che citi; quei
        dolori finiscono in un registro degli infortuni che il tuo allenatore
        vede. Dettagli e formule sono nella{' '}
        <Link href="/it/features/training-load">
          pagina sul carico di allenamento
        </Link>
        .
      </p>

      <h2>Fonti</h2>
      <Sources />
    </div>
  );
}
