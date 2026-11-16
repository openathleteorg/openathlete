import Link from 'next/link';

import { pricesFor } from './prices';

const { quoted: q, coachYear } = pricesFor('fr');

export function ContentFr() {
  return (
    <div>
      <p>
        TrainingPeaks est depuis longtemps la plateforme par défaut des
        entraîneurs d'endurance, et pour de bonnes raisons&nbsp;: le Performance
        Management Chart, un vocabulaire (TSS, CTL, TSB) que la moitié du milieu
        parle désormais, une boutique pleine de plans et des applications
        mobiles abouties. Ceux qui cherchent ailleurs le font surtout pour une
        question d'argent. Le compte Basic gratuit n'envoie pas les séances
        planifiées sur la montre, et les entraîneurs paient pour chaque athlète
        en Premium. Depuis le rachat de TrainingPeaks par Garmin le 22 juillet
        2026, certains veulent aussi une plateforme qui n'appartient pas à un
        fabricant de montres&nbsp;; cette question a son propre article,
        <Link href="/fr/blog/trainingpeaks-alternatives-after-garmin-acquisition">
          les alternatives à TrainingPeaks après le rachat par Garmin
        </Link>
        . Celui-ci s'en tient aux prix et aux fonctionnalités.
      </p>
      <p>
        Cet article compare quatre alternatives sur ce qu'elles coûtent et ce
        qu'elles font&nbsp;: intervals.icu, Nolio, Final Surge et OpenAthlete,
        que nous développons. Les prix viennent de la page tarifs de chaque
        éditeur, relevés le 3 novembre 2026. Les prix en dollars américains sont
        hors taxes, comme les affichent les éditeurs.
      </p>

      <h2>Ce que coûte TrainingPeaks</h2>
      <p>
        Pour un athlète, Basic est gratuit et Premium coûte {q('tpMonth')} par
        mois ou {q('tpYear')} par an. L'envoi des séances structurées sur la
        montre fait partie de Premium, et c'est la raison principale pour
        laquelle les coureurs autonomes passent à l'offre payante.
      </p>
      <p>
        Pour un entraîneur, l'offre d'entrée est à {q('tpCoach')} par mois, avec
        quatre athlètes Basic et un en Premium. Chaque athlète Premium
        supplémentaire ajoute {q('tpPerMax')} par mois, puis jusqu'à{' '}
        {q('tpPerMin')} avec le volume, et des frais de mise en service de{' '}
        {q('tpSetup')} s'appliquent, offerts avec un code promo. Concrètement,
        un entraîneur dont tous les athlètes ont besoin des séances sur la
        montre paie environ {coachYear('trainingpeaks', 10)} par an pour dix
        athlètes et {coachYear('trainingpeaks', 30)} pour trente, sauf si les
        athlètes paient eux-mêmes leur Premium.
      </p>

      <h2>Ce qu'il faut comparer</h2>
      <p>
        Les listes de fonctionnalités se ressemblent toutes. Quatre questions
        départagent mieux ces plateformes&nbsp;:
      </p>
      <ul>
        <li>
          Les séances planifiées arrivent-elles sur la montre avec l'offre
          gratuite, et pour quelles marques&nbsp;?
        </li>
        <li>
          Comment la charge d'entraînement est-elle calculée, et la formule
          est-elle visible&nbsp;? Aucune alternative n'utilise le TSS&nbsp;: les
          chiffres ne correspondront pas à ceux dont vous avez l'habitude.
        </li>
        <li>Comment le prix entraîneur évolue-t-il avec l'effectif&nbsp;?</li>
        <li>
          Pouvez-vous récupérer vos données, et que se passe-t-il si
          l'entreprise s'arrête&nbsp;? Today's Plan, une plateforme de coaching
          payante, a fermé en mars 2024 et ses utilisateurs ont dû déménager
          tous leurs athlètes.
        </li>
      </ul>

      <h2>intervals.icu</h2>
      <p>
        intervals.icu est gratuit, avec une offre Supporter facultative à{' '}
        {q('icuMonth')} par mois ({q('icuYear')} par an). C'est l'option la plus
        forte ici pour l'analyse&nbsp;: courbes de puissance, graphiques
        personnalisés, et la plus longue liste d'intégrations, dont Wahoo et
        Zwift pour les séances, qu'OpenAthlete ne couvre pas. Le coaching est
        gratuit&nbsp;; les équipes et organisations demandent Supporter. Pas
        d'application mobile officielle (il en existe de tierces), et le code
        est fermé. Si vous êtes un athlète autonome qui aime les données,
        commencez par là.
      </p>

      <h2>Nolio</h2>
      <p>
        Nolio, entreprise grenobloise partenaire de la Fédération française
        d'athlétisme, propose une offre athlète gratuite généreuse, avec
        synchronisation montre et séances structurées. Premium coûte{' '}
        {q('nolioPremium')} par mois. Les offres entraîneur sont à{' '}
        {q('nStarter')} par mois pour 3 athlètes, {q('nClassic')} pour 25 et{' '}
        {q('nPro')} pour 30 athlètes et deux entraîneurs. Il existe des offres
        club pour les associations, les applications sont natives, et plus de
        200 vidéos d'exercices sont fournies. Nolio n'annonce pas d'IA intégrée
        et, comme les autres, son code est fermé. Notre{' '}
        <Link href="/fr/blog/nolio-vs-trainingpeaks-vs-openathlete-2025-comparison">
          comparatif à trois avec TrainingPeaks
        </Link>{' '}
        détaille le côté entraîneur.
      </p>

      <h2>Final Surge</h2>
      <p>
        Final Surge est gratuit pour les athlètes. Les entraîneurs paient un
        forfait de {q('fsStarter')} par mois pour 1 à 5 athlètes ou {q('fsPro')}{' '}
        jusqu'à 100, sans frais par athlète. Les séances structurées partent
        vers Garmin et COROS. L'outil est pensé pour les entraîneurs, écoles et
        clubs de course américains, avec des remises scolaires et des
        applications natives. Des tarifs simples et honnêtes&nbsp;; moins de
        profondeur côté analyse.
      </p>

      <h2>OpenAthlete</h2>
      <p>
        Toutes les fonctionnalités sont gratuites sur nos serveurs&nbsp;:
        calendrier, éditeur de séances, envoi des séances vers Garmin, Suunto et
        COROS, charge d'entraînement et coaching jusqu'à cinq athlètes. L'offre
        Supporter facultative ({q('oaMonth')} par mois ou {q('oaYear')} par an)
        ajoute l'IA sur nos clés et un nombre illimité d'athlètes suivis, rien
        d'autre. Le code est sous licence AGPL-3.0&nbsp;: vous pouvez aussi
        l'héberger sur votre propre serveur, gratuitement et sans limite. Les
        clubs ont aussi un espace club gratuit, sans limite d'athlètes&nbsp;:
        des groupes avec leurs entraîneurs, une bibliothèque de séances
        partagée, des séances de club hebdomadaires et des plans copiés à tout
        un groupe.
      </p>
      <p>
        La charge d'entraînement est le TRIMP de Banister calculé à partir de la
        fréquence cardiaque, avec le RPE de séance à côté, et la forme, la
        fatigue et la fraîcheur sont projetées sur les séances planifiées. Les
        fonctions d'IA tournent avec votre propre clé (OpenAI, Anthropic,
        Mistral et d'autres) quelle que soit l'offre&nbsp;: une séance
        structurée à partir d'une phrase, une courte lecture de chaque activité,
        et quelques questions après chaque sortie qui consignent l'effort et les
        douleurs pour l'entraîneur. Claude ou ChatGPT peuvent aussi planifier
        dans le calendrier via le serveur MCP.
      </p>
      <p>
        Ce qu'OpenAthlete ne fait pas encore&nbsp;: les applications iOS et
        Android sont en test (en attendant, l'application web s'installe sur le
        téléphone), il n'y a ni boutique de plans, ni application d'entraînement
        en intérieur, ni facturation au club, et l'analyse de la puissance est
        moins poussée que sur intervals.icu. Les séances ne peuvent pas partir
        vers les montres Polar, dont l'API est en lecture seule. Les unités sont
        uniquement métriques.
      </p>

      <h2>Les chiffres côte à côte</h2>
      <table>
        <thead>
          <tr>
            <th></th>
            <th>Athlète autonome, séances sur la montre</th>
            <th>Entraîneur avec 10 athlètes, par an</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>TrainingPeaks</td>
            <td>Premium, {q('tpYear')}/an</td>
            <td>{coachYear('trainingpeaks', 10)} (athlètes en Premium)</td>
          </tr>
          <tr>
            <td>intervals.icu</td>
            <td>Gratuit (Supporter {q('icuYear')}/an facultatif)</td>
            <td>Gratuit&nbsp;; les équipes demandent Supporter</td>
          </tr>
          <tr>
            <td>Nolio</td>
            <td>Gratuit</td>
            <td>{coachYear('nolio', 10)} (Classic)</td>
          </tr>
          <tr>
            <td>Final Surge</td>
            <td>Gratuit</td>
            <td>{coachYear('final-surge', 10)} (Pro)</td>
          </tr>
          <tr>
            <td>OpenAthlete</td>
            <td>Gratuit</td>
            <td>{q('oaYear')} (Supporter)</td>
          </tr>
        </tbody>
      </table>
      <p>
        Prix publics relevés le 3 novembre 2026. Les éditeurs les
        modifient&nbsp;: vérifiez leurs pages avant de vous décider.
      </p>

      <h2>Laquelle choisir</h2>
      <p>
        Restez sur TrainingPeaks si vous vendez des plans sur sa boutique, si
        vos athlètes utilisent TrainingPeaks Virtual, ou si toute votre pratique
        repose sur le TSS et que vous ne voulez pas réapprendre les chiffres.
        Choisissez intervals.icu pour l'analyse gratuite la plus poussée,
        surtout avec un capteur de puissance. Choisissez Nolio si vous entraînez
        dans un club français et voulez des tarifs associatifs et des
        applications natives dès aujourd'hui. Choisissez Final Surge pour une
        équipe scolaire ou un club américain avec un forfait simple. Choisissez
        OpenAthlete si vous voulez vos séances sur Garmin, Suunto ou COROS sans
        payer, un prix entraîneur fixe, l'IA avec votre propre clé, un espace
        club gratuit, ou un code que vous pouvez héberger vous-même.
      </p>

      <h2>Récupérer votre historique</h2>
      <p>
        Vos activités sont aussi dans votre compte montre, souvent la source la
        plus simple. Dans OpenAthlete, Strava et COROS apportent tout votre
        historique, Garmin et Suunto les 30 derniers jours, et Polar seulement
        ce que vous enregistrez après la connexion&nbsp;; les fichiers FIT, GPX
        et TCX plus anciens s'importent en lot. Les séances planifiées et les
        plans ne passent pas d'une plateforme à l'autre&nbsp;: recréez vos
        séances types sous forme de modèles. Nous n'avons pas vérifié nous-mêmes
        l'export en masse de TrainingPeaks&nbsp;: consultez son centre d'aide
        avant de compter dessus.
      </p>
      <p>
        Pour essayer OpenAthlete, la <Link href="/fr/pricing">page tarifs</Link>{' '}
        détaille ce qui est gratuit et ce qu'ajoute Supporter.
      </p>
    </div>
  );
}
