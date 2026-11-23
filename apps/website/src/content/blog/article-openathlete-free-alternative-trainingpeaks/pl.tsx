import Link from 'next/link';

import { pricesFor } from './prices';

const { quoted: q, coachYear } = pricesFor('pl');

export function ContentPl() {
  return (
    <div>
      <p>
        TrainingPeaks od dawna jest domyślną platformą treningową trenerów
        sportów wytrzymałościowych, i to z dobrych powodów: Performance
        Management Chart, słownictwo (TSS, CTL, TSB), którym mówi dziś pół
        środowiska, marketplace pełen planów i dojrzałe aplikacje mobilne.
        Powody, dla których ludzie szukają czegoś innego, dotyczą głównie
        pieniędzy. Darmowe konto Basic nie wysyła zaplanowanych treningów na
        zegarek, a trenerzy płacą za każdego zawodnika na Premium. Odkąd Garmin
        kupił TrainingPeaks 22 lipca 2026 roku, część osób chce też platformy,
        która nie należy do producenta zegarków. Ta kwestia ma własny artykuł,{' '}
        <Link href="/pl/blog/trainingpeaks-alternatives-after-garmin-acquisition">
          alternatywy dla TrainingPeaks po przejęciu przez Garmina
        </Link>
        ; ten trzyma się cen i funkcji.
      </p>
      <p>
        Ten artykuł porównuje cztery alternatywy pod kątem tego, ile kosztują i
        co potrafią: intervals.icu, Nolio, Final Surge i OpenAthlete, który
        tworzymy. Ceny pochodzą ze stron z cennikami poszczególnych dostawców,
        sprawdzonych 3 listopada 2026 roku. Ceny w dolarach amerykańskich są
        podane bez podatku, tak jak pokazują je dostawcy.
      </p>

      <h2>Ile kosztuje TrainingPeaks</h2>
      <p>
        Dla zawodnika Basic jest darmowy, a Premium kosztuje {q('tpMonth')}{' '}
        miesięcznie albo {q('tpYear')} rocznie. Wysyłanie ustrukturyzowanych
        treningów na zegarek to funkcja Premium i to główny powód, dla którego
        biegacze trenujący sami przechodzą na wyższy plan.
      </p>
      <p>
        Dla trenera plan podstawowy kosztuje {q('tpCoach')} miesięcznie i
        obejmuje czterech zawodników Basic i jednego Premium. Każdy kolejny
        zawodnik Premium to dodatkowe {q('tpPerMax')} miesięcznie, przy większej
        liczbie spadające do {q('tpPerMin')}, do tego dochodzi opłata startowa{' '}
        {q('tpSetup')}, znoszona kodem promocyjnym. W praktyce trener, którego
        wszyscy zawodnicy potrzebują treningów na zegarku, płaci około{' '}
        {coachYear('trainingpeaks', 10)} rocznie za dziesięciu zawodników i{' '}
        {coachYear('trainingpeaks', 30)} za trzydziestu, chyba że zawodnicy sami
        płacą za Premium.
      </p>

      <h2>Co porównywać</h2>
      <p>
        Listy funkcji wyglądają wszędzie podobnie. Cztery pytania lepiej
        odróżniają te platformy:
      </p>
      <ul>
        <li>
          Czy zaplanowane treningi trafiają na zegarek w darmowym planie i dla
          jakich marek?
        </li>
        <li>
          Jak liczone jest obciążenie treningowe i czy możesz zobaczyć wzór?
          Żadna z alternatyw nie używa TSS, więc liczby nie będą zgodne z tymi,
          do których przywykłeś.
        </li>
        <li>Jak rośnie cena dla trenera wraz z liczbą zawodników?</li>
        <li>
          Czy możesz wyciągnąć swoje dane i co się stanie, jeśli firma zakończy
          działalność? Today&apos;s Plan, płatna platforma trenerska, została
          zamknięta w marcu 2024 roku, a jej użytkownicy musieli przenieść
          każdego zawodnika.
        </li>
      </ul>

      <h2>intervals.icu</h2>
      <p>
        intervals.icu jest darmowy, z opcjonalnym planem Supporter za{' '}
        {q('icuMonth')} miesięcznie ({q('icuYear')} rocznie). To tutaj
        najmocniejsza opcja do analizy: krzywe mocy, własne wykresy i najdłuższa
        lista integracji, w tym Wahoo i Zwift dla treningów, których OpenAthlete
        nie obsługuje. Trenowanie jest darmowe; zespoły i organizacje potrzebują
        Supportera. Nie ma oficjalnych aplikacji mobilnych (istnieją aplikacje
        firm trzecich), a kod jest zamknięty. Jeśli jesteś zawodnikiem, który
        lubi dane i trenuje się sam, zacznij tutaj.
      </p>

      <h2>Nolio</h2>
      <p>
        Nolio, firma z Grenoble i partner francuskiej federacji
        lekkoatletycznej, ma hojny darmowy plan dla zawodników, który obejmuje
        synchronizację z zegarkiem i ustrukturyzowane treningi. Premium kosztuje{' '}
        {q('nolioPremium')} miesięcznie. Plany dla trenerów to {q('nStarter')}{' '}
        miesięcznie za 3 zawodników, {q('nClassic')} za 25 i {q('nPro')} za 30
        zawodników z dwoma trenerami. Istnieją plany klubowe dla stowarzyszeń,
        aplikacje są natywne i jest ponad 200 filmów z ćwiczeniami. Nolio nie
        reklamuje wbudowanej AI i tak jak pozostałe ma zamknięty kod. Nasze{' '}
        <Link href="/pl/blog/nolio-vs-trainingpeaks-vs-openathlete-2025-comparison">
          porównanie we trójkę z TrainingPeaks
        </Link>{' '}
        omawia stronę trenerską bardziej szczegółowo.
      </p>

      <h2>Final Surge</h2>
      <p>
        Final Surge jest darmowy dla zawodników. Trenerzy płacą stałą kwotę{' '}
        {q('fsStarter')} miesięcznie za 1 do 5 zawodników albo {q('fsPro')} za
        maksymalnie 100, bez opłaty za zawodnika. Ustrukturyzowane treningi
        trafiają na Garmin i COROS. Platforma jest skrojona pod amerykańskich
        trenerów biegania, szkoły i kluby, ze zniżkami dla szkół i natywnymi
        aplikacjami. Proste, uczciwe ceny; słabiej z analizą.
      </p>

      <h2>OpenAthlete</h2>
      <p>
        Na naszych serwerach wszystko, czego potrzebujesz do treningu, jest
        darmowe: kalendarz, kreator treningów, zaplanowane treningi wysyłane na
        Garmin, Suunto i COROS, obciążenie treningowe i prowadzenie do pięciu
        zawodników. Opcjonalny plan Supporter (od {q('oaMonth')} miesięcznie
        albo {q('oaYear')} rocznie) finansuje projekt i dodaje Lab, wcześniejszy
        dostęp do nowych funkcji, zaawansowane narzędzia trenerskie i kluby, AI
        na naszych kluczach i nieograniczoną liczbę prowadzonych zawodników. Kod
        jest na licencji AGPL-3.0, więc możesz też uruchomić go na własnym
        serwerze za darmo i bez limitów. Klub zakłada Supporter, a członkowie
        dołączają za darmo, bez limitu zawodników: grupy z własnymi trenerami,
        wspólna biblioteka treningów, cotygodniowe treningi klubowe i plany
        kopiowane do całej grupy.
      </p>
      <p>
        Obciążenie treningowe to TRIMP Banistra liczony z tętna, z session RPE
        obok, a kondycja, zmęczenie i forma są prognozowane na podstawie
        zaplanowanych treningów. Funkcje AI działają na twoim własnym kluczu
        (OpenAI, Anthropic, Mistral i inne) w każdym planie: ustrukturyzowany
        trening z jednego zdania, krótkie omówienie każdej aktywności i kilka
        pytań po każdym biegu, które zapisują wysiłek i ból dla trenera. Claude
        albo ChatGPT mogą też planować bezpośrednio w kalendarzu przez serwer
        MCP.
      </p>
      <p>
        Czego jeszcze nie robi: nie ma marketplace’u z planami, aplikacji do
        treningu w pomieszczeniu ani rozliczeń klubowych, a analiza mocy jest
        płytsza niż w intervals.icu. Treningi nie mogą trafiać na zegarki Polar,
        bo API Polar pozwala tylko na odczyt. Jednostki są wyłącznie metryczne.
      </p>

      <h2>Liczby obok siebie</h2>
      <table>
        <thead>
          <tr>
            <th></th>
            <th>Zawodnik trenujący sam, treningi na zegarku</th>
            <th>Trener z 10 zawodnikami, rocznie</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>TrainingPeaks</td>
            <td>Premium, {q('tpYear')}/rok</td>
            <td>{coachYear('trainingpeaks', 10)} (zawodnicy na Premium)</td>
          </tr>
          <tr>
            <td>intervals.icu</td>
            <td>Za darmo (Supporter {q('icuYear')}/rok opcjonalnie)</td>
            <td>Za darmo; zespoły potrzebują Supportera</td>
          </tr>
          <tr>
            <td>Nolio</td>
            <td>Za darmo</td>
            <td>{coachYear('nolio', 10)} (Classic)</td>
          </tr>
          <tr>
            <td>Final Surge</td>
            <td>Za darmo</td>
            <td>{coachYear('final-surge', 10)} (Pro)</td>
          </tr>
          <tr>
            <td>OpenAthlete</td>
            <td>Za darmo</td>
            <td>{q('oaYear')} (Supporter)</td>
          </tr>
        </tbody>
      </table>
      <p>
        Ceny katalogowe sprawdzone 3 listopada 2026 roku. Dostawcy je zmieniają;
        sprawdź ich strony, zanim podejmiesz decyzję.
      </p>

      <h2>Co do kogo pasuje</h2>
      <p>
        Zostań przy TrainingPeaks, jeśli sprzedajesz plany na jego marketplace,
        twoi zawodnicy polegają na TrainingPeaks Virtual albo całe twoje
        trenowanie opiera się na TSS i nie chcesz uczyć się liczb od nowa.
        Wybierz intervals.icu dla najgłębszej darmowej analizy, zwłaszcza z
        miernikiem mocy. Wybierz Nolio, jeśli prowadzisz francuski klub i chcesz
        cen dla stowarzyszeń i dojrzałych natywnych aplikacji. Wybierz Final
        Surge dla amerykańskiej drużyny szkolnej lub klubowej z prostymi,
        stałymi cenami. Wybierz OpenAthlete, jeśli chcesz treningów na Garmin,
        Suunto albo COROS bez płacenia, stałej ceny dla trenera, AI na własnym
        kluczu, klubu, do którego twoi zawodnicy dołączają za darmo, albo kodu,
        który możesz hostować sam.
      </p>

      <h2>Przenoszenie historii</h2>
      <p>
        Twoje aktywności są też na koncie twojego zegarka, które zwykle jest
        najłatwiejszym źródłem. W OpenAthlete Strava i COROS przenoszą całą
        twoją historię, Garmin i Suunto ostatnie 30 dni, a Polar tylko to, co
        zarejestrujesz po połączeniu; starsze pliki FIT, GPX i TCX można wgrać
        hurtowo. Zaplanowane treningi i plany nie przenoszą się między
        platformami, więc odtwórz swoje podstawowe treningi jako szablony.
        Masowego eksportu z TrainingPeaks nie sprawdziliśmy sami, więc zajrzyj
        do jego centrum pomocy, zanim zaczniesz na nim polegać.
      </p>
      <p>
        Jeśli chcesz wypróbować OpenAthlete,{' '}
        <Link href="/pl/pricing">strona z cennikiem</Link> pokazuje dokładnie,
        co jest darmowe, a co dodaje Supporter.
      </p>
    </div>
  );
}
