import type { BlogPost } from './types';

export const articleTrimp: BlogPost = {
  metadata: {
    slug: 'what-is-trimp-and-how-to-use-it',
    title: {
      en: 'What is TRIMP and How to Use It?',
      fr: "Qu'est-ce que le TRIMP et Comment l'Utiliser ?",
    },
    description: {
      en: "Technical definition of TRIMP (Training Impulse). Explain it's good but cardio-only. Show how our algorithm goes further.",
      fr: "Définition technique du TRIMP (Training Impulse). Expliquez qu'il est bon mais cardio-seulement. Montrez comment notre algorithme va plus loin.",
    },
    excerpt: {
      en: "TRIMP calculates training load based on heart rate and duration. It's useful but limited to cardiovascular stress. Learn how OpenAthlete's algorithm incorporates more factors.",
      fr: "Le TRIMP calcule la charge d'entraînement basée sur la fréquence cardiaque et la durée. C'est utile mais limité au stress cardiovasculaire. Découvrez comment l'algorithme d'OpenAthlete intègre plus de facteurs.",
    },
    author: {
      name: 'OpenAthlete Team',
      email: 'contact@openathlete.org',
    },
    publishedAt: '2025-04-20',
    tags: [
      'TRIMP Calculation',
      'Training Impulse',
      'Bannister Load',
      'Training Load Metrics',
    ],
    readingTime: 7,
    image:
      'https://images.unsplash.com/photo-1669399213378-2853e748f217?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4NDE1NDF8MHwxfHNlYXJjaHwxfHx0cmFpbmluZyUyMG1ldHJpY3MlMjBkYXRhJTIwYW5hbHlzaXMlMjBjaGFydHMlMjBncmFwaHMlMjBwZXJmb3JtYW5jZXxlbnwwfDB8fHwxNzY1Mjg3MzgwfDA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  ContentEn: () => {
    return (
      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <p>
          <strong>
            TRIMP (Training Impulse) is a metric that quantifies training load.
            It's been used for decades to measure cardiovascular stress. But is
            it enough?
          </strong>
        </p>

        <p>
          This article explains what TRIMP is, how it works, its limitations,
          and how OpenAthlete's algorithm goes beyond TRIMP to provide a more
          comprehensive training load assessment.
        </p>

        <h2>What is TRIMP?</h2>
        <p>
          TRIMP (Training Impulse) was developed by Dr. Eric Bannister in the
          1970s. It calculates training load using:
        </p>
        <ul>
          <li>Exercise duration (minutes)</li>
          <li>Average heart rate</li>
          <li>Heart rate reserve (difference between max and resting HR)</li>
        </ul>

        <p>
          Formula: TRIMP = Duration × Average HR × Heart Rate Reserve Factor
        </p>

        <p>
          The result is a single number representing cardiovascular training
          stress.
        </p>

        <h2>TRIMP's Strengths</h2>
        <p>TRIMP is valuable because it:</p>
        <ul>
          <li>Quantifies training load objectively</li>
          <li>Accounts for individual heart rate zones</li>
          <li>Provides a single metric for comparison</li>
          <li>Has decades of research validation</li>
        </ul>

        <h2>TRIMP's Limitations</h2>
        <p>However, TRIMP has significant limitations:</p>
        <ul>
          <li>
            <strong>Cardiovascular only:</strong> Doesn't account for muscular
            stress
          </li>
          <li>
            <strong>No RPE:</strong> Ignores internal load (how you felt)
          </li>
          <li>
            <strong>No environmental factors:</strong> Doesn't consider heat,
            altitude, etc.
          </li>
          <li>
            <strong>No recovery status:</strong> Same TRIMP feels different when
            fatigued vs fresh
          </li>
          <li>
            <strong>No injury risk:</strong> Doesn't detect load spikes that
            cause injuries
          </li>
        </ul>

        <h2>Beyond TRIMP: OpenAthlete's Approach</h2>
        <p>OpenAthlete's algorithm incorporates TRIMP but goes further:</p>
        <ul>
          <li>
            <strong>TRIMP (cardiovascular load)</strong>
          </li>
          <li>
            <strong>RPE (internal load)</strong>
          </li>
          <li>
            <strong>ACWR (load progression)</strong>
          </li>
          <li>
            <strong>Recovery markers (sleep, stress)</strong>
          </li>
          <li>
            <strong>Environmental factors</strong>
          </li>
          <li>
            <strong>Injury risk detection</strong>
          </li>
        </ul>

        <p>
          This comprehensive approach provides a more accurate picture of
          training stress and adaptation.
        </p>

        <h2>The Bottom Line</h2>
        <p>
          TRIMP is a useful metric, but it's incomplete. OpenAthlete uses TRIMP
          as one component of a comprehensive training load analysis that
          includes RPE, ACWR, recovery, and injury prevention.
        </p>

        <p>
          <strong>Stop guessing, start training with AI today.</strong>{' '}
          <a href="https://app.openathlete.org/auth/create-account">
            Sign up for OpenAthlete
          </a>{' '}
          and get training load analysis that goes beyond TRIMP.
        </p>
      </div>
    );
  },
  ContentFr: () => {
    return (
      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <p>
          <strong>
            Le TRIMP (Training Impulse) est une métrique qui quantifie la charge
            d'entraînement. Il est utilisé depuis des décennies pour mesurer le
            stress cardiovasculaire. Mais est-ce suffisant ?
          </strong>
        </p>

        <p>
          Cet article explique ce qu'est le TRIMP, comment il fonctionne, ses
          limitations et comment l'algorithme d'OpenAthlete va au-delà du TRIMP
          pour fournir une évaluation plus complète de la charge d'entraînement.
        </p>

        <h2>Qu'est-ce que le TRIMP ?</h2>
        <p>
          Le TRIMP (Training Impulse) a été développé par le Dr Eric Bannister
          dans les années 1970. Il calcule la charge d'entraînement en utilisant
          :
        </p>
        <ul>
          <li>Durée d'exercice (minutes)</li>
          <li>Fréquence cardiaque moyenne</li>
          <li>
            Réserve de fréquence cardiaque (différence entre max et repos FC)
          </li>
        </ul>

        <p>Formule : TRIMP = Durée × FC Moyenne × Facteur de Réserve FC</p>

        <p>
          Le résultat est un seul nombre représentant le stress d'entraînement
          cardiovasculaire.
        </p>

        <h2>Forces du TRIMP</h2>
        <p>Le TRIMP est précieux parce qu'il :</p>
        <ul>
          <li>Quantifie la charge d'entraînement objectivement</li>
          <li>
            Prend en compte les zones de fréquence cardiaque individuelles
          </li>
          <li>Fournit une métrique unique pour comparaison</li>
          <li>A des décennies de validation de recherche</li>
        </ul>

        <h2>Limitations du TRIMP</h2>
        <p>Cependant, le TRIMP a des limitations significatives :</p>
        <ul>
          <li>
            <strong>Cardiovasculaire seulement :</strong> Ne tient pas compte du
            stress musculaire
          </li>
          <li>
            <strong>Pas de RPE :</strong> Ignore la charge interne (comment vous
            vous êtes senti)
          </li>
          <li>
            <strong>Pas de facteurs environnementaux :</strong> Ne considère pas
            la chaleur, l'altitude, etc.
          </li>
          <li>
            <strong>Pas de statut de récupération :</strong> Le même TRIMP se
            sent différent quand fatigué vs frais
          </li>
          <li>
            <strong>Pas de risque de blessure :</strong> Ne détecte pas les pics
            de charge qui causent des blessures
          </li>
        </ul>

        <h2>Au-Delà du TRIMP : L'Approche OpenAthlete</h2>
        <p>L'algorithme d'OpenAthlete intègre le TRIMP mais va plus loin :</p>
        <ul>
          <li>
            <strong>TRIMP (charge cardiovasculaire)</strong>
          </li>
          <li>
            <strong>RPE (charge interne)</strong>
          </li>
          <li>
            <strong>ACWR (progression de charge)</strong>
          </li>
          <li>
            <strong>Marqueurs de récupération (sommeil, stress)</strong>
          </li>
          <li>
            <strong>Facteurs environnementaux</strong>
          </li>
          <li>
            <strong>Détection de risque de blessure</strong>
          </li>
        </ul>

        <p>
          Cette approche complète fournit une image plus précise du stress
          d'entraînement et de l'adaptation.
        </p>

        <h2>En Résumé</h2>
        <p>
          Le TRIMP est une métrique utile, mais elle est incomplète. OpenAthlete
          utilise le TRIMP comme un composant d'une analyse complète de charge
          d'entraînement qui inclut RPE, ACWR, récupération et prévention des
          blessures.
        </p>

        <p>
          <strong>
            Arrêtez de deviner, commencez à vous entraîner avec l'IA dès
            aujourd'hui.
          </strong>{' '}
          <a href="https://app.openathlete.org/auth/create-account">
            Inscrivez-vous sur OpenAthlete
          </a>{' '}
          et obtenez une analyse de charge d'entraînement qui va au-delà du
          TRIMP.
        </p>
      </div>
    );
  },
};
