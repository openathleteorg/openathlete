import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentFr() {
  return (
    <div>
      <p>
        La VO2max est le débit maximal auquel vous pouvez prélever l’oxygène de
        l’air et l’utiliser dans vos muscles. On l’exprime en litres par minute
        ou, plus utile pour un coureur, en millilitres par kilogramme et par
        minute, puisqu’un corps plus lourd coûte plus cher à déplacer. A. V.
        Hill a décrit le plateau de consommation d’oxygène dans les années 1920,
        et la VO2max est depuis le chiffre phare de la physiologie de
        l’endurance. Elle mesure la taille de votre moteur aérobie. Elle ne
        décide pas, à elle seule, de votre vitesse en course.
      </p>

      <h2>Ce qui fixe la VO2max&nbsp;: l’équation de Fick</h2>
      <p>
        La consommation d’oxygène est le produit du débit de sang envoyé par le
        cœur et de la quantité d’oxygène que les muscles en extraient&nbsp;:
      </p>
      <Formula
        where={[
          'Q = débit cardiaque (litres de sang par minute) = fréquence cardiaque × volume d’éjection systolique',
          'CaO2 − CvO2 = différence de contenu en oxygène entre sang artériel et veineux (ml d’O2 par litre de sang)',
        ]}
      >
        VO2 = Q × (CaO2 − CvO2)
      </Formula>
      <p>
        À l’effort maximal, l’extraction diffère moins entre sportifs et
        sédentaires que le débit cardiaque, et la fréquence cardiaque maximale
        n’augmente pas avec l’entraînement. Ce qui sépare une VO2max de 40 d’une
        VO2max de 70, c’est surtout le volume d’éjection systolique, la quantité
        de sang chassée à chaque battement. Bassett et Howley (2000) en
        concluent que chez l’athlète entraîné, la VO2max est limitée d’abord par
        l’apport d’oxygène, plus que par les muscles.
      </p>

      <h2>Comment la mesurer ou l’estimer</h2>
      <p>
        La référence est le test en laboratoire&nbsp;: une course à vitesse
        croissante sur tapis, avec un masque qui analyse l’air expiré, jusqu’à
        ce que la consommation d’oxygène cesse d’augmenter malgré
        l’accélération. Tout le reste est une estimation&nbsp;:
      </p>
      <ul>
        <li>
          Le test de Cooper (Cooper, 1968)&nbsp;: distance parcourue en 12
          minutes, puis VO2max = (distance en mètres − 504,9) / 44,73.
        </li>
        <li>
          Le rapport des fréquences cardiaques (Uth et al., 2004)&nbsp;: VO2max
          ≈ 15,3 × FCmax / FCrepos. Rapide, mais il faut une vraie FCmax, et la
          méthode ignore votre vitesse réelle.
        </li>
        <li>
          La performance en course&nbsp;: le{' '}
          <Link href="/fr/learn/vdot">VDOT</Link> de Daniels transforme un
          chrono en VO2max «&nbsp;effective&nbsp;», qui intègre votre économie
          de course.
        </li>
        <li>
          Les montres&nbsp;: Garmin, Polar, COROS et d’autres l’estiment à
          partir de la fréquence cardiaque rapportée à l’allure ou à la
          puissance, avec des modèles qu’ils ne publient pas en détail.
        </li>
      </ul>

      <h2>Un exemple chiffré</h2>
      <p>
        Prenons un coureur qui parcourt 2&nbsp;900&nbsp;m au test de Cooper, a
        une fréquence de repos de 48, une FCmax de 188, et vient de courir un
        10&nbsp;km en 45&nbsp;minutes.
      </p>
      <ul>
        <li>
          Cooper&nbsp;: (2&nbsp;900 − 504,9) / 44,73 = 53,5&nbsp;ml/kg/min
        </li>
        <li>
          Rapport des fréquences&nbsp;: 15,3 × 188 / 48 = 59,9&nbsp;ml/kg/min
        </li>
        <li>VDOT tiré du 10&nbsp;km&nbsp;: 45,3</li>
      </ul>
      <p>
        Trois chiffres entre 45 et 60 pour la même personne. Aucun n’est faux,
        ils ne mesurent pas la même chose. Le rapport des fréquences ne regarde
        que le cœur, le Cooper un effort de 12 minutes, le VDOT ce que le
        coureur produit réellement sur 45 minutes. Un tel écart signale en
        général un bon moteur, avec de la marge sur l’économie et l’endurance.
      </p>
      <p>
        Pour la version laboratoire, prenons des valeurs plausibles&nbsp;: un
        débit cardiaque de 25 litres par minute et une extraction de 160&nbsp;ml
        d’oxygène par litre de sang donnent 4&nbsp;000&nbsp;ml/min, soit
        57&nbsp;ml/kg/min pour un coureur de 70&nbsp;kg.
      </p>

      <h2>VO2max, VMA et économie de course</h2>
      <p>
        Sur le plat, courir coûte environ 3,5&nbsp;ml/kg/min d’oxygène par km/h
        (Léger et Mercier, 1984). En divisant la VO2max par ce coût, on obtient
        une <Link href="/fr/learn/vma">VMA</Link> approximative&nbsp;: 53,5 /
        3,5 ≈ 15,3&nbsp;km/h, proche des 15&nbsp;km/h que ce coureur réalise au
        demi-Cooper. Un coureur qui consomme moins d’oxygène par km/h, donc plus
        économique, va plus vite avec la même VO2max. Joyner et Coyle (2008)
        décrivent la performance d’endurance comme trois facteurs
        combinés&nbsp;: la VO2max, la fraction que vous pouvez en tenir (liée au
        seuil lactique) et l’économie.
      </p>

      <h2>Comment s’en servir à l’entraînement</h2>
      <p>
        La VO2max progresse avec un travail proche d’elle&nbsp;: 4 à 6
        répétitions de 3 à 5 minutes entre 95 et 100&nbsp;% de VMA, avec des
        récupérations de durée voisine, ou des formats courts comme le 30/30.
        Elle progresse aussi avec le volume en endurance fondamentale, grâce à
        un volume d’éjection plus grand. Pour fixer des allures, la VMA et le
        VDOT sont plus pratiques, puisque ce sont des vitesses. Dans
        OpenAthlete, la VO2max est une métrique importée de Garmin, Polar ou
        COROS ou saisie à la main, que vous suivez sur la page des métriques à
        côté de la <Link href="/fr/learn/hrv">VFC</Link> et de la fréquence de
        repos. Le <Link href="/fr/tools/vma">calculateur de VMA</Link> vous
        donne les allures.
      </p>

      <h2>Limites</h2>
      <p>
        Entre coureurs de niveau proche, la VO2max prédit mal les
        résultats&nbsp;: l’économie et la fraction tenable comptent autant. Les
        valeurs des montres bougent avec la chaleur, le dénivelé, la fatigue et
        une FCmax erronée&nbsp;: lisez-les comme une tendance sur plusieurs
        semaines. La génétique fixe une grande partie du plafond, et les gains
        ralentissent après les premières années, alors que le seuil et
        l’économie peuvent progresser longtemps.
      </p>
    </div>
  );
}
