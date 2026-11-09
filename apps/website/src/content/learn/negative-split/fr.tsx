import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentFr() {
  return (
    <div>
      <p>
        Courir en <em>negative split</em>, c’est boucler la deuxième moitié
        d’une course plus vite que la première. L’inverse, le{' '}
        <em>positive split</em>, est ce que font la plupart des coureurs sans le
        vouloir&nbsp;: un départ porté par l’adrénaline et le public, puis un
        long coup de moins bien. Les entraîneurs le conseillent depuis des
        décennies, surtout comme remède à ce coup de moins bien. Les preuves
        scientifiques sont plus minces que le conseil ne le laisse croire, mais
        l’habitude qu’il installe, se retenir au départ, vaut pour tout ce qui
        dépasse le 10&nbsp;km.
      </p>

      <h2>Comment on mesure l’écart</h2>
      <p>
        On coupe la course en deux distances égales et on compare les temps.
        Exprimé en pourcentage de la première moitié, l’écart permet de comparer
        un 10&nbsp;km et un marathon&nbsp;:
      </p>
      <Formula
        where={[
          'T1 = temps de la première moitié, T2 = temps de la seconde',
          'Valeur négative : negative split. Valeur positive : positive split. Entre −1 et +1 % environ : allure régulière',
        ]}
      >
        écart (%) = (T2 − T1) / T1 × 100
      </Formula>
      <p>
        La marge de ±1&nbsp;% pour parler d’allure régulière est une convention
        pratique, pas une norme&nbsp;: la dérive du GPS, le vent ou une seule
        côte suffisent à décaler une moitié d’autant. Sur un parcours vallonné
        ou en ligne, comparez des moitiés de profil comparable, ou regardez l’
        <Link href="/fr/learn/grade-adjusted-pace">
          allure ajustée à la pente
        </Link>{' '}
        plutôt que le chrono.
      </p>

      <h2>Un exemple chiffré</h2>
      <p>
        Une coureuse vise 50:00 sur 10&nbsp;km, soit 5:00/km de moyenne. Elle
        passe au 5<sup>e</sup>&nbsp;km en 25:30 (5:06/km) et court les 5&nbsp;km
        suivants en 24:30 (4:54/km).
      </p>
      <ul>
        <li>T2 − T1 = 1&nbsp;470 − 1&nbsp;530 = −60&nbsp;s</li>
        <li>écart = −60 / 1&nbsp;530 × 100 = −3,9&nbsp;%</li>
      </ul>
      <p>
        C’est un negative split net, sans doute trop net&nbsp;: reprendre une
        minute sur la seconde moitié d’un 10&nbsp;km signifie le plus souvent
        que le départ était trop prudent et qu’il reste du temps sur la route.
      </p>
      <p>
        Sur marathon, les marges sont plus fines. Pour 3&nbsp;h&nbsp;30 (4:59/km
        de moyenne), un plan raisonnable consiste à passer au semi en 1:45:50
        (5:01/km), puis à courir la seconde moitié en 1:44:10 (4:56/km)&nbsp;:
        un écart de −1,6&nbsp;%. Courir la première moitié à peine deux ou trois
        secondes au kilomètre plus lentement que la moyenne coûte
        50&nbsp;secondes au semi et donne de la marge pour les 10 derniers
        kilomètres, là où se perdent la plupart des marathons.
      </p>

      <h2>Comment s’en servir</h2>
      <p>
        Le but n’est pas de sprinter à la fin, mais d’éviter de payer les
        intérêts d’un départ trop rapide. Les premiers kilomètres courus
        au-dessus de votre allure tenable puisent dans vos glucides et dans
        votre tolérance à la fatigue, et cette dette ne se rembourse pas en fin
        de course. Quelques règles simples&nbsp;:
      </p>
      <ul>
        <li>
          Fixez l’allure cible à partir d’une course récente, pas d’un espoir.
          Le <Link href="/fr/tools/race-predictor">prédicteur de temps</Link> et
          les <Link href="/fr/pace-charts">tableaux d’allures</Link> donnent les
          temps de passage au kilomètre pour un chrono visé.
        </li>
        <li>
          Sur semi ou marathon, courez les 3 à 5 premiers kilomètres 5 à 10
          secondes au kilomètre plus lentement que l’allure cible, puis
          calez-vous. Sur 10&nbsp;km, c’est le premier kilomètre qu’il faut
          brider.
        </li>
        <li>
          Répétez-le à l’entraînement. Une sortie en progressivité, par exemple
          12&nbsp;km en partant en endurance fondamentale et en finissant les 3
          derniers à allure marathon, apprend à quoi ressemble la retenue. Une
          sortie longue de 26&nbsp;km dont les 8 derniers à allure marathon fait
          la même chose avec plus de fatigue.
        </li>
        <li>
          Analysez la course après coup par son écart. Un positive split de plus
          de 3 ou 4&nbsp;% sur marathon désigne presque toujours la première
          moitié, pas la seconde.
        </li>
      </ul>

      <h2>Limites</h2>
      <p>
        La recherche n’érige pas le negative split en loi. Dans leur revue des
        stratégies d’allure, Abbiss et Laursen (2008) concluent qu’une allure
        régulière convient en général aux épreuves de plus de deux minutes, et
        que sur les efforts très longs, les athlètes entraînés ralentissent le
        plus souvent progressivement, quelles que soient leurs intentions. Díaz
        et ses collègues (2018) ont analysé tous les records du monde du
        marathon sur cinquante ans&nbsp;: en moyenne, les recordmen ont couru la
        première moitié un peu plus vite que la seconde. Les records les plus
        récents sont les plus réguliers, ce qui amène les auteurs à penser que
        l’avenir est à une allure presque constante plutôt qu’à un negative
        split marqué.
      </p>
      <p>
        L’objectif honnête, pour la plupart des coureurs, est donc une allure
        régulière avec une légère accélération, pas un final spectaculaire. Le
        parcours s’en mêle aussi&nbsp;: une course qui monte en seconde partie
        affichera un positive split au chrono alors que l’effort était
        parfaitement constant. En trail et en ultra, où le terrain et la nuit
        pèsent sur la seconde moitié, comparer les moitiés au chrono ne dit pas
        grand-chose&nbsp;; l’effort ressenti, la fréquence cardiaque et le
        ravitaillement comptent davantage.
      </p>
    </div>
  );
}
