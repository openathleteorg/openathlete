import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentEs() {
  return (
    <div>
      <p>
        Pon tus mejores marcas de entre unos pocos minutos y unos veinte en un
        gráfico de distancia frente a tiempo y los puntos caen casi en línea
        recta. Su pendiente es tu velocidad crítica: los metros que sumas por
        cada segundo más de esfuerzo. La recta no sale de cero. Corta el eje de
        distancias un poco por encima, en un valor llamado D′ (D prima): una
        cantidad fija de distancia que puedes recorrer más rápido que la
        velocidad crítica antes de tener que frenar.
      </p>
      <p>
        La idea viene de Monod y Scherrer (1965), que la describieron para el
        trabajo de un grupo muscular con el nombre de potencia crítica. En
        carrera se aplica igual, con la velocidad en lugar de la potencia y la
        distancia en lugar del trabajo. En términos fisiológicos, la velocidad
        crítica es la frontera entre los esfuerzos en los que el consumo de
        oxígeno y el lactato se estabilizan y aquellos en los que siguen
        subiendo hasta que paras (Poole et al., 2016). Queda cerca del máximo
        estado estable de lactato, algo por encima, que es lo que el{' '}
        <Link href="/es/learn/lactate-threshold">umbral de lactato</Link>{' '}
        intenta estimar.
      </p>

      <h2>Cómo se calcula la velocidad crítica</h2>
      <Formula
        where={[
          'd = distancia de una mejor marca (m), t = su duración (s)',
          'VC = velocidad crítica (m/s), D′ = distancia por encima de VC (m)',
          'Por encima de VC: tiempo hasta el agotamiento t = D′ / (v − VC)',
        ]}
      >
        d = D′ + VC × t
      </Formula>
      <p>
        Con dos esfuerzos máximos, la recta se resuelve a mano. Con tres o más,
        se ajusta por mínimos cuadrados, y la dispersión de los puntos te dice
        cuánto fiarte de la pendiente. Los esfuerzos deben durar entre 2 y 20
        minutos más o menos: los más cortos dependen de cualidades de velocidad
        pura que el modelo no describe, y en los más largos entran en juego la
        fatiga y la alimentación.
      </p>

      <h2>Ejemplo resuelto</h2>
      <p>
        Un corredor tiene cuatro marcas recientes: 1.000 m en 3:10 (190 s),
        2.000 m en 6:55 (415 s), 3.000 m en 10:30 (630 s) y 5.000 m en 18:00
        (1.080 s).
      </p>
      <ul>
        <li>
          El ajuste distancia-tiempo da una pendiente de 4,50 m/s: la velocidad
          crítica es 16,2 km/h, o 3:42 por kilómetro.
        </li>
        <li>La ordenada en el origen da D′ ≈ 145 m.</li>
        <li>
          Con cuatro puntos, el intervalo del 95 % sobre la pendiente es de
          ±0,11 m/s: la velocidad crítica está entre 3:37 y 3:48 por kilómetro.
        </li>
        <li>
          A 3:20 por kilómetro (5,0 m/s), D′ se acaba tras 145 / (5,0 − 4,50) ≈
          290 s, unos 1.450 m. El modelo predice un 1.500 en unos 5:01.
        </li>
      </ul>
      <p>
        El ritmo de 5K (3:36 por kilómetro) es más rápido que la velocidad
        crítica. Es lo esperable: cualquier carrera lo bastante corta para
        terminarla antes de vaciar D′ se corre por encima.
      </p>

      <h2>Cómo usarla en el entrenamiento</h2>
      <p>
        La velocidad crítica divide tus ritmos en dos mundos. Por debajo, la
        fatiga llega despacio y el límite lo ponen sobre todo el tiempo y la
        energía. Por encima, cada metro por encima de la recta sale de D′, y
        cuando D′ se agota, frenas, diga lo que diga tu motivación.
      </p>
      <ul>
        <li>
          Series por encima de VC: 5 × 1.000 m a 3:30 por kilómetro (4,76 m/s)
          para el corredor del ejemplo. Cada serie recorre 1.000 − 4,50 × 210 ≈
          55 m por encima de la velocidad crítica, cerca del 38 % de D′. Las
          recuperaciones devuelven una parte, no todo, y por eso las últimas
          series cuestan más (Jones y Vanhatalo, 2017).
        </li>
        <li>
          Trabajo justo por debajo de VC: 3 × 10' entre 3:48 y 3:52 por
          kilómetro. Es duro, pero el estado estable se mantiene.
        </li>
        <li>
          Estrategia de carrera: si sales en un 5K más rápido que tu VC, gastas
          D′ demasiado pronto. Repártelo a lo largo de la distancia y acabarás
          antes.
        </li>
      </ul>
      <p>
        Smyth y Muniz-Pumares (2020) mostraron que la velocidad crítica se puede
        estimar a partir de los datos de entrenamiento en bruto de maratonianos
        populares, sin pruebas específicas, y que está relacionada con su marca
        en maratón. Las estadísticas de OpenAthlete hacen lo mismo en su vista
        Capacidades: ajustan la recta a tus mejores esfuerzos de entre 2 y 20
        minutos (al menos tres), muestran el intervalo del 95 % y calculan igual
        la potencia crítica en bici. La{' '}
        <Link href="/es/features">página de funcionalidades</Link> resume qué
        más se calcula a partir de tu historial.
      </p>

      <h2>Límites</h2>
      <p>
        Las mejores marcas de entrenamiento no son pruebas máximas. Si tu mejor
        3.000 salió de un rodaje de umbral, la velocidad ajustada será más baja
        que la real: el resultado vale como mucho lo que muestran tus esfuerzos.
        Esfuerzos de duraciones muy parecidas dan un intervalo amplio, y una
        marca de GPS hecha cuesta abajo o con viento a favor empuja la recta
        hacia arriba. Además, el modelo no dice nada de las pruebas largas. La
        velocidad crítica no se aguanta durante horas, y un maratón se corre
        bastante por debajo, en una fracción que depende más de la resistencia y
        la alimentación que de la recta. Para esas distancias, combínala con
        herramientas basadas en tus carreras, como el{' '}
        <Link href="/es/tools/race-predictor">predictor de tiempos</Link> o las{' '}
        <Link href="/es/pace-charts">tablas de ritmos</Link>, y deja la{' '}
        <Link href="/es/learn/vma">VAM</Link> para el extremo corto de la curva.
      </p>
    </div>
  );
}
