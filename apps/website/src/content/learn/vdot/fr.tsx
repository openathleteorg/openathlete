import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentFr() {
  return (
    <div>
      <p>
        Le VDOT est le chiffre central de la méthode de Jack Daniels. Son nom
        vient de «&nbsp;V-dot-O2max&nbsp;», la façon dont les physiologistes
        écrivent la VO2max, mais il ne se mesure pas en laboratoire. Daniels et
        le mathématicien Jimmy Gilbert l’ont déduit de résultats de course dans
        les années 1970&nbsp;: à partir de la vitesse tenue sur une distance,
        quelle VO2max l’expliquerait si votre économie de course était
        moyenne&nbsp;? La réponse est un indice unique qui situe votre niveau
        actuel, prédit vos temps sur d’autres distances et fournit vos allures
        d’entraînement.
      </p>
      <p>
        Comme il vient d’une performance, le VDOT intègre ce qu’une VO2max de
        laboratoire laisse de côté&nbsp;: l’économie de votre foulée et la part
        de votre maximum que vous savez tenir sur toute une course. Ces trois
        facteurs réunis expliquent l’essentiel de la performance en endurance
        (Joyner et Coyle, 2008). C’est pourquoi deux coureurs à{' '}
        <Link href="/fr/learn/vo2max">VO2max</Link> égale peuvent avoir
        plusieurs points de VDOT d’écart, et pourquoi le VDOT prédit mieux les
        chronos que la VO2max.
      </p>

      <h2>Comment se calcule le VDOT</h2>
      <p>
        Les formules de Daniels et Gilbert ont deux étages. La première donne le
        coût en oxygène d’une course à la vitesse v, en mètres par minute. La
        seconde donne la part de la VO2max qu’un coureur peut tenir sur une
        course de t minutes&nbsp;: près de 100&nbsp;% pendant une dizaine de
        minutes, autour de 90&nbsp;% sur 45 minutes, moins de 85&nbsp;% sur
        marathon.
      </p>
      <Formula
        where={[
          'Coût en oxygène (ml/kg/min) = −4,6 + 0,182258 × v + 0,000104 × v²',
          'Part tenable = 0,8 + 0,1894393 × e^(−0,012778 × t) + 0,2989558 × e^(−0,1932605 × t)',
          'v = distance (m) / temps (min)\u00a0; t = durée de la course en minutes',
        ]}
      >
        VDOT = coût en oxygène / part tenable
      </Formula>
      <p>
        Les formules valent du 1&nbsp;500&nbsp;m au marathon. En dessous, la
        capacité anaérobie pèse trop&nbsp;; au-delà, le ravitaillement et la
        chaleur comptent davantage que le niveau aérobie.
      </p>

      <h2>Un exemple chiffré</h2>
      <p>Une coureuse boucle un 10 km plat en 45:00.</p>
      <ul>
        <li>Vitesse&nbsp;: 10&nbsp;000 m / 45 min = 222,2 m/min</li>
        <li>
          Coût en oxygène&nbsp;: −4,6 + 0,182258 × 222,2 + 0,000104 × 222,2² =
          41,0 ml/kg/min
        </li>
        <li>
          Part tenable sur 45 minutes&nbsp;: 0,8 + 0,1894 × e^(−0,575) + 0,2990
          × e^(−8,70) = 0,907
        </li>
        <li>VDOT = 41,0 / 0,907 = 45,3</li>
      </ul>
      <p>
        En sens inverse, le même VDOT prédit environ 21:42 sur 5 km, 1:39:44 sur
        semi-marathon et 3:27:15 sur marathon.
      </p>
      <p>
        Les allures d’entraînement correspondent à des parts fixes du VDOT,
        reconverties en vitesse grâce à la formule du coût en oxygène. Pour un
        VDOT de 45,3&nbsp;:
      </p>
      <ul>
        <li>Endurance (59 à 74&nbsp;%)&nbsp;: 6:21 à 5:18 au km</li>
        <li>Marathon (la vitesse marathon prédite)&nbsp;: 4:55 au km</li>
        <li>Seuil (88&nbsp;%)&nbsp;: 4:37 au km</li>
        <li>Intervalles (97,5&nbsp;%)&nbsp;: 4:15 au km</li>
        <li>
          Répétitions (105&nbsp;%)&nbsp;: 4:00 au km, soit 96 secondes au 400 m
        </li>
      </ul>

      <h2>Comment s’en servir à l’entraînement</h2>
      <p>
        Chaque allure a son rôle. L’allure seuil sert aux tempos de 20 minutes
        ou aux intervalles longs comme 5 × 1 km avec une minute de récupération
        trottée. L’allure intervalles sert aux répétitions de trois à cinq
        minutes, par exemple 5 × 1&nbsp;000 m avec récupération égale, ce qui se
        rapproche du travail à <Link href="/fr/learn/vma">VMA</Link> des
        entraîneurs français. L’allure répétitions sert aux efforts courts et
        rapides de 200 ou 400 m avec récupération complète, pour l’économie de
        course. L’endurance couvre l’essentiel de la semaine.
      </p>
      <p>
        Deux règles gardent le système honnête. Fixez votre VDOT à partir d’une
        course récente, pas de celle que vous espérez courir&nbsp;: s’entraîner
        à l’allure objectif avant d’en avoir le niveau est la façon classique de
        se mettre dans le rouge. Et faites-le progresser par petites marches, un
        point après une bonne course ou un bloc de séances bien maîtrisées,
        plutôt qu’à chaque bonne journée.
      </p>
      <p>
        Dans OpenAthlete, la page des records calcule votre VDOT à partir de
        votre meilleur effort entre 1&nbsp;500 m et le marathon, et affiche les
        allures d’entraînement correspondantes. Sur ce site, les{' '}
        <Link href="/fr/pace-charts">tableaux d’allures</Link> utilisent les
        mêmes formules, et le{' '}
        <Link href="/fr/tools/race-predictor">prédicteur de temps</Link> donne
        un second avis avec la formule de Riegel.
      </p>

      <h2>Limites</h2>
      <p>
        Le VDOT suppose que votre endurance suit votre vitesse. Un coureur
        rapide sur 10 km mais peu kilométré manquera en général le marathon
        prédit, souvent de plusieurs minutes, car les tables supposent un
        entraînement adapté à la distance. Le relief, la chaleur, le vent et une
        course mal gérée font tous baisser l’indice&nbsp;: un VDOT tiré d’un
        mauvais jour vous sous-estime. La part tenable est une courbe
        moyenne&nbsp;: certains coureurs tiennent une fraction plus élevée de
        leur maximum que d’autres, et le trail ou l’ultra sortent du cadre pour
        lequel les formules ont été construites. Prenez le VDOT comme un point
        de départ bien calibré, et ajustez les allures aux sensations et à la
        fréquence cardiaque.
      </p>
    </div>
  );
}
