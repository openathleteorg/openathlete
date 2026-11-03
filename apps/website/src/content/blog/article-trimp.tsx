import type { BlogPost } from './types';

export const articleTrimp: BlogPost = {
  metadata: {
    slug: 'what-is-trimp-and-how-to-use-it',
    title: {
      en: 'What is TRIMP and How to Use It?',
      fr: "Qu'est-ce que le TRIMP et Comment l'Utiliser ?",
      es: '¿Qué es el TRIMP y cómo usarlo?',
    },
    description: {
      en: "TRIMP (Training Impulse) explained: Banister's formula, what it measures, why it only sees cardiovascular stress, and how to pair it with session RPE.",
      fr: "Le TRIMP (Training Impulse) expliqué : la formule de Banister, ce qu'elle mesure, pourquoi elle ne voit que le cardio et comment la compléter par le RPE.",
      es: 'El TRIMP (Training Impulse) explicado: la fórmula de Banister, qué mide, por qué solo ve el estrés cardiovascular y cómo completarlo con el RPE de sesión.',
    },
    excerpt: {
      en: "TRIMP calculates training load based on heart rate and duration. It's useful but limited to cardiovascular stress. Learn how OpenAthlete pairs it with session RPE and fitness, fatigue and form curves.",
      fr: "Le TRIMP calcule la charge d'entraînement basée sur la fréquence cardiaque et la durée. C'est utile mais limité au stress cardiovasculaire. Découvrez comment OpenAthlete le complète par le RPE de séance et les courbes de forme, de fatigue et de fraîcheur.",
      es: 'El TRIMP calcula la carga de entrenamiento a partir de la frecuencia cardíaca y la duración. Es útil, pero se limita al estrés cardiovascular. Descubre cómo OpenAthlete lo completa con el RPE de sesión y las curvas de forma, fatiga y estado de forma.',
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
      <div>
        <p>
          <strong>
            TRIMP (Training Impulse) is a metric that quantifies training load.
            It's been used for decades to measure cardiovascular stress. But is
            it enough?
          </strong>
        </p>

        <p>
          This article explains what TRIMP is, how it works, its limitations,
          and how OpenAthlete uses it alongside session RPE and fitness and
          fatigue curves.
        </p>

        <h2>What is TRIMP?</h2>
        <p>
          TRIMP (Training Impulse) was developed by Dr. Eric Banister in the
          1970s. It calculates training load using:
        </p>
        <ul>
          <li>Exercise duration (minutes)</li>
          <li>Average heart rate</li>
          <li>Heart rate reserve (difference between max and resting HR)</li>
        </ul>

        <p>
          Formula: TRIMP = duration (min) × HRr × 0.64e^(1.92 × HRr) for men, or
          × 0.86e^(1.67 × HRr) for women, where HRr = (average HR − resting HR)
          / (max HR − resting HR)
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

        <h2>How OpenAthlete Uses TRIMP</h2>
        <p>
          OpenAthlete uses Banister's TRIMP as its load unit and builds around
          it:
        </p>
        <ul>
          <li>
            <strong>TRIMP per activity:</strong> exponential weighting and
            gender coefficients, from your max and resting heart rate
          </li>
          <li>
            <strong>Session RPE as an alternative:</strong> Foster's RPE ×
            minutes, for sessions where heart rate is missing or misleading
          </li>
          <li>
            <strong>Fitness, fatigue and form:</strong> CTL (42 days), ATL (7
            days) and TSB, projected over your planned sessions
          </li>
          <li>
            <strong>Load for planned sessions:</strong> estimated from
            heart-rate targets, or from duration and target RPE, with an AI
            estimate when targets are pace or power
          </li>
          <li>
            <strong>Weekly load:</strong> done and planned, against a
            recommended range
          </li>
        </ul>

        <p>
          It doesn't fold sleep, heat or injury risk into a single score. Sleep,
          HRV and resting heart rate sit next to the load on the calendar, and
          heat and slope show up in each activity's analysis, so you read them
          side by side instead of trusting a black box.
        </p>

        <h2>The Bottom Line</h2>
        <p>
          TRIMP is a useful metric, but it's incomplete. OpenAthlete pairs it
          with session RPE, tracks it as fitness, fatigue and form, and shows
          recovery data alongside, so its blind spots stay visible.
        </p>

        <p>
          <strong>Stop guessing, start training with AI today.</strong>{' '}
          <a href="https://app.openathlete.org/auth/create-account">
            Sign up for OpenAthlete
          </a>{' '}
          and see your TRIMP, fitness, fatigue and form computed from your own
          heart-rate data.
        </p>
      </div>
    );
  },
  ContentFr: () => {
    return (
      <div>
        <p>
          <strong>
            Le TRIMP (Training Impulse) est une métrique qui quantifie la charge
            d'entraînement. Il est utilisé depuis des décennies pour mesurer le
            stress cardiovasculaire. Mais est-ce suffisant ?
          </strong>
        </p>

        <p>
          Cet article explique ce qu'est le TRIMP, comment il fonctionne, ses
          limitations et comment OpenAthlete l'utilise avec le RPE de séance et
          les courbes de forme et de fatigue.
        </p>

        <h2>Qu'est-ce que le TRIMP ?</h2>
        <p>
          Le TRIMP (Training Impulse) a été développé par le Dr Eric Banister
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

        <p>
          Formule : TRIMP = durée (min) × FCr × 0,64e^(1,92 × FCr) pour les
          hommes, ou × 0,86e^(1,67 × FCr) pour les femmes, où FCr = (FC moyenne
          − FC de repos) / (FC max − FC de repos)
        </p>

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

        <h2>Comment OpenAthlete Utilise le TRIMP</h2>
        <p>
          OpenAthlete prend le TRIMP de Banister comme unité de charge et
          construit autour :
        </p>
        <ul>
          <li>
            <strong>TRIMP par activité :</strong> pondération exponentielle et
            coefficients selon le sexe, à partir de vos FC max et de repos
          </li>
          <li>
            <strong>RPE de séance en alternative :</strong> la méthode de Foster
            (RPE × minutes), pour les séances où la fréquence cardiaque manque
            ou trompe
          </li>
          <li>
            <strong>Forme, fatigue et fraîcheur :</strong> CTL (42 jours), ATL
            (7 jours) et TSB, projetées sur vos séances prévues
          </li>
          <li>
            <strong>Charge des séances prévues :</strong> estimée à partir des
            cibles cardiaques, ou de la durée et du RPE visé, avec une
            estimation par l'IA quand les cibles sont en allure ou en puissance
          </li>
          <li>
            <strong>Charge hebdomadaire :</strong> réalisée et prévue, face à
            une fourchette recommandée
          </li>
        </ul>
        <p>
          Il ne fond pas le sommeil, la chaleur ou le risque de blessure dans un
          score unique. Sommeil, VFC et fréquence cardiaque de repos s'affichent
          à côté de la charge dans le calendrier, et la chaleur comme la pente
          apparaissent dans l'analyse de chaque activité : vous lisez tout côte
          à côte, sans boîte noire.
        </p>

        <h2>En Résumé</h2>
        <p>
          Le TRIMP est une métrique utile, mais incomplète. OpenAthlete
          l'associe au RPE de séance, le suit sous forme de forme, fatigue et
          fraîcheur, et affiche les données de récupération à côté, pour que ses
          angles morts restent visibles.
        </p>

        <p>
          <strong>
            Arrêtez de deviner, commencez à vous entraîner avec l'IA dès
            aujourd'hui.
          </strong>{' '}
          <a href="https://app.openathlete.org/auth/create-account">
            Inscrivez-vous sur OpenAthlete
          </a>{' '}
          et voyez votre TRIMP, votre forme, votre fatigue et votre fraîcheur
          calculés à partir de vos propres données cardiaques.
        </p>
      </div>
    );
  },
  ContentEs: () => {
    return (
      <div>
        <p>
          <strong>
            El TRIMP (Training Impulse) es una métrica que cuantifica la carga
            de entrenamiento. Lleva décadas utilizándose para medir el estrés
            cardiovascular. Pero ¿es suficiente?
          </strong>
        </p>

        <p>
          Este artículo explica qué es el TRIMP, cómo funciona, cuáles son sus
          limitaciones y cómo lo usa OpenAthlete junto al RPE de sesión y las
          curvas de forma y fatiga.
        </p>

        <h2>¿Qué es el TRIMP?</h2>
        <p>
          El TRIMP (Training Impulse) lo desarrolló el Dr. Eric Banister en los
          años setenta. Calcula la carga de entrenamiento a partir de:
        </p>
        <ul>
          <li>La duración del ejercicio (minutos)</li>
          <li>La frecuencia cardíaca media</li>
          <li>
            La reserva de frecuencia cardíaca (diferencia entre la FC máxima y
            la FC en reposo)
          </li>
        </ul>

        <p>
          Fórmula: TRIMP = duración (min) × FCr × 0,64e^(1,92 × FCr) en hombres,
          o × 0,86e^(1,67 × FCr) en mujeres, donde FCr = (FC media − FC en
          reposo) / (FC máxima − FC en reposo)
        </p>

        <p>
          El resultado es un único número que representa el estrés
          cardiovascular del entrenamiento.
        </p>

        <h2>Los puntos fuertes del TRIMP</h2>
        <p>El TRIMP es valioso porque:</p>
        <ul>
          <li>Cuantifica la carga de entrenamiento de forma objetiva</li>
          <li>
            Tiene en cuenta las zonas de frecuencia cardíaca de cada persona
          </li>
          <li>Ofrece una única métrica con la que comparar</li>
          <li>Cuenta con décadas de validación científica</li>
        </ul>

        <h2>Las limitaciones del TRIMP</h2>
        <p>Sin embargo, el TRIMP tiene limitaciones importantes:</p>
        <ul>
          <li>
            <strong>Solo cardiovascular:</strong> no tiene en cuenta el estrés
            muscular
          </li>
          <li>
            <strong>Sin RPE:</strong> ignora la carga interna (cómo te sentiste)
          </li>
          <li>
            <strong>Sin factores ambientales:</strong> no considera el calor, la
            altitud, etc.
          </li>
          <li>
            <strong>Sin estado de recuperación:</strong> el mismo TRIMP no se
            vive igual cansado que descansado
          </li>
          <li>
            <strong>Sin riesgo de lesión:</strong> no detecta los picos de carga
            que provocan lesiones
          </li>
        </ul>

        <h2>Cómo usa OpenAthlete el TRIMP</h2>
        <p>
          OpenAthlete usa el TRIMP de Banister como unidad de carga y construye
          a su alrededor:
        </p>
        <ul>
          <li>
            <strong>TRIMP por actividad:</strong> ponderación exponencial y
            coeficientes según el sexo, a partir de tu FC máxima y en reposo
          </li>
          <li>
            <strong>RPE de sesión como alternativa:</strong> el método de Foster
            (RPE × minutos), para sesiones en las que la frecuencia cardíaca
            falta o engaña
          </li>
          <li>
            <strong>Forma, fatiga y estado de forma:</strong> CTL (42 días), ATL
            (7 días) y TSB, proyectados sobre tus sesiones planificadas
          </li>
          <li>
            <strong>Carga de las sesiones planificadas:</strong> estimada a
            partir de los objetivos de frecuencia cardíaca, o de la duración y
            el RPE previsto, con una estimación de la IA cuando los objetivos
            son de ritmo o potencia
          </li>
          <li>
            <strong>Carga semanal:</strong> hecha y planificada, frente a un
            rango recomendado
          </li>
        </ul>
        <p>
          No mezcla el sueño, el calor ni el riesgo de lesión en una única
          puntuación. El sueño, la VFC y la frecuencia cardíaca en reposo
          aparecen junto a la carga en el calendario, y el calor y la pendiente,
          en el análisis de cada actividad: lo lees todo en paralelo, sin caja
          negra.
        </p>

        <h2>En resumen</h2>
        <p>
          El TRIMP es una métrica útil, pero incompleta. OpenAthlete lo combina
          con el RPE de sesión, lo sigue como forma, fatiga y estado de forma, y
          muestra los datos de recuperación al lado, para que sus puntos ciegos
          sigan a la vista.
        </p>

        <p>
          <strong>Deja de adivinar y empieza hoy a entrenar con IA.</strong>{' '}
          <a href="https://app.openathlete.org/auth/create-account">
            Regístrate en OpenAthlete
          </a>{' '}
          y consulta tu TRIMP, tu forma, tu fatiga y tu estado de forma
          calculados con tus propios datos de frecuencia cardíaca.
        </p>
      </div>
    );
  },
};
