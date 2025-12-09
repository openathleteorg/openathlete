import type { BlogPost } from './types';

export const articleSmartwatchIsntEnough: BlogPost = {
  metadata: {
    slug: 'why-your-smartwatch-isnt-enough',
    title: {
      en: "Why Your Smartwatch Isn't Enough",
      fr: 'Pourquoi Votre Montre Connectée ne Suffit Pas',
    },
    description: {
      en: 'Watches capture "What", not "Why". They don\'t know you\'re prepping for an Ultra. You need a software layer (OpenAthlete) to give context to raw watch data.',
      fr: 'Les montres capturent "Quoi", pas "Pourquoi". Elles ne savent pas que vous préparez un Ultra. Vous avez besoin d\'une couche logicielle (OpenAthlete) pour donner du contexte aux données brutes de la montre.',
    },
    excerpt: {
      en: "Your Garmin or Apple Watch tracks metrics but can't interpret them. Learn why you need software to analyze patterns, provide context, and guide training decisions.",
      fr: "Votre Garmin ou Apple Watch suit les métriques mais ne peut pas les interpréter. Découvrez pourquoi vous avez besoin d'un logiciel pour analyser les modèles, fournir du contexte et guider les décisions d'entraînement.",
    },
    author: {
      name: 'OpenAthlete Team',
      email: 'contact@openathlete.org',
    },
    publishedAt: '2025-03-15',
    tags: [
      'Garmin Coach Limits',
      'Strava Analysis',
      'Interpreting Sports Data',
      'Training Software',
    ],
    readingTime: 7,
    image:
      'https://images.unsplash.com/photo-1434494745656-1aea7daa8f6f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4NDE1NDF8MHwxfHNlYXJjaHwxfHxzbWFydHdhdGNoJTIwZml0bmVzcyUyMHRyYWNrZXIlMjBkYXRhJTIwYW5hbHlzaXMlMjBpbnRlcnByZXRhdGlvbnxlbnwwfDB8fHwxNzY1Mjg3MzgxfDA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  ContentEn: () => {
    return (
      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <p>
          <strong>
            Your Garmin shows you ran 10km at 4:30/km pace with an average heart
            rate of 165 bpm. Great data. But what does it mean? Should you run
            harder tomorrow? Easier? Rest? Your watch doesn't know—and it
            doesn't care.
          </strong>
        </p>

        <p>
          This is the fundamental limitation of smartwatches. They're excellent
          at capturing data—distance, pace, heart rate, power. But they're
          terrible at interpreting it. They can tell you <strong>what</strong>{' '}
          happened, but they can't tell you <strong>why</strong> it happened or{' '}
          <strong>what to do next</strong>.
        </p>

        <h2>The Data vs. Intelligence Gap</h2>
        <p>Your watch is a data collection device. It measures:</p>
        <ul>
          <li>Distance and pace</li>
          <li>Heart rate zones</li>
          <li>Power output</li>
          <li>Elevation and cadence</li>
          <li>GPS tracking</li>
        </ul>

        <p>But it doesn't know:</p>
        <ul>
          <li>What your training goals are</li>
          <li>How this session fits into your overall plan</li>
          <li>Whether you're progressing toward your goals</li>
          <li>If you're at risk of overtraining</li>
          <li>What you should do next</li>
        </ul>

        <p>
          Data without context is just numbers. Intelligence comes from
          analyzing patterns, understanding goals, and providing actionable
          insights.
        </p>

        <h2>The Context Problem</h2>
        <p>
          Consider this scenario: You run 10km at 4:30/km. Your watch records
          it. But:
        </p>
        <ul>
          <li>Is this part of a base-building phase or a taper?</li>
          <li>Are you preparing for a 5K or an ultramarathon?</li>
          <li>Is this your third hard session this week or your first?</li>
          <li>How does this compare to your fitness level 3 months ago?</li>
        </ul>

        <p>
          Your watch doesn't know any of this. It just records: "10km, 4:30/km,
          165 bpm." Without context, that data is meaningless for making
          training decisions.
        </p>

        <h2>The Pattern Recognition Gap</h2>
        <p>
          Your watch can show you individual sessions, but it can't recognize
          patterns:
        </p>
        <ul>
          <li>
            Are your easy runs getting faster at the same heart rate? (Fitness
            improvement)
          </li>
          <li>
            Is your RPE increasing for the same pace? (Fatigue accumulation)
          </li>
          <li>
            Are you consistently missing target paces? (Overtraining risk)
          </li>
          <li>Is your training load increasing too quickly? (Injury risk)</li>
        </ul>

        <p>
          These patterns require analysis across multiple sessions, weeks, and
          months. Your watch doesn't do this analysis—it just stores the data.
        </p>

        <h2>The Goal-Orientation Gap</h2>
        <p>Your watch doesn't know your goals. It doesn't know if you're:</p>
        <ul>
          <li>Training for a marathon (needs high volume)</li>
          <li>Training for a 5K (needs high intensity)</li>
          <li>Recovering from injury (needs careful progression)</li>
          <li>Building base fitness (needs consistency)</li>
        </ul>

        <p>
          Without understanding your goals, your watch can't guide your
          training. It can't tell you if you're on track, if you need to adjust,
          or if you're doing the right type of training.
        </p>

        <h2>The Software Layer Solution</h2>
        <p>
          This is where OpenAthlete comes in. Think of it as the intelligence
          layer above your watch:
        </p>

        <p>
          <strong>
            Your watch collects data → OpenAthlete analyzes it → You get
            insights
          </strong>
        </p>

        <p>OpenAthlete:</p>
        <ul>
          <li>
            <strong>Imports watch data automatically:</strong> No manual entry
          </li>
          <li>
            <strong>Analyzes patterns:</strong> Detects trends, improvements,
            risks
          </li>
          <li>
            <strong>Provides context:</strong> Links sessions to your goals and
            plan
          </li>
          <li>
            <strong>Generates insights:</strong> Tells you what the data means
          </li>
          <li>
            <strong>Suggests actions:</strong> Recommends what to do next
          </li>
        </ul>

        <h2>Real-World Example</h2>
        <p>Your watch shows: "10km tempo run, 4:15/km, 170 bpm average"</p>

        <p>
          <strong>What your watch tells you:</strong> You ran 10km at 4:15/km
          with heart rate 170 bpm.
        </p>

        <p>
          <strong>What OpenAthlete tells you:</strong>
        </p>
        <ul>
          <li>
            "This tempo run was 8 seconds/km faster than your tempo runs 6 weeks
            ago at the same heart rate—you're getting fitter."
          </li>
          <li>
            "Your RPE was 7/10, which is normal for tempo runs. No concerns."
          </li>
          <li>
            "This is your second hard session this week. Tomorrow should be an
            easy recovery run."
          </li>
          <li>
            "You're on track for your marathon goal. Keep this pace for tempo
            runs."
          </li>
        </ul>

        <p>
          See the difference? Your watch gives you data. OpenAthlete gives you
          intelligence.
        </p>

        <h2>The Strava Limitation</h2>
        <p>
          Many athletes use Strava for analysis. Strava is better than a watch
          alone—it shows trends, compares segments, tracks progress. But it
          still has limitations:
        </p>
        <ul>
          <li>
            <strong>No goal orientation:</strong> Doesn't know what you're
            training for
          </li>
          <li>
            <strong>No plan integration:</strong> Doesn't connect sessions to a
            training plan
          </li>
          <li>
            <strong>No RPE tracking:</strong> Can't capture internal load
          </li>
          <li>
            <strong>No injury prevention:</strong> Doesn't analyze load
            progression
          </li>
          <li>
            <strong>No recommendations:</strong> Shows what happened, not what
            to do next
          </li>
        </ul>

        <p>
          Strava is a social network with data. OpenAthlete is a training
          intelligence platform.
        </p>

        <h2>The Bottom Line</h2>
        <p>
          Your smartwatch is a powerful tool, but it's incomplete. It captures
          data brilliantly, but it can't interpret it. You need a software layer
          that:
        </p>
        <ul>
          <li>Understands your goals</li>
          <li>Analyzes patterns</li>
          <li>Provides context</li>
          <li>Generates insights</li>
          <li>Guides decisions</li>
        </ul>

        <p>
          Don't mistake data collection for training intelligence. Your watch
          tells you what happened. OpenAthlete tells you what it means and what
          to do about it.
        </p>

        <p>
          <strong>Stop guessing, start training with AI today.</strong>{' '}
          <a href="https://app.openathlete.org/auth/create-account">
            Sign up for OpenAthlete
          </a>{' '}
          and add the intelligence layer your watch is missing. Get context,
          insights, and guidance—not just data.
        </p>
      </div>
    );
  },
  ContentFr: () => {
    return (
      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <p>
          <strong>
            Votre Garmin montre que vous avez couru 10km à 4:30/km avec une
            fréquence cardiaque moyenne de 165 bpm. Excellentes données. Mais
            qu'est-ce que cela signifie ? Devriez-vous courir plus fort demain ?
            Plus facile ? Vous reposer ? Votre montre ne sait pas—et elle s'en
            fiche.
          </strong>
        </p>

        <p>
          C'est la limitation fondamentale des montres connectées. Elles
          excellent à capturer les données—distance, allure, fréquence
          cardiaque, puissance. Mais elles sont terribles pour les interpréter.
          Elles peuvent vous dire <strong>ce qui</strong> s'est passé, mais
          elles ne peuvent pas vous dire <strong>pourquoi</strong> cela s'est
          passé ou <strong>quoi faire ensuite</strong>.
        </p>

        <h2>L'Écart Données vs Intelligence</h2>
        <p>
          Votre montre est un appareil de collecte de données. Elle mesure :
        </p>
        <ul>
          <li>Distance et allure</li>
          <li>Zones de fréquence cardiaque</li>
          <li>Puissance de sortie</li>
          <li>Dénivelé et cadence</li>
          <li>Suivi GPS</li>
        </ul>

        <p>Mais elle ne sait pas :</p>
        <ul>
          <li>Quels sont vos objectifs d'entraînement</li>
          <li>Comment cette séance s'intègre dans votre plan global</li>
          <li>Si vous progressez vers vos objectifs</li>
          <li>Si vous êtes à risque de surentraînement</li>
          <li>Ce que vous devriez faire ensuite</li>
        </ul>

        <p>
          Les données sans contexte ne sont que des chiffres. L'intelligence
          vient de l'analyse des modèles, de la compréhension des objectifs et
          de la fourniture d'informations actionnables.
        </p>

        <h2>Le Problème de Contexte</h2>
        <p>
          Considérez ce scénario : Vous courez 10km à 4:30/km. Votre montre
          l'enregistre. Mais :
        </p>
        <ul>
          <li>
            Est-ce une partie d'une phase de construction de base ou d'affûtage
            ?
          </li>
          <li>Préparez-vous un 5K ou un ultramarathon ?</li>
          <li>
            Est-ce votre troisième séance dure cette semaine ou votre première ?
          </li>
          <li>
            Comment cela se compare-t-il à votre niveau de forme il y a 3 mois ?
          </li>
        </ul>

        <p>
          Votre montre ne sait rien de tout cela. Elle enregistre juste : "10km,
          4:30/km, 165 bpm." Sans contexte, ces données sont sans signification
          pour prendre des décisions d'entraînement.
        </p>

        <h2>L'Écart de Reconnaissance de Modèles</h2>
        <p>
          Votre montre peut vous montrer des séances individuelles, mais elle ne
          peut pas reconnaître les modèles :
        </p>
        <ul>
          <li>
            Vos sorties en endurance deviennent-elles plus rapides à la même
            fréquence cardiaque ? (Amélioration de la forme)
          </li>
          <li>
            Votre RPE augmente-t-il pour la même allure ? (Accumulation de
            fatigue)
          </li>
          <li>
            Manquez-vous constamment les allures cibles ? (Risque de
            surentraînement)
          </li>
          <li>
            Votre charge d'entraînement augmente-t-elle trop rapidement ?
            (Risque de blessure)
          </li>
        </ul>

        <p>
          Ces modèles nécessitent une analyse à travers plusieurs séances,
          semaines et mois. Votre montre ne fait pas cette analyse—elle stocke
          juste les données.
        </p>

        <h2>L'Écart d'Orientation Objectif</h2>
        <p>
          Votre montre ne connaît pas vos objectifs. Elle ne sait pas si vous :
        </p>
        <ul>
          <li>Vous entraînez pour un marathon (besoin de volume élevé)</li>
          <li>Vous entraînez pour un 5K (besoin d'intensité élevée)</li>
          <li>Récupérez d'une blessure (besoin de progression prudente)</li>
          <li>Construisez la forme de base (besoin de cohérence)</li>
        </ul>

        <p>
          Sans comprendre vos objectifs, votre montre ne peut pas guider votre
          entraînement. Elle ne peut pas vous dire si vous êtes sur la bonne
          voie, si vous devez ajuster, ou si vous faites le bon type
          d'entraînement.
        </p>

        <h2>La Solution de la Couche Logicielle</h2>
        <p>
          C'est là qu'OpenAthlete intervient. Pensez-y comme à la couche
          d'intelligence au-dessus de votre montre :
        </p>

        <p>
          <strong>
            Votre montre collecte les données → OpenAthlete les analyse → Vous
            obtenez des informations
          </strong>
        </p>

        <p>OpenAthlete :</p>
        <ul>
          <li>
            <strong>Importe les données de la montre automatiquement :</strong>{' '}
            Pas de saisie manuelle
          </li>
          <li>
            <strong>Analyse les modèles :</strong> Détecte les tendances,
            améliorations, risques
          </li>
          <li>
            <strong>Fournit du contexte :</strong> Lie les séances à vos
            objectifs et plan
          </li>
          <li>
            <strong>Génère des informations :</strong> Vous dit ce que
            signifient les données
          </li>
          <li>
            <strong>Suggère des actions :</strong> Recommande quoi faire ensuite
          </li>
        </ul>

        <h2>Exemple Concret</h2>
        <p>
          Votre montre montre : "Sortie au seuil 10km, 4:15/km, 170 bpm moyenne"
        </p>

        <p>
          <strong>Ce que votre montre vous dit :</strong> Vous avez couru 10km à
          4:15/km avec fréquence cardiaque 170 bpm.
        </p>

        <p>
          <strong>Ce qu'OpenAthlete vous dit :</strong>
        </p>
        <ul>
          <li>
            "Cette sortie au seuil était 8 secondes/km plus rapide que vos
            sorties au seuil il y a 6 semaines à la même fréquence
            cardiaque—vous devenez plus en forme."
          </li>
          <li>
            "Votre RPE était 7/10, ce qui est normal pour les sorties au seuil.
            Aucune préoccupation."
          </li>
          <li>
            "C'est votre deuxième séance dure cette semaine. Demain devrait être
            une sortie de récupération facile."
          </li>
          <li>
            "Vous êtes sur la bonne voie pour votre objectif marathon. Gardez
            cette allure pour les sorties au seuil."
          </li>
        </ul>

        <p>
          Voyez la différence ? Votre montre vous donne des données. OpenAthlete
          vous donne de l'intelligence.
        </p>

        <h2>La Limitation Strava</h2>
        <p>
          Beaucoup d'athlètes utilisent Strava pour l'analyse. Strava est
          meilleur qu'une montre seule—il montre les tendances, compare les
          segments, suit les progrès. Mais il a encore des limitations :
        </p>
        <ul>
          <li>
            <strong>Pas d'orientation objectif :</strong> Ne sait pas pour quoi
            vous vous entraînez
          </li>
          <li>
            <strong>Pas d'intégration de plan :</strong> Ne connecte pas les
            séances à un plan d'entraînement
          </li>
          <li>
            <strong>Pas de suivi RPE :</strong> Ne peut pas capturer la charge
            interne
          </li>
          <li>
            <strong>Pas de prévention des blessures :</strong> N'analyse pas la
            progression de charge
          </li>
          <li>
            <strong>Pas de recommandations :</strong> Montre ce qui s'est passé,
            pas quoi faire ensuite
          </li>
        </ul>

        <p>
          Strava est un réseau social avec des données. OpenAthlete est une
          plateforme d'intelligence d'entraînement.
        </p>

        <h2>En Résumé</h2>
        <p>
          Votre montre connectée est un outil puissant, mais elle est
          incomplète. Elle capture les données brillamment, mais elle ne peut
          pas les interpréter. Vous avez besoin d'une couche logicielle qui :
        </p>
        <ul>
          <li>Comprend vos objectifs</li>
          <li>Analyse les modèles</li>
          <li>Fournit du contexte</li>
          <li>Génère des informations</li>
          <li>Guide les décisions</li>
        </ul>

        <p>
          Ne confondez pas la collecte de données avec l'intelligence
          d'entraînement. Votre montre vous dit ce qui s'est passé. OpenAthlete
          vous dit ce que cela signifie et quoi faire à ce sujet.
        </p>

        <p>
          <strong>
            Arrêtez de deviner, commencez à vous entraîner avec l'IA dès
            aujourd'hui.
          </strong>{' '}
          <a href="https://app.openathlete.org/auth/create-account">
            Inscrivez-vous sur OpenAthlete
          </a>{' '}
          et ajoutez la couche d'intelligence que votre montre manque. Obtenez
          du contexte, des informations et des conseils—pas juste des données.
        </p>
      </div>
    );
  },
};
