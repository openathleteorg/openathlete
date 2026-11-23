import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentPl() {
  return (
    <div>
      <p>
        Rezerwa tętna to zakres, w którym Twoje serce faktycznie pracuje: tętno
        maksymalne minus tętno spoczynkowe. Biegacz z tętnem spoczynkowym 50 i
        maksymalnym 190 ma 140 uderzeń rezerwy. Strefy treningowe oparte na tym
        zakresie, a nie na zwykłym procencie tętna maksymalnego, to właśnie to,
        co większość ludzi nazywa metodą Karvonena, od fińskiego fizjologa
        Marttiego Karvonena, który użył jej w badaniu z 1957 roku nad tym, jak
        trening obniża tętno.
      </p>
      <p>
        Jej zaletą jest to, że uwzględnia punkt wyjścia. Dwóch biegaczy z tym
        samym tętnem maksymalnym, ale różnym spoczynkowym nie ma tego samego
        spokojnego tempa w uderzeniach na minutę, a rezerwa to widzi. Lepiej też
        zgadza się z fizjologią niż procenty tętna maksymalnego: Swain i
        Leutholtz (1997) pokazali, że dany procent rezerwy tętna odpowiada temu
        samemu procentowi rezerwy poboru tlenu, natomiast procent tętna
        maksymalnego nie odpowiada temu samemu procentowi VO2max.
      </p>

      <h2>Jak się ją liczy</h2>
      <Formula
        where={[
          'HRR = HRmax − HRspocz, w uderzeniach na minutę',
          'intensywność = żądana część rezerwy, 0,6 dla 60 %',
        ]}
      >
        tętno docelowe = HRspocz + (HRmax − HRspocz) × intensywność
      </Formula>
      <p>
        Typowe pięć stref to pasma po 10 % rezerwy: 50–60 %, 60–70 %, 70–80 %,
        80–90 % i 90–100 %. Te procenty to konwencje, a nie progi zmierzone u
        Ciebie, co będzie miało znaczenie dalej.
      </p>

      <h2>Przykład z liczbami</h2>
      <p>
        Tętno spoczynkowe 50 bpm, maksymalne 190 bpm, czyli rezerwa 140 uderzeń.
      </p>
      <ul>
        <li>Strefa 1 (50–60 %): 50 + 0,5 × 140 = 120 do 134 bpm</li>
        <li>Strefa 2 (60–70 %): 134 do 50 + 0,7 × 140 = 148 bpm</li>
        <li>Strefa 3 (70–80 %): 148 do 162 bpm</li>
        <li>Strefa 4 (80–90 %): 162 do 176 bpm</li>
        <li>Strefa 5 (90–100 %): 176 do 190 bpm</li>
      </ul>
      <p>
        Przy procentach tętna maksymalnego ta sama strefa 2 wynosiłaby 114 do
        133 bpm, dobre 15 uderzeń mniej. Dla wytrenowanego biegacza 114 bpm to
        ledwie trucht, dlatego osoby przechodzące na metodę Karvonena często
        stwierdzają, że ich spokojne biegi przestają przypominać spacer.
      </p>
      <p>
        Zostawmy teraz tętno maksymalne na 190, ale podnieśmy spoczynkowe do 65.
        Rezerwa spada do 125 uderzeń, a strefa 2 to 65 + 0,6 × 125 = 140 do 65 +
        0,7 × 125 = 152,5, czyli mniej więcej 140 do 153 bpm. To samo tętno
        maksymalne, inna strefa, bo przesunął się punkt wyjścia.
      </p>

      <h2>Jak dobrze ustalić obie wartości</h2>
      <p>
        Tętno spoczynkowe najlepiej mierzyć na leżąco zaraz po przebudzeniu,
        przed kawą, przez kilka poranków; weź typową wartość, a nie najniższą,
        jaką kiedykolwiek zanotował zegarek. Zegarki często podają minimum ze
        snu, które bywa o kilka uderzeń niższe i nieco zawyża rezerwę.
      </p>
      <p>
        Trudniejsze jest tętno maksymalne. Najwyższa wartość z końcówki ciężkich
        zawodów albo po ostatnim z serii mocnych podbiegów jest warta więcej niż
        jakikolwiek wzór. Jeśli nie masz nic, Tanaka, Monahan i Seals (2001)
        podają 208 − 0,7 × wiek, czyli 180 bpm w wieku 40 lat. To średnia
        populacyjna: wiele osób odbiega od niej o 10 uderzeń lub więcej w każdą
        stronę, a tętno maksymalne zawyżone o 10 uderzeń przesuwa każdą strefę w
        górę o około 6 do 9 uderzeń.
      </p>

      <h2>Jak wykorzystać ją w treningu</h2>
      <p>
        Strefy tętna działają najlepiej przy długich, równych wysiłkach, gdy
        serce ma czas się ustabilizować. Spokojne biegi i długie wybiegania w{' '}
        <Link href="/pl/learn/zone-2">strefie 2</Link> to oczywisty przypadek:
        dla biegacza z przykładu 134 do 148 bpm, niezależnie od tempa w
        pagórkowaty czy wietrzny dzień. Biegi tempowe po 30 do 40 minut w
        strefie 3 albo 2 × 15 minut przy górnej granicy strefy 4 (około 169 do
        173 bpm, 85–88 % rezerwy) też łatwo prowadzić na tętnie.
      </p>
      <p>
        Przy krótkich interwałach, takich jak 5 × 4 minuty na progu, tętno nie
        nadąża za wysiłkiem: potrzebuje minuty lub dwóch, żeby wzrosnąć, i
        pierwsze powtórzenie wygląda na zegarku na łatwe, choć takie nie jest.
        Prowadź je tempem albo mocą, a tętna użyj potem, żeby sprawdzić, czy
        trening zrobił to, co miał. Ten sam ułamek rezerwy zasila też wskaźniki
        obciążenia, takie jak <Link href="/pl/learn/trimp">TRIMP</Link>, więc
        dobre ustalenie tętna spoczynkowego i maksymalnego opłaca się podwójnie.
      </p>
      <p>
        <Link href="/pl/tools/heart-rate-zones">Kalkulator stref tętna</Link>{' '}
        wykonuje obliczenia dla obu metod. W OpenAthlete strefy tętna można
        ustawić jako procent tętna maksymalnego albo rezerwy, rezerwa jest
        liczona z Twoich metryk tętna spoczynkowego i maksymalnego, a kroki
        treningu mogą celować w procent rezerwy tętna.
      </p>

      <h2>Ograniczenia</h2>
      <p>
        Wszystko opiera się na dwóch danych wejściowych i obie są zaszumione.
        Tętno spoczynkowe zmienia się o kilka uderzeń zależnie od snu, stresu,
        upału czy nadchodzącego przeziębienia; tętno podczas wysiłku rośnie z
        upałem, odwodnieniem, kofeiną i wysokością, a przy długich wysiłkach
        dryfuje w górę. Niektóre leki, zwłaszcza beta-blokery, zmieniają oba
        końce zakresu.
      </p>
      <p>
        Większym ograniczeniem jest to, że 60, 70 czy 80 % rezerwy są takie same
        dla wszystkich, a fizjologia nie.{' '}
        <Link href="/pl/learn/lactate-threshold">Próg mleczanowy</Link> jednego
        biegacza leży na 82 % rezerwy, innego na 90 %. Jeśli znasz swoje tętno
        progowe z badania laboratoryjnego albo z 30-minutowego wysiłku
        startowego, oparcie na nim stref jest dokładniejsze. Gdy go nie znasz,
        metoda Karvonena to rozsądny punkt wyjścia.
      </p>
    </div>
  );
}
