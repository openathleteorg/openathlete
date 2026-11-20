import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentPl() {
  return (
    <div>
      <p>
        VO2max to najwyższe tempo, w jakim możesz pobierać tlen z powietrza i
        wykorzystywać go w mięśniach. Mierzy się je w litrach na minutę albo, co
        dla biegaczy bardziej przydatne, w mililitrach na kilogram na minutę, bo
        cięższe ciało kosztuje więcej w transporcie. A. V. Hill opisał plateau
        poboru tlenu w latach 20. XX wieku i od tamtej pory VO2max jest
        najważniejszą liczbą fizjologii wysiłków wytrzymałościowych. Określa
        wielkość Twojego silnika tlenowego. Samo w sobie nie przesądza jednak o
        tym, jak szybko biegasz na zawodach.
      </p>

      <h2>Co wyznacza VO2max: równanie Ficka</h2>
      <p>
        Pobór tlenu to iloczyn ilości krwi pompowanej przez serce i ilości
        tlenu, jaką mięśnie z niej wyciągają:
      </p>
      <Formula
        where={[
          'Q = pojemność minutowa serca (litry krwi na minutę) = tętno × objętość wyrzutowa',
          'CaO2 − CvO2 = zawartość tlenu we krwi tętniczej minus w żylnej (ml O2 na litr krwi)',
        ]}
      >
        VO2 = Q × (CaO2 − CvO2)
      </Formula>
      <p>
        Przy maksymalnym wysiłku ekstrakcja tlenu różni się między osobami
        wytrenowanymi i niewytrenowanymi mniej niż pojemność minutowa serca, a
        tętno maksymalne nie rośnie pod wpływem treningu. To, co odróżnia 40 od
        70, to głównie objętość wyrzutowa, czyli ilość krwi wypychanej przy
        każdym uderzeniu. Dlatego Bassett i Howley (2000) wnioskują, że u
        wytrenowanych sportowców VO2max ogranicza przede wszystkim dostarczanie
        tlenu, a nie mięśnie.
      </p>

      <h2>Jak się je mierzy lub szacuje</h2>
      <p>
        Punktem odniesienia jest test laboratoryjny: bieg z narastającą
        prędkością na bieżni mechanicznej, w masce analizującej wdychane i
        wydychane powietrze, aż pobór tlenu przestanie rosnąć mimo wyższej
        prędkości. Wszystko inne to oszacowania:
      </p>
      <ul>
        <li>
          Test Coopera (Cooper, 1968): dystans przebiegnięty w 12 minut, potem
          VO2max = (dystans w metrach − 504,9) / 44,73.
        </li>
        <li>
          Stosunek tętna (Uth i wsp., 2004): VO2max ≈ 15,3 × HRmax / HRspocz.
          Szybki, ale wymaga prawdziwego tętna maksymalnego i ignoruje to, jak
          szybko faktycznie biegasz.
        </li>
        <li>
          Wyniki startów: <Link href="/pl/learn/vdot">VDOT</Link> Danielsa
          zamienia czas startu w „efektywne” VO2max, które uwzględnia Twoją
          ekonomię biegu.
        </li>
        <li>
          Zegarki: Garmin, Polar, COROS i inne szacują je z relacji tętna do
          tempa lub mocy podczas biegów, za pomocą modeli, których w pełni nie
          publikują.
        </li>
      </ul>

      <h2>Przykład z obliczeniami</h2>
      <p>
        Weźmy biegacza, który w teście Coopera pokonuje 2900 m, ma tętno
        spoczynkowe 48 i maksymalne 188, a niedawno przebiegł 10 km w 45:00.
      </p>
      <ul>
        <li>Cooper: (2900 − 504,9) / 44,73 = 53,5 ml/kg/min</li>
        <li>Stosunek tętna: 15,3 × 188 / 48 = 59,9 ml/kg/min</li>
        <li>VDOT z 10 km: 45,3</li>
      </ul>
      <p>
        Trzy liczby od 45 do 60 dla tej samej osoby. Żadna nie jest błędna;
        mierzą różne rzeczy. Metoda stosunku tętna patrzy tylko na serce, test
        Coopera na 12-minutowy wysiłek, VDOT na to, co biegacz faktycznie
        wytwarza przez 45 minut. Taka różnica zwykle oznacza, że biegacz ma
        przyzwoity silnik i zapas do poprawy w ekonomii i wytrzymałości.
      </p>
      <p>
        W wersji laboratoryjnej podstaw wiarygodne wartości: pojemność minutowa
        25 litrów na minutę i ekstrakcja 160 ml tlenu na litr krwi dają 4000
        ml/min, czyli 57 ml/kg/min u biegacza ważącego 70 kg.
      </p>

      <h2>VO2max, VMA i ekonomia biegu</h2>
      <p>
        Na płaskim terenie bieg kosztuje około 3,5 ml/kg/min tlenu na każdy km/h
        prędkości (Léger i Mercier, 1984). Podziel VO2max przez ten koszt, a
        otrzymasz przybliżoną{' '}
        <Link href="/pl/learn/vma">VMA (maksymalną prędkość tlenową)</Link>:
        53,5 / 3,5 ≈ 15,3 km/h, blisko 15 km/h, które ten biegacz uzyskuje w
        teście 6-minutowym. Biegacz zużywający mniej tlenu na każdy km/h, czyli
        bardziej ekonomiczny, osiąga wyższą prędkość przy tym samym VO2max.
        Joyner i Coyle (2008) opisują wydolność wytrzymałościową jako trzy
        współdziałające czynniki: VO2max, część VO2max, którą da się utrzymać
        (powiązaną z progiem mleczanowym), i ekonomię.
      </p>

      <h2>Jak wykorzystać to w treningu</h2>
      <p>
        VO2max reaguje na pracę blisko niego: 4–6 powtórzeń po 3–5 minut na
        95–100&nbsp;% VMA, z przerwami mniej więcej tej samej długości, albo
        krótsze formaty, takie jak 30/30. Rośnie też dzięki spokojnej objętości,
        przez zwiększenie objętości wyrzutowej. Do ustalania temp
        praktyczniejsze są VMA i VDOT, bo to prędkości. W OpenAthlete VO2max to
        wskaźnik, który można zaimportować z Garmina, Polara lub COROS albo
        wpisać ręcznie, i śledzić na stronie wskaźników obok{' '}
        <Link href="/pl/learn/hrv">HRV</Link> i tętna spoczynkowego.{' '}
        <Link href="/pl/tools/vma">Kalkulator VMA</Link> poda Ci tempa.
      </p>

      <h2>Ograniczenia</h2>
      <p>
        Wśród biegaczy na podobnym poziomie VO2max słabo przewiduje wyniki
        startów: ekonomia i utrzymywana część znaczą tyle samo. Wartości z
        zegarka zmieniają się z upałem, podbiegami, zmęczeniem i błędnym tętnem
        maksymalnym, więc czytaj je jako trend na przestrzeni tygodni. Geny
        wyznaczają dużą część sufitu, a postępy zwalniają po pierwszych latach
        treningu, podczas gdy próg i ekonomia mogą się poprawiać jeszcze długo.
      </p>
    </div>
  );
}
