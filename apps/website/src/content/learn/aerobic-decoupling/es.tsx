import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentEs() {
  return (
    <div>
      <p>
        Corre 90 minutos a un ritmo suave y constante y tu pulso rara vez se
        quedará plano. Va subiendo: unas pulsaciones en la segunda hora, más si
        hace calor, y más todavía si las tiradas largas son nuevas para ti. El
        desacoplamiento aeróbico pone número a esa subida. Compara el ritmo (o
        la potencia) que obtienes por latido en la primera mitad de un esfuerzo
        continuo con el de la segunda mitad. Joe Friel lo popularizó entre los
        deportistas de resistencia, y TrainingPeaks lo llama Pa:HR para el ritmo
        y Pw:HR para la potencia.
      </p>

      <h2>Cómo se calcula el desacoplamiento</h2>
      <p>
        Se divide la parte constante del esfuerzo en dos mitades de igual
        duración. En cada una se calcula el factor de eficiencia (EF):
        producción media dividida por el pulso medio. Después se expresa la
        pérdida de una mitad a otra en porcentaje:
      </p>
      <Formula
        where={[
          'EF = producción media / pulso medio, en cada mitad',
          'Producción = velocidad ajustada a la pendiente al correr, potencia en bici',
        ]}
      >
        Desacoplamiento (%) = (EF1 − EF2) / EF1 × 100
      </Formula>
      <p>
        Un valor positivo significa que produjiste menos por latido en la
        segunda mitad: el pulso subió al mismo ritmo, o el ritmo bajó con el
        mismo pulso. Si el recorrido no es llano, la velocidad debe ajustarse a
        la pendiente; si no, una subida al final parece fatiga. La lectura
        habitual, según Friel: por debajo del 5 % es estable, entre el 5 y el 10
        % hay cierta deriva, y por encima del 10 % el esfuerzo superó tu
        resistencia aeróbica.
      </p>

      <h2>Un ejemplo con cifras</h2>
      <p>
        Un corredor hace 90 minutos en un circuito llano a 5:20 por kilómetro,
        es decir, 187,5 metros por minuto.
      </p>
      <ul>
        <li>
          Primeros 45 minutos: 142 ppm de media, así que EF1 = 187,5 / 142 =
          1,320
        </li>
        <li>
          Últimos 45 minutos: mismo ritmo, 150 ppm de media, así que EF2 = 187,5
          / 150 = 1,250
        </li>
        <li>Desacoplamiento = (1,320 − 1,250) / 1,320 × 100 = 5,3 %</li>
      </ul>
      <p>
        Algo más del 5 %: cierta deriva. Si la segunda mitad hubiera salido a
        146 ppm, el dato sería del 2,7 %, claramente estable. En bici la cuenta
        es la misma con vatios: 200 W a 135 ppm y luego 195 W a 140 ppm dan EF
        de 1,48 y 1,39, y un desacoplamiento del 6,0 %. La potencia bajó y el
        pulso subió; las dos cosas cuentan en contra.
      </p>

      <h2>Cómo usarlo en el entrenamiento</h2>
      <p>
        El desacoplamiento es útil sobre todo como prueba repetible de
        resistencia aeróbica durante la fase de base. Elige una sesión continua
        que vayas a repetir: un rodaje suave de 75 a 120 minutos en el mismo
        circuito llano, o una salida en bici en la parte baja de tu zona de
        resistencia. Mantén cada vez{' '}
        <Link href="/es/tools/heart-rate-zones">
          la misma zona de pulso o de potencia
        </Link>{' '}
        y sigue el dato semana a semana.
      </p>
      <ul>
        <li>
          Si un rodaje de 90 minutos pasa del 5 %, la duración o el ritmo
          superan tu resistencia actual. Mantén el ritmo, o baja un poco, y
          alarga poco a poco.
        </li>
        <li>
          Cuando se quede por debajo del 5 %, alarga la salida o termina con un
          bloque a ritmo de maratón y mira si aguanta.
        </li>
        <li>
          Antes de un maratón o un trail largo, una tirada larga con tramos a
          ritmo de maratón que se mantiene por debajo del 5 % es buena señal.
          Una deriva grande es motivo para revisar el ritmo objetivo, o la
          alimentación en carrera.
        </li>
      </ul>
      <p>
        OpenAthlete calcula el desacoplamiento y el factor de eficiencia en cada
        actividad de carrera con velocidad ajustada a la pendiente y pulso, y en
        las salidas en bici con potencia. En la página de la actividad puedes
        dejar fuera el calentamiento con un control deslizante o seleccionar un
        tramo del esfuerzo, y la tarjeta muestra las dos mitades y un estado:
        estable, cierta deriva o deriva marcada. Por debajo de 20 minutos, avisa
        de que el esfuerzo es demasiado corto para juzgar la resistencia.
      </p>

      <h2>Límites</h2>
      <p>
        El desacoplamiento solo tiene sentido en un esfuerzo continuo. Las
        series, las paradas en semáforos o un final rápido rompen la
        comparación. El calor es el mayor factor de confusión: Coyle y
        González-Alonso (2001) describen cómo el aumento de la temperatura
        corporal sube el pulso mientras baja el volumen bombeado en cada latido,
        y la deshidratación se suma. Un 7 % en una tarde a 30 °C y un 3 % en una
        mañana fresca pueden describir la misma forma. Un sensor óptico de
        muñeca que se engancha a la cadencia, una banda con los electrodos secos
        o un GPS que se desvía bajo los árboles distorsionan una de las mitades.
        Por último, el desacoplamiento no dice nada de la velocidad: puedes
        estar perfectamente acoplado a un ritmo demasiado lento para tu
        objetivo. Léelo junto a tu ritmo, tu{' '}
        <Link href="/es/learn/trimp">carga de entrenamiento</Link> y las
        condiciones del día.
      </p>
    </div>
  );
}
