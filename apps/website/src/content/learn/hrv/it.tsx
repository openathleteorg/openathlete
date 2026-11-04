import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentIt() {
  return (
    <div>
      <p>
        Il cuore non batte come un metronomo. A 50 battiti al minuto
        l’intervallo medio tra due battiti è di 1,2 secondi, ma uno può durare
        1.150 ms e il successivo 1.240 ms. La variabilità della frequenza
        cardiaca (HRV) misura questa variazione. Gran parte della variazione
        rapida, battito dopo battito, dipende dal nervo vago, il «freno»
        parasimpatico del cuore: l’HRV è quindi una finestra, stretta e
        rumorosa, su come il sistema nervoso autonomo sta reggendo allenamento,
        sonno, malattie e stress.
      </p>

      <h2>Come si calcola l’HRV</h2>
      <p>
        Esistono decine di indici di HRV (il documento della Task Force del 1996
        li elenca quasi tutti). Atleti e orologi usano soprattutto l’rMSSD, la
        radice quadrata della media dei quadrati delle differenze successive tra
        intervalli RR:
      </p>
      <Formula
        where={[
          'RRi = tempo tra due battiti consecutivi, in millisecondi',
          'N = numero di intervalli della registrazione',
        ]}
      >
        rMSSD = √( Σ (RRi+1 − RRi)² / (N − 1) )
      </Formula>
      <p>
        L’rMSSD riflette bene l’attività vagale e resta affidabile su
        registrazioni brevi: qualche minuto sdraiati al risveglio, oppure le
        fasi di sonno profondo che l’orologio seleziona durante la notte.
        Siccome i valori giornalieri sono asimmetrici (poche notti molto alte
        alzano la media), gli studi sull’allenamento di solito usano il
        logaritmo naturale, ln rMSSD, prima di fare le medie.
      </p>

      <h2>Un esempio con i numeri</h2>
      <p>
        Prendi cinque intervalli RR consecutivi: 1.000, 1.050, 980, 1.020 e 990
        ms.
      </p>
      <ul>
        <li>Differenze successive: +50, −70, +40, −30 ms</li>
        <li>Quadrati: 2.500 + 4.900 + 1.600 + 900 = 9.900</li>
        <li>Media sulle 4 differenze: 9.900 / 4 = 2.475</li>
        <li>rMSSD = √2.475 = 49,7 ms, cioè ln rMSSD = 3,91</li>
      </ul>
      <p>
        Una registrazione vera ha centinaia di intervalli, ma il conto è lo
        stesso. Ora una settimana di letture notturne: 62, 58, 65, 48, 60, 63 e
        59 ms. La media dei logaritmi è 4,08, cioè 59 ms riconvertiti. La notte
        a 48 ms, dopo il lungo della domenica, preoccupa presa da sola e quasi
        non sposta il dato settimanale. Se la settimana dopo segna 52, 49, 55,
        50, 47, 51 e 48 ms, il valore a 7 giorni scende a 3,92 (50 ms). Questo è
        uno spostamento che dura, e merita una domanda.
      </p>

      <h2>Come usarla in allenamento</h2>
      <p>
        Il numero di una sola mattina dice poco. Plews e colleghi (2013) hanno
        mostrato che, in atleti di endurance di alto livello, la media mobile a
        7 giorni dell’ln rMSSD, e quanto oscilla, segue l’adattamento molto
        meglio delle singole letture. Una routine pratica:
      </p>
      <ul>
        <li>
          Misura sempre allo stesso modo: di notte con lo stesso orologio,
          oppure al risveglio, sdraiato, prima del caffè.
        </li>
        <li>
          Costruisci un riferimento su almeno tre o quattro settimane di
          allenamento normale e definisci attorno il tuo intervallo abituale.
        </li>
        <li>
          Leggi la media a 7 giorni rispetto a quell’intervallo, insieme a
          frequenza a riposo, sonno e sensazioni nelle sedute.
        </li>
      </ul>
      <p>
        Kiviniemi e colleghi (2007) sono andati oltre: un gruppo di uomini
        mediamente allenati faceva le sedute dure solo nei giorni in cui l’HRV
        non era calata, e corsa facile negli altri. Hanno migliorato la velocità
        massima di corsa più di un gruppo con un piano fisso. L’idea è utile, ma
        è uno studio su gruppi piccoli, non una regola. Per la maggior parte
        degli atleti l’HRV serve soprattutto a guardare meglio una settimana: se
        la media a 7 giorni è sotto il tuo intervallo da una settimana, la
        frequenza a riposo è salita e il 5 × 4' a soglia è sembrato una gara,
        fai il giorno facile.
      </p>
      <p>
        OpenAthlete importa l’HRV notturna da Garmin, Polar, Suunto e COROS
        (puoi anche inserirla a mano), mostra il valore della notte nella riga
        benessere di ogni giorno del calendario e traccia la media mobile a 7
        giorni dell’ln rMSSD nelle statistiche di recupero. Mostra la tendenza;
        non la trasforma in un punteggio di prontezza.
      </p>

      <h2>Limiti</h2>
      <p>
        I valori assoluti sono personali: tra persone sane e allenate vanno da
        meno di 30 a oltre 100 ms, quindi confrontarsi con un compagno di
        allenamento non ha senso. Anche i dispositivi differiscono: alcuni danno
        l’rMSSD di tutta la notte, altri quello di una finestra di 5 minuti,
        altri un punteggio proprietario; cambiare orologio azzera il
        riferimento. Alcol, cena tardi, caldo, viaggi e ciclo mestruale spostano
        l’HRV senza alcun legame con l’allenamento. E più alto non vuol dire
        sempre meglio: Buchheit (2014) fa notare che negli atleti molto allenati
        l’HRV può smettere di salire, o persino calare, durante un periodo di
        carico pesante mentre si adattano bene, e che un forte aumento può
        accompagnare una fatica profonda. L’HRV è un segnale tra gli altri:
        leggila insieme a{' '}
        <Link href="/it/learn/session-rpe">quanto sono pesate le sedute</Link> e
        alle <Link href="/it/learn/ctl-atl-tsb">tue curve di carico</Link>, mai
        da sola.
      </p>
    </div>
  );
}
