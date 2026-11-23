import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentPl() {
  return (
    <div>
      <p>
        Tempo skorygowane o nachylenie (ang. grade-adjusted pace, GAP) zamienia
        to, co przebiegasz na zboczu, na tempo, które kosztowałoby tyle samo
        energii na płaskim. Kilometr w 7:30 na 8-procentowym asfaltowym podbiegu
        wygląda na zegarku na wolny; po korekcie o nachylenie jest wart niecałe
        5:00 na płaskim. GAP istnieje, bo surowe tempo przestaje wiele znaczyć,
        gdy tylko teren się pochyla, a w bieganiu górskim dzieje się tak przez
        większość czasu.
      </p>
      <p>
        Modeli jest kilka. Ten używany tutaj i w OpenAthlete pochodzi od Alberta
        Minettiego i współpracowników, którzy zmierzyli koszt tlenowy biegu na
        bieżni ustawionej od −45 % do +45 % i dopasowali do wyników krzywą
        (Minetti i wsp., 2002).
      </p>

      <h2>Jak liczy się tempo skorygowane o nachylenie</h2>
      <p>
        Krzywa Minettiego podaje koszt energetyczny przebiegnięcia jednego metra
        przy danym nachyleniu, na kilogram masy ciała. Na płaskim wynosi on 3,6
        J/kg/m. GAP to stosunek kosztu na płaskim do kosztu na zboczu,
        zastosowany do Twojego tempa:
      </p>
      <Formula
        where={[
          'C(i) = 155,4i⁵ − 30,4i⁴ − 43,3i³ + 46,3i² + 19,5i + 3,6, w J/kg/m',
          'i = nachylenie jako ułamek: 0,08 dla 8 %, −0,10 dla −10 %',
          'C(0) = 3,6 na płaskim',
        ]}
      >
        GAP = tempo na zboczu × 3,6 / C(i)
      </Formula>
      <p>
        Ten sam stosunek działa w drugą stronę: tempo, które trzeba utrzymać na
        zboczu przy danym wysiłku na płaskim, to{' '}
        <code>tempo na płaskim × C(i) / 3,6</code>. Dla całej aktywności
        obliczenie wykonuje się punkt po punkcie na zapisanej wysokości, a potem
        uśrednia, więc pagórkowaty bieg dostaje jedną wartość GAP obok surowego
        średniego tempa.
      </p>

      <h2>Przykład z liczbami</h2>
      <ul>
        <li>
          Pod górę: 7:30/km na 8-procentowym podbiegu. C(0,08) = 5,43, czyli
          1,51 raza więcej niż na płaskim. 7:30 (450 s) / 1,51 = 298 s, więc
          około 4:58/km na płaskim.
        </li>
        <li>
          W drugą stronę: biegacz, którego spokojne tempo na płaskim to 5:30/km,
          chce utrzymać ten sam wysiłek na 6-procentowym podbiegu. C(0,06) =
          4,93, czyli 1,37 raza więcej, więc 5:30 × 1,37 = 7:32/km. Przy 15 %
          stosunek wynosi 2,06, a tempo rośnie do 11:20/km. Wtedy większość
          ludzi przechodzi do marszu i to jest dobra decyzja.
        </li>
        <li>
          W dół: 4:30/km przy −10 %. C(−0,10) = 2,15, tylko 0,6 kosztu na
          płaskim, więc odpowiednik na płaskim to 7:32/km. Rachunek energetyczny
          jest niewielki, rachunek dla czworogłowych już nie.
        </li>
      </ul>
      <p>
        <Link href="/pl/tools/grade-adjusted-pace">
          Kalkulator tempa skorygowanego o nachylenie
        </Link>{' '}
        przeliczy te wartości dla dowolnego tempa i nachylenia.
      </p>

      <h2>Jak wykorzystać je w treningu</h2>
      <p>
        GAP najbardziej przydaje się do porównywania biegów na różnym terenie.
        Pętla 14 km z 500 m przewyższenia w średnim tempie 6:10/km i płaskie 14
        km w 5:20/km mogły być dla Twojego serca tym samym treningiem.
        Zestawienie GAP z tętnem pokazuje, czy słabszy dzień to wina podbiegów,
        czy Twoja.
      </p>
      <p>
        Pomaga też ustalać cele na pagórkowatych trasach. Jeśli spokojne biegi
        mają zostać na wysiłku odpowiadającym 5:30 na płaskim, 6-procentowy
        podbieg w 7:30 jest w porządku, a ten sam podbieg w 6:30 to
        zakamuflowany bieg tempowy. Przy podbiegach typu 8 × 2' pod górę GAP
        pozwala sprawdzić, czy ostatnie powtórzenie było warte tyle samo co
        pierwsze, nawet jeśli tempo na zegarku się rozjechało.
      </p>
      <p>
        W dniu startu używaj go ostrożnie. GAP mówi, ile podbieg kosztuje
        energii, a nie ile potrwa bieg w górach; do tego bliżej pytania są{' '}
        <Link href="/pl/learn/km-effort">km-effort</Link> i{' '}
        <Link href="/pl/tools/trail-time-estimator">
          kalkulator czasu biegu górskiego
        </Link>
        .
      </p>
      <p>
        OpenAthlete stosuje krzywą Minettiego do każdego biegu i biegu
        terenowego, który synchronizujesz. Nachylenie odczytuje z wysokości w
        oknach po 10 m i ogranicza do ±30 %, bo bardziej strome odczyty to
        zwykle szum GPS lub barometru, a nie teren.
      </p>

      <h2>Ograniczenia</h2>
      <p>
        Badani Minettiego biegali po gładkiej taśmie bieżni. Kamienie, korzenie,
        błoto i serpentyny dokładają koszt, o którym krzywa nie wie, więc w
        technicznym terenie Twój prawdziwy wysiłek był większy, niż pokazuje
        GAP.
      </p>
      <p>
        Najsłabszym punktem są zbiegi. Na papierze koszt spada aż do minimum
        około −18 do −20 %, gdzie metr kosztuje o połowę mniej niż na płaskim. W
        praktyce poniżej mniej więcej −10 % ogranicza Cię hamowanie, pewność
        stopy i ekscentryczne obciążenie mięśnia czworogłowego, na długo zanim
        zabraknie energii. Szybki zbieg pokazuje łagodne GAP, a może być tym, po
        czym mięśnie bolą przez trzy dni.
      </p>
      <p>
        Dane o wysokości są zaszumione. Zegarek z barometrem radzi sobie lepiej
        niż wysokość z GPS, ale oba tworzą na płaskim małe fałszywe podbiegi,
        które lekko przesuwają GAP. Krótkie, strome elementy, jak 20-metrowa
        rampa, wygładza okno uśredniania.
      </p>
      <p>
        Wreszcie inne platformy używają innych modeli. Strava podaje, że jej GAP
        zbudowano na danych tętna jej użytkowników, a nie na pomiarach
        laboratoryjnych, i daje mniejszą premię na zbiegach. Liczby będą się
        różnić między narzędziami; porównuj biegi w obrębie jednego narzędzia, a
        nie między nimi.
      </p>
    </div>
  );
}
