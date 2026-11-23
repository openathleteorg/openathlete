import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentPl() {
  return (
    <div>
      <p>
        Tapering to okres lżejszego treningu przed docelowym startem. Pomysł
        jest stary, a logika prosta: tygodnie ciężkiego treningu sprawiają, że
        masz jednocześnie lepszą kondycję i jesteś bardziej zmęczony, a
        zmęczenie znika szybciej niż kondycja. Zmniejsz na jakiś czas
        obciążenie, a zmęczenie odpłynie, podczas gdy większość kondycji
        zostanie. Jeśli zrobisz to dobrze, staniesz na starcie świeższy niż od
        miesięcy. Jeśli źle, tnąc za mało albo odpoczywając za dużo,
        przyjedziesz albo wciąż zmęczony, albo lekko „przespany”.
      </p>

      <h2>Co mówią badania o taperingu</h2>
      <p>
        Bosquet i współpracownicy (2007) zebrali 27 badań z udziałem zawodników
        w bieganiu, kolarstwie i pływaniu. Najlepiej wypadł tapering trwający
        około dwóch tygodni, w którym objętość treningu stopniowo zmniejsza się
        o 41–60&nbsp;%, a intensywność i liczba jednostek w tygodniu pozostają
        bez zmian. Mujika i Padilla (2003), przeglądając wcześniejszą
        literaturę, doszli do podobnej recepty: utrzymać intensywność, wyraźnie
        zmniejszyć objętość, ograniczyć częstotliwość o nie więcej niż około
        20&nbsp;% i wybierać stopniowe zmniejszanie zamiast nagłego spadku.
        Typowy zysk wydajności ocenili na około 3&nbsp;%, w zakresie od 0,5 do
        6&nbsp;%.
      </p>
      <p>
        W przypadku amatorów maratonu Smyth i Lawlor (2021) przeanalizowali
        dzienniki treningowe ponad 158&nbsp;000 biegaczy. Ścisły tapering, w
        którym objętość spada tydzień po tygodniu, wiązał się z lepszymi czasami
        na mecie niż luźny, a najlepiej wypadał ścisły tapering trzytygodniowy,
        z medianą zysku około pięciu i pół minuty (2,6&nbsp;%) w porównaniu z
        minimalnym. To dane obserwacyjne, więc być może po prostu lepiej
        wytrenowani i bardziej zdyscyplinowani biegacze lepiej robią tapering,
        ale wskazują ten sam kierunek co badania kontrolowane.
      </p>

      <h2>Jak tapering widać w kondycji, zmęczeniu i formie</h2>
      <p>
        <Link href="/pl/learn/ctl-atl-tsb">Model kondycji i zmęczenia</Link>{' '}
        pokazuje ten mechanizm. Kondycja (CTL) to wykładnicza średnia dziennego
        obciążenia ze stałą czasową 42 dni, zmęczenie (ATL) to średnia ze stałą
        7 dni, a forma (TSB) to różnica między nimi:
      </p>
      <Formula
        where={[
          'waga CTL na dzień = 1 − e^(−1/42) ≈ 0,024',
          'waga ATL na dzień = 1 − e^(−1/7) ≈ 0,133',
        ]}
      >
        CTL(dziś) = CTL(wczoraj) + (obciążenie − CTL(wczoraj)) × 0,024
      </Formula>
      <p>
        Ponieważ ATL reaguje mniej więcej pięć i pół raza szybciej niż CTL,
        spadek obciążenia obniża zmęczenie dużo szybciej niż kondycję, a TSB
        rośnie. To cały tapering w jednym zdaniu.
      </p>

      <h2>Przykład z obliczeniami</h2>
      <p>
        Maratończyk ma za sobą trzy tygodnie po około 560{' '}
        <Link href="/pl/learn/trimp">TRIMP</Link> tygodniowo (u tego biegacza to
        mniej więcej 80 km, czyli średnio 80 dziennie), po okresie bazowym na
        poziomie 65 dziennie. Żeby rachunki były czytelne, obciążenie jest
        rozłożone równo w każdym tygodniu.
      </p>
      <ul>
        <li>Początek taperingu: CTL 70,9, ATL 79,3, TSB −8,4.</li>
        <li>
          Dwa tygodnie przed startem objętość spada o 30&nbsp;% (około 56 km, 56
          dziennie). Pod koniec tego tygodnia: CTL 68,6, ATL 64,6, TSB +4,1.
        </li>
        <li>
          W tygodniu startowym objętość spada do 45&nbsp;% szczytu (około 36
          dziennie, mniej więcej 30 km przed dniem zawodów). Dzień przed
          startem: CTL 64,3, ATL 48,1, TSB +16,2.
        </li>
      </ul>
      <p>
        W ciągu dwóch tygodni zmęczenie spadło o 31 punktów, a kondycja o 6,6,
        czyli około 9&nbsp;%. Gdyby ten sam biegacz całkowicie przestał trenować
        na te 13 dni, CTL spadłoby do około 52. Model jest uproszczony, ale
        pokazuje, dlaczego tapering zmniejsza objętość zamiast ją zerować i
        dlaczego jego efekt narasta w ostatnich dniach.
      </p>

      <h2>Jak robić tapering w praktyce</h2>
      <ul>
        <li>
          Maraton: dwa do trzech tygodni. 10 km lub półmaraton: jeden do dwóch
          tygodni. Start typu B: trzy lub cztery lżejsze dni.
        </li>
        <li>
          Zmniejszaj objętość stopniowo: o około 20–30&nbsp;% w pierwszym
          tygodniu trzytygodniowego taperingu, o 40–60&nbsp;% w tygodniu
          startowym. Najpierw skróć długie wybieganie.
        </li>
        <li>
          Zachowaj rytm tygodnia i trochę intensywności. Trening w rodzaju 3 × 2
          km w tempie maratońskim dziesięć dni przed startem, a potem 6 × 1 min
          nieco szybciej niż tempo startowe cztery dni przed, przyzwyczaja nogi
          do prędkości bez dokładania zmęczenia.
        </li>
        <li>
          Śpij, jedz normalnie, a nowe buty, nowe żele i nowe ćwiczenia siłowe
          zostaw na po starcie.
        </li>
      </ul>
      <p>
        W OpenAthlete możesz oznaczyć te tygodnie jako cykl treningowy z fazą
        taperingu, a{' '}
        <Link href="/pl/features/training-load">
          krzywe obciążenia treningowego
        </Link>{' '}
        są prognozowane na podstawie zaplanowanych treningów, więc widzisz, z
        jaką formą staniesz na starcie, zanim wykonasz choć jeden trening
        taperingu.
      </p>

      <h2>Ograniczenia</h2>
      <p>
        Nie ma zweryfikowanej docelowej wartości TSB na dzień startu: liczba
        zależy od sposobu mierzenia obciążenia i od zawodnika, a najlepsze
        tapery w badaniach wyznaczano po wynikach, a nie po krzywej. Tapering
        nie uratuje zbyt krótkiego bloku i w tydzień nie naprawi nagromadzonego
        przeciążenia. Odczucia w czasie taperingu też bywają mylące: ciężkie
        nogi i niepokój są częste i zwykle mijają przed startem. Krzywych używaj
        do planowania, a o formie wnioskuj z tego, jak czujesz się na treningach
        w tempie startowym.
      </p>
    </div>
  );
}
