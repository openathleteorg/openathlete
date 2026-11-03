import type { BlogPost } from './types';

export const articleHybridCoaching: BlogPost = {
  metadata: {
    slug: 'hybrid-coaching-scaling-your-business-with-ai',
    title: {
      en: 'Hybrid Coaching: Scaling Your Business with AI',
      fr: "Coaching Hybride : Faire Évoluer votre Business avec l'IA",
      es: 'Coaching híbrido: haz crecer tu negocio con IA',
    },
    description: {
      en: 'Stuck at 20 athletes? How to let AI draft the repetitive structure of training plans while you keep strategy, judgment and the relationship.',
      fr: "Bloqué à 20 athlètes ? Comment confier à l'IA la structure répétitive des plans et garder pour vous la stratégie, le jugement et la relation.",
      es: '¿Estancado en 20 atletas? Cómo dejar que la IA prepare la estructura repetitiva de los planes y quedarte con la estrategia, el criterio y la relación.',
    },
    excerpt: {
      en: 'Learn how AI can take on the repetitive planning tasks while coaches focus on strategy and relationships, so you can take on more athletes without sacrificing quality.',
      fr: "Découvrez comment l'IA peut prendre en charge les tâches de planification répétitives pendant que les coachs se concentrent sur la stratégie et les relations, pour suivre plus d'athlètes sans sacrifier la qualité.",
      es: 'Descubre cómo la IA puede encargarse de las tareas repetitivas de planificación mientras los entrenadores se centran en la estrategia y las relaciones, para llevar a más atletas sin sacrificar la calidad.',
    },
    author: {
      name: 'OpenAthlete Team',
      email: 'contact@openathlete.org',
    },
    publishedAt: '2025-02-25',
    tags: [
      'Sports Coaching Business',
      'Scaling Coaching',
      'Training Automation',
      'AI Coaching',
    ],
    readingTime: 8,
    image:
      'https://images.unsplash.com/photo-1728637690589-95077d281c80?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4NDE1NDF8MHwxfHNlYXJjaHwxfHxjb2FjaCUyMG11bHRpcGxlJTIwYXRobGV0ZXMlMjB0ZWFtJTIwc2NhbGluZyUyMGJ1c2luZXNzJTIwZ3Jvd3RofGVufDB8MHx8fDE3NjUyODczNzl8MA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  ContentEn: () => {
    return (
      <div>
        <p>
          <strong>
            You're a great coach. Your athletes get results. Word spreads. More
            athletes want to work with you. But you're already at capacity—20
            athletes, 60+ hours per week. You can't take on more without
            sacrificing quality. So you turn people away. Your business hits a
            ceiling.
          </strong>
        </p>

        <p>
          This is the coaching bottleneck. It's not a lack of demand—it's a lack
          of scalability. Traditional coaching doesn't scale because it's built
          on manual, time-intensive processes. But what if AI could handle the
          repetitive work, freeing you to focus on what only humans can do?
        </p>

        <h2>The 80/20 Rule</h2>
        <p>Let's break down what coaching actually involves:</p>

        <p>
          <strong>The 80% (Repetitive, Data-Driven):</strong>
        </p>
        <ul>
          <li>Calculating training load and volume</li>
          <li>Maintaining periodization structure</li>
          <li>Adjusting plans when sessions are missed</li>
          <li>Analyzing data patterns</li>
          <li>Detecting overtraining signals</li>
          <li>Recalculating weekly schedules</li>
          <li>Syncing plans to athlete devices</li>
        </ul>

        <p>
          <strong>The 20% (Strategic, Human):</strong>
        </p>
        <ul>
          <li>Setting long-term goals and strategy</li>
          <li>Motivating athletes through challenges</li>
          <li>Building relationships and trust</li>
          <li>Understanding context beyond data</li>
          <li>Making judgment calls on edge cases</li>
          <li>Providing emotional support</li>
          <li>Adapting to unique athlete needs</li>
        </ul>

        <p>
          Here's the insight:{' '}
          <strong>AI excels at the 80%. Humans excel at the 20%.</strong> Hybrid
          coaching uses both.
        </p>

        <h2>How Hybrid Coaching Works</h2>
        <p>With OpenAthlete:</p>

        <p>
          <strong>AI handles structure:</strong> Connect Claude or ChatGPT to
          OpenAthlete's MCP server and the assistant reads the athlete's zones,
          load and history, then plans a whole block (up to 60 sessions) into
          their calendar, based on:
        </p>
        <ul>
          <li>Athlete goals and current fitness</li>
          <li>Periodization principles</li>
          <li>Progressive overload rules</li>
          <li>Recovery requirements</li>
          <li>Historical performance data</li>
        </ul>

        <p>
          <strong>Coach adds strategy:</strong> You:
        </p>
        <ul>
          <li>Review and approve AI-generated plans</li>
          <li>Adjust for athlete-specific factors</li>
          <li>Set strategic priorities</li>
          <li>Provide motivation and context</li>
          <li>Make judgment calls when needed</li>
        </ul>

        <p>
          The result? You spend much less time on planning and calculations, and
          you keep the final say on every session.
        </p>

        <h2>The Scaling Math</h2>
        <p>
          <strong>Traditional Coaching (20 athletes):</strong>
        </p>
        <ul>
          <li>60 hours/week total</li>
          <li>48 hours/week on planning/admin (80%)</li>
          <li>12 hours/week on strategy/communication (20%)</li>
          <li>Revenue: 20 athletes × monthly fee</li>
        </ul>

        <p>
          <strong>Hybrid Coaching (50 athletes):</strong>
        </p>
        <ul>
          <li>25 hours/week total</li>
          <li>5 hours/week on planning/admin (AI handles the rest)</li>
          <li>
            20 hours/week on strategy/communication (more time for what matters)
          </li>
          <li>Revenue: 50 athletes × monthly fee</li>
        </ul>

        <p>
          Same quality. 2.5x more athletes. 2.5x more revenue. Less total time.
          That's the power of hybrid coaching.
        </p>

        <h2>Quality Doesn't Suffer—It Improves</h2>
        <p>
          The fear that AI will reduce coaching quality is understandable but
          unfounded. Here's why:
        </p>

        <p>
          <strong>Software removes calculation errors:</strong> Load, volume and
          form are computed from every activity, and fitness and fatigue are
          projected over the planned weeks. Your plans become more consistent,
          not less.
        </p>

        <p>
          <strong>Monitoring runs around the clock:</strong> Every new activity
          gets a short AI read and a few questions for the athlete, and reported
          pain or inactivity shows up on your dashboard before your next
          check-in.
        </p>

        <p>
          <strong>You focus on high-value work:</strong> Instead of spending
          hours calculating weekly volumes, you spend time understanding your
          athletes, building relationships, and making strategic decisions.
        </p>

        <p>
          The result? Athletes get better plans AND better coaching. Quality
          improves, not declines.
        </p>

        <h2>What It Looks Like</h2>
        <p>
          Picture a triathlon coach maxed out at 18 athletes, working 65 hours
          per week, mostly on planning and data entry, and turning away
          potential clients.
        </p>

        <p>With OpenAthlete, the week could look like this:</p>
        <ul>
          <li>
            Claude or ChatGPT, through the MCP server, drafts each athlete's
            next block into their calendar
          </li>
          <li>The coach reviews and adjusts each block</li>
          <li>
            Activities import automatically from Strava, Garmin, Polar, Suunto
            and COROS
          </li>
          <li>
            The coach dashboard flags reported pain, inactivity and unread
            messages
          </li>
          <li>The coach focuses on strategy, motivation, and relationships</li>
        </ul>

        <p>
          How many more athletes that makes room for depends on the coach; we
          have no figures to promise. On OpenAthlete Cloud, coaching more than 5
          athletes needs Supporter (€5/month); a self-hosted instance has no
          limit.
        </p>

        <h2>The Competitive Advantage</h2>
        <p>
          While other coaches are stuck at 20 athletes, you can scale to 50+.
          This gives you:
        </p>
        <ul>
          <li>
            <strong>Pricing power:</strong> You can offer competitive rates
            while maintaining healthy margins
          </li>
          <li>
            <strong>Market dominance:</strong> You can serve more athletes than
            competitors
          </li>
          <li>
            <strong>Business stability:</strong> With 50 athletes, losing 2-3
            doesn't devastate your income
          </li>
          <li>
            <strong>Work-life balance:</strong> You work fewer hours while
            earning more
          </li>
        </ul>

        <p>
          The coaches who adapt to hybrid coaching will dominate the market.
          Those who don't will remain stuck at 20 athletes, watching their
          competitors grow.
        </p>

        <h2>Making the Transition</h2>
        <p>
          Transitioning to hybrid coaching doesn't mean firing yourself. It
          means:
        </p>
        <ol>
          <li>
            <strong>Start with AI-generated plans:</strong> Let AI create the
            structure
          </li>
          <li>
            <strong>Review and adjust:</strong> Add your strategic input
          </li>
          <li>
            <strong>Watch the coach dashboard:</strong> Use its alerts to guide
            your decisions
          </li>
          <li>
            <strong>Focus on relationships:</strong> Spend freed-up time on what
            matters
          </li>
          <li>
            <strong>Gradually scale:</strong> Add athletes as you become
            comfortable
          </li>
        </ol>

        <p>
          Give it a month before judging. By then you'll know which parts of
          your week the tools really take off your plate.
        </p>

        <h2>The Bottom Line</h2>
        <p>
          Hybrid coaching isn't about replacing coaches—it's about amplifying
          them. AI handles the repetitive work you don't want to do anyway. You
          focus on the strategic, human work that creates real value.
        </p>

        <p>
          The question isn't whether hybrid coaching works—it does. The question
          is: how long can you afford to stay stuck at 20 athletes when you
          could be coaching 50+?
        </p>

        <p>
          <strong>Stop guessing, start training with AI today.</strong>{' '}
          <a href="https://app.openathlete.org/auth/create-account">
            Sign up for OpenAthlete
          </a>{' '}
          and discover how hybrid coaching can scale your business while
          improving your athletes' results and your work-life balance.
        </p>
      </div>
    );
  },
  ContentFr: () => {
    return (
      <div>
        <p>
          <strong>
            Vous êtes un excellent coach. Vos athlètes obtiennent des résultats.
            Le bouche-à-oreille se propage. Plus d'athlètes veulent travailler
            avec vous. Mais vous êtes déjà à capacité—20 athlètes, 60+ heures
            par semaine. Vous ne pouvez pas en prendre plus sans sacrifier la
            qualité. Donc vous refusez des gens. Votre entreprise atteint un
            plafond.
          </strong>
        </p>

        <p>
          C'est le goulot d'étranglement du coaching. Ce n'est pas un manque de
          demande—c'est un manque d'évolutivité. Le coaching traditionnel ne
          s'adapte pas parce qu'il est construit sur des processus manuels et
          chronophages. Mais que se passerait-il si l'IA pouvait gérer le
          travail répétitif, vous libérant pour vous concentrer sur ce que seuls
          les humains peuvent faire ?
        </p>

        <h2>La Règle 80/20</h2>
        <p>Décomposons ce que le coaching implique réellement :</p>

        <p>
          <strong>Les 80% (Répétitif, Basé sur les Données) :</strong>
        </p>
        <ul>
          <li>Calculer la charge et le volume d'entraînement</li>
          <li>Maintenir la structure de périodisation</li>
          <li>Ajuster les plans quand les séances sont manquées</li>
          <li>Analyser les modèles de données</li>
          <li>Détecter les signaux de surentraînement</li>
          <li>Recalculer les horaires hebdomadaires</li>
          <li>Synchroniser les plans sur les appareils des athlètes</li>
        </ul>

        <p>
          <strong>Les 20% (Stratégique, Humain) :</strong>
        </p>
        <ul>
          <li>Définir les objectifs et stratégies à long terme</li>
          <li>Motiver les athlètes à travers les défis</li>
          <li>Construire des relations et la confiance</li>
          <li>Comprendre le contexte au-delà des données</li>
          <li>Prendre des décisions sur les cas limites</li>
          <li>Fournir un soutien émotionnel</li>
          <li>S'adapter aux besoins uniques des athlètes</li>
        </ul>

        <p>
          Voici l'idée :{' '}
          <strong>L'IA excelle aux 80%. Les humains excellent aux 20%.</strong>{' '}
          Le coaching hybride exploite les deux.
        </p>

        <h2>Comment Fonctionne le Coaching Hybride</h2>
        <p>Avec OpenAthlete :</p>

        <p>
          <strong>L'IA gère la structure :</strong> Connectez Claude ou ChatGPT
          au serveur MCP d'OpenAthlete : l'assistant lit les zones, la charge et
          l'historique de l'athlète, puis planifie un bloc entier (jusqu'à 60
          séances) dans son calendrier, en s'appuyant sur :
        </p>
        <ul>
          <li>Les objectifs et la forme actuelle de l'athlète</li>
          <li>Les principes de périodisation</li>
          <li>Les règles de surcharge progressive</li>
          <li>Les exigences de récupération</li>
          <li>Les données de performance historiques</li>
        </ul>

        <p>
          <strong>Le coach ajoute la stratégie :</strong> Vous :
        </p>
        <ul>
          <li>Révisez et approuvez les plans générés par l'IA</li>
          <li>Ajustez pour les facteurs spécifiques à l'athlète</li>
          <li>Définissez les priorités stratégiques</li>
          <li>Fournissez motivation et contexte</li>
          <li>Prenez des décisions quand nécessaire</li>
        </ul>

        <p>
          Le résultat ? Vous passez beaucoup moins de temps sur la planification
          et les calculs, et vous gardez le dernier mot sur chaque séance.
        </p>

        <h2>Les Mathématiques de l'Évolutivité</h2>
        <p>
          <strong>Coaching Traditionnel (20 athlètes) :</strong>
        </p>
        <ul>
          <li>60 heures/semaine au total</li>
          <li>48 heures/semaine sur planification/admin (80%)</li>
          <li>12 heures/semaine sur stratégie/communication (20%)</li>
          <li>Revenus : 20 athlètes × frais mensuels</li>
        </ul>

        <p>
          <strong>Coaching Hybride (50 athlètes) :</strong>
        </p>
        <ul>
          <li>25 heures/semaine au total</li>
          <li>5 heures/semaine sur planification/admin (L'IA gère le reste)</li>
          <li>
            20 heures/semaine sur stratégie/communication (plus de temps pour ce
            qui compte)
          </li>
          <li>Revenus : 50 athlètes × frais mensuels</li>
        </ul>

        <p>
          Même qualité. 2,5x plus d'athlètes. 2,5x plus de revenus. Moins de
          temps total. C'est le pouvoir du coaching hybride.
        </p>

        <h2>La Qualité ne Souffre pas—Elle S'Améliore</h2>
        <p>
          La crainte que l'IA réduise la qualité du coaching est compréhensible
          mais infondée. Voici pourquoi :
        </p>

        <p>
          <strong>Le logiciel supprime les erreurs de calcul :</strong> La
          charge, le volume et la forme sont calculés à partir de chaque
          activité, et la forme et la fatigue sont projetées sur les semaines
          planifiées. Vos plans deviennent plus cohérents, pas moins.
        </p>

        <p>
          <strong>Le suivi tourne en continu :</strong> Chaque nouvelle activité
          reçoit une courte lecture par l'IA et quelques questions pour
          l'athlète, et les douleurs signalées ou l'inactivité apparaissent dans
          votre tableau de bord avant votre prochain point.
        </p>

        <p>
          <strong>Vous vous concentrez sur le travail à haute valeur :</strong>{' '}
          Au lieu de passer des heures à calculer les volumes hebdomadaires,
          vous passez du temps à comprendre vos athlètes, construire des
          relations et prendre des décisions stratégiques.
        </p>

        <p>
          Le résultat ? Les athlètes obtiennent de meilleurs plans ET un
          meilleur coaching. La qualité s'améliore, ne décline pas.
        </p>

        <h2>À Quoi Cela Ressemble</h2>
        <p>
          Imaginez une coach de triathlon plafonnée à 18 athlètes, qui travaille
          65 heures par semaine, surtout sur la planification et la saisie de
          données, et qui refuse des clients.
        </p>

        <p>Avec OpenAthlete, sa semaine pourrait ressembler à ceci :</p>
        <ul>
          <li>
            Claude ou ChatGPT, via le serveur MCP, prépare le prochain bloc de
            chaque athlète dans son calendrier
          </li>
          <li>La coach révise et ajuste chaque bloc</li>
          <li>
            Les activités arrivent automatiquement depuis Strava, Garmin, Polar,
            Suunto et COROS
          </li>
          <li>
            Le tableau de bord coach signale les douleurs, l'inactivité et les
            messages non lus
          </li>
          <li>
            La coach se concentre sur la stratégie, la motivation et les
            relations
          </li>
        </ul>

        <p>
          Combien d'athlètes de plus cela permet de suivre dépend de chaque
          coach : nous n'avons pas de chiffres à promettre. Sur OpenAthlete
          Cloud, coacher plus de 5 athlètes demande l'offre Supporter (5 €/mois)
          ; une instance auto-hébergée n'a aucune limite.
        </p>

        <h2>L'Avantage Concurrentiel</h2>
        <p>
          Pendant que d'autres coachs restent bloqués à 20 athlètes, vous pouvez
          passer à 50+. Cela vous donne :
        </p>
        <ul>
          <li>
            <strong>Pouvoir de prix :</strong> Vous pouvez offrir des tarifs
            compétitifs tout en maintenant des marges saines
          </li>
          <li>
            <strong>Dominance du marché :</strong> Vous pouvez servir plus
            d'athlètes que les concurrents
          </li>
          <li>
            <strong>Stabilité de l'entreprise :</strong> Avec 50 athlètes,
            perdre 2-3 ne dévaste pas vos revenus
          </li>
          <li>
            <strong>Équilibre travail-vie :</strong> Vous travaillez moins
            d'heures tout en gagnant plus
          </li>
        </ul>

        <p>
          Les coachs qui s'adaptent au coaching hybride domineront le marché.
          Ceux qui ne le font pas resteront bloqués à 20 athlètes, regardant
          leurs concurrents grandir.
        </p>

        <h2>Faire la Transition</h2>
        <p>
          Passer au coaching hybride ne signifie pas vous licencier. Cela
          signifie :
        </p>
        <ol>
          <li>
            <strong>Commencer avec les plans générés par l'IA :</strong> Laissez
            l'IA créer la structure
          </li>
          <li>
            <strong>Révisez et ajustez :</strong> Ajoutez votre contribution
            stratégique
          </li>
          <li>
            <strong>Suivez le tableau de bord coach :</strong> Servez-vous de
            ses alertes pour guider vos décisions
          </li>
          <li>
            <strong>Concentrez-vous sur les relations :</strong> Passez le temps
            libéré sur ce qui compte
          </li>
          <li>
            <strong>Évoluez progressivement :</strong> Ajoutez des athlètes au
            fur et à mesure que vous devenez à l'aise
          </li>
        </ol>

        <p>
          Laissez-vous un mois avant de juger. Vous saurez alors quelles parties
          de votre semaine les outils vous enlèvent vraiment.
        </p>

        <h2>En Résumé</h2>
        <p>
          Le coaching hybride ne consiste pas à remplacer les coachs—il s'agit
          de les amplifier. L'IA gère le travail répétitif que vous ne voulez
          pas faire de toute façon. Vous vous concentrez sur le travail
          stratégique et humain qui crée une vraie valeur.
        </p>

        <p>
          La question n'est pas de savoir si le coaching hybride fonctionne—il
          le fait. La question est : combien de temps pouvez-vous vous permettre
          de rester bloqué à 20 athlètes quand vous pourriez en coacher 50+ ?
        </p>

        <p>
          <strong>
            Arrêtez de deviner, commencez à vous entraîner avec l'IA dès
            aujourd'hui.
          </strong>{' '}
          <a href="https://app.openathlete.org/auth/create-account">
            Inscrivez-vous sur OpenAthlete
          </a>{' '}
          et découvrez comment le coaching hybride peut faire évoluer votre
          entreprise tout en améliorant les résultats de vos athlètes et votre
          équilibre travail-vie.
        </p>
      </div>
    );
  },
  ContentEs: () => {
    return (
      <div>
        <p>
          <strong>
            Eres un gran entrenador. Tus atletas consiguen resultados. Se corre
            la voz. Cada vez más atletas quieren trabajar contigo. Pero ya estás
            al límite: 20 atletas y más de 60 horas a la semana. No puedes
            aceptar a nadie más sin sacrificar la calidad. Así que rechazas a
            gente. Tu negocio toca techo.
          </strong>
        </p>

        <p>
          Este es el cuello de botella del coaching. No es falta de demanda: es
          falta de escalabilidad. El coaching tradicional no escala porque se
          basa en procesos manuales que consumen mucho tiempo. Pero ¿y si la IA
          pudiera encargarse del trabajo repetitivo y dejarte libre para
          centrarte en lo que solo una persona puede hacer?
        </p>

        <h2>La regla del 80/20</h2>
        <p>Veamos qué implica realmente entrenar a atletas:</p>

        <p>
          <strong>El 80 % (repetitivo, basado en datos):</strong>
        </p>
        <ul>
          <li>Calcular la carga y el volumen de entrenamiento</li>
          <li>Mantener la estructura de periodización</li>
          <li>Ajustar los planes cuando se pierden sesiones</li>
          <li>Analizar patrones en los datos</li>
          <li>Detectar señales de sobreentrenamiento</li>
          <li>Recalcular la planificación semanal</li>
          <li>Sincronizar los planes con los dispositivos de los atletas</li>
        </ul>

        <p>
          <strong>El 20 % (estratégico, humano):</strong>
        </p>
        <ul>
          <li>Fijar los objetivos y la estrategia a largo plazo</li>
          <li>Motivar a los atletas en los momentos difíciles</li>
          <li>Construir relaciones y confianza</li>
          <li>Entender el contexto más allá de los datos</li>
          <li>Decidir con criterio en los casos excepcionales</li>
          <li>Ofrecer apoyo emocional</li>
          <li>Adaptarse a las necesidades particulares de cada atleta</li>
        </ul>

        <p>
          La clave:{' '}
          <strong>
            La IA destaca en el 80 %. Las personas destacan en el 20 %.
          </strong>{' '}
          El coaching híbrido aprovecha ambos.
        </p>

        <h2>Cómo funciona el coaching híbrido</h2>
        <p>Con OpenAthlete:</p>

        <p>
          <strong>La IA se encarga de la estructura:</strong> Conecta Claude o
          ChatGPT al servidor MCP de OpenAthlete y el asistente lee las zonas,
          la carga y el historial del atleta, y planifica un bloque entero
          (hasta 60 sesiones) en su calendario, basándose en:
        </p>
        <ul>
          <li>Los objetivos y la forma actual del atleta</li>
          <li>Los principios de periodización</li>
          <li>Las reglas de sobrecarga progresiva</li>
          <li>Las necesidades de recuperación</li>
          <li>El historial de rendimiento</li>
        </ul>

        <p>
          <strong>El entrenador aporta la estrategia:</strong> Tú:
        </p>
        <ul>
          <li>Revisas y apruebas los planes generados por la IA</li>
          <li>Ajustas según los factores propios de cada atleta</li>
          <li>Fijas las prioridades estratégicas</li>
          <li>Aportas motivación y contexto</li>
          <li>Decides con criterio cuando hace falta</li>
        </ul>

        <p>
          ¿El resultado? Dedicas mucho menos tiempo a planificar y calcular, y
          sigues teniendo la última palabra en cada sesión.
        </p>

        <h2>Las cuentas del crecimiento</h2>
        <p>
          <strong>Coaching tradicional (20 atletas):</strong>
        </p>
        <ul>
          <li>60 horas/semana en total</li>
          <li>48 horas/semana de planificación/administración (80 %)</li>
          <li>12 horas/semana de estrategia/comunicación (20 %)</li>
          <li>Ingresos: 20 atletas × cuota mensual</li>
        </ul>

        <p>
          <strong>Coaching híbrido (50 atletas):</strong>
        </p>
        <ul>
          <li>25 horas/semana en total</li>
          <li>
            5 horas/semana de planificación/administración (la IA se encarga del
            resto)
          </li>
          <li>
            20 horas/semana de estrategia/comunicación (más tiempo para lo que
            importa)
          </li>
          <li>Ingresos: 50 atletas × cuota mensual</li>
        </ul>

        <p>
          La misma calidad. 2,5 veces más atletas. 2,5 veces más ingresos. Menos
          tiempo en total. Ese es el poder del coaching híbrido.
        </p>

        <h2>La calidad no se resiente: mejora</h2>
        <p>
          El miedo a que la IA reduzca la calidad del entrenamiento es
          comprensible, pero infundado. Te explicamos por qué:
        </p>

        <p>
          <strong>El software elimina los errores de cálculo:</strong> La carga,
          el volumen y la forma se calculan a partir de cada actividad, y la
          forma y la fatiga se proyectan sobre las semanas planificadas. Tus
          planes ganan en coherencia, no la pierden.
        </p>

        <p>
          <strong>El seguimiento no se detiene:</strong> Cada nueva actividad
          recibe una breve lectura de la IA y unas pocas preguntas para el
          atleta, y el dolor indicado o la inactividad aparecen en tu panel
          antes de tu siguiente revisión.
        </p>

        <p>
          <strong>Te centras en el trabajo que más valor aporta:</strong> En
          lugar de pasar horas calculando volúmenes semanales, dedicas tu tiempo
          a entender a tus atletas, construir relaciones y tomar decisiones
          estratégicas.
        </p>

        <p>
          ¿El resultado? Los atletas reciben mejores planes Y un mejor
          acompañamiento. La calidad mejora, no empeora.
        </p>

        <h2>Cómo sería en la práctica</h2>
        <p>
          Imagina a una entrenadora de triatlón que ha tocado techo con 18
          atletas, trabaja 65 horas a la semana, sobre todo planificando e
          introduciendo datos, y rechaza a posibles clientes.
        </p>

        <p>Con OpenAthlete, su semana podría ser así:</p>
        <ul>
          <li>
            Claude o ChatGPT, a través del servidor MCP, prepara el siguiente
            bloque de cada atleta en su calendario
          </li>
          <li>La entrenadora revisa y ajusta cada bloque</li>
          <li>
            Las actividades llegan automáticamente desde Strava, Garmin, Polar,
            Suunto y COROS
          </li>
          <li>
            El panel del entrenador señala el dolor indicado, la inactividad y
            los mensajes sin leer
          </li>
          <li>
            La entrenadora se centra en la estrategia, la motivación y las
            relaciones
          </li>
        </ul>

        <p>
          Cuántos atletas más le permite llevar depende de cada entrenador: no
          tenemos cifras que prometer. En OpenAthlete Cloud, entrenar a más de 5
          atletas requiere Supporter (5 €/mes); una instancia autoalojada no
          tiene límite.
        </p>

        <h2>La ventaja competitiva</h2>
        <p>
          Mientras otros entrenadores siguen estancados en 20 atletas, tú puedes
          llegar a más de 50. Eso te da:
        </p>
        <ul>
          <li>
            <strong>Margen en los precios:</strong> Puedes ofrecer tarifas
            competitivas sin renunciar a unos márgenes sanos
          </li>
          <li>
            <strong>Liderazgo en el mercado:</strong> Puedes atender a más
            atletas que tu competencia
          </li>
          <li>
            <strong>Estabilidad para tu negocio:</strong> Con 50 atletas, perder
            2 o 3 no hunde tus ingresos
          </li>
          <li>
            <strong>Equilibrio entre trabajo y vida personal:</strong> Trabajas
            menos horas y ganas más
          </li>
        </ul>

        <p>
          Los entrenadores que se adapten al coaching híbrido dominarán el
          mercado. Los que no, seguirán estancados en 20 atletas viendo cómo
          crece su competencia.
        </p>

        <h2>Cómo hacer la transición</h2>
        <p>
          Pasar al coaching híbrido no significa despedirte a ti mismo.
          Significa:
        </p>
        <ol>
          <li>
            <strong>Empezar con planes generados por la IA:</strong> Deja que la
            IA cree la estructura
          </li>
          <li>
            <strong>Revisar y ajustar:</strong> Añade tu visión estratégica
          </li>
          <li>
            <strong>Seguir el panel del entrenador:</strong> Usa sus alertas
            para guiar tus decisiones
          </li>
          <li>
            <strong>Centrarte en las relaciones:</strong> Dedica el tiempo que
            ganas a lo que importa
          </li>
          <li>
            <strong>Crecer poco a poco:</strong> Suma atletas a medida que te
            sientas cómodo
          </li>
        </ol>

        <p>
          Date un mes antes de juzgar. Para entonces sabrás qué partes de tu
          semana te quitan de verdad las herramientas.
        </p>

        <h2>En resumen</h2>
        <p>
          El coaching híbrido no consiste en sustituir a los entrenadores, sino
          en potenciarlos. La IA se encarga del trabajo repetitivo que, de todos
          modos, no te apetece hacer. Tú te centras en el trabajo estratégico y
          humano que aporta valor de verdad.
        </p>

        <p>
          La pregunta no es si el coaching híbrido funciona: funciona. La
          pregunta es: ¿cuánto tiempo puedes permitirte seguir estancado en 20
          atletas cuando podrías entrenar a más de 50?
        </p>

        <p>
          <strong>Deja de adivinar y empieza hoy a entrenar con IA.</strong>{' '}
          <a href="https://app.openathlete.org/auth/create-account">
            Regístrate en OpenAthlete
          </a>{' '}
          y descubre cómo el coaching híbrido puede hacer crecer tu negocio a la
          vez que mejora los resultados de tus atletas y tu equilibrio entre
          trabajo y vida personal.
        </p>
      </div>
    );
  },
};
