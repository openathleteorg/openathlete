import Link from 'next/link';

import { articlePrices } from './prices';
import { SOURCES } from './sources';

export function ContentPl() {
  const p = articlePrices('pl');
  return (
    <div>
      <p>
        22 lipca 2026 roku Garmin ogłosił, że kupił TrainingPeaks i TrainHeroic,
        aplikację do treningu siłowego należącą do tej samej spółki matki,
        Peaksware. Warunków transakcji nie ujawniono. Od tego czasu na forach
        trenerskich i w naszej skrzynce wciąż powraca to samo pytanie: czy
        powinienem się przenieść, a jeśli tak, to dokąd?
      </p>
      <p>
        Krótka odpowiedź: nic nie zmusza Cię do przeprowadzki już dziś. Dłuższa
        odpowiedź jest poniżej, z alternatywami wartymi uwagi i ze sposobem na
        zabranie ze sobą historii treningów. Jedną z tych alternatyw,
        OpenAthlete, tworzymy sami, więc czytaj tę część z należytym
        sceptycyzmem. Pozostałe staraliśmy się opisać tak, jak opisaliby je ich
        własni użytkownicy.
      </p>

      <h2>Co się faktycznie zmieniło</h2>
      <p>
        Właściciel. Na razie to wszystko.{' '}
        <a href={SOURCES.garminPress}>Komunikat prasowy Garmina</a> mówi, że
        około 120 osób z TrainingPeaks i TrainHeroic dołącza do Garmina, a
        platformy zostają w Louisville w Kolorado. Nie mówi nic o kontach,
        cenach ani obsłudze urządzeń. Nie ogłoszono zmiany cen Premium ani Coach
        Edition, a konta trenerów działają tak jak w czerwcu. Niektóre media, w
        tym <a href={SOURCES.cyclelytic}>CycleLytic</a>, podały, że Garmin
        zapowiedział, iż kompatybilność z innymi markami zegarków się nie
        zmieni. Nie znaleźliśmy takiego zobowiązania na piśmie od Garmina, ale
        nie widzieliśmy też niczego, co wskazywałoby na coś przeciwnego. Twoi
        sportowcy z COROS, Suunto, Polar i Wahoo nadal się synchronizują.
      </p>
      <p>
        Dlaczego więc trenerzy pytają? Głównie dlatego, że teraz ktoś inny
        wyznacza kierunek rozwoju. TrainingPeaks był cenny jako neutralna
        warstwa między wszystkimi markami zegarków a wszystkimi trenerami. Teraz
        producent zegarków decyduje, nad czym pracują jego inżynierowie. Garmin
        może równie dobrze zachować neutralność, bo to za nią zapłacił. Mimo to,
        gdy w 2020 roku Garmin kupił Firstbeat, zapowiadał, że licencjonowanie
        dla firm zewnętrznych będzie kontynuowane, a{' '}
        <a href={SOURCES.the5krunner}>the5krunner</a>, powołując się na DC
        Rainmakera, zauważa, że nowe umowy z firmami zewnętrznymi od tego czasu
        się nie pojawiły. To niczego nie dowodzi w sprawie TrainingPeaks.
        Wyjaśnia jednak, dlaczego trenerzy z mieszanymi grupami sportowców
        uważnie się przyglądają.
      </p>
      <p>
        Jest też precedens. Today&apos;s Plan należał do Specialized, miał
        wierną bazę trenerów kolarskich i{' '}
        <a href={SOURCES.todaysPlan}>został zamknięty w marcu 2024</a>. Trenerzy
        z wieloletnią historią sportowców na tej platformie mieli kilka miesięcy
        na wyciągnięcie danych. Nikt nie spodziewa się tego samego po znacznie
        większym TrainingPeaks, ale ci, którzy przez to przeszli, mają dziś plan
        wyjścia. A pieniądze były tematem już przed lipcem: w kwietniu 2025 roku
        Premium podrożał ze 124,99&nbsp;$ do 134,99&nbsp;$ rocznie.
      </p>

      <h2>Czy warto się przenieść?</h2>
      <p>
        Dla wielu osób uczciwa odpowiedź brzmi: nie, albo jeszcze nie. Przejdź
        przez poniższe punkty, zanim poświęcisz weekend na migrację.
      </p>

      <h3>Zegarki Twoich sportowców</h3>
      <p>
        Jeśli każdy sportowiec, którego trenujesz, nosi Garmina, przejęcie jest
        dla Ciebie neutralne, a może nawet korzystne. Jeśli jedna trzecia Twojej
        grupy biega z COROS, Suunto lub Polar, to Ty masz coś do obserwowania.
        Zrób dziś listę: jakiej marki używa każdy sportowiec i czy zaplanowane
        treningi docierają na jego zegarek. Przesyłanie treningów to pierwsza
        rzecz, którą stracisz, jeśli któraś integracja kiedyś się pogorszy.
      </p>

      <h3>Ile płacisz</h3>
      <p>
        Ceny katalogowe z dnia {p.checkedOn}: TrainingPeaks Premium kosztuje
        19,95&nbsp;$ miesięcznie lub {p.tpPremiumYear} rocznie. Coach Edition
        zaczyna się od 21,99&nbsp;$ miesięcznie z jednym sportowcem Premium w
        cenie, a każdy kolejny sportowiec Premium kosztuje od 9&nbsp;$ do
        4,50&nbsp;$ miesięcznie, zależnie od wielkości grupy, plus opłata
        startowa 99&nbsp;$, którą znosi kod promocyjny (
        <a href={SOURCES.tpCoachPricing}>ceny dla trenerów TrainingPeaks</a>).
        Zaplanowane treningi synchronizują się z urządzeniami tylko u sportowców
        Premium, więc trener, który płaci Premium za 10 sportowców, wydaje około{' '}
        {p.tpCoach10} rocznie przed podatkiem. Jeśli wolałbyś te pieniądze
        zatrzymać, to powód, by się rozejrzeć, niezależnie od tego, kto jest
        właścicielem firmy.
      </p>

      <h3>Od czego zależysz</h3>
      <p>
        Niektóre rzeczy nie mają gdzie indziej prawdziwego odpowiednika. Jeśli
        sprzedajesz plany na marketplace TrainingPeaks, ta publiczność za Tobą
        nie pójdzie. Jeśli Twoi sportowcy jeżdżą zimą w TrainingPeaks Virtual
        albo uwielbiają natywne aplikacje, weź to pod uwagę. A jeśli Twoi
        sportowcy są zadowoleni i tylko Ty się martwisz, przenoszenie 25 osób z
        powodu hipotetycznego ryzyka może kosztować więcej dobrej woli, niż
        przyniesie. Trenerzy, którzy próbowali, mówią, że klienci często po
        prostu odmawiają.
      </p>

      <h3>Twoje dane</h3>
      <p>
        Cokolwiek zdecydujesz, wyeksportuj swoją historię teraz. Zajmuje to
        jeden wieczór i usuwa większość ryzyka. Jak to zrobić, opisujemy na
        końcu tego artykułu.
      </p>

      <h2>Niezależne alternatywy</h2>
      <p>
        Żadna z nich nie należy do producenta zegarków. Ceny to ceny katalogowe
        dostawców z dnia {p.checkedOn}; sprawdź podlinkowaną stronę, zanim
        zapłacisz.
      </p>

      <h3>intervals.icu</h3>
      <p>
        Darmowy, z poziomem Supporter za 4&nbsp;$ miesięcznie (
        <a href={SOURCES.intervals}>intervals.icu</a>). Dla sportowca, który
        trenuje się sam i lubi dane, to oczywisty pierwszy przystanek: kondycja,
        zmęczenie i forma, krzywe mocy i tempa, kreator treningów, kalendarz i
        jedna z najdłuższych list integracji (Garmin, COROS, Suunto, Polar,
        Wahoo, Zwift i wiele innych). Trenerzy mogą obserwować sportowców i
        planować dla nich; zespoły i organizacje trenerskie potrzebują
        Supportera. Nie ma oficjalnej aplikacji mobilnej (lukę wypełniają
        aplikacje firm zewnętrznych), a wielu użytkowników uważa interfejs na
        początku za przeładowany. Jeśli żyjesz w wykresie Performance Management
        Chart, zacznij tutaj.
      </p>

      <h3>Nolio</h3>
      <p>
        Z Grenoble, partner francuskiej federacji lekkoatletycznej i standard we
        francuskich klubach. Dla sportowców darmowy (Premium 6,90&nbsp;€
        miesięcznie); plany dla trenerów zaczynają się od 19,90&nbsp;€
        miesięcznie za 3 sportowców i 29,90&nbsp;€ za maksymalnie 25, z tańszymi
        planami dla klubów będących zarejestrowanymi stowarzyszeniami (
        <a href={SOURCES.nolio}>ceny Nolio</a>). Natywne aplikacje na iOS i
        Androida, biblioteka filmów z ćwiczeniami siłowymi, komentarze do
        każdego treningu. Dla trenera lub klubu we Francji to najbliższy
        odpowiednik. Gdzie indziej mniej znany, a cena rośnie progowo wraz z
        liczbą sportowców: {p.nolioCoach10} rocznie dla trenera z 10
        sportowcami.
      </p>

      <h3>Final Surge</h3>
      <p>
        Amerykański, popularny wśród trenerów biegowych, szkół średnich i
        uczelni. Sportowcy dostają wszystkie funkcje dla sportowców za darmo;
        trenerzy płacą ryczałtowo 19&nbsp;$ miesięcznie za 1 do 5 sportowców lub
        39&nbsp;$ miesięcznie za maksymalnie 100 (
        <a href={SOURCES.finalSurge}>ceny Final Surge</a>). Natywne aplikacje i
        ustrukturyzowane treningi wysyłane do Garmina i COROS. Atutem jest cena
        ryczałtowa: 40 sportowców kosztuje tyle samo co 10. Słabo obecny w
        Europie i bez funkcji AI, które udałoby się nam znaleźć, co niektórzy
        trenerzy uznają za zaletę.
      </p>

      <h3>Tredict</h3>
      <p>
        Niemiecki, prowadzony przez swojego założyciela, dbający o prywatność i
        najbardziej otwarcie krytyczny wobec transakcji z Garminem (
        <a href={SOURCES.tredictBlog}>ich analiza</a>). Wysyła treningi do
        Garmina, COROS, Suunto, Wahoo, Hammerhead i Zwifta, ma funkcje
        trenerskie i API. Model cenowy jest nietypowy: jednorazowo 49&nbsp;$ za
        dwanaście miesięcy pełnego dostępu, potem darmowy dostęp tylko do
        odczytu, i dwumiesięczny okres próbny (
        <a href={SOURCES.tredictPrice}>cena Tredict</a>). Mały zespół i mała
        społeczność, ale duchem bliski temu, czym TrainingPeaks był kiedyś dla
        wielu osób.
      </p>

      <h3>Runalyze</h3>
      <p>
        Tworzony w Kaiserslautern i Kilonii, ulubieniec biegaczy, którzy chcą
        analiz: efektywny VO2max, prognozy wyników, wskaźnik formy maratońskiej,
        obciążenie treningowe. Synchronizuje dane z Garmina, COROS, Suunto,
        Polar, Wahoo, Stravy i innych. Darmowy, Premium kosztuje 60&nbsp;€
        rocznie (<a href={SOURCES.runalyze}>ceny Runalyze</a>). To raczej
        dziennik treningowy i narzędzie analityczne niż platforma do planowania
        czy trenowania, więc pasuje do biegacza, który trenuje się sam i używał
        TrainingPeaks głównie do patrzenia wstecz, a nie do trenera, który
        planuje dla innych.
      </p>

      <h3>Golden Cheetah</h3>
      <p>
        Darmowe oprogramowanie open source na komputery z systemem Windows,
        macOS i Linux, nastawione przede wszystkim na kolarstwo, z dogłębną
        analizą mocy (<a href={SOURCES.goldenCheetah}>goldencheetah.org</a>).
        Bez chmury, bez współpracy z trenerem, bez wysyłania treningów na
        zegarki. Jest na tej liście, bo nikt nigdy nie może go wyłączyć.
      </p>

      <h3>OpenAthlete</h3>
      <p>
        Nasz projekt, więc oceniaj odpowiednio. Jest open source (AGPL), można
        go za darmo hostować samodzielnie albo korzystać z wersji hostowanej
        przez nas we Francji. W wersji hostowanej wszystko, czego potrzebujesz
        do treningu, jest darmowe, łącznie z trenowaniem do 5 sportowców;
        Supporter, od 5&nbsp;€ miesięcznie lub 50&nbsp;€ rocznie, finansuje
        projekt i dodaje Lab, wcześniejszy dostęp do nowych funkcji,
        zaawansowane narzędzia trenerskie i kluby, nieograniczoną liczbę
        trenowanych sportowców i AI na naszych kluczach (
        <Link href="/pl/pricing">cennik</Link>). Klub zakłada Supporter, a
        członkowie dołączają za darmo, bez limitu sportowców: grupy z ich
        trenerami, wspólna biblioteka, cotygodniowe treningi klubowe i plany
        kopiowane na całą grupę. Zaplanowane treningi trafiają na zegarki
        Garmin, Suunto i COROS; aktywności przychodzą z tych trzech oraz z Polar
        i Stravy. Obciążenie treningowe to TRIMP z tętna z session-RPE obok, a
        kondycja, zmęczenie i forma są prognozowane na podstawie zaplanowanych
        treningów. AI jest opcjonalne i działa na Twoim własnym kluczu albo w
        ramach limitu Supportera.
      </p>
      <p>
        Ograniczenia są realne. Nie ma marketplace do sprzedaży planów, nie ma
        rozliczeń klubowych (dołączenie do klubu jest darmowe, ale składki
        członkowskie obsługuje się poza OpenAthlete), nie ma aplikacji do
        treningu indoor i nie ma wysyłania treningów na zegarki Polar. Analiza
        jest płytsza niż w intervals.icu, a projekt jest młody i tworzy go jeden
        programista. Naszą odpowiedzią na pytanie „a co, jeśli znikniecie?” jest
        licencja: kod i Twoje dane pozostają użyteczne bez nas. Porównanie punkt
        po punkcie znajdziesz na stronie{' '}
        <Link href="/pl/compare/trainingpeaks">
          OpenAthlete vs TrainingPeaks
        </Link>
        , to, jak działa trenowanie, na{' '}
        <Link href="/pl/coaches">stronie dla trenerów</Link>, a pozostałe
        porównania <Link href="/pl/compare">tutaj</Link>.
      </p>

      <h2>Jak się przenieść, nie tracąc historii</h2>

      <h3>Najpierw eksport z TrainingPeaks</h3>
      <p>
        Centrum pomocy TrainingPeaks opisuje w aplikacji webowej funkcję „Export
        Data”: wybierasz okres do 12 miesięcy i dostajesz folder ze wszystkimi
        plikami treningów z tego okresu, a to samo narzędzie potrafi przygotować
        podsumowanie treningów w CSV. Pojedyncze pliki można też pobrać z
        każdego treningu, w formacie, w jakim zostały przesłane (
        <a href={SOURCES.tpExportHelp}>Data Export</a>).{' '}
        <a href={SOURCES.tpExportBlog}>Wpis na blogu TrainingPeaks</a> mówi, że
        eksport zbiorczy jest dla subskrybentów Athlete Edition, a niektórzy
        użytkownicy forów twierdzą, że wymaga Premium, więc sprawdź, co pokazuje
        Twoje konto. Sześć lat historii to sześć eksportów. Zrób to przed
        rezygnacją z subskrypcji, a nie po niej. Nie znaleźliśmy
        udokumentowanego sposobu na zbiorczy eksport biblioteki treningów ani
        przyszłego planu, więc licz się z tym, że szablony, których używasz
        wielokrotnie, będziesz musiał odtworzyć.
      </p>

      <h3>Połącz ponownie konta zegarków</h3>
      <p>
        Większość platform pobiera wcześniejsze aktywności od marki zegarka po
        jej połączeniu, co jest prostsze niż pliki. To, jak daleko wstecz
        sięgniesz, zależy bardziej od API marki niż od platformy. W OpenAthlete
        Strava i COROS dają pełną historię (COROS wysyła 50 plików dziennie,
        więc długa historia dociera przez kilka dni), Garmin i Suunto ostatnie
        30 dni, a Polar nic sprzed połączenia. Inne platformy napotykają podobne
        ograniczenia z tych samych powodów; zapytaj, zanim zaczniesz liczyć na
        pełny import.
      </p>

      <h3>Uzupełnij luki plikami FIT</h3>
      <p>
        To, czego nie zwraca API, jest w Twoim folderze eksportu. Prześlij pliki
        FIT na nową platformę; w OpenAthlete możesz przeciągnąć kilka naraz do
        kalendarza (20&nbsp;MB na plik). Wielosportowe pliki FIT z triathlonu
        nie są jeszcze obsługiwane.
      </p>

      <h3>Korzystaj z obu przez jeden blok</h3>
      <p>
        Jeśli trenujesz innych, zostaw TrainingPeaks na jeszcze jeden blok,
        podczas gdy Twoi sportowcy łączą się z nową platformą, zaplanuj tam
        kolejne cztery tygodnie i zobacz, co nie działa. Przeprowadzka po
        docelowym starcie albo na początku okresu przejściowego jest dużo
        łatwiejsza niż w środku przygotowań do maratonu.
      </p>
      <p>
        A jeśli w tym miesiącu zrobisz tylko jedną rzecz, niech to będzie
        eksport.
      </p>
    </div>
  );
}
