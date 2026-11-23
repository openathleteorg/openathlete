import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentPl() {
  return (
    <div>
      <p>
        FTP (ang. functional threshold power, funkcjonalna moc progowa) to
        najwyższa moc w watach, jaką utrzymasz w mniej więcej stabilnym stanie
        przez około godzinę. Andrew Coggan zdefiniował ją jako praktyczny
        zamiennik progów laboratoryjnych, a książka Huntera Allena i Coggana{' '}
        <em>Training and Racing with a Power Meter</em> uczyniła ją punktem
        odniesienia większości treningu kolarskiego: strefy, treningi i
        wskaźniki obciążenia wyraża się w procentach FTP. Biegowe mierniki mocy
        przeniosły później tę samą ideę do biegania.
      </p>
      <p>
        FTP to liczba z terenu, mierzona miernikiem mocy i ciężkim wysiłkiem, a
        nie fizjologiczna granica wyznaczona w laboratorium. Jej najbliższym
        krewnym w fizjologii wysiłku jest moc krytyczna, którą warto rozumieć
        równolegle, bo obie wartości często wypadają w odległości kilku watów od
        siebie, a mimo to nie są tym samym.
      </p>

      <h2>Jak szacuje się FTP</h2>
      <p>
        Pierwotna definicja to średnia moc z godzinnej jazdy na czas. Mało kto
        chce robić to często, więc typowy test to 20 minut na maksa, zwykle
        poprzedzone mocnym 5-minutowym wysiłkiem, który zdejmuje część rezerwy
        beztlenowej, a wynik pomniejsza się o 5 %:
      </p>
      <Formula
        where={['P20 = średnia moc z 20-minutowego wysiłku na maksa, w watach']}
      >
        FTP ≈ 0,95 × P20
      </Formula>
      <p>
        Współczynnik 0,95 to uśredniona poprawka na to, że przez 20 minut możesz
        cisnąć mocniej niż przez 60. U jednych kolarzy pasuje dobrze, u innych
        słabo, co pokazują ograniczenia poniżej.
      </p>

      <h2>Moc krytyczna</h2>
      <p>
        Moc krytyczna pochodzi od Monoda i Scherrera (1965). Nanieś swoje
        najlepsze wysiłki jako całkowitą pracę w funkcji czasu, a w przedziale
        od około 2 do 20 minut punkty ułożą się na prostej. Jej nachylenie to
        moc krytyczna (CP), a punkt przecięcia, W′ („W prim”), to stały zapas
        pracy, który możesz wykonać powyżej CP, zanim musisz zwolnić:
      </p>
      <Formula
        where={[
          'CP = moc krytyczna, w watach',
          'W′ = zapas pracy powyżej CP, w dżulach',
          't = czas trwania wysiłku, w sekundach',
        ]}
      >
        P(t) = CP + W′ / t
      </Formula>
      <p>
        Fizjologicznie CP wyznacza granicę między domeną ciężką, w której pobór
        tlenu i mleczan we krwi się stabilizują, a domeną bardzo ciężką, w
        której rosną aż do przerwania wysiłku (Poole i wsp., 2016). Powyżej CP
        każda sekunda zużywa trochę W′; poniżej niej W′ powoli się odnawia.
        Odpowiednikiem w bieganiu, z prędkością zamiast mocy, jest{' '}
        <Link href="/pl/learn/critical-speed">prędkość krytyczna</Link>.
      </p>

      <h2>Przykład z liczbami</h2>
      <p>
        Kolarz uzyskuje średnio 262 W w 20-minutowym teście. Jego najlepsze
        wysiłki z ostatnich jazd to 340 W przez 3 minuty, 310 W przez 5, 275 W
        przez 12 i wspomniane 262 W przez 20.
      </p>
      <ul>
        <li>FTP ≈ 0,95 × 262 = 249 W</li>
        <li>
          Dopasowanie pracy do czasu dla czterech wysiłków (61,2, 93,0, 198,0 i
          314,4 kJ) daje CP = 248 W i W′ = 18,0 kJ
        </li>
        <li>
          Przewidywana moc 10-minutowa: 248 + 17&nbsp;965 / 600 = 278 W, zgodna
          z rekordami 5- i 12-minutowymi po obu stronach
        </li>
        <li>
          Atak z mocą 400 W zużywa 400 − 248 = 152 dżule W′ na sekundę, więc
          rezerwa kończy się po 17&nbsp;965 / 152 ≈ 118 sekundach
        </li>
      </ul>
      <p>
        Tutaj FTP i CP zgadzają się co do wata. W grupach to częste, u
        pojedynczych osób zawodne: u 17 wytrenowanych kolarzy Karsten i wsp.
        (2021) znaleźli średnio CP 256 W i FTP 249 W, ale różnica u danego
        zawodnika wahała się od około 19 W w jedną stronę do 33 W w drugą.
      </p>

      <h2>Jak wykorzystać FTP w treningu</h2>
      <p>
        Klasyczne strefy mocy Coggana to procenty FTP. Przy 249 W: wytrzymałość
        (56–75 %) to 139 do 187 W, tempo (76–90 %) 189 do 224 W, próg (91–105 %)
        227 do 261 W, a praca na VO2max (106–120 %) 264 do 299 W. Z tego
        wynikają typowe treningi:
      </p>
      <ul>
        <li>2 × 20 minut na 95–100 % FTP (237 do 249 W), 5 minut luźno</li>
        <li>3 × 12 minut na 100–105 % z 4 minutami przerwy</li>
        <li>
          5 × 4 minuty na 110–120 % (274 do 299 W), przerwa tej samej długości
        </li>
        <li>Długie jazdy wytrzymałościowe od 2 do 4 godzin poniżej 75 %</li>
      </ul>
      <p>
        CP i W′ dodają coś, czego FTP nie daje: mówią, jak długo możesz utrzymać
        się powyżej progu. To przydaje się przy rozkładaniu sił na podjeździe, w
        krótkiej czasówce albo w wyścigu z powtarzanymi przyspieszeniami.
        Powtarzaj test co sześć do ośmiu tygodni albo wcześniej, gdy treningi
        progowe wydają się za łatwe lub niewykonalne.
      </p>
      <p>
        W OpenAthlete FTP dla kolarstwa i biegania to metryka, którą wpisujesz
        lub synchronizujesz; aplikacja nie przeprowadza za Ciebie testu. Kroki
        treningu w{' '}
        <Link href="/pl/features/workout-builder">kreatorze treningów</Link>{' '}
        mogą celować w procent FTP albo mocy krytycznej. Widok Możliwości w
        statystykach wyznacza moc krytyczną z Twoich rekordów mocy na rowerze od
        2 do 20 minut i pokazuje 95-procentowy przedział: te rekordy pochodzą z
        treningów, a nie z testów maksymalnych, więc wynik pokazuje co najwyżej
        to, co one.
      </p>

      <h2>Ograniczenia</h2>
      <p>
        Godzina w definicji jest umowna. Gdy Borszcz i wsp. (2018) poprosili 23
        wytrenowanych kolarzy o jazdę z mocą FTP z testu 20-minutowego do
        wyczerpania, wytrzymali średnio 50,9 minuty, z odchyleniem standardowym
        prawie 16 minut: niektórzy jechali znacznie ponad godzinę, inni
        przerwali po mniej więcej połowie. Kolarze z dużą wydolnością beztlenową
        dostają z testu 20-minutowego zawyżone FTP, typy „diesel” zaniżone.
      </p>
      <p>
        Warunki testu też przesuwają wynik: upał na trenażerze bez
        wystarczającego chłodzenia, błędy w rozłożeniu sił, zmęczenie,
        motywacja. Moc krytyczna ma swoje słabe punkty. Zależy od tego, jakie
        czasy trwania jej podasz, zawodzi poza przedziałem mniej więcej od 2 do
        20 minut, a wysiłki wzięte ze zwykłych jazd rzadko są maksymalne. Żadna
        z tych liczb nie mówi nic o odporności na zmęczenie, czyli ile z tej
        mocy zostaje po trzech godzinach w siodle. Intensywność w ujęciu tętna
        opisuje <Link href="/pl/learn/heart-rate-reserve">rezerwa tętna</Link>,
        a progi laboratoryjne, które FTP próbuje przybliżyć,{' '}
        <Link href="/pl/learn/lactate-threshold">próg mleczanowy</Link>.
      </p>
    </div>
  );
}
