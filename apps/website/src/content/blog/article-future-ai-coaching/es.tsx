import Link from 'next/link';

import { Sources } from './sources';

export function ContentEs() {
  return (
    <div>
      <p>
        Hace un par de años, "entrenamiento con IA" significaba sobre todo un
        chatbot que escribía un plan genérico de doce semanas y se olvidaba de
        ti en cuanto cerrabas la pestaña. Lo que ha cambiado desde entonces no
        es que los modelos de lenguaje entiendan de repente mejor el
        entrenamiento. Es que ahora pueden actuar: abrir tu calendario, leer las
        actividades del mes pasado y escribir sesiones en el plan que tu reloj
        descargará mañana por la mañana. Eso es lo que se llama agentes, y
        conviene pensar con calma qué cambia para los entrenadores y qué no.
      </p>

      <h2>Qué es MCP, en breve</h2>
      <p>
        El Model Context Protocol es un estándar abierto, presentado por
        Anthropic en noviembre de 2024, que permite a un cliente de IA como
        Claude o ChatGPT llamar a herramientas que expone otra aplicación. Una
        plataforma de entrenamiento puede exponer herramientas como "leer el
        calendario de estas semanas", "obtener la carga de entrenamiento",
        "planificar estas sesiones" o "mover esta sesión al jueves". El modelo
        decide qué herramientas llamar y en qué orden. La aplicación decide qué
        puede tocar el modelo y comprueba cada petición como comprobaría un clic
        del usuario.
      </p>
      <p>
        Esa separación importa. El modelo pone el lenguaje y el razonamiento; la
        plataforma guarda los datos, los permisos y las reglas. Un modelo que te
        entiende mal puede proponer una tontería, pero no puede llegar a nada
        que la plataforma no exponga.
      </p>

      <h2>Un lunes realista</h2>
      <p>
        Pongamos un entrenador con quince atletas. El lunes por la mañana una de
        ellas, a nueve semanas de un maratón, escribe que tiene gripe desde el
        sábado y que, con suerte, volverá el jueves. El trabajo de siempre:
        abrir su calendario, borrar o mover cinco o seis sesiones, rehacer el
        resto de la semana, acortar la tirada larga y comprobar que la semana
        siguiente sigue teniendo sentido. Diez o quince minutos, y es el tercer
        mensaje así del día.
      </p>
      <p>
        Con un agente conectado a la plataforma, el entrenador puede escribir:
        "Anna está enferma desde el sábado, probablemente hasta el jueves.
        Regístralo, deja todo suave hasta el domingo, pasa el 3 × 15 minutos a
        ritmo de maratón del sábado al martes que viene y deja la tirada larga
        del domingo en 1 h 15 suave". El agente registra la enfermedad, lee el
        calendario, hace los cambios e informa. El entrenador revisa la semana
        en el calendario, corrige una cosa y sigue con lo suyo.
      </p>
      <p>
        Fíjate en quién tomó las decisiones. Cada elección de esa instrucción
        (cuánto tiempo ir suave, qué sesión merece moverse, cuánto debe durar la
        tirada larga) vino del entrenador. El agente hizo los clics. Esa es la
        versión honesta de lo que los agentes aportan hoy al entrenamiento: la
        mitad administrativa del trabajo sale mucho más barata, y la mitad que
        depende del criterio se queda donde estaba.
      </p>

      <h2>En qué siguen fallando los agentes</h2>
      <p>
        <strong>Saber lo que no saben.</strong> Un agente planificará un bloque
        aunque los datos sean escasos: sin frecuencia cardiaca en la mitad de
        los rodajes, sin RPE, con una semana de viaje que nadie mencionó.
        Impellizzeri y sus colegas llevan años defendiendo que la carga interna,
        lo duro que fue el entrenamiento para ese atleta concreto, es lo que
        impulsa la adaptación, y es justo lo que más a menudo falta en los
        datos. Un entrenador ve el hueco. Un modelo tiende a rellenarlo con
        suposiciones.
      </p>
      <p>
        <strong>El criterio a largo plazo.</strong> Si añadir una tercera sesión
        de calidad, cuándo empezar la puesta a punto, si este atleta necesita
        ahora una semana de descarga o aguanta una más: todo eso depende de años
        de historial, de su trabajo y su familia, de cómo reacciona a la fatiga.
        Cuando Düking y sus colegas (2024) pidieron a entrenadores expertos que
        valoraran planes de carrera escritos por ChatGPT, los planes mejoraban
        mucho con más información, pero seguían sin considerarse óptimos, y los
        autores recomiendan la revisión de un entrenador.
      </p>
      <p>
        <strong>Errores con total seguridad.</strong> Una zona mal leída
        convierte un rodaje de recuperación en una sesión a umbral. Una fecha
        desplazada un día pone la tirada larga la víspera de una carrera. Los
        modelos de lenguaje cometen estos errores en un texto fluido y
        razonable, y por eso es fácil que se escapen.
      </p>
      <p>
        <strong>La responsabilidad.</strong> Cuando un plan contribuye a una
        lesión, alguien tiene que asumir esa decisión y hablarlo con el atleta.
        Un modelo no puede.
      </p>

      <h2>Mantener al entrenador en el circuito, en la práctica</h2>
      <p>
        "Mantener a una persona en el circuito" es fácil de decir. En una
        herramienta de entrenamiento se traduce en unas pocas decisiones de
        diseño concretas:
      </p>
      <ul>
        <li>
          El agente escribe en el mismo calendario que ven el entrenador y el
          atleta. Nada ocurre en una capa oculta, así que un cambio erróneo se
          ve enseguida.
        </li>
        <li>
          Tiene instrucciones de mover y editar sesiones en lugar de borrarlas y
          crearlas de nuevo: un cambio sigue siendo un cambio.
        </li>
        <li>
          Las sesiones completadas y las actividades registradas son historial.
          El agente no puede reescribirlas.
        </li>
        <li>
          La IA solo funciona tras un consentimiento explícito, que se puede
          retirar.
        </li>
        <li>
          Los datos van al proveedor de modelos que elegiste, con tu clave. En
          una instancia autoalojada con un modelo local, no salen de tu
          servidor.
        </li>
      </ul>

      <h2>Una apuesta prudente para los próximos años</h2>
      <p>
        El coste administrativo de entrenar a otros seguirá bajando. Un
        entrenador que pasa el domingo por la noche rehaciendo las semanas de
        veinte atletas dedicará mucho menos tiempo a eso. Puede ir en dos
        direcciones: más atletas por entrenador o más atención por atleta. La
        segunda es el mejor uso, y los atletas notarán cuál eligió su
        entrenador.
      </p>
      <p>
        A los atletas que se entrenan solos con un agente les irá bien si ya
        saben cómo es un buen entrenamiento y usan el agente para ejecutarlo. Es
        más arriesgado para los principiantes, que son los que peor detectan un
        mal plan y los que más tienden a seguirlo. No esperamos una predicción
        fiable de lesiones a corto plazo: la investigación sobre cribado y
        aprendizaje automático da pocos motivos para ello. Y la parte del oficio
        que consiste en notar que el "bien" de un atleta no significa bien no va
        a desaparecer.
      </p>

      <h2>Probarlo</h2>
      <p>
        OpenAthlete tiene un{' '}
        <Link href="/es/features/mcp-server">servidor MCP</Link> que funciona
        con Claude, ChatGPT y otros clientes. Puede leer el contexto de un
        atleta, su calendario, sus actividades y su carga de entrenamiento,
        registrar una enfermedad o un viaje y planificar hasta 60 sesiones de
        una vez; después las sesiones aparecen en el calendario y llegan a los
        relojes Garmin, Suunto y COROS. Es gratuito, y un entrenador puede
        usarlo con todos los atletas que entrena.
      </p>

      <h2>Fuentes</h2>
      <Sources />
    </div>
  );
}
