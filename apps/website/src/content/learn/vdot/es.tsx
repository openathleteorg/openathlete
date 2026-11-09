import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentEs() {
  return (
    <div>
      <p>
        El VDOT es el número central del sistema de entrenamiento de Jack
        Daniels. El nombre viene de “V-dot-O2max”, la forma en que los
        fisiólogos escriben el VO2max, pero no se mide en un laboratorio.
        Daniels y el matemático Jimmy Gilbert lo dedujeron de resultados de
        carreras en los años setenta: si corriste una distancia a cierta
        velocidad, ¿qué VO2max lo explicaría con una economía de carrera media?
        La respuesta es un único índice que sitúa tu nivel actual, predice tus
        marcas en otras distancias y te da tus ritmos de entrenamiento.
      </p>
      <p>
        Como sale de un rendimiento real, el VDOT ya incluye lo que un VO2max de
        laboratorio deja fuera: lo económica que es tu zancada y qué parte de tu
        máximo puedes sostener durante toda una carrera. Esos tres factores
        juntos explican la mayor parte del rendimiento de resistencia (Joyner y
        Coyle, 2008). Por eso dos corredores con el mismo{' '}
        <Link href="/es/learn/vo2max">VO2max</Link> pueden tener VDOT separados
        por varios puntos, y por eso el VDOT predice mejor las marcas que el
        VO2max.
      </p>

      <h2>Cómo se calcula el VDOT</h2>
      <p>
        Las fórmulas de Daniels y Gilbert tienen dos partes. La primera da el
        coste de oxígeno de correr a una velocidad v, en metros por minuto. La
        segunda da la parte del VO2max que un corredor puede mantener en una
        carrera de t minutos: casi el 100% durante unos 10 minutos, alrededor
        del 90% en 45 minutos y menos del 85% en un maratón.
      </p>
      <Formula
        where={[
          'Coste de oxígeno (ml/kg/min) = −4,6 + 0,182258 × v + 0,000104 × v²',
          'Fracción sostenible = 0,8 + 0,1894393 × e^(−0,012778 × t) + 0,2989558 × e^(−0,1932605 × t)',
          'v = distancia (m) / tiempo (min); t = duración de la carrera en minutos',
        ]}
      >
        VDOT = coste de oxígeno / fracción sostenible
      </Formula>
      <p>
        Las fórmulas sirven desde los 1.500 m hasta el maratón. Por debajo, la
        capacidad anaeróbica pesa demasiado; por encima, la alimentación y el
        calor deciden más que la forma aeróbica.
      </p>

      <h2>Un ejemplo con números</h2>
      <p>Una corredora termina un 10K llano en 45:00.</p>
      <ul>
        <li>Velocidad: 10.000 m / 45 min = 222,2 m/min</li>
        <li>
          Coste de oxígeno: −4,6 + 0,182258 × 222,2 + 0,000104 × 222,2² = 41,0
          ml/kg/min
        </li>
        <li>
          Fracción sostenible en 45 minutos: 0,8 + 0,1894 × e^(−0,575) + 0,2990
          × e^(−8,70) = 0,907
        </li>
        <li>VDOT = 41,0 / 0,907 = 45,3</li>
      </ul>
      <p>
        Al revés, el mismo VDOT predice unos 21:42 en 5K, 1:39:44 en media
        maratón y 3:27:15 en maratón.
      </p>
      <p>
        Los ritmos de entrenamiento salen de porcentajes fijos del VDOT,
        convertidos de nuevo en velocidad con la fórmula del coste de oxígeno.
        Para un VDOT de 45,3:
      </p>
      <ul>
        <li>Suave (59 a 74%): de 6:21 a 5:18 por km</li>
        <li>Maratón (la velocidad de maratón prevista): 4:55 por km</li>
        <li>Umbral (88%): 4:37 por km</li>
        <li>Intervalos (97,5%): 4:15 por km</li>
        <li>Repeticiones (105%): 4:00 por km, o 96 segundos por 400 m</li>
      </ul>

      <h2>Cómo usarlo en el entrenamiento</h2>
      <p>
        Cada ritmo tiene su función. El ritmo de umbral es para tempos de 20
        minutos o series largas como 5 × 1 km con un minuto de trote. El de
        intervalos es para series de tres a cinco minutos, por ejemplo 5 × 1.000
        m con recuperación igual al esfuerzo, algo cercano al trabajo a{' '}
        <Link href="/es/learn/vma">VAM</Link>. El de repeticiones es para series
        cortas y rápidas de 200 o 400 m con recuperación completa, pensadas para
        la economía. El ritmo suave cubre casi toda la semana.
      </p>
      <p>
        Dos costumbres mantienen el sistema honesto. Fija tu VDOT con una
        carrera reciente, no con la que esperas correr: entrenar a ritmo
        objetivo antes de tener el nivel es la manera clásica de acabar fundido.
        Y súbelo poco a poco, un punto tras una buena carrera o un bloque de
        sesiones bien controladas, en lugar de perseguir cada buen día.
      </p>
      <p>
        En OpenAthlete, la página de récords calcula tu VDOT a partir de tu
        mejor esfuerzo entre 1.500 m y el maratón y muestra los ritmos de
        entrenamiento correspondientes. En esta web, las{' '}
        <Link href="/es/pace-charts">tablas de ritmos</Link> usan las mismas
        fórmulas, y el{' '}
        <Link href="/es/tools/race-predictor">predictor de tiempos</Link> da una
        segunda opinión con la fórmula de Riegel.
      </p>

      <h2>Límites</h2>
      <p>
        El VDOT supone que tu resistencia está a la altura de tu velocidad. Un
        corredor rápido en 10K pero con poco kilometraje suele quedarse lejos
        del maratón previsto, a menudo por varios minutos, porque las tablas dan
        por hecho un entrenamiento adecuado a la distancia. Las cuestas, el
        calor, el viento y una carrera mal dosificada bajan el índice, así que
        un VDOT de un mal día te infravalora. La fracción sostenible es una
        curva media: hay corredores que sostienen una parte mayor de su máximo
        que otros, y el trail o el ultra quedan fuera de lo que las fórmulas
        pretenden cubrir. Toma el VDOT como un punto de partida bien calibrado y
        ajusta los ritmos por sensaciones y pulso.
      </p>
    </div>
  );
}
