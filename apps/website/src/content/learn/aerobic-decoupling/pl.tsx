import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentPl() {
  return (
    <div>
      <p>
        Biegnij 90 minut równym, spokojnym tempem, a Twoje tętno rzadko
        pozostanie płaskie. Powoli pełznie w górę: kilka uderzeń w drugiej
        godzinie, więcej, gdy jest gorąco, i jeszcze więcej, jeśli długie
        wybiegania są dla Ciebie nowością. Rozprzężenie aerobowe (ang. aerobic
        decoupling) zamienia ten dryf w liczbę. Porównuje, ile tempa (albo mocy)
        uzyskujesz na jedno uderzenie serca w pierwszej połowie równego wysiłku
        i w drugiej. Spopularyzował je wśród sportowców wytrzymałościowych Joe
        Friel, a TrainingPeaks oznacza je jako Pa:HR dla tempa i Pw:HR dla mocy.
      </p>

      <h2>Jak liczy się rozprzężenie</h2>
      <p>
        Najpierw podziel równą część wysiłku na dwie połowy o tym samym czasie
        trwania. Dla każdej połowy policz współczynnik efektywności (EF, ang.
        efficiency factor): średni output podzielony przez średnie tętno.
        Następnie wyraź spadek między połowami w procentach:
      </p>
      <Formula
        where={[
          'EF = średni output / średnie tętno, dla każdej połowy',
          'Output = prędkość skorygowana o nachylenie w bieganiu, moc w kolarstwie',
        ]}
      >
        Rozprzężenie (%) = (EF1 − EF2) / EF1 × 100
      </Formula>
      <p>
        Wartość dodatnia oznacza, że w drugiej połowie uzyskujesz mniej na jedno
        uderzenie serca: tętno wzrosło przy tym samym tempie albo tempo spadło
        przy tym samym tętnie. Gdy trasa nie jest płaska, prędkość trzeba
        skorygować o nachylenie, inaczej podbieg w drugiej połowie wygląda jak
        zmęczenie. Typowa interpretacja według Friela: poniżej 5 % to stabilny
        wysiłek, od 5 do 10 % widać pewien dryf, powyżej 10 % wysiłek przerósł
        Twoją wytrzymałość tlenową.
      </p>

      <h2>Przykład z liczbami</h2>
      <p>
        Biegacz pokonuje 90 minut na płaskiej pętli w tempie 5:20 na km, czyli
        187,5 metra na minutę.
      </p>
      <ul>
        <li>
          Pierwsze 45 minut: średnio 142 bpm, więc EF1 = 187,5 / 142 = 1,320
        </li>
        <li>
          Ostatnie 45 minut: to samo tempo, średnio 150 bpm, więc EF2 = 187,5 /
          150 = 1,250
        </li>
        <li>Rozprzężenie = (1,320 − 1,250) / 1,320 × 100 = 5,3 %</li>
      </ul>
      <p>
        Nieco ponad 5 %: pewien dryf. Gdyby druga połowa wypadła średnio na 146
        bpm, wynik wyniósłby 2,7 %, czyli spokojnie stabilnie. Na rowerze
        rachunek jest ten sam, tylko z watami: 200 W przy 135 bpm, potem 195 W
        przy 140 bpm daje EF równe 1,48 i 1,39 oraz rozprzężenie 6,0 %. Zwróć
        uwagę, że moc spadła, a tętno wzrosło: obie rzeczy działają na Twoją
        niekorzyść.
      </p>

      <h2>Jak wykorzystać je w treningu</h2>
      <p>
        Rozprzężenie najlepiej sprawdza się jako powtarzalny test wytrzymałości
        tlenowej w okresie budowania bazy. Wybierz równy trening, który będziesz
        powtarzać: spokojne wybieganie na 75 do 120 minut na tej samej płaskiej
        pętli albo jazdę na dolnej granicy strefy wytrzymałościowej. Za każdym
        razem trzymaj intensywność w{' '}
        <Link href="/pl/tools/heart-rate-zones">
          tej samej strefie tętna lub mocy
        </Link>{' '}
        i obserwuj wynik przez kolejne tygodnie.
      </p>
      <ul>
        <li>
          Jeśli 90-minutowy bieg daje ponad 5 %, czas trwania albo tempo
          przekraczają Twoją obecną wytrzymałość. Utrzymaj tempo lub lekko je
          zwolnij i wydłużaj bieg.
        </li>
        <li>
          Gdy wynik stabilnie trzyma się poniżej 5 %, wydłuż bieg albo dodaj na
          końcu równy odcinek w tempie maratońskim i sprawdź, czy wytrzymasz.
        </li>
        <li>
          Przed maratonem lub długim biegiem górskim długie wybieganie z
          odcinkami w tempie maratońskim, które zostaje poniżej 5 %, to
          uspokajający sygnał. Duży dryf to powód, by przemyśleć docelowe tempo
          albo strategię żywieniową.
        </li>
      </ul>
      <p>
        OpenAthlete liczy rozprzężenie i współczynnik efektywności dla każdej
        aktywności biegowej na podstawie prędkości skorygowanej o nachylenie i
        tętna, a dla jazd rowerowych na podstawie mocy. Na stronie aktywności
        możesz suwakiem pominąć rozgrzewkę albo zaznaczyć fragment wysiłku, a
        karta pokazuje obie połowy i status: stabilnie, pewien dryf lub wyraźny
        dryf. Poniżej 20 minut oznacza wysiłek jako zbyt krótki, by ocenić
        wytrzymałość.
      </p>

      <h2>Ograniczenia</h2>
      <p>
        Rozprzężenie ma sens tylko przy równym wysiłku. Interwały, postoje na
        światłach czy bieg zakończony szybkim finiszem psują porównanie.
        Największym zakłócaczem jest upał: Coyle i González-Alonso (2001)
        opisują, jak rosnąca temperatura ciała podbija tętno, podczas gdy
        objętość krwi wyrzucanej przy każdym uderzeniu spada, a odwodnienie
        jeszcze to pogłębia. Rozprzężenie 7 % w upalne popołudnie przy 30 °C i 3
        % w chłodny poranek może opisywać tę samą formę. Optyczne czujniki
        nadgarstkowe, które łapią kadencję zamiast tętna, pas piersiowy z
        suchymi elektrodami czy dryf GPS pod drzewami zniekształcają jedną z
        połów. Wreszcie rozprzężenie nic nie mówi o prędkości: rozprzężenie może
        być zerowe przy tempie, które jest za wolne na Twój cel. Czytaj je razem
        z tempem, <Link href="/pl/learn/trimp">obciążeniem treningowym</Link> i
        warunkami danego dnia.
      </p>
    </div>
  );
}
