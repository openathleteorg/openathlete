import Link from 'next/link';

import { Sources } from './sources';

export function ContentPl() {
  return (
    <div>
      <p>
        „AI” w oprogramowaniu treningowym oznacza dwie bardzo różne rzeczy, a
        marketing chętnie je miesza. Pierwsza to modele statystyczne, które
        pracują na liczbach: tętnie, tempie, mocy, zmienności rytmu serca, śnie.
        Coś szacują albo próbują coś przewidzieć. Druga to modele językowe z
        rodziny ChatGPT, Claude i Mistral, które czytają i piszą tekst. Dowody
        naukowe dla każdej z nich wyglądają zupełnie inaczej, więc warto omówić
        je osobno.
      </p>

      <h2>Wiele z tego, co sprzedaje się jako AI, to arytmetyka</h2>
      <p>
        Krzywe kondycji, zmęczenia i formy (CTL, ATL, TSB) to wykładniczo ważone
        średnie dziennego obciążenia, wywodzące się z modelu impuls-odpowiedź
        Banistera z lat 70. TRIMP zamienia czas trwania i tętno na wynik
        obciążenia. Session RPE jest jeszcze prostsze: metoda Fostera mnoży
        ocenę wysiłku zawodnika w skali 0–10 przez czas w minutach, więc
        60-minutowy bieg przy RPE 6 daje 360 jednostek. Nic z tego nie jest
        uczeniem maszynowym i to dobrze. Możesz sprawdzić wzór, wiesz, czego nie
        uwzględnia, a gdy liczba wygląda źle, możesz dojść, dlaczego.
      </p>
      <p>
        Stanowisko konsensusu w sprawie monitorowania obciążenia, opublikowane
        przez Bourdona i współpracowników w 2017 roku, zaleca właśnie takie
        narzędzia: mierz, co zostało zrobione (obciążenie zewnętrzne, np.
        dystans i tempo), i jak ciężkie było to dla zawodnika (obciążenie
        wewnętrzne, np. tętno i RPE), i patrz na oba razem w czasie. To wciąż
        kręgosłup dobrej praktyki i nie potrzeba do tego żadnej sieci
        neuronowej.
      </p>

      <h2>Przewidywanie jest słabsze, niż sugerują reklamy</h2>
      <p>
        Przewidywanie kontuzji to obszar, w którym obietnice najbardziej
        wyprzedzają dane. Przegląd Roalda Bahra z 2016 roku w British Journal of
        Sports Medicine wyjaśnia, dlaczego testy przesiewowe nie mogą
        przewidzieć kontuzji u konkretnej osoby: nawet silny czynnik ryzyka na
        poziomie grupy pozostawia ogromne nakładanie się zawodników, którzy
        doznają kontuzji, i tych, którzy jej nie doznają. Uczenie maszynowe na
        razie niewiele tu zmieniło. Przegląd systematyczny Van Eetvelde i
        współpracowników z 2021 roku objął jedenaście badań nad uczeniem
        maszynowym w przewidywaniu kontuzji sportowych, z wynikami od ledwie
        lepszych niż rzut monetą (AUC 0,52) do dobrych (0,87), i wezwał do
        dalszych prac nad interpretacją modeli.
      </p>
      <p>
        Wskaźnik obciążenia ostrego do przewlekłego (ACWR) to pouczająca
        przestroga. Przez kilka lat idea, że wartość między 0,8 a 1,3 to
        bezpieczny „sweet spot”, rozchodziła się po aplikacjach i kursach
        trenerskich. Impellizzeri i współpracownicy pokazali w 2020 roku, że ten
        wskaźnik ma podstawowe problemy statystyczne, a dowody na istnienie
        sweet spotu się nie bronią. Duże skoki obciążenia z tygodnia na tydzień
        wciąż są złym pomysłem. Precyzyjna liczba ryzyka zbudowana na tym
        wskaźniku już nie jest wiarygodna.
      </p>
      <p>
        Gdy więc aplikacja pokazuje Ci „ryzyko kontuzji: 23&nbsp;%”, zapytaj,
        jak tę liczbę zwalidowano, na kim i jak często się myliła. Jeśli nie ma
        odpowiedzi, traktuj ją jak dekorację.
      </p>

      <h2>Gdzie modele na liczbach pomagają: HRV z punktem odniesienia</h2>
      <p>
        Zmienność rytmu serca to najbardziej użyteczny codzienny sygnał, jaki
        większość zawodników może zmierzyć w domu. W małym, czterotygodniowym
        badaniu Kiviniemi i współpracownicy (2007) pozwolili, by poranne HRV
        decydowało o treningu danego dnia: mocno, jeśli HRV było stabilne lub
        rosło, lekko albo odpoczynek, jeśli spadło poniżej niedawnego zakresu
        danego zawodnika. Ta grupa poprawiła maksymalną prędkość biegu bardziej
        niż grupa trenująca według stałego planu. Plews i współpracownicy (2013)
        dodali ważną praktyczną uwagę: pojedynczy poranny pomiar jest
        zaszumiony, a średnie kroczące z około tygodnia, porównywane z własnym
        punktem odniesienia zawodnika, mówią znacznie więcej.
      </p>
      <p>
        Zauważ, czym to jest: osobistym punktem odniesienia i prostą regułą.
        Działa, bo jest indywidualne, a nie dlatego, że model jest sprytny.
        Wymaga też zdyscyplinowanego pomiaru, każdego ranka w tych samych
        warunkach, i właśnie na tym większość ludzi się wykłada.
      </p>

      <h2>Dane subiektywne wciąż wygrywają z większością czujników</h2>
      <p>
        Przegląd systematyczny Saw, Main i Gastina z 2016 roku porównał miary
        subiektywne (nastrój, odczuwany stres, zmęczenie) z obiektywnymi
        (markery z krwi, tętno spoczynkowe, reakcja tętna na wysiłek). Miary
        subiektywne śledziły zmiany obciążenia treningowego z większą czułością
        i spójnością. Mówiąc prosto: pytanie zawodnika, jak się czuje, i
        zapisywanie tego za każdym razem to jedno z najlepszych dostępnych
        narzędzi monitorowania.
      </p>
      <p>
        I tu modele językowe okazują się naprawdę przydatne, w mało efektowny
        sposób. Zawodnik chętnie napisze albo powie „nogi ciężkie od 8. km, lewe
        ścięgno Achillesa trochę bolało potem na schodach”, a rzadko wypełni
        pięć suwaków. Model językowy potrafi zamienić to zdanie w ocenę wysiłku
        i notatkę o bólu (lewe ścięgno Achillesa, łagodnie, po biegu), którą
        trener może filtrować i przedstawiać na wykresie. To wprowadzanie danych
        strukturalnych przez coś, co rozumie luźne sformułowania.
      </p>

      <h2>Modele językowe piszące plany treningowe</h2>
      <p>
        Düking i współpracownicy (2024) poprosili ChatGPT o sześciotygodniowe
        plany biegowe przy trzech poziomach szczegółowości polecenia, a eksperci
        od trenowania ocenili je według 22 kryteriów jakości. Przy minimalnych
        danych plan wypadł poniżej środka skali w 19 z 22 kryteriów. Przy
        szczegółowych danych (historia treningowa, cele, ograniczenia) spadło to
        do jednego. Autorzy i tak odradzają korzystanie z takich planów bez
        informacji zwrotnej od doświadczonego trenera. Badanie programów
        treningu siłowego autorstwa Washifa i współpracowników (2024) doszło do
        podobnego wniosku: wiarygodne szkice, które musi dopracować ktoś, kto
        zna się na rzeczy.
      </p>
      <p>
        Modele językowe płynnie podają też nieprawdę, co nazywa się halucynacją
        (Ji i współpracownicy, 2023, opisują ten problem). W treningu wygląda to
        jak tygodniowa objętość, która się nie sumuje, „badanie”, które nie
        istnieje, albo bieg regeneracyjny po cichu ustawiony w tempie progowym.
        Te błędy łatwo przeoczyć właśnie dlatego, że reszta tekstu dobrze się
        czyta.
      </p>

      <h2>Co to oznacza w praktyce</h2>
      <p>
        Używaj modeli językowych do pracy z tekstem: pisania strukturalnej
        jednostki z opisu, podsumowania miesiąca notatek, zbierania informacji
        zwrotnej po treningu, wyjaśniania pojęć. Decyzje o obciążeniu i
        intensywności opieraj na liczbach, które możesz sprawdzić, najlepiej z
        trenerem lub własnym doświadczeniem jako ostatecznym filtrem. Podchodź
        sceptycznie do każdego wskaźnika ryzyka, którego walidacji nie widzisz.
        A jeśli chcesz jednego nawyku, który badania wyraźnie wspierają,
        zapisuj, jak czułeś się na każdym treningu.
      </p>

      <h2>Jak OpenAthlete korzysta z AI</h2>
      <p>
        Obciążenie treningowe w OpenAthlete to TRIMP z tętna, a obok session
        RPE: wzory, a nie czarna skrzynka. AI jest opcjonalne i zajmuje się
        opisaną wyżej pracą z tekstem: strukturalna jednostka z jednego zdania,
        trzy lub cztery pytania po aktywności, z których powstaje ocena wysiłku
        i dziennik bólu dla trenera, oraz krótki komentarz do każdej aktywności.
        Nie ma przewidywania kontuzji.{' '}
        <Link href="/pl/features/ai-coach">Strona o AI</Link> pokazuje, co
        potrafi i z jakich dostawców możesz korzystać.
      </p>

      <h2>Źródła</h2>
      <Sources />
    </div>
  );
}
