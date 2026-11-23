import Link from 'next/link';

export function ContentPl() {
  return (
    <div>
      <p>
        Dwa biegi, ta sama pętla, to samo 5:00/km, to samo średnie tętno 148
        uderzeń na minutę. We wtorek wydawało się, że to 3 na 10. W czwartek, po
        dwóch krótkich nocach i długim dniu w pracy, było to 6. Twój zegarek
        zapisuje je jako identyczne treningi. Twoje ciało nie.
      </p>

      <p>
        Tętno i subiektywna ocena wysiłku (RPE, Rating of Perceived Exertion)
        mierzą obciążenie wewnętrzne: jak ciężka była praca dla Ciebie, w
        odróżnieniu od obciążenia zewnętrznego, czyli samej pracy (dystans,
        tempo, moc). To rozróżnienie pochodzi od Impellizzeriego, Marcory i
        Couttsa, którzy przekonują, że to obciążenie wewnętrzne napędza
        adaptację i że oba rodzaje obciążenia warto śledzić równolegle (
        <a href="https://doi.org/10.1123/ijspp.2018-0935">
          Int J Sports Physiol Perform, 2019
        </a>
        ). Tętno i RPE patrzą na obciążenie wewnętrzne z różnych stron i nie
        zgadzają się na tyle często, że warto tę niezgodność umieć odczytać.
      </p>

      <h2>Co naprawdę mówi Ci tętno</h2>
      <p>
        Tętno to odpowiedź układu krążenia na pracę. Przy równym wysiłku
        trwającym kilka minut lub dłużej dobrze oddaje intensywność, dlatego
        strefy tętna i wskaźniki obciążenia typu TRIMP sprawdzają się w
        większości treningu wytrzymałościowego. Ale tętno reaguje nie tylko na
        intensywność.
      </p>
      <p>
        Jest opóźnione. Na początku 4-minutowego interwału tętno potrzebuje
        minuty lub dwóch, żeby dogonić wysiłek, więc zaniża krótkie powtórzenia
        i o 30-sekundowym podbiegu nie mówi prawie nic użytecznego. Dryfuje.
        Podczas długiego biegu w stałym tempie tętno powoli rośnie, bo spada
        objętość wyrzutowa serca, a jeszcze bardziej w upale lub przy
        odwodnieniu; Coyle i González-Alonso omawiają te mechanizmy (
        <a href="https://pubmed.ncbi.nlm.nih.gov/11337829/">
          Exerc Sport Sci Rev, 2001
        </a>
        ). Zmienia się pod wpływem kofeiny, choroby, wysokości i stresu. A
        liczba na nadgarstku może być po prostu błędna: w porównaniu z EKG
        optyczne czujniki nadgarstkowe były mniej dokładne niż pas piersiowy, a
        dokładność zależała od urządzenia i aktywności (Gillinov i wsp.,{' '}
        <a href="https://pubmed.ncbi.nlm.nih.gov/28709155/">
          Med Sci Sports Exerc, 2017
        </a>
        ).
      </p>

      <h2>Co dodaje RPE</h2>
      <p>
        RPE to podsumowanie wszystkiego naraz, jakie robi Twój mózg: oddech,
        nogi, upał, motywacja, ile uwagi wymagał trening. Metoda session-RPE
        Carla Fostera zamienia je w liczbę obciążenia: oceń cały trening w skali
        Borga 0–10 mniej więcej 30 minut po jego zakończeniu i pomnóż przez czas
        trwania w minutach (Foster i wsp.,{' '}
        <a href="https://pubmed.ncbi.nlm.nih.gov/11708692/">
          J Strength Cond Res, 2001
        </a>
        ). 50-minutowe spokojne wybieganie na 3 daje 150 jednostek umownych;
        70-minutowy trening progowy 5 × 4&apos; na 7 daje 490.
      </p>
      <p>
        Średnio obie metody są zgodne. U młodych piłkarzy obciążenie session-RPE
        korelowało z trzema metodami opartymi na tętnie, z indywidualnymi
        korelacjami od około 0,50 do 0,85 (Impellizzeri i wsp.,{' '}
        <a href="https://pubmed.ncbi.nlm.nih.gov/15179175/">
          Med Sci Sports Exerc, 2004
        </a>
        ). U juniorów w biegach narciarskich tętno i session-RPE dały niemal
        taki sam rozkład intensywności, z mniej więcej trzema czwartymi
        treningów w strefie spokojnej (Seiler i Kjerland,{' '}
        <a href="https://pubmed.ncbi.nlm.nih.gov/16430681/">
          Scand J Med Sci Sports, 2006
        </a>
        ). Korelacje na tym poziomie oznaczają jednak również, że przy
        pojedynczych treningach oba wskaźniki regularnie się rozjeżdżają. I
        właśnie wtedy stają się użyteczne.
      </p>

      <h2>Jak odczytać niezgodność</h2>
      <p>
        <strong>Tętno w normie, RPE wyższe niż zwykle.</strong> Czwartkowy bieg
        z początku artykułu. Układ krążenia wykonał tę samą pracę, ale trening
        kosztował więcej. Słaby sen, zmęczenie psychiczne, nagromadzony trening
        i początek choroby podnoszą RPE, zanim pojawią się w tętnie. Jeden taki
        trening to szum. Trzy w tygodniu, na spokojnych biegach, to powód, żeby
        następny mocny trening zrobić lżej albo go przesunąć.
      </p>
      <p>
        <strong>Tętno wyższe niż zwykle, RPE w normie.</strong> Zwykle winne
        jest otoczenie albo czujnik: upał, wilgotność, podwójne espresso, luźny
        pasek zegarka. Sprawdź warunki, zanim wyciągniesz wnioski o formie.
        Jeśli utrzymuje się także w chłodne dni, a zwłaszcza razem z
        podwyższonym tętnem spoczynkowym, pomyśl o chorobie.
      </p>
      <p>
        <strong>Tętno niższe niż zwykle, RPE wyższe.</strong> Wzorzec, który
        trzeba traktować poważnie, zwłaszcza jeśli na interwałach nie możesz
        podnieść tętna. To jeden z objawów opisanych u przeciążonych sportowców
        w konsensusie ECSS/ACSM dotyczącym przetrenowania (Meeusen i wsp.,{' '}
        <a href="https://pubmed.ncbi.nlm.nih.gov/23247672/">
          Med Sci Sports Exerc, 2013
        </a>
        ), choć ta sama praca jasno stwierdza, że żaden pojedynczy wskaźnik go
        nie diagnozuje. Odpocznij kilka dni i sprawdź, czy oba wskaźniki wrócą
        do normy.
      </p>
      <p>
        <strong>Oba niższe przy tym samym tempie.</strong> Jesteś w coraz
        lepszej formie. Ciesz się tym i oprzyj się pokusie, żeby przyspieszyć
        wszystkie spokojne biegi.
      </p>

      <h2>Kiedy czego używać</h2>
      <p>
        Na spokojnych i długich biegach górny limit tętna to najprostszy sposób,
        żeby spokojne dni pozostały spokojne, pod warunkiem że w ostatniej
        godzinie uwzględnisz dryf. Na interwałach do 5 minut celuj w tempo lub
        moc, a RPE traktuj jako kontrolę; tętno przychodzi za późno, żeby
        sterować powtórzeniem. Na zawodach i długich dniach w górach RPE to
        jedyna miara, która uwzględnia upał, podejście i 40 km, które masz już w
        nogach.
      </p>
      <p>
        Jeśli chodzi o obciążenie, zachowaj oba. TRIMP z tętna daje liczbę,
        która nie zależy od Twojego nastroju; session-RPE wyłapuje treningi, w
        których wszystko inne w Twoim życiu sprawiło, że bieg był trudniejszy.
        Kiedy oba trendy rozchodzą się przez tydzień lub dłużej, coś poza
        treningiem się zmieniło.
      </p>

      <h2>W tym tygodniu</h2>
      <p>
        Po każdym treningu odczekaj pół godziny, zapytaj się „Jak ciężki był ten
        trening jako całość?” i zapisz liczbę od 0 do 10. Obok zanotuj średnie
        tętno. Wybierz jedną spokojną pętlę, którą często biegasz, i na koniec
        tygodnia porównaj pary wartości. Nie potrzebujesz niczego więcej, żeby
        zacząć widzieć, w które dni tętno opowiedziało całą historię, a w które
        nie.
      </p>

      <p>
        OpenAthlete zapisuje oba wskaźniki dla każdej aktywności: TRIMP z tętna
        z danych zegarka oraz, gdy tylko wpiszesz RPE, obciążenie session-RPE
        obok niego. Jeśli włączysz funkcje AI, kilka krótkich pytań po każdej
        aktywności uzupełni RPE i odnotuje ból dla Ciebie lub Twojego trenera.
        To nic nie kosztuje; jak łączone są te liczby, zobaczysz na{' '}
        <Link href="/pl/features/training-load">
          stronie o obciążeniu treningowym
        </Link>
        , albo najpierw ustal swoje strefy za pomocą{' '}
        <Link href="/pl/tools/heart-rate-zones">kalkulatora stref tętna</Link>.
      </p>
    </div>
  );
}
