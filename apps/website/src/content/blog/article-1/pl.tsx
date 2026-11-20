import Link from 'next/link';

export function ContentPl() {
  return (
    <div>
      <p>
        OpenAthlete to platforma treningowa dla sportowców wytrzymałościowych i
        ich trenerów. Ma kalendarz zaplanowanych jednostek, strukturalne
        treningi, które trafiają na Twój zegarek, aktywności, które z niego
        wracają, model obciążenia treningowego i wspólną przestrzeń, w której
        trener i zawodnik pracują nad tym samym planem. Kod jest open source na
        licencji AGPL-3.0. Wersja hostowana jest bezpłatna, a platformę możesz
        też uruchomić na własnym serwerze.
      </p>
      <p>
        Ta strona wyjaśnia, dlaczego OpenAthlete istnieje, co potrafi dziś i, co
        równie przydatne, czego nie potrafi.
      </p>

      <h2>Dlaczego OpenAthlete istnieje</h2>
      <p>
        OpenAthlete tworzy niezależny programista z Grenoble, który biega ultra.
        Nie stoją za nim żadni inwestorzy. Wszystko zaczęło się od znajomej
        rutyny: planowanie sezonu w arkuszu kalkulacyjnym, ręczne przepisywanie
        każdego treningu interwałowego do aplikacji producenta zegarka, a potem
        otwieranie trzeciej aplikacji, żeby sprawdzić, czy jednostka poszła
        zgodnie z planem. Trzy narzędzia i żadne nie wiedziało o pozostałych.
      </p>
      <p>
        Komercyjne platformy, które porządnie rozwiązują ten problem, to dobre
        produkty. Pobierają jednak od trenerów opłaty za każdego zawodnika i
        przechowują lata historii treningowej na swoich serwerach, na swoich
        warunkach. Gdy w marcu 2024 roku zamknięto Today&apos;s Plan, jego
        użytkownicy przekonali się, ile tej historii mogą faktycznie zabrać ze
        sobą. W lipcu 2026 roku Garmin kupił TrainingPeaks, jedną z najbardziej
        znanych platform trenerskich, przez co plany wielu trenerów znalazły się
        w rękach producenta zegarków.
      </p>
      <p>
        Idea OpenAthlete jest taka, że rdzeń platformy treningowej (kalendarz,
        strukturalne treningi, model obciążenia, połączenie z zegarkiem) to
        infrastruktura. A infrastruktura jest lepsza, gdy każdy może ją czytać,
        uruchamiać i utrzymywać przy życiu.
      </p>

      <h2>Co potrafi dziś</h2>
      <p>
        <strong>Planowanie.</strong> Budujesz treningi krok po kroku, na
        przykład 15 minut spokojnie, 5 × 4 minuty na progu z 2 minutami truchtu,
        10 minut spokojnie, a cele pochodzą z Twoich własnych stref, temp albo
        procentów VMA (prędkości maksymalnej tlenowej), FTP lub tętna
        maksymalnego. Jednostki leżą w kalendarzu, w którym przeciągasz je
        myszką, a trener może przesuwać lub kopiować całe tygodnie naraz.
      </p>
      <p>
        <strong>Twój zegarek.</strong> Zaplanowane treningi trafiają na zegarki
        Garmin, Suunto i COROS. Ukończone aktywności przychodzą z Garmina,
        COROS, Suunto, Polara i Stravy albo z pliku FIT, GPX lub TCX. Gdy
        połączysz konto, Strava i COROS przenoszą całą Twoją historię, Garmin i
        Suunto ostatnie 30 dni, a Polar tylko nowe aktywności.
      </p>
      <p>
        <strong>Obciążenie treningowe.</strong> Obciążenie jest liczone metodą
        TRIMP na podstawie tętna, a obok zapisywane jest session RPE. Kondycja,
        zmęczenie i forma (CTL, ATL i TSB) są prognozowane na podstawie
        zaplanowanych jednostek, więc widzisz, co najbliższe trzy tygodnie
        zrobią z Twoją formą, przed startem, a nie po nim. Strona o{' '}
        <Link href="/pl/features/training-load">obciążeniu treningowym</Link>{' '}
        wyjaśnia ten model.
      </p>
      <p>
        <strong>Coaching.</strong> Trener planuje bezpośrednio w kalendarzu
        każdego zawodnika, korzysta z szablonów i widzi, co faktycznie zostało
        zrobione. Zawodnik może mieć więcej niż jednego trenera, jest też czat
        grupowy. Prowadzenie do pięciu zawodników jest bezpłatne. Klub zakłada
        Supporter, a członkowie i trenerzy dołączają bezpłatnie; klub ma grupy z
        ich trenerami, wspólną bibliotekę treningów, cotygodniowe treningi
        klubowe i plany kopiowane na całą grupę, a zawodnicy, których trener
        prowadzi przez klub, nie wliczają się do tego limitu.
      </p>
      <p>
        <strong>AI, jeśli chcesz.</strong> Nic nie działa, dopóki się nie
        zgodzisz, a zgodę możesz w każdej chwili wycofać. Gdy AI jest włączone,
        potrafi napisać strukturalną jednostkę z jednego zdania, zmienić
        jednostkę na podstawie krótkiego polecenia, zadać Ci trzy lub cztery
        pytania po aktywności i zamienić Twoje odpowiedzi w ocenę wysiłku oraz
        notatkę o bólu widoczną dla trenera, krótko skomentować każdą nową
        aktywność i oszacować obciążenie zaplanowanej jednostki. Korzystasz z
        własnego klucza API (OpenAI, Anthropic, Google, Mistral i inni albo
        lokalny model na instancji self-hosted) lub z limitu, który daje plan
        Supporter. W aplikacji nie ma czatu: jeśli chcesz porozmawiać,{' '}
        <Link href="/pl/features/mcp-server">serwer MCP</Link> pozwala Claude
        lub ChatGPT czytać Twój trening i planować jednostki w Twoim kalendarzu.
      </p>

      <h2>Czego nie potrafi</h2>
      <ul>
        <li>
          Treningów nie da się wysłać na zegarki Polar ani do Stravy. Obie służą
          wyłącznie jako źródło aktywności.
        </li>
        <li>
          Nie ma rozliczeń klubowych: dołączenie do klubu jest bezpłatne, a
          składki członkowskie obsługuje się poza OpenAthlete.
        </li>
        <li>
          Nie przewiduje kontuzji. Zapisuje ból, gdy zawodnicy go zgłaszają, i
          pokazuje go trenerowi. To mniej efektowne, ale uczciwsze.
        </li>
        <li>Jednostki są wyłącznie metryczne.</li>
        <li>
          Połączenie z COROS jest nowe, więc licz się z niedociągnięciami i daj
          nam znać, gdy na jakieś trafisz.
        </li>
      </ul>

      <h2>Jak jest finansowany</h2>
      <p>
        Wszystko, czego potrzebujesz do treningu, jest bezpłatne w wersji
        hostowanej. Plan Supporter, od 5 € miesięcznie lub 50 € rocznie,
        finansuje projekt, a w podziękowaniu dodaje Lab, wcześniejszy dostęp do
        nowych funkcji, zaawansowane narzędzia trenerskie i kluby, prowadzenie
        więcej niż pięciu zawodników oraz AI działające na kluczach OpenAthlete,
        w ramach tygodniowego limitu na rozsądne użytkowanie, który odnawia się
        w każdy poniedziałek. Self-hosting jest bezpłatny i bez ograniczeń.
        Szczegóły znajdziesz na{' '}
        <Link href="/pl/pricing">stronie z cennikiem</Link>.
      </p>
      <p>
        Hostowane API i baza danych działają w OVH we Francji, a aplikacja
        webowa jest serwowana przez Vercel. Instancja self-hosted nie wysyła
        niczego do OpenAthlete, a automatyczny test sprawdza to przy każdym
        wydaniu.
      </p>

      <h2>Od czego zacząć</h2>
      <p>
        Jeśli trenujesz sam, połącz zegarek, ustaw swoje strefy (
        <Link href="/pl/tools/heart-rate-zones">kalkulator stref tętna</Link> to
        rozsądny punkt wyjścia, jeśli nigdy ich nie mierzyłeś) i zaplanuj jeden
        tydzień. Jeśli jesteś trenerem, zaproś najpierw jednego zawodnika i
        przejdźcie razem przez pełny tydzień, zanim przeniesiesz wszystkich
        pozostałych.
      </p>
      <p>
        Kod źródłowy jest na{' '}
        <a href="https://github.com/openathleteorg/openathlete">GitHubie</a>.
        Zgłoszenia błędów i propozycje funkcji trafiają tam albo na Discorda. Są
        czytane i w dużej mierze decydują o tym, co powstanie w następnej
        kolejności.
      </p>
    </div>
  );
}
