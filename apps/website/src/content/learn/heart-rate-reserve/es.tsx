import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentEs() {
  return (
    <div>
      <p>
        La frecuencia cardíaca de reserva es el margen con el que tu corazón
        trabaja de verdad: tu frecuencia máxima menos tu frecuencia en reposo.
        Si estás a 50 en reposo y llegas a 190, tienes 140 pulsaciones de
        reserva. Calcular las zonas sobre ese margen, en lugar de sobre un
        simple porcentaje del máximo, es lo que se conoce como método de
        Karvonen, por el fisiólogo finlandés Martti Karvonen, que lo usó en 1957
        en un estudio sobre cómo el entrenamiento bajaba la frecuencia cardíaca.
      </p>
      <p>
        Su ventaja es que tiene en cuenta desde dónde partes. Dos corredores con
        el mismo máximo pero distinto pulso en reposo no tienen el mismo rodaje
        suave en pulsaciones, y la reserva lo refleja. Además encaja mejor con
        la fisiología: Swain y Leutholtz (1997) mostraron que un porcentaje de
        la frecuencia cardíaca de reserva equivale al mismo porcentaje de la
        reserva de consumo de oxígeno, mientras que un porcentaje del pulso
        máximo no equivale al mismo porcentaje del VO2max.
      </p>

      <h2>Cómo se calcula</h2>
      <Formula
        where={[
          'FCR = FCmáx − FCreposo, en pulsaciones por minuto',
          'intensidad = la fracción de la reserva que buscas, 0,6 para el 60 %',
        ]}
      >
        FC objetivo = FCreposo + (FCmáx − FCreposo) × intensidad
      </Formula>
      <p>
        Las cinco zonas habituales son tramos del 10 % de la reserva: 50–60 %,
        60–70 %, 70–80 %, 80–90 % y 90–100 %. Son convenciones, no umbrales
        medidos en ti, y eso importa más adelante.
      </p>

      <h2>Un ejemplo con números</h2>
      <p>Pulso en reposo 50 ppm, máximo 190 ppm: 140 pulsaciones de reserva.</p>
      <ul>
        <li>Zona 1 (50–60 %): 50 + 0,5 × 140 = de 120 a 134 ppm</li>
        <li>Zona 2 (60–70 %): de 134 a 50 + 0,7 × 140 = 148 ppm</li>
        <li>Zona 3 (70–80 %): de 148 a 162 ppm</li>
        <li>Zona 4 (80–90 %): de 162 a 176 ppm</li>
        <li>Zona 5 (90–100 %): de 176 a 190 ppm</li>
      </ul>
      <p>
        Con porcentajes del máximo, la misma zona 2 iría de 114 a 133 ppm, unas
        15 pulsaciones menos. Para alguien en forma, 114 ppm es casi andar, y
        por eso muchos que se pasan a Karvonen notan que sus rodajes dejan de
        parecer paseos.
      </p>
      <p>
        Ahora deja el máximo en 190 y sube el pulso en reposo a 65. La reserva
        baja a 125 pulsaciones y la zona 2 pasa a 65 + 0,6 × 125 = 140 hasta 65
        + 0,7 × 125 = 152,5, es decir, de 140 a 153 ppm aproximadamente. Mismo
        máximo, otra zona, porque cambió el punto de partida.
      </p>

      <h2>Medir bien los dos valores</h2>
      <p>
        El pulso en reposo se toma tumbado al despertar, antes del café, durante
        varias mañanas; quédate con un valor típico, no con el más bajo que
        hayas visto nunca. Los relojes suelen dar el mínimo durante el sueño,
        unas pulsaciones más bajo, lo que infla un poco la reserva.
      </p>
      <p>
        El máximo es más difícil. El valor más alto que hayas visto al final de
        una carrera dura, o tras la última de una serie de cuestas a tope, vale
        más que cualquier fórmula. Si no tienes nada, Tanaka, Monahan y Seals
        (2001) proponen 208 − 0,7 × edad, o sea 180 ppm a los 40 años. Es una
        media de población: mucha gente se desvía 10 pulsaciones o más, y un
        máximo 10 pulsaciones demasiado alto sube cada zona entre 6 y 9.
      </p>

      <h2>Cómo usarla en el entrenamiento</h2>
      <p>
        Las zonas de pulso funcionan mejor en esfuerzos largos y estables,
        cuando el corazón tiene tiempo de asentarse. Los rodajes y la tirada
        larga en <Link href="/es/learn/zone-2">zona 2</Link> son el caso más
        claro: de 134 a 148 ppm para el corredor del ejemplo, sea cual sea el
        ritmo en un día de viento o de cuestas. Un tempo de 30 a 40 minutos en
        zona 3, o 2 × 15 minutos en la parte alta de la zona 4 (sobre 169 a 173
        ppm, el 85–88 % de la reserva), también se controlan bien con el pulso.
      </p>
      <p>
        En series cortas, como 5 × 4 minutos al umbral, el pulso va por detrás
        del esfuerzo: tarda uno o dos minutos en subir, y la primera serie
        parece fácil en el reloj cuando no lo es. Controla esas sesiones por
        ritmo o potencia y usa el pulso después para comprobar que la sesión
        cumplió su objetivo. La misma fracción de reserva alimenta también
        cargas como el <Link href="/es/learn/trimp">TRIMP</Link>, así que afinar
        el reposo y el máximo te sirve dos veces.
      </p>
      <p>
        La{' '}
        <Link href="/es/tools/heart-rate-zones">
          calculadora de zonas de frecuencia cardíaca
        </Link>{' '}
        hace las cuentas con los dos métodos. En OpenAthlete, las zonas de pulso
        pueden definirse como porcentaje del máximo o de la reserva, la reserva
        se calcula a partir de tus métricas de pulso en reposo y máximo, y los
        pasos de un entrenamiento pueden tener como objetivo un porcentaje de la
        frecuencia cardíaca de reserva.
      </p>

      <h2>Límites</h2>
      <p>
        Todo depende de dos valores y ninguno es fijo. El pulso en reposo se
        mueve varias pulsaciones con el sueño, el estrés, el calor o un
        resfriado que viene; el pulso durante el esfuerzo sube con el calor, la
        deshidratación, la cafeína y la altitud, y deriva hacia arriba en los
        esfuerzos largos. Algunos fármacos, sobre todo los betabloqueantes,
        cambian los dos extremos.
      </p>
      <p>
        El límite principal es que el 60, el 70 o el 80 % de la reserva son
        iguales para todo el mundo y la fisiología no. El{' '}
        <Link href="/es/learn/lactate-threshold">umbral de lactato</Link> de un
        corredor cae en el 82 % de su reserva y el de otro en el 90 %. Si
        conoces tu pulso en el umbral, por una prueba de laboratorio o un
        esfuerzo de 30 minutos en competición, anclar las zonas en él es más
        preciso. Karvonen es un buen punto de partida cuando no lo conoces.
      </p>
    </div>
  );
}
