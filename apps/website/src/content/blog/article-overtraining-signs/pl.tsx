import Link from 'next/link';

import { Sources } from './sources';

export function ContentPl() {
  return (
    <div>
      <p>
        Większość biegaczy, którzy mówią, że są przetrenowani, wcale nie jest.
        Są zmęczeni po ciężkim bloku, co jest właśnie celem ciężkiego bloku.
        Albo są przeciążeni, niedożywieni, łapie ich jakaś infekcja albo przez
        pracę śpią sześć godzin na dobę. Prawdziwy zespół przetrenowania jest
        rzadki, poważny i wolno się z niego wychodzi. Przydatna umiejętność to
        wczesne rozróżnianie tych stanów, bo na każdy z nich trzeba reagować
        inaczej.
      </p>

      <h2>Trzy stany, jedno kontinuum</h2>
      <p>
        Punktem odniesienia jest tu wspólne stanowisko European College of Sport
        Science i American College of Sports Medicine (Meeusen i wsp., 2013).
        Opisuje ono kontinuum, definiowane nie tyle przez objawy, co przez to,
        ile czasu zajmuje powrót do formy.
      </p>
      <ul>
        <li>
          <strong>Funkcjonalne przeciążenie (functional overreaching).</strong>{' '}
          Celowe przeciążenie obniża Twoją formę na kilka dni do dwóch tygodni.
          Po odpoczynku wracasz na ten sam poziom albo trochę wyższy. Tak często
          kończy się obóz treningowy albo najcięższy tydzień przygotowań do
          maratonu.
        </li>
        <li>
          <strong>Niefunkcjonalne przeciążenie.</strong> Ten sam spadek, ale
          trwa od tygodni do miesięcy i nie przynosi żadnego odbicia, tylko
          stracony czas. Zwykle cierpi też nastrój i sen.
        </li>
        <li>
          <strong>Zespół przetrenowania.</strong> Forma pozostaje obniżona przez
          miesiące lub dłużej, przy szerszym zestawie objawów. Lekarze mogą go
          zdiagnozować tylko przez wykluczenie wszystkich innych przyczyn.
        </li>
      </ul>
      <p>
        Jedna niewygodna konsekwencja: który z tych stanów Cię dotknął, wiesz
        dopiero po fakcie. Po dwóch tygodniach dołka funkcjonalne i
        niefunkcjonalne przeciążenie wyglądają tak samo.
      </p>
      <p>
        Czy warto dążyć do funkcjonalnego przeciążenia? Francuskie badanie
        wytrenowanych triathlonistów zaleca ostrożność. Po trzech tygodniach
        przeciążenia i taperingu najbardziej poprawili się zawodnicy, którzy
        byli mocno zmęczeni, ale nie stracili formy. Ci, którzy przeszli w
        funkcjonalne przeciążenie, zyskali mniej i częściej łapali infekcje
        (Aubry i wsp., 2014). Trenować na tyle ciężko, żeby to poczuć, jest w
        porządku. Trenować aż do spadku formy to nie jest lepsza wersja tego
        samego.
      </p>

      <h2>Pięć sygnałów, które warto obserwować</h2>
      <p>
        Żaden z nich sam w sobie nie jest diagnozą i każdy może mieć zwyczajne
        wyjaśnienie. Liczy się kilka naraz, utrzymujących się dłużej, niż
        trwałaby normalna regeneracja.
      </p>

      <h3>1. Forma spada i lżejszy tydzień jej nie przywraca</h3>
      <p>
        To główny sygnał w stanowisku konsensusu. W praktyce wygląda to tak:
        trening progowy, który zwykle biegasz po 4:15 na km, teraz po 4:25
        wymaga od Ciebie wszystkiego, albo na interwałach tętno nie rośnie tak
        wysoko jak zwykle, mimo że dajesz z siebie wszystko. Jeden słaby trening
        nic nie znaczy. Ta sama historia po czterech czy pięciu spokojnych
        dniach jest warta potraktowania poważnie.
      </p>

      <h3>2. Zwykłe treningi wydają się cięższe</h3>
      <p>
        Twoja ocena wysiłku powoli rośnie przy tym samym tempie i tętnie.
        Spokojne 8 km, które normalnie oceniasz na 3 na 10, teraz wydaje się
        piątką. To subtelny sygnał, ale wczesny. Przegląd systematyczny wykazał,
        że to, jak sportowcy sami oceniają swoje zmęczenie, nastrój i bolesność
        mięśni, lepiej odzwierciedlało stres treningowy niż popularne obiektywne
        wskaźniki (Saw i wsp., 2016). Działa to tylko wtedy, gdy zapisujesz to
        uczciwie po każdym treningu, także po tych nudnych.
      </p>

      <h3>3. Zmienia się Twój nastrój</h3>
      <p>
        Drażliwość, brak motywacji, niechęć do wyjścia na bieg, który normalnie
        sprawiałby Ci przyjemność. Badania na pływakach z lat 80. pokazały, że
        zaburzenia nastroju rosły wraz z obciążeniem treningowym i spadały
        ponownie, gdy obciążenie się zmniejszało (Morgan i wsp., 1987). Ludzie
        wokół Ciebie często zauważają to wcześniej niż Ty.
      </p>

      <h3>4. Sen i wskaźniki spoczynkowe się zmieniają</h3>
      <p>
        Jesteś wykończony, a mimo to śpisz źle, budzisz się o 4 rano albo
        czujesz się niewyspany po ośmiu godzinach. Tętno spoczynkowe i zmienność
        rytmu serca (HRV) też mogą się przesunąć, ale odczytuj je ostrożnie.
        Pojedynczy poranny pomiar to głównie szum: patrz na średnią tygodniową
        względem własnej wartości bazowej (Plews i wsp., 2013). A przy
        przeciążeniu HRV może zmieniać się w obu kierunkach, więc „HRV wzrosło”
        nie jest automatycznie dobrą wiadomością.
      </p>

      <h3>5. Ciężkie nogi, które pozostają ciężkie, i ciągłe choroby</h3>
      <p>
        Normalne zmęczenie mija po dwóch, trzech spokojnych dniach. To nie mija.
        Często idzie w parze z jednym przeziębieniem za drugim albo z drobnymi
        dolegliwościami, które wędrują z jednej nogi na drugą. We wspomnianym
        badaniu triathlonistów infekcje były znacznie częstsze w grupie
        przeciążonej.
      </p>

      <h2>Wyklucz typowych podejrzanych</h2>
      <p>
        Zanim zrzucisz winę na trening, zastanów się, co jeszcze daje ten sam
        obraz. Wirus, którego nie udało Ci się do końca pozbyć. Niedobór żelaza,
        częsty u biegaczy długodystansowych, a zwłaszcza u kobiet. Niska
        dostępność energii, czyli jedzenie zbyt mało w stosunku do tego, ile
        spalasz: konsensus MKOl dotyczący względnego niedoboru energii w sporcie
        (RED-S) wymienia wśród jego skutków słabsze wyniki, zmęczenie, częste
        choroby i przeciążeniowe urazy kości (Mountjoy i wsp., 2023). Problemy z
        tarczycą. Stres w pracy lub w rodzinie, który Twoje ciało liczy jako
        obciążenie, nawet jeśli dziennik treningowy tego nie robi. Jeśli od
        ponad dwóch, trzech tygodni masz słabsze wyniki i jesteś zmęczony bez
        wyraźnego powodu, idź do lekarza i poproś o badanie krwi.
      </p>

      <h2>Co robić na każdym etapie</h2>
      <p>
        <strong>Po zaplanowanym przeciążeniu</strong> zrób lżejszy tydzień,
        który miałeś w planie. Spokojne bieganie, sen, normalne posiłki. Jeśli
        po pięciu do dziesięciu dniach znów czujesz świeżość, byłeś tam, gdzie
        miałeś być.
      </p>
      <p>
        <strong>Jeśli lżejszy tydzień nie pomógł,</strong> zrezygnuj z wszelkiej
        intensywności na kolejny tydzień lub dwa. Krótkie spokojne biegi albo
        odpoczynek, bez interwałów, bez zawodów. Potem delikatnie się
        przetestuj, na przykład 3 × 8&apos; na progu, i porównaj tempo i tętno z
        tym, co osiągałeś wcześniej.
      </p>
      <p>
        <strong>Jeśli podejrzewasz prawdziwy zespół przetrenowania,</strong>{' '}
        przerwij ustrukturyzowany trening i idź do lekarza sportowego. Powrót do
        zdrowia liczy się w miesiącach, a zbyt wczesny powrót to najczęstszy
        sposób, żeby go wydłużyć.
      </p>

      <h2>Jak temu zapobiegać</h2>
      <p>
        Planuj lżejsze tygodnie, zanim będą Ci potrzebne, co trzeci lub czwarty
        tydzień. Nie nakładaj dużego bloku na stresujący miesiąc w pracy.
        Różnicuj dni: Carl Foster opisał, jak trening ciężki każdego dnia, z
        niewielką różnicą między dniami (nazwał to monotonią), zbiegał się z
        chorobami u obserwowanych przez niego sportowców (Foster, 1998). I
        poświęć każdego ranka trzydzieści sekund na ocenę snu, stresu, zmęczenia
        i bolesności mięśni. To indeks Hoopera (Hooper i wsp., 1995), który po
        kilku tygodniach mówi więcej niż jakakolwiek pojedyncza liczba z
        zegarka.
      </p>

      <h2>Co pokazuje OpenAthlete, a czego nie</h2>
      <p>
        OpenAthlete nie diagnozuje przeciążenia ani przetrenowania. Zbiera
        powyższe sygnały w jednym miejscu. Każdy trening ma obciążenie z tętna
        (TRIMP) oraz, gdy go ocenisz, session-RPE, więc widzisz, kiedy wysiłek
        rośnie przy tej samej pracy. Kondycja, zmęczenie i forma są pokazywane w
        czasie. Sen, HRV i tętno spoczynkowe trafiają z Garmina, Polara, Suunto
        lub COROS albo wpisujesz je ręcznie, a indeks Hoopera widnieje w
        kalendarzu obok każdego dnia. Jeśli włączysz opcjonalne pytania po
        aktywności, zapisywane są wysiłek i każdy wspomniany ból, a ten ból
        widzi też Twój trener. Progi formy w aplikacji to konwencje opisujące
        krzywą, a nie diagnoza. Więcej na{' '}
        <Link href="/pl/features/training-load">
          stronie o obciążeniu treningowym
        </Link>
        , a o planowaniu przeczytasz w artykule o tym,{' '}
        <Link href="/pl/blog/injury-prevention-2-when-algorithms-predict-the-break">
          jak budować objętość z lżejszymi tygodniami
        </Link>
        .
      </p>

      <h2>Źródła</h2>
      <Sources />
    </div>
  );
}
