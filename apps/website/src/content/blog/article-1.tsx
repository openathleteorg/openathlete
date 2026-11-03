import type { BlogPost } from './types';

export const article1: BlogPost = {
  metadata: {
    slug: 'introducing-openathlete',
    title: {
      en: 'Introducing OpenAthlete: Endurance Coaching with AI',
      fr: "Présentation d'OpenAthlete : Coaching d'endurance assisté par IA",
      es: 'Te presentamos OpenAthlete: entrenamiento de resistencia asistido por IA',
    },
    description: {
      en: 'What OpenAthlete is: a free, open-source platform to plan training, sync your watch, analyse sessions and coach athletes, with optional AI.',
      fr: "Ce qu'est OpenAthlete : une plateforme libre et gratuite pour planifier, synchroniser votre montre, analyser vos séances et coacher, IA en option.",
      es: 'Qué es OpenAthlete: una plataforma libre y gratuita para planificar, sincronizar tu reloj, analizar sesiones y entrenar a atletas, con IA opcional.',
    },
    excerpt: {
      en: 'OpenAthlete combines AI with proven training methods to help coaches and athletes plan better and spot warning signs such as pain early.',
      fr: "OpenAthlete associe l'IA à des méthodes d'entraînement éprouvées pour aider coachs et athlètes à mieux planifier et à repérer tôt les signaux d'alerte, comme la douleur.",
      es: 'OpenAthlete combina la IA con métodos de entrenamiento probados para ayudar a entrenadores y atletas a planificar mejor y detectar pronto señales de alerta como el dolor.',
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
      <div>
        <p>
          Welcome to OpenAthlete, an open-source platform for endurance
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
          OpenAthlete brings your watch data, your plan and your feedback
          together, with AI where it helps, providing coaches and athletes with:
        </p>
        <ul>
          <li>
            <strong>Intelligent Planning:</strong> AI turns a sentence into a
            structured session built on the athlete's zones and latest metrics,
            and fitness, fatigue and form are projected over the planned weeks.
          </li>
          <li>
            <strong>Automatic Analysis:</strong> Each completed session is
            analyzed for intensity, consistency, and alignment with training
            objectives.
          </li>
          <li>
            <strong>Early Warnings:</strong> After each activity, a few short
            questions record effort and pain; reported pain goes into an injury
            log and shows up in the coach's alerts.
          </li>
        </ul>

        <h2>Built for Coaches and Athletes</h2>
        <p>
          OpenAthlete works for a coach managing several athletes and for an
          athlete training alone. Coaches plan on each athlete's calendar, reuse
          templates and move or copy whole weeks, and every feature is free.
        </p>

        <h2>What's Next</h2>
        <p>
          OpenAthlete is open source and built in the open with the coaches and
          athletes who use it. If you'd like to try it,{' '}
          <a href="https://app.openathlete.org/auth/create-account">sign up</a>{' '}
          and help shape the future of endurance coaching.
        </p>
      </div>
    );
  },
  ContentFr: () => {
    return (
      <div>
        <p>
          Bienvenue sur OpenAthlete, une plateforme open source pour le coaching
          d'endurance. Nous sommes ravis de présenter une solution qui combine
          l'intelligence artificielle avec des méthodologies d'entraînement
          éprouvées pour aider les coachs et les athlètes à atteindre leurs
          objectifs plus efficacement.
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
          OpenAthlete réunit les données de votre montre, votre plan et vos
          ressentis, avec de l'IA là où elle est utile, et offre aux coachs et
          aux athlètes :
        </p>
        <ul>
          <li>
            <strong>Planification Intelligente :</strong> L'IA transforme une
            phrase en séance structurée à partir des zones et des dernières
            métriques de l'athlète, et la forme est projetée sur les semaines
            planifiées.
          </li>
          <li>
            <strong>Analyse Automatique :</strong> Chaque séance terminée est
            analysée pour l'intensité, la cohérence et l'alignement avec les
            objectifs d'entraînement.
          </li>
          <li>
            <strong>Signaux d'Alerte :</strong> Après chaque activité, quelques
            questions courtes relèvent l'effort et les douleurs ; une douleur
            signalée entre dans le suivi des blessures et remonte dans les
            alertes du coach.
          </li>
        </ul>

        <h2>Conçu pour les Coachs et les Athlètes</h2>
        <p>
          OpenAthlete sert aussi bien le coach qui suit plusieurs athlètes que
          l'athlète qui s'entraîne seul. Le coach planifie dans le calendrier de
          chaque athlète, réutilise ses modèles et déplace ou copie des semaines
          entières, et toutes les fonctionnalités sont gratuites.
        </p>

        <h2>Et Maintenant ?</h2>
        <p>
          OpenAthlete est open source et se construit avec les coachs et les
          athlètes qui l'utilisent. Si vous souhaitez l'essayer,{' '}
          <a href="https://app.openathlete.org/auth/create-account">
            inscrivez-vous
          </a>{' '}
          et aidez à façonner l'avenir du coaching d'endurance.
        </p>
      </div>
    );
  },
  ContentEs: () => {
    return (
      <div>
        <p>
          Te damos la bienvenida a OpenAthlete, una plataforma de código abierto
          para el entrenamiento de resistencia. Nos hace mucha ilusión
          presentarte una solución que combina la inteligencia artificial con
          metodologías de entrenamiento probadas para ayudar a entrenadores y
          atletas a alcanzar sus objetivos de forma más eficiente.
        </p>

        <h2>El reto</h2>
        <p>
          El entrenamiento de resistencia es complejo. Cada día trae nuevas
          variables: la calidad del sueño, el nivel de estrés, las obligaciones
          laborales, la meteorología y el estado de recuperación. Los planes de
          entrenamiento tradicionales suelen ser estáticos, lo que lleva a
          adaptaciones poco óptimas y a un mayor riesgo de lesión.
        </p>

        <h2>Nuestra solución</h2>
        <p>
          OpenAthlete reúne los datos de tu reloj, tu plan y tus sensaciones,
          con IA donde aporta algo, y ofrece a entrenadores y atletas:
        </p>
        <ul>
          <li>
            <strong>Planificación inteligente:</strong> la IA convierte una
            frase en una sesión estructurada a partir de las zonas y las últimas
            métricas del atleta, y la forma se proyecta sobre las semanas
            planificadas.
          </li>
          <li>
            <strong>Análisis automático:</strong> cada sesión completada se
            analiza en cuanto a intensidad, regularidad y coherencia con los
            objetivos de entrenamiento.
          </li>
          <li>
            <strong>Señales de alerta:</strong> después de cada actividad, unas
            pocas preguntas registran el esfuerzo y el dolor; el dolor indicado
            pasa a un registro de lesiones y aparece en las alertas del
            entrenador.
          </li>
        </ul>

        <h2>Pensada para entrenadores y atletas</h2>
        <p>
          OpenAthlete sirve tanto al entrenador que lleva a varios atletas como
          al atleta que entrena por su cuenta. El entrenador planifica en el
          calendario de cada atleta, reutiliza plantillas y mueve o copia
          semanas enteras, y todas las funciones son gratuitas.
        </p>

        <h2>Próximos pasos</h2>
        <p>
          OpenAthlete es de código abierto y se construye junto a los
          entrenadores y atletas que lo usan. Si quieres probarlo,{' '}
          <a href="https://app.openathlete.org/auth/create-account">
            regístrate
          </a>{' '}
          y ayúdanos a dar forma al futuro del entrenamiento de resistencia.
        </p>
      </div>
    );
  },
};
