import type { BlogPost } from './types';

export const articleOvertrainingSigns: BlogPost = {
  metadata: {
    slug: '5-signs-of-overtraining-and-how-to-avoid-it',
    title: {
      en: '5 Signs of Overtraining (and How to Avoid It)',
      fr: "5 Signes de Surentraînement (et Comment l'Éviter)",
      es: '5 señales de sobreentrenamiento (y cómo evitarlo)',
    },
    description: {
      en: 'The 5 signs of overtraining (mood, sleep, performance, RPE, fatigue), why they creep up on you, and which numbers to watch so you catch them early.',
      fr: 'Les 5 signes du surentraînement (humeur, sommeil, performance, RPE, fatigue), pourquoi ils passent inaperçus et quels chiffres surveiller.',
      es: 'Las 5 señales del sobreentrenamiento (ánimo, sueño, rendimiento, RPE, fatiga), por qué pasan desapercibidas y qué datos vigilar para detectarlas.',
    },
    excerpt: {
      en: 'Learn the 5 key signs of overtraining: mood changes, sleep disruption, performance decline, elevated RPE, and persistent fatigue. See which numbers to watch to catch it early.',
      fr: "Apprenez les 5 signes clés du surentraînement : changements d'humeur, perturbation du sommeil, déclin de performance, RPE élevé et fatigue persistante. Découvrez quels chiffres surveiller pour le repérer tôt.",
      es: 'Conoce las 5 señales clave del sobreentrenamiento: cambios de humor, alteraciones del sueño, caída del rendimiento, RPE elevado y fatiga persistente. Descubre qué datos vigilar para detectarlo a tiempo.',
    },
    author: {
      name: 'OpenAthlete Team',
      email: 'contact@openathlete.org',
    },
    publishedAt: '2025-05-05',
    tags: [
      'Overtraining Symptoms',
      'Chronic Fatigue Sport',
      'Recovery',
      'Training Load',
    ],
    readingTime: 8,
    image:
      'https://images.unsplash.com/photo-1615934679271-1810698dfdfb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4NDE1NDF8MHwxfHNlYXJjaHwxfHxvdmVydHJhaW5pbmclMjBmYXRpZ3VlJTIwZXhoYXVzdGlvbiUyMHJlY292ZXJ5JTIwcmVzdCUyMGF0aGxldGUlMjB0aXJlZHxlbnwwfDB8fHwxNzY1Mjg3Mzc5fDA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  ContentEn: () => {
    return (
      <div>
        <p>
          <strong>
            You're training hard. You're pushing your limits. You're making
            progress. Then, suddenly, you're not. Performance drops. Mood sours.
            Sleep suffers. You're overtrained, and you didn't see it coming.
          </strong>
        </p>

        <p>
          Overtraining is insidious. It creeps up gradually, then hits suddenly.
          By the time you recognize it, you've already lost weeks of progress.
          But it's preventable—if you know what to look for.
        </p>

        <h2>The 5 Key Signs</h2>
        <p>
          <strong>1. Mood Changes</strong>
        </p>
        <p>Overtraining affects your central nervous system, leading to:</p>
        <ul>
          <li>Irritability</li>
          <li>Depression</li>
          <li>Loss of motivation</li>
          <li>Anxiety</li>
        </ul>

        <p>
          <strong>2. Sleep Disruption</strong>
        </p>
        <p>Overtraining disrupts sleep patterns:</p>
        <ul>
          <li>Difficulty falling asleep</li>
          <li>Frequent waking</li>
          <li>Poor sleep quality</li>
          <li>Feeling unrested despite sleep</li>
        </ul>

        <p>
          <strong>3. Performance Decline</strong>
        </p>
        <p>Despite training hard, performance decreases:</p>
        <ul>
          <li>Can't hit target paces</li>
          <li>Power output drops</li>
          <li>Heart rate doesn't respond normally</li>
          <li>Recovery between sessions slows</li>
        </ul>

        <p>
          <strong>4. Elevated RPE</strong>
        </p>
        <p>Sessions feel harder than they should:</p>
        <ul>
          <li>Same pace feels much harder</li>
          <li>RPE consistently 2-3 points higher</li>
          <li>Heavy legs from the start</li>
          <li>Struggling with easy sessions</li>
        </ul>

        <p>
          <strong>5. Persistent Fatigue</strong>
        </p>
        <p>Fatigue that doesn't resolve with rest:</p>
        <ul>
          <li>Feeling tired all the time</li>
          <li>Not recovering between sessions</li>
          <li>Needing more rest days</li>
          <li>General lack of energy</li>
        </ul>

        <h2>How to Prevent Overtraining</h2>
        <p>
          Prevention is better than cure. OpenAthlete won't diagnose
          overtraining, but it puts the early signs in one place:
        </p>
        <ul>
          <li>
            <strong>Load tracking:</strong> fitness, fatigue and form, and your
            weekly load against a recommended range
          </li>
          <li>
            <strong>RPE tracking:</strong> effort logged after each session, so
            a creeping RPE shows up
          </li>
          <li>
            <strong>Recovery data:</strong> sleep, HRV and resting heart rate
            from Garmin, Polar, Suunto or COROS (or entered by hand), next to
            each day of your calendar
          </li>
          <li>
            <strong>Post-session questions:</strong> a few questions on fatigue,
            sleep and pain after each activity (optional AI feature)
          </li>
          <li>
            <strong>Coach visibility:</strong> pain you report shows up in your
            coach's "To watch" list
          </li>
        </ul>

        <h2>The Bottom Line</h2>
        <p>
          Overtraining is preventable. Know the signs. Monitor your data, and
          act on the patterns early. Don't wait until it's too late.
        </p>

        <p>
          <strong>Stop guessing.</strong>{' '}
          <a href="https://app.openathlete.org/auth/create-account">
            Sign up for OpenAthlete
          </a>{' '}
          (free) and keep your load, RPE and recovery data in one place.
        </p>
      </div>
    );
  },
  ContentFr: () => {
    return (
      <div>
        <p>
          <strong>
            Vous vous entraînez dur. Vous poussez vos limites. Vous progressez.
            Puis, soudainement, vous ne progressez plus. Les performances
            chutent. L'humeur s'assombrit. Le sommeil souffre. Vous êtes en
            surentraînement, et vous ne l'avez pas vu venir.
          </strong>
        </p>

        <p>
          Le surentraînement est insidieux. Il s'infiltre progressivement, puis
          frappe soudainement. Au moment où vous le reconnaissez, vous avez déjà
          perdu des semaines de progrès. Mais c'est évitable—si vous savez quoi
          chercher.
        </p>

        <h2>Les 5 Signes Clés</h2>
        <p>
          <strong>1. Changements d'Humeur</strong>
        </p>
        <p>
          Le surentraînement affecte votre système nerveux central, conduisant à
          :
        </p>
        <ul>
          <li>Irritabilité</li>
          <li>Dépression</li>
          <li>Perte de motivation</li>
          <li>Anxiété</li>
        </ul>

        <p>
          <strong>2. Perturbation du Sommeil</strong>
        </p>
        <p>Le surentraînement perturbe les modèles de sommeil :</p>
        <ul>
          <li>Difficulté à s'endormir</li>
          <li>Réveils fréquents</li>
          <li>Mauvaise qualité de sommeil</li>
          <li>Se sentir non reposé malgré le sommeil</li>
        </ul>

        <p>
          <strong>3. Déclin de Performance</strong>
        </p>
        <p>Malgré l'entraînement dur, les performances diminuent :</p>
        <ul>
          <li>Ne peut pas atteindre les allures cibles</li>
          <li>Puissance de sortie chute</li>
          <li>Fréquence cardiaque ne répond pas normalement</li>
          <li>Récupération entre séances ralentit</li>
        </ul>

        <p>
          <strong>4. RPE Élevé</strong>
        </p>
        <p>Les séances semblent plus dures qu'elles ne devraient :</p>
        <ul>
          <li>Même allure semble beaucoup plus dure</li>
          <li>RPE constamment 2-3 points plus élevé</li>
          <li>Jambes lourdes dès le départ</li>
          <li>Lutte avec les séances faciles</li>
        </ul>

        <p>
          <strong>5. Fatigue Persistante</strong>
        </p>
        <p>Fatigue qui ne se résout pas avec le repos :</p>
        <ul>
          <li>Se sentir fatigué tout le temps</li>
          <li>Ne pas récupérer entre séances</li>
          <li>Avoir besoin de plus de jours de repos</li>
          <li>Manque général d'énergie</li>
        </ul>

        <h2>Comment Prévenir le Surentraînement</h2>
        <p>
          Mieux vaut prévenir que guérir. OpenAthlete ne diagnostique pas le
          surentraînement, mais il rassemble les premiers signes au même endroit
          :
        </p>
        <ul>
          <li>
            <strong>Suivi de la charge :</strong> forme, fatigue et fraîcheur,
            et votre charge hebdomadaire face à une fourchette recommandée
          </li>
          <li>
            <strong>Suivi RPE :</strong> l'effort noté après chaque séance, pour
            voir un RPE qui grimpe
          </li>
          <li>
            <strong>Données de récupération :</strong> sommeil, VFC et fréquence
            cardiaque au repos depuis Garmin, Polar, Suunto ou COROS (ou saisis
            à la main), affichés jour par jour dans le calendrier
          </li>
          <li>
            <strong>Questions après la séance :</strong> quelques questions sur
            la fatigue, le sommeil et les douleurs après chaque activité
            (fonction IA facultative)
          </li>
          <li>
            <strong>Visibilité pour le coach :</strong> les douleurs signalées
            apparaissent dans la liste « À surveiller » de votre coach
          </li>
        </ul>

        <h2>En Résumé</h2>
        <p>
          Le surentraînement est évitable. Connaissez les signes. Surveillez vos
          données et réagissez tôt aux tendances. N'attendez pas qu'il soit trop
          tard.
        </p>

        <p>
          <strong>Arrêtez de deviner.</strong>{' '}
          <a href="https://app.openathlete.org/auth/create-account">
            Inscrivez-vous sur OpenAthlete
          </a>{' '}
          (gratuit) et gardez votre charge, votre RPE et vos données de
          récupération au même endroit.
        </p>
      </div>
    );
  },
  ContentEs: () => {
    return (
      <div>
        <p>
          <strong>
            Entrenas duro. Llevas tus límites al máximo. Progresas. Y, de
            repente, dejas de hacerlo. El rendimiento cae. El ánimo se
            ensombrece. El sueño se resiente. Estás sobreentrenado y no lo has
            visto venir.
          </strong>
        </p>

        <p>
          El sobreentrenamiento es traicionero. Avanza poco a poco y, de pronto,
          te golpea. Cuando te das cuenta, ya has perdido semanas de progreso.
          Pero se puede prevenir, si sabes en qué fijarte.
        </p>

        <h2>Las 5 señales clave</h2>
        <p>
          <strong>1. Cambios de humor</strong>
        </p>
        <p>
          El sobreentrenamiento afecta a tu sistema nervioso central y provoca:
        </p>
        <ul>
          <li>Irritabilidad</li>
          <li>Depresión</li>
          <li>Pérdida de motivación</li>
          <li>Ansiedad</li>
        </ul>

        <p>
          <strong>2. Alteraciones del sueño</strong>
        </p>
        <p>El sobreentrenamiento altera tus patrones de sueño:</p>
        <ul>
          <li>Dificultad para conciliar el sueño</li>
          <li>Despertares frecuentes</li>
          <li>Sueño de mala calidad</li>
          <li>Sensación de no haber descansado aunque hayas dormido</li>
        </ul>

        <p>
          <strong>3. Caída del rendimiento</strong>
        </p>
        <p>Aunque entrenes duro, tu rendimiento baja:</p>
        <ul>
          <li>No llegas a los ritmos objetivo</li>
          <li>La potencia cae</li>
          <li>La frecuencia cardíaca no responde con normalidad</li>
          <li>La recuperación entre sesiones es más lenta</li>
        </ul>

        <p>
          <strong>4. RPE elevado</strong>
        </p>
        <p>Las sesiones se hacen más duras de lo que deberían:</p>
        <ul>
          <li>El mismo ritmo te cuesta mucho más</li>
          <li>El RPE es sistemáticamente 2-3 puntos más alto</li>
          <li>Piernas pesadas desde el principio</li>
          <li>Te cuestan incluso las sesiones suaves</li>
        </ul>

        <p>
          <strong>5. Fatiga persistente</strong>
        </p>
        <p>Una fatiga que no desaparece con el descanso:</p>
        <ul>
          <li>Te sientes cansado todo el tiempo</li>
          <li>No te recuperas entre sesiones</li>
          <li>Necesitas más días de descanso</li>
          <li>Falta de energía general</li>
        </ul>

        <h2>Cómo prevenir el sobreentrenamiento</h2>
        <p>
          Más vale prevenir que curar. OpenAthlete no diagnostica el
          sobreentrenamiento, pero reúne las primeras señales en un solo lugar:
        </p>
        <ul>
          <li>
            <strong>Control de la carga:</strong> forma, fatiga y frescura, y tu
            carga semanal frente a un rango recomendado
          </li>
          <li>
            <strong>Seguimiento del RPE:</strong> el esfuerzo anotado tras cada
            sesión, para ver si el RPE va subiendo
          </li>
          <li>
            <strong>Datos de recuperación:</strong> sueño, VFC y frecuencia
            cardíaca en reposo desde Garmin, Polar, Suunto o COROS (o
            introducidos a mano), día a día en el calendario
          </li>
          <li>
            <strong>Preguntas tras la sesión:</strong> unas pocas preguntas
            sobre fatiga, sueño y dolor después de cada actividad (función de IA
            opcional)
          </li>
          <li>
            <strong>Visibilidad para el entrenador:</strong> el dolor que
            indicas aparece en la lista «A vigilar» de tu entrenador
          </li>
        </ul>

        <h2>En resumen</h2>
        <p>
          El sobreentrenamiento se puede prevenir. Conoce las señales. Controla
          tus datos y actúa pronto ante los patrones. No esperes a que sea
          demasiado tarde.
        </p>

        <p>
          <strong>Deja de adivinar.</strong>{' '}
          <a href="https://app.openathlete.org/auth/create-account">
            Regístrate en OpenAthlete
          </a>{' '}
          (gratis) y ten tu carga, tu RPE y tus datos de recuperación en un solo
          lugar.
        </p>
      </div>
    );
  },
};
