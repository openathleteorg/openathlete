import Link from 'next/link';

export function ContentPl() {
  return (
    <div>
      <p>
        Wyobraź sobie typowy klub biegowy albo triathlonowy. Bieżnia we wtorek,
        tempo albo podbiegi w czwartek, wspólne długie wybieganie w niedzielę.
        Trzech lub czterech trenerów wolontariuszy, główny trener, który przy
        okazji prowadzi stronę klubu, i od czterdziestu do dwustu członków, od
        debiutantów na 10 km po osoby walczące o maraton poniżej 3 godzin.
        Trening żyje w grupie na WhatsAppie, we wspólnym arkuszu kalkulacyjnym,
        który rozumie jedna osoba, i w pamięci głównego trenera.
      </p>
      <p>
        To działa, dopóki nie przestaje. Właściciel arkusza się wyprowadza.
        Członek z bolącym ścięgnem Achillesa mówi o tym jednemu trenerowi,
        którego nie ma w kolejny wtorek. Grupa na WhatsAppie liczy 140 osób, a
        połowa ją wyciszyła. Samo przeniesienie treningu do sieci niczego z tego
        nie naprawia, ale trochę organizacji już tak.
      </p>

      <h2>Zacznij od tego, kto kogo trenuje</h2>
      <p>
        Zanim wybierzesz jakiekolwiek narzędzie, rozpisz strukturę. Kluby, które
        działają sprawnie, zwykle mają te same kilka elementów, niezależnie od
        oprogramowania:
      </p>
      <ul>
        <li>
          Grupy wyznaczone według obecnego tempa, a nie ambicji. Grupa
          „5:30–6:00/km spokojnie” i grupa „4:45–5:15/km” są jaśniejsze niż
          „średniozaawansowani” i „zaawansowani”, a członkowie mogą się między
          nimi przenosić, nie czując, że to awans albo degradacja.
        </li>
        <li>
          Jeden wskazany z imienia trener na grupę i zastępca na tygodnie, gdy
          go nie ma.
        </li>
        <li>
          Dla członków, którzy chcą indywidualnego planu, jeden główny trener.
          Inni trenerzy mogą pomagać, ale jedna osoba odpowiada za całkowite
          obciążenie.
        </li>
        <li>
          Jedno miejsce, w którym zapisuje się kontuzje i drobne dolegliwości,
          żeby kolejny dyżurny trener o nich wiedział.
        </li>
      </ul>

      <h2>Pisz treningi klubowe raz</h2>
      <p>
        Większość treningów klubowych powtarza się z wariacjami: 6 do 10 × 400 m
        w tempie na 5 km z 200 m truchtu, 3 × 8' na progu, podbiegi po 45".
        Główny trener (albo ktokolwiek to lubi) pisze treningi na dany tydzień
        raz, z celami wyrażonymi jako procent VMA (prędkości maksymalnej
        tlenowej), progu lub tętna maksymalnego każdego członka, a nie jako
        stałe tempa. Wtedy biegacz na 4:00/km i biegacz na 6:00/km robią ten sam
        trening z własną intensywnością, a trenerzy grup dostosowują tylko
        objętość: osiem powtórzeń dla jednej grupy, pięć dla innej.
      </p>
      <p>
        Trzymaj je we wspólnej bibliotece, a nie w czyjejś głowie. W dniu, w
        którym główny trener zrezygnuje, klub zachowa swoje treningi.
      </p>

      <h2>Oddziel ogłoszenia od rozmów o treningu</h2>
      <p>
        Jeden czat grupowy do wszystkiego to miejsce, w którym informacje
        umierają. Podziel go: jeden kanał tylko na ogłoszenia (zmiany miejsca,
        starty, walne zebranie), na którym piszą tylko trenerzy, i rozmowy o
        treningu w poszczególnych grupach. Informacja zwrotna o jednostce
        konkretnej osoby należy do tej jednostki, a nie do czatu z
        sześćdziesięcioma osobami.
      </p>

      <h2>Dane o zdrowiu wymagają ostrożności</h2>
      <p>
        Zgłoszenia bólu i notatki o kontuzjach to dane o zdrowiu, szczególna
        kategoria danych według RODO w UE, a dane o tętnie czy śnie też mogą się
        do niej zaliczać. Członkowie mają prawo wiedzieć, kto je widzi. W
        praktyce: pytaj członków, zanim połączysz dane z ich zegarków, dawaj
        trenerom dostęp tylko do członków, których faktycznie trenują, i ustal,
        kto może widzieć notatki o kontuzjach. W przypadku juniorów zaangażuj
        rodziców.
      </p>

      <h2>Dwa sposoby prowadzenia klubu w OpenAthlete</h2>
      <p>
        OpenAthlete ma przestrzeń klubową. Na naszych serwerach klub zakłada
        Supporter, a członkowie i trenerzy dołączają bezpłatnie, bez limitu
        liczby zawodników, a klub, który woli własny serwer, dostaje te same
        funkcje, instalując tam OpenAthlete.
      </p>
      <p>
        <strong>Przestrzeń klubowa na naszych serwerach.</strong> Trener z
        planem Supporter zakłada klub w Ustawienia &gt; Kluby i nadaje każdemu
        członkowi rolę: właściciel, administrator, trener, asystent lub
        zawodnik. Każdy trener klubu ma dostęp do zawodników klubu, a ci
        zawodnicy nie wliczają się do limitu pięciu zawodników bezpłatnego konta
        trenera. Członkowie dołączają z listy, którą importujesz (wklejonej albo
        jako CSV z klubowego arkusza, razem z grupami), za pomocą kodu
        dołączenia albo przez linki, które wygasają. Każda grupa, według tempa
        lub poziomu, ma własnych trenerów, a biblioteka klubu przechowuje
        treningi i foldery, z których korzysta każdy trener klubu.
      </p>
      <p>
        Żeby zaplanować coś dla grupy, skopiuj jednostkę, dzień albo tydzień do
        wielu zawodników naraz. Każda kopia jest dopasowana do stref i progów
        danego zawodnika, podgląd pokazuje przed potwierdzeniem, czego brakuje
        każdemu zawodnikowi, a jedno cofnięcie wycofuje całość. Cotygodniowe
        treningi klubowe, takie jak wtorkowa bieżnia na stadionie, trafiają do
        kalendarzy grupy z czterotygodniowym wyprzedzeniem: zawodnicy deklarują,
        czy przyjdą, trener widzi liczbę chętnych, a odwołanie jednego terminu
        wysyła wszystkim powiadomienie. Wiadomości trafiają do grupy albo do
        całego klubu, od razu lub o zaplanowanej godzinie, a każda jednostka ma
        własny wątek komentarzy. Pulpit trenera jest zbudowany z myślą o
        dziesiątkach zawodników, z sumami za wybrany okres, alertami, gdy
        wskaźnik taki jak tętno spoczynkowe albo waga przekroczy próg, i panelem
        bocznym stworzonym do przełączania się między trzydziestoma zawodnikami.
      </p>
      <p>
        Zawodnik nadal może mieć kilku trenerów, więc trener biegania i trener
        przygotowania siłowego planują w tym samym kalendarzu. Członkowie mogą
        mieć dowolny zegarek: aktywności przychodzą z Garmina, COROS, Suunto,
        Polara, Stravy albo z plików, a zaplanowane treningi trafiają na zegarki
        Garmin, COROS i Suunto, ale nie Polar. Członkowie mogą też subskrybować
        swoje zaplanowane jednostki w Kalendarzu Google lub Apple. Wciąż brakuje
        rozliczeń klubowych: składki członkowskie obsługuje się poza
        OpenAthlete.
      </p>
      <p>
        <strong>Klub prowadzi własną instancję.</strong> OpenAthlete jest open
        source, więc klub może zainstalować go na małym serwerze i mieć własną
        platformę pod własnym adresem, z tymi samymi funkcjami klubowymi, bez
        limitu zawodników i bez abonamentu. Członkowie mogą logować się przez
        single sign-on z Authentik, Keycloak lub dowolnym dostawcą OpenID
        Connect, a rejestracja może być tylko na zaproszenie albo zamknięta.
        Instancja self-hosted nie wysyła niczego do OpenAthlete. Jedno uczciwe
        zastrzeżenie: synchronizacja z COROS działa od razu, ale Garmin, Suunto,
        Polar i Strava wymagają, by klub zarejestrował się w programie
        deweloperskim każdej marki, a Garmin i Suunto zatwierdzają partnerów
        pojedynczo. Import plików działa zawsze.
      </p>
      <p>
        Dla większości klubów przestrzeń klubowa na naszych serwerach to szybszy
        start. Klub, który chce mieć dane swoich członków na własnym serwerze i
        ma kogoś, kto czuje się pewnie w jego utrzymaniu, może wybrać drugą
        drogę. <Link href="/pl/clubs">Strona dla klubów</Link> przedstawia obie,
        a <Link href="/pl/self-hosting">strona o self-hostingu</Link> opisuje
        instalację. Jeśli Twój klub ma szczególne potrzeby, opowiedzenie nam,
        jak faktycznie trenujecie, to najcenniejsza informacja, jaką możemy
        dostać.
      </p>
    </div>
  );
}
