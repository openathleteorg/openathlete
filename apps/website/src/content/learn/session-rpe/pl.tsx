import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentPl() {
  return (
    <div>
      <p>
        Session RPE to najprostsza miara obciążenia treningowego, która broni
        się w badaniach: ocen, jak ciężki był cały trening w skali od 0 do 10,
        pomnóż przez czas trwania w minutach i masz obciążenie w jednostkach
        umownych. Carl Foster i współpracownicy opisali tę metodę pod koniec lat
        90., a w 2001 roku porównali ją z metodami opartymi na tętnie. Nie
        wymaga żadnego czujnika, działa w każdym sporcie, także na siłowni i w
        treningu technicznym, i wyłapuje rzeczy, których tętno nie widzi, takie
        jak ciężkie nogi po zbiegu czy psychiczny koszt startu.
      </p>

      <h2>Jak oblicza się session RPE</h2>
      <Formula
        where={[
          'RPE: ocena odczuwanego wysiłku dla całego treningu w skali kategoria-proporcja 0–10 (CR-10)',
          'minuty: całkowity czas treningu, z rozgrzewką i schłodzeniem',
          'wynik w jednostkach umownych (AU)',
        ]}
      >
        obciążenie treningu = RPE × minuty
      </Formula>
      <p>
        Skala to wersja CR-10 Borga: 0 to odpoczynek, 1 bardzo lekko, 3
        umiarkowanie, 5 ciężko, 7 bardzo ciężko, 10 maksymalnie. Pytanie dotyczy
        treningu jako całości, a nie najtrudniejszego interwału ani tego, jak
        czujesz się teraz. Protokół Fostera zakłada ocenę około 30 minut po
        zakończeniu, kiedy ostatni wysiłek nie dominuje już odpowiedzi. W
        praktyce ocena przy wgrywaniu aktywności, tego samego dnia, sprawdza się
        wystarczająco dobrze, jeśli robisz to konsekwentnie.
      </p>

      <h2>Przykład z obliczeniami</h2>
      <p>Tydzień biegacza, oceniany trening po treningu:</p>
      <ul>
        <li>Wtorek, 60 min z 5 × 4' na progu, RPE 7: 420 AU</li>
        <li>Środa, 45 min spokojnie, RPE 3: 135 AU</li>
        <li>Czwartek, 50 min w równym, umiarkowanym tempie, RPE 4: 200 AU</li>
        <li>Sobota, 100 min długiego wybiegania, RPE 5: 500 AU</li>
        <li>Niedziela, 40 min truchtu regeneracyjnego, RPE 2: 80 AU</li>
      </ul>
      <p>
        Obciążenie tygodnia wynosi 1335 AU. Trening progowy to 15&nbsp;% czasu
        treningu, ale prawie jedna trzecia obciążenia, co zgadza się z tym, jak
        większość biegaczy opisałaby swój tydzień. Foster (1998) wyprowadził też
        z wartości dziennych dwa wskaźniki tygodniowe. Monotonia to średnie
        dzienne obciążenie podzielone przez jego odchylenie standardowe: tutaj
        191 / 184 ≈ 1,0, przy dwóch dniach wolnych i wyraźnym kontraście między
        dniami ciężkimi i łatwymi. Strain (napięcie) to obciążenie tygodnia ×
        monotonia, około 1390. Trenowanie codziennie tej samej umiarkowanej
        dawki podnosi monotonię, a w danych Fostera choroby zwykle pojawiały się
        po tygodniach o wysokim strainie.
      </p>

      <h2>Jak wykorzystać to w treningu</h2>
      <p>
        Oceniaj każdy trening, także spokojne i te na siłowni. Luki sprawiają,
        że suma tygodniowa traci sens. Potem patrz na trendy: tydzień o
        30&nbsp;% wyższy od ostatnich to skok, niezależnie od liczby
        bezwzględnej. Porównanie zaplanowanego wysiłku z ocenionym często mówi
        więcej niż samo obciążenie. Spokojny bieg oceniony na 5 zamiast 3 albo
        trening progowy odczuty jak 9 mówi coś o zmęczeniu, upale lub chorobie,
        zanim pokaże to jakakolwiek krzywa.
      </p>
      <p>
        Session RPE działa też najlepiej obok miary obiektywnej. Kiedy{' '}
        <Link href="/pl/learn/trimp">TRIMP</Link> stoi w miejscu, a session RPE
        rośnie przy tych samych treningach, organizm płaci więcej za ten sam
        efekt. Trenerzy wykorzystują właśnie tę różnicę, żeby dostosować kolejne
        dni.
      </p>
      <p>
        W OpenAthlete każda aktywność ma RPE od 0 do 10, a trener może wymagać
        jego podania, zanim trening zostanie uznany za wykonany. Widok
        obciążenia treningowego pokazuje session RPE (RPE × minuty) obok TRIMP z
        tętna. Jeśli funkcje AI są włączone, kilka krótkich pytań po aktywności
        może uzupełnić RPE na podstawie odpowiedzi zawodnika. Więcej na{' '}
        <Link href="/pl/features/training-load">
          stronie o obciążeniu treningowym
        </Link>
        .
      </p>

      <h2>Ograniczenia</h2>
      <p>
        Metoda jest subiektywna, co jest jednocześnie jej sensem i słabością.
        Oceny zmieniają się z nastrojem, motywacją i doświadczeniem;
        początkujący zwykle ściskają wszystko w przedziale 4–7. Jednostek
        umownych nie da się przeliczyć na TRIMP czy TSS, więc bez przeskalowania
        nie można mieszać tych liczb na jednej krzywej. Czas trwania waży
        liniowo: 3-godzinna spokojna jazda na rowerze przy RPE 3 (540 AU) wypada
        wyżej niż ciężki 40-minutowy trening interwałowy przy RPE 8 (320 AU), co
        jest słuszne dla całkowitego obciążenia, a błędne dla specyficznego
        bodźca intensywności. Ocena nie mówi też nic o tym, dlaczego trening był
        ciężki. Przegląd Haddada i współpracowników (2017) potwierdza trafność
        session RPE w wielu sportach, z korelacjami z metodami tętna, które są
        na ogół dobre, ale dalekie od idealnych. Traktuj ją jako zawsze dostępną
        drugą opinię, a nie jedyną liczbę.
      </p>
    </div>
  );
}
