import Link from 'next/link';

import { Sources } from './sources';

export function ContentFr() {
  return (
    <div>
      <p>
        Dans les logiciels d'entraînement, «&nbsp;IA&nbsp;» désigne deux choses
        très différentes, que le marketing aime confondre. D'un côté, des
        modèles statistiques qui travaillent sur des chiffres&nbsp;: fréquence
        cardiaque, allure, puissance, variabilité de la fréquence cardiaque,
        sommeil. Ils estiment ou tentent de prédire quelque chose. De l'autre,
        les modèles de langage, la famille ChatGPT, Claude ou Mistral, qui
        lisent et écrivent du texte. Les preuves scientifiques ne sont pas du
        tout les mêmes pour les deux, alors prenons-les l'un après l'autre.
      </p>

      <h2>Une bonne partie de ce qu'on vend comme de l'IA, c'est du calcul</h2>
      <p>
        Les courbes de forme, de fatigue et de fraîcheur (CTL, ATL, TSB) sont
        des moyennes pondérées exponentiellement de la charge quotidienne,
        héritées du modèle impulsion-réponse de Banister, dans les années 1970.
        Le TRIMP transforme une durée et une fréquence cardiaque en score de
        charge. Le RPE de séance est encore plus simple&nbsp;: la méthode de
        Foster multiplie la note d'effort de l'athlète, sur une échelle de 0 à
        10, par la durée en minutes. Une sortie de 60 minutes à RPE 6 vaut donc
        360 unités. Rien de tout cela n'est de l'apprentissage automatique, et
        c'est tant mieux&nbsp;: on peut vérifier la formule, on sait ce qu'elle
        ignore, et quand un chiffre paraît faux, on peut comprendre pourquoi.
      </p>
      <p>
        La déclaration de consensus sur le suivi de la charge publiée par
        Bourdon et ses collègues en 2017 recommande précisément ce type
        d'outils&nbsp;: mesurer ce qui a été fait (la charge externe, comme la
        distance et l'allure) et ce que cela a coûté à l'athlète (la charge
        interne, comme la fréquence cardiaque et le RPE), puis regarder les deux
        ensemble dans le temps. C'est toujours la base d'une bonne pratique, et
        aucun réseau de neurones n'est nécessaire.
      </p>

      <h2>
        La prédiction est plus faible que ne le laissent croire les publicités
      </h2>
      <p>
        C'est sur la prédiction des blessures que les promesses dépassent le
        plus les données. La revue de Roald Bahr parue en 2016 dans le British
        Journal of Sports Medicine explique pourquoi les tests de dépistage ne
        peuvent pas prédire la blessure d'un individu&nbsp;: même un facteur de
        risque marqué à l'échelle d'un groupe laisse un énorme chevauchement
        entre les athlètes qui se blessent et les autres. L'apprentissage
        automatique n'a pas encore beaucoup changé la donne. Une revue
        systématique de Van Eetvelde et ses collègues (2021) a recensé onze
        études sur la prédiction des blessures sportives par apprentissage
        automatique, avec des performances allant d'à peine mieux qu'un tirage à
        pile ou face (AUC de 0,52) à bonnes (0,87), et appelle à mieux
        interpréter ces modèles.
      </p>
      <p>
        Le ratio charge aiguë / charge chronique est un bon exemple à méditer.
        Pendant quelques années, l'idée qu'un ratio compris entre 0,8 et 1,3
        constituait une «&nbsp;zone idéale&nbsp;» sans danger s'est répandue
        dans les applications et les formations d'entraîneurs. Impellizzeri et
        ses collègues ont montré en 2020 que ce ratio pose des problèmes
        statistiques de fond et que les preuves de cette zone idéale ne tiennent
        pas. Augmenter brutalement la charge d'une semaine à l'autre reste une
        mauvaise idée. Un pourcentage de risque précis construit sur ce ratio,
        en revanche, n'a guère de valeur.
      </p>
      <p>
        Donc, quand une application vous affiche «&nbsp;risque de
        blessure&nbsp;: 23&nbsp;%&nbsp;», demandez comment ce chiffre a été
        validé, sur quels athlètes, et à quelle fréquence il se trompe. Sans
        réponse, considérez-le comme de la décoration.
      </p>

      <h2>
        Là où les modèles numériques aident&nbsp;: la VFC, avec une référence
      </h2>
      <p>
        La variabilité de la fréquence cardiaque est le signal quotidien le plus
        utile que la plupart des athlètes peuvent mesurer chez eux. Dans une
        petite étude de quatre semaines, Kiviniemi et ses collègues (2007) ont
        laissé la VFC du matin décider de la séance du jour&nbsp;: séance
        intense si la VFC restait stable ou montait, séance facile ou repos si
        elle passait sous la plage habituelle de l'athlète. Ce groupe a
        davantage progressé en vitesse maximale de course qu'un groupe suivant
        un plan fixe. Plews et ses collègues (2013) ont ajouté un point pratique
        important&nbsp;: une mesure isolée est bruitée, et des moyennes
        glissantes sur environ une semaine, comparées à la référence propre de
        l'athlète, sont bien plus parlantes.
      </p>
      <p>
        Notez de quoi il s'agit&nbsp;: une référence personnelle et une règle
        simple. Cela fonctionne parce que c'est individuel, pas parce que le
        modèle est malin. Il faut aussi une mesure rigoureuse, chaque matin dans
        les mêmes conditions, et c'est là que la plupart des gens décrochent.
      </p>

      <h2>Le ressenti bat encore la plupart des capteurs</h2>
      <p>
        La revue systématique de Saw, Main et Gastin (2016) a comparé des
        mesures subjectives (humeur, stress perçu, fatigue) à des mesures
        objectives (marqueurs sanguins, fréquence cardiaque de repos, réponse
        cardiaque à l'effort). Les mesures subjectives suivaient les variations
        de charge avec plus de sensibilité et de constance. Autrement dit,
        demander à l'athlète comment il se sent, et le noter à chaque fois,
        reste l'un des meilleurs outils de suivi disponibles.
      </p>
      <p>
        C'est là que les modèles de langage se révèlent vraiment utiles, d'une
        manière peu spectaculaire. Un athlète écrira ou dira volontiers
        «&nbsp;jambes lourdes dès le 8e km, Achille gauche un peu douloureux
        dans les escaliers après&nbsp;», mais remplira rarement cinq curseurs.
        Un modèle de langage peut transformer cette phrase en note d'effort et
        en relevé de douleur (Achille gauche, légère, après la sortie) que le
        coach peut filtrer et suivre dans le temps. C'est de la saisie de
        données structurées, faite par quelque chose qui comprend les
        formulations approximatives.
      </p>

      <h2>Quand un modèle de langage écrit un plan d'entraînement</h2>
      <p>
        Düking et ses collègues (2024) ont demandé à ChatGPT des plans de course
        à pied sur six semaines, avec trois niveaux de détail dans la consigne,
        puis les ont fait évaluer par des entraîneurs experts selon 22 critères
        de qualité. Avec un minimum d'informations, le plan obtenait une note
        sous la moyenne sur 19 des 22 critères. Avec des informations détaillées
        (historique, objectifs, contraintes), sur un seul. Les auteurs
        déconseillent malgré tout d'utiliser ces plans sans l'avis d'un
        entraîneur. Une étude de Washif et ses collègues (2024) sur des
        programmes de musculation arrive à une conclusion proche&nbsp;: des
        brouillons plausibles, à affiner par quelqu'un qui connaît le métier.
      </p>
      <p>
        Les modèles de langage affirment aussi des choses fausses avec aisance,
        un défaut qu'on appelle hallucination (Ji et ses collègues en font le
        tour en 2023). À l'entraînement, cela donne un volume hebdomadaire qui
        ne tombe pas juste, une «&nbsp;étude&nbsp;» qui n'existe pas, ou un
        footing de récupération discrètement placé à l'allure seuil. Ces erreurs
        passent facilement inaperçues, justement parce que le reste du texte est
        bien écrit.
      </p>

      <h2>Ce que cela change en pratique</h2>
      <p>
        Confiez aux modèles de langage le travail de texte&nbsp;: écrire une
        séance structurée à partir d'une description, résumer un mois de notes,
        recueillir le ressenti après une séance, expliquer une notion. Gardez
        les décisions de charge et d'intensité sur des chiffres vérifiables,
        avec un coach ou votre propre expérience comme filtre final. Méfiez-vous
        de tout score de risque dont vous ne voyez pas la validation. Et si vous
        ne deviez garder qu'une habitude clairement appuyée par la recherche,
        notez le ressenti de chaque séance.
      </p>

      <h2>Comment OpenAthlete utilise l'IA</h2>
      <p>
        Dans OpenAthlete, la charge d'entraînement est un TRIMP calculé à partir
        de la fréquence cardiaque, avec le RPE de séance à côté&nbsp;: des
        formules, pas une boîte noire. L'IA est facultative et s'occupe du
        travail de texte décrit plus haut&nbsp;: une séance structurée à partir
        d'une phrase, trois ou quatre questions après une activité qui
        deviennent une note d'effort et un suivi des douleurs pour le coach, et
        une courte lecture de chaque activité. Il n'y a pas de prédiction de
        blessure. La{' '}
        <Link href="/fr/features/ai-coach">page consacrée à l'IA</Link> détaille
        ce qu'elle fait et les fournisseurs que vous pouvez utiliser.
      </p>

      <h2>Sources</h2>
      <Sources />
    </div>
  );
}
