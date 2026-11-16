import Link from 'next/link';

export function ContentFr() {
  return (
    <div>
      <p>
        OpenAthlete est une plateforme d'entraînement pour les sportifs
        d'endurance et leurs coachs. On y trouve un calendrier des séances
        prévues, des séances structurées envoyées sur la montre, les activités
        qui en reviennent, un modèle de charge d'entraînement et un espace
        partagé où coach et athlète travaillent sur le même plan. Le code est
        libre, sous licence AGPL-3.0. La version hébergée est gratuite, et vous
        pouvez aussi l'installer sur votre propre serveur.
      </p>
      <p>
        Cet article explique pourquoi elle existe, ce qu'elle fait aujourd'hui
        et, tout aussi utile, ce qu'elle ne fait pas.
      </p>

      <h2>Pourquoi OpenAthlete existe</h2>
      <p>
        OpenAthlete est l'œuvre d'un développeur indépendant installé à
        Grenoble, lui-même coureur d'ultra-trail. Aucun investisseur derrière.
        Le projet est né d'une routine que beaucoup connaissent&nbsp;: préparer
        la saison dans un tableur, ressaisir chaque séance de fractionné dans
        l'application du fabricant de la montre, puis ouvrir une troisième
        application pour voir si la séance s'était déroulée comme prévu. Trois
        outils, dont aucun ne connaissait les deux autres.
      </p>
      <p>
        Les plateformes commerciales qui règlent ce problème sont de bons
        produits. Elles facturent aussi les coachs à l'athlète, et elles
        conservent des années d'historique sur leurs serveurs, selon leurs
        conditions. Quand Today's Plan a fermé en mars 2024, ses utilisateurs
        ont découvert ce qu'ils pouvaient réellement emporter. En juillet 2026,
        Garmin a racheté TrainingPeaks, l'une des plateformes de coaching les
        plus connues&nbsp;: les plans de nombreux coachs dépendent désormais
        d'un fabricant de montres.
      </p>
      <p>
        L'idée d'OpenAthlete, c'est que le cœur d'une plateforme d'entraînement
        (un calendrier, des séances structurées, un modèle de charge, le lien
        avec la montre) relève de l'infrastructure. Et une infrastructure se
        porte mieux quand chacun peut la lire, la faire tourner et la maintenir
        en vie.
      </p>

      <h2>Ce qu'elle fait aujourd'hui</h2>
      <p>
        <strong>La planification.</strong> Vous construisez une séance bloc par
        bloc, par exemple 15 minutes d'échauffement, 5 × 4 minutes au seuil avec
        2 minutes de récupération en trottinant, 10 minutes de retour au calme,
        et les cibles viennent de vos propres zones, de vos allures ou d'un
        pourcentage de VMA, de FTP ou de FC max. Les séances vivent dans un
        calendrier où elles se déplacent par glisser-déposer, et un coach peut
        déplacer ou copier des semaines entières d'un coup.
      </p>
      <p>
        <strong>La montre.</strong> Les séances prévues partent vers les montres
        Garmin, Suunto et COROS. Les activités réalisées arrivent depuis Garmin,
        COROS, Suunto, Polar et Strava, ou depuis un fichier FIT, GPX ou TCX. À
        la connexion d'un compte, Strava et COROS importent tout votre
        historique, Garmin et Suunto les 30 derniers jours, et Polar uniquement
        les nouvelles activités.
      </p>
      <p>
        <strong>La charge d'entraînement.</strong> La charge est calculée par la
        méthode TRIMP à partir de la fréquence cardiaque, avec le RPE de séance
        enregistré à côté. La forme, la fatigue et la fraîcheur (CTL, ATL et
        TSB) sont projetées sur les séances prévues&nbsp;: vous voyez l'effet
        des trois prochaines semaines sur votre fraîcheur avant la course, et
        non après. La page{' '}
        <Link href="/fr/features/training-load">charge d'entraînement</Link>{' '}
        détaille le modèle.
      </p>
      <p>
        <strong>Le coaching.</strong> Le coach planifie directement dans le
        calendrier de chaque athlète, réutilise ses modèles de séances et voit
        ce qui a réellement été fait. Un athlète peut avoir plusieurs coachs, et
        une messagerie de groupe est disponible. Suivre jusqu'à cinq athlètes
        est gratuit. Les clubs ont un espace club gratuit, avec des groupes et
        leurs coachs, une bibliothèque de séances partagée, des séances de club
        hebdomadaires et des plans copiés à tout un groupe&nbsp;; les athlètes
        qu'un coach suit via un club ne comptent pas dans cette limite.
      </p>
      <p>
        <strong>L'IA, si vous le souhaitez.</strong> Rien ne tourne sans votre
        accord, que vous pouvez retirer à tout moment. Une fois activée, l'IA
        peut écrire une séance structurée à partir d'une phrase, modifier une
        séance sur simple consigne, vous poser trois ou quatre questions après
        une activité et en tirer une note d'effort et un relevé de douleur
        visibles par votre coach, livrer une courte lecture de chaque nouvelle
        activité et estimer la charge d'une séance prévue. Vous utilisez votre
        propre clé d'API (OpenAI, Anthropic, Google, Mistral et d'autres, ou un
        modèle local sur une instance auto-hébergée) ou le quota inclus dans
        l'offre Supporter. Il n'y a pas de chat dans l'application&nbsp;: pour
        converser, le <Link href="/fr/features/mcp-server">serveur MCP</Link>{' '}
        permet à Claude ou à ChatGPT de lire votre entraînement et de planifier
        des séances dans votre calendrier.
      </p>

      <h2>Ce qu'elle ne fait pas</h2>
      <ul>
        <li>
          Les séances ne peuvent pas être envoyées sur les montres Polar ni vers
          Strava. Ces deux services servent uniquement de sources d'activités.
        </li>
        <li>
          Il n'y a pas de facturation au club&nbsp;: l'espace club est gratuit,
          et les cotisations se gèrent en dehors d'OpenAthlete.
        </li>
        <li>
          Elle ne prédit pas les blessures. Elle enregistre la douleur quand
          l'athlète la signale et la montre au coach&nbsp;: c'est moins
          spectaculaire, et plus honnête.
        </li>
        <li>Les unités sont uniquement métriques.</li>
        <li>
          Les applications iOS et Android sont en phase de test. En attendant,
          l'application web fonctionne sur téléphone et s'installe sur l'écran
          d'accueil.
        </li>
        <li>
          La connexion COROS est toute récente&nbsp;: attendez-vous à quelques
          imperfections, et signalez-les-nous.
        </li>
      </ul>

      <h2>Comment le projet est financé</h2>
      <p>
        Toutes les fonctionnalités sont gratuites sur la version hébergée.
        L'offre Supporter, à 5 € par mois ou 50 € par an, ajoute deux
        choses&nbsp;: l'IA sur les clés d'OpenAthlete, avec un quota mensuel, et
        le suivi de plus de cinq athlètes. L'auto-hébergement est gratuit et
        sans limite. Tout est détaillé sur la{' '}
        <Link href="/fr/pricing">page des tarifs</Link>.
      </p>
      <p>
        L'API et la base de données de la version hébergée tournent chez OVH, en
        France, et l'application web est servie par Vercel. Une instance
        auto-hébergée n'envoie rien à OpenAthlete, ce qu'un test automatisé
        vérifie à chaque version.
      </p>

      <h2>Par où commencer</h2>
      <p>
        Si vous vous entraînez seul, connectez votre montre, renseignez vos
        zones (le{' '}
        <Link href="/fr/tools/heart-rate-zones">
          calculateur de zones cardiaques
        </Link>{' '}
        est un bon point de départ si vous ne les avez jamais mesurées) et
        planifiez une semaine. Si vous êtes coach, invitez d'abord un seul
        athlète et faites une semaine complète ensemble avant d'y faire passer
        tout le monde.
      </p>
      <p>
        Le code source est sur{' '}
        <a href="https://github.com/openathleteorg/openathlete">GitHub</a>. Les
        signalements de bugs et les demandes de fonctionnalités s'y déposent, ou
        sur Discord. Ils sont lus, et ils décident d'une bonne partie de ce qui
        sera construit ensuite.
      </p>
    </div>
  );
}
