import type { BlogPost } from './types';

export const articlePreppingForGoal: BlogPost = {
  metadata: {
    slug: 'prepping-for-a-goal-adapting-when-life-happens',
    title: {
      en: 'Prepping for a Goal: Adapting When Life Happens',
      fr: "Préparer un Objectif : S'Adapter quand la Vie Arrive",
      es: 'Preparar un objetivo: adaptarse cuando la vida se cruza',
    },
    description: {
      en: "Missed Tuesday's tempo run? How to move key sessions around work, travel and illness without losing sight of your marathon, with a worked example.",
      fr: "Séance au seuil ratée mardi ? Comment replacer les séances clés autour du travail, des voyages ou d'une maladie sans perdre de vue votre marathon.",
      es: '¿Te saltaste el tempo del martes? Cómo recolocar las sesiones clave en torno al trabajo, los viajes o una enfermedad sin perder de vista tu maratón.',
    },
    excerpt: {
      en: 'Life happens. Meetings, travel, illness. Rigid training plans break when reality intervenes. A plan in a calendar can bend instead: move the key sessions, drop an easy one, keep the goal.',
      fr: "La vie arrive. Réunions, voyages, maladie. Les plans d'entraînement rigides se cassent quand la réalité intervient. Un plan dans un calendrier, lui, se déplace : on garde les séances clés, on sacrifie un footing, et l'objectif reste en vue.",
      es: 'La vida pasa: reuniones, viajes, enfermedades. Los planes de entrenamiento rígidos se rompen en cuanto la realidad se impone. Un plan en un calendario, en cambio, se puede mover: conservas las sesiones clave, sacrificas un rodaje suave y mantienes el objetivo.',
    },
    author: {
      name: 'OpenAthlete Team',
      email: 'contact@openathlete.org',
    },
    publishedAt: '2025-03-25',
    tags: [
      'Work Life Sport Balance',
      'Adapting Training Plan',
      'Flexible Training',
      'Goal Preparation',
    ],
    readingTime: 7,
    image:
      'https://images.unsplash.com/photo-1645822937278-5e84025713f3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4NDE1NDF8MHwxfHNlYXJjaHwxfHxtYXJhdGhvbiUyMGZpbmlzaCUyMGxpbmUlMjBnb2FsJTIwYWNoaWV2ZW1lbnQlMjB0YXJnZXQlMjByYWNlfGVufDB8MHx8fDE3NjUyODczODF8MA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  ContentEn: () => {
    return (
      <div>
        <p>
          <strong>
            You're 6 weeks into a 16-week marathon plan. Tuesday was supposed to
            be a tempo run, but you had a work emergency. Wednesday was supposed
            to be easy, but you're traveling. Thursday's long run? You're
            exhausted from the week. Your PDF plan is now useless.
          </strong>
        </p>

        <p>
          This is the reality of training for goals: life happens. Work, travel,
          family, illness—they all interfere with even the best-laid plans. The
          question isn't whether your plan will be disrupted. The question is:
          how do you adapt when it is?
        </p>

        <h2>The Rigid Plan Problem</h2>
        <p>Traditional training plans are static documents:</p>
        <ul>
          <li>
            Week 1: Monday tempo, Wednesday easy, Friday intervals, Sunday long
          </li>
          <li>
            Week 2: Monday tempo, Wednesday easy, Friday intervals, Sunday long
          </li>
          <li>Week 3: (Same pattern)</li>
        </ul>

        <p>
          When you miss a session, the plan doesn't adapt. You're left guessing:
        </p>
        <ul>
          <li>Do I skip it?</li>
          <li>Do I move it to tomorrow?</li>
          <li>Do I double up?</li>
          <li>How does this affect the rest of the week?</li>
          <li>Am I still on track for my goal?</li>
        </ul>

        <p>
          Without answers, you either abandon the plan or train incorrectly.
          Both lead to suboptimal results.
        </p>

        <h2>A Plan That Can Move</h2>
        <p>
          The fix isn't a smarter PDF. It's a plan that lives in a calendar you
          can rearrange. In OpenAthlete:
        </p>

        <p>
          <strong>When you miss a session:</strong>
        </p>
        <ul>
          <li>
            Drag it to another day, or shift the rest of the week by a day (with
            undo)
          </li>
          <li>
            Keep the key sessions (hard workouts, long run) and drop an easy run
            instead
          </li>
          <li>
            Check the weekly summary: load done and planned against a
            recommended range
          </li>
          <li>
            Look at your projected form (TSB) for the coming days before you
            commit
          </li>
        </ul>

        <p>
          <strong>When you're traveling:</strong>
        </p>
        <ul>
          <li>Draw a Travel, Illness or Injury period on the calendar</li>
          <li>
            OpenAthlete offers to move the sessions it covers to after the
            period, or to delete them
          </li>
          <li>Changes reach your Garmin, Suunto or COROS watch</li>
        </ul>

        <p>
          <strong>When you're fatigued:</strong>
        </p>
        <ul>
          <li>
            Your RPE, sleep, HRV, resting heart rate and Hooper index sit next
            to each day
          </li>
          <li>
            After each activity, a few questions let the AI note your effort and
            any pain; your coach sees reported pain
          </li>
          <li>
            You or your coach decide to cut intensity or add a rest day: the
            plan doesn't rewrite itself
          </li>
        </ul>

        <p>
          If you'd rather not shuffle sessions by hand, connect Claude or
          ChatGPT to OpenAthlete through its MCP server and ask it to adapt the
          week. It reads your calendar and load, proposes changes, and writes
          them to your calendar.
        </p>

        <h2>Real-World Example</h2>
        <p>Mark was 8 weeks into marathon training. Original plan:</p>
        <ul>
          <li>Monday: Rest</li>
          <li>Tuesday: Tempo run (critical)</li>
          <li>Wednesday: Easy run</li>
          <li>Thursday: Intervals (critical)</li>
          <li>Friday: Easy run</li>
          <li>Saturday: Rest</li>
          <li>Sunday: Long run (critical)</li>
        </ul>

        <p>
          Reality: Tuesday work emergency, Thursday travel, Friday exhausted.
        </p>

        <p>
          <strong>Without replanning:</strong> Mark would skip Tuesday, try to
          do intervals Wednesday (wrong day), skip Thursday, skip Friday, and
          attempt long run Sunday (exhausted). Result: Poor week, lost fitness,
          demotivated.
        </p>

        <p>
          <strong>
            Replanned in OpenAthlete (by Mark, his coach, or an assistant
            through MCP):
          </strong>
        </p>
        <ul>
          <li>Tuesday: Skipped (work emergency)</li>
          <li>Wednesday: Tempo run moved here (critical session preserved)</li>
          <li>Thursday: Travel-friendly easy run (maintains volume)</li>
          <li>Friday: Rest (recovery from travel)</li>
          <li>Saturday: Intervals moved here (critical session preserved)</li>
          <li>Sunday: Long run adjusted to 80% (accounts for fatigue)</li>
        </ul>

        <p>
          Result: Mark completed all critical sessions, maintained training
          load, stayed on track for his goal. The plan adapted to reality
          instead of breaking.
        </p>

        <h2>The Goal Preservation</h2>
        <p>
          The key insight: good replanning preserves your goals. When life
          disrupts your plan, you don't abandon the goal. You find a new path to
          reach it.
        </p>

        <p>Consider your marathon goal. The critical elements are:</p>
        <ul>
          <li>Total training volume over 16 weeks</li>
          <li>Key workout completion (tempo, intervals, long runs)</li>
          <li>Progressive overload pattern</li>
          <li>Proper taper before race</li>
        </ul>

        <p>
          When you miss a Tuesday tempo run, the question isn't "goal failed?"
          It's "how do we preserve these critical elements despite the
          disruption?" Answer that, move the sessions, and keep moving toward
          your goal.
        </p>

        <h2>The Flexibility Advantage</h2>
        <p>Dynamic rescheduling provides:</p>
        <ul>
          <li>
            <strong>Stress reduction:</strong> No guilt about missed sessions
          </li>
          <li>
            <strong>Consistency:</strong> Training continues despite disruptions
          </li>
          <li>
            <strong>Optimization:</strong> Plans adapt to your actual life
          </li>
          <li>
            <strong>Goal achievement:</strong> You reach targets despite
            obstacles
          </li>
        </ul>

        <p>
          Instead of abandoning plans when life happens, you adapt and continue.
          This is the difference between successful and unsuccessful goal
          achievement.
        </p>

        <h2>The Bottom Line</h2>
        <p>
          Life will disrupt your training. That's not a question—it's a
          certainty. The question is: do you have a plan that adapts, or one
          that breaks?
        </p>

        <p>
          Rigid PDF plans break when reality intervenes. A plan in a calendar
          bends: you move the key sessions, keep an eye on load, and stay on
          track toward your goal, even when life happens.
        </p>

        <p>
          Don't let a missed Tuesday derail your marathon goal. Don't let travel
          destroy your training consistency. Don't let fatigue force you to
          abandon your plan.
        </p>

        <p>
          <strong>Stop guessing, start training with AI today.</strong>{' '}
          <a href="https://app.openathlete.org/auth/create-account">
            Sign up for OpenAthlete
          </a>{' '}
          and plan in a calendar that moves with your week, no matter what life
          throws at you.
        </p>
      </div>
    );
  },
  ContentFr: () => {
    return (
      <div>
        <p>
          <strong>
            Vous êtes à 6 semaines d'un plan marathon de 16 semaines. Mardi
            était censé être une sortie au seuil, mais vous avez eu une urgence
            au travail. Mercredi était censé être facile, mais vous voyagez. La
            sortie longue de jeudi ? Vous êtes épuisé de la semaine. Votre plan
            PDF est maintenant inutile.
          </strong>
        </p>

        <p>
          C'est la réalité de l'entraînement pour les objectifs : la vie arrive.
          Le travail, les voyages, la famille, la maladie—ils interfèrent tous
          avec même les meilleurs plans. La question n'est pas de savoir si
          votre plan sera perturbé. La question est : comment vous adaptez-vous
          quand c'est le cas ?
        </p>

        <h2>Le Problème du Plan Rigide</h2>
        <p>
          Les plans d'entraînement traditionnels sont des documents statiques :
        </p>
        <ul>
          <li>
            Semaine 1 : Lundi seuil, Mercredi facile, Vendredi intervalles,
            Dimanche long
          </li>
          <li>
            Semaine 2 : Lundi seuil, Mercredi facile, Vendredi intervalles,
            Dimanche long
          </li>
          <li>Semaine 3 : (Même modèle)</li>
        </ul>

        <p>
          Quand vous manquez une séance, le plan ne s'adapte pas. Vous êtes
          laissé à deviner :
        </p>
        <ul>
          <li>Est-ce que je la saute ?</li>
          <li>Est-ce que je la déplace à demain ?</li>
          <li>Est-ce que je double ?</li>
          <li>Comment cela affecte-t-il le reste de la semaine ?</li>
          <li>Suis-je toujours sur la voie pour mon objectif ?</li>
        </ul>

        <p>
          Sans réponses, vous abandonnez soit le plan soit vous vous entraînez
          incorrectement. Les deux mènent à des résultats sous-optimaux.
        </p>

        <h2>Un Plan qui se Déplace</h2>
        <p>
          La solution n'est pas un PDF plus malin. C'est un plan rangé dans un
          calendrier que vous pouvez réorganiser. Dans OpenAthlete :
        </p>

        <p>
          <strong>Quand vous manquez une séance :</strong>
        </p>
        <ul>
          <li>
            Glissez-la sur un autre jour, ou décalez le reste de la semaine d'un
            jour (avec annulation possible)
          </li>
          <li>
            Gardez les séances clés (séances dures, sortie longue) et sacrifiez
            plutôt un footing
          </li>
          <li>
            Consultez le résumé hebdomadaire : charge réalisée et prévue face à
            une fourchette recommandée
          </li>
          <li>
            Regardez votre forme projetée (TSB) sur les jours à venir avant de
            trancher
          </li>
        </ul>

        <p>
          <strong>Quand vous voyagez :</strong>
        </p>
        <ul>
          <li>
            Tracez une période Voyage, Maladie ou Blessure sur le calendrier
          </li>
          <li>
            OpenAthlete propose de reporter les séances concernées après la
            période, ou de les supprimer
          </li>
          <li>
            Les modifications arrivent sur votre montre Garmin, Suunto ou COROS
          </li>
        </ul>

        <p>
          <strong>Quand vous êtes fatigué :</strong>
        </p>
        <ul>
          <li>
            Votre RPE, votre sommeil, votre VFC, votre fréquence cardiaque de
            repos et votre indice de Hooper s'affichent à côté de chaque jour
          </li>
          <li>
            Après chaque activité, quelques questions permettent à l'IA de noter
            votre effort et vos éventuelles douleurs ; votre coach voit les
            douleurs signalées
          </li>
          <li>
            C'est vous ou votre coach qui décidez de baisser l'intensité ou
            d'ajouter un jour de repos : le plan ne se réécrit pas tout seul
          </li>
        </ul>

        <p>
          Si vous préférez ne pas déplacer les séances à la main, connectez
          Claude ou ChatGPT à OpenAthlete via son serveur MCP et demandez-lui
          d'adapter la semaine. Il lit votre calendrier et votre charge, propose
          des changements et les inscrit dans votre calendrier.
        </p>

        <h2>Exemple Concret</h2>
        <p>Mark était à 8 semaines d'entraînement marathon. Plan original :</p>
        <ul>
          <li>Lundi : Repos</li>
          <li>Mardi : Sortie au seuil (critique)</li>
          <li>Mercredi : Sortie facile</li>
          <li>Jeudi : Intervalles (critique)</li>
          <li>Vendredi : Sortie facile</li>
          <li>Samedi : Repos</li>
          <li>Dimanche : Sortie longue (critique)</li>
        </ul>

        <p>Réalité : Urgence travail mardi, voyage jeudi, épuisé vendredi.</p>

        <p>
          <strong>Sans replanification :</strong> Mark sauterait mardi,
          essaierait de faire intervalles mercredi (mauvais jour), sauterait
          jeudi, sauterait vendredi, et tenterait sortie longue dimanche
          (épuisé). Résultat : Mauvaise semaine, forme perdue, démotivé.
        </p>

        <p>
          <strong>
            Replanifié dans OpenAthlete (par Mark, son coach ou un assistant via
            MCP) :
          </strong>
        </p>
        <ul>
          <li>Mardi : Sauté (urgence travail)</li>
          <li>
            Mercredi : Sortie au seuil déplacée ici (séance critique préservée)
          </li>
          <li>Jeudi : Sortie facile adaptée aux voyages (maintient volume)</li>
          <li>Vendredi : Repos (récupération du voyage)</li>
          <li>Samedi : Intervalles déplacés ici (séance critique préservée)</li>
          <li>
            Dimanche : Sortie longue ajustée à 80% (tient compte de la fatigue)
          </li>
        </ul>

        <p>
          Résultat : Mark a complété toutes les séances critiques, maintenu la
          charge d'entraînement, resté sur la voie pour son objectif. Le plan
          s'est adapté à la réalité au lieu de se casser.
        </p>

        <h2>La Préservation de l'Objectif</h2>
        <p>
          L'idée clé : bien replanifier préserve vos objectifs. Quand la vie
          perturbe votre plan, vous n'abandonnez pas l'objectif : vous trouvez
          un autre chemin pour l'atteindre.
        </p>

        <p>Considérez votre objectif marathon. Les éléments critiques sont :</p>
        <ul>
          <li>Volume total d'entraînement sur 16 semaines</li>
          <li>
            Complétion des entraînements clés (seuil, intervalles, sorties
            longues)
          </li>
          <li>Modèle de surcharge progressive</li>
          <li>Affûtage approprié avant la course</li>
        </ul>

        <p>
          Quand vous manquez une sortie au seuil mardi, la question n'est pas «
          objectif raté ? » mais « comment préserver ces éléments critiques
          malgré l'imprévu ? ». Répondez-y, déplacez les séances, et continuez
          d'avancer vers votre objectif.
        </p>

        <h2>L'Avantage de la Flexibilité</h2>
        <p>Le rééchelonnement dynamique fournit :</p>
        <ul>
          <li>
            <strong>Réduction du stress :</strong> Pas de culpabilité sur les
            séances manquées
          </li>
          <li>
            <strong>Cohérence :</strong> L'entraînement continue malgré les
            perturbations
          </li>
          <li>
            <strong>Optimisation :</strong> Les plans s'adaptent à votre vie
            réelle
          </li>
          <li>
            <strong>Réalisation d'objectif :</strong> Vous atteignez les cibles
            malgré les obstacles
          </li>
        </ul>

        <p>
          Au lieu d'abandonner les plans quand la vie arrive, vous vous adaptez
          et continuez. C'est la différence entre la réalisation d'objectif
          réussie et non réussie.
        </p>

        <h2>En Résumé</h2>
        <p>
          La vie perturbera votre entraînement. Ce n'est pas une question—c'est
          une certitude. La question est : avez-vous un plan qui s'adapte, ou un
          qui se casse ?
        </p>

        <p>
          Les plans PDF rigides se cassent quand la réalité intervient. Un plan
          dans un calendrier plie sans rompre : vous déplacez les séances clés,
          vous surveillez la charge et vous gardez le cap sur votre objectif,
          même quand la vie s'en mêle.
        </p>

        <p>
          Ne laissez pas un mardi manqué faire dérailler votre objectif
          marathon. Ne laissez pas les voyages détruire votre cohérence
          d'entraînement. Ne laissez pas la fatigue vous forcer à abandonner
          votre plan.
        </p>

        <p>
          <strong>
            Arrêtez de deviner, commencez à vous entraîner avec l'IA dès
            aujourd'hui.
          </strong>{' '}
          <a href="https://app.openathlete.org/auth/create-account">
            Inscrivez-vous sur OpenAthlete
          </a>{' '}
          et planifiez dans un calendrier qui suit votre semaine, quoi que la
          vie vous réserve.
        </p>
      </div>
    );
  },
  ContentEs: () => {
    return (
      <div>
        <p>
          <strong>
            Llevas 6 semanas de un plan de maratón de 16. El martes tocaba un
            rodaje a ritmo tempo, pero tuviste una urgencia en el trabajo. El
            miércoles tocaba rodaje suave, pero estás de viaje. ¿La tirada larga
            del jueves? Estás agotado de toda la semana. Tu plan en PDF ya no
            sirve para nada.
          </strong>
        </p>

        <p>
          Esta es la realidad de entrenar para un objetivo: la vida se cruza. El
          trabajo, los viajes, la familia, las enfermedades… todo interfiere
          hasta con el plan mejor pensado. La pregunta no es si tu plan se va a
          desbaratar. La pregunta es: ¿cómo te adaptas cuando ocurra?
        </p>

        <h2>El problema de los planes rígidos</h2>
        <p>
          Los planes de entrenamiento tradicionales son documentos estáticos:
        </p>
        <ul>
          <li>
            Semana 1: lunes tempo, miércoles suave, viernes series, domingo
            tirada larga
          </li>
          <li>
            Semana 2: lunes tempo, miércoles suave, viernes series, domingo
            tirada larga
          </li>
          <li>Semana 3: (el mismo patrón)</li>
        </ul>

        <p>
          Cuando te saltas una sesión, el plan no se adapta. Te toca adivinar:
        </p>
        <ul>
          <li>¿Me la salto?</li>
          <li>¿La paso a mañana?</li>
          <li>¿Hago dos sesiones el mismo día?</li>
          <li>¿Cómo afecta esto al resto de la semana?</li>
          <li>¿Sigo en camino de lograr mi objetivo?</li>
        </ul>

        <p>
          Sin respuestas, o abandonas el plan o entrenas mal. Las dos opciones
          llevan a resultados por debajo de lo que podrías lograr.
        </p>

        <h2>Un plan que se puede mover</h2>
        <p>
          La solución no es un PDF más listo. Es un plan que vive en un
          calendario que puedes reorganizar. En OpenAthlete:
        </p>

        <p>
          <strong>Cuando te saltas una sesión:</strong>
        </p>
        <ul>
          <li>
            Arrástrala a otro día, o desplaza el resto de la semana un día (con
            opción de deshacer)
          </li>
          <li>
            Conserva las sesiones clave (entrenamientos duros, tirada larga) y
            sacrifica mejor un rodaje suave
          </li>
          <li>
            Consulta el resumen semanal: carga hecha y planificada frente a un
            rango recomendado
          </li>
          <li>
            Mira tu forma proyectada (TSB) para los próximos días antes de
            decidir
          </li>
        </ul>

        <p>
          <strong>Cuando estás de viaje:</strong>
        </p>
        <ul>
          <li>
            Marca un periodo de Viaje, Enfermedad o Lesión en el calendario
          </li>
          <li>
            OpenAthlete te propone mover las sesiones afectadas a después del
            periodo, o eliminarlas
          </li>
          <li>Los cambios llegan a tu reloj Garmin, Suunto o COROS</li>
        </ul>

        <p>
          <strong>Cuando estás fatigado:</strong>
        </p>
        <ul>
          <li>
            Tu RPE, tu sueño, tu VFC, tu frecuencia cardíaca en reposo y tu
            índice de Hooper aparecen junto a cada día
          </li>
          <li>
            Después de cada actividad, unas preguntas permiten a la IA anotar tu
            esfuerzo y cualquier dolor; tu entrenador ve los dolores reportados
          </li>
          <li>
            Tú o tu entrenador decidís bajar la intensidad o añadir un día de
            descanso: el plan no se reescribe solo
          </li>
        </ul>

        <p>
          Si prefieres no mover las sesiones a mano, conecta Claude o ChatGPT a
          OpenAthlete mediante su servidor MCP y pídele que adapte la semana.
          Lee tu calendario y tu carga, propone cambios y los escribe en tu
          calendario.
        </p>

        <h2>Un ejemplo real</h2>
        <p>Mark llevaba 8 semanas preparando un maratón. Su plan original:</p>
        <ul>
          <li>Lunes: descanso</li>
          <li>Martes: rodaje a ritmo tempo (clave)</li>
          <li>Miércoles: rodaje suave</li>
          <li>Jueves: series (clave)</li>
          <li>Viernes: rodaje suave</li>
          <li>Sábado: descanso</li>
          <li>Domingo: tirada larga (clave)</li>
        </ul>

        <p>
          La realidad: urgencia en el trabajo el martes, viaje el jueves y
          agotamiento el viernes.
        </p>

        <p>
          <strong>Sin replanificar:</strong> Mark se habría saltado el martes,
          habría intentado hacer las series el miércoles (el día equivocado), se
          habría saltado el jueves y el viernes, y habría intentado la tirada
          larga del domingo agotado. Resultado: una mala semana, forma perdida y
          la motivación por los suelos.
        </p>

        <p>
          <strong>
            Replanificado en OpenAthlete (por Mark, su entrenador o un asistente
            vía MCP):
          </strong>
        </p>
        <ul>
          <li>Martes: sesión saltada (urgencia en el trabajo)</li>
          <li>
            Miércoles: el rodaje tempo pasa a este día (sesión clave conservada)
          </li>
          <li>
            Jueves: rodaje suave compatible con el viaje (mantiene el volumen)
          </li>
          <li>Viernes: descanso (recuperación del viaje)</li>
          <li>Sábado: las series pasan a este día (sesión clave conservada)</li>
          <li>
            Domingo: tirada larga ajustada al 80 % (tiene en cuenta la fatiga)
          </li>
        </ul>

        <p>
          Resultado: Mark completó todas las sesiones clave, mantuvo su carga de
          entrenamiento y siguió en camino hacia su objetivo. El plan se adaptó
          a la realidad en lugar de romperse.
        </p>

        <h2>Preservar el objetivo</h2>
        <p>
          La idea clave: replanificar bien preserva tus objetivos. Cuando la
          vida desbarata tu plan, no renuncias al objetivo: buscas otro camino
          para alcanzarlo.
        </p>

        <p>Piensa en tu objetivo de maratón. Los elementos clave son:</p>
        <ul>
          <li>El volumen total de entrenamiento a lo largo de 16 semanas</li>
          <li>
            Completar los entrenamientos clave (tempo, series, tiradas largas)
          </li>
          <li>Un patrón de sobrecarga progresiva</li>
          <li>Una buena puesta a punto antes de la carrera</li>
        </ul>

        <p>
          Cuando te saltas el rodaje tempo del martes, la pregunta no es
          «¿objetivo fallido?», sino «¿cómo preservamos estos elementos clave a
          pesar del imprevisto?». Respóndela, mueve las sesiones y sigue
          avanzando hacia tu objetivo.
        </p>

        <h2>La ventaja de la flexibilidad</h2>
        <p>La reprogramación dinámica te ofrece:</p>
        <ul>
          <li>
            <strong>Menos estrés:</strong> sin culpa por las sesiones perdidas
          </li>
          <li>
            <strong>Constancia:</strong> el entrenamiento continúa pese a los
            imprevistos
          </li>
          <li>
            <strong>Optimización:</strong> los planes se adaptan a tu vida real
          </li>
          <li>
            <strong>Objetivos cumplidos:</strong> alcanzas tus metas pese a los
            obstáculos
          </li>
        </ul>

        <p>
          En lugar de abandonar el plan cuando la vida se cruza, te adaptas y
          sigues adelante. Esa es la diferencia entre lograr un objetivo y
          quedarse a medio camino.
        </p>

        <h2>En resumen</h2>
        <p>
          La vida va a desbaratar tu entrenamiento. No es una posibilidad: es
          una certeza. La pregunta es: ¿tienes un plan que se adapta o uno que
          se rompe?
        </p>

        <p>
          Los planes rígidos en PDF se rompen cuando la realidad se impone. Un
          plan en un calendario se dobla sin romperse: mueves las sesiones
          clave, vigilas la carga y sigues en camino hacia tu objetivo, pase lo
          que pase.
        </p>

        <p>
          No dejes que un martes perdido descarrile tu objetivo de maratón. No
          dejes que los viajes acaben con tu constancia. No dejes que la fatiga
          te obligue a abandonar tu plan.
        </p>

        <p>
          <strong>Deja de adivinar y empieza hoy a entrenar con IA.</strong>{' '}
          <a href="https://app.openathlete.org/auth/create-account">
            Regístrate en OpenAthlete
          </a>{' '}
          y planifica en un calendario que se adapta a tu semana, te ponga la
          vida lo que te ponga por delante.
        </p>
      </div>
    );
  },
};
