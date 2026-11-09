import Link from 'next/link';

export function ContentEs() {
  return (
    <div>
      <p>
        OpenAthlete es una plataforma de entrenamiento para deportistas de
        resistencia y sus entrenadores. Tiene un calendario de sesiones
        planificadas, entrenamientos estructurados que se envían al reloj,
        actividades que vuelven de él, un modelo de carga de entrenamiento y un
        espacio compartido donde entrenador y atleta trabajan sobre el mismo
        plan. El código es abierto, con licencia AGPL-3.0. La versión alojada es
        gratuita, y también puedes instalarla en tu propio servidor.
      </p>
      <p>
        Este artículo explica por qué existe, qué hace hoy y, igual de útil, qué
        no hace.
      </p>

      <h2>Por qué existe</h2>
      <p>
        Detrás de OpenAthlete hay un desarrollador independiente de Grenoble que
        corre ultras. No hay inversores. El proyecto nació de una rutina
        conocida: planificar la temporada en una hoja de cálculo, volver a
        teclear cada sesión de series en la app del fabricante del reloj y abrir
        una tercera app para ver si la sesión había salido como estaba previsto.
        Tres herramientas, y ninguna sabía nada de las otras dos.
      </p>
      <p>
        Las plataformas comerciales que resuelven esto son buenos productos.
        También cobran a los entrenadores por atleta y guardan años de historial
        en sus servidores, con sus condiciones. Cuando Today's Plan cerró en
        marzo de 2024, sus usuarios descubrieron cuánto de ese historial podían
        llevarse de verdad. En julio de 2026 Garmin compró TrainingPeaks, una de
        las plataformas de entrenamiento más conocidas, con lo que los planes de
        muchos entrenadores quedan en manos de un fabricante de relojes.
      </p>
      <p>
        La idea de OpenAthlete es que el núcleo de una plataforma de
        entrenamiento (un calendario, entrenamientos estructurados, un modelo de
        carga, la conexión con el reloj) es infraestructura. Y la
        infraestructura funciona mejor cuando cualquiera puede leerla, ponerla
        en marcha y mantenerla viva.
      </p>

      <h2>Qué hace hoy</h2>
      <p>
        <strong>Planificación.</strong> Construyes los entrenamientos paso a
        paso, por ejemplo 15 minutos suaves, 5 × 4 minutos a umbral con 2
        minutos de trote, 10 minutos suaves, y los objetivos salen de tus
        propias zonas, ritmos o porcentajes de VAM, FTP o frecuencia cardiaca
        máxima. Las sesiones están en un calendario donde se arrastran, y un
        entrenador puede mover o copiar semanas enteras de una vez.
      </p>
      <p>
        <strong>Tu reloj.</strong> Los entrenamientos planificados se envían a
        relojes Garmin, Suunto y COROS. Las actividades realizadas llegan desde
        Garmin, COROS, Suunto, Polar y Strava, o desde un archivo FIT, GPX o
        TCX. Al conectar una cuenta, Strava y COROS traen todo tu historial,
        Garmin y Suunto los últimos 30 días, y Polar solo las actividades
        nuevas.
      </p>
      <p>
        <strong>Carga de entrenamiento.</strong> La carga se calcula con TRIMP a
        partir de la frecuencia cardiaca, y el RPE de sesión se registra al
        lado. La forma, la fatiga y el estado (CTL, ATL y TSB) se proyectan
        sobre las sesiones planificadas, así que ves lo que las próximas tres
        semanas le harán a tu forma antes de la carrera y no después. La página
        de <Link href="/es/features/training-load">carga de entrenamiento</Link>{' '}
        explica el modelo.
      </p>
      <p>
        <strong>Entrenadores.</strong> El entrenador planifica directamente en
        el calendario de cada atleta, reutiliza plantillas y ve lo que se hizo
        de verdad. Un atleta puede tener más de un entrenador, y hay un chat de
        grupo. Entrenar hasta a cinco atletas es gratis.
      </p>
      <p>
        <strong>IA, si la quieres.</strong> Nada se ejecuta sin tu
        consentimiento, que puedes retirar cuando quieras. Si la activas, la IA
        puede escribir una sesión estructurada a partir de una frase, modificar
        una sesión con una instrucción breve, hacerte tres o cuatro preguntas
        después de una actividad y convertir tus respuestas en una nota de
        esfuerzo y un registro de dolor que ve tu entrenador, darte una lectura
        breve de cada actividad nueva y estimar la carga de una sesión
        planificada. Usas tu propia clave de API (OpenAI, Anthropic, Google,
        Mistral y otros, o un modelo local en una instancia autoalojada) o la
        cuota incluida en el plan Supporter. No hay chat dentro de la app: si
        quieres conversar, el{' '}
        <Link href="/es/features/mcp-server">servidor MCP</Link> permite que
        Claude o ChatGPT lean tu entrenamiento y planifiquen sesiones en tu
        calendario.
      </p>

      <h2>Qué no hace</h2>
      <ul>
        <li>
          Los entrenamientos no se pueden enviar a relojes Polar ni a Strava.
          Ambos son solo fuentes de actividades.
        </li>
        <li>
          No existe una entidad de club o equipo. Un entrenador puede planificar
          para muchos atletas a la vez, pero no hay página ni administración de
          club.
        </li>
        <li>
          No predice lesiones. Registra el dolor cuando el atleta lo indica y se
          lo muestra a su entrenador, que es menos vistoso y más honesto.
        </li>
        <li>Las unidades son solo métricas.</li>
        <li>
          Las apps de iOS y Android están en fase de pruebas. Mientras tanto, la
          app web funciona en el móvil y se puede instalar en la pantalla de
          inicio.
        </li>
        <li>
          La conexión con COROS es nueva: puede tener algún fallo, y nos viene
          bien que nos avises.
        </li>
      </ul>

      <h2>Cómo se financia</h2>
      <p>
        Todas las funciones son gratuitas en la versión alojada. El plan
        Supporter, a 5 € al mes o 50 € al año, añade dos cosas: IA con las
        claves de OpenAthlete, con una cuota mensual, y entrenar a más de cinco
        atletas. El autoalojamiento es gratuito y sin límites. Los detalles
        están en la <Link href="/es/pricing">página de precios</Link>.
      </p>
      <p>
        La API y la base de datos de la versión alojada funcionan en OVH, en
        Francia, y la app web la sirve Vercel. Una instancia autoalojada no
        envía nada a OpenAthlete, y una prueba automatizada lo comprueba en cada
        versión.
      </p>

      <h2>Por dónde empezar</h2>
      <p>
        Si entrenas por tu cuenta, conecta tu reloj, define tus zonas (la{' '}
        <Link href="/es/tools/heart-rate-zones">
          calculadora de zonas de frecuencia cardiaca
        </Link>{' '}
        es un buen punto de partida si nunca las has medido) y planifica una
        semana. Si entrenas a otros, invita primero a un solo atleta y haced una
        semana completa juntos antes de pasar a todos.
      </p>
      <p>
        El código fuente está en{' '}
        <a href="https://github.com/openathleteorg/openathlete">GitHub</a>. Los
        errores y las peticiones de funciones se dejan allí o en Discord. Se
        leen, y deciden buena parte de lo que se construye después.
      </p>
    </div>
  );
}
