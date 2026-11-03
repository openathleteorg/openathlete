import Link from 'next/link';

export function ContentEs() {
  return (
    <div>
      <p>
        Muchos buenos entrenadores llevan todo su trabajo en una hoja de
        cálculo. Una pestaña por atleta, una fila por día, un color por tipo de
        sesión y una columna de comentarios que el atleta rellena, o no. Es
        gratis, se adapta a cualquier método y nadie te la puede quitar. El
        título de este artículo es un poco injusto: Excel no ha muerto, y para
        algunos entrenadores sigue siendo la herramienta adecuada.
      </p>
      <p>
        Pero tiene costes, y crecen con el número de atletas de formas que se
        pasan por alto. Este artículo los repasa, explica cómo sacar más partido
        a una hoja de cálculo si te quedas con ella, y en qué momento un
        software específico empieza a compensar.
      </p>

      <h2>Donde la hoja de cálculo funciona</h2>
      <p>
        Con tres a cinco atletas que conoces bien, que entrenan sobre todo por
        sensaciones y te escriben después de las sesiones clave, una hoja de
        cálculo es difícil de superar. Puedes escribir lo que quieras en una
        celda: "6 × 1 km a ritmo de 10K, 1'30 de trote, parar en la 4 si se
        quejan los gemelos" es una prescripción perfectamente válida, y ningún
        software te impondrá su vocabulario. Con Google Sheets es fácil
        compartir, el historial está donde lo dejaste y no hay suscripción.
      </p>

      <h2>Donde empieza a costar</h2>
      <p>
        El primer coste lo paga el atleta. Una sesión escrita en una celda hay
        que copiarla a mano en Garmin Connect o en la app de COROS para que
        aparezca en el reloj, o recordarla durante la salida. La mayoría lo hace
        con la sesión clave de la semana y se salta el resto, así que el umbral
        se corre al ritmo que recuerdan, no al que escribiste.
      </p>
      <p>
        El segundo es la vuelta. Para comparar lo planificado con lo hecho,
        alguien tiene que copiar la salida desde Strava o la app del reloj:
        distancia, tiempo, quizá el pulso medio. O lo hace el atleta, cuando se
        acuerda, o lo haces tú, el domingo por la noche. En ambos casos tienes
        un resumen de la sesión, no la sesión: ves que el 6 × 1 km salió a
        4:05/km de media, no que las dos últimas series fueron a 4:15 con el
        pulso subiendo.
      </p>
      <p>
        El tercero son los cambios. Una carrera se mueve dos semanas, un atleta
        pasa cinco días enfermo, una escapada a la montaña sustituye a un bloque
        de pista. En una hoja de cálculo reescribes filas a mano, compruebas que
        los totales semanales siguen teniendo sentido y esperas que el atleta
        haya abierto la última versión y no la que iba adjunta en el correo del
        martes pasado.
      </p>
      <p>
        El cuarto es la carga. La mayoría de entrenadores que siguen con hojas
        de cálculo controlan el volumen (kilómetros, horas) y poco más, porque
        ir más allá exige fórmulas y teclear datos. El volumen solo esconde
        mucho: 60 km de rodaje suave y 60 km con dos sesiones de calidad no son
        la misma semana.
      </p>

      <h2>Si sigues con la hoja de cálculo, hazlo bien</h2>
      <p>
        Unos pocos hábitos arreglan casi todo lo anterior sin cambiar de
        herramienta.
      </p>
      <ul>
        <li>
          Usa una hoja en línea compartida por atleta en lugar de archivos por
          correo. Así solo existe una versión, y el atleta ve los cambios en
          cuanto los haces.
        </li>
        <li>
          Añade dos columnas que el atleta rellena después de cada sesión: la
          duración en minutos y el esfuerzo en una escala de 0 a 10.
          Multiplícalas y tienes el RPE de sesión de Foster (Foster y col.,
          2001), una medida de carga que no necesita ningún dispositivo: 50
          minutos a RPE 6 son 300. Súmalo por semanas y verás cómo se construye
          un bloque, o una semana que se pasó de la raya.
        </li>
        <li>
          Ten una plantilla para cada sesión recurrente ("umbral 5 × 4'",
          "tirada larga con los últimos 20' a ritmo de maratón") y cópiala en
          vez de reescribirla. Menos errores, y el atleta aprende el
          vocabulario.
        </li>
        <li>
          Pide una línea de comentario por sesión, no un párrafo. "Piernas
          pesadas, Aquiles izquierdo rígido al levantarme" es justo lo que
          necesitas para detectar un problema a tiempo.
        </li>
      </ul>
      <p>
        Con esto, una hoja de cálculo hace un trabajo digno con un puñado de
        atletas. Sigue sin poner la sesión en el reloj, y sigue dependiendo de
        que alguien teclee números que ya existen en otra parte.
      </p>

      <h2>Lo que cambia un software</h2>
      <p>
        Lo que aporta una plataforma de entrenamiento no son los gráficos. Es
        que los datos se mueven sin que nadie los copie. Escribes la sesión una
        vez, con objetivos sacados de las zonas del atleta; llega a su reloj; la
        actividad vuelve sola después de la salida y se coloca junto a lo
        planificado, paso a paso. Cuando una carrera cambia de fecha, arrastras
        el bloque y el reloj lo sigue. La carga se calcula con cada sesión, se
        haya acordado alguien de rellenar una columna o no.
      </p>
      <p>
        Tampoco sale gratis. Pasarás una o dos tardes recreando tus sesiones
        habituales como plantillas, algunos atletas necesitarán ayuda para
        conectar el reloj y pierdes algo de la libertad de la celda en blanco.
        Que compense depende sobre todo de cuántos atletas tienes y de cada
        cuánto cambian los planes. Como regla aproximada, la pregunta se vuelve
        real a partir de cinco atletas, o la primera vez que uno de ellos hace
        una sesión clave con una versión desactualizada del plan.
      </p>

      <h2>Probar sin pagar</h2>
      <p>
        OpenAthlete es gratis para entrenadores con hasta cinco atletas, con
        todas las funciones: calendario, editor de entrenamientos, envío a
        relojes Garmin, Suunto y COROS, importación de actividades de esas
        marcas y también de Polar y Strava, y carga de entrenamiento a partir de
        la frecuencia cardíaca con el RPE de sesión al lado. Por encima de cinco
        atletas, Supporter cuesta 50 € al año para un número ilimitado. Puedes
        usarlo junto a tu hoja de cálculo con uno o dos atletas durante un mes
        antes de decidir. La{' '}
        <Link href="/es/coaches">página para entrenadores</Link> muestra cómo es
        el lado del entrenador.
      </p>

      <h2>Fuente</h2>
      <ul>
        <li>
          Foster C, Florhaug JA, Franklin J, et al. A new approach to monitoring
          exercise training. Journal of Strength and Conditioning Research,
          2001;15(1):109–115.
        </li>
      </ul>
    </div>
  );
}
