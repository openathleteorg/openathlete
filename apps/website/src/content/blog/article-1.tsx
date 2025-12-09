import type { BlogPost } from './types';

export const article1: BlogPost = {
  metadata: {
    slug: 'introducing-openathlete',
    title: {
      en: 'Introducing OpenAthlete: AI-Powered Endurance Coaching',
      fr: "Présentation d'OpenAthlete : Coaching d'endurance assisté par IA",
    },
    description: {
      en: 'Discover how OpenAthlete revolutionizes endurance coaching with AI-powered planning, analysis, and fatigue prevention.',
      fr: "Découvrez comment OpenAthlete révolutionne le coaching d'endurance avec une planification, une analyse et une prévention de la fatigue assistées par IA.",
    },
    excerpt: {
      en: 'OpenAthlete combines cutting-edge AI technology with proven training methodologies to help coaches and athletes achieve better results while preventing injuries.',
      fr: "OpenAthlete combine une technologie IA de pointe avec des méthodologies d'entraînement éprouvées pour aider les coachs et les athlètes à obtenir de meilleurs résultats tout en prévenant les blessures.",
    },
    author: {
      name: 'OpenAthlete Team',
      email: 'contact@openathlete.org',
    },
    publishedAt: '2025-01-15',
    tags: ['AI', 'Coaching', 'Endurance', 'Training'],
    readingTime: 5,
    image:
      'https://images.unsplash.com/photo-1614155128617-b563db770a55?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4NDE1NDF8MHwxfHNlYXJjaHwxfHxlbmR1cmFuY2UlMjBhdGhsZXRlJTIwcnVubmluZyUyMHRyYWluaW5nJTIwQUklMjBjb2FjaGluZyUyMHBsYXRmb3JtJTIwdGVjaG5vbG9neXxlbnwwfDB8fHwxNzY1Mjg3NDU2fDA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  ContentEn: () => {
    return (
      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <p>
          Welcome to OpenAthlete, the next-generation platform for endurance
          coaching. We're excited to introduce a solution that combines
          artificial intelligence with proven training methodologies to help
          coaches and athletes achieve their goals more efficiently.
        </p>

        <h2>The Challenge</h2>
        <p>
          Endurance training is complex. Every day brings new variables: sleep
          quality, stress levels, work commitments, weather conditions, and
          recovery status. Traditional training plans often remain static,
          leading to suboptimal adaptations and increased injury risk.
        </p>

        <h2>Our Solution</h2>
        <p>
          OpenAthlete leverages AI to analyze these variables in real-time,
          providing coaches and athletes with:
        </p>
        <ul>
          <li>
            <strong>Intelligent Planning:</strong> AI suggests training sessions
            adapted to the athlete's current load, goals, and recovery status.
          </li>
          <li>
            <strong>Automatic Analysis:</strong> Each completed session is
            analyzed for intensity, consistency, and alignment with training
            objectives.
          </li>
          <li>
            <strong>Fatigue Prevention:</strong> Early detection of overload
            signals helps prevent injuries and overreaching before they occur.
          </li>
        </ul>

        <h2>Built for Coaches and Athletes</h2>
        <p>
          Whether you're a professional coach managing multiple athletes or an
          athlete training independently, OpenAthlete adapts to your needs. Our
          platform saves coaches up to 50% of their planning time while
          improving training quality and athlete satisfaction.
        </p>

        <h2>What's Next</h2>
        <p>
          We're currently in beta and working with select coaches and athletes
          to refine our platform. If you're interested in joining our beta
          program,{' '}
          <a href="https://app.openathlete.org/auth/create-account">sign up</a>{' '}
          and help shape the future of endurance coaching.
        </p>
      </div>
    );
  },
  ContentFr: () => {
    return (
      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <p>
          Bienvenue sur OpenAthlete, la plateforme nouvelle génération pour le
          coaching d'endurance. Nous sommes ravis de présenter une solution qui
          combine l'intelligence artificielle avec des méthodologies
          d'entraînement éprouvées pour aider les coachs et les athlètes à
          atteindre leurs objectifs plus efficacement.
        </p>

        <h2>Le Défi</h2>
        <p>
          L'entraînement d'endurance est complexe. Chaque jour apporte de
          nouvelles variables : qualité du sommeil, niveaux de stress,
          engagements professionnels, conditions météorologiques et statut de
          récupération. Les plans d'entraînement traditionnels restent souvent
          statiques, ce qui conduit à des adaptations sous-optimales et à un
          risque accru de blessures.
        </p>

        <h2>Notre Solution</h2>
        <p>
          OpenAthlete utilise l'IA pour analyser ces variables en temps réel,
          offrant aux coachs et aux athlètes :
        </p>
        <ul>
          <li>
            <strong>Planification Intelligente :</strong> L'IA suggère des
            séances d'entraînement adaptées à la charge actuelle de l'athlète, à
            ses objectifs et à son statut de récupération.
          </li>
          <li>
            <strong>Analyse Automatique :</strong> Chaque séance terminée est
            analysée pour l'intensité, la cohérence et l'alignement avec les
            objectifs d'entraînement.
          </li>
          <li>
            <strong>Prévention de la Fatigue :</strong> La détection précoce des
            signaux de surcharge aide à prévenir les blessures et le
            surentraînement avant qu'ils ne surviennent.
          </li>
        </ul>

        <h2>Conçu pour les Coachs et les Athlètes</h2>
        <p>
          Que vous soyez un coach professionnel gérant plusieurs athlètes ou un
          athlète s'entraînant indépendamment, OpenAthlete s'adapte à vos
          besoins. Notre plateforme fait économiser jusqu'à 50% du temps de
          planification aux coachs tout en améliorant la qualité de
          l'entraînement et la satisfaction des athlètes.
        </p>

        <h2>Et Maintenant ?</h2>
        <p>
          Nous sommes actuellement en phase bêta et travaillons avec des coachs
          et des athlètes sélectionnés pour affiner notre plateforme. Si vous
          êtes intéressé à rejoindre notre programme bêta,{' '}
          <a href="https://app.openathlete.org/auth/create-account">
            inscrivez-vous
          </a>{' '}
          et aidez à façonner l'avenir du coaching d'endurance.
        </p>
      </div>
    );
  },
};
