import Link from 'next/link';

export function ContentFr() {
  return (
    <div>
      <p>
        Quelques années d'historique d'entraînement, cela représente beaucoup de
        matière&nbsp;: chaque séance de fractionné, chaque courbe de fréquence
        cardiaque, chaque note du genre «&nbsp;dormi cinq heures, jambes
        vides&nbsp;». Pour un coach, c'est plus encore&nbsp;: des années de
        séances structurées, de modèles et de saisons construites pour chaque
        athlète. Savoir où vit cette matière, et qui décide de ce qu'elle
        devient, paraît une question abstraite jusqu'au jour où une plateforme
        ferme ou change de propriétaire.
      </p>

      <h2>Les plateformes ferment, et changent de mains</h2>
      <p>
        Today's Plan, une plateforme d'entraînement et de coaching, a fermé en
        mars 2024. Ses utilisateurs ont dû exporter ce qu'ils pouvaient et tout
        reconstruire ailleurs. En juillet 2026, Garmin{' '}
        <a href="https://www.garmin.com/en-US/newsroom/press-release/corporate/garmin-acquires-trainingpeaks-and-trainheroic-leading-endurance-and-strength-training-platforms-for-athletes-and-coaches/">
          a racheté TrainingPeaks et TrainHeroic
        </a>
        . TrainingPeaks continue, et rien n'indique que la plateforme traitera
        différemment les autres marques. Mais les plans, les bibliothèques de
        séances et les relations de coaching de nombreux entraîneurs d'endurance
        appartiennent désormais à un fabricant de montres, et les décisions
        concernant cette plateforme seront prises en tenant compte des intérêts
        de Garmin.
      </p>
      <p>
        Il n'y a là rien de scandaleux. Les entreprises se font racheter, et
        parfois elles échouent. Simplement, avec une plateforme fermée, votre
        historique d'entraînement n'est pas plus durable que l'entreprise qui
        l'héberge.
      </p>

      <h2>Ce que «&nbsp;exporter vos données&nbsp;» vous donne vraiment</h2>
      <p>
        Dans l'Union européenne, l'article 20 du RGPD vous accorde un droit à la
        portabilité&nbsp;: les données que vous avez fournies, dans un format
        structuré et lisible par une machine. En pratique, ce que l'on peut
        emporter varie beaucoup. Les fichiers d'activité (FIT, GPX) sortent en
        général sans problème, parce que tous les outils les lisent. Les séances
        prévues, les commentaires du coach, les modèles et la façon dont une
        saison a été construite, c'est une autre histoire&nbsp;: ils sont
        souvent stockés dans un format propre à la plateforme, et même quand on
        peut les exporter, aucun autre outil ne sait forcément les importer.
      </p>
      <p>
        Deux habitudes aident, quel que soit l'outil. Faites arriver vos
        activités à plus d'un endroit, par exemple depuis le compte de votre
        montre vers votre plateforme d'entraînement et vers un second service,
        pour qu'aucune entreprise ne détienne la seule copie. Et demandez un
        export complet une fois par an, avant d'en avoir besoin, pour voir ce
        que vous obtiendriez réellement.
      </p>

      <h2>Ce que l'open source change, et ce qu'il ne change pas</h2>
      <p>
        Le code d'OpenAthlete est{' '}
        <a href="https://github.com/openathleteorg/openathlete">public</a>. Cela
        a quelques conséquences concrètes. Vous pouvez lire comment la charge
        d'entraînement est calculée au lieu de faire confiance à une boîte
        noire. Vous pouvez voir quelles données quittent le serveur et où elles
        vont. Et si le projet s'arrêtait demain, le code, le schéma de la base
        de données et les fichiers de migration seraient toujours là, et
        n'importe qui pourrait continuer à le faire tourner. Les données
        elles-mêmes sont stockées dans une base PostgreSQL ordinaire, pas dans
        un format que seule une entreprise comprend.
      </p>
      <p>
        L'open source ne rend pas un logiciel sûr par magie. Un code que
        personne ne lit n'est pas plus sûr parce qu'il est public, et un petit
        projet a moins de relecteurs qu'un projet populaire. Il ne garantit pas
        non plus que quelqu'un continuera à le maintenir. Ce qu'il garantit,
        c'est que vous avez le droit de regarder, et que la possibilité de
        continuer sans l'auteur d'origine existe.
      </p>

      <h2>Pourquoi l'AGPL</h2>
      <p>
        OpenAthlete est publié sous{' '}
        <a href="https://www.gnu.org/licenses/agpl-3.0.html">
          licence publique générale GNU Affero v3
        </a>
        . Chacun peut l'utiliser, le modifier, le faire tourner et le
        redistribuer. La condition&nbsp;: si vous le modifiez et que vous
        laissez d'autres personnes utiliser votre version à travers un réseau,
        vous devez leur proposer le code source de cette version. La GPL
        classique ne l'exige pas pour un logiciel utilisé comme service web, et
        c'est pour cela que la variante Affero existe.
      </p>
      <p>
        Concrètement, personne ne peut prendre OpenAthlete, y ajouter des
        fonctionnalités et le vendre comme un service hébergé fermé. Les
        améliorations apportées par quiconque le fait tourner pour d'autres
        reviennent à tout le monde. La version hébergée sur openathlete.org
        utilise le même code public&nbsp;; les fonctionnalités qui n'ont de sens
        que là-bas, comme la facturation, restent désactivées tant qu'elles ne
        sont pas configurées.
      </p>

      <h2>L'auto-hébergement, sans enjoliver</h2>
      <p>
        Vous pouvez installer OpenAthlete sur votre propre serveur avec le
        fichier <code>docker-compose.yml</code> du dépôt ou les images publiées
        sur GHCR. Il faut PostgreSQL et Redis, tous deux inclus dans le fichier
        compose. C'est gratuit, sans limite d'athlètes ni fonctionnalité
        payante. Une instance auto-hébergée n'envoie rien à OpenAthlete, ce
        qu'un test automatisé vérifie à chaque version. Vous pouvez brancher une
        authentification unique via OIDC, choisir des inscriptions ouvertes, sur
        invitation ou fermées, et faire tourner les fonctions d'IA sur un modèle
        local via Ollama, pour que rien du tout ne quitte votre machine.
      </p>
      <p>
        Les contreparties sont bien réelles. Les sauvegardes, les mises à jour
        et la sécurité sont à votre charge. Les connexions aux montres utilisent
        vos propres identifiants de développeur auprès de chaque
        fournisseur&nbsp;: certains, comme Strava, s'obtiennent vite, d'autres,
        comme Garmin, examinent les demandes avant d'ouvrir l'accès à leur API.
        L'import de fichiers FIT, GPX ou TCX fonctionne sans rien de tout cela.
        L'auto-hébergement a surtout du sens pour un coach ou un groupe qui
        compte quelqu'un à l'aise avec un serveur, ou pour une structure qui
        doit garder les données de ses athlètes sur sa propre infrastructure. La{' '}
        <Link href="/fr/self-hosting">page auto-hébergement</Link> détaille
        l'installation.
      </p>

      <h2>Si vous préférez ne pas gérer de serveur</h2>
      <p>
        La version hébergée est gratuite, avec toutes les fonctionnalités. Son
        API et sa base de données tournent chez OVH, en France, et l'application
        web est servie par Vercel. L'offre Supporter (5 € par mois ou 50 € par
        an) ajoute l'IA sur les clés d'OpenAthlete et le suivi de plus de cinq
        athlètes, et elle aide à payer les serveurs. Les raisons du projet sont
        détaillées sur la <Link href="/fr/open-source">page open source</Link>.
      </p>
    </div>
  );
}
