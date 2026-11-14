import Link from 'next/link';

import { articlePrices } from './prices';
import { SOURCES } from './sources';

export function ContentFr() {
  const p = articlePrices('fr');
  return (
    <div>
      <p>
        Le 22 juillet 2026, Garmin a annoncé le rachat de TrainingPeaks et de
        TrainHeroic, l&apos;application de renforcement musculaire du même
        groupe, Peaksware. Le montant n&apos;a pas été communiqué. Depuis, la
        même question revient sur les forums d&apos;entraîneurs et dans notre
        boîte mail&nbsp;: faut-il partir, et pour aller où&nbsp;?
      </p>
      <p>
        Réponse courte&nbsp;: rien ne vous y oblige aujourd&apos;hui. La réponse
        longue suit, avec les alternatives qui méritent un essai et la façon
        d&apos;emporter votre historique. Nous développons l&apos;une
        d&apos;elles, OpenAthlete&nbsp;: lisez ce passage avec la méfiance qui
        s&apos;impose. Pour les autres, nous avons essayé de les décrire comme
        le feraient leurs propres utilisateurs.
      </p>

      <h2>Ce qui a vraiment changé</h2>
      <p>
        Le propriétaire. Pour l&apos;instant, c&apos;est tout. Le{' '}
        <a href={SOURCES.garminPress}>communiqué de Garmin</a> indique
        qu&apos;environ 120 salariés de TrainingPeaks et TrainHeroic rejoignent
        Garmin et que les deux plateformes restent à Louisville, au Colorado. Il
        ne dit rien des comptes, des prix ni des montres compatibles. Aucune
        hausse n&apos;a été annoncée pour Premium ou Coach Edition, et les
        comptes entraîneur fonctionnent comme en juin. Plusieurs médias, dont{' '}
        <a href={SOURCES.cyclelytic}>CycleLytic</a>, ont rapporté que Garmin
        assurait que la compatibilité avec les autres marques ne changerait pas.
        Nous n&apos;avons pas trouvé cet engagement écrit de la main de Garmin,
        mais rien non plus qui indique le contraire. Vos athlètes en COROS,
        Suunto, Polar ou Wahoo synchronisent toujours.
      </p>
      <p>
        Alors pourquoi les coachs s&apos;interrogent-ils&nbsp;? Surtout à cause
        de celui qui fixe désormais la feuille de route. TrainingPeaks valait
        par sa neutralité, cette couche commune entre toutes les marques de
        montres et tous les entraîneurs. C&apos;est maintenant un fabricant de
        montres qui décide où travaillent ses ingénieurs. Garmin gardera
        peut-être cette neutralité, puisque c&apos;est ce qu&apos;il a acheté.
        Reste qu&apos;au rachat de Firstbeat, en 2020, Garmin avait promis que
        les licences accordées à d&apos;autres marques continueraient, et{' '}
        <a href={SOURCES.the5krunner}>the5krunner</a>, citant DC Rainmaker,
        constate que les nouveaux accords se sont taris depuis. Cela ne prouve
        rien pour TrainingPeaks. Cela explique en revanche pourquoi les coachs
        aux effectifs multimarques restent attentifs.
      </p>
      <p>
        Il y a aussi un précédent. Today&apos;s Plan appartenait à Specialized,
        avait une base fidèle d&apos;entraîneurs cyclistes, et a{' '}
        <a href={SOURCES.todaysPlan}>fermé en mars 2024</a>. Des coachs qui y
        avaient des années d&apos;historique ont eu quelques mois pour tout
        récupérer. Personne n&apos;attend la même chose de TrainingPeaks,
        beaucoup plus gros, mais ceux qui l&apos;ont vécu gardent désormais un
        plan de sortie. Enfin, la question du prix se posait déjà avant
        juillet&nbsp;: l&apos;abonnement Premium annuel est passé de 124,99 $ à
        134,99 $ en avril 2025.
      </p>

      <h2>Faut-il changer&nbsp;?</h2>
      <p>
        Pour beaucoup, la réponse honnête est non, ou pas encore. Passez en
        revue les points suivants avant d&apos;y consacrer un week-end.
      </p>

      <h3>Les montres de vos athlètes</h3>
      <p>
        Si tous vos athlètes portent une Garmin, le rachat est neutre pour vous,
        voire favorable. Si un tiers de votre groupe tourne en COROS, Suunto ou
        Polar, c&apos;est vous qui avez quelque chose à surveiller. Dressez la
        liste dès aujourd&apos;hui&nbsp;: la marque de chaque athlète, et si les
        séances programmées arrivent bien sur sa montre. C&apos;est l&apos;envoi
        des séances que vous perdriez en premier si une intégration se dégradait
        un jour.
      </p>

      <h3>Ce que vous payez</h3>
      <p>
        Tarifs publics relevés le {p.checkedOn}&nbsp;: TrainingPeaks Premium
        coûte 19,95&nbsp;$US par mois ou {p.tpPremiumYear} par an. Coach Edition
        démarre à 21,99&nbsp;$US par mois avec un athlète Premium inclus, puis
        de 9 à 4,50&nbsp;$US par mois et par athlète Premium supplémentaire
        selon la taille du groupe, plus 99&nbsp;$US de frais de mise en service,
        supprimés avec un code promo (
        <a href={SOURCES.tpCoachPricing}>tarifs coach TrainingPeaks</a>
        ). Les séances ne se synchronisent sur la montre que pour les athlètes
        Premium&nbsp;: un coach qui paie Premium pour 10 athlètes dépense
        environ {p.tpCoach10} par an hors taxes. Si vous préférez garder cet
        argent, c&apos;est une raison de regarder ailleurs, quel que soit le
        propriétaire.
      </p>

      <h3>Ce dont vous dépendez</h3>
      <p>
        Certaines choses n&apos;ont pas vraiment d&apos;équivalent. Si vous
        vendez des plans sur la marketplace de TrainingPeaks, ce public ne vous
        suivra pas. Si vos athlètes roulent l&apos;hiver sur TrainingPeaks
        Virtual ou tiennent aux applications natives, comptez-le. Et si vos
        athlètes sont contents et que vous êtes le seul inquiet, faire déménager
        25 personnes pour un risque hypothétique peut coûter plus de confiance
        qu&apos;il n&apos;en rapporte. Les coachs qui ont essayé le
        racontent&nbsp;: souvent, les athlètes disent simplement non.
      </p>

      <h3>Vos données</h3>
      <p>
        Quelle que soit votre décision, exportez votre historique maintenant.
        Cela prend une soirée et enlève l&apos;essentiel du risque. La marche à
        suivre est en fin d&apos;article.
      </p>

      <h2>Les alternatives indépendantes</h2>
      <p>
        Aucune n&apos;appartient à un fabricant de montres. Les prix sont les
        tarifs publics des éditeurs au {p.checkedOn}&nbsp;; vérifiez la page
        indiquée avant de payer.
      </p>

      <h3>intervals.icu</h3>
      <p>
        Gratuit, avec une formule Supporter à 4&nbsp;$US par mois (
        <a href={SOURCES.intervals}>intervals.icu</a>). Pour un athlète
        autocoaché qui aime les chiffres, c&apos;est le premier arrêt&nbsp;:
        forme, fatigue et fraîcheur, courbes de puissance et d&apos;allure,
        constructeur de séances, calendrier, et l&apos;une des plus longues
        listes d&apos;intégrations qui soient (Garmin, COROS, Suunto, Polar,
        Wahoo, Zwift et bien d&apos;autres). Les coachs peuvent suivre et
        planifier pour leurs athlètes&nbsp;; les équipes et structures de
        coaching demandent Supporter. Pas d&apos;application mobile officielle
        (des applis tierces comblent le manque), et beaucoup trouvent
        l&apos;interface touffue au début. Si vous vivez dans la courbe de
        forme, commencez par là.
      </p>

      <h3>Nolio</h3>
      <p>
        Grenoblois, partenaire de la Fédération française d&apos;athlétisme et
        référence dans les clubs français. Les athlètes sont gratuits (Premium à
        6,90&nbsp;€ par mois)&nbsp;; les formules coach démarrent à 19,90&nbsp;€
        par mois pour 3 athlètes et 29,90&nbsp;€ jusqu&apos;à 25, avec des
        formules club moins chères pour les associations (
        <a href={SOURCES.nolio}>tarifs Nolio</a>). Applications iOS et Android
        natives, bibliothèque de vidéos de renforcement, commentaires sur chaque
        séance. Pour un coach ou un club en France, c&apos;est le remplaçant le
        plus direct. Moins connu hors de France, et le prix monte par paliers
        avec l&apos;effectif&nbsp;: {p.nolioCoach10} par an pour un coach de 10
        athlètes.
      </p>

      <h3>Final Surge</h3>
      <p>
        Américain, apprécié des entraîneurs de course à pied, des lycées et des
        universités. Les athlètes ont toutes les fonctions gratuitement&nbsp;;
        les coachs paient un forfait de 19&nbsp;$US par mois pour 1 à 5 athlètes
        ou 39&nbsp;$US jusqu&apos;à 100 (
        <a href={SOURCES.finalSurge}>tarifs Final Surge</a>). Applications
        natives, séances structurées envoyées vers Garmin et COROS. Le forfait
        fait tout l&apos;intérêt&nbsp;: 40 athlètes coûtent autant que 10. Peu
        présent en Europe, pas d&apos;interface en français à notre
        connaissance, et aucune fonction d&apos;IA trouvée, ce que certains
        coachs verront comme un avantage.
      </p>

      <h3>Tredict</h3>
      <p>
        Allemand, tenu par son fondateur, attentif à la vie privée, et le plus
        offensif sur le rachat par Garmin (
        <a href={SOURCES.tredictBlog}>son analyse</a>). Il envoie les séances
        vers Garmin, COROS, Suunto, Wahoo, Hammerhead et Zwift, et propose des
        fonctions coach et une API. Le modèle de prix sort de
        l&apos;ordinaire&nbsp;: 49&nbsp;$US une fois pour douze mois
        d&apos;accès complet, un accès en lecture seule gratuit ensuite, et deux
        mois d&apos;essai (<a href={SOURCES.tredictPrice}>tarifs Tredict</a>).
        Petite équipe, petite communauté, mais proche dans l&apos;esprit de ce
        que TrainingPeaks a longtemps été pour beaucoup.
      </p>

      <h3>Runalyze</h3>
      <p>
        Conçu à Kaiserslautern et Kiel, et apprécié des coureurs qui veulent de
        l&apos;analyse&nbsp;: VO2max effective, prédictions de chrono, indice de
        forme marathon, charge d&apos;entraînement. Il se synchronise avec
        Garmin, COROS, Suunto, Polar, Wahoo, Strava et d&apos;autres. Gratuit,
        avec un Premium à 60&nbsp;€ par an (
        <a href={SOURCES.runalyze}>tarifs Runalyze</a>). C&apos;est un carnet
        d&apos;entraînement et un outil d&apos;analyse plutôt qu&apos;une
        plateforme de planification ou de coaching&nbsp;: il convient au coureur
        autocoaché qui se servait surtout de TrainingPeaks pour regarder en
        arrière, pas au coach qui planifie pour d&apos;autres.
      </p>

      <h3>Golden Cheetah</h3>
      <p>
        Logiciel de bureau libre et gratuit pour Windows, macOS et Linux, pensé
        d&apos;abord pour le vélo, avec une analyse de puissance très poussée (
        <a href={SOURCES.goldenCheetah}>goldencheetah.org</a>). Pas de cloud,
        pas de travail à plusieurs avec un coach, pas d&apos;envoi de séances
        vers la montre. Il a sa place ici parce que personne ne pourra jamais
        l&apos;éteindre.
      </p>

      <h3>OpenAthlete</h3>
      <p>
        Le nôtre, jugez en conséquence. Il est open source (AGPL), gratuit à
        auto-héberger, ou hébergé par nos soins en France. Toutes les fonctions
        sont gratuites sur la version hébergée, coaching jusqu&apos;à 5 athlètes
        compris&nbsp;; la formule Supporter, à 5&nbsp;€ par mois ou 50&nbsp;€
        par an, ajoute les athlètes illimités et l&apos;IA sur nos clés (
        <Link href="/fr/pricing">tarifs</Link>). Les clubs ont un espace club
        gratuit, sans limite d&apos;athlètes&nbsp;: groupes avec leurs coachs,
        bibliothèque partagée, séances de club hebdomadaires et plans copiés à
        tout un groupe. Les séances programmées partent vers les montres Garmin,
        Suunto et COROS&nbsp;; les activités arrivent de ces trois marques, de
        Polar et de Strava. La charge d&apos;entraînement repose sur le TRIMP
        (fréquence cardiaque), avec le RPE de séance à côté, et la forme, la
        fatigue et la fraîcheur sont projetées sur les séances prévues.
        L&apos;IA est facultative et tourne sur votre propre clé ou sur le quota
        Supporter.
      </p>
      <p>
        Les limites sont réelles. Pas encore d&apos;applications natives dans
        les stores&nbsp;: les applis iOS et Android sont en test, et les
        athlètes utilisent en attendant l&apos;application web installable. Pas
        de marketplace pour vendre des plans, pas de facturation au club
        (l&apos;espace club est gratuit, mais les cotisations se gèrent en
        dehors d&apos;OpenAthlete), pas d&apos;application home trainer, pas
        d&apos;envoi de séances vers les montres Polar. L&apos;analyse est moins
        poussée qu&apos;intervals.icu, et le projet est jeune, développé par une
        seule personne. Notre réponse à «&nbsp;et si vous
        disparaissez&nbsp;?&nbsp;» tient dans la licence&nbsp;: le code et vos
        données restent utilisables sans nous. La comparaison détaillée est sur{' '}
        <Link href="/fr/compare/trainingpeaks">
          OpenAthlete vs TrainingPeaks
        </Link>
        , le fonctionnement du coaching sur{' '}
        <Link href="/fr/coaches">la page entraîneurs</Link>, et les autres
        comparatifs <Link href="/fr/compare">ici</Link>.
      </p>

      <h2>Changer sans perdre son historique</h2>

      <h3>Exportez d&apos;abord depuis TrainingPeaks</h3>
      <p>
        Le centre d&apos;aide de TrainingPeaks décrit une fonction Export Data
        dans l&apos;application web&nbsp;: vous choisissez une période de 12
        mois au plus et obtenez un dossier avec tous les fichiers
        d&apos;activité de cette période&nbsp;; le même outil peut produire un
        récapitulatif CSV des séances. Chaque séance peut aussi être téléchargée
        seule, dans le format d&apos;origine (
        <a href={SOURCES.tpExportHelp}>Data Export</a>
        ). Un <a href={SOURCES.tpExportBlog}>
          article du blog TrainingPeaks
        </a>{' '}
        réserve l&apos;export groupé aux abonnés Athlete Edition, et certains
        utilisateurs de forums disent qu&apos;il faut Premium&nbsp;: vérifiez ce
        qu&apos;affiche votre compte. Six ans d&apos;historique, c&apos;est six
        exports. Faites-le avant de résilier, pas après. Nous n&apos;avons
        trouvé aucun moyen documenté d&apos;exporter en bloc votre bibliothèque
        de séances ou votre plan à venir&nbsp;: prévoyez de recréer les modèles
        que vous réutilisez.
      </p>

      <h3>Reconnectez vos comptes de montre</h3>
      <p>
        La plupart des plateformes récupèrent les activités passées auprès de la
        marque de la montre dès la connexion, ce qui est plus simple que les
        fichiers. La profondeur dépend de l&apos;API de la marque plus que de la
        plateforme. Sur OpenAthlete, Strava et COROS donnent tout
        l&apos;historique (COROS envoie 50 fichiers par jour, un long historique
        met donc plusieurs jours à arriver), Garmin et Suunto les 30 derniers
        jours, et Polar rien d&apos;antérieur à la connexion. Les autres
        plateformes se heurtent aux mêmes limites pour les mêmes raisons&nbsp;:
        posez la question avant de compter sur un import complet.
      </p>

      <h3>Complétez avec les fichiers FIT</h3>
      <p>
        Ce que l&apos;API ne renvoie pas, votre dossier d&apos;export le
        contient. Importez les fichiers FIT sur la nouvelle plateforme&nbsp;;
        sur OpenAthlete, vous pouvez en déposer plusieurs à la fois sur le
        calendrier (20&nbsp;Mo par fichier). Les fichiers FIT multisports
        d&apos;un triathlon ne sont pas encore pris en charge.
      </p>

      <h3>Faites tourner les deux pendant un bloc</h3>
      <p>
        Si vous entraînez, gardez TrainingPeaks un bloc de plus pendant que vos
        athlètes se connectent à la nouvelle plateforme, planifiez-y les quatre
        semaines suivantes et regardez ce qui coince. Changer après une course
        objectif ou au début de la coupure est bien plus simple qu&apos;en plein
        bloc de préparation marathon.
      </p>
      <p>
        Et si vous ne deviez faire qu&apos;une chose ce mois-ci, faites
        l&apos;export.
      </p>
    </div>
  );
}
