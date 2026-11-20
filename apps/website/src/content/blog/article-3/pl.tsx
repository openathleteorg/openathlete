import Link from 'next/link';

import { Sources } from './sources';

export function ContentPl() {
  return (
    <div>
      <p>
        Zapytaj dziesięciu biegaczy, dlaczego doznali kontuzji, a większość
        wskaże przyczynę: nowe buty, trening na bieżni, zbiegowy start, „za dużo
        za szybko”. Zapytaj badania, a odpowiedź będzie mniej uporządkowana.
        Związek między obciążeniem treningowym a kontuzjami biegowymi jest
        prawdziwy, ale słabszy, bardziej zaszumiony i bardziej indywidualny, niż
        sugerują pulpity w większości aplikacji treningowych. Ten artykuł mówi o
        tym, co dowody faktycznie potwierdzają i gdzie się kończą.
      </p>

      <h2>Jak często biegacze doznają kontuzji</h2>
      <p>
        Przegląd systematyczny dotyczący biegaczy długodystansowych wykazał
        roczne odsetki kontuzji od 19&nbsp;% do 79&nbsp;% w zależności od
        badania (van Gent i in., 2007). Ten rozrzut mówi równie dużo o tym, jak
        różnie badania definiują kontuzję, co o samym bieganiu. Liczenie na
        godzinę biegu jest bardziej użyteczne: późniejsza metaanaliza wskazała u
        początkujących około 18 kontuzji na 1000 godzin wobec około 8 u biegaczy
        rekreacyjnych (Videbæk i in., 2015). Początkujący doznają kontuzji mniej
        więcej dwa razy częściej przy tym samym czasie na nogach, co jest
        pierwszą wskazówką, że liczy się różnica między tym, co robisz, a tym,
        do czego Twoje ciało jest przyzwyczajone.
      </p>
      <p>
        Najbardziej spójnym czynnikiem ryzyka w badaniach nie jest kilometraż
        ani tempo. Jest nim wcześniejsza kontuzja (van der Worp i in., 2015).
        Jeśli miałeś już problem ze ścięgnem Achillesa, to ścięgno zasługuje na
        więcej ostrożności niż jakikolwiek wskaźnik na wykresie.
      </p>

      <h2>Obciążenie a wydolność tkanek</h2>
      <p>
        Najbardziej użyteczny sposób myślenia o kontuzjach przeciążeniowych
        pochodzi od Bertelsena i współpracowników (2017). Kontuzja pojawia się,
        gdy obciążenie konkretnej struktury, np. kości piszczelowej albo
        rozcięgna podeszwowego, przekracza to, co ta struktura jest w stanie
        znieść, wielokrotnie, przez pewien czas. Ruszają się dwie rzeczy:
        obciążenie, które przykładasz, i wydolność tkanki, która rośnie przy
        stopniowym treningu, a spada przy złym śnie, zbyt małej podaży energii,
        chorobie albo wcześniejszej kontuzji.
      </p>
      <p>
        Ten model obnaża główną słabość każdej miary obciążenia. Twój zegarek
        mierzy czas, dystans i tętno. Twojej kości piszczelowej tętno nie
        obchodzi. Dwugodzinny bieg terenowy z 1200 m zbiegu i dwugodzinny bieg
        po płaskim przy tym samym średnim tętnie dają podobny TRIMP, ale mięśnie
        czworogłowe i kolana powiedzą Ci, że to nie był ten sam dzień. Liczby
        obciążenia treningowego dość dobrze opisują koszt dla układu krążenia.
        Koszt dla konkretnego ścięgna czy kości opisują tylko pośrednio.
      </p>

      <h2>Co pokazują badania na biegaczach</h2>
      <p>
        Dobrych badań na biegaczach jest mniej, niż można by się spodziewać, a
        większość dotyczy początkujących. Trzy warto znać.
      </p>
      <p>
        W duńskiej kohorcie 874 początkujących biegaczy z zegarkami GPS ci,
        którzy zwiększyli tygodniowy dystans o ponad 30&nbsp;% w ciągu dwóch
        tygodni, mieli wyższy odsetek kontuzji „związanych z dystansem” (ból
        rzepkowo-udowy, zespół pasma biodrowo-piszczelowego, shin splints i
        kilka innych) niż ci, którzy pozostali poniżej 10&nbsp;% (Nielsen i in.,
        2014). Ogólny odsetek kontuzji nie różnił się między grupami, a nawet
        ten konkretny wynik był statystycznie na granicy istotności. Autorzy
        nazwali badanie eksploracyjnym.
      </p>
      <p>
        W holenderskim badaniu randomizowanym 532 początkujących
        przygotowujących się do biegu na 6,7 km realizowało albo standardowy
        8-tygodniowy plan, albo łagodniejszy 13-tygodniowy plan oparty na
        zasadzie 10&nbsp;%. Odsetki kontuzji były niemal identyczne: 20,8&nbsp;%
        i 20,3&nbsp;% (Buist i in., 2008).
      </p>
      <p>
        W badaniu Run Clever 447 biegaczy rekreacyjnych przez 16 tygodni
        zwiększało albo objętość, albo intensywność biegania. Badacze
        spodziewali się, że każde podejście wywoła własny typ kontuzji. Nie
        znaleźli różnicy (Ramskov i in., 2018).
      </p>
      <p>
        Podsumowując: duże, nagłe skoki prawdopodobnie mają znaczenie, zwłaszcza
        u początkujących. Nie wykazano, by precyzyjne dostrajanie tempa
        progresji poniżej tego progu wiele zmieniało. Co to oznacza w praktyce,
        tydzień po tygodniu, przeczytasz w tekście{' '}
        <Link href="/pl/blog/injury-prevention-2-when-algorithms-predict-the-break">
          jak szybko zwiększać kilometraż
        </Link>
        .
      </p>

      <h2>
        Wskaźnik obciążenia ostrego do przewlekłego i dlaczego budzi spory
      </h2>
      <p>
        Jeśli czytałeś o kontuzjach i obciążeniu, spotkałeś się ze wskaźnikiem
        obciążenia ostrego do przewlekłego (ACWR): obciążenie z ostatniego
        tygodnia podzielone przez średnie tygodniowe obciążenie z ostatnich
        czterech tygodni. Wyrósł z badań na szybkich rzucających w krykiecie
        (Hulin i in., 2014) i spopularyzowała go praca Tima Gabbetta z 2016 roku
        o „paradoksie trening–zapobieganie kontuzjom”, opisująca „sweet spot”
        między 0,8 a 1,3 i strefę zagrożenia powyżej 1,5 (Gabbett, 2016). W
        ciągu kilku lat te liczby trafiły do aplikacji, kursów trenerskich i
        mnóstwa wpisów na blogach, w tym wcześniejszej wersji tego tekstu.
      </p>
      <p>Krytyka pojawiła się równie szybko.</p>
      <ul>
        <li>
          W typowym obliczeniu ostatni tydzień jest częścią zarówno licznika,
          jak i mianownika. Lolli i współpracownicy (2019) pokazali, że to
          matematyczne sprzężenie samo w sobie tworzy korelację, nawet na
          losowych danych.
        </li>
        <li>
          Impellizzeri i współpracownicy (2020) argumentowali, że dzielenie
          przez obciążenie przewlekłe zakłada związek między nimi, którego nigdy
          nie sprawdzono, że wskaźnik zachowuje się różnie w zależności od tego,
          czy używasz średnich kroczących, czy wykładniczo ważonych, i że progi
          wyznaczono na kilku próbach ze sportów zespołowych, a potem
          zastosowano do wszystkich. Rok później poszli dalej i zalecili
          porzucenie ACWR wraz z leżącą u jego podstaw teorią (Impellizzeri i
          in., 2021).
        </li>
        <li>
          Większość badań nad ACWR to badania obserwacyjne w sportach
          zespołowych, ze skromną liczbą kontuzji. Zmienna powiązana z
          kontuzjami w grupie nie przewiduje, która osoba dozna urazu. Roald
          Bahr zwrócił na to uwagę w odniesieniu do testów przesiewowych w ogóle
          i dotyczy to także tej sytuacji (Bahr, 2016).
        </li>
      </ul>
      <p>
        Moja interpretacja: idea leżąca u podstaw ACWR, że nie należy nagle
        robić dużo więcej, niż robiło się ostatnio, jest stara, rozsądna i
        zgodna z powyższymi danymi z biegania. Precyzyjne progi nie są ustalone.
        Traktuj „1,5” jak folklor, a nie fizjologię, i uważaj na wszystko, co
        zamienia Twój trening w jeden procent ryzyka kontuzji.
      </p>

      <h2>Co z tym wszystkim zrobić</h2>
      <p>
        Niepewne dowody nie są powodem, by ignorować obciążenie. Są powodem, by
        używać go do tego, w czym jest dobre: do zauważenia, że ten tydzień
        bardzo różni się od kilku poprzednich, i do zapytania, dlaczego.
      </p>
      <p>
        Patrz na zmiany, których miary obciążenia nie wychwytują. Pierwszy od
        miesięcy trening na bieżni, start z dużą ilością zbiegów, nowe buty z
        mniejszym dropem, przejście ze szlaków na asfalt: każda z tych rzeczy
        obciąża konkretne tkanki w nowy sposób, nawet jeśli tygodniowa suma
        prawie się nie zmienia. Zmieniaj jedną z nich naraz.
      </p>
      <p>
        Traktuj samoocenę poważnie. Przegląd systematyczny wykazał, że to, jak
        zawodnicy opisują swoje samopoczucie (nastrój, zmęczenie, bolesność
        mięśni), reagowało na trening bardziej niezawodnie niż popularne
        obiektywne markery, takie jak tętno czy badania krwi (Saw i in., 2016).
        Zapisuj ból w dniu, w którym się pojawia, z jednym słowem o tym, gdzie i
        jak mocno boli. Ból, który zmienia sposób, w jaki biegasz, który
        następnego ranka jest gorszy albo siedzi w jednym precyzyjnym punkcie
        kości, to powód, by przerwać i dać się zbadać, niezależnie od tego, co
        mówi jakikolwiek wykres.
      </p>
      <p>
        I uwzględniaj wydolność. Zły tydzień snu, problemy żołądkowe albo okres
        jedzenia zbyt mało obniżają to, co Twoje tkanki są w stanie znieść. Ten
        sam plan treningowy nie jest tym samym obciążeniem dla tego samego
        biegacza w każdym miesiącu roku.
      </p>

      <h2>Gdzie pasuje OpenAthlete</h2>
      <p>
        OpenAthlete nie przewiduje kontuzji i nie daje Ci wskaźnika ryzyka.
        Pokazuje obok siebie liczby, które według tego artykułu warto
        obserwować. Każda jednostka dostaje obciążenie z tętna (TRIMP), a obok
        session RPE. Kondycja, zmęczenie i forma są rysowane na podstawie
        Twojego dotychczasowego treningu i prognozowane na zaplanowane
        jednostki, a każdy tydzień pokazuje swoje obciążenie na tle zakresu
        zbudowanego z Twoich ostatnich tygodni, co jest regułą praktyczną, a nie
        limitem bezpieczeństwa. Po aktywności kilka opcjonalnych pytań zapisuje,
        jak ciężka się wydawała i jaki ból zgłaszasz; ten ból trafia do
        dziennika kontuzji, który widzi Twój trener. Szczegóły i wzory
        znajdziesz na{' '}
        <Link href="/pl/features/training-load">
          stronie o obciążeniu treningowym
        </Link>
        .
      </p>

      <h2>Źródła</h2>
      <Sources />
    </div>
  );
}
