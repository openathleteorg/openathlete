import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentEs() {
  return (
    <div>
      <p>
        El kilómetro-esfuerzo es la forma en que los corredores de trail
        convierten el desnivel en distancia: cada 100 m de desnivel positivo
        cuentan como un kilómetro más. Una carrera de 25 km con 1.000 m de
        desnivel positivo son 35 km-esfuerzo, y así puedes compararla con una
        tirada de 35 km en asfalto, o con otro trail del mismo total, con más
        honestidad que mirando solo la distancia.
      </p>
      <p>
        Es una convención, no una ley fisiológica. Nació en el trail francés (
        <em>kilomètre-effort</em>), donde entrenadores y organizadores
        necesitaban una forma rápida de decir lo duro que era un recorrido, y la
        ITRA usa la misma suma, distancia más desnivel positivo entre 100, para
        clasificar carreras. Su gracia es que se calcula de cabeza en la línea
        de salida.
      </p>

      <h2>Cómo se calcula el km-esfuerzo</h2>
      <Formula
        where={[
          'km = distancia del recorrido o de la salida',
          'D+ = desnivel positivo total en metros',
        ]}
      >
        km-esfuerzo = km + D+ / 100
      </Formula>
      <p>
        Las bajadas no cuentan: no suman ni restan. Algunos entrenadores
        ponderan la subida de otra forma en recorridos muy empinados o muy
        corribles, y otros añaden parte del desnivel negativo, pero 100 m por
        kilómetro es la versión habitual y la que se usa aquí.
      </p>
      <p>
        Con el km-esfuerzo, una carrera pasada se convierte en una predicción.
        El{' '}
        <Link href="/es/tools/trail-time-estimator">
          estimador de tiempo en trail
        </Link>{' '}
        aplica la fórmula de resistencia de Peter Riegel al km-esfuerzo en lugar
        de a la distancia:
      </p>
      <Formula
        where={[
          'T_ref, E_ref = tiempo y km-esfuerzo de una carrera que ya corriste',
          'E = km-esfuerzo de la carrera objetivo',
          'k = 1,06 (valor de Riegel en asfalto) para el extremo bajo, 1,10 para el alto',
        ]}
      >
        T = T_ref × (E / E_ref)^k
      </Formula>

      <h2>Ejemplo resuelto</h2>
      <ul>
        <li>
          Referencia: un trail de 25 km con 1.000 m de desnivel positivo, es
          decir, 25 + 1.000 / 100 = 35 km-esfuerzo, terminado en 3:00:00. Eso
          son 10.800 s / 35 = 5:09 por km-esfuerzo.
        </li>
        <li>
          Objetivo: 42 km con 2.000 m de desnivel positivo, o sea 42 + 20 = 62
          km-esfuerzo.
        </li>
        <li>Extremo bajo: 3:00:00 × (62 / 35)^1,06 = 5 h 30.</li>
        <li>Extremo alto: 3:00:00 × (62 / 35)^1,10 = 5 h 38.</li>
        <li>
          Es decir, de 5 h 30 a 5 h 38, unos 5:20 por km-esfuerzo y una media de
          7,5 km/h sobre los 42 km reales.
        </li>
      </ul>
      <p>
        El exponente 1,06 viene del trabajo de Riegel con récords en asfalto y
        pista. El límite superior de 1,10 es una suposición nuestra para la
        ralentización extra de las jornadas largas en montaña, no un valor
        publicado; por eso obtienes una horquilla y no un tiempo al minuto.
      </p>

      <h2>Cómo usarlo en el entrenamiento</h2>
      <p>
        Cuenta tus semanas en km-esfuerzo además de en kilómetros. Doce
        kilómetros con 600 m de desnivel positivo son 18 km-esfuerzo; una semana
        de 55 km con 2.000 m de desnivel son 75 km-esfuerzo, tanto como 75 km en
        llano. Un plan que solo cuenta kilómetros te sobrecarga sin avisar.
      </p>
      <p>
        Elige tus tiradas largas por km-esfuerzo. Si la carrera objetivo tiene
        62 km-esfuerzo, una tirada larga de 30 a 35 km-esfuerzo con una
        proporción de subida realista te enseña mucho más que 30 km llanos.
        Mantén el desnivel por kilómetro cerca del de la carrera: unos 30 m/km
        en un recorrido ondulado, 60 m/km o más en uno alpino.
      </p>
      <p>
        El ritmo por km-esfuerzo da una idea aproximada de tu forma de un
        recorrido a otro. Si baja a lo largo de un bloque en terrenos parecidos,
        es mejor señal que una vuelta rápida aislada. Los{' '}
        <Link href="/es/training-plans/trail">
          planes de entrenamiento de trail
        </Link>{' '}
        se construyen sobre este tipo de progresión, y para las subidas en sí,
        el{' '}
        <Link href="/es/learn/grade-adjusted-pace">
          ritmo ajustado por pendiente
        </Link>{' '}
        dice cuánta energía costó cada una.
      </p>

      <h2>Límites</h2>
      <p>
        Una sola regla para todas las pendientes es una simplificación. En una
        subida suave y corrible, 100 m de desnivel cuestan menos que un
        kilómetro; en un muro al 25 % que subes andando con bastones, pueden
        costar más. El terreno pesa todavía más: piedras, raíces, barro, nieve y
        pedreras te frenan mucho más de lo que dice el desnivel, y dos carreras
        con el mismo km-esfuerzo pueden terminar muy lejos una de otra.
      </p>
      <p>
        Ignorar las bajadas es el mayor punto ciego. En un recorrido con bajadas
        largas y empinadas, en la segunda mitad mandan tus cuádriceps, no tus
        pulmones, y el km-esfuerzo no lo ve venir. La noche, la altitud por
        encima de unos 2.000 m, el calor y el tiempo en los avituallamientos
        también quedan fuera de la fórmula. Una referencia de asfalto supone
        senderos corribles y traslada tu velocidad de asfalto a las subidas: en
        terreno técnico, cuenta con terminar por encima de la horquilla.
      </p>
      <p>
        Por último, el km-esfuerzo no dice nada de tu índice ITRA o UTMB, que
        usan sus propios modelos. Tómalo como una moneda común para planificar,
        no como una nota.
      </p>
    </div>
  );
}
