import Link from 'next/link';

import { pricesFor } from './prices';

const { quoted: q, coachYear } = pricesFor('pl');

export function ContentPl() {
  return (
    <div>
      <p>
        Jeśli trenujesz sportowców wytrzymałościowych we Francji albo wszędzie
        tam, gdzie ton nadają francuskie kluby, wybór często sprowadza się do
        TrainingPeaks albo Nolio. Ten artykuł dodaje do nich OpenAthlete, który
        sami tworzymy, i porównuje wszystkie trzy z perspektywy trenera: ile
        płacisz, gdy rośnie liczba zawodników, czego potrzebują twoi zawodnicy i
        co każde z nich robi lepiej od pozostałych. Ceny pochodzą ze stron z
        cennikami poszczególnych dostawców, sprawdzonych 3 listopada 2026 roku.
        Ceny w dolarach są podane bez podatku, tak jak pokazuje je
        TrainingPeaks.
      </p>

      <h2>Trzy logiki cenowe</h2>
      <p>
        <strong>TrainingPeaks</strong> pobiera opłatę za zawodnika. Plan dla
        trenera zaczyna się od {q('tpCoach')} miesięcznie z czterema zawodnikami
        Basic i jednym Premium; każdy kolejny zawodnik Premium kosztuje{' '}
        {q('tpPerMax')} miesięcznie, a przy większej liczbie spada do{' '}
        {q('tpPerMin')}. Do tego dochodzi opłata startowa {q('tpSetup')},
        znoszona kodem promocyjnym. Zawodnicy mogą zostać na Basic (
        {q('tpCoachUnlimited')} miesięcznie obejmuje dowolną ich liczbę), ale
        wtedy ich zaplanowane treningi nie trafiają na zegarek, więc większość
        trenerów albo płaci za Premium, albo prosi zawodników, żeby sami płacili{' '}
        {q('tpYear')} rocznie.
      </p>
      <p>
        <strong>Nolio</strong> pobiera opłatę według progów. Starter kosztuje{' '}
        {q('nStarter')} miesięcznie za 3 zawodników, Classic {q('nClassic')} za
        25, a Pro {q('nPro')} za 30 zawodników z dwoma trenerami; dodatkowy
        trener to {q('nExtraCoach')} miesięcznie. Zawodnicy nie muszą płacić za
        synchronizację z zegarkiem: darmowy plan dla zawodnika ją obejmuje.
        Kluby mają własne plany, Club Starter za {q('nClubStarter')} i Club
        Classic za {q('nClubClassic')} miesięcznie.
      </p>
      <p>
        <strong>OpenAthlete</strong> jest darmowy do pięciu zawodników. Powyżej
        tej liczby plan Supporter, od {q('oaYear')} rocznie, znosi limit
        niezależnie od liczby zawodników, a do tego dodaje AI na naszych
        kluczach. Synchronizacja z zegarkiem jest dla zawodników darmowa.
        Samodzielny hosting jest darmowy i bez limitów. Kluby dostają darmową
        przestrzeń klubową, a zawodnicy, do których trener dociera przez klub,
        nie wliczają się do tych pięciu.
      </p>

      <table>
        <thead>
          <tr>
            <th>Zawodnicy</th>
            <th>TrainingPeaks (zawodnicy na Premium)</th>
            <th>Nolio</th>
            <th>OpenAthlete</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>3</td>
            <td>{coachYear('trainingpeaks', 3)}</td>
            <td>{coachYear('nolio', 3)} (Starter)</td>
            <td>Za darmo</td>
          </tr>
          <tr>
            <td>10</td>
            <td>{coachYear('trainingpeaks', 10)}</td>
            <td>{coachYear('nolio', 10)} (Classic)</td>
            <td>{q('oaYear')}</td>
          </tr>
          <tr>
            <td>25</td>
            <td>{coachYear('trainingpeaks', 25)}</td>
            <td>{coachYear('nolio', 25)} (Classic)</td>
            <td>{q('oaYear')}</td>
          </tr>
          <tr>
            <td>30</td>
            <td>{coachYear('trainingpeaks', 30)}</td>
            <td>{coachYear('nolio', 30)} (Pro)</td>
            <td>{q('oaYear')}</td>
          </tr>
        </tbody>
      </table>
      <p>
        Roczny koszt dla jednego trenera według cen katalogowych: rozliczenie
        miesięczne w Nolio i TrainingPeaks, najniższa roczna kwota Supporter w
        OpenAthlete. Ceny sprawdzone 3 listopada 2026 roku. Kolumna
        TrainingPeaks zakłada, że trener płaci za Premium każdego zawodnika;
        jeśli twoi zawodnicy już sami płacą za swoje, twój rachunek jest dużo
        niższy.
      </p>

      <h2>W czym każde z nich jest najlepsze</h2>
      <p>
        <strong>TrainingPeaks</strong> to wspólny język. Wielu zawodników
        przychodzi z kontem i historią treningów właśnie tam, wielu trenerów
        myśli kategoriami TSS i Performance Management Chart, a jeśli
        sprzedajesz plany, jego marketplace pokazuje je kupującym. Aplikacje
        mobilne są dojrzałe, a TrainingPeaks Virtual obejmuje jazdę w
        pomieszczeniu. Od 22 lipca 2026 roku należy do Garmina; co to może
        zmienić, omawiamy w artykule{' '}
        <Link href="/pl/blog/trainingpeaks-alternatives-after-garmin-acquisition">
          alternatywy dla TrainingPeaks po przejęciu przez Garmina
        </Link>
        .
      </p>
      <p>
        <strong>Nolio</strong> jest stworzone dla francuskich klubów. To firma z
        Grenoble, partner francuskiej federacji lekkoatletycznej, z cenami dla
        stowarzyszeń, kilkoma trenerami na jednym koncie, natywnymi aplikacjami
        na iOS i Androida oraz biblioteką ponad 200 filmów z ćwiczeniami do
        treningu siłowego. Jeśli twój klub chce jednego konta dla trzech
        trenerów i sześćdziesięciu członków, z natywnymi aplikacjami na każdym
        telefonie, Nolio ma plan dokładnie na to.
      </p>
      <p>
        <strong>OpenAthlete</strong> utrzymuje stałą cenę i dodaje kilka rzeczy,
        którymi dwa pozostałe się nie chwalą. AI działa na twoim własnym kluczu
        (albo w ramach limitu Supporter): piszesz „10 km spokojnie, potem 6 ×
        400 m w tempie na 5 km” i dostajesz ustrukturyzowany trening ze strefami
        zawodnika; po każdej aktywności zawodnik dostaje krótkie omówienie i
        kilka pytań, a zgłoszony wysiłek i ewentualny ból trafiają do dziennika
        kontuzji i na twój pulpit. Przez serwer MCP Claude albo ChatGPT mogą
        odczytać treningi zawodnika i zaplanować do 60 treningów w jego
        kalendarzu. Kluby dostają darmową przestrzeń klubową bez limitu
        zawodników: grupy z własnymi trenerami, wspólną bibliotekę, cotygodniowe
        treningi klubowe, na które zawodnicy odpowiadają, oraz trening, dzień
        albo tydzień skopiowany do całej grupy i dopasowany do stref każdego
        zawodnika. Kod jest na licencji AGPL-3.0, więc klub może też uruchomić
        własną instancję z logowaniem jednokrotnym (SSO) i rejestracją wyłącznie
        na zaproszenie.
      </p>

      <h2>Czego każdemu brakuje</h2>
      <p>
        TrainingPeaks nie wymienia na swoich stronach z cennikiem żadnej
        wbudowanej AI, a opłata za zawodnika szybko się sumuje, jeśli płacisz za
        Premium. Plany trenerskie Nolio są płatne od pierwszego zawodnika, a
        Nolio nie reklamuje AI. Żadne z nich nie jest open source.
      </p>
      <p>
        Luki OpenAthlete też są realne. Przestrzeń klubowa nie ma rozliczeń
        klubowych: składki członkowskie pozostają poza OpenAthlete. Brak
        marketplace’u, brak biblioteki filmów z ćwiczeniami, brak partnerstwa z
        federacją. Treningi trafiają na zegarki Garmin, Suunto i COROS, nie na
        Polar. Obciążenie treningowe to TRIMP Banistra liczony z tętna, z
        session RPE obok, więc liczby nie będą zgodne z TSS, jeśli twoi
        zawodnicy przychodzą z TrainingPeaks.
      </p>

      <h2>Trzech trenerów, trzy odpowiedzi</h2>
      <p>
        Trener działający sam, z dwunastoma biegaczami noszącymi mieszankę
        Forerunnerów, jednego COROS Pace i jednego Suunto: tutaj TrainingPeaks
        kosztuje najwięcej, chyba że zawodnicy sami płacą za Premium. Nolio
        Classic i OpenAthlete oba dają radę; różnica to {coachYear('nolio', 12)}{' '}
        wobec {q('oaYear')} rocznie, AI z jednej strony i bardziej dojrzałe
        aplikacje mobilne z drugiej.
      </p>
      <p>
        Klub z trzema trenerami i sześćdziesięcioma członkami: jeśli chcą
        partnera federacyjnego i biblioteki filmów z ćwiczeniami, najlepiej
        pasują plany klubowe Nolio. Jeśli nie, przestrzeń klubowa OpenAthlete
        załatwia sprawę za darmo, z grupami, wspólną biblioteką i wtorkowym
        treningiem na bieżni już w kalendarzu każdego członka. Samodzielnie
        hostowana instancja to opcja, jeśli ktoś w klubie chętnie zajmie się
        serwerem.
      </p>
      <p>
        Trener, który sprzedaje plany zawodnikom, z którymi nigdy nie rozmawia:
        zostań przy TrainingPeaks. Ani Nolio, ani OpenAthlete nie mają
        marketplace’u.
      </p>
      <p>
        Więcej szczegółów, ze źródłami dla każdego twierdzenia, na stronach{' '}
        <Link href="/pl/compare/nolio">OpenAthlete vs Nolio</Link> i{' '}
        <Link href="/pl/compare/trainingpeaks">
          OpenAthlete vs TrainingPeaks
        </Link>
        , a to, co OpenAthlete oferuje trenerom, na{' '}
        <Link href="/pl/coaches">stronie dla trenerów</Link>.
      </p>
    </div>
  );
}
