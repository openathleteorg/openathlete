import Link from 'next/link';

import { Sources } from './sources';

export function ContentPl() {
  return (
    <div>
      <p>
        Dla sportowca wytrzymałościowego generatywna AI nie jest ani gadżetem,
        ani rewolucją. To narzędzie do tekstu. Świetnie zamienia luźny język w
        strukturę, a strukturę w czytelny tekst, i jest zawodna, gdy musi mieć
        rację co do twojego ciała albo liczb, których nikt jej nie podał. Gdy
        spojrzysz na nią w ten sposób, staje się jasne, gdzie oszczędza czas, a
        gdzie może zaszkodzić.
      </p>

      <h2>Dobra w: pisaniu treningu</h2>
      <p>
        Wpisywanie ustrukturyzowanego treningu do aplikacji zegarka jest żmudne.
        Opisanie go już nie. „20 minut spokojnie, potem 6 × 3 minuty mocno z 2
        minutami truchtu, 10 minut schłodzenia” to dokładnie taki rodzaj zdania,
        z którym model językowy dobrze sobie radzi: dzieli je na kroki,
        rozpoznaje powtórzenia i, jeśli zna twoje strefy, nadaje każdemu krokowi
        cel. „Mocno” przez 3 minuty staje się twoim zakresem tempa VO2max,
        „trucht” tempem regeneracyjnym.
      </p>
      <p>
        Zanim trening trafi na zegarek, warto sprawdzić dwie rzeczy: łączny czas
        trwania (modele czasem pomijają albo podwajają blok) i intensywność,
        jaką wybrał dla nieprecyzyjnych słów. „Mocno” dla jednej osoby oznacza
        próg, dla innej tempo na 5 km. Jeśli model wybrał źle, powiedz mu to
        albo następnym razem napisz „na progu”.
      </p>

      <h2>Dobra w: zamianie odczuć na dane</h2>
      <p>
        Po długim wybieganiu mało kto wypełni formularz z pięcioma suwakami.
        Powie raczej coś w stylu: „pierwsza godzina w porządku, potem dopadł
        mnie upał, ostatnie 5 km to była walka i spięła mi się prawa łydka”.
        Model językowy może zamienić to na ocenę wysiłku około 8 i notatkę:
        prawa łydka, napięcie, pod koniec biegu. Z tygodniami takie notatki
        stają się czymś, co trener może naprawdę filtrować.
      </p>
      <p>
        To ważniejsze, niż się wydaje. Przegląd systematyczny Saw i
        współpracowników (2016) wykazał, że subiektywne, zgłaszane przez samego
        zawodnika miary lepiej odzwierciedlają obciążenie treningowe niż
        większość obiektywnych markerów. Wąskim gardłem zawsze było nakłonienie
        zawodników do ich zapisywania. Gdy wystarczy jedno zdanie albo wiadomość
        głosowa, to pomaga.
      </p>

      <h2>Dobra w: streszczaniu i przepisywaniu</h2>
      <p>
        Wklej notatki z czterech tygodni treningów i poproś o podsumowanie przed
        rozmową z trenerem: wyłowi powtarzające się wątki (ścięgno Achillesa,
        które odzywa się po podbiegach, czwartkowe treningi, które ciągle
        wypadają) szybciej niż ty. Może przepisać tydzień pod jakieś
        ograniczenie, na przykład wyjazd służbowy od wtorku do czwartku z samą
        hotelową bieżnią, i dać ci rozsądny szkic. Może przetłumaczyć plan,
        który trener napisał w innym języku. Za każdym razem dostajesz szkic do
        sprawdzenia, a nie polecenie do wykonania.
      </p>

      <h2>Przydatna z ostrożnością: wyjaśnianie</h2>
      <p>
        Zapytaj, czym trening progowy różni się od interwałów VO2max albo
        dlaczego tempo długiego wybiegania ma być odczuwalnie łatwe, a zwykle
        dostaniesz porządne wyjaśnienie. Ryzyko polega na tym, że doda pewnym
        tonem jakiś błędny szczegół albo zacytuje badanie, które nie istnieje.
        Modele językowe produkują płynny tekst, a nie sprawdzone fakty; badacze
        nazywają ten problem halucynacją (Ji i współpracownicy, 2023). Jeśli
        odpowiedź powołuje się na źródło, sprawdź je, zanim powtórzysz to dalej.
      </p>

      <h2>Słaba w: diagnozowaniu</h2>
      <p>
        Wpisz „boli mnie zewnętrzna strona kolana po 20 km”, a dostaniesz
        schludną odpowiedź o pasmie biodrowo-piszczelowym, z rozciąganiem i
        planem powrotu do biegania. Może to prawda. Może to też być coś zupełnie
        innego, a model nie ma jak tego stwierdzić: nie może cię zbadać,
        zobaczyć, jak biegasz, ani nacisnąć bolącego miejsca. Wiarygodnie
        brzmiąca odpowiedź na pytanie medyczne jest gorsza niż żadna, bo opóźnia
        wizytę, która by sprawę wyjaśniła. Ból, który się utrzymuje, sprawia, że
        kulejesz, nasila się w trakcie biegu albo występuje w spoczynku, to
        sprawa dla fizjoterapeuty albo lekarza.
      </p>

      <h2>Słaba w: pełnych planach od zera</h2>
      <p>
        Düking i współpracownicy (2024) poprosili ChatGPT o sześciotygodniowe
        plany biegowe i dali je do oceny ekspertom od trenowania według 22
        kryteriów. Przy niewielkiej ilości danych wejściowych plan wypadł
        poniżej środka skali w 19 z nich. Przy szczegółowych danych wypadł
        znacznie lepiej, ale autorzy i tak odradzają realizowanie takich planów
        bez doświadczonego trenera. Typowy błąd łatwo sobie wyobrazić: biegasz
        30 km tygodniowo, prosisz o plan maratoński, a pierwszy tydzień ma 50
        km, bo model uzupełnił twoją historię historią przeciętnego biegacza.
      </p>

      <h2>Słaba w: liczbach, których nie dostała</h2>
      <p>
        Zapytaj „ile przebiegłem we wrześniu?”, nie podając swoich danych, a
        model czatu może po prostu wymyślić wiarygodną liczbę. Nawet gdy wkleisz
        dane, sumowanie trzydziestu wierszy nie jest jego mocną stroną. Sumy,
        średnie i obliczenia obciążenia powinny pochodzić z oprogramowania,
        które je liczy, a model językowy powinien jedynie mówić o wyniku.
      </p>

      <h2>Jak dostać bardziej przydatne odpowiedzi</h2>
      <p>
        Daj mu kontekst: swoje strefy albo aktualne czasy z zawodów, tygodniową
        objętość z ostatnich czterech do sześciu tygodni, zawody i ich datę,
        dni, w które możesz trenować, i każdą obecną dolegliwość. Poproś, żeby
        podał swoje założenia, zanim cokolwiek napisze. Potem sprawdź wynik
        według kilku prostych zasad: bez dużego skoku tygodniowej objętości, bez
        większej liczby mocnych treningów, niż jesteś przyzwyczajony (dwa w
        tygodniu to dla większości biegaczy amatorów aż nadto), i spokojne dni,
        które naprawdę są spokojne.
      </p>

      <h2>W OpenAthlete</h2>
      <p>
        Funkcje AI w OpenAthlete pozostają po tekstowej stronie tej granicy.
        Piszą ustrukturyzowany trening z jednego zdania na podstawie twoich
        stref, zmieniają trening według krótkiego polecenia, zadają trzy czy
        cztery pytania po aktywności i zamieniają odpowiedzi na ocenę wysiłku i
        notatkę o bólu dla twojego trenera, a także dają krótkie omówienie
        każdej aktywności. Widzisz każdy trening, zanim trafi na zegarek. Nie
        stawiają żadnych diagnoz i działają tylko za twoją zgodą, na twoim
        własnym kluczu API albo w ramach limitu Supporter. Szczegóły znajdziesz
        na <Link href="/pl/features/ai-coach">stronie o AI</Link>.
      </p>

      <h2>Źródła</h2>
      <Sources />
    </div>
  );
}
