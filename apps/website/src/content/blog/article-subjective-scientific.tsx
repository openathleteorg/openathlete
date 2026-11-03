import type { BlogPost } from './types';

export const articleSubjectiveScientific: BlogPost = {
  metadata: {
    slug: 'subjective-but-scientific-quantifying-mental-fatigue',
    title: {
      en: 'Subjective but Scientific: Quantifying Mental Fatigue',
      fr: 'Subjectif mais Scientifique : Quantifier la Fatigue Mentale',
      es: 'Subjetivo pero científico: cómo cuantificar la fatiga mental',
    },
    description: {
      en: "Why the same run feels harder after a bad day at work: how mental fatigue raises perceived effort, and how RPE records what your watch can't.",
      fr: "Pourquoi la même sortie paraît plus dure après une mauvaise journée : la fatigue mentale gonfle l'effort perçu, et le RPE capte ce que la montre ignore.",
      es: 'Por qué el mismo rodaje cuesta más tras un mal día de trabajo: la fatiga mental eleva el esfuerzo percibido y el RPE recoge lo que tu reloj no ve.',
    },
    excerpt: {
      en: "Mental fatigue affects performance in ways your watch can't measure. RPE bridges the gap between objective data and subjective reality, filling the void left by Strava and Garmin.",
      fr: "La fatigue mentale affecte les performances de manière que votre montre ne peut pas mesurer. Le RPE comble l'écart entre les données objectives et la réalité subjective, comblant le vide laissé par Strava et Garmin.",
      es: 'La fatiga mental afecta al rendimiento de formas que tu reloj no puede medir. El RPE tiende un puente entre los datos objetivos y la realidad subjetiva, y cubre el vacío que dejan Strava y Garmin.',
    },
    author: {
      name: 'OpenAthlete Team',
      email: 'contact@openathlete.org',
    },
    publishedAt: '2025-02-15',
    tags: [
      'Mental Fatigue',
      'Sports Performance',
      'Borg Scale',
      'Athlete Monitoring',
      'RPE',
    ],
    readingTime: 8,
    image:
      'https://images.unsplash.com/photo-1758520144795-299f212ccba0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4NDE1NDF8MHwxfHNlYXJjaHwyfHx3b3JrJTIwc3RyZXNzJTIwbWVudGFsJTIwZmF0aWd1ZSUyMGF0aGxldGUlMjB0aXJlZCUyMGJyYWluJTIwY29uY2VudHJhdGlvbnxlbnwwfDB8fHwxNzY1Mjg3Mzc5fDA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  ContentEn: () => {
    return (
      <div>
        <p>
          <strong>
            You had a terrible day at work. Deadlines, conflicts, stress. You
            drag yourself to your evening run. Same route, same pace as last
            week. But it feels impossible.
          </strong>{' '}
          Your watch shows identical metrics—heart rate, pace, power. Everything
          looks normal. So why does it feel so much harder?
        </p>

        <p>
          The answer lies in the connection between your brain and your muscles.
          Mental fatigue doesn't just affect your mood—it directly impacts your
          physical performance. And here's the critical insight:{' '}
          <strong>your watch can't measure it, but RPE can.</strong>
        </p>

        <h2>The Brain-Muscle Connection</h2>
        <p>
          Endurance performance isn't purely physical. Your central nervous
          system (CNS) plays a crucial role. When you're mentally fatigued, your
          brain:
        </p>
        <ul>
          <li>
            <strong>Reduces neural drive:</strong> Sends weaker signals to your
            muscles
          </li>
          <li>
            <strong>Increases perceived effort:</strong> Makes the same workload
            feel harder
          </li>
          <li>
            <strong>Impairs pacing:</strong> Disrupts your ability to judge
            effort accurately
          </li>
          <li>
            <strong>Accelerates fatigue:</strong> Causes you to reach exhaustion
            faster
          </li>
        </ul>

        <p>
          Research shows that mental fatigue can reduce time-to-exhaustion by
          15-20% at the same physiological intensity. Your heart rate might be
          identical, but your performance isn't.
        </p>

        <h2>Why Watches Miss This</h2>
        <p>Your Garmin, Apple Watch, or Strava tracks objective metrics:</p>
        <ul>
          <li>Heart rate (cardiovascular response)</li>
          <li>Pace/power (external output)</li>
          <li>GPS data (distance, elevation)</li>
          <li>Cadence (movement patterns)</li>
        </ul>

        <p>
          These are valuable, but they're incomplete. They measure{' '}
          <strong>what your body is doing</strong>, not{' '}
          <strong>how your body is responding</strong>. They can't detect:
        </p>
        <ul>
          <li>Mental fatigue from work stress</li>
          <li>Emotional state (anxiety, depression, motivation)</li>
          <li>Cognitive load (decision fatigue, information overload)</li>
          <li>Sleep quality impact on CNS function</li>
        </ul>

        <p>
          This gap is where RPE becomes essential. When you rate a session as
          "8/10" instead of the usual "6/10" for the same pace and heart rate,
          you're quantifying something your watch can't measure.
        </p>

        <h2>The Science of RPE</h2>
        <p>
          Rate of Perceived Exertion isn't just "how you feel"—it's a validated
          scientific tool. The Borg Scale (6-20) and Modified Borg Scale (0-10)
          have been used in sports science for decades. Research consistently
          shows that RPE:
        </p>
        <ul>
          <li>Correlates strongly with actual physiological stress</li>
          <li>
            Predicts performance better than heart rate alone in some contexts
          </li>
          <li>Captures the interaction between physical and mental factors</li>
          <li>Provides early warning signs of overreaching</li>
        </ul>

        <p>
          When your RPE is elevated relative to objective metrics, that's data.
          It's telling you something important about your current
          state—something your watch can't see.
        </p>

        <h2>The OpenAthlete Difference</h2>
        <p>
          After every session, OpenAthlete asks how it went: an RPE field (your
          coach can make it mandatory), or a few short questions, answered by
          text, a tap or voice, from which the AI extracts your RPE. Here's why
          it matters:
        </p>

        <p>OpenAthlete puts your RPE in context:</p>
        <ul>
          <li>
            <strong>Next to the numbers:</strong> RPE sits beside pace, heart
            rate and power on each activity
          </li>
          <li>
            <strong>Questions that fit the day:</strong> They cover feeling,
            fatigue, sleep and pain, adapted to your recent load and injuries
          </li>
          <li>
            <strong>Session-RPE load:</strong> RPE × minutes, as an alternative
            to heart-rate TRIMP
          </li>
          <li>
            <strong>Recovery markers:</strong> Sleep, HRV, resting heart rate
            and Hooper index on the calendar
          </li>
        </ul>

        <p>
          When patterns emerge, like elevated RPE after stressful days, that's
          your cue (or your coach's) to act:
        </p>
        <ul>
          <li>Reducing intensity for the next session</li>
          <li>Adding an extra recovery day</li>
          <li>Shifting to lower-stress activities</li>
          <li>Focusing on sleep and stress management</li>
        </ul>

        <h2>Real-World Impact</h2>
        <p>Consider two identical training sessions:</p>

        <p>
          <strong>Session A (Monday, after good weekend):</strong>
        </p>
        <ul>
          <li>Pace: 4:30/km</li>
          <li>Heart rate: 155 bpm</li>
          <li>RPE: 6/10</li>
          <li>Feeling: Strong, controlled</li>
        </ul>

        <p>
          <strong>Session B (Wednesday, after stressful work day):</strong>
        </p>
        <ul>
          <li>Pace: 4:30/km</li>
          <li>Heart rate: 155 bpm</li>
          <li>RPE: 8/10</li>
          <li>Feeling: Struggling, heavy legs</li>
        </ul>

        <p>
          Your watch sees identical sessions. But RPE reveals the truth: Session
          B created more internal stress, even though external metrics were
          identical. Without RPE, you'd never know. You might push through,
          thinking you're just having an "off day," when in reality, your CNS is
          fatigued and needs recovery.
        </p>

        <h2>Filling the Strava/Garmin Gap</h2>
        <p>
          Strava and Garmin are excellent at tracking what you did. They're
          terrible at understanding how you felt. This gap matters because:
        </p>
        <ul>
          <li>
            <strong>
              Training adaptation depends on internal load, not just external
              load
            </strong>
          </li>
          <li>
            <strong>
              Injury risk increases when internal load exceeds capacity
            </strong>
          </li>
          <li>
            <strong>
              Optimal performance requires matching training to current state
            </strong>
          </li>
        </ul>

        <p>
          OpenAthlete bridges this gap by combining objective data (from your
          watch) with subjective data (RPE). The result? A complete picture that
          neither could provide alone.
        </p>

        <h2>The Mental Fatigue Cycle</h2>
        <p>Mental fatigue creates a vicious cycle:</p>
        <ol>
          <li>Stressful day increases mental fatigue</li>
          <li>Mental fatigue makes training feel harder (elevated RPE)</li>
          <li>Harder-feeling sessions increase perceived stress</li>
          <li>Increased stress compounds mental fatigue</li>
          <li>Cycle repeats, leading to burnout</li>
        </ol>

        <p>
          RPE monitoring breaks this cycle. When you see elevated RPE patterns,
          you can intervene early—reducing training stress, prioritizing
          recovery, addressing the root causes of mental fatigue.
        </p>

        <h2>Practical Application</h2>
        <p>Here's how to use RPE effectively:</p>
        <ul>
          <li>
            <strong>Rate immediately after sessions:</strong> Don't wait—your
            perception is most accurate right after completion
          </li>
          <li>
            <strong>Be honest:</strong> There's no "wrong" RPE. Your perception
            is your reality
          </li>
          <li>
            <strong>Look for patterns:</strong> Is RPE elevated after certain
            types of days?
          </li>
          <li>
            <strong>Trust the data:</strong> If RPE suggests you need recovery,
            listen
          </li>
        </ul>

        <p>
          OpenAthlete makes this easy. After every imported activity (with AI
          turned on), you get a few short questions and the AI fills in your RPE
          from your answers. It takes under a minute, and you build a record
          your watch can't.
        </p>

        <h2>The Bottom Line</h2>
        <p>
          Mental fatigue is real, measurable, and impactful. Your watch can't
          detect it, but RPE can. By combining objective metrics with subjective
          perception, you get a complete picture of your training state.
        </p>

        <p>
          Don't ignore the gap between what your watch says and how you feel.
          That gap contains critical information about your readiness, recovery,
          and injury risk.
        </p>

        <p>
          <strong>Stop guessing, start training with AI today.</strong>{' '}
          <a href="https://app.openathlete.org/auth/create-account">
            Sign up for OpenAthlete
          </a>{' '}
          and log how each session felt next to what your watch measured.
        </p>
      </div>
    );
  },
  ContentFr: () => {
    return (
      <div>
        <p>
          <strong>
            Vous avez eu une journée terrible au travail. Délais, conflits,
            stress. Vous vous traînez à votre course du soir. Même parcours,
            même allure que la semaine dernière. Mais cela semble impossible.
          </strong>{' '}
          Votre montre montre des métriques identiques—fréquence cardiaque,
          allure, puissance. Tout semble normal. Alors pourquoi cela semble-t-il
          si beaucoup plus dur ?
        </p>

        <p>
          La réponse réside dans la connexion entre votre cerveau et vos
          muscles. La fatigue mentale n'affecte pas seulement votre humeur—elle
          impacte directement vos performances physiques. Et voici l'idée
          cruciale :{' '}
          <strong>
            votre montre ne peut pas la mesurer, mais le RPE peut.
          </strong>
        </p>

        <h2>La Connexion Cerveau-Muscle</h2>
        <p>
          La performance d'endurance n'est pas purement physique. Votre système
          nerveux central (SNC) joue un rôle crucial. Quand vous êtes
          mentalement fatigué, votre cerveau :
        </p>
        <ul>
          <li>
            <strong>Réduit la commande neurale :</strong> Envoie des signaux
            plus faibles à vos muscles
          </li>
          <li>
            <strong>Augmente l'effort perçu :</strong> Rend la même charge de
            travail plus dure
          </li>
          <li>
            <strong>Altère le rythme :</strong> Perturbe votre capacité à juger
            l'effort avec précision
          </li>
          <li>
            <strong>Accélère la fatigue :</strong> Vous fait atteindre
            l'épuisement plus rapidement
          </li>
        </ul>

        <p>
          La recherche montre que la fatigue mentale peut réduire le temps
          jusqu'à épuisement de 15-20% à la même intensité physiologique. Votre
          fréquence cardiaque pourrait être identique, mais vos performances ne
          le sont pas.
        </p>

        <h2>Pourquoi les Montres Manquent Cela</h2>
        <p>
          Votre Garmin, Apple Watch ou Strava suit les métriques objectives :
        </p>
        <ul>
          <li>Fréquence cardiaque (réponse cardiovasculaire)</li>
          <li>Allure/puissance (sortie externe)</li>
          <li>Données GPS (distance, dénivelé)</li>
          <li>Cadence (modèles de mouvement)</li>
        </ul>

        <p>
          Ce sont des données précieuses, mais elles sont incomplètes. Elles
          mesurent <strong>ce que fait votre corps</strong>, pas{' '}
          <strong>comment votre corps répond</strong>. Elles ne peuvent pas
          détecter :
        </p>
        <ul>
          <li>La fatigue mentale du stress au travail</li>
          <li>L'état émotionnel (anxiété, dépression, motivation)</li>
          <li>
            La charge cognitive (fatigue décisionnelle, surcharge d'information)
          </li>
          <li>L'impact de la qualité du sommeil sur la fonction du SNC</li>
        </ul>

        <p>
          Cet écart est où le RPE devient essentiel. Quand vous notez une séance
          comme "8/10" au lieu du "6/10" habituel pour la même allure et
          fréquence cardiaque, vous quantifiez quelque chose que votre montre ne
          peut pas mesurer.
        </p>

        <h2>La Science du RPE</h2>
        <p>
          Le Ressenti d'Effort Perçu n'est pas juste "comment vous vous
          sentez"—c'est un outil scientifique validé. L'Échelle de Borg (6-20)
          et l'Échelle de Borg Modifiée (0-10) sont utilisées en science du
          sport depuis des décennies. La recherche montre constamment que le RPE
          :
        </p>
        <ul>
          <li>Corrèle fortement avec le stress physiologique réel</li>
          <li>
            Prédit les performances mieux que la fréquence cardiaque seule dans
            certains contextes
          </li>
          <li>Capture l'interaction entre facteurs physiques et mentaux</li>
          <li>Fournit des signaux d'alerte précoces de surentraînement</li>
        </ul>

        <p>
          Quand votre RPE est élevé par rapport aux métriques objectives, ce
          sont des données. Cela vous dit quelque chose d'important sur votre
          état actuel—quelque chose que votre montre ne peut pas voir.
        </p>

        <h2>La Différence OpenAthlete</h2>
        <p>
          Après chaque séance, OpenAthlete vous demande comment elle s'est
          passée : un champ RPE (que votre coach peut rendre obligatoire), ou
          quelques questions courtes, auxquelles vous répondez par texte, d'un
          tap ou à la voix, et dont l'IA extrait votre RPE. Voici pourquoi c'est
          important :
        </p>

        <p>OpenAthlete replace votre RPE dans son contexte :</p>
        <ul>
          <li>
            <strong>À côté des chiffres :</strong> Le RPE s'affiche à côté de
            l'allure, de la fréquence cardiaque et de la puissance de chaque
            activité
          </li>
          <li>
            <strong>Des questions adaptées au jour :</strong> Ressenti, fatigue,
            sommeil et douleur, selon votre charge récente et vos blessures
          </li>
          <li>
            <strong>Charge en RPE de séance :</strong> RPE × minutes, en
            alternative au TRIMP cardiaque
          </li>
          <li>
            <strong>Marqueurs de récupération :</strong> Sommeil, VFC, fréquence
            cardiaque de repos et indice de Hooper dans le calendrier
          </li>
        </ul>

        <p>
          Quand un schéma se dessine, comme un RPE élevé après des journées
          stressantes, c'est à vous (ou à votre coach) d'agir :
        </p>
        <ul>
          <li>Réduire l'intensité pour la prochaine séance</li>
          <li>Ajouter un jour de récupération supplémentaire</li>
          <li>Passer à des activités à faible stress</li>
          <li>Se concentrer sur le sommeil et la gestion du stress</li>
        </ul>

        <h2>Impact Concret</h2>
        <p>Considérez deux séances d'entraînement identiques :</p>

        <p>
          <strong>Séance A (Lundi, après un bon week-end) :</strong>
        </p>
        <ul>
          <li>Allure : 4:30/km</li>
          <li>Fréquence cardiaque : 155 bpm</li>
          <li>RPE : 6/10</li>
          <li>Sensation : Fort, contrôlé</li>
        </ul>

        <p>
          <strong>
            Séance B (Mercredi, après une journée de travail stressante) :
          </strong>
        </p>
        <ul>
          <li>Allure : 4:30/km</li>
          <li>Fréquence cardiaque : 155 bpm</li>
          <li>RPE : 8/10</li>
          <li>Sensation : Lutte, jambes lourdes</li>
        </ul>

        <p>
          Votre montre voit des séances identiques. Mais le RPE révèle la vérité
          : La Séance B a créé plus de stress interne, même si les métriques
          externes étaient identiques. Sans RPE, vous ne le sauriez jamais. Vous
          pourriez pousser, pensant que vous avez juste une "mauvaise journée",
          alors qu'en réalité, votre SNC est fatigué et a besoin de
          récupération.
        </p>

        <h2>Combler l'Écart Strava/Garmin</h2>
        <p>
          Strava et Garmin excellent à suivre ce que vous avez fait. Ils sont
          terribles pour comprendre comment vous vous êtes senti. Cet écart
          compte parce que :
        </p>
        <ul>
          <li>
            <strong>
              L'adaptation à l'entraînement dépend de la charge interne, pas
              seulement de la charge externe
            </strong>
          </li>
          <li>
            <strong>
              Le risque de blessure augmente quand la charge interne dépasse la
              capacité
            </strong>
          </li>
          <li>
            <strong>
              La performance optimale nécessite d'aligner l'entraînement sur
              l'état actuel
            </strong>
          </li>
        </ul>

        <p>
          OpenAthlete comble cet écart en combinant les données objectives (de
          votre montre) avec les données subjectives (RPE). Le résultat ? Une
          image complète qu'aucun ne pourrait fournir seul.
        </p>

        <h2>Le Cycle de Fatigue Mentale</h2>
        <p>La fatigue mentale crée un cycle vicieux :</p>
        <ol>
          <li>Une journée stressante augmente la fatigue mentale</li>
          <li>La fatigue mentale rend l'entraînement plus dur (RPE élevé)</li>
          <li>
            Les séances qui semblent plus dures augmentent le stress perçu
          </li>
          <li>Le stress accru aggrave la fatigue mentale</li>
          <li>Le cycle se répète, conduisant à l'épuisement</li>
        </ol>

        <p>
          Le suivi du RPE brise ce cycle. Quand vous voyez des modèles de RPE
          élevé, vous pouvez intervenir tôt—réduisant le stress d'entraînement,
          priorisant la récupération, adressant les causes racines de la fatigue
          mentale.
        </p>

        <h2>Application Pratique</h2>
        <p>Voici comment utiliser le RPE efficacement :</p>
        <ul>
          <li>
            <strong>Notez immédiatement après les séances :</strong> N'attendez
            pas—votre perception est la plus précise juste après la complétion
          </li>
          <li>
            <strong>Soyez honnête :</strong> Il n'y a pas de RPE "faux". Votre
            perception est votre réalité
          </li>
          <li>
            <strong>Cherchez des modèles :</strong> Le RPE est-il élevé après
            certains types de journées ?
          </li>
          <li>
            <strong>Faites confiance aux données :</strong> Si le RPE suggère
            que vous avez besoin de récupération, écoutez
          </li>
        </ul>

        <p>
          OpenAthlete vous facilite la tâche. Après chaque activité importée (IA
          activée), quelques questions courtes vous attendent et l'IA renseigne
          votre RPE à partir de vos réponses. Cela prend moins d'une minute, et
          vous construisez un historique que votre montre ne peut pas tenir.
        </p>

        <h2>En Résumé</h2>
        <p>
          La fatigue mentale est réelle, mesurable et impactante. Votre montre
          ne peut pas la détecter, mais le RPE peut. En combinant les métriques
          objectives avec la perception subjective, vous obtenez une image
          complète de votre état d'entraînement.
        </p>

        <p>
          N'ignorez pas l'écart entre ce que dit votre montre et comment vous
          vous sentez. Cet écart contient des informations critiques sur votre
          préparation, récupération et risque de blessure.
        </p>

        <p>
          <strong>
            Arrêtez de deviner, commencez à vous entraîner avec l'IA dès
            aujourd'hui.
          </strong>{' '}
          <a href="https://app.openathlete.org/auth/create-account">
            Inscrivez-vous sur OpenAthlete
          </a>{' '}
          et notez le ressenti de chaque séance à côté de ce que votre montre a
          mesuré.
        </p>
      </div>
    );
  },
  ContentEs: () => {
    return (
      <div>
        <p>
          <strong>
            Has tenido un día horrible en el trabajo. Plazos, conflictos,
            estrés. Sales a rastras a correr por la tarde. La misma ruta y el
            mismo ritmo que la semana pasada. Pero se te hace imposible.
          </strong>{' '}
          Tu reloj muestra las mismas métricas: frecuencia cardíaca, ritmo,
          potencia. Todo parece normal. Entonces, ¿por qué te cuesta tanto más?
        </p>

        <p>
          La respuesta está en la conexión entre tu cerebro y tus músculos. La
          fatiga mental no solo afecta a tu estado de ánimo: repercute
          directamente en tu rendimiento físico. Y aquí está la clave:{' '}
          <strong>tu reloj no puede medirla, pero el RPE sí.</strong>
        </p>

        <h2>La conexión entre cerebro y músculo</h2>
        <p>
          El rendimiento en resistencia no es puramente físico. Tu sistema
          nervioso central (SNC) desempeña un papel crucial. Cuando tienes
          fatiga mental, tu cerebro:
        </p>
        <ul>
          <li>
            <strong>Reduce el impulso nervioso:</strong> Envía señales más
            débiles a tus músculos
          </li>
          <li>
            <strong>Aumenta el esfuerzo percibido:</strong> Hace que la misma
            carga de trabajo parezca más dura
          </li>
          <li>
            <strong>Empeora la gestión del ritmo:</strong> Altera tu capacidad
            para juzgar el esfuerzo con precisión
          </li>
          <li>
            <strong>Acelera la fatiga:</strong> Hace que llegues antes al
            agotamiento
          </li>
        </ul>

        <p>
          Las investigaciones muestran que la fatiga mental puede reducir el
          tiempo hasta el agotamiento en un 15-20 % a la misma intensidad
          fisiológica. Tu frecuencia cardíaca puede ser idéntica, pero tu
          rendimiento no.
        </p>

        <h2>Por qué los relojes no lo detectan</h2>
        <p>Tu Garmin, tu Apple Watch o Strava registran métricas objetivas:</p>
        <ul>
          <li>Frecuencia cardíaca (respuesta cardiovascular)</li>
          <li>Ritmo/potencia (rendimiento externo)</li>
          <li>Datos GPS (distancia, desnivel)</li>
          <li>Cadencia (patrones de movimiento)</li>
        </ul>

        <p>
          Son valiosas, pero incompletas. Miden{' '}
          <strong>lo que hace tu cuerpo</strong>, no{' '}
          <strong>cómo responde tu cuerpo</strong>. No pueden detectar:
        </p>
        <ul>
          <li>La fatiga mental causada por el estrés laboral</li>
          <li>El estado emocional (ansiedad, depresión, motivación)</li>
          <li>
            La carga cognitiva (fatiga por tomar decisiones, sobrecarga de
            información)
          </li>
          <li>
            El impacto de la calidad del sueño en el funcionamiento del SNC
          </li>
        </ul>

        <p>
          Aquí es donde el RPE se vuelve imprescindible. Cuando valoras una
          sesión con un «8/10» en lugar del «6/10» habitual para el mismo ritmo
          y la misma frecuencia cardíaca, estás cuantificando algo que tu reloj
          no puede medir.
        </p>

        <h2>La ciencia del RPE</h2>
        <p>
          El esfuerzo percibido (RPE, por sus siglas en inglés) no es solo «cómo
          te sientes»: es una herramienta científica validada. La escala de Borg
          (6-20) y la escala de Borg modificada (0-10) se utilizan en ciencias
          del deporte desde hace décadas. Las investigaciones muestran de forma
          sistemática que el RPE:
        </p>
        <ul>
          <li>Se correlaciona estrechamente con el estrés fisiológico real</li>
          <li>
            En algunos contextos, predice el rendimiento mejor que la frecuencia
            cardíaca por sí sola
          </li>
          <li>Recoge la interacción entre los factores físicos y mentales</li>
          <li>Da señales de alerta temprana de sobrecarga (overreaching)</li>
        </ul>

        <p>
          Cuando tu RPE está por encima de lo que indican las métricas
          objetivas, eso es un dato. Te está diciendo algo importante sobre tu
          estado actual, algo que tu reloj no puede ver.
        </p>

        <h2>Lo que aporta OpenAthlete</h2>
        <p>
          Después de cada sesión, OpenAthlete te pregunta cómo te fue: un campo
          de RPE (tu entrenador puede hacerlo obligatorio) o unas preguntas
          breves, que respondes por texto, con un toque o por voz, de las que la
          IA extrae tu RPE. Te explicamos por qué importa:
        </p>

        <p>OpenAthlete pone tu RPE en contexto:</p>
        <ul>
          <li>
            <strong>Junto a las cifras:</strong> el RPE aparece al lado del
            ritmo, la frecuencia cardíaca y la potencia de cada actividad
          </li>
          <li>
            <strong>Preguntas adaptadas al día:</strong> sensaciones, fatiga,
            sueño y dolor, según tu carga reciente y tus lesiones
          </li>
          <li>
            <strong>Carga por RPE de sesión:</strong> RPE × minutos, como
            alternativa al TRIMP cardíaco
          </li>
          <li>
            <strong>Indicadores de recuperación:</strong> sueño, VFC, frecuencia
            cardíaca en reposo e índice de Hooper en el calendario
          </li>
        </ul>

        <p>
          Cuando aparecen patrones, como un RPE elevado después de días
          estresantes, te toca actuar a ti (o a tu entrenador):
        </p>
        <ul>
          <li>Reducir la intensidad de la siguiente sesión</li>
          <li>Añadir un día extra de recuperación</li>
          <li>Pasar a actividades menos exigentes</li>
          <li>Centrarte en el sueño y en la gestión del estrés</li>
        </ul>

        <h2>El impacto en la práctica</h2>
        <p>Imagina dos sesiones de entrenamiento idénticas:</p>

        <p>
          <strong>Sesión A (lunes, después de un buen fin de semana):</strong>
        </p>
        <ul>
          <li>Ritmo: 4:30/km</li>
          <li>Frecuencia cardíaca: 155 ppm</li>
          <li>RPE: 6/10</li>
          <li>Sensaciones: fuerte, con el esfuerzo bajo control</li>
        </ul>

        <p>
          <strong>
            Sesión B (miércoles, después de un día de trabajo estresante):
          </strong>
        </p>
        <ul>
          <li>Ritmo: 4:30/km</li>
          <li>Frecuencia cardíaca: 155 ppm</li>
          <li>RPE: 8/10</li>
          <li>Sensaciones: sufriendo, piernas pesadas</li>
        </ul>

        <p>
          Tu reloj ve dos sesiones idénticas. Pero el RPE revela la verdad: la
          sesión B generó más estrés interno, aunque las métricas externas
          fueran idénticas. Sin el RPE, nunca lo sabrías. Podrías seguir
          apretando pensando que simplemente has tenido un «mal día», cuando en
          realidad tu SNC está fatigado y necesita recuperarse.
        </p>

        <h2>Cubrir el vacío de Strava y Garmin</h2>
        <p>
          Strava y Garmin son excelentes para registrar lo que hiciste. Pero no
          entienden en absoluto cómo te sentiste. Este vacío importa porque:
        </p>
        <ul>
          <li>
            <strong>
              La adaptación al entrenamiento depende de la carga interna, no
              solo de la externa
            </strong>
          </li>
          <li>
            <strong>
              El riesgo de lesión aumenta cuando la carga interna supera tu
              capacidad
            </strong>
          </li>
          <li>
            <strong>
              Rendir al máximo exige ajustar el entrenamiento a tu estado actual
            </strong>
          </li>
        </ul>

        <p>
          OpenAthlete cubre este vacío combinando datos objetivos (de tu reloj)
          con datos subjetivos (el RPE). ¿El resultado? Una visión completa que
          ninguno de los dos podría ofrecer por separado.
        </p>

        <h2>El círculo vicioso de la fatiga mental</h2>
        <p>La fatiga mental crea un círculo vicioso:</p>
        <ol>
          <li>Un día estresante aumenta la fatiga mental</li>
          <li>
            La fatiga mental hace que el entrenamiento se sienta más duro (RPE
            elevado)
          </li>
          <li>
            Las sesiones que se sienten más duras aumentan el estrés percibido
          </li>
          <li>Más estrés agrava la fatiga mental</li>
          <li>El ciclo se repite y acaba en agotamiento (burnout)</li>
        </ol>

        <p>
          Controlar el RPE rompe este círculo. Cuando detectas patrones de RPE
          elevado, puedes intervenir pronto: reducir el estrés del
          entrenamiento, priorizar la recuperación y atacar las causas de fondo
          de la fatiga mental.
        </p>

        <h2>Aplicación práctica</h2>
        <p>Así puedes sacar partido al RPE:</p>
        <ul>
          <li>
            <strong>Valora la sesión justo al terminar:</strong> No esperes: tu
            percepción es más precisa justo después de acabar
          </li>
          <li>
            <strong>Sé sincero:</strong> No hay un RPE «incorrecto». Tu
            percepción es tu realidad
          </li>
          <li>
            <strong>Busca patrones:</strong> ¿Tu RPE sube después de cierto tipo
            de días?
          </li>
          <li>
            <strong>Confía en los datos:</strong> Si el RPE indica que necesitas
            recuperarte, hazle caso
          </li>
        </ul>

        <p>
          OpenAthlete te lo pone fácil. Después de cada actividad importada (con
          la IA activada), te esperan unas preguntas breves y la IA rellena tu
          RPE a partir de tus respuestas. Te lleva menos de un minuto, y
          construyes un historial que tu reloj no puede tener.
        </p>

        <h2>En resumen</h2>
        <p>
          La fatiga mental es real, medible y tiene consecuencias. Tu reloj no
          puede detectarla, pero el RPE sí. Al combinar métricas objetivas con
          la percepción subjetiva, obtienes una visión completa de tu estado de
          entrenamiento.
        </p>

        <p>
          No ignores la diferencia entre lo que dice tu reloj y cómo te sientes.
          Esa diferencia contiene información clave sobre lo preparado que
          estás, tu recuperación y tu riesgo de lesión.
        </p>

        <p>
          <strong>Deja de adivinar y empieza hoy a entrenar con IA.</strong>{' '}
          <a href="https://app.openathlete.org/auth/create-account">
            Regístrate en OpenAthlete
          </a>{' '}
          y anota cómo sentiste cada sesión junto a lo que midió tu reloj.
        </p>
      </div>
    );
  },
};
