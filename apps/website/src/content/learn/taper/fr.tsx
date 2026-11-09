import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentFr() {
  return (
    <div>
      <p>
        L’affûtage, c’est la période d’entraînement allégé qui précède une
        course objectif. L’idée est ancienne et la logique simple&nbsp;: des
        semaines de travail vous rendent à la fois plus fort et plus fatigué, et
        la fatigue s’efface plus vite que la forme. En baissant la charge
        quelque temps, la fatigue se dissipe pendant que l’essentiel des acquis
        reste. Bien mené, l’affûtage vous amène au départ plus frais que vous ne
        l’avez été depuis des mois. Raté, parce qu’on a trop peu allégé ou trop
        coupé, il vous laisse encore fatigué ou un peu «&nbsp;éteint&nbsp;».
      </p>

      <h2>Ce que disent les études</h2>
      <p>
        Bosquet et ses collègues (2007) ont regroupé 27 études menées sur des
        athlètes de compétition en course, cyclisme et natation. Le schéma le
        plus efficace&nbsp;: un affûtage d’environ deux semaines, avec une
        baisse progressive du volume de 41 à 60&nbsp;%, sans toucher ni à
        l’intensité ni au nombre de séances par semaine. Mujika et Padilla
        (2003), en synthétisant la littérature antérieure, arrivaient à une
        recette voisine&nbsp;: garder l’intensité, réduire nettement le volume,
        ne pas baisser la fréquence de plus de 20&nbsp;% environ, et préférer
        une baisse progressive à une coupure brutale. Ils situaient le gain
        habituel autour de 3&nbsp;%, entre 0,5 et 6&nbsp;% selon les cas.
      </p>
      <p>
        Chez les marathoniens amateurs, Smyth et Lawlor (2021) ont analysé les
        carnets d’entraînement de plus de 158&nbsp;000 coureurs. Les affûtages
        stricts, où le volume baisse semaine après semaine, sont associés à de
        meilleurs chronos que les affûtages relâchés, et les affûtages stricts
        de trois semaines font le mieux, avec un gain médian d’environ cinq
        minutes et demie (2,6&nbsp;%) par rapport à un affûtage minimal. Ce sont
        des données d’observation&nbsp;: les coureurs les plus réguliers
        affûtent peut-être simplement mieux. Mais elles vont dans le même sens
        que les essais.
      </p>

      <h2>L’affûtage vu par la forme, la fatigue et la fraîcheur</h2>
      <p>
        Le <Link href="/fr/learn/ctl-atl-tsb">modèle forme-fatigue</Link> rend
        le mécanisme visible. La forme (CTL) est une moyenne exponentielle de la
        charge quotidienne avec une constante de temps de 42 jours, la fatigue
        (ATL) une moyenne avec une constante de 7 jours, et la fraîcheur (TSB)
        leur différence&nbsp;:
      </p>
      <Formula
        where={[
          'Poids quotidien de la CTL = 1 − e^(−1/42) ≈ 0,024',
          'Poids quotidien de l’ATL = 1 − e^(−1/7) ≈ 0,133',
        ]}
      >
        CTL(jour) = CTL(veille) + (charge − CTL(veille)) × 0,024
      </Formula>
      <p>
        Comme l’ATL réagit environ cinq fois et demie plus vite que la CTL, une
        baisse de charge fait chuter la fatigue bien plus vite que la forme, et
        la TSB remonte. Tout l’affûtage tient dans cette phrase.
      </p>

      <h2>Un exemple chiffré</h2>
      <p>
        Un marathonien vient de passer trois semaines à environ 560 de{' '}
        <Link href="/fr/learn/trimp">TRIMP</Link> par semaine (à peu près 80 km
        pour lui, soit 80 par jour en moyenne), après une base à 65 par jour.
        Pour garder des calculs lisibles, la charge est répartie uniformément
        sur chaque semaine.
      </p>
      <ul>
        <li>Début de l’affûtage&nbsp;: CTL 70,9, ATL 79,3, TSB −8,4.</li>
        <li>
          À J−14, le volume baisse de 30&nbsp;% (environ 56 km, 56 par jour). En
          fin de semaine&nbsp;: CTL 68,6, ATL 64,6, TSB +4,1.
        </li>
        <li>
          Semaine de course, volume à 45&nbsp;% du pic (environ 36 par jour, une
          trentaine de kilomètres avant le jour J). La veille&nbsp;: CTL 64,3,
          ATL 48,1, TSB +16,2.
        </li>
      </ul>
      <p>
        En deux semaines, la fatigue a perdu 31 points et la forme 6,6, soit
        environ 9&nbsp;%. Si le même coureur avait tout arrêté pendant ces 13
        jours, sa CTL serait tombée vers 52. Le modèle est grossier, mais il
        montre pourquoi on allège plutôt que de couper, et pourquoi l’effet se
        concentre sur les derniers jours.
      </p>

      <h2>Affûter en pratique</h2>
      <ul>
        <li>
          Marathon&nbsp;: deux à trois semaines. 10 km ou semi&nbsp;: une à deux
          semaines. Course secondaire&nbsp;: trois ou quatre jours plus légers.
        </li>
        <li>
          Baissez le volume progressivement&nbsp;: 20 à 30&nbsp;% la première
          semaine d’un affûtage de trois semaines, 40 à 60&nbsp;% la semaine de
          course. Raccourcissez d’abord la sortie longue.
        </li>
        <li>
          Gardez le rythme de la semaine et un peu d’intensité. Par exemple 3 ×
          2 km à allure marathon à J−10, puis 6 × 1 min un peu plus vite que
          l’allure course à J−4&nbsp;: les jambes restent habituées à la vitesse
          sans fatigue supplémentaire.
        </li>
        <li>
          Dormez, mangez normalement, et gardez les chaussures neuves, les
          nouveaux gels et les nouveaux exercices de renforcement pour après.
        </li>
      </ul>
      <p>
        Dans OpenAthlete, vous pouvez marquer ces semaines comme un cycle
        d’entraînement en phase d’affûtage, et les{' '}
        <Link href="/fr/features/training-load">
          courbes de charge d’entraînement
        </Link>{' '}
        sont projetées sur les séances prévues&nbsp;: vous voyez la fraîcheur
        visée pour le jour J avant même de courir la première séance d’affûtage.
      </p>

      <h2>Limites</h2>
      <p>
        Il n’existe pas de TSB cible validée pour le jour de course&nbsp;: le
        chiffre dépend de la façon dont la charge est mesurée et de l’athlète,
        et les meilleurs affûtages des études ont été jugés à la performance,
        pas à une courbe. Un affûtage ne rattrape pas une préparation trop
        courte, et il ne corrige pas en une semaine un surmenage accumulé. Les
        sensations trompent aussi&nbsp;: jambes lourdes et nervosité sont
        fréquentes et disparaissent en général au départ. Servez-vous des
        courbes pour planifier, et des séances à allure course pour juger.
      </p>
    </div>
  );
}
