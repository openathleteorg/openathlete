import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentFr() {
  return (
    <div>
      <p>
        La VMA, ou vitesse maximale aérobie, est la plus petite vitesse de
        course à laquelle votre consommation d’oxygène atteint son plafond,
        votre <Link href="/fr/learn/vo2max">VO2max</Link>. Au-delà, l’énergie
        supplémentaire vient de la filière anaérobie, et c’est pourquoi la
        plupart des coureurs ne tiennent leur VMA que 4 à 8 minutes. Les
        anglophones parlent de MAS ou de vVO2max, mais la notion est surtout
        française&nbsp;: elle structure le fractionné depuis le test sur piste
        de Luc Léger en 1980 et les travaux de Véronique Billat dans les années
        1990. Son intérêt est très concret&nbsp;: la VO2max est un chiffre de
        laboratoire en millilitres, la VMA est une vitesse que l’on court sur
        une piste.
      </p>

      <h2>Comment calculer sa VMA</h2>
      <p>
        La méthode de terrain la plus directe est le test de 6 minutes, ou
        demi-Cooper. Après 20 minutes d’échauffement et quelques lignes droites,
        vous courez la plus grande distance possible en 6 minutes, à allure
        régulière. Six minutes tombent dans la durée de maintien de la VMA de la
        plupart des coureurs&nbsp;: votre vitesse moyenne en donne une bonne
        estimation.
      </p>
      <Formula
        where={[
          'distance en mètres, temps en minutes\u00a0; × 0,06 convertit les m/min en km/h',
        ]}
      >
        VMA (km/h) = distance / temps × 0,06
      </Formula>
      <p>
        Le test de Cooper sur 12 minutes est plus facile à gérer mais donne une
        valeur un peu basse, car presque tout le monde ralentit après 6 ou 7
        minutes à cette vitesse. Les tests progressifs (test de Léger-Boucher,
        VAMEVAL) augmentent la vitesse de 0,5 ou 1&nbsp;km/h par paliers jusqu’à
        ce que vous ne puissiez plus suivre&nbsp;; le dernier palier terminé
        donne la VMA. Il faut une piste, des plots et une bande sonore, mais la
        question de la gestion d’allure disparaît.
      </p>
      <p>
        Vous pouvez aussi repartir d’une course récente. Chaque distance se
        court à une part typique de la VMA&nbsp;: environ 95&nbsp;% sur
        5&nbsp;km, 90&nbsp;% sur 10&nbsp;km, 85&nbsp;% sur semi-marathon et
        80&nbsp;% sur marathon. Divisez votre vitesse moyenne par cette part. Un
        5 ou un 10&nbsp;km plat donne une meilleure estimation qu’un marathon,
        où le ravitaillement et la chaleur pèsent plus que la puissance aérobie.
      </p>

      <h2>Un exemple chiffré</h2>
      <ul>
        <li>
          Test de 6 minutes&nbsp;: 1&nbsp;500&nbsp;m → 1&nbsp;500 / 6 × 0,06 =
          15,0&nbsp;km/h (4&nbsp;min&nbsp;00/km)
        </li>
        <li>
          Test de Cooper, même coureur&nbsp;: 2&nbsp;900&nbsp;m en 12 minutes →
          14,5&nbsp;km/h
        </li>
        <li>
          10&nbsp;km en 45&nbsp;min&nbsp;: 13,33&nbsp;km/h de moyenne, divisés
          par 0,90 → 14,8&nbsp;km/h
        </li>
      </ul>
      <p>
        Trois méthodes, trois résultats à moins de 0,5&nbsp;km/h les uns des
        autres. Cet écart est normal, et il rappelle que la VMA est une
        estimation avec une marge, pas une donnée fixe comme votre taille.
        Retenons 15&nbsp;km/h et déduisons les allures&nbsp;:
      </p>
      <ul>
        <li>
          100&nbsp;% VMA&nbsp;: 15,0&nbsp;km/h, 4&nbsp;min&nbsp;00/km,
          125&nbsp;m en 30 secondes
        </li>
        <li>95&nbsp;%&nbsp;: 14,25&nbsp;km/h, 4&nbsp;min&nbsp;13/km</li>
        <li>
          85&nbsp;% (proche du seuil pour beaucoup de coureurs)&nbsp;:
          12,75&nbsp;km/h, 4&nbsp;min&nbsp;42/km
        </li>
        <li>
          65 à 75&nbsp;% (endurance fondamentale)&nbsp;: 9,75 à 11,25&nbsp;km/h,
          6&nbsp;min&nbsp;09 à 5&nbsp;min&nbsp;20/km
        </li>
      </ul>

      <h2>Comment s’en servir à l’entraînement</h2>
      <p>
        La VMA est la règle graduée du fractionné. Les formats classiques à ou
        près de la VMA&nbsp;: le 30/30 (30 secondes à 100&nbsp;% de VMA, 30
        secondes de trot) répété 10 à 20 fois, 6 × 1&nbsp;000&nbsp;m à 95&nbsp;%
        avec 2 minutes de récupération, 5 × 3 minutes entre 95 et 100&nbsp;%.
        Billat a montré que le temps de maintien à VMA varie beaucoup d’un
        coureur à l’autre, à niveau égal (Billat et Koralsztein, 1996)&nbsp;:
        c’est pourquoi des répétitions courtes avec récupérations courtes
        permettent d’accumuler plus de minutes à cette intensité qu’un seul
        effort long.
      </p>
      <p>
        Sous la VMA, les pourcentages deviennent moins fiables. Deux coureurs à
        15&nbsp;km/h peuvent avoir leur seuil à 82&nbsp;% et à 90&nbsp;% de VMA,
        selon leur endurance et leur passé d’entraînement. Pour le tempo et la
        sortie longue, la fréquence cardiaque (voir le{' '}
        <Link href="/fr/tools/heart-rate-zones">
          calculateur de zones cardiaques
        </Link>
        ) ou des allures tirées de vos courses comme le{' '}
        <Link href="/fr/learn/vdot">VDOT</Link> guident souvent mieux. Le{' '}
        <Link href="/fr/tools/vma">calculateur de VMA</Link> transforme un test
        ou une course en allures, et les{' '}
        <Link href="/fr/pace-charts">tableaux d’allure</Link> font la conversion
        au kilomètre.
      </p>
      <p>
        Dans OpenAthlete, la VMA fait partie de vos capacités. Les étapes d’une
        séance peuvent viser un pourcentage de VMA (par exemple 95&nbsp;%), et
        la séance part ensuite avec de vraies allures sur les montres Garmin,
        Suunto ou COROS.
      </p>

      <h2>Limites</h2>
      <p>
        La VMA dépend du test&nbsp;: un tapis, une piste, une route vallonnée ou
        un jour de vent donnent des valeurs différentes, et un demi-Cooper mal
        géré peut coûter 0,5&nbsp;km/h. Elle mélange aussi deux choses, la
        VO2max et l’économie de course&nbsp;: deux coureurs à VO2max égale
        peuvent avoir 1 à 2&nbsp;km/h d’écart de VMA si l’un court plus
        économiquement. Enfin, la VMA dit peu de choses de l’endurance. Un
        coureur à forte VMA qui court peu craquera sur un semi qu’un coureur à
        VMA plus modeste mais gros volume tiendra sans difficulté.
        Servez-vous-en pour fixer les allures de fractionné, refaites un test
        tous les deux ou trois mois, et laissez vos courses vous dire le reste.
      </p>
    </div>
  );
}
