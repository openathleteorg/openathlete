import Link from 'next/link';

export function ContentFr() {
  return (
    <div>
      <p>
        Beaucoup de bons entraîneurs gèrent toute leur activité depuis un
        tableur. Un onglet par athlète, une ligne par jour, une couleur par type
        de séance, et une colonne de commentaires que l'athlète remplit, ou pas.
        C'est gratuit, ça s'adapte à toutes les méthodes, et personne ne peut
        vous le retirer. Le titre de cet article est un peu injuste&nbsp;: Excel
        n'est pas mort, et pour certains entraîneurs c'est encore le bon outil.
      </p>
      <p>
        Il a pourtant un coût, qui grandit avec le nombre d'athlètes de façon
        facile à sous-estimer. Cet article le détaille, montre comment mieux
        exploiter un tableur si vous le gardez, et à partir de quand un logiciel
        dédié se justifie.
      </p>

      <h2>Là où le tableur fonctionne</h2>
      <p>
        Avec trois à cinq athlètes que vous connaissez bien, qui s'entraînent
        surtout aux sensations et vous écrivent après les séances clés, un
        tableur est difficile à battre. Vous pouvez écrire n'importe quoi dans
        une cellule&nbsp;: «&nbsp;6 × 1 km allure 10 km, récup 1'30 trot, arrêt
        à 4 si les mollets tirent&nbsp;» est une prescription parfaitement
        valable, et aucun logiciel ne vous imposera son vocabulaire. Le partage
        est simple avec Google Sheets, l'historique reste où vous l'avez mis, et
        il n'y a pas d'abonnement.
      </p>

      <h2>Là où il commence à coûter</h2>
      <p>
        Le premier coût est côté athlète. Une séance écrite dans une cellule
        doit être recopiée dans Garmin Connect ou l'application COROS pour
        apparaître sur la montre, ou retenue de tête pendant la sortie. La
        plupart des athlètes le font pour la séance clé de la semaine et pas
        pour le reste&nbsp;: le seuil se court alors à l'allure dont ils se
        souviennent, pas à celle que vous avez écrite.
      </p>
      <p>
        Le deuxième, c'est le retour. Pour comparer le prévu et le réalisé,
        quelqu'un doit recopier la sortie depuis Strava ou l'application de la
        montre&nbsp;: distance, durée, éventuellement fréquence cardiaque
        moyenne. Soit l'athlète le fait, irrégulièrement, soit vous le faites,
        le dimanche soir. Dans les deux cas, vous obtenez un résumé de la
        séance, pas la séance&nbsp;: vous voyez que le 6 × 1 km est sorti à
        4:05/km de moyenne, pas que les deux dernières répétitions étaient à
        4:15 avec le cardio qui montait.
      </p>
      <p>
        Le troisième, ce sont les changements. Une course décalée de deux
        semaines, un athlète malade cinq jours, un séjour en montagne qui
        remplace un bloc de piste. Dans un tableur, vous réécrivez les lignes à
        la main, vérifiez que les totaux hebdomadaires tiennent encore, et
        espérez que l'athlète a ouvert la dernière version et pas celle jointe
        au mail de mardi dernier.
      </p>
      <p>
        Le quatrième, c'est la charge. La plupart des entraîneurs qui restent
        sur tableur suivent le volume (kilomètres, heures) et pas grand-chose
        d'autre, parce qu'aller plus loin demande des formules et de la saisie.
        Le volume seul cache beaucoup&nbsp;: 60 km d'endurance fondamentale et
        60 km avec deux séances de qualité ne font pas la même semaine.
      </p>

      <h2>Si vous gardez le tableur, faites-le bien</h2>
      <p>Quelques habitudes règlent l'essentiel sans changer d'outil.</p>
      <ul>
        <li>
          Utilisez un tableur en ligne partagé par athlète plutôt que des
          fichiers envoyés par mail. Il n'existe alors qu'une version, et
          l'athlète voit vos modifications dès que vous les faites.
        </li>
        <li>
          Ajoutez deux colonnes que l'athlète remplit après chaque séance&nbsp;:
          la durée en minutes et l'effort ressenti sur une échelle de 0 à 10.
          Multipliez-les et vous obtenez le RPE de séance de Foster (Foster et
          al., 2001), une mesure de charge qui ne demande aucun capteur&nbsp;:
          50 minutes à RPE 6 font 300. Faites la somme par semaine et vous voyez
          un bloc se construire, ou une semaine qui est allée trop loin.
        </li>
        <li>
          Gardez un modèle pour chaque séance récurrente («&nbsp;seuil 5 ×
          4'&nbsp;», «&nbsp;sortie longue avec les 20 dernières minutes allure
          marathon&nbsp;») et copiez-le plutôt que de le retaper. Moins de
          fautes, et l'athlète apprend le vocabulaire.
        </li>
        <li>
          Demandez une ligne de commentaire par séance, pas un paragraphe.
          «&nbsp;Jambes lourdes, tendon d'Achille gauche raide au réveil&nbsp;»,
          c'est exactement ce qu'il faut pour repérer un problème tôt.
        </li>
      </ul>
      <p>
        Avec ça, un tableur fait un travail correct pour une poignée d'athlètes.
        Il ne mettra toujours pas la séance sur la montre, et il dépend toujours
        de gens qui recopient des chiffres qui existent déjà ailleurs.
      </p>

      <h2>Ce que change un logiciel</h2>
      <p>
        L'intérêt d'une plateforme de coaching, ce ne sont pas les graphiques.
        C'est que les données circulent sans que personne ne les recopie. Vous
        écrivez la séance une fois, avec des cibles tirées des zones de
        l'athlète&nbsp;; elle part sur sa montre&nbsp;; l'activité revient toute
        seule après la sortie et se place à côté du prévu, étape par étape.
        Quand une course bouge, vous faites glisser le bloc à la nouvelle date
        et la montre suit. La charge est calculée à partir de chaque séance, que
        quelqu'un ait pensé à remplir une colonne ou non.
      </p>
      <p>
        Ce n'est pas gratuit non plus. Vous passerez une soirée ou deux à
        recréer vos séances habituelles sous forme de modèles, certains athlètes
        auront besoin d'aide pour connecter leur montre, et vous perdez un peu
        de la liberté de la cellule vide. Que cela en vaille la peine dépend
        surtout du nombre d'athlètes et de la fréquence des changements. En
        gros, la question se pose vraiment au-delà de cinq athlètes, ou la
        première fois que l'un d'eux court une séance clé d'après une version
        périmée du plan.
      </p>

      <h2>Essayer sans payer</h2>
      <p>
        OpenAthlete est gratuit pour les entraîneurs jusqu'à cinq athlètes, avec
        toutes les fonctionnalités&nbsp;: calendrier, éditeur de séances, envoi
        vers les montres Garmin, Suunto et COROS, import des activités de ces
        marques ainsi que de Polar et Strava, et charge d'entraînement calculée
        à partir de la fréquence cardiaque avec le RPE de séance à côté. Au-delà
        de cinq athlètes, Supporter coûte 50 € par an pour un effectif illimité.
        Vous pouvez le tester à côté de votre tableur avec un ou deux athlètes
        pendant un mois avant de décider. La{' '}
        <Link href="/fr/coaches">page entraîneurs</Link> montre à quoi ressemble
        l'espace entraîneur.
      </p>

      <h2>Source</h2>
      <ul>
        <li>
          Foster C, Florhaug JA, Franklin J, et al. A new approach to monitoring
          exercise training. Journal of Strength and Conditioning Research,
          2001;15(1):109–115.
        </li>
      </ul>
    </div>
  );
}
