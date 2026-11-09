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

      <h2>Dos formas de llevar un club en OpenAthlete hoy</h2>
      <p>
        Primero la respuesta directa: OpenAthlete no tiene cuenta de club. No
        hay grupos, ni calendario de club, ni facturación al club. Lo que existe
        sirve igualmente para un club, de una de estas dos formas.
      </p>
      <p>
        <strong>Una cuenta por entrenador, en nuestros servidores.</strong> Cada
        entrenador tiene su propia cuenta gratuita, que cubre hasta cinco
        atletas; Supporter (5 € al mes o 50 € al año por entrenador) quita el
        límite. Un atleta puede tener varios entrenadores, así que el de carrera
        y el de fuerza planifican en el mismo calendario. Las conversaciones de
        grupo mantienen unido a un grupo de entrenamiento, cada sesión tiene su
        propio hilo de comentarios y cada entrenador tiene un panel para sus
        atletas con cumplimiento, volumen, forma y alertas de dolor e
        inactividad. Los socios pueden usar cualquier reloj: las actividades
        llegan de Garmin, COROS, Suunto, Polar, Strava o archivos, y los
        entrenamientos planificados llegan a relojes Garmin, COROS y Suunto.
        También pueden suscribirse a sus sesiones desde Google Calendar o el
        Calendario de Apple.
      </p>
      <p>
        <strong>El club tiene su propia instancia.</strong> OpenAthlete es de
        código abierto, así que un club puede instalarlo en un servidor pequeño
        y tener su propia plataforma en su propia dirección, sin límite de
        atletas ni suscripción. Los socios pueden entrar con inicio de sesión
        único mediante Authentik, Keycloak o cualquier proveedor OpenID Connect,
        y el registro puede ser solo por invitación o estar cerrado. Una
        instancia autoalojada no envía nada a OpenAthlete. Una salvedad honesta:
        la sincronización con COROS funciona tal cual, pero Garmin, Suunto,
        Polar y Strava exigen que el club se registre en el programa para
        desarrolladores de cada marca, y Garmin y Suunto aprueban a los socios
        uno por uno. La importación de archivos siempre funciona.
      </p>
      <p>
        Para un club con uno o dos entrenadores y unas decenas de atletas, la
        primera opción es la forma más rápida de empezar. Para un club más
        grande, con alguien que se maneje con un servidor, la segunda es lo más
        parecido a una cuenta de club que existe hoy. La{' '}
        <Link href="/es/clubs">página de clubes</Link> compara las dos, con el
        coste para un club de 50 atletas, y la{' '}
        <Link href="/es/self-hosting">página de autoalojamiento</Link> explica
        la instalación. Las funciones de club están en la hoja de ruta; si tu
        club tiene necesidades concretas, contarnos cómo entrenáis de verdad es
        lo más útil que nos puedes aportar.
      </p>
    </div>
  );
}
