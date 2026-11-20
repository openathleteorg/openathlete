import Link from 'next/link';

export function ContentPl() {
  return (
    <div>
      <p>
        TRIMP, skrót od training impulse, to najstarsza poważna próba opisania
        treningu jedną liczbą. Eric Banister i jego współpracownicy
        zaproponowali go w latach 70. jako dane wejściowe dla swojego modelu
        kondycji i zmęczenia, a pięćdziesiąt lat później wciąż, w takiej czy
        innej postaci, stoi za większością wykresów obciążenia opartych na
        tętnie. Jest na tyle prosty, że da się go policzyć ręcznie, a to
        najlepszy sposób, by zrozumieć, co robi dobrze i gdzie wprowadza Cię w
        błąd.
      </p>

      <h2>Wzór</h2>
      <p>
        TRIMP Banistera mnoży czas trwania treningu przez to, jak głęboko
        sięgnąłeś w swoją rezerwę tętna, a następnie waży tę intensywność
        wykładniczo, tak by ciężkie minuty kosztowały więcej niż łatwe:
      </p>
      <p>
        <code>TRIMP = czas (min) × HRr × 0,64 × e^(1,92 × HRr)</code>
      </p>
      <p>
        gdzie <code>HRr = (HRśr − HRspocz) / (HRmax − HRspocz)</code> to część
        rezerwy tętna wykorzystana podczas treningu. Dla kobiet współczynniki
        wynoszą 0,86 i 1,67:{' '}
        <code>TRIMP = czas × HRr × 0,86 × e^(1,67 × HRr)</code>.
      </p>
      <p>
        Najciekawsze jest ważenie wykładnicze. Dopasowano je do tego, jak rośnie
        stężenie mleczanu we krwi wraz z tętnem: przy łatwej intensywności
        prawie płasko, w pobliżu progu stromo (Morton, Fitz-Clarke i Banister,
        1990). Osobne współczynniki dla mężczyzn i kobiet pochodzą z tej samej
        pracy i opisują średnie grupowe, a nie Ciebie. Nikt nie wykazał, że
        dobrze pasują do jakiegokolwiek pojedynczego sportowca, i warto o tym
        pamiętać, zanim uznasz TRIMP 112 za bardziej precyzyjny niż 105.
      </p>

      <h2>Przykład z obliczeniami</h2>
      <p>
        Weźmy biegacza z tętnem spoczynkowym 50 i maksymalnym 190, czyli z
        rezerwą 140 uderzeń. Wychodzi na spokojną godzinę ze średnim tętnem 140
        bpm.
      </p>
      <ul>
        <li>HRr = (140 − 50) / (190 − 50) = 90 / 140 = 0,643</li>
        <li>Waga = 0,64 × e^(1,92 × 0,643) = 0,64 × 3,44 = 2,20</li>
        <li>TRIMP = 60 × 0,643 × 2,20 = 85</li>
      </ul>
      <p>
        Ze współczynnikami dla kobiet ta sama godzina daje 97. To samo serce,
        ten sam bieg, 14% różnicy wyłącznie z powodu wyboru współczynników. To
        pokazuje, jak bardzo wartość bezwzględna zależy od założeń.
      </p>
      <p>
        Teraz trening progowy tego samego biegacza: 20 minut rozgrzewki przy 135
        bpm, 5 × 4&apos; przy 175 bpm z 3&apos; truchtu przy 140 w przerwach,
        potem 8 minut schłodzenia przy 130. Znowu sześćdziesiąt minut. Zsumowany
        blok po bloku daje TRIMP 114. Policzony ze średniego tętna całego
        treningu (149 bpm) daje 105.
      </p>
      <p>
        Ta różnica to efekt funkcji wykładniczej: cztery minuty przy 175
        kosztują znacznie więcej, niż sugeruje średnia. Uśrednianie treningu,
        który łączy łatwe i ciężkie odcinki, zawsze go więc zaniża. Oryginalna
        metoda Banistera korzystała ze średniej, bo ówczesne pulsometry nie
        dawały nic więcej. Dziś każdy zegarek zapisuje tętno co sekundę i
        całkowanie sekunda po sekundzie jest lepszym wyborem. Im dłuższy i
        bardziej zróżnicowany trening, tym większe ma to znaczenie.
      </p>
      <p>
        Dla porównania: równe długie wybieganie 2:30 h przy 135 bpm daje około
        187, a 20 minut przy 185 bpm (dla tego biegacza prawie na maksa) około
        79. Według wzoru krótki, bardzo ciężki wysiłek może więc kosztować tyle
        co spokojna godzina. Czy Twoje nogi widzą to tak samo, to już inna
        sprawa.
      </p>

      <h2>Co musisz dobrze ustawić</h2>
      <p>
        TRIMP jest tak dobry jak jego dwie wartości odniesienia. HRmax zawyżone
        o 10 uderzeń sprawia, że każdy trening wygląda na łatwiejszy, zaniżone
        wszystko rozdmuchuje. Weź najwyższą wartość, jaką widziałeś podczas
        ciężkich zawodów albo maksymalnego podbiegu, a nie 220 minus wiek, co
        często myli się o 10 bpm lub więcej w jedną lub drugą stronę. Tętno
        spoczynkowe najlepiej mierzyć na leżąco tuż po przebudzeniu, uśredniając
        z kilku poranków. Jeśli nie znasz swoich wartości, nasz{' '}
        <Link href="/pl/tools/heart-rate-zones">kalkulator stref tętna</Link>{' '}
        wyjaśnia, jak je oszacować.
      </p>
      <p>
        Do tego dochodzi czujnik. Optyczne czujniki nadgarstkowe sprawdzają się
        przy równych biegach i często mylą się w pierwszych minutach treningu,
        na zimnie i przy krótkich interwałach. Pas piersiowy usuwa większość
        tego szumu. Odczyt 170 bpm z nadgarstka na spokojnym biegu, który w
        rzeczywistości mierzy kadencję, da Ci TRIMP niemający nic wspólnego z
        tym biegiem.
      </p>

      <h2>Gdzie TRIMP się myli</h2>
      <p>
        Tętno mierzy to, co robi Twój układ krążenia, a nie to, ile płacą Twoje
        mięśnie. Ma to przewidywalne skutki.
      </p>
      <p>
        Klasycznym przykładem jest bieg w dół. Trail z 1500 m zbiegu potrafi
        zniszczyć Ci uda na cztery dni, a tętno na zbiegach pozostaje
        umiarkowane. TRIMP go więc zaniża. Ten sam problem mają treningi siłowe,
        plyometria i podbiegi sprinterskie.
      </p>
      <p>
        Kolejny przypadek to krótkie interwały. Tętno potrzebuje minuty lub
        dwóch, żeby nadążyć za wysiłkiem, i przy treningu 30/30 nigdy nie osiąga
        poziomu, na jaki zasługuje praca. TRIMP wychodzi za niski.
      </p>
      <p>
        Upał działa w drugą stronę. W gorący dzień dryf sercowy może podnieść
        tętno przy tym samym tempie o dziesięć uderzeń lub więcej w ciągu
        godziny. TRIMP liczy to jako cięższy trening. Fizjologicznie taki był,
        więc nie jest to całkiem błędne, ale letni tydzień wygląda przez to na
        cięższy niż ten sam tydzień w marcu.
      </p>
      <p>
        I wreszcie tętno nie jest porównywalne między dyscyplinami. Większość
        osób osiąga na rowerze niższe tętno niż w biegu, a w wodzie jeszcze
        niższe. Rowerowy i biegowy TRIMP o tej samej wartości nie oznaczają więc
        tego samego stresu. Dlatego niektórzy trenerzy używają wartości
        maksymalnych osobno dla każdej dyscypliny.
      </p>

      <h2>Inne warianty i session-RPE</h2>
      <p>
        Kilka wariantów próbuje naprawić część tych problemów. TRIMP Edwardsa
        (1993) mnoży minuty spędzone w każdej z pięciu stref tętna przez
        wartości od 1 do 5. TRIMP Lucíi (Lucía i in., 2003) używa trzech stref
        wyznaczonych przez progi wentylacyjne, z wagami 1, 2 i 3.
        Zindywidualizowany TRIMP Manziego (Manzi i in., 2009) zastępuje
        populacyjną krzywą Banistera własnym profilem mleczanowym sportowca.
        Jest dokładniejszy, ale wymaga testu laboratoryjnego.
      </p>
      <p>
        Najprostsza alternatywa całkowicie rezygnuje z tętna. Session-RPE
        Fostera (Foster i in., 2001) mnoży czas w minutach przez to, jak ciężki
        wydawał się trening w skali od 0 do 10: 50 minut przy RPE 6 daje 300.
        Uwzględnia uszkodzenia mięśni, upał, słaby sen i fatalny dzień w pracy,
        bo je czujesz. Badania porównujące obie metody wykazały dobrą korelację,
        ale daleko jej do zgodności (Impellizzeri i in., 2004), i o to właśnie
        chodzi: gdy TRIMP i session-RPE się rozjeżdżają, coś się dzieje. Bieg
        progowy, który odczułeś jak 8, przy normalnie wyglądającym TRIMP,
        zasługuje na drugie spojrzenie.
      </p>

      <h2>Od pojedynczego treningu do kondycji i zmęczenia</h2>
      <p>
        Pojedynczy TRIMP niewiele mówi. Jego wartość polega na tym, że jest
        codziennym wejściem do modelu Banistera, który prowadzi dwie wykładniczo
        ważone średnie Twojego obciążenia: wolną dla kondycji, zwykle ze stałą
        czasową 42 dni (często nazywaną CTL), i szybką dla zmęczenia, z 7 dniami
        (ATL). Forma, czyli TSB, to różnica między nimi. W trakcie bloku
        treningowego jest poniżej zera, w taperingu zmęczenie spada szybciej niż
        kondycja, a forma znów wychodzi nad zero. Model jest opisem, a nie
        prawem natury, a 42 i 7 dni to konwencje, nie wartości zmierzone na
        Tobie. Trend w skali tygodni jest jednak użyteczny.
      </p>
      <p>
        Wynikają z tego dwie praktyczne zasady. Porównuj swoje obciążenie z nim
        samym, a nie z obciążeniem innych ani między systemami: TRIMP 100 i TSS
        100 w TrainingPeaks to różne jednostki. I czytaj krzywą w skali tygodni,
        pojedynczy dzień niewiele znaczy.
      </p>

      <h2>Jak korzysta z niego OpenAthlete</h2>
      <p>
        OpenAthlete liczy TRIMP Banistera dla każdej aktywności z tętnem,
        sekunda po sekundzie, gdy dostępny jest strumień danych, ze
        współczynnikami 0,64/1,92 i 0,86/1,67 oraz z HRmax i tętnem spoczynkowym
        z Twoich pomiarów. Gdy ocenisz wysiłek aktywności, obok pojawia się też
        session-RPE, więc widzisz, kiedy te dwie wartości się rozjeżdżają.
        Kondycja, zmęczenie i forma są następnie prognozowane na podstawie
        Twoich zaplanowanych treningów. Strona{' '}
        <Link href="/pl/features/training-load">obciążenia treningowego</Link>{' '}
        ma mały kalkulator TRIMP i linkuje do wzorów w kodzie źródłowym.
      </p>

      <h2>Źródła</h2>
      <ul>
        <li>
          Banister EW, Calvert TW, Savage MV, Bach T. A systems model of
          training for athletic performance. Australian Journal of Sports
          Medicine, 1975;7:57–61.
        </li>
        <li>
          Morton RH, Fitz-Clarke JR, Banister EW. Modeling human performance in
          running. Journal of Applied Physiology, 1990;69(3):1171–1177.{' '}
          <a href="https://doi.org/10.1152/jappl.1990.69.3.1171">
            doi:10.1152/jappl.1990.69.3.1171
          </a>
        </li>
        <li>
          Banister EW. Modeling elite athletic performance. In: MacDougall JD,
          Wenger HA, Green HJ (eds), Physiological Testing of the
          High-Performance Athlete. Human Kinetics, 1991.
        </li>
        <li>Edwards S. The Heart Rate Monitor Book. Polar Electro, 1993.</li>
        <li>
          Foster C, Florhaug JA, Franklin J, et al. A new approach to monitoring
          exercise training. Journal of Strength and Conditioning Research,
          2001;15(1):109–115.
        </li>
        <li>
          Lucía A, Hoyos J, Santalla A, Earnest C, Chicharro JL. Tour de France
          versus Vuelta a España: which is harder? Medicine and Science in
          Sports and Exercise, 2003;35(5):872–878.
        </li>
        <li>
          Impellizzeri FM, Rampinini E, Coutts AJ, Sassi A, Marcora SM. Use of
          RPE-based training load in soccer. Medicine and Science in Sports and
          Exercise, 2004;36(6):1042–1047.
        </li>
        <li>
          Manzi V, Iellamo F, Impellizzeri F, D&apos;Ottavio S, Castagna C.
          Relation between individualized training impulses and performance in
          distance runners. Medicine and Science in Sports and Exercise,
          2009;41(11):2090–2096.
        </li>
      </ul>
    </div>
  );
}
