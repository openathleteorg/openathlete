import Link from 'next/link';

import { Sources } from './sources';

export function ContentFr() {
  return (
    <div>
      <p>
        Demandez à dix coureurs pourquoi ils se sont blessés&nbsp;: la plupart
        ont une explication toute prête. Les nouvelles chaussures, la séance sur
        piste, le trail avec trop de descente, «&nbsp;j’en ai fait trop, trop
        vite&nbsp;». La recherche est moins catégorique. Le lien entre charge
        d’entraînement et blessure existe, mais il est plus faible, plus bruité
        et plus individuel que ne le laissent croire les tableaux de bord de la
        plupart des applications. Cet article fait le point sur ce que les
        études permettent d’affirmer, et sur l’endroit où elles s’arrêtent.
      </p>

      <h2>À quelle fréquence les coureurs se blessent</h2>
      <p>
        Une revue systématique sur les coureurs de fond relevait des taux de
        blessure annuels compris entre 19&nbsp;% et 79&nbsp;% selon les études
        (van Gent et al., 2007). Un tel écart en dit autant sur la façon dont
        chaque étude définit une blessure que sur la course à pied elle-même.
        Compter par heure de pratique est plus parlant&nbsp;: une méta-analyse
        plus récente trouvait environ 18 blessures pour 1 000 heures chez les
        débutants, contre 8 environ chez les coureurs réguliers (Videbæk et al.,
        2015). À temps de course égal, un débutant se blesse deux fois plus
        souvent. Premier indice&nbsp;: ce qui compte, c’est l’écart entre ce que
        vous faites et ce à quoi votre corps est habitué.
      </p>
      <p>
        Le facteur de risque le plus constant d’une étude à l’autre n’est ni le
        kilométrage ni l’allure. C’est une blessure antérieure (van der Worp et
        al., 2015). Si vous avez déjà eu une tendinite d’Achille, ce tendon
        mérite plus de prudence que n’importe quel ratio affiché sur un
        graphique.
      </p>

      <h2>Charge contre capacité</h2>
      <p>
        Le cadre le plus utile pour penser les blessures de surmenage vient de
        Bertelsen et ses collègues (2017). Une blessure survient quand la charge
        appliquée à une structure précise, le tibia ou l’aponévrose plantaire
        par exemple, dépasse ce que cette structure peut encaisser, de façon
        répétée, sur une certaine durée. Deux choses varient&nbsp;: la charge
        que vous imposez, et la capacité du tissu, qui progresse avec un
        entraînement graduel et baisse avec le manque de sommeil, des apports
        énergétiques insuffisants, une maladie ou une blessure passée.
      </p>
      <p>
        Ce cadre met le doigt sur la limite de tous les indicateurs de charge.
        Votre montre mesure une durée, une distance et une fréquence cardiaque.
        Votre tibia, lui, se moque de votre fréquence cardiaque. Deux heures de
        trail avec 1 200 m de D− et deux heures sur le plat à la même fréquence
        cardiaque moyenne donnent un TRIMP voisin, mais vos quadriceps et vos
        genoux vous diront le lendemain que ce n’était pas la même journée. Les
        chiffres de charge décrivent assez bien ce que coûte une séance à votre
        système cardiovasculaire. Ils ne décrivent qu’indirectement ce qu’elle
        coûte à un tendon ou à un os donné.
      </p>

      <h2>Ce que montrent les études sur la course à pied</h2>
      <p>
        Les bonnes études sur les coureurs sont moins nombreuses qu’on ne le
        croit, et la plupart suivent des débutants. Trois méritent d’être
        connues.
      </p>
      <p>
        Dans une cohorte danoise de 874 coureurs débutants équipés de montres
        GPS, ceux qui augmentaient leur distance hebdomadaire de plus de
        30&nbsp;% sur deux semaines présentaient davantage de blessures
        «&nbsp;liées à la distance&nbsp;» (syndrome fémoro-patellaire, syndrome
        de la bandelette ilio-tibiale, périostite tibiale et quelques autres)
        que ceux qui restaient sous 10&nbsp;% (Nielsen et al., 2014). Le taux
        global de blessure ne différait pas entre les groupes, et même ce
        résultat-là était à la limite de la significativité. Les auteurs
        qualifient eux-mêmes l’étude d’exploratoire.
      </p>
      <p>
        Dans un essai randomisé néerlandais, 532 débutants préparant une course
        de 6,7 km suivaient soit un plan classique de 8 semaines, soit un plan
        plus progressif de 13 semaines fondé sur la règle des 10&nbsp;%. Les
        taux de blessure ont été quasi identiques&nbsp;: 20,8&nbsp;% et
        20,3&nbsp;% (Buist et al., 2008).
      </p>
      <p>
        Dans l’essai Run Clever, 447 coureurs loisirs ont fait progresser
        pendant 16 semaines soit le volume, soit l’intensité de leurs sorties.
        Les chercheurs s’attendaient à ce que chaque approche entraîne son
        propre type de blessure. Ils n’ont trouvé aucune différence (Ramskov et
        al., 2018).
      </p>
      <p>
        En résumé&nbsp;: les gros sauts soudains comptent probablement, surtout
        chez les débutants. En dessous, affiner le rythme de progression n’a pas
        montré d’effet net. Pour la mise en pratique semaine après semaine,
        voyez{' '}
        <Link href="/fr/blog/injury-prevention-2-when-algorithms-predict-the-break">
          à quel rythme augmenter votre kilométrage
        </Link>
        .
      </p>

      <h2>Le ratio charge aiguë/chronique, et pourquoi il fait débat</h2>
      <p>
        Si vous avez lu sur le sujet, vous avez croisé l’ACWR (acute:chronic
        workload ratio)&nbsp;: la charge de la dernière semaine divisée par la
        charge hebdomadaire moyenne des quatre dernières. Il est issu d’études
        sur les lanceurs rapides au cricket (Hulin et al., 2014) et a été
        popularisé par l’article de Tim Gabbett sur le «&nbsp;paradoxe
        entraînement-prévention des blessures&nbsp;», qui décrivait une zone
        idéale entre 0,8 et 1,3 et une zone dangereuse au-dessus de 1,5
        (Gabbett, 2016). En quelques années, ces chiffres se sont retrouvés dans
        les applications, les formations d’entraîneurs et bon nombre d’articles
        de blog, dont une version précédente de celui-ci.
      </p>
      <p>Les critiques sont arrivées tout aussi vite.</p>
      <ul>
        <li>
          Dans le calcul habituel, la dernière semaine figure à la fois au
          numérateur et au dénominateur. Lolli et ses collègues (2019) ont
          montré que ce couplage mathématique crée à lui seul une corrélation,
          même avec des données aléatoires.
        </li>
        <li>
          Impellizzeri et ses collègues (2020) soulignent que diviser par la
          charge chronique suppose une relation entre les deux qui n’a jamais
          été vérifiée, que le ratio change selon qu’on utilise des moyennes
          glissantes ou exponentielles, et que les seuils viennent de quelques
          échantillons de sports collectifs, appliqués ensuite à tout le monde.
          Un an plus tard, ils recommandaient d’abandonner l’ACWR et la théorie
          qui le sous-tend (Impellizzeri et al., 2021).
        </li>
        <li>
          La plupart des études sur l’ACWR sont observationnelles, menées en
          sports collectifs, avec peu de blessures. Une variable associée aux
          blessures à l’échelle d’un groupe ne dit pas quel individu va se
          blesser. Roald Bahr l’a montré pour les tests de dépistage en général,
          et cela vaut ici aussi (Bahr, 2016).
        </li>
      </ul>
      <p>
        Mon avis&nbsp;: l’idée sous-jacente, ne pas faire brutalement beaucoup
        plus que ce que vous faisiez ces dernières semaines, est ancienne,
        sensée, et cohérente avec les données sur la course citées plus haut.
        Les seuils précis, eux, ne sont pas établis. Considérez
        «&nbsp;1,5&nbsp;» comme du folklore plutôt que de la physiologie, et
        méfiez-vous de tout outil qui résume votre entraînement en un
        pourcentage de risque de blessure.
      </p>

      <h2>Qu’en faire concrètement</h2>
      <p>
        Des preuves fragiles ne sont pas une raison d’ignorer la charge. C’est
        une raison de l’utiliser pour ce qu’elle sait faire&nbsp;: signaler
        qu’une semaine tranche nettement avec les précédentes, et pousser à se
        demander pourquoi.
      </p>
      <p>
        Surveillez ce que les indicateurs de charge ne voient pas. Une première
        séance de fractionné sur piste depuis des mois, un trail avec beaucoup
        de D−, des chaussures avec moins de drop, un passage des sentiers au
        bitume&nbsp;: chacun sollicite certains tissus d’une manière nouvelle,
        même si le total hebdomadaire bouge à peine. Changez un seul de ces
        paramètres à la fois.
      </p>
      <p>
        Prenez au sérieux ce que vous ressentez. Une revue systématique a montré
        que les mesures subjectives (humeur, fatigue, courbatures) réagissaient
        à l’entraînement de façon plus fiable que les marqueurs objectifs
        courants, comme la fréquence cardiaque ou les analyses sanguines (Saw et
        al., 2016). Notez une douleur le jour où elle apparaît, avec sa
        localisation et son intensité. Une douleur qui modifie votre foulée, qui
        est pire le lendemain matin, ou qui se concentre sur un point précis
        d’un os justifie d’arrêter et de consulter, quoi qu’indique un
        graphique.
      </p>
      <p>
        Et tenez compte de la capacité. Une semaine de mauvais sommeil, une
        gastro ou une période où vous mangez trop peu diminuent ce que vos
        tissus peuvent encaisser. Le même plan d’entraînement ne représente pas
        la même charge pour le même coureur à tous les moments de l’année.
      </p>

      <h2>Ce que fait OpenAthlete</h2>
      <p>
        OpenAthlete ne prédit pas les blessures et ne vous attribue pas de score
        de risque. L’application affiche côte à côte les chiffres que cet
        article juge utiles. Chaque séance reçoit une charge calculée à partir
        de la fréquence cardiaque (TRIMP), avec la charge RPE de séance à côté.
        La forme, la fatigue et la fraîcheur sont tracées sur votre historique
        et projetées sur les séances planifiées, et chaque semaine affiche sa
        charge face à une fourchette construite à partir de vos semaines
        récentes&nbsp;: un repère, pas une limite de sécurité. Après une
        activité, quelques questions facultatives enregistrent l’effort ressenti
        et les douleurs que vous mentionnez&nbsp;; ces douleurs alimentent un
        journal des blessures que votre entraîneur consulte. Le détail et les
        formules sont sur la{' '}
        <Link href="/fr/features/training-load">
          page consacrée à la charge d’entraînement
        </Link>
        .
      </p>

      <h2>Sources</h2>
      <Sources />
    </div>
  );
}
