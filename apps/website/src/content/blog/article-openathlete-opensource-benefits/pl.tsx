import Link from 'next/link';

export function ContentPl() {
  return (
    <div>
      <p>
        Kilka lat historii treningowej to mnóstwo materiału: każdy trening
        interwałowy, każdy wykres tętna, każda notatka w stylu „spałem pięć
        godzin, nogi martwe”. Dla trenera to jeszcze więcej: lata
        ustrukturyzowanych treningów, szablonów i sezonów zbudowanych dla
        każdego zawodnika. Gdzie ten materiał się znajduje i kto decyduje, co
        się z nim stanie, wydaje się abstrakcyjnym pytaniem aż do dnia, w którym
        platforma zostaje zamknięta albo zmienia właściciela.
      </p>

      <h2>Platformy znikają i zmieniają właścicieli</h2>
      <p>
        Today’s Plan, platforma do treningu i coachingu, została zamknięta w
        marcu 2024 roku. Jej użytkownicy musieli wyeksportować, co się dało, i
        zaczynać od nowa gdzie indziej. W lipcu 2026 roku Garmin{' '}
        <a href="https://www.garmin.com/en-US/newsroom/press-release/corporate/garmin-acquires-trainingpeaks-and-trainheroic-leading-endurance-and-strength-training-platforms-for-athletes-and-coaches/">
          przejął TrainingPeaks i TrainHeroic
        </a>
        . TrainingPeaks działa dalej i nic nie wskazuje, że inne marki będą
        traktowane inaczej. Ale plany, biblioteki treningów i relacje z
        zawodnikami wielu trenerów sportów wytrzymałościowych należą teraz do
        producenta zegarków, a decyzje dotyczące tej platformy będą podejmowane
        z myślą o interesach Garmina.
      </p>
      <p>
        Nie ma w tym nic skandalicznego. Firmy są kupowane, a czasem upadają.
        Chodzi o to, że na zamkniętej platformie Twoja historia treningowa jest
        tylko tak trwała jak firma, która za nią stoi.
      </p>

      <h2>Co naprawdę daje Ci „eksport danych”</h2>
      <p>
        Jeśli mieszkasz w UE, art. 20 RODO daje Ci prawo do przenoszenia danych:
        danych, które dostarczyłeś, w ustrukturyzowanym formacie nadającym się
        do odczytu maszynowego. W praktyce to, co możesz zabrać, bardzo się
        różni. Pliki aktywności (FIT, GPX) zwykle wychodzą bez problemu, bo
        każde narzędzie je odczytuje. Zaplanowane treningi, komentarze trenera,
        szablony i sposób, w jaki zbudowano sezon, to co innego: zwykle są
        przechowywane we własnym formacie platformy i nawet jeśli możesz je
        wyeksportować, nic innego może nie umieć ich zaimportować.
      </p>
      <p>
        Dwa nawyki pomagają niezależnie od narzędzia. Wysyłaj swoje aktywności w
        więcej niż jedno miejsce, na przykład z konta zegarka zarówno na
        platformę treningową, jak i do drugiej usługi, żeby żadna firma nie
        miała jedynej kopii. I raz w roku poproś o pełny eksport, zanim będzie
        Ci potrzebny, żeby zobaczyć, co faktycznie byś dostał.
      </p>

      <h2>Co zmienia open source, a czego nie</h2>
      <p>
        Kod OpenAthlete jest{' '}
        <a href="https://github.com/openathleteorg/openathlete">publiczny</a>.
        Ma to kilka konkretnych konsekwencji. Możesz przeczytać, jak liczone
        jest obciążenie treningowe, zamiast ufać czarnej skrzynce. Możesz
        zobaczyć, które dane opuszczają serwer i dokąd trafiają. A gdyby projekt
        jutro się zakończył, kod, schemat bazy danych i pliki migracji nadal by
        istniały i każdy mógłby go dalej uruchamiać. Same dane znajdują się w
        zwykłej bazie PostgreSQL, a nie w formacie, który rozumie tylko jedna
        firma.
      </p>
      <p>
        Open source sam w sobie nie czyni oprogramowania bezpiecznym. Kod,
        którego nikt nie czyta, nie jest bezpieczniejszy tylko dlatego, że jest
        publiczny, a mały projekt ma mniej recenzentów niż popularny. Nie
        gwarantuje też, że ktoś będzie go dalej rozwijał. Gwarantuje natomiast,
        że wolno Ci zajrzeć do środka i że istnieje możliwość kontynuowania bez
        pierwotnego autora.
      </p>

      <h2>Dlaczego AGPL</h2>
      <p>
        OpenAthlete jest udostępniany na licencji{' '}
        <a href="https://www.gnu.org/licenses/agpl-3.0.html">
          GNU Affero General Public License v3
        </a>
        . Każdy może go używać, modyfikować, uruchamiać i rozpowszechniać.
        Warunek jest taki, że jeśli go zmodyfikujesz i udostępnisz swoją wersję
        innym przez sieć, musisz zaoferować tym użytkownikom kod źródłowy swojej
        wersji. Zwykła licencja GPL nie wymaga tego od oprogramowania
        działającego jako usługa internetowa i właśnie dlatego istnieje wariant
        Affero.
      </p>
      <p>
        W praktyce oznacza to, że nikt nie może wziąć OpenAthlete, dodać funkcji
        i sprzedawać go jako zamkniętej usługi hostowanej. Ulepszenia
        wprowadzone przez każdego, kto uruchamia go dla innych, wracają do
        wszystkich. Hostowana wersja na openathlete.org działa na tym samym
        publicznym kodzie; funkcje, które mają sens tylko tam, takie jak
        płatności, są wyłączone, dopóki nie zostaną skonfigurowane.
      </p>

      <h2>Self-hosting bez upiększeń</h2>
      <p>
        Możesz uruchomić OpenAthlete na własnym serwerze za pomocą pliku{' '}
        <code>docker-compose.yml</code> z repozytorium albo obrazów
        opublikowanych w GHCR. Potrzebuje PostgreSQL i Redisa, oba są zawarte w
        pliku compose. Jest darmowy, bez limitu zawodników i bez paywalla.
        Instancja hostowana samodzielnie nie wysyła niczego do OpenAthlete, a
        automatyczny test sprawdza to przy każdym wydaniu. Możesz podłączyć
        jednokrotne logowanie (SSO) przez OIDC, wybrać rejestrację otwartą,
        tylko na zaproszenie lub zamkniętą i uruchamiać funkcje AI na lokalnym
        modelu przez Ollamę, tak żeby nic nie opuszczało Twojego komputera.
      </p>
      <p>
        Koszty są jednak realne. Odpowiadasz za kopie zapasowe, aktualizacje i
        bezpieczeństwo. Połączenia z zegarkami korzystają z Twoich własnych
        danych dostępowych dewelopera u każdego dostawcy: niektóre, jak Strava,
        dostaniesz szybko, inne, jak Garmin, weryfikują wnioski przed
        przyznaniem dostępu do API. Wgrywanie plików FIT, GPX lub TCX działa bez
        tego wszystkiego. Self-hosting ma największy sens dla trenera lub grupy,
        w której ktoś swobodnie radzi sobie z utrzymaniem serwera, albo dla
        organizacji, która potrzebuje danych swoich zawodników na własnej
        infrastrukturze.{' '}
        <Link href="/pl/self-hosting">Strona o self-hostingu</Link> opisuje
        konfigurację.
      </p>

      <h2>Jeśli wolisz nie utrzymywać serwera</h2>
      <p>
        Wersja hostowana jest darmowa i zawiera wszystkie funkcje. Jej API i
        baza danych działają w OVH we Francji, a aplikację webową serwuje
        Vercel. Plan Supporter (od 5&nbsp;€ miesięcznie lub 50&nbsp;€ rocznie)
        dodaje AI na kluczach OpenAthlete i coaching dla więcej niż pięciu
        zawodników, a do tego pomaga opłacić serwery. Więcej o tym, co stoi za
        projektem, znajdziesz na{' '}
        <Link href="/pl/open-source">stronie o open source</Link>.
      </p>
    </div>
  );
}
