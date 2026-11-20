import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentPl() {
  return (
    <div>
      <p>
        Nanieś na wykres swoje najlepsze wyniki z przedziału od kilku do około
        dwudziestu minut, z dystansem w funkcji czasu, a punkty ułożą się prawie
        na prostej. Jej nachylenie to Twoja prędkość krytyczna (ang. critical
        speed, CS): prędkość, którą dokładasz metr po metrze za każdą dodatkową
        sekundę wysiłku. Prosta nie zaczyna się w zerze. Przecina oś dystansu
        nieco powyżej, w punkcie zwanym D′ (D prim): to stały zapas dystansu,
        który możesz pokonać szybciej niż prędkość krytyczna, zanim musisz
        zwolnić.
      </p>
      <p>
        Pomysł pochodzi od Monoda i Scherrera (1965), którzy opisali go dla
        pracy wykonywanej przez grupę mięśni pod nazwą mocy krytycznej. Przenosi
        się na bieganie, jeśli zamiast mocy wstawić prędkość, a zamiast pracy
        dystans. Fizjologicznie prędkość krytyczna to granica między wysiłkami,
        w których pobór tlenu i mleczan stabilizują się na stałym poziomie, a
        wysiłkami, w których rosną aż do przerwania (Poole i wsp., 2016). Leży
        blisko, a nawet nieco powyżej maksymalnego stanu równowagi mleczanowej,
        który próbuje oszacować{' '}
        <Link href="/pl/learn/lactate-threshold">próg mleczanowy</Link>.
      </p>

      <h2>Jak liczy się prędkość krytyczną</h2>
      <Formula
        where={[
          'd = dystans najlepszego wysiłku (m), t = jego czas trwania (s)',
          'CS = prędkość krytyczna (m/s), D′ = dystans powyżej CS (m)',
          'Powyżej CS: czas do wyczerpania t = D′ / (v − CS)',
        ]}
      >
        d = D′ + CS × t
      </Formula>
      <p>
        Mając dwa maksymalne wysiłki, wyznaczysz prostą ręcznie. Przy trzech lub
        więcej dopasowujesz ją metodą najmniejszych kwadratów, a rozrzut punktów
        wokół prostej mówi, na ile można ufać nachyleniu. Wysiłki powinny trwać
        mniej więcej od 2 do 20 minut: krótsze opierają się na cechach
        sprinterskich, których model nie opisuje, dłuższe wprowadzają zmęczenie
        i kwestię żywienia.
      </p>

      <h2>Przykład z liczbami</h2>
      <p>
        Biegacz ma cztery świeże rekordy: 1000 m w 3:10 (190 s), 2000 m w 6:55
        (415 s), 3000 m w 10:30 (630 s) i 5000 m w 18:00 (1080 s).
      </p>
      <ul>
        <li>
          Dopasowanie dystansu do czasu daje nachylenie 4,50 m/s: prędkość
          krytyczna to 16,2 km/h, czyli 3:42 na km.
        </li>
        <li>Punkt przecięcia to D′ ≈ 145 m.</li>
        <li>
          Przy czterech punktach 95-procentowy przedział ufności nachylenia
          wynosi ±0,11 m/s, więc prędkość krytyczna leży gdzieś między 3:37 a
          3:48 na km.
        </li>
        <li>
          W tempie 3:20 na km (5,0 m/s) D′ kończy się po 145 / (5,0 − 4,50) ≈
          290 s, czyli po około 1450 m. Model przewiduje 1500 m w mniej więcej
          5:01.
        </li>
      </ul>
      <p>
        Zwróć uwagę, że tempo na 5 km (3:36 na km) jest szybsze od prędkości
        krytycznej. Tak powinno być: każdy bieg na tyle krótki, że kończy się
        przed wyczerpaniem D′, biegnie się powyżej niej.
      </p>

      <h2>Jak wykorzystać ją w treningu</h2>
      <p>
        Prędkość krytyczna dzieli Twoje tempa na dwa światy. Poniżej niej
        zmęczenie narasta powoli, a ograniczeniem są głównie czas i paliwo.
        Powyżej każdy metr ponad linią jest pobierany z D′, a gdy D′ się
        skończy, zwalniasz, cokolwiek podpowiada motywacja.
      </p>
      <ul>
        <li>
          Interwały powyżej CS: 5 × 1000 m w tempie 3:30 na km (4,76 m/s) dla
          biegacza z przykładu. Każdy odcinek to 1000 − 4,50 × 210 ≈ 55 m
          powyżej prędkości krytycznej, około 38 % D′. Przerwy odnawiają część
          zapasu, ale nie całość, dlatego ostatnie powtórzenia są cięższe (Jones
          i Vanhatalo, 2017).
        </li>
        <li>
          Praca tuż poniżej CS: 3 × 10' w tempie 3:48 do 3:52 na km. Ciężko, ale
          stan równowagi się utrzymuje.
        </li>
        <li>
          Rozkład tempa w zawodach: zacznij 5 km szybciej niż CS, a zużyjesz D′
          za wcześnie. Rozłóż go na cały dystans, a skończysz szybciej.
        </li>
      </ul>
      <p>
        Smyth i Muniz-Pumares (2020) pokazali, że prędkość krytyczną da się
        oszacować z surowych danych treningowych amatorów przygotowujących się
        do maratonu, bez osobnych testów, i że wiąże się ona z ich czasami w
        maratonie. Statystyki OpenAthlete robią to samo w widoku Możliwości:
        dopasowują prostą do Twoich najlepszych wysiłków od 2 do 20 minut (co
        najmniej trzech), pokazują 95-procentowy przedział i w ten sam sposób
        liczą moc krytyczną na rowerze. Na{' '}
        <Link href="/pl/features">stronie funkcji</Link> znajdziesz, co jeszcze
        jest liczone z Twojej historii.
      </p>

      <h2>Ograniczenia</h2>
      <p>
        Rekordy z treningów to nie testy maksymalne. Jeśli Twój najlepszy wynik
        na 3000 m padł na spokojniejszym biegu tempowym, dopasowana prędkość
        będzie niższa od rzeczywistej: wynik pokazuje co najwyżej to, co
        pokazują Twoje wysiłki. Wysiłki skupione wokół podobnego czasu trwania
        dają szeroki przedział, a rekord GPS ustanowiony z górki albo z wiatrem
        w plecy podnosi prostą. Model nic też nie mówi o długich startach.
        Prędkość krytyczna to nie tempo, które utrzymasz godzinami, a maraton
        biegnie się wyraźnie poniżej niej, na poziomie zależnym bardziej od
        wytrzymałości i żywienia niż od samej prostej. Do tego łącz ją z
        narzędziami opartymi na wynikach startowych, takimi jak{' '}
        <Link href="/pl/tools/race-predictor">kalkulator czasu na zawody</Link>{' '}
        czy <Link href="/pl/pace-charts">tabele temp</Link>, a krótki koniec
        krzywej zostaw dla <Link href="/pl/learn/vma">VMA</Link>.
      </p>
    </div>
  );
}
