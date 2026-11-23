import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentPl() {
  return (
    <div>
      <p>
        Km-effort to sposób biegaczy górskich na wliczenie podbiegów w dystans:
        każde 100 metrów przewyższenia liczy się jako jeden dodatkowy kilometr.
        Bieg na 25 km z 1000 m D+ to 35 km-effort i można go porównać z
        35-kilometrowym biegiem po asfalcie albo z inną trasą terenową o tej
        samej sumie uczciwiej niż samym dystansem.
      </p>
      <p>
        To konwencja, a nie prawo fizjologii. Wyrosła we francuskim trail
        runningu (<em>kilomètre-effort</em>), gdzie trenerzy i organizatorzy
        potrzebowali szybkiego sposobu na opisanie trudności trasy, a ITRA używa
        tej samej sumy, dystansu plus D+ podzielonego przez 100, do
        klasyfikowania biegów. Jej urok polega na tym, że policzysz ją w głowie
        na linii startu.
      </p>

      <h2>Jak liczy się km-effort</h2>
      <Formula
        where={[
          'km = dystans trasy lub biegu',
          'D+ = suma przewyższeń w metrach',
        ]}
      >
        km-effort = km + D+ / 100
      </Formula>
      <p>
        Zbiegi są pomijane: nie dają ani premii, ani kary. Niektórzy trenerzy
        inaczej ważą podbiegi na bardzo stromych albo bardzo biegowych trasach,
        a niektórzy doliczają część zbiegów, ale 100 m na kilometr to
        najpopularniejsza wersja i ta używana tutaj.
      </p>
      <p>
        Gdy masz km-effort, możesz zamienić dawny start w prognozę.{' '}
        <Link href="/pl/tools/trail-time-estimator">
          Kalkulator czasu biegu górskiego
        </Link>{' '}
        stosuje wzór wytrzymałościowy Petera Riegela do km-effort zamiast do
        dystansu:
      </p>
      <Formula
        where={[
          'T_ref, E_ref = czas i km-effort biegu, który już masz za sobą',
          'E = km-effort docelowego biegu',
          'k = 1,06 (wartość Riegela dla ulicy) dla dolnej granicy, 1,10 dla górnej',
        ]}
      >
        T = T_ref × (E / E_ref)^k
      </Formula>

      <h2>Przykład z liczbami</h2>
      <ul>
        <li>
          Punkt odniesienia: trasa 25 km z 1000 m D+, czyli 25 + 1000 / 100 = 35
          km-effort, ukończona w 3:00:00. To 10&nbsp;800 s / 35 = 5:09 na
          km-effort.
        </li>
        <li>Cel: 42 km z 2000 m D+, czyli 42 + 20 = 62 km-effort.</li>
        <li>Dolna granica: 3:00:00 × (62 / 35)^1,06 = 5 h 30 min.</li>
        <li>Górna granica: 3:00:00 × (62 / 35)^1,10 = 5 h 38 min.</li>
        <li>
          Czyli od 5 h 30 min do 5 h 38 min, około 5:20 na km-effort i średnio
          7,5 km/h na rzeczywistych 42 km.
        </li>
      </ul>
      <p>
        Wykładnik 1,06 pochodzi z prac Riegela nad rekordami ulicznymi i
        bieżniowymi. Górna granica 1,10 to nasze założenie na dodatkowe
        spowolnienie podczas długich dni w terenie, a nie opublikowana wartość,
        dlatego wynik jest przedziałem, a nie czasem co do minuty.
      </p>

      <h2>Jak wykorzystać go w treningu</h2>
      <p>
        Licz swój tydzień w km-effort, a nie tylko w kilometrach. Dwanaście
        kilometrów z 600 m przewyższenia to 18 km-effort: tydzień 55 km z 2000 m
        D+ to 75 km-effort, tyle co 75 km po płaskim, a plan liczący tylko
        kilometry przeciąży Cię, nic o tym nie mówiąc.
      </p>
      <p>
        Dobieraj długie wybiegania według km-effort. Jeśli docelowy bieg ma 62
        km-effort, długie wybieganie na 30 do 35 km-effort z realistycznym
        udziałem podbiegów powie Ci znacznie więcej niż płaskie 30 km. Trzymaj
        D+ na kilometr blisko wartości z zawodów: około 30 m/km na trasie
        pagórkowatej, 60 m/km lub więcej na alpejskiej.
      </p>
      <p>
        Używaj tempa na km-effort jako zgrubnej miary formy na różnych trasach.
        Jeśli Twoje tempo na km-effort na podobnym terenie spada przez cały blok
        treningowy, to lepszy znak niż jakakolwiek pojedyncza szybka pętla.{' '}
        <Link href="/pl/training-plans/trail">
          Plany treningowe do biegów górskich
        </Link>{' '}
        są zbudowane wokół takiej progresji, a o samych podbiegach{' '}
        <Link href="/pl/learn/grade-adjusted-pace">
          tempo skorygowane o nachylenie
        </Link>{' '}
        mówi, ile każdy kosztował energii.
      </p>

      <h2>Ograniczenia</h2>
      <p>
        Jedna reguła dla wszystkich nachyleń to uproszczenie. Na łagodnym,
        biegowym podbiegu 100 m D+ kosztuje mniej niż kilometr; na
        25-procentowej ścianie, gdzie idziesz z kijami, może kosztować więcej.
        Jeszcze ważniejsza jest nawierzchnia: kamienie, korzenie, błoto, śnieg i
        piarg spowalniają znacznie bardziej, niż sugeruje przewyższenie, a dwa
        biegi z tym samym km-effort mogą skończyć się bardzo różnymi czasami.
      </p>
      <p>
        Pominięcie zbiegów to największa ślepa plamka. Na trasie z długimi,
        stromymi zbiegami w drugiej połowie tempo dyktują Twoje mięśnie
        czworogłowe, a nie płuca, i km-effort tego nie przewidzi. Noc, wysokość
        powyżej około 2000 m, upał i czas spędzony na punktach odżywczych też są
        poza wzorem. Punkt odniesienia z biegu ulicznego zakłada biegowe ścieżki
        i przenosi Twoją prędkość z asfaltu na podbiegi: w technicznym terenie
        spodziewaj się czasu poza przedziałem.
      </p>
      <p>
        Wreszcie km-effort nic nie mówi o indeksie UTMB czy ITRA, które używają
        własnych modeli. Traktuj go jako wspólną walutę do planowania, a nie
        jako ocenę.
      </p>
    </div>
  );
}
