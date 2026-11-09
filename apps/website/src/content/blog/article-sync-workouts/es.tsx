import { DISCORD_URL } from '@/config';
import Link from 'next/link';

export function ContentEs() {
  return (
    <div>
      <p>
        Un entrenamiento estructurado en el reloj hace tres cosas útiles: te
        avisa de cuándo empieza y termina cada bloque, te muestra si estás
        dentro del rango objetivo y cuenta las repeticiones por ti. En una
        sesión como 15' suave, 5 × 4' a umbral con 2' de trote, 10' suave, es la
        diferencia entre correr la sesión y hacer cuentas mientras la corres.
      </p>
      <p>
        Pasar la sesión de un plan de entrenamiento a la muñeca depende de la
        marca. Esta guía cubre las tres marcas que aceptan entrenamientos de
        otras aplicaciones (Garmin, COROS y Suunto), qué hacer si tienes un
        Polar, y termina con una lista de comprobaciones para el día en que un
        entrenamiento no aparece.
      </p>

      <h2>Qué relojes pueden recibir entrenamientos</h2>
      <p>
        Todas las marcas te dejan crear un entrenamiento en su propia app. Menos
        son las que dejan que una plataforma externa te lo envíe.
      </p>
      <ul>
        <li>
          <strong>Garmin</strong> acepta entrenamientos de socios aprobados.
          Llegan a tu calendario de Garmin Connect y al reloj en la siguiente
          sincronización.
        </li>
        <li>
          <strong>Suunto</strong> los acepta como guías: así llama Suunto a una
          sesión estructurada que eliges al iniciar un ejercicio.
        </li>
        <li>
          <strong>COROS</strong> acepta sesiones estructuradas de carrera, trail
          y bici, que aparecen en el calendario de la app de COROS y luego en el
          reloj.
        </li>
        <li>
          La API pública de <strong>Polar</strong> permite leer tus actividades
          y tu sueño, no escribir en tu cuenta, así que OpenAthlete no puede
          enviar entrenamientos allí. Puedes crearlos a mano en Polar Flow.
        </li>
        <li>
          <strong>Strava</strong> no tiene entrenamientos estructurados: no hay
          nada adonde enviar.
        </li>
      </ul>

      <h2>Qué hace que un entrenamiento sea "estructurado"</h2>
      <p>
        Un reloj solo puede guiarte por pasos. Cada paso necesita una longitud
        (duración o distancia) y, a ser posible, un objetivo: un rango de ritmo,
        de pulso o de potencia. Las repeticiones agrupan pasos, así que "5 × (4'
        a 4:10–4:20/km, 2' suave)" es un bloque de repetición con dos pasos.
      </p>
      <p>
        Una sesión que solo dice "60 minutos suave", sin pasos, no envía nada:
        el reloj no tiene nada que guiar. Si la quieres en la muñeca,
        conviértela en un único paso de 60 minutos con un tope de pulso.
      </p>
      <p>
        Los objetivos por zonas merecen un comentario. Tus zonas en una
        plataforma de entrenamiento y las de tu reloj casi nunca coinciden.
        Cuando un paso apunta a una de tus zonas, OpenAthlete envía los valores
        reales (por ejemplo 148–158 ppm o 4:35–4:45/km) en lugar de "zona 3",
        para que el objetivo en la muñeca coincida con el plan, tenga el reloj
        las zonas que tenga. Lo mismo con los porcentajes de FCmáx o de potencia
        umbral, siempre que esos valores estén en tus métricas.
      </p>

      <h2>Garmin</h2>
      <p>
        Con Garmin conectado y la exportación de entrenamientos activada, cada
        sesión estructurada va a tu calendario de Garmin Connect. El reloj la
        recoge en su siguiente sincronización con la app. En la mayoría de
        Forerunner, Fenix y Venu recientes, el entrenamiento programado para hoy
        se ofrece al iniciar la actividad correspondiente; si no, búscalo en el
        menú de entrenamiento, en entrenamientos o en el calendario. Los nombres
        de los menús cambian según el modelo, así que consulta el manual si no
        lo ves.
      </p>
      <p>
        Si mueves o editas la sesión en OpenAthlete, la copia de Garmin la
        sigue. Se envían sesiones de carrera, ciclismo, natación en piscina,
        fuerza, cardio, yoga y pilates. En piscina, Garmin solo admite el ritmo
        como objetivo, así que los objetivos de pulso en los pasos de natación
        se descartan. Garmin también limita un entrenamiento a 100 pasos,
        repeticiones incluidas, algo que solo importa si escribes sesiones de
        pista muy largas paso a paso.
      </p>
      <p>
        Los detalles de configuración están en la{' '}
        <Link href="/es/connect/garmin">página de conexión con Garmin</Link>.
      </p>

      <h2>COROS</h2>
      <p>
        Las sesiones de carrera, trail y ciclismo van a COROS. Aparecen en el
        calendario de la app de COROS y llegan al reloj cuando sincroniza.
        Natación y fuerza no se envían.
      </p>
      <p>
        COROS tiene una particularidad que conviene conocer antes de la semana
        de carrera: una app no puede borrar allí una sesión planificada. Si
        mueves o eliminas una sesión en OpenAthlete, la antigua se queda en el
        calendario de COROS marcada como cancelada, y la borras tú en la app de
        COROS. Al conectar, elige la región donde creaste tu cuenta de COROS
        (Europa, Estados Unidos y otras regiones, o China continental): COROS
        guarda cada cuenta en un único servidor regional.
      </p>
      <p>
        El conector de COROS es el más reciente, activo desde noviembre de 2026.
        Detalles y limitaciones conocidas en la{' '}
        <Link href="/es/connect/coros">página de conexión con COROS</Link>.
      </p>

      <h2>Suunto</h2>
      <p>
        Las sesiones de carrera, trail, ciclismo y natación llegan a tu cuenta
        de Suunto como guías. En el reloj, elige la guía al iniciar el
        ejercicio, como cualquier otra guía de Suunto. Las sesiones de fuerza se
        quedan en OpenAthlete. La{' '}
        <Link href="/es/connect/suunto">página de conexión con Suunto</Link>{' '}
        explica la configuración.
      </p>

      <h2>Polar: las actividades llegan, los entrenamientos a mano</h2>
      <p>
        Con un Polar, tus actividades, tu sueño y tu VFC nocturna pueden llegar
        igualmente a OpenAthlete de forma automática. Para la sesión tienes dos
        opciones: crearla en Polar Flow como objetivo de entrenamiento por fases
        y sincronizar el reloj, o seguirla desde la app de OpenAthlete en el
        móvil. Ninguna es tan cómoda como una sincronización directa, y conviene
        saberlo antes de comprar un reloj si las sesiones estructuradas te
        importan.
      </p>

      <h2>Cuando es tu entrenador quien planifica</h2>
      <p>
        Las sesiones salen por la conexión del atleta, no por la del entrenador.
        Tu entrenador puede planificar en tu calendario con cualquier reloj, o
        sin reloj; mientras tengas conectado Garmin, COROS o Suunto con la
        exportación activada, sus sesiones llegan a tu muñeca igual que las que
        planificas tú. Un entrenador puede tener atletas en las tres marcas sin
        hacer nada distinto para cada uno.
      </p>

      <h2>El entrenamiento no aparece en mi reloj: lista de comprobaciones</h2>
      <p>Repásala en orden. Los dos primeros puntos explican casi todo.</p>
      <ul>
        <li>
          <strong>¿La sesión está dentro de los próximos siete días?</strong>{' '}
          OpenAthlete envía la semana que viene, no todo el plan. Una sesión
          dentro de tres semanas se enviará sola cuando entre en los siete días.
          Las sesiones pasadas no se envían.
        </li>
        <li>
          <strong>¿Ha sincronizado el reloj desde entonces?</strong> El
          entrenamiento llega primero a Garmin Connect, la app de COROS o la app
          de Suunto. Abre la app de la marca y deja que el reloj sincronice.
        </li>
        <li>
          <strong>¿Está activada la exportación?</strong> En Ajustes,
          Conexiones, comprueba que la exportación de entrenamientos está
          activada para esa marca.
        </li>
        <li>
          <strong>¿La sesión tiene pasos?</strong> Una duración sin pasos no
          envía nada.
        </li>
        <li>
          <strong>¿Esa marca admite el deporte?</strong> Una sesión de fuerza no
          va a COROS ni a Suunto; una de natación no va a COROS.
        </li>
        <li>
          <strong>¿Tu modelo puede seguir entrenamientos estructurados?</strong>{' '}
          La mayoría de relojes de running recientes sí; algunos modelos de gama
          de entrada o antiguos, no.
        </li>
        <li>
          <strong>Solo COROS:</strong> una sesión que moviste puede aparecer dos
          veces, una marcada como cancelada. Borra esa en la app de COROS.
        </li>
        <li>
          <strong>¿Sigue sin aparecer?</strong> Desconecta y vuelve a conectar
          la marca en Ajustes, Conexiones, y escríbenos en{' '}
          <a href={DISCORD_URL}>Discord</a> con la fecha de la sesión.
        </li>
      </ul>

      <h2>Hacerlo a mano</h2>
      <p>
        No necesitas ninguna plataforma para poner un entrenamiento en el reloj.
        Garmin Connect, la app de COROS y Polar Flow tienen editor de
        entrenamientos: creas los pasos, guardas y sincronizas. Para una sesión
        clave a la semana son diez minutos y funciona bien. Se vuelve pesado
        cuando el plan cambia a menudo, cuando un entrenador escribe para varios
        atletas o cuando los ritmos deben seguir zonas actualizadas. Ahí es
        donde compensa que una plataforma los envíe.
      </p>
      <p>
        OpenAthlete envía entrenamientos a Garmin, COROS y Suunto en el plan
        gratuito, e importa actividades de esas tres marcas además de Polar y
        Strava. La{' '}
        <Link href="/es/features/watch-sync">
          página de sincronización con relojes
        </Link>{' '}
        tiene la tabla completa, marca por marca.
      </p>
    </div>
  );
}
