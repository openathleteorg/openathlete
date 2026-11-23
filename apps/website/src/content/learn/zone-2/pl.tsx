import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentPl() {
  return (
    <div>
      <p>
        Strefa 2 to spokojne, równe bieganie, które wypełnia większość rozsądnie
        ułożonego tygodnia treningowego: tempo długich wybiegań i dni
        regeneracyjnych, w którym wciąż mówisz pełnymi zdaniami. Nazwa pochodzi
        z pięciostrefowej skali tętna używanej przez większość zegarków i
        aplikacji treningowych, gdzie strefa 2 leży między bardzo lekkim
        truchtem (strefa 1) a umiarkowaną, „przyjemnie ciężką” strefą 3.
        Fizjologicznie odpowiada intensywności na poziomie pierwszego progu
        mleczanowego lub tuż poniżej, gdzie mleczan we krwi jest ledwie powyżej
        wartości spoczynkowych, a wysiłek da się utrzymać godzinami. W polskiej
        terminologii biegowej to w dużej mierze to, co nazywa się OWB1, czyli
        pierwszy zakres.
      </p>
      <p>
        W ostatnich latach strefa 2 stała się modna, głównie za sprawą dyskusji
        o funkcji mitochondriów i spalaniu tłuszczów. Sama rada jest jednak dużo
        starsza: zawodnicy dyscyplin wytrzymałościowych w większości sportów
        spędzają większość czasu treningowego na niskiej intensywności, co
        udokumentowały przeglądy treningu elity autorstwa Stephena Seilera
        (Seiler, 2010).
      </p>

      <h2>Jak oblicza się strefę 2</h2>
      <p>
        Nie ma jednej definicji i to jest źródło większości nieporozumień.
        Popularna wersja oparta na tętnie korzysta z metody Karvonena, czyli z
        Twojej <Link href="/pl/learn/heart-rate-reserve">rezerwy tętna</Link>:
      </p>
      <Formula
        where={[
          'HRspocz: tętno spoczynkowe, mierzone na leżąco tuż po przebudzeniu',
          'HRmax: najwyższe faktycznie zarejestrowane tętno, a nie wynik wzoru z wieku, jeśli da się tego uniknąć',
        ]}
      >
        Strefa 2 = HRspocz + (0,60 do 0,70) × (HRmax − HRspocz)
      </Formula>
      <p>
        Prostszy wariant przyjmuje 60–70&nbsp;% tętna maksymalnego. W
        laboratorium strefę 2 wyznacza się natomiast na podstawie zmierzonych
        markerów: pierwszego progu mleczanowego lub wentylacyjnego. Procenty są
        zastępstwem tych progów, i to dość przybliżonym.
      </p>
      <p>
        Jedna pułapka: w modelu trzystrefowym używanym w badaniach (Seiler i
        inni) strefa 1 to wszystko poniżej pierwszego progu, a strefa 2 to
        przedział między pierwszym a drugim progiem. Taka „strefa 2” to bieganie
        w tempie, a nie spokojne bieganie. Czytając publikację, sprawdź, której
        skali używa.
      </p>

      <h2>Przykład z obliczeniami</h2>
      <p>
        Biegacz ma tętno spoczynkowe 50&nbsp;bpm, a pod koniec ciężkiego
        treningu podbiegów zobaczył na zegarku 190&nbsp;bpm. Jego rezerwa tętna
        wynosi 140 uderzeń.
      </p>
      <ul>
        <li>Dolna granica strefy 2: 50 + 0,60 × 140 = 134&nbsp;bpm</li>
        <li>Górna granica strefy 2: 50 + 0,70 × 140 = 148&nbsp;bpm</li>
        <li>
          Przy 60–70&nbsp;% tętna maksymalnego: od 0,60 × 190 = 114 do 0,70 ×
          190 = 133&nbsp;bpm
        </li>
      </ul>
      <p>
        Obie metody prawie się nie pokrywają. U wytrenowanego biegacza z niskim
        tętnem spoczynkowym 114&nbsp;bpm to niemal marsz, a strefa liczona od
        tętna maksymalnego leży głównie w strefie 1. Dlatego dla biegaczy metoda
        Karvonena jest zwykle lepszym wyborem i dlatego{' '}
        <Link href="/pl/tools/heart-rate-zones">kalkulator stref tętna</Link>{' '}
        używa jej domyślnie.
      </p>
      <p>
        Drugi biegacz, z tętnem spoczynkowym 60 i maksymalnym 180, dostaje od
        132 do 144&nbsp;bpm. Podobne liczby, zupełnie różni ludzie: strefy mają
        sens tylko z Twoimi własnymi wartościami spoczynkowymi i maksymalnymi.
      </p>

      <h2>Jak wykorzystać strefę 2 w treningu</h2>
      <p>
        U większości biegaczy trenujących cztery do sześciu razy w tygodniu
        zdecydowana większość czasu biegu powinna przypadać na strefy 1 i 2, z
        jedną lub dwiema mocniejszymi jednostkami na dokładkę. W praktyce:
      </p>
      <ul>
        <li>
          Spokojne dni: 40–70 minut w strefie 2, najlepiej w jej dolnej części
          dzień po ciężkim treningu.
        </li>
        <li>
          Długie wybieganie: 1:30–2:30 głównie w strefie 2. Tętno dryfuje w
          górę, gdy się męczysz i nagrzewasz; zaakceptuj kilka uderzeń dryfu,
          zamiast zwalniać do człapania, i zanotuj, jak duży jest dryf, bo mówi
          on coś o Twojej wytrzymałości (zobacz{' '}
          <Link href="/pl/learn/aerobic-decoupling">rozprzężenie tlenowe</Link>
          ).
        </li>
        <li>
          Na pagórkowatym terenie podchodź strome podbiegi, jeśli to pozwala
          utrzymać się w strefie. Biegacze górscy i tak robią to na zawodach.
        </li>
        <li>
          Sprawdzaj postępy na stałym punkcie odniesienia: ta sama płaska pętla
          przy tym samym tętnie co kilka tygodni. Jeśli tempo przy 140&nbsp;bpm
          rośnie, Twoja baza tlenowa się poprawia.
        </li>
      </ul>
      <p>
        Test rozmowy to przydatna kontrola krzyżowa. Jeśli jesteś w stanie
        wydusić tylko kilka słów naraz, jesteś powyżej strefy 2, cokolwiek
        pokazuje zegarek.
      </p>
      <p>
        W OpenAthlete strefy tętna można ustawić jako procent tętna maksymalnego
        lub rezerwy tętna, osobno dla każdej dyscypliny, a każda aktywność
        pokazuje czas spędzony w każdej strefie.{' '}
        <Link href="/pl/features/training-load">
          Strona o obciążeniu treningowym
        </Link>{' '}
        wyjaśnia, jak tętno zasila też <Link href="/pl/learn/trimp">TRIMP</Link>{' '}
        każdego treningu.
      </p>

      <h2>Ograniczenia</h2>
      <p>
        Strefy procentowe zakładają, że u każdego pierwszy próg leży na tym
        samym ułamku rezerwy tętna. Tak nie jest: u wytrenowanych biegaczy może
        być wyraźnie wyżej niż 70&nbsp;%, u początkujących niżej. Test progowy w
        laboratorium lub w terenie daje lepsze granice niż jakikolwiek procent.
      </p>
      <p>
        Słabym ogniwem jest tętno maksymalne. Wzory oparte na wieku, takie jak
        wzór Tanaki (208 − 0,7 × wiek), opisują średnią populacyjną i u wielu
        osób mylą się o 10 uderzeń lub więcej, co przesuwa całą strefę. Upał,
        odwodnienie, słaby sen i kofeina podnoszą tętno przy tym samym tempie, a
        na krótkich podbiegach tętno nie nadąża za wysiłkiem.
      </p>
      <p>
        Wreszcie, zachowaj proporcje. Duża część niedawnego entuzjazmu wokół
        strefy 2, mitochondriów i spalania tłuszczu opiera się na porównaniach
        zawodowych kolarzy z osobami w słabszej formie (San-Millán i Brooks,
        2018), które pokazują, czym różnią się wytrenowani sportowcy, a nie co
        da Ci konkretna ilość strefy 2. Spokojna objętość działa; działa też
        odrobina intensywności na dokładkę, i o to właśnie chodzi w{' '}
        <Link href="/pl/learn/polarized-training">treningu spolaryzowanym</Link>
        .
      </p>
    </div>
  );
}
