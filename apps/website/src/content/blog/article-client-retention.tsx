import type { BlogPost } from './types';

export const articleClientRetention: BlogPost = {
  metadata: {
    slug: 'client-retention-why-athletes-quit-and-how-to-keep-them',
    title: {
      en: 'Client Retention: Why Athletes Quit (and How to Keep Them)',
      fr: 'Rétention Client : Pourquoi les Athlètes Quittent (et Comment les Garder)',
      es: 'Retención de clientes: por qué los atletas se van (y cómo conservarlos)',
    },
    description: {
      en: 'Why coached athletes quit (no visible progress, feeling ignored, lost motivation) and what a coach can do about each, from progress charts to check-ins.',
      fr: "Pourquoi vos athlètes arrêtent le coaching (progrès invisibles, sentiment d'abandon, motivation en berne) et comment réagir avant qu'ils partent.",
      es: 'Por qué los atletas dejan a su entrenador (no ven progresos, se sienten ignorados, pierden la motivación) y qué hacer en cada caso antes de que se vayan.',
    },
    excerpt: {
      en: 'Understanding why athletes quit is the first step to keeping them. See how transparency, progress visualization, and proactive communication reduce churn rates.',
      fr: 'Comprendre pourquoi les athlètes quittent est la première étape pour les garder. Voyez comment la transparence, la visualisation des progrès et la communication proactive réduisent les taux de désabonnement.',
      es: 'Entender por qué los atletas se van es el primer paso para conservarlos. Descubre cómo la transparencia, la visualización del progreso y la comunicación proactiva reducen la tasa de bajas.',
    },
    author: {
      name: 'OpenAthlete Team',
      email: 'contact@openathlete.org',
    },
    publishedAt: '2025-03-05',
    tags: [
      'Retaining Coaching Clients',
      'Churn Rate Coach',
      'Remote Motivation',
      'Athlete Engagement',
    ],
    readingTime: 8,
    image:
      'https://images.unsplash.com/photo-1666537072206-6a7a01ecb7d9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4NDE1NDF8MHwxfHNlYXJjaHwxfHxhdGhsZXRlJTIwcHJvZ3Jlc3MlMjBjaGFydCUyMGdyYXBoJTIwaW1wcm92ZW1lbnQlMjBzdWNjZXNzJTIwcmV0ZW50aW9ufGVufDB8MHx8fDE3NjUyODczODB8MA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  ContentEn: () => {
    return (
      <div>
        <p>
          <strong>
            Sarah was a great athlete. She followed every plan. She gave
            detailed feedback. She was making progress. Then, after 3 months,
            she quit. No explanation. Just gone.
          </strong>
        </p>

        <p>
          This happens to coaches constantly. Athletes leave, and you're left
          wondering why. The truth? Most athletes don't quit because of bad
          plans—they quit because they don't see progress, feel ignored, or lose
          motivation. The solution isn't better planning—it's better engagement.
        </p>

        <h2>Why Athletes Really Quit</h2>
        <p>
          Research on coaching churn reveals three main reasons athletes leave:
        </p>

        <p>
          <strong>1. They Don't See Progress (40%)</strong>
        </p>
        <p>
          Athletes need to see that their training is working. Without clear
          visualization of progress, they lose motivation. A 5-second
          improvement in 5K time might be huge, but if they don't see it
          clearly, it feels like stagnation.
        </p>

        <p>
          <strong>2. They Feel Ignored (35%)</strong>
        </p>
        <p>
          Athletes want to feel heard. When they don't get timely responses,
          don't see that you're paying attention to their data, or feel like
          they're just a number, they leave. Communication gaps kill retention.
        </p>

        <p>
          <strong>3. They Lose Motivation (25%)</strong>
        </p>
        <p>
          Training is hard. Without clear goals, progress tracking, and
          encouragement, athletes lose the drive to continue. They need to see
          the "why" behind their training.
        </p>

        <h2>The Progress Visualization Solution</h2>
        <p>
          OpenAthlete solves the "don't see progress" problem through
          comprehensive data visualization:
        </p>
        <ul>
          <li>
            <strong>Performance trends:</strong> Clear graphs showing pace,
            power, and heart rate improvements over time
          </li>
          <li>
            <strong>Volume progression:</strong> Visual representation of
            training load increases
          </li>
          <li>
            <strong>Consistency metrics:</strong> Completion rates and adherence
            tracking
          </li>
          <li>
            <strong>Race countdown:</strong> Days left to the next race and a
            season view of the weeks leading up to it
          </li>
          <li>
            <strong>Comparative analysis:</strong> Any period against the
            previous one or the same period last year, plus records year by year
          </li>
        </ul>

        <p>
          When athletes can see their progress clearly, motivation stays high.
          They understand that even small improvements matter. They see the
          compound effect of consistent training.
        </p>

        <h2>The Proactive Communication Solution</h2>
        <p>
          OpenAthlete prevents the "feel ignored" problem through alerts on the
          coach dashboard:
        </p>
        <ul>
          <li>
            <strong>Inactivity:</strong> Athletes with no activity for several
            days are flagged
          </li>
          <li>
            <strong>Activity notices:</strong> New activities, RPE changes and
            athlete comments appear automatically in your conversation
          </li>
          <li>
            <strong>Pain reports:</strong> Pain mentioned in post-activity
            answers shows up with its location and score
          </li>
          <li>
            <strong>Unread messages:</strong> Athletes waiting for an answer are
            listed
          </li>
        </ul>

        <p>
          These alerts prompt coaches to reach out proactively. Instead of
          waiting for athletes to come to you with problems, you're reaching out
          when you see opportunities or concerns. This makes athletes feel
          valued and heard.
        </p>

        <h2>The Motivation Solution</h2>
        <p>OpenAthlete keeps athletes motivated through:</p>
        <ul>
          <li>
            <strong>Clear goal setting:</strong> Races with a target time,
            distance or elevation and an A/B/C priority
          </li>
          <li>
            <strong>Contextual explanations:</strong> Notes on each session and
            each step tell athletes why it matters
          </li>
          <li>
            <strong>Success visualization:</strong> Fitness and form projected
            over the planned weeks up to race day
          </li>
        </ul>

        <p>
          When athletes understand the "why" behind their training and can see
          how it's building toward their goals, motivation stays high.
        </p>

        <h2>The Value Perception Problem</h2>
        <p>Many athletes don't understand what they're paying for. They see:</p>
        <ul>
          <li>A training plan (they could get this free online)</li>
          <li>Occasional feedback (feels sparse)</li>
          <li>Data they don't understand (overwhelming)</li>
        </ul>

        <p>They don't see:</p>
        <ul>
          <li>The hours you spend planning</li>
          <li>The analysis you're doing</li>
          <li>The expertise behind decisions</li>
          <li>The value of injury prevention</li>
        </ul>

        <p>OpenAthlete makes your value visible. Athletes see:</p>
        <ul>
          <li>A short AI read of each new activity</li>
          <li>Each session graded against the plan</li>
          <li>Pain they report reaching their coach</li>
          <li>Progress tracking and visualization</li>
          <li>Proactive communication</li>
        </ul>

        <p>When value is visible, retention improves.</p>

        <h2>What to Measure</h2>
        <p>Four numbers worth tracking in your own coaching business:</p>
        <ul>
          <li>
            <strong>Churn:</strong> How many athletes leave each quarter
          </li>
          <li>
            <strong>Athlete satisfaction:</strong> Ask, briefly, every few
            months
          </li>
          <li>
            <strong>Plan adherence:</strong> Sessions done versus planned
          </li>
          <li>
            <strong>"Ghost" athletes:</strong> Athletes who stop logging without
            a word
          </li>
        </ul>

        <p>
          These aren't just numbers—they're real business impacts. Lower churn
          means more stable revenue. Higher satisfaction means better referrals.
          Better adherence means better results, which means happier athletes
          who stay longer.
        </p>

        <h2>The Early Warning System</h2>
        <p>
          OpenAthlete's coach dashboard acts as an early warning system for
          retention risks:
        </p>
        <ul>
          <li>
            <strong>Decreased engagement:</strong> Flags athletes who stop
            logging activities
          </li>
          <li>
            <strong>Never started:</strong> Flags athletes who have never logged
            an activity
          </li>
          <li>
            <strong>Communication gaps:</strong> Shows which athletes have
            unread messages waiting
          </li>
          <li>
            <strong>Pain:</strong> Shows pain reported in post-activity answers
          </li>
        </ul>

        <p>
          When you get these alerts, you can intervene early—before athletes
          decide to quit. A simple check-in message, progress celebration, or
          plan adjustment can save a relationship.
        </p>

        <h2>The Bottom Line</h2>
        <p>
          Retention isn't about perfect plans—it's about engagement,
          communication, and perceived value. Athletes stay when they:
        </p>
        <ul>
          <li>See clear progress</li>
          <li>Feel heard and valued</li>
          <li>Understand their training</li>
          <li>Feel motivated to continue</li>
        </ul>

        <p>
          OpenAthlete provides the tools to deliver all of this. Data
          visualization shows progress. Coach dashboard alerts prompt you to
          reach out. Session notes and comments build understanding. Progress
          tracking maintains motivation.
        </p>

        <p>
          Don't let athletes slip away because they don't see value. Make your
          expertise visible. Make progress clear. Make communication easy.
        </p>

        <p>
          <strong>Stop guessing, start training with AI today.</strong>{' '}
          <a href="https://app.openathlete.org/auth/create-account">
            Sign up for OpenAthlete
          </a>{' '}
          and see how progress charts, coach alerts and proactive communication
          can help you keep your athletes.
        </p>
      </div>
    );
  },
  ContentFr: () => {
    return (
      <div>
        <p>
          <strong>
            Sarah était une excellente athlète. Elle suivait chaque plan. Elle
            donnait des retours détaillés. Elle progressait. Puis, après 3 mois,
            elle a quitté. Aucune explication. Juste partie.
          </strong>
        </p>

        <p>
          Cela arrive constamment aux coachs. Les athlètes partent, et vous vous
          demandez pourquoi. La vérité ? La plupart des athlètes ne quittent pas
          à cause de mauvais plans—ils quittent parce qu'ils ne voient pas de
          progrès, se sentent ignorés ou perdent la motivation. La solution
          n'est pas une meilleure planification—c'est un meilleur engagement.
        </p>

        <h2>Pourquoi les Athlètes Quittent Vraiment</h2>
        <p>
          La recherche sur le désabonnement en coaching révèle trois raisons
          principales pour lesquelles les athlètes partent :
        </p>

        <p>
          <strong>1. Ils ne Voient pas de Progrès (40%)</strong>
        </p>
        <p>
          Les athlètes ont besoin de voir que leur entraînement fonctionne. Sans
          visualisation claire des progrès, ils perdent la motivation. Une
          amélioration de 5 secondes sur un 5K pourrait être énorme, mais s'ils
          ne la voient pas clairement, cela ressemble à une stagnation.
        </p>

        <p>
          <strong>2. Ils se Sentent Ignorés (35%)</strong>
        </p>
        <p>
          Les athlètes veulent se sentir entendus. Quand ils ne reçoivent pas de
          réponses rapides, ne voient pas que vous faites attention à leurs
          données, ou ont l'impression d'être juste un numéro, ils partent. Les
          écarts de communication tuent la rétention.
        </p>

        <p>
          <strong>3. Ils Perdent la Motivation (25%)</strong>
        </p>
        <p>
          L'entraînement est dur. Sans objectifs clairs, suivi des progrès et
          encouragement, les athlètes perdent l'envie de continuer. Ils ont
          besoin de voir le "pourquoi" derrière leur entraînement.
        </p>

        <h2>La Solution de Visualisation des Progrès</h2>
        <p>
          OpenAthlete résout le problème "ne voient pas de progrès" à travers
          une visualisation complète des données :
        </p>
        <ul>
          <li>
            <strong>Tendances de performance :</strong> Graphiques clairs
            montrant les améliorations d'allure, puissance et fréquence
            cardiaque dans le temps
          </li>
          <li>
            <strong>Progression de volume :</strong> Représentation visuelle des
            augmentations de charge d'entraînement
          </li>
          <li>
            <strong>Métriques de cohérence :</strong> Taux de complétion et
            suivi d'adhésion
          </li>
          <li>
            <strong>Compte à rebours :</strong> Les jours restants avant la
            prochaine course et une vue saison des semaines qui y mènent
          </li>
          <li>
            <strong>Analyse comparative :</strong> N'importe quelle période
            comparée à la précédente ou à la même période l'an dernier, et les
            records année par année
          </li>
        </ul>

        <p>
          Quand les athlètes peuvent voir leurs progrès clairement, la
          motivation reste élevée. Ils comprennent que même les petites
          améliorations comptent. Ils voient l'effet composé de l'entraînement
          constant.
        </p>

        <h2>La Solution de Communication Proactive</h2>
        <p>
          OpenAthlete prévient le problème "se sentent ignorés" grâce aux
          alertes du tableau de bord coach :
        </p>
        <ul>
          <li>
            <strong>Inactivité :</strong> Les athlètes sans activité depuis
            plusieurs jours sont signalés
          </li>
          <li>
            <strong>Notifications d'activité :</strong> Nouvelles activités,
            changements de RPE et commentaires de l'athlète arrivent
            automatiquement dans votre conversation
          </li>
          <li>
            <strong>Douleurs signalées :</strong> Une douleur mentionnée dans
            les réponses après l'activité apparaît avec sa localisation et son
            intensité
          </li>
          <li>
            <strong>Messages non lus :</strong> Les athlètes qui attendent une
            réponse sont listés
          </li>
        </ul>

        <p>
          Ces alertes incitent les coachs à contacter de manière proactive. Au
          lieu d'attendre que les athlètes viennent à vous avec des problèmes,
          vous les contactez quand vous voyez des opportunités ou des
          préoccupations. Cela fait sentir aux athlètes qu'ils sont valorisés et
          entendus.
        </p>

        <h2>La Solution de Motivation</h2>
        <p>OpenAthlete maintient la motivation des athlètes à travers :</p>
        <ul>
          <li>
            <strong>Définition d'objectifs clairs :</strong> Des courses avec un
            objectif de temps, de distance ou de dénivelé et une priorité A/B/C
          </li>
          <li>
            <strong>Explications contextuelles :</strong> Des notes sur chaque
            séance et chaque étape expliquent à l'athlète pourquoi elle compte
          </li>
          <li>
            <strong>Visualisation du succès :</strong> La forme projetée sur les
            semaines planifiées jusqu'au jour de la course
          </li>
        </ul>

        <p>
          Quand les athlètes comprennent le "pourquoi" derrière leur
          entraînement et peuvent voir comment cela construit vers leurs
          objectifs, la motivation reste élevée.
        </p>

        <h2>Le Problème de Perception de Valeur</h2>
        <p>
          Beaucoup d'athlètes ne comprennent pas ce pour quoi ils paient. Ils
          voient :
        </p>
        <ul>
          <li>
            Un plan d'entraînement (ils pourraient l'obtenir gratuitement en
            ligne)
          </li>
          <li>Des retours occasionnels (semble rare)</li>
          <li>Des données qu'ils ne comprennent pas (accablant)</li>
        </ul>

        <p>Ils ne voient pas :</p>
        <ul>
          <li>Les heures que vous passez à planifier</li>
          <li>L'analyse que vous faites</li>
          <li>L'expertise derrière les décisions</li>
          <li>La valeur de la prévention des blessures</li>
        </ul>

        <p>OpenAthlete rend votre valeur visible. Les athlètes voient :</p>
        <ul>
          <li>Une courte lecture de chaque nouvelle activité par l'IA</li>
          <li>Chaque séance comparée au plan</li>
          <li>Les douleurs qu'ils signalent transmises à leur coach</li>
          <li>Le suivi et la visualisation des progrès</li>
          <li>La communication proactive</li>
        </ul>

        <p>Quand la valeur est visible, la rétention s'améliore.</p>

        <h2>Ce qu'il faut mesurer</h2>
        <p>Quatre chiffres à suivre dans votre propre activité de coach :</p>
        <ul>
          <li>
            <strong>Le taux de départ :</strong> Combien d'athlètes partent
            chaque trimestre
          </li>
          <li>
            <strong>La satisfaction des athlètes :</strong> Posez-leur la
            question, brièvement, tous les quelques mois
          </li>
          <li>
            <strong>Le respect du plan :</strong> Séances réalisées par rapport
            aux séances prévues
          </li>
          <li>
            <strong>Les athlètes "fantômes" :</strong> Ceux qui cessent
            d'enregistrer sans rien dire
          </li>
        </ul>

        <p>
          Ce ne sont pas juste des chiffres—ce sont des impacts réels sur
          l'entreprise. Un désabonnement plus faible signifie des revenus plus
          stables. Une satisfaction plus élevée signifie de meilleures
          références. Une meilleure adhésion signifie de meilleurs résultats, ce
          qui signifie des athlètes plus heureux qui restent plus longtemps.
        </p>

        <h2>Le Système d'Alerte Précoce</h2>
        <p>
          Le tableau de bord coach d'OpenAthlete agit comme un système d'alerte
          précoce pour les risques de départ :
        </p>
        <ul>
          <li>
            <strong>Engagement diminué :</strong> Signale les athlètes qui
            n'enregistrent plus d'activités
          </li>
          <li>
            <strong>Jamais démarré :</strong> Signale les athlètes qui n'ont
            encore enregistré aucune activité
          </li>
          <li>
            <strong>Écarts de communication :</strong> Indique quels athlètes
            ont des messages non lus en attente
          </li>
          <li>
            <strong>Douleurs :</strong> Affiche les douleurs signalées dans les
            réponses après l'activité
          </li>
        </ul>

        <p>
          Quand vous recevez ces alertes, vous pouvez intervenir tôt—avant que
          les athlètes ne décident de quitter. Un simple message de
          vérification, célébration de progrès ou ajustement de plan peut sauver
          une relation.
        </p>

        <h2>En Résumé</h2>
        <p>
          La rétention ne concerne pas les plans parfaits—elle concerne
          l'engagement, la communication et la valeur perçue. Les athlètes
          restent quand ils :
        </p>
        <ul>
          <li>Voient des progrès clairs</li>
          <li>Se sentent entendus et valorisés</li>
          <li>Comprennent leur entraînement</li>
          <li>Se sentent motivés à continuer</li>
        </ul>

        <p>
          OpenAthlete fournit les outils pour livrer tout cela. La visualisation
          de données montre les progrès. Les alertes du tableau de bord coach
          vous incitent à prendre contact. Les notes de séance et les
          commentaires construisent la compréhension. Le suivi des progrès
          maintient la motivation.
        </p>

        <p>
          Ne laissez pas les athlètes glisser parce qu'ils ne voient pas la
          valeur. Rendez votre expertise visible. Rendez les progrès clairs.
          Rendez la communication facile.
        </p>

        <p>
          <strong>
            Arrêtez de deviner, commencez à vous entraîner avec l'IA dès
            aujourd'hui.
          </strong>{' '}
          <a href="https://app.openathlete.org/auth/create-account">
            Inscrivez-vous sur OpenAthlete
          </a>{' '}
          et voyez comment les graphiques de progression, les alertes coach et
          une communication proactive peuvent vous aider à garder vos athlètes.
        </p>
      </div>
    );
  },
  ContentEs: () => {
    return (
      <div>
        <p>
          <strong>
            Sarah era una gran atleta. Seguía cada plan. Daba un feedback
            detallado. Estaba progresando. Y entonces, a los 3 meses, lo dejó.
            Sin explicaciones. Simplemente desapareció.
          </strong>
        </p>

        <p>
          A los entrenadores les pasa constantemente. Los atletas se van y tú te
          quedas preguntándote por qué. ¿La verdad? La mayoría no lo deja por
          tener malos planes, sino porque no ven progresos, se sienten ignorados
          o pierden la motivación. La solución no es planificar mejor, sino
          implicarles más.
        </p>

        <h2>Por qué se van realmente los atletas</h2>
        <p>
          Los estudios sobre las bajas en los servicios de entrenamiento señalan
          tres motivos principales por los que se van los atletas:
        </p>

        <p>
          <strong>1. No ven progresos (40 %)</strong>
        </p>
        <p>
          Los atletas necesitan ver que su entrenamiento funciona. Sin una
          visualización clara del progreso, pierden la motivación. Mejorar 5
          segundos en un 5K puede ser un logro enorme, pero si no lo ven con
          claridad, lo viven como un estancamiento.
        </p>

        <p>
          <strong>2. Se sienten ignorados (35 %)</strong>
        </p>
        <p>
          Los atletas quieren sentirse escuchados. Cuando no reciben respuestas
          a tiempo, no ven que prestas atención a sus datos o sienten que son
          solo un número, se van. Los vacíos de comunicación acaban con la
          retención.
        </p>

        <p>
          <strong>3. Pierden la motivación (25 %)</strong>
        </p>
        <p>
          Entrenar es duro. Sin objetivos claros, seguimiento del progreso y
          ánimo, los atletas pierden las ganas de seguir. Necesitan ver el «para
          qué» de su entrenamiento.
        </p>

        <h2>La solución: visualizar el progreso</h2>
        <p>
          OpenAthlete resuelve el problema de «no veo progresos» con una
          visualización de datos completa:
        </p>
        <ul>
          <li>
            <strong>Tendencias de rendimiento:</strong> gráficos claros que
            muestran la mejora del ritmo, la potencia y la frecuencia cardíaca a
            lo largo del tiempo
          </li>
          <li>
            <strong>Progresión del volumen:</strong> representación visual de
            los aumentos de carga de entrenamiento
          </li>
          <li>
            <strong>Métricas de constancia:</strong> porcentaje de sesiones
            completadas y seguimiento de la adherencia
          </li>
          <li>
            <strong>Cuenta atrás:</strong> los días que quedan para la próxima
            carrera y una vista de temporada de las semanas previas
          </li>
          <li>
            <strong>Análisis comparativo:</strong> cualquier periodo frente al
            anterior o al mismo periodo del año pasado, y los récords año a año
          </li>
        </ul>

        <p>
          Cuando los atletas ven su progreso con claridad, la motivación se
          mantiene alta. Entienden que incluso las pequeñas mejoras cuentan. Ven
          el efecto acumulado de entrenar con constancia.
        </p>

        <h2>La solución: comunicación proactiva</h2>
        <p>
          OpenAthlete evita el problema de «me siento ignorado» con las alertas
          del panel del entrenador:
        </p>
        <ul>
          <li>
            <strong>Inactividad:</strong> se señalan los atletas sin actividad
            desde hace varios días
          </li>
          <li>
            <strong>Avisos de actividad:</strong> las nuevas actividades, los
            cambios de RPE y los comentarios del atleta llegan automáticamente a
            vuestra conversación
          </li>
          <li>
            <strong>Dolor indicado:</strong> el dolor mencionado en las
            respuestas tras la actividad aparece con su localización y su
            intensidad
          </li>
          <li>
            <strong>Mensajes sin leer:</strong> se listan los atletas que
            esperan una respuesta
          </li>
        </ul>

        <p>
          Estas alertas animan a los entrenadores a tomar la iniciativa. En
          lugar de esperar a que los atletas acudan a ti con problemas, te
          adelantas cuando ves una oportunidad o algo que te preocupa. Así los
          atletas se sienten valorados y escuchados.
        </p>

        <h2>La solución para la motivación</h2>
        <p>OpenAthlete mantiene a los atletas motivados gracias a:</p>
        <ul>
          <li>
            <strong>Objetivos claros:</strong> carreras con un objetivo de
            tiempo, distancia o desnivel y una prioridad A/B/C
          </li>
          <li>
            <strong>Explicaciones en contexto:</strong> las notas de cada sesión
            y de cada paso explican al atleta por qué importa
          </li>
          <li>
            <strong>Visualización del éxito:</strong> la forma proyectada sobre
            las semanas planificadas hasta el día de la carrera
          </li>
        </ul>

        <p>
          Cuando los atletas entienden el «para qué» de su entrenamiento y ven
          cómo les acerca a sus objetivos, la motivación se mantiene alta.
        </p>

        <h2>El problema del valor percibido</h2>
        <p>Muchos atletas no entienden por qué están pagando. Lo que ven es:</p>
        <ul>
          <li>
            Un plan de entrenamiento (podrían encontrarlo gratis en internet)
          </li>
          <li>Algún comentario de vez en cuando (les sabe a poco)</li>
          <li>Datos que no entienden (les abruman)</li>
        </ul>

        <p>Lo que no ven es:</p>
        <ul>
          <li>Las horas que dedicas a planificar</li>
          <li>El análisis que haces</li>
          <li>La experiencia que hay detrás de cada decisión</li>
          <li>El valor de prevenir lesiones</li>
        </ul>

        <p>OpenAthlete hace visible tu valor. Los atletas ven:</p>
        <ul>
          <li>Una breve lectura de cada nueva actividad por parte de la IA</li>
          <li>Cada sesión comparada con el plan</li>
          <li>El dolor que indican, transmitido a su entrenador</li>
          <li>Seguimiento y visualización del progreso</li>
          <li>Comunicación proactiva</li>
        </ul>

        <p>Cuando el valor se ve, la retención mejora.</p>

        <h2>Qué medir</h2>
        <p>Cuatro cifras que conviene seguir en tu propio negocio:</p>
        <ul>
          <li>
            <strong>Bajas:</strong> cuántos atletas se van cada trimestre
          </li>
          <li>
            <strong>Satisfacción de los atletas:</strong> pregúntales,
            brevemente, cada pocos meses
          </li>
          <li>
            <strong>Adherencia al plan:</strong> sesiones hechas frente a
            sesiones previstas
          </li>
          <li>
            <strong>Atletas «fantasma»:</strong> los que dejan de registrar sin
            decir nada
          </li>
        </ul>

        <p>
          No son solo cifras: tienen un impacto real en tu negocio. Menos bajas
          significan ingresos más estables. Más satisfacción significa más
          recomendaciones. Más adherencia significa mejores resultados y, por
          tanto, atletas más contentos que se quedan más tiempo.
        </p>

        <h2>El sistema de alerta temprana</h2>
        <p>
          El panel del entrenador de OpenAthlete funciona como un sistema de
          alerta temprana ante los riesgos de baja:
        </p>
        <ul>
          <li>
            <strong>Menor implicación:</strong> señala a los atletas que dejan
            de registrar actividades
          </li>
          <li>
            <strong>Sin empezar:</strong> señala a los atletas que todavía no
            han registrado ninguna actividad
          </li>
          <li>
            <strong>Vacíos de comunicación:</strong> muestra qué atletas tienen
            mensajes sin leer
          </li>
          <li>
            <strong>Dolor:</strong> muestra el dolor indicado en las respuestas
            tras la actividad
          </li>
        </ul>

        <p>
          Cuando recibes estas alertas, puedes intervenir pronto, antes de que
          el atleta decida irse. Un simple mensaje para ver cómo va, una
          felicitación por su progreso o un ajuste del plan pueden salvar la
          relación.
        </p>

        <h2>En resumen</h2>
        <p>
          La retención no depende de planes perfectos, sino de la implicación,
          la comunicación y el valor percibido. Los atletas se quedan cuando:
        </p>
        <ul>
          <li>Ven un progreso claro</li>
          <li>Se sienten escuchados y valorados</li>
          <li>Entienden su entrenamiento</li>
          <li>Se sienten motivados para continuar</li>
        </ul>

        <p>
          OpenAthlete te da las herramientas para conseguir todo esto. La
          visualización de datos muestra el progreso. Las alertas del panel te
          invitan a dar el primer paso. Las notas de sesión y los comentarios
          generan comprensión. El seguimiento del progreso mantiene la
          motivación.
        </p>

        <p>
          No dejes que tus atletas se vayan porque no ven el valor. Haz visible
          tu experiencia. Haz que el progreso sea evidente. Haz que comunicarse
          sea fácil.
        </p>

        <p>
          <strong>Deja de adivinar y empieza hoy a entrenar con IA.</strong>{' '}
          <a href="https://app.openathlete.org/auth/create-account">
            Regístrate en OpenAthlete
          </a>{' '}
          y descubre cómo los gráficos de progreso, las alertas para el
          entrenador y una comunicación proactiva pueden ayudarte a conservar a
          tus atletas.
        </p>
      </div>
    );
  },
};
