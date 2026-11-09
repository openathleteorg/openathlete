import Link from 'next/link';

import { Sources } from './sources';

export function ContentEs() {
  return (
    <div>
      <p>
        Llevas dos meses corriendo unos 40 km por semana. Tu maratón es dentro
        de 16 semanas y te gustaría que tus semanas más grandes llegaran a 70
        km. Este artículo va de cómo pasar de una cifra a la otra sin pasar la
        semana 9 con hielo en la tibia. Es práctico a propósito: para lo que la
        investigación dice, y lo que no, sobre carga y lesiones, lee{' '}
        <Link href="/es/blog/preventing-training-injuries">
          lesiones al correr y carga de entrenamiento
        </Link>
        .
      </p>

      <h2>La regla del 10 % es un techo que alguien se inventó</h2>
      <p>
        Nadie sabe muy bien de dónde salió la regla del 10 %, y se ha puesto a
        prueba mucho menos de lo que su fama sugiere. Cuando unos investigadores
        neerlandeses dieron a 532 principiantes un plan estándar de 8 semanas o
        uno más lento de 13 semanas basado en subidas del 10 %, las tasas de
        lesión fueron iguales: más o menos uno de cada cinco corredores en cada
        grupo (Buist et al., 2008). Una cohorte danesa de 874 principiantes solo
        encontró una posible señal por encima del 30 % en dos semanas, y aun así
        en el límite de la significación (Nielsen et al., 2014).
      </p>
      <p>
        Además, la regla falla en los dos sentidos. Con poco volumen es
        absurdamente lenta: 20 km semanales pasan a 22. Con más volumen,
        aplicada cada semana sin pausa, se dispara. Cuarenta kilómetros más un
        10 % cada semana durante diez semanas son 104 km. Nadie debería hacer
        eso, y sin embargo es lo que dice la regla.
      </p>
      <p>
        Lo que sí respaldan los estudios y el consenso del COI sobre la carga
        (Soligard et al., 2016) es la idea general: subir de forma gradual,
        evitar los saltos grandes y bruscos y ajustarse a la persona. Lo demás
        es criterio de entrenador, y lo presentaré como tal.
      </p>

      <h2>Cómo subo el volumen</h2>
      <p>
        <strong>Un escalón y una meseta.</strong> Añade un bloque, por ejemplo
        de 4 a 6 km o 30 minutos, y quédate en ese nivel una o dos semanas antes
        del siguiente escalón. En mi experiencia, un corredor asimila mejor un
        nivel que ya ha repetido que un récord nuevo cada semana. Es
        observación, no datos de ensayo.
      </p>
      <p>
        <strong>Semana de descarga cada tres o cuatro.</strong> Recorta el
        volumen entre un cuarto y un tercio y mantén una sesión corta de
        calidad, por ejemplo 6 × 1&apos; rápido el miércoles, para no llegar
        apagado al siguiente bloque. El porcentaje exacto no tiene un estudio
        sólido detrás. La costumbre de planificarla antes de necesitarla, sí.
      </p>
      <p>
        <strong>Una novedad cada vez.</strong> No sumes 6 km la misma semana de
        tu primera sesión de pista de la temporada, tu primer trail largo con
        desnivel o unas zapatillas nuevas con menos drop. El ensayo Run Clever
        encontró que progresar en intensidad o en volumen daba tasas de lesión
        similares (Ramskov et al., 2018). Progresar en las dos a la vez no era
        la pregunta, y yo no me ofrecería voluntario para averiguarlo.
      </p>
      <p>
        <strong>La tirada larga, por su propio camino.</strong> De diez a quince
        minutos más cada vez que sube y, al principio de la preparación, no más
        de un tercio de la semana. Un corredor de 40 km que hace una tirada
        larga de 25 km mete casi toda su semana en una sola sesión.
      </p>
      <p>
        <strong>Cuenta lo que de verdad te carga.</strong> En asfalto, los
        kilómetros son una aproximación razonable. En montaña, cuenta tiempo y
        desnivel: 1.000 m de bajada en una semana son un estrés que ninguna
        distancia refleja, y tus cuádriceps te lo harán saber con dos días de
        retraso.
      </p>
      <p>
        <strong>Respeta los parones.</strong> Después de unos días sin correr,
        sigue donde estabas. Después de dos o tres semanas parado, vuelvo a
        empezar con la mitad o dos tercios del volumen anterior y reconstruyo en
        tres o cuatro semanas. Tu media reciente ha bajado, aunque tu recuerdo
        de ella no.
      </p>

      <h2>Un ejemplo de 16 semanas</h2>
      <p>
        Así podría verse la progresión de 40 a 70 km. Las duraciones de la
        tirada larga suponen un ritmo suave de unos 6:00 por km.
      </p>
      <table>
        <thead>
          <tr>
            <th>Semana</th>
            <th>Volumen</th>
            <th>Tirada larga</th>
            <th>Nota</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td>40 km</td>
            <td>1h20</td>
            <td>Nivel actual</td>
          </tr>
          <tr>
            <td>2</td>
            <td>44 km</td>
            <td>1h30</td>
            <td>Primer escalón</td>
          </tr>
          <tr>
            <td>3</td>
            <td>44 km</td>
            <td>1h30</td>
            <td>Meseta</td>
          </tr>
          <tr>
            <td>4</td>
            <td>34 km</td>
            <td>1h15</td>
            <td>Descarga</td>
          </tr>
          <tr>
            <td>5</td>
            <td>48 km</td>
            <td>1h40</td>
            <td></td>
          </tr>
          <tr>
            <td>6</td>
            <td>52 km</td>
            <td>1h45</td>
            <td></td>
          </tr>
          <tr>
            <td>7</td>
            <td>52 km</td>
            <td>1h50</td>
            <td>Meseta</td>
          </tr>
          <tr>
            <td>8</td>
            <td>40 km</td>
            <td>1h30</td>
            <td>Descarga</td>
          </tr>
          <tr>
            <td>9</td>
            <td>56 km</td>
            <td>2h00</td>
            <td></td>
          </tr>
          <tr>
            <td>10</td>
            <td>60 km</td>
            <td>2h05</td>
            <td></td>
          </tr>
          <tr>
            <td>11</td>
            <td>60 km</td>
            <td>2h15</td>
            <td>Meseta</td>
          </tr>
          <tr>
            <td>12</td>
            <td>46 km</td>
            <td>1h40</td>
            <td>Descarga</td>
          </tr>
          <tr>
            <td>13</td>
            <td>65 km</td>
            <td>2h20</td>
            <td></td>
          </tr>
          <tr>
            <td>14</td>
            <td>70 km</td>
            <td>2h30</td>
            <td>Pico</td>
          </tr>
          <tr>
            <td>15</td>
            <td>52 km</td>
            <td>1h45</td>
            <td>Puesta a punto</td>
          </tr>
          <tr>
            <td>16</td>
            <td>30 km + carrera</td>
            <td>Carrera</td>
            <td>Semana de carrera</td>
          </tr>
        </tbody>
      </table>
      <p>
        Mira la semana 5. Frente a la semana de descarga anterior es un salto
        del 41 %, suficiente para disparar todas las alarmas de una app basada
        en ratios. Frente a las semanas 2 y 3, el nivel al que el corredor
        entrenaba de verdad, es un 9 %. Compara una semana nueva con el
        entrenamiento previo a la descarga, no con la descarga misma.
      </p>
      <p>
        Fíjate también en lo que el plan no hace: nunca suma volumen y un tipo
        de sesión nuevo la misma semana, y el pico llega dos semanas antes de la
        carrera, no una. Si tu objetivo es un trail con desnivel, cambia
        kilómetros por horas y añade una columna para el desnivel positivo.
      </p>

      <h2>Con qué comparar una semana</h2>
      <p>
        Si quieres una sola cifra, compara esta semana con la media de las tres
        o cuatro anteriores, sin contar esta semana en esa media. Úsala como
        aviso para mirar con más atención, no como veredicto. El popular ratio
        de carga aguda:crónica y su "zona óptima" entre 0,8 y 1,3 han recibido
        críticas duras, entre otras cosas por ese mismo doble conteo
        (Impellizzeri et al., 2020). No existe un umbral validado, ni para ti ni
        para nadie.
      </p>

      <h2>Cuándo mantener o retroceder</h2>
      <p>
        Deja de progresar, y normalmente de correr unos días, si un dolor cambia
        tu forma de correr, aumenta durante la salida o es peor a la mañana
        siguiente. Un dolor en un punto preciso de un hueso, como la tibia o el
        empeine, merece la opinión de un profesional antes de la próxima salida,
        no después de las tres siguientes.
      </p>
      <p>
        Mantén el nivel, o adelanta la semana de descarga, si los rodajes suaves
        se te hacen más duros de lo normal varios días seguidos, si el mismo
        ritmo suave te cuesta más pulsaciones o si estás durmiendo mal. Son las
        primeras señales que repasamos en{' '}
        <Link href="/es/blog/5-signs-of-overtraining-and-how-to-avoid-it">
          sobreentrenamiento y sobrecarga funcional
        </Link>
        . Retrasar un escalón una semana no te cuesta casi nada. Una fractura
        por estrés te cuesta la carrera.
      </p>

      <h2>Planificarlo en OpenAthlete</h2>
      <p>
        La vista de temporada de OpenAthlete te permite dibujar una progresión
        como esta en bloques (base, específico, puesta a punto, recuperación)
        con tu carrera encima, y cada semana muestra su carga frente a un rango
        construido con tus semanas recientes. Ese rango es una referencia para
        encuadrar la semana, no un límite de seguridad. La forma física, la
        fatiga y la frescura se proyectan sobre las sesiones planificadas, así
        que ves el efecto de una semana de descarga sobre tu frescura antes de
        correrla. El dolor que menciones en las preguntas opcionales después de
        cada actividad pasa a un registro de lesiones que ve tu entrenador. Más
        detalles en las páginas de{' '}
        <Link href="/es/features/training-calendar">
          calendario de entrenamiento
        </Link>{' '}
        y <Link href="/es/features/training-load">carga de entrenamiento</Link>.
      </p>

      <h2>Fuentes</h2>
      <Sources />
    </div>
  );
}
