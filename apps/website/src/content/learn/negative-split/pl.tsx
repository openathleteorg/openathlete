import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentPl() {
  return (
    <div>
      <p>
        Negative split oznacza, że drugą połowę biegu pokonujesz szybciej niż
        pierwszą. Odwrotność, czyli positive split, to coś, co większość ludzi
        biega zupełnie bez zamiaru: start napędzany adrenaliną i dopingiem
        kibiców, a potem długie słabnięcie. Trenerzy od dziesięcioleci polecają
        negative split, głównie jako lekarstwo na to zjawisko. Dowody naukowe są
        skromniejsze, niż sugeruje ta rada, ale nawyk, który buduje, czyli
        powściągliwość na początku, sprawdza się na każdym dystansie od 10 km
        wzwyż.
      </p>

      <h2>Jak mierzy się split</h2>
      <p>
        Podziel bieg na dwie równe części i porównaj czasy. Jeśli wyrazisz
        różnicę jako procent czasu pierwszej połowy, porównasz dychę z
        maratonem:
      </p>
      <Formula
        where={[
          'T1 = czas pierwszej połowy, T2 = czas drugiej połowy',
          'Wartość ujemna: negative split. Wartość dodatnia: positive split. W granicach około ±1 %: równe tempo (even pace)',
        ]}
      >
        split (%) = (T2 − T1) / T1 × 100
      </Formula>
      <p>
        Przedział ±1&nbsp;% dla „równego” tempa to praktyczna umowa, a nie
        standard: dryf GPS, wiatr czy jeden podbieg potrafią same przesunąć
        split o tyle. Na pagórkowatej trasie albo trasie z punktu A do B
        porównuj odcinki o podobnym profilu albo patrz na{' '}
        <Link href="/pl/learn/grade-adjusted-pace">
          tempo skorygowane o nachylenie
        </Link>{' '}
        zamiast na zegarek.
      </p>

      <h2>Przykład z obliczeniami</h2>
      <p>
        Biegacz celuje w 50:00 na 10 km, czyli średnio 5:00/km. Mija 5 km po
        25:30 (5:06/km), a drugie 5 km pokonuje w 24:30 (4:54/km).
      </p>
      <ul>
        <li>T2 − T1 = 1470 − 1530 = −60 s</li>
        <li>split = −60 / 1530 × 100 = −3,9&nbsp;%</li>
      </ul>
      <p>
        To wyraźny negative split, i chyba nawet zbyt wyraźny: jeśli drugą
        połowę dychy kończysz o minutę szybciej, pierwsza była zwykle zbyt
        zachowawcza i trochę czasu zostało na trasie.
      </p>
      <p>
        W maratonie marginesy są mniejsze. Przy celu 3:30:00 (średnio 4:59/km)
        rozsądny plan to 1:45:50 na półmetku (5:01/km), a potem 1:44:10
        (4:56/km) na drugą połowę: split −1,6&nbsp;%. Pierwsza połowa biegnięta
        zaledwie dwie, trzy sekundy na kilometr wolniej od średniej kosztuje 50
        sekund na półmetku, a daje zapas na ostatnie 10 km, gdzie przegrywa się
        większość maratonów.
      </p>

      <h2>Jak to wykorzystać</h2>
      <p>
        Nie chodzi o to, żeby sprintować na końcu, tylko o to, żeby nie spłacać
        odsetek od zbyt szybkiego startu. Pierwsze kilometry powyżej tempa,
        które jesteś w stanie utrzymać, zużywają węglowodany i tolerancję na
        zmęczenie, których później w biegu już nie odzyskasz. Kilka praktycznych
        zasad:
      </p>
      <ul>
        <li>
          Ustal tempo docelowe na podstawie niedawnego startu, a nie nadziei.{' '}
          <Link href="/pl/tools/race-predictor">Kalkulator wyniku</Link> i{' '}
          <Link href="/pl/pace-charts">tabele temp</Link> podają międzyczasy na
          każdy kilometr dla wybranego czasu końcowego.
        </li>
        <li>
          W półmaratonie i maratonie zaplanuj pierwsze 3–5 km o 5–10 sekund na
          kilometr wolniej od tempa docelowego, a potem się ustabilizuj. Na 10
          km hamować trzeba przede wszystkim pierwszy kilometr.
        </li>
        <li>
          Przećwicz to. Bieg z narastającą prędkością, na przykład 12 km zaczęte
          w spokojnym tempie, z ostatnimi 3 km w tempie maratońskim, uczy, jak w
          praktyce wygląda powściągliwość. Długie wybieganie na 26 km z
          ostatnimi 8 km w docelowym tempie maratońskim robi to samo, ale przy
          większym zmęczeniu.
        </li>
        <li>
          Po starcie oceniaj bieg po splicie. Positive split powyżej 3–4&nbsp;%
          w maratonie prawie zawsze wskazuje na pierwszą połowę, a nie na drugą.
        </li>
      </ul>

      <h2>Ograniczenia</h2>
      <p>
        Badania nie czynią z negative splitu prawa. W przeglądzie strategii
        rozkładania tempa Abbiss i Laursen (2008) stwierdzili, że równomierne
        tempo zwykle najlepiej pasuje do wysiłków dłuższych niż kilka minut, a w
        bardzo długich zawodach wytrenowani sportowcy zazwyczaj stopniowo
        zwalniają, niezależnie od swoich zamiarów. Díaz i współpracownicy (2018)
        przeanalizowali wszystkie rekordy świata w maratonie z pięćdziesięciu
        lat: rekordziści biegli średnio pierwszą połowę nieco szybciej niż
        drugą. Najnowsze rekordy były najbardziej równe, co skłoniło autorów do
        wniosku, że przyszłością może być raczej minimalna zmienność tempa niż
        wyraźny negative split.
      </p>
      <p>
        Uczciwym celem dla większości biegaczy jest więc równy podział z lekką
        tendencją do przyspieszania, a nie spektakularny finisz. Przeszkadzają
        też trasy: bieg, który w drugiej połowie się wznosi, na zegarku wygląda
        na positive split, choć wysiłek był idealnie równy. W biegach terenowych
        i ultra, gdzie w drugiej połowie dominują teren i noc, porównywanie
        połówek po czasie mówi niewiele; większe znaczenie mają odczucie
        wysiłku, tętno i odżywianie.
      </p>
    </div>
  );
}
