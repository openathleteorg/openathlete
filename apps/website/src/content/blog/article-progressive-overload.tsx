import type { BlogPost } from './types';

export const articleProgressiveOverload: BlogPost = {
  metadata: {
    slug: 'progressive-overload-increasing-intensity-without-breaking',
    title: {
      en: 'Progressive Overload: Increasing Intensity Without Breaking',
      fr: "Surcharge Progressive : Augmenter l'Intensité Sans Casser",
      es: 'Sobrecarga progresiva: aumentar la intensidad sin romperte',
    },
    description: {
      en: 'Microcycles, mesocycles and deload weeks explained: how fast to raise running volume, how to read acute vs chronic load, with a 12-week example.',
      fr: "Microcycles, mésocycles, semaines allégées : à quel rythme augmenter votre volume et comment lire la charge aiguë et chronique, exemple à l'appui.",
      es: 'Microciclos, mesociclos y semanas de descarga: cuánto subir el volumen, cómo leer la carga aguda y crónica, y un ejemplo de 12 semanas.',
    },
    excerpt: {
      en: 'Progressive overload is essential for improvement, but increasing too fast causes injury. Learn how mesocycles, microcycles and deload weeks keep progress safe.',
      fr: "La surcharge progressive est essentielle pour l'amélioration, mais augmenter trop vite cause des blessures. Découvrez comment mésocycles, microcycles et semaines de décharge permettent de progresser sans casser.",
      es: 'La sobrecarga progresiva es imprescindible para mejorar, pero subir demasiado rápido provoca lesiones. Descubre cómo los mesociclos, los microciclos y las semanas de descarga te permiten progresar sin romperte.',
    },
    author: {
      name: 'OpenAthlete Team',
      email: 'contact@openathlete.org',
    },
    publishedAt: '2025-03-20',
    tags: [
      'Progressive Overload Principle',
      'Periodization',
      'Increasing Running Volume',
      'Training Science',
    ],
    readingTime: 8,
    image:
      'https://images.unsplash.com/photo-1638536534847-2cb61af9efe3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4NDE1NDF8MHwxfHNlYXJjaHwxfHxwcm9ncmVzc2l2ZSUyMHRyYWluaW5nJTIwd2VpZ2h0cyUyMGR1bWJiZWxscyUyMGdyYWR1YWwlMjBpbmNyZWFzZXxlbnwwfDB8fHwxNzY1Mjg3MzgwfDA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  ContentEn: () => {
    return (
      <div>
        <p>
          <strong>
            You want to get faster. So you train harder. Week 1: 40km. Week 2:
            50km. Week 3: 60km. Week 4: You're injured. What went wrong?
          </strong>
        </p>

        <p>
          The answer: you increased load too quickly. Progressive overload is
          essential for improvement, but there's a right way and a wrong way to
          do it. The right way involves understanding mesocycles, microcycles,
          and the delicate balance between progress and injury risk.
        </p>

        <h2>What is Progressive Overload?</h2>
        <p>
          Progressive overload is the fundamental principle of training: to
          improve, you must gradually increase stress. Your body adapts to
          stress by getting stronger, but only if you increase that stress
          intelligently.
        </p>

        <p>
          The challenge? Increase too slowly, and you don't progress. Increase
          too quickly, and you get injured. The sweet spot is in
          between—progressive enough to drive adaptation, but controlled enough
          to prevent breakdown.
        </p>

        <h2>Understanding Mesocycles and Microcycles</h2>
        <p>Training is organized into cycles:</p>

        <p>
          <strong>Microcycle (1 week):</strong> The basic training unit.
          Typically includes:
        </p>
        <ul>
          <li>2-3 hard sessions</li>
          <li>2-3 easy/recovery sessions</li>
          <li>1-2 rest days</li>
        </ul>

        <p>
          <strong>Mesocycle (3-6 weeks):</strong> A block of training with a
          specific focus:
        </p>
        <ul>
          <li>Base building (high volume, low intensity)</li>
          <li>Build phase (increasing intensity)</li>
          <li>Peak phase (race-specific training)</li>
          <li>Recovery phase (reduced load)</li>
        </ul>

        <p>
          Progressive overload happens within mesocycles. Each microcycle builds
          slightly on the last, but mesocycles include recovery weeks to allow
          adaptation.
        </p>

        <h2>The Traditional Problem</h2>
        <p>
          Most athletes (and many coaches) struggle with progressive overload
          because:
        </p>
        <ul>
          <li>
            <strong>They increase too quickly:</strong> Jumping from 40km to
            60km in 3 weeks
          </li>
          <li>
            <strong>They don't plan recovery:</strong> No deload weeks
          </li>
          <li>
            <strong>They ignore signals:</strong> Pushing through fatigue
          </li>
          <li>
            <strong>They don't track load:</strong> No ACWR monitoring
          </li>
        </ul>

        <p>The result? Injuries, burnout, and stalled progress.</p>

        <h2>How to Manage Progressive Overload</h2>
        <p>
          Four habits fix most of it, and OpenAthlete puts the numbers for each
          in one place:
        </p>

        <p>
          <strong>1. Raising Load Gradually</strong>
        </p>
        <p>
          Keep increases to roughly 5-10% per week, with a deload week every 3-4
          weeks. In OpenAthlete, the weekly summary shows load done and planned
          against a recommended range, so a jump stands out before you run it.
        </p>

        <p>
          <strong>2. Watching Acute vs Chronic Load</strong>
        </p>
        <p>
          The Acute:Chronic Workload Ratio compares last week with the last
          month or so. OpenAthlete tracks the same idea with fitness (CTL, 42
          days), fatigue (ATL, 7 days) and form (TSB), projected over your
          planned sessions. When fatigue climbs far above fitness, that's your
          cue to back off. The app shows where the plan is heading; it doesn't
          cut the load for you.
        </p>

        <p>
          <strong>3. Planning Mesocycles</strong>
        </p>
        <p>
          Structure training into mesocycles with clear phases (in OpenAthlete,
          drawn as blocks on the season view):
        </p>
        <ul>
          <li>Weeks 1-3: Build phase (increasing load)</li>
          <li>Week 4: Deload week (reduced load for adaptation)</li>
          <li>Weeks 5-7: Build phase (resume progression)</li>
          <li>Week 8: Deload week</li>
        </ul>

        <p>
          This pattern repeats, ensuring consistent progress without overload.
        </p>

        <p>
          <strong>4. Adjusting Based on RPE</strong>
        </p>
        <p>
          Log RPE after each session (or answer the short post-activity
          questions, from which the AI extracts it). If your RPE stays elevated,
          reduce load even if volume looks "safe" on paper. This prevents
          overreaching before it becomes overtraining.
        </p>

        <h2>The Progress Zone vs. Red Zone</h2>
        <p>
          <strong>Progress Zone (ACWR 0.8-1.3):</strong>
        </p>
        <ul>
          <li>Optimal adaptation</li>
          <li>Low injury risk</li>
          <li>Consistent improvement</li>
          <li>Sustainable long-term</li>
        </ul>

        <p>
          <strong>Red Zone (ACWR {'>'} 1.5):</strong>
        </p>
        <ul>
          <li>High injury risk</li>
          <li>Fatigue accumulation</li>
          <li>Diminished returns</li>
          <li>Unsustainable</li>
        </ul>

        <p>
          The goal is to stay in the progress zone. When you drift toward the
          red zone, step in early: reduce load and add recovery before problems
          occur.
        </p>

        <h2>Real-World Example</h2>
        <p>
          Sarah wanted to increase her weekly volume from 40km to 60km over 8
          weeks. Too fast:
        </p>
        <ul>
          <li>Week 1: 40km</li>
          <li>Week 2: 50km (25% increase—too much)</li>
          <li>Week 3: 55km</li>
          <li>Week 4: 60km (ACWR = 1.6—red zone)</li>
          <li>Week 5: Injured</li>
        </ul>

        <p>With gradual steps and deload weeks:</p>
        <ul>
          <li>Week 1: 40km</li>
          <li>Week 2: 42km (5% increase)</li>
          <li>Week 3: 44km (5% increase)</li>
          <li>Week 4: 35km (deload week)</li>
          <li>Week 5: 46km (resume progression)</li>
          <li>Week 6: 48km</li>
          <li>Week 7: 50km</li>
          <li>Week 8: 40km (deload week)</li>
          <li>Week 9: 52km (continue building)</li>
        </ul>

        <p>
          Result: Sarah reached 60km/week safely over 12 weeks instead of 4,
          with no injuries and consistent progress.
        </p>

        <h2>The Bottom Line</h2>
        <p>
          Progressive overload is essential, but it must be managed
          intelligently. Too fast = injury. Too slow = stagnation. The sweet
          spot requires:
        </p>
        <ul>
          <li>Gradual increases (5-10% per week)</li>
          <li>Regular deload weeks</li>
          <li>ACWR monitoring</li>
          <li>RPE tracking</li>
          <li>Mesocycle structure</li>
        </ul>

        <p>
          OpenAthlete doesn't make these calls for you, but it puts the pieces
          side by side: weekly load against a recommended range, fitness,
          fatigue and form projected over your plan, RPE on every session, and
          training blocks on a season view. You or your coach decide, with the
          numbers in front of you.
        </p>

        <p>
          <strong>Stop guessing, start training with AI today.</strong>{' '}
          <a href="https://app.openathlete.org/auth/create-account">
            Sign up for OpenAthlete
          </a>{' '}
          and see your load ramp before you run it, so you improve without
          breaking down.
        </p>
      </div>
    );
  },
  ContentFr: () => {
    return (
      <div>
        <p>
          <strong>
            Vous voulez devenir plus rapide. Donc vous vous entraînez plus dur.
            Semaine 1 : 40km. Semaine 2 : 50km. Semaine 3 : 60km. Semaine 4 :
            Vous êtes blessé. Qu'est-ce qui n'a pas fonctionné ?
          </strong>
        </p>

        <p>
          La réponse : vous avez augmenté la charge trop rapidement. La
          surcharge progressive est essentielle pour l'amélioration, mais il y a
          une bonne et une mauvaise façon de le faire. La bonne façon implique
          de comprendre les mésocycles, microcycles et l'équilibre délicat entre
          progrès et risque de blessure.
        </p>

        <h2>Qu'est-ce que la Surcharge Progressive ?</h2>
        <p>
          La surcharge progressive est le principe fondamental de l'entraînement
          : pour s'améliorer, vous devez augmenter progressivement le stress.
          Votre corps s'adapte au stress en devenant plus fort, mais seulement
          si vous augmentez ce stress intelligemment.
        </p>

        <p>
          Le défi ? Augmentez trop lentement, et vous ne progressez pas.
          Augmentez trop rapidement, et vous vous blessez. La zone idéale est
          entre les deux—assez progressive pour conduire l'adaptation, mais
          assez contrôlée pour prévenir la rupture.
        </p>

        <h2>Comprendre les Mésocycles et Microcycles</h2>
        <p>L'entraînement est organisé en cycles :</p>

        <p>
          <strong>Microcycle (1 semaine) :</strong> L'unité d'entraînement de
          base. Inclut typiquement :
        </p>
        <ul>
          <li>2-3 séances dures</li>
          <li>2-3 séances faciles/récupération</li>
          <li>1-2 jours de repos</li>
        </ul>

        <p>
          <strong>Mésocycle (3-6 semaines) :</strong> Un bloc d'entraînement
          avec un focus spécifique :
        </p>
        <ul>
          <li>Construction de base (volume élevé, faible intensité)</li>
          <li>Phase de construction (augmentation d'intensité)</li>
          <li>Phase de pic (entraînement spécifique à la course)</li>
          <li>Phase de récupération (charge réduite)</li>
        </ul>

        <p>
          La surcharge progressive se produit dans les mésocycles. Chaque
          microcycle construit légèrement sur le précédent, mais les mésocycles
          incluent des semaines de récupération pour permettre l'adaptation.
        </p>

        <h2>Le Problème Traditionnel</h2>
        <p>
          La plupart des athlètes (et beaucoup de coachs) luttent avec la
          surcharge progressive parce que :
        </p>
        <ul>
          <li>
            <strong>Ils augmentent trop rapidement :</strong> Passer de 40km à
            60km en 3 semaines
          </li>
          <li>
            <strong>Ils ne planifient pas la récupération :</strong> Pas de
            semaines de décharge
          </li>
          <li>
            <strong>Ils ignorent les signaux :</strong> Pousser à travers la
            fatigue
          </li>
          <li>
            <strong>Ils ne suivent pas la charge :</strong> Pas de surveillance
            ACWR
          </li>
        </ul>

        <p>Le résultat ? Blessures, épuisement et progrès bloqués.</p>

        <h2>Comment Gérer la Surcharge Progressive</h2>
        <p>
          Quatre habitudes règlent l'essentiel, et OpenAthlete réunit les
          chiffres de chacune au même endroit :
        </p>

        <p>
          <strong>1. Augmenter la Charge Progressivement</strong>
        </p>
        <p>
          Limitez les hausses à environ 5-10 % par semaine, avec une semaine de
          décharge toutes les 3-4 semaines. Dans OpenAthlete, le résumé
          hebdomadaire affiche la charge réalisée et prévue face à une
          fourchette recommandée : un bond saute aux yeux avant même de courir.
        </p>

        <p>
          <strong>2. Surveiller la Charge Aiguë et Chronique</strong>
        </p>
        <p>
          Le ratio charge aiguë/chronique (ACWR) compare la dernière semaine au
          dernier mois environ. OpenAthlete suit la même idée avec la forme de
          fond (CTL, 42 jours), la fatigue (ATL, 7 jours) et la fraîcheur (TSB),
          projetées sur vos séances prévues. Quand la fatigue grimpe nettement
          au-dessus de la forme de fond, c'est le signal pour lever le pied.
          L'application montre où va le plan ; elle ne réduit pas la charge à
          votre place.
        </p>

        <p>
          <strong>3. Planifier les Mésocycles</strong>
        </p>
        <p>
          Structurez l'entraînement en mésocycles aux phases claires (dans
          OpenAthlete, sous forme de blocs dans la vue saison) :
        </p>
        <ul>
          <li>Semaines 1-3 : Phase de construction (augmentation de charge)</li>
          <li>
            Semaine 4 : Semaine de décharge (charge réduite pour adaptation)
          </li>
          <li>Semaines 5-7 : Phase de construction (reprendre progression)</li>
          <li>Semaine 8 : Semaine de décharge</li>
        </ul>

        <p>
          Ce modèle se répète, assurant une progression constante sans
          surcharge.
        </p>

        <p>
          <strong>4. Ajuster selon le RPE</strong>
        </p>
        <p>
          Notez votre RPE après chaque séance (ou répondez aux quelques
          questions post-activité, dont l'IA l'extrait). Si votre RPE reste
          élevé, réduisez la charge même si le volume semble « sûr » sur le
          papier. Cela prévient le surentraînement avant qu'il ne devienne du
          surentraînement.
        </p>

        <h2>La Zone de Progrès vs Zone Rouge</h2>
        <p>
          <strong>Zone de Progrès (ACWR 0,8-1,3) :</strong>
        </p>
        <ul>
          <li>Adaptation optimale</li>
          <li>Faible risque de blessure</li>
          <li>Amélioration constante</li>
          <li>Durable à long terme</li>
        </ul>

        <p>
          <strong>Zone Rouge (ACWR {'>'} 1,5) :</strong>
        </p>
        <ul>
          <li>Risque élevé de blessure</li>
          <li>Accumulation de fatigue</li>
          <li>Rendements diminués</li>
          <li>Non durable</li>
        </ul>

        <p>
          L'objectif est de rester dans la zone de progrès. Quand vous dérivez
          vers la zone rouge, réagissez tôt : réduisez la charge et ajoutez de
          la récupération avant que les problèmes n'arrivent.
        </p>

        <h2>Exemple Concret</h2>
        <p>
          Sarah voulait augmenter son volume hebdomadaire de 40km à 60km sur 8
          semaines. Trop vite :
        </p>
        <ul>
          <li>Semaine 1 : 40km</li>
          <li>Semaine 2 : 50km (25% d'augmentation—trop)</li>
          <li>Semaine 3 : 55km</li>
          <li>Semaine 4 : 60km (ACWR = 1,6—zone rouge)</li>
          <li>Semaine 5 : Blessée</li>
        </ul>

        <p>Avec des paliers progressifs et des semaines de décharge :</p>
        <ul>
          <li>Semaine 1 : 40km</li>
          <li>Semaine 2 : 42km (5% d'augmentation)</li>
          <li>Semaine 3 : 44km (5% d'augmentation)</li>
          <li>Semaine 4 : 35km (semaine de décharge)</li>
          <li>Semaine 5 : 46km (reprendre progression)</li>
          <li>Semaine 6 : 48km</li>
          <li>Semaine 7 : 50km</li>
          <li>Semaine 8 : 40km (semaine de décharge)</li>
          <li>Semaine 9 : 52km (continuer construction)</li>
        </ul>

        <p>
          Résultat : Sarah a atteint 60km/semaine en sécurité sur 12 semaines au
          lieu de 4, sans blessures et avec une progression constante.
        </p>

        <h2>En Résumé</h2>
        <p>
          La surcharge progressive est essentielle, mais elle doit être gérée
          intelligemment. Trop rapide = blessure. Trop lent = stagnation. La
          zone idéale nécessite :
        </p>
        <ul>
          <li>Augmentations graduelles (5-10% par semaine)</li>
          <li>Semaines de décharge régulières</li>
          <li>Surveillance ACWR</li>
          <li>Suivi RPE</li>
          <li>Structure de mésocycle</li>
        </ul>

        <p>
          OpenAthlete ne prend pas ces décisions à votre place, mais il met les
          éléments côte à côte : charge hebdomadaire face à une fourchette
          recommandée, forme, fatigue et fraîcheur projetées sur votre plan, RPE
          de chaque séance et blocs d'entraînement dans la vue saison. Vous ou
          votre coach décidez, chiffres sous les yeux.
        </p>

        <p>
          <strong>
            Arrêtez de deviner, commencez à vous entraîner avec l'IA dès
            aujourd'hui.
          </strong>{' '}
          <a href="https://app.openathlete.org/auth/create-account">
            Inscrivez-vous sur OpenAthlete
          </a>{' '}
          et voyez votre montée en charge avant de la courir, pour progresser
          sans vous casser.
        </p>
      </div>
    );
  },
  ContentEs: () => {
    return (
      <div>
        <p>
          <strong>
            Quieres ser más rápido. Así que entrenas más fuerte. Semana 1: 40
            km. Semana 2: 50 km. Semana 3: 60 km. Semana 4: estás lesionado.
            ¿Qué ha fallado?
          </strong>
        </p>

        <p>
          La respuesta: aumentaste la carga demasiado deprisa. La sobrecarga
          progresiva es imprescindible para mejorar, pero hay una forma correcta
          y una incorrecta de aplicarla. La correcta pasa por entender los
          mesociclos, los microciclos y el delicado equilibrio entre progreso y
          riesgo de lesión.
        </p>

        <h2>¿Qué es la sobrecarga progresiva?</h2>
        <p>
          La sobrecarga progresiva es el principio fundamental del
          entrenamiento: para mejorar, tienes que aumentar el estímulo de forma
          gradual. Tu cuerpo se adapta al estrés haciéndose más fuerte, pero
          solo si ese estrés aumenta con cabeza.
        </p>

        <p>
          ¿La dificultad? Si aumentas demasiado despacio, no progresas. Si
          aumentas demasiado deprisa, te lesionas. El punto óptimo está en
          medio: lo bastante progresivo para provocar adaptaciones, pero lo
          bastante controlado para evitar que te rompas.
        </p>

        <h2>Entender los mesociclos y los microciclos</h2>
        <p>El entrenamiento se organiza en ciclos:</p>

        <p>
          <strong>Microciclo (1 semana):</strong> la unidad básica de
          entrenamiento. Suele incluir:
        </p>
        <ul>
          <li>2-3 sesiones duras</li>
          <li>2-3 sesiones suaves o de recuperación</li>
          <li>1-2 días de descanso</li>
        </ul>

        <p>
          <strong>Mesociclo (3-6 semanas):</strong> un bloque de entrenamiento
          con un objetivo concreto:
        </p>
        <ul>
          <li>Construcción de base (mucho volumen, baja intensidad)</li>
          <li>Fase de desarrollo (intensidad creciente)</li>
          <li>Fase de pico (entrenamiento específico para la carrera)</li>
          <li>Fase de recuperación (carga reducida)</li>
        </ul>

        <p>
          La sobrecarga progresiva ocurre dentro de los mesociclos. Cada
          microciclo va un poco más allá que el anterior, pero los mesociclos
          incluyen semanas de recuperación para que el cuerpo se adapte.
        </p>

        <h2>El problema de siempre</h2>
        <p>
          La mayoría de los atletas (y muchos entrenadores) tienen problemas con
          la sobrecarga progresiva porque:
        </p>
        <ul>
          <li>
            <strong>Aumentan demasiado deprisa:</strong> pasan de 40 km a 60 km
            en 3 semanas
          </li>
          <li>
            <strong>No planifican la recuperación:</strong> no hay semanas de
            descarga
          </li>
          <li>
            <strong>Ignoran las señales:</strong> siguen apretando pese a la
            fatiga
          </li>
          <li>
            <strong>No controlan la carga:</strong> no hay seguimiento del ACWR
          </li>
        </ul>

        <p>¿El resultado? Lesiones, agotamiento y progresos estancados.</p>

        <h2>Cómo gestionar la sobrecarga progresiva</h2>
        <p>
          Cuatro hábitos resuelven casi todo, y OpenAthlete reúne las cifras de
          cada uno en un mismo sitio:
        </p>

        <p>
          <strong>1. Sube la carga poco a poco</strong>
        </p>
        <p>
          Limita los aumentos a un 5-10 % por semana, con una semana de descarga
          cada 3-4 semanas. En OpenAthlete, el resumen semanal muestra la carga
          hecha y planificada frente a un rango recomendado, así que un salto se
          ve antes de correrlo.
        </p>

        <p>
          <strong>2. Vigila la carga aguda y crónica</strong>
        </p>
        <p>
          El ratio de carga aguda:crónica (ACWR) compara la última semana con el
          último mes, más o menos. OpenAthlete sigue la misma idea con la forma
          (CTL, 42 días), la fatiga (ATL, 7 días) y el estado de forma (TSB),
          proyectados sobre tus sesiones planificadas. Cuando la fatiga sube muy
          por encima de la forma, toca aflojar. La aplicación muestra hacia
          dónde va el plan; no reduce la carga por ti.
        </p>

        <p>
          <strong>3. Planifica los mesociclos</strong>
        </p>
        <p>
          Organiza el entrenamiento en mesociclos con fases claras (en
          OpenAthlete, como bloques en la vista de temporada):
        </p>
        <ul>
          <li>Semanas 1-3: fase de desarrollo (carga creciente)</li>
          <li>Semana 4: semana de descarga (carga reducida para asimilar)</li>
          <li>Semanas 5-7: fase de desarrollo (se retoma la progresión)</li>
          <li>Semana 8: semana de descarga</li>
        </ul>

        <p>
          Este patrón se repite y garantiza un progreso constante sin
          sobrecarga.
        </p>

        <p>
          <strong>4. Ajusta según el RPE</strong>
        </p>
        <p>
          Anota tu RPE después de cada sesión (o responde a las breves preguntas
          posactividad, de las que la IA lo extrae). Si tu RPE se mantiene
          elevado, reduce la carga aunque el volumen parezca «seguro» sobre el
          papel. Así frena la sobrecarga excesiva antes de que se convierta en
          sobreentrenamiento.
        </p>

        <h2>Zona de progreso frente a zona roja</h2>
        <p>
          <strong>Zona de progreso (ACWR 0,8-1,3):</strong>
        </p>
        <ul>
          <li>Adaptación óptima</li>
          <li>Riesgo de lesión bajo</li>
          <li>Mejora constante</li>
          <li>Sostenible a largo plazo</li>
        </ul>

        <p>
          <strong>Zona roja (ACWR {'>'} 1,5):</strong>
        </p>
        <ul>
          <li>Riesgo de lesión alto</li>
          <li>Acumulación de fatiga</li>
          <li>Rendimientos decrecientes</li>
          <li>Insostenible</li>
        </ul>

        <p>
          El objetivo es quedarse en la zona de progreso. Cuando te desvías
          hacia la zona roja, actúa pronto: reduce la carga y añade recuperación
          antes de que aparezcan los problemas.
        </p>

        <h2>Un ejemplo real</h2>
        <p>
          Sarah quería pasar de 40 km a 60 km semanales en 8 semanas. Demasiado
          rápido:
        </p>
        <ul>
          <li>Semana 1: 40 km</li>
          <li>Semana 2: 50 km (un 25 % más, demasiado)</li>
          <li>Semana 3: 55 km</li>
          <li>Semana 4: 60 km (ACWR = 1,6, zona roja)</li>
          <li>Semana 5: lesionada</li>
        </ul>

        <p>Con aumentos graduales y semanas de descarga:</p>
        <ul>
          <li>Semana 1: 40 km</li>
          <li>Semana 2: 42 km (un 5 % más)</li>
          <li>Semana 3: 44 km (un 5 % más)</li>
          <li>Semana 4: 35 km (semana de descarga)</li>
          <li>Semana 5: 46 km (se retoma la progresión)</li>
          <li>Semana 6: 48 km</li>
          <li>Semana 7: 50 km</li>
          <li>Semana 8: 40 km (semana de descarga)</li>
          <li>Semana 9: 52 km (sigue la construcción)</li>
        </ul>

        <p>
          Resultado: Sarah llegó a 60 km por semana de forma segura en 12
          semanas en lugar de 4, sin lesiones y con un progreso constante.
        </p>

        <h2>En resumen</h2>
        <p>
          La sobrecarga progresiva es imprescindible, pero hay que gestionarla
          con cabeza. Demasiado rápido = lesión. Demasiado lento =
          estancamiento. El punto óptimo requiere:
        </p>
        <ul>
          <li>Aumentos graduales (5-10 % por semana)</li>
          <li>Semanas de descarga periódicas</li>
          <li>Seguimiento del ACWR</li>
          <li>Control del RPE</li>
          <li>Una estructura por mesociclos</li>
        </ul>

        <p>
          OpenAthlete no toma estas decisiones por ti, pero pone las piezas una
          junto a otra: carga semanal frente a un rango recomendado, forma,
          fatiga y estado de forma proyectados sobre tu plan, RPE de cada sesión
          y bloques de entrenamiento en la vista de temporada. Tú o tu
          entrenador decidís con las cifras delante.
        </p>

        <p>
          <strong>Deja de adivinar y empieza hoy a entrenar con IA.</strong>{' '}
          <a href="https://app.openathlete.org/auth/create-account">
            Regístrate en OpenAthlete
          </a>{' '}
          y mira cómo sube tu carga antes de correrla, para mejorar sin
          romperte.
        </p>
      </div>
    );
  },
};
