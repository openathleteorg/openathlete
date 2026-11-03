import type { BlogPost } from './types';

export const articleNolioTrainingpeaksComparison: BlogPost = {
  metadata: {
    slug: 'nolio-vs-trainingpeaks-vs-openathlete-2025-comparison',
    title: {
      en: 'Nolio vs TrainingPeaks vs OpenAthlete: 2025 Comparison',
      fr: 'Nolio vs TrainingPeaks vs OpenAthlete : Comparaison 2025',
      es: 'Nolio vs TrainingPeaks vs OpenAthlete: comparativa 2025',
    },
    description: {
      en: 'TrainingPeaks, Nolio and OpenAthlete compared: prices, watch sync, AI, coaching features and the weak points of each platform.',
      fr: 'TrainingPeaks, Nolio et OpenAthlete comparés : prix, synchro montre, IA, outils de coaching et points faibles de chaque plateforme.',
      es: 'TrainingPeaks, Nolio y OpenAthlete comparados: precios, sincronización con el reloj, IA, coaching y puntos débiles de cada plataforma.',
    },
    excerpt: {
      en: 'Compare the top sports planning platforms. TrainingPeaks excels at data but is complex. Nolio is built for French coaches and clubs. OpenAthlete is free, open source and tracks RPE and pain, with AI on your own key.',
      fr: "Comparez les meilleures plateformes de planification sportive. TrainingPeaks excelle aux données mais est complexe. Nolio est pensé pour les coachs et clubs français. OpenAthlete est gratuit, open source et suit le RPE et la douleur, avec l'IA sur votre propre clé.",
      es: 'Compara las principales plataformas de planificación deportiva. TrainingPeaks destaca en datos, pero es complejo. Nolio está pensado para entrenadores y clubes franceses. OpenAthlete es gratuito, de código abierto y registra el RPE y el dolor, con IA en tu propia clave.',
    },
    author: {
      name: 'OpenAthlete Team',
      email: 'contact@openathlete.org',
    },
    publishedAt: '2025-04-10',
    tags: [
      'Best Sports Planning Software',
      'Trainingpeaks Alternative',
      'Nolio Review',
      'Software Comparison',
    ],
    readingTime: 9,
    image:
      'https://images.unsplash.com/photo-1720962158883-b0f2021fb51e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4NDE1NDF8MHwxfHNlYXJjaHwxfHxzb2Z0d2FyZSUyMGFwcHMlMjBjb21wYXJpc29uJTIwdGVjaG5vbG9neSUyMGRhc2hib2FyZCUyMGludGVyZmFjZXxlbnwwfDB8fHwxNzY1Mjg3MzgwfDA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  ContentEn: () => {
    return (
      <div>
        <p>
          <strong>
            You're choosing a training platform. TrainingPeaks? Nolio?
            OpenAthlete? Each promises to help you train better. But which one
            actually delivers?
          </strong>
        </p>

        <p>
          This is an honest comparison of the three leading platforms. No
          marketing fluff—just real differences that matter for coaches and
          athletes.
        </p>

        <h2>TrainingPeaks: The Data Powerhouse</h2>
        <p>
          <strong>Strengths:</strong>
        </p>
        <ul>
          <li>Comprehensive data analysis</li>
          <li>Extensive device integration</li>
          <li>Advanced metrics (TSS, CTL, ATL)</li>
          <li>Large user base</li>
        </ul>

        <p>
          <strong>Weaknesses:</strong>
        </p>
        <ul>
          <li>Complex interface (steep learning curve)</li>
          <li>No built-in AI advertised</li>
          <li>
            Sending planned workouts to your watch needs Premium ($19.95/month
            or $134.99/year, prices checked in November 2026)
          </li>
          <li>Expensive for what you get</li>
        </ul>

        <p>
          <strong>Best for:</strong> Data-obsessed athletes and coaches who want
          maximum metrics and don't mind complexity.
        </p>

        <h2>Nolio: The French Coaching Platform</h2>
        <p>
          <strong>Strengths:</strong>
        </p>
        <ul>
          <li>Free athlete tier (sync, structured workouts, analysis)</li>
          <li>Native iOS and Android apps</li>
          <li>
            Club plans, and a partnership with the French athletics federation
          </li>
        </ul>

        <p>
          <strong>Weaknesses:</strong>
        </p>
        <ul>
          <li>No AI advertised</li>
          <li>
            Coach plans are paid from the first athlete: €19.90/month for 3,
            €29.90/month for 25
          </li>
          <li>Not open source, no self-hosting</li>
        </ul>

        <p>
          <strong>Best for:</strong> French-speaking coaches and clubs who want
          native apps and club plans.
        </p>

        <h2>OpenAthlete: The Open-Source Newcomer</h2>
        <p>
          <strong>Strengths:</strong>
        </p>
        <ul>
          <li>
            AI that writes a structured session from a sentence, on your own
            key; whole blocks can be planned from Claude or ChatGPT through the
            MCP server
          </li>
          <li>
            RPE tracking, plus post-session questions that log pain for the
            coach
          </li>
          <li>
            Fitness, fatigue and form (CTL, ATL, TSB), projected over planned
            sessions
          </li>
          <li>
            Illness, injury or travel periods that move the planned sessions
          </li>
          <li>
            Planned workouts sent to Garmin, Suunto and COROS watches for free
          </li>
          <li>
            Every feature free; Supporter (€5/month or €50/year) adds AI on our
            keys and unlimited coached athletes (Free: 5). Open source and
            self-hostable
          </li>
        </ul>

        <p>
          <strong>Weaknesses:</strong>
        </p>
        <ul>
          <li>Smaller user base (newer platform)</li>
          <li>
            No native apps in the stores yet (iOS and Android coming soon)
          </li>
          <li>No club entity, no marketplace for selling plans</li>
        </ul>

        <p>
          <strong>Best for:</strong> Coaches and athletes who want RPE tracking,
          open source and AI on their own terms, without paying per athlete.
        </p>

        <h2>The Bottom Line</h2>
        <p>
          TrainingPeaks = deep data, at a price. Nolio = French coaching and
          club plans with native apps. OpenAthlete = free, open source, RPE and
          pain tracking, AI on your own key. Choose based on what matters most
          to you.
        </p>

        <p>
          <strong>Try it for free.</strong>{' '}
          <a href="https://app.openathlete.org/auth/create-account">
            Sign up for OpenAthlete
          </a>{' '}
          and compare it with what you use today.
        </p>
      </div>
    );
  },
  ContentFr: () => {
    return (
      <div>
        <p>
          <strong>
            Vous choisissez une plateforme d'entraînement. TrainingPeaks ? Nolio
            ? OpenAthlete ? Chacune promet de vous aider à mieux vous entraîner.
            Mais laquelle livre réellement ?
          </strong>
        </p>

        <p>
          C'est une comparaison honnête des trois plateformes leaders. Pas de
          marketing—juste les vraies différences qui comptent pour les coachs et
          athlètes.
        </p>

        <h2>TrainingPeaks : La Centrale de Données</h2>
        <p>
          <strong>Forces :</strong>
        </p>
        <ul>
          <li>Analyse de données complète</li>
          <li>Intégration d'appareils étendue</li>
          <li>Métriques avancées (TSS, CTL, ATL)</li>
          <li>Grande base d'utilisateurs</li>
        </ul>

        <p>
          <strong>Faiblesses :</strong>
        </p>
        <ul>
          <li>Interface complexe (courbe d'apprentissage raide)</li>
          <li>Pas d'IA intégrée mise en avant</li>
          <li>
            L'envoi des séances prévues sur la montre demande Premium (19,95 $
            par mois ou 134,99 $ par an, prix relevés en novembre 2026)
          </li>
          <li>Cher pour ce que vous obtenez</li>
        </ul>

        <p>
          <strong>Meilleur pour :</strong> Athlètes et coachs obsédés par les
          données qui veulent des métriques maximales et ne s'inquiètent pas de
          la complexité.
        </p>

        <h2>Nolio : la plateforme de coaching française</h2>
        <p>
          <strong>Forces :</strong>
        </p>
        <ul>
          <li>
            Offre athlète gratuite (synchro, séances structurées, analyse)
          </li>
          <li>Applications iOS et Android natives</li>
          <li>Offres clubs, et un partenariat avec la FFA</li>
        </ul>

        <p>
          <strong>Faiblesses :</strong>
        </p>
        <ul>
          <li>Pas d'IA annoncée</li>
          <li>
            Offres coach payantes dès le premier athlète : 19,90 €/mois pour 3,
            29,90 €/mois pour 25
          </li>
          <li>Pas open source, pas d'auto-hébergement</li>
        </ul>

        <p>
          <strong>Meilleur pour :</strong> les coachs et clubs francophones qui
          veulent des applications natives et des offres clubs.
        </p>

        <h2>OpenAthlete : le nouveau venu open source</h2>
        <p>
          <strong>Forces :</strong>
        </p>
        <ul>
          <li>
            Une IA qui écrit une séance structurée à partir d'une phrase, avec
            votre propre clé ; des blocs entiers peuvent être planifiés depuis
            Claude ou ChatGPT grâce au serveur MCP
          </li>
          <li>
            Suivi du RPE, et questions après la séance qui signalent les
            douleurs au coach
          </li>
          <li>
            Forme, fatigue et fraîcheur (CTL, ATL, TSB), projetées sur les
            séances prévues
          </li>
          <li>
            Périodes de maladie, blessure ou voyage qui décalent les séances
            prévues
          </li>
          <li>
            Séances envoyées gratuitement sur les montres Garmin, Suunto et
            COROS
          </li>
          <li>
            Toutes les fonctionnalités gratuites ; l'offre Supporter (5 €/mois
            ou 50 €/an) ajoute l'IA sur nos clés et les athlètes illimités
            (gratuit : 5). Open source et auto-hébergeable
          </li>
        </ul>

        <p>
          <strong>Faiblesses :</strong>
        </p>
        <ul>
          <li>Base d'utilisateurs plus petite (plateforme plus récente)</li>
          <li>
            Pas encore d'applications natives dans les stores (iOS et Android
            bientôt)
          </li>
          <li>
            Pas de notion de club, pas de place de marché pour vendre des plans
          </li>
        </ul>

        <p>
          <strong>Meilleur pour :</strong> les coachs et athlètes qui veulent
          suivre le RPE, de l'open source et une IA à leurs conditions, sans
          payer par athlète.
        </p>

        <h2>En Résumé</h2>
        <p>
          TrainingPeaks = des données poussées, à un certain prix. Nolio = le
          coaching à la française, avec offres clubs et applications natives.
          OpenAthlete = gratuit, open source, suivi du RPE et des douleurs, IA
          sur votre propre clé. Choisissez selon ce qui compte le plus pour
          vous.
        </p>

        <p>
          <strong>Essayez gratuitement.</strong>{' '}
          <a href="https://app.openathlete.org/auth/create-account">
            Inscrivez-vous sur OpenAthlete
          </a>{' '}
          et comparez avec l'outil que vous utilisez aujourd'hui.
        </p>
      </div>
    );
  },
  ContentEs: () => {
    return (
      <div>
        <p>
          <strong>
            Estás eligiendo una plataforma de entrenamiento. ¿TrainingPeaks?
            ¿Nolio? ¿OpenAthlete? Todas prometen ayudarte a entrenar mejor. Pero
            ¿cuál lo consigue de verdad?
          </strong>
        </p>

        <p>
          Esta es una comparativa honesta de las tres plataformas líderes. Sin
          palabrería de marketing: solo las diferencias reales que importan a
          entrenadores y atletas.
        </p>

        <h2>TrainingPeaks: el gigante de los datos</h2>
        <p>
          <strong>Puntos fuertes:</strong>
        </p>
        <ul>
          <li>Análisis de datos muy completo</li>
          <li>Amplia integración con dispositivos</li>
          <li>Métricas avanzadas (TSS, CTL, ATL)</li>
          <li>Gran base de usuarios</li>
        </ul>

        <p>
          <strong>Puntos débiles:</strong>
        </p>
        <ul>
          <li>Interfaz compleja (curva de aprendizaje pronunciada)</li>
          <li>Sin IA integrada anunciada</li>
          <li>
            Enviar los entrenamientos planificados al reloj requiere Premium
            (19,95 $/mes o 134,99 $/año, precios consultados en noviembre de
            2026)
          </li>
          <li>Caro para lo que ofrece</li>
        </ul>

        <p>
          <strong>Ideal para:</strong> atletas y entrenadores obsesionados con
          los datos que quieren el máximo de métricas y no les importa la
          complejidad.
        </p>

        <h2>Nolio: la plataforma de coaching francesa</h2>
        <p>
          <strong>Puntos fuertes:</strong>
        </p>
        <ul>
          <li>
            Plan gratuito para atletas (sincronización, sesiones estructuradas,
            análisis)
          </li>
          <li>Apps nativas para iOS y Android</li>
          <li>
            Planes para clubes y acuerdo con la federación francesa de atletismo
          </li>
        </ul>

        <p>
          <strong>Puntos débiles:</strong>
        </p>
        <ul>
          <li>Sin IA anunciada</li>
          <li>
            Planes de entrenador de pago desde el primer atleta: 19,90 €/mes
            para 3, 29,90 €/mes para 25
          </li>
          <li>No es de código abierto ni se puede autoalojar</li>
        </ul>

        <p>
          <strong>Ideal para:</strong> entrenadores y clubes francófonos que
          quieren apps nativas y planes para clubes.
        </p>

        <h2>OpenAthlete: el recién llegado de código abierto</h2>
        <p>
          <strong>Puntos fuertes:</strong>
        </p>
        <ul>
          <li>
            Una IA que escribe una sesión estructurada a partir de una frase,
            con tu propia clave; se pueden planificar bloques enteros desde
            Claude o ChatGPT con el servidor MCP
          </li>
          <li>
            Seguimiento del RPE y preguntas tras la sesión que registran el
            dolor para el entrenador
          </li>
          <li>
            Forma, fatiga y frescura (CTL, ATL, TSB), proyectadas sobre las
            sesiones planificadas
          </li>
          <li>
            Periodos de enfermedad, lesión o viaje que mueven las sesiones
            planificadas
          </li>
          <li>
            Entrenamientos enviados gratis a relojes Garmin, Suunto y COROS
          </li>
          <li>
            Todas las funciones gratis; Supporter (5 €/mes o 50 €/año) añade IA
            con nuestras claves y atletas ilimitados (gratis: 5). Código abierto
            y autoalojable
          </li>
        </ul>

        <p>
          <strong>Puntos débiles:</strong>
        </p>
        <ul>
          <li>Menor base de usuarios (plataforma más reciente)</li>
          <li>
            Todavía sin apps nativas en las tiendas (iOS y Android,
            próximamente)
          </li>
          <li>Sin entidad de club ni marketplace para vender planes</li>
        </ul>

        <p>
          <strong>Ideal para:</strong> entrenadores y atletas que quieren
          seguimiento del RPE, código abierto e IA a su manera, sin pagar por
          atleta.
        </p>

        <h2>En resumen</h2>
        <p>
          TrainingPeaks = datos a fondo, a un precio. Nolio = coaching a la
          francesa, con planes para clubes y apps nativas. OpenAthlete =
          gratuito, código abierto, seguimiento del RPE y del dolor, IA con tu
          propia clave. Elige según lo que más te importe.
        </p>

        <p>
          <strong>Pruébalo gratis.</strong>{' '}
          <a href="https://app.openathlete.org/auth/create-account">
            Regístrate en OpenAthlete
          </a>{' '}
          y compáralo con lo que usas hoy.
        </p>
      </div>
    );
  },
};
