import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentPl() {
  return (
    <div>
      <p>
        VDOT to liczba w samym sercu systemu treningowego Jacka Danielsa. Nazwa
        pochodzi od „V-dot-O2max”, czyli sposobu, w jaki fizjolodzy zapisują
        VO2max, ale nie mierzy się jej w laboratorium. Daniels i matematyk Jimmy
        Gilbert wyprowadzili ją w latach 70. z wyników startów: skoro dany
        dystans przebiegnięto w takim czasie, jakie VO2max by to wyjaśniało,
        gdyby Twoja ekonomia biegu była przeciętna? Odpowiedzią jest jeden
        wskaźnik, który określa Twoją aktualną formę biegową, przewiduje wyniki
        na innych dystansach i daje zestaw temp treningowych.
      </p>
      <p>
        Ponieważ VDOT wynika z rezultatu, zawiera już to, czego laboratoryjne
        VO2max nie uwzględnia: jak ekonomiczny jest Twój krok i jaką część
        swojego maksimum potrafisz utrzymać przez cały bieg. Te trzy czynniki
        razem wyjaśniają większość wydolności wytrzymałościowej (Joyner i Coyle,
        2008). Dlatego dwóch biegaczy z tym samym{' '}
        <Link href="/pl/learn/vo2max">VO2max</Link> może mieć VDOT różniące się
        o kilka punktów i dlatego VDOT lepiej niż VO2max przewiduje czasy
        startowe.
      </p>

      <h2>Jak oblicza się VDOT</h2>
      <p>
        Wzory Danielsa i Gilberta mają dwie części. Pierwsza podaje koszt
        tlenowy biegu z prędkością v w metrach na minutę. Druga podaje część
        VO2max, jaką biegacz może utrzymać w biegu trwającym t minut: blisko
        100&nbsp;% przez około 10 minut, około 90&nbsp;% przez 45 minut, poniżej
        85&nbsp;% w maratonie.
      </p>
      <Formula
        where={[
          'Koszt tlenowy (ml/kg/min) = −4,6 + 0,182258 × v + 0,000104 × v²',
          'Utrzymywana część = 0,8 + 0,1894393 × e^(−0,012778 × t) + 0,2989558 × e^(−0,1932605 × t)',
          'v = dystans (m) / czas (min); t = czas biegu w minutach',
        ]}
      >
        VDOT = koszt tlenowy / utrzymywana część
      </Formula>
      <p>
        Wzory sprawdzają się od około 1500 m do maratonu. Poniżej tego starty
        opierają się na wydolności beztlenowej; powyżej o wyniku bardziej niż
        wydolność tlenowa decydują odżywianie i upał.
      </p>

      <h2>Przykład z obliczeniami</h2>
      <p>Biegacz kończy płaską dychę w 45:00.</p>
      <ul>
        <li>Prędkość: 10&nbsp;000 m / 45 min = 222,2 m/min</li>
        <li>
          Koszt tlenowy: −4,6 + 0,182258 × 222,2 + 0,000104 × 222,2² = 41,0
          ml/kg/min
        </li>
        <li>
          Utrzymywana część dla 45 minut: 0,8 + 0,1894 × e^(−0,575) + 0,2990 ×
          e^(−8,70) = 0,907
        </li>
        <li>VDOT = 41,0 / 0,907 = 45,3</li>
      </ul>
      <p>
        Jeśli odwrócisz wzory, to samo VDOT przewiduje około 21:42 na 5 km,
        1:39:44 w półmaratonie i 3:27:15 w maratonie.
      </p>
      <p>
        Tempa treningowe wynikają ze stałych części VDOT, przeliczonych z
        powrotem na prędkość za pomocą wzoru na koszt tlenowy. Dla VDOT 45,3:
      </p>
      <ul>
        <li>Spokojne (59–74&nbsp;%): od 6:21 do 5:18 na km</li>
        <li>Maratońskie (przewidywana prędkość w maratonie): 4:55 na km</li>
        <li>Progowe (88&nbsp;%): 4:37 na km</li>
        <li>Interwałowe (97,5&nbsp;%): 4:15 na km</li>
        <li>
          Powtórzeniowe (105&nbsp;%): 4:00 na km, czyli 96 sekund na 400 m
        </li>
      </ul>

      <h2>Jak wykorzystać VDOT w treningu</h2>
      <p>
        Każde tempo ma swoje zadanie. Tempo progowe służy do biegów ciągłych po
        20 minut albo interwałów progowych, takich jak 5 × 1 km z minutowymi
        przerwami w truchcie. Tempo interwałowe jest na powtórzenia od trzech do
        pięciu minut, na przykład 5 × 1000 m z przerwami w truchcie o tej samej
        długości, co jest bliskie temu, co francuscy trenerzy nazywają pracą na{' '}
        <Link href="/pl/learn/vma">VMA</Link> (prędkości przy VO2max). Tempo
        powtórzeniowe to krótkie, szybkie odcinki po 200 lub 400 m z pełnym
        odpoczynkiem, nastawione na ekonomię biegu. Tempo spokojne obejmuje
        większość tygodnia.
      </p>
      <p>
        Dwa nawyki utrzymują system w ryzach. Ustal VDOT na podstawie niedawnego
        startu, a nie tego, który masz nadzieję pobiec: trening w tempie
        docelowym, zanim masz na nie formę, to klasyczny sposób na wykopanie
        sobie dołka. I podnoś je małymi krokami, o jeden punkt po dobrym starcie
        albo bloku treningów, które szły pod kontrolą, zamiast gonić za każdym
        dobrym dniem.
      </p>
      <p>
        W OpenAthlete strona rekordów oblicza Twoje VDOT na podstawie
        najmocniejszego wysiłku między 1500 m a maratonem i pokazuje
        odpowiadające mu tempa treningowe. Na tej stronie{' '}
        <Link href="/pl/pace-charts">tabele temp</Link> używają tych samych
        wzorów, a <Link href="/pl/tools/race-predictor">kalkulator wyniku</Link>{' '}
        daje drugą opinię na podstawie wzoru Riegela.
      </p>

      <h2>Ograniczenia</h2>
      <p>
        VDOT zakłada, że Twoja wytrzymałość odpowiada Twojej szybkości. Biegacz
        z szybką dychą i małym kilometrażem zwykle nie osiągnie przewidywanego
        czasu w maratonie, często o kilka minut, bo tabele zakładają trening
        dopasowany do dystansu. Podbiegi, upał, wiatr i źle rozłożone tempo
        obniżają wynik, więc VDOT ze słabego dnia Cię niedoszacowuje.
        Utrzymywana część to średnia krzywa: niektórzy biegacze utrzymują wyższy
        ułamek swojego maksimum niż inni, a biegi terenowe i ultra wykraczają
        poza to, do czego wzory zbudowano. Traktuj VDOT jako dobrze skalibrowany
        punkt wyjścia i koryguj tempa według odczuć i tętna.
      </p>
    </div>
  );
}
