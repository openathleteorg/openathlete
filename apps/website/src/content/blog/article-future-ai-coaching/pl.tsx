import Link from 'next/link';

import { Sources } from './sources';

export function ContentPl() {
  return (
    <div>
      <p>
        Kilka lat temu „trener AI” oznaczał zwykle chatbota, który pisał ogólny
        dwunastotygodniowy plan i zapominał o tobie, gdy tylko zamknąłeś kartę.
        Od tamtej pory nie zmieniło się to, że modele językowe nagle lepiej
        rozumieją trening. Zmieniło się to, że potrafią teraz działać: otworzyć
        twój kalendarz, przeczytać aktywności z ostatniego miesiąca i wpisać
        treningi do planu, który twój zegarek pobierze jutro rano. To właśnie
        ludzie mają na myśli, mówiąc o agentach, i warto spokojnie przemyśleć,
        co to zmienia dla trenerów, a czego nie.
      </p>

      <h2>Czym jest MCP, w skrócie</h2>
      <p>
        Model Context Protocol to otwarty standard, przedstawiony przez
        Anthropic w listopadzie 2024 roku, który pozwala klientowi AI, takiemu
        jak Claude czy ChatGPT, wywoływać narzędzia udostępniane przez inną
        aplikację. Platforma treningowa może udostępnić narzędzia takie jak
        „odczytaj kalendarz na te tygodnie”, „pobierz obciążenie treningowe”,
        „zaplanuj te treningi” albo „przesuń ten trening na czwartek”. Model
        decyduje, które narzędzia wywołać i w jakiej kolejności. Aplikacja
        decyduje, czego model może dotknąć, i sprawdza każde żądanie tak, jak
        sprawdziłaby kliknięcie użytkownika.
      </p>
      <p>
        Ten podział ma znaczenie. Model wnosi język i rozumowanie, platforma
        zachowuje dane, uprawnienia i reguły. Model, który cię źle zrozumie,
        może zaproponować coś niemądrego, ale nie dosięgnie niczego, czego
        platforma nie udostępnia.
      </p>

      <h2>Realistyczny poniedziałek</h2>
      <p>
        Weźmy trenera z piętnastoma zawodnikami. W poniedziałek rano jedna z
        nich, dziewięć tygodni przed maratonem, pisze, że od soboty ma grypę i w
        najlepszym razie wróci w czwartek. Zwykła robota: otworzyć jej
        kalendarz, usunąć albo przesunąć pięć czy sześć treningów, przepisać
        resztę tygodnia, skrócić długie wybieganie i sprawdzić, czy następny
        tydzień nadal ma sens. Dziesięć, piętnaście minut, i to trzecia taka
        wiadomość tego dnia.
      </p>
      <p>
        Z agentem połączonym z platformą trener może napisać: „Anna jest chora
        od soboty, pewnie do czwartku. Zapisz to, do niedzieli wszystko
        spokojnie, przesuń sobotnie 3 × 15 minut w tempie maratońskim na
        przyszły wtorek, a niedzielne długie wybieganie zrób jako 1:15 h
        spokojnie”. Agent zapisuje chorobę, odczytuje kalendarz, wprowadza
        zmiany i zdaje relację. Trener patrzy na tydzień w kalendarzu, poprawia
        jedną rzecz i idzie dalej.
      </p>
      <p>
        Zwróć uwagę, kto podjął decyzje. Każdy wybór w tym poleceniu (jak długo
        zostać przy spokojnym bieganiu, który trening jest na tyle ważny, żeby
        go przesunąć, jak długie ma być długie wybieganie) pochodził od trenera.
        Agent tylko klikał. To uczciwa wersja tego, co agenci oferują dziś
        trenerom: administracyjna połowa pracy staje się dużo tańsza, a połowa
        wymagająca osądu zostaje tam, gdzie była.
      </p>

      <h2>W czym agenci wciąż są słabi</h2>
      <p>
        <strong>W wiedzy o tym, czego nie wiedzą.</strong> Agent zaplanuje blok
        nawet przy skąpych danych: brak tętna przy połowie biegów, brak ocen
        wysiłku, tydzień wyjazdu, o którym nikt nie wspomniał. Impellizzeri i
        współpracownicy od lat podkreślają, że to obciążenie wewnętrzne, czyli
        jak ciężki był trening dla tego konkretnego zawodnika, napędza
        adaptację, i właśnie tej części najczęściej brakuje w danych. Trener
        zauważa lukę. Model ma skłonność do wypełniania jej założeniami.
      </p>
      <p>
        <strong>W długoterminowym osądzie.</strong> Czy dodać trzeci mocny
        trening, kiedy zacząć tapering, czy ten zawodnik potrzebuje teraz
        tygodnia roztrenowania, czy zniesie jeszcze jeden: to zależy od lat
        historii, od pracy i rodziny, od tego, jak ktoś reaguje na zmęczenie.
        Gdy Düking i współpracownicy (2024) poprosili ekspertów od trenowania o
        ocenę planów biegowych z ChatGPT, plany znacznie się poprawiały przy
        większej ilości informacji wejściowych, ale nadal nie zostały ocenione
        jako optymalne, a autorzy zalecają ich weryfikację przez doświadczonego
        trenera.
      </p>
      <p>
        <strong>W pewnych siebie błędach.</strong> Źle odczytana strefa zamienia
        bieg regeneracyjny w trening progowy. Data przesunięta o jeden dzień
        stawia długie wybieganie dzień przed zawodami. Modele językowe
        popełniają takie błędy płynnym, rozsądnie brzmiącym tekstem i właśnie
        dlatego łatwo je przeoczyć.
      </p>
      <p>
        <strong>W odpowiedzialności.</strong> Gdy plan przyczyni się do
        kontuzji, ktoś musi wziąć tę decyzję na siebie i porozmawiać o tym z
        zawodnikiem. Model tego nie potrafi.
      </p>

      <h2>Trener w pętli, w praktyce</h2>
      <p>
        „Człowiek w pętli” łatwo powiedzieć. W narzędziu trenerskim sprowadza
        się to do kilku konkretnych decyzji projektowych:
      </p>
      <ul>
        <li>
          Agent pisze do tego samego kalendarza, który widzą trener i zawodnik.
          Nic nie dzieje się w ukrytej warstwie, więc zła zmiana jest od razu
          widoczna.
        </li>
        <li>
          Ma polecenie przesuwać i edytować treningi zamiast je usuwać i tworzyć
          od nowa, żeby zmiana pozostała zmianą.
        </li>
        <li>
          Wykonane treningi i zarejestrowane aktywności to historia. Agent nie
          może ich przepisać.
        </li>
        <li>AI działa tylko po wyraźnej zgodzie, którą możesz wycofać.</li>
        <li>
          Dane trafiają do wybranego przez ciebie dostawcy modelu, z twoim
          kluczem. Na samodzielnie hostowanej instancji z lokalnym modelem nie
          opuszczają twojego serwera.
        </li>
      </ul>

      <h2>Ostrożna prognoza na najbliższe lata</h2>
      <p>
        Koszt administracyjny trenowania będzie dalej spadał. Trener, który w
        niedzielny wieczór przepisuje tygodnie dwudziestu zawodników, będzie
        poświęcał na to dużo mniej czasu. To może pójść w dwie strony: więcej
        zawodników na trenera albo więcej uwagi na zawodnika. Ta druga to lepszy
        użytek, a zawodnicy zauważą, którą wybrał ich trener.
      </p>
      <p>
        Zawodnicy trenujący sami z agentem poradzą sobie dobrze, jeśli już
        wiedzą, jak wygląda dobry trening, i używają agenta do jego realizacji.
        Bardziej ryzykowne jest to dla początkujących, którzy najsłabiej
        rozpoznają zły plan i najchętniej go wykonują. Nie spodziewamy się
        rychło wiarygodnego przewidywania kontuzji, badania nad testami
        przesiewowymi i uczeniem maszynowym dają do tego mało podstaw. A ta
        część trenowania, która polega na zauważeniu, że „w porządku” zawodnika
        wcale nie znaczy, że jest w porządku, nigdzie się nie wybiera.
      </p>

      <h2>Wypróbuj</h2>
      <p>
        OpenAthlete ma <Link href="/pl/features/mcp-server">serwer MCP</Link>,
        który działa z Claude, ChatGPT i innymi klientami. Potrafi odczytać
        kontekst, kalendarz, aktywności i obciążenie treningowe zawodnika,
        zapisać chorobę lub wyjazd i zaplanować do 60 treningów naraz. Treningi
        pojawiają się potem w kalendarzu i trafiają na zegarki Garmin, Suunto i
        COROS. Jest darmowy, a trenerzy mogą z niego korzystać dla wszystkich
        zawodników, których prowadzą.
      </p>

      <h2>Źródła</h2>
      <Sources />
    </div>
  );
}
