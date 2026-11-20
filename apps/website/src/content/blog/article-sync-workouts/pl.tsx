import { DISCORD_URL } from '@/config';
import Link from 'next/link';

export function ContentPl() {
  return (
    <div>
      <p>
        Ustrukturyzowany trening na zegarku robi trzy przydatne rzeczy: mówi Ci,
        kiedy zaczyna się i kończy każdy odcinek, pokazuje, czy jesteś w
        zakresie docelowym, i liczy powtórzenia, żebyś nie musiał tego robić
        sam. Przy treningu takim jak 15&nbsp;min spokojnie, 5 × 4&nbsp;min na
        progu z 2&nbsp;min truchtu w przerwach, 10&nbsp;min spokojnie, to
        różnica między bieganiem treningu a liczeniem w głowie w trakcie biegu.
      </p>
      <p>
        To, jak trening trafia z planu na nadgarstek, zależy od marki. Ten
        poradnik omawia trzy marki, które przyjmują treningi z innych aplikacji
        (Garmin, COROS i Suunto), wyjaśnia, co zrobić z zegarkiem Polar, i
        kończy się listą kontrolną na dzień, w którym trening się nie pojawi.
      </p>

      <h2>Które zegarki mogą odbierać treningi</h2>
      <p>
        Każda marka pozwala stworzyć trening w swojej własnej aplikacji. Mniej
        marek pozwala, by wysłała go zewnętrzna platforma.
      </p>
      <ul>
        <li>
          <strong>Garmin</strong> przyjmuje treningi od zatwierdzonych
          partnerów. Trafiają do Twojego kalendarza Garmin Connect i na zegarek
          przy następnej synchronizacji.
        </li>
        <li>
          <strong>Suunto</strong> przyjmuje je jako przewodniki: „Guide” to
          nazwa, jaką Suunto nadaje ustrukturyzowanemu treningowi, który
          wybierasz przy rozpoczynaniu ćwiczenia.
        </li>
        <li>
          <strong>COROS</strong> przyjmuje ustrukturyzowane treningi biegowe,
          trailowe i rowerowe, które pojawiają się w kalendarzu aplikacji COROS,
          a potem na zegarku.
        </li>
        <li>
          Publiczne API <strong>Polar</strong> pozwala aplikacjom odczytywać
          Twoje aktywności i sen, ale niczego nie zapisywać na Twoim koncie.
          Dlatego OpenAthlete nie może wysyłać tam treningów. W Polar Flow wciąż
          możesz jednak tworzyć treningi ręcznie.
        </li>
        <li>
          <strong>Strava</strong> w ogóle nie zna ustrukturyzowanych treningów,
          więc nie ma dokąd ich wysłać.
        </li>
      </ul>

      <h2>Co sprawia, że trening jest „ustrukturyzowany”</h2>
      <p>
        Zegarek może Cię prowadzić tylko przez odcinki. Każdy odcinek potrzebuje
        długości (czasu lub dystansu) i najlepiej celu: zakresu tempa, zakresu
        tętna lub zakresu mocy. Powtórzenia grupują odcinki, więc „5 ×
        (4&nbsp;min w tempie 4:10–4:20/km, 2&nbsp;min spokojnie)” to blok
        powtórzeń złożony z dwóch odcinków.
      </p>
      <p>
        Trening opisany tylko jako „60 minut spokojnie”, bez odcinków, niczego
        nie wysyła: zegarek nie ma przez co Cię prowadzić. Jeśli chcesz mieć go
        na zegarku, zrób z niego jeden 60-minutowy odcinek z górnym limitem
        tętna.
      </p>
      <p>
        Cele podane jako strefy zasługują na uwagę. Twoje strefy na platformie
        treningowej i strefy na zegarku rzadko są takie same. Gdy odcinek ma za
        cel jedną z Twoich stref, OpenAthlete wysyła rzeczywiste wartości (np.
        148–158&nbsp;bpm albo 4:35–4:45/km) zamiast „strefa 3”, dzięki czemu cel
        na nadgarstku zgadza się z planem bez względu na to, jakie strefy
        zegarek ma dla Ciebie zapisane. To samo dotyczy procentów tętna
        maksymalnego lub mocy progowej, o ile te wartości są wpisane w Twoich
        metrykach.
      </p>

      <h2>Garmin</h2>
      <p>
        Gdy Garmin jest połączony, a eksport treningów włączony, każdy
        ustrukturyzowany trening trafia do Twojego kalendarza Garmin Connect.
        Zegarek pobiera go przy następnej synchronizacji z aplikacją na
        telefonie. Na większości aktualnych modeli Forerunner, Fenix i Venu
        trening zaplanowany na dziś zostanie Ci zaproponowany, gdy uruchomisz
        odpowiednią aktywność; w przeciwnym razie znajdziesz go w menu
        treningowym w sekcji treningów albo w kalendarzu treningowym. Nazwy menu
        różnią się w zależności od modelu, więc zajrzyj do instrukcji, jeśli nie
        możesz go znaleźć.
      </p>
      <p>
        Gdy przesuniesz lub zmienisz trening w OpenAthlete, kopia w Garminie też
        się zaktualizuje. Wysyłane są treningi biegowe, rowerowe, pływania na
        basenie, siłowe, cardio, jogi i pilatesu. Przy pływaniu na basenie
        Garmin akceptuje jako cel tylko tempo, więc cele tętna na odcinkach
        pływackich znikają. Garmin ogranicza też trening do 100 odcinków łącznie
        z powtórzeniami, co ma znaczenie tylko wtedy, gdy rozpisujesz krok po
        kroku bardzo długie treningi na bieżni.
      </p>
      <p>
        Szczegóły konfiguracji znajdziesz na{' '}
        <Link href="/pl/connect/garmin">stronie połączenia z Garminem</Link>.
      </p>

      <h2>COROS</h2>
      <p>
        Treningi biegowe, trailowe i rowerowe trafiają do COROS. Pojawiają się w
        kalendarzu aplikacji COROS i na zegarku przy synchronizacji. Treningi
        pływackie i siłowe nie są wysyłane.
      </p>
      <p>
        COROS ma osobliwość, którą warto znać przed tygodniem startowym:
        aplikacja nie może tam usunąć zaplanowanego treningu. Gdy przesuniesz
        lub usuniesz trening w OpenAthlete, stary zostaje w kalendarzu COROS
        oznaczony jako odwołany, a usuwasz go w aplikacji COROS. Przy łączeniu
        wybierz region, w którym założyłeś konto COROS (Europa, USA i inne
        regiony albo Chiny kontynentalne); COROS przechowuje każde konto na
        dokładnie jednym serwerze regionalnym.
      </p>
      <p>
        Integracja z COROS jest najnowsza i działa od listopada 2026. Szczegóły
        i znane ograniczenia są na{' '}
        <Link href="/pl/connect/coros">stronie połączenia z COROS</Link>.
      </p>

      <h2>Suunto</h2>
      <p>
        Treningi biegowe, trailowe, rowerowe i pływackie trafiają na Twoje konto
        Suunto jako przewodniki (guides). Na zegarku wybierasz przewodnik przy
        rozpoczynaniu ćwiczenia, tak jak każdy inny przewodnik Suunto. Treningi
        siłowe zostają w OpenAthlete. Konfigurację opisuje{' '}
        <Link href="/pl/connect/suunto">strona połączenia z Suunto</Link>.
      </p>

      <h2>Polar: aktywności trafiają do nas, treningi ręcznie</h2>
      <p>
        Z zegarkiem Polar Twoje aktywności, sen i nocne HRV mogą nadal
        automatycznie trafiać do OpenAthlete. Co do samego treningu masz dwie
        możliwości: utwórz go w Polar Flow jako cel treningowy z fazami i
        zsynchronizuj zegarek albo prowadź go w aplikacji OpenAthlete na
        telefonie. Żadna z nich nie jest tak wygodna jak bezpośrednia
        synchronizacja, i warto o tym wiedzieć przed zakupem zegarka, jeśli
        zależy Ci na ustrukturyzowanych treningach.
      </p>

      <h2>Gdy treningi planuje Twój trener</h2>
      <p>
        Treningi wychodzą przez połączenie sportowca, a nie trenera. Twój trener
        może planować w Twoim kalendarzu bez względu na to, jaki ma zegarek i
        czy w ogóle jakiś ma. Dopóki masz połączony Garmin, COROS lub Suunto z
        włączonym eksportem treningów, jego treningi trafiają na Twój nadgarstek
        tak samo jak te, które planujesz sam. Trener może prowadzić sportowców
        używających wszystkich trzech marek, nie robiąc niczego inaczej dla
        każdej z nich.
      </p>

      <h2>Treningu nie ma na zegarku: lista kontrolna</h2>
      <p>
        Sprawdź punkty po kolei. Pierwsze dwa wyjaśniają większość przypadków.
      </p>
      <ul>
        <li>
          <strong>
            Czy trening przypada w ciągu najbliższych siedmiu dni?
          </strong>{' '}
          OpenAthlete wysyła nadchodzący tydzień, a nie cały plan. Trening za
          trzy tygodnie sam trafi na zegarek, gdy znajdzie się w oknie
          najbliższych siedmiu dni. Minione treningi nie są wysyłane.
        </li>
        <li>
          <strong>Czy zegarek od tego czasu się zsynchronizował?</strong>{' '}
          Trening trafia najpierw do Garmin Connect, aplikacji COROS albo
          aplikacji Suunto. Otwórz aplikację marki na telefonie i pozwól
          zegarkowi się zsynchronizować.
        </li>
        <li>
          <strong>Czy eksport jest włączony?</strong> Sprawdź w Ustawieniach, w
          sekcji Połączenia, czy eksport treningów dla tej marki jest aktywny.
        </li>
        <li>
          <strong>Czy trening ma odcinki?</strong> Sam czas trwania bez odcinków
          niczego nie wysyła.
        </li>
        <li>
          <strong>Czy marka obsługuje tę dyscyplinę?</strong> Trening siłowy nie
          trafia do COROS ani Suunto, a pływacki nie trafia do COROS.
        </li>
        <li>
          <strong>Czy Twój model obsługuje ustrukturyzowane treningi?</strong>{' '}
          Większość aktualnych zegarków biegowych to potrafi, niektóre modele
          podstawowe lub starsze nie.
        </li>
        <li>
          <strong>Tylko COROS:</strong> przesunięty trening może pojawić się dwa
          razy, raz oznaczony jako odwołany. Usuń odwołany w aplikacji COROS.
        </li>
        <li>
          <strong>Nadal nic?</strong> Odłącz markę w Ustawieniach, w sekcji
          Połączenia, i połącz ją ponownie. Potem zapytaj na naszym{' '}
          <a href={DISCORD_URL}>Discordzie</a>, podając datę treningu.
        </li>
      </ul>

      <h2>Ręcznie</h2>
      <p>
        Nie potrzebujesz platformy, żeby przenieść trening na zegarek. Garmin
        Connect, aplikacja COROS i Polar Flow mają edytor treningów: dodajesz
        odcinki, zapisujesz, synchronizujesz. Przy jednym kluczowym treningu w
        tygodniu to dziesięć minut i działa dobrze. Robi się uciążliwie, gdy
        plan często się zmienia, gdy trener rozpisuje treningi dla kilku
        sportowców albo gdy tempa mają podążać za zaktualizowanymi strefami.
        Wtedy warto, by wysyłaniem zajęła się platforma.
      </p>
      <p>
        OpenAthlete w planie darmowym wysyła treningi do Garmina, COROS i Suunto
        oraz importuje aktywności z tych trzech, a także z Polar i Stravy. Na{' '}
        <Link href="/pl/features/watch-sync">
          stronie synchronizacji z zegarkiem
        </Link>{' '}
        znajdziesz pełną tabelę według marek.
      </p>
    </div>
  );
}
