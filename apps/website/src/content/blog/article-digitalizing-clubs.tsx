import type { BlogPost } from './types';

export const articleDigitalizingClubs: BlogPost = {
  metadata: {
    slug: 'digitalizing-your-sports-club-centralize-to-conquer',
    title: {
      en: 'Digitalizing Your Sports Club: Centralize to Conquer',
      fr: 'Digitaliser votre Club Sportif : Centraliser pour Conquérir',
      es: 'Digitaliza tu club deportivo: centraliza para ganar',
    },
    description: {
      en: 'Lost paper plans, mixed levels, 50 members to follow: how a club can move training online with session templates, shared calendars and coach alerts.',
      fr: "Plans papier perdus, niveaux hétérogènes, 50 membres à suivre : comment passer l'entraînement de votre club en ligne avec modèles et calendriers.",
      es: 'Planes en papel perdidos, niveles dispares, 50 miembros que seguir: cómo pasar el entrenamiento de tu club a internet con plantillas y calendarios.',
    },
    excerpt: {
      en: 'Sports clubs struggle with lost plans, level disparities, and individual monitoring. Learn how digital platforms centralize training while maintaining individual attention.',
      fr: "Les clubs sportifs luttent avec les plans perdus, les disparités de niveau et le suivi individuel. Découvrez comment les plateformes numériques centralisent l'entraînement tout en maintenant l'attention individuelle.",
      es: 'Los clubes deportivos lidian con planes perdidos, niveles dispares y un seguimiento individual imposible. Descubre cómo una plataforma digital centraliza el entrenamiento sin perder la atención personalizada.',
    },
    author: {
      name: 'OpenAthlete Team',
      email: 'contact@openathlete.org',
    },
    publishedAt: '2025-04-01',
    tags: [
      'Sports Club Management Software',
      'Triathlon Club Platform',
      'Group Training',
      'Club Management',
    ],
    readingTime: 7,
    image:
      'https://images.unsplash.com/photo-1625990637351-ee0e5e9ba5e5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4NDE1NDF8MHwxfHNlYXJjaHwxfHxzcG9ydHMlMjBjbHViJTIwdGVhbSUyMHRyYWluaW5nJTIwZ3JvdXAlMjBtYW5hZ2VtZW50JTIwb3JnYW5pemF0aW9ufGVufDB8MHx8fDE3NjUyODczNzh8MA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  ContentEn: () => {
    return (
      <div>
        <p>
          <strong>
            Your triathlon club has 50 members. You print training plans for
            three groups: Beginners, Intermediate, Elite. Two weeks later, half
            the members have lost their plans. The other half are asking for
            adjustments. You're drowning in paper and questions.
          </strong>
        </p>

        <p>
          This is the reality for most sports clubs. Managing group training
          while addressing individual needs is a constant challenge. Paper plans
          get lost. Members at different levels need different guidance.
          Individual monitoring becomes impossible at scale.
        </p>

        <h2>The Club Management Challenge</h2>
        <p>Sports clubs face unique challenges:</p>
        <ul>
          <li>
            <strong>Lost plans:</strong> Paper documents disappear
          </li>
          <li>
            <strong>Level disparity:</strong> Beginners and elites need
            different plans
          </li>
          <li>
            <strong>Individual monitoring:</strong> Can't track 50 athletes
            manually
          </li>
          <li>
            <strong>Communication:</strong> Updates don't reach everyone
          </li>
          <li>
            <strong>Consistency:</strong> Hard to ensure everyone follows the
            plan
          </li>
        </ul>

        <p>
          Traditional solutions (paper plans, group emails, Excel spreadsheets)
          don't scale. They create more problems than they solve.
        </p>

        <h2>The Digital Solution</h2>
        <p>
          OpenAthlete has no club or group entity yet, but its coaching tools
          cover much of the job:
        </p>

        <p>
          <strong>Template Plans:</strong>
        </p>
        <ul>
          <li>Save sessions as templates in a "Beginners" folder</li>
          <li>Do the same for "Intermediate"</li>
          <li>And for "Elite"</li>
          <li>
            Drag templates onto each member's calendar, copy whole weeks, and
            move or copy several sessions at once
          </li>
          <li>
            Planned sessions reach members' Garmin, Suunto or COROS watches
            automatically
          </li>
        </ul>

        <p>
          <strong>Individual Monitoring:</strong>
        </p>
        <ul>
          <li>Track each member's completion</li>
          <li>Monitor RPE and recovery</li>
          <li>See reported pain and inactivity on the coach dashboard</li>
          <li>Let several coaches follow the same member</li>
        </ul>

        <p>
          <strong>Centralized Communication:</strong>
        </p>
        <ul>
          <li>Group conversations reach everyone you add</li>
          <li>Group discussions stay organized</li>
          <li>Individual feedback is contextual</li>
        </ul>

        <h2>A Typical Setup</h2>
        <p>
          Picture a triathlon club with 60 members across three levels. The
          usual problems:
        </p>
        <ul>
          <li>Lost paper plans</li>
          <li>Members asking "what should I do today?"</li>
          <li>No visibility into who was training</li>
          <li>Injury concerns going unnoticed</li>
        </ul>

        <p>With OpenAthlete, a realistic setup looks like this:</p>
        <ul>
          <li>
            Each coach follows their own members (5 on the free plan, unlimited
            with Supporter)
          </li>
          <li>Template sessions dropped onto each member's calendar</li>
          <li>Sessions synced to members' watches</li>
          <li>Coaches check completion rates</li>
          <li>Reported pain and inactivity show up on the coach dashboard</li>
          <li>Individual adjustments made easily</li>
        </ul>

        <p>
          What you get: no lost plans, a clear view of who trains, and pain
          reports that reach a coach. What it doesn't do yet: a club-wide
          dashboard, or assigning a session to a whole group in one click.
        </p>

        <h2>The Bottom Line</h2>
        <p>
          Digitalizing your club doesn't mean losing personal touch—it means
          scaling personal attention. Template plans ensure consistency.
          Individual monitoring ensures safety. Centralized communication
          ensures clarity.
        </p>

        <p>
          <strong>Stop guessing, start training with AI today.</strong>{' '}
          <a href="https://app.openathlete.org/auth/create-account">
            Sign up for OpenAthlete
          </a>{' '}
          and see how its coaching tools can work for your club without losing
          individual attention.
        </p>
      </div>
    );
  },
  ContentFr: () => {
    return (
      <div>
        <p>
          <strong>
            Votre club de triathlon a 50 membres. Vous imprimez des plans
            d'entraînement pour trois groupes : Débutants, Intermédiaires,
            Elite. Deux semaines plus tard, la moitié des membres ont perdu
            leurs plans. L'autre moitié demande des ajustements. Vous vous noyez
            dans le papier et les questions.
          </strong>
        </p>

        <p>
          C'est la réalité pour la plupart des clubs sportifs. Gérer
          l'entraînement de groupe tout en répondant aux besoins individuels est
          un défi constant. Les plans papier se perdent. Les membres à
          différents niveaux ont besoin de conseils différents. Le suivi
          individuel devient impossible à grande échelle.
        </p>

        <h2>Le Défi de la Gestion de Club</h2>
        <p>Les clubs sportifs font face à des défis uniques :</p>
        <ul>
          <li>
            <strong>Plans perdus :</strong> Les documents papier disparaissent
          </li>
          <li>
            <strong>Disparité de niveau :</strong> Les débutants et les élites
            ont besoin de plans différents
          </li>
          <li>
            <strong>Suivi individuel :</strong> Impossible de suivre 50 athlètes
            manuellement
          </li>
          <li>
            <strong>Communication :</strong> Les mises à jour n'atteignent pas
            tout le monde
          </li>
          <li>
            <strong>Cohérence :</strong> Difficile d'assurer que tout le monde
            suit le plan
          </li>
        </ul>

        <p>
          Les solutions traditionnelles (plans papier, emails de groupe,
          feuilles de calcul Excel) ne s'adaptent pas. Elles créent plus de
          problèmes qu'elles n'en résolvent.
        </p>

        <h2>La Solution Numérique</h2>
        <p>
          OpenAthlete n'a pas encore de notion de club ou de groupe, mais ses
          outils de coaching couvrent une bonne partie du travail :
        </p>

        <p>
          <strong>Plans Modèles :</strong>
        </p>
        <ul>
          <li>Enregistrer des séances modèles dans un dossier "Débutants"</li>
          <li>Faire de même pour "Intermédiaires"</li>
          <li>Et pour "Elite"</li>
          <li>
            Glisser les modèles dans le calendrier de chaque membre, copier des
            semaines entières, déplacer ou copier plusieurs séances à la fois
          </li>
          <li>
            Les séances planifiées arrivent automatiquement sur les montres
            Garmin, Suunto ou COROS des membres
          </li>
        </ul>

        <p>
          <strong>Suivi Individuel :</strong>
        </p>
        <ul>
          <li>Suivre la complétion de chaque membre</li>
          <li>Surveiller RPE et récupération</li>
          <li>
            Voir les douleurs signalées et l'inactivité dans le tableau de bord
            coach
          </li>
          <li>Permettre à plusieurs coachs de suivre le même membre</li>
        </ul>

        <p>
          <strong>Communication Centralisée :</strong>
        </p>
        <ul>
          <li>
            Les conversations de groupe touchent toutes les personnes ajoutées
          </li>
          <li>Les discussions de groupe restent organisées</li>
          <li>Les retours individuels sont contextuels</li>
        </ul>

        <h2>Une Organisation Type</h2>
        <p>
          Prenons un club de triathlon de 60 membres répartis sur trois niveaux.
          Les problèmes habituels :
        </p>
        <ul>
          <li>Plans papier perdus</li>
          <li>Membres demandant "que devrais-je faire aujourd'hui ?"</li>
          <li>Aucune visibilité sur qui s'entraînait</li>
          <li>Préoccupations de blessure non remarquées</li>
        </ul>

        <p>Avec OpenAthlete, une organisation réaliste ressemble à ceci :</p>
        <ul>
          <li>
            Chaque coach suit ses propres membres (5 avec l'offre gratuite, sans
            limite avec Supporter)
          </li>
          <li>
            Des séances modèles déposées dans le calendrier de chaque membre
          </li>
          <li>Des séances synchronisées sur les montres des membres</li>
          <li>Des coachs qui suivent les taux de réalisation</li>
          <li>
            Les douleurs signalées et l'inactivité visibles dans le tableau de
            bord coach
          </li>
          <li>Des ajustements individuels faciles</li>
        </ul>

        <p>
          Ce que vous y gagnez : plus de plans perdus, une vue claire de qui
          s'entraîne, et des douleurs signalées qui arrivent jusqu'à un coach.
          Ce que l'outil ne fait pas encore : un tableau de bord à l'échelle du
          club, ou l'envoi d'une séance à tout un groupe en un clic.
        </p>

        <h2>En Résumé</h2>
        <p>
          Digitaliser votre club ne signifie pas perdre le contact
          personnel—cela signifie faire évoluer l'attention personnelle. Les
          plans modèles assurent la cohérence. Le suivi individuel assure la
          sécurité. La communication centralisée assure la clarté.
        </p>

        <p>
          <strong>
            Arrêtez de deviner, commencez à vous entraîner avec l'IA dès
            aujourd'hui.
          </strong>{' '}
          <a href="https://app.openathlete.org/auth/create-account">
            Inscrivez-vous sur OpenAthlete
          </a>{' '}
          et voyez comment ses outils de coaching peuvent servir votre club sans
          sacrifier l'attention individuelle.
        </p>
      </div>
    );
  },
  ContentEs: () => {
    return (
      <div>
        <p>
          <strong>
            Tu club de triatlón tiene 50 miembros. Imprimes planes de
            entrenamiento para tres grupos: principiantes, intermedios y élite.
            Dos semanas después, la mitad de los miembros ha perdido su plan. La
            otra mitad te pide ajustes. Te ahogas entre papeles y preguntas.
          </strong>
        </p>

        <p>
          Esta es la realidad de la mayoría de los clubes deportivos. Gestionar
          el entrenamiento en grupo y, a la vez, atender las necesidades de cada
          persona es un reto constante. Los planes en papel se pierden. Los
          miembros de distintos niveles necesitan orientaciones distintas. Y el
          seguimiento individual se vuelve imposible cuando el grupo crece.
        </p>

        <h2>El reto de gestionar un club</h2>
        <p>Los clubes deportivos se enfrentan a retos muy particulares:</p>
        <ul>
          <li>
            <strong>Planes perdidos:</strong> los documentos en papel
            desaparecen
          </li>
          <li>
            <strong>Niveles dispares:</strong> principiantes y élite necesitan
            planes diferentes
          </li>
          <li>
            <strong>Seguimiento individual:</strong> no se puede seguir a mano a
            50 atletas
          </li>
          <li>
            <strong>Comunicación:</strong> las novedades no llegan a todo el
            mundo
          </li>
          <li>
            <strong>Constancia:</strong> cuesta asegurarse de que todos siguen
            el plan
          </li>
        </ul>

        <p>
          Las soluciones tradicionales (planes en papel, correos al grupo, hojas
          de cálculo de Excel) no escalan. Crean más problemas de los que
          resuelven.
        </p>

        <h2>La solución digital</h2>
        <p>
          OpenAthlete todavía no tiene una entidad de club o de grupo, pero sus
          herramientas de entrenador cubren buena parte del trabajo:
        </p>

        <p>
          <strong>Planes plantilla:</strong>
        </p>
        <ul>
          <li>
            Guarda sesiones como plantillas en una carpeta «Principiantes»
          </li>
          <li>Haz lo mismo para «Intermedios»</li>
          <li>Y para «Élite»</li>
          <li>
            Arrastra las plantillas al calendario de cada miembro, copia semanas
            enteras y mueve o copia varias sesiones a la vez
          </li>
          <li>
            Las sesiones planificadas llegan automáticamente a los relojes
            Garmin, Suunto o COROS de los miembros
          </li>
        </ul>

        <p>
          <strong>Seguimiento individual:</strong>
        </p>
        <ul>
          <li>Comprueba qué sesiones completa cada miembro</li>
          <li>Vigila el RPE y la recuperación</li>
          <li>
            Ve el dolor indicado y la inactividad en el panel del entrenador
          </li>
          <li>Permite que varios entrenadores sigan al mismo miembro</li>
        </ul>

        <p>
          <strong>Comunicación centralizada:</strong>
        </p>
        <ul>
          <li>
            Las conversaciones de grupo llegan a todas las personas añadidas
          </li>
          <li>Las conversaciones de grupo siguen ordenadas</li>
          <li>Los comentarios individuales llegan con su contexto</li>
        </ul>

        <h2>Una organización tipo</h2>
        <p>
          Imagina un club de triatlón con 60 miembros repartidos en tres
          niveles. Los problemas habituales:
        </p>
        <ul>
          <li>Planes en papel perdidos</li>
          <li>Miembros preguntando «¿qué me toca hoy?»</li>
          <li>Ninguna visibilidad sobre quién entrenaba</li>
          <li>Señales de lesión que pasaban desapercibidas</li>
        </ul>

        <p>Con OpenAthlete, una organización realista sería así:</p>
        <ul>
          <li>
            Cada entrenador sigue a sus propios miembros (5 con el plan
            gratuito, sin límite con Supporter)
          </li>
          <li>Sesiones plantilla en el calendario de cada miembro</li>
          <li>Sesiones sincronizadas con los relojes de los miembros</li>
          <li>Los entrenadores siguen el grado de cumplimiento</li>
          <li>El dolor indicado y la inactividad aparecen en el panel</li>
          <li>Los ajustes individuales se hacen sin esfuerzo</li>
        </ul>

        <p>
          Lo que ganas: ningún plan perdido, una visión clara de quién entrena y
          un dolor indicado que llega a un entrenador. Lo que todavía no hace:
          un panel a escala de club o asignar una sesión a todo un grupo con un
          clic.
        </p>

        <h2>En resumen</h2>
        <p>
          Digitalizar tu club no significa perder el trato personal: significa
          poder ofrecer atención personal a más gente. Los planes plantilla
          garantizan la coherencia. El seguimiento individual garantiza la
          seguridad. La comunicación centralizada garantiza la claridad.
        </p>

        <p>
          <strong>Deja de adivinar y empieza hoy a entrenar con IA.</strong>{' '}
          <a href="https://app.openathlete.org/auth/create-account">
            Regístrate en OpenAthlete
          </a>{' '}
          y descubre cómo sus herramientas de entrenador pueden servir a tu club
          sin renunciar a la atención individual.
        </p>
      </div>
    );
  },
};
