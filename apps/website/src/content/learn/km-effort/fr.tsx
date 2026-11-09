import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentFr() {
  return (
    <div>
      <p>
        Le kilomètre-effort est la façon dont les traileurs convertissent le
        dénivelé en distance&nbsp;: chaque tranche de 100 m de D+ compte pour un
        kilomètre de plus. Un trail de 25 km avec 1&nbsp;000 m de D+ fait 35
        km-effort, et se compare plus honnêtement à 35 km sur route, ou à un
        autre trail du même total, qu’en regardant la seule distance.
      </p>
      <p>
        C’est une convention, pas une loi de la physiologie. Elle est née dans
        le trail français, où entraîneurs et organisateurs avaient besoin d’un
        moyen rapide de dire si un parcours était dur, et l’ITRA utilise la même
        somme, distance plus D+ divisé par 100, pour classer les courses. Son
        intérêt&nbsp;: elle se calcule de tête sur la ligne de départ.
      </p>

      <h2>Comment se calcule le km-effort</h2>
      <Formula
        where={[
          'km = distance du parcours ou de la sortie',
          'D+ = dénivelé positif total en mètres',
        ]}
      >
        km-effort = km + D+ / 100
      </Formula>
      <p>
        La descente est ignorée&nbsp;: elle n’apporte ni bonus ni pénalité.
        Certains entraîneurs pondèrent la montée différemment sur des parcours
        très raides ou très roulants, d’autres ajoutent une part du D−, mais 100
        m pour un kilomètre reste la version courante, celle utilisée ici.
      </p>
      <p>
        Avec le km-effort, une course passée devient une prédiction. L’
        <Link href="/fr/tools/trail-time-estimator">
          estimateur de temps en trail
        </Link>{' '}
        applique la formule d’endurance de Peter Riegel au km-effort plutôt qu’à
        la distance&nbsp;:
      </p>
      <Formula
        where={[
          'T_ref, E_ref = temps et km-effort d’une course que vous avez courue',
          'E = km-effort de la course visée',
          'k = 1,06 (valeur de Riegel sur route) pour la borne basse, 1,10 pour la borne haute',
        ]}
      >
        T = T_ref × (E / E_ref)^k
      </Formula>

      <h2>Exemple chiffré</h2>
      <ul>
        <li>
          Référence&nbsp;: un trail de 25 km et 1&nbsp;000 m de D+, soit 25 +
          1&nbsp;000 / 100 = 35 km-effort, bouclé en 3:00:00. Cela fait
          10&nbsp;800 s / 35 = 5:09 par km-effort.
        </li>
        <li>
          Objectif&nbsp;: 42 km et 2&nbsp;000 m de D+, soit 42 + 20 = 62
          km-effort.
        </li>
        <li>Borne basse&nbsp;: 3:00:00 × (62 / 35)^1,06 = 5&nbsp;h&nbsp;30.</li>
        <li>Borne haute&nbsp;: 3:00:00 × (62 / 35)^1,10 = 5&nbsp;h&nbsp;38.</li>
        <li>
          Soit 5&nbsp;h&nbsp;30 à 5&nbsp;h&nbsp;38, environ 5:20 par km-effort
          et 7,5 km/h de moyenne sur les 42 km réels.
        </li>
      </ul>
      <p>
        L’exposant 1,06 vient des travaux de Riegel sur les records sur route et
        sur piste. La borne haute de 1,10 est notre hypothèse pour le
        ralentissement supplémentaire des longues journées en trail, pas une
        valeur publiée&nbsp;: c’est pour cela que vous obtenez une fourchette et
        non un temps à la minute.
      </p>

      <h2>L’utiliser à l’entraînement</h2>
      <p>
        Comptez vos semaines en km-effort autant qu’en kilomètres. 12 km avec
        600 m de D+ font 18 km-effort&nbsp;; une semaine de 55 km avec
        2&nbsp;000 m de D+ en fait 75, autant que 75 km sur le plat. Un plan qui
        ne compte que les kilomètres vous surcharge sans le dire.
      </p>
      <p>
        Choisissez vos sorties longues en km-effort. Si la course visée fait 62
        km-effort, une sortie longue de 30 à 35 km-effort avec une part de D+
        réaliste vous apprend bien plus que 30 km sur le plat. Gardez un D+ par
        kilomètre proche de celui de la course&nbsp;: autour de 30 m/km sur un
        parcours roulant, 60 m/km ou plus pour un trail alpin.
      </p>
      <p>
        L’allure par km-effort donne une idée grossière de la forme d’un
        parcours à l’autre. Si elle baisse au fil d’un bloc sur des terrains
        comparables, c’est un meilleur signe qu’une boucle rapide isolée. Les{' '}
        <Link href="/fr/training-plans/trail">plans d’entraînement trail</Link>{' '}
        sont construits autour de ce type de progression, et pour les montées
        elles-mêmes, l’
        <Link href="/fr/learn/grade-adjusted-pace">
          allure ajustée à la pente
        </Link>{' '}
        dit ce que chacune a coûté en énergie.
      </p>

      <h2>Limites</h2>
      <p>
        Une règle unique pour toutes les pentes est une simplification. Sur une
        montée douce et courable, 100 m de D+ coûtent moins qu’un
        kilomètre&nbsp;; sur un mur à 25&nbsp;% monté aux bâtons, ils peuvent
        coûter davantage. Le terrain pèse encore plus&nbsp;: cailloux, racines,
        boue, neige et pierriers ralentissent bien au-delà de ce que dit le
        dénivelé, et deux courses au même km-effort peuvent se terminer très
        loin l’une de l’autre.
      </p>
      <p>
        Ignorer la descente est le plus gros angle mort. Sur un parcours aux
        longues descentes raides, ce sont vos quadriceps qui fixent l’allure en
        seconde moitié, pas votre souffle, et le km-effort ne le voit pas venir.
        La nuit, l’altitude au-delà de 2&nbsp;000 m environ, la chaleur et le
        temps passé aux ravitaillements restent aussi hors de la formule. Une
        référence sur route suppose des sentiers courables et reporte votre
        vitesse de route sur les montées&nbsp;: sur terrain technique,
        attendez-vous à finir au-delà de la fourchette.
      </p>
      <p>
        Enfin, le km-effort ne dit rien de votre cote ITRA ou de votre UTMB
        Index, qui reposent sur leurs propres modèles. Voyez-le comme une
        monnaie commune pour planifier, pas comme une note.
      </p>
    </div>
  );
}
