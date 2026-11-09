import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentFr() {
  return (
    <div>
      <p>
        La zone 2, c’est l’allure facile et régulière qui remplit l’essentiel
        d’une semaine d’entraînement bien construite&nbsp;: celle des sorties
        longues et des footings de récupération, où vous pouvez encore parler
        par phrases complètes. En France, on parle plus volontiers d’endurance
        fondamentale. Le nom vient de l’échelle cardiaque en cinq zones de la
        plupart des montres et applications, où elle se situe entre le footing
        très lent (zone 1) et la zone 3, plus soutenue. Sur le plan
        physiologique, elle correspond à une intensité proche du premier seuil
        lactique, ou juste en dessous&nbsp;: la lactatémie reste à peine
        au-dessus du repos et l’effort peut durer des heures.
      </p>
      <p>
        Le terme est à la mode depuis quelques années, porté par les discussions
        sur les mitochondries et l’oxydation des graisses. Le conseil, lui, est
        ancien&nbsp;: dans la plupart des sports d’endurance, les athlètes
        passent la majorité de leur temps d’entraînement à basse intensité,
        comme l’ont montré les synthèses de Stephen Seiler sur l’entraînement
        des élites (Seiler, 2010).
      </p>

      <h2>Comment calculer la zone 2</h2>
      <p>
        Il n’existe pas de définition unique, d’où l’essentiel des malentendus.
        La version cardiaque la plus courante utilise la méthode de Karvonen,
        sur votre{' '}
        <Link href="/fr/learn/heart-rate-reserve">
          fréquence cardiaque de réserve
        </Link>
        &nbsp;:
      </p>
      <Formula
        where={[
          'FCrepos\u00a0: fréquence cardiaque de repos, mesurée allongé au réveil',
          'FCmax\u00a0: la plus haute fréquence que vous ayez réellement atteinte, plutôt qu’une formule liée à l’âge',
        ]}
      >
        Zone 2 = FCrepos + (0,60 à 0,70) × (FCmax − FCrepos)
      </Formula>
      <p>
        La variante simplifiée prend 60 à 70&nbsp;% de la fréquence cardiaque
        maximale. En laboratoire, on cale plutôt la zone 2 sur des repères
        mesurés&nbsp;: le premier seuil lactique ou ventilatoire. Les
        pourcentages ne sont qu’une approximation de ces seuils, et une
        approximation grossière.
      </p>
      <p>
        Un piège&nbsp;: dans le modèle à trois zones utilisé en recherche
        (Seiler et d’autres), la zone 1 couvre tout ce qui est sous le premier
        seuil, et la zone 2 la plage entre les deux seuils. Cette «&nbsp;zone
        2&nbsp;» correspond à de l’allure soutenue, pas à de l’endurance
        fondamentale. Quand vous lisez une étude, vérifiez l’échelle utilisée.
      </p>

      <h2>Un exemple chiffré</h2>
      <p>
        Une coureuse a une fréquence de repos de 50 bpm et a vu 190 bpm en fin
        de séance de côtes. Sa réserve cardiaque est de 140 battements.
      </p>
      <ul>
        <li>Bas de la zone 2&nbsp;: 50 + 0,60 × 140 = 134 bpm</li>
        <li>Haut de la zone 2&nbsp;: 50 + 0,70 × 140 = 148 bpm</li>
        <li>
          Avec 60 à 70&nbsp;% de la FCmax&nbsp;: 0,60 × 190 = 114 à 0,70 × 190 =
          133 bpm
        </li>
      </ul>
      <p>
        Les deux méthodes se recouvrent à peine. Pour une coureuse entraînée,
        avec un cœur lent au repos, 114 bpm ressemble à de la marche, et la zone
        calculée en pourcentage de la FCmax tombe surtout en zone 1. C’est
        pourquoi Karvonen convient généralement mieux aux coureurs, et pourquoi
        le{' '}
        <Link href="/fr/tools/heart-rate-zones">
          calculateur de zones cardiaques
        </Link>{' '}
        l’utilise par défaut.
      </p>
      <p>
        Un autre coureur, à 60 bpm au repos et 180 au maximum, obtient 132 à 144
        bpm. Des chiffres proches pour deux profils très différents&nbsp;: les
        zones n’ont de sens qu’avec vos propres valeurs.
      </p>

      <h2>Utiliser la zone 2 à l’entraînement</h2>
      <p>
        Pour la plupart des coureurs qui s’entraînent quatre à six fois par
        semaine, la grande majorité du temps de course se passe en zones 1 et 2,
        avec une ou deux séances plus dures par-dessus. Concrètement&nbsp;:
      </p>
      <ul>
        <li>
          Footings&nbsp;: 40 à 70 minutes en zone 2, plutôt dans le bas de la
          zone le lendemain d’une séance de fractionné.
        </li>
        <li>
          Sortie longue&nbsp;: 1&nbsp;h&nbsp;30 à 2&nbsp;h&nbsp;30, surtout en
          zone 2. La fréquence cardiaque dérive vers le haut avec la fatigue et
          la chaleur&nbsp;; acceptez quelques battements de dérive plutôt que de
          finir en trottinant, et notez son ampleur, qui renseigne sur votre
          endurance (voir le{' '}
          <Link href="/fr/learn/aerobic-decoupling">découplage aérobie</Link>
          ).
        </li>
        <li>
          En terrain vallonné, marchez dans les montées raides si c’est ce qui
          vous garde dans la zone. En trail, tout le monde le fait de toute
          façon en course.
        </li>
        <li>
          Suivez vos progrès sur une référence fixe&nbsp;: la même boucle plate,
          à la même fréquence cardiaque, toutes les trois ou quatre semaines. Si
          l’allure à 140 bpm s’améliore, votre fond aérobie progresse.
        </li>
      </ul>
      <p>
        Le test de la parole reste un bon garde-fou&nbsp;: si vous ne pouvez
        prononcer que quelques mots d’affilée, vous êtes au-dessus de la zone 2,
        quoi qu’en dise la montre.
      </p>
      <p>
        Dans OpenAthlete, les zones cardiaques se règlent en pourcentage de la
        FCmax ou de la réserve cardiaque, par sport, et chaque activité affiche
        le temps passé dans chaque zone. La{' '}
        <Link href="/fr/features/training-load">
          page sur la charge d’entraînement
        </Link>{' '}
        explique comment la fréquence cardiaque alimente aussi le{' '}
        <Link href="/fr/learn/trimp">TRIMP</Link> de chaque séance.
      </p>

      <h2>Limites</h2>
      <p>
        Les zones en pourcentage supposent que le premier seuil de chacun se
        situe à la même fraction de sa réserve cardiaque. Ce n’est pas le
        cas&nbsp;: chez les coureurs entraînés, il peut dépasser nettement
        70&nbsp;%, chez les débutants être plus bas. Un test de seuil, en
        laboratoire ou sur le terrain, donne de meilleures bornes que n’importe
        quel pourcentage.
      </p>
      <p>
        La FCmax est le maillon faible. Les formules liées à l’âge, comme celle
        de Tanaka (208 − 0,7 × âge), décrivent une moyenne de population et se
        trompent de 10 battements ou plus chez beaucoup de gens, ce qui décale
        toute la zone. La chaleur, la déshydratation, le manque de sommeil et la
        caféine font monter la fréquence cardiaque à allure égale, et le cœur
        réagit avec retard dans les côtes courtes.
      </p>
      <p>
        Enfin, gardez les promesses à leur juste mesure. Une bonne part de
        l’engouement récent autour de la zone 2, des mitochondries et de la
        «&nbsp;combustion des graisses&nbsp;» repose sur des comparaisons entre
        cyclistes professionnels et personnes peu entraînées (San-Millán et
        Brooks, 2018). Elles montrent en quoi les athlètes entraînés diffèrent,
        pas ce qu’une quantité donnée de zone 2 produira chez vous. Le volume
        facile fonctionne, un peu d’intensité par-dessus aussi&nbsp;: c’est tout
        l’intérêt de l’
        <Link href="/fr/learn/polarized-training">entraînement polarisé</Link>.
      </p>
    </div>
  );
}
