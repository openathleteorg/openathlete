import type { BlogPost } from './types';

export const articleCognitiveLoad: BlogPost = {
  metadata: {
    slug: 'understanding-cognitive-load-in-endurance-sports',
    title: {
      en: 'Understanding Cognitive Load in Endurance Sports',
      fr: "Comprendre la Charge Cognitive dans les Sports d'Endurance",
    },
    description: {
      en: 'Brain/Legs link. How mental fatigue affects performance. How the app notes mental RPE to adapt future sessions.',
      fr: "Lien Cerveau/Jambes. Comment la fatigue mentale affecte les performances. Comment l'app note le RPE mental pour adapter les séances futures.",
    },
    excerpt: {
      en: 'Mental fatigue directly impacts physical performance. Learn how cognitive load affects endurance and how RPE tracking helps adapt training.',
      fr: "La fatigue mentale impacte directement les performances physiques. Découvrez comment la charge cognitive affecte l'endurance et comment le suivi RPE aide à adapter l'entraînement.",
    },
    author: {
      name: 'OpenAthlete Team',
      email: 'contact@openathlete.org',
    },
    publishedAt: '2025-05-01',
    tags: [
      'Mental Fatigue Ultra Trail',
      'Psychology of Endurance',
      'Cognitive Load',
      'Mental Training',
    ],
    readingTime: 7,
    image:
      'https://images.unsplash.com/photo-1761637755331-562c6529ace6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4NDE1NDF8MHwxfHNlYXJjaHwxfHxicmFpbiUyMG1pbmQlMjBtZW50YWwlMjBmb2N1cyUyMGNvbmNlbnRyYXRpb24lMjBjb2duaXRpdmUlMjBwZXJmb3JtYW5jZXxlbnwwfDB8fHwxNzY1Mjg3Mzc5fDA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  ContentEn: () => {
    return (
      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <p>
          <strong>
            You're running an ultramarathon. Your legs feel fine. Your heart
            rate is normal. But your brain is exhausted. Every step feels harder
            than it should. You're not physically tired—you're cognitively
            fatigued.
          </strong>
        </p>

        <p>
          This is cognitive load in endurance sports. Mental fatigue doesn't
          just affect your mood—it directly impacts your physical performance.
          Understanding this connection is crucial for optimizing training and
          performance.
        </p>

        <h2>The Brain-Muscle Connection</h2>
        <p>
          Your central nervous system controls muscle activation. When you're
          mentally fatigued:
        </p>
        <ul>
          <li>Neural drive to muscles decreases</li>
          <li>Perceived effort increases</li>
          <li>Pacing becomes impaired</li>
          <li>Time to exhaustion decreases</li>
        </ul>

        <p>
          Research shows mental fatigue can reduce endurance performance by
          15-20% at the same physiological intensity.
        </p>

        <h2>Sources of Cognitive Load</h2>
        <p>Cognitive load comes from:</p>
        <ul>
          <li>Work stress and decision-making</li>
          <li>Information overload</li>
          <li>Emotional stress</li>
          <li>Sleep deprivation</li>
          <li>Previous mental exertion</li>
        </ul>

        <h2>Tracking Cognitive Load</h2>
        <p>
          RPE captures cognitive load. When your RPE is elevated relative to
          pace and heart rate, that's often cognitive fatigue, not physical
          fatigue.
        </p>

        <p>
          OpenAthlete tracks this pattern and adapts training
          accordingly—reducing intensity when cognitive load is high, allowing
          recovery when needed.
        </p>

        <h2>The Bottom Line</h2>
        <p>
          Cognitive load matters. Mental fatigue impacts performance. RPE
          tracking helps detect it. AI helps adapt training to account for it.
        </p>

        <p>
          <strong>Stop guessing, start training with AI today.</strong>{' '}
          <a href="https://app.openathlete.org/auth/create-account">
            Sign up for OpenAthlete
          </a>{' '}
          and let AI track cognitive load and adapt your training accordingly.
        </p>
      </div>
    );
  },
  ContentFr: () => {
    return (
      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <p>
          <strong>
            Vous courez un ultramarathon. Vos jambes se sentent bien. Votre
            fréquence cardiaque est normale. Mais votre cerveau est épuisé.
            Chaque pas semble plus dur qu'il ne devrait. Vous n'êtes pas
            physiquement fatigué—vous êtes cognitivement fatigué.
          </strong>
        </p>

        <p>
          C'est la charge cognitive dans les sports d'endurance. La fatigue
          mentale n'affecte pas seulement votre humeur—elle impacte directement
          vos performances physiques. Comprendre cette connexion est crucial
          pour optimiser l'entraînement et les performances.
        </p>

        <h2>La Connexion Cerveau-Muscle</h2>
        <p>
          Votre système nerveux central contrôle l'activation musculaire. Quand
          vous êtes mentalement fatigué :
        </p>
        <ul>
          <li>La commande neurale aux muscles diminue</li>
          <li>L'effort perçu augmente</li>
          <li>Le rythme devient altéré</li>
          <li>Le temps jusqu'à épuisement diminue</li>
        </ul>

        <p>
          La recherche montre que la fatigue mentale peut réduire les
          performances d'endurance de 15-20% à la même intensité physiologique.
        </p>

        <h2>Sources de Charge Cognitive</h2>
        <p>La charge cognitive vient de :</p>
        <ul>
          <li>Stress au travail et prise de décision</li>
          <li>Surcharge d'information</li>
          <li>Stress émotionnel</li>
          <li>Privation de sommeil</li>
          <li>Effort mental précédent</li>
        </ul>

        <h2>Suivi de la Charge Cognitive</h2>
        <p>
          Le RPE capture la charge cognitive. Quand votre RPE est élevé par
          rapport à l'allure et la fréquence cardiaque, c'est souvent de la
          fatigue cognitive, pas de la fatigue physique.
        </p>

        <p>
          OpenAthlete suit ce modèle et adapte l'entraînement en
          conséquence—réduisant l'intensité quand la charge cognitive est
          élevée, permettant la récupération quand nécessaire.
        </p>

        <h2>En Résumé</h2>
        <p>
          La charge cognitive compte. La fatigue mentale impacte les
          performances. Le suivi RPE aide à la détecter. L'IA aide à adapter
          l'entraînement pour en tenir compte.
        </p>

        <p>
          <strong>
            Arrêtez de deviner, commencez à vous entraîner avec l'IA dès
            aujourd'hui.
          </strong>{' '}
          <a href="https://app.openathlete.org/auth/create-account">
            Inscrivez-vous sur OpenAthlete
          </a>{' '}
          et laissez l'IA suivre la charge cognitive et adapter votre
          entraînement en conséquence.
        </p>
      </div>
    );
  },
};
