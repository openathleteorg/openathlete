import Link from 'next/link';

export function ContentFr() {
  return (
    <div>
      <p>
        Prenez un club d'athlétisme ou de triathlon ordinaire. Piste le mardi,
        séance au seuil ou en côtes le jeudi, sortie longue collective le
        dimanche. Trois ou quatre entraîneurs bénévoles, un responsable
        technique qui gère aussi le site du club, et entre quarante et deux
        cents licenciés, du débutant qui prépare son premier 10&nbsp;km à celui
        qui vise moins de 3&nbsp;heures sur marathon. L'entraînement vit dans un
        groupe WhatsApp, un tableur partagé que comprend une seule personne, et
        la mémoire du responsable technique.
      </p>
      <p>
        Ça fonctionne, jusqu'au jour où ça ne fonctionne plus. Le propriétaire
        du tableur déménage. Un adhérent qui a mal au tendon d'Achille le dit à
        un entraîneur, absent le mardi suivant. Le groupe WhatsApp compte
        140&nbsp;membres et la moitié l'a mis en sourdine. Passer l'entraînement
        en ligne ne règle rien de tout cela à lui seul. Un peu d'organisation,
        si.
      </p>

      <h2>Commencer par savoir qui entraîne qui</h2>
      <p>
        Avant de choisir un outil, mettez la structure par écrit. Les clubs qui
        tournent bien ont en général les mêmes éléments, quel que soit le
        logiciel&nbsp;:
      </p>
      <ul>
        <li>
          Des groupes définis par l'allure actuelle, pas par l'ambition. Un
          groupe «&nbsp;footing à 5'30-6'00/km&nbsp;» et un groupe
          «&nbsp;4'45-5'15/km&nbsp;» sont plus clairs que
          «&nbsp;intermédiaire&nbsp;» et «&nbsp;confirmé&nbsp;», et on peut
          passer de l'un à l'autre sans que cela ressemble à une promotion ou à
          une rétrogradation.
        </li>
        <li>
          Un entraîneur référent par groupe, et un suppléant pour les semaines
          où il est absent.
        </li>
        <li>
          Pour les adhérents qui veulent un plan individuel, un entraîneur
          principal. D'autres peuvent aider, mais une seule personne est
          responsable de la charge globale.
        </li>
        <li>
          Un endroit unique où l'on note blessures et petites gênes, pour que
          l'entraîneur de service suivant soit au courant.
        </li>
      </ul>

      <h2>Écrire les séances du club une seule fois</h2>
      <p>
        La plupart des séances de club reviennent avec des variantes&nbsp;: 6 à
        10 × 400&nbsp;m allure 5&nbsp;km récup 200&nbsp;m trot, 3 × 8&nbsp;min
        au seuil, des côtes de 45&nbsp;secondes. Le responsable technique (ou
        celui que ça amuse) écrit les séances de la semaine une fois, avec des
        cibles en pourcentage de la VMA, du seuil ou de la FC max de chaque
        adhérent plutôt qu'en allures fixes. Le coureur à 4'00/km et celui à
        6'00/km font alors la même séance chacun à son intensité, et les
        entraîneurs de groupe n'ajustent que le volume&nbsp;: huit répétitions
        pour un groupe, cinq pour un autre.
      </p>
      <p>
        Rangez-les dans une bibliothèque partagée, pas dans la tête de
        quelqu'un. Le jour où le responsable technique passe la main, le club
        garde ses séances.
      </p>

      <h2>Séparer les annonces des échanges d'entraînement</h2>
      <p>
        Une seule discussion de groupe pour tout, c'est là que l'information va
        mourir. Séparez&nbsp;: un canal réservé aux annonces (changement de
        lieu, courses, assemblée générale), où seuls les entraîneurs publient,
        et des échanges d'entraînement par groupe. Un retour sur la séance d'une
        personne en particulier se fait sur cette séance, pas dans une
        discussion à soixante.
      </p>

      <h2>Les données de santé demandent du soin</h2>
      <p>
        Les douleurs signalées et les notes de blessure sont des données de
        santé, une catégorie particulière au sens du RGPD, et la fréquence
        cardiaque ou le sommeil peuvent l'être aussi. Les adhérents ont le droit
        de savoir qui les voit. Concrètement&nbsp;: demandez leur accord avant
        de connecter leur montre, ne donnez à chaque entraîneur accès qu'aux
        adhérents qu'il suit vraiment, et décidez qui peut lire les notes de
        blessure. Pour les jeunes, associez les parents.
      </p>

      <h2>Deux façons de faire tourner un club sur OpenAthlete aujourd'hui</h2>
      <p>
        Réponse franche d'abord&nbsp;: OpenAthlete n'a pas de compte club. Pas
        de groupes, pas de calendrier de club, pas de facturation au club. Ce
        qui existe fonctionne quand même pour un club, de l'une de ces deux
        façons.
      </p>
      <p>
        <strong>Un compte par entraîneur, sur nos serveurs.</strong> Chaque
        entraîneur a son propre compte gratuit, qui couvre jusqu'à cinq
        athlètes&nbsp;; Supporter (5&nbsp;€ par mois ou 50&nbsp;€ par an et par
        entraîneur) lève la limite. Un athlète peut avoir plusieurs
        entraîneurs&nbsp;: l'entraîneur course et l'entraîneur renforcement
        planifient dans le même calendrier. Les conversations de groupe
        réunissent un groupe d'entraînement, chaque séance a son fil de
        commentaires, et chaque entraîneur dispose d'un tableau de bord pour ses
        athlètes&nbsp;: respect du plan, volume, forme et alertes de douleur ou
        d'inactivité. Les adhérents peuvent avoir n'importe quelle montre&nbsp;:
        les activités viennent de Garmin, COROS, Suunto, Polar, Strava ou de
        fichiers, et les séances prévues partent sur les montres Garmin, COROS
        et Suunto. Ils peuvent aussi s'abonner à leurs séances depuis Google
        Agenda ou Apple Calendrier.
      </p>
      <p>
        <strong>Le club héberge sa propre instance.</strong> OpenAthlete est
        open source&nbsp;: un club peut l'installer sur un petit serveur et
        avoir sa propre plateforme à sa propre adresse, sans limite d'athlètes
        ni abonnement. Les adhérents peuvent se connecter par authentification
        unique avec Authentik, Keycloak ou tout fournisseur OpenID Connect, et
        les inscriptions peuvent être sur invitation ou fermées. Une instance
        auto-hébergée n'envoie rien à OpenAthlete. Une précision honnête&nbsp;:
        la synchronisation COROS fonctionne d'emblée, mais Garmin, Suunto, Polar
        et Strava demandent au club de s'inscrire au programme développeur de
        chaque marque, et Garmin et Suunto valident les partenaires au cas par
        cas. L'import de fichiers fonctionne toujours.
      </p>
      <p>
        Pour un club avec un ou deux entraîneurs et quelques dizaines
        d'athlètes, la première option est la plus rapide à mettre en place.
        Pour un club plus grand, avec quelqu'un à l'aise avec un serveur, la
        seconde est ce qui se rapproche le plus d'un compte club aujourd'hui. La{' '}
        <Link href="/fr/clubs">page clubs</Link> compare les deux, avec le coût
        pour un club de 50&nbsp;athlètes, et la{' '}
        <Link href="/fr/self-hosting">page auto-hébergement</Link> détaille
        l'installation. Les fonctions club sont sur la feuille de route&nbsp;;
        si votre club a des besoins précis, nous dire comment vous vous
        entraînez réellement est le retour le plus utile que vous puissiez nous
        faire.
      </p>
    </div>
  );
}
