import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentFr() {
  return (
    <div>
      <p>
        La fréquence cardiaque de réserve, c’est la plage dont votre cœur
        dispose réellement&nbsp;: votre fréquence maximale moins votre fréquence
        de repos. Un coureur à 50 au repos et 190 au maximum a 140 battements de
        réserve. Construire ses zones sur cette plage plutôt que sur un simple
        pourcentage de la FC max, c’est ce qu’on appelle la méthode de Karvonen,
        du nom du physiologiste finlandais Martti Karvonen, qui l’a utilisée en
        1957 dans une étude sur la baisse de la fréquence cardiaque avec
        l’entraînement.
      </p>
      <p>
        Son intérêt&nbsp;: elle tient compte de votre point de départ. Deux
        coureurs avec la même FC max mais des fréquences de repos différentes
        n’ont pas la même endurance fondamentale en battements par minute, et la
        réserve le voit. Elle colle aussi mieux à la physiologie&nbsp;: Swain et
        Leutholtz (1997) ont montré qu’un pourcentage de la FC de réserve
        correspond au même pourcentage de la réserve de consommation d’oxygène,
        alors qu’un pourcentage de la FC max ne correspond pas au même
        pourcentage de la VO2max.
      </p>

      <h2>Le calcul</h2>
      <Formula
        where={[
          'FCR = FCmax − FCrepos, en battements par minute',
          'intensité = la part de la réserve visée, 0,6 pour 60 %',
        ]}
      >
        FC cible = FCrepos + (FCmax − FCrepos) × intensité
      </Formula>
      <p>
        Les cinq zones habituelles sont des tranches de 10&nbsp;% de la
        réserve&nbsp;: 50–60&nbsp;%, 60–70&nbsp;%, 70–80&nbsp;%, 80–90&nbsp;% et
        90–100&nbsp;%. Ces pourcentages sont des conventions, pas des seuils
        mesurés sur vous, et cela compte pour la suite.
      </p>

      <h2>Un exemple chiffré</h2>
      <p>FC de repos 50 bpm, FC max 190 bpm, soit 140 battements de réserve.</p>
      <ul>
        <li>Zone 1 (50–60&nbsp;%)&nbsp;: 50 + 0,5 × 140 = 120 à 134 bpm</li>
        <li>Zone 2 (60–70&nbsp;%)&nbsp;: 134 à 50 + 0,7 × 140 = 148 bpm</li>
        <li>Zone 3 (70–80&nbsp;%)&nbsp;: 148 à 162 bpm</li>
        <li>Zone 4 (80–90&nbsp;%)&nbsp;: 162 à 176 bpm</li>
        <li>Zone 5 (90–100&nbsp;%)&nbsp;: 176 à 190 bpm</li>
      </ul>
      <p>
        En pourcentage de la FC max, la même zone 2 irait de 114 à 133 bpm, une
        bonne quinzaine de battements plus bas. Pour un coureur entraîné, 114
        bpm, c’est à peine trottiner&nbsp;: beaucoup de ceux qui passent à
        Karvonen découvrent que leurs footings ne ressemblent plus à de la
        marche.
      </p>
      <p>
        Gardez la FC max à 190 mais montez la FC de repos à 65. La réserve tombe
        à 125 battements et la zone 2 devient 65 + 0,6 × 125 = 140 à 65 + 0,7 ×
        125 = 152,5, soit environ 140 à 153 bpm. Même maximum, autre zone, parce
        que le point de départ a bougé.
      </p>

      <h2>Bien mesurer les deux valeurs</h2>
      <p>
        La FC de repos se prend allongé au réveil, avant le café, sur plusieurs
        matins&nbsp;; retenez une valeur typique, pas la plus basse jamais vue.
        Les montres affichent souvent le minimum nocturne, quelques battements
        plus bas, ce qui gonfle un peu la réserve.
      </p>
      <p>
        La FC max est plus délicate. La valeur la plus haute relevée en fin de
        course, ou après la dernière d’une série de côtes à fond, vaut mieux que
        n’importe quelle formule. À défaut, Tanaka, Monahan et Seals (2001)
        proposent 208 − 0,7 × âge, soit 180 bpm à 40 ans. C’est une moyenne de
        population&nbsp;: beaucoup de gens s’en écartent de 10 battements ou
        plus, et une FC max surestimée de 10 battements décale chaque zone de 6
        à 9 battements vers le haut.
      </p>

      <h2>L’utiliser à l’entraînement</h2>
      <p>
        Les zones cardiaques sont à l’aise sur les efforts longs et réguliers,
        quand le cœur a le temps de se stabiliser. Footings et sorties longues
        en <Link href="/fr/learn/zone-2">zone 2</Link> en sont l’exemple
        type&nbsp;: 134 à 148 bpm pour le coureur ci-dessus, quelle que soit
        l’allure un jour de vent ou de relief. Un tempo de 30 à 40 minutes en
        zone 3, ou 2 × 15 minutes en haut de zone 4 (vers 169 à 173 bpm, 85 à
        88&nbsp;% de la réserve), se pilotent aussi très bien au cardio.
      </p>
      <p>
        Sur du fractionné court, comme 5 × 4 minutes au seuil, la fréquence
        cardiaque est en retard sur l’effort&nbsp;: elle met une à deux minutes
        à monter, et la première répétition paraît facile sur la montre alors
        qu’elle ne l’est pas. Pilotez ces séances à l’allure ou à la puissance,
        et servez-vous du cardio après coup pour vérifier que la séance a fait
        son effet. La même fraction de réserve alimente aussi les scores de
        charge comme le <Link href="/fr/learn/trimp">TRIMP</Link>&nbsp;: des
        valeurs de repos et de max justes servent donc deux fois.
      </p>
      <p>
        Le{' '}
        <Link href="/fr/tools/heart-rate-zones">
          calculateur de zones cardiaques
        </Link>{' '}
        fait le calcul avec les deux méthodes. Dans OpenAthlete, les zones
        cardiaques se définissent en pourcentage de la FC max ou de la réserve,
        la réserve est calculée à partir de vos métriques de FC de repos et de
        FC max, et les étapes d’une séance peuvent viser un pourcentage de la FC
        de réserve.
      </p>

      <h2>Limites</h2>
      <p>
        Tout repose sur deux valeurs, et aucune n’est stable. La FC de repos
        varie de plusieurs battements avec le sommeil, le stress, la chaleur ou
        un rhume qui couve&nbsp;; la FC à l’effort monte avec la chaleur, la
        déshydratation, la caféine et l’altitude, et dérive vers le haut sur les
        efforts longs. Certains médicaments, les bêtabloquants surtout,
        modifient les deux bornes.
      </p>
      <p>
        La limite principale&nbsp;: 60, 70 ou 80&nbsp;% de la réserve sont les
        mêmes pour tout le monde, la physiologie non. Le{' '}
        <Link href="/fr/learn/lactate-threshold">seuil lactique</Link> d’un
        coureur tombe à 82&nbsp;% de sa réserve, celui d’un autre à 90&nbsp;%.
        Si vous connaissez votre FC au seuil, par un test en laboratoire ou un
        effort de 30 minutes en course, caler vos zones dessus est plus juste.
        Karvonen reste un bon point de départ quand vous ne la connaissez pas.
      </p>
    </div>
  );
}
