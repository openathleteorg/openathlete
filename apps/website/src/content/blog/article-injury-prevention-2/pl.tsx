import Link from 'next/link';

import { Sources } from './sources';

export function ContentPl() {
  return (
    <div>
      <p>
        Od dwóch miesięcy biegasz około 40 km tygodniowo. Maraton masz za 16
        tygodni i chciałbyś, żeby twoje największe tygodnie dobiły do 70 km. Ten
        artykuł mówi o tym, jak dojść od jednej liczby do drugiej, nie spędzając
        9. tygodnia z woreczkiem lodu na piszczeli. Jest celowo praktyczny: o
        tym, co badania mówią, a czego nie mówią o obciążeniu i kontuzjach,
        przeczytasz w artykule{' '}
        <Link href="/pl/blog/preventing-training-injuries">
          kontuzje biegowe i obciążenie treningowe
        </Link>
        .
      </p>

      <h2>Zasada 10 % to wymyślony sufit</h2>
      <p>
        Nikt dokładnie nie wie, skąd wzięła się zasada 10 %, a sprawdzano ją
        rzadziej, niż sugerowałaby jej sława. Gdy holenderscy badacze dali 532
        początkującym biegaczom albo standardowy plan na 8 tygodni, albo
        wolniejszy plan na 13 tygodni oparty na wzrostach o 10 %, odsetek
        kontuzji był taki sam: mniej więcej co piąty biegacz w każdej grupie
        (Buist i in., 2008). Duńska kohorta 874 początkujących wykazała możliwy
        sygnał dopiero powyżej 30 % w ciągu dwóch tygodni, i nawet to było na
        granicy (Nielsen i in., 2014).
      </p>
      <p>
        Zasada zawodzi też w obie strony. Przy małej objętości jest absurdalnie
        wolna: 20 km tygodniowo zamienia się w 22. Przy większej objętości,
        stosowana co tydzień bez przerwy, narasta lawinowo. Czterdzieści
        kilometrów plus 10 % tygodniowo przez dziesięć tygodni daje 104 km. Nikt
        nie powinien tego robić, a jednak tak mówi zasada.
      </p>
      <p>
        To, co faktycznie wspierają dowody i konsensus MKOl dotyczący obciążenia
        (Soligard i in., 2016), to ogólna idea: zwiększać stopniowo, unikać
        nagłych dużych skoków i dopasowywać się do osoby, którą masz przed sobą.
        Reszta to trenerski osąd i tak też ją oznaczam.
      </p>

      <h2>Jak zamiast tego buduję objętość</h2>
      <p>
        <strong>Stopień, potem utrzymanie.</strong> Dołóż porcję, na przykład 4
        do 6 km albo 30 minut, a potem zostań na tym poziomie przez tydzień czy
        dwa przed kolejnym stopniem. Z mojego doświadczenia biegacze lepiej
        przyswajają poziom, który powtórzyli, niż nowy rekord co tydzień. To
        obserwacja, a nie wynik badań.
      </p>
      <p>
        <strong>Lżejszy tydzień co trzeci albo czwarty.</strong> Zmniejsz
        objętość mniej więcej o jedną czwartą do jednej trzeciej i zachowaj
        jeden krótki mocny trening, na przykład 6 × 1&apos; szybko w środę, żeby
        nie wejść w kolejny blok bez energii. Za dokładnym procentem nie stoi
        żadne mocne badanie. Za nawykiem planowania tego tygodnia, zanim będzie
        potrzebny, już tak.
      </p>
      <p>
        <strong>Jedna nowość naraz.</strong> Nie dokładaj 6 km w tym samym
        tygodniu, w którym robisz pierwszy w sezonie trening na bieżni, pierwszy
        długi, pagórkowaty bieg w terenie albo zakładasz nową parę butów z
        mniejszym dropem. Badanie Run Clever wykazało podobny odsetek kontuzji
        niezależnie od tego, czy zwiększano intensywność, czy objętość (Ramskov
        i in., 2018). Zwiększania obu naraz nie badano, a ja nie zgłosiłbym się
        na ochotnika, żeby to sprawdzić.
      </p>
      <p>
        <strong>Rozwijaj długie wybieganie osobnym torem.</strong> Za każdym
        razem, gdy się wydłuża, dziesięć do piętnastu minut więcej, a na
        początku budowania nie więcej niż około jedna trzecia tygodnia. Biegacz
        robiący 40 km tygodniowo, w tym 25 km na długim wybieganiu, wkłada
        większość tygodnia w jeden trening.
      </p>
      <p>
        <strong>Licz to, co naprawdę cię obciąża.</strong> Na asfalcie kilometry
        są przyzwoitym przybliżeniem. W terenie licz czas i przewyższenie: 1000
        m zbiegu w tygodniu to obciążenie, którego nie oddaje żadna liczba
        kilometrów, a twoje mięśnie czworogłowe zgłoszą je z dwudniowym
        opóźnieniem.
      </p>
      <p>
        <strong>Szanuj przerwy.</strong> Po kilku dniach wolnego po prostu
        kontynuuj. Po dwóch czy trzech tygodniach przerwy zaczynam od nowa od
        połowy do dwóch trzecich poprzedniej objętości i odbudowuję ją przez
        trzy albo cztery tygodnie. Twoja średnia z ostatnich tygodni spadła,
        nawet jeśli twoje wspomnienie o niej nie.
      </p>

      <h2>Przykład na 16 tygodni</h2>
      <p>
        Tak mogłoby wyglądać budowanie od 40 do 70 km. Czasy długich wybiegań
        zakładają spokojne tempo około 6:00 na km.
      </p>
      <table>
        <thead>
          <tr>
            <th>Tydzień</th>
            <th>Objętość</th>
            <th>Długie wybieganie</th>
            <th>Uwagi</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td>40 km</td>
            <td>1h20</td>
            <td>Obecny poziom</td>
          </tr>
          <tr>
            <td>2</td>
            <td>44 km</td>
            <td>1h30</td>
            <td>Pierwszy stopień</td>
          </tr>
          <tr>
            <td>3</td>
            <td>44 km</td>
            <td>1h30</td>
            <td>Utrzymanie</td>
          </tr>
          <tr>
            <td>4</td>
            <td>34 km</td>
            <td>1h15</td>
            <td>Lżejszy tydzień</td>
          </tr>
          <tr>
            <td>5</td>
            <td>48 km</td>
            <td>1h40</td>
            <td></td>
          </tr>
          <tr>
            <td>6</td>
            <td>52 km</td>
            <td>1h45</td>
            <td></td>
          </tr>
          <tr>
            <td>7</td>
            <td>52 km</td>
            <td>1h50</td>
            <td>Utrzymanie</td>
          </tr>
          <tr>
            <td>8</td>
            <td>40 km</td>
            <td>1h30</td>
            <td>Lżejszy tydzień</td>
          </tr>
          <tr>
            <td>9</td>
            <td>56 km</td>
            <td>2h00</td>
            <td></td>
          </tr>
          <tr>
            <td>10</td>
            <td>60 km</td>
            <td>2h05</td>
            <td></td>
          </tr>
          <tr>
            <td>11</td>
            <td>60 km</td>
            <td>2h15</td>
            <td>Utrzymanie</td>
          </tr>
          <tr>
            <td>12</td>
            <td>46 km</td>
            <td>1h40</td>
            <td>Lżejszy tydzień</td>
          </tr>
          <tr>
            <td>13</td>
            <td>65 km</td>
            <td>2h20</td>
            <td></td>
          </tr>
          <tr>
            <td>14</td>
            <td>70 km</td>
            <td>2h30</td>
            <td>Szczyt</td>
          </tr>
          <tr>
            <td>15</td>
            <td>52 km</td>
            <td>1h45</td>
            <td>Tapering</td>
          </tr>
          <tr>
            <td>16</td>
            <td>30 km + zawody</td>
            <td>Zawody</td>
            <td>Tydzień startowy</td>
          </tr>
        </tbody>
      </table>
      <p>
        Spójrz na 5. tydzień. W porównaniu z lżejszym 4. tygodniem to skok o 41
        %, który w aplikacji opartej na wskaźnikach obciążenia uruchomiłby
        wszystkie alarmy. W porównaniu z tygodniami 2 i 3, czyli poziomem, na
        którym biegacz faktycznie trenował, to 9 %. Porównuj nowy tydzień z
        treningiem sprzed tygodnia regeneracyjnego, a nie z samym tygodniem
        regeneracyjnym.
      </p>
      <p>
        Zwróć też uwagę na to, czego plan nie robi: nigdy nie zwiększa objętości
        i nie wprowadza nowego rodzaju treningu w tym samym tygodniu, a szczyt
        wypada dwa tygodnie przed startem, a nie tydzień. Jeśli twoje docelowe
        zawody to pagórkowaty bieg terenowy, zamień kilometry na godziny i dodaj
        kolumnę z przewyższeniem.
      </p>

      <h2>Z czym porównywać tydzień</h2>
      <p>
        Jeśli chcesz jednej liczby, porównaj ten tydzień ze średnią z trzech czy
        czterech poprzednich tygodni, nie wliczając bieżącego tygodnia do tej
        średniej. Traktuj ją jako sygnał, żeby przyjrzeć się bliżej, a nie jako
        werdykt. Popularny stosunek obciążenia ostrego do przewlekłego (ACWR) i
        jego „sweet spot” od 0,8 do 1,3 zostały mocno skrytykowane, między
        innymi właśnie za ten problem podwójnego liczenia (Impellizzeri i in.,
        2020). Nie ma zwalidowanego progu, ani dla ciebie, ani dla nikogo
        innego.
      </p>

      <h2>Kiedy utrzymać poziom albo się cofnąć</h2>
      <p>
        Przestań zwiększać, a zwykle też przestań biegać na kilka dni, jeśli ból
        zmienia sposób, w jaki biegasz, nasila się w trakcie biegu albo jest
        większy następnego ranka. Ból w jednym konkretnym punkcie kości, na
        przykład na piszczeli albo na grzbiecie stopy, zasługuje na opinię
        specjalisty przed następnym biegiem, a nie po kolejnych trzech.
      </p>
      <p>
        Utrzymaj obecny poziom albo zrób lżejszy tydzień wcześniej, jeśli
        spokojne biegi przez kilka dni z rzędu wydają się cięższe niż zwykle,
        jeśli to samo spokojne tempo kosztuje cię wyższe tętno albo jeśli
        pogorszył ci się sen. To wczesne sygnały opisane w artykule{' '}
        <Link href="/pl/blog/5-signs-of-overtraining-and-how-to-avoid-it">
          przetrenowanie i overreaching
        </Link>
        . Przesunięcie stopnia o tydzień nie kosztuje cię prawie nic. Złamanie
        zmęczeniowe kosztuje cię start.
      </p>

      <h2>Planowanie w OpenAthlete</h2>
      <p>
        Widok sezonu w OpenAthlete pozwala rozpisać budowanie takie jak powyżej
        w postaci bloków (baza, okres specjalistyczny, tapering, regeneracja), z
        twoimi zawodami na górze, a każdy tydzień pokazuje swoje obciążenie na
        tle zakresu wyliczonego z twoich ostatnich tygodni. Ten zakres to reguła
        kciuka do oceny tygodnia, a nie granica bezpieczeństwa. Kondycja,
        zmęczenie i forma są prognozowane na podstawie zaplanowanych treningów,
        więc widzisz, co lżejszy tydzień zrobi z twoją formą, zanim go
        przebiegniesz. Ból zgłoszony w opcjonalnych pytaniach po aktywności
        trafia do dziennika kontuzji, który widzi twój trener. Więcej na
        stronach{' '}
        <Link href="/pl/features/training-calendar">kalendarz treningowy</Link>{' '}
        i <Link href="/pl/features/training-load">obciążenie treningowe</Link>.
      </p>

      <h2>Źródła</h2>
      <Sources />
    </div>
  );
}
