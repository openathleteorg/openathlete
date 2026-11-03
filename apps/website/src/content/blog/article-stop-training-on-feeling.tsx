import type { BlogPost } from './types';

export const articleStopTrainingOnFeeling: BlogPost = {
  metadata: {
    slug: 'stop-training-on-feeling-the-wrong-kind',
    title: {
      en: 'Stop Training on "Feeling" (The Wrong Kind)',
      fr: 'Arrêtez de Vous Entraîner sur le "Ressenti" (Le Mauvais Type)',
      es: 'Deja de entrenar según «cómo te sientes» (en el mal sentido)',
    },
    description: {
      en: 'Listening to your body is not the same as training on mood. How to tell them apart, and how a structured plan on your watch keeps you consistent.',
      fr: "Écouter son corps n'est pas s'entraîner selon l'humeur. Comment faire la différence, et pourquoi un plan structuré sur votre montre vous rend régulier.",
      es: 'Escuchar a tu cuerpo no es entrenar según el humor. Cómo distinguir ambas cosas y por qué un plan estructurado en tu reloj te ayuda a ser constante.',
    },
    excerpt: {
      en: 'There\'s a difference between listening to your body and training randomly. Structured training with discipline beats "feeling-based" workouts every time.',
      fr: 'Il y a une différence entre écouter votre corps et s\'entraîner aléatoirement. L\'entraînement structuré avec discipline bat les entraînements "basés sur le ressenti" à chaque fois.',
      es: 'Escuchar a tu cuerpo no es lo mismo que entrenar al azar. El entrenamiento estructurado y con disciplina gana siempre a las sesiones «según cómo te sientas».',
    },
    author: {
      name: 'OpenAthlete Team',
      email: 'contact@openathlete.org',
    },
    publishedAt: '2025-03-10',
    tags: [
      'Structure Training',
      'Personalized Plan',
      'Running Progress',
      'Training Discipline',
    ],
    readingTime: 7,
    image:
      'https://images.unsplash.com/photo-1435527173128-983b87201f4d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4NDE1NDF8MHwxfHNlYXJjaHwxfHxzdHJ1Y3R1cmVkJTIwdHJhaW5pbmclMjBjYWxlbmRhciUyMHNjaGVkdWxlJTIwcGxhbiUyMGRpc2NpcGxpbmV8ZW58MHwwfHx8MTc2NTI4NzM4MHww&ixlib=rb-4.1.0&q=80&w=1080',
  },
  ContentEn: () => {
    return (
      <div>
        <p>
          <strong>
            You wake up. You feel great. You decide to push hard today—maybe a
            tempo run, maybe some intervals. Tomorrow you feel tired, so you
            skip it. Next day you feel okay, so you do an easy run. Three weeks
            later, you're wondering why you're not making progress.
          </strong>
        </p>

        <p>
          This is "feeling-based" training—and it's holding you back. There's a
          crucial difference between listening to your body (which is essential)
          and training randomly based on daily mood (which is ineffective).
          Understanding this difference is the key to consistent progress.
        </p>

        <h2>The Two Types of "Feeling"</h2>
        <p>
          <strong>Good "Feeling" (Listening to Your Body):</strong>
        </p>
        <ul>
          <li>Recognizing when you're overtrained and need rest</li>
          <li>Adjusting intensity when you're genuinely fatigued</li>
          <li>Modifying sessions based on recovery status</li>
          <li>Responding to injury signals</li>
        </ul>

        <p>
          <strong>Bad "Feeling" (Random Training):</strong>
        </p>
        <ul>
          <li>Training hard because you "feel like it"</li>
          <li>Skipping sessions because you "don't feel like it"</li>
          <li>Changing plans based on daily mood</li>
          <li>No structure, no progression, no plan</li>
        </ul>

        <p>
          The difference? Good feeling is <strong>responsive</strong>—you adjust
          within a structure. Bad feeling is <strong>reactive</strong>—you
          abandon structure entirely.
        </p>

        <h2>Why Random Training Fails</h2>
        <p>Random training feels good in the moment, but it fails because:</p>
        <ul>
          <li>
            <strong>No progressive overload:</strong> You're not systematically
            increasing stress
          </li>
          <li>
            <strong>No periodization:</strong> You're not building toward
            specific goals
          </li>
          <li>
            <strong>No recovery planning:</strong> You're not optimizing
            adaptation
          </li>
          <li>
            <strong>No consistency:</strong> You're not building habits
          </li>
          <li>
            <strong>No measurement:</strong> You can't track what's working
          </li>
        </ul>

        <p>
          You might have great individual sessions, but without structure, those
          sessions don't compound into long-term progress. You're essentially
          spinning your wheels—working hard but going nowhere.
        </p>

        <h2>The Power of Structure</h2>
        <p>Structured training works because it:</p>
        <ul>
          <li>
            <strong>Ensures progression:</strong> Each week builds on the last
          </li>
          <li>
            <strong>Balances stress and recovery:</strong> Hard days followed by
            easy days
          </li>
          <li>
            <strong>Builds toward goals:</strong> Every session has a purpose
          </li>
          <li>
            <strong>Creates habits:</strong> Consistency becomes automatic
          </li>
          <li>
            <strong>Enables measurement:</strong> You can track what works
          </li>
        </ul>

        <p>
          When you have a structured plan, you know exactly what to do each day.
          No decision fatigue. No guesswork. Just execution.
        </p>

        <h2>The Discipline of Structure</h2>
        <p>
          Here's the uncomfortable truth: progress requires discipline.
          Discipline means:
        </p>
        <ul>
          <li>Following your plan even when you don't "feel like it"</li>
          <li>Doing easy runs when you want to go hard</li>
          <li>Resting when you feel like training</li>
          <li>Trusting the process over immediate feelings</li>
        </ul>

        <p>
          This doesn't mean ignoring your body. It means having a plan and
          adjusting within that plan based on real signals (fatigue, injury
          risk, recovery status), not mood.
        </p>

        <h2>How OpenAthlete Bridges the Gap</h2>
        <p>OpenAthlete solves this by providing structure with flexibility:</p>
        <ul>
          <li>
            <strong>Structured plans:</strong> Build sessions in the workout
            builder, start from the free plan generator, or have Claude or
            ChatGPT plan a block through the MCP server
          </li>
          <li>
            <strong>Easy adjustments:</strong> Drag a session to another day,
            shift a week, or mark an illness period and move the sessions it
            covers
          </li>
          <li>
            <strong>Watch integration:</strong> Structured workouts go straight
            to your Garmin, Suunto or COROS
          </li>
          <li>
            <strong>RPE monitoring:</strong> Tracks how sessions feel relative
            to targets
          </li>
          <li>
            <strong>Recovery in view:</strong> Sleep, HRV, resting heart rate
            and form next to each day, so you adjust on signals, not mood
          </li>
        </ul>

        <p>
          You get the discipline of structure with the flexibility to adapt.
          You're not locked into a rigid plan, but you're also not training
          randomly.
        </p>

        <h2>The Watch Integration Advantage</h2>
        <p>
          When your training plan syncs directly to your watch, something
          powerful happens:
        </p>
        <ul>
          <li>
            <strong>No decision fatigue:</strong> Your watch tells you exactly
            what to do
          </li>
          <li>
            <strong>No excuses:</strong> The plan is right there, ready to
            execute
          </li>
          <li>
            <strong>Proper pacing:</strong> Your watch guides you to correct
            intensities
          </li>
          <li>
            <strong>Consistency:</strong> You follow the plan because it's
            convenient
          </li>
        </ul>

        <p>
          Instead of waking up and deciding "what should I do today?", you wake
          up and execute. The decision is already made. The structure is already
          there. You just follow it.
        </p>

        <h2>Real-World Example</h2>
        <p>
          Mark was a "feeling-based" trainer. He'd run hard when he felt good,
          skip when he felt tired, and had no real plan. After 6 months, he'd
          made minimal progress.
        </p>

        <p>He switched to OpenAthlete's structured approach:</p>
        <ul>
          <li>
            He generated a 16-week marathon plan on the OpenAthlete website and
            imported it
          </li>
          <li>Plans synced to his Garmin watch</li>
          <li>He followed the plan, even on days he didn't "feel like it"</li>
          <li>He eased off when his RPE stayed high for the same paces</li>
        </ul>

        <p>
          Result: He ran a 20-minute PR in his marathon. The structure worked.
          The discipline paid off. The "feeling" was replaced with data-driven
          decisions.
        </p>

        <h2>The Bottom Line</h2>
        <p>
          There's a place for listening to your body—when you're genuinely
          fatigued, when you're injured, when recovery is compromised. But
          there's no place for random, mood-based training.
        </p>

        <p>
          Progress requires structure. Structure requires discipline. Discipline
          means following a plan even when you don't feel like it—and adjusting
          that plan intelligently when your body gives real signals, not just
          mood swings.
        </p>

        <p>
          Don't confuse "listening to your body" with "training randomly." One
          leads to progress. The other leads to stagnation.
        </p>

        <p>
          <strong>Stop guessing, start training with AI today.</strong>{' '}
          <a href="https://app.openathlete.org/auth/create-account">
            Sign up for OpenAthlete
          </a>{' '}
          and build a structured plan that lands on your Garmin, Suunto or COROS
          watch, so it's ready even on days you don't "feel like it."
        </p>
      </div>
    );
  },
  ContentFr: () => {
    return (
      <div>
        <p>
          <strong>
            Vous vous réveillez. Vous vous sentez bien. Vous décidez de pousser
            fort aujourd'hui—peut-être une sortie au seuil, peut-être des
            intervalles. Demain vous vous sentez fatigué, donc vous le sautez.
            Le jour suivant vous vous sentez bien, donc vous faites une sortie
            en endurance. Trois semaines plus tard, vous vous demandez pourquoi
            vous ne progressez pas.
          </strong>
        </p>

        <p>
          C'est l'entraînement "basé sur le ressenti"—et cela vous retient. Il y
          a une différence cruciale entre écouter votre corps (ce qui est
          essentiel) et s'entraîner aléatoirement basé sur l'humeur quotidienne
          (ce qui est inefficace). Comprendre cette différence est la clé d'une
          progression constante.
        </p>

        <h2>Les Deux Types de "Ressenti"</h2>
        <p>
          <strong>Bon "Ressenti" (Écouter Votre Corps) :</strong>
        </p>
        <ul>
          <li>
            Reconnaître quand vous êtes en surentraînement et avez besoin de
            repos
          </li>
          <li>Ajuster l'intensité quand vous êtes vraiment fatigué</li>
          <li>Modifier les séances basées sur le statut de récupération</li>
          <li>Répondre aux signaux de blessure</li>
        </ul>

        <p>
          <strong>Mauvais "Ressenti" (Entraînement Aléatoire) :</strong>
        </p>
        <ul>
          <li>S'entraîner dur parce que vous en "avez envie"</li>
          <li>Sauter des séances parce que vous "n'en avez pas envie"</li>
          <li>Changer les plans basés sur l'humeur quotidienne</li>
          <li>Pas de structure, pas de progression, pas de plan</li>
        </ul>

        <p>
          La différence ? Le bon ressenti est <strong>réactif</strong>—vous
          ajustez dans une structure. Le mauvais ressenti est{' '}
          <strong>impulsif</strong>—vous abandonnez complètement la structure.
        </p>

        <h2>Pourquoi l'Entraînement Aléatoire Échoue</h2>
        <p>
          L'entraînement aléatoire semble bien sur le moment, mais il échoue
          parce que :
        </p>
        <ul>
          <li>
            <strong>Pas de surcharge progressive :</strong> Vous n'augmentez pas
            systématiquement le stress
          </li>
          <li>
            <strong>Pas de périodisation :</strong> Vous ne construisez pas vers
            des objectifs spécifiques
          </li>
          <li>
            <strong>Pas de planification de récupération :</strong> Vous
            n'optimisez pas l'adaptation
          </li>
          <li>
            <strong>Pas de cohérence :</strong> Vous ne construisez pas
            d'habitudes
          </li>
          <li>
            <strong>Pas de mesure :</strong> Vous ne pouvez pas suivre ce qui
            fonctionne
          </li>
        </ul>

        <p>
          Vous pourriez avoir d'excellentes séances individuelles, mais sans
          structure, ces séances ne se composent pas en progrès à long terme.
          Vous tournez essentiellement en rond—travaillant dur mais n'allant
          nulle part.
        </p>

        <h2>Le Pouvoir de la Structure</h2>
        <p>L'entraînement structuré fonctionne parce qu'il :</p>
        <ul>
          <li>
            <strong>Assure la progression :</strong> Chaque semaine construit
            sur la précédente
          </li>
          <li>
            <strong>Équilibre stress et récupération :</strong> Jours durs
            suivis de jours faciles
          </li>
          <li>
            <strong>Construit vers les objectifs :</strong> Chaque séance a un
            but
          </li>
          <li>
            <strong>Crée des habitudes :</strong> La cohérence devient
            automatique
          </li>
          <li>
            <strong>Permet la mesure :</strong> Vous pouvez suivre ce qui
            fonctionne
          </li>
        </ul>

        <p>
          Quand vous avez un plan structuré, vous savez exactement quoi faire
          chaque jour. Pas de fatigue décisionnelle. Pas de suppositions. Juste
          l'exécution.
        </p>

        <h2>La Discipline de la Structure</h2>
        <p>
          Voici la vérité inconfortable : le progrès nécessite de la discipline.
          La discipline signifie :
        </p>
        <ul>
          <li>Suivre votre plan même quand vous "n'en avez pas envie"</li>
          <li>Faire des sorties en endurance quand vous voulez pousser fort</li>
          <li>Vous reposer quand vous avez envie de vous entraîner</li>
          <li>
            Faire confiance au processus plutôt qu'aux sentiments immédiats
          </li>
        </ul>

        <p>
          Cela ne signifie pas ignorer votre corps. Cela signifie avoir un plan
          et ajuster dans ce plan basé sur de vrais signaux (fatigue, risque de
          blessure, statut de récupération), pas l'humeur.
        </p>

        <h2>Comment OpenAthlete Comble l'Écart</h2>
        <p>
          OpenAthlete résout cela en fournissant une structure avec flexibilité
          :
        </p>
        <ul>
          <li>
            <strong>Plans structurés :</strong> Construisez vos séances avec
            l'éditeur, partez du générateur de plans gratuit, ou faites
            planifier un bloc par Claude ou ChatGPT via le serveur MCP
          </li>
          <li>
            <strong>Ajustements simples :</strong> Glissez une séance sur un
            autre jour, décalez une semaine, ou déclarez une période de maladie
            et déplacez les séances concernées
          </li>
          <li>
            <strong>Intégration montre :</strong> Les séances structurées
            partent directement sur votre Garmin, Suunto ou COROS
          </li>
          <li>
            <strong>Surveillance RPE :</strong> Suit comment les séances se
            sentent par rapport aux cibles
          </li>
          <li>
            <strong>Récupération sous les yeux :</strong> Sommeil, VFC,
            fréquence cardiaque de repos et forme à côté de chaque jour, pour
            ajuster selon des signaux et non l'humeur
          </li>
        </ul>

        <p>
          Vous obtenez la discipline de la structure avec la flexibilité de vous
          adapter. Vous n'êtes pas enfermé dans un plan rigide, mais vous ne
          vous entraînez pas non plus aléatoirement.
        </p>

        <h2>L'Avantage de l'Intégration Montre</h2>
        <p>
          Quand votre plan d'entraînement se synchronise directement sur votre
          montre, quelque chose de puissant se produit :
        </p>
        <ul>
          <li>
            <strong>Pas de fatigue décisionnelle :</strong> Votre montre vous
            dit exactement quoi faire
          </li>
          <li>
            <strong>Pas d'excuses :</strong> Le plan est là, prêt à être exécuté
          </li>
          <li>
            <strong>Allure appropriée :</strong> Votre montre vous guide vers
            les bonnes intensités
          </li>
          <li>
            <strong>Cohérence :</strong> Vous suivez le plan parce que c'est
            pratique
          </li>
        </ul>

        <p>
          Au lieu de vous réveiller et décider "que devrais-je faire aujourd'hui
          ?", vous vous réveillez et exécutez. La décision est déjà prise. La
          structure est déjà là. Vous suivez juste.
        </p>

        <h2>Exemple Concret</h2>
        <p>
          Mark était un entraîneur "basé sur le ressenti". Il courait fort quand
          il se sentait bien, sautait quand il se sentait fatigué, et n'avait
          pas de vrai plan. Après 6 mois, il avait fait des progrès minimes.
        </p>

        <p>Il est passé à l'approche structurée d'OpenAthlete :</p>
        <ul>
          <li>
            Il a généré un plan marathon de 16 semaines sur le site
            d'OpenAthlete et l'a importé
          </li>
          <li>Les plans se synchronisaient sur sa montre Garmin</li>
          <li>
            Il suivait le plan, même les jours où il "n'en avait pas envie"
          </li>
          <li>
            Il levait le pied quand son RPE restait élevé aux mêmes allures
          </li>
        </ul>

        <p>
          Résultat : Il a couru un PR de 20 minutes sur son marathon. La
          structure a fonctionné. La discipline a payé. Le "ressenti" a été
          remplacé par des décisions basées sur les données.
        </p>

        <h2>En Résumé</h2>
        <p>
          Il y a une place pour écouter votre corps—quand vous êtes vraiment
          fatigué, quand vous êtes blessé, quand la récupération est compromise.
          Mais il n'y a pas de place pour l'entraînement aléatoire basé sur
          l'humeur.
        </p>

        <p>
          Le progrès nécessite une structure. La structure nécessite de la
          discipline. La discipline signifie suivre un plan même quand vous n'en
          avez pas envie—et ajuster ce plan intelligemment quand votre corps
          donne de vrais signaux, pas juste des sautes d'humeur.
        </p>

        <p>
          Ne confondez pas "écouter votre corps" avec "s'entraîner
          aléatoirement." L'un mène au progrès. L'autre mène à la stagnation.
        </p>

        <p>
          <strong>
            Arrêtez de deviner, commencez à vous entraîner avec l'IA dès
            aujourd'hui.
          </strong>{' '}
          <a href="https://app.openathlete.org/auth/create-account">
            Inscrivez-vous sur OpenAthlete
          </a>{' '}
          et construisez un plan structuré qui arrive sur votre montre Garmin,
          Suunto ou COROS, prêt même les jours où vous « n'en avez pas envie ».
        </p>
      </div>
    );
  },
  ContentEs: () => {
    return (
      <div>
        <p>
          <strong>
            Te levantas. Te sientes genial. Decides apretar hoy: quizá un tempo,
            quizá unas series. Mañana estás cansado, así que te lo saltas. Al
            día siguiente te encuentras bien, así que haces un rodaje suave.
            Tres semanas después, te preguntas por qué no progresas.
          </strong>
        </p>

        <p>
          Esto es entrenar «según cómo te sientes», y te está frenando. Hay una
          diferencia clave entre escuchar a tu cuerpo (algo esencial) y entrenar
          al azar según el humor del día (algo ineficaz). Entender esta
          diferencia es la clave para progresar de forma constante.
        </p>

        <h2>Los dos tipos de «sensaciones»</h2>
        <p>
          <strong>Sensaciones buenas (escuchar a tu cuerpo):</strong>
        </p>
        <ul>
          <li>Reconocer cuándo estás sobreentrenado y necesitas descansar</li>
          <li>Ajustar la intensidad cuando estás realmente fatigado</li>
          <li>Modificar las sesiones según tu estado de recuperación</li>
          <li>Responder a las señales de lesión</li>
        </ul>

        <p>
          <strong>Sensaciones malas (entrenar al azar):</strong>
        </p>
        <ul>
          <li>Entrenar fuerte porque «te apetece»</li>
          <li>Saltarte sesiones porque «no te apetece»</li>
          <li>Cambiar los planes según el humor del día</li>
          <li>Sin estructura, sin progresión, sin plan</li>
        </ul>

        <p>
          ¿La diferencia? Las sensaciones buenas son{' '}
          <strong>adaptativas</strong>: ajustas dentro de una estructura. Las
          malas son <strong>impulsivas</strong>: abandonas la estructura por
          completo.
        </p>

        <h2>Por qué falla entrenar al azar</h2>
        <p>Entrenar al azar sienta bien en el momento, pero falla porque:</p>
        <ul>
          <li>
            <strong>No hay sobrecarga progresiva:</strong> no aumentas el
            estímulo de forma sistemática
          </li>
          <li>
            <strong>No hay periodización:</strong> no construyes hacia objetivos
            concretos
          </li>
          <li>
            <strong>No hay planificación de la recuperación:</strong> no
            optimizas la adaptación
          </li>
          <li>
            <strong>No hay constancia:</strong> no creas hábitos
          </li>
          <li>
            <strong>No hay medición:</strong> no puedes saber qué funciona
          </li>
        </ul>

        <p>
          Puede que tengas grandes sesiones sueltas, pero sin estructura esas
          sesiones no se suman en un progreso a largo plazo. En el fondo, estás
          dando vueltas en círculo: trabajas duro, pero no avanzas.
        </p>

        <h2>El poder de la estructura</h2>
        <p>El entrenamiento estructurado funciona porque:</p>
        <ul>
          <li>
            <strong>Garantiza la progresión:</strong> cada semana se apoya en la
            anterior
          </li>
          <li>
            <strong>Equilibra estímulo y recuperación:</strong> días duros
            seguidos de días suaves
          </li>
          <li>
            <strong>Construye hacia tus objetivos:</strong> cada sesión tiene un
            propósito
          </li>
          <li>
            <strong>Crea hábitos:</strong> la constancia se vuelve automática
          </li>
          <li>
            <strong>Permite medir:</strong> puedes ver qué funciona
          </li>
        </ul>

        <p>
          Con un plan estructurado sabes exactamente qué hacer cada día. Sin
          fatiga de decisión. Sin conjeturas. Solo ejecutar.
        </p>

        <h2>La disciplina de la estructura</h2>
        <p>
          Esta es la verdad incómoda: progresar exige disciplina. Disciplina
          significa:
        </p>
        <ul>
          <li>Seguir tu plan incluso cuando «no te apetece»</li>
          <li>Hacer rodajes suaves cuando lo que quieres es apretar</li>
          <li>Descansar cuando te apetece entrenar</li>
          <li>
            Confiar en el proceso por encima de las sensaciones del momento
          </li>
        </ul>

        <p>
          Esto no significa ignorar a tu cuerpo. Significa tener un plan y
          ajustarlo según señales reales (fatiga, riesgo de lesión, estado de
          recuperación), no según el humor.
        </p>

        <h2>Cómo OpenAthlete cubre esa distancia</h2>
        <p>OpenAthlete lo resuelve ofreciéndote estructura con flexibilidad:</p>
        <ul>
          <li>
            <strong>Planes estructurados:</strong> crea tus sesiones con el
            editor, parte del generador de planes gratuito o haz que Claude o
            ChatGPT planifiquen un bloque mediante el servidor MCP
          </li>
          <li>
            <strong>Ajustes sencillos:</strong> arrastra una sesión a otro día,
            desplaza una semana o marca un periodo de enfermedad y mueve las
            sesiones afectadas
          </li>
          <li>
            <strong>Integración con el reloj:</strong> los entrenamientos
            estructurados llegan directamente a tu Garmin, Suunto o COROS
          </li>
          <li>
            <strong>Seguimiento del RPE:</strong> registra cómo sientes las
            sesiones en comparación con los objetivos
          </li>
          <li>
            <strong>La recuperación a la vista:</strong> sueño, VFC, frecuencia
            cardíaca en reposo y forma junto a cada día, para ajustar según
            señales y no según el humor
          </li>
        </ul>

        <p>
          Consigues la disciplina de la estructura con la flexibilidad de
          adaptarte. No quedas atado a un plan rígido, pero tampoco entrenas al
          azar.
        </p>

        <h2>La ventaja de la integración con el reloj</h2>
        <p>
          Cuando tu plan de entrenamiento se sincroniza directamente con tu
          reloj, ocurre algo poderoso:
        </p>
        <ul>
          <li>
            <strong>Sin fatiga de decisión:</strong> tu reloj te dice
            exactamente qué hacer
          </li>
          <li>
            <strong>Sin excusas:</strong> el plan está ahí, listo para
            ejecutarlo
          </li>
          <li>
            <strong>Ritmo adecuado:</strong> tu reloj te guía hacia las
            intensidades correctas
          </li>
          <li>
            <strong>Constancia:</strong> sigues el plan porque es cómodo
          </li>
        </ul>

        <p>
          En lugar de levantarte y preguntarte «¿qué hago hoy?», te levantas y
          ejecutas. La decisión ya está tomada. La estructura ya está ahí. Solo
          tienes que seguirla.
        </p>

        <h2>Un ejemplo real</h2>
        <p>
          Mark entrenaba «según cómo se sentía». Corría fuerte cuando se
          encontraba bien, se saltaba sesiones cuando estaba cansado y no tenía
          un plan de verdad. Al cabo de 6 meses, apenas había progresado.
        </p>

        <p>Se pasó al enfoque estructurado de OpenAthlete:</p>
        <ul>
          <li>
            Generó un plan de maratón de 16 semanas en la web de OpenAthlete y
            lo importó
          </li>
          <li>Los planes se sincronizaban con su reloj Garmin</li>
          <li>Siguió el plan, incluso los días en que «no le apetecía»</li>
          <li>Aflojaba cuando su RPE se mantenía alto a los mismos ritmos</li>
        </ul>

        <p>
          Resultado: bajó 20 minutos su marca personal en maratón. La estructura
          funcionó. La disciplina dio sus frutos. Las «sensaciones» dieron paso
          a decisiones basadas en datos.
        </p>

        <h2>En resumen</h2>
        <p>
          Escuchar a tu cuerpo tiene su lugar: cuando estás realmente fatigado,
          cuando te lesionas, cuando tu recuperación se resiente. Pero no hay
          lugar para entrenar al azar según el humor.
        </p>

        <p>
          Progresar exige estructura. La estructura exige disciplina. Y la
          disciplina significa seguir un plan aunque no te apetezca, y ajustarlo
          con inteligencia cuando tu cuerpo da señales reales, no simples
          cambios de humor.
        </p>

        <p>
          No confundas «escuchar a tu cuerpo» con «entrenar al azar». Lo uno
          lleva al progreso. Lo otro, al estancamiento.
        </p>

        <p>
          <strong>Deja de adivinar y empieza hoy a entrenar con IA.</strong>{' '}
          <a href="https://app.openathlete.org/auth/create-account">
            Regístrate en OpenAthlete
          </a>{' '}
          y crea un plan estructurado que llega a tu reloj Garmin, Suunto o
          COROS, listo incluso los días en que «no te apetece».
        </p>
      </div>
    );
  },
};
