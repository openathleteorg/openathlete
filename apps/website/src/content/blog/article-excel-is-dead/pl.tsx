import Link from 'next/link';

export function ContentPl() {
  return (
    <div>
      <p>
        Wielu dobrych trenerów prowadzi całą swoją pracę w arkuszu
        kalkulacyjnym. Jedna zakładka na zawodnika, jeden wiersz na dzień, kolor
        dla każdego rodzaju treningu i kolumna na komentarze, którą zawodnik
        wypełnia albo i nie. To nic nie kosztuje, dopasowuje się do każdej
        metody i nikt ci tego nie odbierze. Tytuł tego artykułu jest trochę
        niesprawiedliwy: Excel nie umarł, a dla części trenerów wciąż jest
        właściwym narzędziem.
      </p>
      <p>
        Ma jednak swoją cenę, która rośnie wraz z liczbą zawodników w sposób
        łatwy do przeoczenia. Ten artykuł omawia te koszty, pokazuje, jak
        wycisnąć więcej z arkusza, jeśli przy nim zostajesz, i od kiedy
        dedykowane oprogramowanie zaczyna się opłacać.
      </p>

      <h2>Kiedy arkusz się sprawdza</h2>
      <p>
        Przy trzech do pięciu zawodnikach, których dobrze znasz, którzy trenują
        głównie na wyczucie i odzywają się do ciebie po kluczowych treningach,
        arkusz trudno pobić. W komórce możesz napisać wszystko: „6 × 1 km w
        tempie na 10 km, 90'' truchtu, przerwij po 4, jeśli łydki zaczną
        protestować” to w pełni dobra rozpiska i żadne oprogramowanie nie
        wciśnie cię w swoje słownictwo. Z Google Sheets udostępnianie jest
        proste, historia zostaje tam, gdzie ją zapisałeś, i nie ma żadnej
        subskrypcji.
      </p>

      <h2>Kiedy zaczyna kosztować</h2>
      <p>
        Pierwszy koszt ponosi zawodnik. Trening zapisany w komórce trzeba
        przepisać do Garmin Connect albo aplikacji COROS, żeby pojawił się na
        zegarku, albo zapamiętać go na czas biegu. Większość robi to dla
        kluczowego treningu tygodnia, a resztę odpuszcza. Bieg progowy jest
        wtedy biegany w tempie, które zawodnik pamięta, a nie w tym, które
        zapisałeś.
      </p>
      <p>
        Drugi to droga powrotna. Żeby porównać plan z wykonaniem, ktoś musi
        przepisać bieg ze Stravy albo aplikacji zegarka do arkusza: dystans,
        czas, może średnie tętno. Albo robi to zawodnik, nieregularnie, albo ty,
        w niedzielny wieczór. Tak czy inaczej dostajesz podsumowanie treningu, a
        nie sam trening: widzisz, że 6 × 1 km wyszło średnio po 4:05/km, ale nie
        widzisz, że dwa ostatnie powtórzenia poszły po 4:15 przy rosnącym
        tętnie.
      </p>
      <p>
        Trzeci to zmiany. Zawody przesuwają się o dwa tygodnie, zawodnik choruje
        przez pięć dni, wyjazd w góry zastępuje blok treningów na bieżni. W
        arkuszu przepisujesz wiersze ręcznie, sprawdzasz, czy tygodniowe sumy
        nadal mają sens, i liczysz na to, że zawodnik otworzył najnowszą wersję,
        a nie tę z maila z zeszłego wtorku.
      </p>
      <p>
        Czwarty to obciążenie. Większość trenerów, którzy zostają przy
        arkuszach, śledzi objętość (kilometry, godziny) i niewiele więcej, bo
        wszystko ponad to oznacza formuły i wpisywanie danych. Sama objętość
        wiele ukrywa: 60 km spokojnego biegania i 60 km z dwoma mocnymi
        treningami to nie ten sam tydzień.
      </p>

      <h2>Jeśli zostajesz przy arkuszu, rób to dobrze</h2>
      <p>
        Kilka nawyków rozwiązuje większość tych problemów bez zmiany narzędzia.
      </p>
      <ul>
        <li>
          Używaj jednego udostępnionego arkusza online na zawodnika zamiast
          plików wysyłanych mailem. Wtedy istnieje tylko jedna wersja, a
          zawodnik widzi zmiany, gdy tylko je wprowadzisz.
        </li>
        <li>
          Dodaj dwie kolumny, które zawodnik wypełnia po każdym treningu: czas
          trwania w minutach i wysiłek w skali od 0 do 10. Pomnóż je, a
          otrzymasz session RPE Fostera (Foster i in., 2001), miarę obciążenia,
          która nie wymaga żadnego urządzenia: 50 minut przy RPE 6 to 300.
          Zsumuj to tygodniowo, a zobaczysz, jak buduje się blok albo który
          tydzień był za mocny.
        </li>
        <li>
          Przygotuj szablon dla każdego powtarzającego się treningu („próg 5 ×
          4'”, „długie wybieganie, ostatnie 20' w tempie maratońskim”) i kopiuj
          go, zamiast pisać od nowa. Mniej literówek, a zawodnik uczy się
          słownictwa.
        </li>
        <li>
          Proś o jedną linijkę komentarza na trening, nie o akapit. „Ciężkie
          nogi, lewe ścięgno Achillesa sztywne rano” to dokładnie to, czego
          potrzebujesz, żeby wcześnie wychwycić problem.
        </li>
      </ul>
      <p>
        Dzięki temu arkusz całkiem nieźle radzi sobie z garstką zawodników.
        Nadal jednak nie wyśle treningu na zegarek i nadal zależy od tego, że
        ktoś przepisze liczby, które już gdzieś istnieją.
      </p>

      <h2>Co zmienia oprogramowanie</h2>
      <p>
        Sensem platformy trenerskiej nie są wykresy. Chodzi o to, że dane
        przepływają, a nikt ich nie kopiuje. Piszesz trening raz, z celami
        wziętymi z indywidualnych stref zawodnika; trafia on na jego zegarek; po
        biegu aktywność wraca sama i ląduje obok planu, krok po kroku. Gdy
        zawody się przesuwają, przeciągasz blok na nową datę, a zegarek podąża
        za tym. Obciążenie jest liczone z każdego treningu, niezależnie od tego,
        czy ktoś pamiętał o wypełnieniu kolumny.
      </p>
      <p>
        To też nie jest bez kosztów. Spędzisz wieczór czy dwa na odtworzeniu
        swoich typowych treningów jako szablonów, części zawodników trzeba
        będzie pomóc w podłączeniu zegarka, a ty oddasz trochę swobody pustej
        komórki. Czy to się opłaca, zależy głównie od tego, ilu masz zawodników
        i jak często zmieniają się plany. Z grubsza pytanie robi się poważne
        gdzieś powyżej pięciu zawodników albo wtedy, gdy któryś z nich po raz
        pierwszy zrobi kluczowy trening według nieaktualnej wersji planu.
      </p>

      <h2>Wypróbuj bez płacenia</h2>
      <p>
        OpenAthlete jest darmowy dla trenerów z maksymalnie pięcioma
        zawodnikami, ze wszystkimi funkcjami: kalendarz, kreator treningów,
        treningi wysyłane na zegarki Garmin, Suunto i COROS, aktywności
        importowane z tych marek oraz z Polar i Stravy, a także obciążenie
        treningowe liczone z tętna, z session RPE obok. Powyżej pięciu
        zawodników Supporter, od 50&nbsp;€ rocznie, znosi limit. Możesz przez
        miesiąc używać go równolegle z arkuszem dla jednego czy dwóch
        zawodników, zanim podejmiesz decyzję.{' '}
        <Link href="/pl/coaches">Strona dla trenerów</Link> pokazuje, jak
        wygląda widok trenera.
      </p>

      <h2>Źródło</h2>
      <ul>
        <li>
          Foster C, Florhaug JA, Franklin J, et al. A new approach to monitoring
          exercise training. Journal of Strength and Conditioning Research,
          2001;15(1):109–115.
        </li>
      </ul>
    </div>
  );
}
