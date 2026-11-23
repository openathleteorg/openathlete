import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentPl() {
  return (
    <div>
      <p>
        Trening spolaryzowany opisuje sposób rozkładania intensywności:
        większość objętości wyraźnie łatwa, mniejsza, ale realna część wyraźnie
        ciężka, i bardzo mało pośrodku. Pomysł nie wziął się z protokołu
        laboratoryjnego, tylko z obserwacji tego, co faktycznie robią najlepsi
        zawodnicy dyscyplin wytrzymałościowych. Analizując badania opisowe,
        Stephen Seiler stwierdził, że zawodnicy na poziomie krajowym i
        międzynarodowym, trenujący 10–13 razy w tygodniu, zwykle dochodzą do
        około 80&nbsp;% jednostek o niskiej intensywności i około 20&nbsp;%
        zdominowanych przez ciężką pracę, na przykład interwały w okolicach
        90&nbsp;% VO2max (Seiler, 2010).
      </p>
      <p>
        Ten wzorzec często skraca się do „80/20”. Skrót ukrywa dwa istotne
        szczegóły: które strefy liczysz i czy liczysz jednostki treningowe, czy
        minuty.
      </p>

      <h2>Trzy strefy, na których się opiera</h2>
      <p>
        Trening spolaryzowany korzysta z modelu trzech stref opartego na dwóch
        progach fizjologicznych. Strefa 1 leży poniżej pierwszego progu
        wentylacyjnego lub{' '}
        <Link href="/pl/learn/lactate-threshold">progu mleczanowego</Link>{' '}
        (mleczan we krwi około 2 mmol/l): spokojne bieganie, przy którym mówisz
        pełnymi zdaniami. Strefa 2 leży między progami. Strefa 3 to obszar
        powyżej drugiego progu (około 4 mmol/l, blisko{' '}
        <Link href="/pl/learn/critical-speed">prędkości krytycznej</Link>),
        gdzie mieszkają interwały.
      </p>
      <p>
        Uważaj na zbieżność nazw. W pięciostrefowych systemach większości
        zegarków „<Link href="/pl/learn/zone-2">strefa 2</Link>” oznacza
        spokojną wytrzymałość, która mieści się w strefie 1 modelu
        trzystrefowego. Trening spolaryzowany nie każe unikać spokojnych biegów
        w strefie 2; każe spędzać mało czasu między progami.
      </p>

      <h2>Jak to policzyć</h2>
      <p>
        Treff i współpracownicy (2019) zaproponowali indeks polaryzacji, który
        odróżnia rozkład spolaryzowany od pozostałych na podstawie udziału czasu
        (lub dystansu) treningu w każdej z trzech stref:
      </p>
      <Formula
        where={[
          'Z1, Z2, Z3 = udział całkowitego czasu treningu w każdej strefie (0,80 dla 80 %), Z1 + Z2 + Z3 = 1',
          'Obowiązuje, gdy Z1 > Z3 > Z2. Jeśli Z3 = 0, PI = 0. Jeśli Z2 = 0, przyjmij 0,01 dla Z2 i Z3 − 0,01 dla Z3',
          'PI > 2,00: rozkład spolaryzowany. PI ≤ 2,00: niespolaryzowany',
        ]}
      >
        PI = log10(Z1 / Z2 × Z3 × 100)
      </Formula>

      <h2>Przykład z obliczeniami</h2>
      <p>
        Biegacz trenuje 8 godzin tygodniowo. W ciągu miesiąca czas w strefach
        wynosi średnio 80&nbsp;% w strefie 1, 5&nbsp;% w strefie 2 i 15&nbsp;% w
        strefie 3.
      </p>
      <ul>
        <li>Z1 / Z2 = 0,80 / 0,05 = 16</li>
        <li>16 × 0,15 × 100 = 240</li>
        <li>PI = log10(240) = 2,38, powyżej 2,00: rozkład spolaryzowany</li>
      </ul>
      <p>
        Zmień proporcje na 75&nbsp;% / 20&nbsp;% / 5&nbsp;%, czyli piramidę z
        dużą ilością biegania w tempie i niewielką liczbą interwałów: PI =
        log10(0,75 / 0,20 × 0,05 × 100) = log10(18,75) = 1,27. Blok oparty na
        progu w proporcjach 60&nbsp;% / 35&nbsp;% / 5&nbsp;% daje 0,93. Te same
        godziny w tygodniu, trzy zupełnie różne tygodnie.
      </p>

      <h2>Jednostki czy minuty</h2>
      <p>
        80/20 Seilera liczy jednostki treningowe. Czas w strefach daje inny
        obraz, bo ciężka jednostka to głównie rozgrzewka, przerwy i schłodzenie.
        70-minutowy trening 5 × 4' w tempie na 3–5 km zawiera 20 minut pracy, a
        ponieważ tętno nie nadąża za tempem, w strefie 3 rejestruje się jeszcze
        mniej. Seiler i Kjerland (2006) zmierzyli to na oba sposoby u jedenastu
        juniorów w biegach narciarskich przez 32 dni: według tętna ich jednostki
        wytrzymałościowe rozkładały się 75&nbsp;% / 8&nbsp;% / 17&nbsp;% między
        trzy strefy, a session RPE dało niemal ten sam wynik. Cztery spokojne
        godzinne biegi plus ten trening interwałowy to tydzień 80/20 według
        jednostek, ale tylko 20 z jego 310 minut, około 6&nbsp;%, jest ciężkich.
        Żadne podejście nie jest błędne, tylko porównuj podobne z podobnym.
      </p>

      <h2>Jak to wykorzystać</h2>
      <p>
        Dla biegacza z pięcioma lub sześcioma treningami w tygodniu tydzień
        spolaryzowany może wyglądać tak: trzy lub cztery spokojne biegi i długie
        wybieganie, wszystko poniżej pierwszego progu, plus jedna lub dwie
        ciężkie jednostki, na przykład 5 × 4' lub 6 × 3' w tempie na 3–5 km z
        przerwami w truchcie o tej samej długości. Spokojne dni muszą pozostać
        spokojne, co dla większości oznacza wolniej, niż by chcieli; ustal górną
        granicę za pomocą{' '}
        <Link href="/pl/tools/heart-rate-zones">kalkulatora stref tętna</Link>{' '}
        albo testu rozmowy. Statystyki OpenAthlete pokazują udział treningu
        poniżej, pomiędzy i powyżej Twoich progów, co wystarcza, żeby sprawdzić,
        jaki tydzień faktycznie masz za sobą.
      </p>

      <h2>Ograniczenia</h2>
      <p>
        Najmocniejsze wsparcie z badań kontrolowanych daje praca Stöggla i
        Sperlicha (2014): 48 dobrze wytrenowanych biegaczy, kolarzy,
        triathlonistów i narciarzy przez dziewięć tygodni realizowało jeden z
        czterech programów, a grupa spolaryzowana poprawiła VO2peak o
        11,7&nbsp;% i czas do wyczerpania o 17,4&nbsp;%, bardziej niż grupy
        objętościowa, progowa i interwałowa. Dziewięć tygodni i 48 zawodników
        podzielonych na cztery grupy to krótkie i małe badanie, a uczestnicy
        byli już w dobrej formie. Sam Seiler (2010) przedstawia wzorzec 80/20
        jako opisowy: to rozkład, do którego dochodzą skuteczni zawodnicy, a nie
        dowód, że jest optymalny dla każdego. Biegacz z czterema godzinami
        tygodniowo może zyskać więcej na odrobinie pracy progowej niż na ścisłej
        polaryzacji; to pytanie wciąż pozostaje otwarte. Wreszcie strefy zależą
        od progów, które trzeba zbadać lub oszacować, a błąd o 10 uderzeń na
        minutę przesuwa minuty z jednej strefy do drugiej.
      </p>
    </div>
  );
}
