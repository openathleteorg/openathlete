import type { BlogPost } from './types';

export const articleCoachAthleteCommunication: BlogPost = {
  metadata: {
    slug: 'coach-athlete-communication-the-number-one-success-factor',
    title: {
      en: 'Coach-Athlete Communication: The #1 Success Factor',
      fr: 'Communication Coach-Athlète : Le Facteur de Succès #1',
      es: 'Comunicación entre entrenador y atleta: el factor de éxito n.º 1',
    },
    description: {
      en: "Why a plan the athlete doesn't understand fails, and how comments on each session plus a coaching chat beat feedback lost in WhatsApp threads.",
      fr: 'Pourquoi un plan mal compris échoue, et comment des commentaires sur chaque séance et un chat dédié remplacent les retours perdus dans WhatsApp.',
      es: 'Por qué fracasa un plan que el atleta no entiende y cómo los comentarios en cada sesión y un chat propio superan al feedback perdido en WhatsApp.',
    },
    excerpt: {
      en: 'Communication is the foundation of successful coaching. See how contextualized feedback directly on training sessions beats scattered WhatsApp messages.',
      fr: "La communication est la base du coaching réussi. Voyez comment les retours contextualisés directement sur les séances d'entraînement battent les messages WhatsApp dispersés.",
      es: 'La comunicación es la base de un buen entrenamiento. Descubre por qué el feedback en contexto, directamente en las sesiones, gana a los mensajes dispersos de WhatsApp.',
    },
    author: {
      name: 'OpenAthlete Team',
      email: 'contact@openathlete.org',
    },
    publishedAt: '2025-03-01',
    tags: [
      'Coach Athlete Relationship',
      'Workout Feedback',
      'Sports Communication',
      'Remote Coaching',
    ],
    readingTime: 7,
    image:
      'https://images.unsplash.com/photo-1654002931929-70c5e3713bc1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4NDE1NDF8MHwxfHNlYXJjaHwxfHxjb2FjaCUyMGF0aGxldGUlMjB0YWxraW5nJTIwY29tbXVuaWNhdGlvbiUyMGZlZWRiYWNrJTIwZGlzY3Vzc2lvbnxlbnwwfDB8fHwxNzY1Mjg3Mzc5fDA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  ContentEn: () => {
    return (
      <div>
        <p>
          <strong>
            You spent 2 hours crafting the perfect training plan. Every session
            is periodized perfectly. Load progression is spot-on. Recovery is
            accounted for. You send it via email. Three days later, your athlete
            asks: "What does 'tempo' mean again?"
          </strong>
        </p>

        <p>
          This is the communication gap. You can create the best plan in the
          world, but if your athlete doesn't understand it, can't access it
          easily, or loses your feedback in a WhatsApp thread, your expertise is
          wasted.
        </p>

        <h2>Why Communication Matters More Than Planning</h2>
        <p>
          Research consistently shows that coach-athlete communication is the
          strongest predictor of:
        </p>
        <ul>
          <li>Athlete satisfaction</li>
          <li>Adherence to training plans</li>
          <li>Performance improvements</li>
          <li>Long-term retention</li>
        </ul>

        <p>
          A mediocre plan with excellent communication beats a perfect plan with
          poor communication every time. Why? Because athletes need to
          understand, trust, and execute your guidance. Without communication,
          none of that happens.
        </p>

        <h2>The WhatsApp Problem</h2>
        <p>
          Many coaches use WhatsApp for communication. It's convenient, but it
          creates problems:
        </p>
        <ul>
          <li>
            <strong>Messages get lost:</strong> Important feedback disappears in
            long threads
          </li>
          <li>
            <strong>No context:</strong> Comments aren't linked to specific
            sessions
          </li>
          <li>
            <strong>No history:</strong> Hard to track what was discussed when
          </li>
          <li>
            <strong>Mixed topics:</strong> Training questions mixed with casual
            chat
          </li>
          <li>
            <strong>No structure:</strong> Can't organize feedback by session,
            week, or topic
          </li>
        </ul>

        <p>
          When an athlete asks "Why was Tuesday's run so hard?", you're
          scrolling through days of messages trying to find the context. By the
          time you respond, the moment has passed.
        </p>

        <h2>Contextualized Communication</h2>
        <p>
          OpenAthlete solves this by making communication contextual. Every
          comment, question, or feedback is linked directly to:
        </p>
        <ul>
          <li>The specific session it relates to</li>
          <li>The date and context</li>
          <li>The training data from that session</li>
          <li>The athlete and every coach who follows them</li>
        </ul>

        <p>
          When you comment on a session, the athlete sees it right there—no
          searching, no confusion, no lost context.
        </p>

        <h2>Real-Time Feedback Loop</h2>
        <p>
          After every session, OpenAthlete asks athletes for their RPE (a coach
          can make it required). This creates an immediate feedback opportunity:
        </p>
        <ol>
          <li>Athlete completes session</li>
          <li>Athlete rates RPE</li>
          <li>Coach sees elevated RPE</li>
          <li>
            Coach comments directly on that session: "I see this felt harder
            than expected. How did you sleep last night?"
          </li>
          <li>Athlete responds in context</li>
          <li>Coach adjusts next session based on conversation</li>
        </ol>

        <p>
          This happens in real-time, with full context. No WhatsApp scrolling.
          No lost messages. Just clear, actionable communication.
        </p>

        <h2>The Chat Feature</h2>
        <p>
          OpenAthlete includes built-in chat, but it's smarter than generic
          messaging:
        </p>
        <ul>
          <li>
            <strong>Activity notices:</strong> New activities, RPE changes and
            athlete comments appear automatically in your conversation
          </li>
          <li>
            <strong>Group conversations:</strong> Talk to several athletes at
            once, in real time, with read receipts
          </li>
          <li>
            <strong>Notification system:</strong> An email arrives when a
            message goes unread
          </li>
          <li>
            <strong>Searchable history:</strong> Find past conversations easily
          </li>
          <li>
            <strong>Organized threads:</strong> Feedback on a session stays in
            that session's comments, separate from casual chat
          </li>
        </ul>

        <p>
          This isn't just messaging—it's communication designed for coaching.
        </p>

        <h2>Why Athletes Need Context</h2>
        <p>
          When an athlete sees your comment "Great job hitting those intervals!"
          they need to know:
        </p>
        <ul>
          <li>Which session you're referring to</li>
          <li>What they did well specifically</li>
          <li>How it fits into their overall plan</li>
          <li>What to focus on next</li>
        </ul>

        <p>
          Contextualized comments provide all of this automatically. The athlete
          doesn't have to guess or ask follow-up questions. They understand
          immediately.
        </p>

        <h2>The Understanding Gap</h2>
        <p>Many athletes don't understand training terminology:</p>
        <ul>
          <li>"What's the difference between tempo and threshold?"</li>
          <li>"Why am I doing easy runs when I feel fine?"</li>
          <li>"What does 'Z2' mean?"</li>
          <li>"How do I know if I'm going too hard?"</li>
        </ul>

        <p>
          Without communication, these questions go unanswered. Athletes either:
        </p>
        <ul>
          <li>Train incorrectly (wrong intensity, wrong purpose)</li>
          <li>
            Lose motivation (don't understand why they're doing something)
          </li>
          <li>Get frustrated (feel like they're guessing)</li>
        </ul>

        <p>
          With contextualized comments, you can explain directly on the session.
          When an athlete sees "Tempo Run" on Tuesday, they can click and see
          your explanation: "This builds aerobic capacity. Keep it
          controlled—you should be able to hold a conversation."
        </p>

        <h2>Building Trust Through Communication</h2>
        <p>
          Trust isn't built through perfect plans—it's built through consistent,
          clear communication. When athletes:
        </p>
        <ul>
          <li>Understand why they're doing each session</li>
          <li>Get feedback on their efforts</li>
          <li>Feel heard when they have concerns</li>
          <li>See that you're paying attention</li>
        </ul>

        <p>
          They trust your guidance. They follow your plans. They stick with you
          long-term.
        </p>

        <h2>The Bottom Line</h2>
        <p>
          Communication isn't a nice-to-have—it's the foundation of successful
          coaching. A perfect plan without communication is worthless. A good
          plan with excellent communication is powerful.
        </p>

        <p>
          Don't let your expertise get lost in WhatsApp threads or email chains.
          Use tools designed for coaching communication—tools that keep context,
          preserve history, and make understanding easy.
        </p>

        <p>
          <strong>Stop guessing, start training with AI today.</strong>{' '}
          <a href="https://app.openathlete.org/auth/create-account">
            Sign up for OpenAthlete
          </a>{' '}
          and experience how contextualized communication transforms your
          coach-athlete relationships and improves results.
        </p>
      </div>
    );
  },
  ContentFr: () => {
    return (
      <div>
        <p>
          <strong>
            Vous avez passé 2 heures à créer le plan d'entraînement parfait.
            Chaque séance est périodisée parfaitement. La progression de charge
            est parfaite. La récupération est prise en compte. Vous l'envoyez
            par email. Trois jours plus tard, votre athlète demande : "Qu'est-ce
            que 'seuil' signifie déjà ?"
          </strong>
        </p>

        <p>
          C'est l'écart de communication. Vous pouvez créer le meilleur plan au
          monde, mais si votre athlète ne le comprend pas, ne peut pas y accéder
          facilement, ou perd vos retours dans un fil WhatsApp, votre expertise
          est gaspillée.
        </p>

        <h2>Pourquoi la Communication Compte Plus que la Planification</h2>
        <p>
          La recherche montre constamment que la communication coach-athlète est
          le prédicteur le plus fort de :
        </p>
        <ul>
          <li>La satisfaction de l'athlète</li>
          <li>L'adhésion aux plans d'entraînement</li>
          <li>Les améliorations de performance</li>
          <li>La rétention à long terme</li>
        </ul>

        <p>
          Un plan médiocre avec une excellente communication bat un plan parfait
          avec une mauvaise communication à chaque fois. Pourquoi ? Parce que
          les athlètes doivent comprendre, faire confiance et exécuter vos
          conseils. Sans communication, rien de tout cela ne se produit.
        </p>

        <h2>Le Problème WhatsApp</h2>
        <p>
          Beaucoup de coachs utilisent WhatsApp pour la communication. C'est
          pratique, mais cela crée des problèmes :
        </p>
        <ul>
          <li>
            <strong>Les messages se perdent :</strong> Les retours importants
            disparaissent dans les longs fils
          </li>
          <li>
            <strong>Pas de contexte :</strong> Les commentaires ne sont pas liés
            à des séances spécifiques
          </li>
          <li>
            <strong>Pas d'historique :</strong> Difficile de suivre ce qui a été
            discuté quand
          </li>
          <li>
            <strong>Sujets mélangés :</strong> Questions d'entraînement
            mélangées avec le chat casual
          </li>
          <li>
            <strong>Pas de structure :</strong> Impossible d'organiser les
            retours par séance, semaine ou sujet
          </li>
        </ul>

        <p>
          Quand un athlète demande "Pourquoi la course de mardi était-elle si
          dure ?", vous faites défiler des jours de messages essayant de trouver
          le contexte. Au moment où vous répondez, le moment est passé.
        </p>

        <h2>Communication Contextualisée</h2>
        <p>
          OpenAthlete résout cela en rendant la communication contextuelle.
          Chaque commentaire, question ou retour est lié directement à :
        </p>
        <ul>
          <li>La séance spécifique à laquelle il se rapporte</li>
          <li>La date et le contexte</li>
          <li>Les données d'entraînement de cette séance</li>
          <li>L'athlète et chacun des coachs qui le suivent</li>
        </ul>

        <p>
          Quand vous commentez une séance, l'athlète le voit directement là—pas
          de recherche, pas de confusion, pas de contexte perdu.
        </p>

        <h2>Boucle de Retour en Temps Réel</h2>
        <p>
          Après chaque séance, OpenAthlete invite les athlètes à donner leur RPE
          (le coach peut le rendre obligatoire). Cela crée une opportunité de
          retour immédiat :
        </p>
        <ol>
          <li>L'athlète complète la séance</li>
          <li>L'athlète note le RPE</li>
          <li>Le coach voit un RPE élevé</li>
          <li>
            Le coach commente directement sur cette séance : "Je vois que cela a
            semblé plus dur que prévu. Comment avez-vous dormi la nuit dernière
            ?"
          </li>
          <li>L'athlète répond dans le contexte</li>
          <li>Le coach ajuste la prochaine séance basée sur la conversation</li>
        </ol>

        <p>
          Cela se produit en temps réel, avec un contexte complet. Pas de
          défilement WhatsApp. Pas de messages perdus. Juste une communication
          claire et actionnable.
        </p>

        <h2>La Fonctionnalité Chat</h2>
        <p>
          OpenAthlete inclut un chat intégré, mais il est plus intelligent que
          la messagerie générique :
        </p>
        <ul>
          <li>
            <strong>Notifications d'activité :</strong> Nouvelles activités,
            changements de RPE et commentaires de l'athlète arrivent
            automatiquement dans votre conversation
          </li>
          <li>
            <strong>Conversations de groupe :</strong> Échanger avec plusieurs
            athlètes à la fois, en temps réel, avec accusés de lecture
          </li>
          <li>
            <strong>Système de notification :</strong> Un email part quand un
            message reste non lu
          </li>
          <li>
            <strong>Historique recherchable :</strong> Trouver facilement les
            conversations passées
          </li>
          <li>
            <strong>Fils organisés :</strong> Les retours sur une séance restent
            dans les commentaires de cette séance, à l'écart des discussions
            informelles
          </li>
        </ul>

        <p>
          Ce n'est pas juste de la messagerie—c'est de la communication conçue
          pour le coaching.
        </p>

        <h2>Pourquoi les Athlètes Ont Besoin de Contexte</h2>
        <p>
          Quand un athlète voit votre commentaire "Excellent travail sur ces
          intervalles !", il a besoin de savoir :
        </p>
        <ul>
          <li>À quelle séance vous faites référence</li>
          <li>Ce qu'ils ont bien fait spécifiquement</li>
          <li>Comment cela s'intègre dans leur plan global</li>
          <li>Sur quoi se concentrer ensuite</li>
        </ul>

        <p>
          Les commentaires contextualisés fournissent tout cela automatiquement.
          L'athlète n'a pas à deviner ou poser des questions de suivi. Il
          comprend immédiatement.
        </p>

        <h2>L'Écart de Compréhension</h2>
        <p>
          Beaucoup d'athlètes ne comprennent pas la terminologie d'entraînement
          :
        </p>
        <ul>
          <li>"Quelle est la différence entre seuil et tempo ?"</li>
          <li>
            "Pourquoi je fais des sorties en endurance quand je me sens bien ?"
          </li>
          <li>"Que signifie 'Z2' ?"</li>
          <li>"Comment savoir si je vais trop fort ?"</li>
        </ul>

        <p>
          Sans communication, ces questions restent sans réponse. Les athlètes
          soit :
        </p>
        <ul>
          <li>
            S'entraînent incorrectement (mauvaise intensité, mauvais objectif)
          </li>
          <li>
            Perdent la motivation (ne comprennent pas pourquoi ils font quelque
            chose)
          </li>
          <li>Se frustrent (ont l'impression de deviner)</li>
        </ul>

        <p>
          Avec des commentaires contextualisés, vous pouvez expliquer
          directement sur la séance. Quand un athlète voit "Sortie au Seuil"
          mardi, il peut cliquer et voir votre explication : "Cela construit la
          capacité aérobie. Gardez-le contrôlé—vous devriez pouvoir tenir une
          conversation."
        </p>

        <h2>Construire la Confiance par la Communication</h2>
        <p>
          La confiance n'est pas construite à travers des plans parfaits—elle
          est construite à travers une communication constante et claire. Quand
          les athlètes :
        </p>
        <ul>
          <li>Comprennent pourquoi ils font chaque séance</li>
          <li>Reçoivent des retours sur leurs efforts</li>
          <li>Se sentent entendus quand ils ont des préoccupations</li>
          <li>Voient que vous faites attention</li>
        </ul>

        <p>
          Ils font confiance à vos conseils. Ils suivent vos plans. Ils restent
          avec vous à long terme.
        </p>

        <h2>En Résumé</h2>
        <p>
          La communication n'est pas un "nice-to-have"—c'est la base du coaching
          réussi. Un plan parfait sans communication est sans valeur. Un bon
          plan avec une excellente communication est puissant.
        </p>

        <p>
          Ne laissez pas votre expertise se perdre dans les fils WhatsApp ou les
          chaînes d'email. Utilisez des outils conçus pour la communication de
          coaching—des outils qui gardent le contexte, préservent l'historique
          et rendent la compréhension facile.
        </p>

        <p>
          <strong>
            Arrêtez de deviner, commencez à vous entraîner avec l'IA dès
            aujourd'hui.
          </strong>{' '}
          <a href="https://app.openathlete.org/auth/create-account">
            Inscrivez-vous sur OpenAthlete
          </a>{' '}
          et découvrez comment la communication contextualisée transforme vos
          relations coach-athlète et améliore les résultats.
        </p>
      </div>
    );
  },
  ContentEs: () => {
    return (
      <div>
        <p>
          <strong>
            Has pasado 2 horas diseñando el plan de entrenamiento perfecto. Cada
            sesión está perfectamente periodizada. La progresión de la carga es
            impecable. La recuperación está prevista. Lo envías por correo. Tres
            días después, tu atleta te pregunta: «Oye, ¿qué era eso de
            “tempo”?».
          </strong>
        </p>

        <p>
          Esta es la brecha de comunicación. Puedes crear el mejor plan del
          mundo, pero si tu atleta no lo entiende, no puede consultarlo con
          facilidad o pierde tus comentarios en un chat de WhatsApp, tu
          experiencia se desperdicia.
        </p>

        <h2>Por qué la comunicación importa más que la planificación</h2>
        <p>
          Las investigaciones muestran una y otra vez que la comunicación entre
          entrenador y atleta es el mejor indicador de:
        </p>
        <ul>
          <li>La satisfacción del atleta</li>
          <li>La adherencia a los planes de entrenamiento</li>
          <li>La mejora del rendimiento</li>
          <li>La retención a largo plazo</li>
        </ul>

        <p>
          Un plan mediocre con una comunicación excelente gana siempre a un plan
          perfecto con una mala comunicación. ¿Por qué? Porque los atletas
          necesitan entender tus indicaciones, confiar en ellas y ponerlas en
          práctica. Sin comunicación, nada de eso ocurre.
        </p>

        <h2>El problema de WhatsApp</h2>
        <p>
          Muchos entrenadores se comunican por WhatsApp. Es cómodo, pero genera
          problemas:
        </p>
        <ul>
          <li>
            <strong>Los mensajes se pierden:</strong> el feedback importante
            desaparece en conversaciones larguísimas
          </li>
          <li>
            <strong>Sin contexto:</strong> los comentarios no están vinculados a
            sesiones concretas
          </li>
          <li>
            <strong>Sin historial:</strong> cuesta saber qué se habló y cuándo
          </li>
          <li>
            <strong>Temas mezclados:</strong> las dudas sobre el entrenamiento
            se mezclan con la charla informal
          </li>
          <li>
            <strong>Sin estructura:</strong> no puedes organizar el feedback por
            sesión, semana o tema
          </li>
        </ul>

        <p>
          Cuando un atleta te pregunta «¿Por qué me costó tanto el rodaje del
          martes?», te pones a buscar entre días de mensajes para encontrar el
          contexto. Cuando por fin respondes, el momento ya ha pasado.
        </p>

        <h2>Comunicación en contexto</h2>
        <p>
          OpenAthlete lo resuelve dando contexto a la comunicación. Cada
          comentario, pregunta o feedback queda vinculado directamente a:
        </p>
        <ul>
          <li>La sesión concreta a la que se refiere</li>
          <li>La fecha y el contexto</li>
          <li>Los datos de entrenamiento de esa sesión</li>
          <li>El atleta y cada entrenador que lo sigue</li>
        </ul>

        <p>
          Cuando comentas una sesión, el atleta lo ve justo ahí: sin buscar, sin
          confusiones, sin perder el contexto.
        </p>

        <h2>Un ciclo de feedback en tiempo real</h2>
        <p>
          Después de cada sesión, OpenAthlete pide a los atletas su RPE (el
          entrenador puede hacerlo obligatorio). Esto crea una oportunidad
          inmediata de dar feedback:
        </p>
        <ol>
          <li>El atleta completa la sesión</li>
          <li>El atleta valora su RPE</li>
          <li>El entrenador ve un RPE elevado</li>
          <li>
            El entrenador comenta directamente en esa sesión: «Veo que te ha
            costado más de lo previsto. ¿Qué tal dormiste anoche?»
          </li>
          <li>El atleta responde en contexto</li>
          <li>
            El entrenador ajusta la siguiente sesión según la conversación
          </li>
        </ol>

        <p>
          Todo esto ocurre en tiempo real y con todo el contexto. Sin buscar en
          WhatsApp. Sin mensajes perdidos. Solo una comunicación clara y útil.
        </p>

        <h2>El chat</h2>
        <p>
          OpenAthlete incluye un chat integrado, pero más inteligente que una
          mensajería genérica:
        </p>
        <ul>
          <li>
            <strong>Avisos de actividad:</strong> las nuevas actividades, los
            cambios de RPE y los comentarios del atleta llegan automáticamente a
            vuestra conversación
          </li>
          <li>
            <strong>Conversaciones de grupo:</strong> habla con varios atletas a
            la vez, en tiempo real y con confirmación de lectura
          </li>
          <li>
            <strong>Notificaciones:</strong> llega un correo cuando un mensaje
            se queda sin leer
          </li>
          <li>
            <strong>Historial con búsqueda:</strong> encuentra fácilmente
            conversaciones anteriores
          </li>
          <li>
            <strong>Conversaciones organizadas:</strong> el feedback sobre una
            sesión se queda en los comentarios de esa sesión, aparte de la
            charla informal
          </li>
        </ul>

        <p>No es solo mensajería: es comunicación pensada para entrenar.</p>

        <h2>Por qué los atletas necesitan contexto</h2>
        <p>
          Cuando un atleta lee tu comentario «¡Muy bien esas series!», necesita
          saber:
        </p>
        <ul>
          <li>A qué sesión te refieres</li>
          <li>Qué ha hecho bien exactamente</li>
          <li>Cómo encaja en su plan global</li>
          <li>En qué centrarse a continuación</li>
        </ul>

        <p>
          Los comentarios en contexto aportan todo esto de forma automática. El
          atleta no tiene que adivinar ni hacer más preguntas. Lo entiende al
          instante.
        </p>

        <h2>La brecha de comprensión</h2>
        <p>Muchos atletas no entienden la terminología del entrenamiento:</p>
        <ul>
          <li>«¿Qué diferencia hay entre tempo y umbral?»</li>
          <li>«¿Por qué hago rodajes suaves si me encuentro bien?»</li>
          <li>«¿Qué significa “Z2”?»</li>
          <li>«¿Cómo sé si voy demasiado fuerte?»</li>
        </ul>

        <p>
          Sin comunicación, estas preguntas quedan sin respuesta. Y los atletas:
        </p>
        <ul>
          <li>Entrenan mal (intensidad equivocada, objetivo equivocado)</li>
          <li>
            Pierden la motivación (no entienden por qué hacen lo que hacen)
          </li>
          <li>Se frustran (sienten que van a ciegas)</li>
        </ul>

        <p>
          Con los comentarios en contexto, puedes explicarlo directamente en la
          sesión. Cuando un atleta ve «Tempo» el martes, puede pulsar y leer tu
          explicación: «Esta sesión desarrolla tu capacidad aeróbica. Mantén el
          control: deberías poder mantener una conversación».
        </p>

        <h2>Generar confianza a través de la comunicación</h2>
        <p>
          La confianza no se gana con planes perfectos, sino con una
          comunicación constante y clara. Cuando los atletas:
        </p>
        <ul>
          <li>Entienden por qué hacen cada sesión</li>
          <li>Reciben feedback sobre su esfuerzo</li>
          <li>Se sienten escuchados cuando algo les preocupa</li>
          <li>Ven que les prestas atención</li>
        </ul>

        <p>
          Confían en tus indicaciones. Siguen tus planes. Se quedan contigo a
          largo plazo.
        </p>

        <h2>En resumen</h2>
        <p>
          La comunicación no es un extra: es la base de un buen entrenamiento.
          Un plan perfecto sin comunicación no vale nada. Un buen plan con una
          comunicación excelente es muy potente.
        </p>

        <p>
          No dejes que tu experiencia se pierda en chats de WhatsApp o en
          cadenas de correos. Usa herramientas pensadas para la comunicación
          entre entrenador y atleta: herramientas que conservan el contexto,
          guardan el historial y facilitan la comprensión.
        </p>

        <p>
          <strong>Deja de adivinar y empieza hoy a entrenar con IA.</strong>{' '}
          <a href="https://app.openathlete.org/auth/create-account">
            Regístrate en OpenAthlete
          </a>{' '}
          y comprueba cómo la comunicación en contexto transforma tu relación
          con tus atletas y mejora los resultados.
        </p>
      </div>
    );
  },
};
