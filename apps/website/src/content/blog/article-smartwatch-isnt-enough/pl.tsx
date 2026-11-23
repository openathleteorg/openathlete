import Link from 'next/link';

export function ContentPl() {
  return (
    <div>
      <p>
        Nowoczesny zegarek biegowy rejestruje mnóstwo: ślad GPS, tempo, tętno,
        kadencję, czasem moc, a w nocy sen i zmienność rytmu serca. Potem podaje
        Ci wnioski: szacunkowe VO2max, czas regeneracji, wskaźnik gotowości,
        status treningowy, który mówi „produktywny” albo „nieproduktywny”.
        Pomiary są w większości dobre. Ostrożność jest potrzebna przy wnioskach,
        bo zegarkowi brakuje większości tego, co chciałby wiedzieć trener.
      </p>

      <h2>Co zegarek mierzy, a co szacuje</h2>
      <p>
        Czas, dystans i tempo z GPS są wystarczająco wiarygodne do treningu,
        poza wysokimi budynkami, gęstym lasem i ciasnymi łukami bieżni. Tętno
        jest mierzone, ale to, jak dobrze, zależy od czujnika. W badaniu
        porównawczym z EKG optyczne czujniki nadgarstkowe były mniej dokładne
        niż pas piersiowy, a dokładność zależała od urządzenia i rodzaju wysiłku
        (Gillinov i wsp.,{' '}
        <a href="https://pubmed.ncbi.nlm.nih.gov/28709155/">
          Med Sci Sports Exerc, 2017
        </a>
        ). W praktyce czujniki optyczne dobrze radzą sobie na równych biegach, a
        mają problem z interwałami, zimnem i luźnymi paskami.
      </p>
      <p>
        Cała reszta to szacunki zbudowane na tych danych. Najlepszym przykładem
        są kalorie: badanie Stanforda obejmujące siedem urządzeń noszonych na
        nadgarstku wykazało, że większość mierzyła tętno na rowerze z medianą
        błędu poniżej 5&nbsp;%, ale żadne nie szacowało wydatku energetycznego z
        błędem mniejszym niż 20&nbsp;% (Shcherbina i wsp.,{' '}
        <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC5491979/">
          J Pers Med, 2017
        </a>
        ). VO2max, czas regeneracji i wskaźniki gotowości pochodzą z
        zastrzeżonych algorytmów, które producenci opisują ogólnikowo, ale nie
        publikują w sposób, który dałoby się sprawdzić. Mogą być przydatnymi
        trendami. Pomiarami nie są.
      </p>

      <h2>Czego zegarek nie wie</h2>
      <p>
        Nie wie, jaki miał być trening. Bieg na 10 km w tempie 4:45/km to dla
        jednego biegacza dobre tempo, a dla innego, który miał w planie spokojny
        bieg, błąd. Bez planu nie ma się do czego odnieść.
      </p>
      <p>
        Nie wie, jak się czułeś na treningu. Odczuwany wysiłek często zmienia
        się jako pierwszy, gdy narasta zmęczenie, zanim zmieni się tętno czy
        tempo. Przegląd systematyczny wykazał, że subiektywne oceny sportowców
        reagowały na obciążenie treningowe czulej i bardziej konsekwentnie niż
        wskaźniki obiektywne, w tym tętno spoczynkowe (Saw i wsp.,{' '}
        <a href="https://pubmed.ncbi.nlm.nih.gov/26423706/">
          Br J Sports Med, 2016
        </a>
        ). Niektóre zegarki pytają teraz o ocenę po biegu; jeśli Twój to robi,
        korzystaj z tego.
      </p>
      <p>
        Nie zna Twojego życia. Zmęczenie psychiczne podnosi odczuwany wysiłek,
        nie zmieniając tętna ani mleczanu, przynajmniej w warunkach
        laboratoryjnych (
        <a href="https://pubmed.ncbi.nlm.nih.gov/28044281/">
          Van Cutsem i wsp., Sports Med, 2017
        </a>
        ). Stres w pracy, noworodek, długi lot: zegarek może wychwycić część
        tego przez sen i HRV, ale nie może wiedzieć, dlaczego.
      </p>
      <p>
        Nie wie o pobolewaniu Twojego Achillesa, o zawodach za osiem tygodni ani
        o tym, że wracasz po trzech tygodniach przerwy. Bez wahania nazwie Cię
        „nieproduktywnym” w trakcie taperingu.
      </p>

      <h2>Używaj go do tego, w czym jest dobry</h2>
      <p>
        Ufaj pomiarom, kwestionuj wnioski. Na treningi, w których liczy się
        tętno, warto wydać pieniądze na pas piersiowy. Patrz na trendy gotowości
        i HRV w skali tygodnia lub dłużej, a nie jak na codzienny werdykt: niski
        wynik po dobrze przespanej nocy i ze świeżymi nogami to raczej błąd
        algorytmu niż Twój.
      </p>
      <p>
        Dodawaj kontekst sam. Po każdym treningu ocena od 0 do 10 i jedna
        linijka notatek („spięte łydki”, „gorąco, 28&nbsp;°C”, „źle spałem”)
        zajmują trzydzieści sekund i sprawiają, że Twoje dane da się odczytać
        miesiąc później. Raz w tygodniu porównaj to, co zrobiłeś, z tym, co
        planowałeś: treningi wykonane, opuszczone, zmienione i dlaczego.
      </p>
      <p>
        I trzymaj plan gdzieś indziej niż w głowie. Treningi proponowane przez
        sam zegarek są budowane na jego szacunkach i nie znają Twoich docelowych
        zawodów poza tym, co wpisałeś. Plan napisany przez Ciebie lub trenera, z
        kluczowymi treningami rozmieszczonymi wokół Twojego życia, daje danym
        punkt odniesienia.
      </p>

      <h2>W tym tygodniu</h2>
      <p>
        Wybierz jeden szacunek, który podaje Twój zegarek (status treningowy,
        czas regeneracji albo gotowość), i zapisuj go codziennie obok własnej
        oceny w skali 0–10, jak świeży się czujesz. Na koniec tygodnia sprawdź,
        jak często się zgadzały. Będziesz wiedzieć, jaką wagę przypisywać tej
        liczbie.
      </p>

      <p>
        OpenAthlete to darmowa platforma, która działa nad Twoim zegarkiem:
        importuje aktywności z Garmina, COROS, Suunto, Polara i Stravy (albo
        pliki FIT, GPX i TCX), umieszcza je obok zaplanowanego treningu i trzyma
        RPE, TRIMP z tętna oraz sen i HRV z Twojego urządzenia w jednym
        kalendarzu. Treningi strukturalne można wysyłać na zegarki Garmin,
        Suunto i COROS. Zobacz{' '}
        <Link href="/pl/features/watch-sync">synchronizację z zegarkiem</Link> i{' '}
        <Link href="/pl/features/training-load">obciążenie treningowe</Link>.
      </p>
    </div>
  );
}
