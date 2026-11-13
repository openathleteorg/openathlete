import Link from 'next/link';

export function ContentEs() {
  return (
    <div>
      <p>
        Piensa en un club de running o de triatlón cualquiera. Pista el martes,
        umbral o cuestas el jueves, tirada larga en grupo el domingo. Tres o
        cuatro entrenadores voluntarios, un responsable técnico que además lleva
        la web del club, y entre cuarenta y doscientos socios, desde quien
        prepara su primer 10K hasta quien persigue bajar de 3 horas en maratón.
        El entrenamiento vive en un grupo de WhatsApp, una hoja de cálculo
        compartida que solo entiende una persona y la memoria del responsable
        técnico.
      </p>
      <p>
        Funciona, hasta que deja de funcionar. La persona de la hoja de cálculo
        se muda. Un socio con molestias en el Aquiles se lo cuenta a un
        entrenador que el martes siguiente no está. El grupo de WhatsApp tiene
        140 personas y la mitad lo ha silenciado. Pasar el entrenamiento a
        internet no arregla nada de esto por sí solo. Organizarlo un poco, sí.
      </p>

      <h2>Empieza por quién entrena a quién</h2>
      <p>
        Antes de elegir herramienta, pon la estructura por escrito. Los clubes
        que funcionan bien suelen tener los mismos elementos, sea cual sea el
        software:
      </p>
      <ul>
        <li>
          Grupos definidos por el ritmo actual, no por la ambición. Un grupo de
          "rodaje a 5:30-6:00/km" y otro de "4:45-5:15/km" son más claros que
          "intermedio" y "avanzado", y se puede pasar de uno a otro sin que
          parezca un ascenso o un descenso.
        </li>
        <li>
          Un entrenador responsable por grupo, y un suplente para las semanas en
          que no está.
        </li>
        <li>
          Para los socios que quieren un plan individual, un entrenador
          principal. Otros pueden ayudar, pero una sola persona responde de la
          carga total.
        </li>
        <li>
          Un único sitio donde se anotan lesiones y molestias, para que el
          siguiente entrenador de turno lo sepa.
        </li>
      </ul>

      <h2>Escribe las sesiones del club una sola vez</h2>
      <p>
        La mayoría de las sesiones de club se repiten con variaciones: de 6 a 10
        × 400 m a ritmo de 5K con 200 m de trote, 3 × 8' en umbral, cuestas de
        45". El responsable técnico (o quien disfrute haciéndolo) escribe las
        sesiones de la semana una vez, con objetivos en porcentaje de la VAM, el
        umbral o la frecuencia cardíaca máxima de cada socio en lugar de ritmos
        fijos. Así el corredor de 4:00/km y el de 6:00/km hacen el mismo
        entrenamiento cada uno a su intensidad, y los entrenadores de grupo solo
        ajustan el volumen: ocho repeticiones para un grupo, cinco para otro.
      </p>
      <p>
        Guárdalas en una biblioteca compartida, no en la cabeza de alguien. El
        día que el responsable técnico lo deje, el club conserva sus sesiones.
      </p>

      <h2>Separa los avisos de las conversaciones de entrenamiento</h2>
      <p>
        Un único chat de grupo para todo es donde la información va a morir.
        Sepáralo: un canal solo de avisos (cambio de lugar, carreras, asamblea),
        donde solo publican los entrenadores, y conversaciones de entrenamiento
        por grupo. El comentario sobre la sesión de una persona concreta va en
        esa sesión, no en un chat de sesenta personas.
      </p>

      <h2>Los datos de salud piden cuidado</h2>
      <p>
        Los dolores reportados y las notas de lesión son datos de salud, una
        categoría especial según el RGPD en la Unión Europea, y la frecuencia
        cardíaca o el sueño también pueden serlo. Los socios tienen derecho a
        saber quién los ve. En la práctica: pide permiso antes de conectar su
        reloj, da a cada entrenador acceso solo a los socios que entrena de
        verdad y decide quién puede leer las notas de lesión. Con los menores,
        implica a los padres.
      </p>

      <h2>Dos formas de llevar un club en OpenAthlete</h2>
      <p>
        OpenAthlete tiene un espacio de club. Es gratis en nuestros servidores,
        sin límite de atletas, y un club que prefiera su propio servidor tiene
        las mismas funciones instalando OpenAthlete allí.
      </p>
      <p>
        <strong>Un espacio de club, en nuestros servidores.</strong> Un
        entrenador crea el club en Ajustes &gt; Clubes y da a cada miembro un
        rol: propietario, administrador, entrenador, asistente o atleta. Todos
        los entrenadores del club llegan a los atletas del club, y esos atletas
        no cuentan para el límite de cinco atletas de una cuenta de entrenador
        gratuita. Los socios entran desde una lista que importas (pegada, o en
        CSV desde la hoja de cálculo del club, con los grupos), con un código de
        acceso o con enlaces que caducan. Cada grupo, por ritmo o por nivel,
        tiene sus entrenadores, y la biblioteca del club reúne los
        entrenamientos y carpetas que usan todos sus entrenadores.
      </p>
      <p>
        Para planificar un grupo, copias una sesión, un día o una semana a
        muchos atletas a la vez. Cada copia se adapta a las zonas y umbrales del
        atleta, una vista previa muestra lo que le falta a cada uno antes de
        confirmar, y un solo deshacer lo revierte todo. Las sesiones semanales
        del club, como la pista del martes en el estadio, aparecen en los
        calendarios del grupo con cuatro semanas de antelación: los atletas
        dicen si van, el entrenador ve cuántos serán y, si anula una fecha,
        todos reciben una notificación. Los mensajes van a un grupo o a todo el
        club, al momento o programados, y cada sesión conserva su hilo de
        comentarios. El panel del entrenador está pensado para decenas de
        atletas, con totales por periodo, alertas cuando una métrica como la
        frecuencia cardiaca en reposo o el peso cruza un umbral, y una barra
        lateral hecha para pasar de un atleta a otro entre treinta.
      </p>
      <p>
        Un atleta puede seguir teniendo varios entrenadores, así que el de
        carrera y el de fuerza planifican en el mismo calendario. Los socios
        pueden usar cualquier reloj: las actividades llegan de Garmin, COROS,
        Suunto, Polar, Strava o archivos, y los entrenamientos planificados
        llegan a relojes Garmin, COROS y Suunto, no a los Polar. También pueden
        suscribirse a sus sesiones desde Google Calendar o el Calendario de
        Apple. Lo que aún falta es la facturación al club: las cuotas se
        gestionan fuera de OpenAthlete.
      </p>
      <p>
        <strong>El club tiene su propia instancia.</strong> OpenAthlete es de
        código abierto, así que un club puede instalarlo en un servidor pequeño
        y tener su propia plataforma en su propia dirección, con las mismas
        funciones de club, sin límite de atletas ni suscripción. Los socios
        pueden entrar con inicio de sesión único mediante Authentik, Keycloak o
        cualquier proveedor OpenID Connect, y el registro puede ser solo por
        invitación o estar cerrado. Una instancia autoalojada no envía nada a
        OpenAthlete. Una salvedad honesta: la sincronización con COROS funciona
        tal cual, pero Garmin, Suunto, Polar y Strava exigen que el club se
        registre en el programa para desarrolladores de cada marca, y Garmin y
        Suunto aprueban a los socios uno por uno. La importación de archivos
        siempre funciona.
      </p>
      <p>
        Para la mayoría de los clubes, el espacio de club en nuestros servidores
        es la forma más rápida de empezar. Un club que quiera tener los datos de
        sus socios en su propio servidor, y cuente con alguien que se maneje con
        uno, puede tomar el segundo camino. La{' '}
        <Link href="/es/clubs">página de clubes</Link> presenta las dos, y la{' '}
        <Link href="/es/self-hosting">página de autoalojamiento</Link> explica
        la instalación. Si tu club tiene necesidades concretas, contarnos cómo
        entrenáis de verdad es lo más útil que nos puedes aportar.
      </p>
    </div>
  );
}
