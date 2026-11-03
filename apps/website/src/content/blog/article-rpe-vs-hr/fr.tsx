import Link from 'next/link';

export function ContentFr() {
  return (
    <div>
      <p>
        Deux footings, même boucle, même allure de 5:00/km, même fréquence
        cardiaque moyenne de 148 bpm. Le mardi, vous l'auriez noté 3 sur 10. Le
        jeudi, après deux nuits courtes et une longue journée de travail, plutôt
        6. Votre montre range ces deux séances dans la même case. Votre
        organisme, non.
      </p>

      <p>
        La fréquence cardiaque et l'effort perçu (RPE, pour{' '}
        <em>rating of perceived exertion</em>) mesurent tous deux la charge
        interne&nbsp;: ce que le travail vous a coûté, par opposition à la
        charge externe, le travail lui-même (distance, allure, puissance). La
        distinction vient d'Impellizzeri, Marcora et Coutts, pour qui c'est la
        charge interne qui provoque l'adaptation, et qui recommandent de suivre
        les deux en parallèle (
        <a href="https://doi.org/10.1123/ijspp.2018-0935">
          Int J Sports Physiol Perform, 2019
        </a>
        ). Fréquence cardiaque et RPE regardent cette charge interne sous deux
        angles différents, et ils sont assez souvent en désaccord pour que ce
        désaccord mérite d'être lu.
      </p>

      <h2>Ce que dit vraiment la fréquence cardiaque</h2>
      <p>
        La fréquence cardiaque est la réponse cardiovasculaire au travail. Sur
        des efforts stables de quelques minutes ou plus, elle suit bien
        l'intensité, et c'est pour cela que les zones cardiaques et les scores
        de charge de type TRIMP fonctionnent pour l'essentiel de l'entraînement
        en endurance. Mais elle ne réagit pas qu'à l'intensité.
      </p>
      <p>
        Elle est en retard. Au début d'une fraction de 4 minutes, il lui faut
        une à deux minutes pour rattraper l'effort&nbsp;: elle sous-estime donc
        les répétitions courtes, et ne dit presque rien d'utile sur une côte de
        30 secondes. Elle dérive. Sur une sortie longue à allure constante, elle
        monte lentement à mesure que le volume d'éjection systolique baisse,
        davantage à la chaleur ou en cas de déshydratation&nbsp;; Coyle et
        González-Alonso en détaillent les mécanismes (
        <a href="https://pubmed.ncbi.nlm.nih.gov/11337829/">
          Exerc Sport Sci Rev, 2001
        </a>
        ). Elle bouge avec la caféine, la maladie, l'altitude et le stress. Et
        le chiffre affiché au poignet peut tout simplement être faux&nbsp;:
        comparés à un ECG, les capteurs optiques de poignet se sont montrés
        moins précis qu'une ceinture thoracique, avec une précision variable
        selon l'appareil et l'activité (Gillinov et al.,{' '}
        <a href="https://pubmed.ncbi.nlm.nih.gov/28709155/">
          Med Sci Sports Exerc, 2017
        </a>
        ).
      </p>

      <h2>Ce qu'ajoute le RPE</h2>
      <p>
        Le RPE est le résumé que fait votre cerveau de tout à la fois&nbsp;:
        respiration, jambes, chaleur, motivation, attention demandée par la
        séance. La méthode du RPE de séance de Carl Foster en fait une valeur de
        charge&nbsp;: notez la séance entière sur l'échelle de Borg de 0 à 10
        environ 30 minutes après la fin, puis multipliez par la durée en minutes
        (Foster et al.,{' '}
        <a href="https://pubmed.ncbi.nlm.nih.gov/11708692/">
          J Strength Cond Res, 2001
        </a>
        ). Un footing de 50 minutes noté 3 donne 150 unités arbitraires&nbsp;;
        une séance de seuil de 70 minutes avec 5 × 4' notée 7 en donne 490.
      </p>
      <p>
        En moyenne, les deux méthodes concordent. Chez de jeunes footballeurs,
        la charge en RPE de séance était corrélée à trois méthodes fondées sur
        la fréquence cardiaque, avec des corrélations individuelles d'environ
        0,50 à 0,85 (Impellizzeri et al.,{' '}
        <a href="https://pubmed.ncbi.nlm.nih.gov/15179175/">
          Med Sci Sports Exerc, 2004
        </a>
        ). Chez de jeunes fondeurs, fréquence cardiaque et RPE de séance
        donnaient presque la même répartition des intensités, avec environ trois
        quarts des séances en zone facile (Seiler et Kjerland,{' '}
        <a href="https://pubmed.ncbi.nlm.nih.gov/16430681/">
          Scand J Med Sci Sports, 2006
        </a>
        ). Des corrélations de cet ordre signifient aussi que les deux divergent
        régulièrement sur une séance donnée. C'est là qu'ils deviennent utiles.
      </p>

      <h2>Lire le désaccord</h2>
      <p>
        <strong>
          Fréquence cardiaque normale, RPE plus élevé que d'habitude.
        </strong>{' '}
        Le footing du jeudi. Le système cardiovasculaire a fait le même travail,
        mais la séance a coûté plus cher. Le manque de sommeil, la fatigue
        mentale, la fatigue accumulée et un début de maladie font monter le RPE
        avant de se voir sur le cardio. Une séance comme celle-là, c'est du
        bruit. Trois footings dans la semaine, c'est une raison d'alléger ou de
        décaler la prochaine séance difficile.
      </p>
      <p>
        <strong>
          Fréquence cardiaque plus haute que d'habitude, RPE normal.
        </strong>{' '}
        Le plus souvent, l'environnement ou le capteur&nbsp;: chaleur, humidité,
        un double expresso, un bracelet trop lâche. Vérifiez les conditions
        avant de tirer une conclusion sur votre forme. Si cela persiste par
        temps frais, surtout avec une fréquence cardiaque de repos élevée,
        pensez à une maladie qui couve.
      </p>
      <p>
        <strong>
          Fréquence cardiaque plus basse que d'habitude, RPE plus élevé.
        </strong>{' '}
        Le cas à prendre au sérieux, en particulier si vous n'arrivez plus à
        faire monter le cardio en fractionné. C'est l'un des signes décrits chez
        les athlètes en surmenage dans le consensus ECSS/ACSM sur le
        surentraînement (Meeusen et al.,{' '}
        <a href="https://pubmed.ncbi.nlm.nih.gov/23247672/">
          Med Sci Sports Exerc, 2013
        </a>
        ), qui précise toutefois qu'aucun marqueur ne suffit à lui seul à poser
        le diagnostic. Reposez-vous quelques jours et regardez si les deux
        valeurs reviennent à la normale.
      </p>
      <p>
        <strong>Les deux plus bas à allure égale.</strong> Vous progressez.
        Profitez-en, et résistez à l'envie d'accélérer tous vos footings.
      </p>

      <h2>Lequel utiliser, et quand</h2>
      <p>
        En footing et en sortie longue, un plafond cardiaque reste le moyen le
        plus simple de garder les jours faciles vraiment faciles, à condition de
        tolérer la dérive sur la dernière heure. Pour des fractions de 5 minutes
        ou moins, prenez l'allure ou la puissance comme cible et le RPE comme
        contrôle&nbsp;: le cardio arrive trop tard pour piloter une répétition.
        En course et lors des longues journées en montagne, le RPE est la seule
        mesure qui intègre la chaleur, le D+ et les 40 km déjà dans les jambes.
      </p>
      <p>
        Pour la charge, gardez les deux. Le TRIMP calculé sur la fréquence
        cardiaque donne une valeur qui ne dépend pas de votre humeur&nbsp;; le
        RPE de séance repère les séances que le reste de votre vie a rendues
        plus dures. Quand les deux tendances divergent pendant une semaine ou
        plus, quelque chose a changé en dehors de l'entraînement.
      </p>

      <h2>Cette semaine</h2>
      <p>
        Après chaque séance, attendez une demi-heure, demandez-vous
        «&nbsp;quelle était la difficulté de cette séance dans son
        ensemble&nbsp;?&nbsp;» et notez un chiffre de 0 à 10. Inscrivez à côté
        la fréquence cardiaque moyenne. Choisissez une boucle facile que vous
        courez souvent et comparez les paires en fin de semaine. Il n'en faut
        pas plus pour commencer à voir quels jours le cardio racontait toute
        l'histoire, et quels jours il ne la racontait pas.
      </p>

      <p>
        OpenAthlete conserve les deux pour chaque activité&nbsp;: le TRIMP issu
        des données cardio de votre montre et, dès que vous saisissez un RPE, la
        charge en RPE de séance à côté. Si vous activez les fonctions d'IA,
        quelques questions courtes après chaque activité remplissent le RPE et
        notent une éventuelle douleur, pour vous ou votre coach. C'est
        gratuit&nbsp;; la page{' '}
        <Link href="/fr/features/training-load">charge d'entraînement</Link>{' '}
        explique comment les valeurs sont combinées, et le{' '}
        <Link href="/fr/tools/heart-rate-zones">
          calculateur de zones cardiaques
        </Link>{' '}
        vous aide à régler vos zones.
      </p>
    </div>
  );
}
