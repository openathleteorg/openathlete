import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentPl() {
  return (
    <div>
      <p>
        VMA to skrót od <em>vitesse maximale aérobie</em>, czyli maksymalnej
        prędkości tlenowej. Anglojęzyczne publikacje nazywają ją MAS lub
        vVO2max: to najniższa prędkość biegu, przy której pobór tlenu osiąga
        swój pułap, czyli Twoje <Link href="/pl/learn/vo2max">VO2max</Link>.
        Biegnij szybciej, a dodatkowa energia musi pochodzić ze źródeł
        beztlenowych, dlatego większość biegaczy utrzymuje VMA tylko przez 4–8
        minut. Termin pochodzi z francuskiej szkoły treningu, gdzie od testu
        bieżniowego Luca Légera z 1980 roku i prac Véronique Billat z lat 90.
        stanowi podstawę treningu interwałowego. Jego zaleta jest praktyczna:
        VO2max to liczba z laboratorium w mililitrach, a VMA to prędkość, którą
        możesz pobiec na stadionie.
      </p>

      <h2>Jak oblicza się VMA</h2>
      <p>
        Najbardziej bezpośrednią metodą terenową jest test 6-minutowy (pół
        Coopera). Po 20 minutach rozgrzewki z kilkoma przebieżkami biegniesz jak
        najdalej przez 6 minut, w równym tempie. Sześć minut mieści się w
        czasie, przez który większość biegaczy utrzymuje VMA, więc Twoja średnia
        prędkość dobrze ją przybliża:
      </p>
      <Formula
        where={[
          'dystans w metrach, czas w minutach; × 0,06 przelicza m/min na km/h',
        ]}
      >
        VMA (km/h) = dystans / czas × 0,06
      </Formula>
      <p>
        12-minutowy test Coopera łatwiej rozłożyć tempem, ale daje nieco
        zaniżony wynik, bo prawie każdy zwalnia po 6–7 minutach przy tej
        prędkości. Testy progresywne (test bieżniowy Légera i Bouchera, VAMEVAL)
        podnoszą prędkość o 0,5 lub 1 km/h w regularnych odstępach, aż nie
        jesteś w stanie dotrzymać tempa; ostatni ukończony etap wyznacza VMA.
        Wymagają stadionu, pachołków i nagrania z sygnałami, ale eliminują
        problem rozkładania tempa.
      </p>
      <p>
        Możesz też wyjść od niedawnego startu. Każdy dystans biegnie się przy
        typowej części VMA: około 95&nbsp;% na 5 km, 90&nbsp;% na 10 km,
        85&nbsp;% w półmaratonie i 80&nbsp;% w maratonie. Podziel średnią
        prędkość ze startu przez tę część. Płaskie 5 lub 10 km dają lepsze
        oszacowanie niż maraton, w którym odżywianie i upał ważą więcej niż moc
        tlenowa.
      </p>

      <h2>Przykład z obliczeniami</h2>
      <ul>
        <li>Test 6-minutowy: 1500 m → 1500 / 6 × 0,06 = 15,0 km/h (4:00/km)</li>
        <li>Test Coopera, ten sam biegacz: 2900 m w 12 minut → 14,5 km/h</li>
        <li>
          10 km w 45:00: średnia prędkość 13,33 km/h, podzielona przez 0,90 →
          14,8 km/h
        </li>
      </ul>
      <p>
        Trzy metody, trzy odpowiedzi w granicach 0,5 km/h. Taki rozrzut jest
        normalny i przypomina, że VMA to oszacowanie z marginesem błędu, a nie
        stała cecha jak wzrost. Weź 15 km/h i zbuduj na tej podstawie tempa:
      </p>
      <ul>
        <li>100&nbsp;% VMA: 15,0 km/h, 4:00/km, 125 m w 30 sekund</li>
        <li>95&nbsp;%: 14,25 km/h, 4:13/km</li>
        <li>85&nbsp;% (u wielu biegaczy okolice progu): 12,75 km/h, 4:42/km</li>
        <li>
          65–75&nbsp;% (spokojne bieganie): 9,75–11,25 km/h, od 6:09 do 5:20/km
        </li>
      </ul>

      <h2>Jak wykorzystać VMA w treningu</h2>
      <p>
        VMA to miarka do treningów interwałowych. Klasyczne formaty na jej
        poziomie lub w pobliżu: 30/30 (30 sekund na 100&nbsp;% VMA, 30 sekund
        spokojnego truchtu) powtórzone 10–20 razy, 6 × 1000 m na 95&nbsp;% z
        2-minutową przerwą, 5 × 3 minuty na 95–100&nbsp;%. Billat wykazała, że
        czas do wyczerpania przy VMA bardzo się różni u biegaczy na tym samym
        poziomie (Billat i Koralsztein, 1996), dlatego krótkie powtórzenia z
        krótkimi przerwami pozwalają zebrać więcej minut na tej intensywności
        niż jeden długi wysiłek.
      </p>
      <p>
        Poniżej VMA procenty stają się mniej wiarygodne. Dwóch biegaczy z VMA 15
        km/h może mieć próg na 82&nbsp;% i na 90&nbsp;% VMA, zależnie od
        wytrzymałości i historii treningowej. Przy biegach w tempie i długich
        wybieganiach lepszym przewodnikiem jest często tętno (zobacz{' '}
        <Link href="/pl/tools/heart-rate-zones">kalkulator stref tętna</Link>)
        albo tempa wyliczone ze startów, takie jak{' '}
        <Link href="/pl/learn/vdot">VDOT</Link>.{' '}
        <Link href="/pl/tools/vma">Kalkulator VMA</Link> zamienia test albo
        start w tempa, a <Link href="/pl/pace-charts">tabele temp</Link>{' '}
        przeliczają je na każdy kilometr.
      </p>
      <p>
        W OpenAthlete VMA jest jednym z Twoich wskaźników możliwości. Kroki
        treningu mogą celować w jej procent (na przykład 95&nbsp;% VMA), a
        trening trafia potem z prawdziwymi tempami na zegarki Garmin, Suunto lub
        COROS.
      </p>

      <h2>Ograniczenia</h2>
      <p>
        VMA zależy od testu: bieżnia mechaniczna, stadion, pagórkowata droga i
        wietrzny dzień dają różne liczby, a źle rozłożone 6 minut może kosztować
        0,5 km/h. VMA łączy też dwie rzeczy, VO2max i ekonomię biegu: dwóch
        biegaczy z tym samym VO2max może mieć VMA różniące się o 1–2 km/h, jeśli
        jeden biega ekonomiczniej. Wreszcie VMA mówi niewiele o wytrzymałości.
        Biegacz z wysoką VMA i małym kilometrażem osłabnie w półmaratonie, który
        biegacz z niższą VMA i większym kilometrażem utrzyma bez trudu. Używaj
        jej do ustalania temp interwałów, powtarzaj test co dwa, trzy miesiące,
        a resztę niech powiedzą Ci starty.
      </p>
    </div>
  );
}
