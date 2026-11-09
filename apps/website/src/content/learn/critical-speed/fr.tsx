import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentFr() {
  return (
    <div>
      <p>
        Placez vos meilleurs chronos entre quelques minutes et une vingtaine de
        minutes sur un graphique distance-temps, et les points s’alignent
        presque sur une droite. Sa pente est votre vitesse critique&nbsp;: la
        distance que vous ajoutez pour chaque seconde d’effort en plus. La
        droite ne part pas de zéro. Elle coupe l’axe des distances un peu
        au-dessus, à une valeur appelée D′ («&nbsp;D prime&nbsp;»)&nbsp;: une
        quantité fixe de distance que vous pouvez parcourir plus vite que la
        vitesse critique avant de devoir ralentir.
      </p>
      <p>
        L’idée vient de Monod et Scherrer (1965), qui l’ont décrite pour le
        travail d’un groupe musculaire sous le nom de puissance critique. Elle
        se transpose à la course à pied en remplaçant la puissance par la
        vitesse et le travail par la distance. Sur le plan physiologique, la
        vitesse critique marque la frontière entre les efforts où la
        consommation d’oxygène et le lactate se stabilisent, et ceux où ils
        continuent de dériver jusqu’à l’arrêt (Poole et al., 2016). Elle se
        situe près de l’état stable maximal de lactate, un peu au-dessus, que le{' '}
        <Link href="/fr/learn/lactate-threshold">seuil lactique</Link> cherche à
        estimer.
      </p>

      <h2>Comment on calcule la vitesse critique</h2>
      <Formula
        where={[
          'd = distance d’un meilleur effort (m), t = sa durée (s)',
          'VC = vitesse critique (m/s), D′ = distance au-dessus de VC (m)',
          'Au-dessus de VC : temps limite t = D′ / (v − VC)',
        ]}
      >
        d = D′ + VC × t
      </Formula>
      <p>
        Avec deux efforts maximaux, la droite se résout à la main. À partir de
        trois, on l’ajuste par les moindres carrés, et la dispersion des points
        autour de la droite dit quelle confiance accorder à la pente. Les
        efforts doivent durer entre 2 et 20 minutes environ&nbsp;: plus courts,
        ils font appel à des qualités de vitesse pure que le modèle ne décrit
        pas&nbsp;; plus longs, la fatigue et le ravitaillement entrent en jeu.
      </p>

      <h2>Exemple chiffré</h2>
      <p>
        Un coureur a quatre références récentes&nbsp;: 1&nbsp;000&nbsp;m en 3:10
        (190&nbsp;s), 2&nbsp;000&nbsp;m en 6:55 (415&nbsp;s), 3&nbsp;000&nbsp;m
        en 10:30 (630&nbsp;s) et 5&nbsp;000&nbsp;m en 18:00 (1&nbsp;080&nbsp;s).
      </p>
      <ul>
        <li>
          L’ajustement distance-temps donne une pente de 4,50&nbsp;m/s&nbsp;: la
          vitesse critique vaut 16,2&nbsp;km/h, soit 3:42 au kilomètre.
        </li>
        <li>L’ordonnée à l’origine donne D′ ≈ 145&nbsp;m.</li>
        <li>
          Avec quatre points, l’intervalle à 95&nbsp;% sur la pente est de
          ±0,11&nbsp;m/s&nbsp;: la vitesse critique se situe entre 3:37 et 3:48
          au kilomètre.
        </li>
        <li>
          À 3:20 au kilomètre (5,0&nbsp;m/s), D′ est épuisé au bout de 145 /
          (5,0 − 4,50) ≈ 290&nbsp;s, soit environ 1&nbsp;450&nbsp;m. Le modèle
          prédit un 1&nbsp;500&nbsp;m en 5:01 environ.
        </li>
      </ul>
      <p>
        L’allure du 5&nbsp;km (3:36 au kilomètre) est plus rapide que la vitesse
        critique. C’est normal&nbsp;: toute course assez courte pour être
        terminée avant que D′ soit vide se court au-dessus.
      </p>

      <h2>L’utiliser à l’entraînement</h2>
      <p>
        La vitesse critique coupe vos allures en deux mondes. En dessous, la
        fatigue s’installe lentement et la limite tient surtout à la durée et à
        l’énergie disponible. Au-dessus, chaque mètre au-delà de la droite est
        pris sur D′, et quand D′ est épuisé, vous ralentissez, quoi qu’en dise
        votre motivation.
      </p>
      <ul>
        <li>
          Fractionné au-dessus de VC&nbsp;: 5 × 1&nbsp;000&nbsp;m à 3:30 au
          kilomètre (4,76&nbsp;m/s) pour le coureur ci-dessus. Chaque répétition
          parcourt 1&nbsp;000 − 4,50 × 210 ≈ 55&nbsp;m au-dessus de la vitesse
          critique, environ 38&nbsp;% de D′. Les récupérations en rendent une
          partie, pas tout, d’où des dernières répétitions plus dures (Jones et
          Vanhatalo, 2017).
        </li>
        <li>
          Travail juste sous VC&nbsp;: 3 × 10' entre 3:48 et 3:52 au kilomètre.
          C’est dur, mais l’état stable tient.
        </li>
        <li>
          Gestion de course&nbsp;: partez sur 5&nbsp;km plus vite que VC et vous
          videz D′ trop tôt. Répartissez-le sur la distance et vous finissez
          plus vite.
        </li>
      </ul>
      <p>
        Smyth et Muniz-Pumares (2020) ont montré qu’on peut estimer la vitesse
        critique à partir des données d’entraînement brutes de marathoniens
        amateurs, sans test dédié, et qu’elle est liée à leur chrono sur
        marathon. Les statistiques d’OpenAthlete font la même chose dans leur
        vue Capacités&nbsp;: elles ajustent la droite sur vos meilleurs efforts
        entre 2 et 20 minutes (au moins trois), affichent l’intervalle à
        95&nbsp;%, et calculent de la même façon la puissance critique à vélo.
        La <Link href="/fr/features">page des fonctionnalités</Link> détaille ce
        qui est calculé d’autre à partir de votre historique.
      </p>

      <h2>Limites</h2>
      <p>
        Des records d’entraînement ne sont pas des tests maximaux. Si votre
        meilleur 3&nbsp;000&nbsp;m vient d’une séance au seuil, la vitesse
        ajustée sera plus basse que la vraie&nbsp;: le résultat vaut au plus ce
        que montrent vos efforts. Des efforts de durées trop proches donnent un
        intervalle large, et un record GPS réalisé en descente ou vent dans le
        dos tire la droite vers le haut. Le modèle ne dit rien non plus des
        épreuves longues. La vitesse critique ne se tient pas des heures, et un
        marathon se court nettement en dessous, à une fraction qui dépend de
        l’endurance et de l’alimentation plus que de la droite. Pour ces
        distances, croisez-la avec des outils fondés sur vos courses, comme le{' '}
        <Link href="/fr/tools/race-predictor">prédicteur de temps</Link> ou les{' '}
        <Link href="/fr/pace-charts">tableaux d’allures</Link>, et gardez la{' '}
        <Link href="/fr/learn/vma">VMA</Link> pour le bout court de la courbe.
      </p>
    </div>
  );
}
