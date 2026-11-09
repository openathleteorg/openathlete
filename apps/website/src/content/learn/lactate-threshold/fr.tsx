import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentFr() {
  return (
    <div>
      <p>
        Vos muscles produisent du lactate à toutes les allures, même en
        marchant, et l’éliminent en continu. À allure facile, production et
        élimination s’équilibrent et la concentration sanguine reste proche du
        repos, autour de 1 mmol/L. Accélérez, et à un moment la production prend
        de l’avance sur l’élimination. C’est ce moment qu’on appelle le seuil
        lactique, et c’est lui qui explique qu’une allure tenable une heure n’a
        rien à voir avec une allure plus rapide de 15 secondes au kilomètre.
      </p>
      <p>
        Le problème, c’est que «&nbsp;le&nbsp;» seuil lactique n’existe pas sous
        la forme d’un chiffre unique. Faude, Kindermann et Meyer (2009) ont
        recensé plus d’une vingtaine de définitions dans la littérature, avec
        des protocoles différents et des règles différentes pour lire la même
        courbe. En pratique, elles se rangent en deux familles. Le premier seuil
        (SL1, souvent appelé seuil aérobie) est l’intensité où le lactate
        commence à monter au-dessus du repos. Le second (SL2, seuil anaérobie
        ou, dans sa version la plus stricte, état stable maximal de lactate) est
        l’intensité la plus haute à laquelle le lactate se stabilise encore au
        lieu de grimper jusqu’à l’arrêt. Quand un entraîneur parle de
        «&nbsp;séance au seuil&nbsp;», il pense presque toujours au SL2.
      </p>

      <h2>Comment on le mesure</h2>
      <p>
        Le test classique est un test par paliers, sur tapis ou sur piste&nbsp;:
        des paliers de 3 à 5 minutes, chacun plus rapide de 0,5 à 1&nbsp;km/h,
        avec une goutte de sang prélevée au doigt ou à l’oreille à la fin de
        chaque palier. On lit ensuite le seuil sur la courbe. Deux règles sont
        courantes&nbsp;: une concentration fixe, en général 4&nbsp;mmol/L pour
        le SL2, et une hausse par rapport à la valeur de base, souvent base +
        1&nbsp;mmol/L pour le SL1. La vitesse entre deux paliers s’obtient par
        interpolation linéaire&nbsp;:
      </p>
      <Formula
        where={[
          'La = lactate visé (4 mmol/L, ou base + 1)',
          'v1, La1 = vitesse et lactate du dernier palier sous la cible',
          'v2, La2 = vitesse et lactate du premier palier au-dessus',
        ]}
      >
        v = v1 + (La − La1) / (La2 − La1) × (v2 − v1)
      </Formula>
      <p>
        L’état stable maximal de lactate est la référence que les autres
        méthodes cherchent à approcher, mais il faut plusieurs jours de courses
        de 30 minutes à allure constante pour le situer, ce qui explique que
        presque personne ne le mesure hors laboratoire (Jones et al., 2019).
      </p>

      <h2>Exemple chiffré</h2>
      <p>
        Un coureur enchaîne des paliers de 4 minutes à partir de 10&nbsp;km/h,
        en ajoutant 1&nbsp;km/h à chaque fois. Lactate en fin de palier&nbsp;:
        1,1&nbsp;; 1,2&nbsp;; 1,4&nbsp;; 1,8&nbsp;; 2,6&nbsp;; 4,1 et
        6,3&nbsp;mmol/L à 10, 11, 12, 13, 14, 15 et 16&nbsp;km/h.
      </p>
      <ul>
        <li>
          SL2 à 4&nbsp;mmol/L&nbsp;: entre 14&nbsp;km/h (2,6) et 15&nbsp;km/h
          (4,1). v = 14 + (4 − 2,6) / (4,1 − 2,6) × 1 = 14,9&nbsp;km/h, soit
          4:01 au kilomètre.
        </li>
        <li>
          SL1 à base + 1&nbsp;: la valeur la plus basse est 1,1, la cible est
          donc 2,1&nbsp;mmol/L, entre 13&nbsp;km/h (1,8) et 14&nbsp;km/h (2,6).
          v = 13 + 0,3 / 0,8 = 13,4&nbsp;km/h, soit 4:29 au kilomètre.
        </li>
      </ul>
      <p>
        Même test, même sang, et les deux seuils sont séparés de près de 30
        secondes au kilomètre. Lisez la courbe avec une autre règle (le point le
        plus éloigné de la droite qui relie le premier et le dernier palier, par
        exemple) et vous obtiendrez encore une autre valeur. Ce n’est pas un
        défaut du test&nbsp;: c’est la raison pour laquelle il faut toujours
        demander de quel seuil on parle.
      </p>

      <h2>L’utiliser à l’entraînement</h2>
      <p>
        Sans laboratoire, une bonne estimation de terrain du SL2 est l’allure
        que vous pourriez tenir en course pendant environ une heure, soit pour
        la plupart des coureurs entraînés une allure entre celle du 10&nbsp;km
        et celle du semi-marathon. Les{' '}
        <Link href="/fr/pace-charts">tableaux d’allures</Link> la donnent à
        partir d’un chrono récent. La fréquence cardiaque au SL2 se situe
        souvent entre 85 et 92&nbsp;% de la FC max, mais les écarts individuels
        sont grands.
      </p>
      <ul>
        <li>
          Séances au seuil&nbsp;: 3 × 10' ou 5 × 6' à l’allure SL2 avec 1 à 2
          minutes de trot, ou 20 à 30 minutes en continu. L’allure doit être
          «&nbsp;difficile mais contrôlée&nbsp;»&nbsp;: quelques mots possibles,
          pas une phrase.
        </li>
        <li>
          L’endurance fondamentale reste sous le SL1. C’est ce plafond que la{' '}
          <Link href="/fr/learn/zone-2">zone 2</Link> cherche à traduire, et
          dans une semaine{' '}
          <Link href="/fr/learn/polarized-training">polarisée</Link>, la
          majorité de vos minutes s’y passe.
        </li>
        <li>
          Refaites un test toutes les 6 à 10 semaines, ou servez-vous de vos
          courses&nbsp;: le seuil bouge avec la forme, et des zones anciennes
          finissent au mauvais endroit.
        </li>
      </ul>
      <p>
        OpenAthlete ne mesure pas le lactate. Vous saisissez ou synchronisez vos
        zones, et les statistiques montrent comment votre temps se répartit
        sous, entre et au-dessus de vos seuils au fil des semaines, à côté des
        courbes de{' '}
        <Link href="/fr/features/training-load">charge d’entraînement</Link>.
      </p>

      <h2>Limites</h2>
      <p>
        Le chiffre dépend du protocole&nbsp;: des paliers plus courts donnent
        une vitesse au seuil plus élevée, parce que le lactate n’a pas fini de
        monter au moment du prélèvement. Les analyseurs portables diffèrent
        entre eux de quelques dixièmes de mmol/L, ce qui déplace nettement un
        seuil à valeur fixe sur une portion plate de la courbe. Des réserves de
        glycogène basses font baisser le lactate à toutes les vitesses et
        flattent le seuil. Enfin, une vitesse trouvée sur tapis à 18&nbsp;°C ne
        se transpose pas telle quelle sur un parcours vallonné en pleine
        chaleur. Pour un repère d’allure tiré de vos propres courses plutôt que
        d’une prise de sang, regardez la{' '}
        <Link href="/fr/learn/critical-speed">vitesse critique</Link>, qui se
        situe juste au-dessus de l’état stable maximal de lactate.
      </p>
    </div>
  );
}
