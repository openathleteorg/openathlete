import type { BlogPost } from './types';

export const articleCognitiveLoad: BlogPost = {
  metadata: {
    slug: 'understanding-cognitive-load-in-endurance-sports',
    title: {
      en: 'Understanding Cognitive Load in Endurance Sports',
      fr: "Comprendre la Charge Cognitive dans les Sports d'Endurance",
      es: 'Entender la carga cognitiva en los deportes de resistencia',
    },
    description: {
      en: 'How mental fatigue makes the same pace feel harder, where cognitive load comes from, and how RPE helps you spot it and adjust training.',
      fr: "Comment la fatigue mentale rend la même allure plus dure, d'où vient la charge cognitive et comment le RPE vous aide à la repérer pour ajuster.",
      es: 'Cómo la fatiga mental hace que el mismo ritmo cueste más, de dónde viene la carga cognitiva y cómo el RPE te ayuda a detectarla y ajustar.',
    },
    excerpt: {
      en: 'Mental fatigue directly impacts physical performance. Learn how cognitive load affects endurance and how RPE tracking helps adapt training.',
      fr: "La fatigue mentale impacte directement les performances physiques. Découvrez comment la charge cognitive affecte l'endurance et comment le suivi RPE aide à adapter l'entraînement.",
      es: 'La fatiga mental repercute directamente en el rendimiento físico. Descubre cómo la carga cognitiva afecta a la resistencia y cómo el seguimiento del RPE ayuda a adaptar el entrenamiento.',
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
      <div>
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
          In OpenAthlete, a few questions after each activity ask about feeling,
          fatigue and sleep, and the RPE is filled in from the answers. You or
          your coach see it next to pace and heart rate, and can lighten the
          next sessions when cognitive load is high.
        </p>

        <h2>The Bottom Line</h2>
        <p>
          Cognitive load matters. Mental fatigue impacts performance. RPE
          tracking helps detect it. Adjusting the plan accounts for it.
        </p>

        <p>
          <strong>Stop guessing, start training with AI today.</strong>{' '}
          <a href="https://app.openathlete.org/auth/create-account">
            Sign up for OpenAthlete
          </a>{' '}
          and log your RPE and feeling after every session, so you can adapt
          your training.
        </p>
      </div>
    );
  },
  ContentFr: () => {
    return (
      <div>
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
          Dans OpenAthlete, quelques questions après chaque activité portent sur
          les sensations, la fatigue et le sommeil, et le RPE est déduit des
          réponses. Vous ou votre coach le voyez à côté de l'allure et de la
          fréquence cardiaque, et pouvez alléger les séances suivantes quand la
          charge cognitive est forte.
        </p>

        <h2>En Résumé</h2>
        <p>
          La charge cognitive compte. La fatigue mentale impacte les
          performances. Le suivi RPE aide à la détecter. Ajuster le plan permet
          d'en tenir compte.
        </p>

        <p>
          <strong>
            Arrêtez de deviner, commencez à vous entraîner avec l'IA dès
            aujourd'hui.
          </strong>{' '}
          <a href="https://app.openathlete.org/auth/create-account">
            Inscrivez-vous sur OpenAthlete
          </a>{' '}
          et notez votre RPE et vos sensations après chaque séance pour adapter
          votre entraînement.
        </p>
      </div>
    );
  },
  ContentEs: () => {
    return (
      <div>
        <p>
          <strong>
            Estás corriendo un ultramaratón. Las piernas responden. Tu
            frecuencia cardíaca es normal. Pero tu cerebro está agotado. Cada
            paso te cuesta más de lo que debería. No estás cansado físicamente:
            sufres fatiga cognitiva.
          </strong>
        </p>

        <p>
          Esto es la carga cognitiva en los deportes de resistencia. La fatiga
          mental no solo afecta a tu estado de ánimo: repercute directamente en
          tu rendimiento físico. Entender esta conexión es clave para optimizar
          el entrenamiento y el rendimiento.
        </p>

        <h2>La conexión entre cerebro y músculos</h2>
        <p>
          Tu sistema nervioso central controla la activación muscular. Cuando
          estás mentalmente fatigado:
        </p>
        <ul>
          <li>Disminuye el impulso nervioso hacia los músculos</li>
          <li>Aumenta el esfuerzo percibido</li>
          <li>Te cuesta más regular el ritmo</li>
          <li>Disminuye el tiempo hasta el agotamiento</li>
        </ul>

        <p>
          Las investigaciones muestran que la fatiga mental puede reducir el
          rendimiento en resistencia entre un 15 y un 20 % a la misma intensidad
          fisiológica.
        </p>

        <h2>Fuentes de carga cognitiva</h2>
        <p>La carga cognitiva procede de:</p>
        <ul>
          <li>El estrés laboral y la toma de decisiones</li>
          <li>La sobrecarga de información</li>
          <li>El estrés emocional</li>
          <li>La falta de sueño</li>
          <li>Un esfuerzo mental previo</li>
        </ul>

        <h2>Medir la carga cognitiva</h2>
        <p>
          El RPE refleja la carga cognitiva. Cuando tu RPE es alto en relación
          con tu ritmo y tu frecuencia cardíaca, a menudo se trata de fatiga
          cognitiva, no física.
        </p>

        <p>
          En OpenAthlete, unas pocas preguntas después de cada actividad tratan
          sobre las sensaciones, la fatiga y el sueño, y el RPE se deduce de las
          respuestas. Tú o tu entrenador lo veis junto al ritmo y la frecuencia
          cardíaca, y podéis aligerar las siguientes sesiones cuando la carga
          cognitiva es alta.
        </p>

        <h2>En resumen</h2>
        <p>
          La carga cognitiva importa. La fatiga mental afecta al rendimiento. El
          seguimiento del RPE ayuda a detectarla. Ajustar el plan permite
          tenerla en cuenta.
        </p>

        <p>
          <strong>Deja de adivinar y empieza hoy a entrenar con IA.</strong>{' '}
          <a href="https://app.openathlete.org/auth/create-account">
            Regístrate en OpenAthlete
          </a>{' '}
          y registra tu RPE y tus sensaciones después de cada sesión para
          adaptar tu entrenamiento.
        </p>
      </div>
    );
  },
};
