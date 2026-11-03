import type { BlogPost } from './types';

export const article3: BlogPost = {
  metadata: {
    slug: 'preventing-training-injuries',
    title: {
      en: 'Preventing Training Injuries: A Data-Driven Approach',
      fr: "Prévenir les blessures d'entraînement : Une approche basée sur les données",
      es: 'Prevenir lesiones en el entrenamiento: un enfoque basado en datos',
    },
    description: {
      en: 'The warning signs that come before most running injuries (load spikes, falling HRV, harder sessions) and how to adjust training when they appear.',
      fr: "Les signaux qui précèdent la plupart des blessures (pics de charge, VFC en baisse, séances plus dures) et comment ajuster l'entraînement à temps.",
      es: 'Las señales que preceden a la mayoría de las lesiones (picos de carga, VFC a la baja, sesiones más duras) y cómo ajustar el entrenamiento a tiempo.',
    },
    excerpt: {
      en: 'Most training injuries are preventable with the right data and early intervention. Discover how modern technology is making injury prevention more accessible.',
      fr: "La plupart des blessures d'entraînement sont évitables avec les bonnes données et une intervention précoce. Découvrez comment la technologie moderne rend la prévention des blessures plus accessible.",
      es: 'La mayoría de las lesiones en el entrenamiento se pueden evitar con los datos adecuados y una intervención temprana. Descubre cómo la tecnología actual está haciendo la prevención de lesiones más accesible.',
    },
    author: {
      name: 'OpenAthlete Team',
      email: 'contact@openathlete.org',
    },
    publishedAt: '2025-01-25',
    tags: ['Injury Prevention', 'Health', 'Training Load', 'Recovery'],
    readingTime: 6,
    image:
      'https://images.unsplash.com/photo-1727866241882-df87cd3aa9f2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4NDE1NDF8MHwxfHNlYXJjaHwxfHxydW5uaW5nJTIwaW5qdXJ5JTIwcHJldmVudGlvbiUyMHN0cmVzcyUyMGZyYWN0dXJlJTIwd2FybmluZyUyMGFsZXJ0JTIwc3lzdGVtfGVufDB8MHx8fDE3NjUyODc0NTZ8MA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  ContentEn: () => {
    return (
      <div>
        <p>
          Injury prevention is one of the most critical aspects of endurance
          training. Yet, many athletes and coaches struggle to identify warning
          signs before they become serious problems. In this article, we'll
          explore how data-driven approaches are changing the game.
        </p>

        <h2>The Cost of Injuries</h2>
        <p>
          Training injuries don't just cause physical pain—they can derail
          months of progress, affect mental health, and lead to long-term
          setbacks. The good news is that most injuries are preventable with the
          right information and timely intervention.
        </p>

        <h2>Early Warning Signs</h2>
        <p>Before an injury occurs, there are usually subtle signals:</p>
        <ul>
          <li>
            <strong>Load Spikes:</strong> Sudden increases in training volume or
            intensity
          </li>
          <li>
            <strong>Recovery Indicators:</strong> Declining HRV, poor sleep
            quality, elevated resting heart rate
          </li>
          <li>
            <strong>Performance Drift:</strong> Inability to hit target paces or
            power outputs
          </li>
          <li>
            <strong>Perceived Effort:</strong> Sessions feeling harder than they
            should
          </li>
        </ul>

        <h2>How Technology Helps</h2>
        <p>
          Modern training platforms can track these indicators continuously and
          alert coaches and athletes when patterns suggest increased injury
          risk. By combining multiple data sources—training load, recovery
          metrics, and subjective feedback—we can create a comprehensive picture
          of an athlete's status.
        </p>

        <h2>Proactive Adjustments</h2>
        <p>
          The key to injury prevention isn't just detecting problems—it's making
          proactive adjustments. When warning signs appear, the usual responses
          are:
        </p>
        <ul>
          <li>Reduced training volume</li>
          <li>Additional recovery days</li>
          <li>Intensity modifications</li>
          <li>Cross-training alternatives</li>
        </ul>

        <h2>What OpenAthlete Does</h2>
        <p>
          In OpenAthlete, a few short questions after each activity record
          effort and any pain, answered by text, choice or voice. Reported pain
          goes into an injury log and shows up in the coach's "To watch" list.
          Fitness, fatigue and form are projected over planned sessions, so a
          load spike is visible before it happens. By catching problems early
          and making timely adjustments, athletes can maintain consistent
          progress without the setbacks that come with injury.
        </p>

        <p>
          Remember: the best injury is the one that never happens. With the
          right tools and data, we can help athletes train smarter, not just
          harder.
        </p>
      </div>
    );
  },
  ContentFr: () => {
    return (
      <div>
        <p>
          La prévention des blessures est l'un des aspects les plus critiques de
          l'entraînement d'endurance. Pourtant, de nombreux athlètes et coachs
          ont du mal à identifier les signaux d'alerte avant qu'ils ne
          deviennent des problèmes graves. Dans cet article, nous explorerons
          comment les approches basées sur les données changent la donne.
        </p>

        <h2>Le Coût des Blessures</h2>
        <p>
          Les blessures d'entraînement ne causent pas seulement des douleurs
          physiques—elles peuvent faire dérailler des mois de progrès, affecter
          la santé mentale et conduire à des reculs à long terme. La bonne
          nouvelle est que la plupart des blessures sont évitables avec les
          bonnes informations et une intervention rapide.
        </p>

        <h2>Signaux d'Alerte Précoces</h2>
        <p>
          Avant qu'une blessure ne survienne, il y a généralement des signaux
          subtils :
        </p>
        <ul>
          <li>
            <strong>Pics de Charge :</strong> Augmentations soudaines du volume
            ou de l'intensité d'entraînement
          </li>
          <li>
            <strong>Indicateurs de Récupération :</strong> HRV en déclin,
            mauvaise qualité de sommeil, fréquence cardiaque au repos élevée
          </li>
          <li>
            <strong>Dérive de Performance :</strong> Incapacité à atteindre les
            allures ou puissances cibles
          </li>
          <li>
            <strong>Effort Perçu :</strong> Séances qui semblent plus dures
            qu'elles ne devraient
          </li>
        </ul>

        <h2>Comment la Technologie Aide</h2>
        <p>
          Les plateformes d'entraînement modernes peuvent suivre ces indicateurs
          en continu et alerter les coachs et les athlètes lorsque les modèles
          suggèrent un risque accru de blessure. En combinant plusieurs sources
          de données—charge d'entraînement, métriques de récupération et retours
          subjectifs—nous pouvons créer une image complète du statut d'un
          athlète.
        </p>

        <h2>Ajustements Proactifs</h2>
        <p>
          La clé de la prévention des blessures n'est pas seulement de détecter
          les problèmes—c'est de faire des ajustements proactifs. Lorsque des
          signaux d'alerte apparaissent, les réponses habituelles sont :
        </p>
        <ul>
          <li>Réduction du volume d'entraînement</li>
          <li>Jours de récupération supplémentaires</li>
          <li>Modifications d'intensité</li>
          <li>Alternatives de cross-training</li>
        </ul>

        <h2>Ce que fait OpenAthlete</h2>
        <p>
          Dans OpenAthlete, quelques questions courtes après chaque activité
          relèvent l'effort et les éventuelles douleurs, avec une réponse
          écrite, à choix ou vocale. Une douleur signalée entre dans le suivi
          des blessures et apparaît dans la liste « À surveiller » du coach. La
          forme et la fatigue sont projetées sur les séances planifiées : un pic
          de charge se voit avant d'arriver. En détectant les problèmes tôt et
          en faisant des ajustements rapides, les athlètes peuvent maintenir une
          progression constante sans les revers qui accompagnent les blessures.
        </p>

        <p>
          N'oubliez pas : la meilleure blessure est celle qui ne survient
          jamais. Avec les bons outils et les bonnes données, nous pouvons aider
          les athlètes à s'entraîner plus intelligemment, pas seulement plus
          dur.
        </p>
      </div>
    );
  },
  ContentEs: () => {
    return (
      <div>
        <p>
          La prevención de lesiones es uno de los aspectos más importantes del
          entrenamiento de resistencia. Aun así, muchos atletas y entrenadores
          tienen dificultades para detectar las señales de alerta antes de que
          se conviertan en problemas serios. En este artículo veremos cómo los
          enfoques basados en datos están cambiando las reglas del juego.
        </p>

        <h2>El coste de las lesiones</h2>
        <p>
          Las lesiones no solo causan dolor físico: pueden echar por tierra
          meses de progreso, afectar a la salud mental y provocar retrocesos a
          largo plazo. La buena noticia es que la mayoría de las lesiones se
          pueden evitar con la información adecuada y una intervención a tiempo.
        </p>

        <h2>Señales de alerta temprana</h2>
        <p>Antes de una lesión suele haber señales sutiles:</p>
        <ul>
          <li>
            <strong>Picos de carga:</strong> aumentos bruscos del volumen o de
            la intensidad del entrenamiento
          </li>
          <li>
            <strong>Indicadores de recuperación:</strong> HRV a la baja, mala
            calidad del sueño, frecuencia cardíaca en reposo elevada
          </li>
          <li>
            <strong>Caída del rendimiento:</strong> incapacidad para alcanzar
            los ritmos o la potencia objetivo
          </li>
          <li>
            <strong>Esfuerzo percibido:</strong> sesiones que se hacen más duras
            de lo que deberían
          </li>
        </ul>

        <h2>Cómo ayuda la tecnología</h2>
        <p>
          Las plataformas de entrenamiento actuales pueden seguir estos
          indicadores de forma continua y avisar a entrenadores y atletas cuando
          los patrones apuntan a un mayor riesgo de lesión. Al combinar varias
          fuentes de datos (carga de entrenamiento, métricas de recuperación y
          sensaciones subjetivas), podemos obtener una imagen completa del
          estado de un atleta.
        </p>

        <h2>Ajustes proactivos</h2>
        <p>
          La clave para prevenir lesiones no es solo detectar los problemas,
          sino hacer ajustes proactivos. Cuando aparecen señales de alerta, las
          respuestas habituales son:
        </p>
        <ul>
          <li>Reducir el volumen de entrenamiento</li>
          <li>Añadir días de recuperación</li>
          <li>Modificar la intensidad</li>
          <li>Alternativas de entrenamiento cruzado</li>
        </ul>

        <h2>Lo que hace OpenAthlete</h2>
        <p>
          En OpenAthlete, unas pocas preguntas después de cada actividad
          registran el esfuerzo y el posible dolor, con respuesta escrita, de
          opción o por voz. El dolor indicado pasa a un registro de lesiones y
          aparece en la lista «A vigilar» del entrenador. La forma y la fatiga
          se proyectan sobre las sesiones planificadas, así que un pico de carga
          se ve antes de que llegue. Detectando los problemas a tiempo y
          ajustando el plan en el momento oportuno, los atletas pueden progresar
          de forma constante sin los parones que conlleva una lesión.
        </p>

        <p>
          Recuerda: la mejor lesión es la que nunca llega. Con las herramientas
          y los datos adecuados, podemos ayudar a los atletas a entrenar de
          forma más inteligente, no solo más duro.
        </p>
      </div>
    );
  },
};
