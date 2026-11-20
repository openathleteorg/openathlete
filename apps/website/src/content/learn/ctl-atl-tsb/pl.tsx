import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentPl() {
  return (
    <div>
      <p>
        CTL, ATL i TSB to trzy krzywe wyliczane z tego samego dziennego
        obciążenia treningowego. CTL (ang. chronic training load, przewlekłe
        obciążenie) nazywa się zwykle kondycją, ATL (acute training load, ostre
        obciążenie) zmęczeniem, a TSB (training stress balance, bilans
        obciążenia) formą. Pochodzą z modelu impuls-odpowiedź, który Eric
        Banister opublikował w 1975 roku: każdy trening podnosi zarówno
        kondycję, jak i zmęczenie, zmęczenie mija w ciągu kilku dni, kondycja w
        ciągu tygodni, a wynik sportowy leży gdzieś w różnicy między nimi. Nazwy
        CTL, ATL i TSB spopularyzowało później oprogramowanie kolarskie, ale
        matematyka jest Banistera.
      </p>

      <h2>Jak się je liczy</h2>
      <p>
        Zacznij od jednej liczby obciążenia na dzień, na przykład sumy{' '}
        <Link href="/pl/learn/trimp">TRIMP</Link> z treningów danego dnia (0 w
        dzień wolny). Kondycja i zmęczenie to wykładniczo ważone średnie tej
        serii z różnymi stałymi czasowymi:
      </p>
      <Formula
        where={[
          'CTL: τ = 42 dni, więc każdy dzień waży 1 − e^(−1/42) ≈ 0,0235',
          'ATL: τ = 7 dni, więc każdy dzień waży 1 − e^(−1/7) ≈ 0,133',
          'TSB = CTL − ATL',
        ]}
      >
        dziś = wczoraj + (1 − e^(−1/τ)) × (obciążenie − wczoraj)
      </Formula>
      <p>
        Przy τ = 42 dni wpływ treningu na CTL spada o połowę po około 29 dniach,
        na ATL po niecałych 5 dniach. Niektóre narzędzia używają jako dziennej
        wagi skrótu ze średniej kroczącej 2 / (N + 1). To nie jest ten sam
        model: przy N = 42 daje 0,047, czyli dwa razy więcej niż 0,0235, co w
        praktyce skraca obie stałe czasowe o połowę i sprawia, że krzywe reagują
        znacznie szybciej (wyprowadzenie omawiają Clarke i Skiba, 2013).
      </p>
      <p>
        Narzędzia różnią się też tym, z którego dnia bierze się TSB. OpenAthlete
        odejmuje wartości z tego samego dnia, po doliczeniu jego obciążenia;
        inne biorą wartości z wczoraj, tak by TSB opisywało, ile masz świeżości
        na starcie dzisiejszego treningu. Na tych samych danych obie wersje mogą
        różnić się o kilka punktów, więc nie porównuj liczb między aplikacjami.
      </p>

      <h2>Przykład z liczbami</h2>
      <p>
        Biegacz od miesięcy robi średnio 60 TRIMP dziennie: CTL i ATL wynoszą po
        60, TSB 0. Zaczyna ciężki tydzień po 90 dziennie. Po pierwszym dniu:
      </p>
      <ul>
        <li>CTL = 60 + 0,0235 × (90 − 60) = 60,7</li>
        <li>ATL = 60 + 0,133 × (90 − 60) = 64,0</li>
        <li>TSB = 60,7 − 64,0 = −3,3</li>
      </ul>
      <p>
        Po siedmiu dniach po 90 CTL podniosło się do 64,6, a ATL skoczyło do
        79,0: TSB wynosi −14,4. Biegacz jest trochę lepiej wytrenowany i
        wyraźnie zmęczony. Potem schodzi na tydzień do 40 dziennie. ATL szybko
        spada do 54,3, CTL tylko do 60,8, a TSB wychodzi na plus, +6,5. Ta
        asymetria, w której zmęczenie odchodzi szybciej niż kondycja, to cała
        zasada <Link href="/pl/learn/taper">taperingu</Link>.
      </p>

      <h2>Jak wykorzystać je w treningu</h2>
      <p>
        CTL mówi, ile treningu przyswajał Twój organizm przez ostatni miesiąc
        lub dwa. Równy wzrost o kilka punktów tygodniowo w okresie budowania to
        typowy obraz; gwałtowny skok warto zakwestionować, długie plateau też,
        jeśli liczysz na postęp. ATL zmienia się z każdym tygodniem i głównie
        tłumaczy, dlaczego czujesz ciężkie nogi. TSB to wartość, na którą patrzy
        się przed startem: większość sportowców startuje dobrze gdzieś między
        lekkim minusem a wyraźnym plusem, ale właściwa wartość jest indywidualna
        i poznasz ją tylko, notując swoje TSB przed startami, które poszły
        dobrze i źle.
      </p>
      <p>
        Krzywe stają się bardziej użyteczne, gdy sięgają w przyszłość. Jeśli
        zaplanowane treningi mają szacowane obciążenie, model może przewidzieć
        CTL, ATL i TSB na dzień startu i pokazać, czy ostatnie dwa tygodnie
        naprawdę dadzą Ci świeżość na starcie. OpenAthlete tak robi: liczy
        krzywe z Twoich aktywności i prognozuje je na podstawie treningów w
        kalendarzu. Oznacza TSB poniżej −20 lub powyżej +25; te progi to
        konwencje opisu krzywej, a nie zweryfikowane granice. Szczegóły i kod
        znajdziesz na{' '}
        <Link href="/pl/features/training-load">
          stronie o obciążeniu treningowym
        </Link>
        .
      </p>

      <h2>Ograniczenia</h2>
      <p>
        Model jest tak dobry jak dzienne obciążenie, którym go karmisz. TRIMP
        oparty na tętnie zaniża sprinty, trening siłowy i zbiegi, więc krzywe
        gubią część tego, co biegacz górski czy triathlonista robi na siłowni.
        Brakujące dane też szkodzą: tydzień biegów bez pasa piersiowego wygląda
        jak tydzień wolnego.
      </p>
      <p>
        Stałe czasowe to konwencje. Banister dopasowywał je dla każdego
        zawodnika osobno, a dopasowane wartości bardzo się różnią; 42 i 7 dni to
        rozsądne wartości domyślne, a nie Twoja fizjologia. Hellard i
        współpracownicy (2006) pokazali, jak niestabilne są dopasowane parametry
        nawet przy dobrych danych od wyczynowych pływaków. Model nic też nie wie
        o śnie, chorobie czy stresie poza sportem. Ujemne TSB nie diagnozuje
        przetrenowania, a wysokie nie oznacza gotowości do startu. Czytaj krzywe
        razem z <Link href="/pl/learn/session-rpe">sesyjnym RPE</Link>,{' '}
        <Link href="/pl/learn/hrv">HRV</Link> i swoim samopoczuciem.
      </p>
    </div>
  );
}
