import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentPl() {
  return (
    <div>
      <p>
        Twoje mięśnie wytwarzają mleczan przy każdym tempie, nawet podczas
        marszu, i równie stale go usuwają. Przy spokojnych prędkościach oba
        procesy się równoważą, a stężenie we krwi pozostaje blisko
        spoczynkowego, około 1 mmol/l. Przyspiesz, a w pewnym momencie
        wytwarzanie zaczyna wyprzedzać usuwanie. Ten moment ludzie mają na
        myśli, mówiąc o progu mleczanowym, i to z jego powodu tempo, które
        utrzymasz przez godzinę, czuje się zupełnie inaczej niż tempo szybsze o
        zaledwie 15 sekund na kilometr.
      </p>
      <p>
        Kłopot w tym, że „ten jeden” próg mleczanowy nie istnieje jako
        uzgodniona liczba. Faude, Kindermann i Meyer (2009) przejrzeli ponad
        dwadzieścia koncepcji progu z literatury, opartych na różnych
        protokołach i różnych zasadach odczytu tej samej krzywej. W praktyce
        dzielą się na dwie rodziny. Pierwszy próg (LT1, często nazywany progiem
        tlenowym) to miejsce, w którym mleczan po raz pierwszy wzrasta powyżej
        poziomu spoczynkowego. Drugi (LT2, próg beztlenowy, a w najściślejszej
        postaci maksymalny stan równowagi mleczanowej) to najwyższa
        intensywność, przy której mleczan wciąż stabilizuje się na stałym
        poziomie, zamiast rosnąć aż do przerwania wysiłku. Gdy trener mówi „bieg
        progowy”, prawie zawsze ma na myśli LT2.
      </p>

      <h2>Jak się go mierzy</h2>
      <p>
        Klasyczny test to test stopniowany na bieżni mechanicznej lub
        lekkoatletycznej: etapy po 3 do 5 minut, każdy o 0,5 do 1 km/h szybszy
        od poprzedniego, z kroplą krwi pobraną z palca lub płatka ucha na końcu
        każdego etapu. Potem odczytuje się próg z krzywej. Popularne są dwie
        zasady: stałe stężenie, zwykle 4 mmol/l dla LT2, oraz wzrost ponad
        poziom wyjściowy, często poziom wyjściowy + 1 mmol/l dla LT1. Prędkość
        między dwoma etapami wyznacza się interpolacją liniową:
      </p>
      <Formula
        where={[
          'La = docelowy mleczan (4 mmol/l albo poziom wyjściowy + 1)',
          'v1, La1 = prędkość i mleczan ostatniego etapu poniżej celu',
          'v2, La2 = prędkość i mleczan pierwszego etapu powyżej celu',
        ]}
      >
        v = v1 + (La − La1) / (La2 − La1) × (v2 − v1)
      </Formula>
      <p>
        Maksymalny stan równowagi mleczanowej to punkt odniesienia, który
        pozostałe metody próbują przybliżyć, ale jego wyznaczenie wymaga kilku
        dni 30-minutowych biegów w stałym tempie, dlatego poza laboratoriami
        mało kto go mierzy (Jones i wsp., 2019).
      </p>

      <h2>Przykład z liczbami</h2>
      <p>
        Biegacz wykonuje 4-minutowe etapy od 10 km/h, za każdym razem dodając 1
        km/h. Mleczan na końcu kolejnych etapów: 1,1, 1,2, 1,4, 1,8, 2,6, 4,1 i
        6,3 mmol/l przy 10, 11, 12, 13, 14, 15 i 16 km/h.
      </p>
      <ul>
        <li>
          LT2 przy 4 mmol/l: między 14 km/h (2,6) a 15 km/h (4,1). v = 14 + (4 −
          2,6) / (4,1 − 2,6) × 1 = 14,9 km/h, czyli 4:01 na km.
        </li>
        <li>
          LT1 przy poziomie wyjściowym + 1: najniższa wartość to 1,1, więc cel
          to 2,1 mmol/l, między 13 km/h (1,8) a 14 km/h (2,6). v = 13 + 0,3 /
          0,8 = 13,4 km/h, czyli 4:29 na km.
        </li>
      </ul>
      <p>
        Ten sam test, ta sama krew, a oba progi dzieli prawie 30 sekund na
        kilometr. Odczytaj krzywą według innej zasady (na przykład punktu
        największej odległości od prostej łączącej pierwszy i ostatni etap), a
        dostaniesz jeszcze inną wartość. To nie wada testu, tylko powód, by
        zawsze pytać, o który próg chodzi w danej liczbie.
      </p>

      <h2>Jak wykorzystać go w treningu</h2>
      <p>
        Bez laboratorium dobrym terenowym oszacowaniem LT2 jest tempo, które
        utrzymasz w zawodach przez około godzinę; u większości wytrenowanych
        biegaczy leży ono między tempem na 10 km a tempem półmaratonu.{' '}
        <Link href="/pl/pace-charts">Tabele temp</Link> podają to tempo na
        podstawie świeżego wyniku z zawodów. Tętno na LT2 wynosi zwykle 85 do 92
        % maksymalnego, ale rozrzut między osobami jest duży.
      </p>
      <ul>
        <li>
          Treningi progowe: 3 × 10' albo 5 × 6' w tempie LT2 z 1 do 2 minut
          truchtu albo 20 do 30 minut ciągłego biegu. Tempo powinno być
          „komfortowo ciężkie”: dasz radę powiedzieć kilka słów, ale nie całe
          zdanie.
        </li>
        <li>
          Spokojne bieganie zostaje poniżej LT1. Ten sufit próbuje uchwycić{' '}
          <Link href="/pl/learn/zone-2">strefa 2</Link>, a w tygodniu{' '}
          <Link href="/pl/learn/polarized-training">spolaryzowanym</Link>{' '}
          spędzasz tam większość minut.
        </li>
        <li>
          Powtarzaj test co 6 do 10 tygodni albo korzystaj z zawodów: próg
          przesuwa się wraz z formą, a stare strefy z czasem lądują w złym
          miejscu.
        </li>
      </ul>
      <p>
        OpenAthlete nie mierzy mleczanu. Wpisujesz lub synchronizujesz swoje
        strefy, a statystyki pokazują, jak rozkłada się Twój czas poniżej,
        pomiędzy i powyżej progów w kolejnych tygodniach i miesiącach, obok
        krzywych{' '}
        <Link href="/pl/features/training-load">obciążenia treningowego</Link>.
      </p>

      <h2>Ograniczenia</h2>
      <p>
        Wynik zależy od protokołu: krótsze etapy dają wyższą prędkość progową,
        bo mleczan nie zdąży dogonić wysiłku w chwili pobrania krwi. Przenośne
        analizatory mleczanu różnią się między sobą o kilka dziesiątych mmol/l,
        co na płaskim odcinku krzywej wyraźnie przesuwa próg wyznaczany stałą
        wartością. Niski poziom glikogenu mięśniowego obniża mleczan przy każdej
        prędkości, przez co próg wygląda lepiej, niż jest. A prędkość wyznaczona
        na bieżni przy 18 °C nie przenosi się wprost na pagórkowatą trasę w
        upale. Jeśli chcesz punktu odniesienia dla tempa, który pochodzi z
        Twoich startów, a nie z próbki krwi, spójrz na{' '}
        <Link href="/pl/learn/critical-speed">prędkość krytyczną</Link>, która
        leży tuż powyżej maksymalnego stanu równowagi mleczanowej.
      </p>
    </div>
  );
}
