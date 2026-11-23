import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentPl() {
  return (
    <div>
      <p>
        TRIMP, skrót od training impulse (impuls treningowy), zamienia trening w
        jedną liczbę na podstawie dwóch rzeczy, które Twój zegarek i tak
        rejestruje: jak długo trwał trening i jak wysokie było tętno. Eric
        Banister zaproponował go w latach 70. jako dane wejściowe dla swojego
        modelu kondycji i zmęczenia, a większość wykresów obciążenia opartych na
        tętnie wciąż korzysta z jakiejś jego wersji. Jest na tyle prosty, że
        można go policzyć ręcznie, i to najlepszy sposób, żeby zobaczyć, co
        ujmuje, a co mu umyka.
      </p>

      <h2>Jak oblicza się TRIMP</h2>
      <p>
        TRIMP Banistera bierze wykorzystaną część Twojej rezerwy tętna, mnoży ją
        przez czas trwania, a potem stosuje wagę wykładniczą, tak że minuta w
        okolicy progu kosztuje dużo więcej niż minuta truchtu:
      </p>
      <Formula
        where={[
          'HRr = (HR − HRspocz) / (HRmax − HRspocz), czyli wykorzystana część rezerwy tętna',
          'y = 0,64 i k = 1,92 dla mężczyzn; y = 0,86 i k = 1,67 dla kobiet',
        ]}
      >
        TRIMP = minuty × HRr × y × e^(k × HRr)
      </Formula>
      <p>
        Wagę dopasowano do tego, jak mleczan we krwi rośnie wraz z tętnem:
        prawie płasko przy niskiej intensywności, stromo w pobliżu progu
        (Morton, Fitz-Clarke i Banister, 1990). Oba zestawy współczynników to
        średnie dla mężczyzn i kobiet z tych badań. Nikt nie wykazał, że
        dokładnie pasują do konkretnego zawodnika, więc TRIMP równy 112 nie jest
        w praktyce precyzyjniejszy niż 105.
      </p>
      <p>
        Wzór możesz zastosować raz, do średniego tętna z całego treningu, albo
        minuta po minucie (sekunda po sekundzie, jeśli masz zapisany przebieg) i
        zsumować części. Drugi sposób jest lepszy, z powodu, który konkretnie
        pokazuje poniższy przykład.
      </p>

      <h2>Przykład z obliczeniami</h2>
      <p>
        Biegacz z tętnem spoczynkowym 48 i maksymalnym 188 ma rezerwę 140
        uderzeń. Biegnie 45 minut przy średnim tętnie 150&nbsp;bpm.
      </p>
      <ul>
        <li>HRr = (150 − 48) / 140 = 0,729</li>
        <li>Waga = 0,64 × e^(1,92 × 0,729) = 0,64 × 4,05 = 2,59</li>
        <li>TRIMP = 45 × 0,729 × 2,59 = 85</li>
      </ul>
      <p>
        Ze współczynnikami dla kobiet ten sam bieg daje 95. To samo serce, ten
        sam bieg, 12&nbsp;% różnicy wyłącznie z powodu wyboru współczynników.
      </p>
      <p>
        Teraz rozłóż 20 minut o tej samej średniej inaczej: 10 minut przy
        175&nbsp;bpm i 10 minut przy 125&nbsp;bpm. Liczony ze średniej
        (150&nbsp;bpm przez 20 minut) TRIMP wynosi 38. Liczony blok po bloku
        daje 33 + 10 = 43, czyli około 15&nbsp;% więcej. Ponieważ waga jest
        wykładnicza, ciężkie minuty dodają więcej, niż łatwe odejmują, a średnia
        spłaszcza dokładnie tę część, która Cię męczy. Dlatego treningi
        interwałowe są niedoszacowane, gdy używa się tylko średniego tętna.
      </p>

      <h2>Jak wykorzystać TRIMP w treningu</h2>
      <p>
        Wynik pojedynczego treningu niewiele daje. TRIMP staje się przydatny,
        kiedy go sumujesz: tygodniowa suma do porównywania bloków i dzienna
        seria, która zasila{' '}
        <Link href="/pl/learn/ctl-atl-tsb">
          krzywe kondycji, zmęczenia i formy
        </Link>{' '}
        (CTL, ATL, TSB). Pomaga kilka nawyków:
      </p>
      <ul>
        <li>
          Aktualizuj tętno spoczynkowe i maksymalne. Tętno maksymalne ustawione
          o 10 uderzeń za wysoko zmniejsza każde HRr i obniża każdy wynik.
        </li>
        <li>
          Porównuj się ze sobą. Tygodniowe 600 w liczbach bezwzględnych nic nie
          znaczy; przejście z 450 do 650 w dwa tygodnie już tak.
        </li>
        <li>
          Czytaj TRIMP razem z odczuciami z treningu. Kiedy zwykły spokojny bieg
          daje o 20&nbsp;% więcej niż normalnie, upał, słaby sen albo
          nadchodzące przeziębienie są bardziej prawdopodobnym wyjaśnieniem niż
          nagła zmiana kondycji.
        </li>
      </ul>
      <p>
        OpenAthlete liczy TRIMP Banistera z tętna sekunda po sekundzie dla
        każdej aktywności (ze średniej, gdy brak przebiegu), z powyższymi
        współczynnikami, i pokazuje obok niego{' '}
        <Link href="/pl/learn/session-rpe">session RPE</Link>.{' '}
        <Link href="/pl/features/training-load">
          Strona o obciążeniu treningowym
        </Link>{' '}
        zawiera kalkulator i linki do kodu źródłowego.
      </p>

      <h2>Ograniczenia</h2>
      <p>
        Tętno jest miarą wewnętrzną i reaguje z opóźnieniem. Podczas
        30-sekundowych sprintów czy krótkich podbiegów ledwie zdąży wzrosnąć,
        więc TRIMP zaniża pracę beztlenową i nerwowo-mięśniową. Treningi siłowe,
        zbiegi i uszkodzenia mięśni po biegu górskim prawie się nie pokazują.
        Upał, odwodnienie, kofeina i wysokość podnoszą tętno przy tej samej
        pracy, a <Link href="/pl/learn/aerobic-decoupling">dryf tętna</Link>{' '}
        zawyża drugą połowę długich wysiłków. Wreszcie wzór ignoruje dyscyplinę:
        godzina przy 140&nbsp;bpm na rowerze i godzina przy 140&nbsp;bpm biegiem
        dają ten sam wynik, choć bieg zwykle zostawia więcej śladów. Łącz TRIMP
        z oceną subiektywną i traktuj go jako trend, a nie wyrok.
      </p>
    </div>
  );
}
