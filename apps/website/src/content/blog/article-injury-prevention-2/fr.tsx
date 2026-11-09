import Link from 'next/link';

import { Sources } from './sources';

export function ContentFr() {
  return (
    <div>
      <p>
        Vous courez environ 40 km par semaine depuis deux mois. Votre marathon
        est dans 16 semaines et vous aimeriez que vos plus grosses semaines
        atteignent 70 km. Cet article explique comment passer de l’un à l’autre
        sans finir la neuvième semaine avec une poche de glace sur le tibia. Il
        est volontairement pratique&nbsp;: pour ce que la recherche dit, et ne
        dit pas, du lien entre charge et blessure, lisez{' '}
        <Link href="/fr/blog/preventing-training-injuries">
          blessures en course à pied et charge d’entraînement
        </Link>
        .
      </p>

      <h2>La règle des 10&nbsp;% est un plafond inventé</h2>
      <p>
        Personne ne sait vraiment d’où vient la règle des 10&nbsp;%, et elle a
        été bien moins testée que sa célébrité ne le laisse penser. Quand des
        chercheurs néerlandais ont donné à 532 coureurs débutants soit un plan
        classique de 8 semaines, soit un plan plus lent de 13 semaines fondé sur
        des hausses de 10&nbsp;%, les taux de blessure ont été les mêmes&nbsp;:
        environ un coureur sur cinq dans chaque groupe (Buist et al., 2008). Une
        cohorte danoise de 874 débutants n’a trouvé un signal possible
        qu’au-delà de 30&nbsp;% sur deux semaines, et encore, à la limite de la
        significativité (Nielsen et al., 2014).
      </p>
      <p>
        La règle échoue en plus dans les deux sens. À faible volume, elle est
        d’une lenteur absurde&nbsp;: 20 km par semaine deviennent 22. À plus
        haut volume, appliquée chaque semaine sans pause, elle s’emballe.
        Quarante kilomètres plus 10&nbsp;% par semaine pendant dix semaines,
        cela donne 104 km. Personne ne devrait faire ça, et c’est pourtant ce
        que dit la règle.
      </p>
      <p>
        Ce que les études et le consensus du CIO sur la charge (Soligard et al.,
        2016) soutiennent, c’est l’idée générale&nbsp;: augmenter
        progressivement, éviter les grands sauts soudains, et s’adapter à la
        personne. Le reste relève du jugement d’entraîneur, et je le présenterai
        comme tel.
      </p>

      <h2>Comment je fais progresser le volume</h2>
      <p>
        <strong>Une marche, puis un palier.</strong> Ajoutez un bloc, disons 4 à
        6 km ou 30 minutes, puis restez à ce niveau une ou deux semaines avant
        la marche suivante. D’expérience, un coureur encaisse mieux un niveau
        qu’il a déjà répété qu’un nouveau record chaque semaine. C’est une
        observation de terrain, pas un résultat d’essai clinique.
      </p>
      <p>
        <strong>Une semaine allégée toutes les trois ou quatre.</strong>{' '}
        Réduisez le volume d’un quart à un tiers environ et gardez une petite
        séance de qualité, par exemple 6 × 1 min vite le mercredi, pour ne pas
        arriver émoussé au bloc suivant. Le pourcentage exact ne repose sur
        aucune étude solide. L’habitude de la planifier avant d’en avoir besoin,
        si.
      </p>
      <p>
        <strong>Une seule nouveauté à la fois.</strong> N’ajoutez pas 6 km la
        semaine de votre première séance sur piste de la saison, de votre
        premier long trail vallonné ou d’une nouvelle paire avec moins de drop.
        L’essai Run Clever a montré que faire progresser l’intensité ou le
        volume donnait des taux de blessure comparables (Ramskov et al., 2018).
        Faire progresser les deux en même temps n’était pas la question, et je
        ne me porterais pas volontaire pour le découvrir.
      </p>
      <p>
        <strong>Faites évoluer la sortie longue à part.</strong> Dix à quinze
        minutes de plus chaque fois qu’elle augmente, et en début de
        préparation, pas plus d’un tiers environ de la semaine. Un coureur à 40
        km qui fait une sortie longue de 25 km met l’essentiel de sa semaine
        dans une seule séance.
      </p>
      <p>
        <strong>Comptez ce qui vous charge vraiment.</strong> Sur route, les
        kilomètres sont un bon indicateur. En trail, comptez le temps et le
        dénivelé&nbsp;: 1 000 m de D− dans la semaine représentent une
        contrainte qu’aucune distance ne reflète, et vos quadriceps vous la
        signaleront avec deux jours de décalage.
      </p>
      <p>
        <strong>Respectez les coupures.</strong> Après quelques jours d’arrêt,
        reprenez où vous en étiez. Après deux ou trois semaines, je repars à la
        moitié ou aux deux tiers du volume précédent et je reconstruis sur trois
        ou quatre semaines. Votre moyenne récente a baissé, même si votre
        souvenir d’elle n’a pas bougé.
      </p>

      <h2>Un exemple sur 16 semaines</h2>
      <p>
        Voici à quoi pourrait ressembler la progression de 40 à 70 km. Les
        durées de sortie longue supposent une allure d’endurance autour de 6:00
        au kilomètre.
      </p>
      <table>
        <thead>
          <tr>
            <th>Semaine</th>
            <th>Volume</th>
            <th>Sortie longue</th>
            <th>Remarque</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td>40 km</td>
            <td>1h20</td>
            <td>Niveau actuel</td>
          </tr>
          <tr>
            <td>2</td>
            <td>44 km</td>
            <td>1h30</td>
            <td>Première marche</td>
          </tr>
          <tr>
            <td>3</td>
            <td>44 km</td>
            <td>1h30</td>
            <td>Palier</td>
          </tr>
          <tr>
            <td>4</td>
            <td>34 km</td>
            <td>1h15</td>
            <td>Semaine allégée</td>
          </tr>
          <tr>
            <td>5</td>
            <td>48 km</td>
            <td>1h40</td>
            <td></td>
          </tr>
          <tr>
            <td>6</td>
            <td>52 km</td>
            <td>1h45</td>
            <td></td>
          </tr>
          <tr>
            <td>7</td>
            <td>52 km</td>
            <td>1h50</td>
            <td>Palier</td>
          </tr>
          <tr>
            <td>8</td>
            <td>40 km</td>
            <td>1h30</td>
            <td>Semaine allégée</td>
          </tr>
          <tr>
            <td>9</td>
            <td>56 km</td>
            <td>2h00</td>
            <td></td>
          </tr>
          <tr>
            <td>10</td>
            <td>60 km</td>
            <td>2h05</td>
            <td></td>
          </tr>
          <tr>
            <td>11</td>
            <td>60 km</td>
            <td>2h15</td>
            <td>Palier</td>
          </tr>
          <tr>
            <td>12</td>
            <td>46 km</td>
            <td>1h40</td>
            <td>Semaine allégée</td>
          </tr>
          <tr>
            <td>13</td>
            <td>65 km</td>
            <td>2h20</td>
            <td></td>
          </tr>
          <tr>
            <td>14</td>
            <td>70 km</td>
            <td>2h30</td>
            <td>Pic</td>
          </tr>
          <tr>
            <td>15</td>
            <td>52 km</td>
            <td>1h45</td>
            <td>Affûtage</td>
          </tr>
          <tr>
            <td>16</td>
            <td>30 km + course</td>
            <td>Course</td>
            <td>Semaine de course</td>
          </tr>
        </tbody>
      </table>
      <p>
        Regardez la semaine 5. Par rapport à la semaine allégée qui précède,
        c’est un bond de 41&nbsp;%, de quoi déclencher toutes les alertes d’une
        application fondée sur un ratio. Par rapport aux semaines 2 et 3, le
        niveau auquel le coureur s’entraînait réellement, c’est 9&nbsp;%.
        Comparez une nouvelle semaine à l’entraînement d’avant la semaine
        allégée, pas à la semaine allégée elle-même.
      </p>
      <p>
        Remarquez aussi ce que le plan ne fait pas&nbsp;: il n’ajoute jamais du
        volume et un nouveau type de séance la même semaine, et le pic tombe
        deux semaines avant la course, pas une. Si votre objectif est un trail
        vallonné, remplacez les kilomètres par des heures et ajoutez une colonne
        pour le D+.
      </p>

      <h2>À quoi comparer une semaine</h2>
      <p>
        Si vous voulez un seul chiffre, comparez la semaine en cours à la
        moyenne des trois ou quatre précédentes, sans inclure la semaine en
        cours dans cette moyenne. Servez-vous-en comme d’une invitation à
        regarder de plus près, pas comme d’un verdict. Le fameux ratio charge
        aiguë/chronique et sa «&nbsp;zone idéale&nbsp;» entre 0,8 et 1,3 ont été
        vivement critiqués, notamment pour ce double comptage (Impellizzeri et
        al., 2020). Il n’existe pas de seuil validé, ni pour vous ni pour
        personne.
      </p>

      <h2>Quand faire un palier ou reculer</h2>
      <p>
        Arrêtez la progression, et en général la course pendant quelques jours,
        si une douleur modifie votre foulée, augmente pendant la sortie ou est
        pire le lendemain matin. Une douleur localisée sur un point précis d’un
        os, comme le tibia ou le dessus du pied, mérite un avis médical avant la
        prochaine sortie, pas après les trois suivantes.
      </p>
      <p>
        Restez au niveau actuel, ou avancez la semaine allégée, si vos footings
        vous paraissent plus durs que d’habitude plusieurs jours de suite, si la
        même allure facile vous coûte plus de battements, ou si votre sommeil se
        dégrade. Ce sont les premiers signes décrits dans{' '}
        <Link href="/fr/blog/5-signs-of-overtraining-and-how-to-avoid-it">
          surentraînement et surmenage
        </Link>
        . Décaler une marche d’une semaine ne vous coûte presque rien. Une
        fracture de fatigue vous coûte la course.
      </p>

      <h2>Le planifier dans OpenAthlete</h2>
      <p>
        La vue saison d’OpenAthlete permet de dessiner une progression comme
        celle-ci sous forme de blocs (foncier, spécifique, affûtage,
        récupération) avec votre course par-dessus, et chaque semaine affiche sa
        charge face à une fourchette construite à partir de vos semaines
        récentes. Cette fourchette est un repère pour cadrer la semaine, pas une
        limite de sécurité. La forme, la fatigue et la fraîcheur sont projetées
        sur les séances planifiées&nbsp;: vous voyez l’effet d’une semaine
        allégée sur votre fraîcheur avant de la courir. Les douleurs mentionnées
        dans les questions facultatives d’après séance alimentent un journal des
        blessures que votre entraîneur consulte. Plus de détails sur les pages{' '}
        <Link href="/fr/features/training-calendar">
          calendrier d’entraînement
        </Link>{' '}
        et <Link href="/fr/features/training-load">charge d’entraînement</Link>.
      </p>

      <h2>Sources</h2>
      <Sources />
    </div>
  );
}
