import Link from 'next/link';

export function ContentFr() {
  return (
    <div>
      <p>
        Une montre de course moderne enregistre beaucoup&nbsp;: trace GPS,
        allure, fréquence cardiaque, cadence, parfois puissance, plus le sommeil
        et la variabilité de fréquence cardiaque la nuit. Puis elle vous livre
        des conclusions&nbsp;: une VO2max estimée, un temps de récupération, un
        score de disponibilité, un statut d'entraînement «&nbsp;productif&nbsp;»
        ou «&nbsp;non productif&nbsp;». Les mesures sont dans l'ensemble bonnes.
        C'est sur les conclusions qu'il faut être prudent, car la montre ignore
        l'essentiel de ce qu'un entraîneur voudrait savoir.
      </p>

      <h2>Ce que la montre mesure, et ce qu'elle estime</h2>
      <p>
        Le temps, la distance et l'allure issus du GPS sont assez fiables pour
        l'entraînement, hors grands immeubles, couvert forestier et virages
        serrés sur piste. La fréquence cardiaque est mesurée, mais la qualité
        dépend du capteur. Dans une étude comparant à un ECG, les capteurs
        optiques de poignet étaient moins précis qu'une ceinture thoracique,
        avec une précision variable selon l'appareil et le type d'exercice
        (Gillinov et al.,{' '}
        <a href="https://pubmed.ncbi.nlm.nih.gov/28709155/">
          Med Sci Sports Exerc, 2017
        </a>
        ). En pratique, le capteur optique s'en sort bien en footing et peine en
        fractionné, par temps froid et avec un bracelet lâche.
      </p>
      <p>
        Tout le reste est une estimation construite sur ces données. Les
        calories en sont l'exemple le plus net&nbsp;: une étude de Stanford sur
        sept appareils de poignet a montré que la plupart mesuraient la
        fréquence cardiaque avec une erreur médiane inférieure à 5&nbsp;% sur
        vélo, mais qu'aucun n'estimait la dépense énergétique avec une erreur
        inférieure à 20&nbsp;% (Shcherbina et al.,{' '}
        <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC5491979/">
          J Pers Med, 2017
        </a>
        ). VO2max, temps de récupération et scores de disponibilité sortent
        d'algorithmes propriétaires que les fabricants décrivent dans les
        grandes lignes sans les publier sous une forme vérifiable. Ce peuvent
        être des tendances utiles. Ce ne sont pas des mesures.
      </p>

      <h2>Ce que la montre ne sait pas</h2>
      <p>
        Elle ne sait pas ce que la séance devait être. Un 10 km à 4:45/km est un
        bon tempo pour un coureur et une erreur pour un autre qui avait un
        footing au programme. Sans le plan, il n'y a rien à quoi comparer.
      </p>
      <p>
        Elle ne sait pas comment vous avez vécu la séance. L'effort perçu est
        souvent le premier à changer quand la fatigue s'accumule, avant la
        fréquence cardiaque ou l'allure. Une revue systématique a montré que les
        mesures auto-déclarées des athlètes réagissaient à la charge
        d'entraînement avec plus de sensibilité et de régularité que les
        marqueurs objectifs, fréquence cardiaque de repos comprise (Saw et al.,{' '}
        <a href="https://pubmed.ncbi.nlm.nih.gov/26423706/">
          Br J Sports Med, 2016
        </a>
        ). Certaines montres demandent désormais une note après la sortie&nbsp;;
        si la vôtre le fait, servez-vous-en.
      </p>
      <p>
        Elle ne connaît pas votre vie. La fatigue mentale augmente l'effort
        perçu sans modifier fréquence cardiaque ni lactatémie, du moins en
        laboratoire (
        <a href="https://pubmed.ncbi.nlm.nih.gov/28044281/">
          Van Cutsem et al., Sports Med, 2017
        </a>
        ). Stress au travail, nouveau-né, vol long-courrier&nbsp;: la montre en
        capte peut-être une partie par le sommeil et la VFC, mais elle ne peut
        pas savoir pourquoi.
      </p>
      <p>
        Elle ignore la gêne à votre tendon d'Achille, la course dans huit
        semaines, ou le fait que vous reprenez après trois semaines d'arrêt.
        Elle vous dira volontiers «&nbsp;non productif&nbsp;» en plein affûtage.
      </p>

      <h2>Utilisez-la pour ce qu'elle fait bien</h2>
      <p>
        Faites confiance aux mesures, questionnez les conclusions. Pour les
        séances où la fréquence cardiaque compte, une ceinture thoracique vaut
        son prix. Regardez les tendances de disponibilité et de VFC sur une
        semaine ou plus, pas comme un verdict quotidien&nbsp;: un score bas
        après une bonne nuit, avec des jambes fraîches, c'est probablement
        l'algorithme qui se trompe, pas vous.
      </p>
      <p>
        Ajoutez le contexte vous-même. Après chaque séance, une note de 0 à 10
        et une ligne de commentaire («&nbsp;mollets raides&nbsp;», «&nbsp;chaud,
        28&nbsp;°C&nbsp;», «&nbsp;mal dormi&nbsp;») prennent trente secondes et
        rendent vos données lisibles un mois plus tard. Une fois par semaine,
        comparez ce que vous avez fait à ce qui était prévu&nbsp;: séances
        faites, manquées, modifiées, et pourquoi.
      </p>
      <p>
        Et gardez le plan ailleurs que dans votre tête. Les séances suggérées
        par la montre sont construites à partir de ses estimations et ne
        connaissent de votre objectif que ce que vous y avez saisi. Un plan
        écrit par vous ou par un coach, avec des séances clés placées en
        fonction de votre vie, donne aux données un repère.
      </p>

      <h2>Cette semaine</h2>
      <p>
        Choisissez une estimation donnée par votre montre (statut
        d'entraînement, temps de récupération ou disponibilité) et notez-la
        chaque jour à côté de votre propre note de fraîcheur de 0 à 10. En fin
        de semaine, regardez combien de fois elles concordaient. Vous saurez
        quel poids accorder à ce chiffre.
      </p>

      <p>
        OpenAthlete est une plateforme gratuite qui vient se placer au-dessus de
        votre montre&nbsp;: elle importe les activités depuis Garmin, COROS,
        Suunto, Polar et Strava (ou des fichiers FIT, GPX et TCX), les met en
        regard de la séance prévue, et réunit dans le même calendrier le RPE, le
        TRIMP cardiaque, ainsi que le sommeil et la VFC de votre appareil. Les
        séances structurées peuvent être envoyées sur les montres Garmin, Suunto
        et COROS. Voir{' '}
        <Link href="/fr/features/watch-sync">synchronisation montre</Link> et{' '}
        <Link href="/fr/features/training-load">charge d'entraînement</Link>.
      </p>
    </div>
  );
}
