import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentPl() {
  return (
    <div>
      <p>
        Twoje serce nie bije jak metronom. Przy 50 bpm średni odstęp między
        uderzeniami to 1,2 sekundy, ale jeden odstęp może mieć 1150 ms, a
        następny 1240 ms. Zmienność rytmu serca (HRV, ang. heart rate
        variability) mierzy właśnie tę zmienność. Większość szybkiej części,
        zmieniającej się z uderzenia na uderzenie, pochodzi od nerwu błędnego,
        przywspółczulnego „hamulca” serca, więc HRV to okno, wąskie i
        zaszumione, na to, jak Twój autonomiczny układ nerwowy radzi sobie z
        treningiem, snem, chorobą i stresem.
      </p>

      <h2>Jak liczy się HRV</h2>
      <p>
        Wskaźników HRV są dziesiątki (większość wymienia raport Task Force z
        1996 roku). Sportowcy i ich zegarki używają głównie rMSSD, czyli
        pierwiastka ze średniej kwadratów kolejnych różnic między odstępami
        między uderzeniami (odstępami RR):
      </p>
      <Formula
        where={[
          'RRi = czas między dwoma kolejnymi uderzeniami, w milisekundach',
          'N = liczba odstępów w zapisie',
        ]}
      >
        rMSSD = √( Σ (RRi+1 − RRi)² / (N − 1) )
      </Formula>
      <p>
        rMSSD dobrze odzwierciedla aktywność nerwu błędnego i nadaje się do
        krótkich zapisów: kilka minut na leżąco po przebudzeniu albo okna
        głębokiego snu, które zegarek wybiera w nocy. Ponieważ dzienne wartości
        mają skośny rozkład (kilka bardzo wysokich nocy podbija zwykłą średnią),
        badania treningowe zwykle biorą najpierw logarytm naturalny, ln rMSSD, a
        dopiero potem uśredniają.
      </p>

      <h2>Przykład z liczbami</h2>
      <p>Weźmy pięć kolejnych odstępów RR: 1000, 1050, 980, 1020 i 990 ms.</p>
      <ul>
        <li>Kolejne różnice: +50, −70, +40, −30 ms</li>
        <li>Kwadraty: 2500 + 4900 + 1600 + 900 = 9900</li>
        <li>Średnia z 4 różnic: 9900 / 4 = 2475</li>
        <li>rMSSD = √2475 = 49,7 ms, więc ln rMSSD = 3,91</li>
      </ul>
      <p>
        Prawdziwy zapis ma setki odstępów, ale rachunek jest ten sam. Teraz
        tydzień nocnych pomiarów: 62, 58, 65, 48, 60, 63 i 59 ms. Średnia ich
        logarytmów to 4,08, co po przeliczeniu z powrotem daje 59 ms. Noc z 48
        ms po niedzielnym długim wybieganiu wygląda sama w sobie niepokojąco, a
        ledwo rusza wynik tygodniowy. Jeśli następny tydzień to 52, 49, 55, 50,
        47, 51 i 48 ms, wartość 7-dniowa spada do 3,92 (50 ms). To trwałe
        przesunięcie i warto zadać sobie pytanie, skąd się wzięło.
      </p>

      <h2>Jak wykorzystać HRV w treningu</h2>
      <p>
        Pojedynczy poranny wynik mówi niewiele. Plews i współpracownicy (2013)
        pokazali, że u wyczynowych sportowców wytrzymałościowych kroczący
        7-dniowy średni ln rMSSD, i to, jak bardzo się waha, znacznie lepiej
        śledzi adaptację niż pojedyncze pomiary. Praktyczny schemat:
      </p>
      <ul>
        <li>
          Mierz codziennie tak samo: w nocy tym samym zegarkiem albo po
          przebudzeniu, na leżąco, przed kawą.
        </li>
        <li>
          Zbuduj punkt odniesienia z co najmniej trzech, czterech tygodni
          normalnego treningu i określ wokół niego swój zwykły zakres.
        </li>
        <li>
          Czytaj średnią 7-dniową na tle tego zakresu, razem z tętnem
          spoczynkowym, snem i odczuciami z treningów.
        </li>
      </ul>
      <p>
        Kiviniemi i współpracownicy (2007) poszli dalej: jedna grupa
        umiarkowanie wytrenowanych mężczyzn robiła mocne treningi tylko w dni, w
        których HRV nie spadło, a w pozostałe biegała spokojnie. Poprawili
        maksymalną prędkość biegu bardziej niż grupa trzymająca się stałego
        planu. To użyteczny pomysł, ale jedno badanie na małych grupach, a nie
        reguła. Dla większości sportowców HRV najlepiej działa jako powód, by
        przyjrzeć się tygodniowi uważniej: jeśli średnia 7-dniowa od tygodnia
        leży poniżej Twojego zakresu, tętno spoczynkowe wzrosło, a 5 × 4' na
        progu przypominało zawody, zrób spokojny dzień.
      </p>
      <p>
        OpenAthlete importuje nocne HRV z Garmina, Polara, Suunto i COROS (albo
        możesz wpisać je ręcznie), pokazuje wartość z ostatniej nocy w dziennym
        wierszu samopoczucia w kalendarzu i rysuje kroczącą 7-dniową średnią ln
        rMSSD w statystykach regeneracji. Pokazuje trend; nie zamienia go we
        wskaźnik gotowości.
      </p>

      <h2>Ograniczenia</h2>
      <p>
        Wartości bezwzględne są indywidualne: u zdrowych, wytrenowanych osób
        wahają się od poniżej 30 do ponad 100 ms, więc porównywanie się z
        partnerem treningowym nie ma sensu. Urządzenia też się różnią. Jedne
        podają rMSSD z całej nocy, inne z okna 5-minutowego, jeszcze inne własny
        wskaźnik; zmiana zegarka zeruje Twój punkt odniesienia. Alkohol, późny
        posiłek, upał, podróże i cykl menstruacyjny przesuwają HRV bez związku z
        treningiem. Wyżej też nie zawsze znaczy lepiej: Buchheit (2014) zwraca
        uwagę, że u bardzo dobrze wytrenowanych sportowców HRV może przestać
        rosnąć, a nawet spadać przy ciężkim treningu, choć dobrze się adaptują,
        a gwałtowny wzrost może towarzyszyć głębokiemu zmęczeniu. HRV to jeden
        sygnał spośród innych; czytaj je razem z{' '}
        <Link href="/pl/learn/session-rpe">tym, jak ciężkie były treningi</Link>{' '}
        i z{' '}
        <Link href="/pl/learn/ctl-atl-tsb">
          krzywymi obciążenia treningowego
        </Link>
        , nigdy osobno.
      </p>
    </div>
  );
}
